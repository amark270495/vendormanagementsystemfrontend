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
    }, [isOpen, candidateToEdit]);

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

    // Helper for rendering form fields
    const FormInput = ({ label, name, type = 'text', required = false, readOnly = false, value, onChange, options }) => (
        <div>
            <label className="block text-sm font-medium text-gray-700">{label} {required && <span className="text-red-500">*</span>}</label>
            {options ? (
                <select 
                    name={name} 
                    value={value || ''} 
                    onChange={onChange} 
                    className={`mt-1 block w-full border border-gray-300 rounded-lg shadow-sm p-2 h-[42px] ${readOnly ? 'bg-gray-100' : ''}`} 
                    required={required} 
                    disabled={readOnly || !canEditDashboard}
                >
                    <option value="">Select Option</option>
                    {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
            ) : (
                <input 
                    type={type} 
                    name={name} 
                    value={value || ''} 
                    onChange={onChange} 
                    className={`mt-1 block w-full border border-gray-300 rounded-lg shadow-sm p-2 ${readOnly ? 'bg-gray-100' : ''}`} 
                    required={required} 
                    readOnly={readOnly}
                    disabled={!canEditDashboard || readOnly} 
                />
            )}
        </div>
    );

    const remarksOptions = [
        "Submitted To Client", "Resume Is Under View", "Resume Shortlisted For Interview", 
        "Interview With Manager", "Client Reject Due To Candidate Not Up To Mark", 
        "Rejected Due To Some Other Reasons", "Candidate Selected", 
        "Client Rejected Details Not Mentioned"
    ];

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={isEditMode ? "Edit Candidate Details" : "Add Candidate Details"} size="3xl">
            {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}
            
            <form onSubmit={handleSubmit} className="space-y-6">
                
                {/* --- Section 1: Job Context (Read-Only) --- */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-indigo-50 rounded-lg border border-indigo-200">
                     <FormInput label="Posting ID" name="postingId" readOnly value={formData.postingId} />
                     <FormInput label="Client Info" name="clientInfo" readOnly value={formData.clientInfo} />
                     <FormInput label="Resume Worked By" name="resumeWorkedBy" readOnly value={formData.resumeWorkedBy} />
                </div>

                {/* --- Section 2: Personal Details --- */}
                <div className="space-y-4 pt-4">
                    <h3 className="text-lg font-bold text-gray-800 border-b pb-2">Personal & Contact Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <FormInput label="First Name" name="firstName" required value={formData.firstName} onChange={handleChange} />
                        <FormInput label="Middle Name" name="middleName" value={formData.middleName} onChange={handleChange} />
                        <FormInput label="Last Name" name="lastName" required value={formData.lastName} onChange={handleChange} />
                        <FormInput label="Mobile Number" name="mobileNumber" type="tel" required value={formData.mobileNumber} onChange={handleChange} />
                        
                        <FormInput 
                            label="Email" 
                            name="email" 
                            type="email" 
                            required 
                            value={formData.email} 
                            onChange={handleChange} 
                            readOnly={isEditMode} // Email is only editable during the initial add/not in edit mode
                        />
                         <div className="md:col-span-3">
                            <FormInput label="Reference From" name="referenceFrom" value={formData.referenceFrom} onChange={handleChange} />
                        </div>
                    </div>
                </div>
                
                {/* --- Section 3: Professional Details & Status --- */}
                <div className="space-y-4 pt-4 border-t">
                    <h3 className="text-lg font-bold text-gray-800 border-b pb-2">Role & Status Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <FormInput label="Current Working Role" name="currentRole" required value={formData.currentRole} onChange={handleChange} />
                        <FormInput label="Current Location" name="currentLocation" required value={formData.currentLocation} onChange={handleChange} />
                        <FormInput 
                            label="Remarks" 
                            name="remarks" 
                            options={remarksOptions} 
                            value={formData.remarks} 
                            onChange={handleChange} 
                        />
                    </div>
                </div>

                {/* --- Section 4: Skill Set Input --- */}
                <div className="space-y-2 pt-4 border-t">
                    <h3 className="text-lg font-bold text-gray-800 border-b pb-2">Skill Set</h3>
                    <div className="flex items-center space-x-2">
                        <input
                            type="text"
                            value={currentSkill}
                            onChange={(e) => setCurrentSkill(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddSkill(); } }}
                            className="flex-grow border border-gray-300 rounded-lg shadow-sm p-2"
                            placeholder="Type skill and press Enter or click Add"
                            disabled={!canEditDashboard}
                        />
                        <button type="button" onClick={handleAddSkill} className="px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 font-semibold" disabled={!canEditDashboard}>Add</button>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2 p-3 bg-slate-100 min-h-[40px] rounded-lg border border-slate-200">
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

                <div className="flex justify-end space-x-3 pt-4 border-t">
                    <button type="button" onClick={onClose} className="px-6 py-2 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300">Cancel</button>
                    <button type="submit" className="px-6 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 flex items-center justify-center w-28" disabled={loading || !canEditDashboard}>
                        {loading ? <Spinner size="5" /> : 'Save'}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default CandidateDetailsModal;