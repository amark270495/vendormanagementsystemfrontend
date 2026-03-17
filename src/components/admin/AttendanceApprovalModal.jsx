import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { apiService } from '../../api/apiService';
import Spinner from '../Spinner';
import CoreModal from '../CoreModal';
import {
    ChevronLeft,
    ChevronRight,
    Clock,
    Activity,
    CheckCircle2,
    ShieldAlert,
    Undo2,
    CalendarDays
} from 'lucide-react';

import {
    getISTShiftDateString,
    calculateTotalWorkTime,
    formatLogTime
} from '../../utils/attendanceHelpers';

// --- Calendar Day ---
const CalendarDay = React.memo(({ day, statusInfo, onDayClick }) => {
    if (day === null) return <div className="h-20 sm:h-24 invisible" />;

    return (
        <button
            type="button"
            className={`h-20 sm:h-24 rounded-2xl border flex flex-col justify-between p-2 transition-all duration-200 group text-left ${statusInfo.color}`}
            onClick={() => statusInfo.isPending && onDayClick(statusInfo.request)}
            disabled={!statusInfo.isPending}
        >
            <div className="flex justify-between items-start w-full">
                <span className={`text-sm font-bold ${statusInfo.isPending ? 'text-amber-900' : 'text-slate-500'}`}>
                    {day}
                </span>
                {statusInfo.isPending && (
                    <span className="flex h-2 w-2 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                    </span>
                )}
            </div>

            {statusInfo.label && (
                <div className="flex justify-center w-full mb-1">
                    <span className={`text-[9px] uppercase font-black px-2 py-0.5 rounded-full tracking-wider shadow-sm border ${statusInfo.badgeColor}`}>
                        {statusInfo.label}
                    </span>
                </div>
            )}
        </button>
    );
});

