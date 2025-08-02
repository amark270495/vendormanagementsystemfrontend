import React, { useState } from 'react';
import Modal from './Modal';
import Spinner from './Spinner';

const DeleteUserModal = ({ isOpen, onClose, onConfirm, userToDelete }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleDelete = async () => {
        setLoading(true);
        setError('');
        try {
            await onConfirm();
            onClose();
        } catch (err) {
            setError(`Failed to delete user: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Confirm Deletion" size="sm">
            {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}
            <p className="text-gray-700 mb-4">
                Are you sure you want to delete user "<strong>{userToDelete?.displayName}</strong>" ({userToDelete?.username})? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-2 pt-4">
                <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Cancel</button>
                <button type="button" onClick={handleDelete} className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center justify-center w-24" disabled={loading}>
                    {loading ? <Spinner size="5" /> : 'Delete'}
                </button>
            </div>
        </Modal>
    );
};

export default DeleteUserModal;