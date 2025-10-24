import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../api/apiService';
import Spinner from '../components/Spinner';
import { usePermissions } from '../hooks/usePermissions';

const MonthlyAttendanceReportPage = () => {
    const { user } = useAuth();
    // *** MODIFIED: Use canApproveAttendance as the controlling permission ***
    const { canApproveAttendance } = usePermissions();

    const [selectedMonth, setSelectedMonth] = useState('');
    const [loading, setLoading] = useState(false);
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

    const handleSendReports = async () => {
        if (!canApproveAttendance) {
            setError("You do not have permission to send monthly reports.");
            return;
        }
        if (!selectedMonth) {
            setError("Please select a month.");
            return;
        }

        setLoading(true);
        setError('');
        setSuccess('');
        setStatusMessage(`Sending reports for ${selectedMonth}...`);

        try {
            // Call the backend POST endpoint to trigger calculation and sending
            const response = await apiService.calculateMonthlyAttendance(
                { // Use object payload for POST
                    authenticatedUsername: user.userIdentifier,
                    month: selectedMonth,
                    sendEmail: true
                },
                'POST' // Explicitly mention POST if apiService needs it
            );

            if (response.data.success) {
                setSuccess(response.data.message || 'Reports sent successfully.');
            } else {
                // Handle partial success (HTTP 207) or complete failure
                setError(response.data.message || 'Some reports failed to send.');
                if (response.data.failedUsers && response.data.failedUsers.length > 0) {
                     console.error("Failed users:", response.data.failedUsers);
                     // Optionally display failed users in the error message
                     setError(prev => `${prev} Failed for: ${response.data.failedUsers.join(', ')}`);
                }
            }
        } catch (err) {
            console.error("Send reports error:", err);
            setError(err.response?.data?.message || "An unexpected error occurred while sending reports.");
        } finally {
            setLoading(false);
            setStatusMessage(''); // Clear status message
            // Optionally clear success/error after a delay
            setTimeout(() => { setError(''); setSuccess(''); }, 5000);
        }
    };

    if (!canApproveAttendance) {
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
                <p className="mt-1 text-gray-600">Generate and email monthly attendance summaries to all users.</p>
            </div>

            {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded animate-shake">{error}</div>}
            {success && <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded animate-fadeIn">{success}</div>}
            {statusMessage && <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded">{statusMessage}</div>}


            <div className="bg-white p-6 rounded-xl shadow border border-gray-100">
                <div className="flex flex-col sm:flex-row items-center gap-4">
                    <label htmlFor="monthSelect" className="text-sm font-medium text-gray-700">Select Month:</label>
                    <select
                        id="monthSelect"
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(e.target.value)}
                        className="w-full sm:w-auto border border-gray-300 rounded-lg shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
                        disabled={loading}
                    >
                        {monthOptions.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                    <button
                        onClick={handleSendReports}
                        className="w-full sm:w-auto px-6 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 flex items-center justify-center h-10 shadow-sm transition disabled:bg-indigo-400 disabled:cursor-wait"
                        disabled={loading || !selectedMonth}
                    >
                        {loading ? <Spinner size="5" /> : 'Send Reports to All Users'}
                    </button>
                </div>
                 <p className="mt-4 text-xs text-gray-500 italic">
                    Note: This will calculate attendance for the selected month for *all* users in the system and email them their individual reports. This might take a moment.
                 </p>
            </div>
        </div>
    );
};

export default MonthlyAttendanceReportPage;