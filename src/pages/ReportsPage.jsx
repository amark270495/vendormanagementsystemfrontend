import React, { useState, useEffect, useCallback } from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from 'chart.js';
import { Bar, Pie, Doughnut } from 'react-chartjs-2';
import axios from 'axios';
import { useAuth } from '../context/AuthContext'; 

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

// --- Standalone Components ---

const Spinner = ({ size = '8' }) => (
    <div className="flex justify-center items-center">
        <div className={`w-${size} h-${size} border-4 border-t-transparent border-indigo-600 rounded-full animate-spin`}></div>
    </div>
);

const ChartComponent = ({ type, options, data }) => {
    // Defensive check for empty or malformed chart data
    if (!data || !data.labels || data.labels.length === 0) {
        return <div className="flex justify-center items-center h-full text-gray-500 italic">No data to display.</div>;
    }
    const commonOptions = { responsive: true, maintainAspectRatio: false, ...options };
    if (type === 'bar') return <Bar options={commonOptions} data={data} />;
    if (type === 'pie') return <Pie options={commonOptions} data={data} />;
    if (type === 'doughnut') return <Doughnut options={commonOptions} data={data} />;
    return <div className="text-red-500">Unknown chart type: {type}</div>;
};

const EmailReportModal = ({ isOpen, onClose, sheetKey, authenticatedUsername }) => {
    const { user } = useAuth();
    const canEmailReports = user?.permissions?.canEmailReports;
    
    const [toEmails, setToEmails] = useState('');
    const [ccEmails, setCcEmails] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [isSending, setIsSending] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    useEffect(() => {
        if (isOpen) {
            setToEmails(''); setCcEmails(''); setStatusFilter('all');
            setError(''); setSuccessMessage(''); setIsSending(false);
        }
    }, [isOpen]);

    const handleSendEmail = async () => {
        if (!canEmailReports) {
            setError("You do not have permission to send email reports.");
            return;
        }
        const toEmailArray = toEmails.split(',').map(e => e.trim()).filter(Boolean);
        const ccEmailArray = ccEmails.split(',').map(e => e.trim()).filter(Boolean);
        if (toEmailArray.length === 0) {
            setError("Please provide at least one recipient email.");
            return;
        }
        setIsSending(true); setError(''); setSuccessMessage('');

        try {
            const response = await apiService.generateAndSendJobReport(sheetKey, statusFilter, toEmailArray, ccEmailArray, authenticatedUsername);
            if (response.data.success) {
                setSuccessMessage(response.data.message || 'Report sent successfully!');
                setTimeout(onClose, 2000);
            } else {
                 setError(response.data.message || 'Error sending report.');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to send report.');
        } finally {
            setIsSending(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4">
            <div className="bg-white p-6 rounded-2xl shadow-2xl w-full max-w-lg">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-gray-800">Email Job Report</h2>
                    <button onClick={onClose} disabled={isSending} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
                </div>
                {error && <div className="bg-red-100 text-red-700 px-4 py-3 rounded mb-4 text-sm">{error}</div>}
                {successMessage && <div className="bg-green-100 text-green-700 px-4 py-3 rounded mb-4 text-sm">{successMessage}</div>}
                {!canEmailReports ? (
                    <div className="text-center text-gray-500 p-4">
                        <h3 className="font-medium">Access Denied</h3>
                        <p className="text-sm">Insufficient permissions.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">To (comma-separated)</label>
                            <input type="text" value={toEmails} onChange={e => setToEmails(e.target.value)} className="mt-1 block w-full border rounded-md p-2" placeholder="e.g. boss@company.com" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">CC</label>
                            <input type="text" value={ccEmails} onChange={e => setCcEmails(e.target.value)} className="mt-1 block w-full border rounded-md p-2" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Status Filter</label>
                            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="mt-1 block w-full border rounded-md p-2 bg-white">
                                <option value="all">All</option>
                                <option value="Open">Open</option>
                                <option value="Closed">Closed</option>
                            </select>
                        </div>
                    </div>
                )}
                <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
                    <button onClick={onClose} disabled={isSending} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
                    {canEmailReports && (
                        <button onClick={handleSendEmail} disabled={isSending} className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 w-32 flex justify-center">
                            {isSending ? <Spinner size="5" /> : 'Send Email'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

// --- API Service ---

const apiClient = axios.create({
    baseURL: '/api',
    headers: { 'Content-Type': 'application/json' },
});

const apiService = {
    getReportData: (params) => apiClient.get('/getReportData', { params }),
    getCandidateReportData: (params) => apiClient.get('/getCandidateReportData', { params }),
    generateAndSendJobReport: (sheetKey, statusFilter, toEmails, ccEmails, authenticatedUsername) => 
        apiClient.post('/generateAndSendJobReport', { sheetKey, statusFilter, toEmails, ccEmails, authenticatedUsername }),
};

// --- Constants ---

const DASHBOARD_CONFIGS = {
    'ecaltVMSDisplay': { title: 'Eclat VMS' },
    'taprootVMSDisplay': { title: 'Taproot VMS' },
    'michiganDisplay': { title: 'Michigan VMS' },
    'EclatTexasDisplay': { title: 'Eclat Texas VMS' },
    'TaprootTexasDisplay': { title: 'Taproot Texas VMS' },
    'VirtusaDisplay': { title: 'Virtusa Taproot' },
    'DeloitteDisplay': { title: 'Deloitte Taproot' },
    // --- ADDED FIX for TSI - BDR Openings ---
    'tsiBdrDisplay': { title: 'TSI - BDM Openings' }
};

// --- Main Page ---

const ReportsPage = () => {
    const { user, loading: authLoading, isAuthenticated } = useAuth();
    
    const canViewReports = user?.permissions?.canViewReports ?? false;
    const canEmailReports = user?.permissions?.canEmailReports ?? false;
    
    const [reportType, setReportType] = useState('jobPostings');
    const [reportData, setReportData] = useState(null);
    const [dataLoading, setDataLoading] = useState(false);
    const [error, setError] = useState('');
    const [filters, setFilters] = useState({ 
        sheetKey: 'taprootVMSDisplay', 
        startDate: '', 
        endDate: '' 
    });
    const [isEmailModalOpen, setEmailModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const generateReport = useCallback(async () => {
        if (authLoading || !isAuthenticated) return;
        if (!canViewReports) {
            setError("You do not have permission to view reports.");
            return;
        }

        setDataLoading(true);
        setError('');
        setReportData(null); // Clear previous data to prevent rendering mixed data types
        
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
                setError(response.data.message || "An error occurred.");
            }
        } catch (err) {
            setError(err.response?.data?.message || "Failed to fetch report data.");
        } finally {
            setDataLoading(false);
        }
    }, [filters, user?.userIdentifier, canViewReports, reportType, authLoading, isAuthenticated]);

    useEffect(() => {
        if (!authLoading && isAuthenticated) {
            generateReport();
        }
    }, [generateReport, authLoading, isAuthenticated]);

    const handleReportTypeChange = (e) => {
        setReportType(e.target.value);
        setReportData(null); // Force clear on switch
    };

    const chartColors = ['#4f46e5', '#f97316', '#10b981', '#ef4444', '#3b82f6', '#eab308', '#8b5cf6', '#d946ef', '#64748b'];
    const getChartData = (labels, data, label) => ({
        labels: labels || [],
        datasets: [{ label, data: data || [], backgroundColor: chartColors.slice(0, labels?.length || 0), borderWidth: 1 }]
    });

    const filteredChartData = (chartLabels, chartValues) => {
        if (!chartLabels || !chartValues) return { labels: [], values: [] };
        if (!searchTerm) return { labels: chartLabels, values: chartValues };
        
        const lower = searchTerm.toLowerCase();
        const labels = [];
        const values = [];
        chartLabels.forEach((l, i) => {
            if (l.toLowerCase().includes(lower)) {
                labels.push(l);
                values.push(chartValues[i]);
            }
        });
        return { labels, values };
    };

    const renderJobReport = () => {
        if (!reportData) return null;
        const clientData = filteredChartData(Object.keys(reportData.clientJobCounts || {}), Object.values(reportData.clientJobCounts || {}));
        const positionData = filteredChartData(Object.keys(reportData.positionTypeCounts || {}), Object.values(reportData.positionTypeCounts || {}));
        const assigneeData = filteredChartData(Object.keys(reportData.workingByCounts || {}), Object.values(reportData.workingByCounts || {}));

        return (
            <div className="space-y-8 animate-in fade-in duration-500">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-5 text-center">
                    <div className="bg-white p-5 rounded-xl border"><p className="text-3xl font-bold">{reportData.totalJobs || 0}</p><p className="text-xs text-gray-500 uppercase">Total</p></div>
                    <div className="bg-white p-5 rounded-xl border"><p className="text-3xl font-bold text-green-600">{reportData.openJobs || 0}</p><p className="text-xs text-gray-500 uppercase">Open</p></div>
                    <div className="bg-white p-5 rounded-xl border"><p className="text-3xl font-bold text-red-600">{reportData.closedJobs || 0}</p><p className="text-xs text-gray-500 uppercase">Closed</p></div>
                    <div className="bg-white p-5 rounded-xl border"><p className="text-3xl font-bold text-blue-600">{reportData.totalResumesSubmitted || 0}</p><p className="text-xs text-gray-500 uppercase">Resumes</p></div>
                    <div className="bg-white p-5 rounded-xl border"><p className="text-3xl font-bold text-gray-400">{reportData.totalMaxSubmissions || 0}</p><p className="text-xs text-gray-500 uppercase">Max Sub</p></div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="bg-white p-6 rounded-xl border h-[400px] flex flex-col"><h3 className="font-bold mb-4">Jobs by Client</h3><div className="flex-grow"><ChartComponent type='bar' data={getChartData(clientData.labels, clientData.values, 'Jobs')} /></div></div>
                    <div className="bg-white p-6 rounded-xl border h-[400px] flex flex-col"><h3 className="font-bold mb-4">Jobs by Type</h3><div className="flex-grow"><ChartComponent type='pie' data={getChartData(positionData.labels, positionData.values, 'Jobs')} /></div></div>
                    <div className="bg-white p-6 rounded-xl border lg:col-span-2 h-[400px] flex flex-col"><h3 className="font-bold mb-4">Assignee Load</h3><div className="flex-grow"><ChartComponent type='doughnut' data={getChartData(assigneeData.labels, assigneeData.values, 'Jobs')} /></div></div>
                </div>
            </div>
        );
    };

    const renderCandidateReport = () => {
        if (!reportData) return null;
        // Defensive: ensure remarksCount exists
        const rawRemarks = reportData.remarksCount || {};
        const remarksData = filteredChartData(Object.keys(rawRemarks), Object.values(rawRemarks));
        const hiredCount = rawRemarks['Hired'] || 0;
        const totalCandidates = reportData.totalCandidates || 0;

        return (
             <div className="space-y-8 animate-in fade-in duration-500">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-center">
                     <div className="bg-white p-5 rounded-xl border"><p className="text-3xl font-bold">{totalCandidates}</p><p className="text-xs text-gray-500 uppercase">Candidates</p></div>
                     <div className="bg-white p-5 rounded-xl border"><p className="text-3xl font-bold text-green-600">{hiredCount}</p><p className="text-xs text-gray-500 uppercase">Hired</p></div>
                     <div className="bg-white p-5 rounded-xl border"><p className="text-3xl font-bold text-blue-600">{totalCandidates - hiredCount}</p><p className="text-xs text-gray-500 uppercase">Pipeline</p></div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="bg-white p-6 rounded-xl border h-[400px] flex flex-col">
                        <h3 className="font-bold mb-4">Status Distribution</h3>
                        <div className="flex-grow">
                            <ChartComponent type='pie' data={getChartData(remarksData.labels, remarksData.values, 'Candidates')} />
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-xl border h-[400px] flex flex-col">
                        <h3 className="font-bold mb-4">Pipeline Velocity</h3>
                        <div className="flex-grow">
                            <ChartComponent type='bar' options={{indexAxis: 'y'}} data={getChartData(remarksData.labels, remarksData.values, 'Candidates')} />
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    if (authLoading) return <div className="h-screen flex justify-center items-center"><Spinner /></div>;
    if (!isAuthenticated) return <div className="p-10 text-center">Please log in to view this page.</div>;

    return (
        <div className="p-6 bg-gray-50 min-h-screen font-sans">
            <div className="max-w-7xl mx-auto space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Reports Dashboard</h1>
                    <p className="text-sm text-gray-500">Generated for {user?.userName || 'Authorized User'}</p>
                </div>

                <div className="bg-white p-4 rounded-xl shadow-sm border flex flex-wrap items-center justify-between gap-4">
                    <div className="flex flex-wrap items-center gap-3">
                        <input type="text" placeholder="Filter chart data..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="border rounded-lg py-2 px-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
                        <select value={reportType} onChange={handleReportTypeChange} className="border rounded-lg py-2 text-sm bg-white outline-none">
                            <option value="jobPostings">Job Postings</option>
                            <option value="candidates">Candidate Pipeline</option>
                        </select>
                        {reportType === 'jobPostings' && (
                             <select value={filters.sheetKey} onChange={(e) => setFilters(f => ({...f, sheetKey: e.target.value}))} className="border rounded-lg py-2 text-sm bg-white outline-none">
                                {Object.entries(DASHBOARD_CONFIGS).map(([key, config]) => <option key={key} value={key}>{config.title}</option>)}
                            </select>
                        )}
                        <input type="date" value={filters.startDate} onChange={(e) => setFilters(f => ({...f, startDate: e.target.value}))} className="border rounded-lg py-1 px-2 text-sm outline-none" />
                        <span className="text-gray-400 text-sm font-medium">to</span>
                        <input type="date" value={filters.endDate} onChange={(e) => setFilters(f => ({...f, endDate: e.target.value}))} className="border rounded-lg py-1 px-2 text-sm outline-none" />
                    </div>
                    
                    <div className="flex items-center gap-2">
                        <button onClick={generateReport} disabled={dataLoading || !canViewReports} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 text-sm font-medium transition-all shadow-sm">
                            {dataLoading ? <Spinner size="4" /> : 'Update Data'}
                        </button>
                        <button onClick={() => setEmailModalOpen(true)} disabled={!reportData || !canEmailReports || reportType !== 'jobPostings'} className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 disabled:opacity-50 text-sm font-medium transition-all shadow-sm">
                            Email Report
                        </button>
                    </div>
                </div>

                {error && <div className="p-4 bg-red-50 text-red-700 border border-red-200 rounded-lg text-sm font-medium">{error}</div>}
                
                {!canViewReports ? (
                    <div className="text-center p-20 bg-white rounded-xl border text-gray-500 font-medium">Access Restricted: You do not have permissions to view reports.</div>
                ) : (
                    <>
                        {dataLoading ? <div className="h-96 flex justify-center items-center"><Spinner /></div> : (
                            reportData ? (reportType === 'jobPostings' ? renderJobReport() : renderCandidateReport()) : 
                            <div className="text-center py-20 text-gray-400 bg-white rounded-xl border border-dashed">No data loaded for this selection. Click "Update Data".</div>
                        )}
                    </>
                )}
            </div>

            {canEmailReports && (
                <EmailReportModal 
                    isOpen={isEmailModalOpen} 
                    onClose={() => setEmailModalOpen(false)} 
                    sheetKey={filters.sheetKey}
                    authenticatedUsername={user?.userIdentifier}
                />
            )}
        </div>
    );
};

export default ReportsPage;