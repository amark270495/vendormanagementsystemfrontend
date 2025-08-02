import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { usePermissions } from '../hooks/usePermissions';
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
    'TaprootTexasDisplay': { title: 'Taproot Texas VMS', companyName: 'Taproot Solutions INC', postingFrom: 'State Of Texas' },
    'VirtusaDisplay':{title: 'Virtusa Taproot',companyName: 'Taproot Solutions INC', postingFrom: 'Virtusa'},
    'DeloitteDisplay':{title: 'Deloitte Taproot',companyName: 'Taproot Solutions INC', postingFrom: 'Deloitte'}
};

const ReportsPage = () => {
    const { user } = useAuth();
    const { canViewReports, canEmailReports } = usePermissions();
    const [reportData, setReportData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [filters, setFilters] = useState({ sheetKey: 'taprootVMSDisplay', startDate: '', endDate: '' });
    const [isEmailModalOpen, setEmailModalOpen] = useState(false);

    const generateReport = useCallback(async () => {
        if (!canViewReports) {
            setError("You do not have permission to generate reports.");
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
    }, [filters, user?.userIdentifier, canViewReports]);

    useEffect(() => {
        if (canViewReports) {
            generateReport();
        } else {
            setError("You do not have permission to view reports.");
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
                <h1 className="text-3xl font-bold text-gray-800">Reports</h1>
                <div className="bg-white p-4 rounded-lg shadow-sm border flex flex-wrap items-center justify-between gap-4">
                    <div className="flex flex-wrap items-center gap-4">
                        <select name="sheetKey" value={filters.sheetKey} onChange={handleFilterChange} className="shadow-sm border-gray-300 rounded-md" disabled={!canViewReports}>
                            {Object.entries(DASHBOARD_CONFIGS).map(([key, config]) => (
                                <option key={key} value={key}>{config.title}</option>
                            ))}
                        </select>
                        <input type="date" name="startDate" value={filters.startDate} onChange={handleFilterChange} className="shadow-sm border-gray-300 rounded-md" disabled={!canViewReports}/>
                        <input type="date" name="endDate" value={filters.endDate} onChange={handleFilterChange} className="shadow-sm border-gray-300 rounded-md" disabled={!canViewReports}/>
                    </div>
                    <div className="flex items-center space-x-2">
                        <button onClick={generateReport} className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700" disabled={loading || !canViewReports}>
                            {loading ? <Spinner size="5" /> : 'Generate Report'}
                        </button>
                         <button onClick={() => setEmailModalOpen(true)} className="px-4 py-2 bg-emerald-500 text-white rounded-md hover:bg-emerald-600" disabled={!reportData || !canEmailReports}>
                            Email Report
                        </button>
                    </div>
                </div>

                {loading && <div className="flex justify-center items-center h-64"><Spinner /></div>}
                {error && <div className="text-red-500 bg-red-100 p-4 rounded-lg">Error: {error}</div>}
                
                {reportData && canViewReports ? (
                    <div className="space-y-8">
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 text-center">
                            <div className="bg-white p-4 rounded-lg shadow-lg border"><p className="text-3xl font-extrabold text-gray-800">{reportData.totalJobs}</p><p className="text-sm text-gray-500">Total Jobs</p></div>
                            <div className="bg-white p-4 rounded-lg shadow-lg border"><p className="text-3xl font-extrabold text-green-600">{reportData.openJobs}</p><p className="text-sm text-gray-500">Open</p></div>
                            <div className="bg-white p-4 rounded-lg shadow-lg border"><p className="text-3xl font-extrabold text-red-600">{reportData.closedJobs}</p><p className="text-sm text-gray-500">Closed</p></div>
                            <div className="bg-white p-4 rounded-lg shadow-lg border"><p className="text-3xl font-extrabold text-blue-600">{reportData.totalResumesSubmitted}</p><p className="text-sm text-gray-500">Submitted</p></div>
                            <div className="bg-white p-4 rounded-lg shadow-lg border"><p className="text-3xl font-extrabold text-gray-800">{reportData.totalMaxSubmissions}</p><p className="text-sm text-gray-500">Max Allowed</p></div>
                        </div>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <div className="bg-white p-6 rounded-lg shadow-lg border h-[400px]"><h3 className="font-semibold text-lg text-gray-800 mb-4 text-center">Jobs by Client</h3><div className="relative w-full h-full"><ChartComponent type='bar' options={chartOptions} data={getChartData(Object.keys(reportData.clientJobCounts), Object.values(reportData.clientJobCounts), '# of Jobs')} /></div></div>
                            <div className="bg-white p-6 rounded-lg shadow-lg border h-[400px]"><h3 className="font-semibold text-lg text-gray-800 mb-4 text-center">Jobs by Position Type</h3><div className="relative w-full h-full"><ChartComponent type='pie' options={chartOptions} data={getChartData(Object.keys(reportData.positionTypeCounts), Object.values(reportData.positionTypeCounts), '# of Jobs')} /></div></div>
                            <div className="bg-white p-6 rounded-lg shadow-lg border lg:col-span-2 h-[400px]"><h3 className="font-semibold text-lg text-gray-800 mb-4 text-center">Jobs by Assignee</h3><div className="relative w-full h-full"><ChartComponent type='doughnut' options={chartOptions} data={getChartData(Object.keys(reportData.workingByCounts), Object.values(reportData.workingByCounts), '# of Jobs')} /></div></div>
                        </div>
                    </div>
                ) : (!loading && !error && <p className="text-center text-gray-500 p-4">Select filters and click "Generate Report" to view data.</p>)}
            </div>
            <EmailReportModal isOpen={isEmailModalOpen} onClose={() => setEmailModalOpen(false)} sheetKey={filters.sheetKey}/>
        </>
    );
};

export default ReportsPage;