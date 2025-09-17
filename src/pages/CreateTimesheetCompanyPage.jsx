import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../api/apiService';
import Spinner from '../components/Spinner';
import { usePermissions } from '../hooks/usePermissions';

const CreateTimesheetCompanyPage = () => {
    const { user } = useAuth();
    const { canManageTimesheets } = usePermissions();

    const [formData, setFormData] = useState({
        companyName: '',
        companyEmail: '',
        companyAddress: '',
        contactPerson: '',
        contactPersonMail: '',
        companyMobileNumber: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleChange = (e) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!canManageTimesheets) {
            setError("You do not have permission to create timesheet companies.");
            return;
        }

        setError('');
        setSuccess('');
        setLoading(true);

        try {
            const response = await apiService.createCompany(formData, user.userIdentifier);
            if (response.data.success) {
                setSuccess(response.data.message);
                setFormData({
                    companyName: '', companyEmail: '', companyAddress: '',
                    contactPerson: '', contactPersonMail: '', companyMobileNumber: ''
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
                <h1 className="text-3xl font-bold text-gray-900">Create Timesheet Company</h1>
                <p className="mt-1 text-gray-600">Add details for a new client company for timesheet management.</p>
            </div>
            {!canManageTimesheets && !loading && (
                <div className="text-center text-gray-500 p-10 bg-white rounded-xl shadow-sm border">
                    <h3 className="text-lg font-medium">Access Denied</h3>
                    <p className="text-sm">You do not have permissions to create timesheet companies.</p>
                </div>
            )}
            {canManageTimesheets && (
                <form onSubmit={handleSubmit}>
                    <div className="bg-white p-6 md:p-8 rounded-xl shadow-sm border">
                        {error && <div className="bg-red-50 border-l-4 border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6">{error}</div>}
                        {success && <div className="bg-green-50 border-l-4 border-green-400 text-green-700 px-4 py-3 rounded-lg mb-6">{success}</div>}
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6">
                            <div>
                                <label htmlFor="companyName" className="block text-sm font-medium text-gray-700">Company Name <span className="text-red-500">*</span></label>
                                <input type="text" name="companyName" id="companyName" value={formData.companyName} onChange={handleChange} required className="form-input mt-1" />
                            </div>
                            <div>
                                <label htmlFor="companyEmail" className="block text-sm font-medium text-gray-700">Company Email <span className="text-red-500">*</span></label>
                                <input type="email" name="companyEmail" id="companyEmail" value={formData.companyEmail} onChange={handleChange} required className="form-input mt-1" />
                            </div>
                            <div className="md:col-span-2">
                                <label htmlFor="companyAddress" className="block text-sm font-medium text-gray-700">Company Address <span className="text-red-500">*</span></label>
                                <textarea name="companyAddress" id="companyAddress" value={formData.companyAddress} onChange={handleChange} required rows="3" className="form-input mt-1"></textarea>
                            </div>
                            <div>
                                <label htmlFor="contactPerson" className="block text-sm font-medium text-gray-700">Contact Person <span className="text-red-500">*</span></label>
                                <input type="text" name="contactPerson" id="contactPerson" value={formData.contactPerson} onChange={handleChange} required className="form-input mt-1" />
                            </div>
                            <div>
                                <label htmlFor="contactPersonMail" className="block text-sm font-medium text-gray-700">Contact Person Email <span className="text-red-500">*</span></label>
                                <input type="email" name="contactPersonMail" id="contactPersonMail" value={formData.contactPersonMail} onChange={handleChange} required className="form-input mt-1" />
                            </div>
                            <div>
                                <label htmlFor="companyMobileNumber" className="block text-sm font-medium text-gray-700">Company Mobile Number <span className="text-red-500">*</span></label>
                                <input type="tel" name="companyMobileNumber" id="companyMobileNumber" value={formData.companyMobileNumber} onChange={handleChange} required className="form-input mt-1" />
                            </div>
                        </div>
                    </div>
                    <div className="mt-6 flex justify-end">
                        <button type="submit" className="btn-primary w-48 h-12 disabled:opacity-50 flex items-center justify-center" disabled={loading || success}>
                            {loading ? <Spinner size="6" /> : 'Create Company'}
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
};

export default CreateTimesheetCompanyPage;