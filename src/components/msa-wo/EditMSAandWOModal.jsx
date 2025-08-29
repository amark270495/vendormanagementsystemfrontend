// src/components/msa-wo/EditMSAandWOModal.jsx

import React, { useState, useEffect } from 'react';
import Modal from '../Modal';
import Spinner from '../Spinner';
import { usePermissions } from '../../hooks/usePermissions';

const EditMSAandWOModal = ({ isOpen, onClose, onSave, documentToEdit }) => {
    const { canManageMSAWO } = usePermissions();
    const [formData, setFormData] = useState({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen && documentToEdit) {
            setFormData(documentToEdit);
            setError('');
        }
    }, [isOpen, documentToEdit]);

    const handleChange = (e) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!canManageMSAWO) {
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
        <Modal isOpen={isOpen} onClose={onClose} title={`Edit MSA/WO for ${formData.vendorName}`} size="2xl">
            {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}
            
            {canManageMSAWO && (
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                        
                        <div>
                            <label htmlFor="vendorName" className="block text-sm font-medium text-gray-700">Vendor Company Name</label>
                            <input type="text" name="vendorName" value={formData.vendorName || ''} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-lg p-2" />
                        </div>
                        <div>
                            <label htmlFor="state" className="block text-sm font-medium text-gray-700">State</label>
                            <input type="text" name="state" value={formData.state || ''} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-lg p-2" />
                        </div>
                        <div>
                            <label htmlFor="federalId" className="block text-sm font-medium text-gray-700">Federal Id/EIN</label>
                            <input type="text" name="federalId" value={formData.federalId || ''} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-lg p-2" />
                        </div>
                        <div>
                            <label htmlFor="companyAddress" className="block text-sm font-medium text-gray-700">Vendor Company Address</label>
                            <input type="text" name="companyAddress" value={formData.companyAddress || ''} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-lg p-2" />
                        </div>
                        <div>
                            <label htmlFor="vendorEmail" className="block text-sm font-medium text-gray-700">Vendor Email Id</label>
                            <input type="email" name="vendorEmail" value={formData.vendorEmail || ''} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-lg p-2" />
                        </div>
                        <div>
                            <label htmlFor="authorizedSignatureName" className="block text-sm font-medium text-gray-700">Vendor Authorized Person Name</label>
                            <input type="text" name="authorizedSignatureName" value={formData.authorizedSignatureName || ''} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-lg p-2" />
                        </div>
                        <div>
                            <label htmlFor="authorizedPersonTitle" className="block text-sm font-medium text-gray-700">Vendor Authorized Person Title</label>
                            <input type="text" name="authorizedPersonTitle" value={formData.authorizedPersonTitle || ''} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-lg p-2" />
                        </div>
                        <div>
                            <label htmlFor="candidateName" className="block text-sm font-medium text-gray-700">Candidate Name</label>
                            <input type="text" name="candidateName" value={formData.candidateName || ''} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-lg p-2" />
                        </div>
                        <div>
                            <label htmlFor="typeOfServices" className="block text-sm font-medium text-gray-700">Type Of Service</label>
                            <select name="typeOfServices" value={formData.typeOfServices || ''} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-lg p-2 h-[42px]">
                                <option value="">Select Service</option>
                                <option value="IT Consulting">IT Consulting</option>
                                <option value="Staffing">Staffing</option>
                            </select>
                        </div>
                        <div>
                            <label htmlFor="typeOfSubcontract" className="block text-sm font-medium text-gray-700">Type Of Subcontract</label>
                            <select name="typeOfSubcontract" value={formData.typeOfSubcontract || ''} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-lg p-2 h-[42px]">
                                <option value="">Select Subcontract</option>
                                <option value="Time and Materials">Time and Materials</option>
                                <option value="Fixed Price">Fixed Price</option>
                            </select>
                        </div>
                        <div>
                            <label htmlFor="rate" className="block text-sm font-medium text-gray-700">Rate</label>
                            <input type="number" name="rate" value={formData.rate || ''} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-lg p-2" />
                        </div>
                        <div>
                            <label htmlFor="perHour" className="block text-sm font-medium text-gray-700">Per Hour/Day/Month</label>
                            <select name="perHour" value={formData.perHour || ''} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-lg p-2 h-[42px]">
                                <option value="">Select Option</option>
                                <option value="PER HOUR">Per Hour</option>
                                <option value="PER DAY">Per Day</option>
                                <option value="PER MONTH">Per Month</option>
                            </select>
                        </div>
                        <div>
                            <label htmlFor="net" className="block text-sm font-medium text-gray-700">Payment Terms (NET)</label>
                            <select name="net" value={formData.net || ''} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-lg p-2 h-[42px]">
                                <option value="">Select Days</option>
                                <option value="30">30 Days</option>
                                <option value="45">45 Days</option>
                                <option value="60">60 Days</option>
                            </select>
                        </div>
                         <div>
                            <label htmlFor="status" className="block text-sm font-medium text-gray-700">Status</label>
                            <select name="status" value={formData.status || ''} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-lg p-2 h-[42px]">
                                <option value="Pending">Pending</option>
                                <option value="Vendor Signed">Vendor Signed</option>
                                <option value="Fully Signed">Fully Signed</option>
                                <option value="Cancelled">Cancelled</option>
                            </select>
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

export default EditMSAandWOModal;