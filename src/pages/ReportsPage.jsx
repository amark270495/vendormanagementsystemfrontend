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

const BriefcaseIcon = ({className}) => <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 0 0 .75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 0 0-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0 1 12 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 0 1-.673-.38m0 0A2.18 2.18 0 0 1 3 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 0 1 3.413-.387m7.5 0V5.25A2.25 2.25 0 0 0 13.5 3h-3a2.25 2.25 0 0 0-2.25 2.25v.894m7.5 0a48.667 48.667 0 0 0-7.5 0M12 12.75h.008v.008H12v-.008Z" /></svg>;
const UserCheckIcon = ({className}) => <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" /></svg>;
const ClockIcon = ({className}) => <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>;
const LocationIcon = ({className}) => <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" /></svg>;
const ChartPieIcon = ({className}) => <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6a7.5 7.5 0 1 0 7.5 7.5h-7.5V6Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5H21A7.5 7.5 0 0 0 13.5 3v7.5Z" /></svg>;
const InboxIcon = ({className}) => <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" /></svg>;
const EyeIcon = ({className}) => <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /></svg>;
const ClipboardIcon = ({className}) => <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 15.75h3.75M18 9.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-10.5A2.25 2.25 0 0 1 3 20.25V9.75m15 0a2.25 2.25 0 0 0-2.25-2.25h-1.372c-.516-.962-1.51-1.625-2.628-1.625H9.75c-1.118 0-2.112.663-2.628 1.625H5.75A2.25 2.25 0 0 0 3.5 9.75m15 0V18a2.25 2.25 0 0 1-2.25 2.25h-10.5A2.25 2.25 0 0 1 3 18v-8.25" /></svg>;

const Spinner = ({ size = '6' }) => <div className="flex justify-center items-center"><div className={`w-${size} h-${size} border-4 border-t-transparent border-indigo-600 rounded-full animate-spin`}></div></div>;

// ============================================================================
// UTILITIES
// ============================================================================
const DASHBOARD_CONFIGS = {
    'all': 'All VMS Sources', 'ecaltVMSDisplay': 'Eclat VMS', 'taprootVMSDisplay': 'Taproot VMS',
    'michiganDisplay': 'Michigan VMS', 'EclatTexasDisplay': 'Eclat Texas', 'TaprootTexasDisplay': 'Taproot Texas',
    'VirtusaDisplay': 'Virtusa', 'DeloitteDisplay': 'Deloitte', 'tsiBdmDisplay': 'TSI - BDM', 'tsiBdrDisplay': 'TSI - BDR'
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
        { stage: 'Submitted', count: submitted, rateOverall: 100 },
        { stage: 'Under Review', count: underReview, rateOverall: safeDiv(underReview, submitted)*100 },
        { stage: 'Shortlisted', count: shortlisted, rateOverall: safeDiv(shortlisted, submitted)*100 },
        { stage: 'Interview', count: interview, rateOverall: safeDiv(interview, submitted)*100 },
        { stage: 'Selected', count: selected, rateOverall: safeDiv(selected, submitted)*100 }
    ];
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

