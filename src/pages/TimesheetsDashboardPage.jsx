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
        <div className="min-h-screen bg-gray-50/30 p-6 md:p-8 font-sans text-gray-900">
            <div className="w-full max-w-[1800px] mx-auto space-y-6">
                
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Timesheets Dashboard</h1>
                        <p className="text-sm text-gray-500 mt-1">Manage, review, and approve employee logged hours.</p>
                    </div>
                    
                    <div className="relative w-full md:w-72">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <svg className="h-4 w-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <input 
                            type="text" 
                            placeholder="Search records..." 
                            value={generalFilter} 
                            onChange={(e) => setGeneralFilter(e.target.value)} 
                            className="block w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all bg-white shadow-sm"
                            disabled={loading || (!canManageTimesheets && !canRequestTimesheetApproval)}
                        />
                    </div>
                </div>

                {loading && (
                    <div className="flex justify-center items-center h-64 bg-white rounded-xl shadow-sm border border-gray-100">
                        <Spinner />
                    </div>
                )}
                
                {error && (
                    <div className="flex items-center gap-3 bg-red-50 text-red-700 p-4 rounded-lg border border-red-100 shadow-sm text-sm font-medium">
                        <svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" /></svg>
                        {error}
                    </div>
                )}
                
                {!loading && !error && (!canManageTimesheets && !canRequestTimesheetApproval) && (
                    <div className="text-center p-12 bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col items-center">
                        <div className="h-12 w-12 bg-gray-50 text-gray-400 rounded-full flex items-center justify-center mb-4">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900">Access Denied</h3>
                        <p className="text-sm text-gray-500 mt-1">You do not have the necessary permissions to view timesheets.</p>
                    </div>
                )}

                {!loading && !error && (canManageTimesheets || canRequestTimesheetApproval) && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 custom-scrollbar" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 z-10 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                    <tr>
                                        {tableHeader.map(h => (
                                            <th 
                                                key={h} 
                                                scope="col" 
                                                className="p-0 border-r border-gray-100 last:border-r-0 group bg-gray-50"
                                                style={{ minWidth: h === 'Employee Mail' ? '200px' : 'auto' }}
                                            >
                                                {h === 'Actions' ? (
                                                    <div className="px-4 py-3 flex items-center justify-center">{h}</div>
                                                ) : (
                                                    <Dropdown width="64" trigger={
                                                        <div className="flex items-center justify-between w-full h-full cursor-pointer px-4 py-3 hover:bg-gray-100/80 transition-colors">
                                                            <span className="flex-1">{h}</span>
                                                            <div className="ml-2 text-gray-400 group-hover:text-gray-600">
                                                                {sortConfig.key === h ? (
                                                                    sortConfig.direction === 'ascending' ? 
                                                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 15l7-7 7 7" /></svg> : 
                                                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" /></svg>
                                                                ) : (
                                                                    <svg className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" /></svg>
                                                                )}
                                                            </div>
                                                        </div>
                                                    }>
                                                        <HeaderMenu header={h} onSort={(dir) => handleSort(h, dir)} filterConfig={columnFilters[h]} onFilterChange={handleFilterChange}/>
                                                    </Dropdown>
                                                )}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 bg-white">
                                    {filteredAndSortedData.length > 0 ? (
                                        filteredAndSortedData.map((item, rowIndex) => {
                                            const originalTimesheet = item.original;
                                            const displayRow = item.display;
                                            return (
                                                <tr key={rowIndex} className="hover:bg-gray-50/50 transition-colors duration-150">
                                                    {displayRow.map((cell, cellIndex) => (
                                                        <td key={cellIndex} className="px-4 py-3 text-gray-600 font-medium align-middle break-words">
                                                            {tableHeader[cellIndex] === 'Employee Name' ? (
                                                                <div className="flex items-center text-gray-900 whitespace-nowrap">
                                                                    <div className="h-8 w-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs mr-3 flex-shrink-0">
                                                                        {String(cell).charAt(0).toUpperCase()}
                                                                    </div>
                                                                    {cell}
                                                                </div>
                                                            ) : tableHeader[cellIndex] === 'Logged Hours' ? (
                                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 whitespace-nowrap">
                                                                    {cell} hrs
                                                                </span>
                                                            ) : tableHeader[cellIndex] === 'Employee Mail' ? (
                                                                <span className="text-gray-500 font-normal break-all">{cell}</span>
                                                            ) : (
                                                                cell
                                                            )}
                                                        </td>
                                                    ))}
                                                    <td className="px-4 py-3 align-middle border-l border-gray-50">
                                                        <div className="flex items-center justify-center space-x-1">
                                                            {canManageTimesheets && (
                                                                <>
                                                                    <button
                                                                        onClick={() => handleEditClick(originalTimesheet)}
                                                                        className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                                                                        title="Edit Entry"
                                                                    >
                                                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handleDeleteClick(originalTimesheet)}
                                                                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                                                                        title="Delete Entry"
                                                                    >
                                                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                                                                    </button>
                                                                </>
                                                            )}
                                                            {canRequestTimesheetApproval && (
                                                                <button 
                                                                    onClick={() => handleRequestApprovalClick(originalTimesheet)} 
                                                                    className="ml-2 text-xs font-semibold px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-md transition-colors whitespace-nowrap"
                                                                >
                                                                    Request Approval
                                                                </button>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    ) : (
                                        <tr>
                                            <td colSpan={tableHeader.length} className="px-6 py-12 text-center text-gray-500 bg-gray-50/30">
                                                <div className="flex flex-col items-center justify-center">
                                                    <svg className="w-10 h-10 text-gray-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                                    <p className="font-medium text-gray-600">No timesheet records found</p>
                                                    <p className="text-xs text-gray-400 mt-1">Try adjusting your search or filters.</p>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {/* Modals */}
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
                    confirmText="Delete Record"
                />
            )}
            
            <style jsx>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 8px;
                    height: 8px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #e5e7eb;
                    border-radius: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #d1d5db;
                }
            `}</style>
        </div>
    );
};

export default TimesheetsDashboardPage;