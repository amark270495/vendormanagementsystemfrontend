import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { apiService } from '../../api/apiService';
import Spinner from '../Spinner';
import Modal from '../Modal';

const formatMsToTime = (ms) => {
    const h = Math.floor(ms / (1000 * 60 * 60));
    const m = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    return `${h}h ${m}m`;
};

// --- Updated Time Calculation Helper (FIXED TIMEZONE BUG) ---
const calculateTotalWorkTime = (logs, shiftDateStr) => {
    if (!logs || logs.length === 0 || !shiftDateStr) return { standard: "0h 0m", extra: null, activeStr: "" };
    
    // 1. Establish strict IST Shift Boundaries (Bypassing Browser Timezones)
    const shiftStartIST = new Date(`${shiftDateStr}T19:00:00.000+05:30`);

    // Safely calculate the "next day" string using pure UTC math
    const [year, month, day] = shiftDateStr.split('-');
    const nextDayUTC = new Date(Date.UTC(parseInt(year, 10), parseInt(month, 10) - 1, parseInt(day, 10) + 1));
    const nextDayStr = nextDayUTC.toISOString().split('T')[0];
    
    const shiftEndIST = new Date(`${nextDayStr}T04:00:00.000+05:30`);

    // 2. Sort logs
    const sortedLogs = [...logs].sort((a, b) => new Date(a.eventTimestamp) - new Date(b.eventTimestamp));
    
    let standardMs = 0;
    let extraMs = 0;
    let sessionStart = null;
    let activeString = "";

    const processBlock = (start, end) => {
        const blockTotal = end - start;
        if (blockTotal <= 0) return;

        // Calculate overlap with core shift (19:00 - 04:00)
        const overlapStart = start > shiftStartIST ? start : shiftStartIST;
        const overlapEnd = end < shiftEndIST ? end : shiftEndIST;

        let blockStandard = 0;
        if (overlapStart < overlapEnd) {
            blockStandard = overlapEnd - overlapStart;
        }

        const blockExtra = blockTotal - blockStandard;
        standardMs += blockStandard;
        extraMs += blockExtra;
    };

    const startActions = ['login', 'unlock', 'resume', 'active', 'wake'];
    const stopActions = ['logout', 'logoff', 'lock', 'idle', 'sleep', 'hibernate'];

    sortedLogs.forEach(log => {
        const act = log.actionType.toLowerCase();
        const logTime = new Date(log.eventTimestamp);
        const notes = (log.workDoneNotes || "").toLowerCase();
        
        if (startActions.includes(act) && !sessionStart) {
            sessionStart = logTime;
        } else if (stopActions.includes(act) && sessionStart) {
            
            // Handle PowerShell delayed shutdown bug
            if (notes.includes("previous shutdown detected")) {
                sessionStart = null;
            } else {
                processBlock(sessionStart, logTime);
                sessionStart = null; 
            }
        }
    });

    if (sessionStart) {
        const now = new Date();
        
        if (now < shiftEndIST) {
             processBlock(sessionStart, now);
             activeString = " (Active Now)";
        } else {
             activeString = " (Missing Logout)";
        }
    }

    return { 
        standard: formatMsToTime(standardMs), 
        extra: extraMs > 60000 ? formatMsToTime(extraMs) : null,
        activeStr: activeString 
    };
};

const formatLogTime = (isoString) => {
    if (!isoString) return '-';
    try {
        const dateObj = new Date(isoString);
        return dateObj.toLocaleTimeString('en-US', { timeZone: 'Asia/Kolkata', hour12: true, hour: '2-digit', minute: '2-digit' });
    } catch (e) { return '-'; }
};

// --- Icons ---
const ChevronLeftIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>;
const ChevronRightIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>;
const ClockIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const ActivityIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>;

