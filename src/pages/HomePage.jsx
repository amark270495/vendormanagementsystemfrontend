import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../api/apiService';
import { usePermissions } from '../hooks/usePermissions';
import { formatDate } from '../utils/helpers'; 

// --- Enterprise Icons ---
const BriefcaseIcon = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a21.8 21.8 0 00-7.5-1.335 21.8 21.8 0 00-7.5 1.335m16.5 0V5.25A2.25 2.25 0 0018 3H6A2.25 2.25 0 003.75 5.25v8.9m16.5 0a21.8 21.8 0 01-7.5 1.335 21.8 21.8 0 01-7.5-1.335" /></svg>;
const UserGroupIcon = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg>;
const ShieldCheckIcon = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}><path fillRule="evenodd" d="M12.516 2.17a.75.75 0 00-1.032 0 11.209 11.209 0 01-7.877 3.08.75.75 0 00-.722.515A12.74 12.74 0 002.25 9.75c0 5.942 4.064 10.933 9.563 12.348a.749.749 0 00.374 0c5.499-1.415 9.563-6.406 9.563-12.348 0-1.39-.223-2.73-.635-3.985a.75.75 0 00-.722-.516l-.143.001c-2.996 0-5.717-1.17-7.734-3.08zm3.094 8.016a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" /></svg>;
const RefreshIcon = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" /></svg>;
const TableIcon = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" /></svg>;
const ViewColumnsIcon = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0V12a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 12V5.25" /></svg>;
const DownloadIcon = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>;
const SearchIcon = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>;
const DotsVertical = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v.01M12 12v.01M12 18v.01" /></svg>;

const Spinner = ({ size = '6' }) => (
    <div className="flex justify-center items-center">
        <div className={`w-${size} h-${size} border-4 border-t-transparent border-indigo-600 rounded-full animate-spin`}></div>
    </div>
);

