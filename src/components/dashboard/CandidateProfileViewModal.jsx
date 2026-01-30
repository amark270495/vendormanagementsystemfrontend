import React from 'react';
import { 
  Mail, Phone, MapPin, Briefcase, Calendar, 
  User, Tag, FileText, ClipboardCheck, Building2, 
  ChevronRight, Layers, Award
} from 'lucide-react';
import Modal from '../Modal';

const CandidateProfileViewModal = ({ isOpen, onClose, candidate }) => {
  if (!candidate) return null;

  // Custom Color Helpers
  const colors = {
    cyan: '#41E7F2',
    mint: '#54F7C4',
    lavender: '#C6ABF5'
  };

  const DetailCard = ({ label, value, icon: Icon }) => (
    <div className="group relative p-4 bg-white border border-slate-100 rounded-2xl hover:shadow-md transition-all">
      <div className="flex items-start justify-between">
        <div className="flex flex-col">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{label}</span>
          <p className="text-slate-800 font-bold leading-tight">{value || 'N/A'}</p>
        </div>
        <div 
          className="p-2 rounded-xl"
          style={{ backgroundColor: `${colors.lavender}20` }} // 20% opacity
        >
          <Icon size={18} style={{ color: colors.cyan }} strokeWidth={2.5} />
        </div>
      </div>
      <div 
        className="absolute bottom-0 left-0 h-1 w-0 group-hover:w-full transition-all duration-300 rounded-b-2xl"
        style={{ backgroundColor: colors.mint }}
      ></div>
    </div>
  );

  const skillSet = Array.isArray(candidate.skillSet) 
    ? candidate.skillSet 
    : (candidate.skillSet && typeof candidate.skillSet === 'string' ? JSON.parse(candidate.skillSet) : []);

  const submissionDate = new Date(candidate.submissionDate).toLocaleDateString();

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="5xl">
      <div className="p-1">
        {/* --- HEADER: VIBRANT GRADIENT --- */}
        <div 
          className="rounded-3xl p-8 mb-8 text-slate-900 relative overflow-hidden shadow-2xl shadow-cyan-100/50"
          style={{ background: `linear-gradient(135deg, ${colors.cyan} 0%, ${colors.mint} 50%, ${colors.lavender} 100%)` }}
        >
          <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
            <div className="h-20 w-20 rounded-2xl bg-white/90 backdrop-blur-sm shadow-xl flex items-center justify-center text-3xl font-black" style={{ color: colors.cyan }}>
              {candidate.firstName.charAt(0)}{candidate.lastName.charAt(0)}
            </div>
            
            <div className="text-center md:text-left">
              <h2 className="text-3xl font-black tracking-tight text-slate-900">
                {`${candidate.firstName} ${candidate.lastName}`}
              </h2>
              <div className="mt-2 flex flex-wrap gap-2">
                <span className="px-3 py-1 bg-white/40 backdrop-blur-md rounded-lg text-xs font-bold flex items-center gap-1">
                  <Briefcase size={12} /> {candidate.currentRole}
                </span>
                <span className="px-3 py-1 bg-white/40 backdrop-blur-md rounded-lg text-xs font-bold flex items-center gap-1">
                  <MapPin size={12} /> {candidate.currentLocation}
                </span>
              </div>
            </div>

            <div className="md:ml-auto">
                <div className="bg-white/90 px-6 py-3 rounded-2xl shadow-lg border border-white">
                    <p className="text-[10px] font-black uppercase text-slate-400">Current Status</p>
                    <p className="font-bold text-slate-800 flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full animate-pulse" style={{ backgroundColor: colors.cyan }}></span>
                        {candidate.remarks || 'Under Review'}
                    </p>
                </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* --- LEFT: MAIN INFO --- */}
          <div className="lg:col-span-3 space-y-6">
            <section>
              <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <User size={16} style={{ color: colors.lavender }} /> Profile Intelligence
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <DetailCard icon={Mail} label="Email Address" value={candidate.email} />
                <DetailCard icon={Phone} label="Contact" value={candidate.mobileNumber} />
                <DetailCard icon={Layers} label="Experience" value={candidate.currentRole} />
              </div>
            </section>

            <section className="bg-slate-50 rounded-3xl p-6 border border-slate-100">
              <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <Award size={16} style={{ color: colors.mint }} /> Technical Skill Set
              </h3>
              <div className="flex flex-wrap gap-2">
                {skillSet.map((skill, i) => (
                  <span 
                    key={i} 
                    className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 shadow-sm"
                    style={{ borderLeft: `4px solid ${colors.cyan}` }}
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </section>

            <section className="p-6">
               <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-2">Remarks & Feedback</h3>
               <p className="text-slate-600 leading-relaxed font-medium">
                {candidate.remarks || "No additional remarks have been recorded for this candidate profile."}
               </p>
            </section>
          </div>

          {/* --- RIGHT: SUBMISSION SIDEBAR --- */}
          <div className="lg:col-span-1">
            <div className="rounded-3xl p-6 border-2 border-slate-50 space-y-6 sticky top-0">
              <div className="space-y-4">
                <div className="p-4 rounded-2xl" style={{ backgroundColor: `${colors.lavender}10` }}>
                  <span className="text-[10px] font-black text-slate-400 uppercase">Submitted By</span>
                  <div className="flex items-center gap-3 mt-2">
                    <div className="h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ backgroundColor: colors.lavender }}>
                        {candidate.submittedBy?.charAt(0)}
                    </div>
                    <span className="text-sm font-bold text-slate-700">{candidate.submittedBy}</span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl" style={{ backgroundColor: `${colors.mint}10` }}>
                  <span className="text-[10px] font-black text-slate-400 uppercase">Agency Source</span>
                  <p className="text-sm font-bold text-slate-700 mt-1 flex items-center gap-2">
                    <Building2 size={14} style={{ color: colors.mint }} /> {candidate.clientInfo || 'Internal'}
                  </p>
                </div>

                <div className="p-4 rounded-2xl" style={{ backgroundColor: `${colors.cyan}10` }}>
                  <span className="text-[10px] font-black text-slate-400 uppercase">Date Logged</span>
                  <p className="text-sm font-bold text-slate-700 mt-1 flex items-center gap-2">
                    <Calendar size={14} style={{ color: colors.cyan }} /> {submissionDate}
                  </p>
                </div>
              </div>

              <button 
                className="w-full py-4 rounded-2xl font-black text-sm uppercase tracking-tighter shadow-lg transition-transform hover:-translate-y-1 active:scale-95 text-white"
                style={{ background: `linear-gradient(to right, ${colors.cyan}, ${colors.mint})` }}
              >
                Download CV
              </button>
            </div>
          </div>
        </div>

        {/* --- FOOTER --- */}
        <div className="mt-8 flex justify-end">
            <button 
                onClick={onClose}
                className="px-8 py-3 rounded-xl font-bold text-slate-400 hover:text-slate-800 transition-colors"
            >
                Dismiss
            </button>
        </div>
      </div>
    </Modal>
  );
};

export default CandidateProfileViewModal;