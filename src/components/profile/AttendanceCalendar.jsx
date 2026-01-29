import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { apiService } from '../../api/apiService';
import Spinner from '../Spinner';
import { 
    ChevronLeft, 
    ChevronRight, 
    CheckCircle2, 
    XCircle, 
    Coffee, 
    Palmtree, 
    CalendarOff 
} from 'lucide-react';

const AttendanceCalendar = ({ initialMonthString }) => {
    const { user } = useAuth();
    
    // Logic State
    const [currentMonthDate, setCurrentMonthDate] = useState(() => {
        const [year, month] = initialMonthString.split('-').map(Number);
        return new Date(Date.UTC(year, month - 1, 1));
    });
    const [attendanceData, setAttendanceData] = useState({});
    const [holidays, setHolidays] = useState({});
    const [leaveDaysSet, setLeaveDaysSet] = useState(new Set());
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

            // 1. Fetch Attendance
            const attendanceRes = await apiService.getAttendance({
                authenticatedUsername: user.userIdentifier,
                username: user.userIdentifier,
                month: monthString
            });
            
            const attendanceMap = {};
            if (attendanceRes.data.success && Array.isArray(attendanceRes.data.attendanceRecords)) {
                attendanceRes.data.attendanceRecords.forEach(att => {
                    attendanceMap[att.date] = att.status;
                });
            }
            setAttendanceData(attendanceMap);

            // 2. Fetch Holidays
            const holidaysRes = await apiService.getHolidays({
                authenticatedUsername: user.userIdentifier,
                year: year.toString()
            });
            const holidaysMap = {};
            if (holidaysRes.data.success && Array.isArray(holidaysRes.data.holidays)) {
                holidaysRes.data.holidays.forEach(h => {
                    holidaysMap[h.date] = h.description;
                });
            }
            setHolidays(holidaysMap);

            // 3. Fetch Approved Leave
            const leaveRes = await apiService.getLeaveRequests({
                authenticatedUsername: user.userIdentifier,
                targetUsername: user.userIdentifier,
                statusFilter: 'Approved',
                startDateFilter: `${monthString}-01`,
                endDateFilter: `${monthString}-${monthEndDay.toString().padStart(2, '0')}`
            });

            const newLeaveDaysSet = new Set();
            if (leaveRes.data.success && Array.isArray(leaveRes.data.requests)) {
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

        } catch (err) {
            const errorMsg = err.response?.data?.message || err.message || 'Failed to load calendar data.';
            setError(errorMsg);
            setAttendanceData({});
            setHolidays({});
            setLeaveDaysSet(new Set());
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

    // UI Configuration for Statuses
    const getStatusConfig = (statusKey) => {
        const configs = {
            'On Leave': { 
                bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700', 
                icon: <Palmtree className="w-4 h-4" />, label: 'Leave' 
            },
            'Weekend': { 
                bg: 'bg-slate-50', border: 'border-slate-100', text: 'text-slate-400', 
                icon: <Coffee className="w-4 h-4" />, label: 'Weekend' 
            },
            'Holiday': { 
                bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', 
                icon: <CalendarOff className="w-4 h-4" />, label: 'Holiday' 
            },
            'Present': { 
                bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', 
                icon: <CheckCircle2 className="w-4 h-4" />, label: 'Present' 
            },
            'Absent': { 
                bg: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-700', 
                icon: <XCircle className="w-4 h-4" />, label: 'Absent' 
            },
            'Future': { 
                bg: 'bg-white', border: 'border-gray-100', text: 'text-gray-400', 
                icon: null, label: '' 
            },
            'Empty': { bg: 'bg-transparent', border: 'border-transparent', text: '', icon: null }
        };
        return configs[statusKey] || configs['Future'];
    };

    const getDayStatus = (day) => {
        const year = currentMonthDate.getUTCFullYear();
        const month = currentMonthDate.getUTCMonth();
        const date = new Date(Date.UTC(year, month, day));
        const dateKey = date.toISOString().split('T')[0];
        const dayOfWeek = date.getUTCDay();
        const today = new Date();
        today.setUTCHours(0, 0, 0, 0);

        if (leaveDaysSet.has(dateKey)) return { status: 'On Leave' };
        if (dayOfWeek === 0 || dayOfWeek === 6) return { status: 'Weekend' };
        if (holidays[dateKey]) return { status: 'Holiday', description: holidays[dateKey] };
        
        const attendanceStatus = attendanceData[dateKey];
        if (attendanceStatus === 'Present') return { status: 'Present' };
        if (attendanceStatus === 'Absent') return { status: 'Absent' };
        if (date < today) return { status: 'Absent' };

        return { status: 'Future' };
    };

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
    }, [currentMonthDate, attendanceData, holidays, leaveDaysSet]);

    const monthName = currentMonthDate.toLocaleString('default', { month: 'long', year: 'numeric', timeZone: 'UTC' });

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {/* Header */}
            <div className="flex justify-between items-center p-4 border-b border-gray-100 bg-gray-50/50">
                <button 
                    onClick={() => changeMonth(-1)} 
                    className="p-2 rounded-full hover:bg-white hover:shadow-sm text-gray-500 hover:text-indigo-600 transition-all"
                >
                    <ChevronLeft size={20} />
                </button>
                <h3 className="text-lg font-bold text-gray-800 tracking-tight">{monthName}</h3>
                <button 
                    onClick={() => changeMonth(1)} 
                    className="p-2 rounded-full hover:bg-white hover:shadow-sm text-gray-500 hover:text-indigo-600 transition-all"
                >
                    <ChevronRight size={20} />
                </button>
            </div>

            <div className="p-4">
                {loading && (
                    <div className="flex flex-col justify-center items-center h-64 text-gray-400">
                        <Spinner />
                        <span className="mt-2 text-sm">Loading attendance...</span>
                    </div>
                )}
                
                {error && (
                    <div className="bg-red-50 text-red-600 p-4 rounded-lg text-sm border border-red-100 text-center">
                        {error}
                    </div>
                )}

                {!loading && !error && (
                    <>
                        {/* Days Header */}
                        <div className="grid grid-cols-7 mb-2">
                            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                                <div key={day} className="text-center text-xs font-semibold text-gray-400 uppercase tracking-wider py-2">
                                    {day}
                                </div>
                            ))}
                        </div>

                        {/* Calendar Grid */}
                        <div className="flex flex-col gap-1">
                            {calendarGrid.map((week, rowIndex) => (
                                <div key={rowIndex} className="grid grid-cols-7 gap-1">
                                    {week.map((cell, cellIndex) => {
                                        const config = getStatusConfig(cell.statusInfo.status);
                                        const isHidden = cell.day === null;

                                        return (
                                            <div
                                                key={cellIndex}
                                                className={`
                                                    relative h-20 sm:h-24 rounded-lg border transition-all duration-200
                                                    flex flex-col items-center justify-start pt-2
                                                    ${isHidden ? 'invisible' : `${config.bg} ${config.border} hover:shadow-md cursor-default`}
                                                `}
                                                title={cell.statusInfo.description || config.label}
                                            >
                                                {!isHidden && (
                                                    <>
                                                        <span className={`text-sm font-medium ${config.text} absolute top-2 right-2`}>
                                                            {cell.day}
                                                        </span>
                                                        
                                                        <div className="flex-1 flex flex-col items-center justify-center">
                                                            <div className={`${config.text} opacity-90`}>
                                                                {config.icon}
                                                            </div>
                                                            <span className={`text-[10px] font-bold mt-1 uppercase ${config.text}`}>
                                                                {config.label}
                                                            </span>
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            ))}
                        </div>

                        {/* Legend */}
                        <div className="mt-6 flex flex-wrap justify-center gap-3 border-t border-gray-100 pt-4">
                            {[
                                { status: 'Present', label: 'Present' },
                                { status: 'Absent', label: 'Absent' },
                                { status: 'On Leave', label: 'Leave' },
                                { status: 'Holiday', label: 'Holiday' },
                                { status: 'Weekend', label: 'Weekend' }
                            ].map(item => {
                                const config = getStatusConfig(item.status);
                                return (
                                    <div key={item.status} className={`flex items-center px-3 py-1 rounded-full border ${config.bg} ${config.border}`}>
                                        <div className={`${config.text} mr-2`}>{config.icon}</div>
                                        <span className={`text-xs font-medium ${config.text}`}>{item.label}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default AttendanceCalendar;