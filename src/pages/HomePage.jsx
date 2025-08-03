import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../api/apiService';
import Spinner from '../components/Spinner';

// Utility function to format dates
const formatDate = (isoString) => {
    if (!isoString || isoString === 'Need To Update') return isoString;
    try {
        const date = new Date(isoString);
        return isNaN(date.getTime()) ? isoString : date.toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' });
    } catch (e) {
        return isoString;
    }
};

// Utility function to determine deadline color
const getDeadlineClass = (dateString) => {
    if (!dateString || dateString === 'Need To Update') return '';
    
    let parsableDateString = dateString;
    const dateRegex = /^(\d{1,2})\/(\d{1,2})\/(\d{2}|\d{4})$/;
    const match = dateString.match(dateRegex);

    if (match) {
        const [, month, day, year] = match;
        const fullYear = year.length === 2 ? `20${year}` : year;
        parsableDateString = `${fullYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }

    const deadline = new Date(parsableDateString);
    if (isNaN(deadline.getTime())) {
        return ''; 
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const sevenDaysFromNow = new Date(today);
    sevenDaysFromNow.setDate(today.getDate() + 7);

    deadline.setHours(0, 0, 0, 0);

    if (deadline < today) return 'text-red-600 font-bold';
    if (deadline <= sevenDaysFromNow) return 'text-orange-500 font-semibold';
    return 'text-green-600';
};


const HomePage = () => {
    const { user } = useAuth();
    const [data, setData] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            if (!user?.userIdentifier) return;
            setLoading(true);
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
    }, [user?.userIdentifier]);

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
            
            {!loading && !error && (
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