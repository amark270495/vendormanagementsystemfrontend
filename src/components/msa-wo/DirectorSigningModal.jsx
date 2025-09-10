import React, { useState, useEffect } from 'react';
import Modal from '../Modal.jsx';
import Spinner from '../Spinner.jsx';
import { useAuth } from '../../context/AuthContext';
import { apiService } from '../../api/apiService';
import SignatureModal from './SignatureModal.jsx'; // Import the new signature modal

const DirectorSigningModal = ({ isOpen, onClose, document, onSuccess }) => {
    const { user } = useAuth();
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);

    // This modal now primarily acts as a viewer and a trigger for the new SignatureModal
    const handleSignClick = () => {
        setIsSignatureModalOpen(true);
    };

    const handleSignSubmit = async (signerData, signerType) => {
        // The core signing logic is passed to the SignatureModal
        if (!document || !document.rowKey) {
            throw new Error("Document information is missing.");
        }
        try {
            // Pass the director's name from the user context
            const finalSignerData = {
                ...signerData,
                name: user?.userName || signerData.name,
                title: 'Director'
            };
            await apiService.updateSigningStatus(document.rowKey, finalSignerData, signerType, user.userIdentifier, document);
            onSuccess();
            setIsSignatureModalOpen(false); // Close signature modal on success
        } catch (err) {
            // Re-throw the error so the SignatureModal can display it
            throw err; 
        }
    };

    if (!isOpen || !document) return null;

    return (
        <>
            <Modal isOpen={isOpen} onClose={onClose} title={`Sign Document: ${document.contractNumber}`} size="6xl">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[75vh]">
                    <div className="lg:col-span-2 h-full bg-gray-200 rounded-lg overflow-hidden">
                        {document.pdfUrl ? (
                            <iframe src={document.pdfUrl} title="Document Preview" className="w-full h-full border-0" />
                        ) : (
                            <div className="flex items-center justify-center h-full bg-gray-100"><p className="text-gray-500">Could not load document preview.</p></div>
                        )}
                    </div>
                    <div className="lg:col-span-1 flex flex-col justify-between bg-gray-50 p-6 rounded-lg border">
                        <div>
                            <h3 className="text-lg font-bold text-gray-800 mb-4">Confirm Signature</h3>
                            <p className="text-sm text-gray-600 mb-6">Review the document. To finalize and sign on behalf of Taproot Solutions, click the "Proceed to Sign" button.</p>
                            {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded-md mt-4 text-sm">{error}</div>}
                        </div>
                        <div className="flex justify-end space-x-2 pt-4 border-t mt-6">
                            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Cancel</button>
                            <button onClick={handleSignClick} className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 flex items-center justify-center w-36" disabled={loading}>
                                {loading ? <Spinner size="5" /> : 'Proceed to Sign'}
                            </button>
                        </div>
                    </div>
                </div>
            </Modal>
            
            {/* The new, advanced signature modal is rendered here */}
            <SignatureModal
                isOpen={isSignatureModalOpen}
                onClose={() => setIsSignatureModalOpen(false)}
                onSign={handleSignSubmit}
                signerType="taproot"
                requiresPassword={true}
            />
        </>
    );
};

export default DirectorSigningModal;