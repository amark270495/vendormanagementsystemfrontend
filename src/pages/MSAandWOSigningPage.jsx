import React, { useState, useEffect, useMemo, useCallback, useRef, createContext, useReducer, useContext } from 'react';
import axios from 'axios';

// --- CENTRAL API SERVICE (Relevant Functions) ---
const API_BASE_URL = '/api';
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});
const apiService = {
  accessMSAandWO: (token, tempPassword) => apiClient.post('/accessMSAandWO', { token, tempPassword }),
  getMSAandWODetailForSigning: (token, authenticatedUsername) => apiClient.get('/getMSAandWODetailForSigning', { params: { token, authenticatedUsername } }),
  updateSigningStatus: (token, signerData, signerType, authenticatedUsername) => apiClient.post('/updateSigningStatus', { token, signerData, signerType, authenticatedUsername }),
};

// --- CONTEXT & HOOKS (Needed for this page) ---
const AuthContext = createContext();
const useAuth = () => useContext(AuthContext);

const calculatePermissions = (permissions) => {
    if (!permissions) {
        // Default permissions for an unauthenticated user (vendor)
        return { canAddPosting: false }; 
    }
    return {
        canAddPosting: permissions.canAddPosting === true,
    };
};
const usePermissions = () => {
    const auth = useAuth() || {};
    const { permissions } = auth;
    return useMemo(() => calculatePermissions(permissions), [permissions]);
};

// --- GENERIC COMPONENTS (Used by this page) ---
const Spinner = ({ size = '8' }) => (<div className={`animate-spin rounded-full h-${size} w-${size} border-b-2 border-white`}></div>);

const Modal = ({ isOpen, onClose, title, children, size = 'md' }) => {
    if (!isOpen) return null;
    const sizeClasses = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-lg' };
    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex justify-center items-center p-4" aria-modal="true" role="dialog">
            <div className={`bg-white rounded-lg shadow-xl w-full ${sizeClasses[size]} max-h-[90vh] flex flex-col`} onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center p-4 border-b">
                    <h3 className="text-xl font-semibold text-gray-800">{title}</h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-800 p-1 rounded-full hover:bg-gray-100" aria-label="Close modal">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                </div>
                <div className="p-6 overflow-y-auto">{children}</div>
            </div>
        </div>
    );
};

