import React, { useState, useEffect } from 'react';
import Modal from '../Modal'; // Assuming Modal.jsx is directly in components
import Spinner from '../Spinner';
import { useAuth } from '../../context/AuthContext';
import { apiService } from '../../api/apiService';
import { usePermissions } from '../../hooks/usePermissions';

const EditLoggedHoursModal = ({ isOpen, onClose, onSave, timesheetToEdit }) => {
    const { user } = useAuth();
    const { canManageTimesheets } = usePermissions();

    const [formData, setFormData] = useState({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

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

    useEffect(() => {
        if (isOpen && timesheetToEdit) {
            setFormData({
                employeeName: timesheetToEdit.employeeName || '',
                clientName: timesheetToEdit.clientName || '',
                month: timesheetToEdit.month || '',
                year: timesheetToEdit.year || '',
                loggedHoursPerMonth: timesheetToEdit.loggedHoursPerMonth || '',
                companyName: timesheetToEdit.companyName || '',
                employeeId: timesheetToEdit.employeeId || '',
                employeeMail: timesheetToEdit.employeeMail || '',
                // Pass PartitionKey and RowKey for the update API call
                PartitionKey: timesheetToEdit.PartitionKey || '',
                RowKey: timesheetToEdit.RowKey || ''
            });
            setError('');
            setSuccess('');
        }
    }, [isOpen, timesheetToEdit]);

    const handleChange = (e) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!canManageTimesheets) {
            setError("Permission denied. You do not have the necessary rights to edit logged hours.");
            return;
        }
        if (isNaN(formData.loggedHoursPerMonth) || parseFloat(formData.loggedHoursPerMonth) < 0) {
            setError("Logged hours must be a non-negative number.");
            return;
        }

        setError('');
        setSuccess('');
        setLoading(true);

        try {
            // Call the onSave prop, which will handle the API call in the parent component
            await onSave(formData);
            setSuccess("Logged hours updated successfully!");
            setTimeout(() => {
                onClose();
                setSuccess('');
            }, 1000);
        } catch (err) {
            setError(err.message || "Failed to save logged hours.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Edit Logged Hours" size="lg">
            {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}
            {success && <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">{success}</div>}
            
            {!canManageTimesheets && !loading && (
                <div className="text-center text-gray-500 p-4">
                    <h3 className="text-lg font-medium">Access Denied</h3>
                    <p className="text-sm">You do not have the necessary permissions to edit logged hours.</p>
                </div>
            )}

            {canManageTimesheets && timesheetToEdit && (
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6">
                        <div>
                            <label htmlFor="employeeName" className="block text-sm font-medium text-gray-700">Employee Name</label>
                            <input type="text" name="employeeName" id="employeeName" value={formData.employeeName || ''} readOnly className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm p-2 bg-gray-100" />
                        </div>
                        <div>
                            <label htmlFor="employeeId" className="block text-sm font-medium text-gray-700">Employee ID</label>
                            <input type="text" name="employeeId" id="employeeId" value={formData.employeeId || ''} readOnly className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm p-2 bg-gray-100" />
                        </div>
                        <div>
                            <label htmlFor="employeeMail" className="block text-sm font-medium text-gray-700">Employee Email</label>
                            <input type="email" name="employeeMail" id="employeeMail" value={formData.employeeMail || ''} readOnly className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm p-2 bg-gray-100" />
                        </div>
                        <div>
                            <label htmlFor="clientName" className="block text-sm font-medium text-gray-700">Client Name <span className="text-red-500">*</span></label>
                            <input type="text" name="clientName" id="clientName" value={formData.clientName || ''} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500" />
                        </div>
                        <div>
                            <label htmlFor="companyName" className="block text-sm font-medium text-gray-700">Company Name <span className="text-red-500">*</span></label>
                            <input type="text" name="companyName" id="companyName" value={formData.companyName || ''} readOnly className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm p-2 bg-gray-100" />
                        </div>
                        <div>
                            <label htmlFor="month" className="block text-sm font-medium text-gray-700">Month <span className="text-red-500">*</span></label>
                            <select name="month" id="month" value={formData.month || ''} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm p-2 h-[42px] focus:ring-indigo-500 focus:border-indigo-500">
                                <option value="">Select Month</option>
                                {months.map(m => (
                                    <option key={m.value} value={m.value}>{m.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="year" className="block text-sm font-medium text-gray-700">Year <span className="text-red-500">*</span></label>
                            <select name="year" id="year" value={formData.year || ''} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm p-2 h-[42px] focus:ring-indigo-500 focus:border-indigo-500">
                                <option value="">Select Year</option>
                                {years.map(y => (
                                    <option key={y} value={y}>{y}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="loggedHoursPerMonth" className="block text-sm font-medium text-gray-700">Logged Hours Per Month <span className="text-red-500">*</span></label>
                            <input type="number" name="loggedHoursPerMonth" id="loggedHoursPerMonth" value={formData.loggedHoursPerMonth || ''} onChange={handleChange} required min="0" step="0.5" className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500" />
                        </div>
                    </div>
                    
                    <div className="flex justify-end space-x-2 pt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Cancel</button>
                        <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 flex items-center justify-center w-28" disabled={loading}>
                            {loading ? <Spinner size="5" /> : 'Save'}
                        </button>
                    </div>
                </form>
            )}
        </Modal>
    );
};

export default EditLoggedHoursModal;