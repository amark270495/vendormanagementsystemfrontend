import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../api/apiService';
import Spinner from '../components/Spinner';
import { usePermissions } from '../hooks/usePermissions';
import AttendanceApprovalModal from '../components/admin/AttendanceApprovalModal'; 

// Helper to group requests by username
const groupRequestsByUser = (requests) => {
    if (!Array.isArray(requests)) return {};
    return requests.reduce((acc, req) => {
        const username = req?.username;
        if (!username) return acc;
        if (!acc[username]) acc[username] = [];
        acc[username].push(req);
        return acc;
    }, {});
};

const ApproveAttendancePage = () => {
    const { user } = useAuth();
    const { canApproveAttendance } = usePermissions();

    const [allUsers, setAllUsers] = useState([]); 
    const [pendingRequests, setPendingRequests] = useState([]); 
    const [groupedPending, setGroupedPending] = useState({}); 
    
    // NEW: State for Weekend Requests and Tab Management
    const [activeTab, setActiveTab] = useState('attendance'); // 'attendance' | 'weekend'
    const [weekendRequests, setWeekendRequests] = useState([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    // State for the modal
    const [isCalendarModalOpen, setIsCalendarModalOpen] = useState(false);
    const [selectedUsername, setSelectedUsername] = useState(null);

    const fetchUsers = useCallback(async () => {
        try {
            const response = await apiService.getUsers(user.userIdentifier);
            if (response.data.success) {
                setAllUsers(response.data.users);
            }
        } catch (err) {
            console.error("Failed to fetch users:", err);
        }
    }, [user.userIdentifier]);

    const fetchPendingRequests = useCallback(async () => {
        try {
            const currentYear = new Date().getFullYear().toString();
            const result = await apiService.getAttendance({
                 authenticatedUsername: user.userIdentifier,
                 year: currentYear
            });

            if (result.data.success && Array.isArray(result.data.attendanceRecords)) {
                 const pending = result.data.attendanceRecords.filter(r => r.status === 'Pending');
                 setPendingRequests(pending);
                 setGroupedPending(groupRequestsByUser(pending));
            }
        } catch (err) {
             console.error("Failed to fetch pending requests:", err);
             setError("Could not load pending standard requests.");
        }
    }, [user.userIdentifier]);

    // NEW: Fetch Weekend Work Requests
    const fetchWeekendRequests = useCallback(async () => {
        try {
            const result = await apiService.getWeekendWorkRequests({
                authenticatedUsername: user.userIdentifier
            });
            // Assumes backend returns { success: true, data: [...] } where data is the list of entities
            if (result.data && result.data.success) {
                const allRequests = result.data.data || result.data.requests || [];
                // Only show pending requests to the manager
                const pending = allRequests.filter(r => r.status === 'Pending');
                setWeekendRequests(pending);
            }
        } catch (err) {
            console.error("Failed to fetch weekend requests:", err);
            // We won't block the whole page if just this fails, but we'll log it
        }
    }, [user.userIdentifier]);

    const loadData = useCallback(async () => {
        if (!user?.userIdentifier || !canApproveAttendance) {
            setLoading(false);
            setError("You do not have permission to approve attendance.");
            return;
        }
        setLoading(true);
        await Promise.all([fetchUsers(), fetchPendingRequests(), fetchWeekendRequests()]);
        setLoading(false);
    }, [user?.userIdentifier, canApproveAttendance, fetchUsers, fetchPendingRequests, fetchWeekendRequests]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const filteredUsers = useMemo(() => {
        if (!searchTerm) return allUsers;
        const lowerSearch = searchTerm.toLowerCase();
        return allUsers.filter(u => 
            (u.displayName && u.displayName.toLowerCase().includes(lowerSearch)) ||
            (u.username && u.username.toLowerCase().includes(lowerSearch))
        );
    }, [allUsers, searchTerm]);

    const handleUserClick = (username) => {
         if (username) {
            setSelectedUsername(username);
            setIsCalendarModalOpen(true);
         }
    };

    const handleApprovalComplete = () => {
        setIsCalendarModalOpen(false); 
        setSelectedUsername(null);
        setSuccess('Attendance action completed successfully.');
        fetchPendingRequests(); 
        setTimeout(() => setSuccess(''), 3000);
    };

    // NEW: Handle Weekend Approval Action
    const handleWeekendApproval = async (request, statusAction) => {
        setLoading(true);
        setError('');
        setSuccess('');
        try {
            const res = await apiService.approveWeekendWork({
                employeeEmail: request.partitionKey, // Azure Table Key
                requestId: request.rowKey,           // Azure Table Key
                status: statusAction,
                managerNotes: "" // Optional: You could add a prompt here to collect notes if needed
            });

            if (res.data.success) {
                setSuccess(`Weekend request ${statusAction.toLowerCase()} successfully!`);
                await fetchWeekendRequests(); // Refresh the list
                setTimeout(() => setSuccess(''), 3000);
            } else {
                setError(res.data.message || "Failed to process weekend approval.");
            }
        } catch (err) {
            setError(err.message || "An error occurred while processing the approval.");
        } finally {
            setLoading(false);
        }
    };

    if (loading && !isCalendarModalOpen && allUsers.length === 0) {
        return <div className="flex justify-center items-center h-64"><Spinner size="12" /></div>;
    }

    if (!canApproveAttendance) {
        return (
            <div className="text-center text-gray-500 p-10 bg-white rounded-xl shadow-sm border">
                <h3 className="text-lg font-medium">Access Denied</h3>
                <p className="mt-1 text-sm text-gray-500">You do not have permission.</p>
            </div>
        );
    }

    return (
        <>
            <div className="space-y-6">
                 <div>
                    <h1 className="text-3xl font-bold text-gray-900">Attendance Management</h1>
                    <p className="mt-1 text-gray-600">Review pending shifts and weekend work requests.</p>
                </div>

                {error && !isCalendarModalOpen && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded animate-shake">{error}</div>}
                {success && <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded animate-fadeIn">{success}</div>}

                {/* --- TAB NAVIGATION --- */}
                <div className="flex space-x-2 border-b border-gray-200">
                    <button 
                        onClick={() => setActiveTab('attendance')}
                        className={`py-3 px-6 text-sm font-bold border-b-2 transition-colors duration-200 ${
                            activeTab === 'attendance' 
                                ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50 rounded-t-lg' 
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                    >
                        Standard Shifts
                    </button>
                    <button 
                        onClick={() => setActiveTab('weekend')}
                        className={`py-3 px-6 text-sm font-bold border-b-2 transition-colors duration-200 flex items-center ${
                            activeTab === 'weekend' 
                                ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50 rounded-t-lg' 
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                    >
                        Weekend Requests
                        {weekendRequests.length > 0 && (
                            <span className="ml-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                                {weekendRequests.length}
                            </span>
                        )}
                    </button>
                </div>

                {/* --- TAB CONTENT: STANDARD SHIFTS --- */}
                {activeTab === 'attendance' && (
                    <div className="animate-fadeIn">
                        <div className="bg-white p-4 rounded-xl shadow border border-gray-100 flex justify-end mb-4">
                            <input
                                type="text"
                                placeholder="Search users..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full sm:w-72 px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                            />
                        </div>

                        <div className="bg-white rounded-xl shadow border border-gray-100 overflow-hidden">
                            <div className="overflow-x-auto">
                                {filteredUsers.length > 0 ? (
                                     <ul className="divide-y divide-gray-200">
                                        {filteredUsers.map(u => {
                                            const pendingCount = groupedPending[u.username]?.length || 0;
                                            return (
                                                <li key={u.username}
                                                    className="flex items-center justify-between py-4 px-5 hover:bg-gray-50 transition-colors"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold">
                                                            {u.displayName?.charAt(0).toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <p className="font-medium text-gray-900">{u.displayName}</p>
                                                            <p className="text-xs text-gray-500">{u.username}</p>
                                                        </div>
                                                        {pendingCount > 0 && (
                                                            <span className="ml-2 px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                                                                {pendingCount} Pending Request{pendingCount !== 1 ? 's' : ''}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <button
                                                        onClick={() => handleUserClick(u.username)}
                                                        className="px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition shadow-sm"
                                                    >
                                                        View Calendar
                                                    </button>
                                                </li>
                                            );
                                        })}
                                    </ul>
                                ) : (
                                     <p className="text-center text-gray-500 py-10">No users found.</p>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* --- TAB CONTENT: WEEKEND REQUESTS --- */}
                {activeTab === 'weekend' && (
                    <div className="bg-white rounded-xl shadow border border-gray-100 overflow-hidden animate-fadeIn">
                        {loading && weekendRequests.length === 0 ? (
                            <div className="py-10 text-center"><Spinner size="8" /></div>
                        ) : weekendRequests.length > 0 ? (
                            <ul className="divide-y divide-gray-200">
                                {weekendRequests.map(req => (
                                    <li key={req.rowKey} className="p-5 flex flex-col lg:flex-row justify-between items-start lg:items-center hover:bg-slate-50 transition-colors">
                                        <div className="mb-4 lg:mb-0">
                                            <div className="flex items-center gap-3 mb-1">
                                                <p className="font-bold text-gray-900 text-lg">{req.partitionKey}</p>
                                                <span className="bg-indigo-100 text-indigo-800 text-xs font-bold px-2.5 py-1 rounded-md border border-indigo-200">
                                                    {new Date(req.date + 'T00:00:00Z').toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', timeZone: 'UTC' })}
                                                </span>
                                            </div>
                                            <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 mt-2 text-sm text-gray-700">
                                                <span className="font-semibold block text-gray-500 text-xs uppercase tracking-wider mb-1">Business Justification:</span>
                                                {req.reason}
                                            </div>
                                            {req.submittedAt && (
                                                <p className="text-xs text-gray-400 mt-2">Submitted: {new Date(req.submittedAt).toLocaleString()}</p>
                                            )}
                                        </div>
                                        
                                        <div className="flex gap-3 w-full lg:w-auto">
                                            <button 
                                                onClick={() => handleWeekendApproval(req, 'Rejected')}
                                                disabled={loading}
                                                className="flex-1 lg:flex-none px-4 py-2 border border-red-200 text-red-700 bg-white hover:bg-red-50 font-bold text-sm rounded-lg transition-colors shadow-sm disabled:opacity-50"
                                            >
                                                Reject
                                            </button>
                                            <button 
                                                onClick={() => handleWeekendApproval(req, 'Approved')}
                                                disabled={loading}
                                                className="flex-1 lg:flex-none px-6 py-2 bg-emerald-600 text-white hover:bg-emerald-500 font-bold text-sm rounded-lg transition-colors shadow-sm disabled:opacity-50"
                                            >
                                                Approve Work
                                            </button>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <div className="py-16 flex flex-col items-center justify-center text-center">
                                <div className="h-16 w-16 bg-gray-50 rounded-full flex items-center justify-center mb-4 border border-gray-100">
                                    <svg className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <h3 className="text-lg font-bold text-gray-900">All caught up!</h3>
                                <p className="text-gray-500 mt-1 max-w-sm">There are no pending weekend work requests requiring your approval right now.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {selectedUsername && (
                <AttendanceApprovalModal
                    isOpen={isCalendarModalOpen}
                    onClose={() => {
                        setIsCalendarModalOpen(false);
                        setSelectedUsername(null);
                        fetchPendingRequests();
                    }}
                    selectedUsername={selectedUsername}
                    onApprovalComplete={handleApprovalComplete}
                />
            )}
        </>
    );
};

export default ApproveAttendancePage;