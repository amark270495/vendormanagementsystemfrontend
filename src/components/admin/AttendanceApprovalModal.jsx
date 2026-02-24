import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { apiService } from '../../api/apiService';
import Spinner from '../Spinner';
import Modal from '../Modal';

// --- Updated Time Calculation Helper (Shift & Wake Aware) ---
const calculateTotalWorkTime = (logs) => {
    if (!logs || logs.length === 0) return { text: "0h 0m", ms: 0 };
    
    // 1. Sort logs chronologically to ensure logical flow
    const sortedLogs = [...logs].sort((a, b) => 
        new Date(a.eventTimestamp) - new Date(b.eventTimestamp)
    );
    
    let totalMs = 0;
    let sessionStart = null;

    // ✅ Expanded triggers to include wake-from-sleep events
    const startActions = ['login', 'unlock', 'resume', 'active', 'wake'];
    const stopActions = ['logout', 'logoff', 'lock', 'idle', 'sleep', 'hibernate'];

    sortedLogs.forEach(log => {
        const action = log.actionType.toLowerCase();
        
        if (startActions.includes(action) && !sessionStart) {
            sessionStart = new Date(log.eventTimestamp);
        } else if (stopActions.includes(action) && sessionStart) {
            totalMs += (new Date(log.eventTimestamp) - sessionStart);
            sessionStart = null; 
        }
    });

    // Handle Active Sessions (if the user is currently working)
    let activeString = sessionStart ? " (Session Active)" : "";

    const hours = Math.floor(totalMs / (1000 * 60 * 60));
    const minutes = Math.floor((totalMs % (1000 * 60 * 60)) / (1000 * 60));
    
    return { text: `${hours}h ${minutes}m${activeString}`, ms: totalMs };
};

