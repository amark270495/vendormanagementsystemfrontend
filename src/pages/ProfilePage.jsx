import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../api/apiService';
import Spinner from '../components/Spinner';
import AttendanceCalendar from '../components/profile/AttendanceCalendar';
import LeaveRequestForm from '../components/profile/LeaveRequestForm';
import LeaveHistory from '../components/profile/LeaveHistory'; // <-- Import the real LeaveHistory component

// Placeholder component (only LeaveQuota remains)
const LeaveQuota = ({ quota }) => (
     <div className="bg-white p-4 rounded-lg border shadow-sm">
        <h3 className="font-semibold text-lg text-gray-800 mb-2">Leave Quota</h3>
         {quota ? (
            <div className="space-y-1 text-sm">
                 <p>Sick Leave: <span className="font-semibold">{quota.sickLeave ?? 'N/A'}</span></p>
                 <p>Casual Leave: <span className="font-semibold">{quota.casualLeave ?? 'N/A'}</span></p>
                 {/* Add more leave types as needed */}
            </div>
         ) : (
             <p className="text-sm text-gray-500">Leave quotas not set.</p>
         )}
    </div>
);


const ProfilePage = () => {
    const { user } = useAuth();
    const [todayAttendance, setTodayAttendance] = useState({ status: 'Loading', reason: null });
    const [leaveQuota, setLeaveQuota] = useState(null);
    const [leaveHistory, setLeaveHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [holidays, setHolidays] = useState({});

    const todayString = new Date().toISOString().split('T')[0];
    const currentMonthString = todayString.substring(0, 7);

    const isTodayWeekend = () => {
        const today = new Date();
        const day = today.getDay();
        return day === 0 || day === 6;
    };

    const fetchLeaveHistory = useCallback(async () => {
        if (!user?.userIdentifier) return;
        try {
            const leaveParams = { authenticatedUsername: user.userIdentifier };
            const leaveRes = await apiService.getLeaveRequests(leaveParams);
            if (leaveRes.data.success) {
                setLeaveHistory(leaveRes.data.requests);
            } else {
                console.warn("Failed to fetch leave history.");
                setLeaveHistory([]);
            }
        } catch (err) {
            console.error("Error fetching leave history:", err);
            setError("Could not load leave history.");
            setLeaveHistory([]);
        }
     }, [user?.userIdentifier]);


    const loadInitialData = useCallback(async () => {
        if (!user?.userIdentifier) return;
        setLoading(true);
        setError('');
        setTodayAttendance({ status: 'Loading', reason: null });

        try {
            const currentYear = new Date().getFullYear().toString();
            const holParams = { year: currentYear, authenticatedUsername: user.userIdentifier };
            let holidayMap = {};
            try {
                const holRes = await apiService.getHolidays(holParams);
                if (holRes.data.success) {
                    holRes.data.holidays.forEach(hol => {
                        holidayMap[hol.date] = hol.description;
                    });
                    setHolidays(holidayMap);
                }
            } catch (holErr) {
                console.warn("Could not fetch holidays:", holErr);
            }

            const isWeekend = isTodayWeekend();
            const holidayReason = holidayMap[todayString];

            if (holidayReason) {
                setTodayAttendance({ status: 'Holiday', reason: holidayReason });
            } else if (isWeekend) {
                 setTodayAttendance({ status: 'Weekend', reason: 'Weekend' });
            } else {
                const attParams = { authenticatedUsername: user.userIdentifier, startDate: todayString, endDate: todayString };
                const attRes = await apiService.getAttendance(attParams);
                if (attRes.data.success && attRes.data.attendance.length > 0) {
                    setTodayAttendance({ status: attRes.data.attendance[0].status, reason: null });
                } else if (attRes.data.success) {
                    setTodayAttendance({ status: 'Not Marked', reason: null });
                } else {
                    console.error("Failed to fetch today's attendance status:", attRes.data.message);
                    setTodayAttendance({ status: 'Error', reason: 'Load failed' });
                }
            }

            try {
                const quotaRes = await apiService.getLeaveConfig({ authenticatedUsername: user.userIdentifier, targetUsername: user.userIdentifier });
                 if (quotaRes.data.success && quotaRes.data.config) {
                     setLeaveQuota(quotaRes.data.config);
                 } else {
                      console.warn("Leave quota not found or failed to fetch.");
                     setLeaveQuota(null);
                 }
            } catch (quotaErr) {
                 console.error("Error fetching leave quota:", quotaErr);
                 setError("Could not load leave quota.");
                 setLeaveQuota(null);
            }

            await fetchLeaveHistory();

        } catch (err) {
            console.error("Failed to load initial profile data:", err);
            setError("Could not load initial profile data. " + (err.message || ''));
             if (!todayAttendance.status || todayAttendance.status === 'Loading') {
                 const isWeekend = isTodayWeekend();
                 const holidayReason = holidays[todayString];
                 if (holidayReason) setTodayAttendance({ status: 'Holiday', reason: holidayReason });
                 else if (isWeekend) setTodayAttendance({ status: 'Weekend', reason: 'Weekend' });
                 else setTodayAttendance({ status: 'Error', reason: 'Failed to load status' });
            }
        } finally {
            setLoading(false);
        }
    }, [user?.userIdentifier, todayString, fetchLeaveHistory, holidays]);


    useEffect(() => {
        loadInitialData();
    }, [loadInitialData]);


    const handleMarkAttendance = async (status) => {
        setError('');
        setSuccess('');
        try {
            const response = await apiService.markAttendance({
                authenticatedUsername: user.userIdentifier,
                date: todayString,
                status: status
            });
            if (response.data.success) {
                setTodayAttendance({ status: status, reason: null });
                setSuccess(`Attendance marked as ${status} for today.`);
            } else {
                setError(response.data.message);
            }
        } catch (err) {
            setError(err.response?.data?.message || `Failed to mark attendance as ${status}.`);
        }
    };

    const getStatusBadgeClass = (status) => {
        switch (status) {
            case 'Present': return 'bg-green-100 text-green-700';
            case 'Absent': return 'bg-red-100 text-red-700';
            case 'Weekend': return 'bg-gray-100 text-gray-700';
            case 'Holiday': return 'bg-yellow-100 text-yellow-700';
            case 'Not Marked': return 'bg-orange-100 text-orange-700';
            case 'Loading': return 'bg-blue-100 text-blue-700 animate-pulse';
            default: return 'bg-gray-100 text-gray-500';
        }
    };


    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-900">My Profile & Attendance</h1>

            {error && <div className="bg-red-50 border-l-4 border-red-400 text-red-700 p-4 rounded-md" role="alert"><p>{error}</p></div>}
            {success && <div className="bg-green-50 border-l-4 border-green-400 text-green-700 p-4 rounded-md" role="alert"><p>{success}</p></div>}

            {/* User Info Section */}
            <div className="bg-white p-6 rounded-lg border shadow-sm grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                 <div className="md:col-span-1 flex items-center space-x-4">
                     <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center text-3xl font-bold text-indigo-600">
                         {user?.userName?.charAt(0) || '?'}
                     </div>
                     <div>
                         <h2 className="text-xl font-semibold text-gray-800">{user?.userName || 'User'}</h2>
                         <p className="text-sm text-gray-500">{user?.userIdentifier || 'No Email'}</p>
                         <p className="text-xs text-gray-500">{user?.backendOfficeRole || 'No Role Assigned'}</p>
                     </div>
                 </div>
                 {/* Today's Attendance Status */}
                 <div className="md:col-span-2 text-center md:text-right">
                     <h3 className="text-sm font-medium text-gray-500 mb-2">Today's Status ({new Date().toLocaleDateString()})</h3>
                     {loading ? (
                         <div className={`inline-block px-3 py-1 text-sm font-semibold rounded-full ${getStatusBadgeClass('Loading')}`}>Loading...</div>
                     ) : todayAttendance.status === 'Not Marked' ? (
                         <div className="space-x-2">
                             <span className={`inline-block px-3 py-1 text-sm font-semibold rounded-full ${getStatusBadgeClass('Not Marked')}`}>Not Marked</span>
                             <button
                                 onClick={() => handleMarkAttendance('Present')}
                                 className="px-3 py-1 bg-green-500 text-white text-xs font-semibold rounded hover:bg-green-600 transition"
                             >
                                 Mark Present
                             </button>
                         </div>
                     ) : (
                         <span className={`inline-block px-3 py-1 text-sm font-semibold rounded-full ${getStatusBadgeClass(todayAttendance.status)}`}>
                             {todayAttendance.status} {todayAttendance.reason ? `(${todayAttendance.reason})` : ''}
                         </span>
                     )}
                 </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Attendance Calendar */}
                <div className="lg:col-span-2">
                    {loading && !error ? (
                        <div className="bg-white p-4 rounded-lg border shadow-sm h-96 flex items-center justify-center"><Spinner /></div>
                    ) : error && !error.includes("attendance") ? (
                         <AttendanceCalendar initialMonthString={currentMonthString} />
                    ) : !error ? (
                        <AttendanceCalendar initialMonthString={currentMonthString} />
                     ) : (
                        <div className="bg-white p-4 rounded-lg border shadow-sm h-96 flex items-center justify-center text-red-500">Failed to load calendar.</div>
                     )}
                </div>

                {/* Side Panel: Leave Quota, Request Form, History */}
                <div className="space-y-6">
                    <LeaveQuota quota={leaveQuota} />
                    <LeaveRequestForm onLeaveRequested={fetchLeaveHistory} />
                    {/* Use the imported LeaveHistory component */}
                    <LeaveHistory leaveHistory={leaveHistory} />
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;