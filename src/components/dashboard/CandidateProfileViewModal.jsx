import React from "react";
import { Mail, Phone, MapPin, Briefcase, Hash, UserCheck } from "lucide-react";
import Modal from "../Modal";

const Field = ({ label, value, icon: Icon }) => (
  <div className="profileField">
    <div className="flex items-center gap-2 labelRow">
      {Icon && <Icon size={14} className="text-indigo-500" />}
      {label}
    </div>
    <div className="valueRow">{value || "—"}</div>
  </div>
);

const CandidateProfileViewModal = ({ isOpen, onClose, candidate }) => {
  if (!candidate) return null;

  let skills = [];
  try {
    skills = Array.isArray(candidate.skillSet)
      ? candidate.skillSet
      : JSON.parse(candidate.skillSet || "[]");
  } catch {}

  const initials =
    (candidate.firstName?.[0] || "") +
    (candidate.lastName?.[0] || "");

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="" size="6xl">
      <div className="max-h-[88vh] overflow-y-auto">

        {/* ================= HEADER ================= */}

        <div className="headerStrip">
          <div className="flex items-center gap-6">
            <div className="avatarBox">{initials}</div>

            <div>
              <h2 className="text-3xl font-black text-slate-900">
                {candidate.firstName} {candidate.lastName}
              </h2>

              <div className="flex gap-3 mt-2 flex-wrap">
                <span className="badge">
                  <Briefcase size={14}/> {candidate.currentRole}
                </span>
                <span className="badge">
                  <MapPin size={14}/> {candidate.currentLocation}
                </span>
                <span className="badge">
                  <Hash size={14}/> {candidate.postingId}
                </span>
              </div>
            </div>
          </div>

          <div className="statusBadge">
            <UserCheck size={16}/>
            {candidate.status || "Active"}
          </div>
        </div>

        {/* ================= GRID BODY ================= */}

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mt-10">

          {/* LEFT CARD */}
          <div className="infoCard">
            <h3 className="cardTitle">Contact & Professional Details</h3>

            <div className="grid md:grid-cols-2 gap-6">
              <Field label="Email Address" value={candidate.email} icon={Mail}/>
              <Field label="Mobile Number" value={candidate.mobileNumber} icon={Phone}/>
              <Field label="Candidate Number" value={candidate.candidateNumber}/>
              <Field label="Experience" value={candidate.experience}/>
              <Field label="Current Client" value={candidate.clientInfo}/>
              <Field label="Present Address" value={candidate.currentAddress}/>
            </div>
          </div>

          {/* RIGHT CARD */}
          <div className="infoCard">
            <h3 className="cardTitle">Submission Details</h3>

            <div className="grid md:grid-cols-2 gap-6">
              <Field label="Recruiter" value={candidate.submittedBy}/>
              <Field label="Resume Worked By" value={candidate.resumeWorkedBy}/>
              <Field label="Submitted On" value={candidate.submittedOn}/>
              <Field label="Posting IDs" value={candidate.postingId}/>
            </div>
          </div>
        </div>

        {/* ================= SKILLS ================= */}

        <div className="infoCard mt-8">
          <h3 className="cardTitle">Technical Skills</h3>

          <div className="flex flex-wrap gap-3 mt-4">
            {skills.map((s, i) => (
              <span key={i} className="skillChip">{s}</span>
            ))}
          </div>
        </div>

        {/* ================= FOOTER ================= */}

        <div className="footerBar">
          <button onClick={onClose} className="btnGhost">
            Close
          </button>

          <button onClick={onClose} className="btnPrimary">
            Done
          </button>
        </div>

      </div>

      {/* ================= DESIGN SYSTEM ================= */}

      <style jsx>{`
        .headerStrip {
          @apply flex flex-col xl:flex-row justify-between gap-6 items-start xl:items-center
          bg-gradient-to-r from-indigo-50 via-violet-50 to-fuchsia-50
          border border-indigo-100 rounded-3xl p-8 shadow-sm;
        }

        .avatarBox {
          @apply w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600
          text-white text-2xl font-black flex items-center justify-center shadow-lg;
        }

        .badge {
          @apply inline-flex items-center gap-2 px-4 py-2 rounded-xl
          bg-white border border-slate-200 text-slate-700 font-semibold text-sm;
        }

        .statusBadge {
          @apply inline-flex items-center gap-2 px-6 py-3 rounded-xl
          bg-emerald-50 border border-emerald-200 text-emerald-700 font-black;
        }

        .infoCard {
          @apply bg-white border border-slate-200 rounded-3xl p-8 shadow-sm hover:shadow-lg transition;
        }

        .cardTitle {
          @apply text-lg font-black text-slate-800 mb-6 tracking-tight;
        }

        .profileField {
          @apply space-y-1;
        }

        .labelRow {
          @apply text-xs font-extrabold uppercase tracking-widest text-slate-400;
        }

        .valueRow {
          @apply text-slate-800 font-bold text-sm break-words;
        }

        .skillChip {
          @apply px-4 py-2 rounded-xl bg-indigo-50 text-indigo-700
          border border-indigo-200 font-bold text-xs hover:bg-indigo-100 transition;
        }

        .footerBar {
          @apply sticky bottom-0 bg-white border-t border-slate-200
          flex justify-end gap-4 p-6 mt-10;
        }

        .btnPrimary {
          @apply px-8 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600
          text-white font-black shadow-lg hover:opacity-95 active:scale-95 transition;
        }

        .btnGhost {
          @apply px-6 py-3 rounded-xl text-slate-500 font-bold hover:text-slate-900 transition;
        }
      `}</style>

    </Modal>
  );
};

export default CandidateProfileViewModal;