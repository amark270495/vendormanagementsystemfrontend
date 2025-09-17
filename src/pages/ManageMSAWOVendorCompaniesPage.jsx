import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../api/apiService';
import Spinner from '../components/Spinner';
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
    
    const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
    const [companyToDelete, setCompanyToDelete] = useState(null);

    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [companyToEdit, setCompanyToEdit] = useState(null);

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
        return companies.filter(company => 
            Object.values(company).some(val => 
                String(val).toLowerCase().includes(lowercasedFilter)
            )
        );
    }, [companies, generalFilter]);

    const handleDeleteClick = (company) => {
        if (!canManageMSAWO) return;
        setCompanyToDelete(company);
        setDeleteModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!canManageMSAWO || !companyToDelete) return;
        setLoading(true);
        try {
            await apiService.deleteMSAWOVendorCompany(companyToDelete.companyName, user.userIdentifier);
            loadCompanies();
        } catch (err) {
            setError(err.response?.data?.message || `Failed to delete company.`);
        } finally {
            setLoading(false);
            setDeleteModalOpen(false);
            setCompanyToDelete(null);
        }
    };

    const handleEditClick = (company) => {
        if (!canManageMSAWO) return;
        setCompanyToEdit(company);
        setIsEditModalOpen(true);
    };

    const handleSaveCompany = async (updatedData) => {
        if (!canManageMSAWO || !companyToEdit) return;
        setLoading(true);
        try {
            await apiService.updateMSAWOVendorCompany(companyToEdit.companyName, updatedData, user.userIdentifier);
            loadCompanies();
        } catch (err) {
            setError(err.response?.data?.message || `Failed to update company.`);
            throw err;
        } finally {
            setLoading(false);
            setIsEditModalOpen(false);
            setCompanyToEdit(null);
        }
    };

    if (loading) return <div className="flex justify-center items-center h-64"><Spinner /></div>;
    if (error) return <div className="text-red-500 bg-red-100 p-4 rounded-lg">Error: {error}</div>;

    return (
        <>
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Manage Vendor Companies</h1>
                        <p className="mt-1 text-gray-600">View, edit, and delete vendor companies for MSA/WO.</p>
                    </div>
                </div>
                
                <div className="bg-white p-4 rounded-xl shadow-lg border">
                    <input 
                        type="text" 
                        placeholder="Search for a company..." 
                        value={generalFilter} 
                        onChange={(e) => setGeneralFilter(e.target.value)} 
                        className="shadow-sm border-gray-300 rounded-lg p-3 w-full md:w-1/3"
                    />
                </div>

                <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left text-gray-600">
                            <thead className="text-xs text-gray-700 uppercase bg-gray-100">
                                <tr>
                                    <th scope="col" className="px-6 py-4">Company Name</th>
                                    <th scope="col" className="px-6 py-4">Contact Person</th>
                                    <th scope="col" className="px-6 py-4">Email</th>
                                    <th scope="col" className="px-6 py-4">State</th>
                                    <th scope="col" className="px-6 py-4 text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {filteredData.length > 0 ? (
                                    filteredData.map((company) => (
                                        <tr key={company.companyName} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 font-semibold text-gray-900">{company.companyName}</td>
                                            <td className="px-6 py-4">{company.authorizedSignatureName}</td>
                                            <td className="px-6 py-4">{company.vendorEmail}</td>
                                            <td className="px-6 py-4">{company.state}</td>
                                            <td className="px-6 py-4 text-center flex justify-center space-x-2">
                                                <button onClick={() => handleEditClick(company)} className="p-2 text-gray-500 hover:text-indigo-600 rounded-full hover:bg-gray-100" aria-label="Edit">
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L16.732 3.732z"></path></svg>
                                                </button>
                                                <button onClick={() => handleDeleteClick(company)} className="p-2 text-gray-500 hover:text-red-600 rounded-full hover:bg-gray-100" aria-label="Delete">
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-10 text-center text-gray-500">No vendor companies found.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            {companyToDelete && (
                <ConfirmationModal
                    isOpen={isDeleteModalOpen}
                    onClose={() => setDeleteModalOpen(false)}
                    onConfirm={handleConfirmDelete}
                    title="Confirm Deletion"
                    message={`Are you sure you want to delete vendor "${companyToDelete.companyName}"? This action cannot be undone.`}
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