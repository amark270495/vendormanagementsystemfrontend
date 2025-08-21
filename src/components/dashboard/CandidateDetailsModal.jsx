import React, { useState, useEffect } from 'react';
import Modal from '../Modal';
import Spinner from '../Spinner';
import { usePermissions } from '../../hooks/usePermissions';

const CandidateDetailsModal = ({ isOpen, onClose, onSave, jobInfo, candidateToEdit }) => {
    const { canEditDashboard } = usePermissions(); 

    const [formData, setFormData] = useState({});
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const isEditMode = !!candidateToEdit;

    useEffect(() => {
        if (isOpen) {
            const initialData = isEditMode ? {
                ...candidateToEdit,
                postingId: candidateToEdit.postingId || candidateToEdit.PartitionKey || '', 
                remarks: candidateToEdit.remarks || '',
                resumeWorkedBy: candidateToEdit.resumeWorkedBy || '',
                referenceFrom: candidateToEdit.referenceFrom || '' // NEW: Initialize referenceFrom
            } : {
                postingId: jobInfo?.postingId || '',
                clientInfo: jobInfo?.clientInfo || '',
                firstName: '', middleName: '', lastName: '',
                email: '', mobileNumber: '',
                currentRole: '', currentLocation: '',
                remarks: '',
                resumeWorkedBy: jobInfo?.resumeWorkedBy || '', // For add mode, from Dashboard's workingBy
                referenceFrom: '' // NEW: Initialize referenceFrom for new candidate
            };
            setFormData(initialData);
            setError('');
        }
    }, [isOpen, jobInfo, candidateToEdit, isEditMode]);

    const handleChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));

    const handleSubmit = async (e) => {
        e.preventDefault();
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
                        <input type="text" name="firstName" value={formData.firstName || ''} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" required disabled={!canEditDashboard} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Middle Name</label>
                        <input type="text" name="middleName" value={formData.middleName || ''} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" disabled={!canEditDashboard} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Last Name <span className="text-red-500">*</span></label>
                        <input type="text" name="lastName" value={formData.lastName || ''} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" required disabled={!canEditDashboard} />
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-700">Email <span className="text-red-500">*</span></label>
                        <input type="email" name="email" value={formData.email || ''} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" required disabled={!canEditDashboard || isEditMode} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Mobile Number <span className="text-red-500">*</span></label>
                        <input type="tel" name="mobileNumber" value={formData.mobileNumber || ''} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" required disabled={!canEditDashboard} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Current Working Role <span className="text-red-500">*</span></label>
                        <input type="text" name="currentRole" value={formData.currentRole || ''} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" required disabled={!canEditDashboard} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Current Location <span className="text-red-500">*</span></label>
                        <input type="text" name="currentLocation" value={formData.currentLocation || ''} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" required disabled={!canEditDashboard} />
                    </div>
                    {/* Remarks field */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Remarks</label>
                        <select name="remarks" value={formData.remarks || ''} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 h-[42px]" disabled={!canEditDashboard}>
                            <option value="">Select Remark</option>
                            <option value="Submitted To Client">Submitted To Client</option>
                            <option value="Resume Is Under View">Interview In Progress</option>
                            <option value="Resume Shortlisted For Interview">Interview In Progress</option>
                            <option value="Interview With Manager">Interview In Progress</option>
                            <option value="Client Reject Due To Candidate Not Up To Mark">Client Reject Due To Candidate Not Up To Mark</option>
                            <option value="Rejected Due To Some Other Reasons">Rejected Due To Some Other Reasons</option>
                            <option value="Candidate Selected">Candidate Selected</option>
                            <option value="Client Rejected Details Not Mentioned">Client Rejected Details Not Mentioned</option>
                        </select>
                    </div>
                    {/* Resume Worked By field (Read-only) */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Resume Worked By</label>
                        <input type="text" name="resumeWorkedBy" value={formData.resumeWorkedBy || ''} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 bg-gray-100" readOnly />
                    </div>
                    {/* NEW: Reference From field */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Reference From</label>
                        <input type="text" name="referenceFrom" value={formData.referenceFrom || ''} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" disabled={!canEditDashboard} />
                    </div>
                </div>
                <div className="flex justify-end space-x-2 pt-4">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Cancel</button>
                    <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 flex items-center justify-center w-28" disabled={loading || !canEditDashboard}>
                        {loading ? <Spinner size="5" /> : 'Save'}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default CandidateDetailsModal;