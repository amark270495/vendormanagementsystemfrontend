import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { apiService } from '../../api/apiService';
import Spinner from '../Spinner';
import Modal from '../Modal'; // Assuming Modal.jsx is in components/
// Reusing Leave's comment modal for attendance actions
import ApprovalCommentModal from '../leave/ApprovalCommentModal';

// --- Reusable Calendar Logic (Adapted from AttendanceCalendar) ---
const CalendarDisplay = ({ monthDate, attendanceData, holidays, leaveDaysSet, onDayClick, pendingRequestsMap }) => {

    // Helper function to format date for display in confirmation
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        try {
            // Use UTC date parts to avoid timezone shifts during display
            const date = new Date(dateString + 'T00:00:00Z');
            return date.toLocaleDateString('en-US', {
                timeZone: 'UTC',
                month: 'short', day: 'numeric', year: 'numeric'
            });
        } catch (e) {
            return dateString;
        }
    };

    const getDayStatus = (day) => {
        const year = monthDate.getUTCFullYear();
        const month = monthDate.getUTCMonth();
        const date = new Date(Date.UTC(year, month, day));

        if (date.getUTCMonth() !== month) return { status: 'Empty' };

        const dateKey = date.toISOString().split('T')[0];
        const dayOfWeek = date.getUTCDay();

        if (leaveDaysSet.has(dateKey)) return { status: 'On Leave', text: 'L', color: 'bg-purple-100 text-purple-700 border-purple-200' };
        if (dayOfWeek === 0 || dayOfWeek === 6) return { status: 'Weekend', text: 'W', color: 'bg-gray-100 text-gray-500 border-gray-200' };
        if (holidays[dateKey]) return { status: 'Holiday', text: 'H', color: 'bg-yellow-100 text-yellow-700 border-yellow-200', description: holidays[dateKey] };

        const attendanceRecord = attendanceData[dateKey];
        if (attendanceRecord) {
            if (attendanceRecord.status === 'Pending') {
                const requestedText = attendanceRecord.requestedStatus === 'Present' ? 'P?' : 'A?';
                const requestObj = pendingRequestsMap[dateKey] || {};
                return {
                    status: 'Pending',
                    text: requestedText,
                    color: 'bg-yellow-100 text-yellow-700 border-yellow-200 hover:ring-2 hover:ring-yellow-400 cursor-pointer',
                    description: `Pending ${attendanceRecord.requestedStatus}`,
                    isPending: true,
                    request: requestObj // Pass the request object which should include username now
                };
            }
            if (attendanceRecord.status === 'Present') return { status: 'Present', text: 'P', color: 'bg-green-100 text-green-700 border-green-200' };
            if (attendanceRecord.status === 'Absent' || attendanceRecord.status === 'Rejected') return { status: attendanceRecord.status, text: 'A', color: 'bg-red-100 text-red-700 border-red-200' };
        }

        const today = new Date(); today.setUTCHours(0,0,0,0);
        if (date < today) return { status: 'Absent (Unmarked)', text: 'A', color: 'bg-red-50 text-red-500 border-red-100 italic' };

        return { status: 'Future', text: '', color: 'bg-white border-gray-200' };
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
                if (i === 0 && j < firstDayOfMonth) week.push({ day: null, statusInfo: { status: 'Empty' } });
                else if (dayCounter <= daysInMonth) { week.push({ day: dayCounter, statusInfo: getDayStatus(dayCounter++) }); }
                else week.push({ day: null, statusInfo: { status: 'Empty' } });
            }
            if (week.some(cell => cell.day !== null)) grid.push(week);
            if (dayCounter > daysInMonth) break;
        }
        return grid;
    }, [monthDate, attendanceData, holidays, leaveDaysSet, pendingRequestsMap]);

    return (
        <>
            <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-gray-500 mb-2">
                <div>Sun</div><div>Mon</div><div>Tue</div><div>Wed</div><div>Thu</div><div>Fri</div><div>Sat</div>
            </div>
            <div className="grid grid-cols-7 gap-1">
                {calendarGrid.flat().map((cell, index) => (
                    <div
                        key={index}
                        className={`h-16 flex flex-col items-center justify-center border rounded text-center ${cell.statusInfo.color || 'bg-gray-50 border-gray-100'} ${cell.day === null ? 'invisible' : ''}`}
                        title={cell.statusInfo.description || cell.statusInfo.status}
                        onClick={() => cell.statusInfo.isPending && onDayClick(cell.statusInfo.request)} // Pass the full request object
                    >
                        <span className="text-sm">{cell.day}</span>
                        {cell.statusInfo.text && <span className="text-xs font-bold mt-1">{cell.statusInfo.text}</span>}
                    </div>
                ))}
            </div>
            {/* Legend */}
            <div className="mt-4 flex flex-wrap gap-x-3 gap-y-1 text-xs">
                <span className="flex items-center"><span className="w-3 h-3 rounded-full bg-green-100 mr-1 border border-green-200"></span> P</span>
                <span className="flex items-center"><span className="w-3 h-3 rounded-full bg-red-100 mr-1 border border-red-200"></span> A/Rejected</span>
                <span className="flex items-center"><span className="w-3 h-3 rounded-full bg-yellow-100 mr-1 border border-yellow-200"></span> P?/A? (Pending)</span>
                <span className="flex items-center"><span className="w-3 h-3 rounded-full bg-purple-100 mr-1 border border-purple-200"></span> L</span>
                <span className="flex items-center"><span className="w-3 h-3 rounded-full bg-gray-100 mr-1 border border-gray-200"></span> W</span>
                <span className="flex items-center"><span className="w-3 h-3 rounded-full bg-yellow-100 mr-1 border border-yellow-200"></span> H</span>
                 <span className="flex items-center ml-auto"><span className="w-3 h-3 rounded-full bg-red-50 mr-1 border border-red-100"></span> A (Unmarked)</span>
            </div>
        </>
    );
};
// --- END CalendarDisplay ---


