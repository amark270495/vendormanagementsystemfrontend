import React, { useState, useEffect } from 'react';
import Modal from '../Modal';
import Spinner from '../Spinner';
import { usePermissions } from '../../hooks/usePermissions';

const EditOfferLetterModal = ({ isOpen, onClose, onSave, letterToEdit }) => {
    const { canManageOfferLetters } = usePermissions();
    const [formData, setFormData] = useState({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen && letterToEdit) {
            // Format dates for the date input fields
            const formatDateForInput = (dateString) => {
                if (!dateString) return '';
                try {
                    return new Date(dateString).toISOString().split('T')[0];
                } catch (e) {
                    return '';
                }
            };

            setFormData({
                ...letterToEdit,
                startDate: formatDateForInput(letterToEdit.startDate),
                offerAcceptanceDate: formatDateForInput(letterToEdit.offerAcceptanceDate)
            });
            setError('');
        }
    }, [isOpen, letterToEdit]);

    const handleChange = (e) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!canManageOfferLetters) {
            setError("You do not have permission to edit this document.");
            return;
        }
        setError('');
        setLoading(true);
        try {
            await onSave(formData);
            onClose();
        } catch (err) {
            setError(err.message || "Failed to save changes.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Edit Offer for ${formData.employeeName}`} size="2xl">
            {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}
            
            {canManageOfferLetters && (
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                        
                        <div className="md:col-span-2">
                             <label htmlFor="employeeName" className="block text-sm font-medium text-gray-700">Employee Full Name</label>
                            <input type="text" name="employeeName" value={formData.employeeName || ''} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-lg p-2" />
                        </div>
                        <div>
                            <label htmlFor="employeeEmail" className="block text-sm font-medium text-gray-700">Employee Email</label>
                            <input type="email" name="employeeEmail" value={formData.employeeEmail || ''} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-lg p-2" />
                        </div>
                         <div>
                            <label htmlFor="jobTitle" className="block text-sm font-medium text-gray-700">Job Title</label>
                            <input type="text" name="jobTitle" value={formData.jobTitle || ''} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-lg p-2" />
                        </div>
                        <div>
                            <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">Start Date</label>
                            <input type="date" name="startDate" value={formData.startDate || ''} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-lg p-2" />
                        </div>
                        <div>
                            <label htmlFor="offerAcceptanceDate" className="block text-sm font-medium text-gray-700">Offer Acceptance Deadline</label>
                            <input type="date" name="offerAcceptanceDate" value={formData.offerAcceptanceDate || ''} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-lg p-2" />
                        </div>
                        <div>
                            <label htmlFor="clientName" className="block text-sm font-medium text-gray-700">Client Name</label>
                            <input type="text" name="clientName" value={formData.clientName || ''} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-lg p-2" />
                        </div>
                         <div>
                            <label htmlFor="vendorName" className="block text-sm font-medium text-gray-700">Vendor Name</label>
                            <input type="text" name="vendorName" value={formData.vendorName || ''} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-lg p-2" />
                        </div>
                        <div>
                            <label htmlFor="billingRate" className="block text-sm font-medium text-gray-700">Billing Rate ($)</label>
                            <input type="number" name="billingRate" value={formData.billingRate || ''} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-lg p-2" />
                        </div>
                        <div>
                            <label htmlFor="term" className="block text-sm font-medium text-gray-700">Term</label>
                            <select name="term" value={formData.term || ''} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-lg p-2 h-[42px]">
                                 <option value="per hour">Per Hour</option>
                                <option value="per day">Per Day</option>
                                <option value="per month">Per Month</option>
                                <option value="annually">Annually</option>
                            </select>
                        </div>
                         <div className="md:col-span-2">
                            <label htmlFor="workLocation" className="block text-sm font-medium text-gray-700">Work Location</label>
                            <input type="text" name="workLocation" value={formData.workLocation || ''} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-lg p-2" />
                        </div>
                        <div className="md:col-span-2">
                            <label htmlFor="rolesResponsibilities" className="block text-sm font-medium text-gray-700">Roles & Responsibilities</label>
                            <textarea name="rolesResponsibilities" value={formData.rolesResponsibilities || ''} onChange={handleChange} required rows="6" className="mt-1 block w-full border border-gray-300 rounded-lg p-2"></textarea>
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

export default EditOfferLetterModal;