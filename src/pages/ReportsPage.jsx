import React, { useState, useEffect, useCallback } from 'react';
import { 
    Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, 
    LinearScale, BarElement, LineElement, PointElement, DoughnutController 
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../api/apiService';
import { usePermissions } from '../hooks/usePermissions';

ChartJS.register(
    ArcElement, Tooltip, Legend, CategoryScale, LinearScale, 
    BarElement, LineElement, PointElement, DoughnutController
);

ChartJS.defaults.font.family = "'Inter', system-ui, -apple-system, sans-serif";
ChartJS.defaults.color = '#64748b';

// --- SVGs & Icons ---
const RefreshIcon = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" /></svg>;
const DownloadIcon = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>;
const EmailIcon = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" /></svg>;
const AlertIcon = ({ className, severity }) => {
    if (severity === 'critical') return <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>;
    return <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" /></svg>;
};

const Spinner = ({ size = '6' }) => (
    <div className="flex justify-center items-center">
        <div className={`w-${size} h-${size} border-4 border-t-transparent border-indigo-600 rounded-full animate-spin`}></div>
    </div>
);

const DASHBOARD_CONFIGS = {
    'all': { title: 'All VMS Sources' },
    'ecaltVMSDisplay': { title: 'Eclat VMS' },
    'taprootVMSDisplay': { title: 'Taproot VMS' },
    'michiganDisplay': { title: 'Michigan VMS' },
    'EclatTexasDisplay': { title: 'Eclat Texas VMS' },
    'TaprootTexasDisplay': { title: 'Taproot Texas VMS' },
    'VirtusaDisplay': { title: 'Virtusa Taproot' },
    'DeloitteDisplay': { title: 'Deloitte Taproot' },
    'tsiBdmDisplay': { title: 'TSI - BDM Openings' },
    'tsiBdrDisplay': { title: 'TSI - BDR Openings' }
};

const ChartComponent = ({ type, options, data }) => {
    if (!data || !data.labels || data.labels.length === 0) return <div className="flex justify-center items-center h-full text-slate-400 font-medium text-sm">No data available.</div>;
    const commonOptions = { responsive: true, maintainAspectRatio: false, ...options };
    if (type === 'bar') return <Bar options={commonOptions} data={data} />;
    if (type === 'doughnut') return <Doughnut options={commonOptions} data={data} />;
    if (type === 'line') return <Line options={commonOptions} data={data} />;
    return null;
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
        const emailSheetKey = sheetKey === 'all' ? 'taprootVMSDisplay' : sheetKey; 

        const toEmailArray = toEmails.split(',').map(e => e.trim()).filter(Boolean);
        const ccEmailArray = ccEmails.split(',').map(e => e.trim()).filter(Boolean);
        if (toEmailArray.length === 0) return setError("Please provide at least one 'To' email.");

        setIsSending(true); setError(''); setSuccessMessage('');
        try {
            const response = await apiService.generateAndSendJobReport(emailSheetKey, statusFilter, toEmailArray, ccEmailArray, authenticatedUsername);
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

const getDateString = (daysAgo) => {
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    return d.toISOString().split('T')[0];
};

const ReportsPage = () => {
    const { user } = useAuth();
    const { canViewReports, canEmailReports } = usePermissions();
    
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [datePreset, setDatePreset] = useState('30D');
    const [isEmailModalOpen, setEmailModalOpen] = useState(false);
    
    const [activeTab, setActiveTab] = useState('recruiters'); 

    const [filters, setFilters] = useState({
        startDate: getDateString(30),
        endDate: getDateString(0),
        sheetKey: 'all'
    });

    const handlePresetChange = (preset) => {
        setDatePreset(preset);
        let start = '';
        const end = getDateString(0);
        switch (preset) {
            case '7D': start = getDateString(7); break;
            case '30D': start = getDateString(30); break;
            case '90D': start = getDateString(90); break;
            case '6M': start = getDateString(180); break;
            case '12M': start = getDateString(365); break;
            case 'YTD': start = new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0]; break;
            case 'ALL': start = ''; break;
            default: start = getDateString(30);
        }
        setFilters(prev => ({ ...prev, startDate: start, endDate: end }));
    };

    const fetchAnalytics = useCallback(async () => {
        if (!user?.userIdentifier || !canViewReports) { setLoading(false); return; }
        
        setLoading(true); setError('');
        
        try {
            const params = { 
                authenticatedUsername: user.userIdentifier, 
                startDate: filters.startDate, 
                endDate: filters.endDate,
                sheetKey: filters.sheetKey 
            };
            const response = await apiService.getReportsAnalytics(params);

            if (response.data.success) {
                setAnalytics(response.data);
            } else {
                throw new Error(response.data.message || "Failed to fetch data.");
            }
        } catch (err) {
            console.error("API call failed:", err);
            setError(err.response?.data?.message || err.message || "Failed to load live reports.");
        } finally {
            setLoading(false);
        }
    }, [filters, user?.userIdentifier, canViewReports]);

    useEffect(() => { fetchAnalytics(); }, [fetchAnalytics]);

    const handleExportData = () => {
        if (!analytics) return;
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(analytics, null, 2));
        const a = document.createElement('a');
        a.href = dataStr; 
        a.download = `Taproot_Analytics_Extract_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
    };

    // --- Chart Configurations ---
    const enterpriseChartOptions = {
        responsive: true, maintainAspectRatio: false,
        plugins: { 
            legend: { display: false },
            tooltip: { backgroundColor: 'rgba(15, 23, 42, 0.9)', titleFont: { size: 13, family: 'Inter' }, padding: 12, cornerRadius: 8 }
        },
        scales: {
            x: { grid: { display: false }, border: { display: false }, ticks: { font: { size: 11 } } },
            y: { grid: { color: '#f1f5f9', drawBorder: false }, border: { display: false }, beginAtZero: true, ticks: { font: { size: 11 } } }
        }
    };

    const getChartData = (dataObj, label, colorHex = '#4f46e5', isHorizontal = false) => {
        if (!dataObj) return { labels: [], datasets: [] };
        return {
            labels: dataObj.labels, 
            datasets: [{ 
                label, data: dataObj.values, 
                backgroundColor: colorHex, borderRadius: 4, 
                borderWidth: isHorizontal ? 1 : 0
            }]
        };
    };

    // --- BI Logic: Derived Frontend Variables ---
    let totalCandsPeriod = 0, hiredCount = 0, rejectedCount = 0;
    let rejectedPercent = '0.0', hiredPercent = '0.0';

    if (analytics) {
        // Calculate Conversion Percentages safely
        const statuses = analytics.candidates.byStatus;
        if (statuses.labels && statuses.labels.length > 0) {
            totalCandsPeriod = statuses.values.reduce((a, b) => a + b, 0) || 1;
            
            const hiredIdx = statuses.labels.indexOf("Hired");
            if (hiredIdx !== -1) hiredCount = statuses.values[hiredIdx];
            
            const rejectedIdx = statuses.labels.indexOf("Rejected");
            if (rejectedIdx !== -1) rejectedCount = statuses.values[rejectedIdx];

            hiredPercent = ((hiredCount / totalCandsPeriod) * 100).toFixed(1);
            rejectedPercent = ((rejectedCount / totalCandsPeriod) * 100).toFixed(1);
        }
    }

    if (!canViewReports && !loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-slate-50">
                <div className="text-center p-12 bg-white rounded-3xl shadow-sm border border-slate-200 max-w-md">
                    <AlertIcon className="mx-auto h-12 w-12 text-rose-500" />
                    <h3 className="mt-4 text-lg font-bold text-slate-900">Access Denied</h3>
                    <p className="mt-2 text-sm text-slate-500">Company-wide report access is restricted. Contact your administrator if you need visibility into this data.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-8 bg-slate-50 min-h-screen font-sans text-slate-800">
            <div className="max-w-[1600px] mx-auto space-y-6">
                
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                    <div>
                        <h1 className="text-3xl md:text-4xl font-black tracking-tight text-slate-900">Taproot Talent & VMS Intelligence</h1>
                        <p className="mt-1 text-slate-500 font-medium text-sm">Company-wide recruiting and candidate pipeline analytics.</p>
                    </div>
                    <div className="text-right text-xs font-semibold text-slate-400">
                        Last updated: {analytics?.meta?.generatedAt ? new Date(analytics.meta.generatedAt).toLocaleString() : 'Never'}
                    </div>
                </div>

                {/* Controls Bar */}
                <div className="bg-white p-4 rounded-2xl shadow-sm ring-1 ring-slate-900/5 flex flex-col xl:flex-row items-center justify-between gap-5 sticky top-4 z-10 backdrop-blur-md bg-white/90">
                    <div className="flex flex-wrap items-center gap-4 w-full xl:w-auto">
                        <select 
                            value={filters.sheetKey} 
                            onChange={(e) => setFilters(p => ({...p, sheetKey: e.target.value}))}
                            className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-700 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition cursor-pointer min-w-[180px]"
                            disabled={loading}
                        >
                            {Object.entries(DASHBOARD_CONFIGS).map(([key, config]) => (
                                <option key={key} value={key}>{config.title}</option>
                            ))}
                        </select>

                        <div className="flex space-x-1 p-1 bg-slate-100 rounded-xl overflow-x-auto">
                            {['7D', '30D', '90D', '6M', '12M', 'YTD', 'ALL'].map(preset => (
                                <button 
                                    key={preset}
                                    onClick={() => handlePresetChange(preset)}
                                    className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${datePreset === preset ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200'}`}
                                >
                                    {preset}
                                </button>
                            ))}
                        </div>
                        
                        {datePreset === 'Custom' && (
                            <div className="flex items-center gap-2 text-xs">
                                <input type="date" value={filters.startDate} onChange={e => setFilters(p => ({...p, startDate: e.target.value}))} className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 outline-none" />
                                <span className="text-slate-400 font-bold">-</span>
                                <input type="date" value={filters.endDate} onChange={e => setFilters(p => ({...p, endDate: e.target.value}))} className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 outline-none" />
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-3 w-full xl:w-auto shrink-0 justify-end">
                        <button onClick={fetchAnalytics} disabled={loading} className="px-4 py-2 bg-indigo-50 text-indigo-600 font-semibold hover:bg-indigo-100 rounded-xl transition flex items-center gap-2 text-sm">
                            <RefreshIcon className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
                        </button>
                        <button onClick={handleExportData} disabled={!analytics || loading} className="px-4 py-2 bg-white border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 rounded-xl transition flex items-center gap-2 text-sm disabled:opacity-50">
                            <DownloadIcon className="w-4 h-4" /> JSON Export
                        </button>
                        <button onClick={() => setEmailModalOpen(true)} disabled={!analytics || !canEmailReports || loading} className="px-4 py-2 bg-emerald-500 text-white font-semibold hover:bg-emerald-600 rounded-xl transition flex items-center gap-2 text-sm disabled:opacity-50">
                            <EmailIcon className="w-4 h-4" /> Email Report
                        </button>
                    </div>
                </div>

                {error && (
                    <div className="bg-rose-50 border-l-4 border-rose-500 p-4 rounded-r-xl flex items-start gap-3">
                        <AlertIcon className="w-5 h-5 text-rose-600 mt-0.5" severity="critical" />
                        <div><h3 className="text-rose-800 font-bold text-sm">Data Fetch Error</h3><p className="text-rose-600 text-sm mt-1">{error}</p></div>
                    </div>
                )}

                {loading && !analytics && (
                    <div className="h-64 flex flex-col justify-center items-center"><Spinner size="10" /></div>
                )}

                {analytics && !loading && (
                    <div className="space-y-6 animate-fade-in-up">
                        
                        {/* BENTO BOX 1: LIVE OPERATIONAL HEALTH */}
                        <div className="bg-white rounded-2xl p-6 ring-1 ring-slate-900/5 shadow-sm bg-gradient-to-br from-white to-slate-50/50">
                            <div className="flex items-center gap-3 mb-6">
                                <span className="flex h-3 w-3 relative"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span></span>
                                <h2 className="text-base font-black text-slate-800 tracking-tight uppercase">Operational Health (Live)</h2>
                            </div>
                            
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                {/* Metric 1: Open Jobs */}
                                <div className="flex flex-col justify-between border-r border-slate-100 pr-6">
                                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Active Open Jobs</span>
                                    <span className="text-4xl font-black text-slate-800 tracking-tight">{analytics.live_kpis.openJobs}</span>
                                </div>
                                
                                {/* Metric 2: Capacity Utilization (Submission %) */}
                                <div className="flex flex-col justify-between border-r border-slate-100 pr-6">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Submission %</span>
                                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${analytics.live_kpis.utilization >= 100 ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}`}>{analytics.live_kpis.utilization}%</span>
                                    </div>
                                    <div>
                                        <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                                            <span>{analytics.live_kpis.totalSubmissions} Subs</span>
                                            <span className="text-slate-400">/ {analytics.live_kpis.totalCapacity} Cap</span>
                                        </div>
                                        <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                                            <div className={`h-2.5 rounded-full transition-all duration-1000 ${analytics.live_kpis.utilization >= 100 ? 'bg-rose-500' : 'bg-emerald-500'}`} style={{ width: `${Math.min(analytics.live_kpis.utilization, 100)}%` }}></div>
                                        </div>
                                    </div>
                                </div>

                                {/* Metric 3: Zero Subs */}
                                <div className="flex flex-col justify-between border-r border-slate-100 pr-6">
                                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Zero-Sub Jobs</span>
                                    <span className={`text-4xl font-black tracking-tight ${analytics.live_kpis.jobsWithZeroSubmissions > 0 ? 'text-amber-500' : 'text-slate-800'}`}>{analytics.live_kpis.jobsWithZeroSubmissions}</span>
                                </div>

                                {/* Metric 4: Avg Job Age */}
                                <div className="flex flex-col justify-between">
                                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Avg Job Age</span>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-4xl font-black text-slate-800 tracking-tight">{analytics.live_kpis.avgJobAge}</span>
                                        <span className="text-sm font-bold text-slate-400">Days</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Alerts */}
                        {analytics.alerts && analytics.alerts.length > 0 && (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {analytics.alerts.map((alert, i) => (
                                    <div key={i} className={`p-4 rounded-xl border flex items-start gap-3 ${alert.severity === 'critical' ? 'bg-rose-50 border-rose-100 text-rose-800' : 'bg-amber-50 border-amber-100 text-amber-800'}`}>
                                        <AlertIcon severity={alert.severity} className={`w-5 h-5 mt-0.5 shrink-0 ${alert.severity === 'critical' ? 'text-rose-600' : 'text-amber-600'}`} />
                                        <div>
                                            <h4 className="font-bold text-sm">{alert.title} <span className="ml-1 opacity-75">({alert.count})</span></h4>
                                            <p className="text-xs font-medium mt-1 opacity-90 leading-relaxed">{alert.description}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* BENTO BOX 2: PIPELINE CONVERSION (PERIOD SPECIFIC) */}
                        <div className="bg-white rounded-2xl p-6 ring-1 ring-slate-900/5 shadow-sm">
                            <h2 className="text-base font-black text-slate-800 mb-6 tracking-tight uppercase">Pipeline Conversion <span className="text-slate-400 lowercase ml-2 font-semibold bg-slate-100 px-2 py-0.5 rounded-md">({datePreset})</span></h2>
                            
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                {/* Sourced */}
                                <div className="flex flex-col justify-between border-r border-slate-100 pr-6">
                                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Candidates Sourced</span>
                                    <span className="text-4xl font-black text-indigo-600 tracking-tight">{analytics.period_kpis.newCandidates}</span>
                                </div>
                                
                                {/* Hired */}
                                <div className="flex flex-col justify-between border-r border-slate-100 pr-6">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block">Hired</span>
                                        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">{hiredPercent}% Hire Rate</span>
                                    </div>
                                    <span className="text-4xl font-black text-slate-800 tracking-tight">{hiredCount}</span>
                                </div>

                                {/* Rejected */}
                                <div className="flex flex-col justify-between border-r border-slate-100 pr-6">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block">Rejected</span>
                                        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700">{rejectedPercent}% Rej. Rate</span>
                                    </div>
                                    <span className="text-4xl font-black text-slate-800 tracking-tight">{rejectedCount}</span>
                                </div>

                                {/* Jobs Closed */}
                                <div className="flex flex-col justify-between">
                                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Jobs Closed</span>
                                    <span className="text-4xl font-black text-slate-800 tracking-tight">{analytics.period_kpis.closedJobs}</span>
                                </div>
                            </div>
                        </div>

                        {/* Charts Grid */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <div className="bg-white p-6 rounded-2xl shadow-sm ring-1 ring-slate-900/5 h-[350px] flex flex-col lg:col-span-2">
                                <h3 className="font-black text-slate-800 mb-1 uppercase tracking-wide text-sm">Demand vs Supply Velocity</h3>
                                <p className="text-xs text-slate-500 font-medium mb-4">Jobs created vs candidates submitted over the selected period.</p>
                                <div className="relative flex-grow">
                                    <ChartComponent type='line' options={{...enterpriseChartOptions, plugins: { legend: { display: true, position: 'top' } }, elements: { line: { tension: 0.3 }}}} data={{
                                        labels: analytics.trends.labels,
                                        datasets: [
                                            { label: 'Jobs Created', data: analytics.trends.jobs, borderColor: '#4f46e5', backgroundColor: 'rgba(79, 70, 229, 0.1)', fill: true, borderWidth: 3, pointRadius: 3 },
                                            { label: 'Candidates Submitted', data: analytics.trends.candidates, borderColor: '#0ea5e9', backgroundColor: 'transparent', borderDash: [5, 5], borderWidth: 3, pointRadius: 3 }
                                        ]
                                    }} />
                                </div>
                            </div>
                            
                            <div className="bg-white p-6 rounded-2xl shadow-sm ring-1 ring-slate-900/5 h-[350px] flex flex-col">
                                <h3 className="font-black text-slate-800 mb-4 uppercase tracking-wide text-sm">Candidate Status Distribution</h3>
                                <div className="relative flex-grow flex items-center justify-center">
                                    <div className="w-full h-full max-h-[250px]">
                                        <ChartComponent type='doughnut' options={{...enterpriseChartOptions, cutout: '70%', scales: {x:{display:false}, y:{display:false}}, plugins: { legend: { display: true, position: 'bottom', labels: { boxWidth: 10, font: { size: 10 } } } }}} data={{
                                            labels: analytics.candidates.byStatus.labels,
                                            datasets: [{ data: analytics.candidates.byStatus.values, backgroundColor: ['#10b981', '#f43f5e', '#3b82f6', '#f59e0b', '#94a3b8'], borderWidth: 0 }]
                                        }} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div className="bg-white p-6 rounded-2xl shadow-sm ring-1 ring-slate-900/5 h-[350px] flex flex-col">
                                <h3 className="font-black text-slate-800 mb-4 uppercase tracking-wide text-sm">Client Demand (New Jobs)</h3>
                                <div className="relative flex-grow">
                                    <ChartComponent type='bar' options={{...enterpriseChartOptions, indexAxis: 'y'}} data={getChartData(analytics.jobs.byClient, 'Jobs', '#4f46e5', true)} />
                                </div>
                            </div>
                            <div className="bg-white p-6 rounded-2xl shadow-sm ring-1 ring-slate-900/5 h-[350px] flex flex-col">
                                <h3 className="font-black text-slate-800 mb-4 uppercase tracking-wide text-sm">Active Job Aging Distribution</h3>
                                <div className="relative flex-grow">
                                    <ChartComponent type='bar' options={enterpriseChartOptions} data={getChartData(analytics.jobs.aging, 'Jobs', '#f59e0b')} />
                                </div>
                            </div>
                        </div>

                        {/* Detailed Data Explorer */}
                        <div className="bg-white rounded-2xl shadow-sm ring-1 ring-slate-900/5 overflow-hidden pt-2">
                            <div className="flex border-b border-slate-200 px-6">
                                <button onClick={() => setActiveTab('recruiters')} className={`px-4 py-4 text-sm font-bold border-b-2 transition-colors ${activeTab === 'recruiters' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>Recruiter Performance</button>
                                <button onClick={() => setActiveTab('clients')} className={`px-4 py-4 text-sm font-bold border-b-2 transition-colors ${activeTab === 'clients' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>Client Portfolio</button>
                            </div>
                            
                            <div className="overflow-x-auto">
                                {activeTab === 'recruiters' && (
                                    <table className="w-full text-left text-sm whitespace-nowrap">
                                        <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] font-black">
                                            <tr>
                                                <th className="px-6 py-4">Recruiter Name</th>
                                                <th className="px-6 py-4 text-center">Active Jobs</th>
                                                <th className="px-6 py-4 text-center">Zero-Sub Jobs</th>
                                                <th className="px-6 py-4 text-center border-l border-slate-200 bg-slate-100/50">Candidates Submitted <span className="opacity-60 block text-[9px]">({datePreset})</span></th>
                                                <th className="px-6 py-4 text-center border-l border-slate-200 bg-slate-100/50">Hires <span className="opacity-60 block text-[9px]">({datePreset})</span></th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {analytics.tables.recruiters.map((row, i) => (
                                                <tr key={i} className="hover:bg-slate-50/80 transition">
                                                    <td className="px-6 py-4 font-bold text-slate-700">{row.name}</td>
                                                    <td className="px-6 py-4 text-center font-medium">{row.activeJobs}</td>
                                                    <td className="px-6 py-4 text-center font-medium">
                                                        <span className={`px-2 py-1 rounded-md text-xs font-bold ${row.zeroSubJobs > 0 ? 'bg-amber-100 text-amber-700' : 'text-slate-400'}`}>{row.zeroSubJobs}</span>
                                                    </td>
                                                    <td className="px-6 py-4 text-center font-bold border-l border-slate-50 bg-slate-50/30 text-indigo-600">{row.periodSubs}</td>
                                                    <td className="px-6 py-4 text-center font-bold border-l border-slate-50 bg-slate-50/30 text-emerald-600">{row.periodHires}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}

                                {activeTab === 'clients' && (
                                    <table className="w-full text-left text-sm whitespace-nowrap">
                                        <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] font-black">
                                            <tr>
                                                <th className="px-6 py-4">Client Name</th>
                                                <th className="px-6 py-4 text-center">Open Jobs</th>
                                                <th className="px-6 py-4 text-center">Total Cap.</th>
                                                <th className="px-6 py-4 text-center">Utilized Subs</th>
                                                <th className="px-6 py-4 text-center border-l border-slate-200 bg-slate-100/50">Hires <span className="opacity-60 block text-[9px]">({datePreset})</span></th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {analytics.tables.clients.map((row, i) => (
                                                <tr key={i} className="hover:bg-slate-50/80 transition">
                                                    <td className="px-6 py-4 font-bold text-slate-700">{row.name}</td>
                                                    <td className="px-6 py-4 text-center font-medium text-indigo-600">{row.openJobs}</td>
                                                    <td className="px-6 py-4 text-center font-medium text-slate-500">{row.capacity}</td>
                                                    <td className="px-6 py-4 text-center font-medium">
                                                        {row.totalSubs} <span className="text-xs text-slate-400 ml-1">({row.capacity > 0 ? Math.round((row.totalSubs/row.capacity)*100) : 0}%)</span>
                                                    </td>
                                                    <td className="px-6 py-4 text-center font-bold border-l border-slate-50 bg-slate-50/30 text-emerald-600">{row.periodHires}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
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
};

export default ReportsPage;