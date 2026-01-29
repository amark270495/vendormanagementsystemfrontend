import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { apiService } from '../../api/apiService';
import Spinner from '../Spinner';
import Modal from '../Modal';
import { 
    ChevronLeft, 
    ChevronRight, 
    CheckCircle2, 
    XCircle, 
    Clock, 
    CalendarOff, 
    Palmtree 
} from 'lucide-react';

// --- UI Configuration Helper ---
const getStatusConfig = (statusKey) => {
    const configs = {
        'Present': { 
            bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', 
            icon: <CheckCircle2 className="w-4 h-4" />, label: 'Present' 
        },
        'Absent': { 
            bg: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-700', 
            icon: <XCircle className="w-4 h-4" />, label: 'Absent' 
        },
        'Pending': { 
            bg: 'bg-amber-50', border: 'border-amber-300', text: 'text-amber-700', 
            icon: <Clock className="w-4 h-4 animate-pulse" />, label: 'Pending Action' 
        },
        'On Leave': { 
            bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700', 
            icon: <Palmtree className="w-4 h-4" />, label: 'Leave' 
        },
        'Holiday': { 
            bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', 
            icon: <CalendarOff className="w-4 h-4" />, label: 'Holiday' 
        },
        'Weekend': { 
            bg: 'bg-slate-50', border: 'border-transparent', text: 'text-slate-400', 
            icon: null, label: 'Weekend' 
        },
        'Unmarked': { 
            bg: 'bg-rose-50/50', border: 'border-rose-100 dashed', text: 'text-rose-400', 
            icon: <XCircle className="w-3 h-3 opacity-50" />, label: 'Unmarked' 
        },
        'Empty': { bg: 'invisible', border: '', text: '', icon: null }
    };
    return configs[statusKey] || { bg: 'bg-white', border: 'border-slate-100', text: 'text-slate-300', icon: null };
};

