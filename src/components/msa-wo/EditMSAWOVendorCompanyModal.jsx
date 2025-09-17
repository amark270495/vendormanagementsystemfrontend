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
        if (isOpen && companyToEdit) {
            setFormData(companyToEdit);
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
            setError("Permission denied.");
            return;
        }

        setError('');
        setSuccess('');
        setLoading(true);

        try {
            await onSave(formData);
            setSuccess("Vendor company updated successfully!");
            setTimeout(() => {
                onClose();
            }, 1000);
        } catch (err) {
            setError(err.message || "Failed to save details.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Edit Vendor Company" size="lg">
            {error && <div className="bg-red-100 border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}
            {success && <div className="bg-green-100 border-green-400 text-green-700 px-4 py-3 rounded mb-4">{success}</div>}
            
            {canManageMSAWO && companyToEdit && (
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6">
                         <div>
                            <label htmlFor="companyName" className="block text-sm font-medium text-gray-700">Vendor Company Name</label>
                            <input type="text" name="companyName" value={formData.companyName || ''} readOnly className="form-input mt-1 bg-gray-100" />
                        </div>
                        <div>
                            <label htmlFor="state" className="block text-sm font-medium text-gray-700">State <span className="text-red-500">*</span></label>
                            <input type="text" name="state" value={formData.state || ''} onChange={handleChange} required className="form-input mt-1" />
                        </div>
                        <div>
                            <label htmlFor="federalId" className="block text-sm font-medium text-gray-700">Federal Id/EIN <span className="text-red-500">*</span></label>
                            <input type="text" name="federalId" value={formData.federalId || ''} onChange={handleChange} required className="form-input mt-1" />
                        </div>
                        <div className="md:col-span-2">
                            <label htmlFor="companyAddress" className="block text-sm font-medium text-gray-700">Vendor Company Address <span className="text-red-500">*</span></label>
                            <textarea name="companyAddress" value={formData.companyAddress || ''} onChange={handleChange} required rows="3" className="form-input mt-1"></textarea>
                        </div>
                        <div>
                            <label htmlFor="companyEmail" className="block text-sm font-medium text-gray-700">Vendor Email Id <span className="text-red-500">*</span></label>
                            <input type="email" name="companyEmail" value={formData.companyEmail || ''} onChange={handleChange} required className="form-input mt-1" />
                        </div>
                        <div>
                            <label htmlFor="authorizedSignatureName" className="block text-sm font-medium text-gray-700">Vendor Authorized Person Name <span className="text-red-500">*</span></label>
                            <input type="text" name="authorizedSignatureName" value={formData.authorizedSignatureName || ''} onChange={handleChange} required className="form-input mt-1" />
                        </div>
                        <div>
                            <label htmlFor="authorizedPersonTitle" className="block text-sm font-medium text-gray-700">Vendor Authorized Person Title <span className="text-red-500">*</span></label>
                            <input type="text" name="authorizedPersonTitle" value={formData.authorizedPersonTitle || ''} onChange={handleChange} required className="form-input mt-1" />
                        </div>
                    </div>
                    <div className="flex justify-end space-x-2 pt-4">
                        <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
                        <button type="submit" className="btn-primary w-28 flex items-center justify-center" disabled={loading}>
                            {loading ? <Spinner size="5" /> : 'Save'}
                        </button>
                    </div>
                </form>
            )}
        </Modal>
    );
};

export default EditMSAWOVendorCompanyModal;