const AttendanceApprovalModal = ({ isOpen, onClose, selectedUsername, onApprovalComplete }) => {
    const { user } = useAuth();

    const [currentMonthDate, setCurrentMonthDate] = useState(() =>
        new Date(Date.UTC(new Date().getFullYear(), new Date().getMonth(), 1))
    );

    const [attendanceData, setAttendanceData] = useState({});
    const [holidays, setHolidays] = useState({});
    const [leaveDaysSet, setLeaveDaysSet] = useState(new Set());
    const [approvedWeekends, setApprovedWeekends] = useState(new Set());
    const [pendingRequestsMap, setPendingRequestsMap] = useState({});

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [actionLoading, setActionLoading] = useState(false);

    const [reviewingRequest, setReviewingRequest] = useState(null);
    const [trackingLogs, setTrackingLogs] = useState([]);
    const [logsLoading, setLogsLoading] = useState(false);
    const [timeCalculations, setTimeCalculations] = useState({ standard: "0h 0m", extra: null, activeStr: "" });
    const [auditInsights, setAuditInsights] = useState([]);

    // 🔥 Fetch Data
    const fetchData = useCallback(async (monthDate) => {
        if (!user?.userIdentifier || !selectedUsername) return;

        setLoading(true);
        setError('');

        try {
            const year = monthDate.getUTCFullYear();
            const month = (monthDate.getUTCMonth() + 1).toString().padStart(2, '0');
            const monthString = `${year}-${month}`;
            const monthEndDay = new Date(Date.UTC(year, monthDate.getUTCMonth() + 1, 0)).getUTCDate();

            const [attendanceRes, holidaysRes, leaveRes, weekendRes] = await Promise.all([
                apiService.getAttendance({ authenticatedUsername: user.userIdentifier, username: selectedUsername, month: monthString }),
                apiService.getHolidays({ authenticatedUsername: user.userIdentifier, year: year.toString() }),
                apiService.getLeaveRequests({
                    authenticatedUsername: user.userIdentifier,
                    targetUsername: selectedUsername,
                    statusFilter: 'Approved',
                    startDateFilter: `${monthString}-01`,
                    endDateFilter: `${monthString}-${monthEndDay}`
                }),
                apiService.getWeekendWorkRequests().catch(() => null)
            ]);

            // Attendance
            const attMap = {};
            const pendMap = {};
            attendanceRes?.data?.attendanceRecords?.forEach(att => {
                const date = att.date || att.rowKey;
                attMap[date] = att;
                if (att.status === 'Pending') pendMap[date] = att;
            });

            setAttendanceData(attMap);
            setPendingRequestsMap(pendMap);

            // Holidays
            const holMap = {};
            holidaysRes?.data?.holidays?.forEach(h => holMap[h.date] = h.description);
            setHolidays(holMap);

            // Weekend approvals
            const wknd = new Set();
            if (weekendRes?.data?.success) {
                weekendRes.data.requests.forEach(req => {
                    if (req.partitionKey === selectedUsername && req.status === 'Approved') {
                        wknd.add(req.date);
                    }
                });
            }
            setApprovedWeekends(wknd);

            // Leaves
            const leaveSet = new Set();
            leaveRes?.data?.requests?.forEach(req => {
                const start = new Date(req.startDate);
                const end = new Date(req.endDate);
                for (let d = new Date(start); d <= end; d.setUTCDate(d.getUTCDate() + 1)) {
                    leaveSet.add(d.toISOString().split('T')[0]);
                }
            });
            setLeaveDaysSet(leaveSet);

        } catch (err) {
            setError('System synchronization failed.');
        } finally {
            setLoading(false);
        }
    }, [user, selectedUsername]);

    useEffect(() => {
        if (isOpen) fetchData(currentMonthDate);
    }, [isOpen, currentMonthDate]);

    // 🔥 Day Status Logic (FULLY ENHANCED)
    const getDayStatus = useCallback((day) => {
        const year = currentMonthDate.getUTCFullYear();
        const month = currentMonthDate.getUTCMonth();
        const date = new Date(Date.UTC(year, month, day));
        const dateKey = date.toISOString().split('T')[0];
        const dayOfWeek = date.getUTCDay();
        const att = attendanceData[dateKey];
        const todayShift = getISTShiftDateString();

        if (att?.status === 'Pending') {
            return {
                isPending: true,
                label: att.requestedStatus === 'Present' ? 'Present?' : 'Absent?',
                request: att,
                color: "bg-amber-50 border-amber-300 border-dashed border-2 cursor-pointer hover:scale-[1.02] shadow-md",
                badgeColor: "bg-amber-500 text-white border-amber-600"
            };
        }

        if (leaveDaysSet.has(dateKey)) return {
            label: 'Leave',
            color: "bg-violet-50 border-violet-100 text-violet-700",
            badgeColor: "bg-violet-500 text-white"
        };

        if (holidays[dateKey]) return {
            label: 'Holiday',
            color: "bg-orange-50 border-orange-100 text-orange-700",
            badgeColor: "bg-orange-500 text-white"
        };

        if (dayOfWeek === 0 || dayOfWeek === 6) {
            if (approvedWeekends.has(dateKey)) {
                if (att?.status === 'Present') {
                    return {
                        label: 'Weekend Work',
                        color: "bg-indigo-50 border-indigo-100 text-indigo-700",
                        badgeColor: "bg-indigo-500 text-white"
                    };
                }
                if (dateKey < todayShift) {
                    return {
                        label: 'Missed',
                        color: "bg-rose-50 border-rose-100 text-rose-700 italic",
                        badgeColor: "bg-rose-500 text-white"
                    };
                }
                return {
                    label: 'Approved',
                    color: "bg-indigo-50 border-indigo-100 text-indigo-700",
                    badgeColor: "bg-indigo-400 text-white"
                };
            }
            return {
                label: 'WKND',
                color: "bg-slate-50 border-slate-200 text-slate-400",
                badgeColor: "bg-slate-200"
            };
        }

        if (att?.status === 'Present') return {
            label: 'Present',
            color: "bg-emerald-50 border-emerald-100 text-emerald-700",
            badgeColor: "bg-emerald-500 text-white"
        };

        if (att?.status === 'Absent' || att?.status === 'Rejected') return {
            label: 'Absent',
            color: "bg-rose-50 border-rose-100 text-rose-700",
            badgeColor: "bg-rose-500 text-white"
        };

        if (dateKey === todayShift) return {
            label: 'Active',
            color: "bg-indigo-50 border-indigo-100 text-indigo-700",
            badgeColor: "bg-indigo-500 text-white"
        };

        if (dateKey < todayShift) return {
            label: 'N/A',
            color: "bg-slate-100 border-slate-200 text-slate-500 italic",
            badgeColor: "bg-slate-300"
        };

        return { label: '', color: "bg-white border-slate-100" };

    }, [currentMonthDate, attendanceData, holidays, leaveDaysSet, approvedWeekends]);

    const calendarGrid = useMemo(() => {
        const year = currentMonthDate.getUTCFullYear();
        const month = currentMonthDate.getUTCMonth();
        const firstDay = new Date(Date.UTC(year, month, 1)).getUTCDay();
        const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();

        const days = [];
        for (let i = 0; i < firstDay; i++) days.push(null);
        for (let i = 1; i <= daysInMonth; i++) days.push(i);
        return days;
    }, [currentMonthDate]);

    // 🔥 Audit Insights
    const generateAuditInsights = (logs, timeData) => {
        const insights = [];

        if (!logs.length) insights.push({ type: 'critical', msg: 'No logs found' });
        if (timeData.standard === "0h 0m") insights.push({ type: 'critical', msg: 'No work hours' });
        if (timeData.extra) insights.push({ type: 'warning', msg: 'Outside shift work detected' });
        if (timeData.activeStr.includes("Missing")) insights.push({ type: 'warning', msg: 'Missing logout' });

        return insights;
    };

    const handleDayClick = async (request) => {
        setReviewingRequest(request);
        setLogsLoading(true);

        try {
            const res = await apiService.getUserTrackingLogs(request.username || selectedUsername, request.date, user.userIdentifier);
            const logs = res.data?.logs || [];

            setTrackingLogs(logs);

            const timeData = calculateTotalWorkTime(logs, request.date);
            setTimeCalculations(timeData);
            setAuditInsights(generateAuditInsights(logs, timeData));

        } finally {
            setLogsLoading(false);
        }
    };

    const handleConfirmAction = async (action) => {
        setActionLoading(true);
        try {
            await apiService.approveAttendance({
                targetUsername: reviewingRequest.username || selectedUsername,
                attendanceDate: reviewingRequest.date,
                action,
                authenticatedUsername: user.userIdentifier
            });

            await fetchData(currentMonthDate);
            setReviewingRequest(null);
            onApprovalComplete && onApprovalComplete();

        } finally {
            setActionLoading(false);
        }
    };

    const isRisky = auditInsights.some(i => i.type === 'critical');

    return (
        <CoreModal
            isOpen={isOpen}
            onClose={onClose}
            size="2xl"
            title={`Attendance Audit: ${selectedUsername}`}
        >
            {error && <div className="bg-rose-50 p-3 rounded-xl text-rose-700">{error}</div>}

            {reviewingRequest ? (
                <div className="space-y-6">

                    {/* Header */}
                    <div className="flex justify-between items-center bg-slate-900 p-4 rounded-2xl text-white">
                        <div>{reviewingRequest.date}</div>
                        <button onClick={() => setReviewingRequest(null)}>
                            <Undo2 size={16} />
                        </button>
                    </div>

                    {/* Stats */}
                    <div className="bg-blue-600 text-white p-6 rounded-2xl">
                        <h2 className="text-3xl font-black">{timeCalculations.standard}</h2>
                        {timeCalculations.extra && <p>+ Extra {timeCalculations.extra}</p>}
                    </div>

                    {/* Insights */}
                    {auditInsights.map((i, idx) => (
                        <div key={idx} className="bg-amber-50 p-3 rounded-xl text-sm">{i.msg}</div>
                    ))}

                    {/* Logs */}
                    <div className="max-h-40 overflow-auto">
                        {trackingLogs.map((log, i) => (
                            <div key={i} className="flex justify-between text-xs">
                                <span>{log.actionType}</span>
                                <span>{formatLogTime(log.eventTimestamp)}</span>
                            </div>
                        ))}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3">
                        <button onClick={() => handleConfirmAction('Rejected')} className="flex-1 bg-slate-200 p-3 rounded-xl">
                            Reject
                        </button>

                        <button
                            onClick={() => handleConfirmAction('Approved')}
                            className={`flex-1 p-3 rounded-xl text-white ${isRisky ? 'bg-amber-500' : 'bg-blue-600'}`}
                        >
                            {isRisky ? 'Approve (Risky)' : 'Approve'}
                        </button>
                    </div>
                </div>

            ) : (
                <div className="space-y-4">

                    {/* Legend */}
                    <div className="flex gap-2 text-xs font-bold">
                        <span className="bg-emerald-100 px-2">Present</span>
                        <span className="bg-rose-100 px-2">Absent</span>
                        <span className="bg-amber-100 px-2">Pending</span>
                        <span className="bg-indigo-100 px-2">Weekend</span>
                    </div>

                    {/* Calendar */}
                    <div className="grid grid-cols-7 gap-2">
                        {calendarGrid.map((day, i) => (
                            <CalendarDay key={i} day={day} statusInfo={day ? getDayStatus(day) : null} onDayClick={handleDayClick} />
                        ))}
                    </div>

                </div>
            )}
        </CoreModal>
    );
};

export default AttendanceApprovalModal;