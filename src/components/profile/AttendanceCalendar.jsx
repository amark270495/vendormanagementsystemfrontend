import React, { useState, useEffect, useMemo } from 'react';
import { apiService } from '../../api/apiService'; // Assuming apiService is correctly set up
import { useAuth } from '../../context/AuthContext';

// Helper to get days in a month
const getDaysInMonth = (year, month) => {
    return new Date(year, month + 1, 0).getDate();
};

// Helper to get the first day of the month (0=Sun, 1=Mon, ...)
const getFirstDayOfMonth = (year, month) => {
    return new Date(year, month, 1).getDay();
};

const AttendanceCalendar = ({ initialMonthString }) => { // Expects YYYY-MM
    const { user } = useAuth();
    const [currentMonthString, setCurrentMonthString] = useState(initialMonthString || new Date().toISOString().substring(0, 7));
    const [attendanceData, setAttendanceData] = useState({}); // Store attendance by date string (YYYY-MM-DD)
    const [holidays, setHolidays] = useState({}); // Store holidays by date string
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const year = parseInt(currentMonthString.substring(0, 4));
    const month = parseInt(currentMonthString.substring(5, 7)) - 1; // Month is 0-indexed

    // Fetch data for the current month
    useEffect(() => {
        const fetchData = async () => {
            if (!user?.userIdentifier) return;
            setLoading(true);
            setError('');
            try {
                // Fetch attendance
                const attParams = { authenticatedUsername: user.userIdentifier, month: currentMonthString };
                const attRes = await apiService.getAttendance(attParams);
                const attendanceMap = {};
                if (attRes.data.success) {
                    attRes.data.attendance.forEach(att => {
                        attendanceMap[att.date] = att.status; // Key by YYYY-MM-DD
                    });
                } else {
                    throw new Error("Failed to fetch attendance.");
                }

                // Fetch holidays
                const holParams = { year: year.toString(), authenticatedUsername: user.userIdentifier };
                const holRes = await apiService.getHolidays(holParams);
                const holidayMap = {};
                if (holRes.data.success) {
                     holRes.data.holidays.forEach(hol => {
                        // Filter holidays only for the *current* month being displayed
                        if (hol.date.startsWith(currentMonthString)) {
                           holidayMap[hol.date] = hol.description;
                        }
                    });
                } else {
                    // Don't throw error for holidays, maybe user doesn't have perms or none are set
                    console.warn("Failed to fetch holidays or none found.");
                }

                setAttendanceData(attendanceMap);
                setHolidays(holidayMap);

            } catch (err) {
                console.error("Failed to load calendar data:", err);
                setError("Could not load calendar data.");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [currentMonthString, user?.userIdentifier, year]); // Refetch when month changes

    // Memoize calendar grid generation
    const calendarGrid = useMemo(() => {
        const daysInMonth = getDaysInMonth(year, month);
        const firstDay = getFirstDayOfMonth(year, month);
        const grid = [];

        // Add empty cells for days before the 1st
        for (let i = 0; i < firstDay; i++) {
            grid.push({ key: `empty-${i}`, date: null, status: 'empty' });
        }

        // Add cells for each day of the month
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day);
            const dateString = date.toISOString().split('T')[0];
            const dayOfWeek = date.getDay();
            const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
            const holidayDescription = holidays[dateString];
            const attendanceStatus = attendanceData[dateString];
            // TODO: Integrate Leave Status here

            let status = 'empty'; // Default for future dates or days with no record
            let statusText = '';
            let tooltip = '';

            if (holidayDescription) {
                status = 'holiday';
                statusText = 'H';
                tooltip = holidayDescription;
            } else if (isWeekend) {
                status = 'weekend';
                statusText = 'W';
                 tooltip = 'Weekend';
            // TODO: Add 'On Leave' check here
            } else if (attendanceStatus === 'Present') {
                status = 'present';
                statusText = 'P';
                tooltip = 'Present';
            } else if (attendanceStatus === 'Absent') {
                status = 'absent';
                statusText = 'A';
                tooltip = 'Absent';
            } else if (date < new Date() && !isWeekend && !holidayDescription) {
                // If past date, not weekend/holiday, and no 'Present' record, assume Absent
                 status = 'absent';
                 statusText = 'A';
                 tooltip = 'Absent (Not Marked)';
            }


            grid.push({ key: dateString, date: day, status: status, statusText: statusText, tooltip: tooltip });
        }

        return grid;
    }, [year, month, attendanceData, holidays]);

    const changeMonth = (delta) => {
        const currentDate = new Date(year, month);
        currentDate.setMonth(currentDate.getMonth() + delta);
        setCurrentMonthString(currentDate.toISOString().substring(0, 7));
    };

    // --- RENDER ---
    const monthName = new Date(year, month).toLocaleString('default', { month: 'long' });
    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    const getStatusClasses = (status) => {
        switch (status) {
            case 'present': return 'bg-green-100 text-green-700 border-green-200';
            case 'absent': return 'bg-red-100 text-red-700 border-red-200';
            case 'weekend': return 'bg-gray-200 text-gray-600 border-gray-300';
            case 'holiday': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
            case 'leave': return 'bg-blue-100 text-blue-700 border-blue-200'; // Placeholder
            case 'empty': return 'bg-white border-gray-100';
            default: return 'bg-gray-50 border-gray-100';
        }
    };

    return (
        <div className="bg-white p-4 rounded-lg border shadow-sm">
            <h3 className="font-semibold text-lg text-gray-800 mb-4">Monthly Attendance Calendar</h3>

            {/* Month Navigation */}
            <div className="flex justify-between items-center mb-4">
                <button onClick={() => changeMonth(-1)} className="px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300">&lt;</button>
                <h4 className="font-semibold text-center">{monthName} {year}</h4>
                <button onClick={() => changeMonth(1)} className="px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300">&gt;</button>
            </div>

            {loading && <div className="flex justify-center p-8"><Spinner /></div>}
            {error && <div className="text-center text-red-600 p-4">{error}</div>}

            {!loading && !error && (
                <>
                    {/* Days of Week Header */}
                    <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-gray-500 mb-2">
                        {daysOfWeek.map(day => <div key={day}>{day}</div>)}
                    </div>

                    {/* Calendar Grid */}
                    <div className="grid grid-cols-7 gap-1">
                        {calendarGrid.map(cell => (
                            <div
                                key={cell.key}
                                title={cell.tooltip || ''}
                                className={`h-16 flex flex-col items-center justify-center rounded border text-center relative ${getStatusClasses(cell.status)}`}
                            >
                                {cell.date && (
                                    <>
                                        <span className="text-sm font-medium">{cell.date}</span>
                                        {cell.statusText && (
                                            <span className={`mt-1 text-xs font-bold ${cell.status === 'present' || cell.status === 'absent' || cell.status === 'leave' ? 'opacity-90' : 'opacity-70'}`}>
                                                {cell.statusText}
                                            </span>
                                        )}
                                        {cell.tooltip && cell.status === 'holiday' && (
                                            <span className="absolute bottom-1 left-1 right-1 text-[8px] text-yellow-800 truncate px-1" title={cell.tooltip}>
                                                {cell.tooltip}
                                            </span>
                                        )}
                                    </>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Legend */}
                    <div className="mt-4 flex flex-wrap justify-center gap-x-4 gap-y-2 text-xs text-gray-600">
                        <span className="flex items-center"><span className="w-3 h-3 rounded-full bg-green-100 border border-green-200 mr-1.5"></span> Present (P)</span>
                        <span className="flex items-center"><span className="w-3 h-3 rounded-full bg-red-100 border border-red-200 mr-1.5"></span> Absent (A)</span>
                        <span className="flex items-center"><span className="w-3 h-3 rounded-full bg-gray-200 border border-gray-300 mr-1.5"></span> Weekend (W)</span>
                        <span className="flex items-center"><span className="w-3 h-3 rounded-full bg-yellow-100 border border-yellow-200 mr-1.5"></span> Holiday (H)</span>
                        {/* <span className="flex items-center"><span className="w-3 h-3 rounded-full bg-blue-100 border border-blue-200 mr-1.5"></span> On Leave (L)</span> */}
                    </div>
                </>
            )}
        </div>
    );
};

export default AttendanceCalendar;