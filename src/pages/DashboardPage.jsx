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

    // Column widths to prevent horizontal scrolling
    const colWidths = useMemo(() => ({
        'Posting ID': 'w-28', // 112px
        'Posting Title': 'w-64', // 256px
        'Posting Date': 'w-32', // 128px
        'Deadline': 'w-32', // 128px
        'Max Submissions': 'w-24', // 96px
        'Max C2C Rate': 'w-28', // 112px
        'Client Info': 'w-48', // 192px
        'Required Skill Set': 'w-64', // 256px
        'Any Required Certificates': 'w-48', // 192px
        'Work Position Type': 'w-32', // 128px
        'Working By': 'w-40', // 160px
        '# Submitted': 'w-24', // 96px
        'Remarks': 'w-48', // 192px
        '1st Candidate Name': 'w-40', // 160px
        '2nd Candidate Name': 'w-40', // 160px
        '3rd Candidate Name': 'w-40', // 160px
        'Status': 'w-28', // 112px
        'Actions': 'w-20' // 80px
    }), []);

    const userPrefs = useMemo(() => {
        const safeParse = (jsonString, def = []) => {
            try {
                const parsed = JSON.parse(jsonString);
                return Array.isArray(parsed) ? parsed : def;
            } catch (e) {
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

        // *** THIS SECTION HANDLES PER-COLUMN FILTERING ***
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

                    // Parse dates and numbers for comparison
                    if (isDate) {
                        cellNum = new Date(row[colIndex]).getTime();
                        val1Num = new Date(config.value1).getTime();
                        val2Num = new Date(config.value2).getTime();
                    } else if (isNumber) {
                        cellNum = parseFloat(row[colIndex]);
                        val1Num = parseFloat(config.value1);
                        val2Num = parseFloat(config.value2);
                    }
                    
                    // Apply filter logic
                    switch (config.type) {
                        case 'contains': return cellValue.includes(filterValue1);
                        case 'not_contains': return !cellValue.includes(filterValue1);
                        case 'equals':
                            if ((isNumber || isDate) && !isNaN(cellNum) && !isNaN(val1Num)) return cellNum === val1Num;
                            return cellValue === filterValue1;
                        case 'above': // For dates (After) and numbers (Greater than)
                            if ((isNumber || isDate) && !isNaN(cellNum) && !isNaN(val1Num)) return cellNum > val1Num;
                            return cellValue > filterValue1;
                        case 'below': // For dates (Before) and numbers (Less than)
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
        // *** END OF FILTER LOGIC ***

        // *** THIS SECTION HANDLES SORTING ***
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

    // *** This function is called by the HeaderMenu component ***
    const handleSort = (key, direction) => setSortConfig({ key, direction });

    // *** This function is called by the HeaderMenu component ***
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
            // 1. Save the detailed candidate info
            await apiService.addCandidateDetails(candidateData, user.userIdentifier);

            // 2. Update the job posting with the candidate's full name
            const fullName = `${candidateData.firstName} ${candidateData.middleName || ''} ${candidateData.lastName}`.replace(/\s+/g, ' ').trim();
            const headerMap = { '1st Candidate Name': 'candidateName1', '2nd Candidate Name': 'candidateName2', '3rd Candidate Name': 'candidateName3' };
            const fieldToUpdate = headerMap[candidateSlot];

            const updatePayload = [{
                rowKey: candidateData.postingId,
                changes: { [fieldToUpdate]: fullName }
            }];

            await apiService.updateJobPosting(updatePayload, user.userIdentifier);

            // 3. Refresh data
            loadData();
        } catch (error) {
            setError(error.response?.data?.message || error.message || "An error occurred while saving the candidate.");
            // Re-throw to show error in modal
            throw error;
        } finally {
            setLoading(false);
        }
    };
    
    const handleSaveColumnSettings = async (newPrefs) => {
        setLoading(true);
        try {
            // *** FIX: Use correct preference keys ***
            await apiService.saveUserDashboardPreferences(user.userIdentifier, { 
                columnOrder: JSON.stringify(newPrefs.order), 
                columnVisibility: JSON.stringify(newPrefs.visibility) 
            });
            updatePreferences({ 
                columnOrder: JSON.stringify(newPrefs.order), 
                columnVisibility: JSON.stringify(newPrefs.visibility) 
            });
            // *** END FIX ***
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

    return (
        <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-800">{DASHBOARD_CONFIGS[sheetKey]?.title || 'Dashboard'}</h2>
            
            <div className="bg-white p-4 rounded-lg shadow-sm border flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-4">
                    <input type="text" placeholder="Search all columns..." value={generalFilter} onChange={(e) => setGeneralFilter(e.target.value)} className="shadow-sm border-gray-300 rounded-md px-3 py-2"/>
                    <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="shadow-sm border-gray-300 rounded-md px-3 py-2">
                        <option value="">All Statuses</option>
                        <option value="Open">Open</option>
                        <option value="Closed">Closed</option>
                    </select>
                </div>
                <div className="flex items-center space-x-2">
                    {canEditDashboard && Object.keys(unsavedChanges).length > 0 && (
                        <button onClick={handleSaveChanges} className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700" disabled={loading}>
                            {loading ? <Spinner size="5" /> : 'Save Changes'}
                        </button>
                    )}
                    <Dropdown 
                        trigger={
                            <button className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 flex items-center">
                                Options 
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-2 h-4 w-4"><polyline points="6 9 12 15 18 9"></polyline></svg>
                            </button>
                        }
                    >
                        <a href="#" onClick={(e) => { e.preventDefault(); setColumnModalOpen(true); }} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Column Settings</a>
                        <a href="#" onClick={(e) => { e.preventDefault(); downloadPdf(); }} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Download PDF</a>
                        <a href="#" onClick={(e) => { e.preventDefault(); downloadCsv(); }} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Download CSV</a>
                    </Dropdown>
                </div>
            </div>

            {loading && <div className="flex justify-center items-center h-64"><Spinner /></div>}
            {error && <div className="text-red-500 bg-red-100 p-4 rounded-lg">Error: {error}</div>}
            
            {!loading && !error && (
                <div className="bg-white rounded-lg shadow-lg border border-gray-200" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                    {/* *** FIX: No overflow-x-auto on this div *** */}
                    <div> 
                        {/* *** FIX: Added table-fixed and w-full *** */}
                        <table className="w-full text-sm text-left text-gray-500 table-fixed">
                            {/* *** FIX: Added colgroup to define widths *** */}
                            <colgroup>
                                {displayHeader.map(h => (
                                    <col key={h} className={colWidths[h] || 'w-auto'} />
                                ))}
                                <col className={colWidths['Actions'] || 'w-20'} />
                            </colgroup>
                            <thead className="text-xs text-gray-700 uppercase bg-slate-200 sticky top-0 z-10">
                                <tr>
                                    {displayHeader.map(h => (
                                        <th key={h} scope="col" className="p-0 border-r border-slate-300 last:border-r-0">
                                            {/* This Dropdown contains the HeaderMenu component */}
                                            <Dropdown width="64" trigger={
                                                <div className="flex items-center justify-between w-full h-full cursor-pointer p-3 hover:bg-slate-300">
                                                    {/* *** FIX: Added break-words to allow header text wrapping *** */}
                                                    <span className="font-bold break-words">{h}</span>
                                                    {sortConfig.key === h && (sortConfig.direction === 'ascending' ? ' ▲' : ' ▼')}
                                                </div>
                                            }>
                                                {/* This component provides the sort/filter UI */}
                                                <HeaderMenu 
                                                    header={h} 
                                                    onSort={(dir) => handleSort(h, dir)} 
                                                    filterConfig={columnFilters[h]} 
                                                    onFilterChange={handleFilterChange}
                                                />
                                            </Dropdown>
                                        </th>
                                    ))}
                                    <th scope="col" className="px-4 py-3 border-r border-slate-300 last:border-r-0">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredAndSortedData.map((row, rowIndex) => (
                                    <tr key={row[displayHeader.indexOf('Posting ID')] || rowIndex} className="bg-gray-50 border-b hover:bg-gray-100">
                                        {row.map((cell, cellIndex) => {
                                            const headerName = displayHeader[cellIndex];
                                            const postingId = row[displayHeader.indexOf('Posting ID')];
                                            const isEditing = editingCell?.rowIndex === rowIndex && editingCell?.cellIndex === cellIndex;
                                            
                                            return (
                                                <td key={cellIndex} 
                                                    onClick={() => handleCellClick(rowIndex, cellIndex)} 
                                                    /* *** FIX: Added 'whitespace-normal break-words' *** */
                                                    className={`px-4 py-3 border-r border-slate-200 last:border-r-0 font-medium text-gray-900 align-middle ${unsavedChanges[postingId]?.[headerName] !== undefined ? 'bg-yellow-100' : ''} ${headerName === 'Deadline' ? getDeadlineClass(cell) : ''} ${canEditDashboard && (EDITABLE_COLUMNS.includes(headerName) || CANDIDATE_COLUMNS.includes(headerName)) ? 'cursor-pointer hover:bg-blue-50' : ''} whitespace-normal break-words`}
                                                >
                                                    {isEditing && headerName === 'Working By' && canEditDashboard ? (
                                                        <select
                                                            value={unsavedChanges[postingId]?.[headerName] || cell}
                                                            onBlur={() => setEditingCell(null)}
                                                            onChange={(e) => {
                                                                handleCellEdit(rowIndex, cellIndex, e.target.value);
                                                                setEditingCell(null);
                                                            }}
                                                            className="block w-full border-gray-300 rounded-md shadow-sm p-2"
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
                                                            className="block w-full border-gray-300 rounded-md shadow-sm p-2"
                                                            autoFocus
                                                        >
                                                            <option value="">Select Remark</option>
                                                            {REMARKS_OPTIONS.map(option => (
                                                                <option key={option} value={option}>{option}</option>
                                                            ))}
                                                        </select>
                                                    ) : (
                                                        <div contentEditable={isEditing && headerName !== 'Working By' && headerName !== 'Remarks' && canEditDashboard} suppressContentEditableWarning={true} onBlur={e => { if (isEditing) { handleCellEdit(rowIndex, cellIndex, e.target.innerText); setEditingCell(null); } }}>
                                                            {DATE_COLUMNS.includes(headerName) ? formatDate(cell) : cell}
                                                        </div>
                                                    )}
                                                </td>
                                            );
            
                                        })}
                                        <td className="px-4 py-3 align-middle text-center border-r border-slate-200 last:border-r-0">
                                            {canEditDashboard && <ActionMenu job={jobToObject(row)} onAction={(type, job) => setModalState({type, data: job})} />}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
            
            <ConfirmationModal isOpen={['close', 'archive', 'delete'].includes(modalState.type)} onClose={() => setModalState({type: null, data: null})} onConfirm={() => handleAction(modalState.type, modalState.data)} title={`Confirm ${modalState.type}`} message={`Are you sure you want to ${modalState.type} the job "${modalState.data?.['Posting Title']}"?`} confirmText={modalState.type}/>
            <ViewDetailsModal isOpen={modalState.type === 'details'} onClose={() => setModalState({type: null, data: null})} job={modalState.data}/>
            <ColumnSettingsModal isOpen={isColumnModalOpen} onClose={() => setColumnModalOpen(false)} allHeaders={transformedData.header} userPrefs={userPrefs} onSave={handleSaveColumnSettings}/>
            <CandidateDetailsModal isOpen={modalState.type === 'addCandidate'} onClose={() => setModalState({type: null, data: null})} onSave={handleSaveCandidate} jobInfo={modalState.data} />
        </div>
    );
};

export default DashboardPage;