import React, { useState } from 'react';
import Modal from '../Modal';
import Spinner from '../Spinner';

const TaprootSigningModal = ({ isOpen, onClose, onSign }) => {
    const [formData, setFormData] = useState({ signature: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const handleChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            // Pass the entire formData (signature and password) to the onSign handler
            await onSign(formData, 'taproot');
            onClose();
        } catch (err) {
            setError(err.message || "An unexpected error occurred.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Confirm Signature as Taproot Director" size="md">
            {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}
            <form onSubmit={handleSubmit} className="space-y-4">
                <p className="text-gray-700">To finalize this document, please confirm your identity by entering your VMS portal password.</p>
                <div>
                    <label htmlFor="signature" className="block text-sm font-medium text-gray-700">Digital Signature (Type Full Name) <span className="text-red-500">*</span></label>
                    <input type="text" name="signature" id="signature" value={formData.signature} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm p-2" />
                     <p className="mt-1 text-xs text-gray-500">Typing your name here constitutes a legal signature.</p>
                </div>
                <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700">Your VMS Password <span className="text-red-500">*</span></label>
                    <input type="password" name="password" id="password" value={formData.password} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm p-2" />
                </div>
                <div className="flex justify-end space-x-2 pt-4">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Cancel</button>
                    <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 flex items-center justify-center w-36" disabled={loading}>
                        {loading ? <Spinner size="5" /> : 'Confirm & Sign'}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default TaprootSigningModal;