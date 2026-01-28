import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../api/apiService';
import Spinner from '../components/Spinner';
import { usePermissions } from '../hooks/usePermissions';
// Assuming you have these helpers. If not, you can copy the helper logic from the previous reply.
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

const HomePage = () => {
    const { user } = useAuth();
    const { canViewDashboards } = usePermissions();
    
    const [data, setData] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [stats, setStats] = useState({ totalJobs: 0, openJobs: 0, closedJobs: 0 });

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

    // Helpers
    const currentDate = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good Morning';
        if (hour < 18) return 'Good Afternoon';
        return 'Good Evening';
    };

    const MetricCard = ({ title, value, icon: Icon, color, subText }) => (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-start justify-between transition-transform hover:-translate-y-1 hover:shadow-md">
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

    return (
        <div className="space-y-8 pb-12">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        {getGreeting()}, <span className="text-indigo-600">{user?.displayName || 'User'}</span>
                    </h1>
                    <p className="text-gray-500 mt-1 text-sm">{currentDate}</p>
                </div>
                <button
                    onClick={fetchData}
                    disabled={loading}
                    className="flex items-center justify-center space-x-2 px-5 py-2.5 bg-indigo-50 text-indigo-600 font-semibold rounded-xl hover:bg-indigo-100 transition-colors disabled:opacity-50"
                >
                    <RefreshIcon className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    <span>Refresh Dashboard</span>
                </button>
            </div>

            {error && (
                <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-lg shadow-sm" role="alert">
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
                            color="bg-indigo-500"
                            subText="Jobs currently accepting submissions"
                        />
                        <MetricCard 
                            title="Total Candidates" 
                            value="N/A" 
                            icon={UserGroupIcon}
                            color="bg-emerald-500"
                            subText="Data unavailable in preview"
                        />
                        <MetricCard 
                            title="Avg Time to Fill" 
                            value="N/A" 
                            icon={ClockIcon}
                            color="bg-orange-400"
                            subText="Data unavailable in preview"
                        />
                    </div>

                    {/* Team Pipeline Section */}
                    <div>
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-gray-800">Team Job Pipeline</h2>
                            <span className="px-3 py-1 bg-indigo-100 text-indigo-700 text-xs font-bold rounded-full">
                                {stats.openJobs} Active Assignments
                            </span>
                        </div>

                        {loading ? (
                            <div className="flex justify-center items-center h-64 bg-white rounded-2xl border border-dashed border-gray-300">
                                <Spinner size="10" />
                            </div>
                        ) : Object.keys(data).length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {Object.entries(data).map(([assignee, jobs]) => (
                                    <div key={assignee} className="flex flex-col bg-gray-50 rounded-2xl border border-gray-200 h-[500px] shadow-sm">
                                        {/* Column Header */}
                                        <div className="p-4 border-b border-gray-200 bg-white rounded-t-2xl sticky top-0 z-10">
                                            <div className="flex items-center justify-between">
                                                <h3 className="font-bold text-gray-800 truncate" title={assignee}>
                                                    {assignee}
                                                </h3>
                                                <span className="bg-gray-100 text-gray-600 text-xs font-bold px-2 py-1 rounded-md">
                                                    {jobs.length}
                                                </span>
                                            </div>
                                        </div>
                                        
                                        {/* Job List */}
                                        <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
                                            {jobs.map(job => (
                                                <div 
                                                    key={job.postingId} 
                                                    className="group bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all cursor-default"
                                                >
                                                    <div className="flex justify-between items-start mb-2">
                                                        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-gray-100 text-gray-500 tracking-wide">
                                                            ID: {job.postingId}
                                                        </span>
                                                        {/* Optional status indicator dot based on deadline */}
                                                        <span className={`w-2 h-2 rounded-full ${getDeadlineClass(job.deadline).includes('text-red') ? 'bg-red-500' : 'bg-green-500'}`}></span>
                                                    </div>
                                                    
                                                    <h4 className="text-sm font-bold text-gray-800 leading-snug mb-1 group-hover:text-indigo-600 transition-colors">
                                                        {job.jobTitle}
                                                    </h4>
                                                    
                                                    <div className="flex items-center text-xs text-gray-500 mb-3">
                                                        <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                                                        <span className="truncate">{job.clientName}</span>
                                                    </div>

                                                    <div className="pt-3 border-t border-gray-100 flex justify-between items-center">
                                                        <span className="text-[10px] font-medium text-gray-400">Deadline</span>
                                                        <span className={`text-xs font-bold ${getDeadlineClass(job.deadline)}`}>
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
                            <div className="flex flex-col items-center justify-center p-12 bg-white rounded-2xl border border-gray-200 text-center">
                                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                                    <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></svg>
                                </div>
                                <h3 className="text-lg font-bold text-gray-900">No Open Jobs</h3>
                                <p className="text-gray-500 mt-1 max-w-sm">
                                    There are currently no active job postings assigned to the team. 
                                    Check back later or verify your filters.
                                </p>
                            </div>
                        )}
                    </div>
                </>
            )}

            {!loading && !error && !canViewDashboards && (
                <div className="flex flex-col items-center justify-center h-64 bg-white rounded-2xl border border-gray-200">
                    <svg className="w-12 h-12 text-red-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                    <h3 className="text-lg font-bold text-gray-900">Access Restricted</h3>
                    <p className="text-gray-500 mt-1">You do not have permission to view the main dashboard.</p>
                </div>
            )}
        </div>
    );
};

export default HomePage;