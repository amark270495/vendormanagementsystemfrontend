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


const ProfilePage = () => {
    const { user } = useAuth();
    const [todayStatus, setTodayStatus] = useState(null); // Will store { status: 'Present'/'Absent'/'Pending'/'Weekend' etc, requestedStatus: 'Present'/'Absent'/null }
    const [leaveQuota, setLeaveQuota] = useState(null);
    const [leaveHistory, setLeaveHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const today = new Intl.DateTimeFormat('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit', timeZone: 'UTC' }).format(new Date());
    const initialMonthString = today.substring(0, 7); // YYYY-MM

    // --- Callback to refresh calendar data ---
    // We pass this down to AttendanceCalendar so it can be triggered after marking attendance
    const [calendarRefreshKey, setCalendarRefreshKey] = useState(Date.now());
    const refreshCalendar = () => setCalendarRefreshKey(Date.now());


    const fetchLeaveHistory = useCallback(async () => {
        if (!user?.userIdentifier) return;
        // Simplified: only set state, error handling is in loadInitialData
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

    const loadInitialData = useCallback(async () => {
        if (!user?.userIdentifier) {
            setError("User not identified. Cannot load profile data.");
            setLoading(false);
            return;
        }
        setLoading(true);
        setError('');
        try {
            const [attendanceRes, configRes] = await Promise.all([
                apiService.getAttendance({ authenticatedUsername: user.userIdentifier, username: user.userIdentifier, startDate: today, endDate: today }),
                apiService.getLeaveConfig({ authenticatedUsername: user.userIdentifier, targetUsername: user.userIdentifier })
            ]);

            // Process Attendance - Store more detailed status
            if (attendanceRes?.data?.success && Array.isArray(attendanceRes.data.attendanceRecords) && attendanceRes.data.attendanceRecords.length > 0) {
                 const record = attendanceRes.data.attendanceRecords[0];
                 setTodayStatus({ status: record.status, requestedStatus: record.requestedStatus || null }); // Store both statuses
            } else if (attendanceRes?.data?.success) {
                const todayDate = new Date();
                const dayOfWeek = todayDate.getUTCDay(); // Sunday = 0, Saturday = 6
                if (dayOfWeek === 0 || dayOfWeek === 6) {
                    setTodayStatus({ status: 'Weekend', requestedStatus: null });
                } else {
                    // Check holidays/leave via calendar data later if needed, default to null
                    setTodayStatus(null);
                }
            } else {
                 console.error("Failed to fetch today's attendance status:", attendanceRes?.data?.message);
                 setTodayStatus(null);
            }

            // Process Leave Quota
            if (configRes?.data?.success && configRes.data.config) {
                setLeaveQuota(configRes.data.config);
            } else {
                 console.warn("Failed to fetch leave quota:", configRes?.data?.message);
                 setLeaveQuota(null);
            }

            // Fetch leave history separately
            await fetchLeaveHistory();

        } catch (err) {
            console.error("Could not load initial profile data:", err);
            setError(`Could not load initial profile data. Please try again later.`);
            setTodayStatus(null);
            setLeaveQuota(null);
            setLeaveHistory([]);
        } finally {
            setLoading(false);
        }
    }, [user?.userIdentifier, today, fetchLeaveHistory]);

    useEffect(() => {
        loadInitialData();
    }, [loadInitialData]);


    const handleMarkAttendance = async (requestedStatus) => { // Changed 'status' to 'requestedStatus'
        setActionLoading(true);
        setError('');
        setSuccess('');
        try {
            const response = await apiService.markAttendance({
                authenticatedUsername: user.userIdentifier,
                date: today,
                // *** MODIFIED: Send 'requestedStatus' ***
                requestedStatus: requestedStatus
            });
            if (response.data.success) {
                // *** MODIFIED: Update status to 'Pending' ***
                setTodayStatus({ status: 'Pending', requestedStatus: requestedStatus });
                setSuccess(response.data.message); // Use message from backend
                refreshCalendar(); // Trigger calendar refresh
                setTimeout(() => setSuccess(''), 3000);
            } else {
                setError(response.data.message);
            }
        } catch (err) {
            setError(err.response?.data?.message || `Failed to submit attendance request.`);
        } finally {
            setActionLoading(false);
        }
    };

    const handleLeaveRequested = () => {
        fetchLeaveHistory(); // Re-fetch leave history
        refreshCalendar(); // Refresh calendar to show pending leave (if applicable, though leave is instant approved/rejected for now)
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-[70vh]">
                <Spinner size="12" />
                <p className="ml-4 text-gray-600">Loading your profile...</p>
            </div>
        );
    }

    // Determine if today is eligible for marking attendance
    const isWorkingDayForMarking = todayStatus === null || todayStatus?.status === 'Pending'; // Allow marking if not marked or already pending
    const canMarkAttendance = isWorkingDayForMarking && !actionLoading;

    // --- Today Status Component ---
    const TodayStatusDisplay = () => (
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-6 rounded-xl shadow-md border border-indigo-100 text-center">
            <p className="text-sm font-medium text-indigo-800 mb-3">
                Today's Status ({new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })})
            </p>
            {actionLoading ? (
                <Spinner size="8" />
            ) : todayStatus ? (
                 <span className={`px-4 py-2 text-base font-bold rounded-full shadow-sm ${
                     todayStatus.status === 'Present' ? 'bg-green-100 text-green-800 ring-1 ring-green-200' :
                     todayStatus.status === 'Absent' ? 'bg-red-100 text-red-800 ring-1 ring-red-200' :
                     todayStatus.status === 'On Leave' ? 'bg-purple-100 text-purple-800 ring-1 ring-purple-200' :
                     // *** MODIFIED: Show pending status ***
                     todayStatus.status === 'Pending' ? 'bg-yellow-100 text-yellow-800 ring-1 ring-yellow-200' :
                     'bg-gray-100 text-gray-700 ring-1 ring-gray-200' // Weekend, Holiday, Rejected
                 }`}>
                     {todayStatus.status === 'Pending' ? `Pending (${todayStatus.requestedStatus})` : todayStatus.status}
                 </span>
            ) : (
                 <span className="text-base text-gray-500 italic font-semibold">Not Marked</span>
             )}
             {/* Show buttons only if not already approved/rejected/weekend etc. AND not loading */}
             {canMarkAttendance && (
                 <div className="mt-4 space-x-3 flex justify-center">
                     <button
                         onClick={() => handleMarkAttendance('Present')}
                         className="px-5 py-2 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700 shadow transition"
                    >
                        Mark Present
                     </button>
                     <button
                         onClick={() => handleMarkAttendance('Absent')}
                         className="px-5 py-2 bg-red-600 text-white text-sm font-semibold rounded-lg hover:bg-red-700 shadow transition"
                    >
                        Mark Absent
                     </button>
                 </div>
            )}
             {/* Show message if already marked and final */}
             {todayStatus && !['Pending', null].includes(todayStatus.status) && !isWorkingDayForMarking && (
                 <p className="mt-4 text-sm text-gray-500">Attendance status is final for today.</p>
             )}
        </div>
    );

    return (
        <div className="space-y-8">
             {/* Page Header */}
             <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                 <h1 className="text-3xl font-bold text-gray-800">My Profile & Attendance</h1>
             </div>

            {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 animate-shake">{error}</div>}
            {success && <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4 animate-fadeIn">{success}</div>}

            {/* User Info Card */}
            <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center space-x-4">
                     <span className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center font-bold text-white text-3xl flex-shrink-0 shadow-lg">
                        {user?.userName?.charAt(0).toUpperCase() || '?'}
                    </span>
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">{user?.userName || 'User Name'}</h2>
                        <p className="text-sm text-gray-600">{user?.userIdentifier || 'user@example.com'}</p>
                        <p className="text-sm text-gray-500 font-medium">{user?.backendOfficeRole || 'Role not specified'}</p>
                    </div>
                </div>
            </div>

            {/* Main Content Grid (Two Columns) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Left Column (Wider): Today Status and Calendar */}
                <div className="lg:col-span-2 space-y-6">
                    <TodayStatusDisplay />
                    <div>
                        <h3 className="text-xl font-semibold mb-3 flex items-center"><CalendarIcon /> Attendance Calendar</h3>
                         {/* Pass refresh key to force re-render/re-fetch */}
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
                                {/* Add more leave types if configured */}
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