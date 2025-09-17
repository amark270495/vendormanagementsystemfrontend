import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../api/apiService';
import Spinner from '../components/Spinner';
import ConfirmationModal from '../components/dashboard/ConfirmationModal';
import { usePermissions } from '../hooks/usePermissions';
import EditMSAWOVendorCompanyModal from '../components/msa-wo/EditMSAWOVendorCompanyModal';

const ManageMSAWOVendorCompaniesPage = ({ onNavigate }) => {
    const { user } = useAuth();
    const { canManageMSAWO } = usePermissions();

    const [companies, setCompanies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [generalFilter, setGeneralFilter] = useState('');
    
    const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
    const [companyToDelete, setCompanyToDelete] = useState(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [companyToEdit, setCompanyToEdit] = useState(null);

    const tableHeader = useMemo(() => [
        'Company Name', 'State', 'Email', 'Contact Person', 'Actions'
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

    const filteredData = useMemo(() => {
        if (!generalFilter) return companies;
        const lowercasedFilter = generalFilter.toLowerCase();
        return companies.filter(comp => 
            Object.values(comp).some(val => String(val).toLowerCase().includes(lowercasedFilter))
        );
    }, [companies, generalFilter]);

    const handleEditClick = (company) => {
        if (!canManageMSAWO) return;
        setCompanyToEdit(company);
        setIsEditModalOpen(true);
    };

    const handleDeleteClick = (company) => {
        if (!canManageMSAWO) return;
        setCompanyToDelete(company);
        setDeleteModalOpen(true);
    };

    const handleSaveCompany = async (updatedData) => {
        if (!canManageMSAWO || !companyToEdit) return;
        try {
            await apiService.updateMSAWOVendorCompany(companyToEdit.companyName, updatedData, user.userIdentifier);
            loadCompanies();
        } catch (err) {
            setError(err.response?.data?.message || `Failed to update ${companyToEdit.companyName}.`);
            throw err;
        }
    };

    const handleConfirmDelete = async () => {
        if (!canManageMSAWO || !companyToDelete) return;
        try {
            await apiService.deleteMSAWOVendorCompany(companyToDelete.companyName, user.userIdentifier);
            loadCompanies();
            setDeleteModalOpen(false);
            setCompanyToDelete(null);
        } catch (err) {
            setError(err.response?.data?.message || `Failed to delete ${companyToDelete.companyName}.`);
        }
    };

    return (
        <>
            <div className="space-y-4">
                <h1 className="text-3xl font-bold text-gray-800">Manage Vendor Companies (MSA/WO)</h1>
                <p className="mt-1 text-gray-600">View, edit, and delete vendor companies for the E-Signing module.</p>
                
                <div className="bg-white p-4 rounded-lg shadow-sm border flex flex-wrap items-center justify-between gap-4">
                    <input 
                        type="text" 
                        placeholder="Search companies..." 
                        value={generalFilter} 
                        onChange={(e) => setGeneralFilter(e.target.value)} 
                        className="form-input"
                        disabled={loading || !canManageMSAWO}
                    />
                     {canManageMSAWO && (
                        <button onClick={() => onNavigate('create_msawo_vendor_company')} className="btn-primary">
                            Add New Vendor
                        </button>
                    )}
                </div>

                {loading && <div className="flex justify-center items-center h-64"><Spinner /></div>}
                {error && <div className="text-red-500 bg-red-100 p-4 rounded-lg">Error: {error}</div>}
                
                {!loading && !error && !canManageMSAWO && (
                    <div className="text-center text-gray-500 p-10 bg-white rounded-xl shadow-sm border">
                        <h3 className="text-lg font-medium">Access Denied</h3>
                    </div>
                )}

                {!loading && !error && canManageMSAWO && (
                    <div className="bg-white rounded-lg shadow-lg border border-gray-200" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left text-gray-500">
                                <thead className="text-xs text-gray-700 uppercase bg-slate-200 sticky top-0 z-10">
                                    <tr>
                                        {tableHeader.map(h => <th key={h} scope="col" className="px-6 py-3">{h}</th>)}
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredData.length > 0 ? (
                                        filteredData.map((company) => (
                                            <tr key={company.companyName} className="bg-gray-50 border-b hover:bg-gray-100">
                                                <td className="px-6 py-4 font-medium text-gray-900">{company.companyName}</td>
                                                <td className="px-6 py-4">{company.state}</td>
                                                <td className="px-6 py-4">{company.companyEmail}</td>
                                                <td className="px-6 py-4">{company.authorizedSignatureName}</td>
                                                <td className="px-6 py-4 flex space-x-2">
                                                    <button onClick={() => handleEditClick(company)} className="icon-btn-blue" aria-label="Edit"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" /><path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" /></svg></button>
                                                    <button onClick={() => handleDeleteClick(company)} className="icon-btn-red" aria-label="Delete"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg></button>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr><td colSpan={tableHeader.length} className="text-center py-8 text-gray-500">No vendor companies found.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
             {companyToEdit && (
                <EditMSAWOVendorCompanyModal
                    isOpen={isEditModalOpen}
                    onClose={() => setIsEditModalOpen(false)}
                    onSave={handleSaveCompany}
                    companyToEdit={companyToEdit}
                />
            )}
            {companyToDelete && (
                <ConfirmationModal
                    isOpen={isDeleteModalOpen}
                    onClose={() => setDeleteModalOpen(false)}
                    onConfirm={handleConfirmDelete}
                    title="Confirm Deletion"
                    message={`Are you sure you want to delete vendor "${companyToDelete.companyName}"?`}
                    confirmText="Delete"
                />
            )}
        </>
    );
};

export default ManageMSAWOVendorCompaniesPage;