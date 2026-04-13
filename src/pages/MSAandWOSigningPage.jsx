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
    <div className="mb-4 last:mb-0 border-b border-gray-100 pb-2">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</p>
      <p className="text-sm font-medium text-gray-900 mt-1">{value || 'N/A'}</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f3f4f6] font-sans flex flex-col">
      <nav className="bg-[#323232] text-white shadow-md">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-14 items-center">
            <div className="flex items-center space-x-3">
              <svg className="h-6 w-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
              </svg>
              <span className="font-semibold text-lg tracking-wide">E-Sign Portal</span>
            </div>
            {user && (
              <div className="text-sm text-gray-300">
                Logged in as <span className="font-medium text-white">{user.userName}</span>
              </div>
            )}
          </div>
        </div>
      </nav>

      <div className="max-w-screen-2xl w-full mx-auto px-4 sm:px-6 lg:px-8 mt-4">
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-sm shadow-sm" role="alert">
            <p className="text-sm text-red-700 font-medium">{error}</p>
          </div>
        )}
        {successMessage && (
          <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-sm shadow-sm" role="alert">
            <p className="text-sm text-green-700 font-medium">{successMessage}</p>
          </div>
        )}
      </div>

      <main className="flex-1 max-w-screen-2xl w-full mx-auto py-6 px-4 sm:px-6 lg:px-8 flex flex-col lg:flex-row gap-6">
        
        {loading && !documentData ? (
          <div className="flex-1 flex justify-center items-center">
            <Spinner size="12" />
          </div>
        ) : documentData ? (
          <>
            <div className="flex-1 flex flex-col bg-white border border-gray-200 shadow-sm rounded-sm">
              <div className="bg-gray-50 border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                <h2 className="text-lg font-medium text-gray-800">MSA & Work Order</h2>
                <div className="flex items-center space-x-2">
                  {['Ready', 'Vendor Signed', 'Completed'].map((step, index) => (
                    <div key={step} className="flex items-center">
                      <div className={`flex items-center justify-center h-6 px-3 rounded-full text-xs font-semibold ${
                        index + 1 <= currentStep ? 'bg-[#1473E6] text-white' : 'bg-gray-200 text-gray-500'
                      }`}>
                        {index + 1 < currentStep ? '✓ ' + step : step}
                      </div>
                      {index < 2 && <div className="w-4 h-px bg-gray-300 mx-1"></div>}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex-1 bg-[#525659] min-h-[600px] p-6 flex flex-col items-center overflow-y-auto">
                <div className="w-full max-w-3xl bg-white min-h-full shadow-lg rounded-sm p-12 text-center text-gray-400 border border-gray-300 flex flex-col items-center justify-center">
                  <svg className="h-16 w-16 mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10l6 6v10a2 2 0 01-2 2z"></path>
                  </svg>
                  <p>Document preview will appear here.</p>
                  <p className="text-sm mt-2">Please use the action panel on the right to sign.</p>
                </div>
              </div>
            </div>

            <div className="w-full lg:w-96 flex flex-col gap-6">
              <div className="bg-white border border-gray-200 shadow-sm rounded-sm flex flex-col">
                <div className="p-6">
                  <h2 className="text-xl font-medium text-gray-900 mb-2">Sign Document</h2>
                  <p className="text-sm text-gray-500 mb-6">
                    Review the document details below and click the button to provide your secure e-signature.
                  </p>

                  <div className="space-y-3">
                    {!hasVendorSigned && !user && (
                      <button
                        onClick={() => openSigningModal('vendor')}
                        className="w-full flex items-center justify-center px-4 py-3 bg-[#1473E6] text-white rounded-sm hover:bg-[#0d66d0] font-medium transition-colors shadow-sm"
                      >
                        Click to Sign as Vendor
                      </button>
                    )}
                    
                    {hasVendorSigned && !hasTaprootSigned && canManageMSAWO && user && (
                      <button
                        onClick={() => openSigningModal('taproot')}
                        className="w-full flex items-center justify-center px-4 py-3 bg-[#1473E6] text-white rounded-sm hover:bg-[#0d66d0] font-medium transition-colors shadow-sm"
                      >
                        Approve & Sign as Director
                      </button>
                    )}

                    {hasTaprootSigned && (
                      <div className="w-full flex items-center justify-center p-4 bg-green-50 border border-green-200 text-green-700 rounded-sm">
                        <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                        </svg>
                        <span className="font-medium text-sm">Document is fully signed</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-white border border-gray-200 shadow-sm rounded-sm flex-1">
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                  <h3 className="text-sm font-semibold text-gray-700">Contract Summary</h3>
                </div>
                <div className="p-6 max-h-[600px] overflow-y-auto">
                  <DetailItem label="Contract Number" value={documentData.contractNumber} />
                  <DetailItem label="Status" value={documentData.status} />
                  <DetailItem label="Vendor Company" value={documentData.vendorName} />
                  <DetailItem label="Candidate Name" value={documentData.candidateName} />
                  <DetailItem label="Job Title" value={documentData.jobTitle} />
                  <DetailItem label="Client Name" value={documentData.clientName} />
                  <DetailItem label="Client Location" value={documentData.clientLocation} />
                  <DetailItem 
                    label="Tentative Start Date" 
                    value={documentData.tentativeStartDate ? new Date(documentData.tentativeStartDate).toLocaleDateString() : 'N/A'} 
                  />
                  <DetailItem label="Service Type" value={documentData.typeOfServices} />
                  <DetailItem label="Rate" value={`$${documentData.rate} ${documentData.perHour}`} />
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