import React from 'react';
import Modal from '../Modal';

const CandidateProfileViewModal = ({ isOpen, onClose, candidate }) => {
  if (!candidate) return null;

  const DetailItem = ({ label, value, large = false, icon }) => (
    <div className={`detailCard ${large ? 'md:col-span-2' : ''}`}>
      <h4 className="detailLabel">
        {icon}
        <span>{label}</span>
      </h4>
      <p className="detailValue">{value || '—'}</p>
    </div>
  );

  const getIcon = (d) => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-indigo-500" viewBox="0 0 20 20" fill="currentColor">
      {d === 'user' && <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />}
      {d === 'email' && <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884zM18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />}
      {d === 'phone' && <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l1.38 8.049a3 3 0 00.866 1.343l2.87 2.87a3 3 0 001.343.866l8.049 1.38a1 1 0 01.836.986V17a1 1 0 01-1 1h-2.153a1 1 0 01-.986-.836l-1.38-8.049a3 3 0 00-.866-1.343l-2.87-2.87a3 3 0 00-1.343-.866L3.836 3.986A1 1 0 013 3H2z" />}
      {d === 'location' && <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9z" clipRule="evenodd" />}
      {d === 'role' && <path d="M6 6h8v8H6z" />}
      {d === 'date' && <path d="M6 2v2M14 2v2M3 8h14" />}
      {d === 'tag' && <path d="M3 7l7-4 7 4v6l-7 4-7-4z" />}
      {d === 'post' && <path d="M4 4h12v12H4z" />}
    </svg>
  );

  const skillSet = Array.isArray(candidate.skillSet)
    ? candidate.skillSet
    : (candidate.skillSet && typeof candidate.skillSet === 'string'
        ? JSON.parse(candidate.skillSet)
        : []);

  const submissionDate = candidate.submissionDate
    ? new Date(candidate.submissionDate).toLocaleDateString()
    : '—';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="" size="5xl">

      <div className="space-y-8">

        {/* ===== HERO HEADER ===== */}
        <div className="hero">
          <div className="avatar">
            {candidate.firstName.charAt(0)}{candidate.lastName.charAt(0)}
          </div>

          <div>
            <h2 className="heroName">
              {candidate.firstName} {candidate.lastName}
            </h2>
            <p className="heroSub">
              {candidate.currentRole} • {candidate.currentLocation}
            </p>
          </div>
        </div>

        {/* ===== CONTACT SECTION ===== */}
        <Section title="Contact & Professional" tint="indigo">
          <DetailItem icon={getIcon('email')} label="Email" value={candidate.email}/>
          <DetailItem icon={getIcon('phone')} label="Mobile" value={candidate.mobileNumber}/>
          <DetailItem icon={getIcon('location')} label="Location" value={candidate.currentLocation}/>
          <DetailItem icon={getIcon('role')} label="Role" value={candidate.currentRole}/>
        </Section>

        {/* ===== SUBMISSION SECTION ===== */}
        <Section title="Submission Details" tint="violet">
          <DetailItem icon={getIcon('post')} label="Posting ID" value={candidate.postingId}/>
          <DetailItem icon={getIcon('date')} label="Submission Date" value={submissionDate}/>
          <DetailItem icon={getIcon('user')} label="Submitted By" value={candidate.submittedBy}/>
          <DetailItem icon={getIcon('user')} label="Resume Worked By" value={candidate.resumeWorkedBy}/>
          <DetailItem large label="Client Info" value={candidate.clientInfo}/>
        </Section>

        {/* ===== STATUS ===== */}
        <div className="statusCard">
          Status: {candidate.remarks || "Pending Review"}
        </div>

        {/* ===== SKILLS ===== */}
        <div className="skillsCard">
          {skillSet.map((s,i)=>(
            <span key={i} className="skillChip">{s}</span>
          ))}
        </div>

        {/* FOOTER */}
        <div className="flex justify-end">
          <button onClick={onClose} className="btnPrimary">
            Close Profile
          </button>
        </div>

      </div>

      {/* ===== STYLE ===== */}
      <style jsx>{`
        .hero {
          @apply flex items-center gap-5 p-6 rounded-2xl
          bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg;
        }
        .avatar {
          @apply w-16 h-16 rounded-xl bg-white/20 flex items-center justify-center text-2xl font-black;
        }
        .heroName { @apply text-2xl font-black; }
        .heroSub { @apply text-indigo-100 font-semibold; }

        .detailCard {
          @apply p-4 rounded-xl bg-white border border-slate-200 shadow-sm;
        }
        .detailLabel {
          @apply text-xs uppercase font-bold tracking-wider text-indigo-600 flex gap-2;
        }
        .detailValue {
          @apply text-slate-900 font-semibold mt-1 break-words;
        }

        .statusCard {
          @apply p-4 rounded-xl bg-emerald-50 border border-emerald-200 font-bold text-emerald-700;
        }

        .skillsCard {
          @apply p-4 rounded-xl bg-indigo-50 border border-indigo-200 flex flex-wrap gap-2;
        }
        .skillChip {
          @apply px-3 py-1 bg-indigo-600 text-white text-xs font-bold rounded-full;
        }

        .btnPrimary {
          @apply px-6 py-2 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700;
        }
      `}</style>

    </Modal>
  );
};

const Section = ({ title, children, tint }) => (
  <div className={`p-6 rounded-2xl space-y-4 bg-${tint}-50 border border-${tint}-200`}>
    <h3 className={`font-black text-${tint}-800`}>{title}</h3>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{children}</div>
  </div>
);

export default CandidateProfileViewModal;