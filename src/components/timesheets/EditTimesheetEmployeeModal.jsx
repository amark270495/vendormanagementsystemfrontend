import React, { useState, useEffect } from 'react';
import Modal from '../Modal'; // Assuming Modal.jsx is directly in components
import Spinner from '../Spinner';
import { useAuth } from '../../context/AuthContext';
import { apiService } from '../../api/apiService';
import { usePermissions } from '../../hooks/usePermissions';

const EditTimesheetEmployeeModal = ({ isOpen, onClose, onSave, employeeToEdit }) => {
    const { user } = useAuth();
    const { canManageTimesheets } = usePermissions();

    const [formData, setFormData] = useState({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        if (isOpen && employeeToEdit) {
            setFormData({
                employeeName: employeeToEdit.employeeName || '',
                employeeId: employeeToEdit.employeeId || '', // Employee ID is usually immutable, but can be displayed
                employeeMail: employeeToEdit.employeeMail || ''
            });
            setError('');
            setSuccess('');
        }
    }, [isOpen, employeeToEdit]);

    const handleChange = (e) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!canManageTimesheets) {
            setError("Permission denied. You do not have the necessary rights to edit timesheet employee details.");
            return;
        }

        setError('');
        setSuccess('');
        setLoading(true);

        try {
            // Call the onSave prop, which will handle the API call in the parent component
            await onSave(formData);
            setSuccess("Employee updated successfully!");
            setTimeout(() => {
                onClose();
                setSuccess('');
            }, 1000);
        } catch (err) {
            setError(err.message || "Failed to save employee details.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Edit Timesheet Employee" size="md">
            {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}
            {success && <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">{success}</div>}
            
            {!canManageTimesheets && !loading && (
                <div className="text-center text-gray-500 p-4">
                    <h3 className="text-lg font-medium">Access Denied</h3>
                    <p className="text-sm">You do not have the necessary permissions to edit timesheet employee details.</p>
                </div>
            )}

            {canManageTimesheets && employeeToEdit && (
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="employeeName" className="block text-sm font-medium text-gray-700">Employee Name <span className="text-red-500">*</span></label>
                        <input type="text" name="employeeName" id="employeeName" value={formData.employeeName || ''} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500" />
                    </div>
                    <div>
                        <label htmlFor="employeeId" className="block text-sm font-medium text-gray-700">Employee ID</label>
                        <input type="text" name="employeeId" id="employeeId" value={formData.employeeId || ''} readOnly className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm p-2 bg-gray-100" />
                    </div>
                    <div>
                        <label htmlFor="employeeMail" className="block text-sm font-medium text-gray-700">Employee Email <span className="text-red-500">*</span></label>
                        <input type="email" name="employeeMail" id="employeeMail" value={formData.employeeMail || ''} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500" />
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

export default EditTimesheetEmployeeModal;