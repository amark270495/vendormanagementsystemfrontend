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

// --- Helper: Urgency Calculator ---
const getUrgency = (dateInput) => {
    if (!dateInput) return { label: 'No Deadline', color: 'bg-slate-100 text-slate-600', dot: 'bg-slate-400' };
    const deadline = new Date(dateInput);
    const today = new Date();
    const diffTime = deadline - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays <= 1) return { label: 'Critical', color: 'bg-red-100 text-red-700 border-red-200', dot: 'bg-red-500' };
    if (diffDays <= 5) return { label: 'Warning', color: 'bg-orange-100 text-orange-700 border-orange-200', dot: 'bg-orange-500' };
    return { label: 'Healthy', color: 'bg-emerald-100 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' };
};

// --- Custom Mini SVG Donut Chart ---
const DonutChart = ({ data }) => {
    const total = data.reduce((sum, item) => sum + item.value, 0);
    if (total === 0) return null;
    let currentAngle = 0;

    return (
        <svg viewBox="0 0 36 36" className="w-16 h-16 transform -rotate-90">
            {data.map((item, index) => {
                const percentage = item.value / total;
                const strokeDasharray = `${percentage * 100} 100`;
                const strokeDashoffset = -currentAngle;
                currentAngle += percentage * 100;
                return (
                    <circle key={index} cx="18" cy="18" r="15.91549430918954" fill="transparent"
                        stroke={item.color} strokeWidth="4" strokeDasharray={strokeDasharray} strokeDashoffset={strokeDashoffset}
                    />
                );
            })}
        </svg>
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
    
    // Quick Actions Menu
    const [openMenuId, setOpenMenuId] = useState(null);

    // Drag & Drop State
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

    // Drawer Fetch Logic
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

    // --- Search & Filter Logic ---
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

    // --- Drag and Drop Handlers ---
    const onDragStart = (job, fromColumn) => {
        if (!canEditDashboard) return;
        setDraggedJob(job);
        setDraggedFromColumn(fromColumn);
    };

    const onDragOver = (e) => { e.preventDefault(); };

    const onDrop = async (toColumn) => {
        if (!draggedJob || draggedFromColumn === toColumn) return;

        // Optimistic UI Update
        const newData = { ...data };
        newData[draggedFromColumn] = newData[draggedFromColumn].filter(j => j.postingId !== draggedJob.postingId);
        if (!newData[toColumn]) newData[toColumn] = [];
        newData[toColumn].push({ ...draggedJob, workingBy: toColumn });
        setData(newData);

        // API Call
        try {
            const updates = [{ rowKey: draggedJob.postingId, changes: { workingBy: toColumn } }];
            await apiService.updateJobPosting(updates, user.userIdentifier);
        } catch (err) {
            console.error("Failed to update job assignee", err);
            fetchData(); // Revert on failure
        }
        setDraggedJob(null);
        setDraggedFromColumn(null);
    };

    // --- Quick Actions ---
    const handleArchive = async (postingId) => {
        if (!window.confirm("Are you sure you want to archive this job?")) return;
        try {
            await apiService.archiveOrDeleteJob([postingId], 'archive', user.userIdentifier);
            fetchData();
        } catch (err) {
            alert("Failed to archive job.");
        }
    };

    const currentDate = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const getGreeting = () => {
        const hour = new Date().getHours();
        return hour < 12 ? 'Good Morning' : hour < 18 ? 'Good Afternoon' : 'Good Evening';
    };

    // --- Chart Data Processing ---
    const chartData = useMemo(() => {
        const colors = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
        return Object.entries(data).map(([assignee, jobs], idx) => ({
            name: assignee,
            value: jobs.length,
            color: colors[idx % colors.length]
        })).filter(d => d.value > 0);
    }, [data]);

    return (
        <div className="space-y-8 pb-12 relative" onClick={() => setOpenMenuId(null)}>
            
            {/* --- Page Header Section --- */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200 mt-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">
                        {getGreeting()}, <span className="text-blue-600">{user?.displayName || 'User'}</span>
                    </h1>
                    <p className="text-slate-500 mt-1 text-sm">{currentDate}</p>
                </div>
                
                <button onClick={fetchData} disabled={loading} className="flex items-center justify-center space-x-2 px-5 py-2.5 bg-blue-50 text-blue-700 font-semibold rounded-xl hover:bg-blue-100 transition-colors disabled:opacity-50">
                    <RefreshIcon className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    <span className="hidden sm:inline">Refresh Dashboard</span>
                </button>
            </div>

            {error && (
                <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-lg shadow-sm" role="alert">
                    <p className="font-bold">Error Loading Dashboard</p><p>{error}</p>
                </div>
            )}

            {canViewDashboards && !error && (
                <>
                    {/* --- Metrics Grid --- */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex items-center justify-between transition-all hover:-translate-y-1 hover:shadow-md">
                            <div>
                                <p className="text-sm font-bold text-slate-500 uppercase tracking-wide">Active Jobs</p>
                                <span className="text-4xl font-extrabold text-slate-900 mt-1 block">{loading ? '-' : stats.openJobs}</span>
                            </div>
                            {chartData.length > 0 ? (
                                <div className="flex flex-col items-center">
                                    <DonutChart data={chartData} />
                                    <span className="text-[10px] text-slate-400 font-medium mt-1">Distribution</span>
                                </div>
                            ) : (
                                <div className="p-4 rounded-full bg-blue-50"><BriefcaseIcon className="w-8 h-8 text-blue-500" /></div>
                            )}
                        </div>
                        
                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex items-start justify-between">
                            <div>
                                <p className="text-sm font-bold text-slate-500 uppercase tracking-wide">Pipeline Health</p>
                                <span className="text-3xl font-extrabold text-emerald-600 mt-2 block">Optimal</span>
                                <p className="mt-1 text-xs text-slate-400">Based on deadline tracking</p>
                            </div>
                            <div className="p-3 rounded-xl bg-emerald-500"><ClockIcon className="w-6 h-6 text-white" /></div>
                        </div>

                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex items-start justify-between">
                            <div>
                                <p className="text-sm font-bold text-slate-500 uppercase tracking-wide">Total Candidates</p>
                                <span className="text-3xl font-extrabold text-slate-900 mt-2 block">Tracking</span>
                                <p className="mt-1 text-xs text-slate-400">Click a job to view candidates</p>
                            </div>
                            <div className="p-3 rounded-xl bg-blue-500"><UserGroupIcon className="w-6 h-6 text-white" /></div>
                        </div>
                    </div>

                    {/* --- Team Pipeline (Kanban) --- */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
                            <h2 className="text-xl font-extrabold text-slate-800">Team Pipeline</h2>
                            <div className="relative w-full md:w-72">
                                <SearchIcon className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                                <input
                                    type="text" placeholder="Search by ID, Title, Client..."
                                    value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-sm"
                                />
                            </div>
                        </div>

                        {loading ? (
                            <div className="h-64 flex items-center justify-center animate-pulse"><div className="text-slate-400 font-medium">Loading Pipeline...</div></div>
                        ) : (
                            <div className="flex overflow-x-auto pb-4 gap-6 custom-scrollbar snap-x">
                                {Object.entries(filteredData).map(([assignee, jobs]) => (
                                    <div 
                                        key={assignee} 
                                        className="snap-start min-w-[320px] flex-shrink-0 flex flex-col bg-slate-50 rounded-2xl border border-slate-200 h-[600px] shadow-inner"
                                        onDragOver={onDragOver}
                                        onDrop={() => onDrop(assignee)}
                                    >
                                        <div className="p-4 border-b border-slate-200 bg-white rounded-t-2xl sticky top-0 z-10 flex justify-between items-center shadow-sm">
                                            <h3 className="font-bold text-slate-800 truncate pr-2">{assignee}</h3>
                                            <span className="bg-slate-100 text-slate-600 text-xs font-bold px-2 py-1 rounded-md">{jobs.length}</span>
                                        </div>
                                        
                                        <div className="flex-1 overflow-y-auto p-3 space-y-3">
                                            {jobs.map(job => {
                                                const urgency = getUrgency(job.deadline);
                                                return (
                                                    <div 
                                                        key={job.postingId} 
                                                        draggable={canEditDashboard}
                                                        onDragStart={() => onDragStart(job, assignee)}
                                                        className={`relative bg-white p-4 rounded-xl border border-slate-200 shadow-sm transition-all hover:shadow-md hover:border-blue-300 cursor-grab active:cursor-grabbing ${draggedJob?.postingId === job.postingId ? 'opacity-50' : ''}`}
                                                    >
                                                        {/* Quick Actions Dropdown */}
                                                        <div className="absolute top-3 right-3 text-left" onClick={e => e.stopPropagation()}>
                                                            <button onClick={() => setOpenMenuId(openMenuId === job.postingId ? null : job.postingId)} className="text-slate-400 hover:text-slate-700">
                                                                <DotsVertical className="w-5 h-5" />
                                                            </button>
                                                            {openMenuId === job.postingId && (
                                                                <div className="origin-top-right absolute right-0 mt-2 w-36 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-20">
                                                                    <div className="py-1">
                                                                        <button onClick={() => setSelectedJob(job)} className="block w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100">View Details</button>
                                                                        <button onClick={() => handleArchive(job.postingId)} className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50">Archive Job</button>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* Card Content */}
                                                        <div onClick={() => { if(openMenuId !== job.postingId) setSelectedJob(job); }}>
                                                            <div className="flex justify-between items-center mb-2 pr-6">
                                                                <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700">{job.postingId}</span>
                                                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${urgency.color} flex items-center`}>
                                                                    <span className={`w-1.5 h-1.5 rounded-full mr-1 ${urgency.dot}`}></span>
                                                                    {urgency.label}
                                                                </span>
                                                            </div>
                                                            
                                                            <h4 className="text-sm font-bold text-slate-800 leading-snug mb-1 line-clamp-2">{job.jobTitle}</h4>
                                                            
                                                            <div className="flex items-center text-xs text-slate-500 mb-3">
                                                                <BriefcaseIcon className="w-3 h-3 mr-1" />
                                                                <span className="truncate">{job.clientName}</span>
                                                            </div>

                                                            <div className="pt-3 border-t border-slate-50 flex justify-between items-center">
                                                                <span className="text-[10px] font-medium text-slate-400">Deadline</span>
                                                                <span className="text-xs font-semibold text-slate-700">{formatDate(job.deadline)}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </>
            )}

            {/* --- Enhanced Slide-out Drawer (Job & Candidates) --- */}
            {selectedJob && (
                <div className="fixed inset-0 z-50 overflow-hidden">
                    <div className="absolute inset-0 bg-slate-900 bg-opacity-40 backdrop-blur-sm transition-opacity" onClick={() => setSelectedJob(null)}></div>
                    <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
                        <div className="pointer-events-auto w-screen max-w-lg transform transition-transform duration-500 ease-in-out bg-white shadow-2xl flex flex-col">
                            
                            {/* Drawer Header */}
                            <div className="bg-gradient-to-r from-blue-600 to-blue-800 px-6 py-6">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-xl font-bold text-white">Job Workspace</h2>
                                    <button onClick={() => setSelectedJob(null)} className="text-blue-200 hover:text-white bg-blue-500 bg-opacity-20 rounded-full p-1 transition-colors">
                                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                                    </button>
                                </div>
                                <div className="mt-4 text-blue-100 text-sm font-medium flex items-center gap-2">
                                    <span className="bg-blue-900 bg-opacity-50 px-2 py-1 rounded">{selectedJob.postingId}</span>
                                    <span>•</span>
                                    <span>{selectedJob.clientName}</span>
                                </div>
                                <h3 className="text-2xl font-extrabold text-white mt-2 leading-tight">{selectedJob.jobTitle}</h3>
                            </div>

                            {/* Drawer Body */}
                            <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
                                
                                {/* Info Cards */}
                                <div className="grid grid-cols-2 gap-4 mb-8">
                                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                                        <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">Assignee</p>
                                        <p className="font-bold text-slate-900">{selectedJob.workingBy || 'Unassigned'}</p>
                                    </div>
                                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                                        <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">Deadline</p>
                                        <p className="font-bold text-slate-900">{formatDate(selectedJob.deadline)}</p>
                                    </div>
                                </div>

                                {/* Candidates Section */}
                                <div className="border-t border-slate-200 pt-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <h4 className="text-lg font-bold text-slate-900">Submitted Candidates</h4>
                                        <span className="bg-blue-100 text-blue-700 font-bold px-3 py-1 rounded-full text-xs">
                                            {jobCandidates.length} Found
                                        </span>
                                    </div>

                                    {loadingCandidates ? (
                                        <div className="animate-pulse space-y-3">
                                            {[1, 2].map(i => <div key={i} className="h-16 bg-slate-200 rounded-xl"></div>)}
                                        </div>
                                    ) : jobCandidates.length > 0 ? (
                                        <div className="space-y-3">
                                            {jobCandidates.map(candidate => (
                                                <div key={candidate.email} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-start gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold flex-shrink-0">
                                                        {candidate.firstName?.charAt(0)}{candidate.lastName?.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <h5 className="font-bold text-slate-900">{candidate.firstName} {candidate.lastName}</h5>
                                                        <p className="text-xs text-slate-500 font-medium mb-1">{candidate.currentRole || 'Candidate'}</p>
                                                        <div className="flex items-center gap-2 text-xs">
                                                            <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-600">{candidate.currentLocation || 'Location N/A'}</span>
                                                            <span className={`px-2 py-0.5 rounded font-medium ${candidate.remarks === 'Rejected' ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
                                                                {candidate.remarks || 'Under Review'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-10 bg-white rounded-xl border border-dashed border-slate-300">
                                            <UserGroupIcon className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                                            <p className="text-slate-500 font-medium">No candidates submitted yet.</p>
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