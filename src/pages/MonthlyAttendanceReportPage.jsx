import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../api/apiService';
import Spinner from '../components/Spinner';
import { usePermissions } from '../hooks/usePermissions';

const MonthlyAttendanceReportPage = () => {
    const { user } = useAuth();
    const { canSendMonthlyReport, canApproveAttendance } = usePermissions();
    const canSendReport = canSendMonthlyReport || canApproveAttendance; 

    const [selectedMonth, setSelectedMonth] = useState('');
    const [selectedYear, setSelectedYear] = useState('');
    
    const [loading, setLoading] = useState(false); 
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [statusMessage, setStatusMessage] = useState(''); 

    // 1. Generate Months (01-12)
    const months = useMemo(() => [
        { value: '01', label: 'January' },
        { value: '02', label: 'February' },
        { value: '03', label: 'March' },
        { value: '04', label: 'April' },
        { value: '05', label: 'May' },
        { value: '06', label: 'June' },
        { value: '07', label: 'July' },
        { value: '08', label: 'August' },
        { value: '09', label: 'September' },
        { value: '10', label: 'October' },
        { value: '11', label: 'November' },
        { value: '12', label: 'December' }
    ], []);

    // 2. Generate Years (Current - 2 to Current + 2)
    const years = useMemo(() => {
        const currentYear = new Date().getFullYear();
        const y = [];
        for (let i = currentYear - 2; i <= currentYear + 2; i++) {
            y.push(i.toString());
        }
        return y;
    }, []);

    // Default to current month/year
    useEffect(() => {
        const now = new Date();
        setSelectedMonth((now.getMonth() + 1).toString().padStart(2, '0'));
        setSelectedYear(now.getFullYear().toString());
    }, []);

    const handleSendConsolidatedReport = async () => {
        if (!canSendReport) {
            setError("You do not have permission to send monthly reports.");
            return;
        }
        if (!selectedMonth || !selectedYear) {
            setError("Please select both a month and a year.");
            return;
        }

        setLoading(true);
        setError('');
        setSuccess('');
        
        // Format YYYY-MM
        const formattedMonthParam = `${selectedYear}-${selectedMonth}`;
        
        setStatusMessage(`Generating consolidated report for ${formattedMonthParam}... This may take a moment.`);

        try {
            const response = await apiService.sendConsolidatedReport(
                {
                    authenticatedUsername: user.userIdentifier,
                    month: formattedMonthParam,
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

    if (!canSendReport && !loading) {
        return (
            <div className="text-center text-gray-500 p-10 bg-white rounded-xl shadow-sm border">
                <h3 className="text-lg font-medium">Access Denied</h3>
                <p className="mt-1 text-sm text-gray-500">You do not have permission to access this page.</p>
            </div>
        );
    }
    
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
                <div className="flex flex-col sm:flex-row items-end gap-4">
                    
                    {/* Month Selector */}
                    <div className="flex-1 w-full sm:w-auto">
                        <label htmlFor="monthSelect" className="block text-sm font-medium text-gray-700 mb-1">Month</label>
                        <select
                            id="monthSelect"
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(e.target.value)}
                            className="w-full border border-gray-300 rounded-lg shadow-sm p-2 h-[42px] focus:ring-indigo-500 focus:border-indigo-500"
                            disabled={loading}
                        >
                            {months.map(m => (
                                <option key={m.value} value={m.value}>{m.label}</option>
                            ))}
                        </select>
                    </div>

                    {/* Year Selector */}
                    <div className="flex-1 w-full sm:w-auto">
                        <label htmlFor="yearSelect" className="block text-sm font-medium text-gray-700 mb-1">Year</label>
                        <select
                            id="yearSelect"
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(e.target.value)}
                            className="w-full border border-gray-300 rounded-lg shadow-sm p-2 h-[42px] focus:ring-indigo-500 focus:border-indigo-500"
                            disabled={loading}
                        >
                            {years.map(y => (
                                <option key={y} value={y}>{y}</option>
                            ))}
                        </select>
                    </div>
                    
                    {/* Submit Button */}
                    <div className="w-full sm:w-auto">
                        <button
                            onClick={handleSendConsolidatedReport}
                            className="w-full px-6 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 flex items-center justify-center h-[42px] shadow-sm transition disabled:bg-indigo-400 disabled:cursor-wait"
                            disabled={loading || !selectedMonth || !selectedYear}
                        >
                            {loading ? <Spinner size="5" /> : 'Send Report'}
                        </button>
                    </div>
                </div>
                 <p className="mt-4 text-xs text-gray-500 italic">
                    Note: This will calculate attendance for *all* users for the selected period and email a single Excel file to the designated admin address.
                 </p>
            </div>
        </div>
    );
};

export default MonthlyAttendanceReportPage;