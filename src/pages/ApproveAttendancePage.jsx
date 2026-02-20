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
             setError("Could not load pending requests.");
        }
    }, [user.userIdentifier]);

    const loadData = useCallback(async () => {
        if (!user?.userIdentifier || !canApproveAttendance) {
            setLoading(false);
            setError("You do not have permission to approve attendance.");
            return;
        }
        setLoading(true);
        await Promise.all([fetchUsers(), fetchPendingRequests()]);
        setLoading(false);
    }, [user?.userIdentifier, canApproveAttendance, fetchUsers, fetchPendingRequests]);

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

    if (loading) {
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
                    <p className="mt-1 text-gray-600">View user calendars and approve pending requests.</p>
                </div>

                {error && !isCalendarModalOpen && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded animate-shake">{error}</div>}
                {success && <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded animate-fadeIn">{success}</div>}

                <div className="bg-white p-4 rounded-xl shadow border border-gray-100 flex justify-end">
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