// src/pages/ReportsPage.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { 
    Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, 
    LinearScale, BarElement, LineElement, PointElement, DoughnutController 
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import { useAuth } from '../context/AuthContext';
import { usePermissions } from '../hooks/usePermissions';
import { apiService } from '../api/apiService';

// ============================================================================
// CHART.JS INITIALIZATION
// ============================================================================
ChartJS.register(
    ArcElement, Tooltip, Legend, CategoryScale, LinearScale, 
    BarElement, LineElement, PointElement, DoughnutController
);

ChartJS.defaults.font.family = "'Inter', system-ui, -apple-system, sans-serif";
ChartJS.defaults.color = '#64748b';

// ============================================================================
// ICONS
// ============================================================================
const RefreshIcon = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" /></svg>;
const DownloadIcon = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>;
const EmailIcon = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" /></svg>;
const AlertIcon = ({ className, severity }) => {
    if (severity === 'critical') return <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>;
    return <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" /></svg>;
};
const Spinner = ({ size = '6' }) => <div className="flex justify-center items-center"><div className={`w-${size} h-${size} border-4 border-t-transparent border-indigo-600 rounded-full animate-spin`}></div></div>;

// ============================================================================
// UTILITIES & CONSTANTS
// ============================================================================
const DASHBOARD_CONFIGS = {
    'all': 'All VMS Sources',
    'ecaltVMSDisplay': 'Eclat VMS',
    'taprootVMSDisplay': 'Taproot VMS',
    'michiganDisplay': 'Michigan VMS',
    'EclatTexasDisplay': 'Eclat Texas',
    'TaprootTexasDisplay': 'Taproot Texas',
    'VirtusaDisplay': 'Virtusa',
    'DeloitteDisplay': 'Deloitte',
    'tsiBdmDisplay': 'TSI - BDM',
    'tsiBdrDisplay': 'TSI - BDR'
};

const safeDiv = (num, denom) => (denom ? (num / denom) : null);
const formatMetric = (val, isPercent = false) => {
    if (val === null || val === undefined || Number.isNaN(val)) return 'Not Tracked';
    return isPercent ? `${Number(val).toFixed(1)}%` : new Intl.NumberFormat().format(val);
};

const calculateFunnel = (funnelData, totalSubmitted) => {
    if (!funnelData || totalSubmitted == null) return [];
    
    // Funnel Logic: Downstream stages are implicitly part of upstream stages
    const selected = funnelData['Selected'] || 0;
    const interview = (funnelData['Interview'] || 0) + selected;
    const shortlisted = (funnelData['Shortlisted'] || 0) + interview;
    const underReview = (funnelData['Under Review'] || 0) + shortlisted;
    const submitted = totalSubmitted || 0; 
    
    return [
        { stage: 'Submitted', count: submitted, rateFromPrev: 100, rateOverall: 100 },
        { stage: 'Under Review', count: underReview, rateFromPrev: safeDiv(underReview, submitted)*100, rateOverall: safeDiv(underReview, submitted)*100 },
        { stage: 'Shortlisted', count: shortlisted, rateFromPrev: safeDiv(shortlisted, underReview)*100, rateOverall: safeDiv(shortlisted, submitted)*100 },
        { stage: 'Interview', count: interview, rateFromPrev: safeDiv(interview, shortlisted)*100, rateOverall: safeDiv(interview, submitted)*100 },
        { stage: 'Selected', count: selected, rateFromPrev: safeDiv(selected, interview)*100, rateOverall: safeDiv(selected, submitted)*100 }
    ];
};

const getChartData = (dataObj, label, colorHex = '#4f46e5', isHorizontal = false) => {
    if (!dataObj || !dataObj.labels) return { labels: [], datasets: [] };
    return {
        labels: dataObj.labels, 
        datasets: [{ 
            label, data: dataObj.values, 
            backgroundColor: colorHex, borderRadius: 4, 
            borderWidth: isHorizontal ? 1 : 0
        }]
    };
};

