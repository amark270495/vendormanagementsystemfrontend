import React, { useState, useEffect } from 'react';
import Modal from '../Modal';
import Spinner from '../Spinner';
import { usePermissions } from '../../hooks/usePermissions'; // <-- NEW: Import usePermissions

const CandidateDetailsModal = ({ isOpen, onClose, onSave, jobInfo, candidateToEdit }) => {
    // NEW: Destructure canEditDashboard from usePermissions
    const { canEditDashboard } = usePermissions(); 

    const [formData, setFormData] = useState({});
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const isEditMode = !!candidateToEdit;

    useEffect(() => {
        if (isOpen) {
            const initialData = isEditMode ? {
                ...candidateToEdit,
                postingId: candidateToEdit.PartitionKey,
            } : {
                postingId: jobInfo?.postingId || '',
                clientInfo: jobInfo?.clientInfo || '',
                firstName: '', middleName: '', lastName: '',
                email: '', mobileNumber: '',
                currentRole: '', currentLocation: ''
            };
            setFormData(initialData);
            setError('');
        }
    }, [isOpen, jobInfo, candidateToEdit, isEditMode]);

    const handleChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        // NEW: Check permission before attempting to save
        if (!canEditDashboard) {
            setError("Permission denied. You do not have the necessary rights to save candidate details.");
            return;
        }

        setError('');
        setLoading(true);
        try {
            await onSave(formData, jobInfo?.candidateSlot);
            onClose();
        } catch (err) {
            setError(err.message || "Failed to save candidate details.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={isEditMode ? "Edit Candidate Details" : "Add Candidate Details"} size="2xl">
            {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Posting ID</label>
                        <input type="text" value={formData.postingId || ''} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 bg-gray-100" readOnly />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Client Info</label>
                        <input type="text" value={formData.clientInfo || ''} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 bg-gray-100" readOnly />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">First Name <span className="text-red-500">*</span></label>
                        <input type="text" name="firstName" value={formData.firstName || ''} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" required disabled={!canEditDashboard} /> {/* NEW: Disable input if no permission */}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Middle Name</label>
                        <input type="text" name="middleName" value={formData.middleName || ''} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" disabled={!canEditDashboard} /> {/* NEW: Disable input if no permission */}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Last Name <span className="text-red-500">*</span></label>
                        <input type="text" name="lastName" value={formData.lastName || ''} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" required disabled={!canEditDashboard} /> {/* NEW: Disable input if no permission */}
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-700">Email <span className="text-red-500">*</span></label>
                        <input type="email" name="email" value={formData.email || ''} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" required disabled={!canEditDashboard || isEditMode} /> {/* NEW: Disable input if no permission, or if in edit mode (email is RowKey) */}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Mobile Number <span className="text-red-500">*</span></label>
                        <input type="tel" name="mobileNumber" value={formData.mobileNumber || ''} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" required disabled={!canEditDashboard} /> {/* NEW: Disable input if no permission */}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Current Working Role <span className="text-red-500">*</span></label>
                        <input type="text" name="currentRole" value={formData.currentRole || ''} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" required disabled={!canEditDashboard} /> {/* NEW: Disable input if no permission */}
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700">Current Location <span className="text-red-500">*</span></label>
                        <input type="text" name="currentLocation" value={formData.currentLocation || ''} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" required disabled={!canEditDashboard} /> {/* NEW: Disable input if no permission */}
                    </div>
                </div>
                <div className="flex justify-end space-x-2 pt-4">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Cancel</button>
                    <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 flex items-center justify-center w-28" disabled={loading || !canEditDashboard}> {/* NEW: Disable submit button if no permission */}
                        {loading ? <Spinner size="5" /> : 'Save'}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default CandidateDetailsModal;