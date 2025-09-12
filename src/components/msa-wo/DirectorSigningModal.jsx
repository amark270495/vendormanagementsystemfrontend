import React, { useState } from 'react';
import Modal from '../Modal';
import SignatureModal from './SignatureModal'; // We will still use the advanced signature modal

// This version simplifies the logic and fixes the data flow to resolve the error.
const DirectorSigningModal = ({ isOpen, onClose, onSign, document, user }) => {
    const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);

    // This function acts as a bridge. It receives data from the SignatureModal,
    // adds director-specific details, and then passes it up to the main page's onSign handler.
    const handleSignSubmit = async (signerData, signerType) => {
        // Construct the final data payload with director-specific info
        const finalSignerData = {
            ...signerData,
            name: user?.userName || 'Director', // Use the authenticated user's name
            title: 'Director'
        };
        
        // Call the onSign prop that was passed down from MSAandWOSigningPage.
        // This triggers the API call and handles success/error on the main page.
        await onSign(finalSignerData, signerType);

        // Close both modals upon completion
        setIsSignatureModalOpen(false);
        onClose(); 
    };

    if (!isOpen || !document) return null;

    return (
        <>
            <Modal isOpen={isOpen} onClose={onClose} title={`Sign Document: ${document.contractNumber}`} size="6xl">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[75vh]">
                    {/* PDF Viewer */}
                    <div className="lg:col-span-1 h-full bg-gray-200 rounded-lg overflow-hidden">
                        {document.pdfUrl ? (
                            <iframe src={document.pdfUrl} title="Document Preview" className="w-full h-full border-0" />
                        ) : (
                            <div className="flex items-center justify-center h-full bg-gray-100"><p className="text-gray-500">Could not load document preview.</p></div>
                        )}
                    </div>
                    {/* Action Panel */}
                    <div className="lg:col-span-1 flex flex-col justify-between bg-gray-50 p-6 rounded-lg border">
                        <div>
                            <h3 className="text-lg font-bold text-gray-800 mb-4">Confirm Signature</h3>
                            <p className="text-sm text-gray-600 mb-6">Review the document. To finalize and sign on behalf of Taproot Solutions, click the "Proceed to Sign" button.</p>
                        </div>
                        <div className="flex justify-end space-x-2 pt-4 border-t mt-6">
                            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Cancel</button>
                            <button onClick={() => setIsSignatureModalOpen(true)} className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 flex items-center justify-center w-36">
                                Proceed to Sign
                            </button>
                        </div>
                    </div>
                </div>
            </Modal>
            
            {/* The SignatureModal is triggered from here, passing the corrected handler */}
            <SignatureModal
                isOpen={isSignatureModalOpen}
                onClose={() => setIsSignatureModalOpen(false)}
                onSign={handleSignSubmit}
                signerType="taproot"
                requiresPassword={true}
                signerName={user?.userName}
            />
        </>
    );
};

export default DirectorSigningModal;