import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { apiService } from '../../api/apiService';
import Spinner from '../Spinner';
import { 
    ChevronLeft, 
    ChevronRight, 
    Check, 
    X, 
    Coffee, 
    Palmtree, 
    Calendar,
    Briefcase,
    Clock
} from 'lucide-react';

const formatMsToTime = (ms) => {
    if (!ms || ms <= 0) return "0h 0m";
    const h = Math.floor(ms / (1000 * 60 * 60));
    const m = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    return `${h}h ${m}m`;
};

const AttendanceCalendar = ({ initialMonthString, onMonthChange, onDayClick }) => {
    const { user } = useAuth();
    const [currentMonthDate, setCurrentMonthDate] = useState(() => {
        const [year, month] = initialMonthString.split('-').map(Number);
        return new Date(Date.UTC(year, month - 1, 1));
    });
    
    const [attendanceData, setAttendanceData] = useState({});
    const [holidays, setHolidays] = useState({});
    const [leaveDaysMap, setLeaveDaysMap] = useState({});
    const [approvedWeekends, setApprovedWeekends] = useState(new Set());
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchData = useCallback(async (monthDate) => {
        if (!user?.userIdentifier) return;
        setLoading(true);
        setError('');
        try {
            const year = monthDate.getUTCFullYear();
            const month = (monthDate.getUTCMonth() + 1).toString().padStart(2, '0');
            const monthString = `${year}-${month}`;
            const monthEndDay = new Date(Date.UTC(year, monthDate.getUTCMonth() + 1, 0)).getUTCDate();

            // Trigger callback to ProfilePage so the Statistics Row updates for the new month
            if (onMonthChange) onMonthChange(monthString, monthEndDay);

            const [attendanceRes, holidaysRes, leaveRes, weekendRes] = await Promise.all([
                apiService.getAttendance({ authenticatedUsername: user.userIdentifier, username: user.userIdentifier, month: monthString }),
                apiService.getHolidays({ authenticatedUsername: user.userIdentifier, year: year.toString() }),
                apiService.getLeaveRequests({ authenticatedUsername: user.userIdentifier, targetUsername: user.userIdentifier, startDateFilter: `${monthString}-01`, endDateFilter: `${monthString}-${monthEndDay.toString().padStart(2, '0')}` }),
                apiService.getWeekendWorkRequests({ authenticatedUsername: user.userIdentifier }).catch(() => null)
            ]);

            const attMap = {};
            if (attendanceRes?.data?.success && Array.isArray(attendanceRes.data.attendanceRecords)) {
                attendanceRes.data.attendanceRecords.forEach(att => attMap[att.date] = att);
            }
            setAttendanceData(attMap);

            const holMap = {};
            if (holidaysRes?.data?.success && Array.isArray(holidaysRes.data.holidays)) {
                holidaysRes.data.holidays.forEach(h => holMap[h.date] = h.description);
            }
            setHolidays(holMap);

            const lMap = {};
            if (leaveRes?.data?.success && Array.isArray(leaveRes.data.requests)) {
                leaveRes.data.requests.forEach(req => {
                    if (req.status === 'Approved' || req.status === 'Pending') {
                        const start = new Date(req.startDate + 'T00:00:00Z');
                        const end = new Date(req.endDate + 'T00:00:00Z');
                        for (let d = new Date(start); d <= end; d.setUTCDate(d.getUTCDate() + 1)) {
                            const dayOfWeek = d.getUTCDay();
                            if (dayOfWeek !== 0 && dayOfWeek !== 6) { // No-Sandwich Policy Fix[cite: 1]
                                if (d.getUTCFullYear() === year && d.getUTCMonth() === monthDate.getUTCMonth()) {
                                    const dateKey = d.toISOString().split('T')[0];
                                    if (lMap[dateKey] !== 'Approved') lMap[dateKey] = req.status;
                                }
                            }
                        }
                    }
                });
            }
            setLeaveDaysMap(lMap);

            const approvedWknds = new Set();
            if (weekendRes?.data?.success && Array.isArray(weekendRes.data.requests)) {
                 weekendRes.data.requests.forEach(req => {
                     if (req.partitionKey === user.userIdentifier && req.status === 'Approved') approvedWknds.add(req.date);
                 });
            }
            setApprovedWeekends(approvedWknds);
        } catch (err) {
            setError('Failed to load monthly records.');
        } finally { setLoading(false); }
    }, [user?.userIdentifier, onMonthChange]);

    useEffect(() => { fetchData(currentMonthDate); }, [currentMonthDate, fetchData]);

    const changeMonth = (offset) => {
        setCurrentMonthDate(prev => {
            const newDate = new Date(prev);
            newDate.setUTCMonth(newDate.getUTCMonth() + offset, 1);
            return newDate;
        });
    };

    const getStatusConfig = (statusKey) => {
        const configs = {
            'Present': { bg: 'bg-emerald-50/80', border: 'border-emerald-100', text: 'text-emerald-700', icon: <Check className="w-4 h-4" strokeWidth={3} />, label: 'Present' },
            'Absent': { bg: 'bg-rose-50/80', border: 'border-rose-100', text: 'text-rose-600', icon: <X className="w-4 h-4" strokeWidth={3} />, label: 'Absent' },
            'Pending': { bg: 'bg-amber-50/80', border: 'border-amber-200 border-dashed', text: 'text-amber-600', icon: <Clock className="w-4 h-4 animate-pulse" />, label: 'Pending' },
            'On Leave': { bg: 'bg-violet-50/80', border: 'border-violet-100', text: 'text-violet-600', icon: <Palmtree className="w-4 h-4" />, label: 'Leave' },
            'Leave Requested': { bg: 'bg-fuchsia-50/80', border: 'border-fuchsia-200 border-dashed', text: 'text-fuchsia-600', icon: <Palmtree className="w-4 h-4 opacity-50" />, label: 'Req Leave' },
            'Holiday': { bg: 'bg-orange-50/80', border: 'border-orange-100', text: 'text-orange-600', icon: <Calendar className="w-4 h-4" />, label: 'Holiday' },
            'ApprovedWeekend': { bg: 'bg-indigo-50/80', border: 'border-indigo-100', text: 'text-indigo-600', icon: <Briefcase className="w-4 h-4" />, label: 'Apprvd' },
            'Weekend': { bg: 'bg-slate-50/50', border: 'border-transparent', text: 'text-slate-300', icon: <Coffee className="w-4 h-4 opacity-50" />, label: 'Weekend' },
            'Future': { bg: 'bg-white', border: 'border-slate-100', text: 'text-slate-300', icon: null, label: '' },
            'Empty': { bg: 'invisible', border: '', text: '', icon: null }
        };
        return configs[statusKey] || configs['Future'];
    };

    const getDayStatus = useCallback((day) => {
        const year = currentMonthDate.getUTCFullYear();
        const month = currentMonthDate.getUTCMonth();
        const date = new Date(Date.UTC(year, month, day));
        if (date.getUTCMonth() !== month) return { status: 'Empty' };
        
        const dateKey = date.toISOString().split('T')[0];
        const dayOfWeek = date.getUTCDay();
        const today = new Date();
        today.setUTCHours(0,0,0,0);

        const leaveStatus = leaveDaysMap[dateKey];
        if (leaveStatus === 'Approved') return { status: 'On Leave' };
        if (leaveStatus === 'Pending') return { status: 'Leave Requested' };
        if (holidays[dateKey]) return { status: 'Holiday' };

        const attendance = attendanceData[dateKey];
        if (attendance?.status === 'Present') return { status: 'Present', record: attendance };
        if (attendance?.status === 'Pending') return { status: 'Pending', record: attendance };
        if (attendance?.status === 'Absent' || attendance?.status === 'Rejected') return { status: 'Absent', record: attendance };

        if (dayOfWeek === 0 || dayOfWeek === 6) {
            if (approvedWeekends.has(dateKey)) return { status: 'ApprovedWeekend' };
            return { status: 'Weekend' };
        }
        return (date < today) ? { status: 'Absent' } : { status: 'Future' };
    }, [currentMonthDate, attendanceData, holidays, leaveDaysMap, approvedWeekends]);

    const calendarGrid = useMemo(() => {
        const year = currentMonthDate.getUTCFullYear();
        const month = currentMonthDate.getUTCMonth();
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
    }, [currentMonthDate, getDayStatus]);

    const monthName = currentMonthDate.toLocaleString('default', { month: 'long', year: 'numeric', timeZone: 'UTC' });

    return (
        <div className="flex flex-col gap-6 h-full">
            {/* 1. Header Navigation Bar[cite: 1] */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-6">
                <div className="flex items-center gap-4">
                    <button onClick={() => changeMonth(-1)} className="p-2.5 bg-slate-50 text-slate-500 rounded-xl hover:bg-slate-100 hover:text-indigo-600 transition-colors" disabled={loading}><ChevronLeft size={20} /></button>
                    <div>
                        <h3 className="text-xl font-extrabold text-slate-800">{monthName}</h3>
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-0.5">Timesheet History</p>
                    </div>
                    <button onClick={() => changeMonth(1)} className="p-2.5 bg-slate-50 text-slate-500 rounded-xl hover:bg-slate-100 hover:text-indigo-600 transition-colors" disabled={loading}><ChevronRight size={20} /></button>
                </div>
                
                <button onClick={() => fetchData(currentMonthDate)} className="px-5 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-sm font-bold rounded-xl flex items-center justify-center transition-colors">
                    <Clock size={16} className="mr-2" /> Sync Records
                </button>
            </div>

            {loading ? (
                <div className="flex-1 flex flex-col items-center justify-center py-20 text-slate-400">
                    <Spinner size="10" /><p className="text-sm font-bold animate-pulse mt-4">FETCHING RECORDS...</p>
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-7 gap-2 mb-2">
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                            <div key={d} className="text-center text-[10px] font-bold text-slate-300 uppercase tracking-widest">{d}</div>
                        ))}
                    </div>
                    <div className="grid grid-cols-7 gap-3 flex-1">
                        {calendarGrid.flat().map((cell, idx) => {
                            if (cell.day === null) return <div key={idx} className="invisible" />;
                            const config = getStatusConfig(cell.statusInfo.status);
                            const record = cell.statusInfo.record;
                            const dateKey = dateKeyFromDay(cell.day, currentMonthDate);

                            return (
                                <div key={idx} 
                                    onClick={() => onDayClick && onDayClick(dateKey)}
                                    className={`relative h-24 sm:h-28 rounded-2xl border ${config.bg} ${config.border} flex flex-col items-center justify-center cursor-pointer transition-all hover:-translate-y-1 hover:shadow-md`}
                                >
                                    <span className="absolute top-2 left-2 text-[10px] font-bold text-slate-400">{cell.day}</span>
                                    
                                    {record && (record.standardTimeMs > 0 || record.extraTimeMs > 0) && (
                                        <div className="text-[10px] font-black text-slate-800 opacity-60 mb-1">
                                            {formatMsToTime((record.standardTimeMs || 0) + (record.extraTimeMs || 0))}
                                        </div>
                                    )}

                                    <div className={config.text}>{config.icon}</div>
                                    {config.label && <span className={`text-[9px] font-bold uppercase mt-1 ${config.text}`}>{config.label}</span>}
                                </div>
                            );
                        })}
                    </div>
                </>
            )}
        </div>
    );
};

const dateKeyFromDay = (day, monthDate) => {
    const d = new Date(Date.UTC(monthDate.getUTCFullYear(), monthDate.getUTCMonth(), day));
    return d.toISOString().split('T')[0];
};

export default AttendanceCalendar;