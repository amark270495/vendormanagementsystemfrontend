import React, { useState, useEffect } from 'react';
import Modal from '../Modal';
import Spinner from '../Spinner';
import { usePermissions } from '../../hooks/usePermissions';

const EditMSAWOVendorCompanyModal = ({ isOpen, onClose, onSave, companyToEdit }) => {
    const { canManageMSAWO } = usePermissions();

    const [formData, setFormData] = useState({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        // Initialize form data when the modal is opened with a company to edit
        if (isOpen && companyToEdit) {
            setFormData({
                vendorName: companyToEdit.vendorName || '',
                state: companyToEdit.state || '',
                federalId: companyToEdit.federalId || '',
                companyAddress: companyToEdit.companyAddress || '',
                vendorEmail: companyToEdit.vendorEmail || '',
                authorizedSignatureName: companyToEdit.authorizedSignatureName || '',
                authorizedPersonTitle: companyToEdit.authorizedPersonTitle || '',
            });
            // Reset status messages
            setError('');
            setSuccess('');
        }
    }, [isOpen, companyToEdit]);

    const handleChange = (e) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!canManageMSAWO) {
            setError("Permission denied. You do not have the rights to edit vendor companies.");
            return;
        }

        setError('');
        setSuccess('');
        setLoading(true);

        try {
            // The onSave prop is expected to be an async function that handles the API call
            await onSave(formData);
            setSuccess("Vendor company updated successfully!");
            // Close the modal after a short delay to show the success message
            setTimeout(() => {
                onClose();
            }, 1500);
        } catch (err) {
            setError(err.message || "Failed to save vendor company details.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Edit Vendor Company" size="2xl">
            {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}
            {success && <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">{success}</div>}
            
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                    <div>
                        <label htmlFor="vendorName" className="block text-sm font-medium text-gray-700">Vendor Company Name</label>
                        <input type="text" name="vendorName" id="vendorName" value={formData.vendorName || ''} readOnly className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm p-2.5 bg-gray-100" />
                    </div>
                    <div>
                        <label htmlFor="state" className="block text-sm font-medium text-gray-700">State <span className="text-red-500">*</span></label>
                        <input type="text" name="state" id="state" value={formData.state || ''} onChange={handleChange} required disabled={!canManageMSAWO} className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm p-2.5" />
                    </div>
                    <div>
                        <label htmlFor="federalId" className="block text-sm font-medium text-gray-700">Federal ID/EIN <span className="text-red-500">*</span></label>
                        <input type="text" name="federalId" id="federalId" value={formData.federalId || ''} onChange={handleChange} required disabled={!canManageMSAWO} className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm p-2.5" />
                    </div>
                    <div className="md:col-span-2">
                        <label htmlFor="companyAddress" className="block text-sm font-medium text-gray-700">Vendor Company Address <span className="text-red-500">*</span></label>
                        <textarea name="companyAddress" id="companyAddress" value={formData.companyAddress || ''} onChange={handleChange} required disabled={!canManageMSAWO} rows="3" className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm p-2.5"></textarea>
                    </div>
                    <div>
                        <label htmlFor="vendorEmail" className="block text-sm font-medium text-gray-700">Vendor Email ID <span className="text-red-500">*</span></label>
                        <input type="email" name="vendorEmail" id="vendorEmail" value={formData.vendorEmail || ''} onChange={handleChange} required disabled={!canManageMSAWO} className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm p-2.5" />
                    </div>
                    <div>
                        <label htmlFor="authorizedSignatureName" className="block text-sm font-medium text-gray-700">Authorized Person Name <span className="text-red-500">*</span></label>
                        <input type="text" name="authorizedSignatureName" id="authorizedSignatureName" value={formData.authorizedSignatureName || ''} onChange={handleChange} required disabled={!canManageMSAWO} className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm p-2.5" />
                    </div>
                    <div className="md:col-span-2">
                        <label htmlFor="authorizedPersonTitle" className="block text-sm font-medium text-gray-700">Authorized Person Title <span className="text-red-500">*</span></label>
                        <input type="text" name="authorizedPersonTitle" id="authorizedPersonTitle" value={formData.authorizedPersonTitle || ''} onChange={handleChange} required disabled={!canManageMSAWO} className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm p-2.5" />
                    </div>
                </div>

                <div className="flex justify-end space-x-2 pt-4 border-t">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Cancel</button>
                    <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 flex items-center justify-center w-28" disabled={loading || !canManageMSAWO}>
                        {loading ? <Spinner size="5" /> : 'Save'}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default EditMSAWOVendorCompanyModal;