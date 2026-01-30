import React from "react";
import {
  Mail, Phone, MapPin, Briefcase,
  UserCheck, Hash
} from "lucide-react";
import Modal from "../Modal";

const Row = ({ icon: Icon, label, value }) => (
  <div className="dataRow">
    <div className="rowLabel">
      {Icon && <Icon size={14}/>}
      {label}
    </div>
    <div className="rowValue">{value || "—"}</div>
  </div>
);

const CandidateProfileViewModal = ({ isOpen, onClose, candidate }) => {
  if (!candidate) return null;

  const initials =
    (candidate.firstName?.[0] || "") +
    (candidate.lastName?.[0] || "");

  const skills = Array.isArray(candidate.skillSet)
    ? candidate.skillSet
    : [];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="" size="6xl">

      <div className="max-h-[88vh] overflow-y-auto">

        {/* ===== HEADER ===== */}

        <div className="headerBand">
          <div className="flex gap-6 items-center">

            <div className="avatar">{initials}</div>

            <div>
              <h2 className="name">
                {candidate.firstName} {candidate.lastName}
              </h2>

              <div className="flex flex-wrap gap-3 mt-3">
                <span className="chip role">
                  <Briefcase size={14}/> {candidate.currentRole}
                </span>

                <span className="chip location">
                  <MapPin size={14}/> {candidate.currentLocation}
                </span>

                <span className="chip id">
                  <Hash size={14}/> {candidate.postingId}
                </span>
              </div>
            </div>
          </div>

          <div className="status">
            <UserCheck size={16}/>
            Active
          </div>
        </div>

        {/* ===== GRID ===== */}

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mt-10">

          {/* CONTACT CARD */}
          <div className="card indigo">
            <h3>Contact & Professional</h3>

            <Row icon={Mail} label="Email" value={candidate.email}/>
            <Row icon={Phone} label="Mobile" value={candidate.mobileNumber}/>
            <Row label="Candidate Number" value={candidate.candidateNumber}/>
            <Row label="Experience" value={candidate.experience}/>
            <Row label="Client" value={candidate.clientInfo}/>
            <Row label="Address" value={candidate.currentAddress}/>
          </div>

          {/* SUBMISSION CARD */}
          <div className="card violet">
            <h3>Submission Details</h3>

            <Row label="Recruiter" value={candidate.submittedBy}/>
            <Row label="Resume Worked By" value={candidate.resumeWorkedBy}/>
            <Row label="Submitted On" value={candidate.submittedOn}/>
            <Row label="Posting IDs" value={candidate.postingId}/>
          </div>
        </div>

        {/* SKILLS */}

        <div className="card neutral mt-8">
          <h3>Technical Skills</h3>

          <div className="skillsWrap">
            {skills.map((s,i)=>(
              <span key={i} className="skill">{s}</span>
            ))}
          </div>
        </div>

        {/* FOOTER */}

        <div className="footer">
          <button onClick={onClose} className="btnGhost">Close</button>
          <button onClick={onClose} className="btnPrimary">Done</button>
        </div>

      </div>

      {/* ===== STYLE SYSTEM ===== */}

      <style jsx>{`

        .headerBand {
          @apply flex justify-between items-center p-8 rounded-3xl
          bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-700
          text-white shadow-xl;
        }

        .avatar {
          @apply w-20 h-20 rounded-2xl bg-white/20
          flex items-center justify-center text-2xl font-black;
        }

        .name { @apply text-3xl font-black; }

        .chip {
          @apply inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold;
        }

        .role { @apply bg-white/15; }
        .location { @apply bg-white/10; }
        .id { @apply bg-black/20; }

        .status {
          @apply bg-emerald-400 text-emerald-900 font-black
          px-6 py-3 rounded-xl flex gap-2 items-center;
        }

        .card {
          @apply rounded-3xl p-8 border shadow-sm space-y-5;
        }

        .card.indigo {
          @apply bg-indigo-50 border-indigo-200;
        }

        .card.violet {
          @apply bg-violet-50 border-violet-200;
        }

        .card.neutral {
          @apply bg-white border-slate-200;
        }

        .card h3 {
          @apply font-black text-lg text-slate-800 mb-2;
        }

        .dataRow { @apply space-y-1; }

        .rowLabel {
          @apply text-xs uppercase tracking-widest font-bold text-slate-500 flex gap-2 items-center;
        }

        .rowValue {
          @apply text-slate-900 font-semibold;
        }

        .skillsWrap {
          @apply flex flex-wrap gap-3;
        }

        .skill {
          @apply px-4 py-2 rounded-xl bg-indigo-100 text-indigo-800 font-bold text-xs;
        }

        .footer {
          @apply sticky bottom-0 bg-white border-t border-slate-200
          flex justify-end gap-4 p-6 mt-10;
        }

        .btnPrimary {
          @apply px-8 py-3 rounded-xl bg-indigo-600 text-white font-black shadow hover:bg-indigo-700;
        }

        .btnGhost {
          @apply px-6 py-3 text-slate-500 font-bold hover:text-slate-900;
        }

      `}</style>

    </Modal>
  );
};

export default CandidateProfileViewModal;