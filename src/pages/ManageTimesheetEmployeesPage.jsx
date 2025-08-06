import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../api/apiService';
import Spinner from '../components/Spinner';
import Dropdown from '../components/Dropdown';
import HeaderMenu from '../components/dashboard/HeaderMenu'; // Reusing for sorting/filtering
import ConfirmationModal from '../components/dashboard/ConfirmationModal'; // Reusing for deletion confirmation
import { usePermissions } from '../hooks/usePermissions';
import EditTimesheetEmployeeModal from '../components/timesheets/EditTimesheetEmployeeModal';
import RequestTimesheetApprovalForEmployeeModal from '../components/timesheets/RequestTimesheetApprovalForEmployeeModal';
import BulkTimesheetApprovalRequestModal from '../components/timesheets/BulkTimesheetApprovalRequestModal'; // NEW: Import Bulk Modal

const ManageTimesheetEmployeesPage = () => {
    const { user } = useAuth();
    const { canManageTimesheets, canRequestTimesheetApproval } = usePermissions();

    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    
    const [generalFilter, setGeneralFilter] = useState('');
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });
    const [columnFilters, setColumnFilters] = {};

    const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
    const [employeeToDelete, setEmployeeToDelete] = useState(null);

    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [employeeToEdit, setEmployeeToEdit] = useState(null);

    const [isTimesheetApprovalModalOpen, setIsTimesheetApprovalModalOpen] = useState(false);
    const [employeeForTimesheetApproval, setEmployeeForTimesheetApproval] = useState(null);

    const [selectedEmployeeIds, setSelectedEmployeeIds] = useState([]);
    const [isBulkApprovalModalOpen, setIsBulkApprovalModalOpen] = useState(false);

    const tableHeader = useMemo(() => {
        const baseHeaders = [
            'Employee Name', 'Employee ID', 'Employee Email', 'Company Name', 'Created By', 'Created At'
        ];
        if (canManageTimesheets || canRequestTimesheetApproval) {
            return ['Select', ...baseHeaders, 'Actions'];
        }
        return baseHeaders;
    }, [canManageTimesheets, canRequestTimesheetApproval]);

    const loadEmployees = useCallback(async () => {
        setLoading(true);
        setError('');
        if (!user?.userIdentifier || !canManageTimesheets) {
            setLoading(false);
            setError("You do not have permission to manage timesheet employees.");
            return;
        }
        try {
            const result = await apiService.getTimesheetEmployees(user.userIdentifier);
            if (result.data.success) {
                // FIX: Ensure result.data.employees is an array, default to empty array if not
                setEmployees(Array.isArray(result.data.employees) ? result.data.employees : []); 
            } else {
                setError(result.data.message);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to fetch timesheet employees.');
        } finally {
            setLoading(false);
        }
    }, [user?.userIdentifier, canManageTimesheets]);

    useEffect(() => {
        loadEmployees();
    }, [loadEmployees]);

    const filteredAndSortedData = useMemo(() => {
        let data = employees.map(emp => ({
            original: emp,
            display: [
                emp.employeeName,
                emp.employeeId,
                emp.employeeMail,
                emp.companyName,
                emp.createdBy,
                new Date(emp.createdAt).toLocaleDateString(),
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

                    if (sortConfig.key === 'Created At') {
                        valA = new Date(valA).getTime() || 0;
                        valB = new Date(valB).getTime() || 0;
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
    }, [employees, generalFilter, columnFilters, sortConfig, tableHeader]);

    const handleSort = (key, direction) => setSortConfig({ key, direction });
    const handleFilterChange = (header, config) => setColumnFilters(prev => ({ ...prev, [header]: config }));

    const handleDeleteClick = (employeeData) => {
        if (!canManageTimesheets) return;
        setEmployeeToDelete(employeeData);
        setDeleteModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!canManageTimesheets || !employeeToDelete) return;
        setLoading(true);
        try {
            await apiService.deleteTimesheetEmployee(employeeToDelete.employeeId, user.userIdentifier);
            loadEmployees();
            setDeleteModalOpen(false);
            setEmployeeToDelete(null);
            setSelectedEmployeeIds(prev => prev.filter(id => id !== employeeToDelete.employeeId));
        } catch (err) {
            setError(err.response?.data?.message || `Failed to delete employee ${employeeToDelete.employeeName}.`);
        } finally {
            setLoading(false);
        }
    };

    const handleEditClick = (employeeData) => {
        if (!canManageTimesheets) return;
        setEmployeeToEdit(employeeData);
        setIsEditModalOpen(true);
    };

    const handleSaveEmployee = async (updatedData) => {
        if (!canManageTimesheets || !employeeToEdit) return;
        setLoading(true);
        try {
            await apiService.updateTimesheetEmployee(employeeToEdit.employeeId, updatedData, user.userIdentifier);
            loadEmployees();
            setIsEditModalOpen(false);
            setEmployeeToEdit(null);
        } catch (err) {
            setError(err.response?.data?.message || `Failed to update employee ${employeeToEdit.employeeName}.`);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const handleRequestTimesheetApprovalClick = (employeeData) => {
        if (!canRequestTimesheetApproval) return;
        setEmployeeForTimesheetApproval(employeeData);
        setIsTimesheetApprovalModalOpen(true);
    };

    const handleCheckboxChange = (employeeId, isChecked) => {
        setSelectedEmployeeIds(prev => 
            isChecked ? [...prev, employeeId] : prev.filter(id => id !== employeeId)
        );
    };

    const handleSelectAllChange = (isChecked) => {
        if (isChecked) {
            setSelectedEmployeeIds(filteredAndSortedData.map(item => item.original.employeeId));
        } else {
            setSelectedEmployeeIds([]);
        }
    };

    const handleSendBulkRequest = () => {
        if (selectedEmployeeIds.length === 0) {
            setError("Please select at least one employee to send a bulk request.");
            return;
        }
        setIsBulkApprovalModalOpen(true);
    };

    const handleBulkApprovalSave = async (bulkData) => {
        setLoading(true);
        try {
            const response = await apiService.sendBulkTimesheetApprovalRequest(
                selectedEmployeeIds,
                bulkData.month,
                bulkData.year,
                bulkData.deadlineDate,
                bulkData.companyName,
                user.userIdentifier
            );
            if (response.data.success) {
                alert(response.data.message);
                setIsBulkApprovalModalOpen(false);
                setSelectedEmployeeIds([]);
            } else {
                throw new Error(response.data.message);
            }
        } catch (err) {
            setError(err.message || "Failed to send bulk approval requests.");
            throw err;
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <div className="space-y-4">
                <h1 className="text-3xl font-bold text-gray-800">Manage Timesheet Employees</h1>
                <p className="mt-1 text-gray-600">View, edit, and delete employees used for timesheet tracking.</p>
                
                <div className="bg-white p-4 rounded-lg shadow-sm border flex flex-wrap items-center justify-between gap-4">
                    <input 
                        type="text" 
                        placeholder="Search all columns..." 
                        value={generalFilter} 
                        onChange={(e) => setGeneralFilter(e.target.value)} 
                        className="shadow-sm border-gray-300 rounded-md px-3 py-2"
                        disabled={loading || !canManageTimesheets}
                    />
                    <div className="flex items-center space-x-2">
                        {canManageTimesheets && (
                            <button 
                                onClick={() => alert("Navigate to Create Timesheet Employee page")}
                                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                            >
                                Add New Employee
                            </button>
                        )}
                        {canRequestTimesheetApproval && selectedEmployeeIds.length > 0 && (
                            <button
                                onClick={handleSendBulkRequest}
                                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                                disabled={loading}
                            >
                                Send Bulk Request ({selectedEmployeeIds.length})
                            </button>
                        )}
                    </div>
                </div>

                {loading && <div className="flex justify-center items-center h-64"><Spinner /></div>}
                {error && <div className="text-red-500 bg-red-100 p-4 rounded-lg">Error: {error}</div>}
                
                {!loading && !error && !canManageTimesheets && (
                    <div className="text-center text-gray-500 p-10 bg-white rounded-xl shadow-sm border">
                        <h3 className="text-lg font-medium">Access Denied</h3>
                        <p className="text-sm">You do not have the necessary permissions to manage timesheet employees.</p>
                    </div>
                )}

                {!loading && !error && canManageTimesheets && (
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
                                                style={{ minWidth: h === 'Employee Email' ? '200px' : 'auto' }}
                                            >
                                                {h === 'Select' ? (
                                                    <div className="p-3">
                                                        <input
                                                            type="checkbox"
                                                            onChange={(e) => handleSelectAllChange(e.target.checked)}
                                                            checked={selectedEmployeeIds.length === filteredAndSortedData.length && filteredAndSortedData.length > 0}
                                                            className="h-4 w-4 rounded text-indigo-600 focus:ring-indigo-500"
                                                        />
                                                    </div>
                                                ) : h === 'Actions' ? (
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
                                            const originalEmployee = item.original;
                                            const displayRow = item.display;
                                            return (
                                                <tr key={rowIndex} className="bg-gray-50 border-b hover:bg-gray-100">
                                                    {tableHeader.includes('Select') && (
                                                        <td className="px-4 py-3 border-r border-slate-200">
                                                            <input
                                                                type="checkbox"
                                                                checked={selectedEmployeeIds.includes(originalEmployee.employeeId)}
                                                                onChange={(e) => handleCheckboxChange(originalEmployee.employeeId, e.target.checked)}
                                                                className="h-4 w-4 rounded text-indigo-600 focus:ring-indigo-500"
                                                            />
                                                        </td>
                                                    )}
                                                    {displayRow.map((cell, cellIndex) => (
                                                        <td key={cellIndex} className="px-4 py-3 border-r border-slate-200 last:border-r-0 font-medium text-gray-900 align-middle">
                                                            {cell}
                                                        </td>
                                                    ))}
                                                    {(canManageTimesheets || canRequestTimesheetApproval) && (
                                                        <td className="px-4 py-3 border-r border-slate-200 last:border-r-0 flex space-x-2 justify-center">
                                                            {canManageTimesheets && (
                                                                <>
                                                                    <button 
                                                                        onClick={() => handleEditClick(originalEmployee)} 
                                                                        className="text-gray-500 hover:text-indigo-600 p-1 rounded-md" 
                                                                        aria-label="Edit employee"
                                                                    >
                                                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
                                                            </button>
                                                                    <button 
                                                                        onClick={() => handleDeleteClick(originalEmployee)} 
                                                                        className="text-gray-500 hover:text-red-600 p-1 rounded-md" 
                                                                        aria-label="Delete employee"
                                                                    >
                                                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                                                            </button>
                                                                </>
                                                            )}
                                                            {canRequestTimesheetApproval && (
                                                                <button onClick={() => handleRequestTimesheetApprovalClick(originalEmployee)} className="text-blue-600 hover:text-blue-900 p-1 font-semibold">Request Timesheet</button>
                                                            )}
                                                        </td>
                                                    )}
                                                </tr>
                                            );
                                        })
                                    ) : (
                                        <tr>
                                            <td colSpan={tableHeader.length} className="px-4 py-8 text-center text-gray-500">
                                                No timesheet employees found.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
            {employeeToDelete && (
                <ConfirmationModal
                    isOpen={isDeleteModalOpen}
                    onClose={() => setDeleteModalOpen(false)}
                    onConfirm={handleConfirmDelete}
                    title="Confirm Deletion"
                    message={`Are you sure you want to delete timesheet employee "${employeeToDelete.employeeName}" (ID: ${employeeToDelete.employeeId})? This action cannot be undone.`}
                    confirmText="Delete"
                />
            )}
            {employeeToEdit && (
                <EditTimesheetEmployeeModal
                    isOpen={isEditModalOpen}
                    onClose={() => setIsEditModalOpen(false)}
                    onSave={handleSaveEmployee}
                    employeeToEdit={employeeToEdit}
                />
            )}
            {employeeForTimesheetApproval && (
                <RequestTimesheetApprovalForEmployeeModal
                    isOpen={isTimesheetApprovalModalOpen}
                    onClose={() => setIsTimesheetApprovalModalOpen(false)}
                    timesheetEmployee={employeeForTimesheetApproval}
                />
            )}
            {selectedEmployeeIds.length > 0 && (
                <BulkTimesheetApprovalRequestModal
                    isOpen={isBulkApprovalModalOpen}
                    onClose={() => setIsBulkApprovalModalOpen(false)}
                    onSave={handleBulkApprovalSave}
                    selectedEmployeeIds={selectedEmployeeIds}
                />
            )}
        </>
    );
};

export default ManageTimesheetEmployeesPage;