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

// Utility for CSV Export
const exportToCSV = (data, filename) => {
    if (!data || !data.length) return;
    const headers = Object.keys(data).join(',');
    const rows = data.map(row => 
        Object.values(row).map(val => `"${String(val).replace(/"/g, '""')}"`).join(',')
    ).join('\n');
    const blob = new Blob([`${headers}\n${rows}`], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

const ApproveAttendancePage = () => {
    const { user } = useAuth();
    const { canApproveAttendance } = usePermissions();

    // Data State
    const [allUsers, setAllUsers] = useState([]);
    const [pendingRequests, setPendingRequests] = useState([]);
    const [groupedPending, setGroupedPending] = useState({});
    const [weekendRequests, setWeekendRequests] = useState([]);

    // UI & Tab State
    const [activeTab, setActiveTab] = useState('attendance');
    const [loading, setLoading] = useState(true);
    const [processingBulk, setProcessingBulk] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Enterprise Filters & Pagination State
    const [searchTerm, setSearchTerm] = useState('');
    const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'desc' });
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    
    // Bulk Actions State
    const [selectedWeekendRows, setSelectedWeekendRows] = useState(new Set());

    // Modal State
    const [isCalendarModalOpen, setIsCalendarModalOpen] = useState(false);
    const [selectedUsername, setSelectedUsername] = useState(null);

    // --- FETCH DATA ---
    const fetchUsers = useCallback(async () => {
        try {
            const response = await apiService.getUsers(user.userIdentifier);
            if (response.data.success) setAllUsers(response.data.users);
        } catch (err) { console.error("Failed to fetch users:", err); }
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
        } catch (err) { setError("Could not load standard requests."); }
    }, [user.userIdentifier]);

    const fetchWeekendRequests = useCallback(async () => {
        try {
            const result = await apiService.getWeekendWorkRequests({
                authenticatedUsername: user.userIdentifier
            });
            if (result.data && result.data.success) {
                const allReqs = result.data.data || result.data.requests || [];
                setWeekendRequests(allReqs.filter(r => r.status === 'Pending'));
            }
        } catch (err) { console.error("Failed to fetch weekend requests:", err); }
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

    useEffect(() => { loadData(); }, [loadData]);

    // Reset pagination and selection when tab changes
    useEffect(() => {
        setCurrentPage(1);
        setSelectedWeekendRows(new Set());
    }, [activeTab, searchTerm]);

    // --- MEMOIZED & FILTERED DATA ---
    const processedUsers = useMemo(() => {
        let filtered = allUsers;
        if (searchTerm) {
            const lowerSearch = searchTerm.toLowerCase();
            filtered = filtered.filter(u => 
                (u.displayName && u.displayName.toLowerCase().includes(lowerSearch)) ||
                (u.username && u.username.toLowerCase().includes(lowerSearch))
            );
        }
        // Enterprise sort: bubble users with pending requests to top
        return filtered.sort((a, b) => {
            const aPending = groupedPending[a.username]?.length || 0;
            const bPending = groupedPending[b.username]?.length || 0;
            return bPending - aPending;
        });
    }, [allUsers, searchTerm, groupedPending]);

    const processedWeekendRequests = useMemo(() => {
        let filtered = weekendRequests;
        if (searchTerm) {
            const lowerSearch = searchTerm.toLowerCase();
            filtered = filtered.filter(req => 
                req.partitionKey.toLowerCase().includes(lowerSearch) ||
                req.reason.toLowerCase().includes(lowerSearch)
            );
        }
        return filtered.sort((a, b) => {
            if (sortConfig.key === 'date') {
                return sortConfig.direction === 'asc' 
                    ? new Date(a.date) - new Date(b.date)
                    : new Date(b.date) - new Date(a.date);
            }
            return 0;
        });
    }, [weekendRequests, searchTerm, sortConfig]);

    // --- PAGINATION LOGIC ---
    const getPaginatedData = (data) => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return data.slice(startIndex, startIndex + itemsPerPage);
    };

    const currentUsers = getPaginatedData(processedUsers);
    const currentWeekendReqs = getPaginatedData(processedWeekendRequests);
    const totalPages = Math.ceil((activeTab === 'attendance' ? processedUsers.length : processedWeekendRequests.length) / itemsPerPage);

    // --- HANDLERS ---
    const handleWeekendApproval = async (request, statusAction) => {
        setLoading(true);
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
                setError(res.data.message || "Failed to process approval.");
            }
        } catch (err) {
            setError(err.message || "An error occurred.");
        } finally {
            setLoading(false);
        }
    };

    const handleBulkWeekendApproval = async (statusAction) => {
        if (selectedWeekendRows.size === 0) return;
        setProcessingBulk(true);
        setError('');
        
        const requestsToProcess = weekendRequests.filter(req => selectedWeekendRows.has(req.rowKey));
        let successCount = 0;

        // Process sequentially or via Promise.all depending on backend rate limits. Using sequential for safety.
        for (const req of requestsToProcess) {
            try {
                const res = await apiService.approveWeekendWork({
                    employeeEmail: req.partitionKey,
                    requestId: req.rowKey,
                    status: statusAction,
                    managerNotes: "Bulk Processed"
                });
                if (res.data.success) successCount++;
            } catch (e) {
                console.error("Bulk action failed for", req.rowKey, e);
            }
        }

        setSuccess(`Successfully ${statusAction.toLowerCase()} ${successCount} requests.`);
        setSelectedWeekendRows(new Set());
        await fetchWeekendRequests();
        setProcessingBulk(false);
        setTimeout(() => setSuccess(''), 4000);
    };

    const handleSelectAllWeekend = (e) => {
        if (e.target.checked) {
            const allIds = currentWeekendReqs.map(req => req.rowKey);
            setSelectedWeekendRows(new Set([...selectedWeekendRows, ...allIds]));
        } else {
            const newSet = new Set(selectedWeekendRows);
            currentWeekendReqs.forEach(req => newSet.delete(req.rowKey));
            setSelectedWeekendRows(newSet);
        }
    };

    const toggleWeekendSelection = (rowKey) => {
        const newSet = new Set(selectedWeekendRows);
        if (newSet.has(rowKey)) newSet.delete(rowKey);
        else newSet.add(rowKey);
        setSelectedWeekendRows(newSet);
    };

    const handleExport = () => {
        if (activeTab === 'attendance') {
            const exportData = processedUsers.map(u => ({
                Name: u.displayName,
                Email: u.username,
                Pending_Requests: groupedPending[u.username]?.length || 0
            }));
            exportToCSV(exportData, 'Standard_Shifts_Report');
        } else {
            const exportData = processedWeekendRequests.map(r => ({
                Employee: r.partitionKey,
                Date: r.date,
                Reason: r.reason,
                Submitted: r.submittedAt
            }));
            exportToCSV(exportData, 'Weekend_Requests_Report');
        }
    };

    // --- RENDER HELPERS ---
    if (loading && allUsers.length === 0) {
        return <div className="flex justify-center items-center min-h-[400px]"><Spinner size="12" /></div>;
    }

    if (!canApproveAttendance) {
        return (
            <div className="max-w-3xl mx-auto mt-12 text-center bg-white p-16 rounded-2xl shadow-sm border border-gray-200">
                <h3 className="text-2xl font-bold text-gray-900">Access Restricted</h3>
                <p className="mt-2 text-gray-500">Your current role does not have the necessary privileges to view this workspace.</p>
            </div>
        );
    }

    return (
        <div className="w-full bg-gray-50 min-h-screen pb-12">
            <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                
                {/* Header & Global Actions */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Attendance Center</h1>
                        <p className="mt-1 text-sm text-gray-500">Enterprise management console for workforce scheduling and approvals.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button onClick={handleExport} className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all">
                            <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                            Export CSV
                        </button>
                    </div>
                </div>

                {/* Alerts */}
                {error && <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-md"><p className="text-sm text-red-700 font-medium">{error}</p></div>}
                {success && <div className="mb-6 bg-green-50 border-l-4 border-green-500 p-4 rounded-md"><p className="text-sm text-green-700 font-medium">{success}</p></div>}

                {/* Main Workspace Card */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    
                    {/* Tabs */}
                    <div className="border-b border-gray-200 bg-gray-50/50 px-6">
                        <nav className="-mb-px flex space-x-8">
                            <button onClick={() => setActiveTab('attendance')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'attendance' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
                                Standard Shifts
                            </button>
                            <button onClick={() => setActiveTab('weekend')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors flex items-center gap-2 ${activeTab === 'weekend' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
                                Weekend Requests
                                {weekendRequests.length > 0 && (
                                    <span className={`inline-flex items-center justify-center rounded-full px-2 py-0.5 text-xs font-bold ${activeTab === 'weekend' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-200 text-gray-700'}`}>
                                        {weekendRequests.length}
                                    </span>
                                )}
                            </button>
                        </nav>
                    </div>

                    {/* Toolbar (Search & Filters) */}
                    <div className="p-6 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-center gap-4 bg-white">
                        <div className="relative w-full sm:max-w-md">
                            <input
                                type="text"
                                placeholder={`Search ${activeTab === 'attendance' ? 'employees' : 'requests'}...`}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="block w-full rounded-lg border-gray-300 pl-10 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            />
                            <svg className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                        </div>

                        {/* Bulk Action Bar (Only for weekend tab currently) */}
                        {activeTab === 'weekend' && selectedWeekendRows.size > 0 && (
                            <div className="flex items-center gap-3 animate-in fade-in bg-indigo-50 px-4 py-2 rounded-lg border border-indigo-100">
                                <span className="text-sm font-medium text-indigo-800">{selectedWeekendRows.size} selected</span>
                                <div className="h-4 w-px bg-indigo-200"></div>
                                <button onClick={() => handleBulkWeekendApproval('Approved')} disabled={processingBulk} className="text-sm font-semibold text-indigo-700 hover:text-indigo-900 disabled:opacity-50">Approve All</button>
                                <button onClick={() => handleBulkWeekendApproval('Rejected')} disabled={processingBulk} className="text-sm font-semibold text-red-600 hover:text-red-800 disabled:opacity-50">Decline All</button>
                            </div>
                        )}
                    </div>

                    {/* Data Tables */}
                    <div className="overflow-x-auto">
                        {activeTab === 'attendance' ? (
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Employee</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Email ID</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Pending Tasks</th>
                                        <th scope="col" className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {currentUsers.length > 0 ? currentUsers.map(u => {
                                        const pendingCount = groupedPending[u.username]?.length || 0;
                                        return (
                                            <tr key={u.username} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs">{u.displayName?.charAt(0)}</div>
                                                        <div className="ml-4 font-medium text-gray-900">{u.displayName}</div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{u.username}</td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {pendingCount > 0 ? (
                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                                                            {pendingCount} Pending
                                                        </span>
                                                    ) : (
                                                        <span className="text-sm text-gray-400">Up to date</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                    <button onClick={() => { setSelectedUsername(u.username); setIsCalendarModalOpen(true); }} className="text-indigo-600 hover:text-indigo-900 font-semibold">
                                                        Review Calendar &rarr;
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    }) : <tr><td colSpan="4" className="px-6 py-12 text-center text-gray-500">No employees found.</td></tr>}
                                </tbody>
                            </table>
                        ) : (
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th scope="col" className="px-6 py-3 text-left">
                                            <input type="checkbox" className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" 
                                                onChange={handleSelectAllWeekend} 
                                                checked={currentWeekendReqs.length > 0 && selectedWeekendRows.size === currentWeekendReqs.length} 
                                            />
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Employee</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => setSortConfig({ key: 'date', direction: sortConfig.direction === 'asc' ? 'desc' : 'asc' })}>
                                            <div className="flex items-center">Date {sortConfig.key === 'date' && (sortConfig.direction === 'asc' ? '↑' : '↓')}</div>
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Business Justification</th>
                                        <th scope="col" className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {currentWeekendReqs.length > 0 ? currentWeekendReqs.map(req => (
                                        <tr key={req.rowKey} className={selectedWeekendRows.has(req.rowKey) ? 'bg-indigo-50/30' : 'hover:bg-gray-50'}>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <input type="checkbox" className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                                    checked={selectedWeekendRows.has(req.rowKey)}
                                                    onChange={() => toggleWeekendSelection(req.rowKey)}
                                                />
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{req.partitionKey}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {new Date(req.date + 'T00:00:00Z').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate" title={req.reason}>
                                                {req.reason}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <div className="flex justify-end gap-2">
                                                    <button onClick={() => handleWeekendApproval(req, 'Approved')} disabled={processingBulk} className="px-3 py-1.5 bg-green-50 text-green-700 hover:bg-green-100 rounded border border-green-200 transition-colors">Approve</button>
                                                    <button onClick={() => handleWeekendApproval(req, 'Rejected')} disabled={processingBulk} className="px-3 py-1.5 bg-white text-gray-700 hover:bg-red-50 hover:text-red-700 border border-gray-300 hover:border-red-200 rounded transition-colors">Reject</button>
                                                </div>
                                            </td>
                                        </tr>
                                    )) : <tr><td colSpan="5" className="px-6 py-12 text-center text-gray-500">No pending weekend requests.</td></tr>}
                                </tbody>
                            </table>
                        )}
                    </div>

                    {/* Enterprise Pagination Controls */}
                    <div className="bg-white px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                        <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                            <div>
                                <p className="text-sm text-gray-700">
                                    Showing <span className="font-medium">{((currentPage - 1) * itemsPerPage) + 1}</span> to <span className="font-medium">{Math.min(currentPage * itemsPerPage, activeTab === 'attendance' ? processedUsers.length : processedWeekendRequests.length)}</span> of <span className="font-medium">{activeTab === 'attendance' ? processedUsers.length : processedWeekendRequests.length}</span> results
                                </p>
                            </div>
                            <div className="flex items-center gap-4">
                                <select value={itemsPerPage} onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }} className="block w-24 rounded-md border-gray-300 py-1.5 text-sm focus:border-indigo-500 focus:ring-indigo-500">
                                    <option value={10}>10 / page</option>
                                    <option value={25}>25 / page</option>
                                    <option value={50}>50 / page</option>
                                </select>
                                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                                    <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50">
                                        Previous
                                    </button>
                                    <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages || totalPages === 0} className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50">
                                        Next
                                    </button>
                                </nav>
                            </div>
                        </div>
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
                    onApprovalComplete={() => {
                        setIsCalendarModalOpen(false);
                        setSelectedUsername(null);
                        setSuccess('Attendance action completed successfully.');
                        fetchPendingRequests();
                        setTimeout(() => setSuccess(''), 3000);
                    }}
                />
            )}
        </div>
    );
};

export default ApproveAttendancePage;