import React, { useState } from 'react';
import Modal from '../Modal';
import Spinner from '../Spinner';
import { apiService } from '../../api/apiService';

const AccessModal = ({ isOpen, onClose, onAccessGranted, token, vendorEmail }) => {
    const [tempPassword, setTempPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await apiService.accessMSAandWO(token, tempPassword);
            if (response.data.success) {
                onAccessGranted(response.data.documentData);
                onClose();
            } else {
                setError(response.data.message);
            }
        } catch (err) {
            setError(err.response?.data?.message || "An unexpected error occurred.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Secure Document Access" size="sm">
            {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}
            <form onSubmit={handleSubmit} className="space-y-4">
                <p className="text-gray-700">
                    A temporary password has been sent to your email ({vendorEmail}). Please enter it below to securely access the document.
                </p>
                <div>
                    <label htmlFor="tempPassword" className="block text-sm font-medium text-gray-700">Temporary Password <span className="text-red-500">*</span></label>
                    <input type="password" name="tempPassword" id="tempPassword" value={tempPassword} onChange={(e) => setTempPassword(e.target.value)} required className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500" />
                </div>
                
                <div className="flex justify-end space-x-2 pt-4">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Cancel</button>
                    <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 flex items-center justify-center w-28" disabled={loading}>
                        {loading ? <Spinner size="5" /> : 'Access'}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default AccessModal;