import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../api/apiService';
import Spinner from '../components/Spinner';
import { usePermissions } from '../hooks/usePermissions';
import AttendanceApprovalModal from '../components/admin/AttendanceApprovalModal';

const PAGE_SIZE = 25; // Enterprise standard page size

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

    // UI & Tab State
    const [activeTab, setActiveTab] = useState('attendance');
    const [loading, setLoading] = useState(true);
    const [processingBulk, setProcessingBulk] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Data State
    const [pendingRequests, setPendingRequests] = useState([]);
    const [weekendRequests, setWeekendRequests] = useState([]);

    // Enterprise Search State (Debounced)
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');

    // Enterprise Pagination State (Azure Continuation Tokens)
    const [attendanceTokens, setAttendanceTokens] = useState([null]);
    const [currentAttendancePage, setCurrentAttendancePage] = useState(0);
    const [hasMoreAttendance, setHasMoreAttendance] = useState(false);

    const [weekendTokens, setWeekendTokens] = useState([null]);
    const [currentWeekendPage, setCurrentWeekendPage] = useState(0);
    const [hasMoreWeekend, setHasMoreWeekend] = useState(false);
    
    // Bulk Actions State
    const [selectedStandardRows, setSelectedStandardRows] = useState(new Set());
    const [selectedWeekendRows, setSelectedWeekendRows] = useState(new Set());

    // Modal State
    const [isCalendarModalOpen, setIsCalendarModalOpen] = useState(false);
    const [selectedUsername, setSelectedUsername] = useState(null);

    // --- DEBOUNCE SEARCH LOGIC ---
    // Prevents API spam by waiting 500ms after the user stops typing
    useEffect(() => {
        const timerId = setTimeout(() => {
            setDebouncedSearch(searchTerm);
            // Reset pagination when search changes
            setAttendanceTokens([null]);
            setCurrentAttendancePage(0);
            setWeekendTokens([null]);
            setCurrentWeekendPage(0);
        }, 500); 
        return () => clearTimeout(timerId);
    }, [searchTerm]);

    // --- FETCH DATA (SERVER-SIDE) ---
    const fetchPendingRequests = useCallback(async () => {
        try {
            setLoading(true);
            const currentToken = attendanceTokens[currentAttendancePage];
            const currentYear = new Date().getFullYear().toString(); // FIX: Added current year
            
            const result = await apiService.getAttendance({
                authenticatedUsername: user.userIdentifier,
                year: currentYear, // FIX: Passed to backend to pass the 400 Error check
                statusFilter: 'Pending', 
                pageSize: PAGE_SIZE,
                continuationToken: currentToken,
                searchEmail: debouncedSearch
            });

            if (result.data.success) {
                setPendingRequests(result.data.attendanceRecords || []);
                setHasMoreAttendance(!!result.data.continuationToken);
                
                // Store the next token if we are moving forward
                if (result.data.continuationToken && !attendanceTokens[currentAttendancePage + 1]) {
                    const newTokens = [...attendanceTokens];
                    newTokens[currentAttendancePage + 1] = result.data.continuationToken;
                    setAttendanceTokens(newTokens);
                }
            }
        } catch (err) { 
            setError("Could not load standard requests."); 
        } finally { 
            setLoading(false); 
        }
    }, [user.userIdentifier, currentAttendancePage, attendanceTokens, debouncedSearch]);

    const fetchWeekendRequests = useCallback(async () => {
        try {
            setLoading(true);
            const currentToken = weekendTokens[currentWeekendPage];

            const result = await apiService.getWeekendWorkRequests({
                authenticatedUsername: user.userIdentifier,
                statusFilter: 'Pending',
                pageSize: PAGE_SIZE,
                continuationToken: currentToken,
                searchEmail: debouncedSearch
            });

            if (result.data && result.data.success) {
                setWeekendRequests(result.data.requests || []);
                setHasMoreWeekend(!!result.data.continuationToken);

                if (result.data.continuationToken && !weekendTokens[currentWeekendPage + 1]) {
                    const newTokens = [...weekendTokens];
                    newTokens[currentWeekendPage + 1] = result.data.continuationToken;
                    setWeekendTokens(newTokens);
                }
            }
        } catch (err) { 
            console.error("Failed to fetch weekend requests:", err); 
        } finally { 
            setLoading(false); 
        }
    }, [user.userIdentifier, currentWeekendPage, weekendTokens, debouncedSearch]);

    // Trigger fetches when tabs or pages change
    useEffect(() => {
        if (!user?.userIdentifier || !canApproveAttendance) return;
        if (activeTab === 'attendance') fetchPendingRequests();
        else fetchWeekendRequests();
    }, [activeTab, fetchPendingRequests, fetchWeekendRequests, user?.userIdentifier, canApproveAttendance]);

    // --- SINGLE ACTION HANDLERS ---
    const handleSingleStandardApproval = async (request, statusAction) => {
        setProcessingBulk(true);
        setError('');
        try {
            const res = await apiService.approveAttendance({
                authenticatedUsername: user.userIdentifier,
                requests: [{
                    targetUsername: request.username,
                    attendanceDate: request.date,
                    action: statusAction
                }]
            });

            if (res.data.success) {
                setSuccess(`Shift ${statusAction.toLowerCase()} successfully!`);
                await fetchPendingRequests();
            } else {
                setError(res.data.message || "Failed to process approval.");
            }
        } catch (err) {
            setError(err.message || "An error occurred.");
        } finally {
            setProcessingBulk(false);
            setTimeout(() => setSuccess(''), 3000);
        }
    };

    const handleSingleWeekendApproval = async (request, statusAction) => {
        setProcessingBulk(true);
        setError('');
        try {
            const res = await apiService.approveWeekendWork({
                requests: [{
                    employeeEmail: request.partitionKey,
                    requestId: request.rowKey,
                    status: statusAction
                }],
                status: statusAction,
                managerNotes: ""
            });
            if (res.data.success) {
                setSuccess(`Weekend request ${statusAction.toLowerCase()} successfully!`);
                await fetchWeekendRequests();
            } else {
                setError(res.data.message || "Failed to process approval.");
            }
        } catch (err) {
            setError(err.message || "An error occurred.");
        } finally {
            setProcessingBulk(false);
            setTimeout(() => setSuccess(''), 3000);
        }
    };

    // --- BULK ACTION HANDLERS ---
    const handleBulkStandardApproval = async (statusAction) => {
        if (selectedStandardRows.size === 0) return;
        setProcessingBulk(true);
        setError('');
        
        // Map selected rowKeys back to their entity details for the API
        const requestsToProcess = pendingRequests
            .filter(req => selectedStandardRows.has(req.rowKey))
            .map(req => ({
                targetUsername: req.username,
                attendanceDate: req.date,
                action: statusAction
            }));

        try {
            const res = await apiService.approveAttendance({
                authenticatedUsername: user.userIdentifier,
                requests: requestsToProcess
            });

            if (res.data.success) {
                setSuccess(`Successfully processed ${requestsToProcess.length} standard shifts.`);
                setSelectedStandardRows(new Set());
                await fetchPendingRequests();
            } else {
                setError("Partial failure during bulk update.");
            }
        } catch (e) {
            setError("Failed to execute bulk standard approval.");
        } finally {
            setProcessingBulk(false);
            setTimeout(() => setSuccess(''), 4000);
        }
    };

    const handleBulkWeekendApproval = async (statusAction) => {
        if (selectedWeekendRows.size === 0) return;
        setProcessingBulk(true);
        setError('');
        
        const requestsToProcess = weekendRequests
            .filter(req => selectedWeekendRows.has(req.rowKey))
            .map(req => ({
                employeeEmail: req.partitionKey,
                requestId: req.rowKey,
                status: statusAction
            }));

        try {
            const res = await apiService.approveWeekendWork({
                requests: requestsToProcess,
                status: statusAction,
                managerNotes: "Bulk Processed"
            });

            if (res.data.success) {
                setSuccess(`Successfully processed ${requestsToProcess.length} weekend requests.`);
                setSelectedWeekendRows(new Set());
                await fetchWeekendRequests();
            } else {
                setError("Partial failure during bulk update.");
            }
        } catch (e) {
            setError("Failed to execute bulk weekend approval.");
        } finally {
            setProcessingBulk(false);
            setTimeout(() => setSuccess(''), 4000);
        }
    };

    // --- CHECKBOX HELPERS ---
    const toggleSelection = (id, type) => {
        const isStandard = type === 'standard';
        const currentSet = isStandard ? selectedStandardRows : selectedWeekendRows;
        const setter = isStandard ? setSelectedStandardRows : setSelectedWeekendRows;
        
        const newSet = new Set(currentSet);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setter(newSet);
    };

    const handleSelectAll = (e, type) => {
        const isStandard = type === 'standard';
        const data = isStandard ? pendingRequests : weekendRequests;
        const setter = isStandard ? setSelectedStandardRows : setSelectedWeekendRows;

        if (e.target.checked) {
            setter(new Set(data.map(item => item.rowKey)));
        } else {
            setter(new Set());
        }
    };

    const handleExport = () => {
        if (activeTab === 'attendance') {
            exportToCSV(pendingRequests, 'Pending_Shifts_Page_Export');
        } else {
            exportToCSV(weekendRequests, 'Weekend_Requests_Page_Export');
        }
    };

    // --- RENDER HELPERS ---
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
                        <button onClick={handleExport} className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 transition-all">
                            <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                            Export Page to CSV
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
                            <button onClick={() => { setActiveTab('attendance'); setSelectedStandardRows(new Set()); }} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'attendance' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
                                Standard Shifts
                            </button>
                            <button onClick={() => { setActiveTab('weekend'); setSelectedWeekendRows(new Set()); }} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors flex items-center gap-2 ${activeTab === 'weekend' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
                                Weekend Requests
                            </button>
                        </nav>
                    </div>

                    {/* Toolbar (Search & Bulk Actions) */}
                    <div className="p-6 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-center gap-4 bg-white">
                        <div className="relative w-full sm:max-w-md">
                            <input
                                type="text"
                                placeholder={`Search database by exact email...`}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="block w-full rounded-lg border-gray-300 pl-10 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            />
                            <svg className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                        </div>

                        {/* Bulk Action Bar */}
                        {activeTab === 'attendance' && selectedStandardRows.size > 0 && (
                            <div className="flex items-center gap-3 bg-indigo-50 px-4 py-2 rounded-lg border border-indigo-100">
                                <span className="text-sm font-medium text-indigo-800">{selectedStandardRows.size} selected</span>
                                <div className="h-4 w-px bg-indigo-200"></div>
                                <button onClick={() => handleBulkStandardApproval('Approved')} disabled={processingBulk} className="text-sm font-semibold text-indigo-700 hover:text-indigo-900 disabled:opacity-50">Approve All</button>
                                <button onClick={() => handleBulkStandardApproval('Rejected')} disabled={processingBulk} className="text-sm font-semibold text-red-600 hover:text-red-800 disabled:opacity-50">Decline All</button>
                            </div>
                        )}
                        {activeTab === 'weekend' && selectedWeekendRows.size > 0 && (
                            <div className="flex items-center gap-3 bg-indigo-50 px-4 py-2 rounded-lg border border-indigo-100">
                                <span className="text-sm font-medium text-indigo-800">{selectedWeekendRows.size} selected</span>
                                <div className="h-4 w-px bg-indigo-200"></div>
                                <button onClick={() => handleBulkWeekendApproval('Approved')} disabled={processingBulk} className="text-sm font-semibold text-indigo-700 hover:text-indigo-900 disabled:opacity-50">Approve All</button>
                                <button onClick={() => handleBulkWeekendApproval('Rejected')} disabled={processingBulk} className="text-sm font-semibold text-red-600 hover:text-red-800 disabled:opacity-50">Decline All</button>
                            </div>
                        )}
                    </div>

                    {/* Data Tables */}
                    <div className="overflow-x-auto min-h-[300px]">
                        {loading ? (
                            <div className="flex justify-center items-center py-20"><Spinner size="10" /></div>
                        ) : activeTab === 'attendance' ? (
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th scope="col" className="px-6 py-3 text-left">
                                            <input type="checkbox" className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" 
                                                onChange={(e) => handleSelectAll(e, 'standard')} 
                                                checked={pendingRequests.length > 0 && selectedStandardRows.size === pendingRequests.length} 
                                            />
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Employee Email</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Shift Status</th>
                                        <th scope="col" className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {pendingRequests.length > 0 ? pendingRequests.map(req => (
                                        <tr key={req.rowKey} className={selectedStandardRows.has(req.rowKey) ? 'bg-indigo-50/30' : 'hover:bg-gray-50 transition-colors'}>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <input type="checkbox" className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                                    checked={selectedStandardRows.has(req.rowKey)}
                                                    onChange={() => toggleSelection(req.rowKey, 'standard')}
                                                />
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{req.username}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{req.date}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                                                    Pending ({req.requestedStatus})
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <div className="flex justify-end items-center gap-2">
                                                    <button 
                                                        onClick={() => handleSingleStandardApproval(req, 'Approved')} 
                                                        disabled={processingBulk} 
                                                        className="px-3 py-1.5 bg-green-50 text-green-700 hover:bg-green-100 rounded border border-green-200 transition-colors"
                                                    >
                                                        Approve
                                                    </button>
                                                    <button 
                                                        onClick={() => handleSingleStandardApproval(req, 'Rejected')} 
                                                        disabled={processingBulk} 
                                                        className="px-3 py-1.5 bg-white text-gray-700 hover:bg-red-50 hover:text-red-700 border border-gray-300 hover:border-red-200 rounded transition-colors"
                                                    >
                                                        Reject
                                                    </button>
                                                    <span className="text-gray-300">|</span>
                                                    <button 
                                                        onClick={() => { setSelectedUsername(req.username); setIsCalendarModalOpen(true); }} 
                                                        className="text-indigo-600 hover:text-indigo-900 font-semibold px-2"
                                                    >
                                                        Review Calendar &rarr;
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    )) : <tr><td colSpan="5" className="px-6 py-12 text-center text-gray-500">No pending requests found for this page.</td></tr>}
                                </tbody>
                            </table>
                        ) : (
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th scope="col" className="px-6 py-3 text-left">
                                            <input type="checkbox" className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" 
                                                onChange={(e) => handleSelectAll(e, 'weekend')} 
                                                checked={weekendRequests.length > 0 && selectedWeekendRows.size === weekendRequests.length} 
                                            />
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Employee</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Business Justification</th>
                                        <th scope="col" className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {weekendRequests.length > 0 ? weekendRequests.map(req => (
                                        <tr key={req.rowKey} className={selectedWeekendRows.has(req.rowKey) ? 'bg-indigo-50/30' : 'hover:bg-gray-50'}>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <input type="checkbox" className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                                    checked={selectedWeekendRows.has(req.rowKey)}
                                                    onChange={() => toggleSelection(req.rowKey, 'weekend')}
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
                                                    <button onClick={() => handleSingleWeekendApproval(req, 'Approved')} disabled={processingBulk} className="px-3 py-1.5 bg-green-50 text-green-700 hover:bg-green-100 rounded border border-green-200 transition-colors">Approve</button>
                                                    <button onClick={() => handleSingleWeekendApproval(req, 'Rejected')} disabled={processingBulk} className="px-3 py-1.5 bg-white text-gray-700 hover:bg-red-50 hover:text-red-700 border border-gray-300 hover:border-red-200 rounded transition-colors">Reject</button>
                                                </div>
                                            </td>
                                        </tr>
                                    )) : <tr><td colSpan="5" className="px-6 py-12 text-center text-gray-500">No pending weekend requests.</td></tr>}
                                </tbody>
                            </table>
                        )}
                    </div>

                    {/* Azure Continuation Token Pagination Controls */}
                    <div className="bg-white px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                        <div className="flex-1 flex items-center justify-between">
                            <p className="text-sm text-gray-700 font-medium">
                                Database Page {activeTab === 'attendance' ? currentAttendancePage + 1 : currentWeekendPage + 1}
                            </p>
                            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                                <button 
                                    onClick={() => activeTab === 'attendance' ? setCurrentAttendancePage(p => Math.max(0, p - 1)) : setCurrentWeekendPage(p => Math.max(0, p - 1))} 
                                    disabled={activeTab === 'attendance' ? currentAttendancePage === 0 : currentWeekendPage === 0} 
                                    className="relative inline-flex items-center px-4 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:bg-gray-100"
                                >
                                    Previous Page
                                </button>
                                <button 
                                    onClick={() => activeTab === 'attendance' ? setCurrentAttendancePage(p => p + 1) : setCurrentWeekendPage(p => p + 1)} 
                                    disabled={activeTab === 'attendance' ? !hasMoreAttendance : !hasMoreWeekend} 
                                    className="relative inline-flex items-center px-4 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:bg-gray-100"
                                >
                                    Load Next Page
                                </button>
                            </nav>
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