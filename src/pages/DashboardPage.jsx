import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { usePermissions } from '../hooks/usePermissions'; // <-- NEW: Import usePermissions
import { apiService } from '../api/apiService';
import { formatDate, getDeadlineClass } from '../utils/helpers';
import Spinner from '../components/Spinner';
import Dropdown from '../components/Dropdown';
import HeaderMenu from '../components/dashboard/HeaderMenu';
import ActionMenu from '../components/dashboard/ActionMenu';
import ConfirmationModal from '../components/dashboard/ConfirmationModal';
import ViewDetailsModal from '../components/dashboard/ViewDetailsModal';
import ColumnSettingsModal from '../components/dashboard/ColumnSettingsModal';
import CandidateDetailsModal from '../components/dashboard/CandidateDetailsModal'; // <-- IMPORT NEW MODAL
import jsPDF from 'jspdf';
import 'jspdf-autotable';

// --- SVG Icons for Cards ---
const IconBriefcase = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-gray-400"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>;
const IconUser = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-gray-400"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>;
const IconCalendar = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-gray-400"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>;
const IconClock = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-gray-400"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>;
const IconHash = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-gray-400"><line x1="4" y1="9" x2="20" y2="9"></line><line x1="4" y1="15" x2="20" y2="15"></line><line x1="10" y1="3" x2="8" y2="21"></line><line x1="16" y1="3" x2="14" y2="21"></line></svg>;
const IconTag = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-gray-400"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path><line x1="7" y1="7" x2="7.01" y2="7"></line></svg>;
const IconUsers = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-gray-400"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>;
const IconFileText = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-gray-400"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>;
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
const CANDIDATE_COLUMNS = ['1st Candidate Name', '2nd Candidate Name', '3rd Candidate Name']; // <-- DEFINE CANDIDATE COLUMNS
const DATE_COLUMNS = ['Posting Date', 'Deadline'];
const NUMBER_COLUMNS = ['# Submitted', 'Max Submissions'];

