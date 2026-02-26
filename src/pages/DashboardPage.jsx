import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
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
import AddCommentModal from '../components/dashboard/AddCommentModal'; 
import jsPDF from 'jspdf';
import 'jspdf-autotable';

// --- SVG Icons ---
const IconHash = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline-block mr-1 opacity-70" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9.243 3.03a1 1 0 01.727.46l4 5a1 1 0 01.23 1.02l-1 8a1 1 0 01-.958.79H7.758a1 1 0 01-.958-.79l-1-8a1 1 0 01.23-1.02l4-5a1 1 0 01.727-.46zM10 12a1 1 0 100-2 1 1 0 000 2zM9 16a1 1 0 112 0 1 1 0 01-2 0z" clipRule="evenodd" /></svg>;

// *** MultiSelectDropdown Component ***
const MultiSelectDropdown = ({ options, selectedNames, onChange, onBlur }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
                if (onBlur) onBlur(); 
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [onBlur]);

    const handleToggleSelect = (name) => {
        if (name === "Need To Update") {
            onChange(["Need To Update"]);
            return;
        }
        
        const currentSelected = Array.isArray(selectedNames) ? selectedNames : [];

        const newSelectedNames = currentSelected.includes(name)
            ? currentSelected.filter(n => n !== name)
            : [...currentSelected.filter(n => n !== "Need To Update"), name]; 

        if (newSelectedNames.length === 0) {
            onChange(["Need To Update"]);
        } else {
            onChange(newSelectedNames);
        }
    };
    
    const displayArray = Array.isArray(selectedNames) ? selectedNames : [];
    const displayValue = displayArray.length > 0 && displayArray[0] !== "Need To Update"
        ? `${displayArray.length} selected`
        : "Unassigned";

    return (
        <div className="relative w-full" ref={dropdownRef}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="block w-full border border-gray-300 rounded-md shadow-sm p-2 text-sm bg-white text-left focus:ring-2 focus:ring-blue-500 transition-all"
            >
                <span className="truncate block pr-4">{displayValue}</span>
                <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                     <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M10 3a1 1 0 01.707.293l3 3a1 1 0 01-1.414 1.414L10 5.414 7.707 7.707a1 1 0 01-1.414-1.414l3-3A1 1 0 0110 3zm-3.707 9.293a1 1 0 011.414 0L10 14.586l2.293-2.293a1 1 0 011.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                </span>
            </button>
            {isOpen && (
                <div className="absolute z-50 left-0 mt-1 bg-white border border-gray-300 rounded-md shadow-xl max-h-60 overflow-y-auto min-w-full w-auto">
                    <ul>
                        <li
                            key="unassigned"
                            onClick={() => handleToggleSelect("Need To Update")}
                            className="flex items-center px-4 py-2 text-sm text-gray-700 cursor-pointer hover:bg-gray-50"
                        >
                            <input
                                type="checkbox"
                                readOnly
                                checked={displayArray.includes("Need To Update")}
                                className="mr-2 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            Unassigned
                        </li>
                        {options.map(name => (
                            <li
                                key={name}
                                onClick={() => handleToggleSelect(name)}
                                className="flex items-center px-4 py-2 text-sm text-gray-700 cursor-pointer hover:bg-gray-50"
                            >
                                <input
                                    type="checkbox"
                                    readOnly
                                    checked={displayArray.includes(name)}
                                    className="mr-2 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                {name}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

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

const DashboardPage = ({ sheetKey }) => {
    const { user, updatePreferences } = useAuth();
    const { canEditDashboard, canViewDashboards } = usePermissions(); 

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
    const [editingCell, setEditingCell] = useState(null);
    const [recruiters, setRecruiters] = useState([]);
    
    const [modalState, setModalState] = useState({ type: null, data: null });
    const [isColumnModalOpen, setColumnModalOpen] = useState(false);

    const colWidths = useMemo(() => ({
        'Posting ID': 'w-23',
        'Posting Title': 'w-30',
        'Posting Date': 'w-22',
        'Last Submission Date': 'w-20',
        'Deadline': 'w-25',
        'Max Submissions': 'w-25',
        'Max C2C Rate': 'w-25',
        'Client Info': 'w-30',
        'Required Skill Set': 'w-64',
        'Any Required Certificates': 'w-30',
        'Work Position Type': 'w-23',
        'Working By': 'w-28',
        'No. of Resumes Submitted': 'w-24',
        '# Submitted': 'w-22',
        'Remarks': 'w-35', // Keeps enough width for the comment bubble
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
    }, [sheetKey, user.userIdentifier, batchSize]);

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
    }, [loadData, user.userIdentifier]);

    const transformedData = useMemo(() => {
        let { header, rows } = rawData;
        if (!header?.length) return { header: [], rows: [] };
        
        const headerRenames = { 'Last Submission Date': 'Deadline', 'No. of Resumes Submitted': '# Submitted' };
        const originalHeaderMap = new Map(header.map((h, i) => [h, i]));
        
        // ✅ CRITICAL FIX: Filters out 'Comments' here so it NEVER becomes a table column
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

    const handleLoadMore = () => {
        setVisibleCount(prev => prev + batchSize);
    };

    const handleBatchSizeChange = (e) => {
        const val = parseInt(e.target.value);
        setBatchSize(val);
        setVisibleCount(val); 
    };

    const handleSort = (key, direction) => setSortConfig({ key, direction });
    const handleFilterChange = (header, config) => setColumnFilters(prev => ({ ...prev, [header]: config }));

    const handleCellEdit = (rowIndex, cellIndex, value) => {
        if (!canEditDashboard) return;
        const postingId = filteredAndSortedData[rowIndex][displayHeader.indexOf('Posting ID')];
        const headerName = displayHeader[cellIndex];
        
        const finalValue = Array.isArray(value) ? value.join(', ') : value;
        
        setUnsavedChanges(prev => ({ ...prev, [postingId]: { ...prev[postingId], [headerName]: finalValue } }));
    };

    const handleAddComment = (job, customComment) => {
        if (!canEditDashboard) return;
        const postingId = job['Posting ID'];

        setUnsavedChanges(prev => ({ 
            ...prev, 
            [postingId]: { 
                ...prev[postingId], 
                ['Comments']: customComment 
            } 
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
                        
                        const assignedUsers = String(changes['Working By'])
                            .split(',')
                            .map(s => s.trim())
                            .filter(s => s && s !== 'Need To Update');

                        if (assignedUsers.length > 0) {
                            try {
                                await apiService.sendAssignmentEmail({
                                    jobTitle,
                                    postingId,
                                    assignedUsers,
                                    authenticatedUsername: user.userIdentifier
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
                columnOrder: newPrefs.order, 
                columnVisibility: newPrefs.visibility 
            });
            updatePreferences({ 
                ...user.dashboardPreferences,
                columnOrder: JSON.stringify(newPrefs.order), 
                columnVisibility: JSON.stringify(newPrefs.visibility) 
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
    
    const jobToObject = (row) => {
        const obj = displayHeader.reduce((acc, h, i) => ({...acc, [h]: row[i]}), {});
        const postingId = obj['Posting ID'];
        
        // Pull comment specifically from the raw data so the modal has it for editing
        const rawRow = rawData.rows.find(r => String(r[rawData.header.indexOf('Posting ID')]) === String(postingId));
        const dbComment = (rawRow && rawData.header.indexOf('Comments') > -1) ? rawRow[rawData.header.indexOf('Comments')] : '';
        
        if (unsavedChanges[postingId]?.['Comments'] !== undefined) {
            obj['Comments'] = unsavedChanges[postingId]['Comments'];
        } else {
            obj['Comments'] = dbComment;
        }
        return obj;
    };

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
            return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
        }
        if (lowerStatus === 'closed') {
            return 'bg-rose-50 text-rose-700 border border-rose-200';
        }
        return 'bg-slate-50 text-slate-700 border border-slate-200';
    };

    return (
        <div className="space-y-6 antialiased text-slate-900">
            <div className="flex flex-col md:flex-row justify-between md:items-end gap-2 border-b border-slate-200 pb-4">
                <div>
                    <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight">
                        {DASHBOARD_CONFIGS[sheetKey]?.title || 'Dashboard'}
                    </h2>
                    <p className="text-sm text-slate-500 font-medium">Manage and track recruitment progress.</p>
                </div>
                
                <div className="flex items-center space-x-2">
                    {canEditDashboard && Object.keys(unsavedChanges).length > 0 && (
                        <button 
                            onClick={handleSaveChanges} 
                            disabled={loading}
                            className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold shadow-lg shadow-blue-200 transition-all flex items-center justify-center gap-2" 
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
                            <button className="px-4 py-2.5 bg-white text-slate-700 rounded-lg hover:bg-slate-50 font-semibold flex items-center shadow-sm border border-slate-300 transition-all">
                                Options
                                <svg className="ml-2 h-4 w-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"/></svg>
                            </button>
                        }
                    >
                        <a href="#" onClick={(e) => { e.preventDefault(); setColumnModalOpen(true); }} className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 font-medium border-b border-slate-100">Column's Settings</a>
                        <a href="#" onClick={(e) => { e.preventDefault(); downloadPdf(); }} className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 font-medium border-b border-slate-100">Download PDF</a>
                        <a href="#" onClick={(e) => { e.preventDefault(); downloadCsv(); }} className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 font-medium">Download CSV</a>
                    </Dropdown>
                </div>
            </div>
            
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col md:flex-row items-center gap-4">
                <div className="relative w-full md:w-80">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                        <svg className="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                    </span>
                    <input type="text" placeholder="Search entries..." value={generalFilter} onChange={(e) => setGeneralFilter(e.target.value)} className="w-full pl-10 pr-4 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 transition-all shadow-sm"/>
                </div>
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="bg-white border border-slate-300 rounded-lg px-4 py-2 text-sm font-semibold text-slate-700 focus:ring-2 focus:ring-blue-500 shadow-sm">
                    <option value="">All Statuses</option>
                    <option value="Open">Open</option>
                    <option value="Closed">Closed</option>
                </select>
            </div>

            {loading && !rawData.rows.length && <div className="flex flex-col items-center justify-center h-64 bg-white rounded-xl border border-slate-200 shadow-sm"><Spinner /><p className="mt-4 text-slate-500 font-medium">Refreshing dashboard...</p></div>}
            {error && <div className="text-rose-600 bg-rose-50 p-4 rounded-xl border border-rose-200 font-medium flex items-center gap-3"><svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/></svg> Error: {error}</div>}
            
            {!loading && !error && (
                <div className="bg-white rounded-xl shadow-xl shadow-slate-200/50 border border-slate-200 overflow-hidden" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                    <table className="w-full text-sm text-left border-collapse table-fixed min-w-[1250px]">
                        <colgroup>
                            {displayHeader.map(h => (
                                <col key={h} className={colWidths[h] || 'w-auto'} />
                            ))}
                            <col className={colWidths['Actions'] || 'w-15'} />
                        </colgroup>
                        <thead className="bg-slate-100 sticky top-0 z-20 border-b border-slate-200">
                            <tr>
                                {displayHeader.map((h, i) => (
                                    <th key={h} scope="col" className="p-0 border-r border-slate-200 last:border-r-0 relative">
                                        <Dropdown 
                                            width="72" 
                                            align={i < 2 ? 'left' : 'right'} 
                                            trigger={
                                            <div className="flex items-center justify-between w-full h-full cursor-pointer px-4 py-4 hover:bg-slate-200 transition-colors">
                                                <span className="font-bold text-slate-700 tracking-tight uppercase text-[11px] flex flex-wrap leading-tight break-words max-w-full">
                                                    {h}
                                                </span>
                                                {sortConfig.key === h && (
                                                    <span className="text-blue-600 ml-1 font-bold">{sortConfig.direction === 'ascending' ? '↑' : '↓'}</span>
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
                                <th scope="col" className="px-4 py-4 font-bold text-slate-700 uppercase text-[11px] text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredAndSortedData.slice(0, visibleCount).map((row, rowIndex) => {
                                const postingId = row[displayHeader.indexOf('Posting ID')];
                                
                                // ✅ FETCH HIDDEN COMMENT DATA FOR RENDERING
                                const rawRow = rawData.rows.find(r => String(r[rawData.header.indexOf('Posting ID')]) === String(postingId));
                                const dbComment = (rawRow && rawData.header.indexOf('Comments') > -1) ? rawRow[rawData.header.indexOf('Comments')] : '';
                                const currentCustomComment = unsavedChanges[postingId]?.['Comments'] !== undefined 
                                    ? unsavedChanges[postingId]['Comments'] 
                                    : dbComment;

                                return (
                                    <tr key={postingId || rowIndex} className="bg-white hover:bg-blue-50/30 transition-colors">
                                        {row.map((cell, cellIndex) => {
                                            const headerName = displayHeader[cellIndex];
                                            const isEditing = editingCell?.rowIndex === rowIndex && editingCell?.cellIndex === cellIndex;
                                            
                                            const hasUnsaved = unsavedChanges[postingId]?.[headerName] !== undefined || (headerName === 'Remarks' && unsavedChanges[postingId]?.['Comments'] !== undefined);

                                            let selectedWorkingBy = [];
                                            if (headerName === 'Working By') {
                                                const workingByValue = (unsavedChanges[postingId]?.[headerName] !== undefined
                                                    ? unsavedChanges[postingId][headerName]
                                                    : cell) || "Need To Update";
                                                const stringValue = Array.isArray(workingByValue) ? workingByValue.join(', ') : String(workingByValue);
                                                selectedWorkingBy = stringValue.split(',').map(s => s.trim()).filter(s => s && s !== "Need To Update");
                                                if (selectedWorkingBy.length === 0) selectedWorkingBy = ["Need To Update"];
                                            }
                                            
                                            return (
                                                <td key={cellIndex} 
                                                    onClick={() => handleCellClick(rowIndex, cellIndex)} 
                                                    className={`px-4 py-4 border-r border-slate-50 font-medium ${hasUnsaved ? 'bg-amber-50 shadow-inner' : ''} ${headerName === 'Deadline' ? getDeadlineClass(cell) : 'text-slate-600'} ${canEditDashboard && (EDITABLE_COLUMNS.includes(headerName) || CANDIDATE_COLUMNS.includes(headerName)) ? 'cursor-pointer hover:bg-blue-50' : ''} whitespace-normal break-words align-top text-[13px] leading-relaxed`}
                                                >
                                                    {isEditing && headerName === 'Working By' && canEditDashboard ? (
                                                        <MultiSelectDropdown
                                                            options={recruiters}
                                                            selectedNames={selectedWorkingBy} 
                                                            onBlur={() => setEditingCell(null)}
                                                            onChange={(selectedNames) => {
                                                                handleCellEdit(rowIndex, cellIndex, selectedNames);
                                                            }}
                                                        />
                                                    ) : isEditing && headerName === 'Remarks' && canEditDashboard ? (
                                                        <select
                                                            value={unsavedChanges[postingId]?.[headerName] || cell}
                                                            onBlur={() => setEditingCell(null)}
                                                            onChange={(e) => {
                                                                handleCellEdit(rowIndex, cellIndex, e.target.value);
                                                                setEditingCell(null);
                                                            }}
                                                            className="block w-full border-slate-300 rounded-md p-2 text-sm focus:ring-blue-500"
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
                                                                <span className={`px-2.5 py-1 text-[11px] font-bold rounded-full border uppercase tracking-wider whitespace-nowrap ${getStatusBadge(cell)}`}>
                                                                    {cell}
                                                                </span>
                                                            ) : DATE_COLUMNS.includes(headerName) ? (
                                                                formatDate(cell)
                                                            ) : CANDIDATE_COLUMNS.includes(headerName) ? (
                                                                <span className={canEditDashboard && (cell === 'Need To Update' || !cell) ? 'text-blue-600 hover:text-blue-800 underline decoration-blue-200 underline-offset-4 font-bold' : 'text-slate-700 font-semibold'}>
                                                                    {cell || 'Add Candidate'}
                                                                </span>
                                                            ) : headerName === 'Remarks' ? (
                                                                // ✅ DISPLAYS THE REMARK + THE HIDDEN COMMENT
                                                                <div className="flex flex-col gap-2">
                                                                    <span className="font-bold text-slate-800">
                                                                        {cell || <span className="text-slate-400 italic font-normal">No Remark</span>}
                                                                    </span>
                                                                    {currentCustomComment && (
                                                                        <div className="text-[11px] bg-indigo-50/60 text-indigo-700 p-2 rounded border border-indigo-100 shadow-sm whitespace-pre-wrap leading-relaxed">
                                                                            <svg className="w-3.5 h-3.5 inline mr-1 -mt-0.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" /></svg>
                                                                            {currentCustomComment}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            ) : (
                                                                headerName === 'Working By' ? (
                                                                    <div className="flex flex-wrap gap-1.5 max-w-full">
                                                                        {selectedWorkingBy.map((name, idx) => (
                                                                            <span key={idx} className={`px-2 py-0.5 text-[11px] font-bold rounded-md bg-slate-200 text-slate-700 shadow-sm break-words leading-normal inline-block`}>
                                                                                {name}
                                                                            </span>
                                                                        ))}
                                                                    </div>
                                                                ) : (
                                                                    cell
                                                                )
                                                            )}
                                                        </div>
                                                    )}
                                                </td>
                                            );
                                        })}
                                        <td className="px-4 py-4 align-top text-center border-slate-50">
                                            {canEditDashboard && <ActionMenu job={jobToObject(row)} onAction={(type, job) => setModalState({type, data: job})} />}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {!loading && !error && filteredAndSortedData.length > 0 && (
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm sticky bottom-0 z-10">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Rows</span>
                            <select
                                value={batchSize}
                                onChange={handleBatchSizeChange}
                                className="block w-20 border-slate-300 rounded-lg py-1.5 text-sm font-bold text-slate-700 focus:ring-blue-500 shadow-sm bg-white"
                            >
                                {[15, 30, 50, 100].map(v => <option key={v} value={v}>{v}</option>)}
                                <option value={filteredAndSortedData.length}>All</option>
                            </select>
                        </div>
                        <span className="h-4 w-px bg-slate-200"></span>
                        <span className="text-sm text-slate-500 font-medium">
                            Showing <span className="text-slate-900 font-bold">{Math.min(visibleCount, filteredAndSortedData.length)}</span> of <span className="text-slate-900 font-bold">{filteredAndSortedData.length}</span>
                        </span>
                    </div>
                    
                    {visibleCount < filteredAndSortedData.length && (
                        <button onClick={handleLoadMore} className="w-full sm:w-auto px-6 py-2.5 bg-slate-800 text-white text-sm font-bold rounded-lg hover:bg-slate-900 transition-all shadow-lg shadow-slate-300">
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