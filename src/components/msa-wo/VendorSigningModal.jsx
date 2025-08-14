import React, { useState } from 'react';
import Modal from '../Modal';
import Spinner from '../Spinner';
import { apiService } from '../../api/apiService';

const VendorSigningModal = ({ isOpen, onClose, onSign, documentData }) => {
    const [formData, setFormData] = useState({
        signature: '',
        name: '',
        title: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await onSign(formData, 'vendor', documentData.token);
            onClose();
        } catch (err) {
            setError(err.message || "An unexpected error occurred.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Sign Document as Vendor" size="md">
            {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}
            <form onSubmit={handleSubmit} className="space-y-4">
                <p className="text-gray-700">
                    By signing this document, you agree to the terms and conditions of the Master Services Agreement and Work Order.
                </p>
                <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700">Your Full Name <span className="text-red-500">*</span></label>
                    <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500" />
                </div>
                <div>
                    <label htmlFor="title" className="block text-sm font-medium text-gray-700">Your Title <span className="text-red-500">*</span></label>
                    <input type="text" name="title" id="title" value={formData.title} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500" />
                </div>
                <div>
                    <label htmlFor="signature" className="block text-sm font-medium text-gray-700">Digital Signature <span className="text-red-500">*</span></label>
                    <input type="text" name="signature" id="signature" value={formData.signature} onChange={handleChange} placeholder="e.g., Jane Doe" required className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500" />
                    <p className="mt-1 text-xs text-gray-500">Typing your name here constitutes a legal signature.</p>
                </div>
                
                <div className="flex justify-end space-x-2 pt-4">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Cancel</button>
                    <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 flex items-center justify-center w-28" disabled={loading}>
                        {loading ? <Spinner size="5" /> : 'Sign'}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default VendorSigningModal;