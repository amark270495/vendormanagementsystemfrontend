import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { usePermissions } from '../hooks/usePermissions';
import { apiService } from '../api/apiService';
import { formatDate, getDeadlineClass } from '../utils/helpers';
import Spinner from '../components/Spinner';
import Dropdown from '../components/Dropdown';
import HeaderMenu from '../components/dashboard/HeaderMenu';
import ActionMenu from '../components/dashboard/ActionMenu';
import ConfirmationModal from '../components/dashboard/ConfirmationModal';
import ViewDetailsModal from '../components/dashboard/ViewDetailsModal';
import ColumnSettingsModal from '../components/dashboard/ColumnSettingsModal';
import CandidateDetailsModal from '../components/dashboard/CandidateDetailsModal';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

// --- SVG Icons (Removed from table headers, kept for save button) ---
// const IconCalendar = ... (removed)
// const IconClock = ... (removed)
// const IconCheckCircle = ... (removed)
// const IconHash = ... (removed)
// --- End SVG Icons ---

const DASHBOARD_CONFIGS = {
    'ecaltVMSDisplay': { title: 'Eclat VMS' },
    'taprootVMSDisplay': { title: 'Taproot VMS' },
    'michiganDisplay': { title: 'Michigan VMS' },
    'EclatTexasDisplay': { title: 'Eclat Texas VMS' },
    'TaprootTexasDisplay': { title: 'Taproot Texas VMS' },
    'VirtusaDisplay': { title: 'Virtusa Taproot' },
    'DeloitteDisplay': { title: 'Deloitte Taproot' }
};
const EDITABLE_COLUMNS = ['Working By', '# Submitted', 'Remarks'];
const CANDIDATE_COLUMNS = ['1st Candidate Name', '2nd Candidate Name', '3rd Candidate Name'];
const DATE_COLUMNS = ['Posting Date', 'Deadline']; // <-- Filter logic uses this
const NUMBER_COLUMNS = ['# Submitted', 'Max Submissions']; // <-- Filter logic uses this

const REMARKS_OPTIONS = [
    'Posted Through Mail',
    'Posting Assigned',
    'Resume Received',
    'Resume Submitting',
    'Resume Submitted',
    'No Resumes Found'
];


