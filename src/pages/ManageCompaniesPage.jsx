import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../api/apiService';
import Spinner from '../components/Spinner';
import Dropdown from '../components/Dropdown';
import HeaderMenu from '../components/dashboard/HeaderMenu'; // Reusing for sorting/filtering
import ConfirmationModal from '../components/dashboard/ConfirmationModal'; // Reusing for deletion confirmation
import { usePermissions } from '../hooks/usePermissions';
import EditCompanyModal from '../components/timesheets/EditCompanyModal'; // NEW: Import Edit Company Modal

const ManageCompaniesPage = () => {
    const { user } = useAuth();
    const { canManageTimesheets } = usePermissions();

    const [companies, setCompanies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    
    const [generalFilter, setGeneralFilter] = useState('');
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });
    const [columnFilters, setColumnFilters] = useState({});

    const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
    const [companyToDelete, setCompanyToDelete] = useState(null);

    const [isEditModalOpen, setIsEditModalOpen] = useState(false); // NEW: State for Edit Modal
    const [companyToEdit, setCompanyToEdit] = useState(null); // NEW: State for company being edited

    const tableHeader = useMemo(() => [
        'Company Name', 'Company Email', 'Company Address', 'Contact Person', 'Contact Person Email', 'Company Mobile', 'Created By', 'Created At', 'Actions'
    ], []);

    const loadCompanies = useCallback(async () => {
        setLoading(true);
        setError('');
        if (!user?.userIdentifier || !canManageTimesheets) {
            setLoading(false);
            setError("You do not have permission to manage companies.");
            return;
        }
        try {
            const result = await apiService.getCompanies(user.userIdentifier);
            if (result.data.success) {
                setCompanies(result.data.companies);
            } else {
                setError(result.data.message);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to fetch companies.');
        } finally {
            setLoading(false);
        }
    }, [user?.userIdentifier, canManageTimesheets]);

    useEffect(() => {
        loadCompanies();
    }, [loadCompanies]);

    const filteredAndSortedData = useMemo(() => {
        let data = companies.map(comp => [
            comp.companyName,
            comp.companyEmail,
            comp.companyAddress,
            comp.contactPerson,
            comp.contactPersonMail,
            comp.companyMobileNumber,
            comp.createdBy,
            new Date(comp.createdAt).toLocaleDateString(), // Format date
        ]);

        // General search filter
        if (generalFilter) {
            const lowercasedFilter = generalFilter.toLowerCase();
            data = data.filter(row => 
                row.some(cell => String(cell).toLowerCase().includes(lowercasedFilter))
            );
        }

        // Column-specific filters (reusing HeaderMenu logic)
        if (Object.keys(columnFilters).length > 0) {
            data = data.filter(row => {
                return Object.entries(columnFilters).every(([header, config]) => {
                    if (!config || !config.type || !config.value1) return true;
                    const colIndex = tableHeader.indexOf(header);
                    if (colIndex === -1) return true;
                    
                    const cellValue = String(row[colIndex] || '').toLowerCase();
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

        // Sorting
        if (sortConfig.key) {
            const sortIndex = tableHeader.indexOf(sortConfig.key);
            if (sortIndex !== -1) {
                data.sort((a, b) => {
                    let valA = a[sortIndex];
                    let valB = b[sortIndex];

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
    }, [companies, generalFilter, columnFilters, sortConfig, tableHeader]);

    const handleSort = (key, direction) => setSortConfig({ key, direction });
    const handleFilterChange = (header, config) => setColumnFilters(prev => ({ ...prev, [header]: config }));

    const handleDeleteClick = (companyData) => {
        if (!canManageTimesheets) return;
        setCompanyToDelete(companyData);
        setDeleteModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!canManageTimesheets || !companyToDelete) return;
        setLoading(true);
        try {
            await apiService.deleteCompany(companyToDelete.companyName, user.userIdentifier);
            loadCompanies(); // Reload data after successful deletion
            setDeleteModalOpen(false);
            setCompanyToDelete(null);
        } catch (err) {
            setError(err.response?.data?.message || `Failed to delete company ${companyToDelete.companyName}.`);
        } finally {
            setLoading(false);
        }
    };

    const handleEditClick = (companyData) => {
        if (!canManageTimesheets) return;
        setCompanyToEdit(companyData);
        setIsEditModalOpen(true);
    };

    const handleSaveCompany = async (updatedData) => {
        if (!canManageTimesheets || !companyToEdit) return;
        setLoading(true);
        try {
            await apiService.updateCompany(companyToEdit.companyName, updatedData, user.userIdentifier);
            loadCompanies(); // Reload data after successful update
            setIsEditModalOpen(false);
            setCompanyToEdit(null);
        } catch (err) {
            setError(err.response?.data?.message || `Failed to update company ${companyToEdit.companyName}.`);
            throw err; // Re-throw to allow modal to display error
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <div className="space-y-4">
                <h1 className="text-3xl font-bold text-gray-800">Manage Companies</h1>
                <p className="mt-1 text-gray-600">View, edit, and delete client companies.</p>
                
                <div className="bg-white p-4 rounded-lg shadow-sm border flex flex-wrap items-center justify-between gap-4">
                    <input 
                        type="text" 
                        placeholder="Search all columns..." 
                        value={generalFilter} 
                        onChange={(e) => setGeneralFilter(e.target.value)} 
                        className="shadow-sm border-gray-300 rounded-md px-3 py-2"
                        disabled={loading || !canManageTimesheets}
                    />
                    {canManageTimesheets && (
                        <button 
                            onClick={() => alert("Navigate to Create Company page")} // Placeholder for navigation
                            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                        >
                            Add New Company
                        </button>
                    )}
                </div>

                {loading && <div className="flex justify-center items-center h-64"><Spinner /></div>}
                {error && <div className="text-red-500 bg-red-100 p-4 rounded-lg">Error: {error}</div>}
                
                {!loading && !error && !canManageTimesheets && (
                    <div className="text-center text-gray-500 p-10 bg-white rounded-xl shadow-sm border">
                        <h3 className="text-lg font-medium">Access Denied</h3>
                        <p className="text-sm">You do not have the necessary permissions to manage companies.</p>
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
                                                style={{ minWidth: h === 'Company Email' ? '200px' : 'auto' }}
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
                                        filteredAndSortedData.map((row, rowIndex) => {
                                            // Find the original company object to pass to edit/delete handlers
                                            const originalCompany = companies.find(comp => comp.companyName === row[tableHeader.indexOf('Company Name')]);
                                            return (
                                                <tr key={rowIndex} className="bg-gray-50 border-b hover:bg-gray-100">
                                                    {row.map((cell, cellIndex) => (
                                                        <td key={cellIndex} className="px-4 py-3 border-r border-slate-200 last:border-r-0 font-medium text-gray-900 align-middle">
                                                            {cell}
                                                        </td>
                                                    ))}
                                                    <td className="px-4 py-3 border-r border-slate-200 last:border-r-0 flex space-x-2 justify-center">
                                                        <button 
                                                            onClick={() => handleEditClick(originalCompany)} 
                                                            className="text-gray-500 hover:text-indigo-600 p-1 rounded-md" 
                                                            aria-label="Edit company"
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
                                                        </button>
                                                        <button 
                                                            onClick={() => handleDeleteClick(originalCompany)} 
                                                            className="text-gray-500 hover:text-red-600 p-1 rounded-md" 
                                                            aria-label="Delete company"
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    ) : (
                                        <tr>
                                            <td colSpan={tableHeader.length} className="px-4 py-8 text-center text-gray-500">
                                                No companies found.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
            {companyToDelete && (
                <ConfirmationModal
                    isOpen={isDeleteModalOpen}
                    onClose={() => setDeleteModalOpen(false)}
                    onConfirm={handleConfirmDelete}
                    title="Confirm Deletion"
                    message={`Are you sure you want to delete company "${companyToDelete.companyName}"? This action cannot be undone.`}
                    confirmText="Delete"
                />
            )}
            {companyToEdit && (
                <EditCompanyModal
                    isOpen={isEditModalOpen}
                    onClose={() => setIsEditModalOpen(false)}
                    onSave={handleSaveCompany}
                    companyToEdit={companyToEdit}
                />
            )}
        </>
    );
};

export default ManageCompaniesPage;