// --- Helpers ---
const getUrgency = (dateInput) => {
    if (!dateInput) return { label: 'No Deadline', bg: 'bg-slate-100', text: 'text-slate-600', dot: 'bg-slate-400', ring: 'ring-slate-200' };
    const diffDays = Math.ceil((new Date(dateInput) - new Date()) / (1000 * 60 * 60 * 24));
    if (diffDays <= 1) return { label: 'Critical', bg: 'bg-rose-50', text: 'text-rose-700', dot: 'bg-rose-500', ring: 'ring-rose-200' };
    if (diffDays <= 5) return { label: 'Warning', bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500', ring: 'ring-amber-200' };
    return { label: 'Healthy', bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500', ring: 'ring-emerald-200' };
};

const getAvatar = (rawName) => {
    const name = String(rawName || '');
    if (!name || name.trim() === '' || name === 'Unassigned') return { initials: '?', color: 'bg-slate-100 text-slate-500 border border-slate-200' };
    const parts = name.trim().split(/\s+/).filter(Boolean);
    let initials = parts.length >= 2 ? parts[0].charAt(0) + parts[parts.length - 1].charAt(0) : parts[0].substring(0, 2);
    const colors = ['bg-blue-50 text-blue-700 border-blue-100', 'bg-indigo-50 text-indigo-700 border-indigo-100', 'bg-emerald-50 text-emerald-700 border-emerald-100', 'bg-cyan-50 text-cyan-700 border-cyan-100', 'bg-purple-50 text-purple-700 border-purple-100', 'bg-amber-50 text-amber-700 border-amber-100'];
    const colorIndex = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
    return { initials: initials.toUpperCase(), color: colors[colorIndex] };
};

const getCandidateInitials = (fName, lName) => (fName ? String(fName).charAt(0).toUpperCase() : '') + (lName ? String(lName).charAt(0).toUpperCase() : '') || '?';

const HomePage = () => {
    const { user } = useAuth();
    const { canViewDashboards, canEditDashboard } = usePermissions();
    
    // --- Enterprise RBAC ---
    const hasGlobalView = ['Admin', 'Director'].includes(user?.userRole) || 
                          ['Development Manager', 'Operations Manager'].includes(user?.functionalRole);
                          
    const [viewMode, setViewMode] = useState('table');
    const [data, setData] = useState({});
    const [flatJobs, setFlatJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedAssigneeFilter, setSelectedAssigneeFilter] = useState('ALL');
    
    // UI States
    const [selectedJob, setSelectedJob] = useState(null);
    const [jobCandidates, setJobCandidates] = useState([]);
    const [loadingCandidates, setLoadingCandidates] = useState(false);
    const [openMenuId, setOpenMenuId] = useState(null);
    const [draggedJob, setDraggedJob] = useState(null);
    const [draggedFromColumn, setDraggedFromColumn] = useState(null);

    const [stats, setStats] = useState({ totalOpenJobs: 0, totalResumes: 0, activeRecruiters: 0, conversionRate: '0.0%' });

    const fetchData = useCallback(async () => {
        if (!user?.userIdentifier || !canViewDashboards) return;
        setLoading(true); setError('');

        try {
            const [homeRes, biRes] = await Promise.all([
                apiService.getHomePageData(user.userIdentifier).catch(e => e.response),
                typeof apiService.getPowerBIData === 'function' ? apiService.getPowerBIData({ authenticatedUsername: user.userIdentifier }).catch(e => e.response) : Promise.resolve(null)
            ]);

            if (homeRes?.data?.success) {
                let fetchedData = homeRes.data.data;
                let allJobs = [];
                let openCount = 0;

                // Apply RBAC Logic
                if (!hasGlobalView) {
                    const myJobs = fetchedData[user.displayName] || [];
                    fetchedData = { [user.displayName]: myJobs };
                }

                Object.entries(fetchedData).forEach(([assignee, jobs]) => {
                    openCount += jobs.length;
                    jobs.forEach(j => allJobs.push({ ...j, assignee }));
                });

                setData(fetchedData);
                setFlatJobs(allJobs);
                setStats(prev => ({ ...prev, totalOpenJobs: openCount, activeRecruiters: Object.keys(fetchedData).length }));
            } else {
                setError(homeRes?.data?.message || "Failed to load admin dashboard.");
            }

            if (biRes?.data?.success) {
                const biData = biRes.data;
                const totalResumes = biData.Fact_JobPostings?.reduce((sum, j) => sum + (j.ResumesSubmitted || 0), 0) || 0;
                const hired = biData.Fact_Candidates?.filter(c => c.CandidateStatus?.toLowerCase().includes('hire')).length || 0;
                const totalCands = biData.Fact_Candidates?.length || 0;
                const conversion = totalCands > 0 ? ((hired / totalCands) * 100).toFixed(1) + '%' : 'N/A';

                setStats(prev => ({ ...prev, totalResumes: totalResumes, conversionRate: conversion }));
            }
        } catch (err) {
            setError("Server synchronization failed.");
        } finally {
            setLoading(false);
        }
    }, [user, canViewDashboards, hasGlobalView]);

    useEffect(() => { fetchData(); }, [fetchData]);

    useEffect(() => {
        if (selectedJob && typeof apiService.getCandidateDetailsPageData === 'function') {
            setLoadingCandidates(true);
            apiService.getCandidateDetailsPageData(user.userIdentifier)
                .then(res => {
                    if (res.data.success) {
                        setJobCandidates(res.data.candidates.filter(c => c.postingId === selectedJob.postingId));
                    }
                })
                .catch(err => console.error("Failed to load candidates", err))
                .finally(() => setLoadingCandidates(false));
        } else {
            setJobCandidates([]);
        }
    }, [selectedJob, user?.userIdentifier]);

    const recruiterList = useMemo(() => {
        const set = new Set();
        flatJobs.forEach(j => { if (j.assignee) set.add(j.assignee); });
        return Array.from(set).sort();
    }, [flatJobs]);

    const filteredFlatJobs = useMemo(() => {
        return flatJobs.filter(job => {
            const matchesSearch = 
                job.jobTitle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                job.clientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                job.postingId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                job.assignee?.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesAssignee = selectedAssigneeFilter === 'ALL' || job.assignee === selectedAssigneeFilter;
            return matchesSearch && matchesAssignee;
        });
    }, [flatJobs, searchTerm, selectedAssigneeFilter]);

    // CSV Export Engine
    const handleExportCSV = () => {
        const headers = ['Posting ID', 'Job Title', 'Client Name', 'Assigned To', 'Deadline'];
        const rows = filteredFlatJobs.map(job => [
            job.postingId,
            `"${job.jobTitle || ''}"`,
            `"${job.clientName || ''}"`,
            `"${job.assignee || 'Unassigned'}"`,
            formatDate(job.deadline)
        ]);
        const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `VMS_Job_Operations_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleArchive = async (postingId) => {
        if (!window.confirm("Are you sure you want to archive this job?")) return;
        try {
            await apiService.archiveOrDeleteJob([postingId], 'archive', user.userIdentifier);
            fetchData();
        } catch (err) { alert("Failed to archive job."); }
    };

    const onDragStart = (job, fromColumn) => {
        if (!canEditDashboard) return;
        setDraggedJob(job); setDraggedFromColumn(fromColumn);
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
        } catch (err) { fetchData(); }
        setDraggedJob(null); setDraggedFromColumn(null);
    };

    return (
        <div className="p-4 md:p-8 bg-slate-50 min-h-screen font-sans text-slate-800" onClick={() => setOpenMenuId(null)}>
            <div className="max-w-[1600px] mx-auto space-y-8">
                
                {/* --- Admin Command Header --- */}
                <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200/60 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-50 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-2">
                            <h1 className="text-3xl md:text-4xl font-black tracking-tight text-slate-900">
                                Welcome, <span className="text-indigo-600">{user?.displayName?.split(' ')[0] || 'Admin'}</span>
                            </h1>
                            {hasGlobalView && (
                                <span className="flex items-center gap-1.5 bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-sm">
                                    <ShieldCheckIcon className="w-4 h-4" /> Global View Active
                                </span>
                            )}
                        </div>
                        <p className="text-slate-500 font-medium text-sm">
                            {hasGlobalView 
                                ? `System overview enabled. Managing ${stats.totalOpenJobs} active pipelines across the enterprise.` 
                                : `Your personal workspace. You have ${stats.totalOpenJobs} active assignments.`}
                        </p>
                    </div>
                    <div className="relative z-10 flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 shadow-sm w-full sm:w-auto">
                            <button onClick={() => setViewMode('table')} className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2 rounded-lg font-bold text-sm transition-all ${viewMode === 'table' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                                <TableIcon className="w-4 h-4" /> Table
                            </button>
                            <button onClick={() => setViewMode('kanban')} className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2 rounded-lg font-bold text-sm transition-all ${viewMode === 'kanban' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                                <ViewColumnsIcon className="w-4 h-4" /> Kanban
                            </button>
                        </div>
                        <button onClick={fetchData} disabled={loading} className="flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-900 text-white font-bold text-sm rounded-xl hover:bg-slate-800 transition shadow-sm disabled:opacity-50">
                            <RefreshIcon className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Sync
                        </button>
                    </div>
                </div>

                {/* --- Executive KPIs --- */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                    <div className="bg-white p-6 rounded-3xl border border-slate-200/60 shadow-sm flex flex-col justify-between hover:shadow-md transition">
                        <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Active Openings</span>
                        <div className="flex items-baseline justify-between mt-3">
                            <span className="text-4xl font-black text-slate-800">{stats.totalOpenJobs}</span>
                            <BriefcaseIcon className="w-8 h-8 text-indigo-500/20" />
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-3xl border border-slate-200/60 shadow-sm flex flex-col justify-between hover:shadow-md transition">
                        <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Active Recruiters</span>
                        <div className="flex items-baseline justify-between mt-3">
                            <span className="text-4xl font-black text-indigo-600">{stats.activeRecruiters}</span>
                            <UserGroupIcon className="w-8 h-8 text-indigo-500/20" />
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-3xl border border-slate-200/60 shadow-sm flex flex-col justify-between hover:shadow-md transition">
                        <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Resume Volume</span>
                        <div className="flex items-baseline justify-between mt-3">
                            <span className="text-4xl font-black text-blue-600">{stats.totalResumes}</span>
                            <span className="text-[10px] font-bold px-2.5 py-1 rounded bg-blue-50 text-blue-700">Submissions</span>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-3xl border border-slate-200/60 shadow-sm flex flex-col justify-between hover:shadow-md transition">
                        <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Global Placement Rate</span>
                        <div className="flex items-baseline justify-between mt-3">
                            <span className="text-4xl font-black text-emerald-600">{stats.conversionRate}</span>
                            <span className="text-[10px] font-bold px-2.5 py-1 rounded bg-emerald-50 text-emerald-700">Hired / Sub</span>
                        </div>
                    </div>
                </div>

                {/* --- Main Dashboard Area --- */}
                <div className="bg-white rounded-3xl border border-slate-200/60 shadow-sm overflow-hidden">
                    
                    {/* Universal Tool Bar */}
                    <div className="p-5 border-b border-slate-100 flex flex-col lg:flex-row justify-between items-center gap-4 bg-slate-50/50">
                        <div>
                            <h2 className="text-lg font-black text-slate-800 tracking-tight">Operations Pipeline</h2>
                            <p className="text-xs text-slate-500 font-medium mt-0.5">Manage live requisitions and assignments</p>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                            {viewMode === 'table' && hasGlobalView && (
                                <select 
                                    value={selectedAssigneeFilter} 
                                    onChange={(e) => setSelectedAssigneeFilter(e.target.value)}
                                    className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20 transition cursor-pointer"
                                >
                                    <option value="ALL">All Recruiters</option>
                                    {recruiterList.map(rec => <option key={rec} value={rec}>{rec}</option>)}
                                </select>
                            )}
                            <div className="relative flex-grow lg:w-64">
                                <SearchIcon className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                                <input 
                                    type="text" placeholder="Search ID, Job, or Client..." 
                                    value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} 
                                    className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 text-xs font-medium text-slate-700 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition"
                                />
                            </div>
                            {viewMode === 'table' && (
                                <button onClick={handleExportCSV} className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 px-4 py-2.5 rounded-xl font-bold text-xs transition">
                                    <DownloadIcon className="w-4 h-4" /> Export CSV
                                </button>
                            )}
                        </div>
                    </div>

                    {loading ? (
                        <div className="h-64 flex flex-col justify-center items-center gap-3"><Spinner size="8"/><span className="text-xs font-bold text-slate-400 uppercase tracking-widest animate-pulse">Syncing Databases...</span></div>
                    ) : error ? (
                        <div className="p-12 text-center text-rose-600 font-bold">{error}</div>
                    ) : viewMode === 'table' ? (
                        
                        /* --- MASTER TABLE VIEW --- */
                        <div className="overflow-x-auto w-full">
                            <table className="w-full text-left border-collapse whitespace-nowrap">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-slate-200">
                                        <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Posting ID</th>
                                        <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Requirement</th>
                                        {hasGlobalView && <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Owner</th>}
                                        <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Deadline</th>
                                        <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filteredFlatJobs.length > 0 ? filteredFlatJobs.map((job, idx) => {
                                        const urgency = getUrgency(job.deadline);
                                        return (
                                            <tr key={`${job.postingId}-${idx}`} className="hover:bg-slate-50/80 transition-colors group">
                                                <td className="px-6 py-4">
                                                    <span className="bg-slate-100 text-slate-700 font-bold px-2.5 py-1 rounded-md text-xs border border-slate-200">{job.postingId}</span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <p className="font-bold text-slate-900 text-sm">{job.jobTitle}</p>
                                                    <p className="text-xs text-slate-500 font-medium mt-0.5">{job.clientName}</p>
                                                </td>
                                                {hasGlobalView && (
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-2">
                                                            <div className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold ${getAvatar(job.assignee).color}`}>
                                                                {getAvatar(job.assignee).initials}
                                                            </div>
                                                            <span className="text-xs font-bold text-slate-700">{job.assignee}</span>
                                                        </div>
                                                    </td>
                                                )}
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <span className={`w-2 h-2 rounded-full ${urgency.dot}`}></span>
                                                        <div>
                                                            <p className="font-bold text-slate-800 text-sm">{formatDate(job.deadline)}</p>
                                                            <p className={`text-[10px] font-bold uppercase tracking-wider mt-0.5 ${urgency.text}`}>{urgency.label}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <button onClick={() => setSelectedJob(job)} className="text-indigo-600 hover:text-indigo-900 font-bold text-xs bg-white border border-slate-200 hover:border-indigo-300 px-4 py-2 rounded-lg transition-all shadow-sm opacity-0 group-hover:opacity-100">
                                                        View Details
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    }) : (
                                        <tr><td colSpan="5" className="px-6 py-16 text-center text-slate-500 font-medium text-sm">No jobs match your current filter.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        
                        /* --- KANBAN VIEW --- */
                        <div className="p-6 overflow-x-auto bg-slate-50/30">
                            <div className="flex gap-6 min-w-max">
                                {Object.entries(data).map(([assigneeGroup, jobs]) => {
                                    const assignees = assigneeGroup.split(',').map(n => n.trim()).filter(Boolean);
                                    
                                    // Search Filter Logic for Kanban Cards
                                    const filteredKanbanJobs = jobs.filter(job => 
                                        job.jobTitle?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                        job.clientName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                        job.postingId?.toLowerCase().includes(searchTerm.toLowerCase())
                                    );

                                    // Hide empty columns if searching
                                    if (searchTerm && filteredKanbanJobs.length === 0) return null;

                                    return (
                                        <div key={assigneeGroup} className="w-[340px] flex flex-col bg-slate-100/50 rounded-2xl border border-slate-200 h-[650px]" onDragOver={e => e.preventDefault()} onDrop={() => onDrop(assigneeGroup)}>
                                            <div className="p-4 border-b border-slate-200 bg-white/50 sticky top-0 rounded-t-2xl">
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="flex items-start gap-3 flex-1 min-w-0">
                                                        <div className="flex -space-x-2 shrink-0">
                                                            {assignees.map((name, i) => (
                                                                <div key={i} title={name} className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ring-2 ring-white ${getAvatar(name).color}`}>
                                                                    {getAvatar(name).initials}
                                                                </div>
                                                            ))}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <h3 className="font-bold text-slate-800 text-sm leading-tight truncate">{assignees.length === 1 ? assignees : `${assignees[0]} +${assignees.length - 1}`}</h3>
                                                            {assignees.length > 1 && <p className="text-[10px] font-medium text-slate-500 truncate" title={assigneeGroup}>{assigneeGroup}</p>}
                                                        </div>
                                                    </div>
                                                    <span className="shrink-0 bg-white border border-slate-200 text-slate-700 text-xs font-bold px-2 py-0.5 rounded shadow-sm">{filteredKanbanJobs.length}</span>
                                                </div>
                                            </div>
                                            <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
                                                {filteredKanbanJobs.map(job => {
                                                    const urgency = getUrgency(job.deadline);
                                                    return (
                                                        <div 
                                                            key={job.postingId} draggable={canEditDashboard} onDragStart={() => onDragStart(job, assigneeGroup)}
                                                            className={`relative group bg-white p-4 rounded-xl border border-slate-200 shadow-sm transition hover:shadow-md cursor-grab active:cursor-grabbing ${draggedJob?.postingId === job.postingId ? 'opacity-40 scale-95' : ''}`}
                                                        >
                                                            <div className="absolute top-3 right-3 z-20" onClick={e => e.stopPropagation()}>
                                                                <button onClick={() => setOpenMenuId(openMenuId === job.postingId ? null : job.postingId)} className="text-slate-400 hover:text-slate-700 p-1 rounded hover:bg-slate-50 transition"><DotsVertical className="w-5 h-5" /></button>
                                                                {openMenuId === job.postingId && (
                                                                    <div className="absolute right-0 mt-1 w-32 rounded-xl shadow-lg border border-slate-200 bg-white z-50">
                                                                        <div className="p-1">
                                                                            <button onClick={() => setSelectedJob(job)} className="w-full text-left px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 rounded-lg">View Details</button>
                                                                            <button onClick={() => handleArchive(job.postingId)} className="w-full text-left px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50 rounded-lg mt-1">Archive Job</button>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div onClick={() => { if(openMenuId !== job.postingId) setSelectedJob(job); }} className="w-full block pr-6">
                                                                <div className="flex justify-between items-start mb-2">
                                                                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-bold border border-slate-200">{job.postingId}</span>
                                                                </div>
                                                                <h4 className="text-sm font-bold text-slate-900 leading-tight mb-2">{job.jobTitle}</h4>
                                                                <div className="flex items-center text-[11px] font-bold text-slate-500 mb-3 bg-slate-50 px-2 py-1.5 rounded-lg border border-slate-100">
                                                                    <BriefcaseIcon className="w-3 h-3 mr-1.5 shrink-0 text-slate-400" />
                                                                    <span className="truncate">{job.clientName}</span>
                                                                </div>
                                                                <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                                                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Deadline</span>
                                                                    <span className={`text-[10px] font-bold flex items-center gap-1 ${urgency.text}`}><span className={`w-1.5 h-1.5 rounded-full ${urgency.dot}`}></span> {formatDate(job.deadline)}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* --- Side Drawer (Job Workspace) --- */}
            {selectedJob && (
                <div className="fixed inset-0 z-50 overflow-hidden text-left">
                    <div className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm transition-opacity" onClick={() => setSelectedJob(null)}></div>
                    <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10 text-left">
                        <div className="pointer-events-auto w-screen max-w-lg transform transition-transform duration-500 ease-in-out bg-white shadow-2xl flex flex-col border-l border-slate-200">
                            
                            <div className="bg-white border-b border-slate-200 p-8 relative">
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-xs font-black tracking-widest uppercase text-indigo-600 bg-indigo-50 px-3 py-1 rounded-md border border-indigo-100">Job Workspace</h2>
                                    <button onClick={() => setSelectedJob(null)} className="text-slate-400 hover:text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-full p-2 transition border border-slate-200">
                                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                                    </button>
                                </div>
                                <div className="flex flex-wrap items-center gap-3">
                                    <span className="bg-slate-100 text-slate-700 font-bold px-3 py-1 rounded-md text-xs border border-slate-200 shadow-sm">{selectedJob.postingId}</span>
                                    <span className="text-slate-600 font-bold text-sm flex items-center gap-1.5"><BriefcaseIcon className="w-4 h-4 text-slate-400"/> {selectedJob.clientName}</span>
                                </div>
                                <h3 className="text-2xl font-black text-slate-900 mt-4 leading-tight">{selectedJob.jobTitle}</h3>
                            </div>

                            <div className="flex-1 overflow-y-auto p-8 bg-slate-50/80">
                                <div className="grid grid-cols-2 gap-4 mb-8">
                                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                                        <p className="text-[10px] text-slate-400 uppercase tracking-widest font-black mb-3">Assignee(s)</p>
                                        <div className="flex flex-col gap-2">
                                            {selectedJob.workingBy?.split(',').map(n => n.trim()).filter(Boolean).map((name, i) => (
                                                <div key={i} className="flex items-center gap-2">
                                                    <div className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${getAvatar(name).color}`}>{getAvatar(name).initials}</div>
                                                    <p className="font-bold text-slate-800 text-xs truncate">{name}</p>
                                                </div>
                                            ))}
                                            {(!selectedJob.workingBy || selectedJob.workingBy === 'Unassigned') && <p className="font-bold text-slate-800 text-xs">Unassigned</p>}
                                        </div>
                                    </div>
                                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                                        <p className="text-[10px] text-slate-400 uppercase tracking-widest font-black mb-2">Deadline</p>
                                        <p className="font-bold text-slate-800 text-sm">{formatDate(selectedJob.deadline)}</p>
                                        <div className="mt-3">
                                            {(() => {
                                                const urg = getUrgency(selectedJob.deadline);
                                                return <span className={`text-[10px] font-bold px-2.5 py-1 rounded bg-slate-50 border ${urg.text} ${urg.ring} inline-flex items-center gap-1.5`}><span className={`w-1.5 h-1.5 rounded-full ${urg.dot}`}></span> {urg.label}</span>
                                            })()}
                                        </div>
                                    </div>
                                </div>

                                <div className="border-t border-slate-200 pt-8">
                                    <div className="flex items-center justify-between mb-6">
                                        <h4 className="text-lg font-black text-slate-900">Submitted Candidates</h4>
                                        <span className="bg-white border border-slate-200 text-slate-700 font-bold px-3 py-1 rounded-md text-xs shadow-sm">{jobCandidates.length}</span>
                                    </div>

                                    {loadingCandidates ? (
                                        <div className="animate-pulse space-y-4">
                                            {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-20 bg-slate-200/50 rounded-2xl w-full"></div>)}
                                        </div>
                                    ) : jobCandidates.length > 0 ? (
                                        <div className="space-y-4">
                                            {jobCandidates.map(candidate => (
                                                <div key={candidate.email} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-start gap-4 hover:shadow-md transition">
                                                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700 font-black shrink-0 border border-slate-200 shadow-sm">
                                                        {getCandidateInitials(candidate.firstName, candidate.lastName)}
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <h5 className="font-black text-slate-900 text-sm truncate">{candidate.firstName} {candidate.lastName}</h5>
                                                        <p className="text-xs text-slate-500 font-semibold mb-3 mt-0.5 truncate">{candidate.currentRole || 'Candidate'}</p>
                                                        <div className="flex flex-wrap items-center gap-2 text-[10px] font-bold">
                                                            <span className="bg-slate-100 px-2 py-1 rounded text-slate-600 border border-slate-200">{candidate.currentLocation || 'Location N/A'}</span>
                                                            <span className={`px-2 py-1 rounded border ${candidate.remarks === 'Rejected' ? 'bg-red-50 text-red-700 border-red-100' : 'bg-emerald-50 text-emerald-700 border-emerald-100'}`}>
                                                                {candidate.remarks || 'Under Review'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-12 bg-white rounded-3xl border border-dashed border-slate-300">
                                            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3"><UserGroupIcon className="w-8 h-8 text-slate-400" /></div>
                                            <p className="text-slate-500 font-bold text-sm">No candidates submitted yet.</p>
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