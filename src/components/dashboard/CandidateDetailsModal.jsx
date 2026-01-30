import React, { useState, useEffect } from 'react';
import Modal from '../Modal.jsx';
import Spinner from '../Spinner.jsx';
import { usePermissions } from '../../hooks/usePermissions.js';
import { 
    User, 
    Briefcase, 
    MapPin, 
    Mail, 
    Phone, 
    Plus, 
    X, 
    AlertCircle, 
    ClipboardList,
    Layers,
    Tag
} from 'lucide-react';

// --- Modern Form Input Component ---
const FormInput = ({ label, name, type = 'text', required = false, readOnly = false, value, onChange, options, disabled = false, icon: Icon }) => (
    <div className="flex flex-col gap-1.5">
        <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1 flex items-center gap-2">
            {Icon && <Icon size={12} className="text-slate-400" />}
            {label} {required && <span className="text-rose-500">*</span>}
        </label>
        {options ? (
            <select 
                name={name} 
                value={value || ''} 
                onChange={onChange} 
                className={`
                    w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-700
                    transition-all focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none appearance-none
                    ${readOnly ? 'bg-slate-100 cursor-not-allowed opacity-70' : 'hover:border-slate-300'}
                `}
                required={required} 
                disabled={readOnly || disabled}
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
                placeholder={`Enter ${label.toLowerCase()}...`}
                className={`
                    w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-700
                    transition-all focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none
                    ${readOnly ? 'bg-slate-50 border-dashed cursor-not-allowed text-slate-500' : 'hover:border-slate-300'}
                `}
                required={required} 
                readOnly={readOnly}
                disabled={readOnly || disabled} 
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
        if (!canEditDashboard) return setError("Permission denied.");
        
        setLoading(true);
        try {
            const finalFormData = { ...formData, skillSet: skills };
            await onSave(finalFormData, jobInfo?.candidateSlot);
            onClose();
        } catch (err) {
            setError(err.message || "Failed to save details.");
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
        <Modal 
            isOpen={isOpen} 
            onClose={onClose} 
            title={isEditMode ? "Update Talent Profile" : "Register New Candidate"} 
            size="3xl"
        >
            {error && (
                <div className="mb-6 bg-rose-50 border border-rose-100 p-4 rounded-2xl flex items-center gap-3 text-rose-600 animate-in fade-in slide-in-from-top-2">
                    <AlertCircle size={20} />
                    <p className="text-sm font-bold">{error}</p>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">
                
                {/* --- Section 1: Job Context Cards --- */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <p className="text-[10px] font-black uppercase tracking-tighter text-slate-400 mb-1">Assigned Posting</p>
                        <p className="text-sm font-bold text-slate-700">{formData.postingId || 'N/A'}</p>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <p className="text-[10px] font-black uppercase tracking-tighter text-slate-400 mb-1">Client Pipeline</p>
                        <p className="text-sm font-bold text-slate-700">{formData.clientInfo || 'General'}</p>
                    </div>
                    <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100/50">
                        <p className="text-[10px] font-black uppercase tracking-tighter text-indigo-400 mb-1">Recruiter</p>
                        <p className="text-sm font-bold text-indigo-700">{formData.resumeWorkedBy || 'System'}</p>
                    </div>
                </div>

                {/* --- Section 2: Personal Profile --- */}
                <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm space-y-6">
                    <div className="flex items-center gap-3 border-b border-slate-50 pb-4">
                        <div className="p-2 bg-indigo-600 rounded-xl text-white shadow-lg shadow-indigo-100">
                            <User size={20} />
                        </div>
                        <h3 className="text-lg font-black text-slate-800 tracking-tight">Personal Profile</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        <FormInput label="First Name" name="firstName" required value={formData.firstName} onChange={handleChange} disabled={!canEditDashboard} />
                        <FormInput label="Middle Name" name="middleName" value={formData.middleName} onChange={handleChange} disabled={!canEditDashboard} />
                        <FormInput label="Last Name" name="lastName" required value={formData.lastName} onChange={handleChange} disabled={!canEditDashboard} />
                        
                        <FormInput label="Mobile" name="mobileNumber" type="tel" required value={formData.mobileNumber} onChange={handleChange} disabled={!canEditDashboard} icon={Phone} />
                        <FormInput 
                            label="Email Address" name="email" type="email" required 
                            value={formData.email} onChange={handleChange} 
                            readOnly={isEditMode} disabled={isEditMode || !canEditDashboard} icon={Mail}
                        />
                        <FormInput label="Reference" name="referenceFrom" value={formData.referenceFrom} onChange={handleChange} disabled={!canEditDashboard} icon={Layers} />
                    </div>
                </div>
                
                {/* --- Section 3: Professional & Status --- */}
                <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm space-y-6">
                    <div className="flex items-center gap-3 border-b border-slate-50 pb-4">
                        <div className="p-2 bg-emerald-500 rounded-xl text-white shadow-lg shadow-emerald-100">
                            <Briefcase size={20} />
                        </div>
                        <h3 className="text-lg font-black text-slate-800 tracking-tight">Experience & Status</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        <FormInput label="Current Role" name="currentRole" required value={formData.currentRole} onChange={handleChange} disabled={!canEditDashboard} icon={Briefcase} />
                        <FormInput label="Location" name="currentLocation" required value={formData.currentLocation} onChange={handleChange} disabled={!canEditDashboard} icon={MapPin} />
                        <FormInput 
                            label="Application Status" name="remarks" options={remarksOptions} 
                            value={formData.remarks} onChange={handleChange} disabled={!canEditDashboard} icon={ClipboardList}
                        />
                    </div>
                </div>

                {/* --- Section 4: Dynamic Skill Set --- */}
                <div className="bg-slate-900 rounded-3xl p-6 shadow-xl shadow-slate-200 space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-white/10 rounded-xl text-white">
                                <Tag size={20} />
                            </div>
                            <h3 className="text-lg font-black text-white tracking-tight">Skill Inventory</h3>
                        </div>
                        <span className="text-[10px] font-black uppercase text-slate-400 bg-white/5 px-3 py-1 rounded-full border border-white/10">
                            {skills.length} Total Skills
                        </span>
                    </div>

                    <div className="flex items-center gap-3">
                        <input
                            type="text"
                            value={currentSkill}
                            onChange={(e) => setCurrentSkill(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddSkill(); } }}
                            className="flex-grow bg-white/5 border border-white/10 rounded-2xl px-5 py-3 text-white text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all placeholder:text-slate-500"
                            placeholder="Add a core competency (e.g. React, Python)..."
                            disabled={!canEditDashboard}
                        />
                        <button 
                            type="button" 
                            onClick={handleAddSkill} 
                            className="p-3 bg-indigo-500 text-white rounded-2xl hover:bg-indigo-600 transition-all shadow-lg active:scale-95 disabled:opacity-50"
                            disabled={!canEditDashboard}
                        >
                            <Plus size={24} />
                        </button>
                    </div>

                    <div className="flex flex-wrap gap-2 pt-2">
                        {skills.length === 0 && <p className="text-xs text-slate-500 italic px-1">No skills listed yet...</p>}
                        {skills.map(skill => (
                            <div key={skill} className="flex items-center gap-2 bg-white/10 text-white text-xs font-bold px-4 py-2 rounded-xl border border-white/10 hover:bg-white/20 transition-all">
                                {skill}
                                <button
                                    type="button"
                                    onClick={() => handleRemoveSkill(skill)}
                                    className="text-slate-400 hover:text-rose-400"
                                    disabled={!canEditDashboard}
                                >
                                    <X size={14} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* --- Footer Actions --- */}
                <div className="flex justify-end items-center gap-4 pt-4">
                    <button 
                        type="button" 
                        onClick={onClose} 
                        className="px-6 py-3 text-sm font-bold text-slate-400 hover:text-slate-900 transition-colors"
                    >
                        Discard
                    </button>
                    <button 
                        type="submit" 
                        className="px-10 py-3 bg-indigo-600 text-white font-black rounded-2xl hover:bg-indigo-700 shadow-xl shadow-indigo-200 transition-all active:scale-95 flex items-center gap-3 disabled:opacity-50" 
                        disabled={loading || !canEditDashboard}
                    >
                        {loading ? <Spinner size="4" color="white" /> : 'Update Candidate'}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default CandidateDetailsModal;