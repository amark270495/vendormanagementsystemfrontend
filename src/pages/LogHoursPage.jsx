import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../api/apiService';
import Spinner from '../components/Spinner';
import { usePermissions } from '../hooks/usePermissions';

const LogHoursPage = () => {
    const { user } = useAuth();
    const { canManageTimesheets } = usePermissions();

    const [formData, setFormData] = useState({
        employeeName: '',
        clientName: '',
        month: '',
        year: new Date().getFullYear().toString(),
        loggedHoursPerMonth: '',
        companyName: '',
        employeeId: '',
        employeeMail: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [timesheetEmployees, setTimesheetEmployees] = useState([]); // Changed from 'employees' to 'timesheetEmployees'
    const [companies, setCompanies] = useState([]);

    const months = [
        { value: '01', name: 'January' }, { value: '02', name: 'February' },
        { value: '03', name: 'March' }, { value: '04', name: 'April' },
        { value: '05', name: 'May' }, { value: '06', name: 'June' },
        { value: '07', name: 'July' }, { value: '08', name: 'August' },
        { value: '09', name: 'September' }, { value: '10', name: 'October' },
        { value: '11', name: 'November' }, { value: '12', name: 'December' }
    ];

    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 5 }, (_, i) => (currentYear - 2 + i).toString()); // Current year +/- 2

    const fetchDropdownData = useCallback(async () => {
        if (!user?.userIdentifier || !canManageTimesheets) return;
        
        try {
            // Fetch timesheet-specific employees
            const employeesResponse = await apiService.getTimesheetEmployees(user.userIdentifier); // Using new API
            if (employeesResponse.data.success) {
                setTimesheetEmployees(employeesResponse.data.employees);
            }

            // Fetch companies
            const companiesResponse = await apiService.getCompanies(user.userIdentifier);
            if (companiesResponse.data.success) {
                setCompanies(companiesResponse.data.companies.map(c => c.companyName));
            }

        } catch (err) {
            console.error("Failed to fetch dropdown data:", err);
            setError("Failed to load necessary data for dropdowns.");
        }
    }, [user?.userIdentifier, canManageTimesheets]);

    useEffect(() => {
        fetchDropdownData();
    }, [fetchDropdownData]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));

        // If employeeName changes, try to pre-fill employeeId and employeeMail
        if (name === 'employeeName') {
            const selectedEmployee = timesheetEmployees.find(emp => emp.employeeName === value); // Use timesheetEmployees
            if (selectedEmployee) {
                setFormData(prev => ({
                    ...prev,
                    employeeId: selectedEmployee.employeeId,
                    employeeMail: selectedEmployee.employeeMail
                }));
            } else {
                setFormData(prev => ({
                    ...prev,
                    employeeId: '',
                    employeeMail: ''
                }));
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!canManageTimesheets) {
            setError("You do not have permission to log hours.");
            return;
        }

        setError('');
        setSuccess('');
        setLoading(true);

        try {
            const response = await apiService.saveEmployeeLogHours(formData, user.userIdentifier);
            if (response.data.success) {
                setSuccess(response.data.message);
                setFormData(prev => ({ // Clear hours and client, keep employee/month/year for quick re-entry
                    ...prev,
                    clientName: '',
                    loggedHoursPerMonth: ''
                }));
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
                <h1 className="text-3xl font-bold text-gray-900">Log Employee Hours</h1>
                <p className="mt-1 text-gray-600">Record monthly hours for employees.</p>
            </div>
            {!canManageTimesheets && !loading && (
                <div className="text-center text-gray-500 p-10 bg-white rounded-xl shadow-sm border">
                    <h3 className="text-lg font-medium">Access Denied</h3>
                    <p className="text-sm">You do not have the necessary permissions to log employee hours.</p>
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
                                <select name="employeeName" id="employeeName" value={formData.employeeName} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm p-2 h-[42px] focus:ring-indigo-500 focus:border-indigo-500">
                                    <option value="">Select Employee</option>
                                    {timesheetEmployees.map(emp => (
                                        <option key={emp.employeeId} value={emp.employeeName}>{emp.employeeName}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label htmlFor="employeeId" className="block text-sm font-medium text-gray-700">Employee ID</label>
                                <input type="text" name="employeeId" id="employeeId" value={formData.employeeId} readOnly className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm p-2 bg-gray-100" />
                            </div>
                            <div>
                                <label htmlFor="employeeMail" className="block text-sm font-medium text-gray-700">Employee Email</label>
                                <input type="email" name="employeeMail" id="employeeMail" value={formData.employeeMail} readOnly className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm p-2 bg-gray-100" />
                            </div>
                            <div>
                                <label htmlFor="clientName" className="block text-sm font-medium text-gray-700">Client Name <span className="text-red-500">*</span></label>
                                <input type="text" name="clientName" id="clientName" value={formData.clientName} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500" />
                            </div>
                            <div>
                                <label htmlFor="companyName" className="block text-sm font-medium text-gray-700">Company Name <span className="text-red-500">*</span></label>
                                <select name="companyName" id="companyName" value={formData.companyName} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm p-2 h-[42px] focus:ring-indigo-500 focus:border-indigo-500">
                                    <option value="">Select Company</option>
                                    {companies.map(comp => (
                                        <option key={comp} value={comp}>{comp}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label htmlFor="month" className="block text-sm font-medium text-gray-700">Month <span className="text-red-500">*</span></label>
                                <select name="month" id="month" value={formData.month} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm p-2 h-[42px] focus:ring-indigo-500 focus:border-indigo-500">
                                    <option value="">Select Month</option>
                                    {months.map(m => (
                                        <option key={m.value} value={m.value}>{m.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label htmlFor="year" className="block text-sm font-medium text-gray-700">Year <span className="text-red-500">*</span></label>
                                <select name="year" id="year" value={formData.year} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm p-2 h-[42px] focus:ring-indigo-500 focus:border-indigo-500">
                                    <option value="">Select Year</option>
                                    {years.map(y => (
                                        <option key={y} value={y}>{y}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label htmlFor="loggedHoursPerMonth" className="block text-sm font-medium text-gray-700">Logged Hours Per Month <span className="text-red-500">*</span></label>
                                <input type="number" name="loggedHoursPerMonth" id="loggedHoursPerMonth" value={formData.loggedHoursPerMonth} onChange={handleChange} required min="0" step="0.5" className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500" />
                            </div>
                        </div>
                    </div>
                    <div className="mt-6 flex justify-end">
                        <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-lg flex items-center justify-center w-48 h-12 disabled:bg-indigo-400" disabled={loading || success}>
                            {loading ? <Spinner size="6" /> : 'Save Hours'}
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
};

export default LogHoursPage;