const CalendarDisplay = ({ monthDate, attendanceData, holidays, leaveDaysSet, onDayClick, pendingRequestsMap }) => {

    const getDayStatus = (day) => {
        const year = monthDate.getUTCFullYear();
        const month = monthDate.getUTCMonth();
        const date = new Date(Date.UTC(year, month, day));

        if (date.getUTCMonth() !== month) return { key: 'Empty' };

        const dateKey = date.toISOString().split('T')[0];
        const dayOfWeek = date.getUTCDay();
        const today = new Date(); 
        today.setUTCHours(0,0,0,0);

        // 1. Leave
        if (leaveDaysSet.has(dateKey)) return { key: 'On Leave' };
        
        // 2. Holiday
        if (holidays[dateKey]) return { key: 'Holiday', description: holidays[dateKey] };

        // 3. Weekend
        if (dayOfWeek === 0 || dayOfWeek === 6) return { key: 'Weekend' };

        const attendanceRecord = attendanceData[dateKey];
        
        // 4. Pending Requests (Actionable)
        if (attendanceRecord && attendanceRecord.status === 'Pending') {
            const requestObj = pendingRequestsMap[dateKey] || {};
            return {
                key: 'Pending',
                description: `Request: ${attendanceRecord.requestedStatus}`,
                isPending: true,
                request: requestObj,
                subText: attendanceRecord.requestedStatus === 'Present' ? 'Req: P' : 'Req: A'
            };
        }
        
        // 5. Historical Records
        if (attendanceRecord) {
             if (attendanceRecord.status === 'Present') return { key: 'Present' };
             if (attendanceRecord.status === 'Absent' || attendanceRecord.status === 'Rejected') return { key: 'Absent' };
        }

        // 6. Unmarked Past Days
        if (date < today) return { key: 'Unmarked' };

        return { key: 'Future' };
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
                if (i === 0 && j < firstDayOfMonth) week.push({ day: null, statusInfo: { key: 'Empty' } });
                else if (dayCounter <= daysInMonth) { week.push({ day: dayCounter, statusInfo: getDayStatus(dayCounter++) }); }
                else week.push({ day: null, statusInfo: { key: 'Empty' } });
            }
            if (week.some(cell => cell.day !== null)) grid.push(week);
            if (dayCounter > daysInMonth) break;
        }
        return grid;
    }, [monthDate, attendanceData, holidays, leaveDaysSet, pendingRequestsMap]);

    return (
        <div className="flex flex-col gap-4">
            {/* Calendar Header Days */}
            <div className="grid grid-cols-7 mb-2">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                    <div key={d} className="text-center text-xs font-bold text-slate-400 uppercase tracking-wider">
                        {d}
                    </div>
                ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-2">
                {calendarGrid.flat().map((cell, index) => {
                    const { key, description, isPending, request, subText } = cell.statusInfo;
                    const config = getStatusConfig(key);
                    const isHidden = cell.day === null;

                    return (
                        <div
                            key={index}
                            onClick={() => isPending && onDayClick(request)}
                            title={description || config.label}
                            className={`
                                relative aspect-square rounded-xl border flex flex-col items-center justify-center transition-all duration-200
                                ${isHidden ? 'invisible' : `${config.bg} ${config.border}`}
                                ${isPending ? 'cursor-pointer hover:shadow-md hover:scale-105 ring-2 ring-amber-200 ring-offset-1' : ''}
                            `}
                        >
                            {!isHidden && (
                                <>
                                    <span className={`text-sm font-semibold ${config.text}`}>
                                        {cell.day}
                                    </span>
                                    
                                    <div className={`mt-1 ${config.text}`}>
                                        {config.icon}
                                    </div>

                                    {subText && (
                                        <span className="absolute bottom-1 text-[10px] font-bold text-amber-600">
                                            {subText}
                                        </span>
                                    )}
                                </>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Legend */}
            <div className="flex flex-wrap justify-center gap-3 mt-4 pt-4 border-t border-slate-100">
                {['Present', 'Absent', 'Pending', 'On Leave', 'Holiday', 'Unmarked'].map(key => {
                    const conf = getStatusConfig(key);
                    return (
                        <div key={key} className="flex items-center gap-2 px-3 py-1 bg-white border border-slate-100 rounded-full shadow-sm">
                            <div className={`${conf.text}`}>{conf.icon}</div>
                            <span className="text-xs font-medium text-slate-600">{conf.label}</span>
                        </div>
                    );
                })}
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

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        try {
            const date = new Date(dateString + 'T00:00:00Z');
            return date.toLocaleDateString('en-US', { timeZone: 'UTC', month: 'short', day: 'numeric', year: 'numeric' });
        } catch (e) {
            return dateString;
        }
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
        } finally {
            setLoading(false);
        }
    }, [user?.userIdentifier, selectedUsername]);

    useEffect(() => {
        if (isOpen && selectedUsername) {
            const initialMonth = new Date(Date.UTC(new Date().getFullYear(), new Date().getMonth(), 1));
            setCurrentMonthDate(initialMonth);
            fetchDataForUserAndMonth(initialMonth);
        }
    }, [isOpen, selectedUsername]);

     useEffect(() => {
        if (isOpen && selectedUsername) {
             fetchDataForUserAndMonth(currentMonthDate);
        }
     }, [currentMonthDate]);

    const changeMonth = (offset) => {
        setCurrentMonthDate(prev => {
            const newDate = new Date(prev);
            newDate.setUTCMonth(newDate.getUTCMonth() + offset, 1);
            return newDate;
        });
    };

    const handleDayClick = (request) => {
        if (request && request.status === 'Pending') {
            if (!request.username || !request.date) {
                setError("Internal error: Request data missing.");
                return;
            }
            // In a real modern app, this would be a nested Modal or Popover. 
            // Sticking to confirm for simplicity but cleaning the string.
             const actionConfirmed = window.confirm(
                 `Approval Required\n\nUser: ${request.username}\nDate: ${formatDate(request.date)}\nRequest: Mark as ${request.requestedStatus}\n\n• OK to Approve\n• Cancel to Reject`
             );
            const action = actionConfirmed ? 'Approved' : 'Rejected';
             handleConfirmAction(request, action, '');
        }
    };

    const handleConfirmAction = async (req, action, comments) => {
        setActionLoading(true);
        setError('');
        try {
            const payload = {
                targetUsername: req.username, 
                attendanceDate: req.date,     
                action: action,               
                approverComments: comments,
                authenticatedUsername: user.userIdentifier
            };

            const response = await apiService.approveAttendance(payload);

            if (response.data.success) {
                await fetchDataForUserAndMonth(currentMonthDate); 
                const remainingPendingInMonth = Object.values(pendingRequestsMap).some(p => 
                    p.date !== req.date && p.status === 'Pending'
                );
                if (!remainingPendingInMonth && onApprovalComplete) {
                    onApprovalComplete(); 
                }
            } else {
                throw new Error(response.data.message);
            }
        } catch (err) {
            setError(err.message || "Error processing request.");
        } finally {
            setActionLoading(false);
        }
    };

    const monthName = currentMonthDate.toLocaleString('default', { month: 'long', year: 'numeric', timeZone: 'UTC' });

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Attendance Review: ${selectedUsername || '...'}`} size="3xl">
            <div className="p-1">
                {error && (
                    <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-lg mb-4 text-sm flex items-center">
                        <XCircle className="w-4 h-4 mr-2" />
                        {error}
                    </div>
                )}

                {/* Header Controls */}
                <div className="flex justify-between items-center mb-6 bg-slate-50 p-2 rounded-xl">
                    <button 
                        onClick={() => changeMonth(-1)} 
                        className="p-2 bg-white text-slate-600 rounded-lg hover:bg-white hover:text-indigo-600 hover:shadow-md transition-all disabled:opacity-50" 
                        disabled={loading || actionLoading}
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    
                    <h3 className="text-lg font-bold text-slate-800 tracking-tight">{monthName}</h3>
                    
                    <button 
                        onClick={() => changeMonth(1)} 
                        className="p-2 bg-white text-slate-600 rounded-lg hover:bg-white hover:text-indigo-600 hover:shadow-md transition-all disabled:opacity-50" 
                        disabled={loading || actionLoading}
                    >
                        <ChevronRight className="w-5 h-5" />
                    </button>
                </div>

                {/* Content Area */}
                {loading || actionLoading ? (
                    <div className="flex flex-col justify-center items-center h-80 bg-slate-50/50 rounded-2xl border border-slate-100 dashed">
                        <Spinner size="10"/>
                        <p className="mt-3 text-slate-500 font-medium animate-pulse">
                            {actionLoading ? 'Processing decision...' : 'Loading calendar...'}
                        </p>
                    </div>
                ) : (
                    <CalendarDisplay
                        monthDate={currentMonthDate}
                        attendanceData={attendanceData}
                        holidays={holidays}
                        leaveDaysSet={leaveDaysSet}
                        onDayClick={handleDayClick} 
                        pendingRequestsMap={pendingRequestsMap} 
                    />
                )}

                <div className="mt-8 pt-4 border-t border-slate-100 flex justify-end">
                    <button 
                        onClick={onClose} 
                        className="px-6 py-2.5 bg-slate-800 text-white font-semibold rounded-xl hover:bg-slate-700 transition shadow-lg shadow-slate-200"
                    >
                        Close Review
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default AttendanceApprovalModal;