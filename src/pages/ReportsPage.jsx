import React, { useState, useEffect, useCallback } from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from 'chart.js';
import { Bar, Pie, Doughnut } from 'react-chartjs-2';
import axios from 'axios';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

// --- Standalone Component Definitions ---
// The following are self-contained implementations of the components 
// your ReportsPage depends on, removing the need for external imports.

/**
 * Spinner Component: A simple loading indicator.
 */
const Spinner = ({ size = '8' }) => (
    <div className="flex justify-center items-center">
        <div className={`w-${size} h-${size} border-4 border-t-transparent border-indigo-600 rounded-full animate-spin`}></div>
    </div>
);

/**
 * ChartComponent: A wrapper around react-chartjs-2 to render different chart types.
 */
const ChartComponent = ({ type, options, data }) => {
    if (!data) return <div className="flex justify-center items-center h-full text-gray-500">No data to display.</div>;
    
    const commonOptions = {
        responsive: true,
        maintainAspectRatio: false,
        ...options,
    };

    if (type === 'bar') return <Bar options={commonOptions} data={data} />;
    if (type === 'pie') return <Pie options={commonOptions} data={data} />;
    if (type === 'doughnut') return <Doughnut options={commonOptions} data={data} />;
    
    return <div className="text-red-500">Unknown chart type: {type}</div>;
};

/**
 * EmailReportModal Component: A modal dialog for emailing reports.
 */
const EmailReportModal = ({ isOpen, onClose, sheetKey }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4">
      <div className="bg-white p-6 rounded-2xl shadow-2xl w-full max-w-md transform transition-all" role="dialog" aria-modal="true">
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-800">Email Report</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">&times;</button>
        </div>
        <p className="mb-4 text-gray-600">This feature would send a report for the selected VMS.</p>
        <p className="mb-6 text-sm text-gray-500">
            Selected VMS: <span className="font-semibold text-gray-900">{sheetKey}</span>
        </p>
        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300">
            Cancel
          </button>
           <button onClick={() => alert('Sending report... (simulation)')} className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700">
            Send Email
          </button>
        </div>
      </div>
    </div>
  );
};


// --- API Service and Authentication Hooks ---
// These are based on the code you previously provided.

const apiClient = axios.create({
    baseURL: '/api',
    headers: { 'Content-Type': 'application/json' },
});

const apiService = {
    getReportData: (params) => apiClient.get('/getReportData', { params }),
    getCandidateReportData: (params) => apiClient.get('/getCandidateReportData', { params }),
};

const useAuth = () => {
    const savedUser = sessionStorage.getItem('vms_user');
    return {
        user: savedUser ? JSON.parse(savedUser) : { userIdentifier: 'previewUser', permissions: {} }
    };
};

const usePermissions = () => {
    const { user } = useAuth();
    return {
        canViewReports: user?.permissions?.canViewReports ?? true,
        canEmailReports: user?.permissions?.canEmailReports ?? true,
    };
};

// --- Main Reports Page Component ---

const DASHBOARD_CONFIGS = {
    'ecaltVMSDisplay': { title: 'Eclat VMS' },
    'taprootVMSDisplay': { title: 'Taproot VMS' },
    'michiganDisplay': { title: 'Michigan VMS' },
    'EclatTexasDisplay': { title: 'Eclat Texas VMS' },
    'TaprootTexasDisplay': { title: 'Taproot Texas VMS' },
    'VirtusaDisplay': { title: 'Virtusa Taproot' },
    'DeloitteDisplay': { title: 'Deloitte Taproot' }
};