const CalendarDisplay = ({ monthDate, attendanceData, holidays, leaveDaysSet, onDayClick, pendingRequestsMap }) => {
    const getDayStatus = (day) => {
        const year = monthDate.getUTCFullYear();
        const month = monthDate.getUTCMonth();
        const date = new Date(Date.UTC(year, month, day));

        if (date.getUTCMonth() !== month) return { status: 'Empty' };

        const dateKey = date.toISOString().split('T')[0];
        const dayOfWeek = date.getUTCDay();
        const today = new Date(); 
        today.setUTCHours(0,0,0,0);

        const baseClasses = "relative transition-all duration-300 ease-out border flex flex-col justify-between p-1.5 overflow-hidden shadow-sm";
        
        if (leaveDaysSet.has(dateKey)) {
            return { status: 'On Leave', label: 'Leave', color: `${baseClasses} bg-violet-50 border-violet-200 text-violet-700`, badgeColor: "bg-violet-200 text-violet-800" };
        }
        
        if (holidays[dateKey]) {
            return { status: 'Holiday', label: 'Holiday', color: `${baseClasses} bg-orange-50 border-orange-200 text-orange-800`, badgeColor: "bg-orange-200 text-orange-800", description: holidays[dateKey] };
        }

        if (dayOfWeek === 0 || dayOfWeek === 6) {
            return { status: 'Weekend', label: 'WKND', color: `${baseClasses} bg-slate-50 border-slate-200 text-slate-400`, badgeColor: "hidden" };
        }

        const attendanceRecord = attendanceData[dateKey];
        
        if (attendanceRecord && attendanceRecord.status === 'Pending') {
            const requestedText = attendanceRecord.requestedStatus === 'Present' ? 'Present?' : 'Absent?';
            const requestObj = pendingRequestsMap[dateKey] || {};
            return {
                status: 'Pending', label: requestedText,
                color: `${baseClasses} bg-amber-50 border-2 border-dashed border-amber-400 text-amber-900 cursor-pointer hover:bg-amber-100 hover:border-amber-500 hover:shadow-md transform hover:-translate-y-0.5`,
                badgeColor: "bg-amber-400 text-amber-900 font-extrabold shadow-sm",
                description: `Pending Approval: ${attendanceRecord.requestedStatus}`, isPending: true, request: requestObj 
            };
        }
        
        if (attendanceRecord) {
             if (attendanceRecord.status === 'Present') {
                return { status: 'Present', label: 'Present', color: `${baseClasses} bg-emerald-50 border-emerald-200 text-emerald-800`, badgeColor: "bg-emerald-200 text-emerald-900" };
             }
             if (attendanceRecord.status === 'Absent' || attendanceRecord.status === 'Rejected') {
                return { status: attendanceRecord.status, label: 'Absent', color: `${baseClasses} bg-rose-50 border-rose-200 text-rose-800`, badgeColor: "bg-rose-200 text-rose-900" };
             }
        }

        if (date < today) {
            return { status: 'Absent (Unmarked)', label: 'N/A', color: `${baseClasses} bg-slate-100/50 border-slate-200 text-slate-500 italic`, badgeColor: "bg-slate-200 text-slate-600" };
        }

        return { status: 'Future', label: '', color: `${baseClasses} bg-white border-slate-100 text-slate-300 shadow-none`, badgeColor: "hidden" };
    };

    const calendarGrid = useMemo(() => {
        const year = monthDate.getUTCFullYear();
        const month = monthDate.getUTCMonth();
        const firstDayOfMonth = new Date(Date.UTC(year, month, 1)).getUTCDay();
        const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
        const grid = [];
        let dayCounter = 1;

        for (let i = 0; i < 6; i++) {
            const week = [];
            for (let j = 0; j < 7; j++) {
                if (i === 0 && j < firstDayOfMonth) week.push({ day: null, statusInfo: { status: 'Empty' } });
                else if (dayCounter <= daysInMonth) { week.push({ day: dayCounter, statusInfo: getDayStatus(dayCounter++) }); }
                else week.push({ day: null, statusInfo: { status: 'Empty' } });
            }
            if (week.some(cell => cell.day !== null)) grid.push(week);
            if (dayCounter > daysInMonth) break;
        }
        return grid;
    }, [monthDate, attendanceData, holidays, leaveDaysSet, pendingRequestsMap]);

    return (
        <div className="select-none">
            <div className="grid grid-cols-7 gap-2 mb-3">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} className="text-center text-xs font-extrabold text-slate-400 uppercase tracking-widest">{day}</div>
                ))}
            </div>
            <div className="grid grid-cols-7 gap-3">
                {calendarGrid.flat().map((cell, index) => (
                    <div key={index} className={`h-20 sm:h-24 rounded-2xl ${cell.day === null ? 'invisible' : cell.statusInfo.color}`}
                        title={cell.statusInfo.description || cell.statusInfo.status}
                        onClick={() => cell.statusInfo.isPending && onDayClick(cell.statusInfo.request)} 
                    >
                        {cell.day !== null && (
                            <>
                                <div className="flex justify-between items-start w-full px-1">
                                    <span className={`text-sm sm:text-base ${cell.statusInfo.isPending ? 'font-black text-amber-900' : 'font-bold'}`}>{cell.day}</span>
                                    {cell.statusInfo.isPending && (
                                        <span className="flex h-2.5 w-2.5 relative mt-1 mr-1">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
                                        </span>
                                    )}
                                </div>
                                <div className="flex justify-center w-full mb-1 mt-auto">
                                    {cell.statusInfo.label && (
                                        <span className={`text-[10px] sm:text-xs uppercase tracking-wider font-bold px-2 py-0.5 rounded-full ${cell.statusInfo.badgeColor || 'bg-white/50 border border-black/5'}`}>
                                            {cell.statusInfo.label}
                                        </span>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

const AttendanceApprovalModal = ({ isOpen, onClose, selectedUsername, onApprovalComplete }) => {
    const { user } = useAuth(); 
    const [currentMonthDate, setCurrentMonthDate] = useState(() => new Date(Date.UTC(new Date().getFullYear(), new Date().getMonth(), 1)));
    const [attendanceData, setAttendanceData] = useState({});
    const [holidays, setHolidays] = useState({});
    const [leaveDaysSet, setLeaveDaysSet] = useState(new Set());
    const [pendingRequestsMap, setPendingRequestsMap] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [actionLoading, setActionLoading] = useState(false);

    const [reviewingRequest, setReviewingRequest] = useState(null);
    const [trackingLogs, setTrackingLogs] = useState([]);
    const [logsLoading, setLogsLoading] = useState(false);
    
    const [timeCalculations, setTimeCalculations] = useState({ standard: "0h 0m", extra: null, activeStr: "" });

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        try {
            const date = new Date(dateString + 'T00:00:00Z');
            return date.toLocaleDateString('en-US', { timeZone: 'UTC', month: 'short', day: 'numeric', year: 'numeric' });
        } catch (e) { return dateString; }
    };

    const fetchDataForUserAndMonth = useCallback(async (monthDate) => {
        if (!user?.userIdentifier || !selectedUsername) {
             setLoading(false);
            return;
        }

        setLoading(true);
        setError('');
        try {
            const year = monthDate.getUTCFullYear();
            const month = (monthDate.getUTCMonth() + 1).toString().padStart(2, '0');
            const monthString = `${year}-${month}`;
            const monthEndDay = new Date(Date.UTC(year, monthDate.getUTCMonth() + 1, 0)).getUTCDate();

            const [attendanceRes, holidaysRes, leaveRes] = await Promise.all([
                apiService.getAttendance({ authenticatedUsername: user.userIdentifier, username: selectedUsername, month: monthString }),
                apiService.getHolidays({ authenticatedUsername: user.userIdentifier, year: year.toString() }),
                apiService.getLeaveRequests({ authenticatedUsername: user.userIdentifier, targetUsername: selectedUsername, statusFilter: 'Approved', startDateFilter: `${monthString}-01`, endDateFilter: `${monthString}-${monthEndDay.toString().padStart(2,'0')}` })
            ]);

            const attMap = {};
            const pendingMap = {};
            if (attendanceRes?.data?.success && Array.isArray(attendanceRes.data.attendanceRecords)) {
                attendanceRes.data.attendanceRecords.forEach(att => {
                    const record = { ...att, username: att.username || selectedUsername, date: att.date || att.rowKey };
                    attMap[record.date] = record;
                    if (record.status === 'Pending') pendingMap[record.date] = record;
                });
            }
            setAttendanceData(attMap);
            setPendingRequestsMap(pendingMap);

            const holMap = {};
            if (holidaysRes?.data?.success && Array.isArray(holidaysRes.data.holidays)) {
                holidaysRes.data.holidays.forEach(h => holMap[h.date] = h.description);
            }
            setHolidays(holMap);

            const leaveSet = new Set();
            if (leaveRes?.data?.success && Array.isArray(leaveRes.data.requests)) {
                leaveRes.data.requests.forEach(req => {
                    const start = new Date(req.startDate + 'T00:00:00Z');
                    const end = new Date(req.endDate + 'T00:00:00Z');
                    for (let d = new Date(start); d <= end; d.setUTCDate(d.getUTCDate() + 1)) {
                        if (d.getUTCFullYear() === year && d.getUTCMonth() === monthDate.getUTCMonth()) {
                            leaveSet.add(d.toISOString().split('T')[0]);
                        }
                    }
                });
            }
            setLeaveDaysSet(leaveSet);

        } catch (err) {
            setError(err.response?.data?.message || err.message || 'Failed to load calendar data.');
        } finally { setLoading(false); }
    }, [user?.userIdentifier, selectedUsername]);

    useEffect(() => {
        if (isOpen && selectedUsername) {
            const initialMonth = new Date(Date.UTC(new Date().getFullYear(), new Date().getMonth(), 1));
            setCurrentMonthDate(initialMonth);
            fetchDataForUserAndMonth(initialMonth);
            setReviewingRequest(null);
        }
    }, [isOpen, selectedUsername]);

    useEffect(() => {
        if (isOpen && selectedUsername) { fetchDataForUserAndMonth(currentMonthDate); }
    }, [currentMonthDate]);

    const changeMonth = (offset) => {
        setCurrentMonthDate(prev => {
            const newDate = new Date(prev);
            newDate.setUTCMonth(newDate.getUTCMonth() + offset, 1);
            return newDate;
        });
    };

    const handleDayClick = async (request) => {
        if (request && request.status === 'Pending') {
            if (!request.username || !request.date) {
                setError("Internal error: Request data missing.");
                return;
            }
            
            setReviewingRequest(request);
            setLogsLoading(true);
            
            try {
                const res = await apiService.getUserTrackingLogs(request.username, request.date, user.userIdentifier);
                if (res.data && res.data.success) {
                    setTrackingLogs(res.data.logs);
                    setTimeCalculations(calculateTotalWorkTime(res.data.logs, request.date));
                } else {
                    setTrackingLogs([]);
                    setTimeCalculations({ standard: "0h 0m", extra: null, activeStr: "" });
                }
            } catch (err) {
                console.error("Failed to fetch tracking logs", err);
                setTrackingLogs([]);
                setTimeCalculations({ standard: "Error", extra: null, activeStr: "" });
            } finally { setLogsLoading(false); }
        }
    };

    const handleConfirmAction = async (action) => {
        if (!reviewingRequest) return;
        setActionLoading(true);
        setError('');
        try {
            const payload = {
                targetUsername: reviewingRequest.username, 
                attendanceDate: reviewingRequest.date,     
                action: action,               
                approverComments: '',
                authenticatedUsername: user.userIdentifier
            };

            const response = await apiService.approveAttendance(payload);

            if (response.data.success) {
                await fetchDataForUserAndMonth(currentMonthDate); 
                setReviewingRequest(null);
                
                const remainingPendingInMonth = Object.values(pendingRequestsMap).some(p => 
                    p.date !== reviewingRequest.date && p.status === 'Pending'
                );
                if (!remainingPendingInMonth && onApprovalComplete) {
                    onApprovalComplete(); 
                }
            } else { throw new Error(response.data.message); }
        } catch (err) {
            setError(err.message || "Error processing request.");
        } finally { setActionLoading(false); }
    };

    const getEventBadge = (actionType, notes) => {
        const action = actionType.toLowerCase();
        const noteLower = (notes || '').toLowerCase();

        // Specific badge for the shutdown logic
        if (noteLower.includes('previous shutdown detected'))
            return <span className="px-2.5 py-1 text-[11px] font-bold uppercase rounded-md bg-rose-100 text-rose-800 border border-rose-200">Offline Shutdwn</span>;

        if (['login', 'unlock', 'resume', 'active', 'wake'].includes(action)) 
            return <span className="px-2.5 py-1 text-[11px] font-bold uppercase rounded-md bg-emerald-100 text-emerald-800 border border-emerald-200">{actionType}</span>;
        if (['logout', 'logoff', 'lock', 'sleep', 'hibernate'].includes(action)) 
            return <span className="px-2.5 py-1 text-[11px] font-bold uppercase rounded-md bg-slate-200 text-slate-700 border border-slate-300">{actionType}</span>;
        if (['idle'].includes(action)) 
            return <span className="px-2.5 py-1 text-[11px] font-bold uppercase rounded-md bg-amber-100 text-amber-800 border border-amber-200">{actionType}</span>;
        return <span className="px-2.5 py-1 text-[11px] font-bold uppercase rounded-md bg-gray-100 text-gray-700 border border-gray-200">{actionType}</span>;
    };

    const monthName = currentMonthDate.toLocaleString('default', { month: 'long', year: 'numeric', timeZone: 'UTC' });
    const hasExplanationDetails = reviewingRequest && (reviewingRequest.userReason || (reviewingRequest.shiftValidation && reviewingRequest.shiftValidation !== 'Within Shift'));

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Attendance Review: ${selectedUsername || 'Unknown'}`} size="4xl">
            {error && (
                <div className="bg-rose-50 border-l-4 border-rose-500 text-rose-700 px-4 py-3 rounded-r-lg mb-5 text-sm flex items-center shadow-sm font-medium">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    {error}
                </div>
            )}

            {reviewingRequest ? (
                <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm animate-fadeIn relative overflow-hidden">
                    <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-indigo-50 rounded-full blur-3xl opacity-60"></div>

                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 border-b border-slate-100 pb-5 relative z-10 gap-4">
                        <div>
                            <h3 className="text-2xl font-extrabold text-slate-800">Verify Shift: {formatDate(reviewingRequest.date)}</h3>
                            <div className="flex items-center gap-2 mt-2">
                                <span className="text-sm font-semibold text-slate-500">Requested Status:</span>
                                <span className="px-3 py-1 bg-amber-100 text-amber-800 text-xs font-bold uppercase tracking-wider rounded-full border border-amber-200">
                                    {reviewingRequest.requestedStatus}
                                </span>
                            </div>
                        </div>
                        <button onClick={() => setReviewingRequest(null)} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold rounded-xl transition-colors border border-slate-200 shadow-sm flex items-center">
                            <ChevronLeftIcon /> Back to Calendar
                        </button>
                    </div>

                    {logsLoading ? (
                         <div className="flex flex-col justify-center items-center h-64 text-slate-400 relative z-10">
                             <Spinner size="10"/><p className="mt-4 text-sm font-bold tracking-wide uppercase animate-pulse">Loading activity logs...</p>
                         </div>
                    ) : (
                        <div className="space-y-8 relative z-10">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                
                                {/* Time Calculation Split Card */}
                                <div className="bg-gradient-to-br from-indigo-50 to-white border border-indigo-100 rounded-2xl p-6 flex flex-col justify-center shadow-sm relative">
                                    <div className="flex items-center text-indigo-500 mb-3">
                                        <ClockIcon />
                                        <p className="text-xs font-black uppercase tracking-wider">Calculated Work Time</p>
                                    </div>
                                    
                                    <div className="flex items-end gap-3 mb-2">
                                        <div>
                                            <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Core Shift</p>
                                            <p className="text-3xl font-black text-indigo-700 leading-none mt-1">
                                                {timeCalculations.standard}
                                                <span className="text-sm font-bold ml-1.5 text-indigo-500">{timeCalculations.activeStr}</span>
                                            </p>
                                        </div>
                                    </div>
                                    
                                    {timeCalculations.extra && (
                                        <div className="mt-3 bg-amber-100/60 border border-amber-200 text-amber-800 px-3 py-2 rounded-lg self-start">
                                            <p className="text-xs font-bold uppercase tracking-wider">Out-of-Shift Time Detected</p>
                                            <p className="text-lg font-black">{timeCalculations.extra}</p>
                                        </div>
                                    )}
                                </div>

                                {/* Details / Flags Card */}
                                {hasExplanationDetails ? (
                                    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 shadow-sm flex flex-col justify-center">
                                        <div className="flex items-center gap-2 mb-3">
                                            <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                            <p className="text-xs font-black text-amber-700 uppercase tracking-wider">Shift Context & Flags</p>
                                        </div>
                                        <p className="text-sm text-amber-900 font-medium italic leading-relaxed bg-amber-100/50 p-3 rounded-lg border border-amber-200/50">
                                            "{reviewingRequest.userReason || 'No manual explanation provided by user.'}"
                                        </p>
                                        {reviewingRequest.shiftValidation && reviewingRequest.shiftValidation !== 'Within Shift' && (
                                            <div className="mt-3 inline-block">
                                                <span className="text-xs text-rose-700 font-bold bg-rose-100 px-3 py-1.5 rounded-lg border border-rose-200 shadow-sm flex items-center gap-1.5">
                                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                                                    {reviewingRequest.shiftValidation}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 flex flex-col items-center justify-center text-center shadow-sm">
                                        <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center mb-2">
                                            <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                                        </div>
                                        <p className="text-sm font-bold text-slate-700">No Flags Detected</p>
                                        <p className="text-xs text-slate-500 mt-1">Shift looks normal.</p>
                                    </div>
                                )}
                            </div>

                            <div className="border border-slate-200 rounded-2xl shadow-sm bg-white overflow-hidden">
                                <div className="px-5 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                                    <div className="flex items-center">
                                        <ActivityIcon />
                                        <h4 className="text-sm font-bold text-slate-700 ml-2 uppercase tracking-wider">Device Activity Log</h4>
                                    </div>
                                    <span className="text-xs font-bold text-slate-500 uppercase">Shift Bounds: 19:00 - 04:00</span>
                                </div>
                                <div className="max-h-64 overflow-y-auto">
                                    <table className="min-w-full divide-y divide-slate-100">
                                        <thead className="bg-white sticky top-0 shadow-sm z-10">
                                            <tr>
                                                <th className="px-6 py-3.5 text-left text-xs font-black text-slate-400 uppercase w-1/3">Event Action</th>
                                                <th className="px-6 py-3.5 text-right text-xs font-black text-slate-400 uppercase w-2/3">Timestamp (IST)</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50 text-sm">
                                            {trackingLogs.length === 0 ? (
                                                <tr>
                                                    <td colSpan="2" className="px-6 py-10 text-center">
                                                        <p className="text-slate-400 font-bold mb-1">No Activity Found</p>
                                                        <p className="text-xs text-slate-400">The user did not log any asset events for this shift.</p>
                                                    </td>
                                                </tr>
                                            ) : (
                                                trackingLogs.map(log => (
                                                    <tr key={log.id} className="hover:bg-indigo-50/30 transition-colors">
                                                        <td className="px-6 py-3">
                                                            {getEventBadge(log.actionType, log.workDoneNotes)}
                                                        </td>
                                                        <td className="px-6 py-3 text-right text-slate-600 font-bold tracking-wide">
                                                            {formatLogTime(log.eventTimestamp)}
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            <div className="flex justify-end gap-4 pt-6 border-t border-slate-100">
                                <button 
                                    onClick={() => handleConfirmAction('Rejected')} 
                                    disabled={actionLoading} 
                                    className="px-6 py-3 bg-white border border-rose-200 text-rose-700 text-sm font-bold rounded-xl hover:bg-rose-50 hover:shadow-sm disabled:opacity-50 transition-all min-w-[120px]"
                                >
                                    Reject Shift
                                </button>
                                <button 
                                    onClick={() => handleConfirmAction('Approved')} 
                                    disabled={actionLoading} 
                                    className="px-6 py-3 bg-emerald-600 text-white text-sm font-bold rounded-xl hover:bg-emerald-500 shadow-md hover:shadow-lg hover:-translate-y-0.5 disabled:opacity-50 flex items-center justify-center min-w-[150px] transition-all"
                                >
                                    {actionLoading ? <Spinner size="5" /> : 'Approve Shift'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <div className="bg-slate-50/50 p-2 sm:p-6 rounded-2xl">
                    <div className="flex justify-between items-center mb-6 bg-white p-2 rounded-2xl border border-slate-200 shadow-sm">
                        <button onClick={() => changeMonth(-1)} className="p-3 text-slate-500 rounded-xl hover:bg-slate-50 hover:text-indigo-600 transition-colors disabled:opacity-30" disabled={loading || actionLoading}><ChevronLeftIcon /></button>
                        <h3 className="text-xl font-black text-slate-800 tracking-tight">{monthName}</h3>
                        <button onClick={() => changeMonth(1)} className="p-3 text-slate-500 rounded-xl hover:bg-slate-50 hover:text-indigo-600 transition-colors disabled:opacity-30" disabled={loading || actionLoading}><ChevronRightIcon /></button>
                    </div>

                    {loading ? (
                        <div className="flex flex-col justify-center items-center h-[28rem] text-slate-400 bg-white rounded-2xl border border-slate-200 shadow-sm">
                            <Spinner size="10"/><p className="mt-4 text-sm font-bold uppercase tracking-widest animate-pulse">Loading Calendar...</p>
                        </div>
                    ) : (
                        <div className="min-h-[28rem] bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-sm">
                            <CalendarDisplay monthDate={currentMonthDate} attendanceData={attendanceData} holidays={holidays} leaveDaysSet={leaveDaysSet} onDayClick={handleDayClick} pendingRequestsMap={pendingRequestsMap} />
                        </div>
                    )}

                    <div className="mt-8 flex justify-end">
                        <button onClick={onClose} className="px-8 py-3 bg-slate-800 text-white text-sm font-bold rounded-xl hover:bg-slate-700 hover:shadow-md transition-all">
                            Close Dashboard
                        </button>
                    </div>
                </div>
            )}
        </Modal>
    );
};

export default AttendanceApprovalModal;