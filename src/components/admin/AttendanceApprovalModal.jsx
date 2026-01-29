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

// --- Configuration with optimized icon sizes ---
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
        if (holidays[dateKey]) return { key: 'Holiday' };
        if (dayOfWeek === 0 || dayOfWeek === 6) return { key: 'Weekend' };

        const attendanceRecord = attendanceData[dateKey];
        if (attendanceRecord?.status === 'Pending') {
            return {
                key: 'Pending',
                isPending: true,
                request: pendingRequestsMap[dateKey] || {},
                subText: attendanceRecord.requestedStatus === 'Present' ? 'Req: P' : 'Req: A'
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
    }, [monthDate, attendanceData, holidays, leaveDaysSet]);

    return (
        <div className="flex-1 flex flex-col min-h-0">
            {/* Weekday Header */}
            <div className="grid grid-cols-7 mb-1">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                    <div key={d} className="text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">{d}</div>
                ))}
            </div>

            {/* Main Grid - uses flex-1 to fill vertical space */}
            <div className="flex-1 grid grid-cols-7 grid-rows-6 gap-1.5">
                {calendarGrid.flat().map((cell, index) => {
                    const { key, isPending, request, subText } = cell.statusInfo;
                    const config = getStatusConfig(key);
                    const isHidden = cell.day === null;

                    return (
                        <div
                            key={index}
                            onClick={() => isPending && onDayClick(request)}
                            className={`
                                relative h-full rounded-xl border flex flex-col items-center justify-center transition-all
                                ${isHidden ? 'invisible' : `${config.bg} ${config.border}`}
                                ${isPending ? 'cursor-pointer hover:shadow-md ring-2 ring-amber-200 ring-offset-1' : ''}
                            `}
                        >
                            {!isHidden && (
                                <>
                                    <span className={`text-xs font-bold mb-1 ${config.text}`}>{cell.day}</span>
                                    <div className={config.text}>{config.icon}</div>
                                    {subText && (
                                        <span className="absolute bottom-1 text-[8px] font-black text-amber-600 uppercase tracking-tighter">
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
            <div className="flex justify-center gap-3 mt-4 pt-3 border-t border-slate-100">
                {['Present', 'Absent', 'Pending', 'Leave', 'Holiday'].map(label => {
                    const key = label === 'Leave' ? 'On Leave' : label;
                    const conf = getStatusConfig(key);
                    return (
                        <div key={label} className="flex items-center gap-1.5">
                            <div className={`${conf.text} scale-75`}>{conf.icon}</div>
                            <span className="text-[10px] font-bold text-slate-500">{label}</span>
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

    // ... fetchDataForUserAndMonth and other logic stays same ...
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
            // ... setHolidays and leaveDays logic ...
        } catch (err) {
            setError('Failed to load data.');
        } finally {
            setLoading(false);
        }
    }, [user?.userIdentifier, selectedUsername]);

    useEffect(() => {
        if (isOpen && selectedUsername) fetchDataForUserAndMonth(currentMonthDate);
    }, [isOpen, selectedUsername, currentMonthDate, fetchDataForUserAndMonth]);

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Review: ${selectedUsername}`} size="custom">
            <div 
                className="bg-white flex flex-col p-6 overflow-hidden" 
                style={{ width: '756px', height: '567px' }}
            >
                {/* Fixed Header */}
                <div className="flex justify-between items-center mb-4 bg-slate-50 p-2 rounded-xl">
                    <button onClick={() => setCurrentMonthDate(new Date(currentMonthDate.setUTCMonth(currentMonthDate.getUTCMonth() - 1)))} className="p-1 hover:bg-white rounded-lg transition-colors shadow-sm">
                        <ChevronLeft className="w-5 h-5 text-slate-600" />
                    </button>
                    <h3 className="text-lg font-black text-slate-800 tracking-tight">
                        {currentMonthDate.toLocaleString('default', { month: 'long', year: 'numeric', timeZone: 'UTC' })}
                    </h3>
                    <button onClick={() => setCurrentMonthDate(new Date(currentMonthDate.setUTCMonth(currentMonthDate.getUTCMonth() + 1)))} className="p-1 hover:bg-white rounded-lg transition-colors shadow-sm">
                        <ChevronRight className="w-5 h-5 text-slate-600" />
                    </button>
                </div>

                {/* Content Area - stretches to fill */}
                {loading || actionLoading ? (
                    <div className="flex-1 flex flex-col justify-center items-center bg-slate-50/50 rounded-2xl border-2 border-dashed border-slate-200">
                        <Spinner size="10"/>
                        <p className="mt-4 text-sm font-bold text-slate-400 animate-pulse">Synchronizing Data...</p>
                    </div>
                ) : (
                    <CalendarDisplay
                        monthDate={currentMonthDate}
                        attendanceData={attendanceData}
                        holidays={holidays}
                        leaveDaysSet={leaveDaysSet}
                        onDayClick={() => {}} // Handle action
                        pendingRequestsMap={pendingRequestsMap} 
                    />
                )}

                {/* Footer */}
                <div className="mt-4 pt-4 border-t border-slate-100 flex justify-end">
                    <button onClick={onClose} className="px-8 py-2.5 bg-slate-900 text-white text-xs font-black rounded-xl hover:bg-slate-800 transition transform active:scale-95 shadow-lg shadow-slate-200">
                        CLOSE REVIEW
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default AttendanceApprovalModal;