import React, { useState, useEffect, useCallback, useRef } from 'react';
import AccessModal from '../components/msa-wo/AccessModal.jsx';
import SignatureModal from '../components/msa-wo/SignatureModal.jsx';
import Spinner from '../components/Spinner';
import { useAuth } from '../context/AuthContext.jsx';
import { apiService } from '../api/apiService.js';

const OfferLetterSigningPage = ({ token }) => { 
  const { user } = useAuth() || {};
  const [documentData, setDocumentData] = useState(null);
  const [loading, setLoading] = useState(true); 
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const [isAccessModalOpen, setIsAccessModalOpen] = useState(false);
  const [isSigningModalOpen, setIsSigningModalOpen] = useState(false);
  const [signerConfig, setSignerConfig] = useState({});
  const hasBeenSigned = documentData?.status === 'Signed';

  useEffect(() => {
    if (token && !user) {
        setIsAccessModalOpen(true);
        setLoading(false);
    } else if (!token) {
        setError('Invalid or missing document token.');
        setLoading(false);
    } else if (token && user) {
        setError("Admins cannot sign Offer Letters. Please open this link in an incognito window.");
        setLoading(false);
    }
  }, [token, user]);

  const handleAccessGranted = useCallback((data) => {
    if (!data) {
      setError('Access denied. Please check your credentials.');
      setLoading(false); 
      return;
    }
    // *** FIX: Check if the pdfUrl is null ***
    if (!data.pdfUrl) {
        setError("Login successful, but the document link is missing or invalid. Please contact support.");
        setLoading(false);
        return;
    }
    // *** END FIX ***
    setDocumentData(data);
    setError('');
    setIsAccessModalOpen(false);
    setLoading(false); 
  }, []);

  const handleSignSuccess = useCallback((message) => {
    setSuccessMessage(message);
    setIsSigningModalOpen(false);
    setLoading(true); 
    
    apiService.employeeSignIn(token, 'post_sign_refresh_token') 
        .then(response => {
            if (response.data.success && response.data.documentData.pdfUrl) {
                setDocumentData(response.data.documentData);
            } else {
                 console.error("Could not refresh document status.", response.data.message);
                 setError("Signature successful, but failed to reload document.");
            }
        })
        .catch(err => {
             console.error("Could not refresh document status.", err);
             setError("Signature successful, but failed to reload document.");
        })
        .finally(() => {
            setLoading(false);
            setTimeout(() => setSuccessMessage(''), 4000);
        });
  }, [token]);

  const handleSign = useCallback(
    async (signerData) => {
      setLoading(true);
      setError('');
      try {
        const response = await apiService.updateOfferLetterStatus(
          token,
          signerData
        );
        if (response.data.success) {
          handleSignSuccess(response.data.message);
        } else {
          throw new Error(response.data.message);
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to sign the document.');
        setLoading(false); 
        throw err; 
      }
    },
    [token, handleSignSuccess] 
  );
  
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

          {loading && (
            <div className="flex justify-center py-12">
              <Spinner size="12" />
            </div>
          )}
          {error && (
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md shadow-lg" role="alert">
              <p className="font-bold">An Error Occurred</p>
              <p>{error}</p>
            </div>
          )}
          {successMessage && (
            <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 rounded-md shadow-lg" role="alert">
              <p className="font-bold">Success</p>
              <p>{successMessage}</p>
            </div>
          )}

           {documentData && !error && (
            <div className="bg-white rounded-2xl shadow-2xl mt-6">
              <div className="p-6 sm:p-10">
                <h2 className="text-xl font-bold text-slate-800 mb-6">Offer Details</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  <DetailItem label="Employee Name" value={documentData.employeeName} />
                   <DetailItem label="Job Title" value={documentData.jobTitle} />
                  <DetailItem label="Client" value={documentData.clientName} />
                  <DetailItem label="Start Date" value={new Date(documentData.startDate + 'T00:00:00Z').toLocaleDateString('en-US', { timeZone: 'UTC' })} />
                  <DetailItem label="Billing Rate" value={`$${documentData.billingRate} ${documentData.term}`} />
                  <DetailItem label="Status" value={documentData.status} />
                 </div>
              </div>
              
              {/* --- *** IFRAME FIX *** --- */}
              {/* We check for pdfUrl before rendering the iframe */}
              <div className="border-t">
                {documentData.pdfUrl ? (
                    <iframe 
                        // Add a `key` to force re-render when the URL changes (e.g., after signing)
                        key={documentData.pdfUrl} 
                        src={documentData.pdfUrl} 
                        title="Offer Letter Preview" 
                        className="w-full h-[80vh] border-0" 
                    />
                ) : (
                    <div className="w-full h-[80vh] flex items-center justify-center bg-gray-100">
                        <p className="text-red-600 font-semibold">Could not load document preview. The link is missing.</p>
                    </div>
                )}
              </div>
              {/* --- *** END IFRAME FIX *** --- */}

              <div className="p-6 sm:p-10 border-t">
                {/* Disable sign button if document is missing or already signed */}
                {!hasBeenSigned ? (
                  <button 
                    onClick={openSigningModal} 
                    className="w-full sm:w-auto px-8 py-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-semibold shadow-md transition-all disabled:bg-gray-400"
                    disabled={!documentData.pdfUrl} 
                  >
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
        documentUrl={documentData?.pdfUrl} 
      />
    </>
  );
};

export default OfferLetterSigningPage;