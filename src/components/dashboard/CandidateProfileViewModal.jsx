import React from 'react';
import {
  Mail, Phone, MapPin, Briefcase,
  UserCheck, Settings, Building2,
  Globe, ShieldCheck, Hash, Tag, FileText
} from 'lucide-react';
import Modal from '../Modal';

const colorStyles = {
  indigo: {
    bg: "bg-indigo-50",
    icon: "text-indigo-600",
    ring: "ring-indigo-100"
  },
  purple: {
    bg: "bg-purple-50",
    icon: "text-purple-600",
    ring: "ring-purple-100"
  },
  emerald: {
    bg: "bg-emerald-50",
    icon: "text-emerald-600",
    ring: "ring-emerald-100"
  },
  blue: {
    bg: "bg-blue-50",
    icon: "text-blue-600",
    ring: "ring-blue-100"
  }
};

const StatCard = ({ label, value, icon: Icon, color = "indigo" }) => {
  const c = colorStyles[color] || colorStyles.indigo;

  return (
    <div className={`group bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-lg transition-all duration-300 ring-1 ${c.ring}`}>
      <div className="flex items-start gap-4">
        <div className={`p-3 rounded-xl ${c.bg} group-hover:scale-110 transition`}>
          <Icon size={20} className={c.icon} />
        </div>

        <div className="min-w-0">
          <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">
            {label}
          </p>
          <p className="font-bold text-slate-800 truncate" title={value}>
            {value || "N/A"}
          </p>
        </div>
      </div>
    </div>
  );
};

