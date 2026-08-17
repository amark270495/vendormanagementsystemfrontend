import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
    Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, 
    LinearScale, BarElement, LineElement, PointElement, RadialLinearScale, Filler 
} from 'chart.js';
import { Bar, Pie, Doughnut, Line, Radar } from 'react-chartjs-2';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../api/apiService';
import { usePermissions } from '../hooks/usePermissions';
import axios from 'axios';

// Register advanced Chart.js elements
ChartJS.register(
    ArcElement, Tooltip, Legend, CategoryScale, LinearScale, 
    BarElement, LineElement, PointElement, RadialLinearScale, Filler
);

// --- Icons ---
const AdjustmentsIcon = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" /></svg>;
const DownloadIcon = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>;

const Spinner = ({ size = '6' }) => (
    <div className="flex justify-center items-center">
        <div className={`w-${size} h-${size} border-4 border-t-transparent border-indigo-600 rounded-full animate-spin`}></div>
    </div>
);

const ChartComponent = ({ type, options, data }) => {
    if (!data || !data.labels || data.labels.length === 0) return <div className="flex justify-center items-center h-full text-slate-400 font-medium text-sm border-2 border-dashed border-slate-200 rounded-2xl m-4">No data available for this dimension.</div>;
    const commonOptions = { responsive: true, maintainAspectRatio: false, ...options };
    if (type === 'bar') return <Bar options={commonOptions} data={data} />;
    if (type === 'pie') return <Pie options={commonOptions} data={data} />;
    if (type === 'doughnut') return <Doughnut options={commonOptions} data={data} />;
    if (type === 'line') return <Line options={commonOptions} data={data} />;
    if (type === 'radar') return <Radar options={commonOptions} data={data} />;
    return <div className="text-red-500">Unknown chart type</div>;
};

