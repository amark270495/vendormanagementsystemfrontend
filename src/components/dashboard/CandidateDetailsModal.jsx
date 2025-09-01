import React, { useState, useEffect } from 'react';
import Modal from '../Modal.jsx';
import Spinner from '../Spinner.jsx';
import { usePermissions } from '../../hooks/usePermissions.js';

const CandidateDetailsModal = ({ isOpen, onClose, onSave, jobInfo, candidateToEdit }) => {
    const { canEditDashboard } = usePermissions();

    const [formData, setFormData] = useState({});
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const isEditMode = !!candidateToEdit;

    // State for managing skills input
    const [currentSkill, setCurrentSkill] = useState('');
    const [skills, setSkills] = useState([]);

    useEffect(() => {
        if (isOpen) {
            const initialData = isEditMode ? {
                ...candidateToEdit,
                postingId: candidateToEdit.postingId || candidateToEdit.PartitionKey || '',
                remarks: candidateToEdit.remarks || '',
                resumeWorkedBy: candidateToEdit.resumeWorkedBy || '',
                referenceFrom: candidateToEdit.referenceFrom || ''
            } : {
                postingId: jobInfo?.postingId || '',
                clientInfo: jobInfo?.clientInfo || '',
                firstName: '', middleName: '', lastName: '',
                email: '', mobileNumber: '',
                currentRole: '', currentLocation: '',
                remarks: '',
                resumeWorkedBy: jobInfo?.resumeWorkedBy || '',
                referenceFrom: ''
            };
            setFormData(initialData);

            // Initialize skills from the candidate data
            if (isEditMode && candidateToEdit.skillSet) {
                try {
                    // Skill set might be a stringified JSON array from the backend
                    const parsedSkills = typeof candidateToEdit.skillSet === 'string'
                        ? JSON.parse(candidateToEdit.skillSet)
                        : candidateToEdit.skillSet;
                    setSkills(Array.isArray(parsedSkills) ? parsedSkills : []);
                } catch (e) {
                    console.error("Failed to parse skills:", e);
                    setSkills([]);
                }
            } else {
                setSkills([]);
            }

            setCurrentSkill('');
            setError('');
        }
    }, [isOpen, jobInfo, candidateToEdit, isEditMode]);

    const handleChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));

    // Handlers for adding and removing skills
    const handleAddSkill = () => {
        if (currentSkill && !skills.includes(currentSkill.trim())) {
            setSkills([...skills, currentSkill.trim()]);
            setCurrentSkill('');
        }
    };

    const handleRemoveSkill = (skillToRemove) => {
        setSkills(skills.filter(skill => skill !== skillToRemove));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!canEditDashboard) {
            setError("Permission denied. You do not have the necessary rights to save candidate details.");
            return;
        }

        setError('');
        setLoading(true);
        try {
            // Add the skills array to the form data being saved
            const finalFormData = { ...formData, skillSet: skills };
            await onSave(finalFormData, jobInfo?.candidateSlot);
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
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Remarks</label>
                        <select name="remarks" value={formData.remarks || ''} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 h-[42px]" disabled={!canEditDashboard}>
                            <option value="">Select Remark</option>
                            <option value="Submitted To Client">Submitted To Client</option>
                            <option value="Resume Is Under View">Resume Is Under View</option>
                            <option value="Resume Shortlisted For Interview">Resume Shortlisted For Interview</option>
                            <option value="Interview With Manager">Interview With Manager</option>
                            <option value="Client Reject Due To Candidate Not Up To Mark">Client Reject Due To Candidate Not Up To Mark</option>
                            <option value="Rejected Due To Some Other Reasons">Rejected Due To Some Other Reasons</option>
                            <option value="Candidate Selected">Candidate Selected</option>
                            <option value="Client Rejected Details Not Mentioned">Client Rejected Details Not Mentioned</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Resume Worked By</label>
                        <input type="text" name="resumeWorkedBy" value={formData.resumeWorkedBy || ''} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 bg-gray-100" readOnly />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Reference From</label>
                        <input type="text" name="referenceFrom" value={formData.referenceFrom || ''} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" disabled={!canEditDashboard} />
                    </div>
                </div>

                {/* Skill Set Input Section */}
                <div className="md:col-span-2 space-y-2 pt-4 border-t">
                    <label className="block text-sm font-medium text-gray-700">Skill Set</label>
                    <div className="flex items-center space-x-2">
                        <input
                            type="text"
                            value={currentSkill}
                            onChange={(e) => setCurrentSkill(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddSkill(); } }}
                            className="flex-grow border border-gray-300 rounded-md shadow-sm p-2"
                            placeholder="e.g., React, Node.js, then press Enter or Add"
                            disabled={!canEditDashboard}
                        />
                        <button type="button" onClick={handleAddSkill} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300" disabled={!canEditDashboard}>Add</button>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2 p-2 bg-gray-50 min-h-[40px] rounded-md border">
                        {skills.map(skill => (
                            <div key={skill} className="flex items-center bg-indigo-100 text-indigo-800 text-sm font-medium px-2.5 py-1 rounded-full">
                                {skill}
                                <button
                                    type="button"
                                    onClick={() => handleRemoveSkill(skill)}
                                    className="ml-2 text-indigo-500 hover:text-indigo-700"
                                    disabled={!canEditDashboard}
                                >
                                    &times;
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="flex justify-end space-x-2 pt-4 border-t">
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