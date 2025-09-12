import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

// --- Import modal components ---
import AccessModal from '../components/msa-wo/AccessModal';
import SignatureModal from '../components/msa-wo/SignatureModal';

// Import Generic Components
import Spinner from '../components/Spinner';

// Import Context and Hooks
import { useAuth } from '../context/AuthContext';
import { usePermissions } from '../hooks/usePermissions';

// --- CENTRAL API SERVICE ---
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

// --- MAIN E-SIGNING PAGE COMPONENT ---
const MSAandWOSigningPage = ({ token }) => {
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

  // Called when AccessModal validates successfully
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
      window.location.reload();
    }, 2000);
  }, []);

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
    const fetchDocument = async () => {
      setLoading(true);
      try {
        const response = await apiService.getMSAandWODetailForSigning(
          token,
          user?.userIdentifier
        );
        if (response.data.success) {
          setDocumentData(response.data.documentData);
        } else {
          setError(response.data.message);
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to retrieve document.');
      } finally {
        setLoading(false);
      }
    };

    if (!token) {
      setError('No document token provided in the URL.');
      setLoading(false);
      return;
    }

    const sessionUser = sessionStorage.getItem('vms_user');
    if (user && user.userIdentifier) {
      fetchDocument();
    } else if (sessionUser) {
      setLoading(true);
    } else {
      setIsAccessModalOpen(true);
      setLoading(false);
    }
  }, [token, user]);

  // Configure and open Signature Modal
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
            <svg
              className="mx-auto h-12 w-auto text-indigo-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              ></path>
            </svg>
            <h1 className="mt-4 text-3xl font-extrabold text-gray-900">
              Document E-Signing Portal
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              Securely review and sign your MSA & Work Order.
            </p>
          </div>

          {loading && (
            <div className="flex justify-center py-12">
              <Spinner size="12" />
            </div>
          )}
          {error && (
            <div
              className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md shadow-lg"
              role="alert"
            >
              <p className="font-bold">An Error Occurred</p>
              <p>{error}</p>
            </div>
          )}
          {successMessage && (
            <div
              className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 rounded-md shadow-lg"
              role="alert"
            >
              <p className="font-bold">Success</p>
              <p>{successMessage}</p>
            </div>
          )}

          {documentData && !error && (
            <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-10 mt-6">
              <div className="mb-8">
                <h2 className="text-xl font-bold text-gray-800">
                  Signing Status
                </h2>
                <div className="flex items-center mt-4">
                  {['Document Ready', 'Vendor Signed', 'Fully Signed'].map(
                    (step, index) => (
                      <React.Fragment key={step}>
                        <div className="flex flex-col items-center">
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center ${
                              index + 1 <= currentStep
                                ? 'bg-indigo-600 text-white'
                                : 'bg-gray-200 text-gray-600'
                            }`}
                          >
                            {index + 1 < currentStep ? '✓' : index + 1}
                          </div>
                          <p
                            className={`mt-2 text-xs text-center font-semibold ${
                              index + 1 <= currentStep
                                ? 'text-indigo-600'
                                : 'text-gray-600'
                            }`}
                          >
                            {step}
                          </p>
                        </div>
                        {index < 2 && (
                          <div
                            className={`flex-1 h-1 mx-2 ${
                              index + 1 < currentStep
                                ? 'bg-indigo-600'
                                : 'bg-gray-200'
                            }`}
                          ></div>
                        )}
                      </React.Fragment>
                    )
                  )}
                </div>
              </div>

              <div className="border-t pt-8">
                <h2 className="text-xl font-bold text-gray-800 mb-6">
                  Document Details
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  <DetailItem
                    label="Contract Number"
                    value={documentData.contractNumber}
                  />
                  <DetailItem
                    label="Vendor Company"
                    value={documentData.vendorName}
                  />
                  <DetailItem
                    label="Candidate Name"
                    value={documentData.candidateName}
                  />
                  <DetailItem
                    label="Job Title"
                    value={documentData.jobTitle}
                  />
                  <DetailItem
                    label="Client Name"
                    value={documentData.clientName}
                  />
                  <DetailItem
                    label="Client Location"
                    value={documentData.clientLocation}
                  />
                  <DetailItem
                    label="Tentative Start Date"
                    value={
                      documentData.tentativeStartDate
                        ? new Date(
                            documentData.tentativeStartDate
                          ).toLocaleDateString()
                        : 'N/A'
                    }
                  />
                  <DetailItem
                    label="Service Type"
                    value={documentData.typeOfServices}
                  />
                  <DetailItem
                    label="Rate"
                    value={`$${documentData.rate} ${documentData.perHour}`}
                  />
                  <DetailItem label="Status" value={documentData.status} />
                </div>
                <div className="mt-8 flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                  {!hasVendorSigned && !user && (
                    <button
                      onClick={() => openSigningModal('vendor')}
                      className="w-full sm:w-auto flex-1 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-semibold shadow-md"
                    >
                      Sign as Vendor
                    </button>
                  )}
                  {hasVendorSigned && !hasTaprootSigned && canManageMSAWO && user && (
                    <button
                      onClick={() => openSigningModal('taproot')}
                      className="w-full sm:w-auto flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold shadow-md"
                    >
                      Sign as Taproot Director
                    </button>
                  )}
                  {hasTaprootSigned && (
                    <div className="w-full text-center p-4 bg-green-50 text-green-700 rounded-lg font-semibold">
                      This document is fully signed and complete.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Access Modal */}
      <AccessModal
        isOpen={isAccessModalOpen}
        onClose={() => setIsAccessModalOpen(false)}
        onAccessGranted={handleAccessGranted}
        token={token}
      />

      {/* Signature Modal */}
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

export default MSAandWOSigningPage;