const CandidateProfileViewModal = ({ isOpen, onClose, candidate }) => {
  if (!candidate) return null;

  let skillSet = [];
  try {
    skillSet = Array.isArray(candidate.skillSet)
      ? candidate.skillSet
      : JSON.parse(candidate.skillSet || "[]");
  } catch {
    skillSet = [];
  }

  const initials =
    (candidate.firstName?.[0] || "") +
    (candidate.lastName?.[0] || "");

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="" size="6xl">
      <div className="max-h-[85vh] overflow-y-auto">

        {/* ================= HERO ================= */}
        <div className="relative rounded-[2rem] overflow-hidden p-10 text-white bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900 shadow-2xl">

          <div className="absolute inset-0 opacity-20">
            <div className="absolute -top-32 -right-32 w-96 h-96 bg-indigo-500 rounded-full blur-3xl"/>
            <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-purple-500 rounded-full blur-3xl"/>
          </div>

          <div className="relative z-10 flex flex-col xl:flex-row gap-10 justify-between">

            {/* Left */}
            <div className="flex flex-col md:flex-row gap-6 items-center">
              <div className="relative">
                <div className="w-28 h-28 rounded-3xl bg-gradient-to-tr from-indigo-500 to-pink-500 p-1 shadow-xl">
                  <div className="w-full h-full rounded-[1.3rem] bg-slate-900 flex items-center justify-center text-4xl font-black">
                    {initials || "NA"}
                  </div>
                </div>

                <div className="absolute -bottom-2 -right-2 bg-emerald-500 p-2 rounded-xl border-4 border-slate-900">
                  <UserCheck size={16} />
                </div>
              </div>

              <div className="text-center md:text-left">
                <h2 className="text-4xl font-black tracking-tight">
                  {candidate.firstName} {candidate.lastName}
                </h2>

                <div className="flex flex-wrap gap-3 mt-4 justify-center md:justify-start">
                  <span className="chip">
                    <Briefcase size={14}/> {candidate.currentRole}
                  </span>
                  <span className="chip">
                    <MapPin size={14}/> {candidate.currentLocation}
                  </span>
                  <span className="chip bg-white/15 border-white/20 text-indigo-200">
                    <Hash size={12}/> {candidate.postingId || "—"}
                  </span>
                </div>
              </div>
            </div>

            {/* Right */}
            <div className="text-right">
              <p className="text-xs tracking-widest uppercase text-slate-400 font-bold mb-2">
                Status
              </p>
              <div className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 font-black">
                <ShieldCheck size={18}/>
                {candidate.remarks || "Active"}
              </div>
            </div>
          </div>
        </div>

        {/* ================= BODY ================= */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 mt-10">

          {/* LEFT */}
          <div className="xl:col-span-8 space-y-8">

            <SectionTitle title="Core Contact & Source"/>

            <div className="grid md:grid-cols-2 gap-5">
              <StatCard icon={Mail} label="Email" value={candidate.email} />
              <StatCard icon={Phone} label="Mobile" value={candidate.mobileNumber} color="purple"/>
              <StatCard icon={Building2} label="Client" value={candidate.clientInfo} color="blue"/>
              <StatCard icon={Globe} label="Source" value={candidate.referenceFrom || "LinkedIn"} color="emerald"/>
            </div>

            {/* Remarks */}
            <div className="relative bg-slate-50 rounded-[2rem] p-8 border border-slate-100 shadow-inner">
              <FileText size={72} className="absolute right-6 top-6 opacity-10"/>
              <h3 className="font-black text-lg mb-3">Interviewer Notes</h3>
              <p className="text-slate-700 text-lg leading-relaxed italic font-medium">
                {candidate.remarks || "No remarks added yet."}
              </p>
            </div>

          </div>

          {/* RIGHT SIDEBAR */}
          <div className="xl:col-span-4 space-y-8">

            {/* Ownership */}
            <div className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-xl">
              <h3 className="sidebarTitle">
                <Settings size={18}/> Ownership
              </h3>

              <MetaRow label="Recruiter" value={candidate.submittedBy}/>
              <MetaRow label="Resume Fixer" value={candidate.resumeWorkedBy}/>
              <MetaRow label="Submission Date" value="—"/>
            </div>

            {/* Skills */}
            <div>
              <h3 className="sidebarTitle mb-4">
                <Tag size={18}/> Skills
              </h3>

              <div className="flex flex-wrap gap-2">
                {skillSet.length === 0 && (
                  <span className="text-slate-400 text-sm">No skills listed</span>
                )}

                {skillSet.map((s, i) => (
                  <span key={i} className="skillChip">
                    {s}
                  </span>
                ))}
              </div>
            </div>

          </div>
        </div>

        {/* ================= FOOTER ================= */}
        <div className="sticky bottom-0 bg-white border-t border-slate-100 mt-12 p-6 flex justify-end gap-4">
          <button
            onClick={onClose}
            className="btnGhost"
          >
            Close
          </button>

          <button
            onClick={onClose}
            className="btnPrimary"
          >
            Finish Review
          </button>
        </div>
      </div>

      {/* Tailwind helper classes */}
      <style jsx>{`
        .chip {
          @apply inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 border border-white/10 text-slate-200 font-semibold text-sm;
        }
        .sidebarTitle {
          @apply text-sm font-black uppercase tracking-tight flex items-center gap-2 mb-5 text-slate-800;
        }
        .skillChip {
          @apply px-4 py-2 rounded-xl text-xs font-black bg-indigo-50 text-indigo-700 border border-indigo-100 hover:bg-indigo-100 transition;
        }
        .btnPrimary {
          @apply px-8 py-3 rounded-xl bg-slate-900 text-white font-black tracking-wider hover:bg-black active:scale-95 transition;
        }
        .btnGhost {
          @apply px-6 py-3 rounded-xl text-slate-500 font-bold hover:text-slate-900 transition;
        }
      `}</style>

    </Modal>
  );
};

const SectionTitle = ({ title }) => (
  <div className="flex items-center gap-3">
    <div className="w-1.5 h-8 bg-indigo-500 rounded-full"/>
    <h3 className="text-xl font-black">{title}</h3>
  </div>
);

const MetaRow = ({ label, value }) => (
  <div className="flex justify-between items-center py-3 border-b border-slate-50 last:border-0">
    <span className="text-xs uppercase tracking-widest text-slate-400 font-bold">
      {label}
    </span>
    <span className="font-semibold text-slate-700 truncate max-w-[180px] text-right">
      {value || "—"}
    </span>
  </div>
);

export default CandidateProfileViewModal;