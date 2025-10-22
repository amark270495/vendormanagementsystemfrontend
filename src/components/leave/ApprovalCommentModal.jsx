import React, { useState, useEffect } from 'react';
import Modal from '../Modal'; // Adjust path if necessary
import Spinner from '../Spinner'; // Adjust path if necessary

const ApprovalCommentModal = ({ isOpen, onClose, onConfirm, action, request, loading }) => {
    const [comments, setComments] = useState('');

    useEffect(() => {
        // Reset comments when the modal opens
        if (isOpen) {
            setComments('');
        }
    }, [isOpen]);

    const handleConfirm = () => {
        onConfirm(comments);
    };

    if (!request) return null;

    const actionText = action === 'Approved' ? 'Approve' : 'Reject';
    const buttonClass = action === 'Approved'
        ? 'bg-green-600 hover:bg-green-700'
        : 'bg-red-600 hover:bg-red-700';

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`${actionText} Leave Request`} size="md">
            <div className="space-y-4">
                <p className="text-gray-700">
                    You are about to <strong>{actionText.toLowerCase()}</strong> the leave request for{' '}
                    <strong>{request.username}</strong> from{' '}
                    <strong>{new Date(request.startDate).toLocaleDateString()}</strong> to{' '}
                    <strong>{new Date(request.endDate).toLocaleDateString()}</strong>.
                </p>
                <p className="text-sm text-gray-600">
                    Reason provided: <em className="italic">{request.reason || 'No reason provided.'}</em>
                </p>
                <div>
                    <label htmlFor="approverComments" className="block text-sm font-medium text-gray-700">
                        Approver Comments (Optional):
                    </label>
                    <textarea
                        id="approverComments"
                        name="approverComments"
                        rows="3"
                        value={comments}
                        onChange={(e) => setComments(e.target.value)}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder={`Add comments for ${action === 'Approved' ? 'approval' : 'rejection'}...`}
                    ></textarea>
                </div>
            </div>
            <div className="flex justify-end mt-6 space-x-3 pt-4 border-t">
                <button
                    onClick={onClose}
                    type="button"
                    className="px-4 py-2 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300 disabled:opacity-50"
                    disabled={loading}
                >
                    Cancel
                </button>
                <button
                    onClick={handleConfirm}
                    type="button"
                    className={`px-4 py-2 text-white font-semibold rounded-lg flex items-center justify-center w-32 ${buttonClass} disabled:opacity-50`}
                    disabled={loading}
                >
                    {loading ? <Spinner size="5" /> : `Confirm ${actionText}`}
                </button>
            </div>
        </Modal>
    );
};

export default ApprovalCommentModal;