// --- Main Modal Component ---
const AttendanceApprovalModal = ({ isOpen, onClose, selectedUsername, onApprovalComplete }) => {
    const { user } = useAuth(); // Admin user
    const [currentMonthDate, setCurrentMonthDate] = useState(() => new Date(Date.UTC(new Date().getFullYear(), new Date().getMonth(), 1))); // Start with current month in UTC
    const [attendanceData, setAttendanceData] = useState({});
    const [holidays, setHolidays] = useState({});
    const [leaveDaysSet, setLeaveDaysSet] = useState(new Set());
    const [pendingRequestsMap, setPendingRequestsMap] = useState({}); // Map date to request object
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // *** REMOVED: State variables no longer needed for the fixed logic ***
    // const [isActionModalOpen, setIsActionModalOpen] = useState(false);
    // const [requestToAction, setRequestToAction] = useState(null);
    // const [currentAction, setCurrentAction] = useState(null);
    const [actionLoading, setActionLoading] = useState(false); // Loading state for the API call

    // Helper function to format date for display in confirmation
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        try {
            const date = new Date(dateString + 'T00:00:00Z');
            return date.toLocaleDateString('en-US', {
                timeZone: 'UTC',
                month: 'short', day: 'numeric', year: 'numeric'
            });
        } catch (e) {
            return dateString;
        }
    };

    // Fetch all necessary data for the selected user and month
    const fetchDataForUserAndMonth = useCallback(async (monthDate) => {
        if (!user?.userIdentifier || !selectedUsername) {
             console.log("fetchDataForUserAndMonth: Skipping fetch - user or selectedUsername missing.");
             setLoading(false);
            return;
        }

        console.log(`fetchDataForUserAndMonth: Fetching data for ${selectedUsername}, month: ${monthDate.toISOString().substring(0, 7)}`);
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

            // console.log("API Responses:", { attendanceRes, holidaysRes, leaveRes }); // Verbose

            // Process Attendance Data
            const attMap = {};
            const pendingMap = {};
            if (attendanceRes?.data?.success && Array.isArray(attendanceRes.data.attendanceRecords)) {
                attendanceRes.data.attendanceRecords.forEach(att => {
                    const record = {
                        ...att,
                        username: att.username || selectedUsername,
                        date: att.date || att.rowKey,
                    };
                    attMap[record.date] = record;
                    if (record.status === 'Pending') {
                        pendingMap[record.date] = record;
                    }
                });
            } else {
                 console.warn("Failed to process attendance response:", attendanceRes?.data?.message);
            }
            setAttendanceData(attMap);
            setPendingRequestsMap(pendingMap);
            // console.log("Processed Pending Requests Map:", pendingMap); // Verbose

            // Process Holidays
            const holMap = {};
            if (holidaysRes?.data?.success && Array.isArray(holidaysRes.data.holidays)) {
                holidaysRes.data.holidays.forEach(h => holMap[h.date] = h.description);
            }
            setHolidays(holMap);

            // Process Leave
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
            const errorMsg = err.response?.data?.message || err.message || 'Failed to load calendar data for user.';
            setError(errorMsg);
            console.error("fetchDataForUserAndMonth error:", err);
        } finally {
            setLoading(false);
        }
    }, [user?.userIdentifier, selectedUsername]); // *** MODIFIED: Rely on selectedUsername prop ***

    // Fetch data when the modal opens OR selectedUsername changes
    useEffect(() => {
        if (isOpen && selectedUsername) {
            // Reset to current month when the selected user changes
            const initialMonth = new Date(Date.UTC(new Date().getFullYear(), new Date().getMonth(), 1));
            setCurrentMonthDate(initialMonth);
            fetchDataForUserAndMonth(initialMonth);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, selectedUsername]); // *** MODIFIED: Fetch only when modal opens or user changes ***

    // Refetch ONLY when month changes
     useEffect(() => {
        if (isOpen && selectedUsername) {
             fetchDataForUserAndMonth(currentMonthDate);
        }
     // eslint-disable-next-line react-hooks/exhaustive-deps
     }, [currentMonthDate]); // *** MODIFIED: Separate effect for month change ***


    const changeMonth = (offset) => {
        setCurrentMonthDate(prev => {
            const newDate = new Date(prev);
            newDate.setUTCMonth(newDate.getUTCMonth() + offset, 1);
            return newDate;
        });
    };

    // --- Action Handling ---
    const handleDayClick = (request) => {
        console.log("handleDayClick received request:", request);

        if (request && request.status === 'Pending') {
            if (!request.username || !request.date) {
                console.error("Clicked request object is missing username or date:", request);
                setError("Internal error: Cannot process action due to missing request data. Please refresh.");
                return;
            }

            // Use window.confirm for simplicity for now
             const actionConfirmed = window.confirm(
                 `Request Details:\nUser: ${request.username}\nDate: ${formatDate(request.date)}\nRequested: ${request.requestedStatus}\n\nClick OK to Approve, Cancel to Reject.`
             );
            const action = actionConfirmed ? 'Approved' : 'Rejected';

             // *** FIX: Pass the request object directly to handleConfirmAction ***
             handleConfirmAction(request, action, ''); // Pass request, action, and empty comments

        } else {
             console.log("Clicked non-pending day or invalid/missing request object:", request);
        }
    };

    // *** FIX: Accept the request object as the first argument ***
    const handleConfirmAction = async (req, action, comments) => {

        console.log("handleConfirmAction triggered. Request Object:", req, "Action:", action); // Log object and action

        // Check the passed-in request object 'req'
        if (!req || !req.date || !req.username || !action) {
            console.error("handleConfirmAction Error: Request details or action missing.", {req, action});
            setError("Cannot perform action: Request details or action type are missing.");
            return;
        }

        setActionLoading(true);
        setError(''); // Clear previous errors

        try {
            const payload = {
                targetUsername: req.username, // Use username from the request object
                attendanceDate: req.date,     // Use date from the request object
                action: action,               // Use the determined action
                approverComments: comments,
                authenticatedUsername: user.userIdentifier
            };
            console.log("Calling approveAttendance API with payload:", payload);

            const response = await apiService.approveAttendance(payload);
             console.log("approveAttendance API response:", response);

            if (response.data.success) {
                // Refresh the calendar data for the current month
                await fetchDataForUserAndMonth(currentMonthDate); // Wait for refresh
                
                // Check if any pending requests remain for this user *in this month*
                const remainingPendingInMonth = Object.values(pendingRequestsMap).some(p => 
                    p.date !== req.date && // Check other dates
                    p.status === 'Pending'
                );

                // If no pending requests left *in this view*, call onApprovalComplete
                // Note: This won't call if pending requests exist in other months
                if (!remainingPendingInMonth && onApprovalComplete) {
                    onApprovalComplete(); 
                }
            } else {
                throw new Error(response.data.message);
            }
        } catch (err) {
            console.error("Confirm Action Error:", err);
            setError(err.message || "An unknown error occurred while processing the request.");
        } finally {
            setActionLoading(false);
        }
    };


    const monthName = currentMonthDate.toLocaleString('default', { month: 'long', year: 'numeric', timeZone: 'UTC' });

    return (
        // Use Modal component for the main structure
        <Modal isOpen={isOpen} onClose={onClose} title={`Attendance Approval for ${selectedUsername || '...'}`} size="3xl">
            {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 animate-shake">{error}</div>}

            <div className="flex justify-between items-center mb-4 px-1">
                <button onClick={() => changeMonth(-1)} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 text-sm font-medium shadow-sm transition" disabled={loading || actionLoading}>&lt; Prev</button>
                <h3 className="text-xl font-semibold text-gray-800">{monthName}</h3>
                <button onClick={() => changeMonth(1)} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 text-sm font-medium shadow-sm transition" disabled={loading || actionLoading}>Next &gt;</button>
            </div>

            {loading ? (
                <div className="flex justify-center items-center h-64"><Spinner size="10"/></div>
            ) : actionLoading ? (
                 <div className="flex justify-center items-center h-64"><Spinner size="10"/><p className="ml-3 text-gray-600">Processing...</p></div>
            ) : (
                <CalendarDisplay
                    monthDate={currentMonthDate}
                    attendanceData={attendanceData}
                    holidays={holidays}
                    leaveDaysSet={leaveDaysSet}
                    onDayClick={handleDayClick} // Pass the click handler
                    pendingRequestsMap={pendingRequestsMap} // Pass the map
                />
            )}

             <div className="mt-6 pt-4 border-t flex justify-end">
                <button onClick={onClose} className="px-5 py-2 bg-gray-500 text-white font-semibold rounded-lg hover:bg-gray-600 transition shadow-sm">
                    Close
                </button>
             </div>

            {/* Comment Modal - Keep commented out unless replacing window.confirm */}
            {/* ... */}
        </Modal>
    );
};

export default AttendanceApprovalModal;