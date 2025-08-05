import React, { useState, useEffect } from 'react';
import Modal from '../Modal'; // Assuming Modal.jsx is directly in components
import Spinner from '../Spinner';
import { useAuth } from '../../context/AuthContext';
import { apiService } from '../../api/apiService';
import { usePermissions } from '../../hooks/usePermissions';

const EditCompanyModal = ({ isOpen, onClose, onSave, companyToEdit }) => {
    const { user } = useAuth();
    const { canManageTimesheets } = usePermissions();

    const [formData, setFormData] = useState({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        if (isOpen && companyToEdit) {
            setFormData({
                companyName: companyToEdit.companyName || '',
                companyEmail: companyToEdit.companyEmail || '',
                companyAddress: companyToEdit.companyAddress || '',
                contactPerson: companyToEdit.contactPerson || '',
                contactPersonMail: companyToEdit.contactPersonMail || '',
                companyMobileNumber: companyToEdit.companyMobileNumber || ''
            });
            setError('');
            setSuccess('');
        }
    }, [isOpen, companyToEdit]);

    const handleChange = (e) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!canManageTimesheets) {
            setError("Permission denied. You do not have the necessary rights to edit company details.");
            return;
        }

        setError('');
        setSuccess('');
        setLoading(true);

        try {
            // Call the onSave prop, which will handle the API call in the parent component
            await onSave(formData);
            setSuccess("Company updated successfully!");
            setTimeout(() => {
                onClose();
                setSuccess('');
            }, 1000);
        } catch (err) {
            setError(err.message || "Failed to save company details.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Edit Company Details" size="lg">
            {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}
            {success && <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">{success}</div>}
            
            {!canManageTimesheets && !loading && (
                <div className="text-center text-gray-500 p-4">
                    <h3 className="text-lg font-medium">Access Denied</h3>
                    <p className="text-sm">You do not have the necessary permissions to edit company details.</p>
                </div>
            )}

            {canManageTimesheets && companyToEdit && (
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="companyName" className="block text-sm font-medium text-gray-700">Company Name</label>
                        <input type="text" name="companyName" id="companyName" value={formData.companyName || ''} readOnly className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm p-2 bg-gray-100" />
                    </div>
                    <div>
                        <label htmlFor="companyEmail" className="block text-sm font-medium text-gray-700">Company Email <span className="text-red-500">*</span></label>
                        <input type="email" name="companyEmail" id="companyEmail" value={formData.companyEmail || ''} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500" />
                    </div>
                    <div className="md:col-span-2">
                        <label htmlFor="companyAddress" className="block text-sm font-medium text-gray-700">Company Address <span className="text-red-500">*</span></label>
                        <textarea name="companyAddress" id="companyAddress" value={formData.companyAddress || ''} onChange={handleChange} required rows="3" className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"></textarea>
                    </div>
                    <div>
                        <label htmlFor="contactPerson" className="block text-sm font-medium text-gray-700">Contact Person <span className="text-red-500">*</span></label>
                        <input type="text" name="contactPerson" id="contactPerson" value={formData.contactPerson || ''} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500" />
                    </div>
                    <div>
                        <label htmlFor="contactPersonMail" className="block text-sm font-medium text-gray-700">Contact Person Email <span className="text-red-500">*</span></label>
                        <input type="email" name="contactPersonMail" id="contactPersonMail" value={formData.contactPersonMail || ''} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500" />
                    </div>
                    <div>
                        <label htmlFor="companyMobileNumber" className="block text-sm font-medium text-gray-700">Company Mobile Number <span className="text-red-500">*</span></label>
                        <input type="tel" name="companyMobileNumber" id="companyMobileNumber" value={formData.companyMobileNumber || ''} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500" />
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

export default EditCompanyModal;