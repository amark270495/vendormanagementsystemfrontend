import React, { useState, useEffect } from 'react';
import Modal from '../Modal.jsx';
import Spinner from '../Spinner.jsx';
import InputField from '../InputField.jsx'; // 🌟 NEW: Importing our global universal component
import { usePermissions } from '../../hooks/usePermissions.js';
import { 
    User, Briefcase, MapPin, X, AlertCircle, 
    UserPlus, Fingerprint, AtSign, Smartphone, 
    Globe, Layers, Sparkles, ShieldCheck
} from 'lucide-react';

const CandidateDetailsModal = ({ isOpen, onClose, onSave, jobInfo, candidateToEdit }) => {
    const { canEditDashboard } = usePermissions();
    const [formData, setFormData] = useState({});
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [currentSkill, setCurrentSkill] = useState('');
    const [skills, setSkills] = useState([]);

    const isEditMode = !!candidateToEdit;

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

            if (isEditMode && candidateToEdit.skillSet) {
                try {
                    const parsedSkills = typeof candidateToEdit.skillSet === 'string'
                        ? JSON.parse(candidateToEdit.skillSet)
                        : candidateToEdit.skillSet;
                    setSkills(Array.isArray(parsedSkills) ? parsedSkills : []);
                } catch (e) { setSkills([]); }
            } else { setSkills([]); }
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

    const handleRemoveSkill = (skillToRemove) => setSkills(skills.filter(skill => skill !== skillToRemove));

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!canEditDashboard) { setError("Permission denied."); return; }
        
        // Example of how we can use our new error state if we wanted to do manual validation
        if (!formData.firstName) { setError('First name is required'); return; }
        
        setError('');
        setLoading(true);
        try {
            const finalFormData = { ...formData, skillSet: skills };
            await onSave(finalFormData, jobInfo?.candidateSlot);
            onClose();
        } catch (err) {
            setError(err.message || "Failed to save details.");
        } finally { setLoading(false); }
    };

    const remarksOptions = [
        "Submitted To Client", "Resume Is Under View", "Resume Shortlisted For Interview", 
        "Interview With Manager", "Candidate Selected", "Resume Submitted Posting Is Still Open",
        "Interviews occurring", "Rejected Due To Duplicate", "Posting Cancelled", "Candidate Rejected - Reason Not Metioned", "Candidate Rejected - Not Up To Mark"
    ];

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="5xl" padding="p-0 overflow-hidden">
            <div className="flex flex-col md:flex-row min-h-[85vh] bg-white">
                
                {/* --- Sidebar: Context & Health --- */}
                <div className="w-full md:w-80 bg-slate-50/50 border-r border-slate-100 p-8 flex flex-col shrink-0">
                    <div className="mb-10">
                        <div className="h-16 w-16 bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-3xl flex items-center justify-center text-white shadow-lg shadow-indigo-100 mb-6">
                            {isEditMode ? <Fingerprint size={32} /> : <UserPlus size={32} />}
                        </div>
                        <h2 className="text-3xl font-black text-slate-900 leading-tight">
                            {isEditMode ? "Modify" : "Enlist"} <br/>
                            <span className="text-indigo-600 font-medium">Candidate</span>
                        </h2>
                    </div>

                    <div className="space-y-6 flex-1">
                        <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <Globe size={12} className="text-indigo-400" /> Origin Metrics
                            </p>
                            <div className="space-y-4">
                                <div>
                                    <span className="text-[10px] text-slate-400 font-medium uppercase tracking-tighter">Posting ID</span>
                                    <p className="text-sm font-bold text-slate-700">{formData.postingId || '---'}</p>
                                </div>
                                <div>
                                    <span className="text-[10px] text-slate-400 font-medium uppercase tracking-tighter">Assigned Recruiter</span>
                                    <p className="text-sm font-bold text-slate-700 truncate">{formData.resumeWorkedBy || '---'}</p>
                                </div>
                            </div>
                        </div>

                        <div className="p-5 bg-indigo-50/50 rounded-3xl border border-indigo-100/50 flex flex-col gap-2">
                            <p className="text-[10px] font-black text-indigo-700 uppercase tracking-widest flex items-center gap-1.5">
                                <ShieldCheck size={14}/> Profile Integrity
                            </p>
                            <p className="text-[11px] text-indigo-600/80 font-medium leading-relaxed">
                                System validation requires all required fields to be populated for recruiter submission.
                            </p>
                        </div>
                    </div>
                </div>

                {/* --- Main Workspace --- */}
                <div className="flex-1 p-10 overflow-y-auto custom-scrollbar bg-white">
                    {error && (
                        <div className="mb-8 p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3 text-rose-600 animate-in fade-in slide-in-from-top-2">
                            <AlertCircle size={18} />
                            <p className="text-xs font-bold uppercase tracking-tight">{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-12">
                        
                        {/* Section 1: Basic Identity */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-slate-50 rounded-xl text-slate-400">
                                    <User size={16} />
                                </div>
                                <h3 className="text-xs font-black text-slate-900 uppercase tracking-[0.2em]">Basic Identity</h3>
                                <div className="flex-1 h-px bg-slate-100" />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {/* 🌟 NEW: Using InputField globally */}
                                <InputField label="First Name" name="firstName" required value={formData.firstName} onChange={handleChange} disabled={!canEditDashboard} />
                                <InputField label="Middle Name" name="middleName" value={formData.middleName} onChange={handleChange} disabled={!canEditDashboard} />
                                <InputField label="Last Name" name="lastName" required value={formData.lastName} onChange={handleChange} disabled={!canEditDashboard} />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <InputField label="Email Address" name="email" type="email" required icon={AtSign} value={formData.email} onChange={handleChange} readOnly={isEditMode} />
                                <InputField label="Mobile Contact" name="mobileNumber" type="tel" required icon={Smartphone} value={formData.mobileNumber} onChange={handleChange} />
                            </div>
                            <InputField label="Reference From" name="referenceFrom" icon={Layers} value={formData.referenceFrom} onChange={handleChange} />
                        </div>

                        {/* Section 2: Career Path */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-slate-50 rounded-xl text-slate-400">
                                    <Briefcase size={16} />
                                </div>
                                <h3 className="text-xs font-black text-slate-900 uppercase tracking-[0.2em]">Career Path</h3>
                                <div className="flex-1 h-px bg-slate-100" />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <InputField label="Current Role" name="currentRole" required value={formData.currentRole} onChange={handleChange} />
                                <InputField label="Location" name="currentLocation" required icon={MapPin} value={formData.currentLocation} onChange={handleChange} />
                                <InputField label="Candidate Status" name="remarks" options={remarksOptions} value={formData.remarks} onChange={handleChange} />
                            </div>
                        </div>

                        {/* Section 3: Skill Repository */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-indigo-50 rounded-xl text-indigo-500">
                                        <Sparkles size={16} />
                                    </div>
                                    <h3 className="text-xs font-black text-slate-900 uppercase tracking-[0.2em]">Skill Repository</h3>
                                </div>
                                <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg border border-indigo-100">
                                    {skills.length} Items Listed
                                </span>
                            </div>
                            
                            <div className="flex gap-2">
                                {/* Keeping this input manual since it has a unique 'Enter' key handler, but applying base styles */}
                                <input
                                    type="text"
                                    value={currentSkill}
                                    onChange={(e) => setCurrentSkill(e.target.value)}
                                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddSkill(); } }}
                                    className="flex-grow bg-slate-50 border-none rounded-2xl px-5 py-3 text-sm font-semibold text-slate-700 focus:bg-white ring-1 ring-transparent focus:ring-indigo-500/20 transition-all placeholder:text-slate-300"
                                    placeholder="Type competency and press enter..."
                                    disabled={!canEditDashboard}
                                />
                                <button 
                                    type="button" 
                                    onClick={handleAddSkill} 
                                    className="px-8 bg-slate-900 text-white font-bold rounded-2xl hover:bg-black transition-all active:scale-95 shadow-lg shadow-slate-200"
                                >
                                    Add
                                </button>
                            </div>
                            
                            <div className="flex flex-wrap gap-2 pt-2 bg-slate-50/50 p-6 rounded-3xl border border-dashed border-slate-200 min-h-[100px]">
                                {skills.length === 0 && <p className="text-xs text-slate-400 italic">No skills added to this profile yet.</p>}
                                {skills.map(skill => (
                                    <div key={skill} className="flex items-center bg-white text-indigo-600 text-xs font-bold px-4 py-2 rounded-xl shadow-sm border border-slate-100 hover:border-indigo-200 transition-colors">
                                        {skill}
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveSkill(skill)}
                                            className="ml-2 text-slate-300 hover:text-rose-500 transition-colors"
                                        >
                                            <X size={14} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* --- Footer Actions --- */}
                        <div className="pt-10 border-t border-slate-100 flex items-center justify-between">
                            <button 
                                type="button" 
                                onClick={onClose} 
                                className="text-sm font-bold text-slate-400 hover:text-slate-800 transition-colors"
                            >
                                Discard Changes
                            </button>
                            <button 
                                type="submit" 
                                className="px-14 py-4 bg-indigo-600 text-white font-black text-xs uppercase tracking-widest rounded-3xl hover:bg-indigo-700 shadow-2xl shadow-indigo-100 transition-all active:scale-95 flex items-center gap-3 disabled:opacity-50"
                                disabled={loading || !canEditDashboard}
                            >
                                {loading ? <Spinner size="4" color="white" /> : (isEditMode ? 'Update Profile' : 'Commit Profile')}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </Modal>
    );
};

export default CandidateDetailsModal;