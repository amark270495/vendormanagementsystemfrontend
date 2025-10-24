import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../api/apiService';
import Spinner from '../components/Spinner';
import { usePermissions } from '../hooks/usePermissions';

const MonthlyAttendanceReportPage = () => {
    const { user } = useAuth();
    // *** MODIFIED: Use canApproveAttendance as the controlling permission ***
    // (Or canSendMonthlyReport if you defined that in tableUtils/usePermissions)
    const { canApproveAttendance } = usePermissions();

    const [selectedMonth, setSelectedMonth] = useState('');
    // *** NEW: State for user list and selected user ***
    const [usersList, setUsersList] = useState([]);
    const [selectedUser, setSelectedUser] = useState(''); // Store the username (email)
    
    const [loading, setLoading] = useState(false); // For main action
    const [loadingUsers, setLoadingUsers] = useState(true); // For fetching user list
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [statusMessage, setStatusMessage] = useState(''); // For ongoing status

    // Generate month options (e.g., last 12 months)
    const monthOptions = useMemo(() => {
        const options = [];
        const today = new Date();
        for (let i = 0; i < 12; i++) {
            const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
            const year = date.getFullYear();
            const month = (date.getMonth() + 1).toString().padStart(2, '0');
            const value = `${year}-${month}`;
            const label = date.toLocaleString('default', { month: 'long', year: 'numeric' });
            options.push({ value, label });
        }
        return options;
    }, []);

    // Set default month on initial load
    useEffect(() => {
        if (monthOptions.length > 0) {
            setSelectedMonth(monthOptions[0].value);
        }
    }, [monthOptions]);

    // *** NEW: Fetch users on load ***
    useEffect(() => {
        const fetchUsers = async () => {
            if (!user?.userIdentifier || !canApproveAttendance) {
                setLoadingUsers(false);
                if (user?.userIdentifier) { // Only set error if user is loaded but no permission
                     setError("You do not have permission to access this page.");
                }
                return;
            }
            try {
                setLoadingUsers(true);
                const response = await apiService.getUsers(user.userIdentifier);
                if (response.data.success) {
                    setUsersList(response.data.users || []);
                } else {
                    setError("Failed to load user list.");
                }
            } catch (err) {
                setError("Failed to load user list.");
                console.error("Fetch users error:", err);
            } finally {
                setLoadingUsers(false);
            }
        };

        fetchUsers();
    }, [user?.userIdentifier, canApproveAttendance]);


    // *** MODIFIED: handleSendReport (singular) ***
    const handleSendReport = async () => {
        if (!canApproveAttendance) {
            setError("You do not have permission to send monthly reports.");
            return;
        }
        if (!selectedMonth || !selectedUser) {
            setError("Please select a user and a month.");
            return;
        }

        setLoading(true);
        setError('');
        setSuccess('');
        setStatusMessage(`Generating and sending report for ${selectedUser} for ${selectedMonth}...`);

        try {
            // Call the backend GET endpoint with sendEmail=true
            const response = await apiService.calculateMonthlyAttendance(
                {
                    authenticatedUsername: user.userIdentifier,
                    username: selectedUser, // The user to send to
                    month: selectedMonth,
                    sendEmail: true,
                    details: true // Include details for the email
                }
                // No 'POST' method needed, apiService now handles this as GET
            );

            if (response.data.success) {
                setSuccess(response.data.emailStatus || 'Report sent successfully.');
            } else {
                setError(response.data.message || 'An error occurred while sending the report.');
            }
        } catch (err) {
            console.error("Send report error:", err);
            setError(err.response?.data?.message || "An unexpected error occurred while sending the report.");
        } finally {
            setLoading(false);
            setStatusMessage(''); // Clear status message
            setTimeout(() => { setError(''); setSuccess(''); }, 5000);
        }
    };

    // Check permission for page access
    if (!canApproveAttendance && !loadingUsers) {
        return (
            <div className="text-center text-gray-500 p-10 bg-white rounded-xl shadow-sm border">
                <h3 className="text-lg font-medium">Access Denied</h3>
                <p className="mt-1 text-sm">You do not have permission to access this page.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Monthly Attendance Reports</h1>
                <p className="mt-1 text-gray-600">Generate and email a monthly attendance summary to a specific user.</p>
            </div>

            {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded animate-shake">{error}</div>}
            {success && <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded animate-fadeIn">{success}</div>}
            {statusMessage && <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded">{statusMessage}</div>}


            <div className="bg-white p-6 rounded-xl shadow border border-gray-100">
                <div className="flex flex-col sm:flex-row items-center gap-4">
                    {/* --- NEW: User Selection Dropdown --- */}
                    <div className="flex-1 w-full sm:w-auto">
                        <label htmlFor="userSelect" className="block text-sm font-medium text-gray-700">Select User:</label>
                        <select
                            id="userSelect"
                            value={selectedUser}
                            onChange={(e) => setSelectedUser(e.target.value)}
                            className="mt-1 w-full border border-gray-300 rounded-lg shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
                            disabled={loading || loadingUsers}
                        >
                            <option value="">Select a user...</option>
                            {loadingUsers ? <option>Loading users...</option> : null}
                            {usersList.map(u => (
                                <option key={u.username} value={u.username}>{u.displayName} ({u.username})</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex-1 w-full sm:w-auto">
                        <label htmlFor="monthSelect" className="block text-sm font-medium text-gray-700">Select Month:</label>
                        <select
                            id="monthSelect"
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(e.target.value)}
                            className="mt-1 w-full border border-gray-300 rounded-lg shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
                            disabled={loading || loadingUsers}
                        >
                            {monthOptions.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                    </div>
                    
                    {/* --- MODIFIED: Button text and action --- */}
                    <div className="flex-shrink-0 mt-5">
                        <button
                            onClick={handleSendReport}
                            className="w-full sm:w-auto px-6 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 flex items-center justify-center h-10 shadow-sm transition disabled:bg-indigo-400 disabled:cursor-wait"
                            disabled={loading || loadingUsers || !selectedMonth || !selectedUser}
                        >
                            {loading ? <Spinner size="5" /> : 'Send Report to User'}
                        </button>
                    </div>
                </div>
                 <p className="mt-4 text-xs text-gray-500 italic">
                    Note: This will calculate attendance for the selected user and email them their individual report.
                 </p>
            </div>
        </div>
    );
};

export default MonthlyAttendanceReportPage;