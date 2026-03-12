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
    Briefcase // Added for the 'Approved' icon
} from 'lucide-react';

const AttendanceCalendar = ({ initialMonthString }) => {
    const { user } = useAuth();
    
    // --- Logic State ---
    const [currentMonthDate, setCurrentMonthDate] = useState(() => {
        const [year, month] = initialMonthString.split('-').map(Number);
        return new Date(Date.UTC(year, month - 1, 1));
    });
    const [attendanceData, setAttendanceData] = useState({});
    const [holidays, setHolidays] = useState({});
    const [leaveDaysSet, setLeaveDaysSet] = useState(new Set());
    const [approvedWeekends, setApprovedWeekends] = useState(new Set()); // NEW STATE
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // --- Data Fetching ---
    const fetchData = useCallback(async (monthDate) => {
        if (!user?.userIdentifier) return;
        setLoading(true);
        setError('');
        try {
            const year = monthDate.getUTCFullYear();
            const month = (monthDate.getUTCMonth() + 1).toString().padStart(2, '0');
            const monthString = `${year}-${month}`;
            const monthEndDay = new Date(Date.UTC(year, monthDate.getUTCMonth() + 1, 0)).getUTCDate();

            // 1. Attendance, Holidays, Leaves, and Weekend Approvals
            const [attendanceRes, holidaysRes, leaveRes, weekendRes] = await Promise.all([
                apiService.getAttendance({
                    authenticatedUsername: user.userIdentifier,
                    username: user.userIdentifier,
                    month: monthString
                }).catch(() => null),
                apiService.getHolidays({
                    authenticatedUsername: user.userIdentifier,
                    year: year.toString()
                }).catch(() => null),
                apiService.getLeaveRequests({
                    authenticatedUsername: user.userIdentifier,
                    targetUsername: user.userIdentifier,
                    statusFilter: 'Approved',
                    startDateFilter: `${monthString}-01`,
                    endDateFilter: `${monthString}-${monthEndDay.toString().padStart(2, '0')}`
                }).catch(() => null),
                apiService.getWeekendWorkRequests({ 
                    authenticatedUsername: user.userIdentifier 
                }).catch(() => null)
            ]);

            // Map Attendance
            const attendanceMap = {};
            if (attendanceRes?.data?.success && Array.isArray(attendanceRes.data.attendanceRecords)) {
                attendanceRes.data.attendanceRecords.forEach(att => attendanceMap[att.date] = att.status);
            }
            setAttendanceData(attendanceMap);

            // Map Holidays
            const holidaysMap = {};
            if (holidaysRes?.data?.success && Array.isArray(holidaysRes.data.holidays)) {
                holidaysRes.data.holidays.forEach(h => holidaysMap[h.date] = h.description);
            }
            setHolidays(holidaysMap);

            // Map Approved Leave
            const newLeaveDaysSet = new Set();
            if (leaveRes?.data?.success && Array.isArray(leaveRes.data.requests)) {
                leaveRes.data.requests.forEach(req => {
                    const start = new Date(req.startDate + 'T00:00:00Z');
                    const end = new Date(req.endDate + 'T00:00:00Z');
                    for (let d = new Date(start); d <= end; d.setUTCDate(d.getUTCDate() + 1)) {
                        if (d.getUTCFullYear() === year && d.getUTCMonth() === monthDate.getUTCMonth()) {
                            newLeaveDaysSet.add(d.toISOString().split('T')[0]);
                        }
                    }
                });
            }
            setLeaveDaysSet(newLeaveDaysSet);

            // Map Approved Weekends
            const approvedWknds = new Set();
            if (weekendRes?.data?.success && Array.isArray(weekendRes.data.requests)) {
                 weekendRes.data.requests.forEach(req => {
                     // Check if this specific user has an 'Approved' weekend request
                     if (req.partitionKey === user.userIdentifier && req.status === 'Approved') {
                         approvedWknds.add(req.date);
                     }
                 });
            }
            setApprovedWeekends(approvedWknds);

        } catch (err) {
            setError(err.response?.data?.message || err.message || 'Failed to load data.');
        } finally {
            setLoading(false);
        }
    }, [user?.userIdentifier]);

    useEffect(() => {
        const [year, month] = initialMonthString.split('-').map(Number);
        const initialDate = new Date(Date.UTC(year, month - 1, 1));
        setCurrentMonthDate(initialDate);
        fetchData(initialDate);
    }, [initialMonthString, fetchData]);

    const changeMonth = (offset) => {
        setCurrentMonthDate(prev => {
            const newDate = new Date(prev);
            newDate.setUTCMonth(newDate.getUTCMonth() + offset, 1);
            fetchData(newDate);
            return newDate;
        });
    };

    // --- Modern UI Config ---
    const getStatusConfig = (statusKey) => {
        // Modern pastel palette with subtle borders
        const configs = {
            'Present': { 
                bg: 'bg-emerald-50/80', border: 'border-emerald-100', text: 'text-emerald-700', 
                icon: <Check className="w-5 h-5" strokeWidth={3} />, label: 'Present' 
            },
            'Absent': { 
                bg: 'bg-rose-50/80', border: 'border-rose-100', text: 'text-rose-600', 
                icon: <X className="w-5 h-5" strokeWidth={3} />, label: 'Absent' 
            },
            'Pending': { 
                bg: 'bg-amber-50/80', border: 'border-amber-200 border-dashed', text: 'text-amber-600', 
                icon: <div className="w-4 h-4 rounded-full border-2 border-amber-500 border-t-transparent animate-spin" />, label: 'Pending' 
            },
            'On Leave': { 
                bg: 'bg-violet-50/80', border: 'border-violet-100', text: 'text-violet-600', 
                icon: <Palmtree className="w-5 h-5" />, label: 'Leave' 
            },
            'Holiday': { 
                bg: 'bg-orange-50/80', border: 'border-orange-100', text: 'text-orange-600', 
                icon: <Calendar className="w-5 h-5" />, label: 'Holiday' 
            },
            'ApprovedWeekend': { 
                bg: 'bg-indigo-50/80', border: 'border-indigo-100', text: 'text-indigo-600', 
                icon: <Briefcase className="w-4 h-4" />, label: 'Apprvd' 
            },
            'Weekend': { 
                bg: 'bg-slate-50/50', border: 'border-transparent', text: 'text-slate-300', 
                icon: <Coffee className="w-4 h-4 opacity-50" />, label: 'Weekend' 
            },
            'Future': { 
                bg: 'bg-white', border: 'border-slate-100', text: 'text-slate-300', 
                icon: null, label: '' 
            },
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
        today.setUTCHours(0, 0, 0, 0);

        // Priority 1: Leave
        if (leaveDaysSet.has(dateKey)) return { status: 'On Leave' };
        
        // Priority 2: Holiday
        if (holidays[dateKey]) return { status: 'Holiday', description: holidays[dateKey] };
        
        // Priority 3: Explicit Attendance Records (Overides Approved Weekend 'Apprvd' badge if they actually worked)
        const attendanceStatus = attendanceData[dateKey];
        if (attendanceStatus === 'Present') return { status: 'Present' };
        if (attendanceStatus === 'Pending') return { status: 'Pending' };
        if (attendanceStatus === 'Absent' || attendanceStatus === 'Rejected') return { status: 'Absent' };

        // Priority 4: Weekends
        if (dayOfWeek === 0 || dayOfWeek === 6) {
            if (approvedWeekends.has(dateKey)) {
                if (date < today) return { status: 'Absent', description: 'Approved but missed shift' }; // Auto-absent for past approved weekends they didn't mark
                return { status: 'ApprovedWeekend', description: 'Approved for Weekend Work' };
            }
            return { status: 'Weekend' };
        }

        // Priority 5: Auto-Absent for standard past days
        if (date < today) return { status: 'Absent' }; 

        return { status: 'Future' };
    }, [currentMonthDate, attendanceData, holidays, leaveDaysSet, approvedWeekends]);

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
                if (i === 0 && j < firstDayOfMonth) {
                    week.push({ day: null, statusInfo: { status: 'Empty' } });
                } else if (dayCounter <= daysInMonth) {
                    week.push({ day: dayCounter, statusInfo: getDayStatus(dayCounter) });
                    dayCounter++;
                } else {
                    week.push({ day: null, statusInfo: { status: 'Empty' } });
                }
            }
            if (week.some(cell => cell.day !== null)) grid.push(week);
            if (dayCounter > daysInMonth) break;
        }
        return grid;
    }, [currentMonthDate, getDayStatus]);

    const monthName = currentMonthDate.toLocaleString('default', { month: 'long', year: 'numeric', timeZone: 'UTC' });

    return (
        <div className="flex flex-col gap-6 h-full">
            
            {/* 1. Header Control Bar */}
            <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-4 bg-white p-1.5 pr-6 rounded-full shadow-sm border border-gray-200">
                    <div className="flex gap-1">
                        <button 
                            onClick={() => changeMonth(-1)} 
                            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-500 hover:text-indigo-600 transition-colors"
                        >
                            <ChevronLeft size={18} />
                        </button>
                        <button 
                            onClick={() => changeMonth(1)} 
                            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-500 hover:text-indigo-600 transition-colors"
                        >
                            <ChevronRight size={18} />
                        </button>
                    </div>
                    <span className="text-lg font-bold text-slate-800 tracking-tight min-w-[140px] text-center select-none">
                        {monthName}
                    </span>
                </div>
            </div>

            {/* 2. Main Calendar Card */}
            <div className="bg-white rounded-3xl border border-slate-100 p-2 sm:p-6 flex-1 flex flex-col">
                
                {/* Days of Week */}
                <div className="grid grid-cols-7 mb-4">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                        <div key={day} className="text-center">
                            <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest">
                                {day}
                            </span>
                        </div>
                    ))}
                </div>

                {/* Content Area */}
                {loading ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-400 gap-3 min-h-[300px]">
                        <Spinner />
                        <span className="text-sm font-medium animate-pulse">Syncing calendar...</span>
                    </div>
                ) : error ? (
                    <div className="flex-1 flex items-center justify-center min-h-[300px]">
                        <div className="bg-rose-50 text-rose-600 px-6 py-4 rounded-xl text-sm font-medium border border-rose-100">
                            {error}
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col gap-2 sm:gap-3 flex-1">
                        {calendarGrid.map((week, i) => (
                            <div key={i} className="grid grid-cols-7 gap-2 sm:gap-3 flex-1">
                                {week.map((cell, j) => {
                                    const { status, description } = cell.statusInfo;
                                    const config = getStatusConfig(status);
                                    
                                    if (cell.day === null) return <div key={j} className="invisible" />;

                                    return (
                                        <div 
                                            key={j}
                                            className={`
                                                relative group flex-1 min-h-[3.5rem] sm:min-h-[5.5rem] 
                                                rounded-xl sm:rounded-2xl border ${config.bg} ${config.border} 
                                                flex flex-col items-center justify-center 
                                                transition-all duration-300 ease-out
                                                ${status !== 'Weekend' && status !== 'Future' ? 'hover:-translate-y-1 hover:shadow-md cursor-default' : ''}
                                            `}
                                            title={description || config.label}
                                        >
                                            {/* Date Number */}
                                            <span className={`
                                                absolute top-1.5 left-2 sm:top-2 sm:left-3 text-[10px] sm:text-xs font-bold 
                                                ${status === 'Future' ? 'text-slate-300' : 'text-slate-500'}
                                            `}>
                                                {cell.day}
                                            </span>

                                            {/* Icon / Status */}
                                            {status !== 'Future' && (
                                                <div className={`
                                                    transform transition-transform duration-300 group-hover:scale-110 mt-2 sm:mt-0
                                                    ${config.text}
                                                `}>
                                                    {config.icon}
                                                </div>
                                            )}

                                            {/* Label (Desktop only) */}
                                            {status !== 'Weekend' && status !== 'Future' && (
                                                <span className={`
                                                    hidden sm:block text-[9px] font-bold uppercase mt-1 tracking-wide opacity-0 group-hover:opacity-100 transition-opacity duration-200
                                                    ${config.text}
                                                `}>
                                                    {config.label}
                                                </span>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* 3. Modern Legend */}
            <div className="flex flex-wrap justify-center gap-3 px-2">
                {[
                    { key: 'Present', label: 'Present' },
                    { key: 'Absent', label: 'Absent' },
                    { key: 'Pending', label: 'Pending' },
                    { key: 'On Leave', label: 'Leave' },
                    { key: 'Holiday', label: 'Holiday' },
                ].map(item => {
                    const conf = getStatusConfig(item.key);
                    return (
                        <div key={item.key} className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-full border border-slate-200 shadow-sm">
                            <div className={`p-1 rounded-full ${conf.bg} ${conf.text}`}>
                                {React.cloneElement(conf.icon, { className: "w-3 h-3" })}
                            </div>
                            <span className="text-[10px] sm:text-xs font-bold text-slate-600">{item.label}</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default AttendanceCalendar;