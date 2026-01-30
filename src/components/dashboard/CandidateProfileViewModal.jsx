import React from 'react';
import {
  Mail, Phone, MapPin, Briefcase,
  UserCheck, Settings, Building2,
  ShieldCheck, Hash, Tag
} from 'lucide-react';
import Modal from '../Modal';

/* ---------- Design Tokens ---------- */

const StatCard = ({ label, value, icon: Icon }) => (
  <div className="group relative bg-white/80 backdrop-blur-xl border border-slate-200/70 rounded-2xl p-5 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
    <div className="flex gap-4 items-start">
      <div className="p-3 rounded-xl bg-gradient-to-br from-indigo-50 to-violet-50 ring-1 ring-indigo-100 group-hover:scale-110 transition">
        <Icon size={20} className="text-indigo-600"/>
      </div>

      <div className="min-w-0">
        <p className="label">{label}</p>
        <p className="value truncate" title={value}>{value || "—"}</p>
      </div>
    </div>
  </div>
);

const CandidateProfileViewModal = ({ isOpen, onClose, candidate }) => {
  if (!candidate) return null;

  let skillSet = [];
  try {
    skillSet = Array.isArray(candidate.skillSet)
      ? candidate.skillSet
      : JSON.parse(candidate.skillSet || "[]");
  } catch {}

  const initials =
    (candidate.firstName?.[0] || "") +
    (candidate.lastName?.[0] || "");

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="" size="6xl">

      <div className="max-h-[88vh] overflow-y-auto">

        {/* ================= HERO HEADER ================= */}

        <div className="relative rounded-[2.2rem] overflow-hidden p-10 shadow-2xl bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 text-white">

          {/* glow layers */}
          <div className="absolute -top-32 -right-32 w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-3xl"/>
          <div className="absolute -bottom-32 -left-32 w-[400px] h-[400px] bg-violet-600/20 rounded-full blur-3xl"/>

          <div className="relative z-10 flex flex-col xl:flex-row justify-between gap-10">

            {/* profile */}
            <div className="flex flex-col md:flex-row gap-6 items-center">
              <div className="relative">
                <div className="w-28 h-28 rounded-3xl bg-gradient-to-tr from-indigo-500 via-violet-500 to-fuchsia-500 p-1 shadow-xl">
                  <div className="w-full h-full rounded-[1.4rem] bg-slate-900 flex items-center justify-center text-4xl font-black">
                    {initials || "NA"}
                  </div>
                </div>

                <div className="absolute -bottom-2 -right-2 bg-emerald-500 p-2 rounded-xl border-4 border-slate-900 shadow-lg">
                  <UserCheck size={16}/>
                </div>
              </div>

              <div className="text-center md:text-left">
                <h2 className="text-4xl font-black tracking-tight">
                  {candidate.firstName} {candidate.lastName}
                </h2>

                <div className="flex flex-wrap gap-3 mt-4 justify-center md:justify-start">
                  <span className="heroChip">
                    <Briefcase size={14}/> {candidate.currentRole}
                  </span>

                  <span className="heroChip">
                    <MapPin size={14}/> {candidate.currentLocation}
                  </span>

                  <span className="heroChip border-indigo-400/30 text-indigo-200">
                    <Hash size={12}/> {candidate.postingId || "—"}
                  </span>
                </div>
              </div>
            </div>

            {/* status */}
            <div className="text-right">
              <p className="heroLabel">Candidate Status</p>
              <div className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 font-black text-lg">
                <ShieldCheck size={18}/>
                {candidate.status || "Active"}
              </div>
            </div>

          </div>
        </div>

        {/* ================= BODY ================= */}

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 mt-10">

          {/* LEFT — MAIN */}
          <div className="xl:col-span-8 space-y-8">

            <SectionTitle title="Contact & Professional Details"/>

            <div className="grid md:grid-cols-2 gap-5">
              <StatCard icon={Mail} label="Email Address" value={candidate.email}/>
              <StatCard icon={Phone} label="Mobile Number" value={candidate.mobileNumber}/>
              <StatCard icon={Building2} label="Client / Agency" value={candidate.clientInfo}/>
              <StatCard icon={Settings} label="Experience Level" value={candidate.experience}/>
            </div>

          </div>

          {/* RIGHT — SIDEBAR */}
          <div className="xl:col-span-4 space-y-8">

            {/* ownership */}
            <div className="glassCard">
              <h3 className="sidebarTitle">
                <Settings size={18}/> Ownership
              </h3>

              <MetaRow label="Recruiter" value={candidate.submittedBy}/>
              <MetaRow label="Resume Owner" value={candidate.resumeWorkedBy}/>
              <MetaRow label="Candidate ID" value={candidate.id}/>
            </div>

            {/* skills */}
            <div>
              <h3 className="sidebarTitle mb-4">
                <Tag size={18}/> Tech Stack
              </h3>

              <div className="flex flex-wrap gap-2">
                {skillSet.map((s,i)=>(
                  <span key={i} className="skillChip">{s}</span>
                ))}
              </div>
            </div>

          </div>
        </div>

        {/* ================= FOOTER ================= */}

        <div className="sticky bottom-0 bg-white/90 backdrop-blur-xl border-t border-slate-200 p-6 flex justify-end gap-4 mt-12">
          <button onClick={onClose} className="btnGhost">
            Close
          </button>

          <button onClick={onClose} className="btnPrimary">
            Done
          </button>
        </div>

      </div>

      {/* ---------- Utility Classes ---------- */}

      <style jsx>{`
        .label {
          @apply text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1;
        }
        .value {
          @apply font-bold text-slate-800;
        }
        .heroChip {
          @apply inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 border border-white/10 text-slate-200 font-semibold text-sm backdrop-blur;
        }
        .heroLabel {
          @apply text-xs uppercase tracking-widest text-slate-400 font-bold mb-2;
        }
        .sidebarTitle {
          @apply text-sm font-black uppercase tracking-tight flex items-center gap-2 mb-5 text-slate-800;
        }
        .glassCard {
          @apply bg-white/70 backdrop-blur-xl border border-slate-200/70 rounded-[2rem] p-6 shadow-xl;
        }
        .skillChip {
          @apply px-4 py-2 rounded-xl text-xs font-black bg-gradient-to-br from-indigo-50 to-violet-50 text-indigo-700 border border-indigo-100 hover:scale-105 transition;
        }
        .btnPrimary {
          @apply px-8 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-black tracking-wide hover:opacity-95 active:scale-95 transition shadow-lg;
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
    <div className="w-1.5 h-8 bg-gradient-to-b from-indigo-500 to-violet-500 rounded-full"/>
    <h3 className="text-xl font-black">{title}</h3>
  </div>
);

const MetaRow = ({ label, value }) => (
  <div className="flex justify-between items-center py-3 border-b border-slate-100 last:border-0">
    <span className="text-xs uppercase tracking-widest text-slate-400 font-bold">
      {label}
    </span>
    <span className="font-semibold text-slate-700 truncate max-w-[180px] text-right">
      {value || "—"}
    </span>
  </div>
);

export default CandidateProfileViewModal;