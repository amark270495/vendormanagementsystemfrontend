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
            icon: <CheckCircle2 className="w-4 h-4" />, label: 'Present' 
        },
        'Absent': { 
            bg: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-700', 
            icon: <XCircle className="w-4 h-4" />, label: 'Absent' 
        },
        'Pending': { 
            bg: 'bg-amber-50', border: 'border-amber-300', text: 'text-amber-700', 
            icon: <Clock className="w-4 h-4 animate-pulse" />, label: 'Pending' 
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

        if (leaveDaysSet.has(dateKey)) return { key: 'On Leave' };
        if (holidays[dateKey]) return { key: 'Holiday', description: holidays[dateKey] };
        if (dayOfWeek === 0 || dayOfWeek === 6) return { key: 'Weekend' };

        const attendanceRecord = attendanceData[dateKey];
        if (attendanceRecord && attendanceRecord.status === 'Pending') {
            const requestObj = pendingRequestsMap[dateKey] || {};
            return {
                key: 'Pending',
                isPending: true,
                request: requestObj,
                subText: attendanceRecord.requestedStatus === 'Present' ? 'REQ: P' : 'REQ: A'
            };
        }
        if (attendanceRecord) {
             if (attendanceRecord.status === 'Present') return { key: 'Present' };
             if (attendanceRecord.status === 'Absent' || attendanceRecord.status === 'Rejected') return { key: 'Absent' };
        }
        return date < today ? { key: 'Unmarked' } : { key: 'Future' };
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
            grid.push(week);
        }
        return grid;
    }, [monthDate, attendanceData, holidays, leaveDaysSet, pendingRequestsMap]);

    return (
        <div className="w-full flex flex-col">
            <div className="grid grid-cols-7 mb-2">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                    <div key={d} className="text-center text-[11px] font-bold text-slate-400 uppercase tracking-widest">{d}</div>
                ))}
            </div>

            <div className="grid grid-cols-7 gap-2 w-full">
                {calendarGrid.flat().map((cell, index) => {
                    const { key, isPending, request, subText } = cell.statusInfo;
                    const config = getStatusConfig(key);
                    const isHidden = cell.day === null;

                    return (
                        <div
                            key={index}
                            onClick={() => isPending && onDayClick(request)}
                            /* min-h raised to 80px (+~30px) to prevent icon/text overlap */
                            className={`
                                relative min-h-[80px] py-3 rounded-2xl border flex flex-col items-center justify-between transition-all
                                ${isHidden ? 'invisible' : `${config.bg} ${config.border}`}
                                ${isPending ? 'cursor-pointer hover:shadow-lg ring-2 ring-amber-200 ring-offset-1 scale-[1.02]' : ''}
                            `}
                        >
                            {!isHidden && (
                                <>
                                    <span className={`text-sm font-bold ${config.text}`}>{cell.day}</span>
                                    <div className={`${config.text} flex-1 flex items-center`}>{config.icon}</div>
                                    {subText ? (
                                        <span className="text-[9px] font-black text-amber-600 bg-amber-100/50 px-1.5 py-0.5 rounded-md uppercase tracking-tighter">
                                            {subText}
                                        </span>
                                    ) : (
                                        <div className="h-[14px]" /> /* spacer to maintain height */
                                    )}
                                </>
                            )}
                        </div>
                    );
                })}
            </div>

            <div className="flex flex-wrap justify-center gap-4 mt-8 pt-4 border-t border-slate-100">
                {['Present', 'Absent', 'Pending', 'On Leave', 'Holiday', 'Unmarked'].map(label => {
                    const conf = getStatusConfig(label);
                    return (
                        <div key={label} className="flex items-center gap-2 px-3 py-1 bg-slate-50 rounded-full border border-slate-100">
                            <div className={`${conf.text}`}>{conf.icon}</div>
                            <span className="text-[11px] font-bold text-slate-600">{label}</span>
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

    const fetchDataForUserAndMonth = useCallback(async (monthDate) => {
        if (!user?.userIdentifier || !selectedUsername) return;
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
        } catch (err) { setError(err.message || 'Error loading data.'); } 
        finally { setLoading(false); }
    }, [user?.userIdentifier, selectedUsername]);

    useEffect(() => {
        if (isOpen && selectedUsername) fetchDataForUserAndMonth(currentMonthDate);
    }, [isOpen, selectedUsername, currentMonthDate, fetchDataForUserAndMonth]);

    const changeMonth = (offset) => {
        setCurrentMonthDate(prev => {
            const d = new Date(prev);
            d.setUTCMonth(d.getUTCMonth() + offset, 1);
            return d;
        });
    };

    const handleConfirmAction = async (req, action, comments) => {
        setActionLoading(true);
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
                if (onApprovalComplete) onApprovalComplete();
            }
        } catch (err) { setError(err.message); }
        finally { setActionLoading(false); }
    };

    const handleDayClick = (request) => {
        if (request?.status === 'Pending') {
            const confirmAction = window.confirm(`Approve attendance for ${request.username} on ${request.date}?`);
            if (confirmAction) handleConfirmAction(request, 'Approved', '');
            else handleConfirmAction(request, 'Rejected', '');
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Review: ${selectedUsername}`} size="2xl">
            <div className="bg-white flex flex-col p-6 w-full">
                <div className="flex justify-between items-center mb-8 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                    <button onClick={() => changeMonth(-1)} disabled={loading} className="p-2 hover:bg-white rounded-xl shadow-sm transition-all disabled:opacity-30">
                        <ChevronLeft className="w-6 h-6 text-slate-600" />
                    </button>
                    <h3 className="text-xl font-black text-slate-800 tracking-tight uppercase">
                        {currentMonthDate.toLocaleString('default', { month: 'long', year: 'numeric', timeZone: 'UTC' })}
                    </h3>
                    <button onClick={() => changeMonth(1)} disabled={loading} className="p-2 hover:bg-white rounded-xl shadow-sm transition-all disabled:opacity-30">
                        <ChevronRight className="w-6 h-6 text-slate-600" />
                    </button>
                </div>

                <div className="w-full">
                    {loading || actionLoading ? (
                        <div className="flex flex-col justify-center items-center h-80 bg-slate-50/50 rounded-3xl border-2 border-dashed border-slate-200">
                            <Spinner size="12"/>
                            <p className="mt-4 text-sm font-black text-slate-400 animate-pulse tracking-widest uppercase">Synchronizing...</p>
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
                </div>

                <div className="mt-8 pt-6 border-t border-slate-100 flex justify-end">
                    <button onClick={onClose} className="px-12 py-4 bg-slate-900 text-white text-[11px] font-black uppercase tracking-widest rounded-2xl hover:bg-slate-800 shadow-xl shadow-slate-200 transition-transform active:scale-95">
                        Close Review
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default AttendanceApprovalModal;