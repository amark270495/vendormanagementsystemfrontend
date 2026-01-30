import React, { useState, useEffect } from 'react';
import Modal from '../Modal.jsx';
import Spinner from '../Spinner.jsx';
import { usePermissions } from '../../hooks/usePermissions.js';
import { 
    User, Briefcase, MapPin, Mail, Phone, Plus, X, 
    AlertCircle, Hash, Globe, UserCheck, Zap, 
    ChevronRight, Fingerprint
} from 'lucide-react';

// --- Ultra-Modern Field Component ---
const Field = ({ label, name, type = 'text', required, readOnly, value, onChange, options, disabled, icon: Icon }) => (
    <div className="relative group">
        <label className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 mb-1.5 flex items-center gap-1.5 ml-1">
            {Icon && <Icon size={12} className="text-indigo-500" />}
            {label} {required && <span className="text-rose-500">*</span>}
        </label>
        {options ? (
            <div className="relative">
                <select 
                    name={name} 
                    value={value || ''} 
                    onChange={onChange} 
                    disabled={readOnly || disabled}
                    className="w-full bg-slate-50 border-none rounded-2xl px-4 py-3 text-sm font-bold text-slate-700 ring-1 ring-slate-200 focus:ring-2 focus:ring-indigo-500 transition-all appearance-none cursor-pointer hover:bg-slate-100"
                >
                    <option value="">Select...</option>
                    {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                    <ChevronRight size={16} className="rotate-90" />
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
                className="w-full bg-white border-none rounded-2xl px-4 py-3 text-sm font-bold text-slate-700 ring-1 ring-slate-200 focus:ring-2 focus:ring-indigo-500 transition-all placeholder:text-slate-300 shadow-sm group-hover:shadow-md"
                placeholder={`Candidate ${label}`}
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
                    const parsed = typeof candidateToEdit.skillSet === 'string' ? JSON.parse(candidateToEdit.skillSet) : candidateToEdit.skillSet;
                    setSkills(Array.isArray(parsed) ? parsed : []);
                } catch { setSkills([]); }
            } else { setSkills([]); }
            setError('');
        }
    }, [isOpen, candidateToEdit, jobInfo, isEditMode]);

    const handleChange = (e) => setFormData(p => ({ ...p, [e.target.name]: e.target.value }));

    const handleAddSkill = (e) => {
        e?.preventDefault();
        if (currentSkill.trim() && !skills.includes(currentSkill.trim())) {
            setSkills([...skills, currentSkill.trim()]);
            setCurrentSkill('');
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await onSave({ ...formData, skillSet: skills }, jobInfo?.candidateSlot);
            onClose();
        } catch (err) { setError(err.message); }
        finally { setLoading(false); }
    };

    const statusOptions = [
        "Submitted To Client", "Resume Is Under View", "Resume Shortlisted For Interview", 
        "Interview With Manager", "Client Reject Due To Candidate Not Up To Mark", 
        "Rejected Due To Some Other Reasons", "Candidate Selected", "Resume Submitted Posting Is Still Open",
        "Client Rejected Details Not Mentioned", "Interviews occurring","Rejected Due To Duplicate", "Posting Cancelled"
    ];

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="5xl" padding="p-0 overflow-hidden">
            <div className="flex flex-col md:flex-row min-h-[85vh] bg-slate-50">
                
                {/* --- Left Contextual Sidebar --- */}
                <div className="w-full md:w-80 bg-slate-900 p-8 text-white flex flex-col shrink-0">
                    <div className="mb-8">
                        <div className="h-16 w-16 bg-indigo-500 rounded-3xl flex items-center justify-center mb-6 shadow-2xl shadow-indigo-500/20 ring-4 ring-white/10">
                            <Fingerprint size={32} />
                        </div>
                        <h2 className="text-2xl font-black tracking-tight leading-tight">
                            {isEditMode ? 'Update' : 'Capture'} <br/>
                            <span className="text-indigo-400 font-medium">Candidate</span>
                        </h2>
                    </div>

                    <div className="space-y-6 flex-1">
                        <div className="space-y-1">
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Metadata</p>
                            <div className="flex items-center gap-2 text-sm font-bold text-slate-300">
                                <Hash size={14} className="text-indigo-400" /> {formData.postingId}
                            </div>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Client</p>
                            <div className="flex items-center gap-2 text-sm font-bold text-slate-300">
                                <Globe size={14} className="text-indigo-400" /> {formData.clientInfo || 'General Intake'}
                            </div>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Handler</p>
                            <div className="flex items-center gap-2 text-sm font-bold text-slate-300">
                                <UserCheck size={14} className="text-indigo-400" /> {formData.resumeWorkedBy}
                            </div>
                        </div>
                    </div>

                    <div className="mt-auto pt-8 border-t border-white/10">
                        <p className="text-[10px] font-medium text-slate-400 leading-relaxed italic">
                            All fields marked with an asterisk are required for database integrity.
                        </p>
                    </div>
                </div>

                {/* --- Main Content Pane --- */}
                <div className="flex-1 p-10 overflow-y-auto bg-white rounded-l-[40px] shadow-2xl z-10 -ml-4">
                    {error && (
                        <div className="mb-8 p-4 bg-rose-50 border border-rose-100 rounded-3xl flex items-center gap-3 text-rose-600 animate-in fade-in slide-in-from-top-4">
                            <AlertCircle size={18} />
                            <p className="text-xs font-black uppercase tracking-tight">{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleSave} className="space-y-10">
                        {/* Section: Identity */}
                        <section className="space-y-6">
                            <div className="flex items-center gap-3">
                                <div className="h-2 w-2 bg-indigo-500 rounded-full" />
                                <h3 className="text-sm font-black uppercase tracking-widest text-slate-800">Identity Details</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <Field label="First Name" name="firstName" required value={formData.firstName} onChange={handleChange} disabled={!canEditDashboard} />
                                <Field label="Middle Name" name="middleName" value={formData.middleName} onChange={handleChange} disabled={!canEditDashboard} />
                                <Field label="Last Name" name="lastName" required value={formData.lastName} onChange={handleChange} disabled={!canEditDashboard} />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <Field label="Email" name="email" type="email" required value={formData.email} onChange={handleChange} readOnly={isEditMode} icon={Mail} />
                                <Field label="Phone" name="mobileNumber" required value={formData.mobileNumber} onChange={handleChange} icon={Phone} />
                            </div>
                        </section>

                        {/* Section: Career Status */}
                        <section className="space-y-6">
                            <div className="flex items-center gap-3">
                                <div className="h-2 w-2 bg-indigo-500 rounded-full" />
                                <h3 className="text-sm font-black uppercase tracking-widest text-slate-800">Professional Standing</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <Field label="Current Role" name="currentRole" required value={formData.currentRole} onChange={handleChange} icon={Briefcase} />
                                <Field label="Location" name="currentLocation" required value={formData.currentLocation} onChange={handleChange} icon={MapPin} />
                                <Field label="Pipeline Status" name="remarks" options={statusOptions} value={formData.remarks} onChange={handleChange} icon={Zap} />
                            </div>
                            <Field label="Reference Source" name="referenceFrom" value={formData.referenceFrom} onChange={handleChange} placeholder="Where did you find this candidate?" />
                        </section>

                        {/* Section: Skills (Interactive UX) */}
                        <section className="p-8 bg-slate-50 rounded-[32px] border border-slate-100 space-y-4">
                            <div className="flex justify-between items-center">
                                <h3 className="text-sm font-black uppercase tracking-widest text-slate-800">Core Competencies</h3>
                                <span className="text-[10px] font-bold px-3 py-1 bg-white rounded-full text-indigo-600 shadow-sm border border-slate-100">
                                    {skills.length} Detected
                                </span>
                            </div>
                            
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={currentSkill}
                                    onChange={(e) => setCurrentSkill(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleAddSkill(e)}
                                    className="flex-1 bg-white border-none rounded-2xl px-5 py-3 text-sm font-bold shadow-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                    placeholder="Add skill (e.g. Node.js)..."
                                />
                                <button type="button" onClick={handleAddSkill} className="p-3 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 active:scale-95 transition-all">
                                    <Plus size={20} />
                                </button>
                            </div>

                            <div className="flex flex-wrap gap-2 pt-2">
                                {skills.map(s => (
                                    <div key={s} className="flex items-center gap-2 bg-indigo-100 text-indigo-700 px-4 py-1.5 rounded-full text-xs font-black shadow-sm group">
                                        {s}
                                        <button type="button" onClick={() => setSkills(skills.filter(x => x !== s))} className="hover:text-rose-500 transition-colors">
                                            <X size={14} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* Sticky Footer Actions */}
                        <div className="flex items-center justify-between pt-10 border-t border-slate-100">
                            <button type="button" onClick={onClose} className="text-sm font-black text-slate-400 hover:text-slate-800 transition-colors">
                                Abandon Changes
                            </button>
                            <button 
                                type="submit" 
                                disabled={loading || !canEditDashboard}
                                className="px-12 py-4 bg-slate-900 text-white rounded-[24px] font-black text-sm hover:bg-black hover:translate-y-[-2px] active:scale-95 transition-all shadow-xl shadow-slate-200 flex items-center gap-3 disabled:opacity-50"
                            >
                                {loading ? <Spinner size="4" /> : <UserCheck size={18} />}
                                {isEditMode ? 'Sync Profile' : 'Commit Candidate'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </Modal>
    );
};

export default CandidateDetailsModal;