import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../api/apiService';
import Spinner from '../components/Spinner';
import AttendanceCalendar from '../components/profile/AttendanceCalendar';
import LeaveRequestForm from '../components/profile/LeaveRequestForm';
import LeaveHistory from '../components/profile/LeaveHistory';

// Simple SVG Icons for sections
const CalendarIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;
const QuotaIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>;
const RequestIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>;
const HistoryIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1 text-teal-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const UserIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>;
const IdCardIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2" /></svg>;
const BriefcaseIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.03 23.03 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>;
const CakeIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M21 15.25v-4.25a2 2 0 00-2-2H5a2 2 0 00-2 2v4.25a2 2 0 002 2h14a2 2 0 002-2zM6 18v-3M9 18v-3M12 18v-3m3 0v3m3 0v-3m-15-4.5a.75.75 0 100-1.5.75.75 0 000 1.5zM18 10.5a.75.75 0 100-1.5.75.75 0 000 1.5zM9 10.5a.75.75 0 100-1.5.75.75 0 000 1.5zM15 10.5a.75.75 0 100-1.5.75.75 0 000 1.5zM12 10.5a.75.75 0 100-1.5.75.75 0 000 1.5zM6 9V6a3 3 0 013-3h6a3 3 0 013 3v3" /></svg>;

