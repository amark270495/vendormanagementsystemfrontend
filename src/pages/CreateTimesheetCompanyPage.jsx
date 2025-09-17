import React, 'react';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../api/apiService';
import Spinner from '../components/Spinner';
import { usePermissions } from '../hooks/usePermissions';

const CreateTimesheetCompanyPage = ({ onNavigate }) => {
    const { user } = useAuth();
    const { canManageTimesheets } = usePermissions();

    const [formData, setFormData] = React.useState({
        companyName: '',
        companyEmail: '',
        companyAddress: '',
        contactPerson: '',
        contactPersonMail: '',
        companyMobileNumber: ''
    });
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState('');
    const [success, setSuccess] = React.useState('');

    const handleChange = (e) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!canManageTimesheets) {
            setError("You do not have permission to create companies.");
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
                    companyName: '',
                    companyEmail: '',
                    companyAddress: '',
                    contactPerson: '',
                    contactPersonMail: '',
                    companyMobileNumber: ''
                });
                setTimeout(() => {
                    setSuccess('');
                    if (onNavigate) {
                        onNavigate('manage_companies');
                    }
                }, 2000);
            } else {
                setError(response.data.message);
            }
        } catch (err) {
            setError(err.response?.data?.message || "An unexpected error occurred.");
        } finally {
            setLoading(false);
        }
    };

    if (!canManageTimesheets) {
        return (
            <div className="text-center text-gray-500 p-10 bg-white rounded-xl shadow-sm border">
                <h3 className="text-lg font-medium">Access Denied</h3>
                <p className="mt-1 text-sm">You do not have the necessary permissions to create timesheet companies.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Create Timesheet Company</h1>
                <p className="mt-1 text-gray-600">Add a new company for timesheet management purposes.</p>
            </div>
            
            <form onSubmit={handleSubmit}>
                <div className="bg-white p-6 md:p-8 rounded-xl shadow-sm border">
                    {error && <div className="bg-red-50 border-l-4 border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6">{error}</div>}
                    {success && <div className="bg-green-50 border-l-4 border-green-400 text-green-700 px-4 py-3 rounded-lg mb-6">{success}</div>}
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6">
                        <div>
                            <label htmlFor="companyName" className="block text-sm font-medium text-gray-700">Company Name <span className="text-red-500">*</span></label>
                            <input type="text" name="companyName" id="companyName" value={formData.companyName} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm p-2.5 focus:ring-indigo-500 focus:border-indigo-500" />
                        </div>
                        <div>
                            <label htmlFor="companyEmail" className="block text-sm font-medium text-gray-700">Company Email <span className="text-red-500">*</span></label>
                            <input type="email" name="companyEmail" id="companyEmail" value={formData.companyEmail} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm p-2.5 focus:ring-indigo-500 focus:border-indigo-500" />
                        </div>
                        <div className="md:col-span-2">
                            <label htmlFor="companyAddress" className="block text-sm font-medium text-gray-700">Company Address <span className="text-red-500">*</span></label>
                            <textarea name="companyAddress" id="companyAddress" value={formData.companyAddress} onChange={handleChange} required rows="3" className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm p-2.5 focus:ring-indigo-500 focus:border-indigo-500"></textarea>
                        </div>
                        <div>
                            <label htmlFor="contactPerson" className="block text-sm font-medium text-gray-700">Contact Person <span className="text-red-500">*</span></label>
                            <input type="text" name="contactPerson" id="contactPerson" value={formData.contactPerson} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm p-2.5 focus:ring-indigo-500 focus:border-indigo-500" />
                        </div>
                        <div>
                            <label htmlFor="contactPersonMail" className="block text-sm font-medium text-gray-700">Contact Person Email <span className="text-red-500">*</span></label>
                            <input type="email" name="contactPersonMail" id="contactPersonMail" value={formData.contactPersonMail} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm p-2.5 focus:ring-indigo-500 focus:border-indigo-500" />
                        </div>
                        <div className="md:col-span-2">
                            <label htmlFor="companyMobileNumber" className="block text-sm font-medium text-gray-700">Company Mobile Number <span className="text-red-500">*</span></label>
                            <input type="tel" name="companyMobileNumber" id="companyMobileNumber" value={formData.companyMobileNumber} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm p-2.5 focus:ring-indigo-500 focus:border-indigo-500" />
                        </div>
                    </div>
                </div>
                <div className="mt-6 flex justify-end">
                    <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-lg flex items-center justify-center w-48 h-12 disabled:bg-indigo-400" disabled={loading || success}>
                        {loading ? <Spinner size="6" /> : 'Create Company'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default CreateTimesheetCompanyPage;