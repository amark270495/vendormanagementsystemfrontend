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
    Undo2,
    AlertTriangle,
    CheckCircle2,
    Calendar as CalendarIcon
} from 'lucide-react';

import {
    getISTShiftDateString,
    calculateTotalWorkTime,
    formatLogTime
} from '../../utils/attendanceHelpers';

// --- Log Badge Pill (Logic from Old Version) ---
const LogBadge = ({ actionType, notes }) => {
    const action = actionType.toLowerCase();
    const noteLower = (notes || '').toLowerCase();
    
    let style = "bg-gray-100 text-gray-700 border-gray-200";
    if (noteLower.includes('previous shutdown detected')) style = "bg-rose-100 text-rose-800 border-rose-200";
    else if (action === 'agentcrash') style = "bg-red-100 text-red-800 border-red-300";
    else if (action === 'restartaccepted') style = "bg-blue-100 text-blue-800 border-blue-200";
    else if (action === 'shiftendenforced') style = "bg-violet-100 text-violet-800 border-violet-200";
    else if (['login', 'unlock', 'resume', 'active', 'wake', 'heartbeat'].includes(action)) style = "bg-emerald-100 text-emerald-800 border-emerald-200";
    else if (['logout', 'logoff', 'lock', 'sleep', 'hibernate', 'shutdown'].includes(action)) style = "bg-slate-200 text-slate-700 border-slate-300";
    else if (['idle'].includes(action)) style = "bg-amber-100 text-amber-800 border-amber-200";

    return (
        <span className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded-md border shadow-sm ${style}`}>
            {actionType}
        </span>
    );
};

// --- Calendar Day Cell ---
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

    // --- Fetch Logic (Preserved from Old Code) ---
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

            const attMap = {};
            const pendMap = {};
            attendanceRes?.data?.attendanceRecords?.forEach(att => {
                const date = att.date || att.rowKey;
                attMap[date] = att;
                if (att.status === 'Pending') pendMap[date] = att;
            });
            setAttendanceData(attMap);
            setPendingRequestsMap(pendMap);

            const holMap = {};
            holidaysRes?.data?.holidays?.forEach(h => holMap[h.date] = h.description);
            setHolidays(holMap);

            const wknd = new Set();
            weekendRes?.data?.requests?.forEach(req => {
                if (req.partitionKey === selectedUsername && req.status === 'Approved') wknd.add(req.date);
            });
            setApprovedWeekends(wknd);

            const leaveSet = new Set();
            leaveRes?.data?.requests?.forEach(req => {
                let start = new Date(req.startDate + 'T00:00:00Z');
                let end = new Date(req.endDate + 'T00:00:00Z');
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
    }, [isOpen, currentMonthDate, fetchData]);

    // --- Status Mapping (Preserved from Old Code) ---
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

        if (leaveDaysSet.has(dateKey)) return { label: 'Leave', color: "bg-violet-50 border-violet-100 text-violet-700", badgeColor: "bg-violet-500 text-white" };
        if (holidays[dateKey]) return { label: 'Holiday', color: "bg-orange-50 border-orange-100 text-orange-700", badgeColor: "bg-orange-500 text-white" };

        if (dayOfWeek === 0 || dayOfWeek === 6) {
            if (approvedWeekends.has(dateKey)) {
                return { label: 'Apprvd', color: "bg-indigo-50 border-indigo-100 text-indigo-700", badgeColor: "bg-indigo-500 text-white" };
            }
            return { label: 'WKND', color: "bg-slate-50 border-slate-200 text-slate-400", badgeColor: "bg-slate-200" };
        }

        if (att?.status === 'Present') return { label: 'Present', color: "bg-emerald-50 border-emerald-100 text-emerald-700", badgeColor: "bg-emerald-500 text-white" };
        if (att?.status === 'Absent' || att?.status === 'Rejected') return { label: 'Absent', color: "bg-rose-50 border-rose-100 text-rose-700", badgeColor: "bg-rose-500 text-white" };

        if (dateKey === todayShift) return { label: 'Active', color: "bg-indigo-50 border-indigo-100 text-indigo-700", badgeColor: "bg-indigo-500 text-white" };
        if (dateKey < todayShift) return { label: 'N/A', color: "bg-slate-100 border-slate-200 text-slate-500 italic", badgeColor: "bg-slate-300" };

        return { label: '', color: "bg-white border-slate-100" };
    }, [currentMonthDate, attendanceData, holidays, leaveDaysSet, approvedWeekends]);

    const handleDayClick = async (request) => {
        setReviewingRequest(request);
        setLogsLoading(true);
        try {
            const res = await apiService.getUserTrackingLogs(selectedUsername, request.date, user.userIdentifier);
            const logs = res.data?.logs || [];
            setTrackingLogs(logs);
            // Re-use your bulletproof calculator that now handles extra/outside shift
            setTimeCalculations(calculateTotalWorkTime(logs, request.date));
        } finally {
            setLogsLoading(false);
        }
    };

    const handleConfirmAction = async (action) => {
        setActionLoading(true);
        try {
            await apiService.approveAttendance({
                targetUsername: selectedUsername,
                attendanceDate: reviewingRequest.date,
                action,
                authenticatedUsername: user.userIdentifier
            });
            await fetchData(currentMonthDate);
            setReviewingRequest(null);
            onApprovalComplete?.();
        } finally {
            setActionLoading(false);
        }
    };

    const changeMonth = (offset) => {
        setCurrentMonthDate(prev => {
            const d = new Date(prev);
            d.setUTCMonth(d.getUTCMonth() + offset);
            return d;
        });
    };

    const calendarGrid = useMemo(() => {
        const year = currentMonthDate.getUTCFullYear();
        const month = currentMonthDate.getUTCMonth();
        const firstDay = new Date(Date.UTC(year, month, 1)).getUTCDay();
        const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
        const days = Array(firstDay).fill(null);
        for (let i = 1; i <= daysInMonth; i++) days.push(i);
        return days;
    }, [currentMonthDate]);

    return (
        <CoreModal
            isOpen={isOpen}
            onClose={onClose}
            size={reviewingRequest ? "4xl" : "2xl"}
            title={`Attendance Audit: ${selectedUsername}`}
        >
            {reviewingRequest ? (
                <div className="space-y-6 animate-in fade-in duration-300">
                    {/* Header Block */}
                    <div className="flex justify-between items-center bg-slate-900 p-4 rounded-2xl text-white shadow-lg">
                        <div className="flex items-center gap-3">
                            <CalendarIcon size={18} className="text-indigo-400" />
                            <span className="font-bold tracking-tight">{reviewingRequest.date}</span>
                        </div>
                        <button onClick={() => setReviewingRequest(null)} className="p-2 hover:bg-white/10 rounded-full">
                            <Undo2 size={20} />
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Calculated Work Time Card */}
                        <div className="bg-indigo-600 text-white p-6 rounded-3xl shadow-md relative overflow-hidden flex flex-col justify-center">
                            <Clock className="absolute right-[-10px] top-[-10px] w-24 h-24 opacity-10" />
                            <p className="text-xs font-black uppercase tracking-widest opacity-80 mb-1">Standard Shift Time</p>
                            <h2 className="text-4xl font-black">
                                {timeCalculations.standard}
                                <span className="text-sm font-bold ml-2 text-indigo-300">{timeCalculations.activeStr}</span>
                            </h2>
                            
                            {/* 🔥 RESTORED: Outside Shift Time Pill */}
                            {timeCalculations.extra && (
                                <div className="mt-4 inline-flex flex-col bg-white/20 p-3 rounded-2xl border border-white/10 backdrop-blur-sm">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-indigo-100">Outside Shift Time</p>
                                    <p className="text-xl font-black">{timeCalculations.extra}</p>
                                </div>
                            )}
                        </div>

                        {/* Reason & Flag Card */}
                        <div className="bg-amber-50 border border-amber-200 p-6 rounded-3xl flex flex-col justify-center">
                            <div className="flex items-center gap-2 mb-3 text-amber-700">
                                <AlertTriangle size={18} />
                                <span className="text-xs font-black uppercase tracking-wider">Shift Explanation</span>
                            </div>
                            <p className="text-sm italic text-amber-900 font-medium leading-relaxed bg-amber-100/30 p-3 rounded-xl border border-amber-200/50">
                                "{reviewingRequest.userReason || "No manual explanation provided by user."}"
                            </p>
                            {reviewingRequest.shiftValidation && reviewingRequest.shiftValidation !== 'Within Shift' && (
                                <div className="mt-3">
                                    <span className="px-3 py-1 bg-rose-100 text-rose-700 text-[10px] font-bold rounded-lg border border-rose-200 uppercase tracking-tighter">
                                        {reviewingRequest.shiftValidation}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Activity Logs Table */}
                    <div className="border border-slate-200 rounded-3xl overflow-hidden bg-white shadow-sm">
                        <div className="bg-slate-50 px-5 py-3 border-b border-slate-200 flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                <Activity size={16} className="text-indigo-500" />
                                <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Device Activity Log</span>
                            </div>
                            <span className="text-[10px] font-bold text-slate-400">Shift Bounds: 19:00 - 04:00</span>
                        </div>
                        <div className="max-h-60 overflow-y-auto">
                            {logsLoading ? (
                                <div className="py-10 flex justify-center"><Spinner size="6" /></div>
                            ) : (
                                <table className="w-full text-left">
                                    <tbody className="divide-y divide-slate-50">
                                        {trackingLogs.length === 0 ? (
                                            <tr><td className="py-10 text-center text-slate-400 text-xs font-medium uppercase tracking-widest">No Activity Recorded</td></tr>
                                        ) : (
                                            trackingLogs.map((log, i) => (
                                                <tr key={i} className="hover:bg-slate-50 transition-colors">
                                                    <td className="py-2.5 px-5">
                                                        <LogBadge actionType={log.actionType} notes={log.workDoneNotes} />
                                                    </td>
                                                    <td className="py-2.5 px-5 text-right text-xs font-bold text-slate-600 tracking-wider">
                                                        {formatLogTime(log.eventTimestamp)}
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-4 pt-2">
                        <button 
                            disabled={actionLoading}
                            onClick={() => handleConfirmAction('Rejected')} 
                            className="flex-1 bg-slate-100 hover:bg-rose-50 hover:text-rose-700 p-4 rounded-2xl font-bold transition-all border border-transparent hover:border-rose-200 disabled:opacity-50"
                        >
                            Reject
                        </button>
                        <button
                            disabled={actionLoading}
                            onClick={() => handleConfirmAction('Approved')}
                            className="flex-[3] bg-emerald-600 hover:bg-emerald-700 p-4 rounded-2xl text-white font-bold shadow-lg transition-all hover:-translate-y-0.5 flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {actionLoading ? <Spinner size="5" /> : (
                                <>
                                    <CheckCircle2 size={18} />
                                    <span>Approve Shift</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            ) : (
                <div className="space-y-4">
                    {/* Navigation */}
                    <div className="flex justify-between items-center bg-white p-2 rounded-2xl border border-slate-200 shadow-sm">
                        <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors"><ChevronLeft size={20}/></button>
                        <span className="font-black text-slate-800 uppercase tracking-tight">
                            {currentMonthDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                        </span>
                        <button onClick={() => changeMonth(1)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors"><ChevronRight size={20}/></button>
                    </div>

                    {loading ? (
                        <div className="h-64 flex flex-col items-center justify-center"><Spinner size="10" /></div>
                    ) : (
                        <div className="grid grid-cols-7 gap-2">
                            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                                <div key={d} className="text-center text-[10px] font-black text-slate-400 uppercase mb-1">{d}</div>
                            ))}
                            {calendarGrid.map((day, i) => (
                                <CalendarDay 
                                    key={i} 
                                    day={day} 
                                    statusInfo={day ? getDayStatus(day) : null} 
                                    onDayClick={handleDayClick} 
                                />
                            ))}
                        </div>
                    )}
                </div>
            )}
        </CoreModal>
    );
};

export default AttendanceApprovalModal;