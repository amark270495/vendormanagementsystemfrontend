import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import AccessModal from '../components/msa-wo/AccessModal';
import SignatureModal from '../components/msa-wo/SignatureModal';
import Spinner from '../components/Spinner';
import { useAuth } from '../context/AuthContext';
import { usePermissions } from '../hooks/usePermissions';

const API_BASE_URL = '/api';
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

const apiService = {
  accessMSAandWO: (token, tempPassword) =>
    apiClient.post('/accessMSAandWO', { token, tempPassword }),
  getMSAandWODetailForSigning: (token, authenticatedUsername) =>
    apiClient.get('/getMSAandWODetailForSigning', {
      params: { token, authenticatedUsername },
    }),
  updateSigningStatus: (
    token,
    signerData,
    signerType,
    authenticatedUsername,
    jobInfo
  ) =>
    apiClient.post('/updateSigningStatus', {
      token,
      signerData,
      signerType,
      authenticatedUsername,
      jobInfo,
    }),
};

const MSAandWOSigningPage = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const { user } = useAuth() || {};
  const { canManageMSAWO } = usePermissions();

  const [documentData, setDocumentData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isAccessModalOpen, setIsAccessModalOpen] = useState(false);
  const [isSigningModalOpen, setIsSigningModalOpen] = useState(false);
  const [signerConfig, setSignerConfig] = useState({});
  const [successMessage, setSuccessMessage] = useState('');

  const hasVendorSigned =
    documentData?.status === 'Vendor Signed' ||
    documentData?.status === 'Fully Signed';
  const hasTaprootSigned = documentData?.status === 'Fully Signed';

  const fetchDocument = useCallback(async (isPolling = false) => {
    if (!isPolling) setLoading(true);
    setError('');
    try {
      const response = await apiService.getMSAandWODetailForSigning(
        token,
        user?.userIdentifier
      );
      if (response.data.success) {
        setDocumentData(response.data.documentData);
      } else if (!isPolling) {
        setError(response.data.message);
      }
    } catch (err) {
      if (!isPolling) {
        setError(err.response?.data?.message || 'Failed to retrieve document.');
      } else {
        console.error("Polling failed:", err);
      }
    } finally {
      if (!isPolling) setLoading(false);
    }
  }, [token, user?.userIdentifier]);

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
    setTimeout(() => {
      setSuccessMessage('');
      fetchDocument(); 
    }, 2000);
  }, [fetchDocument]);

  const handleSign = useCallback(
    async (signerData, signerType) => {
      setLoading(true);
      setError('');
      try {
        const signerUsername = user?.userIdentifier || 'vendor';
        const jobInfo = {
          jobTitle: documentData.jobTitle,
          clientName: documentData.clientName,
          clientLocation: documentData.clientLocation,
          tentativeStartDate: documentData.tentativeStartDate,
        };
        const response = await apiService.updateSigningStatus(
          token,
          signerData,
          signerType,
          signerUsername,
          jobInfo
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
    [token, user?.userIdentifier, documentData, handleSignSuccess]
  );

  useEffect(() => {
    if (!token) {
      setError('No document token provided in the URL.');
      setLoading(false);
      return;
    }

    if (documentData) return;

    const sessionUser = sessionStorage.getItem('vms_user');
    if (user && user.userIdentifier) {
      fetchDocument(false);
    } else if (sessionUser) {
      setLoading(true);
    } else {
      setIsAccessModalOpen(true);
      setLoading(false);
    }
  }, [token, user, fetchDocument, documentData]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (user && user.userIdentifier && documentData && documentData.status !== 'Fully Signed') {
        fetchDocument(true);
      }
    }, 10000); 

    return () => clearInterval(interval);
  }, [user, documentData, fetchDocument]);

  const openSigningModal = (type) => {
    if (type === 'vendor') {
      setSignerConfig({
        signerType: 'vendor',
        requiresPassword: false,
        signerInfo: {
          name: documentData?.authorizedSignatureName,
          title: documentData?.authorizedPersonTitle,
        },
      });
    } else if (type === 'taproot') {
      setSignerConfig({
        signerType: 'taproot',
        requiresPassword: true,
        signerInfo: {
          name: user?.userName,
          title: 'Director',
        },
      });
    }
    setIsSigningModalOpen(true);
  };

  const getStatusStep = () => {
    if (hasTaprootSigned) return 3;
    if (hasVendorSigned) return 2;
    return 1;
  };
  
  const currentStep = getStatusStep();

  const DetailItem = ({ label, value }) => (
    <div className="flex flex-col py-3 border-b border-gray-100 last:border-0">
      <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">{label}</span>
      <span className="text-sm font-medium text-gray-900">{value || 'N/A'}</span>
    </div>
  );

  // We use h-screen and overflow-hidden to create an App-like workspace frame
  return (
    <div className="h-screen w-full bg-[#f4f4f5] font-sans flex flex-col overflow-hidden">
      
      {/* Enterprise Top Navigation */}
      <nav className="bg-white border-b border-gray-200 h-16 flex-shrink-0 z-20 shadow-sm relative">
        <div className="h-full w-full px-6 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            {/* Minimalist Logo Icon */}
            <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center shadow-inner">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-gray-900 text-sm leading-tight">Document Cloud</span>
              <span className="text-xs text-gray-500 font-medium">Secure E-Signature Portal</span>
            </div>
          </div>

          <div className="flex items-center space-x-6">
            {user && (
              <div className="flex items-center space-x-3 border-l border-gray-200 pl-6">
                <div className="w-8 h-8 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center">
                  <span className="text-sm font-bold text-gray-600">{user.userName?.charAt(0).toUpperCase()}</span>
                </div>
                <span className="text-sm font-medium text-gray-700">{user.userName}</span>
              </div>
            )}
          </div>
        </div>
        
        {/* Floating Alerts inside Workspace */}
        {(error || successMessage) && (
          <div className="absolute top-full left-0 w-full flex justify-center pt-4 pointer-events-none z-50">
            {error && (
              <div className="bg-white border-l-4 border-red-500 shadow-xl rounded py-3 px-6 pointer-events-auto flex items-center space-x-3 min-w-[300px]">
                <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"></path></svg>
                <span className="text-sm font-medium text-gray-800">{error}</span>
              </div>
            )}
            {successMessage && (
              <div className="bg-white border-l-4 border-green-500 shadow-xl rounded py-3 px-6 pointer-events-auto flex items-center space-x-3 min-w-[300px]">
                <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path></svg>
                <span className="text-sm font-medium text-gray-800">{successMessage}</span>
              </div>
            )}
          </div>
        )}
      </nav>

      {/* Main Workspace Frame */}
      <main className="flex-1 flex overflow-hidden relative">
        
        {loading && !documentData ? (
          <div className="absolute inset-0 z-50 bg-white/80 backdrop-blur-sm flex justify-center items-center">
            <Spinner size="12" />
          </div>
        ) : documentData ? (
          <>
            {/* Left Column: Dark PDF Viewer */}
            <div className="flex-1 bg-[#323639] overflow-y-auto flex flex-col relative custom-scrollbar">
              
              {/* Fake PDF Toolbar */}
              <div className="sticky top-0 bg-[#323639] border-b border-[#202224] h-12 flex-shrink-0 flex items-center justify-center space-x-6 z-10 shadow-sm text-gray-400">
                 <button className="hover:text-white transition-colors"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4"></path></svg></button>
                 <span className="text-sm font-medium">100%</span>
                 <button className="hover:text-white transition-colors"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg></button>
              </div>

              {/* The "Paper" Container */}
              <div className="flex-1 py-10 flex justify-center px-4 sm:px-8">
                <div className="bg-white w-full max-w-[850px] min-h-[1100px] shadow-[0_10px_40px_rgba(0,0,0,0.3)] flex flex-col items-center justify-center border border-gray-200">
                  <svg className="h-20 w-20 text-gray-200 mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                  </svg>
                  <p className="text-gray-400 font-medium text-lg">Document Preview Pending</p>
                  <p className="text-gray-400 text-sm mt-2">Check the action panel to sign.</p>
                </div>
              </div>
            </div>

            {/* Right Column: Sticky Action Sidebar */}
            <div className="w-full md:w-[380px] lg:w-[420px] bg-white border-l border-gray-200 flex flex-col shadow-[-10px_0_20px_rgba(0,0,0,0.03)] z-20 flex-shrink-0">
              
              {/* Sidebar Header */}
              <div className="p-6 border-b border-gray-200 bg-gray-50/50">
                <h1 className="text-xl font-bold text-gray-900 leading-tight">Master Services Agreement</h1>
                <p className="text-sm text-gray-500 mt-1">Review and complete your signature</p>
              </div>

              {/* Scrollable Details Area */}
              <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                
                {/* Progress Stepper */}
                <div className="mb-8">
                  <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-4">Signature Progress</h3>
                  <div className="space-y-4">
                    {['Document Ready', 'Vendor Signature', 'Director Signature'].map((step, index) => {
                      const isActive = index + 1 === currentStep;
                      const isCompleted = index + 1 < currentStep;
                      return (
                        <div key={step} className="flex items-center">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 border-2 ${
                            isCompleted ? 'bg-green-500 border-green-500 text-white' :
                            isActive ? 'border-blue-600 bg-blue-50 text-blue-600' :
                            'border-gray-200 text-gray-400 bg-white'
                          }`}>
                            {isCompleted ? (
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path></svg>
                            ) : (
                              <span className="text-[10px] font-bold">{index + 1}</span>
                            )}
                          </div>
                          <span className={`ml-3 text-sm font-medium ${isActive ? 'text-gray-900' : isCompleted ? 'text-gray-700' : 'text-gray-400'}`}>
                            {step}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Contract Summary */}
                <div>
                  <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2 border-b border-gray-100 pb-2">Contract Summary</h3>
                  <div className="flex flex-col">
                    <DetailItem label="Contract ID" value={documentData.contractNumber} />
                    <DetailItem label="Status" value={documentData.status} />
                    <DetailItem label="Vendor" value={documentData.vendorName} />
                    <DetailItem label="Candidate" value={documentData.candidateName} />
                    <DetailItem label="Role" value={documentData.jobTitle} />
                    <DetailItem label="Client" value={documentData.clientName} />
                    <DetailItem label="Location" value={documentData.clientLocation} />
                    <DetailItem label="Start Date" value={documentData.tentativeStartDate ? new Date(documentData.tentativeStartDate).toLocaleDateString() : 'N/A'} />
                    <DetailItem label="Type" value={documentData.typeOfServices} />
                    <DetailItem label="Rate" value={`$${documentData.rate} ${documentData.perHour}`} />
                  </div>
                </div>
              </div>

              {/* Sticky Action Footer */}
              <div className="p-6 bg-white border-t border-gray-200 shadow-[0_-4px_15px_rgba(0,0,0,0.02)]">
                {!hasVendorSigned && !user && (
                  <button
                    onClick={() => openSigningModal('vendor')}
                    className="w-full flex items-center justify-center px-4 py-3.5 bg-blue-600 text-white rounded font-semibold text-sm hover:bg-blue-700 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Provide Signature
                  </button>
                )}
                
                {hasVendorSigned && !hasTaprootSigned && canManageMSAWO && user && (
                  <button
                    onClick={() => openSigningModal('taproot')}
                    className="w-full flex items-center justify-center px-4 py-3.5 bg-blue-600 text-white rounded font-semibold text-sm hover:bg-blue-700 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Approve & Sign Document
                  </button>
                )}

                {hasTaprootSigned && (
                  <div className="w-full flex items-center justify-center py-3.5 bg-green-50 border border-green-200 text-green-700 rounded shadow-sm">
                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                    </svg>
                    <span className="font-semibold text-sm">Fully Executed</span>
                  </div>
                )}
                
                {/* Security Badge */}
                <div className="mt-4 flex items-center justify-center text-gray-400">
                  <svg className="w-3.5 h-3.5 mr-1.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd"></path></svg>
                  <span className="text-[10px] uppercase tracking-wider font-bold">Secured via SSL Encryption</span>
                </div>
              </div>
            </div>
          </>
        ) : null}
      </main>

      <AccessModal
        isOpen={isAccessModalOpen}
        onClose={() => setIsAccessModalOpen(false)}
        onAccessGranted={handleAccessGranted}
        token={token}
      />

      <SignatureModal
        isOpen={isSigningModalOpen}
        onClose={() => setIsSigningModalOpen(false)}
        onSign={handleSign}
        signerType={signerConfig.signerType}
        signerInfo={signerConfig.signerInfo}
        requiresPassword={signerConfig.requiresPassword}
        documentUrl={documentData?.documentUrl}
      />
    </div>
  );
};

export default MSAandWOSigningPage;