import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { apiService } from '../../api/apiService';
import Spinner from '../Spinner';

const AttendanceCalendar = ({ initialMonthString }) => {
    const { user } = useAuth();
    const [currentMonthDate, setCurrentMonthDate] = useState(new Date(initialMonthString + '-01T00:00:00'));
    const [attendanceData, setAttendanceData] = useState({});
    const [holidays, setHolidays] = useState({});
    const [leaveDaysSet, setLeaveDaysSet] = useState(new Set()); // Store leave days for quick lookup
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchData = useCallback(async (monthDate) => {
        if (!user?.userIdentifier) return;
        setLoading(true);
        setError('');
        try {
            const year = monthDate.getFullYear();
            const month = (monthDate.getMonth() + 1).toString().padStart(2, '0');
            const monthString = `${year}-${month}`;

            // Fetch attendance
            const attendanceRes = await apiService.getAttendance({
                authenticatedUsername: user.userIdentifier,
                month: monthString
            });
            const attendanceMap = {};
            if (attendanceRes.data.success && attendanceRes.data.attendance) {
                attendanceRes.data.attendance.forEach(att => {
                    attendanceMap[att.dateKey] = att.status;
                });
            }
            setAttendanceData(attendanceMap);

            // Fetch holidays for the year
            const holidaysRes = await apiService.getHolidays({
                authenticatedUsername: user.userIdentifier,
                year: year.toString()
            });
            const holidaysMap = {};
            if (holidaysRes.data.success && holidaysRes.data.holidays) {
                holidaysRes.data.holidays.forEach(h => {
                    holidaysMap[h.date] = h.description;
                });
            }
            setHolidays(holidaysMap);

            // Fetch approved leave for the month
            const leaveRes = await apiService.getLeaveRequests({
                authenticatedUsername: user.userIdentifier,
                statusFilter: 'Approved',
                startDateFilter: `${monthString}-01`, // Start of the month
                endDateFilter: new Date(year, monthDate.getMonth() + 1, 0).toISOString().split('T')[0] // End of the month
            });

            const newLeaveDaysSet = new Set();
            if (leaveRes.data.success && leaveRes.data.requests) {
                leaveRes.data.requests.forEach(req => {
                    const start = new Date(req.startDate + 'T00:00:00Z'); // Ensure UTC
                    const end = new Date(req.endDate + 'T00:00:00Z');   // Ensure UTC
                    for (let d = new Date(start); d <= end; d.setUTCDate(d.getUTCDate() + 1)) {
                         // Only add dates within the current calendar month
                        if (d.getUTCFullYear() === year && d.getUTCMonth() === monthDate.getMonth()) {
                            newLeaveDaysSet.add(d.toISOString().split('T')[0]);
                        }
                    }
                });
            }
            setLeaveDaysSet(newLeaveDaysSet);

        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load calendar data.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [user?.userIdentifier]);

    useEffect(() => {
        fetchData(currentMonthDate);
    }, [fetchData, currentMonthDate]);

    const changeMonth = (offset) => {
        setCurrentMonthDate(prev => {
            const newDate = new Date(prev);
            newDate.setMonth(newDate.getMonth() + offset);
            return newDate;
        });
    };

    const getDayStatus = (day) => {
        const year = currentMonthDate.getFullYear();
        const month = currentMonthDate.getMonth();
        const date = new Date(Date.UTC(year, month, day)); // Use UTC

        if (date.getMonth() !== month) {
            return { status: 'Empty', text: '' }; // Should not happen with current grid logic
        }

        const dateKey = date.toISOString().split('T')[0];
        const dayOfWeek = date.getUTCDay(); // 0 for Sunday, 6 for Saturday
        const today = new Date();
        today.setUTCHours(0, 0, 0, 0); // Normalize today to UTC start of day

        // 1. Check Leave (Highest Priority)
        if (leaveDaysSet.has(dateKey)) {
            return { status: 'On Leave', text: 'L', color: 'bg-purple-100 text-purple-700 border-purple-200' };
        }

        // 2. Check Weekend
        if (dayOfWeek === 0 || dayOfWeek === 6) {
            return { status: 'Weekend', text: 'W', color: 'bg-gray-100 text-gray-500 border-gray-200' };
        }

        // 3. Check Holiday
        if (holidays[dateKey]) {
            return { status: 'Holiday', text: 'H', color: 'bg-yellow-100 text-yellow-700 border-yellow-200', description: holidays[dateKey] };
        }

        // 4. Check Attendance Record
        const attendanceStatus = attendanceData[dateKey];
        if (attendanceStatus === 'Present') {
            return { status: 'Present', text: 'P', color: 'bg-green-100 text-green-700 border-green-200' };
        }
        if (attendanceStatus === 'Absent') {
             return { status: 'Absent', text: 'A', color: 'bg-red-100 text-red-700 border-red-200' };
        }

        // 5. Check if it's a past working day without a record (assume Absent)
        if (date < today) {
            return { status: 'Absent', text: 'A', color: 'bg-red-100 text-red-700 border-red-200' };
        }

        // 6. Otherwise, it's a future or current working day with no record yet
        return { status: 'Future', text: '', color: 'bg-white border-gray-200' };
    };


    const calendarGrid = useMemo(() => {
        const year = currentMonthDate.getFullYear();
        const month = currentMonthDate.getMonth();
        const firstDayOfMonth = new Date(Date.UTC(year, month, 1)).getUTCDay(); // Day of the week (0-6)
        const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();

        const grid = [];
        let dayCounter = 1;

        for (let i = 0; i < 6; i++) { // Max 6 rows
            const week = [];
            for (let j = 0; j < 7; j++) {
                if (i === 0 && j < firstDayOfMonth) {
                    week.push({ day: null, statusInfo: { status: 'Empty' } }); // Empty cell before month starts
                } else if (dayCounter <= daysInMonth) {
                    week.push({ day: dayCounter, statusInfo: getDayStatus(dayCounter) });
                    dayCounter++;
                } else {
                    week.push({ day: null, statusInfo: { status: 'Empty' } }); // Empty cell after month ends
                }
            }
            grid.push(week);
            if (dayCounter > daysInMonth && i < 5) break; // Stop adding rows if month ended and not the last possible row
        }
        return grid;
    }, [currentMonthDate, attendanceData, holidays, leaveDaysSet]); // Rerun if month, attendance, holidays or leave changes


    const monthName = currentMonthDate.toLocaleString('default', { month: 'long', year: 'numeric', timeZone: 'UTC' });

    return (
        <div className="bg-white p-4 rounded-lg shadow border">
            <div className="flex justify-between items-center mb-4">
                <button onClick={() => changeMonth(-1)} className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300">&lt;</button>
                <h3 className="text-lg font-semibold">{monthName}</h3>
                <button onClick={() => changeMonth(1)} className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300">&gt;</button>
            </div>

            {loading && <div className="flex justify-center items-center h-48"><Spinner /></div>}
            {error && <div className="text-red-500 bg-red-100 p-3 rounded">Error: {error}</div>}

            {!loading && !error && (
                <>
                    <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-gray-500 mb-2">
                        <div>Sun</div><div>Mon</div><div>Tue</div><div>Wed</div><div>Thu</div><div>Fri</div><div>Sat</div>
                    </div>
                    <div className="grid grid-cols-7 gap-1">
                        {calendarGrid.flat().map((cell, index) => (
                            <div
                                key={index}
                                className={`h-16 flex flex-col items-center justify-center border rounded ${cell.statusInfo.color || 'bg-gray-50 border-gray-100'} ${cell.day === null ? 'invisible' : ''}`}
                                title={cell.statusInfo.description || cell.statusInfo.status} // Show holiday description on hover
                            >
                                <span className="text-sm">{cell.day}</span>
                                {cell.statusInfo.text && (
                                    <span className="text-xs font-bold mt-1">{cell.statusInfo.text}</span>
                                )}
                            </div>
                        ))}
                    </div>
                     <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-xs">
                        <span className="flex items-center"><span className="w-3 h-3 rounded-full bg-green-100 mr-1 border border-green-200"></span> P - Present</span>
                        <span className="flex items-center"><span className="w-3 h-3 rounded-full bg-red-100 mr-1 border border-red-200"></span> A - Absent</span>
                        <span className="flex items-center"><span className="w-3 h-3 rounded-full bg-purple-100 mr-1 border border-purple-200"></span> L - On Leave</span>
                        <span className="flex items-center"><span className="w-3 h-3 rounded-full bg-gray-100 mr-1 border border-gray-200"></span> W - Weekend</span>
                        <span className="flex items-center"><span className="w-3 h-3 rounded-full bg-yellow-100 mr-1 border border-yellow-200"></span> H - Holiday</span>
                    </div>
                </>
            )}
        </div>
    );
};

export default AttendanceCalendar;