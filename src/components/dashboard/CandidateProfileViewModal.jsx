import React from 'react';
// Fixed: Included all used icons in the import
import { 
  Mail, Phone, MapPin, Briefcase, Calendar, 
  User, Tag, FileText, UserCheck, Settings, 
  Building2, Layout, Globe, ShieldCheck, Hash
} from 'lucide-react';
import Modal from '../Modal';

const CandidateProfileViewModal = ({ isOpen, onClose, candidate }) => {
  if (!candidate) return null;

  // Modernized Detail Card for the wide layout
  const StatCard = ({ label, value, icon: Icon, color = "indigo" }) => (
    <div className="flex items-center p-5 bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
      <div className={`p-3 rounded-xl bg-${color}-50 mr-4`}>
        <Icon size={20} className={`text-${color}-500`} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">{label}</p>
        <p className="text-slate-700 font-bold truncate" title={value}>{value || 'N/A'}</p>
      </div>
    </div>
  );

  const skillSet = Array.isArray(candidate.skillSet) 
    ? candidate.skillSet 
    : (candidate.skillSet && typeof candidate.skillSet === 'string' ? JSON.parse(candidate.skillSet) : []);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Executive Candidate Overview" size="5xl">
      <div className="space-y-8 antialiased text-slate-900 pb-4">
        
        {/* --- HERO SECTION: ULTRA WIDE PROFILE --- */}
        <div className="relative overflow-hidden bg-slate-900 rounded-[2rem] p-8 text-white shadow-2xl">
          {/* Decorative Elements */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/10 rounded-full -ml-32 -mb-32 blur-3xl"></div>

          <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="relative">
                <div className="w-28 h-28 rounded-3xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 p-1 shadow-2xl">
                  <div className="w-full h-full rounded-[1.4rem] bg-slate-900 flex items-center justify-center text-4xl font-black">
                    {candidate.firstName?.charAt(0)}{candidate.lastName?.charAt(0)}
                  </div>
                </div>
                <div className="absolute -bottom-2 -right-2 bg-emerald-500 p-2 rounded-xl border-4 border-slate-900 shadow-lg">
                  <UserCheck size={16} className="text-white" />
                </div>
              </div>

              <div className="text-center md:text-left">
                <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
                  <h2 className="text-4xl font-black tracking-tight leading-none">
                    {`${candidate.firstName || ''} ${candidate.lastName || ''}`}
                  </h2>
                  <span className="inline-flex items-center px-3 py-1 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-indigo-300 text-[10px] font-black uppercase tracking-widest">
                    <Hash size={10} className="mr-1" /> {candidate.postingId || '792052'}
                  </span>
                </div>
                <div className="flex flex-wrap justify-center md:justify-start items-center gap-5 mt-4 text-slate-300 font-medium">
                  <span className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-xl border border-white/5">
                    <Briefcase size={16} className="text-indigo-400" /> {candidate.currentRole}
                  </span>
                  <span className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-xl border border-white/5">
                    <MapPin size={16} className="text-indigo-400" /> {candidate.currentLocation}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-center lg:items-end gap-3">
               <div className="text-right">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-1">Current Status</p>
                  <div className="flex items-center gap-2 px-6 py-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-400 font-black text-lg">
                    <ShieldCheck size={20} />
                    {candidate.remarks || 'ACTIVE'}
                  </div>
               </div>
            </div>
          </div>
        </div>

        {/* --- MAIN CONTENT GRID --- */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Stats & Experience (Wide) */}
          <div className="lg:col-span-8 space-y-8">
            <section>
              <div className="flex items-center gap-3 mb-6">
                <div className="h-8 w-1.5 bg-indigo-500 rounded-full"></div>
                <h3 className="text-xl font-black text-slate-800 tracking-tight">Core Information</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <StatCard icon={Mail} label="Professional Email" value={candidate.email} color="indigo" />
                <StatCard icon={Phone} label="Primary Contact" value={candidate.mobileNumber} color="purple" />
                <StatCard icon={Building2} label="End Client / Agency" value={candidate.clientInfo} color="blue" />
                <StatCard icon={Globe} label="Sourced Via" value={candidate.referenceFrom || 'LinkedIn'} color="emerald" />
              </div>
            </section>

            <section className="p-8 bg-slate-50 border border-slate-100 rounded-[2rem] relative overflow-hidden">
               <div className="absolute top-0 right-0 p-4 opacity-10">
                  <FileText size={80} className="text-slate-900" />
               </div>
               <h3 className="text-lg font-black text-slate-800 mb-4">Internal Interviewer Remarks</h3>
               <p className="text-slate-600 leading-loose text-lg font-medium italic">
                "{candidate.remarks || "Candidate demonstrates strong technical proficiency with the requested tech stack. Ready for client submission."}"
               </p>
            </section>
          </div>

          {/* Right Column: Metadata & Skills (Compact Sidebar) */}
          <div className="lg:col-span-4 space-y-8">
            <section className="bg-white border-2 border-slate-50 rounded-[2rem] p-6 shadow-xl shadow-slate-200/50">
              <h3 className="text-sm font-black text-slate-800 mb-6 flex items-center gap-2 uppercase tracking-tighter">
                <Settings size={18} className="text-indigo-500" /> Ownership Details
              </h3>
              <div className="space-y-5">
                <div className="flex justify-between items-center group">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Submission Date</span>
                  <span className="text-sm font-bold text-slate-700 bg-slate-50 px-3 py-1 rounded-lg">Jan 28, 2026</span>
                </div>
                
                {/* Fixed Overflow for Vanitha's Email */}
                <div className="flex justify-between items-center group">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest shrink-0">Recruiter</span>
                  <span 
                    className="text-sm font-bold text-indigo-600 truncate max-w-[180px] text-right" 
                    title={candidate.submittedBy || 'Vanitha.Aare@taprootsolutions.com'}
                  >
                    {candidate.submittedBy || 'Vanitha'}
                  </span>
                </div>

                <div className="flex justify-between items-center group border-t border-slate-50 pt-5">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest shrink-0">Resume Fixer</span>
                  <span className="text-sm font-bold text-slate-700 truncate max-w-[180px] text-right">
                    {candidate.resumeWorkedBy || 'Kolla Bala Teja'}
                  </span>
                </div>
              </div>
            </section>

            <section>
              <h3 className="text-sm font-black text-slate-800 mb-4 flex items-center gap-2 uppercase tracking-tighter">
                <Tag size={18} className="text-indigo-500" /> Tech Stack Expertise
              </h3>
              <div className="flex flex-wrap gap-2">
                {skillSet.map((skill, index) => (
                  <span key={index} className="px-4 py-2 bg-indigo-50/50 border border-indigo-100 text-indigo-700 text-xs font-black rounded-xl hover:bg-indigo-50 transition-colors">
                    {skill}
                  </span>
                ))}
              </div>
            </section>
          </div>
        </div>

        {/* --- FOOTER --- */}
        <div className="flex items-center justify-end gap-4 pt-8 border-t border-slate-100 mt-6">
          <button 
            onClick={onClose} 
            className="px-8 py-3 text-slate-400 font-black text-sm uppercase tracking-widest hover:text-slate-900 transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={onClose} 
            className="px-12 py-4 bg-slate-900 hover:bg-black text-white font-black text-sm uppercase tracking-[0.2em] rounded-2xl shadow-2xl shadow-indigo-200 active:scale-95 transition-all"
          >
            Finish Review
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default CandidateProfileViewModal;