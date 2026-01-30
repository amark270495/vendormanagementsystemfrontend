import React from 'react';
// Fixed: Included Building2, Globe, and Layout in imports
import { 
  Mail, Phone, MapPin, Briefcase, Calendar, 
  User, Tag, FileText, UserCheck, Settings, 
  Building2, Layout, Globe, ShieldCheck, Hash, ExternalLink
} from 'lucide-react';
import Modal from '../Modal';

const CandidateProfileViewModal = ({ isOpen, onClose, candidate }) => {
  if (!candidate) return null;

  // StatCard component for consistent, wide data presentation
  const StatCard = ({ label, value, icon: Icon, colorClass = "text-indigo-500", bgClass = "bg-indigo-50" }) => (
    <div className="flex items-center p-5 bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
      <div className={`p-3 rounded-xl ${bgClass} mr-4 shrink-0`}>
        <Icon size={20} className={colorClass} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">{label}</p>
        <p className="text-slate-800 font-bold truncate text-base" title={value}>{value || 'N/A'}</p>
      </div>
    </div>
  );

  const skillSet = Array.isArray(candidate.skillSet) 
    ? candidate.skillSet 
    : (candidate.skillSet && typeof candidate.skillSet === 'string' ? JSON.parse(candidate.skillSet) : []);

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="6xl">
      <div className="space-y-8 antialiased text-slate-900 pb-2">
        
        {/* --- HERO SECTION: FULL WIDTH --- */}
        <div className="relative overflow-hidden bg-slate-900 rounded-[2.5rem] p-8 md:p-10 text-white shadow-2xl">
          <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
          
          <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8">
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="relative shrink-0">
                <div className="w-24 h-24 md:w-32 md:h-32 rounded-[2rem] bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 p-1 shadow-2xl">
                  <div className="w-full h-full rounded-[1.8rem] bg-slate-900 flex items-center justify-center text-4xl md:text-5xl font-black">
                    {candidate.firstName?.charAt(0)}{candidate.lastName?.charAt(0)}
                  </div>
                </div>
                <div className="absolute -bottom-1 -right-1 bg-emerald-500 p-2 rounded-xl border-4 border-slate-900 shadow-lg">
                  <UserCheck size={20} className="text-white" />
                </div>
              </div>

              <div className="text-center md:text-left space-y-3">
                <div className="flex flex-col md:flex-row md:items-center gap-3">
                  <h2 className="text-3xl md:text-5xl font-black tracking-tight">
                    {`${candidate.firstName || ''} ${candidate.lastName || ''}`}
                  </h2>
                  <span className="inline-flex items-center self-center px-4 py-1.5 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-indigo-300 text-[11px] font-black uppercase tracking-widest">
                    <Hash size={12} className="mr-1.5" /> {candidate.postingId || '792052'}
                  </span>
                </div>
                <div className="flex flex-wrap justify-center md:justify-start items-center gap-4 text-slate-300">
                  <span className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-xl border border-white/5 font-bold">
                    <Briefcase size={18} className="text-indigo-400" /> {candidate.currentRole || 'Project Manager 3'}
                  </span>
                  <span className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-xl border border-white/5 font-bold">
                    <MapPin size={18} className="text-indigo-400" /> {candidate.currentLocation || 'Atlanta, GA'}
                  </span>
                </div>
              </div>
            </div>

            <div className="shrink-0 flex flex-col items-center lg:items-end gap-2">
               <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Status</p>
               <div className="flex items-center gap-3 px-8 py-4 bg-emerald-500/10 border border-emerald-500/20 rounded-[1.5rem] text-emerald-400 font-black text-xl">
                 <ShieldCheck size={24} /> {candidate.remarks || 'ACTIVE'}
               </div>
            </div>
          </div>
        </div>

        {/* --- CONTENT ARCHITECTURE --- */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Main Info Hub */}
          <div className="lg:col-span-8 space-y-8">
            <section>
              <div className="flex items-center gap-3 mb-6 px-2">
                <Layout size={20} className="text-indigo-500" />
                <h3 className="text-xl font-black text-slate-800 tracking-tight uppercase tracking-tighter">Contact & Experience</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <StatCard icon={Mail} label="Professional Email" value={candidate.email} colorClass="text-indigo-500" bgClass="bg-indigo-50" />
                <StatCard icon={Phone} label="Mobile Number" value={candidate.mobileNumber} colorClass="text-purple-500" bgClass="bg-purple-50" />
                <StatCard icon={Building2} label="End Client Details" value={candidate.clientInfo || 'DCH / State of Georgia'} colorClass="text-blue-500" bgClass="bg-blue-50" />
                <StatCard icon={Globe} label="Referenced From" value={candidate.referenceFrom || 'Taproot Solutions Portal'} colorClass="text-emerald-500" bgClass="bg-emerald-50" />
              </div>
            </section>

            <section className="p-8 bg-slate-50 border border-slate-100 rounded-[2.5rem] relative">
               <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4">Detailed Profile Remarks</h3>
               <p className="text-slate-700 leading-relaxed text-lg font-semibold italic">
                "{candidate.remarks || "Experienced professional with a demonstrated history of working in complex government IT environments. Strong communication and project leadership skills."}"
               </p>
            </section>
          </div>

          {/* Metadata Sidebar */}
          <div className="lg:col-span-4 space-y-8">
            <section className="bg-white border-2 border-slate-50 rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/40">
              <h3 className="text-sm font-black text-slate-800 mb-8 flex items-center gap-2 uppercase tracking-tight">
                <Settings size={20} className="text-indigo-500" /> System Metadata
              </h3>
              <div className="space-y-6">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Submission Date</span>
                  <span className="text-sm font-bold text-slate-700 bg-slate-50 p-3 rounded-xl flex items-center gap-2">
                    <Calendar size={14} className="text-slate-400" /> Jan 28, 2026
                  </span>
                </div>
                
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Recruiter (Submitted By)</span>
                  <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl min-w-0">
                    <div className="w-8 h-8 rounded-full bg-indigo-500 text-white flex items-center justify-center text-[10px] font-black shrink-0">V</div>
                    <span className="text-sm font-bold text-slate-700 truncate" title={candidate.submittedBy || 'Vanitha.Aare@taprootsolutions.com'}>
                      {candidate.submittedBy || 'Vanitha'}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Resume Worked By</span>
                  <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl min-w-0">
                    <div className="w-8 h-8 rounded-full bg-purple-500 text-white flex items-center justify-center text-[10px] font-black shrink-0">T</div>
                    <span className="text-sm font-bold text-slate-700 truncate" title={candidate.resumeWorkedBy || 'Kolla Bala Teja'}>
                      {candidate.resumeWorkedBy || 'Kolla Bala Teja'}
                    </span>
                  </div>
                </div>
              </div>
            </section>

            <section>
              <h3 className="text-sm font-black text-slate-800 mb-4 flex items-center gap-2 uppercase tracking-tight">
                <Tag size={20} className="text-indigo-500" /> Expertise
              </h3>
              <div className="flex flex-wrap gap-2">
                {skillSet.map((skill, index) => (
                  <span key={index} className="px-4 py-2 bg-white border border-slate-200 text-slate-700 text-xs font-black rounded-xl hover:border-indigo-300 hover:bg-indigo-50 transition-all cursor-default shadow-sm">
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
            className="px-8 py-4 text-slate-400 font-black text-sm uppercase tracking-widest hover:text-slate-900 transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={onClose} 
            className="px-12 py-4 bg-slate-900 hover:bg-black text-white font-black text-sm uppercase tracking-[0.2em] rounded-2xl shadow-2xl transition-all active:scale-95"
          >
            Close View
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default CandidateProfileViewModal;