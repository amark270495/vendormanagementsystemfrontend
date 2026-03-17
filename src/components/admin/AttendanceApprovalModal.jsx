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
    AlertCircle, 
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

// --- Sub-Component: Individual Calendar Day ---
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
            {statusInfo.label && statusInfo.badgeColor !== "hidden" && (
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
    const [currentMonthDate, setCurrentMonthDate] = useState(() => new Date(Date.UTC(new Date().getFullYear(), new Date().getMonth(), 1)));
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

    // --- Fetch Business Data ---
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
                apiService.getLeaveRequests({ authenticatedUsername: user.userIdentifier, targetUsername: selectedUsername, statusFilter: 'Approved', startDateFilter: `${monthString}-01`, endDateFilter: `${monthString}-${monthEndDay.toString().padStart(2,'0')}` }),
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

            const approvedWknds = new Set();
            if (weekendRes?.data?.success) {
                weekendRes.data.requests.forEach(req => {
                    if (req.partitionKey === selectedUsername && req.status === 'Approved') approvedWknds.add(req.date);
                });
            }
            setApprovedWeekends(approvedWknds);

            const leaveSet = new Set();
            if (leaveRes?.data?.success) {
                leaveRes.data.requests.forEach(req => {
                    const start = new Date(req.startDate + 'T00:00:00Z');
                    const end = new Date(req.endDate + 'T00:00:00Z');
                    for (let d = new Date(start); d <= end; d.setUTCDate(d.getUTCDate() + 1)) {
                        leaveSet.add(d.toISOString().split('T')[0]);
                    }
                });
            }
            setLeaveDaysSet(leaveSet);

        } catch (err) {
            setError('System synchronization failed. Please try again.');
        } finally { setLoading(false); }
    }, [user, selectedUsername]);

    useEffect(() => {
        if (isOpen) fetchData(currentMonthDate);
    }, [isOpen, currentMonthDate, fetchData]);

    // --- Action Handlers ---
    const handleDayClick = async (request) => {
        setReviewingRequest(request);
        setLogsLoading(true);
        try {
            const res = await apiService.getUserTrackingLogs(request.username || selectedUsername, request.date, user.userIdentifier);
            const logs = res.data?.logs || [];
            setTrackingLogs(logs);
            setTimeCalculations(calculateTotalWorkTime(logs, request.date));
        } finally { setLogsLoading(false); }
    };

    const handleConfirmAction = async (action) => {
        setActionLoading(true);
        try {
            const res = await apiService.approveAttendance({
                targetUsername: reviewingRequest.username || selectedUsername, 
                attendanceDate: reviewingRequest.date,     
                action: action, 
                approverComments: '', 
                authenticatedUsername: user.userIdentifier
            });
            if (res.data.success) {
                await fetchData(currentMonthDate);
                setReviewingRequest(null);
                if (onApprovalComplete) onApprovalComplete();
            }
        } catch (err) { setError("Authorization failed."); }
        finally { setActionLoading(false); }
    };

    // --- Restored & Modernized Log Badge Helper ---
    const getEventBadgeStyle = (actionType, notes) => {
        const action = (actionType || '').toLowerCase();
        const noteLower = (notes || '').toLowerCase();

        if (noteLower.includes('previous shutdown detected')) return "bg-rose-100 text-rose-700 border-rose-200";
        if (action === 'agentcrash') return "bg-red-100 text-red-700 border-red-300 shadow-sm";
        if (action === 'restartaccepted') return "bg-blue-100 text-blue-700 border-blue-200";
        if (action === 'shiftendenforced') return "bg-violet-100 text-violet-700 border-violet-200";
        if (['login', 'unlock', 'resume', 'active', 'wake', 'heartbeat'].includes(action)) return "bg-emerald-100 text-emerald-700 border-emerald-200";
        if (['logout', 'logoff', 'lock', 'sleep', 'hibernate', 'shutdown'].includes(action)) return "bg-slate-200 text-slate-600 border-slate-300";
        if (['idle'].includes(action)) return "bg-amber-100 text-amber-700 border-amber-200";
        if (action.includes('usage')) return "bg-indigo-100 text-indigo-700 border-indigo-200";
        
        return "bg-slate-100 text-slate-600 border-slate-200";
    };

    // --- Fully Restored Calendar UI Mapping ---
    const getDayStatus = useCallback((day) => {
        const year = currentMonthDate.getUTCFullYear();
        const month = currentMonthDate.getUTCMonth();
        const date = new Date(Date.UTC(year, month, day));
        const dateKey = date.toISOString().split('T')[0];
        const dayOfWeek = date.getUTCDay();
        const currentShiftDateStr = getISTShiftDateString();
        const att = attendanceData[dateKey];

        // 1. Pending Actions
        if (att?.status === 'Pending') return {
            isPending: true, label: att.requestedStatus === 'Present' ? 'Present?' : 'Absent?', request: att,
            color: "bg-amber-50 border-amber-300 border-dashed border-2 cursor-pointer hover:scale-[1.02] shadow-md",
            badgeColor: "bg-amber-500 text-white border-amber-600"
        };

        // 2. Leave & Holidays
        if (leaveDaysSet.has(dateKey)) return { label: 'Leave', color: "bg-violet-50 border-violet-100 text-violet-700", badgeColor: "bg-violet-500 text-white border-violet-600" };
        if (holidays[dateKey]) return { label: 'Holiday', color: "bg-orange-50 border-orange-100 text-orange-700", badgeColor: "bg-orange-500 text-white border-orange-600" };
        
        // 3. Finalized Attendance
        if (att?.status === 'Present') return { label: 'Present', color: "bg-emerald-50 border-emerald-100 text-emerald-700", badgeColor: "bg-emerald-500 text-white border-emerald-600" };
        if (att?.status === 'Absent' || att?.status === 'Rejected') return { label: 'Absent', color: "bg-rose-50 border-rose-100 text-rose-700", badgeColor: "bg-rose-500 text-white border-rose-600" };
        
        // 4. Weekends
        if (dayOfWeek === 0 || dayOfWeek === 6) {
            if (approvedWeekends.has(dateKey)) {
                if (dateKey < currentShiftDateStr) return { label: 'N/A', color: "bg-rose-50/50 border-rose-200 text-rose-500 italic", badgeColor: "bg-rose-200 text-rose-700 border-rose-300" };
                return { label: 'Apprvd', color: "bg-indigo-50 border-indigo-200 text-indigo-700", badgeColor: "bg-indigo-400 text-white border-indigo-500" };
            }
            return { label: 'WKND', color: "bg-slate-50 border-slate-200 text-slate-400", badgeColor: "hidden" };
        }

        // 5. Regular un-marked weekdays & Active Shift
        if (dateKey < currentShiftDateStr) return { label: 'N/A', color: "bg-slate-100/50 border-slate-200 text-slate-500 italic", badgeColor: "bg-slate-200 text-slate-600 border-slate-300" };
        if (dateKey === currentShiftDateStr) return { label: 'Active', color: "bg-blue-50 border-blue-200 text-blue-700", badgeColor: "bg-blue-500 text-white border-blue-600" };

        return { label: '', color: "bg-white border-slate-100", badgeColor: "hidden" };
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

    return (
        <CoreModal 
            isOpen={isOpen} 
            onClose={onClose} 
            size="2xl" 
            title={`Attendance Audit: ${selectedUsername}`}
            subtitle={reviewingRequest ? `Session Security Review` : "Enterprise Attendance Log"}
        >
            {/* Global Error Alert */}
            {error && (
                <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-2xl mb-4 text-xs font-bold flex items-center shadow-sm">
                    <AlertCircle size={16} className="mr-2" />
                    {error}
                </div>
            )}

            {reviewingRequest ? (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                    {/* Header: Identity & Back */}
                    <div className="flex justify-between items-center bg-slate-950 p-5 rounded-3xl text-white shadow-xl shadow-slate-200">
                        <div className="flex items-center gap-4">
                            <div className="p-2.5 bg-amber-500/20 rounded-2xl text-amber-500 border border-amber-500/20">
                                <ShieldAlert size={22} />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">Audit Target Date</p>
                                <p className="text-lg font-bold">{new Date(reviewingRequest.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                            </div>
                        </div>
                        <button onClick={() => setReviewingRequest(null)} className="flex items-center gap-2 px-4 py-2 text-xs font-black uppercase tracking-widest bg-white/10 hover:bg-white/20 rounded-xl transition-all border border-white/10">
                            <Undo2 size={14} /> Calendar
                        </button>
                    </div>

                    {/* Stats Card */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-blue-600 p-6 rounded-[2rem] text-white relative overflow-hidden group">
                            <div className="absolute top-0 right-0 -mr-4 -mt-4 w-24 h-24 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
                            <div className="relative z-10">
                                <div className="flex items-center gap-2 opacity-70 mb-4">
                                    <Clock size={16} />
                                    <span className="text-[10px] font-black uppercase tracking-widest">Active Core Hours</span>
                                </div>
                                <h3 className="text-4xl font-black">{timeCalculations.standard}</h3>
                                <p className="text-xs font-bold text-blue-200 mt-2 flex items-center gap-1.5">
                                    <CheckCircle2 size={12} /> {timeCalculations.activeStr || "Shift duration verified by system"}
                                </p>
                            </div>
                        </div>

                        <div className="bg-slate-50 border border-slate-200 rounded-[2rem] p-6">
                            <div className="flex items-center gap-2 text-slate-400 mb-4">
                                <Activity size={16} />
                                <span className="text-[10px] font-black uppercase tracking-widest">Device Activity Signals</span>
                            </div>
                            {logsLoading ? <div className="h-24 flex items-center justify-center"><Spinner size="6" /></div> : (
                                <div className="space-y-3 h-24 overflow-y-auto custom-scrollbar pr-2">
                                    {trackingLogs.length > 0 ? trackingLogs.map((log, i) => {
                                        const badgeColor = getEventBadgeStyle(log.actionType, log.workDoneNotes);
                                        return (
                                            <div key={i} className="flex justify-between items-center py-1 border-b border-slate-200/50 last:border-0">
                                                <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md border ${badgeColor}`}>
                                                    {log.actionType}
                                                </span>
                                                <span className="text-[11px] font-bold text-slate-900">{formatLogTime(log.eventTimestamp)}</span>
                                            </div>
                                        );
                                    }) : <p className="text-xs text-slate-400 font-medium italic">No log data found.</p>}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* User Justification */}
                    {reviewingRequest.userReason && (
                        <div className="bg-amber-50 border border-amber-200 p-5 rounded-2xl">
                             <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-2">Employee Justification</p>
                             <p className="text-sm font-semibold text-amber-900 leading-relaxed italic">"{reviewingRequest.userReason}"</p>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-2">
                        <button 
                            disabled={actionLoading}
                            onClick={() => handleConfirmAction('Rejected')}
                            className="flex-1 py-4 bg-slate-100 text-slate-600 font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-rose-50 hover:text-rose-600 transition-all active:scale-[0.98]"
                        >
                            Reject Entry
                        </button>
                        <button 
                            disabled={actionLoading}
                            onClick={() => handleConfirmAction('Approved')}
                            className="flex-[2] py-4 bg-blue-600 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
                        >
                            {actionLoading ? <Spinner size="4" /> : "Approve Attendance"}
                        </button>
                    </div>
                </div>
            ) : (
                <div className="space-y-6">
                    {/* Navigation Header */}
                    <div className="flex justify-between items-center p-2 bg-slate-50 rounded-3xl border border-slate-200 shadow-inner">
                        <button onClick={() => setCurrentMonthDate(new Date(currentMonthDate.setUTCMonth(currentMonthDate.getUTCMonth() - 1)))} className="p-3 hover:bg-white rounded-2xl shadow-none hover:shadow-sm transition-all text-slate-400 hover:text-blue-600">
                            <ChevronLeft size={20} strokeWidth={3} />
                        </button>
                        <div className="flex items-center gap-3">
                            <CalendarDays size={18} className="text-blue-600" />
                            <span className="text-base font-black text-slate-800 tracking-tight uppercase">
                                {currentMonthDate.toLocaleString('default', { month: 'long', year: 'numeric', timeZone: 'UTC' })}
                            </span>
                        </div>
                        <button onClick={() => setCurrentMonthDate(new Date(currentMonthDate.setUTCMonth(currentMonthDate.getUTCMonth() + 1)))} className="p-3 hover:bg-white rounded-2xl shadow-none hover:shadow-sm transition-all text-slate-400 hover:text-blue-600">
                            <ChevronRight size={20} strokeWidth={3} />
                        </button>
                    </div>

                    {loading ? (
                        <div className="h-96 flex flex-col items-center justify-center gap-4">
                            <Spinner size="10" />
                            <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">Authenticating Records...</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-7 gap-2">
                            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                                <div key={d} className="text-center text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{d}</div>
                            ))}
                            {calendarGrid.map((day, i) => (
                                <CalendarDay key={i} day={day} statusInfo={day ? getDayStatus(day) : null} onDayClick={handleDayClick} />
                            ))}
                        </div>
                    )}
                </div>
            )}
        </CoreModal>
    );
};

export default AttendanceApprovalModal;