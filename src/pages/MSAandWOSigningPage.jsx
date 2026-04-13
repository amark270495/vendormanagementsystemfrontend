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


/* ---------------- PDF Preview ---------------- */

const DocumentPreview = ({ pdfUrl }) => {

  if (!pdfUrl) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        Document preview unavailable.
      </div>
    );
  }

  return (
    <iframe
      src={pdfUrl}
      title="Document Preview"
      className="w-full h-full border-0 rounded-lg"
    />
  );
};


/* ---------------- Main Page ---------------- */

const MSAandWOSigningPage = () => {

  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const { user } = useAuth() || {};
  const { canManageMSAWO } = usePermissions();

  const [documentData, setDocumentData] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const [isAccessModalOpen, setIsAccessModalOpen] = useState(false);
  const [isSigningModalOpen, setIsSigningModalOpen] = useState(false);

  const [signerConfig, setSignerConfig] = useState({});


  /* ---------------- Status Flags ---------------- */

  const hasVendorSigned =
    documentData?.status === 'Vendor Signed' ||
    documentData?.status === 'Fully Signed';

  const hasTaprootSigned =
    documentData?.status === 'Fully Signed';



  /* ---------------- Fetch Document ---------------- */

  const fetchDocument = useCallback(async (isPolling = false) => {

    if (!token) return;

    try {

      if (!isPolling) setLoading(true);

      const response =
        await apiService.getMSAandWODetailForSigning(
          token,
          user?.userIdentifier || 'vendor@external.com'
        );

      if (response.data.success) {

        setDocumentData(response.data.documentData);

        sessionStorage.setItem(
          'vms_vendor_session',
          JSON.stringify({
            token,
            verified: true,
          })
        );

        setError('');

      } else {

        setError(response.data.message);
      }

    } catch (err) {

      if (!isPolling) {

        setError(
          err.response?.data?.message ||
          'Failed to load document.'
        );
      }

    } finally {

      if (!isPolling) setLoading(false);
    }

  }, [token, user?.userIdentifier]);


  /* ---------------- Access Modal Success ---------------- */

  const handleAccessGranted = useCallback((data) => {

    sessionStorage.setItem(
      'vms_vendor_session',
      JSON.stringify({
        token,
        verified: true
      })
    );

    setDocumentData(data);

    setIsAccessModalOpen(false);

    setLoading(false);

  }, [token]);


  /* ---------------- Sign Action ---------------- */

  const handleSign = useCallback(

    async (signerData, signerType) => {

      setLoading(true);

      try {

        const jobInfo = {

          jobTitle: documentData.jobTitle,
          clientName: documentData.clientName,
          clientLocation: documentData.clientLocation,
          tentativeStartDate: documentData.tentativeStartDate,

        };

        const response =
          await apiService.updateSigningStatus(
            token,
            signerData,
            signerType,
            user?.userIdentifier || 'vendor',
            jobInfo
          );

        if (response.data.success) {

          setSuccessMessage(
            'Document signed successfully'
          );

          setIsSigningModalOpen(false);

          setTimeout(() => {

            setSuccessMessage('');

            fetchDocument();

          }, 1500);

        }

      } catch (err) {

        setError(
          err.response?.data?.message ||
          'Signing failed'
        );

      } finally {

        setLoading(false);
      }

    },

    [documentData, token, user?.userIdentifier, fetchDocument]

  );


  /* ---------------- Initial Load ---------------- */

  useEffect(() => {

    if (!token) {

      setError('Invalid signing link');

      setLoading(false);

      return;
    }

    const vendorSession =
      sessionStorage.getItem('vms_vendor_session');

    if (user?.userIdentifier) {

      fetchDocument();

      return;
    }

    if (vendorSession) {

      const parsed =
        JSON.parse(vendorSession);

      if (parsed.token === token) {

        fetchDocument();

        return;
      }

    }

    setIsAccessModalOpen(true);

    setLoading(false);

  }, [token, user, fetchDocument]);


  /* ---------------- Polling ---------------- */

  useEffect(() => {

    const interval = setInterval(() => {

      if (
        documentData &&
        documentData.status !== 'Fully Signed'
      ) {

        fetchDocument(true);

      }

    }, 8000);

    return () => clearInterval(interval);

  }, [documentData, fetchDocument]);



  /* ---------------- Open Sign Modal ---------------- */

  const openSigningModal = (type) => {

    if (type === 'vendor') {

      setSignerConfig({

        signerType: 'vendor',

        signerInfo: {

          name:
            documentData.authorizedSignatureName,

          title:
            documentData.authorizedPersonTitle,
        },

        requiresPassword: false,

      });

    }

    if (type === 'taproot') {

      setSignerConfig({

        signerType: 'taproot',

        signerInfo: {

          name: user?.userName,

          title: 'Director',

        },

        requiresPassword: true,

      });

    }

    setIsSigningModalOpen(true);

  };



  /* ---------------- UI ---------------- */

  return (

    <>
      <div className="min-h-screen bg-slate-100 p-6">

        <div className="max-w-7xl mx-auto">


          <h1 className="text-3xl font-bold text-gray-800 mb-6">

            Document E-Signing Portal

          </h1>


          {loading &&
            <div className="flex justify-center p-20">
              <Spinner size="12" />
            </div>
          }


          {error &&
            <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-4">
              {error}
            </div>
          }


          {successMessage &&
            <div className="bg-green-100 text-green-700 p-4 rounded-lg mb-4">
              {successMessage}
            </div>
          }


          {documentData &&

            <div className="bg-white shadow-xl rounded-xl overflow-hidden">


              <div className="grid grid-cols-12 h-[80vh]">


                {/* LEFT PDF VIEW */}

                <div className="col-span-8 bg-gray-100 p-4 border-r">

                  <div className="h-full bg-white rounded-lg shadow">

                    <DocumentPreview
                      pdfUrl={documentData.pdfUrl}
                    />

                  </div>

                </div>



                {/* RIGHT PANEL */}

                <div className="col-span-4 p-6 flex flex-col">


                  <h2 className="text-lg font-bold mb-6">

                    Document Info

                  </h2>


                  <div className="space-y-3 text-sm">


                    <div>
                      <p className="text-gray-500">
                        Contract
                      </p>

                      <p className="font-semibold">
                        {documentData.contractNumber}
                      </p>
                    </div>


                    <div>
                      <p className="text-gray-500">
                        Vendor
                      </p>

                      <p className="font-semibold">
                        {documentData.vendorName}
                      </p>
                    </div>


                    <div>
                      <p className="text-gray-500">
                        Candidate
                      </p>

                      <p className="font-semibold">
                        {documentData.candidateName}
                      </p>
                    </div>


                    <div>
                      <p className="text-gray-500">
                        Client
                      </p>

                      <p className="font-semibold">
                        {documentData.clientName}
                      </p>
                    </div>


                    <div>
                      <p className="text-gray-500">
                        Start Date
                      </p>

                      <p className="font-semibold">
                        {documentData.tentativeStartDate}
                      </p>
                    </div>


                    <div>
                      <p className="text-gray-500">
                        Status
                      </p>

                      <p className="font-semibold">
                        {documentData.status}
                      </p>
                    </div>

                  </div>



                  <div className="mt-auto space-y-3">


                    {!hasVendorSigned && !user &&
                      <button
                        onClick={() =>
                          openSigningModal('vendor')
                        }
                        className="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700"
                      >
                        Sign as Vendor
                      </button>
                    }


                    {hasVendorSigned &&
                      !hasTaprootSigned &&
                      canManageMSAWO &&
                      user &&
                      <button
                        onClick={() =>
                          openSigningModal('taproot')
                        }
                        className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700"
                      >
                        Sign as Taproot Director
                      </button>
                    }


                    {hasTaprootSigned &&
                      <div className="text-green-600 font-semibold text-center">
                        Fully Signed
                      </div>
                    }

                  </div>


                </div>


              </div>

            </div>

          }


        </div>

      </div>



      <AccessModal
        isOpen={isAccessModalOpen}
        onClose={() =>
          setIsAccessModalOpen(false)
        }
        onAccessGranted={handleAccessGranted}
        token={token}
      />


      <SignatureModal
        isOpen={isSigningModalOpen}
        onClose={() =>
          setIsSigningModalOpen(false)
        }
        onSign={handleSign}
        signerType={signerConfig.signerType}
        signerInfo={signerConfig.signerInfo}
        requiresPassword={signerConfig.requiresPassword}
        documentUrl={documentData?.pdfUrl}
      />

    </>
  );

};

export default MSAandWOSigningPage;