const chartOpts = {
    responsive: true, maintainAspectRatio: false,
    plugins: { 
        legend: { display: false },
        tooltip: { backgroundColor: 'rgba(15, 23, 42, 0.95)', titleFont: { size: 13, family: 'Inter' }, padding: 12, cornerRadius: 8 }
    },
    scales: {
        x: { grid: { display: false }, border: { display: false }, ticks: { font: { size: 11 } } },
        y: { grid: { color: '#f1f5f9', drawBorder: false }, border: { display: false }, beginAtZero: true, ticks: { font: { size: 11 } } }
    }
};

// ============================================================================
// CUSTOM HOOK: useReportsAnalytics
// ============================================================================
const useReportsAnalytics = (user, canViewReports, filters) => {
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchAnalytics = useCallback(async () => {
        if (!user?.userIdentifier || !canViewReports) { setLoading(false); return; }
        setLoading(true); setError('');
        
        try {
            const params = { authenticatedUsername: user.userIdentifier, ...filters };
            const response = await apiService.getReportsAnalytics(params);
            
            if (response.data.success) {
                setAnalytics(response.data);
            } else {
                throw new Error(response.data.message || "Failed to fetch dashboard intelligence.");
            }
        } catch (err) {
            console.error("API call failed:", err);
            setError(err.response?.data?.message || err.message || "Failed to load live reports.");
        } finally {
            setLoading(false);
        }
    }, [filters, user?.userIdentifier, canViewReports]);

    useEffect(() => { fetchAnalytics(); }, [fetchAnalytics]);
    return { analytics, loading, error, fetchAnalytics };
};

// ============================================================================
// SUB-COMPONENTS
// ============================================================================
const ChartComponent = ({ type, options, data }) => {
    if (!data || !data.labels || data.labels.length === 0) return <div className="flex justify-center items-center h-full text-slate-400 font-bold text-sm">Not Tracked or No Data</div>;
    const mergedOpts = { ...chartOpts, ...options };
    if (type === 'bar') return <Bar options={mergedOpts} data={data} />;
    if (type === 'doughnut') return <Doughnut options={mergedOpts} data={data} />;
    if (type === 'line') return <Line options={mergedOpts} data={data} />;
    return null;
};

const ReportsHeader = ({ lastUpdated, onExport }) => (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-6">
        <div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900">Recruitment Intelligence</h1>
            <p className="text-slate-500 font-medium text-sm mt-1">Enterprise VMS & Talent Analytics Dashboard</p>
        </div>
        <div className="flex items-center gap-4">
            <div className="text-xs font-semibold text-slate-400">Updated: {lastUpdated ? new Date(lastUpdated).toLocaleString() : 'N/A'}</div>
            <button onClick={onExport} className="px-4 py-2 bg-white border border-slate-200 text-slate-700 font-bold rounded-lg shadow-sm hover:bg-slate-50 transition text-sm">JSON Export</button>
        </div>
    </div>
);