// --- E-SIGNING MODALS ---
const AccessModal = ({ isOpen, onClose, onAccessGranted, token }) => {
    const [tempPassword, setTempPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const response = await apiService.accessMSAandWO(token, tempPassword);
            if (response.data.success) {
                onAccessGranted(response.data.documentData);
            } else {
                setError(response.data.message);
            }
        } catch (err) {
            setError(err.response?.data?.message || "An unexpected error occurred.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Secure Document Access" size="md">
            {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}
            <form onSubmit={handleSubmit} className="space-y-4">
                <p className="text-gray-700">A temporary password was sent to your email. Please enter it below to securely access the document.</p>
                <div>
                    <label htmlFor="tempPassword" className="block text-sm font-medium text-gray-700">Temporary Password <span className="text-red-500">*</span></label>
                    <input type="password" name="tempPassword" id="tempPassword" value={tempPassword} onChange={(e) => setTempPassword(e.target.value)} required className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500" />
                </div>
                <div className="flex justify-end space-x-2 pt-4">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Cancel</button>
                    <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 flex items-center justify-center w-28" disabled={loading}>
                        {loading ? <Spinner size="5" /> : 'Access'}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

const VendorSigningModal = ({ isOpen, onClose, onSign }) => {
    const [formData, setFormData] = useState({ signature: '', name: '', title: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const handleChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await onSign(formData, 'vendor');
            onClose();
        } catch (err) {
            setError(err.message || "An unexpected error occurred.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Sign Document as Vendor" size="md">
            {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}
            <form onSubmit={handleSubmit} className="space-y-4">
                <p className="text-gray-700">By signing, you agree to the terms of the Master Services Agreement and Work Order.</p>
                <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700">Your Full Name <span className="text-red-500">*</span></label>
                    <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm p-2" />
                </div>
                <div>
                    <label htmlFor="title" className="block text-sm font-medium text-gray-700">Your Title <span className="text-red-500">*</span></label>
                    <input type="text" name="title" id="title" value={formData.title} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm p-2" />
                </div>
                <div>
                    <label htmlFor="signature" className="block text-sm font-medium text-gray-700">Digital Signature (Type Full Name) <span className="text-red-500">*</span></label>
                    <input type="text" name="signature" id="signature" value={formData.signature} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm p-2" />
                    <p className="mt-1 text-xs text-gray-500">Typing your name here constitutes a legal signature.</p>
                </div>
                <div className="flex justify-end space-x-2 pt-4">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Cancel</button>
                    <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 flex items-center justify-center w-28" disabled={loading}>
                        {loading ? <Spinner size="5" /> : 'Sign'}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

const TaprootSigningModal = ({ isOpen, onClose, onSign }) => {
    const [formData, setFormData] = useState({ signature: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const handleChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await onSign(formData, 'taproot');
            onClose();
        } catch (err) {
            setError(err.message || "An unexpected error occurred.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Sign Document as Taproot Director" size="md">
            {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}
            <form onSubmit={handleSubmit} className="space-y-4">
                <p className="text-gray-700">By signing, you are approving the terms on behalf of Taproot Solutions.</p>
                <div>
                    <label htmlFor="signature" className="block text-sm font-medium text-gray-700">Digital Signature (Type Full Name) <span className="text-red-500">*</span></label>
                    <input type="text" name="signature" id="signature" value={formData.signature} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm p-2" />
                    <p className="mt-1 text-xs text-gray-500">Typing your name here constitutes a legal signature.</p>
                </div>
                <div className="flex justify-end space-x-2 pt-4">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Cancel</button>
                    <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 flex items-center justify-center w-28" disabled={loading}>
                        {loading ? <Spinner size="5" /> : 'Sign'}
                    </button>
                </div>
            </form>
        </Modal>
    );
};


// --- MAIN E-SIGNING PAGE COMPONENT ---
const MSAandWOSigningPage = ({ token }) => {
    const { user } = useAuth() || {}; 
    const { canAddPosting } = usePermissions();

    const [documentData, setDocumentData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isAccessModalOpen, setIsAccessModalOpen] = useState(false);
    const [isVendorSigningModalOpen, setIsVendorSigningModalOpen] = useState(false);
    const [isTaprootSigningModalOpen, setIsTaprootSigningModalOpen] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

    const hasVendorSigned = documentData?.status === 'Vendor Signed' || documentData?.status === 'Fully Signed';
    const hasTaprootSigned = documentData?.status === 'Fully Signed';

    const handleAccessGranted = useCallback((data) => {
        setDocumentData(data);
        setIsAccessModalOpen(false);
        setLoading(false);
    }, []);

    const handleSignSuccess = useCallback((message) => {
        setSuccessMessage(message);
        setTimeout(() => {
            window.location.reload();
        }, 2000);
    }, []);
    
    const handleSign = useCallback(async (signerData, signerType) => {
        setLoading(true);
        setError('');
        try {
            const signerUsername = user?.userIdentifier || 'vendor';
            const response = await apiService.updateSigningStatus(token, signerData, signerType, signerUsername);
            if (response.data.success) {
                handleSignSuccess(response.data.message);
            } else {
                throw new Error(response.data.message);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to sign the document.');
            throw err;
        } finally {
            setLoading(false);
        }
    }, [token, user?.userIdentifier, handleSignSuccess]);

    useEffect(() => {
        const fetchDocumentForDirector = async () => {
            try {
                const response = await apiService.getMSAandWODetailForSigning(token, user.userIdentifier);
                if (response.data.success) {
                    setDocumentData(response.data.documentData);
                } else {
                    setError(response.data.message);
                }
            } catch (err) {
                setError(err.response?.data?.message || "Failed to retrieve document for signing.");
            } finally {
                setLoading(false);
            }
        };

        if (!token) {
            setError("No document token provided in the URL.");
            setLoading(false);
            return;
        }

        if (user && user.userIdentifier) {
            fetchDocumentForDirector();
        } 
        else {
            setIsAccessModalOpen(true);
            setLoading(false);
        }
    }, [token, user]);

    const getStatusStep = () => {
        if (hasTaprootSigned) return 3;
        if (hasVendorSigned) return 2;
        return 1;
    };
    const currentStep = getStatusStep();
    
    const DetailItem = ({ label, value }) => (
        <div>
            <p className="text-sm text-gray-500">{label}</p>
            <p className="font-semibold text-gray-800">{value}</p>
        </div>
    );
    
    return (
        <>
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
                <div className="w-full max-w-5xl">
                    <div className="text-center mb-8">
                        <svg className="mx-auto h-12 w-auto text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        <h1 className="mt-4 text-3xl font-extrabold text-gray-900">Document E-Signing Portal</h1>
                        <p className="mt-2 text-sm text-gray-600">Securely review and sign your MSA & Work Order.</p>
                    </div>

                    {loading && <div className="flex justify-center py-12"><Spinner size="12" /></div>}
                    {error && <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md shadow-lg" role="alert"><p className="font-bold">An Error Occurred</p><p>{error}</p></div>}
                    {successMessage && <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 rounded-md shadow-lg" role="alert"><p className="font-bold">Success</p><p>{successMessage}</p></div>}

                    {documentData && !error && (
                        <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-10 mt-6">
                            <div className="mb-8">
                                <h2 className="text-xl font-bold text-gray-800">Signing Status</h2>
                                <div className="flex items-center mt-4">
                                    {['Document Ready', 'Vendor Signed', 'Fully Signed'].map((step, index) => (
                                        <React.Fragment key={step}>
                                            <div className="flex flex-col items-center">
                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${index + 1 <= currentStep ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
                                                   {index + 1 < currentStep ? '✓' : index + 1}
                                                </div>
                                                <p className={`mt-2 text-xs text-center font-semibold ${index + 1 <= currentStep ? 'text-indigo-600' : 'text-gray-600'}`}>{step}</p>
                                            </div>
                                            {index < 2 && <div className={`flex-1 h-1 mx-2 ${index + 1 < currentStep ? 'bg-indigo-600' : 'bg-gray-200'}`}></div>}
                                        </React.Fragment>
                                    ))}
                                </div>
                            </div>
                            
                            <div className="border-t pt-8">
                                 <h2 className="text-xl font-bold text-gray-800 mb-6">Document Details</h2>
                                 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                     <DetailItem label="Contract Number" value={documentData.contractNumber} />
                                     <DetailItem label="Vendor Company" value={documentData.vendorName} />
                                     <DetailItem label="Candidate Name" value={documentData.candidateName} />
                                     <DetailItem label="Service Type" value={documentData.typeOfServices} />
                                     <DetailItem label="Rate" value={`$${documentData.rate} ${documentData.perHour}`} />
                                     <DetailItem label="Status" value={documentData.status} />
                                 </div>
                                 <div className="mt-8 flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                                    {!hasVendorSigned && !user && (
                                        <button onClick={() => setIsVendorSigningModalOpen(true)} className="w-full sm:w-auto flex-1 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 font-semibold shadow-md transition-transform transform hover:scale-105">
                                            Sign as Vendor
                                        </button>
                                    )}
                                    {hasVendorSigned && !hasTaprootSigned && canAddPosting && user && (
                                        <button onClick={() => setIsTaprootSigningModalOpen(true)} className="w-full sm:w-auto flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 font-semibold shadow-md transition-transform transform hover:scale-105">
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

            <AccessModal
                isOpen={isAccessModalOpen}
                onClose={() => {
                    if (!documentData) {
                        setError("Access is required. Please enter the temporary password from your email to proceed.");
                    } else {
                        setIsAccessModalOpen(false);
                    }
                }}
                onAccessGranted={handleAccessGranted}
                token={token}
            />
            
            {documentData && (
                <>
                    <VendorSigningModal isOpen={isVendorSigningModalOpen} onClose={() => setIsVendorSigningModalOpen(false)} onSign={handleSign} />
                    <TaprootSigningModal isOpen={isTaprootSigningModalOpen} onClose={() => setIsTaprootSigningModalOpen(false)} onSign={handleSign} />
                </>
            )}
        </>
    );
};

export default MSAandWOSigningPage;