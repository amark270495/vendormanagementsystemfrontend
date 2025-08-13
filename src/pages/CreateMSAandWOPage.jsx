import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../api/apiService';
import Spinner from '../components/Spinner';
import { usePermissions } from '../hooks/usePermissions';

const CreateMSAandWOPage = () => {
    const { user } = useAuth();
    // Placeholder permission for now, to be replaced by a dedicated permission later
    const canCreateMSAWO = user.permissions.canAddPosting; 

    const [formData, setFormData] = useState({
        vendorName: '',
        state: '',
        federalId: '',
        companyAddress: '',
        vendorEmail: '',
        authorizedSignatureName: '',
        authorizedPersonTitle: '',
        candidateName: '',
        typeOfServices: '',
        typeOfSubcontract: '',
        rate: '',
        perHour: '',
        net: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleChange = (e) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!canCreateMSAWO) {
            setError("You do not have permission to create MSA and Work Order documents.");
            return;
        }

        setError('');
        setSuccess('');
        setLoading(true);

        try {
            const response = await apiService.createMSAandWO(formData, user.userIdentifier);
            if (response.data.success) {
                setSuccess(response.data.message);
                setFormData({ // Clear form on success
                    vendorName: '',
                    state: '',
                    federalId: '',
                    companyAddress: '',
                    vendorEmail: '',
                    authorizedSignatureName: '',
                    authorizedPersonTitle: '',
                    candidateName: '',
                    typeOfServices: '',
                    typeOfSubcontract: '',
                    rate: '',
                    perHour: '',
                    net: ''
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

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Create MSA and Work Order</h1>
                <p className="mt-1 text-gray-600">Enter the details to generate a new Master Services Agreement and Work Order document for e-signing.</p>
            </div>
            {!canCreateMSAWO && !loading && (
                <div className="text-center text-gray-500 p-10 bg-white rounded-xl shadow-sm border">
                    <h3 className="text-lg font-medium">Access Denied</h3>
                    <p className="text-sm">You do not have the necessary permissions to create these documents.</p>
                </div>
            )}
            {canCreateMSAWO && (
                <form onSubmit={handleSubmit}>
                    <div className="bg-white p-6 md:p-8 rounded-xl shadow-sm border">
                        {error && <div className="bg-red-50 border-l-4 border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6">{error}</div>}
                        {success && <div className="bg-green-50 border-l-4 border-green-400 text-green-700 px-4 py-3 rounded-lg mb-6">{success}</div>}
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6">
                            <div>
                                <label htmlFor="vendorName" className="block text-sm font-medium text-gray-700">Vendor Company Name <span className="text-red-500">*</span></label>
                                <input type="text" name="vendorName" id="vendorName" value={formData.vendorName} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500" />
                            </div>
                            <div>
                                <label htmlFor="state" className="block text-sm font-medium text-gray-700">State <span className="text-red-500">*</span></label>
                                <input type="text" name="state" id="state" value={formData.state} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500" />
                            </div>
                            <div>
                                <label htmlFor="federalId" className="block text-sm font-medium text-gray-700">Federal Id/EIN <span className="text-red-500">*</span></label>
                                <input type="text" name="federalId" id="federalId" value={formData.federalId} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500" />
                            </div>
                            <div>
                                <label htmlFor="companyAddress" className="block text-sm font-medium text-gray-700">Vendor Company Address <span className="text-red-500">*</span></label>
                                <input type="text" name="companyAddress" id="companyAddress" value={formData.companyAddress} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500" />
                            </div>
                            <div>
                                <label htmlFor="vendorEmail" className="block text-sm font-medium text-gray-700">Vendor Email Id <span className="text-red-500">*</span></label>
                                <input type="email" name="vendorEmail" id="vendorEmail" value={formData.vendorEmail} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500" />
                            </div>
                            <div>
                                <label htmlFor="authorizedSignatureName" className="block text-sm font-medium text-gray-700">Vendor Authorized Person Name <span className="text-red-500">*</span></label>
                                <input type="text" name="authorizedSignatureName" id="authorizedSignatureName" value={formData.authorizedSignatureName} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500" />
                            </div>
                            <div>
                                <label htmlFor="authorizedPersonTitle" className="block text-sm font-medium text-gray-700">Vendor Authorized Person Title <span className="text-red-500">*</span></label>
                                <input type="text" name="authorizedPersonTitle" id="authorizedPersonTitle" value={formData.authorizedPersonTitle} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500" />
                            </div>
                            <div>
                                <label htmlFor="candidateName" className="block text-sm font-medium text-gray-700">Candidate Name (Employee Name From Vendor) <span className="text-red-500">*</span></label>
                                <input type="text" name="candidateName" id="candidateName" value={formData.candidateName} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500" />
                            </div>
                            <div>
                                <label htmlFor="typeOfServices" className="block text-sm font-medium text-gray-700">Type Of Service <span className="text-red-500">*</span></label>
                                <select name="typeOfServices" id="typeOfServices" value={formData.typeOfServices} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm p-2 h-[42px] focus:ring-indigo-500 focus:border-indigo-500">
                                    <option value="">Select Service</option>
                                    <option value="IT Consulting">IT Consulting</option>
                                    <option value="Staffing">Staffing</option>
                                </select>
                            </div>
                            <div>
                                <label htmlFor="typeOfSubcontract" className="block text-sm font-medium text-gray-700">Type Of Subcontract <span className="text-red-500">*</span></label>
                                <select name="typeOfSubcontract" id="typeOfSubcontract" value={formData.typeOfSubcontract} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm p-2 h-[42px] focus:ring-indigo-500 focus:border-indigo-500">
                                    <option value="">Select Subcontract</option>
                                    <option value="Time and Materials">Time and Materials</option>
                                    <option value="Fixed Price">Fixed Price</option>
                                </select>
                            </div>
                            <div>
                                <label htmlFor="rate" className="block text-sm font-medium text-gray-700">Rate <span className="text-red-500">*</span></label>
                                <input type="number" name="rate" id="rate" value={formData.rate} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500" />
                            </div>
                            <div>
                                <label htmlFor="perHour" className="block text-sm font-medium text-gray-700">Per Hour/Day/Month <span className="text-red-500">*</span></label>
                                <select name="perHour" id="perHour" value={formData.perHour} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm p-2 h-[42px] focus:ring-indigo-500 focus:border-indigo-500">
                                    <option value="">Select Option</option>
                                    <option value="PER HOUR">Per Hour</option>
                                    <option value="PER DAY">Per Day</option>
                                    <option value="PER MONTH">Per Month</option>
                                </select>
                            </div>
                            <div>
                                <label htmlFor="net" className="block text-sm font-medium text-gray-700">Payment Terms (NET) <span className="text-red-500">*</span></label>
                                <select name="net" id="net" value={formData.net} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm p-2 h-[42px] focus:ring-indigo-500 focus:border-indigo-500">
                                    <option value="">Select Days</option>
                                    <option value="30">30 Days</option>
                                    <option value="45">45 Days</option>
                                    <option value="60">60 Days</option>
                                </select>
                            </div>
                        </div>
                    </div>
                    <div className="mt-6 flex justify-end">
                        <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-lg flex items-center justify-center w-48 h-12 disabled:bg-indigo-400" disabled={loading || success}>
                            {loading ? <Spinner size="6" /> : 'Generate & Send'}
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
};

export default CreateMSAandWOPage;