// --- NEW Attendance Marker Component ---
const AttendanceMarker = ({ selectedDate, onDateChange, onMarkAttendance }) => {
    const { user } = useAuth();
    const [statusInfo, setStatusInfo] = useState({ status: null, requestedStatus: null, isHoliday: false, isOnLeave: false, isWeekend: false, isLoading: true });
    const [actionLoading, setActionLoading] = useState(false); // Loading state for marking actions
    const [localError, setLocalError] = useState('');
    const [localSuccess, setLocalSuccess] = useState('');

    const todayDateString = new Intl.DateTimeFormat('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit', timeZone: 'UTC' }).format(new Date());

    // Function to fetch status for a specific date
    const fetchStatusForDate = useCallback(async (dateString) => {
        if (!user?.userIdentifier || !dateString) {
            setStatusInfo({ status: null, requestedStatus: null, isHoliday: false, isOnLeave: false, isWeekend: false, isLoading: false });
            return;
        }
        setStatusInfo(prev => ({ ...prev, isLoading: true }));
        setLocalError('');
        setLocalSuccess(''); // Clear messages on new date fetch

        try {
            const dateObj = new Date(dateString + 'T00:00:00Z');
            const dayOfWeek = dateObj.getUTCDay();
            const year = dateString.substring(0, 4);
            const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

            // Fetch attendance, holiday, and leave concurrently
            const [attendanceRes, holidayRes, leaveRes] = await Promise.all([
                apiService.getAttendance({ authenticatedUsername: user.userIdentifier, username: user.userIdentifier, startDate: dateString, endDate: dateString })
                    .catch(err => { console.error("Attendance fetch error:", err); return null; }), // Prevent single failure from stopping others
                apiService.getHolidays({ authenticatedUsername: user.userIdentifier, year: year }) // Fetch all holidays for the year once? Or filter backend? Fetching year for now.
                    .catch(err => { console.error("Holiday fetch error:", err); return null; }),
                apiService.getLeaveRequests({ authenticatedUsername: user.userIdentifier, targetUsername: user.userIdentifier, statusFilter: 'Approved', startDateFilter: dateString, endDateFilter: dateString })
                    .catch(err => { console.error("Leave fetch error:", err); return null; })
            ]);

            let status = null;
            let requestedStatus = null;
            let isHoliday = false;
            let isOnLeave = false;
            let holidayDescription = '';

            // Process Holiday
            if (holidayRes?.data?.success && Array.isArray(holidayRes.data.holidays)) {
                 const holiday = holidayRes.data.holidays.find(h => h.date === dateString);
                 if (holiday) {
                     isHoliday = true;
                     holidayDescription = holiday.description;
                     status = 'Holiday';
                 }
            }

            // Process Leave (takes precedence over attendance/holiday if both apply?)
            if (leaveRes?.data?.success && Array.isArray(leaveRes.data.requests) && leaveRes.data.requests.length > 0) {
                 isOnLeave = true;
                 status = 'On Leave';
            }

            // Process Attendance (if not already determined by leave/holiday/weekend)
            if (attendanceRes?.data?.success && Array.isArray(attendanceRes.data.attendanceRecords) && attendanceRes.data.attendanceRecords.length > 0) {
                const record = attendanceRes.data.attendanceRecords[0];
                 // Only use attendance status if it's not a leave day etc.
                 if (status === null && !isWeekend) {
                     status = record.status;
                     requestedStatus = record.requestedStatus || null;
                 } else if (record.status === 'Pending' && status === null && !isWeekend) {
                     // Handle case where it was marked pending but might now be holiday/leave
                     status = 'Pending';
                     requestedStatus = record.requestedStatus || null;
                 }
            }

            // Set final status based on priority
            if (status === null && isWeekend) {
                 status = 'Weekend';
            }

            setStatusInfo({
                status: status,
                requestedStatus: requestedStatus,
                isHoliday: isHoliday,
                isOnLeave: isOnLeave,
                isWeekend: isWeekend,
                isLoading: false,
                holidayDescription: holidayDescription
            });

        } catch (err) {
            console.error(`Error fetching status for ${dateString}:`, err);
            setLocalError(`Failed to load status for ${dateString}.`);
            setStatusInfo({ status: null, requestedStatus: null, isHoliday: false, isOnLeave: false, isWeekend: false, isLoading: false });
        }
    }, [user?.userIdentifier]);

    // Fetch status when the selected date changes
    useEffect(() => {
        fetchStatusForDate(selectedDate);
    }, [selectedDate, fetchStatusForDate]);

    const handleMark = async (requested) => {
        setActionLoading(true);
        setLocalError('');
        setLocalSuccess('');
        try {
            // Pass selectedDate and requested status to the parent handler
            await onMarkAttendance(selectedDate, requested);
            // Refetch status after marking to show Pending
            fetchStatusForDate(selectedDate);
            setLocalSuccess(`Attendance request for ${formatDateDisplay(selectedDate)} submitted.`);
             setTimeout(() => setLocalSuccess(''), 4000);
        } catch (err) {
            setLocalError(err.message || "Failed to submit request.");
        } finally {
            setActionLoading(false);
        }
    };

    // Determine eligibility to mark attendance for the *selected* date
    const canMarkSelectedDate = !statusInfo.isLoading && !actionLoading && !statusInfo.isWeekend && !statusInfo.isHoliday && !statusInfo.isOnLeave && statusInfo.status !== 'Present' && statusInfo.status !== 'Absent' && statusInfo.status !== 'Rejected';
    const isFutureDate = selectedDate > todayDateString;

    const formatDateDisplay = (dateStr) => {
        return new Date(dateStr + 'T00:00:00Z').toLocaleDateString('en-US', { timeZone: 'UTC', weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
    };


    return (
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-6 rounded-xl shadow-md border border-indigo-100 text-center">
            {/* Date Selector */}
            <div className="mb-4">
                <label htmlFor="attendanceDate" className="block text-sm font-medium text-gray-700 mb-1">Select Date:</label>
                <input
                    type="date"
                    id="attendanceDate"
                    value={selectedDate}
                    onChange={(e) => onDateChange(e.target.value)}
                    max={todayDateString} // Prevent selecting future dates
                    className="w-full sm:w-auto px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
            </div>

            {/* Status Display */}
            <p className="text-sm font-medium text-indigo-800 mb-3">
                Status for {formatDateDisplay(selectedDate)}
            </p>
            <div className="min-h-[40px] flex justify-center items-center mb-4">
                {statusInfo.isLoading ? (
                    <Spinner size="8" />
                ) : statusInfo.status ? (
                    <span className={`px-4 py-2 text-base font-bold rounded-full shadow-sm ${
                        statusInfo.status === 'Present' ? 'bg-green-100 text-green-800 ring-1 ring-green-200' :
                        statusInfo.status === 'Absent' || statusInfo.status === 'Rejected' ? 'bg-red-100 text-red-800 ring-1 ring-red-200' :
                        statusInfo.status === 'On Leave' ? 'bg-purple-100 text-purple-800 ring-1 ring-purple-200' :
                        statusInfo.status === 'Pending' ? 'bg-yellow-100 text-yellow-800 ring-1 ring-yellow-200' :
                        'bg-gray-100 text-gray-700 ring-1 ring-gray-200' // Weekend, Holiday
                    }`}>
                        {statusInfo.status === 'Pending' ? `Pending (${statusInfo.requestedStatus})` : statusInfo.status}
                        {statusInfo.isHoliday ? ` (${statusInfo.holidayDescription})` : ''}
                    </span>
                ) : (
                    <span className="text-base text-gray-500 italic font-semibold">Not Marked</span>
                )}
            </div>

            {/* Action Buttons - Conditionally Rendered */}
             {canMarkSelectedDate && !isFutureDate && (
                 <div className="mt-4 space-x-3 flex justify-center">
                     <button
                         onClick={() => handleMark('Present')}
                         className="px-5 py-2 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700 shadow transition disabled:opacity-50"
                         disabled={actionLoading}
                    >
                        {actionLoading ? <Spinner size="4" /> : 'Mark Present'}
                     </button>
                     <button
                         onClick={() => handleMark('Absent')}
                         className="px-5 py-2 bg-red-600 text-white text-sm font-semibold rounded-lg hover:bg-red-700 shadow transition disabled:opacity-50"
                         disabled={actionLoading}
                    >
                         {actionLoading ? <Spinner size="4" /> : 'Mark Absent'}
                     </button>
                 </div>
            )}
             {/* Informational messages */}
             {isFutureDate && <p className="mt-4 text-xs text-gray-500">Cannot mark attendance for future dates.</p>}
             {!canMarkSelectedDate && !isFutureDate && !statusInfo.isLoading && statusInfo.status !== null && (
                 <p className="mt-4 text-sm text-gray-500">Attendance status is final or not applicable for this date.</p>
             )}

             {/* Local Error/Success */}
             {localError && <p className="mt-4 text-sm text-red-600">{localError}</p>}
             {localSuccess && <p className="mt-4 text-sm text-green-600">{localSuccess}</p>}
        </div>
    );
};
// --- END Attendance Marker Component ---

// --- NEW: Helper function to format date for input fields ---
const formatDateForInput = (dateString) => {
    if (!dateString) return '';
    try {
        const date = new Date(dateString);
        // Adjust for timezone offset to get the correct YYYY-MM-DD
        // This handles cases where new Date('2025-10-01') becomes '2025-09-30T...Z'
        const userTimezoneOffset = date.getTimezoneOffset() * 60000;
        const adjustedDate = new Date(date.getTime() + userTimezoneOffset); // Add offset to get correct UTC date
        return adjustedDate.toISOString().split('T')[0];
    } catch (e) {
        console.warn("Invalid date for input formatting:", dateString);
        return '';
    }
};


const ProfilePage = () => {
    // --- UPDATED: Use `login` as `updateUserInContext` ---
    const { user, login: updateUserInContext } = useAuth();
    
    const [leaveQuota, setLeaveQuota] = useState(null);
    const [leaveHistory, setLeaveHistory] = useState([]);
    const [loading, setLoading] = useState(true); // For initial page load
    
    const [selectedDate, setSelectedDate] = useState(
        new Intl.DateTimeFormat('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit', timeZone: 'UTC' }).format(new Date())
    );
    const [error, setError] = useState(''); // General page errors
    const [success, setSuccess] = useState(''); // General page success messages

    // --- NEW: State for editing profile ---
    const [isEditing, setIsEditing] = useState(false);
    const [editLoading, setEditLoading] = useState(false);
    const [formData, setFormData] = useState({});

    // --- NEW: Initialize formData when user data is available ---
    useEffect(() => {
        if (user) {
            setFormData({
                firstName: user.firstName || '',
                lastName: user.lastName || '',
                middleName: user.middleName || '',
                dateOfBirth: formatDateForInput(user.dateOfBirth),
                dateOfJoining: formatDateForInput(user.dateOfJoining),
            });
        }
    }, [user]);
    // --- END NEW ---


    const initialMonthString = selectedDate.substring(0, 7); // YYYY-MM based on selectedDate

    // Callback to refresh calendar data
    const [calendarRefreshKey, setCalendarRefreshKey] = useState(Date.now());
    const refreshCalendar = () => setCalendarRefreshKey(Date.now());


    const fetchLeaveHistory = useCallback(async () => {
        if (!user?.userIdentifier) return;
        try {
             const leaveRes = await apiService.getLeaveRequests({
                 authenticatedUsername: user.userIdentifier,
                 targetUsername: user.userIdentifier // Ensure only self
             });
             if (leaveRes.data.success && Array.isArray(leaveRes.data.requests)) {
                 setLeaveHistory(leaveRes.data.requests);
             } else {
                 console.warn("getLeaveRequests failed or returned invalid data:", leaveRes.data?.message);
                 setLeaveHistory([]);
             }
        } catch (err) {
             console.error("Error fetching leave history:", err);
             setLeaveHistory([]);
        }
    }, [user?.userIdentifier]);

    // Load only quota and history initially
    const loadInitialData = useCallback(async () => {
        if (!user?.userIdentifier) {
            setError("User not identified. Cannot load profile data.");
            setLoading(false);
            return;
        }
        setLoading(true);
        setError('');
        try {
            // Fetch quota
            const configRes = await apiService.getLeaveConfig({ authenticatedUsername: user.userIdentifier, targetUsername: user.userIdentifier });
            if (configRes?.data?.success && configRes.data.config) {
                setLeaveQuota(configRes.data.config);
            } else {
                 console.warn("Failed to fetch leave quota:", configRes?.data?.message);
                 setLeaveQuota(null);
            }
            // Fetch history
            await fetchLeaveHistory();

        } catch (err) {
            console.error("Could not load initial profile data:", err);
            setError(`Could not load initial profile data. Please try again later.`);
            setLeaveQuota(null);
            setLeaveHistory([]);
        } finally {
            setLoading(false);
        }
    }, [user?.userIdentifier, fetchLeaveHistory]);

    useEffect(() => {
        loadInitialData();
    }, [loadInitialData]);


    // Handle marking attendance
    const handleMarkAttendance = async (dateToMark, requestedStatus) => {
        try {
            const response = await apiService.markAttendance({
                authenticatedUsername: user.userIdentifier,
                date: dateToMark,
                requestedStatus: requestedStatus
            });
            if (response.data.success) {
                refreshCalendar(); // Trigger calendar refresh
            } else {
                throw new Error(response.data.message); // Throw error to be caught by component
            }
        } catch (err) {
             const errorMsg = err.response?.data?.message || err.message || `Failed to submit attendance request.`;
             console.error("Error in handleMarkAttendance:", errorMsg)
             throw new Error(errorMsg); // Throw error to be caught by component
        }
    };

    const handleLeaveRequested = () => {
        fetchLeaveHistory(); // Re-fetch leave history
        refreshCalendar();
    };

    // Handler for date changes from the AttendanceMarker
    const handleDateChange = (newDate) => {
        setSelectedDate(newDate);
    };

    // --- NEW: Handlers for editing profile ---
    const handleFormChange = (e) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSaveChanges = async (e) => {
        e.preventDefault();
        setEditLoading(true);
        setError('');
        setSuccess('');

        try {
            // Only send the fields that are allowed to be updated
            const payload = {
                firstName: formData.firstName,
                lastName: formData.lastName,
                middleName: formData.middleName,
                dateOfBirth: formData.dateOfBirth,
                dateOfJoining: formData.dateOfJoining,
            };

            const response = await apiService.updateUser(user.userIdentifier, payload, user.userIdentifier);

            if (response.data.success) {
                setSuccess("Profile updated successfully!");
                // Update the global auth context with the new user data from the response
                updateUserInContext(response.data.userData);
                setIsEditing(false);
                setTimeout(() => setSuccess(''), 3000);
            } else {
                setError(response.data.message || "Failed to update profile.");
            }
        } catch (err) {
             setError(err.response?.data?.message || "An unexpected error occurred.");
        } finally {
             setEditLoading(false);
        }
    };
    
    const handleCancelEdit = () => {
        setIsEditing(false);
        // Reset form data to match the user context
        if (user) {
            setFormData({
                firstName: user.firstName || '',
                lastName: user.lastName || '',
                middleName: user.middleName || '',
                dateOfBirth: formatDateForInput(user.dateOfBirth),
                dateOfJoining: formatDateForInput(user.dateOfJoining),
            });
        }
        setError('');
        setSuccess('');
    };
    // --- END NEW ---


    if (loading) {
        return (
            <div className="flex justify-center items-center h-[70vh]">
                <Spinner size="12" />
                <p className="ml-4 text-gray-600">Loading your profile...</p>
            </div>
        );
    }


    return (
        <div className="space-y-8">
             {/* Page Header */}
             <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                 <h1 className="text-3xl font-bold text-gray-800">My Profile & Attendance</h1>
                 {/* --- NEW: Edit Profile Button --- */}
                 {!isEditing && (
                     <button
                        onClick={() => setIsEditing(true)}
                        className="px-5 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition shadow-sm flex items-center"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.536L16.732 3.732z" /></svg>
                        Edit Profile
                    </button>
                 )}
             </div>

            {/* General Page Error/Success */}
            {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 animate-shake">{error}</div>}
            {success && <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4 animate-fadeIn">{success}</div>}
             
            {/* --- UPDATED: User Info Card (now a form) --- */}
            <form onSubmit={handleSaveChanges}>
                <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-8">
                        {/* Column 1: Name */}
                        <div className="space-y-1">
                            <label className="text-sm font-medium text-gray-500 flex items-center"><UserIcon /> Full Name</label>
                            {isEditing ? (
                                <div className="space-y-2">
                                    <input type="text" name="firstName" placeholder="First Name" value={formData.firstName} onChange={handleFormChange} className="w-full p-2 border border-gray-300 rounded-md shadow-sm" />
                                    <input type="text" name="middleName" placeholder="Middle Name (Optional)" value={formData.middleName} onChange={handleFormChange} className="w-full p-2 border border-gray-300 rounded-md shadow-sm" />
                                    <input type="text" name="lastName" placeholder="Last Name" value={formData.lastName} onChange={handleFormChange} className="w-full p-2 border border-gray-300 rounded-md shadow-sm" />
                                </div>
                            ) : (
                                <p className="text-xl font-bold text-gray-900">{user?.displayName || 'User Name'}</p>
                            )}
                        </div>

                        {/* Column 2: Roles */}
                        <div className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-gray-500 flex items-center"><IdCardIcon /> Employee Code</label>
                                <p className="text-lg font-semibold text-gray-700">{user?.employeeCode || 'N/A'}</p>
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-gray-500 flex items-center"><BriefcaseIcon /> Backend Role</label>
                                <p className="text-lg font-semibold text-gray-700">{user?.backendOfficeRole || 'N/A'}</p>
                            </div>
                        </div>

                        {/* Column 3: Dates */}
                        <div className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-gray-500 flex items-center"><CakeIcon /> Date of Birth</label>
                                {isEditing ? (
                                    <input type="date" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleFormChange} className="w-full p-2 border border-gray-300 rounded-md shadow-sm" />
                                ) : (
                                    <p className="text-lg font-semibold text-gray-700">{user?.dateOfBirth ? formatDateForInput(user.dateOfBirth) : 'N/A'}</p>
                                )}
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-gray-500 flex items-center"><CalendarIcon /> Date of Joining</label>
                                {isEditing ? (
                                    <input type="date" name="dateOfJoining" value={formData.dateOfJoining} onChange={handleFormChange} className="w-full p-2 border border-gray-300 rounded-md shadow-sm" />
                                ) : (
                                    <p className="text-lg font-semibold text-gray-700">{user?.dateOfJoining ? formatDateForInput(user.dateOfJoining) : 'N/A'}</p>
                                )}
                            </div>
                        </div>

                        {/* Column 4: Email (Read-only) */}
                        <div className="space-y-1">
                            <label className="text-sm font-medium text-gray-500 flex items-center"><UserIcon /> Username (Email)</label>
                            <p className="text-lg font-semibold text-gray-700 break-words">{user?.userIdentifier || 'N/A'}</p>
                        </div>
                    </div>

                    {/* --- NEW: Edit Mode Action Buttons --- */}
                    {isEditing && (
                        <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200">
                             <button
                                type="button"
                                onClick={handleCancelEdit}
                                className="px-5 py-2 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300 transition-colors shadow-sm"
                                disabled={editLoading}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="px-5 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 flex items-center justify-center w-32 transition-colors shadow-md disabled:bg-indigo-400"
                                disabled={editLoading}
                            >
                                {editLoading ? <Spinner size="5" /> : 'Save Changes'}
                            </button>
                        </div>
                    )}
                </div>
            </form>
            {/* --- END UPDATED User Info Card --- */}


            {/* Main Content Grid (Two Columns) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Left Column (Wider): Attendance Marker and Calendar */}
                <div className="lg:col-span-2 space-y-6">
                    <AttendanceMarker
                        selectedDate={selectedDate}
                        onDateChange={handleDateChange}
                        onMarkAttendance={handleMarkAttendance}
                    />
                    <div>
                        <h3 className="text-xl font-semibold mb-3 flex items-center"><CalendarIcon /> Attendance Calendar</h3>
                         <AttendanceCalendar initialMonthString={initialMonthString} key={calendarRefreshKey} />
                    </div>
                </div>

                {/* Right Column (Narrower): Leave Info */}
                <div className="space-y-6">
                    {/* Leave Quota Card */}
                    <div className="bg-white p-5 rounded-xl shadow-md border border-gray-100">
                        <h3 className="text-md font-semibold mb-3 flex items-center text-gray-800"><QuotaIcon /> Leave Quota (Annual)</h3>
                        {leaveQuota ? (
                            <div className="text-sm space-y-2">
                                <p className="flex justify-between"><span>Sick Leave:</span> <span className="font-bold text-blue-700">{leaveQuota.sickLeave ?? 'N/A'} days</span></p>
                                <p className="flex justify-between"><span>Casual Leave:</span> <span className="font-bold text-blue-700">{leaveQuota.casualLeave ?? 'N/A'} days</span></p>
                            </div>
                        ) : (
                            <p className="text-sm text-gray-500 italic">Leave quotas not set.</p>
                        )}
                    </div>

                    {/* Request Leave Card */}
                    <div className="bg-white p-5 rounded-xl shadow-md border border-gray-100">
                         <h3 className="text-md font-semibold mb-3 flex items-center text-gray-800"><RequestIcon /> Request Leave</h3>
                        <LeaveRequestForm onLeaveRequested={handleLeaveRequested} />
                    </div>

                    {/* Leave History Card */}
                    <div className="bg-white p-5 rounded-xl shadow-md border border-gray-100">
                        <h3 className="text-md font-semibold mb-3 flex items-center text-gray-800"><HistoryIcon /> Leave History</h3>
                         <LeaveHistory leaveHistory={leaveHistory} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;