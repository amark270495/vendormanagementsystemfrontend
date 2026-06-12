import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../api/apiService';
import Spinner from '../components/Spinner';
import { usePermissions } from '../hooks/usePermissions';
import AttendanceApprovalModal from '../components/admin/AttendanceApprovalModal';

const PAGE_SIZE = 25; 

// --- ORIGINAL UTILITY: CSV Export ---
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
    const [activeTab, setActiveTab] = useState('weekly'); // 'weekly', 'pending_standard', 'pending_weekend', 'exceptions', 'directory'
    const [loading, setLoading] = useState(false);
    const [processingBulk, setProcessingBulk] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // ORIGINAL LOGIC: Enterprise Search State (Debounced)
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');

    // --- DATA & AZURE PAGINATION STATES (RESTORED) ---
    // Standard Pending
    const [pendingRequests, setPendingRequests] = useState([]);
    const [attendanceTokens, setAttendanceTokens] = useState([null]);
    const [currentAttendancePage, setCurrentAttendancePage] = useState(0);
    const [hasMoreAttendance, setHasMoreAttendance] = useState(false);

    // Weekend Pending
    const [weekendRequests, setWeekendRequests] = useState([]);
    const [weekendTokens, setWeekendTokens] = useState([null]);
    const [currentWeekendPage, setCurrentWeekendPage] = useState(0);
    const [hasMoreWeekend, setHasMoreWeekend] = useState(false);

    // Directory
    const [usersList, setUsersList] = useState([]); 
    const [usersTokens, setUsersTokens] = useState([null]); 
    const [currentUsersPage, setCurrentUsersPage] = useState(0);
    const [hasMoreUsers, setHasMoreUsers] = useState(false);

    // Exceptions (New)
    const [exceptionsData, setExceptionsData] = useState([]);
    const [exceptionsTokens, setExceptionsTokens] = useState([null]);
    const [currentExceptionsPage, setCurrentExceptionsPage] = useState(0);
    const [hasMoreExceptions, setHasMoreExceptions] = useState(false);

    // Weekly Matrix (New)
    const [weeklyData, setWeeklyData] = useState([]);
    const [currentWeek, setCurrentWeek] = useState(() => getWeekBounds());
    const [weeklyTokens, setWeeklyTokens] = useState([null]);
    const [currentWeeklyPage, setCurrentWeeklyPage] = useState(0);
    const [hasMoreWeekly, setHasMoreWeekly] = useState(false);

    // ORIGINAL LOGIC: Bulk Actions State
    const [selectedStandardRows, setSelectedStandardRows] = useState(new Set());
    const [selectedWeekendRows, setSelectedWeekendRows] = useState(new Set());

    // Modal State
    const [isCalendarModalOpen, setIsCalendarModalOpen] = useState(false);
    const [selectedUsername, setSelectedUsername] = useState(null);

    // --- ORIGINAL LOGIC: DEBOUNCE SEARCH ---
    useEffect(() => {
        const timerId = setTimeout(() => {
            setDebouncedSearch(searchTerm);
            // Reset ALL paginations on new search
            setAttendanceTokens([null]); setCurrentAttendancePage(0);
            setWeekendTokens([null]); setCurrentWeekendPage(0);
            setUsersTokens([null]); setCurrentUsersPage(0);
            setExceptionsTokens([null]); setCurrentExceptionsPage(0);
            setWeeklyTokens([null]); setCurrentWeeklyPage(0);
        }, 500); 
        return () => clearTimeout(timerId);
    }, [searchTerm]);

    // --- SERVER-SIDE FETCHERS (RESTORED & EXPANDED) ---
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

    // --- ORIGINAL LOGIC: ACTIONS (SINGLE & BULK) ---
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

    // --- COMPONENT HELPERS ---
    const renderGridCell = (dayRecord, dateStr) => {
        if (!dayRecord) return <td key={dateStr} className="px-3 py-4 bg-slate-50 border-r border-slate-100"></td>;
        const isAnomaly = dayRecord.status === 'Pending' || (dayRecord.extraTimeMs > 2 * 60 * 60 * 1000);
        const totalMs = (dayRecord.standardTimeMs || 0) + (dayRecord.extraTimeMs || 0);
        return (
            <td key={dateStr} className={`px-3 py-3 border-r border-slate-100 relative group cursor-pointer ${isAnomaly ? 'bg-amber-50 hover:bg-amber-100' : 'hover:bg-slate-50'}`}
                onClick={() => { setSelectedUsername(dayRecord.username); setIsCalendarModalOpen(true); }}
            >
                <div className="flex flex-col items-center justify-center">
                    <span className={`text-xs font-bold ${isAnomaly ? 'text-amber-700' : 'text-slate-700'}`}>{formatMsToTime(totalMs)}</span>
                    <span className={`text-[10px] uppercase tracking-wider font-semibold mt-1 px-1.5 rounded ${
                        dayRecord.status === 'Pending' ? 'bg-amber-200 text-amber-800' : dayRecord.status === 'Present' ? 'bg-emerald-100 text-emerald-700' : dayRecord.status === 'Absent' ? 'bg-rose-100 text-rose-700' : 'bg-slate-200 text-slate-600'
                    }`}>{dayRecord.status === 'Present' ? 'OK' : dayRecord.status.substring(0, 4)}</span>
                </div>
            </td>
        );
    };

    const renderPagination = (currentPage, setCurrentPage, hasMore, tabName) => (
        <div className="bg-white px-6 py-4 border-t border-slate-200 flex items-center justify-between mt-auto">
            <p className="text-sm text-slate-700 font-medium">Database Page {currentPage + 1}</p>
            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                <button onClick={() => setCurrentPage(p => Math.max(0, p - 1))} disabled={currentPage === 0} 
                    className="relative inline-flex items-center px-4 py-2 rounded-l-md border border-slate-300 bg-white text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition-colors">
                    Previous
                </button>
                <button onClick={() => setCurrentPage(p => p + 1)} disabled={!hasMore} 
                    className="relative inline-flex items-center px-4 py-2 rounded-r-md border border-slate-300 bg-white text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition-colors">
                    Load Next
                </button>
            </nav>
        </div>
    );

    if (!canApproveAttendance) {
        return (
            <div className="max-w-3xl mx-auto mt-12 text-center bg-white p-16 rounded-2xl shadow-sm border border-slate-200">
                <h3 className="text-2xl font-bold text-slate-900">Access Restricted</h3>
                <p className="mt-2 text-slate-500">Your role lacks enterprise scheduling privileges.</p>
            </div>
        );
    }

    return (
        <div className="w-full bg-slate-50 min-h-screen pb-12 font-sans">
            {/* Header & Global Actions */}
            <div className="bg-slate-900 text-white pt-8 pb-16 px-4 sm:px-6 lg:px-8 border-b border-slate-800 shadow-inner">
                <div className="max-w-screen-2xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                    <div>
                        <h1 className="text-3xl font-black tracking-tight text-white">Attendance Operations Center</h1>
                        <p className="mt-2 text-sm text-slate-400 font-medium tracking-wide">Enterprise Workforce Scheduling & Exception Management</p>
                    </div>
                    {/* RESTORED: Export Button */}
                    <div className="flex items-center gap-3">
                        <button onClick={handleExport} className="inline-flex items-center justify-center rounded-lg border border-slate-600 bg-slate-800 hover:bg-slate-700 px-4 py-2 text-sm font-bold text-white shadow-sm transition-all">
                            Export View to CSV
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-10">
                {error && <div className="mb-4 bg-rose-50 border-l-4 border-rose-500 p-4 rounded shadow-sm"><p className="text-sm text-rose-700 font-bold">{error}</p></div>}
                {success && <div className="mb-4 bg-emerald-50 border-l-4 border-emerald-500 p-4 rounded shadow-sm"><p className="text-sm text-emerald-700 font-bold">{success}</p></div>}

                <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden flex flex-col min-h-[600px]">
                    
                    {/* Navigation Tabs */}
                    <div className="border-b border-slate-200 bg-slate-50/50 px-2 flex overflow-x-auto">
                        <nav className="flex space-x-1 min-w-max p-2">
                            {[
                                { id: 'weekly', label: 'Weekly Matrix', icon: '📅' },
                                { id: 'pending_standard', label: 'Pending Standard', icon: '⏳' },
                                { id: 'pending_weekend', label: 'Pending Weekend', icon: '⛺' },
                                { id: 'exceptions', label: 'Exceptions Queue', icon: '🎯' },
                                { id: 'directory', label: 'Directory', icon: '👥' }
                            ].map(tab => (
                                <button key={tab.id} onClick={() => { setActiveTab(tab.id); setSelectedStandardRows(new Set()); setSelectedWeekendRows(new Set()); }}
                                    className={`flex items-center px-4 py-3 rounded-lg text-sm font-bold tracking-wide transition-all ${
                                        activeTab === tab.id ? 'bg-indigo-50 text-indigo-700 shadow-sm border border-indigo-100' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-transparent'
                                    }`}
                                >
                                    <span className="mr-2 text-lg">{tab.icon}</span> {tab.label}
                                </button>
                            ))}
                        </nav>
                    </div>

                    {/* RESTORED: Toolbar (Search & Bulk Actions) */}
                    <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4 bg-white">
                        <div className="relative w-full sm:max-w-md">
                            <input type="text" placeholder="Search by exact email..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                                className="block w-full rounded-lg border-slate-300 pl-10 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
                            <span className="absolute left-3 top-2.5">🔍</span>
                        </div>
                        {activeTab === 'pending_standard' && selectedStandardRows.size > 0 && (
                            <div className="flex items-center gap-3 bg-indigo-50 px-4 py-2 rounded-lg border border-indigo-100">
                                <span className="text-sm font-bold text-indigo-800">{selectedStandardRows.size} selected</span>
                                <button onClick={() => handleBulkStandardApproval('Approved')} disabled={processingBulk} className="text-sm font-bold text-indigo-700 hover:text-indigo-900">Approve All</button>
                                <button onClick={() => handleBulkStandardApproval('Rejected')} disabled={processingBulk} className="text-sm font-bold text-rose-600 hover:text-rose-800">Reject All</button>
                            </div>
                        )}
                        {activeTab === 'pending_weekend' && selectedWeekendRows.size > 0 && (
                            <div className="flex items-center gap-3 bg-indigo-50 px-4 py-2 rounded-lg border border-indigo-100">
                                <span className="text-sm font-bold text-indigo-800">{selectedWeekendRows.size} selected</span>
                                <button onClick={() => handleBulkWeekendApproval('Approved')} disabled={processingBulk} className="text-sm font-bold text-indigo-700 hover:text-indigo-900">Approve All</button>
                                <button onClick={() => handleBulkWeekendApproval('Rejected')} disabled={processingBulk} className="text-sm font-bold text-rose-600 hover:text-rose-800">Reject All</button>
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
                                        <div className="flex justify-between items-center mb-6 bg-slate-50 p-3 rounded-xl border border-slate-200 shadow-sm w-max">
                                            <button onClick={() => changeWeek(-1)} className="p-2 text-slate-500 hover:bg-slate-200 rounded-lg transition-colors font-bold">&larr; Prev</button>
                                            <span className="px-6 text-sm font-black text-slate-800">
                                                {new Date(currentWeek.start).toLocaleDateString('en-US', { month: 'short', day: 'numeric'})} - {new Date(currentWeek.end).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric'})}
                                            </span>
                                            <button onClick={() => changeWeek(1)} className="p-2 text-slate-500 hover:bg-slate-200 rounded-lg transition-colors font-bold">Next &rarr;</button>
                                        </div>
                                        <div className="border border-slate-200 rounded-xl shadow-sm overflow-x-auto mb-4">
                                            <table className="min-w-full divide-y divide-slate-200">
                                                <thead className="bg-slate-900 text-white">
                                                    <tr>
                                                        <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-widest border-r border-slate-700">Employee</th>
                                                        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d, i) => {
                                                            const dateObj = new Date(currentWeek.monday); dateObj.setDate(dateObj.getDate() + i);
                                                            return <th key={d} className="px-3 py-4 text-center text-xs font-bold tracking-widest border-r border-slate-700">{d} <span className="block text-[10px] text-slate-400 mt-0.5">{dateObj.getDate()}</span></th>;
                                                        })}
                                                        <th className="px-6 py-4 text-right text-xs font-black uppercase">Actions</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-200">
                                                    {weeklyData.map(emp => (
                                                        <tr key={emp.username} className="hover:bg-indigo-50/10">
                                                            <td className="px-6 py-4 border-r border-slate-100">
                                                                <div className="font-bold text-slate-900 text-sm">{emp.username.split('@')}</div>
                                                                <div className="text-xs text-slate-500">{emp.username}</div>
                                                            </td>
                                                            {Array.from({length: 7}).map((_, i) => {
                                                                const dObj = new Date(currentWeek.monday); dObj.setDate(dObj.getDate() + i);
                                                                return renderGridCell(emp.days[dObj.toISOString().split('T')], dObj.toISOString().split('T'));
                                                            })}
                                                            <td className="px-6 py-4 text-right">
                                                                <button onClick={() => handleApproveWeek(emp)} disabled={processingBulk} className="px-4 py-2 bg-slate-50 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 border border-slate-200 text-xs font-bold rounded-lg shadow-sm">Approve Week</button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                        {renderPagination(currentWeeklyPage, setCurrentWeeklyPage, hasMoreWeekly, 'weekly')}
                                    </div>
                                )}

                                {/* TAB: PENDING STANDARD (RESTORED) */}
                                {activeTab === 'pending_standard' && (
                                    <div className="flex-1 flex flex-col">
                                        <div className="overflow-x-auto p-6">
                                            <table className="min-w-full divide-y divide-slate-200 border border-slate-200 rounded-lg">
                                                <thead className="bg-slate-50">
                                                    <tr>
                                                        <th className="px-6 py-3 text-left"><input type="checkbox" onChange={(e) => handleSelectAll(e, 'standard')} checked={pendingRequests.length > 0 && selectedStandardRows.size === pendingRequests.length} /></th>
                                                        <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Employee</th>
                                                        <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Date</th>
                                                        <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Status</th>
                                                        <th className="px-6 py-3 text-right">Actions</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-200">
                                                    {pendingRequests.map(req => (
                                                        <tr key={req.rowKey} className={selectedStandardRows.has(req.rowKey) ? 'bg-indigo-50/50' : 'hover:bg-slate-50'}>
                                                            <td className="px-6 py-4"><input type="checkbox" checked={selectedStandardRows.has(req.rowKey)} onChange={() => toggleSelection(req.rowKey, 'standard')} /></td>
                                                            <td className="px-6 py-4 text-sm font-bold text-slate-900">{req.username}</td>
                                                            <td className="px-6 py-4 text-sm text-slate-600">{req.date}</td>
                                                            <td className="px-6 py-4"><span className="px-2 py-1 bg-amber-100 text-amber-800 text-xs font-bold rounded-md">Pending ({req.requestedStatus})</span></td>
                                                            <td className="px-6 py-4 text-right flex justify-end gap-2">
                                                                <button onClick={() => handleSingleStandardApproval(req, 'Approved')} disabled={processingBulk} className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded font-bold text-xs hover:bg-emerald-100">Approve</button>
                                                                <button onClick={() => handleSingleStandardApproval(req, 'Rejected')} disabled={processingBulk} className="px-3 py-1 bg-white text-slate-700 border border-slate-300 rounded font-bold text-xs hover:bg-rose-50 hover:text-rose-700">Reject</button>
                                                                <button onClick={() => { setSelectedUsername(req.username); setIsCalendarModalOpen(true); }} className="text-indigo-600 font-bold text-xs ml-2 hover:underline">View</button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                        {renderPagination(currentAttendancePage, setCurrentAttendancePage, hasMoreAttendance, 'attendance')}
                                    </div>
                                )}

                                {/* TAB: PENDING WEEKEND (RESTORED) */}
                                {activeTab === 'pending_weekend' && (
                                    <div className="flex-1 flex flex-col">
                                        <div className="overflow-x-auto p-6">
                                            <table className="min-w-full divide-y divide-slate-200 border border-slate-200 rounded-lg">
                                                <thead className="bg-slate-50">
                                                    <tr>
                                                        <th className="px-6 py-3 text-left"><input type="checkbox" onChange={(e) => handleSelectAll(e, 'weekend')} checked={weekendRequests.length > 0 && selectedWeekendRows.size === weekendRequests.length} /></th>
                                                        <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Employee</th>
                                                        <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Date</th>
                                                        <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Reason</th>
                                                        <th className="px-6 py-3 text-right">Actions</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-200">
                                                    {weekendRequests.map(req => (
                                                        <tr key={req.rowKey} className={selectedWeekendRows.has(req.rowKey) ? 'bg-indigo-50/50' : 'hover:bg-slate-50'}>
                                                            <td className="px-6 py-4"><input type="checkbox" checked={selectedWeekendRows.has(req.rowKey)} onChange={() => toggleSelection(req.rowKey, 'weekend')} /></td>
                                                            <td className="px-6 py-4 text-sm font-bold text-slate-900">{req.partitionKey}</td>
                                                            <td className="px-6 py-4 text-sm text-slate-600">{req.date}</td>
                                                            <td className="px-6 py-4 text-sm text-slate-500 max-w-xs truncate">{req.reason}</td>
                                                            <td className="px-6 py-4 text-right flex justify-end gap-2">
                                                                <button onClick={() => handleSingleWeekendApproval(req, 'Approved')} disabled={processingBulk} className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded font-bold text-xs hover:bg-emerald-100">Approve</button>
                                                                <button onClick={() => handleSingleWeekendApproval(req, 'Rejected')} disabled={processingBulk} className="px-3 py-1 bg-white text-slate-700 border border-slate-300 rounded font-bold text-xs hover:bg-rose-50 hover:text-rose-700">Reject</button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                        {renderPagination(currentWeekendPage, setCurrentWeekendPage, hasMoreWeekend, 'weekend')}
                                    </div>
                                )}

                                {/* TAB: EXCEPTIONS QUEUE (NEW) */}
                                {activeTab === 'exceptions' && (
                                    <div className="flex-1 flex flex-col p-6">
                                        <div className="border border-slate-200 rounded-xl shadow-sm overflow-hidden mb-4">
                                            <table className="min-w-full divide-y divide-slate-200">
                                                <thead className="bg-slate-50">
                                                    <tr>
                                                        <th className="px-6 py-4 text-left text-xs font-black text-slate-500 uppercase">Date</th>
                                                        <th className="px-6 py-4 text-left text-xs font-black text-slate-500 uppercase">Employee</th>
                                                        <th className="px-6 py-4 text-left text-xs font-black text-slate-500 uppercase">System Flag</th>
                                                        <th className="px-6 py-4 text-right text-xs font-black text-slate-500 uppercase">Resolution</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-200">
                                                    {exceptionsData.map(req => {
                                                        const stdHours = (req.standardTimeMs || 0) / (1000 * 60 * 60);
                                                        const extHours = (req.extraTimeMs || 0) / (1000 * 60 * 60);
                                                        let flagMsg = "Pending Approval"; let flagColor = "text-amber-700 bg-amber-50 border-amber-200";
                                                        if (stdHours > 0 && stdHours < 4) { flagMsg = "Shift < 4 Hours"; flagColor = "text-rose-700 bg-rose-50 border-rose-200"; }
                                                        else if (extHours > 2) { flagMsg = "Excessive Overtime (>2h)"; flagColor = "text-fuchsia-700 bg-fuchsia-50 border-fuchsia-200"; }
                                                        return (
                                                            <tr key={req.rowKey} className="hover:bg-slate-50">
                                                                <td className="px-6 py-4 text-sm font-bold text-slate-900">{req.date}</td>
                                                                <td className="px-6 py-4 text-sm text-slate-600">{req.username}</td>
                                                                <td className="px-6 py-4">
                                                                    <span className={`px-3 py-1 rounded-md border text-xs font-bold ${flagColor}`}>{flagMsg}</span>
                                                                    <div className="text-[11px] text-slate-400 mt-1 font-semibold">Std: {formatMsToTime(req.standardTimeMs)} | Ext: {formatMsToTime(req.extraTimeMs)}</div>
                                                                </td>
                                                                <td className="px-6 py-4 text-right">
                                                                    <button onClick={() => { setSelectedUsername(req.username); setIsCalendarModalOpen(true); }} className="text-indigo-600 hover:text-indigo-900 font-bold text-xs bg-indigo-50 px-4 py-2 rounded-lg border border-indigo-100">Investigate</button>
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                        {renderPagination(currentExceptionsPage, setCurrentExceptionsPage, hasMoreExceptions, 'exceptions')}
                                    </div>
                                )}

                                {/* TAB: DIRECTORY (RESTORED) */}
                                {activeTab === 'directory' && (
                                    <div className="flex-1 flex flex-col p-6">
                                        <div className="border border-slate-200 rounded-xl shadow-sm overflow-hidden mb-4">
                                            <table className="min-w-full divide-y divide-slate-200">
                                                <thead className="bg-slate-50">
                                                    <tr>
                                                        <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Employee</th>
                                                        <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">System Role</th>
                                                        <th className="px-6 py-3 text-right">Actions</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-200">
                                                    {usersList.map(u => (
                                                        <tr key={u.username} className="hover:bg-slate-50">
                                                            <td className="px-6 py-4 text-sm font-bold text-slate-900">{u.username}</td>
                                                            <td className="px-6 py-4"><span className="px-2 py-1 bg-slate-100 text-slate-700 text-xs font-bold rounded-md border border-slate-200">{u.role || u.userRole || 'Employee'}</span></td>
                                                            <td className="px-6 py-4 text-right"><button onClick={() => { setSelectedUsername(u.username); setIsCalendarModalOpen(true); }} className="text-indigo-600 font-bold text-xs hover:underline">View Calendar</button></td>
                                                        </tr>
                                                    ))}
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
                <AttendanceApprovalModal isOpen={isCalendarModalOpen} onClose={() => { setIsCalendarModalOpen(false); setSelectedUsername(null); fetchData(); }} selectedUsername={selectedUsername} onApprovalComplete={() => { setIsCalendarModalOpen(false); setSelectedUsername(null); setSuccess('Processed successfully.'); fetchData(); setTimeout(() => setSuccess(''), 3000); }} />
            )}
        </div>
    );
};

export default ApproveAttendancePage;