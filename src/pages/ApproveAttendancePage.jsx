import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../api/apiService';
import Spinner from '../components/Spinner';
import { usePermissions } from '../hooks/usePermissions';
import AttendanceApprovalModal from '../components/admin/AttendanceApprovalModal';

const PAGE_SIZE = 25; 

// --- UTILITY: CSV Export ---
const exportToCSV = (data, filename) => {
    if (!data || !data.length) return;
    const headers = Object.keys(data || {}).join(',');
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

// --- UTILITY: Week Date Generator ---
const getWeekBounds = (baseDate = new Date()) => {
    const d = new Date(baseDate);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(d.setDate(diff));
    const sunday = new Date(monday);
    sunday.setDate(sunday.getDate() + 6);
    return { start: monday.toISOString().split('T'), end: sunday.toISOString().split('T'), monday };
};

const formatMsToTime = (ms) => {
    if (!ms || ms <= 0) return "-";
    const h = Math.floor(ms / (1000 * 60 * 60));
    const m = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    return `${h}h ${m}m`;
};

const ApproveAttendancePage = () => {
    const { user } = useAuth();
    const { canApproveAttendance } = usePermissions();

    // UI State
    const [activeTab, setActiveTab] = useState('weekly'); 
    const [loading, setLoading] = useState(false);
    const [processingBulk, setProcessingBulk] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Enterprise Search State
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');

    // --- DATA & AZURE PAGINATION STATES ---
    const [pendingRequests, setPendingRequests] = useState([]);
    const [attendanceTokens, setAttendanceTokens] = useState([null]);
    const [currentAttendancePage, setCurrentAttendancePage] = useState(0);
    const [hasMoreAttendance, setHasMoreAttendance] = useState(false);

    const [weekendRequests, setWeekendRequests] = useState([]);
    const [weekendTokens, setWeekendTokens] = useState([null]);
    const [currentWeekendPage, setCurrentWeekendPage] = useState(0);
    const [hasMoreWeekend, setHasMoreWeekend] = useState(false);

    const [usersList, setUsersList] = useState([]); 
    const [usersTokens, setUsersTokens] = useState([null]); 
    const [currentUsersPage, setCurrentUsersPage] = useState(0);
    const [hasMoreUsers, setHasMoreUsers] = useState(false);

    const [exceptionsData, setExceptionsData] = useState([]);
    const [exceptionsTokens, setExceptionsTokens] = useState([null]);
    const [currentExceptionsPage, setCurrentExceptionsPage] = useState(0);
    const [hasMoreExceptions, setHasMoreExceptions] = useState(false);

    const [weeklyData, setWeeklyData] = useState([]);
    const [currentWeek, setCurrentWeek] = useState(() => getWeekBounds());
    const [weeklyTokens, setWeeklyTokens] = useState([null]);
    const [currentWeeklyPage, setCurrentWeeklyPage] = useState(0);
    const [hasMoreWeekly, setHasMoreWeekly] = useState(false);

    const [selectedStandardRows, setSelectedStandardRows] = useState(new Set());
    const [selectedWeekendRows, setSelectedWeekendRows] = useState(new Set());

    // Modal State
    const [isCalendarModalOpen, setIsCalendarModalOpen] = useState(false);
    const [selectedUsername, setSelectedUsername] = useState(null);

    // --- DEBOUNCE SEARCH ---
    useEffect(() => {
        const timerId = setTimeout(() => {
            setDebouncedSearch(searchTerm);
            setAttendanceTokens([null]); setCurrentAttendancePage(0);
            setWeekendTokens([null]); setCurrentWeekendPage(0);
            setUsersTokens([null]); setCurrentUsersPage(0);
            setExceptionsTokens([null]); setCurrentExceptionsPage(0);
            setWeeklyTokens([null]); setCurrentWeeklyPage(0);
        }, 500); 
        return () => clearTimeout(timerId);
    }, [searchTerm]);

    // --- SERVER-SIDE FETCHERS ---
    const fetchPendingStandard = useCallback(async () => {
        try {
            setLoading(true);
            const currentToken = attendanceTokens[currentAttendancePage];
            const currentYear = new Date().getFullYear().toString(); 
            const result = await apiService.getAttendance({
                authenticatedUsername: user.userIdentifier,
                year: currentYear, statusFilter: 'Pending', pageSize: PAGE_SIZE,
                continuationToken: currentToken, searchEmail: debouncedSearch
            });
            if (result.data.success) {
                setPendingRequests(result.data.attendanceRecords || []);
                setHasMoreAttendance(!!result.data.continuationToken);
                if (result.data.continuationToken && !attendanceTokens[currentAttendancePage + 1]) {
                    const newTokens = [...attendanceTokens];
                    newTokens[currentAttendancePage + 1] = result.data.continuationToken;
                    setAttendanceTokens(newTokens);
                }
            }
        } catch (err) { setError("Could not load standard requests."); } finally { setLoading(false); }
    }, [user?.userIdentifier, currentAttendancePage, attendanceTokens, debouncedSearch]);

    const fetchPendingWeekend = useCallback(async () => {
        try {
            setLoading(true);
            const currentToken = weekendTokens[currentWeekendPage];
            const result = await apiService.getWeekendWorkRequests({
                authenticatedUsername: user.userIdentifier,
                statusFilter: 'Pending', pageSize: PAGE_SIZE,
                continuationToken: currentToken, searchEmail: debouncedSearch
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
        } catch (err) { setError("Failed to fetch weekend requests."); } finally { setLoading(false); }
    }, [user?.userIdentifier, currentWeekendPage, weekendTokens, debouncedSearch]);

    const fetchUsersList = useCallback(async () => {
        try {
            setLoading(true);
            const currentToken = usersTokens[currentUsersPage];
            const result = await apiService.getUsers({
                authenticatedUsername: user.userIdentifier,
                pageSize: PAGE_SIZE, continuationToken: currentToken, searchEmail: debouncedSearch
            });
            if (result.data && result.data.success) {
                setUsersList(result.data.users || []);
                setHasMoreUsers(!!result.data.continuationToken);
                if (result.data.continuationToken && !usersTokens[currentUsersPage + 1]) {
                    const newTokens = [...usersTokens];
                    newTokens[currentUsersPage + 1] = result.data.continuationToken;
                    setUsersTokens(newTokens);
                }
            }
        } catch (err) { setError("Failed to fetch users."); } finally { setLoading(false); }
    }, [user?.userIdentifier, currentUsersPage, usersTokens, debouncedSearch]);

    const fetchWeeklyMatrix = useCallback(async () => {
        try {
            setLoading(true);
            const currentToken = weeklyTokens[currentWeeklyPage];
            const res = await apiService.getAttendance({
                authenticatedUsername: user.userIdentifier,
                startDate: currentWeek.start, endDate: currentWeek.end,
                pageSize: PAGE_SIZE * 7, continuationToken: currentToken, searchEmail: debouncedSearch
            });
            if (res.data && res.data.success) {
                const grouped = {};
                res.data.attendanceRecords.forEach(record => {
                    if (!grouped[record.username]) grouped[record.username] = { username: record.username, days: {} };
                    grouped[record.username].days[record.date] = record;
                });
                setWeeklyData(Object.values(grouped));
                setHasMoreWeekly(!!res.data.continuationToken);
                if (res.data.continuationToken && !weeklyTokens[currentWeeklyPage + 1]) {
                    const newTokens = [...weeklyTokens];
                    newTokens[currentWeeklyPage + 1] = res.data.continuationToken;
                    setWeeklyTokens(newTokens);
                }
            }
        } catch (err) { setError("Failed to fetch weekly matrix."); } finally { setLoading(false); }
    }, [user?.userIdentifier, currentWeek, currentWeeklyPage, weeklyTokens, debouncedSearch]);

    const fetchExceptions = useCallback(async () => {
        try {
            setLoading(true);
            const currentToken = exceptionsTokens[currentExceptionsPage];
            const currentMonth = new Date().toISOString().substring(0, 7);
            const res = await apiService.getAttendance({
                authenticatedUsername: user.userIdentifier,
                month: currentMonth, exceptionsOnly: true,
                pageSize: PAGE_SIZE, continuationToken: currentToken, searchEmail: debouncedSearch
            });
            if (res.data && res.data.success) {
                setExceptionsData(res.data.attendanceRecords || []);
                setHasMoreExceptions(!!res.data.continuationToken);
                if (res.data.continuationToken && !exceptionsTokens[currentExceptionsPage + 1]) {
                    const newTokens = [...exceptionsTokens];
                    newTokens[currentExceptionsPage + 1] = res.data.continuationToken;
                    setExceptionsTokens(newTokens);
                }
            }
        } catch (err) { setError("Failed to fetch exceptions."); } finally { setLoading(false); }
    }, [user?.userIdentifier, currentExceptionsPage, exceptionsTokens, debouncedSearch]);

    // Router Effect
    useEffect(() => {
        if (!user?.userIdentifier || !canApproveAttendance) return;
        if (activeTab === 'pending_standard') fetchPendingStandard();
        else if (activeTab === 'pending_weekend') fetchPendingWeekend();
        else if (activeTab === 'directory') fetchUsersList();
        else if (activeTab === 'weekly') fetchWeeklyMatrix();
        else if (activeTab === 'exceptions') fetchExceptions();
    }, [activeTab, fetchPendingStandard, fetchPendingWeekend, fetchUsersList, fetchWeeklyMatrix, fetchExceptions, user?.userIdentifier, canApproveAttendance]);

    // --- ACTIONS ---
    const handleSingleStandardApproval = async (request, statusAction) => {
        setProcessingBulk(true); setError('');
        try {
            const res = await apiService.approveAttendance({
                authenticatedUsername: user.userIdentifier,
                requests: [{ targetUsername: request.username, attendanceDate: request.date, action: statusAction }]
            });
            if (res.data.success) {
                setSuccess(`Shift ${statusAction.toLowerCase()} successfully!`);
                if (activeTab === 'pending_standard') await fetchPendingStandard();
                if (activeTab === 'weekly') await fetchWeeklyMatrix();
                if (activeTab === 'exceptions') await fetchExceptions();
            } else { setError(res.data.message || "Failed to process approval."); }
        } catch (err) { setError(err.message || "An error occurred."); } 
        finally { setProcessingBulk(false); setTimeout(() => setSuccess(''), 3000); }
    };

    const handleSingleWeekendApproval = async (request, statusAction) => {
        setProcessingBulk(true); setError('');
        try {
            const res = await apiService.approveWeekendWork({
                requests: [{ employeeEmail: request.partitionKey, requestId: request.rowKey, status: statusAction }],
                status: statusAction, managerNotes: ""
            });
            if (res.data.success) {
                setSuccess(`Weekend request ${statusAction.toLowerCase()} successfully!`);
                await fetchPendingWeekend();
            } else { setError(res.data.message || "Failed to process approval."); }
        } catch (err) { setError(err.message || "An error occurred."); } 
        finally { setProcessingBulk(false); setTimeout(() => setSuccess(''), 3000); }
    };

    const handleBulkStandardApproval = async (statusAction) => {
        if (selectedStandardRows.size === 0) return;
        setProcessingBulk(true); setError('');
        const requestsToProcess = pendingRequests
            .filter(req => selectedStandardRows.has(req.rowKey))
            .map(req => ({ targetUsername: req.username, attendanceDate: req.date, action: statusAction }));

        try {
            const res = await apiService.approveAttendance({ authenticatedUsername: user.userIdentifier, requests: requestsToProcess });
            if (res.data.success) {
                setSuccess(`Successfully processed ${requestsToProcess.length} standard shifts.`);
                setSelectedStandardRows(new Set());
                await fetchPendingStandard();
            } else { setError("Partial failure during bulk update."); }
        } catch (e) { setError("Failed to execute bulk standard approval."); } 
        finally { setProcessingBulk(false); setTimeout(() => setSuccess(''), 4000); }
    };

    const handleBulkWeekendApproval = async (statusAction) => {
        if (selectedWeekendRows.size === 0) return;
        setProcessingBulk(true); setError('');
        const requestsToProcess = weekendRequests
            .filter(req => selectedWeekendRows.has(req.rowKey))
            .map(req => ({ employeeEmail: req.partitionKey, requestId: req.rowKey, status: statusAction }));

        try {
            const res = await apiService.approveWeekendWork({ requests: requestsToProcess, status: statusAction, managerNotes: "Bulk Processed" });
            if (res.data.success) {
                setSuccess(`Successfully processed ${requestsToProcess.length} weekend requests.`);
                setSelectedWeekendRows(new Set());
                await fetchPendingWeekend();
            } else { setError("Partial failure during bulk update."); }
        } catch (e) { setError("Failed to execute bulk weekend approval."); } 
        finally { setProcessingBulk(false); setTimeout(() => setSuccess(''), 4000); }
    };

    const handleApproveWeek = async (employeeData) => {
        setProcessingBulk(true); setError('');
        const requestsToProcess = Object.values(employeeData.days)
            .filter(d => d.status === 'Pending' || d.status === 'Present' || d.status === 'Absent')
            .map(d => ({ targetUsername: employeeData.username, attendanceDate: d.date, action: 'Approved' }));

        if (requestsToProcess.length === 0) { setProcessingBulk(false); return; }
        try {
            const res = await apiService.approveAttendance({ authenticatedUsername: user.userIdentifier, requests: requestsToProcess });
            if (res.data.success) {
                setSuccess(`Entire week approved for ${employeeData.username}`);
                await fetchWeeklyMatrix();
            }
        } catch (e) { setError('Failed to bulk approve week.'); } 
        finally { setProcessingBulk(false); setTimeout(() => setSuccess(''), 3000); }
    };

    // --- CHECKBOX & EXPORT HELPERS ---
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
        if (e.target.checked) setter(new Set(data.map(item => item.rowKey)));
        else setter(new Set());
    };

    const handleExport = () => {
        if (activeTab === 'pending_standard') exportToCSV(pendingRequests, 'Pending_Shifts_Export');
        else if (activeTab === 'pending_weekend') exportToCSV(weekendRequests, 'Weekend_Requests_Export');
        else if (activeTab === 'exceptions') exportToCSV(exceptionsData, 'Exceptions_Queue_Export');
        else if (activeTab === 'directory') exportToCSV(usersList, 'Employee_Directory_Export');
        else if (activeTab === 'weekly') exportToCSV(weeklyData.map(w => ({ employee: w.username, ...w.days })), 'Weekly_Matrix_Export');
    };

    const changeWeek = (offset) => {
        setCurrentWeek(prev => {
            const newDate = new Date(prev.monday);
            newDate.setDate(newDate.getDate() + (offset * 7));
            return getWeekBounds(newDate);
        });
    };

    // --- COMPONENT HELPERS ---
    const renderGridCell = (dayRecord, dateStr) => {
        if (!dayRecord) return <td key={dateStr} className="px-3 py-4 bg-white border-r border-gray-200"></td>;
        const isAnomaly = dayRecord.status === 'Pending' || (dayRecord.extraTimeMs > 2 * 60 * 60 * 1000);
        const totalMs = (dayRecord.standardTimeMs || 0) + (dayRecord.extraTimeMs || 0);
        return (
            <td key={dateStr} className={`px-3 py-3 border-r border-gray-200 relative group cursor-pointer ${isAnomaly ? 'bg-amber-50 hover:bg-amber-100' : 'hover:bg-gray-50'}`}
                onClick={() => { setSelectedUsername(dayRecord.username); setIsCalendarModalOpen(true); }}
            >
                <div className="flex flex-col items-center justify-center">
                    <span className={`text-xs font-semibold ${isAnomaly ? 'text-amber-700' : 'text-gray-700'}`}>{formatMsToTime(totalMs)}</span>
                    <span className={`text-[10px] uppercase tracking-wider font-semibold mt-1 px-1.5 py-0.5 rounded ${
                        dayRecord.status === 'Pending' ? 'bg-amber-200 text-amber-800' : dayRecord.status === 'Present' ? 'bg-emerald-100 text-emerald-800' : dayRecord.status === 'Absent' ? 'bg-rose-100 text-rose-800' : 'bg-gray-200 text-gray-700'
                    }`}>{dayRecord.status === 'Present' ? 'OK' : dayRecord.status.substring(0, 4)}</span>
                </div>
            </td>
        );
    };

    const renderPagination = (currentPage, setCurrentPage, hasMore, tabName) => (
        <div className="bg-white px-6 py-4 border-t border-gray-200 flex items-center justify-between mt-auto rounded-b-xl">
            <p className="text-sm text-gray-700 font-medium">Database Page {currentPage + 1}</p>
            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                <button onClick={() => setCurrentPage(p => Math.max(0, p - 1))} disabled={currentPage === 0} 
                    className="relative inline-flex items-center px-4 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors">
                    Previous
                </button>
                <button onClick={() => setCurrentPage(p => p + 1)} disabled={!hasMore} 
                    className="relative inline-flex items-center px-4 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors">
                    Load Next
                </button>
            </nav>
        </div>
    );

    if (!canApproveAttendance) {
        return (
            <div className="max-w-3xl mx-auto mt-12 text-center bg-white p-16 rounded-2xl shadow-sm border border-gray-200">
                <h3 className="text-2xl font-bold text-gray-900">Access Restricted</h3>
                <p className="mt-2 text-gray-500">Your current role does not have the necessary privileges to view this workspace.</p>
            </div>
        );
    }

    return (
        <div className="w-full bg-gray-50 min-h-screen pb-12 font-sans">
            <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                
                {/* Header & Global Actions */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Attendance Center</h1>
                        <p className="mt-1 text-sm text-gray-500">Enterprise management console for workforce scheduling and approvals.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button onClick={handleExport} className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 transition-all">
                            <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                            Export View to CSV
                        </button>
                    </div>
                </div>

                {/* Alerts */}
                {error && <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-md shadow-sm"><p className="text-sm text-red-700 font-medium">{error}</p></div>}
                {success && <div className="mb-6 bg-green-50 border-l-4 border-green-500 p-4 rounded-md shadow-sm"><p className="text-sm text-green-700 font-medium">{success}</p></div>}

                {/* Main Workspace Card */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col min-h-[600px]">
                    
                    {/* Clean Underline Navigation Tabs */}
                    <div className="border-b border-gray-200 bg-gray-50/50 px-6 flex overflow-x-auto custom-scrollbar">
                        <nav className="-mb-px flex space-x-8 min-w-max">
                            {[
                                { id: 'weekly', label: 'Weekly Matrix' },
                                { id: 'pending_standard', label: 'Pending Standard' },
                                { id: 'pending_weekend', label: 'Pending Weekend' },
                                { id: 'exceptions', label: 'Exceptions Queue' },
                                { id: 'directory', label: 'Directory' }
                            ].map(tab => (
                                <button key={tab.id} onClick={() => { setActiveTab(tab.id); setSelectedStandardRows(new Set()); setSelectedWeekendRows(new Set()); }}
                                    className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                                        activeTab === tab.id ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </nav>
                    </div>

                    {/* Toolbar (Search & Bulk Actions) */}
                    <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-center gap-4 bg-white">
                        <div className="relative w-full sm:max-w-md">
                            <input type="text" placeholder="Search by exact email..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                                className="block w-full rounded-lg border-gray-300 pl-10 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
                            <svg className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                        </div>
                        {activeTab === 'pending_standard' && selectedStandardRows.size > 0 && (
                            <div className="flex items-center gap-3 bg-indigo-50 px-4 py-2 rounded-lg border border-indigo-100">
                                <span className="text-sm font-medium text-indigo-800">{selectedStandardRows.size} selected</span>
                                <div className="h-4 w-px bg-indigo-200"></div>
                                <button onClick={() => handleBulkStandardApproval('Approved')} disabled={processingBulk} className="text-sm font-semibold text-indigo-700 hover:text-indigo-900 disabled:opacity-50">Approve All</button>
                                <button onClick={() => handleBulkStandardApproval('Rejected')} disabled={processingBulk} className="text-sm font-semibold text-red-600 hover:text-red-800 disabled:opacity-50">Reject All</button>
                            </div>
                        )}
                        {activeTab === 'pending_weekend' && selectedWeekendRows.size > 0 && (
                            <div className="flex items-center gap-3 bg-indigo-50 px-4 py-2 rounded-lg border border-indigo-100">
                                <span className="text-sm font-medium text-indigo-800">{selectedWeekendRows.size} selected</span>
                                <div className="h-4 w-px bg-indigo-200"></div>
                                <button onClick={() => handleBulkWeekendApproval('Approved')} disabled={processingBulk} className="text-sm font-semibold text-indigo-700 hover:text-indigo-900 disabled:opacity-50">Approve All</button>
                                <button onClick={() => handleBulkWeekendApproval('Rejected')} disabled={processingBulk} className="text-sm font-semibold text-red-600 hover:text-red-800 disabled:opacity-50">Reject All</button>
                            </div>
                        )}
                    </div>

                    {/* Content Area */}
                    <div className="flex-1 bg-white flex flex-col">
                        {loading ? ( <div className="flex justify-center items-center h-64"><Spinner size="10" /></div> ) : (
                            <>
                                {/* TAB: WEEKLY MATRIX */}
                                {activeTab === 'weekly' && (
                                    <div className="p-6 flex-1 flex flex-col">
                                        <div className="flex justify-between items-center mb-6 bg-white p-2 rounded-lg border border-gray-200 shadow-sm w-max">
                                            <button onClick={() => changeWeek(-1)} className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors font-medium">&larr; Prev</button>
                                            <span className="px-6 text-sm font-bold text-gray-700">
                                                {new Date(currentWeek.start).toLocaleDateString('en-US', { month: 'short', day: 'numeric'})} - {new Date(currentWeek.end).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric'})}
                                            </span>
                                            <button onClick={() => changeWeek(1)} className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors font-medium">Next &rarr;</button>
                                        </div>
                                        <div className="border border-gray-200 rounded-lg shadow-sm overflow-x-auto mb-4">
                                            <table className="min-w-full divide-y divide-gray-200">
                                                <thead className="bg-gray-50">
                                                    <tr>
                                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider border-r border-gray-200">Employee</th>
                                                        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d, i) => {
                                                            const dateObj = new Date(currentWeek.monday); dateObj.setDate(dateObj.getDate() + i);
                                                            return <th key={d} className="px-3 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider border-r border-gray-200">{d} <span className="block text-[10px] text-gray-400 font-normal mt-0.5">{dateObj.getDate()}</span></th>;
                                                        })}
                                                        <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-200">
                                                    {weeklyData.map(emp => (
                                                        <tr key={emp.username} className="hover:bg-gray-50 transition-colors">
                                                            <td className="px-6 py-4 border-r border-gray-200 bg-white">
                                                                <div className="font-semibold text-gray-900 text-sm">{emp.username.split('@')}</div>
                                                                <div className="text-xs text-gray-500">{emp.username}</div>
                                                            </td>
                                                            {Array.from({length: 7}).map((_, i) => {
                                                                const dObj = new Date(currentWeek.monday); dObj.setDate(dObj.getDate() + i);
                                                                return renderGridCell(emp.days[dObj.toISOString().split('T')], dObj.toISOString().split('T'));
                                                            })}
                                                            <td className="px-6 py-4 text-right bg-white">
                                                                <button onClick={() => handleApproveWeek(emp)} disabled={processingBulk} className="px-4 py-2 bg-green-50 hover:bg-green-100 text-green-700 border border-green-200 text-xs font-semibold rounded transition-colors shadow-sm disabled:opacity-50">Approve Week</button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                    {weeklyData.length === 0 && <tr><td colSpan="9" className="px-6 py-12 text-center text-gray-500 font-medium">No schedule data generated for this week.</td></tr>}
                                                </tbody>
                                            </table>
                                        </div>
                                        {renderPagination(currentWeeklyPage, setCurrentWeeklyPage, hasMoreWeekly, 'weekly')}
                                    </div>
                                )}

                                {/* TAB: PENDING STANDARD */}
                                {activeTab === 'pending_standard' && (
                                    <div className="flex-1 flex flex-col">
                                        <div className="overflow-x-auto p-6">
                                            <table className="min-w-full divide-y divide-gray-200 border border-gray-200 rounded-lg">
                                                <thead className="bg-gray-50">
                                                    <tr>
                                                        <th className="px-6 py-3 text-left"><input type="checkbox" className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" onChange={(e) => handleSelectAll(e, 'standard')} checked={pendingRequests.length > 0 && selectedStandardRows.size === pendingRequests.length} /></th>
                                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Employee Email</th>
                                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Shift Status</th>
                                                        <th className="px-6 py-3 text-right">Actions</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-200">
                                                    {pendingRequests.map(req => (
                                                        <tr key={req.rowKey} className={selectedStandardRows.has(req.rowKey) ? 'bg-indigo-50/30' : 'hover:bg-gray-50 transition-colors'}>
                                                            <td className="px-6 py-4"><input type="checkbox" className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" checked={selectedStandardRows.has(req.rowKey)} onChange={() => toggleSelection(req.rowKey, 'standard')} /></td>
                                                            <td className="px-6 py-4 text-sm font-medium text-gray-900">{req.username}</td>
                                                            <td className="px-6 py-4 text-sm text-gray-500">{req.date}</td>
                                                            <td className="px-6 py-4"><span className="px-2.5 py-0.5 bg-amber-100 text-amber-800 text-xs font-medium rounded-full">Pending ({req.requestedStatus})</span></td>
                                                            <td className="px-6 py-4 text-right flex justify-end gap-2 items-center">
                                                                <button onClick={() => handleSingleStandardApproval(req, 'Approved')} disabled={processingBulk} className="px-3 py-1.5 bg-green-50 text-green-700 border border-green-200 rounded text-sm transition-colors hover:bg-green-100">Approve</button>
                                                                <button onClick={() => handleSingleStandardApproval(req, 'Rejected')} disabled={processingBulk} className="px-3 py-1.5 bg-white text-gray-700 border border-gray-300 rounded text-sm transition-colors hover:bg-red-50 hover:text-red-700">Reject</button>
                                                                <span className="text-gray-300 mx-1">|</span>
                                                                <button onClick={() => { setSelectedUsername(req.username); setIsCalendarModalOpen(true); }} className="text-indigo-600 font-semibold text-sm hover:text-indigo-900">Review &rarr;</button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                    {pendingRequests.length === 0 && <tr><td colSpan="5" className="px-6 py-12 text-center text-gray-500">No pending requests found.</td></tr>}
                                                </tbody>
                                            </table>
                                        </div>
                                        {renderPagination(currentAttendancePage, setCurrentAttendancePage, hasMoreAttendance, 'attendance')}
                                    </div>
                                )}

                                {/* TAB: PENDING WEEKEND */}
                                {activeTab === 'pending_weekend' && (
                                    <div className="flex-1 flex flex-col">
                                        <div className="overflow-x-auto p-6">
                                            <table className="min-w-full divide-y divide-gray-200 border border-gray-200 rounded-lg">
                                                <thead className="bg-gray-50">
                                                    <tr>
                                                        <th className="px-6 py-3 text-left"><input type="checkbox" className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" onChange={(e) => handleSelectAll(e, 'weekend')} checked={weekendRequests.length > 0 && selectedWeekendRows.size === weekendRequests.length} /></th>
                                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Employee</th>
                                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Reason</th>
                                                        <th className="px-6 py-3 text-right">Actions</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-200">
                                                    {weekendRequests.map(req => (
                                                        <tr key={req.rowKey} className={selectedWeekendRows.has(req.rowKey) ? 'bg-indigo-50/30' : 'hover:bg-gray-50 transition-colors'}>
                                                            <td className="px-6 py-4"><input type="checkbox" className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" checked={selectedWeekendRows.has(req.rowKey)} onChange={() => toggleSelection(req.rowKey, 'weekend')} /></td>
                                                            <td className="px-6 py-4 text-sm font-medium text-gray-900">{req.partitionKey}</td>
                                                            <td className="px-6 py-4 text-sm text-gray-500">{new Date(req.date + 'T00:00:00Z').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                                                            <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate" title={req.reason}>{req.reason}</td>
                                                            <td className="px-6 py-4 text-right flex justify-end gap-2">
                                                                <button onClick={() => handleSingleWeekendApproval(req, 'Approved')} disabled={processingBulk} className="px-3 py-1.5 bg-green-50 text-green-700 border border-green-200 rounded text-sm transition-colors hover:bg-green-100">Approve</button>
                                                                <button onClick={() => handleSingleWeekendApproval(req, 'Rejected')} disabled={processingBulk} className="px-3 py-1.5 bg-white text-gray-700 border border-gray-300 rounded text-sm transition-colors hover:bg-red-50 hover:text-red-700">Reject</button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                    {weekendRequests.length === 0 && <tr><td colSpan="5" className="px-6 py-12 text-center text-gray-500">No pending weekend requests.</td></tr>}
                                                </tbody>
                                            </table>
                                        </div>
                                        {renderPagination(currentWeekendPage, setCurrentWeekendPage, hasMoreWeekend, 'weekend')}
                                    </div>
                                )}

                                {/* TAB: EXCEPTIONS QUEUE */}
                                {activeTab === 'exceptions' && (
                                    <div className="flex-1 flex flex-col p-6">
                                        <div className="border border-gray-200 rounded-lg shadow-sm overflow-hidden mb-4">
                                            <table className="min-w-full divide-y divide-gray-200">
                                                <thead className="bg-gray-50">
                                                    <tr>
                                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Employee</th>
                                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">System Flag</th>
                                                        <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Resolution</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-200">
                                                    {exceptionsData.map(req => {
                                                        const stdHours = (req.standardTimeMs || 0) / (1000 * 60 * 60);
                                                        const extHours = (req.extraTimeMs || 0) / (1000 * 60 * 60);
                                                        let flagMsg = "Pending Approval"; let flagColor = "text-amber-700 bg-amber-50 border-amber-200";
                                                        if (stdHours > 0 && stdHours < 4) { flagMsg = "Shift < 4 Hours"; flagColor = "text-red-700 bg-red-50 border-red-200"; }
                                                        else if (extHours > 2) { flagMsg = "Excessive Overtime (>2h)"; flagColor = "text-purple-700 bg-purple-50 border-purple-200"; }
                                                        return (
                                                            <tr key={req.rowKey} className="hover:bg-gray-50 transition-colors">
                                                                <td className="px-6 py-4 text-sm font-medium text-gray-900">{req.date}</td>
                                                                <td className="px-6 py-4 text-sm text-gray-600">{req.username}</td>
                                                                <td className="px-6 py-4">
                                                                    <span className={`px-2.5 py-0.5 rounded-full border text-xs font-medium ${flagColor}`}>{flagMsg}</span>
                                                                    <div className="text-[11px] text-gray-400 mt-1 font-medium">Std: {formatMsToTime(req.standardTimeMs)} | Ext: {formatMsToTime(req.extraTimeMs)}</div>
                                                                </td>
                                                                <td className="px-6 py-4 text-right">
                                                                    <button onClick={() => { setSelectedUsername(req.username); setIsCalendarModalOpen(true); }} className="text-indigo-600 hover:text-indigo-900 font-semibold text-sm border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded transition-colors">Investigate &rarr;</button>
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                    {exceptionsData.length === 0 && <tr><td colSpan="4" className="px-6 py-12 text-center text-gray-500">Queue is clear! No exceptions found.</td></tr>}
                                                </tbody>
                                            </table>
                                        </div>
                                        {renderPagination(currentExceptionsPage, setCurrentExceptionsPage, hasMoreExceptions, 'exceptions')}
                                    </div>
                                )}

                                {/* TAB: DIRECTORY */}
                                {activeTab === 'directory' && (
                                    <div className="flex-1 flex flex-col p-6">
                                        <div className="border border-gray-200 rounded-lg shadow-sm overflow-hidden mb-4">
                                            <table className="min-w-full divide-y divide-gray-200">
                                                <thead className="bg-gray-50">
                                                    <tr>
                                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Employee</th>
                                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">System Role</th>
                                                        <th className="px-6 py-3 text-right">Actions</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-200">
                                                    {usersList.map(u => (
                                                        <tr key={u.username} className="hover:bg-gray-50 transition-colors">
                                                            <td className="px-6 py-4 whitespace-nowrap">
                                                                <div className="flex items-center">
                                                                    <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs">{u.displayName?.charAt(0) || 'U'}</div>
                                                                    <div className="ml-4 font-medium text-gray-900">{u.displayName || u.username.split('@')}</div>
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4"><span className="px-2.5 py-0.5 bg-gray-100 text-gray-800 text-xs font-medium rounded-full border border-gray-200">{u.role || u.userRole || 'Employee'}</span></td>
                                                            <td className="px-6 py-4 text-right"><button onClick={() => { setSelectedUsername(u.username); setIsCalendarModalOpen(true); }} className="text-indigo-600 font-semibold text-sm hover:underline">View Calendar &rarr;</button></td>
                                                        </tr>
                                                    ))}
                                                    {usersList.length === 0 && <tr><td colSpan="3" className="px-6 py-12 text-center text-gray-500">No employees found.</td></tr>}
                                                </tbody>
                                            </table>
                                        </div>
                                        {renderPagination(currentUsersPage, setCurrentUsersPage, hasMoreUsers, 'directory')}
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>

            {selectedUsername && (
                <AttendanceApprovalModal 
                    isOpen={isCalendarModalOpen} 
                    onClose={() => { setIsCalendarModalOpen(false); setSelectedUsername(null); fetchData(); }} 
                    selectedUsername={selectedUsername} 
                    onApprovalComplete={() => { setIsCalendarModalOpen(false); setSelectedUsername(null); setSuccess('Processed successfully.'); fetchData(); setTimeout(() => setSuccess(''), 3000); }} 
                />
            )}
        </div>
    );
};

export default ApproveAttendancePage;