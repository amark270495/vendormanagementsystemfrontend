import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { apiService } from '../../api/apiService';
import Spinner from '../Spinner';
import Modal from '../Modal'; // Assuming Modal.jsx is in components/
// Reusing Leave's comment modal for attendance actions
import ApprovalCommentModal from '../leave/ApprovalCommentModal';

// --- Reusable Calendar Logic (Adapted from AttendanceCalendar) ---
const CalendarDisplay = ({ monthDate, attendanceData, holidays, leaveDaysSet, onDayClick, pendingRequestsMap }) => {

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
                return { status: 'Pending', text: requestedText, color: 'bg-yellow-100 text-yellow-700 border-yellow-200 hover:ring-2 hover:ring-yellow-400 cursor-pointer', description: `Pending ${attendanceRecord.requestedStatus}`, isPending: true, request: pendingRequestsMap[dateKey] };
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
                        onClick={() => cell.statusInfo.isPending && onDayClick(cell.statusInfo.request)}
                    >
                        <span className="text-sm">{cell.day}</span>
                        {cell.statusInfo.text && <span className="text-xs font-bold mt-1">{cell.statusInfo.text}</span>}
                    </div>
                ))}
            </div>
            {/* Legend */}
            <div className="mt-4 flex flex-wrap gap-x-3 gap-y-1 text-xs">
                <span className="flex items-center"><span className="w-3 h-3 rounded-full bg-green-100 mr-1 border border-green-200"></span> P</span>
                <span className="flex items-center"><span className="w-3 h-3 rounded-full bg-red-100 mr-1 border border-red-200"></span> A</span>
                <span className="flex items-center"><span className="w-3 h-3 rounded-full bg-yellow-100 mr-1 border border-yellow-200"></span> P?/A? (Pending)</span>
                <span className="flex items-center"><span className="w-3 h-3 rounded-full bg-purple-100 mr-1 border border-purple-200"></span> L</span>
                <span className="flex items-center"><span className="w-3 h-3 rounded-full bg-gray-100 mr-1 border border-gray-200"></span> W</span>
                <span className="flex items-center"><span className="w-3 h-3 rounded-full bg-yellow-100 mr-1 border border-yellow-200"></span> H</span>
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

    // Fetch all necessary data for the selected user and month
    const fetchDataForUserAndMonth = useCallback(async (monthDate) => {
        if (!user?.userIdentifier || !selectedUsername) return;
        setLoading(true);
        setError('');
        try {
            const year = monthDate.getUTCFullYear();
            const month = (monthDate.getUTCMonth() + 1).toString().padStart(2, '0');
            const monthString = `${year}-${month}`;
            const monthEndDay = new Date(Date.UTC(year, monthDate.getUTCMonth() + 1, 0)).getUTCDate();

            // Fetch attendance, holidays, leave (similar to AttendanceCalendar)
            const [attendanceRes, holidaysRes, leaveRes] = await Promise.all([
                apiService.getAttendance({ authenticatedUsername: user.userIdentifier, username: selectedUsername, month: monthString }),
                apiService.getHolidays({ authenticatedUsername: user.userIdentifier, year: year.toString() }),
                apiService.getLeaveRequests({ authenticatedUsername: user.userIdentifier, targetUsername: selectedUsername, statusFilter: 'Approved', startDateFilter: `${monthString}-01`, endDateFilter: `${monthString}-${monthEndDay.toString().padStart(2,'0')}` })
            ]);

            // Process Attendance Data
            const attMap = {};
            const pendingMap = {};
            if (attendanceRes.data.success && Array.isArray(attendanceRes.data.attendanceRecords)) {
                attendanceRes.data.attendanceRecords.forEach(att => {
                    attMap[att.date] = { status: att.status, requestedStatus: att.requestedStatus };
                    if (att.status === 'Pending') {
                        pendingMap[att.date] = att; // Store full request if pending
                    }
                });
            }
            setAttendanceData(attMap);
            setPendingRequestsMap(pendingMap);

            // Process Holidays
            const holMap = {};
            if (holidaysRes.data.success && Array.isArray(holidaysRes.data.holidays)) {
                holidaysRes.data.holidays.forEach(h => holMap[h.date] = h.description);
            }
            setHolidays(holMap);

            // Process Leave
            const leaveSet = new Set();
            if (leaveRes.data.success && Array.isArray(leaveRes.data.requests)) {
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
            setError(err.response?.data?.message || 'Failed to load calendar data for user.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [user?.userIdentifier, selectedUsername]);

    // Fetch data when the modal opens or month changes
    useEffect(() => {
        if (isOpen && selectedUsername) {
            fetchDataForUserAndMonth(currentMonthDate);
        }
    }, [isOpen, selectedUsername, currentMonthDate, fetchDataForUserAndMonth]);

    const changeMonth = (offset) => {
        setCurrentMonthDate(prev => {
            const newDate = new Date(prev);
            newDate.setUTCMonth(newDate.getUTCMonth() + offset, 1);
            return newDate; // Fetch happens in useEffect based on this change
        });
    };

    // --- Action Handling ---
    const handleDayClick = (request) => {
        if (request && request.status === 'Pending') {
             console.log("Pending day clicked:", request); // Log clicked request
            setRequestToAction(request);
            // Open action modal immediately or after selecting action type
            // For simplicity, let's open it directly, action type decided inside modal/confirm
            // setIsActionModalOpen(true); // We'll use simple confirm first

             // Using simple confirm first
             const action = window.confirm(`Request: ${request.requestedStatus} for ${formatDate(request.date)}\n\nClick OK to Approve, Cancel to Reject.`);
             if (action === true) { // Approve
                 handleConfirmAction('Approved', ''); // No comments with confirm
             } else if (action === false) { // Reject
                 handleConfirmAction('Rejected', ''); // No comments with confirm
             }
        } else {
             console.log("Clicked non-pending day or invalid request:", request);
        }
    };

    // This function is called when the final action is confirmed (e.g., from comment modal or simple confirm)
    const handleConfirmAction = async (action, comments) => {
        const req = requestToAction || currentRequest; // Use requestToAction if set (from simple confirm)
        if (!req || !req.date || !req.username) {
            setError("Cannot perform action: Request details are missing.");
            return;
        }

        setActionLoading(true);
        setError(''); // Clear previous errors

        try {
            const payload = {
                targetUsername: req.username,
                attendanceDate: req.date,
                action: action, // 'Approved' or 'Rejected'
                approverComments: comments,
                authenticatedUsername: user.userIdentifier
            };

            const response = await apiService.approveAttendance(payload);

            if (response.data.success) {
                // Close action modal if it was open
                setIsActionModalOpen(false);
                setRequestToAction(null);
                setCurrentAction(null);
                // Refresh the calendar data for the current month
                fetchDataForUserAndMonth(currentMonthDate);
                // Notify the parent page to refresh its list (optional but good)
                if (onApprovalComplete) {
                    onApprovalComplete();
                }
                 // Show temporary success message inside the modal?
                 // setSuccess(response.data.message);
                 // setTimeout(() => setSuccess(''), 2000);
            } else {
                throw new Error(response.data.message);
            }
        } catch (err) {
            console.error("Confirm Action Error:", err);
            setError(err.message || "An unknown error occurred while processing the request.");
            // Keep action modal open if it was used, so user sees the error
        } finally {
            setActionLoading(false);
        }
    };


    const monthName = currentMonthDate.toLocaleString('default', { month: 'long', year: 'numeric', timeZone: 'UTC' });

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Attendance Approval for ${selectedUsername}`} size="2xl">
            {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 animate-shake">{error}</div>}

            <div className="flex justify-between items-center mb-4">
                <button onClick={() => changeMonth(-1)} className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50" disabled={loading}>&lt; Prev</button>
                <h3 className="text-lg font-semibold">{monthName}</h3>
                <button onClick={() => changeMonth(1)} className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50" disabled={loading}>Next &gt;</button>
            </div>

            {loading ? (
                <div className="flex justify-center items-center h-48"><Spinner /></div>
            ) : (
                <CalendarDisplay
                    monthDate={currentMonthDate}
                    attendanceData={attendanceData}
                    holidays={holidays}
                    leaveDaysSet={leaveDaysSet}
                    onDayClick={handleDayClick}
                    pendingRequestsMap={pendingRequestsMap} // Pass the map
                />
            )}

            {/* Optional: Add Comment Modal Triggered by handleDayClick */}
            {/* <ApprovalCommentModal
                isOpen={isActionModalOpen}
                onClose={() => setIsActionModalOpen(false)}
                onConfirm={(comments) => handleConfirmAction(currentAction, comments)} // Needs modification
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