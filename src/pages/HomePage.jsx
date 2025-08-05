import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../api/apiService';
import Spinner from '../components/Spinner';
import { formatDate, getDeadlineClass } from '../utils/helpers';
import { usePermissions } from '../hooks/usePermissions'; // <-- NEW: Import usePermissions

const HomePage = () => {
    const { user } = useAuth();
    // NEW: Destructure canViewDashboards from usePermissions (assuming home page view is tied to dashboards)
    const { canViewDashboards } = usePermissions(); 

    const [data, setData] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            if (!user?.userIdentifier) return;
            setLoading(true);
            setError(''); // Clear previous errors
            // Only attempt to fetch data if the user has permission
            if (!canViewDashboards) { // NEW: Check canViewDashboards permission
                setLoading(false);
                setError("You do not have permission to view the home page dashboard.");
                return;
            }
            try {
                const response = await apiService.getHomePageData(user.userIdentifier);
                if (response.data.success) {
                    setData(response.data.data);
                } else {
                    setError(response.data.message);
                }
            } catch (err) {
                const errorMessage = err.response?.data?.message || "Failed to fetch home page data.";
                setError(errorMessage);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [user?.userIdentifier, canViewDashboards]); // Add canViewDashboards to dependencies

    const WelcomeBanner = () => (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-6">
            <h1 className="text-3xl font-bold text-gray-800">Welcome, {user?.displayName || 'User'}!</h1>
            <p className="text-gray-600 mt-1">Here's a summary of open jobs assigned across the team.</p>
        </div>
    );

    return (
        <div className="space-y-6">
            <WelcomeBanner />

            {loading && <div className="flex justify-center items-center h-64"><Spinner /></div>}
            {error && <div className="bg-red-50 text-red-700 p-4 rounded-lg border border-red-200">Error: {error}</div>}
            
            {!loading && !error && !canViewDashboards && ( // NEW: Access Denied message if no view permission
                <div className="text-center text-gray-500 p-10 bg-white rounded-xl shadow-sm border">
                    <h3 className="text-lg font-medium">Access Denied</h3>
                    <p className="mt-1 text-sm text-gray-500">You do not have the necessary permissions to view the home page dashboard.</p>
                </div>
            )}

            {!loading && !error && canViewDashboards && ( // NEW: Render content only if canViewDashboards
                Object.keys(data).length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {Object.entries(data).map(([assignee, jobs]) => (
                            <div key={assignee} className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col">
                                <div className="p-5 border-b border-gray-200">
                                    <h2 className="text-lg font-bold text-indigo-800">{assignee}</h2>
                                    <p className="text-sm text-gray-500">{jobs.length} open job(s)</p>
                                </div>
                                <div className="p-3 space-y-3 overflow-y-auto" style={{maxHeight: '20rem'}}>
                                    {jobs.map(job => (
                                        <div key={job.postingId} className="p-4 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-all">
                                            <p className="font-semibold text-gray-800 truncate">{job.jobTitle}</p>
                                            <p className="text-sm text-gray-600">{job.clientName}</p>
                                            <p className={`text-sm mt-2 ${getDeadlineClass(job.deadline)}`}>
                                                <span className="font-medium">Deadline:</span> {formatDate(job.deadline)}
                                            </p>
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
                        <p className="mt-1 text-sm text-gray-500">There are currently no open job postings to display.</p>
                    </div>
                )
            )}
        </div>
    );
};

export default HomePage;