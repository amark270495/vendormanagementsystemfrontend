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

const getStatusConfig = (statusKey) => {
    const configs = {
        'Present': { 
            bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', 
            icon: <CheckCircle2 className="w-3 h-3" />, label: 'Present' 
        },
        'Absent': { 
            bg: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-700', 
            icon: <XCircle className="w-3 h-3" />, label: 'Absent' 
        },
        'Pending': { 
            bg: 'bg-amber-50', border: 'border-amber-300', text: 'text-amber-700', 
            icon: <Clock className="w-3 h-3 animate-pulse" />, label: 'Pending' 
        },
        'On Leave': { 
            bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700', 
            icon: <Palmtree className="w-3 h-3" />, label: 'Leave' 
        },
        'Holiday': { 
            bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', 
            icon: <CalendarOff className="w-3 h-3" />, label: 'Holiday' 
        },
        'Weekend': { 
            bg: 'bg-slate-50', border: 'border-transparent', text: 'text-slate-400', 
            icon: null, label: 'Weekend' 
        },
        'Unmarked': { 
            bg: 'bg-rose-50/50', border: 'border-rose-100 dashed', text: 'text-rose-400', 
            icon: <XCircle className="w-2.5 h-2.5 opacity-50" />, label: 'Unmarked' 
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

        if (leaveDaysSet.has(dateKey)) return { key: 'On Leave' };
        if (holidays[dateKey]) return { key: 'Holiday', description: holidays[dateKey] };
        if (dayOfWeek === 0 || dayOfWeek === 6) return { key: 'Weekend' };

        const attendanceRecord = attendanceData[dateKey];
        if (attendanceRecord && attendanceRecord.status === 'Pending') {
            return {
                key: 'Pending',
                isPending: true,
                request: pendingRequestsMap[dateKey] || {},
                subText: attendanceRecord.requestedStatus === 'Present' ? 'P' : 'A'
            };
        }
        if (attendanceRecord) {
             if (attendanceRecord.status === 'Present') return { key: 'Present' };
             if (attendanceRecord.status === 'Absent' || attendanceRecord.status === 'Rejected') return { key: 'Absent' };
        }
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
        <div className="flex flex-col">
            <div className="grid grid-cols-7 mb-1">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                    <div key={d} className="text-center text-[9px] font-bold text-slate-400 uppercase">
                        {d}
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
                {calendarGrid.flat().map((cell, index) => {
                    const { key, isPending, request, subText } = cell.statusInfo;
                    const config = getStatusConfig(key);
                    const isHidden = cell.day === null;

                    return (
                        <div
                            key={index}
                            onClick={() => isPending && onDayClick(request)}
                            className={`
                                relative h-10 rounded-md border flex flex-col items-center justify-center transition-all
                                ${isHidden ? 'invisible' : `${config.bg} ${config.border}`}
                                ${isPending ? 'cursor-pointer hover:bg-amber-100 ring-1 ring-amber-200' : ''}
                            `}
                        >
                            {!isHidden && (
                                <>
                                    <span className={`text-[10px] font-bold ${config.text}`}>
                                        {cell.day}
                                    </span>
                                    <div className={`mt-0.5 scale-90 ${config.text}`}>
                                        {config.icon}
                                    </div>
                                    {subText && (
                                        <span className="absolute bottom-0 text-[7px] font-black text-amber-600">
                                            {subText}
                                        </span>
                                    )}
                                </>
                            )}
                        </div>
                    );
                })}
            </div>

            <div className="flex flex-wrap justify-center gap-1.5 mt-3 pt-2 border-t border-slate-100">
                {['Present', 'Absent', 'Pending', 'On Leave', 'Holiday'].map(key => {
                    const conf = getStatusConfig(key);
                    return (
                        <div key={key} className="flex items-center gap-1 px-1.5 py-0.5 bg-white border border-slate-100 rounded-md">
                            <div className={`${conf.text} scale-75`}>{conf.icon}</div>
                            <span className="text-[9px] font-medium text-slate-500">{conf.label}</span>
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

    // Fetch data logic remains same as original...
    const fetchDataForUserAndMonth = useCallback(async (monthDate) => {
        if (!user?.userIdentifier || !selectedUsername) return;
        setLoading(true);
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
            setError('Failed to load data.');
        } finally {
            setLoading(false);
        }
    }, [user?.userIdentifier, selectedUsername]);

    useEffect(() => {
        if (isOpen && selectedUsername) {
            fetchDataForUserAndMonth(currentMonthDate);
        }
    }, [isOpen, selectedUsername, currentMonthDate, fetchDataForUserAndMonth]);

    const changeMonth = (offset) => {
        setCurrentMonthDate(prev => {
            const newDate = new Date(prev);
            newDate.setUTCMonth(newDate.getUTCMonth() + offset, 1);
            return newDate;
        });
    };

    const handleDayClick = async (request) => {
        if (request && request.status === 'Pending') {
            const actionConfirmed = window.confirm(`Approve mark as ${request.requestedStatus}?`);
            const action = actionConfirmed ? 'Approved' : 'Rejected';
            
            setActionLoading(true);
            try {
                const response = await apiService.approveAttendance({
                    targetUsername: request.username, 
                    attendanceDate: request.date,     
                    action: action,               
                    authenticatedUsername: user.userIdentifier
                });
                if (response.data.success) {
                    fetchDataForUserAndMonth(currentMonthDate);
                    if (onApprovalComplete) onApprovalComplete();
                }
            } catch (err) {
                setError("Error processing request.");
            } finally {
                setActionLoading(false);
            }
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Review: ${selectedUsername}`} size="custom">
            <div 
                className="overflow-hidden bg-white flex flex-col"
                style={{ width: '756px', height: '567px' }}
            >
                <div className="p-4 flex-1 flex flex-col">
                    {/* Compact Month Toggle */}
                    <div className="flex justify-between items-center mb-3 bg-slate-50 p-1 rounded-lg">
                        <button onClick={() => changeMonth(-1)} className="p-1 hover:text-indigo-600"><ChevronLeft className="w-4 h-4" /></button>
                        <h3 className="text-sm font-bold text-slate-700">
                            {currentMonthDate.toLocaleString('default', { month: 'long', year: 'numeric', timeZone: 'UTC' })}
                        </h3>
                        <button onClick={() => changeMonth(1)} className="p-1 hover:text-indigo-600"><ChevronRight className="w-4 h-4" /></button>
                    </div>

                    {loading || actionLoading ? (
                        <div className="flex-1 flex flex-col justify-center items-center">
                            <Spinner size="6"/>
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

                    <div className="mt-auto pt-3 flex justify-end">
                        <button 
                            onClick={onClose} 
                            className="px-6 py-1.5 bg-slate-800 text-white text-xs font-bold rounded-md hover:bg-slate-700 transition"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </Modal>
    );
};

export default AttendanceApprovalModal;