const DashboardPage = ({ sheetKey }) => {
    const { user, updatePreferences } = useAuth();
    const { canEditDashboard, canViewDashboards, canAddPosting, canEmailReports } = usePermissions(); 

    const [rawData, setRawData] = useState({ header: [], rows: [] });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });
    const [generalFilter, setGeneralFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [columnFilters, setColumnFilters] = useState({});
    const [unsavedChanges, setUnsavedChanges] = useState({});
    const [editingCell, setEditingCell] = useState(null);
    const [recruiters, setRecruiters] = useState([]);
    
    const [modalState, setModalState] = useState({ type: null, data: null });
    const [isColumnModalOpen, setColumnModalOpen] = useState(false);

    // *** MODIFIED: Using your new specified column widths ***
    const colWidths = useMemo(() => ({
        'Posting ID': 'w-23',
        'Posting Title': 'w-30',
        'Posting Date': 'w-22',
        'Last Submission Date': 'w-20', // Kept for mapping, even if hidden/renamed
        'Deadline': 'w-25',
        'Max Submissions': 'w-25',
        'Max C2C Rate': 'w-25',
        'Client Info': 'w-30',
        'Required Skill Set': 'w-64', // Kept increased width
        'Any Required Certificates': 'w-30',
        'Work Position Type': 'w-23',
        'Working By': 'w-28',
        'No. of Resumes Submitted': 'w-24', // Kept for mapping
        '# Submitted': 'w-22',
        'Remarks': 'w-30',
        '1st Candidate Name': 'w-25',
        '2nd Candidate Name': 'w-25',
        '3rd Candidate Name': 'w-25',
        'Status': 'w-25',
        'Actions': 'w-15'
    }), []);
    // *** END MODIFICATION ***

    const userPrefs = useMemo(() => {
        const safeParse = (jsonString, def = []) => {
            try {
                const parsed = JSON.parse(jsonString);
                return Array.isArray(parsed) ? parsed : def;
            } catch (e) {
                // If it's already an array (due to old bug), just return it.
                return Array.isArray(jsonString) ? jsonString : def;
            }
        };
        return {
            order: safeParse(user?.dashboardPreferences?.columnOrder, []),
            visibility: safeParse(user?.dashboardPreferences?.columnVisibility, []),
        };
    }, [user]);

    const loadData = useCallback(async () => {
        setLoading(true);
        setError('');
        setUnsavedChanges({});
        try {
            const result = await apiService.getDashboardData(sheetKey, user.userIdentifier);
            if (result.data.success) {
                setRawData({ header: result.data.header, rows: result.data.rows });
            } else {
                setError(result.data.message);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to fetch dashboard data.');
        } finally {
            setLoading(false);
        }
    }, [sheetKey, user.userIdentifier]);

    useEffect(() => {
        const fetchRecruiters = async () => {
            try {
                const result = await apiService.getUsers(user.userIdentifier);
                if (result.data.success) {
                    const recruitmentRoles = ['Recruitment Team', 'Recruitment Manager'];
                    const filteredUsers = result.data.users.filter(u => recruitmentRoles.includes(u.backendOfficeRole));
                    setRecruiters(filteredUsers);
                }
            } catch (err) {
                console.error("Failed to fetch users for dropdown:", err);
            }
        };
        fetchRecruiters();
        loadData();
    }, [loadData, user.userIdentifier]);

    const transformedData = useMemo(() => {
        let { header, rows } = rawData;
        if (!header?.length) return { header: [], rows: [] };
        
        const headerRenames = { 'Last Submission Date': 'Deadline', 'No. of Resumes Submitted': '# Submitted' };
        const originalHeaderMap = new Map(header.map((h, i) => [h, i]));
        let transformedHeader = header.map(h => headerRenames[h] || h).filter(h => h !== 'Company Name');

        const clientIdx = originalHeaderMap.get('Client Name');
        const postingFromIdx = originalHeaderMap.get('Posting From');
        const workLocationIdx = originalHeaderMap.get('Work Location');
        const clientInfoIdx = transformedHeader.indexOf('Client Name');

        if (clientInfoIdx !== -1 && [clientIdx, postingFromIdx, workLocationIdx].every(i => i !== undefined)) {
            transformedHeader[clientInfoIdx] = 'Client Info';
            transformedHeader = transformedHeader.filter(h => !['Posting From', 'Work Location'].includes(h));
        }

        const transformedRows = rows.map(row => {
            return transformedHeader.map(newHeader => {
                if (newHeader === 'Client Info') {
                    const client = row[clientIdx] || '';
                    const postingFrom = row[postingFromIdx] || '';
                    const workLocation = row[workLocationIdx] || '';
                    let info = client;
                    if (postingFrom && !['All', 'Need To Update'].includes(postingFrom)) info += ` / ${postingFrom}`;
                    if (workLocation && workLocation !== 'Need To Update') info += ` (${workLocation})`;
                    return info;
                }
                const originalHeader = Object.keys(headerRenames).find(k => headerRenames[k] === newHeader) || newHeader;
                return row[originalHeaderMap.get(originalHeader)];
            });
        });
        return { header: transformedHeader, rows: transformedRows };
    }, [rawData]);

    const { displayHeader, displayData } = useMemo(() => {
        let { header, rows } = transformedData;
        const defaultOrder = ['Posting ID', 'Posting Title', 'Posting Date', 'Max Submissions', 'Max C2C Rate', 'Required Skill Set', 'Any Required Certificates', 'Work Position Type', 'Working By', 'Remarks', '1st Candidate Name', '2nd Candidate Name', '3rd Candidate Name', 'Status', 'Deadline', 'Client Info', '# Submitted'];
        
        const finalHeaderOrder = userPrefs.order.length > 0
            ? [...userPrefs.order.filter(h => header.includes(h)), ...header.filter(h => !userPrefs.order.includes(h))]
            : [...defaultOrder.filter(h => header.includes(h)), ...header.filter(h => !defaultOrder.includes(h))];

        const reorderIndices = finalHeaderOrder.map(h => header.indexOf(h));
        let finalHeader = finalHeaderOrder;
        let finalRows = rows.map(row => reorderIndices.map(i => row[i]));

        if (userPrefs.visibility.length > 0) {
            const visibleIndices = finalHeader.map((h, i) => userPrefs.visibility.includes(h) ? -1 : i).filter(i => i !== -1);
            finalHeader = visibleIndices.map(i => finalHeader[i]);
            finalRows = finalRows.map(row => visibleIndices.map(i => row[i]));
        }
        
        return { displayHeader: finalHeader, displayData: finalRows };
    }, [transformedData, userPrefs]);

    const filteredAndSortedData = useMemo(() => {
        let data = [...displayData];
        const statusIndex = displayHeader.indexOf('Status');

        if (statusFilter && statusIndex !== -1) {
            data = data.filter(row => (row[statusIndex] || '').toLowerCase() === statusFilter.toLowerCase());
        }

        if (generalFilter) {
            const lowercasedFilter = generalFilter.toLowerCase();
            data = data.filter(row => row.some(cell => String(cell).toLowerCase().includes(lowercasedFilter)));
        }

        if (Object.keys(columnFilters).length > 0) {
            data = data.filter(row => {
                return Object.entries(columnFilters).every(([header, config]) => {
                    if (!config || !config.type || !config.value1) return true;
                    const colIndex = displayHeader.indexOf(header);
                    if (colIndex === -1) return true;
                    
                    const cellValue = String(row[colIndex] || '').toLowerCase();
                    const filterValue1 = String(config.value1).toLowerCase();
                    const filterValue2 = String(config.value2 || '').toLowerCase();

                    const isDate = DATE_COLUMNS.includes(header);
                    const isNumber = NUMBER_COLUMNS.includes(header);
                    
                    let cellNum = NaN, val1Num = NaN, val2Num = NaN;

                    if (isDate) {
                        cellNum = new Date(row[colIndex]).getTime();
                        val1Num = new Date(config.value1).getTime();
                        val2Num = new Date(config.value2).getTime();
                    } else if (isNumber) {
                        cellNum = parseFloat(row[colIndex]);
                        val1Num = parseFloat(config.value1);
                        val2Num = parseFloat(config.value2);
                    }
                    
                    switch (config.type) {
                        case 'contains': return cellValue.includes(filterValue1);
                        case 'not_contains': return !cellValue.includes(filterValue1);
                        case 'equals':
                            if ((isNumber || isDate) && !isNaN(cellNum) && !isNaN(val1Num)) return cellNum === val1Num;
                            return cellValue === filterValue1;
                        case 'above':
                            if ((isNumber || isDate) && !isNaN(cellNum) && !isNaN(val1Num)) return cellNum > val1Num;
                            return cellValue > filterValue1;
                        case 'below':
                            if ((isNumber || isDate) && !isNaN(cellNum) && !isNaN(val1Num)) return cellNum < val1Num;
                            return cellValue < filterValue1;
                        case 'between':
                            if ((isNumber || isDate) && !isNaN(cellNum) && !isNaN(val1Num) && !isNaN(val2Num)) return cellNum >= val1Num && cellNum <= val2Num;
                            return cellValue >= filterValue1 && cellValue <= filterValue2;
                        default: return true;
                    }
                });
            });
        }

        if (sortConfig.key) {
            const sortIndex = displayHeader.indexOf(sortConfig.key);
            if (sortIndex !== -1) {
                const isDate = DATE_COLUMNS.includes(sortConfig.key);
                const isNumber = NUMBER_COLUMNS.includes(sortConfig.key);
                data.sort((a, b) => {
                    let valA = a[sortIndex];
                    let valB = b[sortIndex];

                    if (isDate) {
                        valA = new Date(valA).getTime() || 0;
                        valB = new Date(valB).getTime() || 0;
                    } else if (isNumber) {
                        valA = parseFloat(valA) || 0;
                        valB = parseFloat(valB) || 0;
                    } else {
                        valA = String(valA || '').toLowerCase();
                        valB = String(valB || '').toLowerCase();
                    }

                    if (valA < valB) return sortConfig.direction === 'ascending' ? -1 : 1;
                    if (valA > valB) return sortConfig.direction === 'ascending' ? 1 : -1;
                    return 0;
                });
            }
        }
        return data;
    }, [displayData, sortConfig, generalFilter, statusFilter, displayHeader, columnFilters]);

    const handleSort = (key, direction) => setSortConfig({ key, direction });
    const handleFilterChange = (header, config) => {
        setColumnFilters(prev => ({...prev, [header]: config}));
    };

    const handleCellEdit = (rowIndex, cellIndex, value) => {
        if (!canEditDashboard) return;
        const postingId = filteredAndSortedData[rowIndex][displayHeader.indexOf('Posting ID')];
        const headerName = displayHeader[cellIndex];
        setUnsavedChanges(prev => ({ ...prev, [postingId]: { ...prev[postingId], [headerName]: value } }));
    };

    const handleSaveChanges = async () => {
        if (!canEditDashboard) return;
        const headerMap = { 'Working By': 'workingBy', '# Submitted': 'noOfResumesSubmitted', 'Remarks': 'remarks' };
        const updates = Object.entries(unsavedChanges).map(([postingId, changes]) => ({
            rowKey: postingId,
            changes: Object.entries(changes).reduce((acc, [header, value]) => {
                if (headerMap[header]) acc[headerMap[header]] = value;
                return acc;
            }, {})
        })).filter(u => Object.keys(u.changes).length > 0);

        if (updates.length === 0) return;
        setLoading(true);
        try {
            await apiService.updateJobPosting(updates, user.userIdentifier);

            for (const [postingId, changes] of Object.entries(unsavedChanges)) {
                if (changes['Working By'] && changes['Working By'] !== 'Need To Update') {
                    const jobRow = filteredAndSortedData.find(row => row[displayHeader.indexOf('Posting ID')] === postingId);
                    if (jobRow) {
                        const jobTitle = jobRow[displayHeader.indexOf('Posting Title')];
                        await apiService.sendAssignmentEmail(jobTitle, postingId, changes['Working By'], user.userIdentifier);
                    }
                }
            }
            setUnsavedChanges({});
            loadData();
        } catch (err) {
            setError(`Failed to save: ${err.response?.data?.message || err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (actionType, job) => {
        if (!canEditDashboard) return;
        setLoading(true);
        const postingId = job['Posting ID'];
        try {
            if (actionType === 'close') {
                await apiService.updateJobStatus([postingId], 'Closed', user.userIdentifier);
            } else {
                await apiService.archiveOrDeleteJob([postingId], actionType, user.userIdentifier);
            }
            loadData();
        } catch (err) {
            setError(`Action '${actionType}' failed: ${err.response?.data?.message || err.message}`);
        } finally {
            setLoading(false);
            setModalState({ type: null, data: null });
        }
    };

    const handleSaveCandidate = async (candidateData, candidateSlot) => {
        setLoading(true);
        try {
            await apiService.addCandidateDetails(candidateData, user.userIdentifier);
            const fullName = `${candidateData.firstName} ${candidateData.middleName || ''} ${candidateData.lastName}`.replace(/\s+/g, ' ').trim();
            const headerMap = { '1st Candidate Name': 'candidateName1', '2nd Candidate Name': 'candidateName2', '3rd Candidate Name': 'candidateName3' };
            const fieldToUpdate = headerMap[candidateSlot];

            const updatePayload = [{
                rowKey: candidateData.postingId,
                changes: { [fieldToUpdate]: fullName }
            }];

            await apiService.updateJobPosting(updatePayload, user.userIdentifier);
            loadData();
        } catch (error) {
            setError(error.response?.data?.message || error.message || "An error occurred while saving the candidate.");
            throw error;
        } finally {
            setLoading(false);
        }
    };
    
    const handleSaveColumnSettings = async (newPrefs) => {
        setLoading(true);
        try {
            // *** This logic is correct based on your file structure ***
            // Send raw arrays to the API
            await apiService.saveUserDashboardPreferences(user.userIdentifier, { 
                columnOrder: newPrefs.order, 
                columnVisibility: newPrefs.visibility 
            });
            // Update local context with stringified versions
            updatePreferences({ 
                ...user.dashboardPreferences,
                columnOrder: JSON.stringify(newPrefs.order), 
                columnVisibility: JSON.stringify(newPrefs.visibility) 
            });
            // *** End of settings logic ***
        } catch(err) {
            setError(`Failed to save column settings: ${err.message}`);
        } finally {
            setLoading(false);
            setColumnModalOpen(false);
        }
    };

    const downloadCsv = () => {
        const csvContent = [
            displayHeader.join(','),
            ...filteredAndSortedData.map(row => 
                row.map(v => `"${String(v || '').replace(/"/g, '""')}"`).join(',')
            )
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `${sheetKey}_report.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const downloadPdf = () => {
        const doc = new jsPDF('landscape');
        doc.autoTable({
            head: [displayHeader],
            body: filteredAndSortedData,
        });
        doc.save(`${sheetKey}_report.pdf`);
    };
    
    const jobToObject = (row) => displayHeader.reduce((obj, h, i) => ({...obj, [h]: row[i]}), {});

    const handleCellClick = (rowIndex, cellIndex) => {
        if (!canEditDashboard) return; 
        const headerName = displayHeader[cellIndex];
        
        if (EDITABLE_COLUMNS.includes(headerName)) {
            setEditingCell({ rowIndex, cellIndex });
        } else if (CANDIDATE_COLUMNS.includes(headerName)) {
            const rowData = filteredAndSortedData[rowIndex];
            const jobInfo = {
                postingId: rowData[displayHeader.indexOf('Posting ID')],
                clientInfo: rowData[displayHeader.indexOf('Client Info')],
                resumeWorkedBy: rowData[displayHeader.indexOf('Working By')],
                candidateSlot: headerName
            };
            setModalState({ type: 'addCandidate', data: jobInfo });
        }
    };
    
    const getStatusBadge = (status) => {
        const lowerStatus = String(status || '').toLowerCase();
        if (lowerStatus === 'open') {
            return 'bg-green-100 text-green-700';
        }
        if (lowerStatus === 'closed') {
            return 'bg-red-100 text-red-700';
        }
        return 'bg-gray-100 text-gray-700';
    };

    // *** REMOVED getHeaderIcon function ***

    return (
        <div className="space-y-4">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-2">
                {/* *** MODIFIED: Reduced font size *** */}
                <h2 className="text-xl font-bold text-gray-800">{DASHBOARD_CONFIGS[sheetKey]?.title || 'Dashboard'}</h2>
                {/* Save Changes Button */}
                {canEditDashboard && Object.keys(unsavedChanges).length > 0 && (
                    <button 
                        onClick={handleSaveChanges} 
                        className="px-5 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold shadow-md transition-all flex items-center justify-center gap-2" 
                        disabled={loading}
                    >
                        {loading ? <Spinner size="5" /> : (
                            <>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                                Save Changes ({Object.keys(unsavedChanges).length})
                            </>
                        )}
                    </button>
                )}
            </div>
            
            {/* Filter Bar */}
            {/* *** MODIFIED: Updated filter bar style to be lighter *** */}
            <div className="bg-white p-4 rounded-xl shadow-lg border border-gray-200 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
                    <input type="text" placeholder="Search all jobs..." value={generalFilter} onChange={(e) => setGeneralFilter(e.target.value)} className="shadow-sm border-gray-300 rounded-lg px-4 py-2 w-full md:w-64 focus:ring-2 focus:ring-indigo-500 transition"/>
                    <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="shadow-sm border-gray-300 rounded-lg px-4 py-2 w-full md:w-auto focus:ring-2 focus:ring-indigo-500 transition">
                        <option value="">All Statuses</option>
                        <option value="Open">Open</option>
                        <option value="Closed">Closed</option>
                    </select>
                </div>
                <div className="flex items-center space-x-2 w-full md:w-auto">
                    <Dropdown 
                        trigger={
                            <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-semibold flex items-center justify-center w-full md:w-auto shadow-sm transition border border-gray-300">
                                Options 
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-2 h-4 w-4"><polyline points="6 9 12 15 18 9"></polyline></svg>
                            </button>
                        }
                    >
                        <a href="#" onClick={(e) => { e.preventDefault(); setColumnModalOpen(true); }} className="block px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50">Column Settings</a>
                        <a href="#" onClick={(e) => { e.preventDefault(); downloadPdf(); }} className="block px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50">Download PDF</a>
                        <a href="#" onClick={(e) => { e.preventDefault(); downloadCsv(); }} className="block px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50">Download CSV</a>
                    </Dropdown>
                </div>
            </div>

            {loading && <div className="flex justify-center items-center h-64"><Spinner /></div>}
            {error && <div className="text-red-500 bg-red-100 p-4 rounded-lg">Error: {error}</div>}
            
            {!loading && !error && (
                <div className="bg-white rounded-xl shadow-lg border border-gray-200" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                    <div> 
                        <table className="w-full text-sm text-left text-gray-500 table-fixed">
                            <colgroup>
                                {displayHeader.map(h => (
                                    <col key={h} className={colWidths[h] || 'w-auto'} />
                                ))}
                                {/* *** FIX: Using your width for Actions *** */}
                                <col className={colWidths['Actions'] || 'w-15'} />
                            </colgroup>
                            {/* *** MODIFIED: Table Header Styling *** */}
                            <thead className="text-xs text-slate-800 uppercase bg-slate-100 sticky top-0 z-10 border-b border-slate-300">
                                <tr>
                                    {displayHeader.map(h => (
                                        <th key={h} scope="col" className="p-0 border-r border-slate-200 last:border-r-0">
                                            <Dropdown width="64" trigger={
                                                <div className="flex items-center justify-between w-full h-full cursor-pointer px-3 py-3 hover:bg-slate-200 transition-colors">
                                                    {/* *** MODIFIED: Removed icon, kept text *** */}
                                                    <span className="font-semibold break-words flex items-center">
                                                        {h}
                                                    </span>
                                                    {sortConfig.key === h && (sortConfig.direction === 'ascending' ? ' ▲' : ' ▼')}
                                                </div>
                                            }>
                                                <HeaderMenu 
                                                    header={h} 
                                                    onSort={(dir) => handleSort(h, dir)} 
                                                    filterConfig={columnFilters[h]} 
                                                    onFilterChange={handleFilterChange}
                                                />
                                            </Dropdown>
                                        </th>
                                    ))}
                                    <th scope="col" className="px-4 py-3 border-r border-slate-200 last:border-r-0 font-semibold text-slate-800">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredAndSortedData.map((row, rowIndex) => (
                                    // *** MODIFIED: Added alternating row colors ***
                                    <tr key={row[displayHeader.indexOf('Posting ID')] || rowIndex} className="bg-white border-b border-gray-200 odd:bg-white even:bg-slate-50 hover:bg-indigo-50 transition-colors">
                                        {row.map((cell, cellIndex) => {
                                            const headerName = displayHeader[cellIndex];
                                            const postingId = row[displayHeader.indexOf('Posting ID')];
                                            const isEditing = editingCell?.rowIndex === rowIndex && editingCell?.cellIndex === cellIndex;
                                            
                                            return (
                                                <td key={cellIndex} 
                                                    onClick={() => handleCellClick(rowIndex, cellIndex)} 
                                                    // *** MODIFIED: Cell Styling ***
                                                    className={`px-4 py-3 border-r border-gray-200 font-medium ${unsavedChanges[postingId]?.[headerName] !== undefined ? 'bg-yellow-100' : ''} ${headerName === 'Deadline' ? getDeadlineClass(cell) : 'text-gray-800'} ${canEditDashboard && (EDITABLE_COLUMNS.includes(headerName) || CANDIDATE_COLUMNS.includes(headerName)) ? 'cursor-pointer' : ''} whitespace-normal break-words align-top`}
                                                >
                                                    {isEditing && headerName === 'Working By' && canEditDashboard ? (
                                                        <select
                                                            value={unsavedChanges[postingId]?.[headerName] || cell}
                                                            onBlur={() => setEditingCell(null)}
                                                            onChange={(e) => {
                                                                handleCellEdit(rowIndex, cellIndex, e.target.value);
                                                                setEditingCell(null);
                                                            }}
                                                            className="block w-full border-gray-300 rounded-md shadow-sm p-2 text-sm"
                                                            autoFocus
                                                        >
                                                            <option value="Need To Update">Unassigned</option>
                                                            {recruiters.map(r => <option key={r.username} value={r.displayName}>{r.displayName}</option>)}
                                                        </select>
                                                    ) : isEditing && headerName === 'Remarks' && canEditDashboard ? (
                                                        <select
                                                            value={unsavedChanges[postingId]?.[headerName] || cell}
                                                            onBlur={() => setEditingCell(null)}
                                                            onChange={(e) => {
                                                                handleCellEdit(rowIndex, cellIndex, e.target.value);
                                                                setEditingCell(null);
                                                            }}
                                                            className="block w-full border-gray-300 rounded-md shadow-sm p-2 text-sm"
                                                            autoFocus
                                                        >
                                                            <option value="">Select Remark</option>
                                                            {REMARKS_OPTIONS.map(option => (
                                                                <option key={option} value={option}>{option}</option>
                                                            ))}
                                                        </select>
                                                    ) : (
                                                        <div contentEditable={isEditing && headerName !== 'Working By' && headerName !== 'Remarks' && canEditDashboard} suppressContentEditableWarning={true} onBlur={e => { if (isEditing) { handleCellEdit(rowIndex, cellIndex, e.target.innerText); setEditingCell(null); } }}>
                                                            {headerName === 'Status' ? (
                                                                <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${getStatusBadge(cell)}`}>
                                                                    {cell}
                                                                </span>
                                                            ) : DATE_COLUMNS.includes(headerName) ? (
                                                                formatDate(cell)
                                                            ) : CANDIDATE_COLUMNS.includes(headerName) ? (
                                                                <span className={canEditDashboard && (cell === 'Need To Update' || !cell) ? 'text-indigo-600 hover:underline font-semibold' : 'text-gray-700'}>
                                                                    {cell}
                                                                </span>
                                                            ) : (
                                                                cell
                                                            )}
                                                        </div>
                                                    )}
                                                </td>
                                            );
            
                                        })}
                                        <td className="px-4 py-3 align-top text-center border-r border-gray-200">
                                            {canEditDashboard && <ActionMenu job={jobToObject(row)} onAction={(type, job) => setModalState({type, data: job})} />}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
            
            {/* Modals */}
            <ConfirmationModal isOpen={['close', 'archive', 'delete'].includes(modalState.type)} onClose={() => setModalState({type: null, data: null})} onConfirm={() => handleAction(modalState.type, modalState.data)} title={`Confirm ${modalState.type}`} message={`Are you sure you want to ${modalState.type} the job "${modalState.data?.['Posting Title']}"?`} confirmText={modalState.type}/>
            <ViewDetailsModal isOpen={modalState.type === 'details'} onClose={() => setModalState({type: null, data: null})} job={modalState.data}/>
            <ColumnSettingsModal isOpen={isColumnModalOpen} onClose={() => setColumnModalOpen(false)} allHeaders={transformedData.header} userPrefs={userPrefs} onSave={handleSaveColumnSettings}/>
            <CandidateDetailsModal isOpen={modalState.type === 'addCandidate'} onClose={() => setModalState({type: null, data: null})} onSave={handleSaveCandidate} jobInfo={modalState.data} />
        </div>
    );
};

export default DashboardPage;