const ReportsPage = () => {
    const { user } = useAuth();
    const { canViewReports, canEmailReports } = usePermissions();
    
    const [reportType, setReportType] = useState('jobPostings');
    const [reportData, setReportData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [filters, setFilters] = useState({ 
        sheetKey: 'taprootVMSDisplay', 
        startDate: '', 
        endDate: '' 
    });
    const [isEmailModalOpen, setEmailModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const generateReport = useCallback(async () => {
        if (!canViewReports) {
            setError("You do not have permission to generate reports.");
            setLoading(false);
            return;
        }
        setLoading(true);
        setError('');
        setReportData(null);
        
        try {
            let response;
            const params = {
                authenticatedUsername: user.userIdentifier,
                startDate: filters.startDate,
                endDate: filters.endDate,
            };

            if (reportType === 'jobPostings') {
                params.sheetKey = filters.sheetKey;
                response = await apiService.getReportData(params);
            } else {
                response = await apiService.getCandidateReportData(params);
            }

            if (response.data.success) {
                setReportData(response.data);
            } else {
                setError(response.data.message || "An unknown error occurred.");
            }
        } catch (err) {
            console.error("API call failed:", err);
            setError("Failed to fetch report data. Displaying sample data for preview.");
            if (reportType === 'jobPostings') {
                setReportData({
                    totalJobs: 120, openJobs: 75, closedJobs: 45, totalResumesSubmitted: 350, totalMaxSubmissions: 600,
                    clientJobCounts: { 'Client A': 30, 'Client B': 50, 'Client C': 40 },
                    positionTypeCounts: { 'Full-Time': 80, 'Contract': 40 },
                    workingByCounts: { 'Alice': 50, 'Bob': 40, 'Charlie': 30 }
                });
            } else {
                setReportData({
                    totalCandidates: 250,
                    remarksCount: { 'Hired': 25, 'Interview Scheduled': 50, 'Offer Extended': 20, 'Rejected': 40, 'Screening': 85, 'No Update': 30 }
                });
            }
        } finally {
            setLoading(false);
        }
    }, [filters, user?.userIdentifier, canViewReports, reportType]);

    useEffect(() => {
        generateReport();
    }, [generateReport]);

    const handleFilterChange = (e) => setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
    const handleReportTypeChange = (e) => setReportType(e.target.value);
    
    const chartOptions = { plugins: { legend: { position: 'top' } } };
    const chartColors = ['#4f46e5', '#f97316', '#10b981', '#ef4444', '#3b82f6', '#eab308', '#8b5cf6', '#d946ef', '#64748b'];
    const getChartData = (labels, data, label) => ({
        labels,
        datasets: [{ label, data, backgroundColor: chartColors.slice(0, labels.length), borderWidth: 1 }]
    });

    const filteredChartData = (chartLabels, chartValues) => {
        if (!searchTerm || !chartLabels) {
            return { labels: chartLabels || [], values: chartValues || [] };
        }
        const lowercasedFilter = searchTerm.toLowerCase();
        const filteredLabels = [];
        const filteredValues = [];
        chartLabels.forEach((label, index) => {
            if (label.toLowerCase().includes(lowercasedFilter)) {
                filteredLabels.push(label);
                filteredValues.push(chartValues[index]);
            }
        });
        return { labels: filteredLabels, values: filteredValues };
    };

    const renderJobReport = () => {
        const clientData = filteredChartData(Object.keys(reportData.clientJobCounts), Object.values(reportData.clientJobCounts));
        const positionData = filteredChartData(Object.keys(reportData.positionTypeCounts), Object.values(reportData.positionTypeCounts));
        const assigneeData = filteredChartData(Object.keys(reportData.workingByCounts), Object.values(reportData.workingByCounts));

        return (
            <div className="space-y-8">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-5 text-center">
                    <div className="bg-white p-5 rounded-xl shadow-sm border"><p className="text-4xl font-extrabold text-gray-800">{reportData.totalJobs}</p><p className="text-sm text-gray-500 mt-1">Total Jobs</p></div>
                    <div className="bg-white p-5 rounded-xl shadow-sm border"><p className="text-4xl font-extrabold text-green-600">{reportData.openJobs}</p><p className="text-sm text-gray-500 mt-1">Open</p></div>
                    <div className="bg-white p-5 rounded-xl shadow-sm border"><p className="text-4xl font-extrabold text-red-600">{reportData.closedJobs}</p><p className="text-sm text-gray-500 mt-1">Closed</p></div>
                    <div className="bg-white p-5 rounded-xl shadow-sm border"><p className="text-4xl font-extrabold text-blue-600">{reportData.totalResumesSubmitted}</p><p className="text-sm text-gray-500 mt-1">Submitted</p></div>
                    <div className="bg-white p-5 rounded-xl shadow-sm border"><p className="text-4xl font-extrabold text-gray-800">{reportData.totalMaxSubmissions}</p><p className="text-sm text-gray-500 mt-1">Max Allowed</p></div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="bg-white p-6 rounded-xl shadow-sm border h-[450px] flex flex-col"><h3 className="font-bold text-lg text-gray-800 mb-4 text-center">Jobs by Client</h3><div className="relative flex-grow"><ChartComponent type='bar' options={chartOptions} data={getChartData(clientData.labels, clientData.values, '# of Jobs')} /></div></div>
                    <div className="bg-white p-6 rounded-xl shadow-sm border h-[450px] flex flex-col"><h3 className="font-bold text-lg text-gray-800 mb-4 text-center">Jobs by Position Type</h3><div className="relative flex-grow"><ChartComponent type='pie' options={chartOptions} data={getChartData(positionData.labels, positionData.values, '# of Jobs')} /></div></div>
                    <div className="bg-white p-6 rounded-xl shadow-sm border lg:col-span-2 h-[450px] flex flex-col"><h3 className="font-bold text-lg text-gray-800 mb-4 text-center">Jobs by Assignee</h3><div className="relative flex-grow"><ChartComponent type='doughnut' options={chartOptions} data={getChartData(assigneeData.labels, assigneeData.values, '# of Jobs')} /></div></div>
                </div>
            </div>
        );
    };
    
    const renderCandidateReport = () => {
        const remarksData = filteredChartData(Object.keys(reportData.remarksCount), Object.values(reportData.remarksCount));

        return (
             <div className="space-y-8">
                <div className="grid grid-cols-1 text-center">
                     <div className="bg-white p-5 rounded-xl shadow-sm border w-full md:w-1/3 mx-auto">
                         <p className="text-4xl font-extrabold text-gray-800">{reportData.totalCandidates}</p>
                         <p className="text-sm text-gray-500 mt-1">Total Candidates Processed</p>
                     </div>
                </div>
                <div className="grid grid-cols-1">
                    <div className="bg-white p-6 rounded-xl shadow-sm border h-[500px] flex flex-col">
                        <h3 className="font-bold text-lg text-gray-800 mb-4 text-center">Candidate Pipeline by Status</h3>
                        <div className="relative flex-grow">
                            <ChartComponent 
                                type='bar' 
                                options={{...chartOptions, indexAxis: 'y' }}
                                data={getChartData(remarksData.labels, remarksData.values, '# of Candidates')} 
                            />
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const shouldRenderReport = () => {
        if (!reportData || !canViewReports) return false;
        if (reportType === 'jobPostings' && reportData.totalJobs !== undefined) return true;
        if (reportType === 'candidates' && reportData.totalCandidates !== undefined) return true;
        return false;
    };

    return (
        <>
            <div className="p-6 bg-gray-50 min-h-screen">
                <div className="space-y-6">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Reports Dashboard</h1>
                        <p className="mt-1 text-gray-600">Generate and visualize data for job postings and candidate pipelines.</p>
                    </div>

                    <div className="bg-white p-4 rounded-xl shadow-sm border flex flex-wrap items-center justify-between gap-4">
                        <div className="flex flex-wrap items-center gap-4">
                            <input
                                type="text"
                                placeholder="Search chart data..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="shadow-sm border-gray-300 rounded-lg py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500"
                                disabled={!canViewReports || loading}
                            />

                            <select name="reportType" value={reportType} onChange={handleReportTypeChange} className="shadow-sm border-gray-300 rounded-lg py-2 focus:ring-indigo-500 focus:border-indigo-500" disabled={!canViewReports || loading}>
                                <option value="jobPostings">Job Postings Report</option>
                                <option value="candidates">Candidate Pipeline Report</option>
                            </select>
                            
                            {reportType === 'jobPostings' && (
                                 <select name="sheetKey" value={filters.sheetKey} onChange={handleFilterChange} className="shadow-sm border-gray-300 rounded-lg py-2 focus:ring-indigo-500 focus:border-indigo-500" disabled={!canViewReports || loading}>
                                    {Object.entries(DASHBOARD_CONFIGS).map(([key, config]) => (
                                        <option key={key} value={key}>{config.title}</option>
                                    ))}
                                </select>
                            )}

                            <input type="date" name="startDate" value={filters.startDate} onChange={handleFilterChange} className="shadow-sm border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500" disabled={!canViewReports || loading}/>
                            <input type="date" name="endDate" value={filters.endDate} onChange={handleFilterChange} className="shadow-sm border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500" disabled={!canViewReports || loading}/>
                        </div>
                        <div className="flex items-center space-x-3">
                            <button onClick={generateReport} className="px-5 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 flex items-center justify-center h-10 w-40 disabled:bg-indigo-400" disabled={loading || !canViewReports}>
                                {loading ? <Spinner size="5" /> : 'Generate Report'}
                            </button>
                             <button onClick={() => setEmailModalOpen(true)} className="px-5 py-2 bg-emerald-500 text-white font-semibold rounded-lg hover:bg-emerald-600 flex items-center h-10 disabled:opacity-50" disabled={!reportData || !canEmailReports || reportType !== 'jobPostings'}>
                                Email Report
                            </button>
                        </div>
                    </div>

                    {loading && <div className="h-96"><Spinner /></div>}
                    {error && <div className="text-red-600 bg-red-50 p-4 rounded-lg border border-red-200">{error}</div>}
                    
                    {!loading && !error && !canViewReports && (
                        <div className="text-center text-gray-500 p-10 bg-white rounded-xl shadow-sm border">
                            <h3 className="text-lg font-medium">Access Denied</h3>
                            <p className="mt-1 text-sm text-gray-500">You do not have the necessary permissions to view reports.</p>
                        </div>
                    )}
                    
                    {shouldRenderReport() && (
                        reportType === 'jobPostings' ? renderJobReport() : renderCandidateReport()
                    )}

                    {!loading && !error && !reportData && canViewReports && (
                        <div className="text-center text-gray-500 p-10 bg-white rounded-xl shadow-sm border">
                            <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V7a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                            <h3 className="mt-2 text-sm font-medium text-gray-900">No Report Data</h3>
                            <p className="mt-1 text-sm text-gray-500">No data found for the selected filters. Please try a different selection.</p>
                        </div>
                    )}
                </div>
            </div>
            {canEmailReports && (
                <EmailReportModal isOpen={isEmailModalOpen} onClose={() => setEmailModalOpen(false)} sheetKey={filters.sheetKey}/>
            )}
        </>
    );
};

export default ReportsPage;