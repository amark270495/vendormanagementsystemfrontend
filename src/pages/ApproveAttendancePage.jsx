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

    // State for Weekend Requests and Tab Management
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

    // Fetch Weekend Work Requests
    const fetchWeekendRequests = useCallback(async () => {
        try {
            const result = await apiService.getWeekendWorkRequests({
                authenticatedUsername: user.userIdentifier
            });
            if (result.data && result.data.success) {
                const allRequests = result.data.data || result.data.requests || [];
                const pending = allRequests.filter(r => r.status === 'Pending');
                setWeekendRequests(pending);
            }
        } catch (err) {
            console.error("Failed to fetch weekend requests:", err);
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

    const handleWeekendApproval = async (request, statusAction) => {
        setLoading(true);
        setError('');
        setSuccess('');
        try {
            const res = await apiService.approveWeekendWork({
                employeeEmail: request.partitionKey,
                requestId: request.rowKey,
                status: statusAction,
                managerNotes: "" 
            });

            if (res.data.success) {
                setSuccess(`Weekend request ${statusAction.toLowerCase()} successfully!`);
                await fetchWeekendRequests();
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
        return (
            <div className="flex justify-center items-center min-h-[400px]">
                <Spinner size="12" />
            </div>
        );
    }

    if (!canApproveAttendance) {
        return (
            <div className="max-w-2xl mx-auto mt-12 text-center bg-white p-12 rounded-2xl shadow-sm border border-gray-100">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-50 mb-6">
                    <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900">Access Denied</h3>
                <p className="mt-2 text-gray-500">You do not have the required permissions to access this module.</p>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="space-y-8">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Attendance Approvals</h1>
                        <p className="mt-2 text-sm text-gray-500">Manage and review pending shifts and weekend work requests.</p>
                    </div>
                </div>

                {/* Alerts */}
                {error && !isCalendarModalOpen && (
                    <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md animate-in fade-in slide-in-from-top-2">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div className="ml-3"><p className="text-sm text-red-700">{error}</p></div>
                        </div>
                    </div>
                )}
                {success && (
                    <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-md animate-in fade-in slide-in-from-top-2">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div className="ml-3"><p className="text-sm text-green-700">{success}</p></div>
                        </div>
                    </div>
                )}

                {/* Tabs Navigation */}
                <div className="border-b border-gray-200">
                    <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                        <button
                            onClick={() => setActiveTab('attendance')}
                            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                                activeTab === 'attendance'
                                    ? 'border-indigo-500 text-indigo-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                        >
                            Standard Shifts
                        </button>
                        <button
                            onClick={() => setActiveTab('weekend')}
                            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors flex items-center gap-2 ${
                                activeTab === 'weekend'
                                    ? 'border-indigo-500 text-indigo-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                        >
                            Weekend Requests
                            {weekendRequests.length > 0 && (
                                <span className={`inline-flex items-center justify-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                    activeTab === 'weekend' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600'
                                }`}>
                                    {weekendRequests.length}
                                </span>
                            )}
                        </button>
                    </nav>
                </div>

                {/* Tab Content: Standard Shifts */}
                {activeTab === 'attendance' && (
                    <div className="space-y-4 animate-in fade-in duration-300">
                        <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                            <div className="relative w-full sm:max-w-md">
                                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                    <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <input
                                    type="text"
                                    placeholder="Search by name or email..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="block w-full rounded-lg border-0 py-2.5 pl-10 pr-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 transition-all"
                                />
                            </div>
                        </div>

                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                            {filteredUsers.length > 0 ? (
                                <ul className="divide-y divide-gray-100">
                                    {filteredUsers.map(u => {
                                        const pendingCount = groupedPending[u.username]?.length || 0;
                                        return (
                                            <li key={u.username} className="group hover:bg-gray-50 transition-colors duration-200">
                                                <div className="flex items-center justify-between px-6 py-5">
                                                    <div className="flex items-center min-w-0 gap-x-4">
                                                        <div className="hidden sm:flex h-12 w-12 flex-none items-center justify-center rounded-full bg-gradient-to-br from-indigo-100 to-blue-50 border border-indigo-100">
                                                            <span className="text-lg font-semibold text-indigo-700">
                                                                {u.displayName?.charAt(0).toUpperCase()}
                                                            </span>
                                                        </div>
                                                        <div className="min-w-0 flex-auto">
                                                            <p className="text-sm font-semibold leading-6 text-gray-900 truncate">{u.displayName}</p>
                                                            <p className="mt-1 flex text-xs leading-5 text-gray-500 truncate">{u.username}</p>
                                                        </div>
                                                        {pendingCount > 0 && (
                                                            <div className="hidden sm:flex items-center gap-x-1.5 rounded-md bg-amber-50 px-2 py-1 text-xs font-medium text-amber-700 ring-1 ring-inset ring-amber-600/20">
                                                                <div className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                                                                {pendingCount} Pending
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="flex shrink-0 items-center gap-x-4">
                                                        <button
                                                            onClick={() => handleUserClick(u.username)}
                                                            className="hidden sm:block rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 transition-all"
                                                        >
                                                            Review Calendar
                                                        </button>
                                                        {/* Mobile button variant */}
                                                        <button
                                                            onClick={() => handleUserClick(u.username)}
                                                            className="sm:hidden text-indigo-600 font-medium text-sm"
                                                        >
                                                            Review
                                                        </button>
                                                    </div>
                                                </div>
                                            </li>
                                        );
                                    })}
                                </ul>
                            ) : (
                                <div className="text-center py-16">
                                    <svg className="mx-auto h-12 w-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                    </svg>
                                    <h3 className="mt-2 text-sm font-semibold text-gray-900">No users found</h3>
                                    <p className="mt-1 text-sm text-gray-500">Try adjusting your search terminology.</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Tab Content: Weekend Requests */}
                {activeTab === 'weekend' && (
                    <div className="space-y-4 animate-in fade-in duration-300">
                        {loading && weekendRequests.length === 0 ? (
                            <div className="flex justify-center items-center py-20 bg-white rounded-xl border border-gray-200">
                                <Spinner size="8" />
                            </div>
                        ) : weekendRequests.length > 0 ? (
                            <div className="grid grid-cols-1 gap-6">
                                {weekendRequests.map(req => (
                                    <div key={req.rowKey} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-200">
                                        <div className="p-6">
                                            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <h3 className="text-lg font-semibold text-gray-900">{req.partitionKey}</h3>
                                                        <span className="inline-flex items-center rounded-md bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700 ring-1 ring-inset ring-indigo-700/10">
                                                            {new Date(req.date + 'T00:00:00Z').toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', timeZone: 'UTC' })}
                                                        </span>
                                                    </div>
                                                    
                                                    <div className="mt-4 bg-gray-50 rounded-lg p-4 border border-gray-100">
                                                        <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Business Justification</h4>
                                                        <p className="text-sm text-gray-700 whitespace-pre-wrap">{req.reason}</p>
                                                    </div>
                                                    
                                                    {req.submittedAt && (
                                                        <p className="text-xs text-gray-400 mt-4 flex items-center gap-1">
                                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                            </svg>
                                                            Submitted: {new Date(req.submittedAt).toLocaleString()}
                                                        </p>
                                                    )}
                                                </div>
                                                
                                                <div className="flex flex-row md:flex-col gap-3 w-full md:w-40 shrink-0">
                                                    <button
                                                        onClick={() => handleWeekendApproval(req, 'Approved')}
                                                        disabled={loading}
                                                        className="w-full justify-center inline-flex items-center gap-x-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 transition-colors disabled:opacity-50"
                                                    >
                                                        Approve
                                                    </button>
                                                    <button
                                                        onClick={() => handleWeekendApproval(req, 'Rejected')}
                                                        disabled={loading}
                                                        className="w-full justify-center inline-flex items-center gap-x-2 rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 transition-colors disabled:opacity-50 text-red-600 hover:text-red-700"
                                                    >
                                                        Decline
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-20 bg-white rounded-xl border border-gray-200 border-dashed">
                                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-50 mb-4">
                                    <svg className="h-8 w-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                                <h3 className="text-base font-semibold text-gray-900">Inbox Zero</h3>
                                <p className="mt-1 text-sm text-gray-500 max-w-sm mx-auto">You're all caught up! There are no pending weekend work requests to review.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Modal remains outside the main flow */}
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
        </div>
    );
};

export default ApproveAttendancePage;