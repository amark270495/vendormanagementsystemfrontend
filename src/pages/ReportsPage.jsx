import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { usePermissions } from '../hooks/usePermissions'; // <-- NEW: Import usePermissions
import { apiService } from '../api/apiService';
import Spinner from '../components/Spinner';
import ChartComponent from '../components/ChartComponent';
import EmailReportModal from '../components/EmailReportModal';

// Moved from TopNav for use here
const DASHBOARD_CONFIGS = {
    'ecaltVMSDisplay': { title: 'Eclat VMS', companyName: 'Eclat Solutions LLC', postingFrom: 'All' },
    'taprootVMSDisplay': { title: 'Taproot VMS', companyName: 'Taproot Solutions INC', postingFrom: 'All' },
    'michiganDisplay': { title: 'Michigan VMS', companyName: 'Taproot Solutions INC', postingFrom: 'State Of Michigan' },
    'EclatTexasDisplay': { title: 'Eclat Texas VMS', companyName: 'Eclat Solutions LLC', postingFrom: 'State Of Texas' },
    'TaprootTexasDisplay': { companyName: 'Taproot Solutions INC', postingFrom: 'State Of Texas' },
    'VirtusaDisplay':{title: 'Virtusa Taproot',companyName: 'Taproot Solutions INC', postingFrom: 'Virtusa'},
    'DeloitteDisplay':{title: 'Deloitte Taproot',companyName: 'Taproot Solutions INC', postingFrom: 'Deloitte'}
};

