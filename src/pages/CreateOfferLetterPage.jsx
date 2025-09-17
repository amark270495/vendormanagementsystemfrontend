import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../api/apiService';
import Spinner from '../components/Spinner';
import { usePermissions } from '../hooks/usePermissions';

const CreateOfferLetterPage = () => {
    const { user } = useAuth();
    const { canManageOfferLetters } = usePermissions();

    const [formData, setFormData] = useState({
        employeeName: '',
        employeeEmail: '',
        jobTitle: '',
        startDate: '',
        clientName: '',
        vendorName: '',
        billingRate: '',
        term: 'per hour',
        workLocation: '',
        rolesResponsibilities: ''
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
                    employeeName: '', employeeEmail: '', jobTitle: '', startDate: '',
                    clientName: '', vendorName: '', billingRate: '', term: 'per hour',
                    workLocation: '', rolesResponsibilities: ''
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

    // Render access denied message if user lacks permission
    if (!canManageOfferLetters) {
        return (
            <div className="text-center text-gray-500 p-10 bg-white rounded-xl shadow-sm border">
                <h3 className="text-lg font-medium">Access Denied</h3>
                <p className="mt-1 text-sm">You do not have the necessary permissions to create or manage offer letters.</p>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="text-center">
                <h1 className="text-3xl font-bold text-gray-900">Create Employee Offer Letter</h1>
                <p className="mt-2 text-gray-600">Fill in the details below to generate a formal employment offer for a candidate.</p>
            </div>
            
            <form onSubmit={handleSubmit}>
                <div className="bg-white p-8 rounded-xl shadow-lg border">
                    {error && <div className="bg-red-50 border-l-4 border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6">{error}</div>}
                    {success && <div className="bg-green-50 border-l-4 border-green-400 text-green-700 px-4 py-3 rounded-lg mb-6">{success}</div>}
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6">
                        {/* Employee Details */}
                        <div className="md:col-span-2 font-semibold text-lg text-indigo-700 border-b pb-2 mb-2">Candidate Information</div>
                        <div>
                            <label htmlFor="employeeName" className="block text-sm font-medium text-gray-700">Employee Full Name <span className="text-red-500">*</span></label>
                            <input type="text" name="employeeName" id="employeeName" value={formData.employeeName} onChange={handleChange} required className="mt-1 input-field" />
                        </div>
                        <div>
                            <label htmlFor="employeeEmail" className="block text-sm font-medium text-gray-700">Employee Email <span className="text-red-500">*</span></label>
                            <input type="email" name="employeeEmail" id="employeeEmail" value={formData.employeeEmail} onChange={handleChange} required className="mt-1 input-field" />
                        </div>

                        {/* Position Details */}
                        <div className="md:col-span-2 font-semibold text-lg text-indigo-700 border-b pb-2 mb-2 mt-4">Position Details</div>
                        <div>
                            <label htmlFor="jobTitle" className="block text-sm font-medium text-gray-700">Job Title <span className="text-red-500">*</span></label>
                            <input type="text" name="jobTitle" id="jobTitle" value={formData.jobTitle} onChange={handleChange} required className="mt-1 input-field" />
                        </div>
                        <div>
                            <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">Tentative Start Date <span className="text-red-500">*</span></label>
                            <input type="date" name="startDate" id="startDate" value={formData.startDate} onChange={handleChange} required className="mt-1 input-field" />
                        </div>
                        <div>
                            <label htmlFor="clientName" className="block text-sm font-medium text-gray-700">Client Name <span className="text-red-500">*</span></label>
                            <input type="text" name="clientName" id="clientName" value={formData.clientName} onChange={handleChange} required className="mt-1 input-field" />
                        </div>
                         <div>
                            <label htmlFor="vendorName" className="block text-sm font-medium text-gray-700">Vendor Name (if applicable)</label>
                            <input type="text" name="vendorName" id="vendorName" value={formData.vendorName} onChange={handleChange} className="mt-1 input-field" />
                        </div>
                        <div>
                            <label htmlFor="workLocation" className="block text-sm font-medium text-gray-700">Work Location <span className="text-red-500">*</span></label>
                            <input type="text" name="workLocation" id="workLocation" value={formData.workLocation} onChange={handleChange} required className="mt-1 input-field" />
                        </div>

                        {/* Compensation */}
                        <div className="md:col-span-2 font-semibold text-lg text-indigo-700 border-b pb-2 mb-2 mt-4">Compensation</div>
                         <div>
                            <label htmlFor="billingRate" className="block text-sm font-medium text-gray-700">Billing Rate ($) <span className="text-red-500">*</span></label>
                            <input type="number" name="billingRate" id="billingRate" value={formData.billingRate} onChange={handleChange} required className="mt-1 input-field" placeholder="e.g., 75.50" />
                        </div>
                        <div>
                            <label htmlFor="term" className="block text-sm font-medium text-gray-700">Term <span className="text-red-500">*</span></label>
                            <select name="term" id="term" value={formData.term} onChange={handleChange} required className="mt-1 input-field h-[42px]">
                                <option value="per hour">Per Hour</option>
                                <option value="per day">Per Day</option>
                                <option value="per month">Per Month</option>
                                <option value="annually">Annually</option>
                            </select>
                        </div>
                        
                        {/* Roles & Responsibilities */}
                        <div className="md:col-span-2 font-semibold text-lg text-indigo-700 border-b pb-2 mb-2 mt-4">Roles & Responsibilities</div>
                        <div className="md:col-span-2">
                            <label htmlFor="rolesResponsibilities" className="block text-sm font-medium text-gray-700">Enter a brief description <span className="text-red-500">*</span></label>
                            <textarea name="rolesResponsibilities" id="rolesResponsibilities" value={formData.rolesResponsibilities} onChange={handleChange} required rows="6" className="mt-1 input-field" placeholder="Describe the key roles and responsibilities for this position..."></textarea>
                        </div>
                    </div>
                </div>
                <div className="mt-8 flex justify-end">
                    <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-lg flex items-center justify-center w-52 h-12 disabled:bg-indigo-400 shadow-md" disabled={loading || success}>
                        {loading ? <Spinner size="6" /> : 'Generate & Send Offer'}
                    </button>
                </div>
            </form>
             <style jsx>{`
                .input-field {
                    display: block;
                    width: 100%;
                    border: 1px solid #d1d5db; /* gray-300 */
                    border-radius: 0.5rem; /* rounded-lg */
                    box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05);
                    padding: 0.5rem 0.75rem;
                }
                .input-field:focus {
                    outline: 2px solid transparent;
                    outline-offset: 2px;
                    border-color: #6366f1; /* indigo-500 */
                    box-shadow: 0 0 0 2px #a5b4fc; /* indigo-300 */
                }
            `}</style>
        </div>
    );
};

export default CreateOfferLetterPage;