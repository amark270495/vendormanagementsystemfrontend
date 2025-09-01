import React from 'react';
import Modal from '../Modal';

const CandidateProfileViewModal = ({ isOpen, onClose, candidate }) => {
    if (!candidate) {
        return null;
    }

    const DetailItem = ({ label, value }) => (
        <div>
            <h4 className="text-sm font-medium text-gray-500">{label}</h4>
            <p className="text-gray-800 break-words">{value || 'N/A'}</p>
        </div>
    );

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Profile: ${candidate.firstName} ${candidate.lastName}`} size="lg">
            <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <DetailItem label="Full Name" value={`${candidate.firstName} ${candidate.middleName || ''} ${candidate.lastName}`.trim()} />
                    <DetailItem label="Email" value={candidate.email} />
                    <DetailItem label="Mobile Number" value={candidate.mobileNumber} />
                    <DetailItem label="Current Role" value={candidate.currentRole} />
                    <DetailItem label="Current Location" value={candidate.currentLocation} />
                    <DetailItem label="Submitted For (Posting ID)" value={candidate.postingId} />
                    <DetailItem label="Client Info" value={candidate.clientInfo} />
                    <DetailItem label="Submitted By" value={candidate.submittedBy} />
                    <DetailItem label="Submission Date" value={new Date(candidate.submissionDate).toLocaleDateString()} />
                    <DetailItem label="Resume Worked By" value={candidate.resumeWorkedBy} />
                    <DetailItem label="Reference From" value={candidate.referenceFrom} />
                    <DetailItem label="Remarks" value={candidate.remarks} />
                </div>
                <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-2">Skill Set</h4>
                    {candidate.skillSet && candidate.skillSet.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                            {candidate.skillSet.map((skill, index) => (
                                <span key={index} className="px-3 py-1 text-sm font-medium bg-indigo-100 text-indigo-800 rounded-full">
                                    {skill}
                                </span>
                            ))}
                        </div>
                    ) : (
                        <p className="text-gray-500 text-sm">No skills listed.</p>
                    )}
                </div>
            </div>
            <div className="flex justify-end mt-6">
                <button onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">
                    Close
                </button>
            </div>
        </Modal>
    );
};

export default CandidateProfileViewModal;