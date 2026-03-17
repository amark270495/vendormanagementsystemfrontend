import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { usePermissions } from '../hooks/usePermissions';
import { apiService } from '../api/apiService';
import Spinner from '../components/Spinner';
import Dropdown from '../components/Dropdown';
import HeaderMenu from '../components/dashboard/HeaderMenu';
import ConfirmationModal from '../components/dashboard/ConfirmationModal';
import ViewDetailsModal from '../components/dashboard/ViewDetailsModal';
import ColumnSettingsModal from '../components/dashboard/ColumnSettingsModal';
import CandidateDetailsModal from '../components/dashboard/CandidateDetailsModal';
import AddCommentModal from '../components/dashboard/AddCommentModal'; 
import MemoizedTableRow from '../components/dashboard/MemoizedTableRow';
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
const DATE_COLUMNS = ['Posting Date', 'Deadline'];
const NUMBER_COLUMNS = ['# Submitted', 'Max Submissions'];

const REMARKS_OPTIONS = [
    'Posted Through Mail',
    'Posting Assigned',
    'Resume Received',
    'Resume Submitting',
    'Resume Submitted',
    'No Resumes Found',
    'Posting Cancelled',
    'Submission Date Closed'
];

const DashboardPage = () => {
    const { user, updatePreferences } = useAuth();
    const { canEditDashboard } = usePermissions(); 
    
    const [searchParams] = useSearchParams();
    const sheetKey = searchParams.get('key');

    const [rawData, setRawData] = useState({ header: [], rows: [] });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [sortConfig, setSortConfig] = useState({ key: 'Posting Date', direction: 'ascending' });
    const [batchSize, setBatchSize] = useState(15);
    const [visibleCount, setVisibleCount] = useState(15);

    const [generalFilter, setGeneralFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [columnFilters, setColumnFilters] = useState({});
    const [unsavedChanges, setUnsavedChanges] = useState({});
    
    // 🎯 Reverted back to your original reliable rowIndex/cellIndex logic
    const [editingCell, setEditingCell] = useState(null); 
    const [recruiters, setRecruiters] = useState([]);
    
    const [modalState, setModalState] = useState({ type: null, data: null });
    const [isColumnModalOpen, setColumnModalOpen] = useState(false);

    const colWidths = useMemo(() => ({
        'Posting ID': 'w-23',
        'Posting Title': 'w-30',
        'Posting Date': 'w-22',
        'Deadline': 'w-25',
        'Max Submissions': 'w-20',
        'Max C2C Rate': 'w-20',
        'Client Info': 'w-30',
        'Required Skill Set': 'w-60',
        'Any Required Certificates': 'w-30',
        'Work Position Type': 'w-23',
        'Working By': 'w-28',
        'No. of Resumes Submitted': 'w-24',
        '# Submitted': 'w-22',
        'Remarks': 'w-50',
        '1st Candidate Name': 'w-25',
        '2nd Candidate Name': 'w-25',
        '3rd Candidate Name': 'w-25',
        'Status': 'w-25',
        'Actions': 'w-15'
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
        if (!sheetKey || !user?.userIdentifier) return;
        setLoading(true);
        setError('');
        setUnsavedChanges({});
        try {
            const result = await apiService.getDashboardData(sheetKey, user.userIdentifier);
            if (result.data.success) {
                setRawData({ header: result.data.header, rows: result.data.rows });
                setVisibleCount(batchSize); 
            } else {
                setError(result.data.message);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to fetch dashboard data.');
        } finally {
            setLoading(false);
        }
    }, [sheetKey, user?.userIdentifier, batchSize]);

    useEffect(() => {
        const fetchRecruiters = async () => {
            try {
                const result = await apiService.getUsers(user.userIdentifier);
                if (result.data.success) {
                    const recruitmentRoles = ['Recruitment Team', 'Recruitment Manager'];
                    const filteredUsers = result.data.users
                        .filter(u => recruitmentRoles.includes(u.backendOfficeRole))
                        .map(u => u.displayName); 
                    setRecruiters(filteredUsers);
                }
            } catch (err) {
                console.error("Failed to fetch recruiters:", err);
            }
        };

        fetchRecruiters();
        loadData();
    }, [loadData, user?.userIdentifier]);

    const transformedData = useMemo(() => {
        let { header, rows } = rawData;
        if (!header?.length) return { header: [], rows: [] };
        
        const headerRenames = { 'Last Submission Date': 'Deadline', 'No. of Resumes Submitted': '# Submitted' };
        const originalHeaderMap = new Map(header.map((h, i) => [h, i]));
        
        let transformedHeader = header
            .map(h => headerRenames[h] || h)
            .filter(h => h !== 'Company Name' && h !== 'Comments');

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
                const cellValue = row[originalHeaderMap.get(originalHeader)];
                
                if (newHeader === 'Working By' && Array.isArray(cellValue)) {
                    return cellValue.join(', ');
                }

                return cellValue;
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

    const handleLoadMore = () => setVisibleCount(prev => prev + batchSize);

    const handleBatchSizeChange = (e) => {
        const val = parseInt(e.target.value);
        setBatchSize(val);
        setVisibleCount(val); 
    };

    const handleSort = (key, direction) => setSortConfig({ key, direction });
    const handleFilterChange = (header, config) => setColumnFilters(prev => ({ ...prev, [header]: config }));

    // 🎯 REVERTED: Explicitly using rowIndex and cellIndex exactly as you originally wrote it
    const handleCellEdit = useCallback((rowIndex, cellIndex, value) => {
        if (!canEditDashboard) return;
        const postingId = filteredAndSortedData[rowIndex][displayHeader.indexOf('Posting ID')];
        const headerName = displayHeader[cellIndex];
        const finalValue = Array.isArray(value) ? value.join(', ') : value;
        setUnsavedChanges(prev => ({ ...prev, [postingId]: { ...prev[postingId], [headerName]: finalValue } }));
    }, [canEditDashboard, filteredAndSortedData, displayHeader]);

    const handleCellClick = useCallback((rowIndex, cellIndex) => {
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
    }, [canEditDashboard, filteredAndSortedData, displayHeader]);

    const handleAddComment = (job, customComment) => {
        if (!canEditDashboard) return;
        const postingId = job['Posting ID'];
        setUnsavedChanges(prev => ({ 
            ...prev, [postingId]: { ...prev[postingId], ['Comments']: customComment } 
        }));
        setModalState({ type: null, data: null });
    };

    const handleSaveChanges = async () => {
        if (!canEditDashboard) return;

        const headerMap = {
            'Working By': 'workingBy',
            '# Submitted': 'noOfResumesSubmitted',
            'Remarks': 'remarks',
            'Comments': 'comments' 
        };

        const updates = Object.entries(unsavedChanges)
            .map(([postingId, changes]) => ({
                rowKey: postingId,
                changes: Object.entries(changes).reduce((acc, [header, value]) => {
                    if (headerMap[header]) {
                        acc[headerMap[header]] = value;
                    }
                    return acc;
                }, {})
            }))
            .filter(u => Object.keys(u.changes).length > 0);

        if (updates.length === 0) return;

        setLoading(true);

        try {
            await apiService.updateJobPosting(updates, user.userIdentifier);

            for (const [postingId, changes] of Object.entries(unsavedChanges)) {
                if (changes['Working By'] && changes['Working By'] !== 'Need To Update') {
                    
                    let jobRow = rawData.rows.find(row => String(row[rawData.header.indexOf('Posting ID')]) === String(postingId));
                    let headers = rawData.header;

                    if (!jobRow) {
                        jobRow = filteredAndSortedData.find(row => String(row[displayHeader.indexOf('Posting ID')]) === String(postingId));
                        headers = displayHeader;
                    }

                    if (jobRow) {
                        const jobTitle = jobRow[headers.indexOf('Posting Title')] || '';
                        const assignedUsers = String(changes['Working By']).split(',').map(s => s.trim()).filter(s => s && s !== 'Need To Update');

                        if (assignedUsers.length > 0) {
                            try {
                                await apiService.sendAssignmentEmail({
                                    jobTitle, postingId, assignedUsers, authenticatedUsername: user.userIdentifier
                                });
                            } catch (emailErr) {
                                console.error("Error sending bulk emails:", emailErr);
                            }
                        }
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
            await apiService.saveUserDashboardPreferences(user.userIdentifier, { 
                columnOrder: newPrefs.order, columnVisibility: newPrefs.visibility 
            });
            updatePreferences({ 
                ...user.dashboardPreferences,
                columnOrder: JSON.stringify(newPrefs.order), columnVisibility: JSON.stringify(newPrefs.visibility) 
            });
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
            ...filteredAndSortedData.map(row => row.map(v => `"${String(v || '').replace(/"/g, '""')}"`).join(','))
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
        doc.autoTable({ head: [displayHeader], body: filteredAndSortedData });
        doc.save(`${sheetKey}_report.pdf`);
    };

    // 🎯 REVERTED: Your original, perfectly structured jobToObject function so the ActionMenu renders flawlessly.
    const jobToObject = useCallback((row) => {
        const obj = displayHeader.reduce((acc, h, i) => ({...acc, [h]: row[i]}), {});
        const postingId = obj['Posting ID'];
        
        const rawRow = rawData.rows.find(r => String(r[rawData.header.indexOf('Posting ID')]) === String(postingId));
        const dbComment = (rawRow && rawData.header.indexOf('Comments') > -1) ? rawRow[rawData.header.indexOf('Comments')] : '';
        
        if (unsavedChanges[postingId]?.['Comments'] !== undefined) {
            obj['Comments'] = unsavedChanges[postingId]['Comments'];
        } else {
            obj['Comments'] = dbComment;
        }
        return obj;
    }, [displayHeader, rawData, unsavedChanges]);

    const getStatusBadge = useCallback((status) => {
        const lowerStatus = String(status || '').toLowerCase();
        if (lowerStatus === 'open') return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
        if (lowerStatus === 'closed') return 'bg-rose-50 text-rose-700 border border-rose-200';
        return 'bg-slate-50 text-slate-700 border border-slate-200';
    }, []);

    return (
        <div className="space-y-6 antialiased text-slate-900 pb-10">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between md:items-end gap-2 border-b border-slate-200/80 pb-5">
                <div>
                    <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">
                        {DASHBOARD_CONFIGS[sheetKey]?.title || 'Dashboard'}
                    </h2>
                    <p className="text-sm text-slate-500 font-medium mt-1">Manage and track recruitment progress.</p>
                </div>
                
                <div className="flex items-center space-x-3">
                    {canEditDashboard && Object.keys(unsavedChanges).length > 0 && (
                        <button 
                            onClick={handleSaveChanges} 
                            disabled={loading}
                            className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-bold shadow-md shadow-indigo-200 transition-all flex items-center justify-center gap-2 focus:ring-4 focus:ring-indigo-100" 
                        >
                            {loading ? <Spinner size="4" /> : (
                                <>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                                    Save Changes ({Object.keys(unsavedChanges).length})
                                </>
                            )}
                        </button>
                    )}

                    <Dropdown 
                        trigger={
                            <button className="px-5 py-2.5 bg-white text-slate-700 rounded-xl hover:bg-slate-50 hover:text-indigo-600 font-semibold flex items-center shadow-sm border border-slate-300 transition-all focus:ring-4 focus:ring-slate-100">
                                Options
                                <svg className="ml-2 h-4 w-4 text-slate-400 group-hover:text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"/></svg>
                            </button>
                        }
                    >
                        <a href="#" onClick={(e) => { e.preventDefault(); setColumnModalOpen(true); }} className="block px-4 py-2 text-sm text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 font-medium border-b border-slate-100 transition-colors">Column Settings</a>
                        <a href="#" onClick={(e) => { e.preventDefault(); downloadPdf(); }} className="block px-4 py-2 text-sm text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 font-medium border-b border-slate-100 transition-colors">Export PDF</a>
                        <a href="#" onClick={(e) => { e.preventDefault(); downloadCsv(); }} className="block px-4 py-2 text-sm text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 font-medium transition-colors">Export CSV</a>
                    </Dropdown>
                </div>
            </div>
            
            {/* Search and Filters */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/70 shadow-sm flex flex-col md:flex-row items-center gap-4">
                <div className="relative w-full md:w-96">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                        <svg className="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                    </span>
                    <input 
                        type="text" 
                        placeholder="Search entries..." 
                        value={generalFilter} 
                        onChange={(e) => setGeneralFilter(e.target.value)} 
                        className="w-full pl-10 pr-4 py-2 bg-white border border-slate-300 rounded-xl text-sm focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all shadow-sm placeholder:text-slate-400 font-medium"
                    />
                </div>
                <select 
                    value={statusFilter} 
                    onChange={(e) => setStatusFilter(e.target.value)} 
                    className="w-full md:w-auto bg-white border border-slate-300 rounded-xl px-4 py-2 text-sm font-semibold text-slate-700 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 shadow-sm transition-all"
                >
                    <option value="">All Statuses</option>
                    <option value="Open">Status: Open</option>
                    <option value="Closed">Status: Closed</option>
                </select>
            </div>

            {loading && !rawData.rows.length && <div className="flex flex-col items-center justify-center h-64 bg-white rounded-2xl border border-slate-200 shadow-sm"><Spinner size="6" color="text-indigo-500" /><p className="mt-4 text-slate-500 font-medium">Refreshing dashboard...</p></div>}
            {error && <div className="text-rose-700 bg-rose-50 p-4 rounded-2xl border border-rose-200 font-medium flex items-center gap-3 shadow-sm"><svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/></svg> Error: {error}</div>}
            
            {/* 🎯 OLD STYLE STRUCTURE: Table in its own 70vh scrolling wrapper */}
            {!loading && !error && (
                <div className="bg-white rounded-2xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-slate-200/80 overflow-hidden" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                    <table className="w-full text-sm text-left border-collapse table-fixed min-w-[1250px]">
                        <colgroup>
                            {displayHeader.map(h => (
                                <col key={h} className={colWidths[h] || 'w-auto'} />
                            ))}
                            <col className={colWidths['Actions'] || 'w-15'} />
                        </colgroup>
                        
                        <thead className="sticky top-0 z-20 bg-white/90 backdrop-blur-md shadow-[0_1px_3px_rgba(0,0,0,0.05)] border-b border-slate-200/80">
                            <tr>
                                {displayHeader.map((h, i) => (
                                    <th key={h} scope="col" className="p-0 border-r border-slate-100 last:border-r-0 relative group">
                                        <Dropdown 
                                            width="72" 
                                            align={i < 2 ? 'left' : 'right'} 
                                            trigger={
                                            <div className="flex items-center justify-between w-full h-full cursor-pointer px-5 py-4 hover:bg-slate-50/60 transition-colors">
                                                <span className="font-bold text-slate-700 tracking-tight uppercase text-[11px] flex flex-wrap leading-tight break-words max-w-full">
                                                    {h}
                                                </span>
                                                {sortConfig.key === h ? (
                                                    <span className="text-indigo-600 ml-2 font-bold">{sortConfig.direction === 'ascending' ? '↑' : '↓'}</span>
                                                ) : (
                                                    <span className="text-slate-300 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">↕</span>
                                                )}
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
                                <th scope="col" className="px-5 py-4 font-bold text-slate-700 uppercase text-[11px] text-center tracking-tight">Action</th>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-slate-100">
                            {filteredAndSortedData.slice(0, visibleCount).map((row, rowIndex) => {
                                const postingId = row[displayHeader.indexOf('Posting ID')];

                                return (
                                    <MemoizedTableRow
                                        key={postingId || rowIndex}
                                        row={row}
                                        rowIndex={rowIndex}
                                        postingId={postingId}
                                        displayHeader={displayHeader}
                                        editingCell={editingCell}
                                        unsavedChanges={unsavedChanges}
                                        canEditDashboard={canEditDashboard}
                                        recruiters={recruiters}
                                        REMARKS_OPTIONS={REMARKS_OPTIONS}
                                        jobToObject={jobToObject}
                                        handleCellClick={handleCellClick}
                                        handleCellEdit={handleCellEdit}
                                        setEditingCell={setEditingCell}
                                        setModalState={setModalState}
                                        getStatusBadge={getStatusBadge}
                                        CANDIDATE_COLUMNS={CANDIDATE_COLUMNS}
                                        EDITABLE_COLUMNS={EDITABLE_COLUMNS}
                                        DATE_COLUMNS={DATE_COLUMNS}
                                    />
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {/* 🎯 OLD STYLE STRUCTURE: Sticky floating footer block beneath the table */}
            {!loading && !error && filteredAndSortedData.length > 0 && (
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white/95 backdrop-blur-md p-5 rounded-2xl border border-slate-200/80 shadow-[0_-4px_15px_-4px_rgba(0,0,0,0.05),0_4px_15px_-4px_rgba(0,0,0,0.05)] sticky bottom-4 z-10">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Rows</span>
                            <select
                                value={batchSize}
                                onChange={handleBatchSizeChange}
                                className="block w-20 border-slate-300 rounded-xl py-1.5 text-sm font-bold text-slate-700 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 shadow-sm bg-white transition-all cursor-pointer"
                            >
                                {[15, 30, 50, 100].map(v => <option key={v} value={v}>{v}</option>)}
                                <option value={filteredAndSortedData.length}>All</option>
                            </select>
                        </div>
                        <span className="h-5 w-px bg-slate-200"></span>
                        <span className="text-sm text-slate-500 font-medium">
                            Showing <span className="text-slate-900 font-bold">{Math.min(visibleCount, filteredAndSortedData.length)}</span> of <span className="text-slate-900 font-bold">{filteredAndSortedData.length}</span>
                        </span>
                    </div>
                    
                    {visibleCount < filteredAndSortedData.length && (
                        <button onClick={handleLoadMore} className="w-full sm:w-auto px-6 py-2.5 bg-slate-800 text-white text-sm font-bold rounded-xl hover:bg-slate-900 focus:ring-4 focus:ring-slate-300 transition-all shadow-md">
                            Load More
                        </button>
                    )}
                </div>
            )}
            
            <ConfirmationModal isOpen={['close', 'archive', 'delete'].includes(modalState.type)} onClose={() => setModalState({type: null, data: null})} onConfirm={() => handleAction(modalState.type, modalState.data)} title={`Confirm ${modalState.type}`} message={`Are you sure you want to ${modalState.type} the job "${modalState.data?.['Posting Title']}"?`} confirmText={modalState.type}/>
            <ViewDetailsModal isOpen={modalState.type === 'details'} onClose={() => setModalState({type: null, data: null})} job={modalState.data}/>
            <ColumnSettingsModal isOpen={isColumnModalOpen} onClose={() => setColumnModalOpen(false)} allHeaders={transformedData.header} userPrefs={userPrefs} onSave={handleSaveColumnSettings}/>
            <CandidateDetailsModal isOpen={modalState.type === 'addCandidate'} onClose={() => setModalState({type: null, data: null})} onSave={handleSaveCandidate} jobInfo={modalState.data} />
            <AddCommentModal isOpen={modalState.type === 'comment'} onClose={() => setModalState({type: null, data: null})} onSave={handleAddComment} job={modalState.data} />
        </div>
    );
};

export default DashboardPage;