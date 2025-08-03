import React from 'react';
import Modal from '../Modal';

const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message, confirmText }) => {
    const buttonClasses = {
        delete: 'bg-red-600 hover:bg-red-700',
        archive: 'bg-yellow-500 hover:bg-yellow-600',
        close: 'bg-blue-500 hover:bg-blue-600',
    };
    const buttonClass = buttonClasses[confirmText?.toLowerCase()] || 'bg-indigo-600';

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title} size="md">
            <p className="text-gray-600">{message}</p>
            <div className="flex justify-end mt-6 space-x-2">
                <button onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Cancel</button>
                <button onClick={onConfirm} className={`px-4 py-2 text-white rounded-md capitalize ${buttonClass}`}>
                    {confirmText}
                </button>
            </div>
        </Modal>
    );
};

export default ConfirmationModal;