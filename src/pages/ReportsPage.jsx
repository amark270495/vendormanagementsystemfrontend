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

// Generic Icons for KPI Banner
const BriefcaseIcon = ({className}) => <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 0 0 .75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 0 0-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0 1 12 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 0 1-.673-.38m0 0A2.18 2.18 0 0 1 3 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 0 1 3.413-.387m7.5 0V5.25A2.25 2.25 0 0 0 13.5 3h-3a2.25 2.25 0 0 0-2.25 2.25v.894m7.5 0a48.667 48.667 0 0 0-7.5 0M12 12.75h.008v.008H12v-.008Z" /></svg>;
const UserCheckIcon = ({className}) => <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" /></svg>;
const ClockIcon = ({className}) => <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>;
const LocationIcon = ({className}) => <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" /></svg>;
const ChartPieIcon = ({className}) => <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6a7.5 7.5 0 1 0 7.5 7.5h-7.5V6Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5H21A7.5 7.5 0 0 0 13.5 3v7.5Z" /></svg>;

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
    if (val === null || val === undefined || Number.isNaN(val)) return 'N/A';
    return isPercent ? `${Number(val).toFixed(1)}%` : new Intl.NumberFormat().format(val);
};

const decodeHtml = (str) => {
    if (typeof str !== 'string') return str;
    return str.replace(/&amp;/gi, '&').replace(/&lt;/gi, '<').replace(/&gt;/gi, '>');
};

const calculateFunnel = (funnelData, totalSubmitted) => {
    if (!funnelData || totalSubmitted == null) return [];
    
    const selected = funnelData['Selected'] || 0;
    const interview = (funnelData['Interview'] || 0) + selected;
    const shortlisted = (funnelData['Shortlisted'] || 0) + interview;
    const underReview = (funnelData['Under Review'] || 0) + shortlisted;
    const submitted = totalSubmitted || 0; 
    
    return [
        { stage: 'Application', count: submitted, rateOverall: 100 },
        { stage: 'Under Review', count: underReview, rateOverall: safeDiv(underReview, submitted)*100 },
        { stage: 'Shortlisted', count: shortlisted, rateOverall: safeDiv(shortlisted, submitted)*100 },
        { stage: 'Interview', count: interview, rateOverall: safeDiv(interview, submitted)*100 },
        { stage: 'Selected', count: selected, rateOverall: safeDiv(selected, submitted)*100 }
    ];
};

const getChartData = (dataObj, label, colorHex = '#4f46e5', isHorizontal = false) => {
    if (!dataObj || !dataObj.labels) return { labels: [], datasets: [] };
    return {
        labels: dataObj.labels.map(l => decodeHtml(l)),
        datasets: [{ 
            label, data: dataObj.values, 
            backgroundColor: colorHex, borderRadius: 2, 
            borderWidth: isHorizontal ? 1 : 0
        }]
    };
};