const ReportsPage = () => {
    const { user } = useAuth();
    // NEW: Destructure canViewReports and canEmailReports from usePermissions
    const { canViewReports, canEmailReports } = usePermissions(); 
    
    const [reportData, setReportData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [filters, setFilters] = useState({ sheetKey: 'taprootVMSDisplay', startDate: '', endDate: '' });
    const [isEmailModalOpen, setEmailModalOpen] = useState(false);

    const generateReport = useCallback(async () => {
        // Only attempt to generate report if the user has permission
        if (!canViewReports) {
            setError("You do not have permission to generate reports.");
            setLoading(false);
            return;
        }
        setLoading(true);
        setError('');
        setReportData(null);
        
        const config = DASHBOARD_CONFIGS[filters.sheetKey];
        if (!config) {
            setError(`Invalid dashboard configuration for key: ${filters.sheetKey}`);
            setLoading(false);
            return;
        }

        const reportParams = {
            ...filters,
            authenticatedUsername: user.userIdentifier,
            companyName: config.companyName,
            postingFrom: config.postingFrom
        };

        try {
            const response = await apiService.getReportData(reportParams);
            if (response.data.success) {
                setReportData(response.data);
            } else {
                setError(response.data.message);
            }
        } catch (err) {
            setError(err.response?.data?.message || "Failed to generate report.");
        } finally {
            setLoading(false);
        }
    }, [filters, user?.userIdentifier, canViewReports]); // Add canViewReports to dependencies

    useEffect(() => {
        // Trigger report generation only if the user has permission
        if (canViewReports) {
            generateReport();
        } else {
            setError("You do not have permission to view reports.");
            setLoading(false); // Ensure loading is false if access is denied
        }
    }, [canViewReports, generateReport]);

    const handleFilterChange = (e) => setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));

    const chartOptions = { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'top' } } };
    const chartColors = ['#4f46e5', '#f97316', '#10b981', '#ef4444', '#3b82f6', '#eab308', '#8b5cf6'];
    const getChartData = (labels, data, label) => ({
        labels,
        datasets: [{ label, data, backgroundColor: chartColors.slice(0, labels.length), borderWidth: 1 }]
    });
    
    return (
        <>
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Reports Dashboard</h1>
                    <p className="mt-1 text-gray-600">Generate and visualize job data from different VMS displays.</p>
                </div>

                <div className="bg-white p-4 rounded-xl shadow-sm border flex flex-wrap items-center justify-between gap-4">
                    <div className="flex flex-wrap items-center gap-4">
                        <select name="sheetKey" value={filters.sheetKey} onChange={handleFilterChange} className="shadow-sm border-gray-300 rounded-lg py-2 focus:ring-indigo-500 focus:border-indigo-500" disabled={!canViewReports}> {/* NEW: Disable if no view permission */}
                            {Object.entries(DASHBOARD_CONFIGS).map(([key, config]) => (
                                <option key={key} value={key}>{config.title}</option>
                            ))}
                        </select>
                        <input type="date" name="startDate" value={filters.startDate} onChange={handleFilterChange} className="shadow-sm border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500" disabled={!canViewReports}/> {/* NEW: Disable if no view permission */}
                        <input type="date" name="endDate" value={filters.endDate} onChange={handleFilterChange} className="shadow-sm border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500" disabled={!canViewReports}/> {/* NEW: Disable if no view permission */}
                    </div>
                    <div className="flex items-center space-x-3">
                        <button onClick={generateReport} className="px-5 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 flex items-center h-10 disabled:bg-indigo-400" disabled={loading || !canViewReports}> {/* NEW: Disable if no view permission */}
                            {loading ? <Spinner size="5" /> : 'Generate Report'}
                        </button>
                         <button onClick={() => setEmailModalOpen(true)} className="px-5 py-2 bg-emerald-500 text-white font-semibold rounded-lg hover:bg-emerald-600 flex items-center h-10 disabled:opacity-50" disabled={!reportData || !canEmailReports}> {/* NEW: Disable if no email permission */}
                            Email Report
                        </button>
                    </div>
                </div>

                {loading && <div className="flex justify-center items-center h-96"><Spinner /></div>}
                {error && <div className="text-red-600 bg-red-50 p-4 rounded-lg border border-red-200">Error: {error}</div>}
                
                {!loading && !error && !canViewReports && ( // NEW: Access Denied message if no view permission
                    <div className="text-center text-gray-500 p-10 bg-white rounded-xl shadow-sm border">
                        <h3 className="text-lg font-medium">Access Denied</h3>
                        <p className="mt-1 text-sm text-gray-500">You do not have the necessary permissions to view reports.</p>
                    </div>
                )}

                {reportData && canViewReports ? ( // NEW: Render report data only if canViewReports
                    <div className="space-y-8">
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-5 text-center">
                            <div className="bg-white p-5 rounded-xl shadow-sm border"><p className="text-4xl font-extrabold text-gray-800">{reportData.totalJobs}</p><p className="text-sm text-gray-500 mt-1">Total Jobs</p></div>
                            <div className="bg-white p-5 rounded-xl shadow-sm border"><p className="text-4xl font-extrabold text-green-600">{reportData.openJobs}</p><p className="text-sm text-gray-500 mt-1">Open</p></div>
                            <div className="bg-white p-5 rounded-xl shadow-sm border"><p className="text-4xl font-extrabold text-red-600">{reportData.closedJobs}</p><p className="text-sm text-gray-500 mt-1">Closed</p></div>
                            <div className="bg-white p-5 rounded-xl shadow-sm border"><p className="text-4xl font-extrabold text-blue-600">{reportData.totalResumesSubmitted}</p><p className="text-sm text-gray-500 mt-1">Submitted</p></div>
                            <div className="bg-white p-5 rounded-xl shadow-sm border"><p className="text-4xl font-extrabold text-gray-800">{reportData.totalMaxSubmissions}</p><p className="text-sm text-gray-500 mt-1">Max Allowed</p></div>
                        </div>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <div className="bg-white p-6 rounded-xl shadow-sm border h-[450px] flex flex-col"><h3 className="font-bold text-lg text-gray-800 mb-4 text-center">Jobs by Client</h3><div className="relative flex-grow"><ChartComponent type='bar' options={chartOptions} data={getChartData(Object.keys(reportData.clientJobCounts), Object.values(reportData.clientJobCounts), '# of Jobs')} /></div></div>
                            <div className="bg-white p-6 rounded-xl shadow-sm border h-[450px] flex flex-col"><h3 className="font-bold text-lg text-gray-800 mb-4 text-center">Jobs by Position Type</h3><div className="relative flex-grow"><ChartComponent type='pie' options={chartOptions} data={getChartData(Object.keys(reportData.positionTypeCounts), Object.values(reportData.positionTypeCounts), '# of Jobs')} /></div></div>
                            <div className="bg-white p-6 rounded-xl shadow-sm border lg:col-span-2 h-[450px] flex flex-col"><h3 className="font-bold text-lg text-gray-800 mb-4 text-center">Jobs by Assignee</h3><div className="relative flex-grow"><ChartComponent type='doughnut' options={chartOptions} data={getChartData(Object.keys(reportData.workingByCounts), Object.values(reportData.workingByCounts), '# of Jobs')} /></div></div>
                        </div>
                    </div>
                ) : (!loading && !error && canViewReports && // NEW: Render empty report message only if canViewReports
                    <div className="text-center text-gray-500 p-10 bg-white rounded-xl shadow-sm border">
                        <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" /></svg>
                        <h3 className="mt-2 text-sm font-medium text-gray-900">No Report Generated</h3>
                        <p className="mt-1 text-sm text-gray-500">Select filters and click "Generate Report" to view data.</p>
                    </div>
                )}
            </div>
            <EmailReportModal isOpen={isEmailModalOpen} onClose={() => setEmailModalOpen(false)} sheetKey={filters.sheetKey}/>
        </>
    );
};

export default ReportsPage;