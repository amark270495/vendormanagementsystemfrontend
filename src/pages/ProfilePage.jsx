import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../api/apiService';
import Spinner from '../components/Spinner';
import AttendanceCalendar from '../components/profile/AttendanceCalendar'; // Import the real component
import LeaveRequestForm from '../components/profile/LeaveRequestForm';   // Import the real component
import LeaveHistory from '../components/profile/LeaveHistory';         // Import the real component

const ProfilePage = () => {
    const { user } = useAuth();
    const [todayStatus, setTodayStatus] = useState(null); // 'Present', 'Absent', 'Weekend', 'Holiday', 'On Leave', null (loading/future)
    const [leaveQuota, setLeaveQuota] = useState(null); // { sickLeave: X, casualLeave: Y }
    const [leaveHistory, setLeaveHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const today = new Intl.DateTimeFormat('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit', timeZone: 'UTC' }).format(new Date());
    const initialMonthString = today.substring(0, 7); // YYYY-MM

    // Fetch Leave History
    const fetchLeaveHistory = useCallback(async () => {
        if (!user?.userIdentifier) return;
        try {
            const leaveRes = await apiService.getLeaveRequests({
                authenticatedUsername: user.userIdentifier
                // We fetch all statuses for the user's own history
            });
            // --- FIX: Add explicit check for array ---
            if (leaveRes.data.success && Array.isArray(leaveRes.data.requests)) {
                setLeaveHistory(leaveRes.data.requests);
            } else if (leaveRes.data.success) {
                // If success but no requests array, set to empty array
                console.warn("getLeaveRequests succeeded but 'requests' array was missing or not an array.");
                setLeaveHistory([]);
            }
            // --- End FIX ---
             else {
                console.error("Failed to fetch leave history:", leaveRes.data.message);
                // Don't set main error, maybe just log or show a smaller indicator
                 setLeaveHistory([]); // Set empty on error to prevent length error
            }
        } catch (err) {
            console.error("Error fetching leave history:", err);
             setLeaveHistory([]); // Set empty on error to prevent length error
        }
    }, [user?.userIdentifier]);

    // Fetch initial data on load
    const loadInitialData = useCallback(async () => {
        if (!user?.userIdentifier) {
            setError("User not identified. Cannot load profile data.");
            setLoading(false);
            return;
        }
        setLoading(true);
        setError(''); // Clear previous errors
        try {
            // Fetch today's attendance, leave quota in parallel
            const [attendanceRes, configRes] = await Promise.all([
                apiService.getAttendance({ authenticatedUsername: user.userIdentifier, startDate: today, endDate: today }),
                apiService.getLeaveConfig({ authenticatedUsername: user.userIdentifier, targetUsername: user.userIdentifier }) // Fetch own config
            ]);

            // Process Attendance
            // --- FIX: Add safety checks for attendanceRes ---
            if (attendanceRes?.data?.success && Array.isArray(attendanceRes.data.attendance) && attendanceRes.data.attendance.length > 0) {
                 setTodayStatus(attendanceRes.data.attendance[0].status);
            } else if (attendanceRes?.data?.success) {
                // Check if today is weekend or holiday (simplified client-side check)
                const todayDate = new Date();
                const dayOfWeek = todayDate.getUTCDay();
                if (dayOfWeek === 0 || dayOfWeek === 6) {
                    setTodayStatus('Weekend');
                } else {
                    setTodayStatus(null); // No record, not weekend/holiday (will rely on calendar fetch for holidays)
                }
            }
            // --- End FIX ---
             else {
                 // Set specific error if today's status fails
                setError(prev => prev ? prev + "; Failed to load today's status." : "Failed to load today's status.");
                console.error("Failed to fetch today's attendance status:", attendanceRes?.data?.message);
                 setTodayStatus(null); // Ensure it's null on error
            }

            // Process Leave Quota
             // --- FIX: Add safety checks for configRes ---
            if (configRes?.data?.success && configRes.data.config) {
                setLeaveQuota(configRes.data.config);
            } else if (configRes?.data?.success) {
                 setLeaveQuota(null); // Explicitly set null if config object is missing
            }
             // --- End FIX ---
            else {
                 console.error("Failed to fetch leave quota:", configRes?.data?.message);
                 setLeaveQuota(null); // Ensure it's null on error
                // Optionally add to main error: setError(prev => prev ? prev + "; Failed to load leave quotas." : "Failed to load leave quotas.");
            }

            // Fetch leave history separately
            await fetchLeaveHistory();

        } catch (err) {
            console.error("Could not load initial profile data:", err);
            setError(`Could not load initial profile data. ${err.message || ''}`.trim());
             // Ensure states are in a non-error-prone default on failure
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


    const handleMarkAttendance = async (status) => {
        setActionLoading(true);
        setError('');
        setSuccess('');
        try {
            const response = await apiService.markAttendance({
                authenticatedUsername: user.userIdentifier,
                date: today,
                status: status
            });
            if (response.data.success) {
                setTodayStatus(status);
                setSuccess(`Attendance marked as ${status} for today.`);
                setTimeout(() => setSuccess(''), 3000);
                 // Optionally: Trigger calendar refresh if needed, though today's status is directly updated
            } else {
                setError(response.data.message);
            }
        } catch (err) {
            setError(err.response?.data?.message || `Failed to mark attendance as ${status}.`);
        } finally {
            setActionLoading(false);
        }
    };

    // Callback for LeaveRequestForm to trigger history refresh
    const handleLeaveRequested = () => {
        fetchLeaveHistory(); // Re-fetch leave history
    };

    if (loading) {
        return <div className="flex justify-center items-center h-64"><Spinner size="12" /></div>;
    }

    // Determine if attendance buttons should be shown
    const isWorkingDay = todayStatus !== 'Weekend' && todayStatus !== 'Holiday' && todayStatus !== 'On Leave';
    const canMarkAttendance = isWorkingDay && todayStatus !== 'Present' && todayStatus !== 'Absent';

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-800">My Profile & Attendance</h1>

            {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}
            {success && <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">{success}</div>}

            {/* User Info & Today's Status */}
            <div className="bg-white p-6 rounded-lg shadow border flex justify-between items-start">
                <div className="flex items-center space-x-4">
                     <span className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center font-bold text-indigo-700 text-3xl flex-shrink-0">
                        {user?.userName?.charAt(0).toUpperCase() || '?'}
                    </span>
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">{user?.userName || 'User Name'}</h2>
                        <p className="text-sm text-gray-500">{user?.userIdentifier || 'user@example.com'}</p>
                        <p className="text-sm text-gray-500">{user?.backendOfficeRole || 'Role'}</p>
                    </div>
                </div>
                 <div className="text-right">
                    <p className="text-sm text-gray-500 mb-2">Today's Status ({new Date().toLocaleDateString()})</p>
                    {actionLoading ? (
                        <Spinner size="6"/>
                    ) : todayStatus ? (
                         <span className={`px-3 py-1 text-sm font-semibold rounded-full ${
                             todayStatus === 'Present' ? 'bg-green-100 text-green-700' :
                             todayStatus === 'Absent' ? 'bg-red-100 text-red-700' :
                             todayStatus === 'On Leave' ? 'bg-purple-100 text-purple-700' :
                             'bg-gray-100 text-gray-600' // Weekend, Holiday, Future
                         }`}>
                             {todayStatus}
                         </span>
                    ) : isWorkingDay ? (
                         <span className="text-sm text-gray-500 italic">Not Marked</span>
                     ) : (
                         <span className="text-sm text-gray-500 italic">Not Applicable</span>
                     )}
                     {canMarkAttendance && !actionLoading && (
                         <div className="mt-3 space-x-2">
                             <button
                                 onClick={() => handleMarkAttendance('Present')}
                                 className="px-3 py-1 bg-green-500 text-white text-xs font-semibold rounded hover:bg-green-600"
                            >
                                Mark Present
                             </button>
                             <button
                                 onClick={() => handleMarkAttendance('Absent')}
                                 className="px-3 py-1 bg-red-500 text-white text-xs font-semibold rounded hover:bg-red-600"
                            >
                                Mark Absent
                             </button>
                         </div>
                    )}
                 </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Calendar (Takes up 2 cols on large screens) */}
                <div className="lg:col-span-2">
                    <AttendanceCalendar initialMonthString={initialMonthString} />
                </div>

                {/* Leave Section (Takes up 1 col on large screens) */}
                <div className="space-y-6">
                    {/* Leave Quota */}
                    <div className="bg-white p-4 rounded-lg shadow border">
                        <h3 className="text-md font-semibold mb-2">Leave Quota (Annual)</h3>
                        {leaveQuota ? (
                            <div className="text-sm space-y-1">
                                <p>Sick Leave: <span className="font-bold">{leaveQuota.sickLeave ?? 'Not Set'}</span> days</p>
                                <p>Casual Leave: <span className="font-bold">{leaveQuota.casualLeave ?? 'Not Set'}</span> days</p>
                                {/* Add more leave types if configured */}
                            </div>
                        ) : (
                            <p className="text-sm text-gray-500 italic">Leave quotas not set.</p>
                        )}
                    </div>

                    {/* Request Leave Form */}
                    <div className="bg-white p-4 rounded-lg shadow border">
                        <LeaveRequestForm onLeaveRequested={handleLeaveRequested} />
                    </div>

                    {/* Leave History */}
                    <div className="bg-white p-4 rounded-lg shadow border">
                         <LeaveHistory leaveHistory={leaveHistory} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;