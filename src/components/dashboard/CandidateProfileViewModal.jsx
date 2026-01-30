import React from 'react';
import Modal from '../Modal';

const CandidateProfileViewModal = ({ isOpen, onClose, candidate }) => {
    if (!candidate) return null;

    const DetailItem = ({ label, value, large = false, icon }) => (
        <div className={`flex flex-col p-4 bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md transition ${large ? 'md:col-span-2' : ''}`}>
            <h4 className="text-xs font-bold text-indigo-600 uppercase tracking-wider flex items-center gap-1">
                {icon}
                <span>{label}</span>
            </h4>
            <p className="text-slate-900 font-semibold break-words pt-1">{value || '—'}</p>
        </div>
    );

    const getIcon = (d) => (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-indigo-500" viewBox="0 0 20 20" fill="currentColor">
            {d === 'user' && <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />}
            {d === 'email' && <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884zM18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />}
            {d === 'phone' && <path d="M2 3h2l2 5-2 2 5 5 2-2 5 2v2" />}
            {d === 'role' && <path d="M4 4h12v12H4z" />}
            {d === 'location' && <path d="M10 18s6-5.686 6-10A6 6 0 104 8c0 4.314 6 10 6 10z" />}
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

                {/* ================= HEADER ================= */}
                <div className="rounded-2xl p-6 bg-gradient-to-r from-indigo-50 via-violet-50 to-fuchsia-50 border border-indigo-100 shadow-sm">
                    <div className="flex items-center gap-5">

                        <span className="w-16 h-16 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600
                                         flex items-center justify-center text-2xl font-bold text-white shadow-md">
                            {candidate.firstName.charAt(0)}{candidate.lastName.charAt(0)}
                        </span>

                        <div className="flex-1 min-w-0">

                            <h2 className="text-2xl font-extrabold bg-gradient-to-r 
                                           from-indigo-700 to-violet-700 
                                           bg-clip-text text-transparent tracking-tight">
                                {`${candidate.firstName} ${candidate.middleName || ''} ${candidate.lastName}`.trim()}
                            </h2>

                            <div className="flex flex-wrap gap-2 mt-2">
                                <span className="px-3 py-1 text-sm font-semibold bg-indigo-100 text-indigo-700 rounded-lg">
                                    {candidate.currentRole}
                                </span>

                                <span className="px-3 py-1 text-sm font-semibold bg-violet-100 text-violet-700 rounded-lg">
                                    {candidate.currentLocation}
                                </span>

                                {candidate.postingId && (
                                    <span className="px-3 py-1 text-sm font-semibold bg-slate-100 text-slate-700 rounded-lg">
                                        #{candidate.postingId}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* ================= CONTACT ================= */}
                <Section title="Primary Contact Information" tint="indigo">
                    <DetailItem icon={getIcon('email')} label="Email Address" value={candidate.email} />
                    <DetailItem icon={getIcon('phone')} label="Mobile Number" value={candidate.mobileNumber} />
                    <DetailItem icon={getIcon('location')} label="Current Location" value={candidate.currentLocation} />
                    <DetailItem icon={getIcon('role')} label="Current Role" value={candidate.currentRole} />
                </Section>

                {/* ================= SUBMISSION ================= */}
                <Section title="Submission Context" tint="violet">
                    <DetailItem icon={getIcon('post')} label="Posting ID" value={candidate.postingId} />
                    <DetailItem icon={getIcon('date')} label="Submission Date" value={submissionDate} />
                    <DetailItem icon={getIcon('user')} label="Submitted By" value={candidate.submittedBy} />
                    <DetailItem icon={getIcon('user')} label="Resume Worked By" value={candidate.resumeWorkedBy} />
                    <DetailItem large label="Client / Agency Info" value={candidate.clientInfo} />
                    <DetailItem large label="Reference From" value={candidate.referenceFrom} />
                </Section>

                {/* ================= STATUS ================= */}
                <div className="p-5 rounded-xl bg-emerald-50 border border-emerald-200">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-700 mb-1">
                        Current Status
                    </h4>
                    <span className="inline-block px-4 py-1 bg-emerald-600 text-white text-sm font-bold rounded-full">
                        {candidate.remarks || 'Pending Review'}
                    </span>
                </div>

                {/* ================= SKILLS ================= */}
                <div className="p-5 rounded-xl bg-indigo-50 border border-indigo-200">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-700 mb-3 flex items-center gap-1">
                        {getIcon('tag')} Skill Set
                    </h4>

                    <div className="flex flex-wrap gap-2 max-h-[220px] overflow-y-auto">
                        {skillSet.length > 0 ? (
                            skillSet.map((skill, i) => (
                                <span key={i} className="px-3 py-1 text-xs font-bold text-black rounded-full shadow-sm">
                                    {skill}
                                </span>
                            ))
                        ) : (
                            <p className="text-slate-500 text-sm">No skills listed.</p>
                        )}
                    </div>
                </div>

                {/* ================= FOOTER ================= */}
                <div className="flex justify-end pt-4 border-t">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition shadow"
                    >
                        Close Profile
                    </button>
                </div>

            </div>
        </Modal>
    );
};

/* ---------- SAFE SECTION COMPONENT (no dynamic tailwind risk) ---------- */

const Section = ({ title, tint, children }) => {
    const map = {
        indigo: "bg-indigo-50 border-indigo-200 text-indigo-800",
        violet: "bg-violet-50 border-violet-200 text-violet-800"
    };

    return (
        <div className={`p-6 rounded-2xl border ${map[tint]} space-y-4`}>
            <h3 className="text-lg font-black">{title}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {children}
            </div>
        </div>
    );
};

export default CandidateProfileViewModal;