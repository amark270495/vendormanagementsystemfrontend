import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

// --- Import Modal Components ---
import AccessModal from '../components/msa-wo/AccessModal'; // Reusing the access modal
import SignatureModal from '../components/msa-wo/SignatureModal'; // Reusing the signature modal

// --- Import Generic Components ---
import Spinner from '../components/Spinner';

// --- Import API Service ---
import { apiService } from '../api/apiService';

const OfferLetterSigningPage = ({ token }) => {
    const [documentData, setDocumentData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isAccessModalOpen, setIsAccessModalOpen] = useState(true); // Open by default for non-logged-in users
    const [isSigningModalOpen, setIsSigningModalOpen] = useState(false);
    const [signerConfig, setSignerConfig] = useState({});
    const [successMessage, setSuccessMessage] = useState('');

    const hasSigned = documentData?.status === 'Signed';

    const handleAccessGranted = useCallback((data) => {
        if (!data) {
            setError('Access denied. Please check your credentials.');
            return;
        }
        setDocumentData(data);
        setError('');
        setIsAccessModalOpen(false);
        setLoading(false);
    }, []);

    const handleSignSuccess = useCallback((message) => {
        setSuccessMessage(message);
        setIsSigningModalOpen(false);
        // Reload to show the final "completed" state
        setTimeout(() => {
            window.location.reload();
        }, 2000);
    }, []);
    
    // This is the main signing handler
    const handleSign = useCallback(async (signerData) => {
        setLoading(true);
        setError('');
        try {
            const response = await apiService.updateOfferLetterStatus(token, signerData);
            if (response.data.success) {
                handleSignSuccess(response.data.message);
            } else {
                throw new Error(response.data.message);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to sign the document.');
            setLoading(false);
            throw err; // Re-throw to show error in modal
        }
    }, [token, handleSignSuccess]);


    // Configure and open Signature Modal
    const openSigningModal = () => {
        setSignerConfig({
            signerType: 'employee',
            requiresPassword: false, // Candidates don't have a portal password
            signerInfo: {
                name: documentData?.employeeName,
                title: documentData?.jobTitle
            },
        });
        setIsSigningModalOpen(true);
    };
    
    const DetailItem = ({ label, value }) => (
        <div>
            <p className="text-sm text-gray-500">{label}</p>
            <p className="font-semibold text-gray-800">{value || 'N/A'}</p>
        </div>
    );

    return (
        <>
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
                <div className="w-full max-w-5xl">
                    <div className="text-center mb-8">
                        <svg className="mx-auto h-12 w-auto text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        <h1 className="mt-4 text-3xl font-extrabold text-gray-900">Offer Letter E-Signing Portal</h1>
                        <p className="mt-2 text-sm text-gray-600">Securely review and sign your employment offer letter.</p>
                    </div>

                    {loading && !documentData && <div className="flex justify-center py-12"><Spinner size="12" /></div>}
                    {error && <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md shadow-lg" role="alert"><p className="font-bold">An Error Occurred</p><p>{error}</p></div>}
                    {successMessage && <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 rounded-md shadow-lg" role="alert"><p className="font-bold">Success</p><p>{successMessage}</p></div>}

                    {documentData && !error && (
                        <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-10 mt-6">
                             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                                <DetailItem label="Candidate Name" value={documentData.employeeName} />
                                <DetailItem label="Job Title" value={documentData.jobTitle} />
                                <DetailItem label="Client" value={documentData.clientName} />
                                <DetailItem label="Start Date" value={new Date(documentData.startDate).toLocaleDateString()} />
                                <DetailItem label="Billing Rate" value={`$${documentData.billingRate} ${documentData.term}`} />
                                <DetailItem label="Status" value={documentData.status} />
                            </div>

                            <div className="mt-8 flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                                {hasSigned ? (
                                     <div className="w-full text-center p-4 bg-green-50 text-green-700 rounded-lg font-semibold">
                                        This offer letter has been signed. A final copy was sent to your email.
                                    </div>
                                ) : (
                                    <button
                                        onClick={openSigningModal}
                                        className="w-full sm:w-auto flex-1 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-semibold shadow-md"
                                    >
                                        Review & Sign Offer Letter
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Re-using the AccessModal for password entry */}
            <AccessModal
                isOpen={isAccessModalOpen}
                onClose={() => { if(!documentData) setError("Access is required to view this page.") }}
                onAccessGranted={handleAccessGranted}
                token={token}
                // Customizing the API call for employee sign-in
                accessFunction={apiService.employeeSignIn}
                title="Secure Offer Letter Access"
                prompt="A temporary password has been sent to your email. Please enter it below to access your offer letter."
            />

            {/* Re-using the SignatureModal for capturing the signature */}
            <SignatureModal
                isOpen={isSigningModalOpen}
                onClose={() => setIsSigningModalOpen(false)}
                onSign={handleSign}
                signerType={signerConfig.signerType}
                signerInfo={signerConfig.signerInfo}
                requiresPassword={signerConfig.requiresPassword}
            />
        </>
    );
};

export default OfferLetterSigningPage;