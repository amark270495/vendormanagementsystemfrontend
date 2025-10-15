import React from 'react';
import Modal from '../Modal';

const CandidateProfileViewModal = ({ isOpen, onClose, candidate }) => {
    if (!candidate) {
        return null;
    }

    const DetailItem = ({ label, value, large = false, icon }) => (
        <div className={`flex flex-col p-3 bg-gray-50 rounded-lg ${large ? 'md:col-span-2' : ''}`}>
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center space-x-1">
                {icon}
                <span>{label}</span>
            </h4>
            <p className="text-gray-800 font-medium break-words pt-1">{value || 'N/A'}</p>
        </div>
    );

    // Placeholder icons using Tailwind-style SVG
    const getIcon = (d) => (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-indigo-400" viewBox="0 0 20 20" fill="currentColor">
            {d === 'user' && <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />}
            {d === 'email' && <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884zM18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />}
            {d === 'phone' && <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l1.38 8.049a3 3 0 00.866 1.343l2.87 2.87a3 3 0 001.343.866l8.049 1.38a1 1 0 01.836.986V17a1 1 0 01-1 1h-2.153a1 1 0 01-.986-.836l-1.38-8.049a3 3 0 00-.866-1.343l-2.87-2.87a3 3 0 00-1.343-.866L3.836 3.986A1 1 0 013 3H2z" />}
            {d === 'role' && <path fillRule="evenodd" d="M6 6V5a3 3 0 013-3h2a3 3 0 013 3v1h2a2 2 0 012 2v3.586l.707.707a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l.707-.707V8a2 2 0 012-2h2zm2 5a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" clipRule="evenodd" />}
            {d === 'location' && <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />}
            {d === 'date' && <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />}
            {d === 'tag' && <path fillRule="evenodd" d="M17.707 9.293a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-7-7A1 1 0 013 9V5a1 1 0 011-1h4a1 1 0 01.707.293l7 7zM5 6a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />}
            {d === 'post' && <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h12l-4 4 4 4v2a2 2 0 002-2V6a2 2 0 00-2-2H4z" clipRule="evenodd" />}
        </svg>
    );
    
    // Ensure skillSet is an array, parsing if necessary
    const skillSet = Array.isArray(candidate.skillSet) ? candidate.skillSet : (candidate.skillSet && typeof candidate.skillSet === 'string' ? JSON.parse(candidate.skillSet) : []);
    const submissionDate = new Date(candidate.submissionDate).toLocaleDateString();

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Candidate Profile`} size="4xl">
            <div className="space-y-8">
                {/* --- HEADER SECTION: NAME & ROLE --- */}
                <div className="flex items-center space-x-4 pb-4 border-b border-indigo-100">
                    <span className="w-16 h-16 rounded-full bg-indigo-600 flex items-center justify-center text-3xl font-bold text-white shadow-xl">
                        {candidate.firstName.charAt(0)}{candidate.lastName.charAt(0)}
                    </span>
                    <div>
                        <h2 className="text-2xl font-extrabold text-gray-900">{`${candidate.firstName} ${candidate.middleName || ''} ${candidate.lastName}`.trim()}</h2>
                        <p className="text-md text-indigo-700 font-semibold">{candidate.currentRole} at {candidate.currentLocation}</p>
                    </div>
                </div>

                {/* --- SECTION 1: CORE CONTACT DETAILS --- */}
                <div className="space-y-4">
                    <h3 className="text-lg font-bold text-gray-800 border-b pb-2">Primary Contact Information</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <DetailItem icon={getIcon('email')} label="Email Address" value={candidate.email} />
                        <DetailItem icon={getIcon('phone')} label="Mobile Number" value={candidate.mobileNumber} />
                        <DetailItem icon={getIcon('location')} label="Current Location" value={candidate.currentLocation} />
                        <DetailItem icon={getIcon('role')} label="Current Role" value={candidate.currentRole} />
                    </div>
                </div>

                {/* --- SECTION 2: SUBMISSION CONTEXT --- */}
                <div className="space-y-4 pt-4 border-t">
                    <h3 className="text-lg font-bold text-gray-800 border-b pb-2">Submission Context</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <DetailItem icon={getIcon('post')} label="Submitted For (Posting ID)" value={candidate.postingId} />
                        <DetailItem icon={getIcon('date')} label="Submission Date" value={submissionDate} />
                        <DetailItem icon={getIcon('user')} label="Submitted By" value={candidate.submittedBy} />
                        <DetailItem icon={getIcon('user')} label="Resume Worked By" value={candidate.resumeWorkedBy} />
                        
                        <DetailItem large icon={getIcon('role')} label="Client/Agency Info" value={candidate.clientInfo} />
                        <DetailItem large icon={getIcon('user')} label="Reference From" value={candidate.referenceFrom} />
                    </div>
                </div>

                {/* --- SECTION 3: REMARKS, STATUS & SKILLS --- */}
                <div className="space-y-4 pt-4 border-t">
                    <h3 className="text-lg font-bold text-gray-800 border-b pb-2">Status, Remarks, & Skill Set</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Status Badge */}
                        <div className="flex flex-col p-3 bg-indigo-50 rounded-lg">
                            <h4 className="text-xs font-semibold text-indigo-700 uppercase tracking-wider">Current Status:</h4>
                            <span className={`mt-1 inline-block px-3 py-1 text-sm font-bold rounded-full ${candidate.remarks ? 'bg-teal-100 text-teal-800' : 'bg-gray-100 text-gray-700'}`}>
                                {candidate.remarks || 'Pending Review'}
                            </span>
                        </div>
                        
                        {/* Remarks Detail */}
                        <div className="md:col-span-2 flex flex-col p-3 bg-gray-50 rounded-lg">
                            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Detailed Remarks:</h4>
                            <p className="text-gray-800 font-medium pt-1">{candidate.remarks || 'No detailed remarks provided.'}</p>
                        </div>
                    </div>

                    {/* Skills List */}
                    <div className="space-y-2 pt-4">
                        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center space-x-1">
                            {getIcon('tag')}
                            <span>Skill Set</span>
                        </h4>
                        <div className="flex flex-wrap gap-2 p-3 bg-slate-50 border border-slate-200 rounded-lg" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                            {skillSet.length > 0 ? (
                                skillSet.map((skill, index) => (
                                    <span key={index} className="px-3 py-1 text-xs font-semibold bg-indigo-50 text-indigo-700 rounded-full shadow-sm">
                                        {skill}
                                    </span>
                                ))
                            ) : (
                                <p className="text-gray-500 text-sm">No detailed skill list available.</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            
            <div className="flex justify-end mt-8 pt-4 border-t">
                <button onClick={onClose} className="px-6 py-2 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300 transition">
                    Close Profile
                </button>
            </div>
        </Modal>
    );
};

export default CandidateProfileViewModal;