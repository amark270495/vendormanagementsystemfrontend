import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { apiService } from '../../api/apiService';
import Modal from '../Modal';
import Spinner from '../Spinner';

const DirectorSigningModal = ({ isOpen, onClose, document, onSuccess }) => {
    const { user } = useAuth();
    const [formData, setFormData] = useState({ signature: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // Reset form when modal is opened with a new document
    useEffect(() => {
        if (isOpen) {
            setFormData({ signature: '', password: '' });
            setError('');
        }
    }, [isOpen]);

    const handleChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            // The signerData now includes the password for backend verification
            await apiService.updateSigningStatus(document.rowKey, formData, 'taproot', user.userIdentifier);
            onSuccess(); // Trigger the success callback (which will close modal and refresh data)
        } catch (err) {
            setError(err.response?.data?.message || "An unexpected error occurred. Please check your password and try again.");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen || !document) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Sign Document: ${document.contractNumber}`} size="6xl">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[75vh]">
                {/* PDF Viewer Section */}
                <div className="lg:col-span-2 h-full bg-gray-200 rounded-lg overflow-hidden">
                    {document.pdfUrl ? (
                        <iframe
                            src={document.pdfUrl}
                            title="Document Preview"
                            className="w-full h-full border-0"
                        />
                    ) : (
                        <div className="flex items-center justify-center h-full bg-gray-100">
                            <p className="text-gray-500">Could not load document preview.</p>
                        </div>
                    )}
                </div>

                {/* Signing Form Section */}
                <div className="lg:col-span-1 flex flex-col justify-between bg-gray-50 p-6 rounded-lg border">
                    <div>
                        <h3 className="text-lg font-bold text-gray-800 mb-4">Confirm Signature</h3>
                        <p className="text-sm text-gray-600 mb-6">Review the document on the left. To finalize and sign on behalf of Taproot Solutions, please enter your signature and VMS password below.</p>
                        <form id="director-sign-form" onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label htmlFor="signature" className="block text-sm font-medium text-gray-700">Digital Signature (Type Full Name) <span className="text-red-500">*</span></label>
                                <input type="text" name="signature" id="signature" value={formData.signature} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500" />
                                <p className="mt-1 text-xs text-gray-500">Typing your name here constitutes a legal signature.</p>
                            </div>
                            <div>
                                <label htmlFor="password" className="block text-sm font-medium text-gray-700">Your VMS Password <span className="text-red-500">*</span></label>
                                <input type="password" name="password" id="password" value={formData.password} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500" />
                            </div>
                        </form>
                        {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded-md mt-4 text-sm">{error}</div>}
                    </div>
                    <div className="flex justify-end space-x-2 pt-4 border-t mt-6">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Cancel</button>
                        <button type="submit" form="director-sign-form" className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 flex items-center justify-center w-36" disabled={loading}>
                            {loading ? <Spinner size="5" /> : 'Confirm & Sign'}
                        </button>
                    </div>
                </div>
            </div>
        </Modal>
    );
};

export default DirectorSigningModal;