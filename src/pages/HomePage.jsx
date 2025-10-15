import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../api/apiService';
import Spinner from '../components/Spinner';
import { formatDate, getDeadlineClass } from '../utils/helpers';
import { usePermissions } from '../hooks/usePermissions';

const HomePage = () => {
    const { user } = useAuth();
    // NEW: Destructure canViewDashboards from usePermissions (assuming home page view is tied to dashboards)
    const { canViewDashboards } = usePermissions(); 

    const [data, setData] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    
    // NEW: State for overall job statistics (Open, Closed, Total)
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
                
                // Calculate aggregated stats from the fetched data
                let openCount = 0;
                Object.values(fetchedData).forEach(jobs => {
                    openCount += jobs.length;
                });
                
                // Set stats based on returned open jobs
                setStats({ 
                    totalJobs: openCount, 
                    openJobs: openCount, 
                    closedJobs: 0 
                });

            } else {
                setError(response.data.message);
            }
        } catch (err) {
            const errorMessage = err.response?.data?.message || "Failed to fetch home page data.";
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    }, [user?.userIdentifier, canViewDashboards]); // Dependencies for useCallback

    useEffect(() => {
        fetchData();
    }, [fetchData]); // Dependency array now correctly uses fetchData

    const WelcomeBanner = () => (
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 mb-6 flex justify-between items-center">
            <div>
                <h1 className="text-3xl font-bold text-gray-800">Welcome, {user?.displayName || 'User'}!</h1>
                <p className="text-gray-600 mt-1">Your **VMS Portal** job summary is ready for review.</p>
            </div>
            <button
                onClick={fetchData}
                className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition"
                disabled={loading}
            >
                {loading ? <Spinner size="4" /> : 'Refresh Data'}
            </button>
        </div>
    );
    
    const MetricCard = ({ title, value, colorClass }) => (
        <div className="bg-white p-5 rounded-xl shadow-md border border-gray-100">
            <p className="text-sm font-medium text-gray-500 uppercase">{title}</p>
            <p className={`text-3xl font-extrabold mt-1 ${colorClass}`}>{value}</p>
        </div>
    );

    return (
        <div className="space-y-6">
            <WelcomeBanner />

            {loading && <div className="flex justify-center items-center h-64"><Spinner /></div>}
            {error && <div className="bg-red-50 text-red-700 p-4 rounded-lg border border-red-200">Error: {error}</div>}
            
            {!loading && !error && canViewDashboards && (
                <>
                    {/* --- 1. Metric Overview Cards --- */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        <MetricCard title="Total Open Jobs" value={stats.openJobs} colorClass="text-indigo-600" />
                        <MetricCard title="Total Resumes Submitted (Placeholder)" value={"N/A"} colorClass="text-gray-600" />
                        <MetricCard title="Avg Time to Fill (Placeholder)" value={"N/A"} colorClass="text-gray-600" />
                    </div>

                    {/* --- 2. Assigned Jobs Breakdown --- */}
                    <h2 className="text-xl font-bold text-gray-800 pt-4 border-t border-gray-200">Team Job Pipeline ({stats.openJobs} Open Jobs)</h2>

                    {Object.keys(data).length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {Object.entries(data).map(([assignee, jobs]) => (
                                <div key={assignee} className="bg-white rounded-xl shadow-lg border border-indigo-100 flex flex-col h-full">
                                    <div className="p-4 border-b border-indigo-200 bg-indigo-50 rounded-t-xl">
                                        <h2 className="text-md font-extrabold text-indigo-800 uppercase truncate">{assignee}</h2>
                                        <p className="text-sm text-indigo-600 font-semibold">{jobs.length} Open Job(s)</p>
                                    </div>
                                    <div className="p-3 space-y-3 overflow-y-auto flex-grow" style={{maxHeight: '40vh'}}>
                                        {jobs.map(job => (
                                            <div key={job.postingId} className="p-4 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-all shadow-sm">
                                                <p className="text-sm font-semibold text-gray-800 mb-1 leading-tight">{job.jobTitle}</p>
                                                <p className="text-xs text-gray-600 truncate">{job.clientName}</p>
                                                <div className="flex justify-between items-center pt-2 mt-2 border-t border-gray-200">
                                                    <p className="text-xs font-medium text-gray-500">ID: {job.postingId}</p>
                                                    <p className={`text-xs font-bold ${getDeadlineClass(job.deadline)}`}>
                                                        {formatDate(job.deadline)}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center text-gray-500 p-10 bg-white rounded-xl shadow-sm border">
                            <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                            <h3 className="mt-2 text-sm font-medium text-gray-900">No Open Jobs</h3>
                            <p className="mt-1 text-sm text-gray-500">There are currently no active job postings assigned to the team.</p>
                        </div>
                    )
                )}
                </>
            )}
            
            {!loading && !error && !canViewDashboards && (
                <div className="text-center text-gray-500 p-10 bg-white rounded-xl shadow-sm border">
                    <h3 className="text-lg font-medium">Access Denied</h3>
                    <p className="mt-1 text-sm text-gray-500">You do not have the necessary permissions to view the home page dashboard.</p>
                </div>
            )}
        </div>
    );
};

export default HomePage;