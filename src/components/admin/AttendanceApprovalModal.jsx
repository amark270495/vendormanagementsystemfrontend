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
                // Add isPending flag for click handler
                // *** FIX: Ensure request object in map has username ***
                const requestObj = pendingRequestsMap[dateKey] || {}; // Get request from map
                return {
                    status: 'Pending',
                    text: requestedText,
                    color: 'bg-yellow-100 text-yellow-700 border-yellow-200 hover:ring-2 hover:ring-yellow-400 cursor-pointer',
                    description: `Pending ${attendanceRecord.requestedStatus}`,
                    isPending: true,
                    // Pass the request object which should include username now
                    request: requestObj
                };
                // *** END FIX ***
            }
            if (attendanceRecord.status === 'Present') return { status: 'Present', text: 'P', color: 'bg-green-100 text-green-700 border-green-200' };
            if (attendanceRecord.status === 'Absent' || attendanceRecord.status === 'Rejected') return { status: attendanceRecord.status, text: 'A', color: 'bg-red-100 text-red-700 border-red-200' };
        }

        // Past unmarked working day - Show as Absent but NOT clickable for approval
        const today = new Date(); today.setUTCHours(0,0,0,0);
        if (date < today) return { status: 'Absent (Unmarked)', text: 'A', color: 'bg-red-50 text-red-500 border-red-100 italic' };

        return { status: 'Future', text: '', color: 'bg-white border-gray-200' }; // Future/current unmarked
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
    }, [monthDate, attendanceData, holidays, leaveDaysSet, pendingRequestsMap]); // Include pendingRequestsMap

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
                        // Add onClick only for pending days
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

    // State for the nested action/comment modal
    const [isActionModalOpen, setIsActionModalOpen] = useState(false);
    const [requestToAction, setRequestToAction] = useState(null); // The specific pending request object
    const [currentAction, setCurrentAction] = useState(null); // 'Approved' or 'Rejected'
    const [actionLoading, setActionLoading] = useState(false); // Loading state for the API call

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

    // Fetch all necessary data for the selected user and month
    const fetchDataForUserAndMonth = useCallback(async (monthDate) => {
        // *** FIX: Add check for selectedUsername ***
        if (!user?.userIdentifier || !selectedUsername) {
             console.log("fetchDataForUserAndMonth: Skipping fetch - user or selectedUsername missing.");
             setLoading(false); // Ensure loading stops if username isn't set yet
            return;
        }
        // *** END FIX ***

        console.log(`fetchDataForUserAndMonth: Fetching data for ${selectedUsername}, month: ${monthDate.toISOString().substring(0, 7)}`); // Log fetch start
        setLoading(true);
        setError('');
        try {
            const year = monthDate.getUTCFullYear();
            const month = (monthDate.getUTCMonth() + 1).toString().padStart(2, '0');
            const monthString = `${year}-${month}`;
            const monthEndDay = new Date(Date.UTC(year, monthDate.getUTCMonth() + 1, 0)).getUTCDate();

            // Fetch attendance, holidays, leave (similar to AttendanceCalendar)
            const [attendanceRes, holidaysRes, leaveRes] = await Promise.all([
                // *** FIX: Pass selectedUsername correctly ***
                apiService.getAttendance({ authenticatedUsername: user.userIdentifier, username: selectedUsername, month: monthString }),
                // *** END FIX ***
                apiService.getHolidays({ authenticatedUsername: user.userIdentifier, year: year.toString() }),
                apiService.getLeaveRequests({ authenticatedUsername: user.userIdentifier, targetUsername: selectedUsername, statusFilter: 'Approved', startDateFilter: `${monthString}-01`, endDateFilter: `${monthString}-${monthEndDay.toString().padStart(2,'0')}` })
            ]);

             console.log("API Responses:", { attendanceRes, holidaysRes, leaveRes }); // Log API responses

            // Process Attendance Data
            const attMap = {};
            const pendingMap = {};
            if (attendanceRes?.data?.success && Array.isArray(attendanceRes.data.attendanceRecords)) {
                attendanceRes.data.attendanceRecords.forEach(att => {
                    // *** FIX: Ensure username is included in the pending request object ***
                    const record = {
                        status: att.status,
                        requestedStatus: att.requestedStatus,
                        username: selectedUsername, // Add username here
                        date: att.date, // Ensure date is here
                        markedOn: att.markedOn // Keep other useful fields
                        // Add partitionKey/rowKey if needed by backend approveAttendance
                         // partitionKey: att.partitionKey, // Assuming backend provides these
                         // rowKey: att.rowKey
                    };
                    attMap[att.date] = record; // Store the richer object
                    if (att.status === 'Pending') {
                        pendingMap[att.date] = record; // Store full request if pending
                    }
                    // *** END FIX ***
                });
            } else {
                 console.warn("Failed to process attendance response:", attendanceRes?.data?.message);
            }
            setAttendanceData(attMap);
            setPendingRequestsMap(pendingMap);
            console.log("Processed Pending Requests Map:", pendingMap); // Log pending map

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
            console.error("fetchDataForUserAndMonth error:", err); // Log full error
        } finally {
            setLoading(false);
        }
    }, [user?.userIdentifier]); // Removed selectedUsername from dependencies, rely on prop passed in useEffect call

    // Fetch data when the modal opens or month/selectedUsername changes
    useEffect(() => {
        if (isOpen && selectedUsername) {
            // Reset month to current when username changes, fetch otherwise
            const currentYear = new Date().getFullYear();
            const currentMonth = new Date().getMonth();
            const initialMonth = new Date(Date.UTC(currentYear, currentMonth, 1));
            setCurrentMonthDate(initialMonth); // Reset to current month for new user
            fetchDataForUserAndMonth(initialMonth); // Fetch for initial month
        } else if (isOpen && selectedUsername && currentMonthDate) {
             // If username is same but month might change via buttons
             fetchDataForUserAndMonth(currentMonthDate);
        }
    }, [isOpen, selectedUsername, fetchDataForUserAndMonth]); // Depend on selectedUsername here


    const changeMonth = (offset) => {
        setCurrentMonthDate(prev => {
            const newDate = new Date(prev);
            newDate.setUTCMonth(newDate.getUTCMonth() + offset, 1);
            // Fetch will be triggered by useEffect watching currentMonthDate
            return newDate;
        });
    };

    // --- Action Handling ---
    const handleDayClick = (request) => {
        // *** FIX: Check request object passed from CalendarDisplay ***
        if (request && request.status === 'Pending') {
            console.log("Pending day clicked:", request); // Log clicked request
            // Ensure the request object contains username and date
            if (!request.username || !request.date) {
                console.error("Clicked request object is missing username or date:", request);
                setError("Internal error: Cannot process action due to missing request data.");
                return;
            }
            setRequestToAction(request); // Store the full request object
            // Use window.confirm for simplicity for now
             const actionConfirmed = window.confirm(
                 `Request Details:\nUser: ${request.username}\nDate: ${formatDate(request.date)}\nRequested: ${request.requestedStatus}\n\nClick OK to Approve, Cancel to Reject.`
             );
            const action = actionConfirmed ? 'Approved' : 'Rejected';
            handleConfirmAction(action, ''); // Pass action and empty comments

        } else {
             console.log("Clicked non-pending day or invalid/missing request object:", request);
        }
        // *** END FIX ***
    };

    // This function is called when the final action is confirmed
    const handleConfirmAction = async (action, comments) => {
        // *** FIX: Use requestToAction directly ***
        const req = requestToAction; // Use the state holding the clicked request
        // *** END FIX ***
        if (!req || !req.date || !req.username) {
            console.error("handleConfirmAction Error: Request details missing.", req);
            setError("Cannot perform action: Request details are missing.");
            // Clear requestToAction if it's invalid
            setRequestToAction(null);
            return;
        }

        setActionLoading(true);
        setError(''); // Clear previous errors

        try {
            const payload = {
                targetUsername: req.username, // Use username from the request object
                attendanceDate: req.date,     // Use date from the request object
                action: action,               // 'Approved' or 'Rejected'
                approverComments: comments,
                authenticatedUsername: user.userIdentifier
            };
            console.log("Calling approveAttendance API with payload:", payload); // Log before API call

            const response = await apiService.approveAttendance(payload);
             console.log("approveAttendance API response:", response); // Log API response

            if (response.data.success) {
                // Close action modal if it was open
                setIsActionModalOpen(false);
                setRequestToAction(null); // Clear the specific request
                setCurrentAction(null);
                // Refresh the calendar data for the current month
                await fetchDataForUserAndMonth(currentMonthDate); // Wait for refresh
                // Notify the parent page ONLY if all pending requests for this user *might* be gone
                // (More complex check needed if only refreshing parent on full completion)
                // For simplicity, always call it now
                if (onApprovalComplete) {
                    onApprovalComplete();
                }
            } else {
                throw new Error(response.data.message);
            }
        } catch (err) {
            console.error("Confirm Action Error:", err);
            setError(err.message || "An unknown error occurred while processing the request.");
            // Keep action modal open if used, so user sees the error
        } finally {
            setActionLoading(false);
            // Clear requestToAction after attempt, regardless of success/fail for window.confirm approach
            setRequestToAction(null);
        }
    };


    const monthName = currentMonthDate.toLocaleString('default', { month: 'long', year: 'numeric', timeZone: 'UTC' });

    return (
        // Use Modal component for the main structure
        <Modal isOpen={isOpen} onClose={onClose} title={`Attendance Approval for ${selectedUsername || '...'}`} size="3xl"> {/* Increased size */}
            {/* Display error within the modal */}
            {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 animate-shake">{error}</div>}

            {/* Month Navigation */}
            <div className="flex justify-between items-center mb-4 px-1">
                <button onClick={() => changeMonth(-1)} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 text-sm font-medium shadow-sm transition" disabled={loading || actionLoading}>&lt; Prev</button>
                <h3 className="text-xl font-semibold text-gray-800">{monthName}</h3>
                <button onClick={() => changeMonth(1)} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 text-sm font-medium shadow-sm transition" disabled={loading || actionLoading}>Next &gt;</button>
            </div>

            {/* Loading Spinner or Calendar */}
            {loading ? (
                <div className="flex justify-center items-center h-64"><Spinner size="10"/></div>
            ) : actionLoading ? (
                 <div className="flex justify-center items-center h-64"><Spinner size="10"/><p className="ml-3 text-gray-600">Processing...</p></div>
            ) : (
                // Render CalendarDisplay only if not loading
                <CalendarDisplay
                    monthDate={currentMonthDate}
                    attendanceData={attendanceData}
                    holidays={holidays}
                    leaveDaysSet={leaveDaysSet}
                    onDayClick={handleDayClick} // Pass the click handler
                    pendingRequestsMap={pendingRequestsMap} // Pass the map
                />
            )}

            {/* Footer with Close Button (Optional) */}
             <div className="mt-6 pt-4 border-t flex justify-end">
                <button onClick={onClose} className="px-5 py-2 bg-gray-500 text-white font-semibold rounded-lg hover:bg-gray-600 transition shadow-sm">
                    Close
                </button>
             </div>


            {/* Optional: Add Comment Modal (if replacing window.confirm) */}
            {/* <ApprovalCommentModal
                isOpen={isActionModalOpen}
                onClose={() => setIsActionModalOpen(false)}
                onConfirm={(comments) => handleConfirmAction(currentAction, comments)}
                request={requestToAction ? { // Adapt props if using ApprovalCommentModal
                    username: requestToAction.username,
                    startDate: requestToAction.date,
                    endDate: requestToAction.date,
                    reason: `Requested: ${requestToAction.requestedStatus}`
                 } : null}
                action={currentAction}
                loading={actionLoading}
            /> */}
        </Modal>
    );
};

export default AttendanceApprovalModal;