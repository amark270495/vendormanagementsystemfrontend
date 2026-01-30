import React, { useState, useEffect } from 'react';
import Modal from '../Modal.jsx';
import Spinner from '../Spinner.jsx';
import { usePermissions } from '../../hooks/usePermissions.js';
import { 
    User, Briefcase, MapPin, Mail, Phone, Plus, X, 
    AlertCircle, CheckCircle2, UserPlus, Fingerprint, 
    AtSign, Smartphone, Globe, Layers, ArrowRight
} from 'lucide-react';

// --- Ultra-Sleek Input Field ---
const ModernField = ({ label, name, type = 'text', required, readOnly, value, onChange, options, disabled, icon: Icon }) => (
    <div className="relative group flex flex-col gap-1.5">
        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.12em] ml-1 flex items-center gap-1.5">
            {Icon && <Icon size={12} className="text-indigo-400" />}
            {label} {required && <span className="text-rose-500">*</span>}
        </label>
        {options ? (
            <div className="relative">
                <select 
                    name={name} 
                    value={value || ''} 
                    onChange={onChange} 
                    disabled={readOnly || disabled}
                    className="w-full bg-slate-50 border-2 border-transparent rounded-2xl px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100 focus:bg-white focus:border-indigo-500/20 focus:ring-4 focus:ring-indigo-500/5 transition-all outline-none appearance-none cursor-pointer"
                >
                    <option value="">Select Option</option>
                    {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-300">
                    <ArrowRight size={14} className="rotate-90" />
                </div>
            </div>
        ) : (
            <input 
                type={type} 
                name={name} 
                value={value || ''} 
                onChange={onChange} 
                readOnly={readOnly}
                disabled={readOnly || disabled} 
                className="w-full bg-slate-50 border-2 border-transparent rounded-2xl px-4 py-3 text-sm font-semibold text-slate-700 placeholder:text-slate-300 focus:bg-white focus:border-indigo-500/20 focus:ring-4 focus:ring-indigo-500/5 transition-all outline-none"
                placeholder={`Enter ${label.toLowerCase()}...`}
            />
        )}
    </div>
);

