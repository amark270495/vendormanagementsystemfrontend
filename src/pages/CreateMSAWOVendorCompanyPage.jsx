import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../api/apiService';
import Spinner from '../components/Spinner';
import { usePermissions } from '../hooks/usePermissions';

const CreateMSAWOVendorCompanyPage = () => {
    const { user } = useAuth();
    const { canManageMSAWO } = usePermissions();

    const [formData, setFormData] = useState({
        vendorName: '',
        state: '',
        federalId: '',
        companyAddress: '',
        vendorEmail: '',
        authorizedSignatureName: '',
        authorizedPersonTitle: '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleChange = (e) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!canManageMSAWO) {
            setError("You do not have permission to create vendor companies.");
            return;
        }

        setError('');
        setSuccess('');
        setLoading(true);

        try {
            const response = await apiService.createMSAWOVendorCompany(formData, user.userIdentifier);
            if (response.data.success) {
                setSuccess(response.data.message);
                setFormData({
                    vendorName: '',
                    state: '',
                    federalId: '',
                    companyAddress: '',
                    vendorEmail: '',
                    authorizedSignatureName: '',
                    authorizedPersonTitle: '',
                });
                setTimeout(() => setSuccess(''), 3000);
            } else {
                setError(response.data.message);
            }
        } catch (err) {
            setError(err.response?.data?.message || "An unexpected error occurred.");
        } finally {
            setLoading(false);
        }
    };

    if (!canManageMSAWO) {
        return (
            <div className="text-center text-gray-500 p-10 bg-white rounded-xl shadow-sm border">
                <h3 className="text-lg font-medium">Access Denied</h3>
                <p className="text-sm">You do not have the necessary permissions for this page.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <div className="text-center">
                <h1 className="text-3xl font-bold text-gray-900">Create New Vendor Company</h1>
                <p className="mt-2 text-gray-600">Add a new vendor to be used in MSA/WO documents.</p>
            </div>
            
            <form onSubmit={handleSubmit}>
                <div className="bg-white p-6 md:p-8 rounded-xl shadow-lg border">
                    {error && <div className="bg-red-50 border-l-4 border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6">{error}</div>}
                    {success && <div className="bg-green-50 border-l-4 border-green-400 text-green-700 px-4 py-3 rounded-lg mb-6">{success}</div>}
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6">
                        <div className="md:col-span-2">
                            <label htmlFor="vendorName" className="block text-sm font-medium text-gray-700">Vendor Company Name <span className="text-red-500">*</span></label>
                            <input type="text" name="vendorName" id="vendorName" value={formData.vendorName} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm p-3 focus:ring-indigo-500 focus:border-indigo-500" />
                        </div>
                        <div>
                            <label htmlFor="state" className="block text-sm font-medium text-gray-700">State <span className="text-red-500">*</span></label>
                            <input type="text" name="state" id="state" value={formData.state} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm p-3 focus:ring-indigo-500 focus:border-indigo-500" />
                        </div>
                        <div>
                            <label htmlFor="federalId" className="block text-sm font-medium text-gray-700">Federal ID/EIN <span className="text-red-500">*</span></label>
                            <input type="text" name="federalId" id="federalId" value={formData.federalId} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm p-3 focus:ring-indigo-500 focus:border-indigo-500" />
                        </div>
                         <div className="md:col-span-2">
                            <label htmlFor="companyAddress" className="block text-sm font-medium text-gray-700">Vendor Company Address <span className="text-red-500">*</span></label>
                            <textarea name="companyAddress" id="companyAddress" value={formData.companyAddress} onChange={handleChange} required rows="3" className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm p-3 focus:ring-indigo-500 focus:border-indigo-500"></textarea>
                        </div>
                         <div>
                            <label htmlFor="vendorEmail" className="block text-sm font-medium text-gray-700">Vendor Email ID <span className="text-red-500">*</span></label>
                            <input type="email" name="vendorEmail" id="vendorEmail" value={formData.vendorEmail} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm p-3 focus:ring-indigo-500 focus:border-indigo-500" />
                        </div>
                        <div>
                            <label htmlFor="authorizedSignatureName" className="block text-sm font-medium text-gray-700">Authorized Person Name <span className="text-red-500">*</span></label>
                            <input type="text" name="authorizedSignatureName" id="authorizedSignatureName" value={formData.authorizedSignatureName} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm p-3 focus:ring-indigo-500 focus:border-indigo-500" />
                        </div>
                         <div className="md:col-span-2">
                            <label htmlFor="authorizedPersonTitle" className="block text-sm font-medium text-gray-700">Authorized Person Title <span className="text-red-500">*</span></label>
                            <input type="text" name="authorizedPersonTitle" id="authorizedPersonTitle" value={formData.authorizedPersonTitle} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm p-3 focus:ring-indigo-500 focus:border-indigo-500" />
                        </div>
                    </div>
                </div>
                <div className="mt-6 flex justify-end">
                    <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-lg flex items-center justify-center w-48 h-12 disabled:bg-indigo-400 shadow-lg" disabled={loading || success}>
                        {loading ? <Spinner size="6" /> : 'Create Vendor Company'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default CreateMSAWOVendorCompanyPage;