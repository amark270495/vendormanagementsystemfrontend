import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../api/apiService';
import Spinner from '../components/Spinner';
import { usePermissions } from '../hooks/usePermissions';

const CreateOfferLetterPage = () => {
    const { user } = useAuth();
    const { canManageOfferLetters } = usePermissions();

    const [formData, setFormData] = useState({
        employeeName: '',
        jobTitle: '',
        startDate: '',
        offerAcceptanceDate: '',
        clientName: '',
        vendorName: '',
        billingRate: '',
        term: 'per hour',
        workLocation: '',
        rolesResponsibilities: '',
        employeeEmail: ''
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleChange = (e) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!canManageOfferLetters) {
            setError("You do not have permission to create offer letters.");
            return;
        }

        setError('');
        setSuccess('');
        setLoading(true);

        try {
            const response = await apiService.createOfferLetter(formData, user.userIdentifier);
            if (response.data.success) {
                setSuccess(response.data.message);
                // Clear form on success
                setFormData({
                    employeeName: '',
                    jobTitle: '',
                    startDate: '',
                    offerAcceptanceDate: '',
                    clientName: '',
                    vendorName: '',
                    billingRate: '',
                    term: 'per hour',
                    workLocation: '',
                    rolesResponsibilities: '',
                    employeeEmail: ''
                });
                setTimeout(() => setSuccess(''), 4000);
            } else {
                setError(response.data.message);
            }
        } catch (err) {
            setError(err.response?.data?.message || "An unexpected error occurred while creating the offer letter.");
        } finally {
            setLoading(false);
        }
    };
    
    if (!canManageOfferLetters) {
        return (
            <div className="text-center text-gray-500 p-10 bg-white rounded-xl shadow-sm border">
                <h3 className="text-lg font-medium">Access Denied</h3>
                <p className="mt-1 text-sm">You do not have the necessary permissions to create offer letters.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                 <div>
                    <h1 className="text-3xl font-bold text-gray-900">Create Offer Letter</h1>
                    <p className="mt-1 text-gray-600">Fill out the details below to generate and send a new employment offer letter.</p>
                </div>
            </div>
            
            <form onSubmit={handleSubmit}>
                <div className="bg-white p-6 md:p-8 rounded-xl shadow-sm border">
                    {error && <div className="bg-red-50 border-l-4 border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6">{error}</div>}
                    {success && <div className="bg-green-50 border-l-4 border-green-400 text-green-700 px-4 py-3 rounded-lg mb-6">{success}</div>}
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6">
                        
                        <div className="md:col-span-2">
                            <label htmlFor="employeeName" className="block text-sm font-medium text-gray-700">Employee Full Name <span className="text-red-500">*</span></label>
                            <input type="text" name="employeeName" id="employeeName" value={formData.employeeName} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500" />
                        </div>

                        <div>
                            <label htmlFor="employeeEmail" className="block text-sm font-medium text-gray-700">Employee Email <span className="text-red-500">*</span></label>
                            <input type="email" name="employeeEmail" id="employeeEmail" value={formData.employeeEmail} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500" />
                        </div>

                         <div>
                            <label htmlFor="jobTitle" className="block text-sm font-medium text-gray-700">Job Title <span className="text-red-500">*</span></label>
                            <input type="text" name="jobTitle" id="jobTitle" value={formData.jobTitle} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500" />
                        </div>
                        
                        <div>
                            <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">Start Date <span className="text-red-500">*</span></label>
                            <input type="date" name="startDate" id="startDate" value={formData.startDate} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500" />
                        </div>

                        <div>
                            <label htmlFor="offerAcceptanceDate" className="block text-sm font-medium text-gray-700">Offer Acceptance Deadline <span className="text-red-500">*</span></label>
                            <input type="date" name="offerAcceptanceDate" id="offerAcceptanceDate" value={formData.offerAcceptanceDate} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500" />
                        </div>

                        <div>
                            <label htmlFor="clientName" className="block text-sm font-medium text-gray-700">Client Name <span className="text-red-500">*</span></label>
                            <input type="text" name="clientName" id="clientName" value={formData.clientName} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500" />
                        </div>

                        <div>
                            <label htmlFor="vendorName" className="block text-sm font-medium text-gray-700">Vendor Name <span className="text-red-500">*</span></label>
                            <input type="text" name="vendorName" id="vendorName" value={formData.vendorName} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500" />
                        </div>

                        <div>
                            <label htmlFor="billingRate" className="block text-sm font-medium text-gray-700">Billing Rate ($) <span className="text-red-500">*</span></label>
                            <input type="number" name="billingRate" id="billingRate" value={formData.billingRate} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500" />
                        </div>

                        <div>
                            <label htmlFor="term" className="block text-sm font-medium text-gray-700">Term <span className="text-red-500">*</span></label>
                            <select name="term" id="term" value={formData.term} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm p-2 h-[42px] focus:ring-indigo-500 focus:border-indigo-500">
                                <option value="per hour">Per Hour</option>
                                <option value="per day">Per Day</option>
                                <option value="per month">Per Month</option>
                                <option value="annually">Annually</option>
                            </select>
                        </div>

                        <div className="md:col-span-2">
                            <label htmlFor="workLocation" className="block text-sm font-medium text-gray-700">Work Location <span className="text-red-500">*</span></label>
                            <input type="text" name="workLocation" id="workLocation" value={formData.workLocation} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500" />
                        </div>

                        <div className="md:col-span-2">
                            <label htmlFor="rolesResponsibilities" className="block text-sm font-medium text-gray-700">Roles & Responsibilities <span className="text-red-500">*</span></label>
                            <textarea name="rolesResponsibilities" id="rolesResponsibilities" value={formData.rolesResponsibilities} onChange={handleChange} required rows="6" className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"></textarea>
                        </div>
                    </div>
                </div>
                <div className="mt-6 flex justify-end">
                    <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-lg flex items-center justify-center w-52 h-12 disabled:bg-indigo-400" disabled={loading || success}>
                        {loading ? <Spinner size="6" /> : 'Generate & Send Offer'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default CreateOfferLetterPage;