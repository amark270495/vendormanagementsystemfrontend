import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../api/apiService';
import Spinner from '../components/Spinner';
import Dropdown from '../components/Dropdown';
import HeaderMenu from '../components/dashboard/HeaderMenu';
import ConfirmationModal from '../components/dashboard/ConfirmationModal';
import { usePermissions } from '../hooks/usePermissions';
import EditMSAWOVendorCompanyModal from '../components/msa-wo/EditMSAWOVendorCompanyModal';

const ManageMSAWOVendorCompaniesPage = () => {
    const { user } = useAuth();
    const { canManageMSAWO } = usePermissions();

    const [companies, setCompanies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    
    const [generalFilter, setGeneralFilter] = useState('');
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });

    const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
    const [companyToDelete, setCompanyToDelete] = useState(null);

    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [companyToEdit, setCompanyToEdit] = useState(null);

    const tableHeader = useMemo(() => [
        'Company Name', 'Contact Person', 'Email', 'State', 'Actions'
    ], []);

    const loadCompanies = useCallback(async () => {
        setLoading(true);
        setError('');
        if (!user?.userIdentifier || !canManageMSAWO) {
            setLoading(false);
            setError("You do not have permission to manage vendor companies.");
            return;
        }
        try {
            const result = await apiService.getMSAWOVendorCompanies(user.userIdentifier);
            if (result.data.success) {
                setCompanies(result.data.companies);
            } else {
                setError(result.data.message);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to fetch vendor companies.');
        } finally {
            setLoading(false);
        }
    }, [user?.userIdentifier, canManageMSAWO]);

    useEffect(() => {
        loadCompanies();
    }, [loadCompanies]);

    const filteredAndSortedData = useMemo(() => {
        let data = [...companies];

        if (generalFilter) {
            const lowercasedFilter = generalFilter.toLowerCase();
            data = data.filter(comp => 
                Object.values(comp).some(val => String(val).toLowerCase().includes(lowercasedFilter))
            );
        }

        if (sortConfig.key) {
            const key = {
                'Company Name': 'vendorName',
                'Contact Person': 'authorizedSignatureName',
                'Email': 'vendorEmail',
                'State': 'state'
            }[sortConfig.key];

            if (key) {
                data.sort((a, b) => {
                    const valA = String(a[key] || '').toLowerCase();
                    const valB = String(b[key] || '').toLowerCase();
                    if (valA < valB) return sortConfig.direction === 'ascending' ? -1 : 1;
                    if (valA > valB) return sortConfig.direction === 'ascending' ? 1 : -1;
                    return 0;
                });
            }
        }
        return data;
    }, [companies, generalFilter, sortConfig]);

    const handleSort = (key, direction) => setSortConfig({ key, direction });

    const handleDeleteClick = (companyData) => {
        if (!canManageMSAWO) return;
        setCompanyToDelete(companyData);
        setDeleteModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!canManageMSAWO || !companyToDelete) return;
        setLoading(true);
        try {
            await apiService.deleteMSAWOVendorCompany(companyToDelete.vendorName, user.userIdentifier);
            loadCompanies();
            setDeleteModalOpen(false);
            setCompanyToDelete(null);
        } catch (err) {
            setError(err.response?.data?.message || `Failed to delete company.`);
        } finally {
            setLoading(false);
        }
    };

    const handleEditClick = (companyData) => {
        if (!canManageMSAWO) return;
        setCompanyToEdit(companyData);
        setIsEditModalOpen(true);
    };

    const handleSaveCompany = async (updatedData) => {
        if (!canManageMSAWO || !companyToEdit) return;
        setLoading(true);
        try {
            await apiService.updateMSAWOVendorCompany(companyToEdit.vendorName, updatedData, user.userIdentifier);
            loadCompanies();
            setIsEditModalOpen(false);
            setCompanyToEdit(null);
        } catch (err) {
            setError(err.response?.data?.message || `Failed to update company.`);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <div className="space-y-6">
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-gray-900">Manage Vendor Companies</h1>
                    <p className="mt-2 text-gray-600">View, edit, and delete vendor companies for MSA/WO.</p>
                </div>
                
                <div className="bg-white p-4 rounded-xl shadow-lg border flex flex-wrap items-center justify-between gap-4">
                    <input 
                        type="text" 
                        placeholder="Search for a company..." 
                        value={generalFilter} 
                        onChange={(e) => setGeneralFilter(e.target.value)} 
                        className="shadow-sm border-gray-300 rounded-lg px-4 py-2 w-full md:w-1/3"
                        disabled={loading || !canManageMSAWO}
                    />
                </div>

                {loading && <div className="flex justify-center items-center h-64"><Spinner /></div>}
                {error && <div className="text-red-500 bg-red-100 p-4 rounded-lg">Error: {error}</div>}
                
                {!loading && !error && !canManageMSAWO && (
                    <div className="text-center text-gray-500 p-10 bg-white rounded-xl shadow-sm border">
                        <h3 className="text-lg font-medium">Access Denied</h3>
                    </div>
                )}

                {!loading && !error && canManageMSAWO && (
                    <div className="bg-white rounded-xl shadow-lg border" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left text-gray-500">
                                <thead className="text-xs text-gray-700 uppercase bg-slate-100 sticky top-0 z-10">
                                    <tr>
                                        {tableHeader.map(h => (
                                            <th key={h} scope="col" className="p-0 border-r border-slate-200 last:border-r-0">
                                                {h === 'Actions' ? (
                                                    <div className="p-4 font-bold text-center">{h}</div>
                                                ) : (
                                                    <Dropdown width="64" trigger={
                                                        <div className="flex items-center justify-between w-full h-full cursor-pointer p-4 hover:bg-slate-200">
                                                            <span className="font-bold">{h}</span>
                                                            {sortConfig.key === h && (sortConfig.direction === 'ascending' ? ' ▲' : ' ▼')}
                                                        </div>
                                                    }>
                                                        <HeaderMenu header={h} onSort={(dir) => handleSort(h, dir)} />
                                                    </Dropdown>
                                                )}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredAndSortedData.length > 0 ? (
                                        filteredAndSortedData.map((company) => (
                                            <tr key={company.vendorName} className="bg-white border-b hover:bg-gray-50">
                                                {/* --- FIX: Using 'vendorName' instead of 'companyName' --- */}
                                                <td className="px-6 py-4 font-medium text-gray-900">{company.vendorName}</td>
                                                <td className="px-6 py-4">{company.authorizedSignatureName}</td>
                                                <td className="px-6 py-4">{company.vendorEmail}</td>
                                                <td className="px-6 py-4">{company.state}</td>
                                                <td className="px-6 py-4 text-center">
                                                    <button onClick={() => handleEditClick(company)} className="text-gray-500 hover:text-indigo-600 p-2 rounded-md" aria-label="Edit company"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg></button>
                                                    <button onClick={() => handleDeleteClick(company)} className="text-gray-500 hover:text-red-600 p-2 rounded-md" aria-label="Delete company"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg></button>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr><td colSpan={tableHeader.length} className="px-6 py-8 text-center text-gray-500">No vendor companies found.</td></tr>
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
                    // --- FIX: Using 'vendorName' in the confirmation message ---
                    message={`Are you sure you want to delete company "${companyToDelete.vendorName}"? This action cannot be undone.`}
                    confirmText="Delete"
                />
            )}
            {companyToEdit && (
                <EditMSAWOVendorCompanyModal
                    isOpen={isEditModalOpen}
                    onClose={() => setIsEditModalOpen(false)}
                    onSave={handleSaveCompany}
                    companyToEdit={companyToEdit}
                />
            )}
        </>
    );
};

export default ManageMSAWOVendorCompaniesPage;