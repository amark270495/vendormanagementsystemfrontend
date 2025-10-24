import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../api/apiService';
import Spinner from '../components/Spinner';
import { usePermissions } from '../hooks/usePermissions';

const MonthlyAttendanceReportPage = () => {
    const { user } = useAuth();
    // *** Use 'canSendMonthlyReport' or 'canApproveAttendance' ***
    const { canSendMonthlyReport, canApproveAttendance } = usePermissions();
    const canSendReport = canSendMonthlyReport || canApproveAttendance; // Combine permissions

    const [selectedMonth, setSelectedMonth] = useState('');
    // *** REMOVED: User selection state ***
    
    const [loading, setLoading] = useState(false); // For main action
    // *** REMOVED: loadingUsers state ***
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [statusMessage, setStatusMessage] = useState(''); // For ongoing status

    // Generate month options
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

    // Set default month
    useEffect(() => {
        if (monthOptions.length > 0) {
            setSelectedMonth(monthOptions[0].value);
        }
    }, [monthOptions]);

    // *** REMOVED: Fetch users useEffect ***

    // *** MODIFIED: handleSendConsolidatedReport ***
    const handleSendConsolidatedReport = async () => {
        if (!canSendReport) {
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
        setStatusMessage(`Generating consolidated report for ${selectedMonth}... This may take a moment.`);

        try {
            // Call the new backend POST endpoint
            const response = await apiService.sendConsolidatedReport(
                {
                    authenticatedUsername: user.userIdentifier,
                    month: selectedMonth,
                }
            );

            if (response.data.success) {
                setSuccess(response.data.message || 'Report sent successfully.');
            } else {
                setError(response.data.message || 'An error occurred while sending the report.');
            }
        } catch (err) {
            console.error("Send report error:", err);
            setError(err.response?.data?.message || "An unexpected error occurred while sending the report.");
        } finally {
            setLoading(false);
            setStatusMessage('');
            setTimeout(() => { setError(''); setSuccess(''); }, 5000);
        }
    };

    // Check permission for page access
    if (!canSendReport && !loading) {
        return (
            <div className="text-center text-gray-500 p-10 bg-white rounded-xl shadow-sm border">
                <h3 className="text-lg font-medium">Access Denied</h3>
                <p className="mt-1 text-sm">You do not have permission to access this page.</p>
            </div>
        );
    }
    
    // Show spinner if permission check is still loading
    if (loading) {
         return <div className="flex justify-center items-center h-64"><Spinner size="12" /></div>;
    }


    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Monthly Attendance Reports</h1>
                <p className="mt-1 text-gray-600">Generate and email a consolidated attendance summary for all users to the admin.</p>
            </div>

            {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded animate-shake">{error}</div>}
            {success && <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded animate-fadeIn">{success}</div>}
            {statusMessage && <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded">{statusMessage}</div>}


            <div className="bg-white p-6 rounded-xl shadow border border-gray-100">
                <div className="flex flex-col sm:flex-row items-center gap-4">
                    {/* --- REMOVED: User Selection Dropdown --- */}
                    
                    <div className="flex-1 w-full sm:w-auto">
                        <label htmlFor="monthSelect" className="block text-sm font-medium text-gray-700">Select Month:</label>
                        <select
                            id="monthSelect"
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(e.target.value)}
                            className="mt-1 w-full border border-gray-300 rounded-lg shadow-sm p-2 h-[42px] focus:ring-indigo-500 focus:border-indigo-500"
                            disabled={loading}
                        >
                            {monthOptions.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                    </div>
                    
                    {/* --- MODIFIED: Button text and action --- */}
                    <div className="flex-shrink-0 mt-5">
                        <button
                            onClick={handleSendConsolidatedReport}
                            className="w-full sm:w-auto px-6 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 flex items-center justify-center h-10 shadow-sm transition disabled:bg-indigo-400 disabled:cursor-wait"
                            disabled={loading || !selectedMonth}
                        >
                            {loading ? <Spinner size="5" /> : 'Send Consolidated Report'}
                        </button>
                    </div>
                </div>
                 <p className="mt-4 text-xs text-gray-500 italic">
                    Note: This will calculate attendance for *all* users and email a single Excel file to the designated admin address.
                 </p>
            </div>
        </div>
    );
};

export default MonthlyAttendanceReportPage;