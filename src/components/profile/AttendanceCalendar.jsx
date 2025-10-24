import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { apiService } from '../../api/apiService';
import Spinner from '../Spinner';

const AttendanceCalendar = ({ initialMonthString }) => {
    const { user } = useAuth();
    // Use initialMonthString to set the starting date, ensuring it's treated as UTC
    const [currentMonthDate, setCurrentMonthDate] = useState(() => {
        const [year, month] = initialMonthString.split('-').map(Number);
        return new Date(Date.UTC(year, month - 1, 1)); // Month is 0-indexed for Date constructor
    });
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
            const year = monthDate.getUTCFullYear(); // Use UTC methods
            const month = (monthDate.getUTCMonth() + 1).toString().padStart(2, '0'); // Use UTC methods
            const monthString = `${year}-${month}`;
            const monthEndDay = new Date(Date.UTC(year, monthDate.getUTCMonth() + 1, 0)).getUTCDate(); // Get last day using UTC

            // Fetch attendance
            const attendanceRes = await apiService.getAttendance({
                authenticatedUsername: user.userIdentifier,
                username: user.userIdentifier, // Explicitly target self
                month: monthString
            });
            const attendanceMap = {};
            // --- FIX: Corrected property access based on getAttendance response ---
            if (attendanceRes.data.success && Array.isArray(attendanceRes.data.attendanceRecords)) {
                attendanceRes.data.attendanceRecords.forEach(att => {
                    attendanceMap[att.date] = att.status; // Use 'date' which is RowKey
                });
            }
            // --- End FIX ---
            setAttendanceData(attendanceMap);

            // Fetch holidays for the year
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

            // Fetch approved leave *only for the current user* for the month
            const leaveRes = await apiService.getLeaveRequests({
                authenticatedUsername: user.userIdentifier,
                // *** FIX: Explicitly set targetUsername to self ***
                targetUsername: user.userIdentifier,
                // *** END FIX ***
                statusFilter: 'Approved',
                startDateFilter: `${monthString}-01`, // Start of the month
                endDateFilter: `${monthString}-${monthEndDay.toString().padStart(2, '0')}` // End of the month
            });

            const newLeaveDaysSet = new Set();
            if (leaveRes.data.success && Array.isArray(leaveRes.data.requests)) {
                leaveRes.data.requests.forEach(req => {
                    const start = new Date(req.startDate + 'T00:00:00Z'); // Ensure UTC
                    const end = new Date(req.endDate + 'T00:00:00Z');   // Ensure UTC
                    for (let d = new Date(start); d <= end; d.setUTCDate(d.getUTCDate() + 1)) {
                         // Only add dates within the current calendar month
                        if (d.getUTCFullYear() === year && d.getUTCMonth() === monthDate.getUTCMonth()) {
                            newLeaveDaysSet.add(d.toISOString().split('T')[0]);
                        }
                    }
                });
            } else if (!leaveRes.data.success) {
                 console.error("Failed to fetch leave requests:", leaveRes.data.message);
                 // Optionally set an error state here
            }
            setLeaveDaysSet(newLeaveDaysSet);

        } catch (err) {
             const errorMsg = err.response?.data?.message || err.message || 'Failed to load calendar data.';
             setError(errorMsg);
            console.error(err);
             // Clear data on error to avoid showing stale info
             setAttendanceData({});
             setHolidays({});
             setLeaveDaysSet(new Set());
        } finally {
            setLoading(false);
        }
    }, [user?.userIdentifier]); // Removed initialMonthString dependency as it's used only for initial state

    useEffect(() => {
        // Initialize currentMonthDate based on initialMonthString
        const [year, month] = initialMonthString.split('-').map(Number);
        const initialDate = new Date(Date.UTC(year, month - 1, 1));
        setCurrentMonthDate(initialDate);
        fetchData(initialDate); // Fetch data for the initial month
    }, [initialMonthString, fetchData]); // Rerun if initialMonthString changes (shouldn't typically happen) or fetchData updates


    const changeMonth = (offset) => {
        setCurrentMonthDate(prev => {
            const newDate = new Date(prev);
            newDate.setUTCMonth(newDate.getUTCMonth() + offset, 1); // Set day to 1 to avoid month skipping issues
            fetchData(newDate); // Fetch data for the new month
            return newDate;
        });
    };

    const getDayStatus = (day) => {
        const year = currentMonthDate.getUTCFullYear();
        const month = currentMonthDate.getUTCMonth();
        const date = new Date(Date.UTC(year, month, day)); // Use UTC

        if (date.getUTCMonth() !== month) {
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
        const year = currentMonthDate.getUTCFullYear();
        const month = currentMonthDate.getUTCMonth();
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
            // Only add the row if it contains actual days of the month
            if (week.some(cell => cell.day !== null)) {
                 grid.push(week);
            }
            if (dayCounter > daysInMonth) break; // Stop adding rows if month ended
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