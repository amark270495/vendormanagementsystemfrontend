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

// Dashboard-specific constants
const DASHBOARD_CONFIGS = {
    'ecaltVMSDisplay': { title: 'Eclat VMS' },
    'taprootVMSDisplay': { title: 'Taproot VMS' },
    'michiganDisplay': { title: 'Michigan VMS' },
    'EclatTexasDisplay': { title: 'Eclat Texas VMS' },
    'TaprootTexasDisplay': { title: 'Taproot Texas VMS' },
    'VirtusaDisplay': { title: 'Virtusa Taproot' },
    'DeloitteDisplay': { title: 'Deloitte Taproot' }
};
const EDITABLE_COLUMNS = ['Working By', '# Submitted', 'Remarks', '1st Candidate Name', '2nd Candidate Name', '3rd Candidate Name'];
const DATE_COLUMNS = ['Posting Date', 'Deadline'];

const DashboardPage = ({ sheetKey }) => {
    const { user, updatePreferences } = useAuth();
    const { canEditDashboard } = usePermissions();

    // Core data state
    const [rawData, setRawData] = useState({ header: [], rows: [] });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // UI and interaction state
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });
    const [generalFilter, setGeneralFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [columnFilters, setColumnFilters] = useState({});
    const [unsavedChanges, setUnsavedChanges] = useState({});
    const [editingCell, setEditingCell] = useState(null);
    const [recruiters, setRecruiters] = useState([]);
    
    // Modal state
    const [modalState, setModalState] = useState({ type: null, job: null });
    const [isColumnModalOpen, setColumnModalOpen] = useState(false);

    // Memoized user preferences for column order and visibility
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

    // Fetch dashboard data from the API
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

    // Fetch list of recruiters for the "Working By" dropdown
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
    }, [user.userIdentifier]);

    // Load data when the component mounts or sheetKey changes
    useEffect(() => {
        loadData();
    }, [loadData]);

    // Memoized transformation of raw data (renaming headers, combining columns)
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

    // Memoized application of column visibility and ordering
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

    // Memoized filtering and sorting of data
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
                    
                    switch (config.type) {
                        case 'contains': return cellValue.includes(filterValue1);
                        case 'not_contains': return !cellValue.includes(filterValue1);
                        case 'equals': return cellValue === filterValue1;
                        // Add more complex cases for numbers and dates if needed
                        default: return true;
                    }
                });
            });
        }

        if (sortConfig.key) {
            const sortIndex = displayHeader.indexOf(sortConfig.key);
            if (sortIndex !== -1) {
                data.sort((a, b) => {
                    let valA = a[sortIndex] || '';
                    let valB = b[sortIndex] || '';
                    if (String(valA) < String(valB)) return sortConfig.direction === 'ascending' ? -1 : 1;
                    if (String(valA) > String(valB)) return sortConfig.direction === 'ascending' ? 1 : -1;
                    return 0;
                });
            }
        }
        return data;
    }, [displayData, sortConfig, generalFilter, statusFilter, displayHeader, columnFilters]);
    
    // Handlers for UI actions
    const handleSort = (key) => {
        let direction = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    const handleCellEdit = (rowIndex, cellIndex, value) => {
        if (!canEditDashboard) return;
        const postingId = filteredAndSortedData[rowIndex][displayHeader.indexOf('Posting ID')];
        const headerName = displayHeader[cellIndex];
        setUnsavedChanges(prev => ({ ...prev, [postingId]: { ...prev[postingId], [headerName]: value } }));
    };

    const handleSaveChanges = async () => {
        if (!canEditDashboard) return;
        const headerMap = { 'Working By': 'workingBy', '# Submitted': 'noOfResumesSubmitted', 'Remarks': 'remarks', '1st Candidate Name': 'candidateName1', '2nd Candidate Name': 'candidateName2', '3rd Candidate Name': 'candidateName3' };
        const updates = Object.entries(unsavedChanges).map(([postingId, changes]) => ({
            rowKey: postingId,
            changes: Object.entries(changes).reduce((acc, [header, value]) => {
                if (headerMap[header]) acc[headerMap[header]] = value;
                return acc;
            }, {})
        }));

        if (updates.length === 0) return;
        setLoading(true);
        try {
            await apiService.updateJobPosting(updates, user.userIdentifier);
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
            setModalState({ type: null, job: null });
        }
    };
    
    const handleSaveColumnSettings = async (newPrefs) => {
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
    
    const jobToObject = (row) => displayHeader.reduce((obj, h, i) => ({...obj, [h]: row[i]}), {});

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
                    {Object.keys(unsavedChanges).length > 0 && (
                        <button onClick={handleSaveChanges} className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700" disabled={loading}>
                            {loading ? <Spinner size="5" /> : 'Save Changes'}
                        </button>
                    )}
                    <button onClick={() => setColumnModalOpen(true)} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Column Settings</button>
                </div>
            </div>

            {loading && <div className="flex justify-center items-center h-64"><Spinner /></div>}
            {error && <div className="text-red-500 bg-red-100 p-4 rounded-lg">Error: {error}</div>}
            
            {!loading && !error && (
                <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-auto" style={{ maxHeight: '70vh' }}>
                    <table className="w-full text-sm text-left text-gray-500">
                        <thead className="text-xs text-gray-700 uppercase bg-slate-200 sticky top-0 z-10">
                            <tr>
                                {displayHeader.map(h => (
                                    <th key={h} scope="col" className="px-4 py-3">
                                        <Dropdown trigger={
                                            <div className="flex items-center cursor-pointer">
                                                <span>{h}</span>
                                                {sortConfig.key === h && (sortConfig.direction === 'ascending' ? ' ▲' : ' ▼')}
                                            </div>
                                        }>
                                            <HeaderMenu header={h} onSort={(dir) => handleSort(h, dir)} filterConfig={columnFilters[h]} onFilterChange={(header, config) => setColumnFilters(prev => ({...prev, [header]: config}))}/>
                                        </Dropdown>
                                    </th>
                                ))}
                                <th scope="col" className="px-4 py-3">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredAndSortedData.map((row, rowIndex) => (
                                <tr key={row[0] || rowIndex} className="bg-white border-b hover:bg-gray-50">
                                    {row.map((cell, cellIndex) => {
                                        const headerName = displayHeader[cellIndex];
                                        const postingId = row[displayHeader.indexOf('Posting ID')];
                                        const isEditing = editingCell?.rowIndex === rowIndex && editingCell?.cellIndex === cellIndex;
                                        
                                        return (
                                            <td key={cellIndex} onClick={() => { if (canEditDashboard && EDITABLE_COLUMNS.includes(headerName)) setEditingCell({rowIndex, cellIndex}); }} className={`px-4 py-3 ${unsavedChanges[postingId]?.[headerName] !== undefined ? 'bg-yellow-100' : ''} ${headerName === 'Deadline' ? getDeadlineClass(cell) : ''}`}>
                                                {isEditing && headerName === 'Working By' ? (
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
                                                ) : (
                                                    <div contentEditable={isEditing && headerName !== 'Working By'} suppressContentEditableWarning={true} onBlur={e => { if (isEditing) { handleCellEdit(rowIndex, cellIndex, e.target.innerText); setEditingCell(null); } }}>
                                                        {DATE_COLUMNS.includes(headerName) ? formatDate(cell) : cell}
                                                    </div>
                                                )}
                                            </td>
                                        );
                                    })}
                                    <td className="px-4 py-3">
                                        <ActionMenu job={jobToObject(row)} onAction={(type, job) => setModalState({type, job})} />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
            
            <ConfirmationModal isOpen={['close', 'archive', 'delete'].includes(modalState.type)} onClose={() => setModalState({type: null, job: null})} onConfirm={() => handleAction(modalState.type, modalState.job)} title={`Confirm ${modalState.type}`} message={`Are you sure you want to ${modalState.type} the job "${modalState.job?.['Posting Title']}"?`} confirmText={modalState.type}/>
            <ViewDetailsModal isOpen={modalState.type === 'details'} onClose={() => setModalState({type: null, job: null})} job={modalState.job}/>
            <ColumnSettingsModal isOpen={isColumnModalOpen} onClose={() => setColumnModalOpen(false)} allHeaders={transformedData.header} userPrefs={userPrefs} onSave={handleSaveColumnSettings}/>
        </div>
    );
};

export default DashboardPage;