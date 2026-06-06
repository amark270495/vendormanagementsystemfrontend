import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../api/apiService';
import { usePermissions } from '../hooks/usePermissions';
import { formatDate, getDeadlineClass } from '../utils/helpers'; 

// --- Inline Icons ---
const BriefcaseIcon = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.03 23.03 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
);
const UserGroupIcon = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
);
const ClockIcon = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
);
const RefreshIcon = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
);
const SearchIcon = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
);

const HomePage = () => {
    const { user } = useAuth();
    const { canViewDashboards } = usePermissions();
    
    const [data, setData] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [stats, setStats] = useState({ totalJobs: 0, openJobs: 0, closedJobs: 0 });
    
    // New Feature States
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedJob, setSelectedJob] = useState(null);

    const fetchData = useCallback(async () => {
        if (!user?.userIdentifier) return;
        setLoading(true);
        setError('');
        
        if (!canViewDashboards) {
            setLoading(false);
            setError("You do not have permission to view the home page dashboard.");
            return;
        }
        try {
            const response = await apiService.getHomePageData(user.userIdentifier);
            if (response.data.success) {
                const fetchedData = response.data.data;
                setData(fetchedData);
                
                let openCount = 0;
                Object.values(fetchedData).forEach(jobs => {
                    openCount += jobs.length;
                });
                
                setStats({ 
                    totalJobs: openCount, 
                    openJobs: openCount, 
                    closedJobs: 0 
                });
            } else {
                setError(response.data.message);
            }
        } catch (err) {
            setError(err.response?.data?.message || "Failed to fetch dashboard data.");
        } finally {
            setLoading(false);
        }
    }, [user?.userIdentifier, canViewDashboards]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // --- Search & Filter Logic ---
    const filteredData = useMemo(() => {
        if (!searchTerm.trim()) return data;
        const term = searchTerm.toLowerCase();
        const result = {};
        
        Object.entries(data).forEach(([assignee, jobs]) => {
            const matchedJobs = jobs.filter(job => 
                (job.jobTitle && job.jobTitle.toLowerCase().includes(term)) ||
                (job.clientName && job.clientName.toLowerCase().includes(term)) ||
                (job.postingId && job.postingId.toLowerCase().includes(term))
            );
            if (matchedJobs.length > 0) result[assignee] = matchedJobs;
        });
        return result;
    }, [data, searchTerm]);

    // Helpers
    const currentDate = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good Morning';
        if (hour < 18) return 'Good Afternoon';
        return 'Good Evening';
    };

    // Components
    const MetricCard = ({ title, value, icon: Icon, color, subText }) => (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-start justify-between transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
            <div>
                <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">{title}</p>
                <div className="mt-2 flex items-baseline">
                    <span className="text-3xl font-extrabold text-gray-900">{value}</span>
                </div>
                {subText && <p className="mt-1 text-xs text-gray-400">{subText}</p>}
            </div>
            <div className={`p-3 rounded-xl ${color}`}>
                <Icon className="w-6 h-6 text-white" />
            </div>
        </div>
    );

    const PipelineSkeleton = () => (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-pulse">
            {[1, 2, 3, 4].map(col => (
                <div key={col} className="bg-gray-50 rounded-2xl border border-gray-200 h-[500px] p-4 flex flex-col space-y-4">
                    <div className="h-6 bg-gray-200 rounded w-1/2"></div>
                    {[1, 2, 3].map(card => (
                        <div key={card} className="bg-white p-4 rounded-xl border border-gray-100 h-24">
                            <div className="h-4 bg-gray-200 rounded w-1/3 mb-3"></div>
                            <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                        </div>
                    ))}
                </div>
            ))}
        </div>
    );

    return (
        <div className="space-y-8 pb-12 relative">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        {getGreeting()}, <span className="text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg">{user?.displayName || 'User'}</span>
                    </h1>
                    <p className="text-gray-500 mt-1 text-sm">{currentDate}</p>
                </div>
                <button
                    onClick={fetchData}
                    disabled={loading}
                    className="flex items-center justify-center space-x-2 px-5 py-2.5 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50 shadow-md shadow-indigo-200"
                >
                    <RefreshIcon className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    <span>Refresh Data</span>
                </button>
            </div>

            {error && (
                <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-lg shadow-sm animate-fade-in" role="alert">
                    <p className="font-bold">Error Loading Dashboard</p>
                    <p>{error}</p>
                </div>
            )}

            {canViewDashboards && !error && (
                <>
                    {/* Metrics Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <MetricCard 
                            title="Active Open Jobs" 
                            value={loading ? '-' : stats.openJobs} 
                            icon={BriefcaseIcon}
                            color="bg-gradient-to-br from-indigo-500 to-purple-600"
                            subText="Jobs currently accepting submissions"
                        />
                        <MetricCard 
                            title="Total Candidates" 
                            value="N/A" 
                            icon={UserGroupIcon}
                            color="bg-gradient-to-br from-emerald-400 to-teal-500"
                            subText="Data requires candidate endpoint"
                        />
                        <MetricCard 
                            title="Avg Time to Fill" 
                            value="N/A" 
                            icon={ClockIcon}
                            color="bg-gradient-to-br from-orange-400 to-red-500"
                            subText="Data requires report endpoint"
                        />
                    </div>

                    {/* Team Pipeline Section */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
                            <div className="flex items-center space-x-3">
                                <h2 className="text-xl font-extrabold text-gray-800">Team Pipeline</h2>
                                <span className="px-3 py-1 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-full border border-indigo-100">
                                    {stats.openJobs} Active
                                </span>
                            </div>
                            
                            {/* Search Bar */}
                            <div className="relative w-full md:w-72">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <SearchIcon className="h-4 w-4 text-gray-400" />
                                </div>
                                <input
                                    type="text"
                                    placeholder="Search jobs, clients, or IDs..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="block w-full pl-10 pr-3 py-2 border border-gray-200 rounded-xl leading-5 bg-gray-50 placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-all"
                                />
                            </div>
                        </div>

                        {loading ? (
                            <PipelineSkeleton />
                        ) : Object.keys(filteredData).length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {Object.entries(filteredData).map(([assignee, jobs]) => (
                                    <div key={assignee} className="flex flex-col bg-gray-50/50 rounded-2xl border border-gray-200 h-[500px] shadow-sm overflow-hidden">
                                        {/* Column Header */}
                                        <div className="p-4 border-b border-gray-200 bg-white sticky top-0 z-10 shadow-sm">
                                            <div className="flex items-center justify-between">
                                                <h3 className="font-bold text-gray-800 truncate" title={assignee}>
                                                    {assignee}
                                                </h3>
                                                <span className="bg-gray-100 text-gray-600 text-xs font-bold px-2.5 py-1 rounded-md">
                                                    {jobs.length}
                                                </span>
                                            </div>
                                        </div>
                                        
                                        {/* Job List */}
                                        <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
                                            {jobs.map(job => (
                                                <div 
                                                    key={job.postingId} 
                                                    onClick={() => setSelectedJob(job)}
                                                    className="group bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all cursor-pointer transform hover:-translate-y-0.5"
                                                >
                                                    <div className="flex justify-between items-start mb-2">
                                                        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-600 tracking-wide">
                                                            {job.postingId}
                                                        </span>
                                                        <span className={`w-2.5 h-2.5 rounded-full shadow-sm ${getDeadlineClass(job.deadline).includes('text-red') ? 'bg-red-500' : 'bg-emerald-500'}`}></span>
                                                    </div>
                                                    
                                                    <h4 className="text-sm font-bold text-gray-800 leading-snug mb-2 group-hover:text-indigo-600 transition-colors line-clamp-2">
                                                        {job.jobTitle}
                                                    </h4>
                                                    
                                                    <div className="flex items-center text-xs text-gray-500 mb-3">
                                                        <BriefcaseIcon className="w-3.5 h-3.5 mr-1.5 text-gray-400" />
                                                        <span className="truncate font-medium">{job.clientName}</span>
                                                    </div>

                                                    <div className="pt-3 border-t border-gray-100 flex justify-between items-center">
                                                        <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Deadline</span>
                                                        <span className={`text-xs font-bold bg-gray-50 px-2 py-1 rounded-md ${getDeadlineClass(job.deadline)}`}>
                                                            {formatDate(job.deadline)}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-20 bg-gray-50 rounded-2xl border border-dashed border-gray-300 text-center">
                                <div className="w-16 h-16 bg-white shadow-sm rounded-full flex items-center justify-center mb-4">
                                    <SearchIcon className="w-8 h-8 text-gray-300" />
                                </div>
                                <h3 className="text-lg font-bold text-gray-900">No Jobs Found</h3>
                                <p className="text-gray-500 mt-1 max-w-sm">
                                    {searchTerm ? `We couldn't find any jobs matching "${searchTerm}".` : "There are currently no active job postings assigned to the team."}
                                </p>
                                {searchTerm && (
                                    <button 
                                        onClick={() => setSearchTerm('')} 
                                        className="mt-4 text-indigo-600 font-semibold hover:text-indigo-800 text-sm"
                                    >
                                        Clear Search
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </>
            )}

            {!loading && !error && !canViewDashboards && (
                <div className="flex flex-col items-center justify-center h-64 bg-white rounded-2xl border border-gray-200 shadow-sm">
                    <svg className="w-12 h-12 text-red-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                    <h3 className="text-lg font-bold text-gray-900">Access Restricted</h3>
                    <p className="text-gray-500 mt-1">You do not have permission to view the main dashboard.</p>
                </div>
            )}

            {/* Slide-out Modal / Drawer Wrapper (Hidden when selectedJob is null) */}
            {selectedJob && (
                <div className="fixed inset-0 z-50 overflow-hidden" aria-labelledby="slide-over-title" role="dialog" aria-modal="true">
                    <div className="absolute inset-0 overflow-hidden">
                        <div className="absolute inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setSelectedJob(null)} aria-hidden="true"></div>
                        <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
                            <div className="pointer-events-auto w-screen max-w-md transform transition-transform duration-500 ease-in-out">
                                <div className="flex h-full flex-col overflow-y-scroll bg-white shadow-2xl">
                                    <div className="bg-indigo-600 px-4 py-6 sm:px-6">
                                        <div className="flex items-center justify-between">
                                            <h2 className="text-lg font-medium text-white" id="slide-over-title">Job Details</h2>
                                            <button onClick={() => setSelectedJob(null)} className="rounded-md text-indigo-200 hover:text-white focus:outline-none">
                                                <span className="sr-only">Close panel</span>
                                                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                                            </button>
                                        </div>
                                        <div className="mt-1">
                                            <p className="text-sm text-indigo-200">{selectedJob.postingId}</p>
                                        </div>
                                    </div>
                                    <div className="relative flex-1 px-4 py-6 sm:px-6">
                                        {/* Modal Content Placeholder */}
                                        <h3 className="text-xl font-bold text-gray-900 mb-4">{selectedJob.jobTitle}</h3>
                                        <div className="space-y-4">
                                            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                                                <p className="text-sm text-gray-500">Client</p>
                                                <p className="font-semibold text-gray-900">{selectedJob.clientName}</p>
                                            </div>
                                            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                                                <p className="text-sm text-gray-500">Assigned To</p>
                                                <p className="font-semibold text-gray-900">{selectedJob.workingBy || 'Unassigned'}</p>
                                            </div>
                                            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                                                <p className="text-sm text-gray-500">Deadline</p>
                                                <p className={`font-semibold ${getDeadlineClass(selectedJob.deadline)}`}>{formatDate(selectedJob.deadline)}</p>
                                            </div>
                                        </div>
                                    </div>
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