const chartOpts = {
    responsive: true, maintainAspectRatio: false,
    plugins: { 
        legend: { display: false },
        tooltip: { backgroundColor: 'rgba(15, 23, 42, 0.95)', titleFont: { size: 12, family: 'Inter' }, padding: 10, cornerRadius: 4 }
    },
    scales: {
        x: { grid: { display: false }, border: { display: false }, ticks: { font: { size: 10 } } },
        y: { grid: { color: '#f1f5f9', drawBorder: false }, border: { display: false }, beginAtZero: true, ticks: { font: { size: 10 } } }
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
// UI COMPONENTS (STYLED LIKE REFERENCE IMAGE)
// ============================================================================

const DashboardCard = ({ title, children, className = "" }) => (
    <div className={`bg-white border border-slate-200 shadow-sm flex flex-col ${className}`}>
        <div className="bg-slate-50 border-b border-slate-200 px-4 py-3 flex items-center gap-2">
            <div className="w-1.5 h-4 bg-slate-300 rounded-sm"></div>
            <h3 className="font-bold text-slate-700 text-[13px] tracking-tight">{title}</h3>
        </div>
        <div className="p-4 flex-grow flex flex-col">
            {children}
        </div>
    </div>
);

const KpiCard = ({ icon: Icon, title, value, subtext }) => (
    <div className="bg-white border border-slate-200 shadow-sm p-4 flex items-center gap-4 relative overflow-hidden">
        <div className="bg-blue-600 text-white rounded-full p-2.5 z-10 flex-shrink-0">
            <Icon className="w-6 h-6" />
        </div>
        <div className="z-10 flex flex-col justify-center">
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">{title}</div>
            <div className="text-2xl font-black text-slate-800 leading-tight">{value}</div>
            {subtext && <div className="text-[10px] text-slate-400 font-medium mt-0.5">{subtext}</div>}
        </div>
        {/* Subtle background decoration mimicking chevron flow */}
        <div className="absolute right-0 top-0 bottom-0 w-12 bg-slate-50 transform skew-x-12 translate-x-6 border-l border-slate-100"></div>
    </div>
);

const ChartComponent = ({ type, options, data }) => {
    if (!data || !data.labels || data.labels.length === 0) return <div className="flex justify-center items-center h-full text-slate-400 font-bold text-sm">No Data Available</div>;
    const mergedOpts = { ...chartOpts, ...options };
    if (type === 'bar') return <Bar options={mergedOpts} data={data} />;
    if (type === 'doughnut') return <Doughnut options={mergedOpts} data={data} />;
    if (type === 'line') return <Line options={mergedOpts} data={data} />;
    return null;
};

const InlineBarTable = ({ columns, data, barColumnIndex, colorClass = "bg-emerald-500" }) => (
    <div className="overflow-x-auto">
        <table className="w-full text-left text-xs whitespace-nowrap">
            <thead className="bg-slate-50 border-y border-slate-200 text-slate-500 font-bold">
                <tr>
                    {columns.map((col, i) => (
                        <th key={i} className={`py-2 px-3 ${i === 0 ? '' : 'text-center'} ${i === barColumnIndex ? 'w-1/3' : ''}`}>{col}</th>
                    ))}
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
                {data.length === 0 ? <tr><td colSpan={columns.length} className="text-center py-4 text-slate-400">No data</td></tr> : null}
                {data.map((row, rowIndex) => (
                    <tr key={rowIndex} className="hover:bg-slate-50/50">
                        {row.map((cell, colIndex) => (
                            <td key={colIndex} className={`py-2.5 px-3 text-slate-700 ${colIndex === 0 ? 'font-medium truncate max-w-[150px]' : 'text-center'}`}>
                                {colIndex === barColumnIndex ? (
                                    <div className="flex items-center gap-2 justify-center">
                                        <div className="w-24 bg-slate-100 h-2 rounded-sm overflow-hidden">
                                            <div className={`${colorClass} h-2 rounded-sm`} style={{width: `${Math.min(Math.max(parseFloat(cell) || 0, 0), 100)}%`}}></div>
                                        </div>
                                        <span className="w-8 text-right font-bold text-[10px]">{formatMetric(cell, true)}</span>
                                    </div>
                                ) : cell}
                            </td>
                        ))}
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
);

const CustomFunnel = ({ stages }) => (
    <div className="flex flex-col justify-center h-full space-y-3 px-4">
        {stages.map((s, i) => {
            const pct = Math.max(s.rateOverall || 0, 2); // min width for visibility
            return (
                <div key={s.stage} className="flex items-center gap-4 w-full">
                    <div className="w-1/3 text-right text-xs font-medium text-slate-600 truncate">{s.stage}</div>
                    <div className="w-2/3 flex items-center">
                        <div className="bg-blue-600 h-7 flex items-center justify-center text-white text-[10px] font-bold transition-all duration-500 rounded-sm shadow-sm" 
                             style={{ width: `${pct}%` }}>
                            {pct > 15 ? formatMetric(s.rateOverall, true) : ''}
                        </div>
                        {pct <= 15 && <span className="ml-2 text-[10px] font-bold text-slate-500">{formatMetric(s.rateOverall, true)}</span>}
                    </div>
                </div>
            );
        })}
    </div>
);

const StackedPipeline = ({ funnel }) => {
    // Only show active pipeline stages
    const review = funnel['Under Review'] || 0;
    const shortlist = funnel['Shortlisted'] || 0;
    const interview = funnel['Interview'] || 0;
    const total = review + shortlist + interview;
    
    if (total === 0) return <div className="text-xs text-slate-400 text-center py-8">No candidates currently in active pipeline.</div>;

    const pReview = (review / total) * 100;
    const pShortlist = (shortlist / total) * 100;
    const pInterview = (interview / total) * 100;

    return (
        <div className="flex flex-col h-full justify-center">
            <div className="flex justify-between text-xs font-bold text-slate-600 mb-2">
                <span>Active Pipeline</span>
                <span>{total} Pending APP(s)</span>
            </div>
            <div className="w-full flex h-10 rounded-sm overflow-hidden shadow-sm">
                {review > 0 && <div style={{width: `${pReview}%`}} className="bg-indigo-600 text-white flex flex-col items-center justify-center text-[10px] font-bold"><span>{review}</span></div>}
                {shortlist > 0 && <div style={{width: `${pShortlist}%`}} className="bg-blue-400 text-white flex flex-col items-center justify-center text-[10px] font-bold"><span>{shortlist}</span></div>}
                {interview > 0 && <div style={{width: `${pInterview}%`}} className="bg-emerald-500 text-white flex flex-col items-center justify-center text-[10px] font-bold"><span>{interview}</span></div>}
            </div>
            <div className="flex justify-between text-[10px] text-slate-500 mt-2 font-medium">
                {review > 0 && <div style={{width: `${pReview}%`}} className="text-center truncate">Review</div>}
                {shortlist > 0 && <div style={{width: `${pShortlist}%`}} className="text-center truncate">Shortlist</div>}
                {interview > 0 && <div style={{width: `${pInterview}%`}} className="text-center truncate">Interview</div>}
            </div>
        </div>
    );
};

// ============================================================================
// MAIN PAGE COMPONENT
// ============================================================================
export default function ReportsPage() {
    const { user } = useAuth();
    const { canViewReports } = usePermissions();
    const [datePreset, setDatePreset] = useState('30D');
    const [activeTab, setActiveTab] = useState('recruiters'); 

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
                <div className="text-center p-12 bg-white rounded-sm border border-slate-200 shadow-sm max-w-md">
                    <AlertIcon className="mx-auto h-12 w-12 text-rose-500" />
                    <h3 className="mt-4 text-lg font-bold text-slate-900">Access Denied</h3>
                    <p className="mt-2 text-sm text-slate-500">Company-wide reporting is restricted by your current role.</p>
                </div>
            </div>
        );
    }

    // Process Data safely
    const funnelStages = analytics ? calculateFunnel(analytics.funnel, analytics.period_kpis.newCandidates) : [];
    
    // STRICT ZERO-DATA FILTERING
    const activeRecruiters = analytics?.tables?.recruiters?.filter(r => r.activeJobs > 0 || r.zeroSubJobs > 0 || r.periodSubs > 0 || r.periodInterviews > 0 || r.periodHires > 0 || r.periodRejected > 0) || [];
    const activeClients = analytics?.tables?.clients?.filter(c => c.openJobs > 0 || c.newJobs > 0 || c.periodSubs > 0 || c.periodHires > 0) || [];
    const activeSources = analytics?.sources?.filter(s => s.submitted > 0 || s.interviews > 0 || s.selected > 0 || s.rejected > 0) || [];

    // Table Transformers for Design
    const sourceTableData = activeSources.slice(0, 5).map(s => [
        s.name || 'Unknown', 
        s.selected, 
        safeDiv(s.selected, s.submitted)*100
    ]);
    
    const rejectionTableData = analytics?.rejections?.labels?.map((label, idx) => [
        decodeHtml(label),
        analytics.rejections.values[idx],
        safeDiv(analytics.rejections.values[idx], analytics.rejections.values.reduce((a,b)=>a+b,0))*100
    ]).slice(0, 5) || [];

    return (
        <div className="p-4 md:p-6 bg-[#f3f4f6] min-h-screen font-sans text-slate-800">
            <div className="max-w-[1400px] mx-auto space-y-4">
                
                {/* PAGE HEADER */}
                <div className="text-center mb-6">
                    <h1 className="text-2xl md:text-3xl font-medium text-slate-800 tracking-tight">Staffing Dashboard with Recruitment Funnel and Sources of Applications</h1>
                </div>
                
                {/* FILTER BAR */}
                <div className="bg-white p-3 border border-slate-200 shadow-sm flex flex-wrap gap-4 items-center justify-between">
                    <div className="flex flex-wrap items-center gap-3">
                        <select value={filters.sheetKey} onChange={e => setFilters(p => ({...p, sheetKey: e.target.value}))} className="bg-white border border-slate-300 px-3 py-1.5 text-xs text-slate-700 outline-none w-40 disabled:opacity-50" disabled={loading}>
                            {Object.entries(DASHBOARD_CONFIGS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                        </select>
                        <div className="flex border border-slate-300">
                            {['7D', '30D', '90D', '6M', 'YTD', 'ALL'].map(p => (
                                <button key={p} onClick={() => handlePresetChange(p)} disabled={loading} className={`px-3 py-1.5 text-xs transition-colors disabled:opacity-50 border-r last:border-r-0 border-slate-300 ${datePreset === p ? 'bg-slate-200 font-bold text-slate-800' : 'bg-white text-slate-600 hover:bg-slate-50'}`}>{p}</button>
                            ))}
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-400 mr-2">Updated: {analytics?.meta?.generatedAt ? new Date(analytics.meta.generatedAt).toLocaleString() : 'N/A'}</span>
                        <button onClick={fetchAnalytics} disabled={loading} className="px-3 py-1.5 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 transition text-xs flex items-center gap-1">
                            <RefreshIcon className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
                        </button>
                    </div>
                </div>

                {error && <div className="bg-rose-50 border border-rose-300 p-3 text-rose-700 text-xs font-bold">{error}</div>}
                {loading && !analytics && <div className="h-64 flex justify-center items-center"><Spinner size="10" /></div>}

                {analytics && !loading && (
                    <div className="space-y-4 animate-fade-in-up">
                        
                        {/* KPI BANNER ROW */}
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                            <KpiCard icon={UserCheckIcon} title="Selected" value={formatMetric(analytics.period_kpis.periodHires)} subtext="Candidates Hired" />
                            <KpiCard icon={ChartPieIcon} title="Sub. Util" value={formatMetric(analytics.live_kpis.utilization, true)} subtext="Live Capacity" />
                            <KpiCard icon={ClockIcon} title="Avg Job Age" value={formatMetric(analytics.live_kpis.avgJobAge)} subtext="Days Active" />
                            <KpiCard icon={BriefcaseIcon} title="New Jobs" value={formatMetric(analytics.period_kpis.newJobs)} subtext="Created in Period" />
                            <KpiCard icon={LocationIcon} title="Open Position" value={formatMetric(analytics.live_kpis.openJobs)} subtext="Live Available" />
                            <KpiCard icon={UserCheckIcon} title="Submitted" value={formatMetric(analytics.period_kpis.newCandidates)} subtext="Total Applications" />
                        </div>

                        {/* ROW 1: METRICS, EFFICIENCY, FUNNEL */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                            <DashboardCard title={`Velocity Metrics (${datePreset})`} className="h-[280px]">
                                <div className="relative flex-grow mt-2">
                                    <ChartComponent type="bar" options={{ plugins: { legend: { display: true, position: 'top', labels: {boxWidth: 10, font:{size:10}} } }, scales: { y: { stacked: false }, x: { stacked: false } } }} data={{
                                        labels: analytics.trends.labels,
                                        datasets: [
                                            { label: 'Jobs', data: analytics.trends.jobs, backgroundColor: '#ef4444' },
                                            { label: 'Candidates', data: analytics.trends.candidates, backgroundColor: '#22c55e' }
                                        ]
                                    }} />
                                </div>
                            </DashboardCard>
                            
                            <DashboardCard title="Pipeline Efficiency / Status" className="h-[280px]">
                                <div className="relative flex-grow flex items-center justify-center pb-2">
                                    <div className="absolute inset-0 flex flex-col items-center justify-center mt-2 pointer-events-none">
                                        <span className="text-3xl font-black text-slate-800 leading-none">{formatMetric(analytics.period_kpis.newCandidates)}</span>
                                        <span className="text-[10px] text-slate-500 uppercase tracking-widest mt-1">Total APPS</span>
                                    </div>
                                    <div className="w-full h-full max-h-[200px]">
                                        <ChartComponent type="doughnut" options={{ cutout: '75%', plugins: { legend: { display: true, position: 'right', labels: { boxWidth: 10, font: { size: 10 } } } } }} data={{
                                            labels: analytics.candidates.byReportingStage.labels.map(decodeHtml),
                                            datasets: [{ data: analytics.candidates.byReportingStage.values, backgroundColor: ['#8b5cf6', '#ef4444', '#f59e0b', '#22c55e', '#3b82f6', '#64748b'], borderWidth: 0 }]
                                        }} />
                                    </div>
                                </div>
                            </DashboardCard>
                            
                            <DashboardCard title="Recruitment Funnel" className="h-[280px]">
                                <CustomFunnel stages={funnelStages} />
                            </DashboardCard>
                        </div>

                        {/* ROW 2: SOURCES, DECLINES, ACTIVE PIPELINE */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                            <DashboardCard title="Application Sources" className="h-[240px]">
                                <InlineBarTable columns={["Source", "# Hired", "Conv Rate"]} data={sourceTableData} barColumnIndex={2} colorClass="bg-emerald-500" />
                            </DashboardCard>
                            
                            <DashboardCard title="Decline Reasons" className="h-[240px]">
                                <InlineBarTable columns={["Reason", "# APPS", "% of APPS"]} data={rejectionTableData} barColumnIndex={2} colorClass="bg-rose-600" />
                            </DashboardCard>
                            
                            <div className="flex flex-col gap-4">
                                <DashboardCard title="Active Pipeline" className="h-[150px]">
                                    <StackedPipeline funnel={analytics.funnel} />
                                </DashboardCard>
                                <DashboardCard title="Alerts & Comments" className="h-[74px]">
                                    <div className="flex items-center gap-3 h-full">
                                        <AlertIcon severity="warning" className="w-5 h-5 text-amber-500 shrink-0" />
                                        <div className="text-xs text-slate-600 truncate">
                                            {analytics.alerts?.length > 0 ? analytics.alerts[0].description : "No active alerts. System healthy."}
                                        </div>
                                    </div>
                                </DashboardCard>
                            </div>
                        </div>

                        {/* DETAILED TABLES (FILTERED NO DUMMY DATA) */}
                        <DashboardCard title="Performance Data Explorer" className="mt-4">
                            <div className="flex border-b border-slate-200 mb-4">
                                <button onClick={() => setActiveTab('recruiters')} className={`px-4 py-2 text-xs font-bold border-b-2 ${activeTab==='recruiters'?'border-blue-600 text-blue-600':'border-transparent text-slate-500'}`}>Recruiters</button>
                                <button onClick={() => setActiveTab('clients')} className={`px-4 py-2 text-xs font-bold border-b-2 ${activeTab==='clients'?'border-blue-600 text-blue-600':'border-transparent text-slate-500'}`}>Clients</button>
                            </div>
                            <div className="overflow-x-auto max-h-[300px]">
                                <table className="w-full text-left text-xs whitespace-nowrap">
                                    <thead className="bg-slate-50 text-slate-600 uppercase font-bold sticky top-0 border-y border-slate-200">
                                        <tr>
                                            <th className="px-4 py-2">Name</th>
                                            {activeTab==='recruiters' && <><th className="px-4 py-2 text-center">Active Jobs</th><th className="px-4 py-2 text-center">Zero-Sub</th></>}
                                            {activeTab==='clients' && <><th className="px-4 py-2 text-center">Open Jobs</th><th className="px-4 py-2 text-center">New Jobs</th></>}
                                            <th className="px-4 py-2 text-center">Submitted</th>
                                            <th className="px-4 py-2 text-center">Interviews</th>
                                            <th className="px-4 py-2 text-center">Selected</th>
                                            <th className="px-4 py-2 text-center">Rejected</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {(activeTab === 'recruiters' ? activeRecruiters : activeClients).map((row, i) => (
                                            <tr key={i} className="hover:bg-slate-50">
                                                <td className="px-4 py-2 font-medium text-slate-800 max-w-[200px] truncate">{decodeHtml(row.name)}</td>
                                                {activeTab==='recruiters' && <><td className="px-4 py-2 text-center">{formatMetric(row.activeJobs)}</td><td className="px-4 py-2 text-center">{formatMetric(row.zeroSubJobs)}</td></>}
                                                {activeTab==='clients' && <><td className="px-4 py-2 text-center">{formatMetric(row.openJobs)}</td><td className="px-4 py-2 text-center">{formatMetric(row.newJobs)}</td></>}
                                                <td className="px-4 py-2 text-center">{formatMetric(row.periodSubs ?? row.submitted)}</td>
                                                <td className="px-4 py-2 text-center">{formatMetric(row.periodInterviews ?? row.interviews)}</td>
                                                <td className="px-4 py-2 text-center text-emerald-600 font-bold">{formatMetric(row.periodHires ?? row.selected)}</td>
                                                <td className="px-4 py-2 text-center text-rose-600">{formatMetric(row.periodRejected ?? row.rejected)}</td>
                                            </tr>
                                        ))}
                                        {(activeTab === 'recruiters' ? activeRecruiters : activeClients).length === 0 && (
                                            <tr><td colSpan="8" className="text-center py-6 text-slate-400">No active data for selected period.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </DashboardCard>

                    </div>
                )}
            </div>
        </div>
    );
}