const CandidateDetailsModal = ({ isOpen, onClose, onSave, jobInfo, candidateToEdit }) => {
    const { canEditDashboard } = usePermissions();
    const [formData, setFormData] = useState({});
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [currentSkill, setCurrentSkill] = useState('');
    const [skills, setSkills] = useState([]);

    const isEditMode = !!candidateToEdit;

    // --- Original Logic Audited & Preserved ---
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

            // Re-implementation of original Skill Parsing Logic
            if (isEditMode && candidateToEdit.skillSet) {
                try {
                    const parsedSkills = typeof candidateToEdit.skillSet === 'string'
                        ? JSON.parse(candidateToEdit.skillSet)
                        : candidateToEdit.skillSet;
                    setSkills(Array.isArray(parsedSkills) ? parsedSkills : []);
                } catch (e) {
                    setSkills([]);
                }
            } else {
                setSkills([]);
            }
            setCurrentSkill('');
            setError('');
        }
    }, [isOpen, candidateToEdit, jobInfo, isEditMode]);

    const handleChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));

    const handleAddSkill = () => {
        if (currentSkill.trim() && !skills.includes(currentSkill.trim())) {
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
            setError("Permission denied.");
            return;
        }

        setError('');
        setLoading(true);
        try {
            // Preservation of skills array injection
            const finalFormData = { ...formData, skillSet: skills };
            await onSave(finalFormData, jobInfo?.candidateSlot);
            onClose();
        } catch (err) {
            setError(err.message || "Failed to save candidate details.");
        } finally {
            setLoading(false);
        }
    };

    const remarksOptions = [
        "Submitted To Client", "Resume Is Under View", "Resume Shortlisted For Interview", 
        "Interview With Manager", "Client Reject Due To Candidate Not Up To Mark", 
        "Rejected Due To Some Other Reasons", "Candidate Selected", "Resume Submitted Posting Is Still Open",
        "Client Rejected Details Not Mentioned", "Interviews occurring","Rejected Due To Duplicate", "Posting Cancelled"
    ];

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="5xl" padding="p-0 overflow-hidden">
            <div className="flex flex-col md:flex-row min-h-[80vh] bg-white">
                
                {/* --- Left Column: Summary & Meta --- */}
                <div className="w-full md:w-80 bg-slate-50 border-r border-slate-100 p-8 flex flex-col shrink-0">
                    <div className="mb-10">
                        <div className="h-14 w-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-200 mb-6">
                            {isEditMode ? <Fingerprint size={28} /> : <UserPlus size={28} />}
                        </div>
                        <h2 className="text-2xl font-black text-slate-900 leading-tight tracking-tight">
                            {isEditMode ? "Modify" : "Create"} <br/>
                            <span className="text-indigo-600 font-medium tracking-normal">Candidate</span>
                        </h2>
                    </div>

                    <div className="space-y-8 flex-1">
                        <div className="group">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                                <Globe size={12} className="text-indigo-400" /> Source Context
                            </p>
                            <div className="space-y-3">
                                <div>
                                    <span className="text-[10px] text-slate-400 font-medium">Posting ID</span>
                                    <p className="text-xs font-bold text-slate-700">{formData.postingId || '---'}</p>
                                </div>
                                <div>
                                    <span className="text-[10px] text-slate-400 font-medium">Recruiter</span>
                                    <p className="text-xs font-bold text-slate-700">{formData.resumeWorkedBy || '---'}</p>
                                </div>
                            </div>
                        </div>

                        <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100/50">
                            <p className="text-[10px] font-black text-indigo-700 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                                <CheckCircle2 size={12}/> Profile Health
                            </p>
                            <p className="text-[10px] text-indigo-600/70 font-medium leading-relaxed">
                                Ensure all required fields are populated for client submission readiness.
                            </p>
                        </div>
                    </div>
                </div>

                {/* --- Right Column: Interactive Form --- */}
                <div className="flex-1 p-10 overflow-y-auto custom-scrollbar">
                    {error && (
                        <div className="mb-8 p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3 text-rose-600 animate-in fade-in slide-in-from-top-2">
                            <AlertCircle size={18} />
                            <p className="text-xs font-bold">{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-12">
                        {/* Section 1: Contact Detail */}
                        <div className="space-y-6">
                            <h3 className="text-xs font-black text-slate-900 uppercase tracking-[0.2em] flex items-center gap-3">
                                <User size={14} className="text-indigo-500" />
                                Basic Identity
                                <div className="flex-1 h-px bg-slate-100" />
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                <ModernField label="First Name" name="firstName" required value={formData.firstName} onChange={handleChange} disabled={!canEditDashboard} />
                                <ModernField label="Middle Name" name="middleName" value={formData.middleName} onChange={handleChange} disabled={!canEditDashboard} />
                                <ModernField label="Last Name" name="lastName" required value={formData.lastName} onChange={handleChange} disabled={!canEditDashboard} />
                                
                                <ModernField label="Email Address" name="email" type="email" required icon={AtSign} value={formData.email} onChange={handleChange} readOnly={isEditMode} disabled={isEditMode || !canEditDashboard} />
                                <ModernField label="Phone" name="mobileNumber" type="tel" required icon={Smartphone} value={formData.mobileNumber} onChange={handleChange} disabled={!canEditDashboard} />
                                <ModernField label="Reference" name="referenceFrom" icon={Layers} value={formData.referenceFrom} onChange={handleChange} disabled={!canEditDashboard} />
                            </div>
                        </div>

                        {/* Section 2: Job Progress */}
                        <div className="space-y-6">
                            <h3 className="text-xs font-black text-slate-900 uppercase tracking-[0.2em] flex items-center gap-3">
                                <Briefcase size={14} className="text-indigo-500" />
                                Professional Status
                                <div className="flex-1 h-px bg-slate-100" />
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                <ModernField label="Current Role" name="currentRole" required value={formData.currentRole} onChange={handleChange} disabled={!canEditDashboard} />
                                <ModernField label="Location" name="currentLocation" required icon={MapPin} value={formData.currentLocation} onChange={handleChange} disabled={!canEditDashboard} />
                                <ModernField label="Application Status" name="remarks" options={remarksOptions} value={formData.remarks} onChange={handleChange} disabled={!canEditDashboard} />
                            </div>
                        </div>

                        {/* Section 3: Skill Set */}
                        <div className="space-y-4">
                            <h3 className="text-xs font-black text-slate-900 uppercase tracking-[0.2em] flex items-center gap-3">
                                <Plus size={14} className="text-indigo-500" />
                                Skill Repository
                                <div className="flex-1 h-px bg-slate-100" />
                            </h3>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={currentSkill}
                                    onChange={(e) => setCurrentSkill(e.target.value)}
                                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddSkill(); } }}
                                    className="flex-grow bg-slate-50 rounded-2xl px-5 py-3 text-sm font-semibold text-slate-700 focus:bg-white focus:ring-4 focus:ring-indigo-500/5 outline-none transition-all placeholder:text-slate-300"
                                    placeholder="Add a competence (e.g. React.js)..."
                                    disabled={!canEditDashboard}
                                />
                                <button 
                                    type="button" 
                                    onClick={handleAddSkill} 
                                    className="px-6 bg-slate-900 text-white font-bold rounded-2xl hover:bg-black transition-all active:scale-95"
                                    disabled={!canEditDashboard}
                                >
                                    Add
                                </button>
                            </div>
                            <div className="flex flex-wrap gap-2 pt-2 min-h-[44px]">
                                {skills.map(skill => (
                                    <div key={skill} className="flex items-center bg-indigo-50 text-indigo-700 text-xs font-bold px-4 py-2 rounded-xl border border-indigo-100 group">
                                        {skill}
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveSkill(skill)}
                                            className="ml-2 text-indigo-300 hover:text-indigo-600 transition-colors"
                                            disabled={!canEditDashboard}
                                        >
                                            <X size={14} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Sticky Footer */}
                        <div className="pt-10 border-t border-slate-50 flex items-center justify-between bg-white">
                            <button 
                                type="button" 
                                onClick={onClose} 
                                className="text-sm font-bold text-slate-400 hover:text-slate-900 transition-colors"
                            >
                                Discard Changes
                            </button>
                            <button 
                                type="submit" 
                                className="px-12 py-4 bg-indigo-600 text-white font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all active:scale-95 flex items-center gap-2"
                                disabled={loading || !canEditDashboard}
                            >
                                {loading ? <Spinner size="4" color="white" /> : (isEditMode ? 'Update Record' : 'Create Profile')}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </Modal>
    );
};

export default CandidateDetailsModal;