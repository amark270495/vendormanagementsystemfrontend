import React, { useState, useEffect, useCallback } from 'react';
import { apiService } from '../api/apiService.js';
import Spinner from '../components/Spinner.jsx';
import AccessModal from '../components/msa-wo/AccessModal.jsx';
import SignatureModal from '../components/msa-wo/SignatureModal.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const OfferLetterSigningPage = () => {
    const { user } = useAuth() || {};
    const [token, setToken] = useState(null);
    const [documentData, setDocumentData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    const [isAccessModalOpen, setIsAccessModalOpen] = useState(false);
    const [isSigningModalOpen, setIsSigningModalOpen] = useState(false);
    const [signerConfig, setSignerConfig] = useState({});
    
    const hasBeenSigned = documentData?.status === 'Signed';

    useEffect(() => {
        const urlToken = new URLSearchParams(window.location.search).get('token');
        if (urlToken) {
            setToken(urlToken);
        } else {
            setError('Invalid or missing document token in the URL.');
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (token) {
            setIsAccessModalOpen(true);
            setLoading(false);
        }
    }, [token]);

    const handleAccessGranted = useCallback((data) => {
        if (!data) {
            setError('Access denied. Please check your credentials.');
            return;
        }
        setDocumentData(data);
        setError('');
        setIsAccessModalOpen(false);
    }, []);

    const handleSignSuccess = useCallback((message) => {
        setSuccessMessage(message);
        setIsSigningModalOpen(false);
        const fetchSignedDoc = async () => {
             try {
                // Re-fetch document using a dummy password since access is already granted
                const response = await apiService.employeeSignIn(token, 'post_sign_refresh');
                if (response.data.success) {
                    setDocumentData(response.data.documentData);
                }
            } catch (err) {
                // If refresh fails, just show success and don't update UI further
                console.error("Could not refresh document status after signing.", err);
            }
        };
        fetchSignedDoc();
    }, [token]);

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
            setError(err.response?.data?.message || 'Failed to process signature.');
            setLoading(false);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [token, handleSignSuccess]);

    const openSigningModal = () => {
        setSignerConfig({
            signerType: 'employee',
            requiresPassword: false,
            signerInfo: { name: documentData?.employeeName, title: 'Candidate' },
            documentUrl: documentData?.pdfUrl
        });
        setIsSigningModalOpen(true);
    };

    const DetailItem = ({ label, value }) => (
        <div>
            <p className="text-sm text-slate-500">{label}</p>
            <p className="font-semibold text-slate-800">{value || 'N/A'}</p>
        </div>
    );

    return (
        <>
            <div className="min-h-screen bg-slate-50 flex flex-col items-center p-4">
                <div className="w-full max-w-5xl my-8">
                    <div className="text-center mb-8">
                        <svg className="mx-auto h-12 w-auto text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        <h1 className="mt-4 text-3xl font-extrabold text-slate-900">Offer Letter E-Signing</h1>
                        <p className="mt-2 text-sm text-slate-600">Please review and sign your employment offer letter below.</p>
                    </div>

                    {loading && <div className="flex justify-center py-12"><Spinner size="12" /></div>}
                    {error && <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md shadow-lg" role="alert"><p className="font-bold">An Error Occurred</p><p>{error}</p></div>}
                    {successMessage && <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 rounded-md shadow-lg" role="alert"><p className="font-bold">Success</p><p>{successMessage}</p></div>}

                    {documentData && !error && (
                        <div className="bg-white rounded-2xl shadow-2xl mt-6">
                            <div className="p-6 sm:p-10">
                                <h2 className="text-xl font-bold text-slate-800 mb-6">Offer Details</h2>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                    <DetailItem label="Employee Name" value={documentData.employeeName} />
                                    <DetailItem label="Job Title" value={documentData.jobTitle} />
                                    <DetailItem label="Client" value={documentData.clientName} />
                                    <DetailItem label="Start Date" value={new Date(documentData.startDate).toLocaleDateString()} />
                                    <DetailItem label="Billing Rate" value={`$${documentData.billingRate} ${documentData.term}`} />
                                    <DetailItem label="Status" value={documentData.status} />
                                </div>
                            </div>
                            
                            <div className="border-t">
                                <iframe src={documentData.pdfUrl} title="Offer Letter Preview" className="w-full h-[80vh] border-0" />
                            </div>

                            <div className="p-6 sm:p-10 border-t">
                                {!hasBeenSigned ? (
                                    <button onClick={openSigningModal} className="w-full sm:w-auto px-8 py-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-semibold shadow-md transition-all">
                                        Sign and Accept Offer
                                    </button>
                                ) : (
                                    <div className="w-full text-center p-4 bg-green-50 text-green-700 rounded-lg font-semibold">
                                        This offer letter has been signed. A final copy has been sent to your email.
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <AccessModal
                isOpen={isAccessModalOpen}
                onClose={() => { if (!documentData) setError("Access is required to view this document.") }}
                onAccessGranted={handleAccessGranted}
                token={token}
                apiServiceMethod={apiService.employeeSignIn}
                vendorEmail={"the email address on file"}
            />

            <SignatureModal
                isOpen={isSigningModalOpen}
                onClose={() => setIsSigningModalOpen(false)}
                onSign={handleSign}
                signerType={signerConfig.signerType}
                signerInfo={signerConfig.signerInfo}
                requiresPassword={signerConfig.requiresPassword}
                documentUrl={signerConfig.documentUrl}
            />
        </>
    );
};

export default OfferLetterSigningPage;