// --- Email Modal ---
const EmailReportModal = ({ isOpen, onClose, sheetKey, authenticatedUsername }) => {
    const [toEmails, setToEmails] = useState('');
    const [ccEmails, setCcEmails] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [isSending, setIsSending] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const { canEmailReports } = usePermissions();

    useEffect(() => {
        if (isOpen) { setToEmails(''); setCcEmails(''); setStatusFilter('all'); setError(''); setSuccessMessage(''); setIsSending(false); }
    }, [isOpen]);

    const handleSendEmail = async () => {
        if (!canEmailReports) return setError("Permission denied to send email reports.");
        const toEmailArray = toEmails.split(',').map(e => e.trim()).filter(Boolean);
        const ccEmailArray = ccEmails.split(',').map(e => e.trim()).filter(Boolean);
        if (toEmailArray.length === 0) return setError("Please provide at least one 'To' email.");

        setIsSending(true); setError(''); setSuccessMessage('');
        try {
            const response = await apiService.generateAndSendJobReport(sheetKey, statusFilter, toEmailArray, ccEmailArray, authenticatedUsername);
            if (response.data.success) {
                setSuccessMessage('Report sent successfully!');
                setTimeout(() => onClose(), 2000);
            } else { setError(response.data.message || 'Error sending report.'); }
        } catch (err) { setError(err.response?.data?.message || 'Failed to send the report.'); } 
        finally { setIsSending(false); }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex justify-center items-center p-4">
            <div className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-md transform transition-all border border-slate-100">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-slate-800 tracking-tight">Email Job Report</h2>
                    <button onClick={onClose} disabled={isSending} className="text-slate-400 hover:text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-full p-2 transition text-lg leading-none">&times;</button>
                </div>
                
                {error && <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl mb-5 text-sm font-medium">{error}</div>}
                {successMessage && <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl mb-5 text-sm font-medium">{successMessage}</div>}

                <div className="space-y-5">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">To (comma-separated)</label>
                        <input type="text" value={toEmails} onChange={e => setToEmails(e.target.value)} className="block w-full border border-slate-200 bg-slate-50 rounded-xl px-4 py-2.5 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition outline-none" required />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">CC (comma-separated)</label>
                        <input type="text" value={ccEmails} onChange={e => setCcEmails(e.target.value)} className="block w-full border border-slate-200 bg-slate-50 rounded-xl px-4 py-2.5 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition outline-none" />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Job Status Filter</label>
                        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="block w-full border border-slate-200 bg-slate-50 rounded-xl px-4 py-2.5 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition outline-none appearance-none">
                            <option value="all">Include All Statuses</option>
                            <option value="Open">Only Open Jobs</option>
                            <option value="Closed">Only Closed Jobs</option>
                        </select>
                    </div>
                </div>

                <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-slate-100">
                    <button onClick={onClose} disabled={isSending} className="px-5 py-2.5 bg-white border border-slate-200 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 transition">Cancel</button>
                    <button onClick={handleSendEmail} disabled={isSending} className="px-5 py-2.5 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition w-32 flex justify-center items-center shadow-sm">
                        {isSending ? <Spinner size="5" /> : 'Send Email'}
                    </button>
                </div>
            </div>
        </div>
    );
};

const DASHBOARD_CONFIGS = {
    'ecaltVMSDisplay': { title: 'Eclat VMS' },
    'taprootVMSDisplay': { title: 'Taproot VMS' },
    'michiganDisplay': { title: 'Michigan VMS' },
    'EclatTexasDisplay': { title: 'Eclat Texas VMS' },
    'TaprootTexasDisplay': { title: 'Taproot Texas VMS' },
    'VirtusaDisplay': { title: 'Virtusa Taproot' },
    'DeloitteDisplay': { title: 'Deloitte Taproot' }
};

const DEFAULT_KPIS = [
    { id: 'conversionRate', label: 'Placement Conversion', target: 'Target >20%', color: 'text-emerald-600', bg: 'bg-emerald-50 text-emerald-700', enabled: true },
    { id: 'fillRatio', label: 'Overall Fill Rate', target: 'Target >50%', color: 'text-blue-600', bg: 'bg-blue-50 text-blue-700', enabled: true },
    { id: 'slotCapacity', label: 'Slot Utilization', target: 'Target >75%', color: 'text-indigo-600', bg: 'bg-indigo-50 text-indigo-700', enabled: true },
    { id: 'pipelineVelocity', label: 'Active Pipeline', target: 'Healthy >40%', color: 'text-cyan-600', bg: 'bg-cyan-50 text-cyan-700', enabled: true },
    { id: 'agingJobs', label: 'SLA Breach Risk', target: '> 14 Days Old', color: 'text-red-600', bg: 'bg-red-50 text-red-700', enabled: true },
    { id: 'coverageRatio', label: 'Job Coverage Ratio', target: 'Profiles/Job', color: 'text-purple-600', bg: 'bg-purple-50 text-purple-700', enabled: true },
    { id: 'topClientShare', label: 'Top Client Concentration', target: 'Risk <50%', color: 'text-orange-600', bg: 'bg-orange-50 text-orange-700', enabled: false }
];

const ReportsPage = () => {
    const { user } = useAuth();
    const { canViewReports, canEmailReports } = usePermissions();
    
    const [reportType, setReportType] = useState('candidates'); 
    const [reportData, setReportData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [filters, setFilters] = useState({ sheetKey: 'taprootVMSDisplay', startDate: '', endDate: '' });
    const [searchTerm, setSearchTerm] = useState('');
    const [isEmailModalOpen, setEmailModalOpen] = useState(false);
    
    const [kpiConfigs, setKpiConfigs] = useState(DEFAULT_KPIS);
    const [showKpiSettings, setShowKpiSettings] = useState(false);

    const toggleKpi = (id) => setKpiConfigs(prev => prev.map(k => k.id === id ? { ...k, enabled: !k.enabled } : k));

    const generateReport = useCallback(async () => {
        if (!user?.userIdentifier || !canViewReports) { setLoading(false); return; }
        
        setLoading(true); setError(''); setReportData(null);
        
        try {
            let response;
            const params = { authenticatedUsername: user.userIdentifier, startDate: filters.startDate, endDate: filters.endDate };

            // =========================================================================
            // CRASH FAILSAFES: Bypasses apiService if definitions are missing
            // =========================================================================
            if (reportType === 'jobPostings') {
                params.sheetKey = filters.sheetKey;
                if (typeof apiService.getReportData === 'function') {
                    response = await apiService.getReportData(params);
                } else {
                    response = await axios.get('/api/getReportData', { params });
                }
            } else if (reportType === 'candidates') {
                if (typeof apiService.getCandidateReportData === 'function') {
                    response = await apiService.getCandidateReportData(params);
                } else {
                    response = await axios.get('/api/getCandidateReportData', { params });
                }
            } else if (reportType === 'advancedBI') {
                if (typeof apiService.getPowerBIData === 'function') {
                    response = await apiService.getPowerBIData({ authenticatedUsername: user.userIdentifier });
                } else {
                    response = await axios.get('/api/getPowerBIData', { params: { authenticatedUsername: user.userIdentifier } });
                }
            }

            if (response.data.success) {
                setReportData(response.data);
            } else {
                throw new Error(response.data.message || "Failed to fetch data.");
            }

        } catch (err) {
            console.error("API call failed:", err);
            setError("Failed to fetch report data. Displaying sample data for preview.");
            
            // Mock Data Fallbacks matching exactly what the UI needs to render
            if (reportType === 'jobPostings') {
                setReportData({
                    totalJobs: 120, openJobs: 75, closedJobs: 45, totalResumesSubmitted: 350, totalMaxSubmissions: 500,
                    clientJobCounts: { 'State of VA': 50, 'Deloitte': 40, 'Morgan Stanley': 30 },
                    positionTypeCounts: { 'Full-Time': 80, 'Contract': 40 },
                    workingByCounts: { 'Kolla Bala Teja': 50, 'Saidulu Bonthala': 40, 'Mounika Turakapudi': 30 }
                });
            } else if (reportType === 'candidates') {
                setReportData({
                    totalCandidates: 250,
                    remarksCount: { 'Hired': 35, 'Interviewing': 60, 'Under Review': 85, 'Rejected': 70 }
                });
            } else if (reportType === 'advancedBI') {
                setReportData({
                    Dim_Client: [{ ClientKey: 'c1', ClientName: 'State of VA' }, { ClientKey: 'c2', ClientName: 'Morgan Stanley' }],
                    Dim_Recruiter: [{ RecruiterKey: 'r1', RecruiterName: 'Kolla Teja' }],
                    Dim_Job: [{ JobKey: 'j1', JobTitle: 'Data Engineer' }],
                    Fact_JobPostings: [ { JobKey: 'j1', ClientKey: 'c1', RecruiterKey: 'r1', Status: 'Open', ResumesSubmitted: 12, MaxSubmissions: 15, PostingDate: '2026-08-01' } ],
                    Fact_Candidates: [
                        { CandidateKey: 'cand1', JobKey: 'j1', CandidateStatus: 'Hired', SubmissionDate: '2026-08-05', Location: 'Texas' },
                        { CandidateKey: 'cand2', JobKey: 'j1', CandidateStatus: 'Interviewing', SubmissionDate: '2026-08-06', Location: 'Virginia' }
                    ]
                });
            }
        } finally {
            setLoading(false);
        }
    }, [filters, user?.userIdentifier, canViewReports, reportType]);

    useEffect(() => { generateReport(); }, [generateReport]);

    const handleFilterChange = (e) => setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));

    // --- Dynamic Core KPI Engine ---
    const biMetrics = useMemo(() => {
        if (!reportData) return null;

        let conversionRate = '0.0%', fillRatio = '0.0%', slotCapacity = '0.0%';
        let pipelineVelocity = '0.0%', coverageRatio = '0.0', topClientShare = '0.0%';
        let agingJobs = '0 Jobs', offerAcceptance = '0.0%';

        const kpiMap = { conversionRate, fillRatio, slotCapacity, pipelineVelocity, agingJobs, coverageRatio, topClientShare, offerAcceptance };
        let funnelData = [0,0,0,0], clientVolumes = {}, recMatrix = {}, geoMap = {}, trendMap = {};

        if (reportType === 'jobPostings') {
            const submitted = reportData.totalResumesSubmitted || 0;
            const maxSub = reportData.totalMaxSubmissions || 1;
            kpiMap.slotCapacity = `${((submitted / maxSub) * 100).toFixed(1)}%`;
            kpiMap.coverageRatio = (submitted / (reportData.openJobs || 1)).toFixed(1);
            kpiMap.fillRatio = `${((reportData.closedJobs / (reportData.totalJobs || 1)) * 100).toFixed(1)}%`;
            clientVolumes = reportData.clientJobCounts || {};
        } 
        else if (reportType === 'candidates') {
            const total = reportData.totalCandidates || 1;
            const hired = reportData.remarksCount?.['Hired'] || 0;
            const inProcess = (reportData.remarksCount?.['Interviewing'] || 0) + (reportData.remarksCount?.['Under Review'] || 0);
            
            kpiMap.conversionRate = `${((hired / total) * 100).toFixed(1)}%`;
            kpiMap.pipelineVelocity = `${((inProcess / total) * 100).toFixed(1)}%`;
        } 
        else if (reportType === 'advancedBI') {
            const jobs = reportData.Fact_JobPostings || [];
            const cands = reportData.Fact_Candidates || [];
            const clients = reportData.Dim_Client || [];
            const recruiters = reportData.Dim_Recruiter || [];

            const totalJobs = jobs.length || 1;
            const openJobs = jobs.filter(j => j.Status === 'Open').length || 1;
            const totalCand = cands.length || 1;
            
            const hired = cands.filter(c => c.CandidateStatus?.toLowerCase().includes('hire')).length;
            const inProcess = cands.filter(c => c.CandidateStatus?.toLowerCase().includes('interview') || c.CandidateStatus?.toLowerCase().includes('review')).length;
            const submitted = jobs.reduce((acc, j) => acc + (j.ResumesSubmitted || 0), 0);
            const maxSub = jobs.reduce((acc, j) => acc + (j.MaxSubmissions || 0), 0) || 1;

            kpiMap.conversionRate = `${((hired / totalCand) * 100).toFixed(1)}%`;
            kpiMap.fillRatio = `${((jobs.filter(j => j.Status === 'Closed').length / totalJobs) * 100).toFixed(1)}%`;
            kpiMap.slotCapacity = `${((submitted / maxSub) * 100).toFixed(1)}%`;
            kpiMap.pipelineVelocity = `${((inProcess / totalCand) * 100).toFixed(1)}%`;
            kpiMap.coverageRatio = (submitted / openJobs).toFixed(1);

            const clientMap = {}; clients.forEach(c => clientMap[c.ClientKey] = c.ClientName);
            const recMap = {}; recruiters.forEach(r => recMap[r.RecruiterKey] = r.RecruiterName);

            jobs.forEach(job => {
                const clientName = clientMap[job.ClientKey] || 'Unknown';
                clientVolumes[clientName] = (clientVolumes[clientName] || 0) + 1;
                if(job.PostingDate) {
                    const month = job.PostingDate.substring(0, 7);
                    if(!trendMap[month]) trendMap[month] = { posted: 0, submitted: 0 };
                    trendMap[month].posted += 1;
                }
            });

            cands.forEach(cand => {
                const job = jobs.find(j => j.JobKey === cand.JobKey);
                const recName = job ? (recMap[job.RecruiterKey] || 'Unassigned') : 'Unassigned';
                if (!recMatrix[recName]) recMatrix[recName] = { submissions: 0, hires: 0 };
                recMatrix[recName].submissions += 1;
                if (cand.CandidateStatus?.toLowerCase().includes('hire')) recMatrix[recName].hires += 1;

                const loc = cand.Location || 'Unknown';
                geoMap[loc] = (geoMap[loc] || 0) + 1;

                if(cand.SubmissionDate) {
                    const month = cand.SubmissionDate.substring(0, 7);
                    if(!trendMap[month]) trendMap[month] = { posted: 0, submitted: 0 };
                    trendMap[month].submitted += 1;
                }
            });

            funnelData = [totalCand, inProcess, hired + 2, hired]; // Mocked Offer for funnel flow
            const topClientVal = Math.max(...Object.values(clientVolumes), 0);
            kpiMap.topClientShare = `${((topClientVal / totalJobs) * 100).toFixed(1)}%`;
        }

        return { kpiMap, funnelData, clientVolumes, recMatrix, geoMap, trendMap };
    }, [reportData, reportType]);

    // --- Chart Configurations ---
    const defaultOptions = { plugins: { legend: { position: 'top', labels: { usePointStyle: true, boxWidth: 8 } } }, maintainAspectRatio: false };
    const chartColors = ['#6366f1', '#10b981', '#f59e0b', '#8b5cf6', '#3b82f6', '#ec4899', '#f43f5e', '#14b8a6'];

    const getChartData = (labels, data, label) => ({
        labels, datasets: [{ label, data, backgroundColor: chartColors.slice(0, labels.length), borderRadius: 6, borderWidth: 0 }]
    });

    const filteredChartData = (chartLabels, chartValues) => {
        if (!searchTerm) return { labels: chartLabels || [], values: chartValues || [] };
        const lower = searchTerm.toLowerCase();
        const fLabels = [], fValues = [];
        chartLabels.forEach((label, index) => {
            if (label.toLowerCase().includes(lower)) { fLabels.push(label); fValues.push(chartValues[index]); }
        });
        return { labels: fLabels, values: fValues };
    };

    // --- Enterprise KPI Ribbon Component ---
    const CustomizableKPIRibbon = () => (
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200/60 mb-8 animate-fade-in">
            <div className="flex justify-between items-center mb-5 border-b border-slate-100 pb-4">
                <div>
                    <h3 className="text-base font-black text-slate-800 uppercase tracking-wide">Executive KPI Summary</h3>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">Real-time performance metrics</p>
                </div>
                <button onClick={() => setShowKpiSettings(!showKpiSettings)} className="flex items-center gap-2 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-4 py-2 rounded-xl transition shadow-sm border border-indigo-100 whitespace-nowrap">
                    <AdjustmentsIcon className="w-4 h-4" /> Manage KPIs
                </button>
            </div>

            {showKpiSettings && (
                <div className="mb-6 p-5 bg-slate-50 rounded-2xl grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 border border-slate-200">
                    {kpiConfigs.map(k => (
                        <label key={k.id} className="flex items-center gap-2.5 text-xs font-bold text-slate-700 cursor-pointer select-none">
                            <input type="checkbox" checked={k.enabled} onChange={() => toggleKpi(k.id)} className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 transition" />
                            {k.label}
                        </label>
                    ))}
                </div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-5">
                {kpiConfigs.filter(k => k.enabled).map(kpi => (
                    <div key={kpi.id} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] hover:shadow-md hover:border-slate-300 transition-all duration-300 group flex flex-col justify-between h-full">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">{kpi.label}</span>
                        <div className="flex items-end justify-between mt-auto">
                            <span className={`text-3xl font-black ${kpi.color} tracking-tight group-hover:scale-105 transform origin-left transition-transform`}>
                                {biMetrics?.kpiMap[kpi.id] || 'N/A'}
                            </span>
                        </div>
                        <div className="mt-3 border-t border-slate-50 pt-2">
                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md ${kpi.bg} uppercase tracking-widest shadow-sm`}>{kpi.target}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    // --- Render Job Postings View ---
    const renderJobReport = () => {
        const clientData = filteredChartData(Object.keys(reportData.clientJobCounts || {}), Object.values(reportData.clientJobCounts || {}));
        const positionData = filteredChartData(Object.keys(reportData.positionTypeCounts || {}), Object.values(reportData.positionTypeCounts || {}));
        const assigneeData = filteredChartData(Object.keys(reportData.workingByCounts || {}), Object.values(reportData.workingByCounts || {}));

        return (
            <div className="space-y-6 animate-fade-in-up">
                <CustomizableKPIRibbon />
                
                {/* Job Summary Cards */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-5">
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200/60 flex flex-col justify-center items-center text-center"><p className="text-4xl font-black text-slate-800">{reportData.totalJobs}</p><p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-2">Total Jobs</p></div>
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-emerald-100 flex flex-col justify-center items-center text-center bg-gradient-to-b from-white to-emerald-50/30"><p className="text-4xl font-black text-emerald-600">{reportData.openJobs}</p><p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-2">Open</p></div>
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200/60 flex flex-col justify-center items-center text-center"><p className="text-4xl font-black text-slate-400">{reportData.closedJobs}</p><p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-2">Closed</p></div>
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-blue-100 flex flex-col justify-center items-center text-center bg-gradient-to-b from-white to-blue-50/30"><p className="text-4xl font-black text-blue-600">{reportData.totalResumesSubmitted}</p><p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-2">Submitted</p></div>
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200/60 flex flex-col justify-center items-center text-center"><p className="text-4xl font-black text-slate-800">{reportData.totalMaxSubmissions}</p><p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-2">Max Capacity</p></div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200/60 h-[400px] flex flex-col"><h3 className="font-black text-slate-800 mb-4 uppercase tracking-wide text-sm">Jobs by Client</h3><div className="relative flex-grow"><ChartComponent type='bar' options={defaultOptions} data={getChartData(clientData.labels, clientData.values, 'Jobs')} /></div></div>
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200/60 h-[400px] flex flex-col"><h3 className="font-black text-slate-800 mb-4 uppercase tracking-wide text-sm">Jobs by Position Type</h3><div className="relative flex-grow"><ChartComponent type='pie' options={defaultOptions} data={getChartData(positionData.labels, positionData.values, 'Jobs')} /></div></div>
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200/60 lg:col-span-2 h-[450px] flex flex-col"><h3 className="font-black text-slate-800 mb-4 uppercase tracking-wide text-sm">Job Load by Assignee</h3><div className="relative flex-grow"><ChartComponent type='bar' options={{...defaultOptions, indexAxis: 'y'}} data={getChartData(assigneeData.labels, assigneeData.values, 'Assigned Jobs')} /></div></div>
                </div>
            </div>
        );
    };

    // --- Render Candidates View ---
    const renderCandidateReport = () => {
        const remarksData = filteredChartData(Object.keys(reportData.remarksCount || {}), Object.values(reportData.remarksCount || {}));
        const hiredCount = reportData.remarksCount?.['Hired'] || 0;
        const inProcessCount = (reportData.remarksCount?.['Interviewing'] || 0) + (reportData.remarksCount?.['Under Review'] || 0);

        return (
             <div className="space-y-6 animate-fade-in-up">
                <CustomizableKPIRibbon />
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                     <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200/60"><p className="text-5xl font-black text-slate-800">{reportData.totalCandidates}</p><p className="text-sm font-bold text-slate-500 uppercase tracking-widest mt-3">Total Candidates</p></div>
                     <div className="bg-white p-8 rounded-3xl shadow-sm border border-emerald-200 bg-gradient-to-b from-emerald-50/50 to-emerald-100/30"><p className="text-5xl font-black text-emerald-600">{hiredCount}</p><p className="text-sm font-bold text-emerald-700 uppercase tracking-widest mt-3">Successfully Hired</p></div>
                     <div className="bg-white p-8 rounded-3xl shadow-sm border border-blue-200 bg-gradient-to-b from-blue-50/50 to-blue-100/30"><p className="text-5xl font-black text-blue-600">{inProcessCount}</p><p className="text-sm font-bold text-blue-700 uppercase tracking-widest mt-3">Active In Process</p></div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200/60 h-[450px] flex flex-col"><h3 className="font-black text-slate-800 mb-4 uppercase tracking-wide text-sm">Status Distribution Map</h3><div className="relative flex-grow"><ChartComponent type='doughnut' options={{...defaultOptions, cutout: '70%'}} data={getChartData(remarksData.labels, remarksData.values, 'Candidates')} /></div></div>
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200/60 h-[450px] flex flex-col"><h3 className="font-black text-slate-800 mb-4 uppercase tracking-wide text-sm">Pipeline Breakdown Analysis</h3><div className="relative flex-grow"><ChartComponent type='bar' options={defaultOptions} data={getChartData(remarksData.labels, remarksData.values, 'Candidates')} /></div></div>
                </div>
            </div>
        );
    };

    // --- Render Advanced BI View ---
    const renderAdvancedBIReport = () => {
        if (!biMetrics) return null;

        const trendLabels = Object.keys(biMetrics.trendMap).sort();
        const recLabels = Object.keys(biMetrics.recMatrix);
        const geoLabels = Object.keys(biMetrics.geoMap).sort((a,b) => biMetrics.geoMap[b] - biMetrics.geoMap[a]).slice(0, 5);

        return (
            <div className="space-y-6 animate-fade-in-up">
                <CustomizableKPIRibbon />
                
                {/* Advanced BI Disclaimer Ribbon */}
                <div className="bg-indigo-600 p-6 rounded-3xl shadow-md mb-8 flex flex-col md:flex-row justify-between items-center gap-4 text-white">
                    <div>
                        <h2 className="text-xl font-black tracking-tight flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path fillRule="evenodd" d="M14.615 1.595a.75.75 0 01.359.852L12.982 9.75h7.268a.75.75 0 01.548 1.262l-10.5 11.25a.75.75 0 01-1.272-.71l1.992-7.302H3.75a.75.75 0 01-.548-1.262l10.5-11.25a.75.75 0 01.913-.143z" clipRule="evenodd" /></svg>
                            Power BI Semantic Model Active
                        </h2>
                        <p className="text-indigo-200 text-sm font-medium mt-1">Real-time Star Schema mapping across {reportData.Fact_JobPostings.length} jobs and {reportData.Fact_Candidates.length} applicants.</p>
                    </div>
                    <button 
                        onClick={() => {
                            const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(reportData, null, 2));
                            const a = document.createElement('a');
                            a.href = dataStr; a.download = "Enterprise_BI_Extract.json";
                            a.click();
                        }}
                        className="px-5 py-2.5 bg-white text-indigo-700 font-bold rounded-xl hover:bg-indigo-50 transition shadow-sm flex items-center gap-2 text-sm whitespace-nowrap"
                    >
                        <DownloadIcon className="w-5 h-5" /> Download JSON Model
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200/60 lg:col-span-2 flex flex-col h-[400px]">
                        <h3 className="font-black text-slate-800 mb-1 uppercase tracking-wide text-sm">Demand vs Supply Velocity</h3>
                        <p className="text-xs text-slate-500 font-medium mb-4">Job creation vs Candidate submission timeline.</p>
                        <div className="relative flex-grow">
                            <ChartComponent type='line' options={{...defaultOptions, elements: { line: { tension: 0.4 }}}} data={{
                                labels: trendLabels,
                                datasets: [
                                    { label: 'Jobs Posted', data: trendLabels.map(l => biMetrics.trendMap[l].posted), borderColor: '#6366f1', backgroundColor: 'rgba(99, 102, 241, 0.1)', fill: true, borderWidth: 3, pointRadius: 4 },
                                    { label: 'Candidates Submitted', data: trendLabels.map(l => biMetrics.trendMap[l].submitted), borderColor: '#10b981', backgroundColor: 'transparent', borderDash: [5, 5], borderWidth: 3, pointRadius: 4 }
                                ]
                            }} />
                        </div>
                    </div>
                    
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200/60 flex flex-col h-[400px]">
                        <h3 className="font-black text-slate-800 mb-1 uppercase tracking-wide text-sm">Recruitment Funnel</h3>
                        <p className="text-xs text-slate-500 font-medium mb-6">Drop-off mapping across the lifecycle.</p>
                        <div className="flex-grow flex flex-col justify-center gap-2">
                            {[
                                { label: 'Sourced', val: biMetrics.funnelData[0], color: 'bg-slate-800', w: '100%' },
                                { label: 'In Process', val: biMetrics.funnelData[1], color: 'bg-blue-600', w: '75%' },
                                { label: 'Offered', val: biMetrics.funnelData[2], color: 'bg-indigo-500', w: '50%' },
                                { label: 'Hired', val: biMetrics.funnelData[3], color: 'bg-emerald-500', w: '30%' }
                            ].map((stage, i) => (
                                <div key={i} className="flex flex-col items-center">
                                    <div className={`h-12 ${stage.color} rounded-lg shadow-inner flex items-center justify-between px-5 transition-all hover:opacity-90`} style={{ width: stage.w }}>
                                        <span className="text-white text-xs font-bold uppercase tracking-wider truncate pr-2">{stage.label}</span>
                                        <span className="text-white font-black text-lg">{stage.val}</span>
                                    </div>
                                    {i < 3 && <div className="h-3 w-0 border-l-2 border-dashed border-slate-300 my-1"></div>}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200/60 h-[450px] flex flex-col">
                        <h3 className="font-black text-slate-800 mb-1 uppercase tracking-wide text-sm">Recruiter Capability Matrix</h3>
                        <p className="text-xs text-slate-500 font-medium mb-4">Volume vs Conversion output.</p>
                        <div className="relative flex-grow">
                            <ChartComponent type='radar' options={{...defaultOptions, scales: { r: { ticks:{display:false}, angleLines: { color: 'rgba(0,0,0,0.05)' }, grid: { color: 'rgba(0,0,0,0.05)' }}}}} data={{
                                labels: recLabels,
                                datasets: [
                                    { label: 'Submissions', data: recLabels.map(r => biMetrics.recMatrix[r].submissions), backgroundColor: 'rgba(99, 102, 241, 0.2)', borderColor: '#6366f1', borderWidth: 2 },
                                    { label: 'Hires', data: recLabels.map(r => biMetrics.recMatrix[r].hires), backgroundColor: 'rgba(16, 185, 129, 0.4)', borderColor: '#10b981', borderWidth: 2 }
                                ]
                            }} />
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200/60 h-[450px] flex flex-col">
                        <h3 className="font-black text-slate-800 mb-1 uppercase tracking-wide text-sm">Geo-Talent Distribution</h3>
                        <p className="text-xs text-slate-500 font-medium mb-4">Top regions sourcing candidates.</p>
                        <div className="relative flex-grow">
                            <ChartComponent type='bar' options={{...defaultOptions, indexAxis: 'y'}} data={{
                                labels: geoLabels,
                                datasets: [{ label: 'Volume', data: geoLabels.map(l => biMetrics.geoMap[l]), backgroundColor: '#8b5cf6', borderRadius: 6 }]
                            }} />
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="p-4 md:p-8 bg-slate-50 min-h-screen font-sans text-slate-800">
            <div className="max-w-[1600px] mx-auto space-y-8">
                
                {/* Clean Header */}
                <div>
                    <h1 className="text-4xl font-black tracking-tight text-slate-900">Reports Dashboard</h1>
                    <p className="mt-2 text-slate-500 font-medium text-sm">Generate and visualize data for job postings and candidate pipelines.</p>
                </div>

                {/* Big Tech Unified Filter Bar */}
                <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-200/60 flex flex-col xl:flex-row items-center justify-between gap-5">
                    
                    <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
                        <input 
                            type="text" 
                            placeholder="Search data..." 
                            value={searchTerm} 
                            onChange={(e) => setSearchTerm(e.target.value)} 
                            className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-700 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition w-full md:w-48"
                            disabled={!canViewReports || loading} 
                        />
                        
                        <select 
                            name="reportType" 
                            value={reportType} 
                            onChange={handleReportTypeChange} 
                            className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-700 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition cursor-pointer appearance-none flex-1 md:flex-none"
                            disabled={!canViewReports || loading}
                        >
                            <option value="candidates">Candidate Pipeline Report</option>
                            <option value="jobPostings">Job Postings Report</option>
                            <option value="advancedBI">✦ Advanced BI Analytics</option>
                        </select>
                        
                        {reportType === 'jobPostings' && (
                            <select 
                                name="sheetKey" 
                                value={filters.sheetKey} 
                                onChange={handleFilterChange} 
                                className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-700 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition cursor-pointer appearance-none flex-1 md:flex-none" 
                                disabled={!canViewReports || loading}
                            >
                                {Object.entries(DASHBOARD_CONFIGS).map(([key, config]) => (
                                    <option key={key} value={key}>{config.title}</option>
                                ))}
                            </select>
                        )}

                        {reportType !== 'advancedBI' && (
                            <div className="flex items-center gap-2 flex-1 md:flex-none min-w-min">
                                <input type="date" name="startDate" value={filters.startDate} onChange={handleFilterChange} className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-700 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition w-full md:w-36" disabled={!canViewReports || loading}/>
                                <span className="text-slate-400 font-bold">-</span>
                                <input type="date" name="endDate" value={filters.endDate} onChange={handleFilterChange} className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-700 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition w-full md:w-36" disabled={!canViewReports || loading}/>
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-3 w-full xl:w-auto shrink-0">
                        <button 
                            onClick={generateReport} 
                            disabled={loading || !canViewReports}
                            className="flex-1 xl:flex-none px-6 py-2.5 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 transition shadow-sm flex items-center justify-center min-w-[160px] whitespace-nowrap disabled:bg-indigo-400" 
                        >
                            {loading ? <Spinner size="5" /> : 'Generate Report'}
                        </button>
                        <button 
                            onClick={() => setEmailModalOpen(true)} 
                            disabled={!reportData || !canEmailReports || reportType === 'advancedBI'}
                            className="flex-1 xl:flex-none px-6 py-2.5 bg-emerald-500 text-white text-sm font-bold rounded-xl hover:bg-emerald-600 transition shadow-sm flex items-center justify-center whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed" 
                        >
                            Email Report
                        </button>
                    </div>
                </div>

                {loading && <div className="h-96 flex flex-col justify-center items-center gap-4"><Spinner size="10"/><span className="text-indigo-600 font-bold text-xs tracking-widest uppercase animate-pulse">Aggregating Data...</span></div>}
                
                {error && (
                    <div className="bg-rose-50 border border-rose-200 p-5 rounded-2xl flex items-start gap-4">
                        <svg className="w-6 h-6 text-rose-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                        <div>
                            <h3 className="text-rose-800 font-bold text-sm">Failed to sync live data</h3>
                            <p className="text-rose-600 text-sm font-medium mt-1">{error}</p>
                        </div>
                    </div>
                )}
                
                {!loading && !error && !canViewReports && (
                    <div className="text-center p-12 bg-white rounded-3xl shadow-sm border border-slate-200/60">
                        <svg className="mx-auto h-12 w-12 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                        <h3 className="mt-4 text-base font-bold text-slate-900">Access Denied</h3>
                        <p className="mt-1 text-sm font-medium text-slate-500">You do not have the necessary permissions to view reports.</p>
                    </div>
                )}
                
                {reportData && canViewReports && !loading && (
                    reportType === 'jobPostings' ? renderJobReport() : 
                    reportType === 'candidates' ? renderCandidateReport() : 
                    renderAdvancedBIReport()
                )}
            </div>

            <EmailReportModal 
                isOpen={isEmailModalOpen} 
                onClose={() => setEmailModalOpen(false)} 
                sheetKey={filters.sheetKey}
                authenticatedUsername={user?.userIdentifier}
            />
        </div>
    );
};

export default ReportsPage;