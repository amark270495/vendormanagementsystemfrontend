import React, { useState, useEffect } from 'react';
import Modal from '../Modal'; // Assuming Modal.jsx is directly in components
import Spinner from '../Spinner';
import { useAuth } from '../../context/AuthContext';
import { apiService } from '../../api/apiService';
import { usePermissions } from '../../hooks/usePermissions';

const RequestTimesheetApprovalForEmployeeModal = ({ isOpen, onClose, timesheetEmployee }) => {
    const { user } = useAuth();
    const { canRequestTimesheetApproval } = usePermissions();

    const [month, setMonth] = useState('');
    const [year, setYear] = useState(new Date().getFullYear().toString());
    const [deadlineDate, setDeadlineDate] = useState('');
    // const [companyName, setCompanyName] = useState(''); // REMOVED: No longer needed
    // const [companies, setCompanies] = useState([]); // REMOVED: No longer needed

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const monthsOptions = [
        { value: '01', name: 'January' }, { value: '02', name: 'February' },
        { value: '03', name: 'March' }, { value: '04', name: 'April' },
        { value: '05', name: 'May' }, { value: '06', name: 'June' },
        { value: '07', name: 'July' }, { value: '08', name: 'August' },
        { value: '09', name: 'September' }, { value: '10', name: 'October' },
        { value: '11', name: 'November' }, { value: '12', name: 'December' }
    ];
    const currentYear = new Date().getFullYear();
    const yearsOptions = Array.from({ length: 5 }, (_, i) => (currentYear - 2 + i).toString());

    useEffect(() => {
        if (isOpen) {
            // Reset form fields when modal opens
            setMonth('');
            setDeadlineDate('');
            // setCompanyName(''); // REMOVED
            setError('');
            setSuccess('');
        }
    }, [isOpen]); // Removed user?.userIdentifier, canRequestTimesheetApproval from dependencies as companies are not fetched here

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!canRequestTimesheetApproval) {
            setError("You do not have permission to request timesheet approvals.");
            return;
        }
        if (!month || !year || !deadlineDate) { // Removed companyName from validation
            setError("Please fill in all required fields (Month, Year, Deadline Date).");
            return;
        }

        setError('');
        setSuccess('');
        setLoading(true);

        try {
            const response = await apiService.sendTimesheetApprovalRequest(
                timesheetEmployee.employeeMail,
                timesheetEmployee.employeeName,
                month,
                year,
                deadlineDate,
                timesheetEmployee.companyName, // Use companyName directly from timesheetEmployee
                user.userIdentifier
            );
            if (response.data.success) {
                setSuccess(response.data.message);
                setTimeout(() => {
                    onClose();
                    setSuccess('');
                }, 2000);
            } else {
                setError(response.data.message);
            }
        } catch (err) {
            setError(err.response?.data?.message || "Failed to send approval request.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Request Timesheet Approval" size="md">
            {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}
            {success && <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">{success}</div>}
            
            {!canRequestTimesheetApproval && !loading && (
                <div className="text-center text-gray-500 p-4">
                    <h3 className="text-lg font-medium">Access Denied</h3>
                    <p className="text-sm">You do not have the necessary permissions to request timesheet approvals.</p>
                </div>
            )}

            {canRequestTimesheetApproval && timesheetEmployee && (
                <form onSubmit={handleSubmit} className="space-y-4">
                    <p className="text-gray-700">
                        Request timesheet approval for **{timesheetEmployee.employeeName}** (Email: **{timesheetEmployee.employeeMail}**) for company **{timesheetEmployee.companyName}**.
                    </p>
                    <div>
                        <label htmlFor="month" className="block text-sm font-medium text-gray-700">Month <span className="text-red-500">*</span></label>
                        <select name="month" id="month" value={month} onChange={(e) => setMonth(e.target.value)} required className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm p-2 h-[42px] focus:ring-indigo-500 focus:border-indigo-500" disabled={loading}>
                            <option value="">Select Month</option>
                            {monthsOptions.map(m => (
                                <option key={m.value} value={m.value}>{m.name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="year" className="block text-sm font-medium text-gray-700">Year <span className="text-red-500">*</span></label>
                        <select name="year" id="year" value={year} onChange={(e) => setYear(e.target.value)} required className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm p-2 h-[42px] focus:ring-indigo-500 focus:border-indigo-500" disabled={loading}>
                            <option value="">Select Year</option>
                            {yearsOptions.map(y => (
                                <option key={y} value={y}>{y}</option>
                            ))}
                        </select>
                    </div>
                    {/* REMOVED: Company Name dropdown as it's now auto-filled */}
                    {/* <div>
                        <label htmlFor="companyName" className="block text-sm font-medium text-gray-700">Company Name <span className="text-red-500">*</span></label>
                        <select name="companyName" id="companyName" value={companyName} onChange={(e) => setCompanyName(e.target.value)} required className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm p-2 h-[42px] focus:ring-indigo-500 focus:border-indigo-500" disabled={loading}>
                            <option value="">Select Company</option>
                            {companies.map(comp => (
                                <option key={comp} value={comp}>{comp}</option>
                            ))}
                        </select>
                    </div> */}
                    <div>
                        <label htmlFor="deadlineDate" className="block text-sm font-medium text-gray-700">Deadline Date to Share <span className="text-red-500">*</span></label>
                        <input
                            type="date"
                            name="deadlineDate"
                            id="deadlineDate"
                            value={deadlineDate}
                            onChange={(e) => setDeadlineDate(e.target.value)}
                            required
                            className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
                            disabled={loading}
                        />
                    </div>
                    
                    <div className="flex justify-end space-x-2 pt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Cancel</button>
                        <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 flex items-center justify-center w-48" disabled={loading}>
                            {loading ? <Spinner size="5" /> : 'Send Request Email'}
                        </button>
                    </div>
                </form>
            )}
        </Modal>
    );
};

export default RequestTimesheetApprovalForEmployeeModal;