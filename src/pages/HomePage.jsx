import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../api/apiService';
import { usePermissions } from '../hooks/usePermissions';
import { formatDate } from '../utils/helpers'; 

// --- Inline Icons ---
const BriefcaseIcon = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.03 23.03 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>;
const UserGroupIcon = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>;
const ClockIcon = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const RefreshIcon = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>;
const SearchIcon = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>;
const DotsVertical = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v.01M12 12v.01M12 18v.01" /></svg>;
const SparklesIcon = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09l2.846.813-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" /></svg>;

// --- Helper: Urgency Calculator ---
const getUrgency = (dateInput) => {
    if (!dateInput) return { label: 'No Deadline', bg: 'bg-slate-100', text: 'text-slate-600', dot: 'bg-slate-400', ring: 'ring-slate-200' };
    const deadline = new Date(dateInput);
    const today = new Date();
    const diffTime = deadline - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays <= 1) return { label: 'Critical', bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500', ring: 'ring-red-200' };
    if (diffDays <= 5) return { label: 'Warning', bg: 'bg-orange-50', text: 'text-orange-700', dot: 'bg-orange-500', ring: 'ring-orange-200' };
    return { label: 'Healthy', bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500', ring: 'ring-emerald-200' };
};

// --- Helper: Generate Avatar from Name ---
const getAvatar = (name) => {
    if (!name || name === 'Unassigned') return { initials: '?', color: 'bg-slate-200 text-slate-500' };
    const parts = name.trim().split(' ');
    const initials = parts.length > 1 ? parts + parts[1] : parts.substring(0, 2);
    
    // Generate consistent color based on name string
    const colors = ['bg-indigo-100 text-indigo-700', 'bg-rose-100 text-rose-700', 'bg-amber-100 text-amber-700', 'bg-emerald-100 text-emerald-700', 'bg-cyan-100 text-cyan-700'];
    const colorIndex = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
    
    return { initials: initials.toUpperCase(), color: colors[colorIndex] };
};

// --- Custom Mini SVG Donut Chart ---
const DonutChart = ({ data }) => {
    const total = data.reduce((sum, item) => sum + item.value, 0);
    if (total === 0) return null;
    let currentAngle = 0;

    return (
        <div className="relative flex items-center justify-center group">
            <svg viewBox="0 0 36 36" className="w-16 h-16 transform -rotate-90 transition-transform duration-500 group-hover:scale-110">
                {data.map((item, index) => {
                    const percentage = item.value / total;
                    const strokeDasharray = `${percentage * 100} 100`;
                    const strokeDashoffset = -currentAngle;
                    currentAngle += percentage * 100;
                    return (
                        <circle key={index} cx="18" cy="18" r="15.915" fill="transparent"
                            stroke={item.color} strokeWidth="4.5" strokeDasharray={strokeDasharray} strokeDashoffset={strokeDashoffset}
                            className="transition-all duration-1000 ease-out"
                        />
                    );
                })}
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-[10px] font-bold text-slate-400">{total}</span>
            </div>
        </div>
    );
};

const HomePage = () => {
    const { user } = useAuth();
    const { canViewDashboards, canEditDashboard } = usePermissions();
    
    // Core State
    const [data, setData] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [stats, setStats] = useState({ totalJobs: 0, openJobs: 0 });

    // Feature State
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedJob, setSelectedJob] = useState(null);
    const [jobCandidates, setJobCandidates] = useState([]);
    const [loadingCandidates, setLoadingCandidates] = useState(false);
    
    const [openMenuId, setOpenMenuId] = useState(null);
    const [draggedJob, setDraggedJob] = useState(null);
    const [draggedFromColumn, setDraggedFromColumn] = useState(null);

    const fetchData = useCallback(async () => {
        if (!user?.userIdentifier) return;
        setLoading(true); setError('');
        
        if (!canViewDashboards) {
            setLoading(false);
            setError("You do not have permission to view the home page dashboard.");
            return;
        }

        try {
            const response = await apiService.getHomePageData(user.userIdentifier);
            if (response.data.success) {
                setData(response.data.data);
                const openCount = Object.values(response.data.data).reduce((acc, jobs) => acc + jobs.length, 0);
                setStats({ totalJobs: openCount, openJobs: openCount });
            } else {
                setError(response.data.message);
            }
        } catch (err) {
            setError(err.response?.data?.message || "Failed to fetch dashboard data.");
        } finally {
            setLoading(false);
        }
    }, [user?.userIdentifier, canViewDashboards]);

    useEffect(() => { fetchData(); }, [fetchData]);

    useEffect(() => {
        if (selectedJob) {
            setLoadingCandidates(true);
            apiService.getCandidateDetailsPageData(user.userIdentifier)
                .then(res => {
                    if (res.data.success) {
                        const related = res.data.candidates.filter(c => c.postingId === selectedJob.postingId);
                        setJobCandidates(related);
                    }
                })
                .catch(err => console.error("Failed to load candidates", err))
                .finally(() => setLoadingCandidates(false));
        } else {
            setJobCandidates([]);
        }
    }, [selectedJob, user?.userIdentifier]);

    const filteredData = useMemo(() => {
        if (!searchTerm.trim()) return data;
        const term = searchTerm.toLowerCase();
        const result = {};
        Object.entries(data).forEach(([assignee, jobs]) => {
            const matched = jobs.filter(job => 
                (job.jobTitle && job.jobTitle.toLowerCase().includes(term)) ||
                (job.clientName && job.clientName.toLowerCase().includes(term)) ||
                (job.postingId && job.postingId.toLowerCase().includes(term))
            );
            if (matched.length > 0) result[assignee] = matched;
        });
        return result;
    }, [data, searchTerm]);

    const onDragStart = (job, fromColumn) => {
        if (!canEditDashboard) return;
        setDraggedJob(job);
        setDraggedFromColumn(fromColumn);
    };

    const onDrop = async (toColumn) => {
        if (!draggedJob || draggedFromColumn === toColumn) return;
        const newData = { ...data };
        newData[draggedFromColumn] = newData[draggedFromColumn].filter(j => j.postingId !== draggedJob.postingId);
        if (!newData[toColumn]) newData[toColumn] = [];
        newData[toColumn].push({ ...draggedJob, workingBy: toColumn });
        setData(newData);

        try {
            const updates = [{ rowKey: draggedJob.postingId, changes: { workingBy: toColumn } }];
            await apiService.updateJobPosting(updates, user.userIdentifier);
        } catch (err) {
            console.error("Failed to update job assignee", err);
            fetchData();
        }
        setDraggedJob(null);
        setDraggedFromColumn(null);
    };

    const handleArchive = async (postingId) => {
        if (!window.confirm("Are you sure you want to archive this job?")) return;
        try {
            await apiService.archiveOrDeleteJob([postingId], 'archive', user.userIdentifier);
            fetchData();
        } catch (err) {
            alert("Failed to archive job.");
        }
    };

    const getGreeting = () => {
        const hour = new Date().getHours();
        return hour < 12 ? 'Good Morning' : hour < 18 ? 'Good Afternoon' : 'Good Evening';
    };

    const chartData = useMemo(() => {
        const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
        return Object.entries(data).map(([assignee, jobs], idx) => ({
            name: assignee,
            value: jobs.length,
            color: colors[idx % colors.length]
        })).filter(d => d.value > 0);
    }, [data]);

    return (
        <div className="space-y-8 pb-12 relative font-sans" onClick={() => setOpenMenuId(null)}>
            
            {/* --- Premium Welcome Banner --- */}
            <div className="relative overflow-hidden bg-gradient-to-br from-blue-700 via-indigo-700 to-purple-800 p-8 rounded-3xl shadow-lg mt-6 border border-blue-600/30 group">
                {/* Decorative background glows */}
                <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-white opacity-10 blur-3xl group-hover:scale-110 transition-transform duration-1000"></div>
                <div className="absolute bottom-0 right-1/4 -mb-16 w-48 h-48 rounded-full bg-blue-400 opacity-20 blur-2xl"></div>
                
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <SparklesIcon className="w-5 h-5 text-blue-200" />
                            <p className="text-blue-100 font-medium tracking-wide text-sm uppercase">VMS Dashboard</p>
                        </div>
                        <h1 className="text-3xl font-extrabold text-white tracking-tight">
                            {getGreeting()}, {user?.displayName || 'User'}
                        </h1>
                        <p className="text-blue-100 mt-2 font-medium opacity-90">
                            You have <strong className="text-white bg-white/20 px-2 py-0.5 rounded-md">{stats.openJobs} active jobs</strong> in the pipeline today.
                        </p>
                    </div>
                    
                    <button 
                        onClick={fetchData} 
                        disabled={loading} 
                        className="flex items-center justify-center space-x-2 px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl border border-white/20 backdrop-blur-md transition-all disabled:opacity-50 hover:shadow-lg hover:-translate-y-0.5"
                    >
                        <RefreshIcon className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        <span>Refresh Pipeline</span>
                    </button>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-xl shadow-sm" role="alert">
                    <p className="font-bold">Error Loading Dashboard</p><p>{error}</p>
                </div>
            )}

            {canViewDashboards && !error && (
                <>
                    {/* --- Metrics Grid --- */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-white rounded-3xl p-6 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-slate-100 flex items-center justify-between group transition-all hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.08)]">
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Assignments</p>
                                <span className="text-4xl font-black text-slate-800 mt-2 block tracking-tight">{loading ? '-' : stats.openJobs}</span>
                            </div>
                            {chartData.length > 0 ? (
                                <DonutChart data={chartData} />
                            ) : (
                                <div className="p-4 rounded-2xl bg-blue-50/50 group-hover:bg-blue-50 transition-colors"><BriefcaseIcon className="w-8 h-8 text-blue-500" /></div>
                            )}
                        </div>
                        
                        <div className="bg-white rounded-3xl p-6 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-slate-100 flex items-start justify-between group transition-all hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.08)]">
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Pipeline Health</p>
                                <span className="text-2xl font-extrabold text-emerald-500 mt-3 block tracking-tight">Optimal</span>
                                <p className="mt-1 text-xs font-medium text-slate-400">Based on deadlines</p>
                            </div>
                            <div className="p-3.5 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-500 shadow-sm group-hover:scale-105 transition-transform"><ClockIcon className="w-6 h-6 text-white" /></div>
                        </div>

                        <div className="bg-white rounded-3xl p-6 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-slate-100 flex items-start justify-between group transition-all hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.08)]">
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Candidates</p>
                                <span className="text-2xl font-extrabold text-slate-800 mt-3 block tracking-tight">Tracking</span>
                                <p className="mt-1 text-xs font-medium text-slate-400">View inside job details</p>
                            </div>
                            <div className="p-3.5 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-sm group-hover:scale-105 transition-transform"><UserGroupIcon className="w-6 h-6 text-white" /></div>
                        </div>
                    </div>

                    {/* --- Team Pipeline (Kanban Grid) --- */}
                    <div className="bg-white p-2 rounded-3xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-slate-100">
                        {/* Header Actions */}
                        <div className="px-6 pt-6 pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <h2 className="text-xl font-bold text-slate-800 tracking-tight">Team Workload</h2>
                            <div className="relative w-full md:w-80 group">
                                <SearchIcon className="absolute left-4 top-3 h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                                <input
                                    type="text" placeholder="Search jobs, IDs, or clients..."
                                    value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-11 pr-4 py-2.5 border border-slate-200 rounded-2xl bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white text-sm font-medium transition-all"
                                />
                            </div>
                        </div>

                        {loading ? (
                            <div className="h-64 flex items-center justify-center">
                                <div className="flex flex-col items-center">
                                    <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-3"></div>
                                    <span className="text-slate-400 font-medium">Syncing Pipeline...</span>
                                </div>
                            </div>
                        ) : (
                            <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {Object.entries(filteredData).map(([assignee, jobs]) => {
                                    const avatar = getAvatar(assignee);
                                    return (
                                        <div 
                                            key={assignee} 
                                            className="flex flex-col bg-slate-50/50 rounded-3xl border border-slate-200 h-[650px] w-full overflow-hidden"
                                            onDragOver={e => e.preventDefault()}
                                            onDrop={() => onDrop(assignee)}
                                        >
                                            {/* Column Header */}
                                            <div className="p-5 border-b border-slate-200/60 bg-white/80 backdrop-blur-md sticky top-0 z-10 flex justify-between items-center">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${avatar.color}`}>
                                                        {avatar.initials}
                                                    </div>
                                                    <h3 className="font-bold text-slate-800 truncate pr-2 max-w-[120px]" title={assignee}>{assignee}</h3>
                                                </div>
                                                <span className="bg-slate-100 text-slate-600 text-xs font-extrabold px-2.5 py-1 rounded-lg">{jobs.length}</span>
                                            </div>
                                            
                                            {/* Job Cards */}
                                            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                                                {jobs.map(job => {
                                                    const urgency = getUrgency(job.deadline);
                                                    return (
                                                        <div 
                                                            key={job.postingId} 
                                                            draggable={canEditDashboard}
                                                            onDragStart={() => onDragStart(job, assignee)}
                                                            className={`relative group bg-white p-5 rounded-2xl border border-slate-200 shadow-sm transition-all duration-300 hover:shadow-md hover:border-blue-300 cursor-grab active:cursor-grabbing ${draggedJob?.postingId === job.postingId ? 'opacity-40 scale-95' : ''}`}
                                                        >
                                                            {/* Menu Button */}
                                                            <div className="absolute top-4 right-4 text-left z-20" onClick={e => e.stopPropagation()}>
                                                                <button onClick={() => setOpenMenuId(openMenuId === job.postingId ? null : job.postingId)} className="text-slate-300 hover:text-slate-600 transition-colors p-1 rounded-md hover:bg-slate-50">
                                                                    <DotsVertical className="w-5 h-5" />
                                                                </button>
                                                                {openMenuId === job.postingId && (
                                                                    <div className="origin-top-right absolute right-0 mt-1 w-40 rounded-xl shadow-lg border border-slate-100 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none">
                                                                        <div className="p-1.5">
                                                                            <button onClick={() => setSelectedJob(job)} className="block w-full text-left px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 rounded-lg">View Details</button>
                                                                            <button onClick={() => handleArchive(job.postingId)} className="block w-full text-left px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg mt-1">Archive Job</button>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>

                                                            {/* Card Body */}
                                                            <div onClick={() => { if(openMenuId !== job.postingId) setSelectedJob(job); }}>
                                                                <div className="flex justify-between items-center mb-3 pr-8">
                                                                    <span className="inline-block px-2.5 py-1 rounded-md text-[10px] font-bold bg-blue-50 text-blue-700 tracking-wide">{job.postingId}</span>
                                                                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${urgency.bg} ${urgency.text} flex items-center`}>
                                                                        <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ring-2 ${urgency.ring} ${urgency.dot}`}></span>
                                                                        {urgency.label}
                                                                    </span>
                                                                </div>
                                                                
                                                                <h4 className="text-sm font-extrabold text-slate-800 leading-snug mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors group-hover:translate-x-1 transform duration-300">
                                                                    {job.jobTitle}
                                                                </h4>
                                                                
                                                                <div className="flex items-center text-xs font-medium text-slate-500 mb-4 bg-slate-50 p-2 rounded-lg">
                                                                    <BriefcaseIcon className="w-4 h-4 mr-2 text-slate-400" />
                                                                    <span className="truncate">{job.clientName}</span>
                                                                </div>

                                                                <div className="pt-3 border-t border-slate-100 flex justify-between items-center">
                                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Deadline</span>
                                                                    <span className="text-xs font-bold text-slate-700">{formatDate(job.deadline)}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                                {jobs.length === 0 && (
                                                    <div className="h-full flex flex-col items-center justify-center text-center opacity-50 p-6 border-2 border-dashed border-slate-200 rounded-2xl">
                                                        <SparklesIcon className="w-8 h-8 text-slate-400 mb-2" />
                                                        <p className="text-sm font-medium text-slate-500">Drop jobs here</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </>
            )}

            {/* --- Premium Glassmorphism Drawer --- */}
            {selectedJob && (
                <div className="fixed inset-0 z-[60] overflow-hidden">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={() => setSelectedJob(null)}></div>
                    <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
                        <div className="pointer-events-auto w-screen max-w-lg transform transition-transform duration-500 ease-in-out bg-white shadow-2xl flex flex-col border-l border-white/20">
                            
                            <div className="bg-gradient-to-br from-slate-900 to-slate-800 px-8 py-8 relative overflow-hidden">
                                <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 rounded-full bg-blue-500 opacity-20 blur-2xl"></div>
                                
                                <div className="flex items-center justify-between relative z-10">
                                    <h2 className="text-sm font-bold tracking-widest uppercase text-slate-400">Job Workspace</h2>
                                    <button onClick={() => setSelectedJob(null)} className="text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-full p-2 transition-all">
                                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                                    </button>
                                </div>
                                <div className="mt-6 flex flex-wrap items-center gap-3 relative z-10">
                                    <span className="bg-blue-500/20 text-blue-300 font-bold px-3 py-1 rounded-lg text-xs border border-blue-500/30">{selectedJob.postingId}</span>
                                    <span className="text-slate-300 font-medium text-sm flex items-center gap-1.5"><BriefcaseIcon className="w-4 h-4"/> {selectedJob.clientName}</span>
                                </div>
                                <h3 className="text-3xl font-black text-white mt-4 leading-tight relative z-10">{selectedJob.jobTitle}</h3>
                            </div>

                            <div className="flex-1 overflow-y-auto p-8 bg-slate-50/50">
                                <div className="grid grid-cols-2 gap-4 mb-8">
                                    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                                        <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-1.5">Assignee</p>
                                        <div className="flex items-center gap-2">
                                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${getAvatar(selectedJob.workingBy).color}`}>
                                                {getAvatar(selectedJob.workingBy).initials}
                                            </div>
                                            <p className="font-bold text-slate-800 text-sm">{selectedJob.workingBy || 'Unassigned'}</p>
                                        </div>
                                    </div>
                                    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                                        <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-1.5">Deadline</p>
                                        <p className="font-bold text-slate-800 text-sm">{formatDate(selectedJob.deadline)}</p>
                                    </div>
                                </div>

                                <div className="border-t border-slate-200/60 pt-8">
                                    <div className="flex items-center justify-between mb-6">
                                        <h4 className="text-lg font-extrabold text-slate-800">Submitted Candidates</h4>
                                        <span className="bg-slate-200 text-slate-700 font-bold px-3 py-1 rounded-lg text-xs">
                                            {jobCandidates.length}
                                        </span>
                                    </div>

                                    {loadingCandidates ? (
                                        <div className="animate-pulse space-y-4">
                                            {[1, 2].map(i => <div key={i} className="h-20 bg-slate-200/50 rounded-2xl"></div>)}
                                        </div>
                                    ) : jobCandidates.length > 0 ? (
                                        <div className="space-y-4">
                                            {jobCandidates.map(candidate => (
                                                <div key={candidate.email} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] flex items-start gap-4 hover:shadow-md transition-shadow">
                                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center text-blue-700 font-black text-lg flex-shrink-0 border border-blue-200/50">
                                                        {candidate.firstName?.charAt(0)}{candidate.lastName?.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <h5 className="font-extrabold text-slate-800 text-sm">{candidate.firstName} {candidate.lastName}</h5>
                                                        <p className="text-xs text-slate-500 font-medium mb-2.5 mt-0.5">{candidate.currentRole || 'Candidate'}</p>
                                                        <div className="flex flex-wrap items-center gap-2 text-[10px] font-bold">
                                                            <span className="bg-slate-100 px-2 py-1 rounded-md text-slate-600">{candidate.currentLocation || 'Location N/A'}</span>
                                                            <span className={`px-2 py-1 rounded-md ${candidate.remarks === 'Rejected' ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
                                                                {candidate.remarks || 'Under Review'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-12 bg-white rounded-3xl border border-dashed border-slate-200">
                                            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
                                                <UserGroupIcon className="w-8 h-8 text-slate-300" />
                                            </div>
                                            <p className="text-slate-500 font-medium text-sm">No candidates submitted yet.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default HomePage;