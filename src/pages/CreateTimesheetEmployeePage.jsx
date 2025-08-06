import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../api/apiService';
import Spinner from '../components/Spinner';
import { usePermissions } from '../hooks/usePermissions';

const CreateTimesheetEmployeePage = () => {
    const { user } = useAuth();
    const { canManageTimesheets } = usePermissions();

    const [formData, setFormData] = useState({
        employeeName: '',
        employeeId: '',
        employeeMail: '',
        companyName: '' // NEW: Add companyName to formData
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [companies, setCompanies] = useState([]); // NEW: State to store fetched companies

    // NEW: Fetch companies when the component mounts
    useEffect(() => {
        const fetchCompanies = async () => {
            if (!user?.userIdentifier || !canManageTimesheets) return;
            try {
                const response = await apiService.getCompanies(user.userIdentifier);
                if (response.data.success) {
                    setCompanies(response.data.companies.map(c => c.companyName));
                }
            } catch (err) {
                console.error("Failed to fetch companies:", err);
                setError("Failed to load companies for selection.");
            }
        };
        fetchCompanies();
    }, [user?.userIdentifier, canManageTimesheets]);

    const handleChange = (e) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!canManageTimesheets) {
            setError("You do not have permission to create timesheet employees.");
            return;
        }

        setError('');
        setSuccess('');
        setLoading(true);

        try {
            const response = await apiService.createTimesheetEmployee(formData, user.userIdentifier);
            if (response.data.success) {
                setSuccess(response.data.message);
                setFormData({ // Clear form on success
                    employeeName: '',
                    employeeId: '',
                    employeeMail: '',
                    companyName: '' // NEW: Clear companyName on success
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
                <h1 className="text-3xl font-bold text-gray-900">Create Timesheet Employee</h1>
                <p className="mt-1 text-gray-600">Add new employees specifically for timesheet tracking.</p>
            </div>
            {!canManageTimesheets && !loading && (
                <div className="text-center text-gray-500 p-10 bg-white rounded-xl shadow-sm border">
                    <h3 className="text-lg font-medium">Access Denied</h3>
                    <p className="text-sm">You do not have the necessary permissions to create timesheet employees.</p>
                </div>
            )}
            {canManageTimesheets && (
                <form onSubmit={handleSubmit}>
                    <div className="bg-white p-6 md:p-8 rounded-xl shadow-sm border">
                        {error && <div className="bg-red-50 border-l-4 border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6">{error}</div>}
                        {success && <div className="bg-green-50 border-l-4 border-green-400 text-green-700 px-4 py-3 rounded-lg mb-6">{success}</div>}
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6">
                            <div>
                                <label htmlFor="employeeName" className="block text-sm font-medium text-gray-700">Employee Name <span className="text-red-500">*</span></label>
                                <input type="text" name="employeeName" id="employeeName" value={formData.employeeName} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500" />
                            </div>
                            <div>
                                <label htmlFor="employeeId" className="block text-sm font-medium text-gray-700">Employee ID <span className="text-red-500">*</span></label>
                                <input type="text" name="employeeId" id="employeeId" value={formData.employeeId} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500" />
                            </div>
                            <div className="md:col-span-2">
                                <label htmlFor="employeeMail" className="block text-sm font-medium text-gray-700">Employee Email <span className="text-red-500">*</span></label>
                                <input type="email" name="employeeMail" id="employeeMail" value={formData.employeeMail} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500" />
                            </div>
                            {/* NEW: Company Name dropdown */}
                            <div className="md:col-span-2">
                                <label htmlFor="companyName" className="block text-sm font-medium text-gray-700">Company Name <span className="text-red-500">*</span></label>
                                <select name="companyName" id="companyName" value={formData.companyName} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm p-2 h-[42px] focus:ring-indigo-500 focus:border-indigo-500">
                                    <option value="">Select Company</option>
                                    {companies.map(comp => (
                                        <option key={comp} value={comp}>{comp}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>
                    <div className="mt-6 flex justify-end">
                        <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-lg flex items-center justify-center w-48 h-12 disabled:bg-indigo-400" disabled={loading || success}>
                            {loading ? <Spinner size="6" /> : 'Create Employee'}
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
};

export default CreateTimesheetEmployeePage;