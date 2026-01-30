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
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { 
  Search, 
  Settings, 
  Save, 
  Download, 
  ChevronDown, 
  Filter, 
  FileText, 
  Columns, 
  XCircle, 
  Layout,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

// --- SVG Icons (Originals preserved) ---
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
                className="flex items-center justify-between w-full border border-slate-300 rounded-lg shadow-sm px-2 py-1.5 text-[12px] bg-white text-left transition-all hover:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 outline-none"
            >
                <span className="truncate">{displayValue}</span>
                <ChevronDown className={`h-3.5 w-3.5 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && (
                <div className="absolute z-[100] left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-xl max-h-56 overflow-y-auto ring-1 ring-black ring-opacity-5">
                    <ul className="p-1">
                        <li
                            key="unassigned"
                            onClick={() => handleToggleSelect("Need To Update")}
                            className="flex items-center px-3 py-2 text-[12px] text-slate-700 cursor-pointer hover:bg-slate-50 rounded transition-colors"
                        >
                            <input
                                type="checkbox"
                                readOnly
                                checked={displayArray.includes("Need To Update")}
                                className="mr-3 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                            />
                            Unassigned
                        </li>
                        {options.map(name => (
                            <li
                                key={name}
                                onClick={() => handleToggleSelect(name)}
                                className="flex items-center px-3 py-2 text-[12px] text-slate-700 cursor-pointer hover:bg-slate-50 rounded transition-colors"
                            >
                                <input
                                    type="checkbox"
                                    readOnly
                                    checked={displayArray.includes(name)}
                                    className="mr-3 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
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
    const [activeMenu, setActiveMenu] = useState(null);

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
        'Remarks': 'w-30',
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

    // ** Handlers for Pagination **
    const handleLoadMore = () => {
        setVisibleCount(prev => prev + batchSize);
    };

    const handleBatchSizeChange = (e) => {
        const val = parseInt(e.target.value);
        setBatchSize(val);
        setVisibleCount(val); // Reset view to new batch size
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

    const handleSaveChanges = async () => {
        if (!canEditDashboard) return;
        const headerMap = { 'Working By': 'workingBy', '# Submitted': 'noOfResumesSubmitted', 'Remarks': 'remarks' };
        const updates = Object.entries(unsavedChanges).map(([postingId, changes]) => ({
            rowKey: postingId,
            changes: Object.entries(changes).reduce((acc, [header, value]) => {
                if (headerMap[header]) {
                    acc[headerMap[header]] = value;
                }
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
                        const assignedUsers = changes['Working By'].split(',').map(s => s.trim()).filter(Boolean);
                        for (const assignedUser of assignedUsers) {
                            if (assignedUser !== 'Need To Update') {
                                await apiService.sendAssignmentEmail(jobTitle, postingId, assignedUser, user.userIdentifier);
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
        if (lowerStatus === 'open') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
        if (lowerStatus === 'closed') return 'bg-rose-50 text-rose-700 border-rose-200';
        return 'bg-slate-100 text-slate-700 border-slate-200';
    };

    return (
        <div className="space-y-4 pb-12 antialiased">
            {/* Page Header */}
            <div className="flex justify-between items-center px-1">
                <h2 className="text-xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
                    <Layout className="h-5 w-5 text-indigo-500" />
                    {DASHBOARD_CONFIGS[sheetKey]?.title || 'Dashboard'}
                </h2>
            </div>
            
            {/* Modern SaaS Toolbar */}
            <div className="bg-white p-3 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-2 w-full md:w-auto">
                    <div className="relative group w-full md:w-72">
                        <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400 group-focus-within:text-indigo-500" />
                        <input 
                            type="text" 
                            placeholder="Search postings..." 
                            value={generalFilter} 
                            onChange={(e) => setGeneralFilter(e.target.value)} 
                            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[13px] outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-inner" 
                        />
                    </div>
                    <div className="relative">
                        <select 
                            value={statusFilter} 
                            onChange={(e) => setStatusFilter(e.target.value)} 
                            className="appearance-none bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 pr-8 text-[12px] font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
                        >
                            <option value="">All Statuses</option>
                            <option value="Open">Open</option>
                            <option value="Closed">Closed</option>
                        </select>
                        <ChevronDown className="absolute right-2 top-2.5 h-3 w-3 text-slate-400 pointer-events-none" />
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {canEditDashboard && Object.keys(unsavedChanges).length > 0 && (
                        <button 
                            onClick={handleSaveChanges} 
                            className="px-4 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-bold text-[12px] shadow-sm flex items-center gap-1.5 active:scale-95 transition-all"
                        >
                            <Save className="h-3.5 w-3.5" /> Save Changes ({Object.keys(unsavedChanges).length})
                        </button>
                    )}
                    <Dropdown 
                        trigger={
                            <button className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-slate-700 rounded-lg hover:bg-slate-50 font-bold text-[12px] border border-slate-300 shadow-sm transition-all active:scale-95">
                                <Settings className="h-3.5 w-3.5 text-slate-500" /> Options <ChevronDown className="h-3 w-3" />
                            </button>
                        }
                    >
                        <div className="p-1 min-w-[160px]">
                            <button onClick={() => setColumnModalOpen(true)} className="flex items-center w-full px-3 py-2 text-[12px] text-slate-700 hover:bg-slate-50 rounded-md transition-colors">
                                <Columns className="h-3.5 w-3.5 mr-2" /> Columns
                            </button>
                            <button onClick={downloadPdf} className="flex items-center w-full px-3 py-2 text-[12px] text-slate-700 hover:bg-slate-50 rounded-md transition-colors">
                                <FileText className="h-3.5 w-3.5 mr-2" /> Download PDF
                            </button>
                            <button onClick={downloadCsv} className="flex items-center w-full px-3 py-2 text-[12px] text-slate-700 hover:bg-slate-50 rounded-md transition-colors">
                                <Download className="h-3.5 w-3.5 mr-2" /> Download CSV
                            </button>
                        </div>
                    </Dropdown>
                </div>
            </div>

            {loading && !rawData.rows.length && <div className="flex justify-center items-center h-48"><Spinner /></div>}
            {error && <div className="text-rose-600 bg-rose-50 border border-rose-100 p-3 rounded-lg font-bold text-[13px] flex items-center gap-2"><XCircle className="h-4 w-4" /> {error}</div>}
            
            {/* Data Table with Dimensions Preserved */}
            {!loading && !error && (
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                        <table className="w-full text-left table-fixed border-collapse">
                            <colgroup>
                                {displayHeader.map(h => <col key={h} className={colWidths[h] || 'w-auto'} />)}
                                <col className={colWidths['Actions'] || 'w-15'} />
                            </colgroup>
                            {/* Fixed Clipping: Higher Z-index & overflow-visible cells */}
                            <thead className="sticky top-0 z-40 bg-slate-50 border-b border-slate-300">
                                <tr>
                                    {displayHeader.map((h, idx) => (
                                        <th key={h} className="relative overflow-visible p-0 border-r border-slate-200 last:border-r-0">
                                            <div 
                                                className="flex items-center justify-between px-3 py-2.5 cursor-pointer hover:bg-slate-100 transition-all group"
                                                onClick={() => setActiveMenu(activeMenu === h ? null : h)}
                                            >
                                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none">
                                                    {h}
                                                </span>
                                                <div className="flex items-center gap-1">
                                                    {columnFilters[h] && <Filter className="h-2.5 w-2.5 text-indigo-500" />}
                                                    <span className="text-slate-400 text-[9px] font-black">
                                                        {sortConfig.key === h ? (sortConfig.direction === 'ascending' ? ' ▲' : ' ▼') : ''}
                                                    </span>
                                                </div>
                                            </div>
                                            {activeMenu === h && (
                                                <HeaderMenu 
                                                    header={h} 
                                                    isFirstColumn={idx === 0}
                                                    onSort={(dir) => handleSort(h, dir)} 
                                                    filterConfig={columnFilters[h]} 
                                                    onFilterChange={handleFilterChange}
                                                    onClose={() => setActiveMenu(null)}
                                                />
                                            )}
                                        </th>
                                    ))}
                                    <th className="px-3 py-2.5 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center border-l border-slate-200">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredAndSortedData.slice(0, visibleCount).map((row, rowIndex) => (
                                    <tr key={row[displayHeader.indexOf('Posting ID')] || rowIndex} className="group hover:bg-indigo-50/20 transition-colors">
                                        {row.map((cell, cellIndex) => {
                                            const headerName = displayHeader[cellIndex];
                                            const postingId = row[displayHeader.indexOf('Posting ID')];
                                            const isEditing = editingCell?.rowIndex === rowIndex && editingCell?.cellIndex === cellIndex;
                                            const isUnsaved = unsavedChanges[postingId]?.[headerName] !== undefined;

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
                                                    className={`px-3 py-2.5 border-r border-slate-100 last:border-r-0 align-top transition-all ${isUnsaved ? 'bg-amber-50 shadow-inner' : ''} ${headerName === 'Deadline' ? getDeadlineClass(cell) : 'text-slate-900'} ${canEditDashboard && (EDITABLE_COLUMNS.includes(headerName) || CANDIDATE_COLUMNS.includes(headerName)) ? 'cursor-pointer hover:bg-white' : ''}`}
                                                >
                                                    <div className="text-[12px] font-medium leading-normal break-words">
                                                        {isEditing && headerName === 'Working By' && canEditDashboard ? (
                                                            <MultiSelectDropdown options={recruiters} selectedNames={selectedWorkingBy} onBlur={() => setEditingCell(null)} onChange={(val) => handleCellEdit(rowIndex, cellIndex, val)} />
                                                        ) : isEditing && headerName === 'Remarks' && canEditDashboard ? (
                                                            <select value={unsavedChanges[postingId]?.[headerName] || cell} onBlur={() => setEditingCell(null)} onChange={(e) => { handleCellEdit(rowIndex, cellIndex, e.target.value); setEditingCell(null); }} className="block w-full border border-slate-300 rounded-md px-1.5 py-1 text-[12px] outline-none shadow-sm" autoFocus>
                                                                <option value="">Select Remark...</option>
                                                                {REMARKS_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                                            </select>
                                                        ) : (
                                                            <div className="min-h-[1.2rem]" contentEditable={isEditing && !['Working By', 'Remarks'].includes(headerName)} suppressContentEditableWarning onBlur={e => { if (isEditing) { handleCellEdit(rowIndex, cellIndex, e.target.innerText); setEditingCell(null); } }}>
                                                                {headerName === 'Status' ? (
                                                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full border text-[10px] font-bold uppercase ${getStatusBadge(cell)}`}>{cell}</span>
                                                                ) : DATE_COLUMNS.includes(headerName) ? (
                                                                    formatDate(cell)
                                                                ) : CANDIDATE_COLUMNS.includes(headerName) ? (
                                                                    <span className={canEditDashboard && (cell === 'Need To Update' || !cell) ? 'text-indigo-600 hover:underline font-bold' : ''}>{cell || 'Need To Update'}</span>
                                                                ) : headerName === 'Working By' ? (
                                                                    <div className="flex flex-wrap gap-1">
                                                                        {selectedWorkingBy.map((name, idx) => (
                                                                            <span key={idx} className="px-1.5 py-0.5 text-[10px] font-bold bg-slate-100 text-slate-600 rounded border border-slate-200">{name.trim()}</span>
                                                                        ))}
                                                                    </div>
                                                                ) : cell}
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                            );
                                        })}
                                        <td className="px-3 py-2.5 text-center align-top border-l border-slate-100">
                                            {canEditDashboard && <ActionMenu job={jobToObject(row)} onAction={(type, job) => setModalState({type, data: job})} />}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Pagination Footer */}
            {!loading && !error && filteredAndSortedData.length > 0 && (
                <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-200 sticky bottom-0 z-20">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5">
                            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Show</span>
                            <select value={batchSize} onChange={handleBatchSizeChange} className="bg-white border border-slate-300 rounded px-1.5 py-1 text-[11px] font-bold text-slate-700 outline-none shadow-sm">
                                <option value={15}>15</option>
                                <option value={50}>50</option>
                                <option value={filteredAndSortedData.length}>All</option>
                            </select>
                        </div>
                        <span className="text-[11px] font-bold text-slate-400 uppercase">Records: {Math.min(visibleCount, filteredAndSortedData.length)} / {filteredAndSortedData.length}</span>
                    </div>
                    {visibleCount < filteredAndSortedData.length && (
                        <button onClick={handleLoadMore} className="px-6 py-2 bg-slate-800 text-white text-[11px] font-bold uppercase tracking-widest rounded-lg hover:bg-slate-900 transition-all shadow-md active:scale-95">Load More</button>
                    )}
                </div>
            )}
            
            {/* All Modal Logic Restored */}
            <ConfirmationModal isOpen={['close', 'archive', 'delete'].includes(modalState.type)} onClose={() => setModalState({type: null, data: null})} onConfirm={() => handleAction(modalState.type, modalState.data)} title={`${modalState.type?.toUpperCase()}`} message={`Are you sure you want to ${modalState.type} "${modalState.data?.['Posting Title']}"?`} confirmText={modalState.type}/>
            <ViewDetailsModal isOpen={modalState.type === 'details'} onClose={() => setModalState({type: null, data: null})} job={modalState.data}/>
            <ColumnSettingsModal isOpen={isColumnModalOpen} onClose={() => setColumnModalOpen(false)} allHeaders={transformedData.header} userPrefs={userPrefs} onSave={handleSaveColumnSettings}/>
            <CandidateDetailsModal isOpen={modalState.type === 'addCandidate'} onClose={() => setModalState({type: null, data: null})} onSave={handleSaveCandidate} jobInfo={modalState.data} />
        </div>
    );
};

export default DashboardPage;