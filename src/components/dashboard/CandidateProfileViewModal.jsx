import React from 'react';
import { 
  Mail, 
  Phone, 
  MapPin, 
  Briefcase, 
  Calendar, 
  User, 
  Tag, 
  FileText, 
  ExternalLink,
  ClipboardCheck,
  Building2,
  X
} from 'lucide-react';
import Modal from '../Modal';

const CandidateProfileViewModal = ({ isOpen, onClose, candidate }) => {
  if (!candidate) return null;

  const DetailItem = ({ label, value, icon: Icon, fullWidth = false }) => (
    <div className={`group p-4 bg-white border border-slate-100 rounded-xl hover:border-indigo-200 transition-colors shadow-sm ${fullWidth ? 'md:col-span-2' : ''}`}>
      <div className="flex items-center space-x-3 mb-1">
        <div className="p-1.5 bg-slate-50 rounded-md group-hover:bg-indigo-50 transition-colors">
          <Icon size={16} className="text-slate-500 group-hover:text-indigo-600" />
        </div>
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{label}</span>
      </div>
      <p className="text-slate-900 font-semibold leading-relaxed pl-9">
        {value || <span className="text-slate-300 font-normal italic">Not specified</span>}
      </p>
    </div>
  );

  const skillSet = Array.isArray(candidate.skillSet) 
    ? candidate.skillSet 
    : (candidate.skillSet && typeof candidate.skillSet === 'string' ? JSON.parse(candidate.skillSet) : []);

  const submissionDate = new Date(candidate.submissionDate).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Candidate Intelligence" size="5xl">
      <div className="relative">
        {/* --- HEADER SECTION --- */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-700 p-8 mb-8 text-white shadow-lg">
          <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
            <div className="h-24 w-24 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-4xl font-bold shadow-inner">
              {candidate.firstName.charAt(0)}{candidate.lastName.charAt(0)}
            </div>
            <div className="text-center md:text-left">
              <h2 className="text-3xl font-extrabold tracking-tight">
                {`${candidate.firstName} ${candidate.middleName || ''} ${candidate.lastName}`.trim()}
              </h2>
              <div className="mt-2 flex flex-wrap justify-center md:justify-start gap-3 items-center opacity-90 font-medium">
                <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-full text-sm">
                  <Briefcase size={14} /> {candidate.currentRole}
                </span>
                <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-full text-sm">
                  <MapPin size={14} /> {candidate.currentLocation}
                </span>
              </div>
            </div>
            <div className="md:ml-auto flex gap-3">
               <span className="px-4 py-2 bg-emerald-400/20 border border-emerald-400/30 rounded-lg text-emerald-50 text-xs font-bold uppercase tracking-wider">
                {candidate.remarks || 'New Lead'}
              </span>
            </div>
          </div>
          
          {/* Abstract background shapes */}
          <div className="absolute top-0 right-0 -mr-16 -mt-16 h-64 w-64 rounded-full bg-white/10 blur-3xl"></div>
          <div className="absolute bottom-0 left-0 -ml-16 -mb-16 h-64 w-64 rounded-full bg-indigo-500/20 blur-3xl"></div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* --- MAIN COLUMN --- */}
          <div className="lg:col-span-2 space-y-8">
            <section>
              <div className="flex items-center gap-2 mb-4 text-slate-800">
                <div className="h-6 w-1 bg-indigo-500 rounded-full"></div>
                <h3 className="font-bold text-lg">Contact Information</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <DetailItem icon={Mail} label="Email Address" value={candidate.email} />
                <DetailItem icon={Phone} label="Mobile Number" value={candidate.mobileNumber} />
                <DetailItem icon={MapPin} label="Location" value={candidate.currentLocation} />
                <DetailItem icon={Briefcase} label="Current Designation" value={candidate.currentRole} />
              </div>
            </section>

            <section>
              <div className="flex items-center gap-2 mb-4 text-slate-800">
                <div className="h-6 w-1 bg-violet-500 rounded-full"></div>
                <h3 className="font-bold text-lg">Detailed Remarks</h3>
              </div>
              <div className="p-5 bg-slate-50 border border-slate-200 rounded-xl italic text-slate-700 leading-relaxed shadow-sm">
                "{candidate.remarks || 'No specific interview notes or feedback provided for this candidate yet.'}"
              </div>
            </section>

            <section>
              <div className="flex items-center gap-2 mb-4 text-slate-800">
                <div className="h-6 w-1 bg-sky-500 rounded-full"></div>
                <h3 className="font-bold text-lg">Expertise & Skills</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {skillSet.length > 0 ? (
                  skillSet.map((skill, index) => (
                    <span key={index} className="px-4 py-1.5 bg-white border border-slate-200 text-slate-700 text-sm font-medium rounded-lg hover:border-indigo-300 hover:text-indigo-600 transition-all cursor-default shadow-sm">
                      {skill}
                    </span>
                  ))
                ) : (
                  <p className="text-slate-400 text-sm italic">No skills listed.</p>
                )}
              </div>
            </section>
          </div>

          {/* --- SIDEBAR COLUMN --- */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-slate-900 rounded-2xl p-6 text-white shadow-xl">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                <ClipboardCheck size={14} className="text-indigo-400" /> Submission Data
              </h3>
              
              <div className="space-y-5">
                <div className="flex flex-col gap-1">
                  <span className="text-slate-500 text-[10px] font-bold uppercase">Posting Reference</span>
                  <span className="text-indigo-300 font-mono text-sm">{candidate.postingId || 'REF-N/A'}</span>
                </div>
                
                <div className="flex flex-col gap-1 border-t border-slate-800 pt-4">
                  <span className="text-slate-500 text-[10px] font-bold uppercase">Submission Date</span>
                  <span className="text-sm font-medium flex items-center gap-2">
                    <Calendar size={14} className="text-slate-400" /> {submissionDate}
                  </span>
                </div>

                <div className="flex flex-col gap-1 border-t border-slate-800 pt-4">
                  <span className="text-slate-500 text-[10px] font-bold uppercase">Source / Agency</span>
                  <span className="text-sm font-medium flex items-center gap-2">
                    <Building2 size={14} className="text-slate-400" /> {candidate.clientInfo || 'Direct Hire'}
                  </span>
                </div>

                <div className="flex flex-col gap-1 border-t border-slate-800 pt-4">
                  <span className="text-slate-500 text-[10px] font-bold uppercase">Recruiter / Owner</span>
                  <div className="mt-2 flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-indigo-500/20 flex items-center justify-center text-[10px] border border-indigo-500/40">
                      {candidate.submittedBy?.charAt(0) || 'U'}
                    </div>
                    <span className="text-sm text-slate-300">{candidate.submittedBy}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Mini Call-to-action or reference */}
            <div className="p-4 rounded-xl border border-dashed border-slate-300 flex items-center justify-between group cursor-pointer hover:bg-slate-50 transition-colors">
              <div className="flex items-center gap-3">
                <FileText className="text-slate-400 group-hover:text-indigo-500" />
                <span className="text-sm font-semibold text-slate-600 group-hover:text-slate-900">Reference From</span>
              </div>
              <span className="text-xs text-slate-400">{candidate.referenceFrom || 'None'}</span>
            </div>
          </div>
        </div>

        {/* --- FOOTER ACTIONS --- */}
        <div className="flex items-center justify-end gap-3 mt-10 pt-6 border-t border-slate-100">
          <button 
            onClick={onClose} 
            className="px-5 py-2.5 text-sm font-bold text-slate-600 hover:text-slate-900 transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={onClose} 
            className="px-8 py-2.5 bg-slate-900 text-white text-sm font-bold rounded-xl shadow-lg shadow-slate-200 hover:bg-slate-800 active:scale-95 transition-all"
          >
            Close Profile
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default CandidateProfileViewModal;