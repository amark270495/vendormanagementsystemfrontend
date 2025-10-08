import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../api/apiService';
import Spinner from '../components/Spinner';
import Dropdown from '../components/Dropdown';
import HeaderMenu from '../components/dashboard/HeaderMenu';
import RequestTimesheetApprovalModal from '../components/timesheets/RequestTimesheetApprovalModal';
import EditLoggedHoursModal from '../components/timesheets/EditLoggedHoursModal';
import ConfirmationModal from '../components/dashboard/ConfirmationModal';
import { usePermissions } from '../hooks/usePermissions';

const TimesheetsDashboardPage = () => {
    const { user } = useAuth();
    const { canManageTimesheets, canRequestTimesheetApproval } = usePermissions();

    const [timesheets, setTimesheets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [generalFilter, setGeneralFilter] = useState('');
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });
    const [columnFilters, setColumnFilters] = useState({});

    const [isApprovalModalOpen, setApprovalModalOpen] = useState(false);
    const [timesheetToApprove, setTimesheetToApprove] = useState(null);

    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [timesheetToEdit, setTimesheetToEdit] = useState(null);

    const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
    const [timesheetToDelete, setTimesheetToDelete] = useState(null);

    const tableHeader = useMemo(() => [
        'Employee Name', 'Client Name', 'Month', 'Year', 'Logged Hours',
        'Company Name', 'Employee ID', 'Employee Mail', 'Submission Date', 'Submitted By', 'Actions'
    ], []);

    const months = [
        { value: '01', name: 'January' }, { value: '02', name: 'February' },
        { value: '03', name: 'March' }, { value: '04', name: 'April' },
        { value: '05', name: 'May' }, { value: '06', name: 'June' },
        { value: '07', name: 'July' }, { value: '08', name: 'August' },
        { value: '09', name: 'September' }, { value: '10', name: 'October' },
        { value: '11', name: 'November' }, { value: '12', name: 'December' }
    ];

    const loadTimesheets = useCallback(async () => {
        setLoading(true);
        setError('');
        if (!user?.userIdentifier || (!canManageTimesheets && !canRequestTimesheetApproval)) {
            setLoading(false);
            setError("You do not have permission to view timesheets.");
            return;
        }
        try {
            const result = await apiService.getEmployeeLogHours({ authenticatedUsername: user.userIdentifier });
            if (result.data.success) {
                setTimesheets(result.data.timesheets);
            } else {
                setError(result.data.message);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to fetch timesheet data.');
        } finally {
            setLoading(false);
        }
    }, [user?.userIdentifier, canManageTimesheets, canRequestTimesheetApproval]);

    useEffect(() => {
        loadTimesheets();
    }, [loadTimesheets]);

    const filteredAndSortedData = useMemo(() => {
        let data = timesheets.map(ts => ({
            original: ts,
            display: [
                ts.employeeName,
                ts.clientName,
                months.find(m => m.value === ts.month)?.name || ts.month,
                ts.year,
                ts.loggedHoursPerMonth,
                ts.companyName,
                ts.employeeId,
                ts.employeeMail,
                new Date(ts.submissionDate).toLocaleDateString(),
                ts.submittedBy
            ]
        }));

        if (generalFilter) {
            const lowercasedFilter = generalFilter.toLowerCase();
            data = data.filter(item =>
                item.display.some(cell => String(cell).toLowerCase().includes(lowercasedFilter))
            );
        }

        if (Object.keys(columnFilters).length > 0) {
            data = data.filter(item => {
                return Object.entries(columnFilters).every(([header, config]) => {
                    if (!config || !config.type || !config.value1) return true;
                    const colIndex = tableHeader.indexOf(header);
                    if (colIndex === -1) return true;
                    
                    const cellValue = String(item.display[colIndex] || '').toLowerCase();
                    const filterValue1 = String(config.value1).toLowerCase();
                    
                    switch (config.type) {
                        case 'contains': return cellValue.includes(filterValue1);
                        case 'not_contains': return !cellValue.includes(filterValue1);
                        case 'equals': return cellValue === filterValue1;
                        default: return true;
                    }
                });
            });
        }

        if (sortConfig.key) {
            const sortIndex = tableHeader.indexOf(sortConfig.key);
            if (sortIndex !== -1) {
                data.sort((a, b) => {
                    let valA = a.display[sortIndex];
                    let valB = b.display[sortIndex];

                    if (sortConfig.key === 'Logged Hours') {
                        valA = parseFloat(valA) || 0;
                        valB = parseFloat(valB) || 0;
                    } else if (sortConfig.key === 'Submission Date') {
                        valA = new Date(valA).getTime() || 0;
                        valB = new Date(valB).getTime() || 0;
                    } else if (sortConfig.key === 'Month') {
                        valA = months.findIndex(m => m.name === valA);
                        valB = months.findIndex(m => m.name === valB);
                    }
                    else {
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
    }, [timesheets, generalFilter, columnFilters, sortConfig, tableHeader]);

    const handleSort = (key, direction) => setSortConfig({ key, direction });
    const handleFilterChange = (header, config) => setColumnFilters(prev => ({ ...prev, [header]: config }));

    const handleRequestApprovalClick = (timesheetData) => {
        if (!canRequestTimesheetApproval) return;
        setTimesheetToApprove(timesheetData);
        setApprovalModalOpen(true);
    };

    const handleEditClick = (timesheetData) => {
        if (!canManageTimesheets) return;
        setTimesheetToEdit(timesheetData);
        setIsEditModalOpen(true);
    };

    const handleSaveTimesheet = async (updatedData) => {
        if (!canManageTimesheets || !timesheetToEdit) return;
        setLoading(true);
        try {
            // FIX: Use camelCase 'rowKey'
            await apiService.updateEmployeeLogHours(timesheetToEdit.rowKey, updatedData, user.userIdentifier);
            loadTimesheets();
            setIsEditModalOpen(false);
            setTimesheetToEdit(null);
        } catch (err) {
            setError(err.message || `Failed to update timesheet for ${timesheetToEdit.employeeName}.`);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteClick = (timesheetData) => {
        if (!canManageTimesheets) return;
        setTimesheetToDelete(timesheetData);
        setDeleteModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!canManageTimesheets || !timesheetToDelete) return;
        setLoading(true);
        try {
            // FIX: Use camelCase 'partitionKey' and 'rowKey'
            await apiService.deleteEmployeeLogHours(timesheetToDelete.partitionKey, timesheetToDelete.rowKey, user.userIdentifier);
            loadTimesheets();
            setDeleteModalOpen(false);
            setTimesheetToDelete(null);
        } catch (err) {
            setError(err.response?.data?.message || `Failed to delete timesheet entry for ${timesheetToDelete.employeeName}.`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <div className="space-y-4">
                <h1 className="text-3xl font-bold text-gray-800">Timesheets Dashboard</h1>
                
                <div className="bg-white p-4 rounded-lg shadow-sm border flex flex-wrap items-center justify-between gap-4">
                    <input 
                        type="text" 
                        placeholder="Search all columns..." 
                        value={generalFilter} 
                        onChange={(e) => setGeneralFilter(e.target.value)} 
                        className="shadow-sm border-gray-300 rounded-md px-3 py-2"
                        disabled={loading || (!canManageTimesheets && !canRequestTimesheetApproval)}
                    />
                </div>

                {loading && <div className="flex justify-center items-center h-64"><Spinner /></div>}
                {error && <div className="text-red-500 bg-red-100 p-4 rounded-lg">Error: {error}</div>}
                
                {!loading && !error && (!canManageTimesheets && !canRequestTimesheetApproval) && (
                    <div className="text-center text-gray-500 p-10 bg-white rounded-xl shadow-sm border">
                        <h3 className="text-lg font-medium">Access Denied</h3>
                        <p className="text-sm">You do not have the necessary permissions to view timesheets.</p>
                    </div>
                )}

                {!loading && !error && (canManageTimesheets || canRequestTimesheetApproval) && (
                    <div className="bg-white rounded-lg shadow-lg border border-gray-200" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left text-gray-500">
                                <thead className="text-xs text-gray-700 uppercase bg-slate-200 sticky top-0 z-10">
                                    <tr>
                                        {tableHeader.map(h => (
                                            <th 
                                                key={h} 
                                                scope="col" 
                                                className="p-0 border-r border-slate-300 last:border-r-0"
                                                style={{ minWidth: h === 'Employee Mail' ? '200px' : 'auto' }}
                                            >
                                                {h === 'Actions' ? (
                                                    <div className="p-3 font-bold">{h}</div>
                                                ) : (
                                                    <Dropdown width="64" trigger={
                                                        <div className="flex items-center justify-between w-full h-full cursor-pointer p-3 hover:bg-slate-300">
                                                            <span className="font-bold">{h}</span>
                                                            {sortConfig.key === h && (sortConfig.direction === 'ascending' ? ' ▲' : ' ▼')}
                                                        </div>
                                                    }>
                                                        <HeaderMenu header={h} onSort={(dir) => handleSort(h, dir)} filterConfig={columnFilters[h]} onFilterChange={handleFilterChange}/>
                                                    </Dropdown>
                                                )}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredAndSortedData.length > 0 ? (
                                        filteredAndSortedData.map((item, rowIndex) => {
                                            const originalTimesheet = item.original;
                                            const displayRow = item.display;
                                            return (
                                                <tr key={rowIndex} className="bg-gray-50 border-b hover:bg-gray-100">
                                                    {displayRow.map((cell, cellIndex) => (
                                                        <td key={cellIndex} className="px-4 py-3 border-r border-slate-200 last:border-r-0 font-medium text-gray-900 align-middle">
                                                            {cell}
                                                        </td>
                                                    ))}
                                                    <td className="px-4 py-3 border-r border-slate-200 last:border-r-0 flex space-x-2 justify-center">
                                                        {canManageTimesheets && (
                                                            <button
                                                                onClick={() => handleEditClick(originalTimesheet)}
                                                                className="text-gray-500 hover:text-indigo-600 p-1 rounded-md"
                                                                aria-label="Edit timesheet entry"
                                                            >
                                                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
                                                            </button>
                                                        )}
                                                        {canManageTimesheets && (
                                                            <button
                                                                onClick={() => handleDeleteClick(originalTimesheet)}
                                                                className="text-gray-500 hover:text-red-600 p-1 rounded-md"
                                                                aria-label="Delete timesheet entry"
                                                            >
                                                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                                                            </button>
                                                        )}
                                                        {canRequestTimesheetApproval && (
                                                            <button 
                                                                onClick={() => handleRequestApprovalClick(originalTimesheet)} 
                                                                className="text-blue-600 hover:text-blue-900 p-1 font-semibold"
                                                            >
                                                                Request Approval
                                                            </button>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    ) : (
                                        <tr>
                                            <td colSpan={tableHeader.length} className="px-4 py-8 text-center text-gray-500">
                                                No timesheet data found.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
            {timesheetToApprove && (
                <RequestTimesheetApprovalModal
                    isOpen={isApprovalModalOpen}
                    onClose={() => setApprovalModalOpen(false)}
                    timesheet={timesheetToApprove}
                />
            )}
            {timesheetToEdit && (
                <EditLoggedHoursModal
                    isOpen={isEditModalOpen}
                    onClose={() => setIsEditModalOpen(false)}
                    onSave={handleSaveTimesheet}
                    timesheetToEdit={timesheetToEdit}
                />
            )}
            {timesheetToDelete && (
                <ConfirmationModal
                    isOpen={isDeleteModalOpen}
                    onClose={() => setDeleteModalOpen(false)}
                    onConfirm={handleConfirmDelete}
                    title="Confirm Deletion"
                    message={`Are you sure you want to delete this timesheet entry for "${timesheetToDelete.employeeName}" (${timesheetToDelete.month}/${timesheetToDelete.year})? This action cannot be undone.`}
                    confirmText="Delete"
                />
            )}
        </>
    );
};

export default TimesheetsDashboardPage;