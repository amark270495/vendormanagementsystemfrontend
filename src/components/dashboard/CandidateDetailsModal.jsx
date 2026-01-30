import React, { useState, useEffect } from 'react';
import Modal from '../Modal.jsx';
import Spinner from '../Spinner.jsx';
import { usePermissions } from '../../hooks/usePermissions.js';
import { 
    User, Briefcase, MapPin, Mail, Phone, Plus, X, 
    AlertCircle, Sparkles, ShieldCheck, 
    AtSign, Smartphone, ExternalLink, Command
} from 'lucide-react';

// --- Premium Input Component ---
const InputField = ({ label, name, type = 'text', required, readOnly, value, onChange, options, disabled, icon: Icon }) => (
    <div className="flex flex-col gap-2 group">
        <div className="flex items-center justify-between px-1">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.1em] flex items-center gap-1.5">
                {Icon && <Icon size={12} className="text-indigo-500/70" />}
                {label}
            </label>
            {required && <span className="text-[10px] bg-rose-50 text-rose-500 px-1.5 py-0.5 rounded font-bold tracking-tighter">REQUIRED</span>}
        </div>
        
        {options ? (
            <div className="relative">
                <select 
                    name={name} 
                    value={value || ''} 
                    onChange={onChange} 
                    disabled={readOnly || disabled}
                    className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl px-4 py-3 text-sm font-semibold text-slate-700 focus:bg-white focus:border-indigo-500/20 focus:ring-4 focus:ring-indigo-500/5 transition-all outline-none appearance-none cursor-pointer"
                >
                    <option value="">Choose status...</option>
                    {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-40">
                    <Command size={14} />
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
                placeholder={`Type ${label.toLowerCase()}...`}
                className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl px-4 py-3 text-sm font-semibold text-slate-700 placeholder:text-slate-300 focus:bg-white focus:border-indigo-500/20 focus:ring-4 focus:ring-indigo-500/5 transition-all outline-none"
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
        <Modal isOpen={isOpen} onClose={onClose} size="4xl" padding="p-0 overflow-hidden">
            <div className="flex flex-col max-h-[90vh] bg-white">
                
                {/* --- Dynamic Profile Header --- */}
                <div className="relative px-8 pt-8 pb-6 bg-slate-900 overflow-hidden shrink-0">
                    <div className="absolute top-0 right-0 p-12 opacity-10 pointer-events-none">
                        <Sparkles size={160} className="text-white" />
                    </div>
                    
                    <div className="relative flex items-end justify-between">
                        <div className="flex items-center gap-6">
                            <div className="h-20 w-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-[2rem] flex items-center justify-center text-white shadow-2xl ring-4 ring-white/10">
                                <User size={40} strokeWidth={1.5} />
                            </div>
                            <div>
                                <div className="flex items-center gap-3 mb-1">
                                    <h2 className="text-3xl font-black text-white tracking-tight leading-none">
                                        {formData.firstName ? `${formData.firstName} ${formData.lastName}` : "New Talent"}
                                    </h2>
                                    {isEditMode && (
                                        <span className="px-2 py-1 bg-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase rounded-md border border-emerald-500/30">
                                            Verified Record
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center gap-4 text-slate-400 text-sm font-medium">
                                    <span className="flex items-center gap-1.5"><ShieldCheck size={14} className="text-indigo-400" /> {formData.postingId || 'Intake'}</span>
                                    <span className="w-1 h-1 bg-slate-600 rounded-full" />
                                    <span className="flex items-center gap-1.5"><MapPin size={14} className="text-indigo-400" /> {formData.currentLocation || 'Location TBD'}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* --- Content Body --- */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-8 bg-slate-50/50">
                    {error && (
                        <div className="mb-8 p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3 text-rose-700 animate-in fade-in slide-in-from-top-4">
                            <AlertCircle size={20} />
                            <p className="text-xs font-bold uppercase tracking-tight">{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleSave} className="space-y-8">
                        {/* Section: Contact Intelligence */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <section className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 space-y-6">
                                <h3 className="text-xs font-black text-slate-900 uppercase tracking-[0.2em] border-b border-slate-50 pb-4">Personal Identifiers</h3>
                                <div className="grid grid-cols-1 gap-5">
                                    <div className="grid grid-cols-2 gap-4">
                                        <InputField label="First Name" name="firstName" required value={formData.firstName} onChange={handleChange} disabled={!canEditDashboard} />
                                        <InputField label="Last Name" name="lastName" required value={formData.lastName} onChange={handleChange} disabled={!canEditDashboard} />
                                    </div>
                                    <InputField label="Email Address" name="email" type="email" required icon={AtSign} value={formData.email} onChange={handleChange} readOnly={isEditMode} />
                                    <InputField label="Mobile Connection" name="mobileNumber" required icon={Smartphone} value={formData.mobileNumber} onChange={handleChange} />
                                </div>
                            </section>

                            <section className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 space-y-6">
                                <h3 className="text-xs font-black text-slate-900 uppercase tracking-[0.2em] border-b border-slate-50 pb-4">Career Context</h3>
                                <div className="grid grid-cols-1 gap-5">
                                    <InputField label="Current Professional Role" name="currentRole" required icon={Briefcase} value={formData.currentRole} onChange={handleChange} />
                                    <InputField label="Geographic Location" name="currentLocation" required icon={MapPin} value={formData.currentLocation} onChange={handleChange} />
                                    <InputField label="Placement Status" name="remarks" options={statusOptions} value={formData.remarks} onChange={handleChange} />
                                </div>
                            </section>
                        </div>

                        {/* Section: Technical Stack (Visual Chips) */}
                        <section className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 space-y-6">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xs font-black text-slate-900 uppercase tracking-[0.2em]">Core Competencies</h3>
                                <span className="text-[10px] font-bold text-slate-400">{skills.length} skills indexed</span>
                            </div>
                            
                            <div className="flex gap-3">
                                <input
                                    type="text"
                                    value={currentSkill}
                                    onChange={(e) => setCurrentSkill(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleAddSkill(e)}
                                    className="flex-1 bg-slate-50 rounded-2xl px-6 py-4 text-sm font-bold border-2 border-transparent focus:bg-white focus:border-indigo-500/20 outline-none transition-all shadow-inner"
                                    placeholder="Enter technical skill..."
                                />
                                <button type="button" onClick={handleAddSkill} className="px-6 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 transition-all shadow-lg active:scale-95">
                                    <Plus size={24} />
                                </button>
                            </div>

                            <div className="flex flex-wrap gap-2">
                                {skills.map(s => (
                                    <div key={s} className="flex items-center gap-2 bg-indigo-50 text-indigo-700 px-5 py-2 rounded-xl text-xs font-bold border border-indigo-100 group hover:bg-indigo-600 hover:text-white transition-all duration-300">
                                        {s}
                                        <X size={14} className="cursor-pointer opacity-50 hover:opacity-100" onClick={() => setSkills(skills.filter(x => x !== s))} />
                                    </div>
                                ))}
                            </div>
                        </section>
                    </form>
                </div>

                {/* --- Precision Footer --- */}
                <div className="px-10 py-6 bg-white border-t border-slate-100 flex items-center justify-between shrink-0">
                    <button onClick={onClose} className="flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-slate-900 transition-colors group">
                        <X size={16} /> Close Without Sync
                    </button>
                    <div className="flex items-center gap-6">
                        {loading && <div className="flex items-center gap-2 text-xs font-black text-indigo-500 animate-pulse"><Sparkles size={14}/> Processing...</div>}
                        <button 
                            onClick={handleSave} 
                            disabled={loading || !canEditDashboard}
                            className="bg-slate-900 text-white px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-black transition-all shadow-xl shadow-slate-200 active:scale-95 disabled:opacity-30 flex items-center gap-3"
                        >
                            {isEditMode ? 'Synchronize Record' : 'Commit to Database'}
                            <ExternalLink size={14} />
                        </button>
                    </div>
                </div>
            </div>
        </Modal>
    );
};

export default CandidateDetailsModal;