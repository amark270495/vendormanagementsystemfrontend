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

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-800">Home - Open Jobs Summary</h1>
            {loading && <div className="flex justify-center items-center h-64"><Spinner /></div>}
            {error && <div className="text-red-500 bg-red-100 p-4 rounded-lg">Error: {error}</div>}
            
            {!loading && !error && (
                Object.keys(data).length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {Object.entries(data).map(([assignee, jobs]) => (
                            <div key={assignee} className="bg-white p-6 rounded-lg shadow-md border">
                                <h2 className="text-xl font-semibold text-indigo-700 mb-4 border-b pb-2">{assignee}</h2>
                                <div className="space-y-3 max-h-80 overflow-y-auto">
                                    {jobs.map(job => (
                                        <div key={job.postingId} className="p-3 bg-slate-50 rounded-md">
                                            <p className="font-bold text-gray-800">{job.jobTitle}</p>
                                            <p className="text-sm text-gray-600">{job.clientName}</p>
                                            <p className={`text-sm font-medium ${getDeadlineClass(job.deadline)}`}>
                                                Deadline: {formatDate(job.deadline)}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-center text-gray-500 p-4">No open job postings found.</p>
                )
            )}
        </div>
    );
};

export default HomePage;