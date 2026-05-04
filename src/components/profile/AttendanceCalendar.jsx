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
    Clock,
    UserCheck,
    AlertCircle
} from 'lucide-react';

const formatMsToTime = (ms) => {
    if (!ms || ms <= 0) return "0h 0m";
    const h = Math.floor(ms / (1000 * 60 * 60));
    const m = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    return `${h}h ${m}m`;
};

const getISTShiftDateString = () => {
    const d = new Date();
    const istFormatter = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Kolkata', hour: 'numeric', hour12: false });
    const istHour = parseInt(istFormatter.format(d), 10);
    if (istHour < 12) d.setHours(d.getHours() - 12); 
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
};

const AttendanceCalendar = ({ initialMonthString, onMonthChange, onDayClick, selectedMarkerDate, onMarkAttendance }) => {
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
    const [actionLoading, setActionLoading] = useState(false);

    const todayStr = getISTShiftDateString();

    const fetchData = useCallback(async (monthDate) => {
        if (!user?.userIdentifier) return;
        setLoading(true);
        try {
            const year = monthDate.getUTCFullYear();
            const month = (monthDate.getUTCMonth() + 1).toString().padStart(2, '0');
            const monthString = `${year}-${month}`;
            const monthEndDay = new Date(Date.UTC(year, monthDate.getUTCMonth() + 1, 0)).getUTCDate();

            if (onMonthChange) onMonthChange(monthString, monthEndDay);

            const [attendanceRes, holidaysRes, leaveRes, weekendRes] = await Promise.all([
                apiService.getAttendance({ authenticatedUsername: user.userIdentifier, username: user.userIdentifier, month: monthString }),
                apiService.getHolidays({ authenticatedUsername: user.userIdentifier, year: year.toString() }),
                apiService.getLeaveRequests({ authenticatedUsername: user.userIdentifier, targetUsername: user.userIdentifier, startDateFilter: `${monthString}-01`, endDateFilter: `${monthString}-${monthEndDay}` }),
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
                    const start = new Date(req.startDate + 'T00:00:00Z');
                    const end = new Date(req.endDate + 'T00:00:00Z');
                    for (let d = new Date(start); d <= end; d.setUTCDate(d.getUTCDate() + 1)) {
                        if (d.getUTCDay() !== 0 && d.getUTCDay() !== 6) {
                            lMap[d.toISOString().split('T')[0]] = req.status;
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
            console.error(err);
        } finally { setLoading(false); }
    }, [user?.userIdentifier, onMonthChange]);

    useEffect(() => { fetchData(currentMonthDate); }, [currentMonthDate, fetchData]);

    const handleQuickMark = async (status) => {
        setActionLoading(true);
        try {
            await onMarkAttendance(selectedMarkerDate, status, "");
            await fetchData(currentMonthDate);
        } catch (err) {
            alert(err.message);
        } finally { setActionLoading(false); }
    };

    const getStatusConfig = (statusKey) => {
        const configs = {
            'Present': { bg: 'bg-emerald-50/80', border: 'border-emerald-100', text: 'text-emerald-700', icon: <Check size={16} strokeWidth={3} />, label: 'Present' },
            'Absent': { bg: 'bg-rose-50/80', border: 'border-rose-100', text: 'text-rose-600', icon: <X size={16} strokeWidth={3} />, label: 'Absent' },
            'Pending': { bg: 'bg-amber-50/80', border: 'border-amber-200 border-dashed', text: 'text-amber-600', icon: <Clock size={16} className="animate-pulse" />, label: 'Pending' },
            'On Leave': { bg: 'bg-violet-50/80', border: 'border-violet-100', text: 'text-violet-600', icon: <Palmtree size={16} />, label: 'Leave' },
            'Holiday': { bg: 'bg-orange-50/80', border: 'border-orange-100', text: 'text-orange-600', icon: <Calendar size={16} />, label: 'Holiday' },
            'ApprovedWeekend': { bg: 'bg-indigo-50/80', border: 'border-indigo-100', text: 'text-indigo-600', icon: <Briefcase size={16} />, label: 'Apprvd' },
            'Weekend': { bg: 'bg-slate-50/50', border: 'border-transparent', text: 'text-slate-300', icon: <Coffee size={14} className="opacity-50" />, label: 'Weekend' },
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
        const today = new Date(); today.setUTCHours(0,0,0,0);

        const leaveStatus = leaveDaysMap[dateKey];
        if (leaveStatus === 'Approved') return { status: 'On Leave' };
        if (holidays[dateKey]) return { status: 'Holiday' };

        const attendance = attendanceData[dateKey];
        if (attendance) return { status: attendance.status, record: attendance };

        if (dayOfWeek === 0 || dayOfWeek === 6) {
            return approvedWeekends.has(dateKey) ? { status: 'ApprovedWeekend' } : { status: 'Weekend' };
        }
        return (date < today) ? { status: 'Absent' } : { status: 'Future' };
    }, [currentMonthDate, attendanceData, holidays, leaveDaysMap, approvedWeekends]);

    const calendarGrid = useMemo(() => {
        const year = currentMonthDate.getUTCFullYear();
        const month = currentMonthDate.getUTCMonth();
        const firstDay = new Date(Date.UTC(year, month, 1)).getUTCDay();
        const totalDays = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
        const grid = [];
        let dayCounter = 1;
        for (let i = 0; i < 6; i++) {
            const week = [];
            for (let j = 0; j < 7; j++) {
                if (i === 0 && j < firstDay) week.push({ day: null, statusInfo: { status: 'Empty' } });
                else if (dayCounter <= totalDays) week.push({ day: dayCounter++, statusInfo: getDayStatus(dayCounter-1) });
                else week.push({ day: null, statusInfo: { status: 'Empty' } });
            }
            if (week.some(c => c.day !== null)) grid.push(week);
        }
        return grid;
    }, [currentMonthDate, getDayStatus]);

    const activeRecord = attendanceData[selectedMarkerDate];
    const canMark = !loading && selectedMarkerDate <= todayStr && !activeRecord && !leaveDaysMap[selectedMarkerDate] && !holidays[selectedMarkerDate];

    return (
        <div className="flex flex-col gap-6 animate-fadeIn">
            {/* 1. THE STRAIGHT-LINE TOOLBAR */}
            <div className="bg-slate-900 rounded-3xl p-4 shadow-xl border border-slate-800 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="flex gap-1">
                        <button onClick={() => setCurrentMonthDate(d => new Date(d.setUTCMonth(d.getUTCMonth()-1)))} className="p-2 bg-slate-800 text-slate-400 rounded-xl hover:text-white transition-all"><ChevronLeft size={20}/></button>
                        <button onClick={() => setCurrentMonthDate(d => new Date(d.setUTCMonth(d.getUTCMonth()+1)))} className="p-2 bg-slate-800 text-slate-400 rounded-xl hover:text-white transition-all"><ChevronRight size={20}/></button>
                    </div>
                    <span className="text-white font-black tracking-tight text-lg min-w-[140px] text-center">
                        {currentMonthDate.toLocaleString('default', { month: 'long', year: 'numeric', timeZone: 'UTC' })}
                    </span>
                </div>

                <div className="h-10 w-px bg-slate-800 hidden md:block"></div>

                {/* Manual Marking Actions */}
                <div className="flex items-center gap-3 flex-1 justify-center md:justify-end">
                    <div className="relative group">
                        <input 
                            type="date" 
                            value={selectedMarkerDate} 
                            max={todayStr}
                            onChange={(e) => onDayClick(e.target.value)}
                            className="bg-slate-800 border border-slate-700 text-indigo-300 text-xs font-bold rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 outline-none transition-all cursor-pointer"
                        />
                    </div>
                    {canMark ? (
                        <div className="flex gap-2 animate-fadeIn">
                            <button onClick={() => handleQuickMark('Present')} disabled={actionLoading} className="px-4 py-2.5 bg-emerald-600 text-white text-xs font-black rounded-xl hover:bg-emerald-500 shadow-lg transition-all flex items-center gap-2">
                                <UserCheck size={14}/> MARK PRESENT
                            </button>
                            <button onClick={() => handleQuickMark('Absent')} disabled={actionLoading} className="px-4 py-2.5 bg-rose-600 text-white text-xs font-black rounded-xl hover:bg-rose-500 shadow-lg transition-all flex items-center gap-2">
                                <AlertCircle size={14}/> MARK ABSENT
                            </button>
                        </div>
                    ) : (
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest bg-slate-800/50 px-4 py-2.5 rounded-xl border border-slate-800">
                            {activeRecord ? `Status: ${activeRecord.status}` : 'Date Locked'}
                        </span>
                    )}
                </div>
            </div>

            {/* 2. THE MODERNIZED CALENDAR VIEW */}
            <div className="bg-white p-2 sm:p-6 rounded-[2.5rem] border border-slate-100 shadow-sm">
                <div className="grid grid-cols-7 gap-2 mb-4">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                        <div key={d} className="text-center text-[10px] font-black text-slate-300 uppercase tracking-widest">{d}</div>
                    ))}
                </div>
                {loading ? (
                    <div className="flex justify-center items-center py-40"><Spinner size="10"/></div>
                ) : (
                    <div className="grid grid-cols-7 gap-3">
                        {calendarGrid.flat().map((cell, idx) => {
                            if (cell.day === null) return <div key={idx} className="invisible" />;
                            const config = getStatusConfig(cell.statusInfo.status);
                            const record = cell.statusInfo.record;
                            const isSelected = selectedMarkerDate === dateKeyFromDay(cell.day, currentMonthDate);

                            return (
                                <div key={idx} 
                                    onClick={() => onDayClick(dateKeyFromDay(cell.day, currentMonthDate))}
                                    className={`relative h-24 sm:h-28 rounded-3xl border-2 transition-all duration-300 flex flex-col items-center justify-center cursor-pointer group hover:-translate-y-1 ${isSelected ? 'border-indigo-500 shadow-md ring-4 ring-indigo-50' : config.border} ${config.bg}`}
                                >
                                    <span className={`absolute top-3 left-3 text-[10px] font-black ${isSelected ? 'text-indigo-600' : 'text-slate-400'}`}>{cell.day}</span>
                                    
                                    {record && (record.standardTimeMs > 0 || record.extraTimeMs > 0) && (
                                        <div className="text-[10px] font-black text-slate-900/40 mb-1">
                                            {formatMsToTime((record.standardTimeMs || 0) + (record.extraTimeMs || 0))}
                                        </div>
                                    )}

                                    <div className={`${config.text} transform group-hover:scale-110 transition-transform`}>{config.icon}</div>
                                    {config.label && <span className={`text-[9px] font-black uppercase mt-1.5 tracking-tighter ${config.text}`}>{config.label}</span>}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

const dateKeyFromDay = (day, monthDate) => {
    const d = new Date(Date.UTC(monthDate.getUTCFullYear(), monthDate.getUTCMonth(), day));
    return d.toISOString().split('T')[0];
};

export default AttendanceCalendar;