// NEW: Define the new remarks options
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
    // NEW: Destructure canEditDashboard from usePermissions
    const { canEditDashboard, canViewDashboards, canAddPosting, canEmailReports } = usePermissions(); 

    const [rawData, setRawData] = useState({ header: [], rows: [] });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });
    const [generalFilter, setGeneralFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [columnFilters, setColumnFilters] = useState({});
    const [unsavedChanges, setUnsavedChanges] = useState({});
    const [editingCell, setEditingCell] = useState(null); // { rowIndex, cellIndex }
    const [recruiters, setRecruiters] = useState([]);
    
    const [modalState, setModalState] = useState({ type: null, data: null }); // <-- MODIFIED MODAL STATE
    const [isColumnModalOpen, setColumnModalOpen] = useState(false);

    // Column widths are no longer needed for a card layout
    // const colWidths = useMemo(() => ({...}), []);

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

    // ... (transformedData memo remains the same) ...
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

    // *** MODIFIED: Data flow now produces an array of objects for easier card rendering ***
    const { displayHeader, objectData } = useMemo(() => {
        let { header, rows } = transformedData;
        const defaultOrder = ['Posting ID', 'Posting Title', 'Posting Date', 'Max Submissions', 'Max C2C Rate', 'Required Skill Set', 'Any Required Certificates', 'Work Position Type', 'Working By', 'Remarks', '1st Candidate Name', '2nd Candidate Name', '3rd Candidate Name', 'Status', 'Deadline', 'Client Info', '# Submitted'];
        
        const finalHeaderOrder = userPrefs.order.length > 0
            ? [...userPrefs.order.filter(h => header.includes(h)), ...header.filter(h => !userPrefs.order.includes(h))]
            : [...defaultOrder.filter(h => header.includes(h)), ...header.filter(h => !defaultOrder.includes(h))];

        // We still need the ordered header for filtering and modals
        let finalHeader = finalHeaderOrder;

        // Map rows to objects
        const objectRows = rows.map(row => {
            const obj = {};
            header.forEach((h, i) => {
                obj[h] = row[i];
            });
            return obj;
        });

        if (userPrefs.visibility.length > 0) {
            finalHeader = finalHeader.filter(h => !userPrefs.visibility.includes(h));
        }
        
        return { displayHeader: finalHeader, objectData: objectRows };
    }, [transformedData, userPrefs]);

    const filteredAndSortedData = useMemo(() => {
        let data = [...objectData]; // Now an array of objects

        if (statusFilter) {
            data = data.filter(item => (item.Status || '').toLowerCase() === statusFilter.toLowerCase());
        }

        if (generalFilter) {
            const lowercasedFilter = generalFilter.toLowerCase();
            data = data.filter(item => 
                Object.values(item).some(cell => 
                    String(cell).toLowerCase().includes(lowercasedFilter)
                )
            );
        }

        if (Object.keys(columnFilters).length > 0) {
            data = data.filter(item => {
                return Object.entries(columnFilters).every(([header, config]) => {
                    if (!config || !config.type || !config.value1) return true;
                    
                    const cellValue = String(item[header] || '').toLowerCase();
                    const filterValue1 = String(config.value1).toLowerCase();
                    const filterValue2 = String(config.value2 || '').toLowerCase();
                    // ... (rest of filtering logic is the same) ...
                    const isDate = DATE_COLUMNS.includes(header);
                    const isNumber = NUMBER_COLUMNS.includes(header);
                    let cellNum = NaN, val1Num = NaN, val2Num = NaN;
                    if (isDate) {
                        cellNum = new Date(item[header]).getTime();
                        val1Num = new Date(config.value1).getTime();
                        val2Num = new Date(config.value2).getTime();
                    } else if (isNumber) {
                        cellNum = parseFloat(item[header]);
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
            const key = sortConfig.key;
            const isDate = DATE_COLUMNS.includes(key);
            const isNumber = NUMBER_COLUMNS.includes(key);
            
            data.sort((a, b) => {
                let valA = a[key];
                let valB = b[key];
                // ... (sorting logic is the same) ...
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
        return data;
    }, [objectData, sortConfig, generalFilter, statusFilter, displayHeader, columnFilters]); // depends on objectData now
    // *** END MODIFIED DATA FLOW ***


    const handleSort = (key, direction) => setSortConfig({ key, direction });

    const handleCellEdit = (postingId, headerName, value) => {
        if (!canEditDashboard) return; 
        setUnsavedChanges(prev => ({ ...prev, [postingId]: { ...prev[postingId], [headerName]: value } }));
    };

    const handleSaveChanges = async () => {
// ... (save logic unchanged) ...
        if (!canEditDashboard) return; // NEW: Use canEditDashboard permission
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
                    const job = filteredAndSortedData.find(item => item['Posting ID'] === postingId);
                    if (job) {
                        const jobTitle = job['Posting Title'];
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
// ... (action logic unchanged) ...
        if (!canEditDashboard) return; // NEW: Use canEditDashboard permission
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
// ... (save candidate logic unchanged) ...
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
// ... (save column settings logic unchanged) ...
        setLoading(true);
        try {
            await apiService.saveUserDashboardPreferences(user.userIdentifier, { columnOrder: newPrefs.order, columnVisibility: newPrefs.visibility });
            updatePreferences({ columnOrder: JSON.stringify(newPrefs.order), columnVisibility: JSON.stringify(newPrefs.visibility) });
        } catch(err) {
            setError(`Failed to save column settings: ${err.message}`);
        } finally {
            setLoading(false);
            setColumnModalOpen(false);
        }
    };

    const downloadCsv = () => {
// ... (download CSV logic unchanged, but uses objectData now) ...
        const csvContent = [
            displayHeader.join(','),
            ...filteredAndSortedData.map(item => 
                displayHeader.map(header => {
                    let cell = item[header];
                    if (header === 'Candidate Contact Details') {
                        cell = `${item.email}, ${item.mobileNumber}`; // This won't work, need original object
                    }
                    if (DATE_COLUMNS.includes(header)) {
                        cell = formatDate(cell);
                    }
                    return `"${String(Array.isArray(cell) ? cell.join('; ') : (cell || '')).replace(/"/g, '""')}"`;
                }).join(',')
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
// ... (download PDF logic unchanged, but uses objectData now) ...
        const body = filteredAndSortedData.map(item => 
            displayHeader.map(header => {
                let cell = item[header];
                if (header === 'Candidate Contact Details') {
                     cell = `${item.email}, ${item.mobileNumber}`; // This won't work
                }
                if (DATE_COLUMNS.includes(header)) {
                    cell = formatDate(cell);
                }
                return Array.isArray(cell) ? cell.join(', ') : cell;
            })
        );
        const doc = new jsPDF('landscape');
        doc.autoTable({
            head: [displayHeader],
            body: body,
        });
        doc.save(`${sheetKey}_report.pdf`);
    };
    
    // This function is now used by the ActionMenu
    const jobToObject = (job) => job; // Job is already an object

    // This function is passed to the JobCard
    const handleCardCellClick = (job, headerName) => {
        if (!canEditDashboard) return;
        const rowIndex = filteredAndSortedData.findIndex(item => item['Posting ID'] === job['Posting ID']);
        const cellIndex = displayHeader.indexOf(headerName);

        if (EDITABLE_COLUMNS.includes(headerName)) {
            setEditingCell({ rowIndex, cellIndex });
        } else if (CANDIDATE_COLUMNS.includes(headerName)) {
            const jobInfo = {
                postingId: job['Posting ID'],
                clientInfo: job['Client Info'],
                resumeWorkedBy: job['Working By'],
                candidateSlot: headerName
            };
            setModalState({ type: 'addCandidate', data: jobInfo });
        }
    };


    // *** NEW: JobCard Sub-component ***
    const JobCard = ({ job, rowIndex }) => {
        const postingId = job['Posting ID'];
        
        // Helper to find the index of a header
        const getIndex = (headerName) => displayHeader.indexOf(headerName);

        // Check if a cell in *this* card is being edited
        const isEditingWorkingBy = editingCell?.rowIndex === rowIndex && editingCell?.cellIndex === getIndex('Working By');
        const isEditingRemarks = editingCell?.rowIndex === rowIndex && editingCell?.cellIndex === getIndex('Remarks');

        const status = job['Status'] || 'N/A';
        const statusColor = status.toLowerCase() === 'open' 
            ? 'bg-green-100 text-green-700' 
            : 'bg-red-100 text-red-700';

        // Check for unsaved changes to show yellow background
        const hasUnsavedWorkingBy = unsavedChanges[postingId]?.['Working By'] !== undefined;
        const hasUnsavedRemarks = unsavedChanges[postingId]?.['Remarks'] !== undefined;
        
        const skills = Array.isArray(job['Required Skill Set']) 
            ? job['Required Skill Set'] 
            : (job['Required Skill Set'] || '').split(',').map(s => s.trim()).filter(Boolean);

        return (
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 flex flex-col hover:shadow-indigo-100 transition-shadow duration-300">
                {/* Card Header */}
                <div className="p-4 border-b border-gray-200 bg-gray-50 rounded-t-xl flex justify-between items-start gap-2">
                    <div className="flex-1">
                        <h3 className="font-bold text-gray-900 break-words">{job['Posting Title']}</h3>
                        <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${statusColor} mt-1 inline-block`}>
                            {status}
                        </span>
                    </div>
                    {canEditDashboard && (
                        <ActionMenu 
                            job={job} 
                            onAction={(type, jobData) => setModalState({type, data: jobData})} 
                        />
                    )}
                </div>

                {/* Card Body */}
                <div className="p-4 space-y-3 text-sm flex-grow">
                    <div className="flex justify-between items-center text-xs text-gray-500">
                        <div className="flex items-center gap-1.5">
                            <IconHash />
                            <span>{postingId}</span>
                        </div>
                        <div className={`flex items-center gap-1.5 font-medium ${getDeadlineClass(job['Deadline'])}`}>
                            <IconClock />
                            <span>Deadline: {formatDate(job['Deadline'])}</span>
                        </div>
                    </div>

                    <div className="space-y-2 border-t pt-3">
                        <div className="flex items-center gap-2">
                            <IconBriefcase />
                            <span className="font-semibold text-gray-500 min-w-[80px]">Client:</span>
                            <span className="text-gray-800 font-medium break-words">{job['Client Info']}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <IconCalendar />
                            <span className="font-semibold text-gray-500 min-w-[80px]">Posted:</span>
                            <span className="text-gray-800 font-medium">{formatDate(job['Posting Date'])}</span>
                        </div>
                    </div>

                    {/* Editable "Working By" Section */}
                    <div className={`p-2 rounded-lg border ${hasUnsavedWorkingBy ? 'bg-yellow-50 border-yellow-200' : 'bg-transparent border-transparent'}`}>
                        <div className="flex items-center gap-2">
                            <IconUser />
                            <span className="font-semibold text-gray-500 min-w-[80px]">Working By:</span>
                            {isEditingWorkingBy ? (
                                <select
                                    value={unsavedChanges[postingId]?.['Working By'] || job['Working By']}
                                    onBlur={() => setEditingCell(null)}
                                    onChange={(e) => {
                                        handleCellEdit(postingId, 'Working By', e.target.value);
                                        setEditingCell(null);
                                    }}
                                    className="block w-full border-gray-300 rounded-md shadow-sm p-1 text-sm"
                                    autoFocus
                                >
                                    <option value="Need To Update">Unassigned</option>
                                    {recruiters.map(r => <option key={r.username} value={r.displayName}>{r.displayName}</option>)}
                                </select>
                            ) : (
                                <span 
                                    className={`text-gray-800 font-medium ${canEditDashboard ? 'cursor-pointer hover:text-indigo-600' : ''}`}
                                    onClick={() => canEditDashboard && setEditingCell({ rowIndex, cellIndex: getIndex('Working By') })}
                                >
                                    {unsavedChanges[postingId]?.['Working By'] || job['Working By']}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Editable "Remarks" Section */}
                    <div className={`p-2 rounded-lg border ${hasUnsavedRemarks ? 'bg-yellow-50 border-yellow-200' : 'bg-transparent border-transparent'}`}>
                        <div className="flex items-start gap-2">
                            <IconFileText />
                            <span className="font-semibold text-gray-500 min-w-[80px] mt-1">Remarks:</span>
                            {isEditingRemarks ? (
                                <select
                                    value={unsavedChanges[postingId]?.['Remarks'] || job['Remarks']}
                                    onBlur={() => setEditingCell(null)}
                                    onChange={(e) => {
                                        handleCellEdit(postingId, 'Remarks', e.target.value);
                                        setEditingCell(null);
                                    }}
                                    className="block w-full border-gray-300 rounded-md shadow-sm p-1 text-sm"
                                    autoFocus
                                >
                                    <option value="">Select Remark</option>
                                    {REMARKS_OPTIONS.map(option => (
                                        <option key={option} value={option}>{option}</option>
                                    ))}
                                </select>
                            ) : (
                                <span 
                                    className={`text-gray-800 font-medium ${canEditDashboard ? 'cursor-pointer hover:text-indigo-600' : ''}`}
                                    onClick={() => canEditDashboard && setEditingCell({ rowIndex, cellIndex: getIndex('Remarks') })}
                                >
                                    {unsavedChanges[postingId]?.['Remarks'] || job['Remarks']}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Card Footer: Candidates & Skills */}
                <div className="p-4 border-t border-gray-100 bg-gray-50 rounded-b-xl space-y-3">
                    {/* Skills */}
                    <div className="flex items-start gap-2">
                        <IconTag />
                        <div className="flex flex-wrap gap-1.5">
                            {skills.length > 0 ? skills.slice(0, 5).map((skill, i) => (
                                <span key={i} className="px-2 py-0.5 text-xs font-medium bg-gray-200 text-gray-700 rounded-full">{skill}</span>
                            )) : <span className="text-xs text-gray-500">No skills listed.</span>}
                            {skills.length > 5 && (
                                 <span className="px-2 py-0.5 text-xs font-medium bg-gray-300 text-gray-900 rounded-full" title={skills.slice(5).join(', ')}>+{skills.length - 5} more</span>
                            )}
                        </div>
                    </div>
                    {/* Candidates */}
                    <div className="flex items-start gap-2">
                        <IconUsers />
                        <div className="flex flex-col space-y-1 w-full">
                            {[ '1st Candidate Name', '2nd Candidate Name', '3rd Candidate Name' ].map((headerName, i) => {
                                const candidateName = job[headerName];
                                const cellIndex = getIndex(headerName);
                                const isClickable = canEditDashboard && (!candidateName || candidateName === 'Need To Update');
                                return (
                                    <div 
                                        key={i} 
                                        onClick={() => isClickable && handleCardCellClick(job, headerName)}
                                        className={`text-xs font-medium p-1.5 rounded w-full ${isClickable ? 'bg-indigo-50 text-indigo-700 cursor-pointer hover:bg-indigo-100' : 'bg-gray-200 text-gray-600'}`}
                                    >
                                        {i+1}: {candidateName}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        );
    };
    // *** END JobCard Sub-component ***


    return (
        <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-800">{DASHBOARD_CONFIGS[sheetKey]?.title || 'Dashboard'}</h2>
            
            {/* --- MODIFIED: Filter bar styling --- */}
            <div className="bg-white p-4 rounded-xl shadow-lg border border-gray-200 flex flex-col md:flex-row items-center justify-between gap-4 sticky top-0 z-20">
                <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
                    <input type="text" placeholder="Search all jobs..." value={generalFilter} onChange={(e) => setGeneralFilter(e.target.value)} className="shadow-sm border-gray-300 rounded-lg px-3 py-2 w-full md:w-64 focus:ring-2 focus:ring-indigo-500"/>
                    <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="shadow-sm border-gray-300 rounded-lg px-3 py-2 w-full md:w-auto focus:ring-2 focus:ring-indigo-500">
                        <option value="">All Statuses</option>
                        <option value="Open">Open</option>
                        <option value="Closed">Closed</option>
                    </select>
                </div>
                <div className="flex items-center space-x-2 w-full md:w-auto">
                    {canEditDashboard && Object.keys(unsavedChanges).length > 0 && (
                        <button onClick={handleSaveChanges} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold shadow transition w-full md:w-auto" disabled={loading}>
                            {loading ? <Spinner size="5" /> : 'Save Changes'}
                        </button>
                    )}
                    <Dropdown 
                        trigger={
                            <button className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 font-semibold flex items-center justify-center w-full md:w-auto shadow-sm transition">
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
            
            {/* *** MODIFIED: Render Card Grid *** */}
            {!loading && !error && (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6 py-4">
                    {filteredAndSortedData.map((jobObject, index) => (
                        <JobCard 
                            key={jobObject['Posting ID'] || index}
                            job={jobObject}
                            rowIndex={index} // Pass index to link to editingCell
                            headers={displayHeader} // Pass headers for data lookup
                            recruiters={recruiters}
                            canEditDashboard={canEditDashboard}
                            onCellClick={handleCardCellClick}
                            onEditChange={handleCellEdit}
                            setEditingCell={setEditingCell}
                            editingCell={editingCell}
                            unsavedChanges={unsavedChanges}
                            onAction={(type, job) => setModalState({type, data: job})}
                        />
                    ))}
                </div>
            )}
            {/* *** END Card Grid *** */}

            {/* No Data Message */}
            {!loading && !error && filteredAndSortedData.length === 0 && (
                <div className="text-center text-gray-500 p-10 bg-white rounded-xl shadow-sm border">
                    <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7h16M4 7L12 4l8 3M12 4v17M4 11h16M4 15h16" /></svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No Jobs Found</h3>
                    <p className="mt-1 text-sm text-gray-500">Try adjusting your search filters.</p>
                </div>
            )}
            
            {/* Modals remain unchanged */}
            <ConfirmationModal isOpen={['close', 'archive', 'delete'].includes(modalState.type)} onClose={() => setModalState({type: null, data: null})} onConfirm={() => handleAction(modalState.type, modalState.data)} title={`Confirm ${modalState.type}`} message={`Are you sure you want to ${modalState.type} the job "${modalState.data?.['Posting Title']}"?`} confirmText={modalState.type}/>
            <ViewDetailsModal isOpen={modalState.type === 'details'} onClose={() => setModalState({type: null, data: null})} job={modalState.data}/>
            <ColumnSettingsModal isOpen={isColumnModalOpen} onClose={() => setColumnModalOpen(false)} allHeaders={transformedData.header} userPrefs={userPrefs} onSave={handleSaveColumnSettings}/>
            <CandidateDetailsModal isOpen={modalState.type === 'addCandidate'} onClose={() => setModalState({type: null, data: null})} onSave={handleSaveCandidate} jobInfo={modalState.data} />
        </div>
    );
};

export default DashboardPage;