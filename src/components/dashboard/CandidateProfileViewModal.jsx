import React from 'react';
import { 
  Mail, Phone, MapPin, Briefcase, Calendar, 
  User, Tag, FileText, ClipboardCheck, Building2, 
  ExternalLink, CheckCircle2, UserCheck
} from 'lucide-react';
import Modal from '../Modal';

const CandidateProfileViewModal = ({ isOpen, onClose, candidate }) => {
  if (!candidate) return null;

  // Reusable Detail Component with modern styling
  const DetailItem = ({ label, value, icon: Icon, large = false }) => (
    <div className={`flex flex-col p-4 bg-slate-50/50 border border-slate-100 rounded-xl hover:bg-white hover:shadow-sm transition-all duration-200 ${large ? 'md:col-span-2' : ''}`}>
      <div className="flex items-center space-x-2 mb-1.5">
        <Icon size={14} className="text-indigo-500" />
        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          {label}
        </h4>
      </div>
      <p className="text-slate-700 font-semibold break-words line-clamp-2">
        {value || <span className="text-slate-300 font-normal italic">Not provided</span>}
      </p>
    </div>
  );

  const skillSet = Array.isArray(candidate.skillSet) 
    ? candidate.skillSet 
    : (candidate.skillSet && typeof candidate.skillSet === 'string' ? JSON.parse(candidate.skillSet) : []);

  const submissionDate = new Date(candidate.submissionDate).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Candidate Dossier" size="4xl">
      <div className="space-y-6 antialiased text-slate-900">
        
        {/* --- HEADER: IDENTITY BLOCK --- */}
        <div className="relative overflow-hidden flex flex-col md:flex-row items-center p-6 bg-slate-900 rounded-2xl text-white shadow-lg">
          {/* Background Decoration */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
          
          <div className="relative flex-shrink-0">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-3xl font-bold shadow-inner border border-white/20">
              {candidate.firstName.charAt(0)}{candidate.lastName.charAt(0)}
            </div>
            <div className="absolute -bottom-1 -right-1 bg-emerald-500 p-1.5 rounded-lg border-2 border-slate-900">
              <UserCheck size={12} className="text-white" />
            </div>
          </div>

          <div className="mt-4 md:mt-0 md:ml-6 text-center md:text-left flex-grow">
            <h2 className="text-2xl font-extrabold tracking-tight">
              {`${candidate.firstName} ${candidate.middleName || ''} ${candidate.lastName}`.trim()}
            </h2>
            <div className="flex flex-wrap justify-center md:justify-start items-center gap-3 mt-1.5 text-slate-400 text-sm">
              <span className="flex items-center gap-1.5">
                <Briefcase size={14} className="text-indigo-400" /> {candidate.currentRole}
              </span>
              <span className="hidden md:inline text-slate-700">•</span>
              <span className="flex items-center gap-1.5">
                <MapPin size={14} className="text-indigo-400" /> {candidate.currentLocation}
              </span>
            </div>
          </div>

          <div className="mt-4 md:mt-0 flex flex-col items-end gap-2">
            <span className="px-3 py-1 bg-indigo-500/20 border border-indigo-500/30 rounded-full text-indigo-300 text-[10px] font-black uppercase tracking-tighter">
              {candidate.postingId || 'General Pool'}
            </span>
          </div>
        </div>

        {/* --- GRID: PRIMARY DATA --- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Main Info Column */}
          <div className="md:col-span-2 space-y-6">
            <section>
              <div className="flex items-center justify-between mb-3 px-1">
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <FileText size={16} className="text-indigo-500" /> Contact & Experience
                </h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <DetailItem icon={Mail} label="Email Address" value={candidate.email} />
                <DetailItem icon={Phone} label="Mobile Number" value={candidate.mobileNumber} />
                <DetailItem icon={Building2} label="Client Info" value={candidate.clientInfo} large />
                <DetailItem icon={User} label="Reference From" value={candidate.referenceFrom} large />
              </div>
            </section>

            <section className="p-5 bg-indigo-50/30 border border-indigo-100 rounded-2xl">
              <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                <CheckCircle2 size={16} className="text-indigo-600" /> Professional Remarks
              </h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                {candidate.remarks || "No specific recruiter remarks have been added to this profile yet."}
              </p>
            </section>
          </div>

          {/* Sidebar / Meta Column */}
          <div className="space-y-6">
            <section>
              <h3 className="text-sm font-bold text-slate-800 mb-3 px-1">System Metadata</h3>
              <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-sm">
                <div className="flex justify-between items-center border-b border-slate-50 pb-3">
                  <span className="text-[11px] font-bold text-slate-400 uppercase">Submission</span>
                  <span className="text-sm font-semibold text-slate-700">{submissionDate}</span>
                </div>
                <div className="flex justify-between items-center border-b border-slate-50 pb-3">
                  <span className="text-[11px] font-bold text-slate-400 uppercase">Recruiter</span>
                  <span className="text-sm font-semibold text-slate-700">{candidate.submittedBy}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[11px] font-bold text-slate-400 uppercase">Resume Fixer</span>
                  <span className="text-sm font-semibold text-slate-700">{candidate.resumeWorkedBy || 'N/A'}</span>
                </div>
              </div>
            </section>

            <section>
              <h3 className="text-sm font-bold text-slate-800 mb-3 px-1 flex items-center gap-2">
                <Tag size={16} className="text-indigo-500" /> Top Skills
              </h3>
              <div className="flex flex-wrap gap-2">
                {skillSet.length > 0 ? (
                  skillSet.map((skill, index) => (
                    <span key={index} className="px-3 py-1 bg-white border border-slate-200 text-slate-600 text-xs font-bold rounded-lg shadow-sm hover:border-indigo-300 transition-colors">
                      {skill}
                    </span>
                  ))
                ) : (
                  <span className="text-slate-400 text-xs italic text-center w-full">No skills extracted</span>
                )}
              </div>
            </section>
          </div>

        </div>

        {/* --- FOOTER: ACTIONS --- */}
        <div className="flex items-center justify-between pt-6 border-t border-slate-100 mt-4">
            <div className="flex gap-3">
            <button 
              onClick={onClose} 
              className="px-6 py-2.5 text-slate-500 font-bold text-sm hover:text-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={onClose} 
              className="px-8 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-indigo-200 transition-all active:scale-95"
            >
              Close View
            </button>
          </div>
        </div>

      </div>
    </Modal>
  );
};

export default CandidateProfileViewModal;