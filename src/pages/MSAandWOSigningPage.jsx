import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../api/apiService';
import Spinner from '../components/Spinner';
import AccessModal from '../components/msa-wo/AccessModal';
import VendorSigningModal from '../components/msa-wo/VendorSigningModal';
import TaprootSigningModal from '../components/msa-wo/TaprootSigningModal';
import { usePermissions } from '../hooks/usePermissions';

const MSAandWOSigningPage = ({ token }) => {
    const { user } = useAuth();
    const { canAddPosting } = usePermissions(); // Using canAddPosting as a proxy for Taproot Director access

    const [documentData, setDocumentData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isAccessModalOpen, setIsAccessModalOpen] = useState(false);
    const [isVendorSigningModalOpen, setIsVendorSigningModalOpen] = useState(false);
    const [isTaprootSigningModalOpen, setIsTaprootSigningModalOpen] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

    const hasVendorSigned = documentData?.status === 'Vendor Signed' || documentData?.status === 'Fully Signed';
    const hasTaprootSigned = documentData?.status === 'Fully Signed';

    // Handler for successful access from the modal
    const handleAccessGranted = useCallback((data) => {
        setDocumentData(data);
        setIsAccessModalOpen(false);
        setLoading(false);
    }, []);

    // Handler for successful signing
    const handleSignSuccess = useCallback((message) => {
        setSuccessMessage(message);
        // Reload data to reflect the new signing status
        // A direct API call here is a good idea to refresh the view
        // For now, we'll just reload the page for simplicity
        setTimeout(() => {
            window.location.reload();
        }, 1500);
    }, []);

    // Handler for signing actions (from modals)
    const handleSign = useCallback(async (signerData, signerType, docToken) => {
        setLoading(true);
        setError('');
        try {
            const response = await apiService.updateSigningStatus(docToken, signerData, signerType, user?.userIdentifier);
            if (response.data.success) {
                handleSignSuccess(response.data.message);
            } else {
                throw new Error(response.data.message);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to sign the document.');
            throw err; // Re-throw to show error in modal
        } finally {
            setLoading(false);
        }
    }, [user?.userIdentifier, handleSignSuccess]);

    useEffect(() => {
        if (token) {
            setIsAccessModalOpen(true);
            setLoading(false);
        } else {
            setError("No document token provided in the URL.");
            setLoading(false);
        }
    }, [token]);

    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-6xl">
                <h1 className="text-2xl font-bold text-gray-800 mb-2">MSA and Work Order</h1>
                {documentData && (
                    <p className="text-gray-600">Document for: <span className="font-semibold">{documentData.vendorName}</span></p>
                )}
                <div className="mt-6">
                    {loading && <Spinner />}
                    {error && <div className="text-red-500 bg-red-100 p-4 rounded-lg mt-4">{error}</div>}
                    {successMessage && <div className="text-green-500 bg-green-100 p-4 rounded-lg mt-4">{successMessage}</div>}

                    {/* Display the document when access is granted */}
                    {documentData && (
                        <div>
                            {/* In a real scenario, this would be a PDF viewer or a rendered document */}
                            <div className="border rounded-md p-4 bg-gray-50 overflow-y-auto max-h-[600px] mb-4">
                                <h3 className="font-bold text-xl">Document Preview</h3>
                                <pre className="whitespace-pre-wrap text-sm">{JSON.stringify(documentData, null, 2)}</pre>
                            </div>

                            {/* Signing Actions */}
                            <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 mt-6">
                                {/* Vendor Sign Button */}
                                {!hasVendorSigned && (
                                    <button onClick={() => setIsVendorSigningModalOpen(true)} className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                                        Sign as Vendor
                                    </button>
                                )}
                                {/* Taproot Sign Button - only visible after vendor signs */}
                                {hasVendorSigned && !hasTaprootSigned && canAddPosting && (
                                    <button onClick={() => setIsTaprootSigningModalOpen(true)} className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                                        Sign as Taproot Director
                                    </button>
                                )}
                                {/* Download Final Button - only visible after both sign */}
                                {hasTaprootSigned && (
                                    <button onClick={() => alert('Download final PDF not implemented.')} className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700">
                                        Download Final Document
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Modals for the workflow */}
            <AccessModal
                isOpen={isAccessModalOpen}
                onClose={() => setIsAccessModalOpen(false)}
                onAccessGranted={handleAccessGranted}
                token={token}
                vendorEmail={documentData?.vendorEmail} // Use vendor email from document data if available
            />
            {documentData && (
                <>
                    <VendorSigningModal
                        isOpen={isVendorSigningModalOpen}
                        onClose={() => setIsVendorSigningModalOpen(false)}
                        onSign={handleSign}
                        documentData={documentData}
                    />
                    <TaprootSigningModal
                        isOpen={isTaprootSigningModalOpen}
                        onClose={() => setIsTaprootSigningModalOpen(false)}
                        onSign={handleSign}
                        documentData={documentData}
                    />
                </>
            )}
        </div>
    );
};

export default MSAandWOSigningPage;