// ============================================================================
// CUSTOM HOOK
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
// UI COMPONENTS 
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
    <div className="bg-white border border-slate-200 shadow-sm p-4 flex items-center gap-4 relative overflow-hidden h-full">
        <div className="bg-blue-600 text-white rounded-full p-2.5 z-10 flex-shrink-0">
            <Icon className="w-5 h-5" />
        </div>
        <div className="z-10 flex flex-col justify-center">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none mb-1">{title}</div>
            <div className="text-2xl font-black text-slate-800 leading-none">{value}</div>
            {subtext && <div className="text-[9px] text-slate-400 font-bold mt-1.5">{subtext}</div>}
        </div>
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
            const pct = Math.max(s.rateOverall || 0, 2); 
            return (
                <div key={s.stage} className="flex items-center gap-4 w-full">
                    <div className="w-1/3 text-right text-xs font-medium text-slate-600 truncate">{s.stage}</div>
                    <div className="w-2/3 flex items-center">
                        <div className="bg-blue-600 h-7 flex items-center justify-center text-white text-[10px] font-bold transition-all duration-500 rounded-sm shadow-sm" style={{ width: `${pct}%` }}>
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
    const submitted = funnel['Submitted'] || 0;
    const review = funnel['Under Review'] || 0;
    const shortlist = funnel['Shortlisted'] || 0;
    const interview = funnel['Interview'] || 0;
    
    const total = submitted + review + shortlist + interview;
    
    if (total === 0) return <div className="text-xs text-slate-400 text-center py-8">No candidates currently in active pipeline.</div>;

    const pSub = (submitted / total) * 100;
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
                {submitted > 0 && <div style={{width: `${pSub}%`}} className="bg-slate-400 text-white flex flex-col items-center justify-center text-[10px] font-bold"><span>{submitted}</span></div>}
                {review > 0 && <div style={{width: `${pReview}%`}} className="bg-indigo-500 text-white flex flex-col items-center justify-center text-[10px] font-bold"><span>{review}</span></div>}
                {shortlist > 0 && <div style={{width: `${pShortlist}%`}} className="bg-blue-500 text-white flex flex-col items-center justify-center text-[10px] font-bold"><span>{shortlist}</span></div>}
                {interview > 0 && <div style={{width: `${pInterview}%`}} className="bg-emerald-500 text-white flex flex-col items-center justify-center text-[10px] font-bold"><span>{interview}</span></div>}
            </div>
            <div className="flex justify-between text-[10px] text-slate-500 mt-2 font-medium px-1">
                {submitted > 0 && <div style={{width: `${pSub}%`}} className="text-center truncate pr-1">Submitted</div>}
                {review > 0 && <div style={{width: `${pReview}%`}} className="text-center truncate pr-1">Review</div>}
                {shortlist > 0 && <div style={{width: `${pShortlist}%`}} className="text-center truncate pr-1">Shortlist</div>}
                {interview > 0 && <div style={{width: `${pInterview}%`}} className="text-center truncate">Interview</div>}
            </div>
        </div>
    );
};

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
            <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-md border border-slate-100">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-lg font-bold text-slate-800 tracking-tight">Email Job Report</h2>
                    <button onClick={onClose} disabled={isSending} className="text-slate-400 hover:text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-full p-2 transition text-lg leading-none">&times;</button>
                </div>
                {error && <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl mb-5 text-sm font-medium">{error}</div>}
                {successMessage && <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl mb-5 text-sm font-medium">{successMessage}</div>}

                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">To (comma-separated)</label>
                        <input type="text" value={toEmails} onChange={e => setToEmails(e.target.value)} className="block w-full border border-slate-200 bg-slate-50 rounded-md px-3 py-2 text-sm outline-none focus:border-blue-500" required />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">CC (comma-separated)</label>
                        <input type="text" value={ccEmails} onChange={e => setCcEmails(e.target.value)} className="block w-full border border-slate-200 bg-slate-50 rounded-md px-3 py-2 text-sm outline-none focus:border-blue-500" />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Job Status Filter</label>
                        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="block w-full border border-slate-200 bg-slate-50 rounded-md px-3 py-2 text-sm outline-none focus:border-blue-500">
                            <option value="all">Include All Statuses</option>
                            <option value="Open">Only Open Jobs</option>
                            <option value="Closed">Only Closed Jobs</option>
                        </select>
                    </div>
                </div>

                <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-slate-100">
                    <button onClick={onClose} disabled={isSending} className="px-4 py-2 bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-md hover:bg-slate-50">Cancel</button>
                    <button onClick={handleSendEmail} disabled={isSending} className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-md hover:bg-blue-700 w-28 flex justify-center items-center shadow-sm">
                        {isSending ? <Spinner size="4" /> : 'Send Email'}
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
    const [datePreset, setDatePreset] = useState('ALL');
    const [activeTab, setActiveTab] = useState('recruiters'); 
    const [isEmailModalOpen, setEmailModalOpen] = useState(false);

    const [filters, setFilters] = useState({ 
        startDate: '', 
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
        if (preset === 'ALL') start = '';
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

    const funnelStages = analytics ? calculateFunnel(analytics.funnel, analytics.period_kpis.newCandidates) : [];
    
    // STRICT ZERO-DATA ELIMINATION
    const activeRecruiters = analytics?.tables?.recruiters?.filter(r => 
        r.activeJobs > 0 || r.zeroSubJobs > 0 || r.periodSubs > 0 || r.periodInterviews > 0 || r.periodHires > 0 || r.periodRejected > 0
    ) || [];
    
    const activeClients = analytics?.tables?.clients?.filter(c => 
        c.openJobs > 0 || c.newJobs > 0 || c.periodSubs > 0 || c.periodHires > 0
    ) || [];

    const activeSources = analytics?.sources?.filter(s => 
        s.name && s.name !== "Unknown" && s.name !== "Need To Update" && s.name !== "N/A" && 
        (s.submitted > 0 || s.interviews > 0 || s.selected > 0 || s.rejected > 0)
    ) || [];

    const sourceTableData = activeSources.slice(0, 5).map(s => [
        s.name, s.selected, safeDiv(s.selected, s.submitted)*100
    ]);
    
    const rejectionTableData = analytics?.rejections?.labels?.map((label, idx) => [
        decodeHtml(label), analytics.rejections.values[idx], safeDiv(analytics.rejections.values[idx], analytics.rejections.values.reduce((a,b)=>a+b,0))*100
    ]).slice(0, 5) || [];

    return (
        <div className="p-4 md:p-6 bg-[#f3f4f6] min-h-screen font-sans text-slate-800">
            <div className="max-w-[1500px] mx-auto space-y-4">
                
                {/* PAGE HEADER */}
                <div className="text-center mb-6">
                    <h1 className="text-2xl md:text-3xl font-medium text-slate-800 tracking-tight">Staffing Dashboard with Recruitment Funnel and Sources of Applications</h1>
                </div>
                
                {/* FILTER BAR & EXPORT */}
                <div className="bg-white p-3 border border-slate-200 shadow-sm flex flex-wrap gap-4 items-center justify-between">
                    <div className="flex flex-wrap items-center gap-3">
                        <select value={filters.sheetKey} onChange={e => setFilters(p => ({...p, sheetKey: e.target.value}))} className="bg-white border border-slate-300 px-3 py-1.5 text-xs text-slate-700 outline-none w-40 disabled:opacity-50" disabled={loading}>
                            {Object.entries(DASHBOARD_CONFIGS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                        </select>
                        <div className="flex border border-slate-300">
                            {['7D', '30D', '90D', '6M', '12M', 'YTD', 'ALL'].map(p => (
                                <button key={p} onClick={() => handlePresetChange(p)} disabled={loading} className={`px-3 py-1.5 text-xs transition-colors disabled:opacity-50 border-r last:border-r-0 border-slate-300 ${datePreset === p ? 'bg-slate-200 font-bold text-slate-800' : 'bg-white text-slate-600 hover:bg-slate-50'}`}>{p}</button>
                            ))}
                        </div>
                        {datePreset === 'Custom' && (
                            <div className="flex items-center gap-2 text-xs ml-2">
                                <input type="date" value={filters.startDate} onChange={e => setFilters(p => ({...p, startDate: e.target.value}))} className="bg-white border border-slate-300 px-2 py-1 outline-none" />
                                <span className="text-slate-400 font-bold">-</span>
                                <input type="date" value={filters.endDate} onChange={e => setFilters(p => ({...p, endDate: e.target.value}))} className="bg-white border border-slate-300 px-2 py-1 outline-none" />
                            </div>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-400 mr-2">Updated: {analytics?.meta?.generatedAt ? new Date(analytics.meta.generatedAt).toLocaleString() : 'N/A'}</span>
                        <button onClick={fetchAnalytics} disabled={loading} className="px-3 py-1.5 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 transition text-xs flex items-center gap-1">
                            <RefreshIcon className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
                        </button>
                        <button onClick={() => {
                            if (!analytics) return;
                            const blob = new Blob([JSON.stringify(analytics, null, 2)], {type: 'application/json'});
                            const a = document.createElement('a'); a.href = URL.createObjectURL(blob); 
                            a.download = `VMS_Analytics_Extract_${new Date().toISOString().split('T')[0]}.json`; a.click();
                        }} disabled={!analytics || loading} className="px-3 py-1.5 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 transition text-xs flex items-center gap-1 disabled:opacity-50">
                            <DownloadIcon className="w-3.5 h-3.5" /> JSON Export
                        </button>
                        {canEmailReports && (
                            <button onClick={() => setEmailModalOpen(true)} disabled={loading || !analytics} className="px-3 py-1.5 bg-emerald-500 border border-emerald-600 text-white font-bold hover:bg-emerald-600 transition text-xs flex items-center gap-1 disabled:opacity-50">
                                <EmailIcon className="w-3.5 h-3.5" /> Email
                            </button>
                        )}
                    </div>
                </div>

                {error && <div className="bg-rose-50 border border-rose-300 p-3 text-rose-700 text-xs font-bold">{error}</div>}
                {loading && !analytics && <div className="h-64 flex justify-center items-center"><Spinner size="10" /></div>}

                {analytics && !loading && (
                    <div className="space-y-4 animate-fade-in-up">
                        
                        {/* KPI BANNER ROW */}
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
                            <KpiCard icon={LocationIcon} title="Open Positions" value={formatMetric(analytics.live_kpis.openJobs)} subtext="Live Available" />
                            <KpiCard icon={BriefcaseIcon} title="New Jobs" value={formatMetric(analytics.period_kpis.newJobs)} subtext="Created in Period" />
                            <KpiCard icon={InboxIcon} title="Submitted" value={formatMetric(analytics.period_kpis.newCandidates)} subtext="Total Applications" />
                            <KpiCard icon={EyeIcon} title="Under Review" value={formatMetric(funnelStages.find(s=>s.stage==='Under Review')?.count)} subtext="Active Screening" />
                            <KpiCard icon={ClipboardIcon} title="Shortlisted" value={formatMetric(funnelStages.find(s=>s.stage==='Shortlisted')?.count)} subtext="Passed Screening" />
                            <KpiCard icon={ClockIcon} title="Interviews" value={formatMetric(funnelStages.find(s=>s.stage==='Interview')?.count)} subtext="In Progress" />
                            <KpiCard icon={UserCheckIcon} title="Selected" value={formatMetric(analytics.period_kpis.periodHires)} subtext="Candidates Hired" />
                            <KpiCard icon={ChartPieIcon} title="Sub. Util" value={formatMetric(analytics.live_kpis.utilization, true)} subtext="Live Capacity" />
                        </div>

                        {/* ROW 1: VELOCITY, EFFICIENCY, FUNNEL */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                            <DashboardCard title={`Velocity Metrics (${datePreset})`} className="h-[280px]">
                                <div className="relative flex-grow mt-2">
                                    <ChartComponent type="line" options={{ plugins: { legend: { display: true, position: 'top', labels: {boxWidth: 10, font:{size:10}} } }, elements: {line: {tension: 0.3}} }} data={{
                                        labels: analytics.trends.labels,
                                        datasets: [
                                            { label: 'Jobs Created', data: analytics.trends.jobs, borderColor: '#ef4444', backgroundColor: 'rgba(239, 68, 68, 0.1)', fill: true },
                                            { label: 'Candidates Sub.', data: analytics.trends.candidates, borderColor: '#22c55e', borderDash: [5,5] }
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

                        {/* ROW 2: DEMAND & AGING */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            <DashboardCard title="Client Demand (New Jobs)" className="h-[280px]">
                                <div className="relative flex-grow">
                                    <ChartComponent type="bar" options={{ indexAxis: 'y' }} data={getChartData(analytics.jobs.byClient, 'Jobs', '#3b82f6', true)} />
                                </div>
                            </DashboardCard>
                            <DashboardCard title="Active Job Aging Distribution" className="h-[280px]">
                                <div className="relative flex-grow">
                                    <ChartComponent type="bar" data={getChartData(analytics.jobs.aging, 'Jobs', '#f59e0b')} />
                                </div>
                            </DashboardCard>
                        </div>
                        
                        {/* ROW 3: SKILLS, SOURCES, REJECTIONS */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                            <DashboardCard title="Top Required Skills (Jobs)" className="h-[240px]">
                                <div className="relative flex-grow">
                                    <ChartComponent type="bar" options={{ indexAxis: 'y' }} data={getChartData(analytics.skills.jobsRequiring, 'Mentions', '#8b5cf6', true)} />
                                </div>
                            </DashboardCard>
                            <DashboardCard title="Application Sources" className="h-[240px]">
                                <InlineBarTable columns={["Source", "# Hired", "Conv Rate"]} data={sourceTableData} barColumnIndex={2} colorClass="bg-emerald-500" />
                            </DashboardCard>
                            <DashboardCard title="Decline Reasons" className="h-[240px]">
                                <InlineBarTable columns={["Reason", "# APPS", "% of APPS"]} data={rejectionTableData} barColumnIndex={2} colorClass="bg-rose-600" />
                            </DashboardCard>
                        </div>

                        {/* ROW 4: PIPELINE & ALERTS */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                            <DashboardCard title="Active Pipeline" className="h-[250px] lg:col-span-2">
                                <StackedPipeline funnel={analytics.funnel} />
                            </DashboardCard>
                            <DashboardCard title="Alerts & Comments" className="h-[250px]">
                                <div className="space-y-3 overflow-y-auto max-h-[100px] pr-2">
                                    {!analytics.alerts?.length && <div className="text-xs text-slate-500">No active alerts. System healthy.</div>}
                                    {analytics.alerts?.map((a, i) => (
                                        <div key={i} className="flex items-start gap-2">
                                            <AlertIcon severity={a.severity} className={`w-4 h-4 shrink-0 mt-0.5 ${a.severity === 'critical' ? 'text-rose-500' : 'text-amber-500'}`} />
                                            <div>
                                                <div className="text-xs font-bold text-slate-700">{a.title} ({a.count})</div>
                                                <div className="text-[10px] text-slate-500">{a.description}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </DashboardCard>
                        </div>

                        {/* DETAILED TABLES */}
                        <DashboardCard title="Performance Data Explorer" className="mt-4">
                            <div className="flex border-b border-slate-200 mb-4">
                                <button onClick={() => setActiveTab('recruiters')} className={`px-4 py-2 text-xs font-bold border-b-2 ${activeTab==='recruiters'?'border-blue-600 text-blue-600':'border-transparent text-slate-500'}`}>Recruiters</button>
                                <button onClick={() => setActiveTab('clients')} className={`px-4 py-2 text-xs font-bold border-b-2 ${activeTab==='clients'?'border-blue-600 text-blue-600':'border-transparent text-slate-500'}`}>Clients</button>
                            </div>
                            <div className="overflow-x-auto max-h-[300px]">
                                <table className="w-full text-left text-xs whitespace-nowrap">
                                    <thead className="bg-slate-50 text-slate-600 uppercase font-bold sticky top-0 border-y border-slate-200 z-10 shadow-sm">
                                        <tr>
                                            <th className="px-4 py-2">Name</th>
                                            {activeTab==='recruiters' && <><th className="px-4 py-2 text-center">Active Jobs</th><th className="px-4 py-2 text-center">Zero-Sub</th></>}
                                            {activeTab==='clients' && <><th className="px-4 py-2 text-center">Open Jobs</th><th className="px-4 py-2 text-center">New Jobs</th></>}
                                            <th className="px-4 py-2 text-center">Submitted</th>
                                            <th className="px-4 py-2 text-center">Interviews</th>
                                            <th className="px-4 py-2 text-center text-emerald-600">Selected</th>
                                            <th className="px-4 py-2 text-center text-rose-600">Rejected</th>
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

            <EmailReportModal 
                isOpen={isEmailModalOpen} 
                onClose={() => setEmailModalOpen(false)} 
                sheetKey={filters.sheetKey}
                authenticatedUsername={user?.userIdentifier}
            />
        </div>
    );
}