// Inline SVGs for UI controls
const ChevronLeftIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
);
const ChevronRightIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
);

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

        const baseClasses = "relative transition-all duration-300 ease-out border flex flex-col justify-between p-1 overflow-hidden";
        
        if (leaveDaysSet.has(dateKey)) {
            return { status: 'On Leave', label: 'Leave', color: `${baseClasses} bg-violet-100 border-violet-200 text-violet-700 hover:bg-violet-200`, badgeColor: "bg-white/80 text-violet-700" };
        }
        
        if (holidays[dateKey]) {
            return { status: 'Holiday', label: 'Holiday', color: `${baseClasses} bg-orange-100 border-orange-200 text-orange-800 hover:bg-orange-200`, badgeColor: "bg-white/80 text-orange-800", description: holidays[dateKey] };
        }

        if (dayOfWeek === 0 || dayOfWeek === 6) {
            return { status: 'Weekend', label: 'WKND', color: `${baseClasses} bg-slate-50 border-slate-100 text-slate-400`, badgeColor: "hidden" };
        }

        const attendanceRecord = attendanceData[dateKey];
        
        if (attendanceRecord && attendanceRecord.status === 'Pending') {
            const requestedText = attendanceRecord.requestedStatus === 'Present' ? 'Present?' : 'Absent?';
            const requestObj = pendingRequestsMap[dateKey] || {};
            return {
                status: 'Pending', label: requestedText,
                color: `${baseClasses} bg-amber-100 border-2 border-dashed border-amber-300 text-amber-900 cursor-pointer hover:bg-amber-200 hover:border-amber-500 hover:shadow-md`,
                badgeColor: "bg-amber-200 text-amber-900 font-bold",
                description: `Pending Approval: ${attendanceRecord.requestedStatus}`, isPending: true, request: requestObj 
            };
        }
        
        if (attendanceRecord) {
             if (attendanceRecord.status === 'Present') {
                return { status: 'Present', label: 'Present', color: `${baseClasses} bg-emerald-100 border-emerald-200 text-emerald-800 hover:bg-emerald-200`, badgeColor: "bg-white/80 text-emerald-800" };
             }
             if (attendanceRecord.status === 'Absent' || attendanceRecord.status === 'Rejected') {
                return { status: attendanceRecord.status, label: 'Absent', color: `${baseClasses} bg-rose-100 border-rose-200 text-rose-800 hover:bg-rose-200`, badgeColor: "bg-white/80 text-rose-800" };
             }
        }

        if (date < today) {
            return { status: 'Absent (Unmarked)', label: 'N/A', color: `${baseClasses} bg-gray-100 border-gray-200 text-gray-500 italic`, badgeColor: "bg-gray-200 text-gray-600" };
        }

        return { status: 'Future', label: '', color: `${baseClasses} bg-white border-slate-100 text-slate-300`, badgeColor: "hidden" };
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
                    <div key={day} className="text-center text-[11px] font-bold text-slate-400 uppercase tracking-widest">{day}</div>
                ))}
            </div>
            <div className="grid grid-cols-7 gap-2">
                {calendarGrid.flat().map((cell, index) => (
                    <div key={index} className={`h-16 rounded-xl ${cell.day === null ? 'invisible' : cell.statusInfo.color}`}
                        title={cell.statusInfo.description || cell.statusInfo.status}
                        onClick={() => cell.statusInfo.isPending && onDayClick(cell.statusInfo.request)} 
                    >
                        {cell.day !== null && (
                            <>
                                <div className="flex justify-between items-start w-full px-1">
                                    <span className={`text-sm ${cell.statusInfo.isPending ? 'font-bold text-amber-900' : 'font-medium'}`}>{cell.day}</span>
                                    {cell.statusInfo.isPending && (
                                        <span className="flex h-2 w-2 relative mt-1 mr-1">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                                        </span>
                                    )}
                                </div>
                                <div className="flex justify-center w-full mb-0.5">
                                    {cell.statusInfo.label && (
                                        <span className={`text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded-full shadow-sm ${cell.statusInfo.badgeColor || 'bg-white/50 border border-black/5'}`}>
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
    const [totalWorkTime, setTotalWorkTime] = useState("");

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
                // ✅ Now fetches grouped shift logs (e.g., 7PM Feb 23 to 4AM Feb 24)
                const res = await apiService.getUserTrackingLogs(request.username, request.date, user.userIdentifier);
                if (res.data && res.data.success) {
                    setTrackingLogs(res.data.logs);
                    setTotalWorkTime(calculateTotalWorkTime(res.data.logs).text);
                } else {
                    setTrackingLogs([]);
                    setTotalWorkTime("0h 0m");
                }
            } catch (err) {
                console.error("Failed to fetch tracking logs", err);
                setTrackingLogs([]);
                setTotalWorkTime("Error loading data");
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

    const monthName = currentMonthDate.toLocaleString('default', { month: 'long', year: 'numeric', timeZone: 'UTC' });
    const hasExplanationDetails = reviewingRequest && (reviewingRequest.userReason || (reviewingRequest.shiftValidation && reviewingRequest.shiftValidation !== 'Within Shift'));

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Attendance Review: ${selectedUsername || 'Unknown'}`} size="3xl">
            {error && (
                <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-lg mb-4 text-sm flex items-center shadow-sm">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    {error}
                </div>
            )}

            {reviewingRequest ? (
                <div className="bg-white rounded-xl border border-slate-200 p-6 animate-fadeIn">
                    <div className="flex justify-between items-start mb-6 border-b border-slate-100 pb-4">
                        <div>
                            <h3 className="text-xl font-bold text-slate-800">Verifying Request for {formatDate(reviewingRequest.date)}</h3>
                            <p className="text-sm text-slate-500 mt-1">Status: <span className="font-semibold text-amber-600">{reviewingRequest.requestedStatus}</span></p>
                        </div>
                        <button onClick={() => setReviewingRequest(null)} className="text-slate-400 hover:text-slate-600 text-sm font-medium underline">
                            &larr; Back to Calendar
                        </button>
                    </div>

                    {logsLoading ? (
                         <div className="flex flex-col justify-center items-center h-48 text-slate-400">
                             <Spinner size="8"/><p className="mt-3 text-sm font-medium animate-pulse">Loading activity logs...</p>
                         </div>
                    ) : (
                        <div className="space-y-6">
                            {hasExplanationDetails && (
                                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 shadow-sm">
                                    <div className="flex items-center gap-2 mb-2">
                                        <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                        <p className="text-xs font-bold text-amber-700 uppercase tracking-wider">Shift & Explanation Details</p>
                                    </div>
                                    <p className="text-sm text-amber-900 italic leading-relaxed mb-2">"{reviewingRequest.userReason || 'No manual explanation provided.'}"</p>
                                    {reviewingRequest.shiftValidation && reviewingRequest.shiftValidation !== 'Within Shift' && (
                                        <p className="text-[11px] text-amber-700 mt-1 font-medium bg-amber-100/50 inline-block px-2 py-1 rounded border border-amber-200/50">
                                            System Flag: {reviewingRequest.shiftValidation}
                                        </p>
                                    )}
                                </div>
                            )}

                            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Calculated Work Time</p>
                                    <p className="text-2xl font-black text-indigo-700 mt-1">{totalWorkTime}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Source</p>
                                    <p className="text-sm font-bold text-slate-800 mt-1">{reviewingRequest.attendanceSource || 'Manual Entry'}</p>
                                </div>
                            </div>

                            <div className="max-h-64 overflow-y-auto border border-slate-200 rounded-lg shadow-sm">
                                <table className="min-w-full divide-y divide-slate-200">
                                    <thead className="bg-slate-100 sticky top-0">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase">Event</th>
                                            <th className="px-4 py-3 text-right text-xs font-bold text-slate-600 uppercase">Timestamp (IST)</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-slate-100 text-sm">
                                        {trackingLogs.length === 0 ? (
                                            <tr><td colSpan="2" className="px-4 py-6 text-center text-slate-500 italic">No tracking logs found.</td></tr>
                                        ) : (
                                            trackingLogs.map(log => (
                                                <tr key={log.id} className="hover:bg-slate-50">
                                                    <td className="px-4 py-3">
                                                        <span className={`px-2 py-1 text-xs font-bold rounded-md ${['login', 'unlock', 'resume', 'active', 'wake'].includes(log.actionType.toLowerCase()) ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'}`}>
                                                            {log.actionType}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-right text-slate-600 font-medium">
                                                        {/* ✅ Prioritize backend-formatted IST time, with fallback for old records */}
                                                        {log.istTimeLogged || new Date(log.eventTimestamp).toLocaleTimeString('en-IN', { 
                                                            timeZone: 'Asia/Kolkata', 
                                                            hour12: false, 
                                                            hour: '2-digit', 
                                                            minute: '2-digit' 
                                                        })}
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                                <button onClick={() => handleConfirmAction('Rejected')} disabled={actionLoading} className="px-5 py-2.5 bg-rose-100 text-rose-700 text-sm font-semibold rounded-lg hover:bg-rose-200 disabled:opacity-50">
                                    Reject Request
                                </button>
                                <button onClick={() => handleConfirmAction('Approved')} disabled={actionLoading} className="px-5 py-2.5 bg-emerald-600 text-white text-sm font-semibold rounded-lg hover:bg-emerald-700 shadow disabled:opacity-50 flex items-center">
                                    {actionLoading ? <Spinner size="4" /> : 'Approve Request'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <>
                    <div className="flex justify-between items-center mb-6 bg-white p-1 rounded-2xl border border-slate-200 shadow-sm">
                        <button onClick={() => changeMonth(-1)} className="p-3 text-slate-500 rounded-xl hover:bg-slate-50 disabled:opacity-30" disabled={loading || actionLoading}><ChevronLeftIcon /></button>
                        <h3 className="text-lg font-bold text-slate-800 tracking-tight">{monthName}</h3>
                        <button onClick={() => changeMonth(1)} className="p-3 text-slate-500 rounded-xl hover:bg-slate-50 disabled:opacity-30" disabled={loading || actionLoading}><ChevronRightIcon /></button>
                    </div>

                    {loading ? (
                        <div className="flex flex-col justify-center items-center h-[28rem] text-slate-400">
                            <Spinner size="10"/><p className="mt-3 text-sm font-medium animate-pulse">Loading data...</p>
                        </div>
                    ) : (
                        <div className="min-h-[28rem]">
                            <CalendarDisplay monthDate={currentMonthDate} attendanceData={attendanceData} holidays={holidays} leaveDaysSet={leaveDaysSet} onDayClick={handleDayClick} pendingRequestsMap={pendingRequestsMap} />
                        </div>
                    )}

                    <div className="mt-8 pt-6 border-t border-slate-100 flex justify-end">
                        <button onClick={onClose} className="px-6 py-2.5 bg-slate-900 text-white text-sm font-semibold rounded-lg hover:bg-slate-800 transition shadow">
                            Close Review
                        </button>
                    </div>
                </>
            )}
        </Modal>
    );
};

export default AttendanceApprovalModal;