const ExecutiveKpiGrid = ({ live, period, funnel }) => (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-5 rounded-xl shadow-sm ring-1 ring-slate-900/5">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Open Positions (Live)</div>
            <div className="text-3xl font-black text-slate-800">{formatMetric(live?.openJobs)}</div>
        </div>
        <div className="bg-white p-5 rounded-xl shadow-sm ring-1 ring-slate-900/5">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">New Positions</div>
            <div className="text-3xl font-black text-slate-800">{formatMetric(period?.newJobs)}</div>
        </div>
        <div className="bg-white p-5 rounded-xl shadow-sm ring-1 ring-slate-900/5">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Cands. Submitted</div>
            <div className="text-3xl font-black text-indigo-600">{formatMetric(period?.newCandidates)}</div>
        </div>
        <div className="bg-white p-5 rounded-xl shadow-sm ring-1 ring-slate-900/5">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Under Review</div>
            <div className="text-3xl font-black text-slate-800">{formatMetric(funnel?.['Under Review'])}</div>
        </div>
        <div className="bg-white p-5 rounded-xl shadow-sm ring-1 ring-slate-900/5">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Shortlisted</div>
            <div className="text-3xl font-black text-slate-800">{formatMetric(funnel?.['Shortlisted'])}</div>
        </div>
        <div className="bg-white p-5 rounded-xl shadow-sm ring-1 ring-slate-900/5">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Interviews</div>
            <div className="text-3xl font-black text-amber-600">{formatMetric(funnel?.['Interview'])}</div>
        </div>
        <div className="bg-white p-5 rounded-xl shadow-sm ring-1 ring-slate-900/5">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Selected</div>
            <div className="text-3xl font-black text-emerald-600">{formatMetric(funnel?.['Selected'])}</div>
        </div>
        <div className="bg-white p-5 rounded-xl shadow-sm ring-1 ring-slate-900/5">
            <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Sub. Utilization</span>
                <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-md ${live?.utilization >= 100 ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}`}>Live</span>
            </div>
            <div className="text-3xl font-black text-slate-800">{formatMetric(live?.utilization, true)}</div>
        </div>
    </div>
);

const RecruitmentFunnel = ({ funnel, totalSubmissions }) => {
    const stages = calculateFunnel(funnel, totalSubmissions);
    return (
        <div className="bg-white p-6 rounded-xl shadow-sm ring-1 ring-slate-900/5 h-full">
            <h3 className="font-black text-slate-800 text-sm uppercase mb-6 tracking-wide">Recruitment Funnel Conversion</h3>
            <div className="space-y-4">
                {stages.map((s, i) => (
                    <div key={s.stage} className="relative">
                        <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                            <span>{s.stage} ({formatMetric(s.count)})</span>
                            <span>{formatMetric(s.rateOverall, true)} Overall</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                            <div className="bg-indigo-500 h-3 rounded-full transition-all" style={{ width: `${Math.max(s.rateOverall || 0, 1)}%` }}></div>
                        </div>
                        {i < stages.length - 1 && <div className="text-[10px] font-bold text-slate-400 text-right mt-1">Conv. Rate: {formatMetric(stages[i+1]?.rateFromPrev, true)}</div>}
                    </div>
                ))}
            </div>
        </div>
    );
};

const AlertsPanel = ({ alerts }) => (
    <div className="bg-white p-6 rounded-xl shadow-sm ring-1 ring-slate-900/5 h-full">
        <h3 className="font-black text-slate-800 text-sm uppercase mb-4 tracking-wide">Operational Risk Alerts</h3>
        {!alerts?.length ? <div className="text-sm font-bold text-slate-400 mt-10 text-center">No active alerts. Operational health is stable.</div> : (
            <div className="space-y-3 overflow-y-auto max-h-[300px] pr-2">
                {alerts.map((a, i) => (
                    <div key={i} className={`p-4 rounded-lg border-l-4 ${a.severity === 'critical' ? 'bg-rose-50 border-rose-500 text-rose-800' : 'bg-amber-50 border-amber-500 text-amber-800'}`}>
                        <div className="font-bold text-sm flex justify-between"><span>{a.title}</span> <span>({a.count})</span></div>
                        <div className="text-xs font-medium opacity-90 mt-1">{a.description}</div>
                    </div>
                ))}
            </div>
        )}
    </div>
);

const EmailReportModal = ({ isOpen, onClose, sheetKey, authenticatedUsername }) => {
    const [toEmails, setToEmails] = useState('');
    const [ccEmails, setCcEmails] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [isSending, setIsSending] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    useEffect(() => {
        if (isOpen) { setToEmails(''); setCcEmails(''); setStatusFilter('all'); setError(''); setSuccessMessage(''); setIsSending(false); }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleSendEmail = async () => {
        const toEmailArray = toEmails.split(',').map(e => e.trim()).filter(Boolean);
        if (toEmailArray.length === 0) return setError("Please provide at least one 'To' email.");

        setIsSending(true); setError(''); setSuccessMessage('');
        try {
            const emailSheetKey = sheetKey === 'all' ? 'taprootVMSDisplay' : sheetKey; 
            const response = await apiService.generateAndSendJobReport(emailSheetKey, statusFilter, toEmailArray, ccEmails.split(',').map(e=>e.trim()).filter(Boolean), authenticatedUsername);
            if (response.data.success) {
                setSuccessMessage('Report sent successfully!');
                setTimeout(() => onClose(), 2000);
            } else { setError(response.data.message || 'Error sending report.'); }
        } catch (err) { setError(err.response?.data?.message || 'Failed to send the report.'); } 
        finally { setIsSending(false); }
    };

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
                        <input type="text" value={toEmails} onChange={e => setToEmails(e.target.value)} className="block w-full border border-slate-200 bg-slate-50 rounded-xl px-4 py-2.5 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none" required />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">CC (comma-separated)</label>
                        <input type="text" value={ccEmails} onChange={e => setCcEmails(e.target.value)} className="block w-full border border-slate-200 bg-slate-50 rounded-xl px-4 py-2.5 outline-none" />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Job Status Filter</label>
                        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="block w-full border border-slate-200 bg-slate-50 rounded-xl px-4 py-2.5 outline-none">
                            <option value="all">Include All Statuses</option>
                            <option value="Open">Only Open Jobs</option>
                            <option value="Closed">Only Closed Jobs</option>
                        </select>
                    </div>
                </div>

                <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-slate-100">
                    <button onClick={onClose} disabled={isSending} className="px-5 py-2.5 bg-white border border-slate-200 text-slate-700 font-semibold rounded-xl hover:bg-slate-50">Cancel</button>
                    <button onClick={handleSendEmail} disabled={isSending} className="px-5 py-2.5 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 w-32 flex justify-center items-center shadow-sm">
                        {isSending ? <Spinner size="5" /> : 'Send Email'}
                    </button>
                </div>
            </div>
        </div>
    );
};

// ============================================================================
// MAIN PAGE EXPORT
// ============================================================================
export default function ReportsPage() {
    const { user } = useAuth();
    const { canViewReports, canEmailReports } = usePermissions();
    const [datePreset, setDatePreset] = useState('30D');
    const [activeTab, setActiveTab] = useState('recruiters'); 
    const [isEmailModalOpen, setEmailModalOpen] = useState(false);

    const [filters, setFilters] = useState({ 
        startDate: new Date(Date.now() - 30*86400000).toISOString().split('T')[0], 
        endDate: new Date().toISOString().split('T')[0], 
        sheetKey: 'all' 
    });
    
    const { analytics, loading, error, fetchAnalytics } = useReportsAnalytics(user, canViewReports, filters);

    const handlePresetChange = (preset) => {
        setDatePreset(preset);
        const end = new Date().toISOString().split('T')[0];
        let start = '';
        if (preset === '7D') start = new Date(Date.now() - 7*86400000).toISOString().split('T')[0];
        if (preset === '30D') start = new Date(Date.now() - 30*86400000).toISOString().split('T')[0];
        if (preset === '90D') start = new Date(Date.now() - 90*86400000).toISOString().split('T')[0];
        if (preset === '6M') start = new Date(Date.now() - 180*86400000).toISOString().split('T')[0];
        if (preset === '12M') start = new Date(Date.now() - 365*86400000).toISOString().split('T')[0];
        if (preset === 'YTD') start = new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0];
        setFilters(prev => ({ ...prev, startDate: start, endDate: end }));
    };

    if (!canViewReports && !loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-slate-50">
                <div className="text-center p-12 bg-white rounded-3xl shadow-sm border border-slate-200 max-w-md">
                    <AlertIcon className="mx-auto h-12 w-12 text-rose-500" />
                    <h3 className="mt-4 text-lg font-bold text-slate-900">Access Denied</h3>
                    <p className="mt-2 text-sm text-slate-500">Company-wide reporting is restricted by your current role.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-8 bg-slate-50 min-h-screen font-sans text-slate-800">
            <div className="max-w-[1600px] mx-auto">
                <ReportsHeader lastUpdated={analytics?.meta?.generatedAt} onExport={() => {
                    if (!analytics) return;
                    const blob = new Blob([JSON.stringify(analytics, null, 2)], {type: 'application/json'});
                    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); 
                    a.download = `VMS_Intelligence_Extract_${new Date().toISOString().split('T')[0]}.json`; a.click();
                }} />
                
                {/* FILTER BAR */}
                <div className="bg-white p-4 rounded-xl shadow-sm ring-1 ring-slate-900/5 flex flex-wrap gap-4 items-center justify-between mb-6 sticky top-4 z-10 backdrop-blur-md bg-white/90">
                    <div className="flex flex-wrap items-center gap-4">
                        <select value={filters.sheetKey} onChange={e => setFilters(p => ({...p, sheetKey: e.target.value}))} className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold text-slate-700 outline-none disabled:opacity-50" disabled={loading}>
                            {Object.entries(DASHBOARD_CONFIGS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                        </select>
                        <div className="flex space-x-1 p-1 bg-slate-100 rounded-lg">
                            {['7D', '30D', '90D', '6M', 'YTD', 'ALL'].map(p => (
                                <button key={p} onClick={() => handlePresetChange(p)} disabled={loading} className={`px-3 py-1 text-xs font-bold rounded-md disabled:opacity-50 ${datePreset === p ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:bg-slate-200'}`}>{p}</button>
                            ))}
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button onClick={fetchAnalytics} disabled={loading} className="px-4 py-2 bg-indigo-50 text-indigo-700 font-bold rounded-lg hover:bg-indigo-100 transition text-sm flex items-center gap-2">
                            <RefreshIcon className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
                        </button>
                        {canEmailReports && (
                            <button onClick={() => setEmailModalOpen(true)} disabled={loading || !analytics} className="px-4 py-2 bg-emerald-500 text-white font-bold rounded-lg hover:bg-emerald-600 transition text-sm flex items-center gap-2 disabled:opacity-50">
                                <EmailIcon className="w-4 h-4" /> Email Report
                            </button>
                        )}
                    </div>
                </div>

                {error && (
                    <div className="bg-rose-50 border-l-4 border-rose-500 p-4 rounded-xl mb-6 flex items-start gap-3">
                        <AlertIcon className="w-5 h-5 text-rose-600 mt-0.5" severity="critical" />
                        <div><h3 className="text-rose-800 font-bold text-sm">Data Fetch Error</h3><p className="text-rose-600 text-sm mt-1">{error}</p></div>
                    </div>
                )}

                {loading && !analytics && <div className="h-64 flex justify-center items-center"><Spinner size="10" /></div>}

                {analytics && !loading && (
                    <div className="space-y-6 animate-fade-in-up">
                        
                        <ExecutiveKpiGrid live={analytics.live_kpis} period={analytics.period_kpis} funnel={analytics.funnel} />
                        
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                            <div className="lg:col-span-2"><RecruitmentFunnel funnel={analytics.funnel} totalSubmissions={analytics.period_kpis.newCandidates} /></div>
                            <div><AlertsPanel alerts={analytics.alerts} /></div>
                        </div>

                        {/* ROW: TRENDS & STATUS */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                            <div className="bg-white p-6 rounded-xl shadow-sm ring-1 ring-slate-900/5 h-[350px] flex flex-col lg:col-span-2">
                                <h3 className="font-black text-slate-800 text-sm uppercase mb-4 tracking-wide">Pipeline Velocity (Jobs vs Candidates)</h3>
                                <div className="relative flex-grow">
                                    <ChartComponent type="line" options={{ plugins: { legend: { display: true, position: 'top' } }, elements: { line: { tension: 0.3 } } }} data={{
                                        labels: analytics.trends.labels,
                                        datasets: [
                                            { label: 'Jobs', data: analytics.trends.jobs, borderColor: '#4f46e5', backgroundColor: 'rgba(79, 70, 229, 0.1)', fill: true },
                                            { label: 'Candidates', data: analytics.trends.candidates, borderColor: '#0ea5e9', borderDash: [5,5] }
                                        ]
                                    }} />
                                </div>
                            </div>
                            <div className="bg-white p-6 rounded-xl shadow-sm ring-1 ring-slate-900/5 h-[350px] flex flex-col">
                                <h3 className="font-black text-slate-800 text-sm uppercase mb-4 tracking-wide">Reporting Stages</h3>
                                <div className="relative flex-grow flex items-center justify-center">
                                    <div className="w-full h-full max-h-[250px]">
                                        <ChartComponent type="doughnut" options={{ cutout: '70%', plugins: { legend: { display: true, position: 'bottom', labels: { boxWidth: 10, font: { size: 10 } } } } }} data={{
                                            labels: analytics.candidates.byReportingStage.labels,
                                            datasets: [{ data: analytics.candidates.byReportingStage.values, backgroundColor: ['#10b981', '#f43f5e', '#3b82f6', '#f59e0b', '#94a3b8', '#4f46e5', '#8b5cf6'], borderWidth: 0 }]
                                        }} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* ROW: DEMAND & AGING */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                            <div className="bg-white p-6 rounded-xl shadow-sm ring-1 ring-slate-900/5 h-[350px] flex flex-col">
                                <h3 className="font-black text-slate-800 text-sm uppercase mb-4 tracking-wide">Client Demand (New Jobs)</h3>
                                <div className="relative flex-grow">
                                    <ChartComponent type="bar" options={{ indexAxis: 'y' }} data={getChartData(analytics.jobs.byClient, 'Jobs', '#4f46e5', true)} />
                                </div>
                            </div>
                            <div className="bg-white p-6 rounded-xl shadow-sm ring-1 ring-slate-900/5 h-[350px] flex flex-col">
                                <h3 className="font-black text-slate-800 text-sm uppercase mb-4 tracking-wide">Active Job Aging Distribution</h3>
                                <div className="relative flex-grow">
                                    <ChartComponent type="bar" data={getChartData(analytics.jobs.aging, 'Jobs', '#f59e0b')} />
                                </div>
                            </div>
                        </div>
                        
                        {/* ROW: SKILLS & REJECTIONS */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                            <div className="bg-white p-6 rounded-xl shadow-sm ring-1 ring-slate-900/5 h-[350px] flex flex-col">
                                <h3 className="font-black text-slate-800 text-sm uppercase mb-4 tracking-wide">Top Required Skills (Jobs)</h3>
                                <div className="relative flex-grow">
                                    <ChartComponent type="bar" options={{ indexAxis: 'y' }} data={getChartData(analytics.skills.jobsRequiring, 'Mentions', '#8b5cf6', true)} />
                                </div>
                            </div>
                            <div className="bg-white p-6 rounded-xl shadow-sm ring-1 ring-slate-900/5 h-[350px] flex flex-col">
                                <h3 className="font-black text-slate-800 text-sm uppercase mb-4 tracking-wide">Rejection Breakdown</h3>
                                <div className="relative flex-grow flex items-center justify-center">
                                     <div className="w-full h-full max-h-[250px]">
                                        <ChartComponent type="doughnut" options={{ cutout: '65%', plugins: { legend: { display: true, position: 'right', labels: { boxWidth: 10, font: { size: 10 } } } } }} data={{
                                            labels: analytics.rejections.labels,
                                            datasets: [{ data: analytics.rejections.values, backgroundColor: ['#f43f5e', '#fb7185', '#fda4af', '#fecdd3'], borderWidth: 0 }]
                                        }} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* DETAILED EXPLORER */}
                        <div className="bg-white rounded-xl shadow-sm ring-1 ring-slate-900/5 overflow-hidden">
                            <div className="flex border-b border-slate-100 px-4">
                                <button onClick={() => setActiveTab('recruiters')} className={`p-4 text-sm font-bold border-b-2 ${activeTab==='recruiters'?'border-indigo-600 text-indigo-600':'border-transparent text-slate-500 hover:text-slate-700'}`}>Recruiters</button>
                                <button onClick={() => setActiveTab('clients')} className={`p-4 text-sm font-bold border-b-2 ${activeTab==='clients'?'border-indigo-600 text-indigo-600':'border-transparent text-slate-500 hover:text-slate-700'}`}>Clients</button>
                                <button onClick={() => setActiveTab('sources')} className={`p-4 text-sm font-bold border-b-2 ${activeTab==='sources'?'border-indigo-600 text-indigo-600':'border-transparent text-slate-500 hover:text-slate-700'}`}>Candidate Sources</button>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm whitespace-nowrap">
                                    <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-black">
                                        <tr>
                                            <th className="px-6 py-4">Name</th>
                                            {activeTab==='recruiters' && <><th className="px-6 py-4 text-center">Active Jobs</th><th className="px-6 py-4 text-center">Zero Sub Jobs</th></>}
                                            {activeTab==='clients' && <><th className="px-6 py-4 text-center">Open Jobs</th><th className="px-6 py-4 text-center">New Jobs</th><th className="px-6 py-4 text-center">Submission Cap</th></>}
                                            <th className="px-6 py-4 text-center">Submitted</th>
                                            <th className="px-6 py-4 text-center">Interviews</th>
                                            <th className="px-6 py-4 text-center text-emerald-600">Selected</th>
                                            <th className="px-6 py-4 text-center text-rose-600">Rejected</th>
                                            <th className="px-6 py-4 text-center">Select Rate</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {(activeTab === 'recruiters' ? analytics.tables.recruiters : activeTab === 'clients' ? analytics.tables.clients : analytics.sources).map((r, i) => {
                                            const submitted = r.periodSubs ?? r.submitted;
                                            const interviews = r.periodInterviews ?? r.interviews;
                                            const selected = r.periodHires ?? r.selected;
                                            const rejected = r.periodRejected ?? r.rejected;
                                            const rate = safeDiv(selected, submitted) * 100;
                                            return (
                                                <tr key={i} className="hover:bg-slate-50">
                                                    <td className="px-6 py-4 font-bold text-slate-700">{r.name}</td>
                                                    {activeTab==='recruiters' && <><td className="px-6 py-4 text-center font-medium">{formatMetric(r.activeJobs)}</td><td className="px-6 py-4 text-center font-medium"><span className={`px-2 py-1 rounded-md text-xs font-bold ${r.zeroSubJobs > 0 ? 'bg-amber-100 text-amber-700' : 'text-slate-400'}`}>{r.zeroSubJobs}</span></td></>}
                                                    {activeTab==='clients' && <><td className="px-6 py-4 text-center font-medium text-indigo-600">{formatMetric(r.openJobs)}</td><td className="px-6 py-4 text-center font-medium">{formatMetric(r.newJobs)}</td><td className="px-6 py-4 text-center font-medium text-slate-500">{formatMetric(r.capacity)}</td></>}
                                                    <td className="px-6 py-4 text-center font-bold text-indigo-600">{formatMetric(submitted)}</td>
                                                    <td className="px-6 py-4 text-center font-medium">{formatMetric(interviews)}</td>
                                                    <td className="px-6 py-4 text-center font-bold text-emerald-600">{formatMetric(selected)}</td>
                                                    <td className="px-6 py-4 text-center font-bold text-rose-600">{formatMetric(rejected)}</td>
                                                    <td className="px-6 py-4 text-center font-bold bg-slate-50/50">{formatMetric(rate, true)}</td>
                                                </tr>
                                            )
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                    </div>
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
}