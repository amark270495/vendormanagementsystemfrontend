import React, { useState, useEffect } from 'react';
import Modal from '../Modal'; // Assuming Modal.jsx is directly in components
import Spinner from '../Spinner';
import { useAuth } from '../../context/AuthContext';
import { apiService } from '../../api/apiService';
import { usePermissions } from '../../hooks/usePermissions';

const BulkTimesheetApprovalRequestModal = ({ isOpen, onClose, onSave, selectedEmployeeIds }) => {
    const { user } = useAuth();
    const { canRequestTimesheetApproval } = usePermissions();

    const [month, setMonth] = useState('');
    const [year, setYear] = useState(new Date().getFullYear().toString());
    const [deadlineDate, setDeadlineDate] = useState('');
    const [companyName, setCompanyName] = useState('');
    const [companies, setCompanies] = useState([]); // State to store fetched companies

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

    // Fetch companies when modal opens
    useEffect(() => {
        const fetchCompanies = async () => {
            if (!user?.userIdentifier || !canRequestTimesheetApproval) return;
            try {
                const response = await apiService.getCompanies(user.userIdentifier);
                if (response.data.success) {
                    setCompanies(response.data.companies.map(c => c.companyName));
                }
            } catch (err) {
                console.error("Failed to fetch companies for modal:", err);
                setError("Failed to load companies for selection.");
            }
        };
        if (isOpen) {
            fetchCompanies();
            // Reset form fields when modal opens
            setMonth('');
            setDeadlineDate('');
            setCompanyName(''); // Reset company name too
            setError('');
            setSuccess('');
        }
    }, [isOpen, user?.userIdentifier, canRequestTimesheetApproval]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!canRequestTimesheetApproval) {
            setError("You do not have permission to send bulk timesheet approvals.");
            return;
        }
        if (!month || !year || !deadlineDate || !companyName) {
            setError("Please fill in all required fields (Month, Year, Deadline Date, Company Name).");
            return;
        }
        if (selectedEmployeeIds.length === 0) {
            setError("No employees selected for bulk request.");
            return;
        }

        setError('');
        setSuccess('');
        setLoading(true);

        try {
            await onSave({ month, year, deadlineDate, companyName }); // Pass data to parent's onSave
            setSuccess("Bulk request sent successfully!");
            setTimeout(() => {
                onClose();
                setSuccess('');
            }, 2000);
        } catch (err) {
            setError(err.message || "Failed to send bulk approval request.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Send Bulk Timesheet Request" size="md">
            {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}
            {success && <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">{success}</div>}
            
            {!canRequestTimesheetApproval && !loading && (
                <div className="text-center text-gray-500 p-4">
                    <h3 className="text-lg font-medium">Access Denied</h3>
                    <p className="text-sm">You do not have the necessary permissions to send bulk timesheet requests.</p>
                </div>
            )}

            {canRequestTimesheetApproval && (
                <form onSubmit={handleSubmit} className="space-y-4">
                    <p className="text-gray-700">
                        Sending request to **{selectedEmployeeIds.length}** selected employee(s).
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
                    <div>
                        <label htmlFor="companyName" className="block text-sm font-medium text-gray-700">Company Name <span className="text-red-500">*</span></label>
                        <select name="companyName" id="companyName" value={companyName} onChange={(e) => setCompanyName(e.target.value)} required className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm p-2 h-[42px] focus:ring-indigo-500 focus:border-indigo-500" disabled={loading}>
                            <option value="">Select Company</option>
                            {companies.map(comp => (
                                <option key={comp} value={comp}>{comp}</option>
                            ))}
                        </select>
                    </div>
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
                            {loading ? <Spinner size="5" /> : 'Send Bulk Request'}
                        </button>
                    </div>
                </form>
            )}
        </Modal>
    );
};

export default BulkTimesheetApprovalRequestModal;