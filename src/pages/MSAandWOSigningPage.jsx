import React, { useState, useEffect, useCallback, useMemo, useRef, createContext, useReducer, useContext } from 'react';
import axios from 'axios';
import SignatureCanvas from 'react-signature-canvas';

// --- CENTRAL API SERVICE (Relevant Functions) ---
const API_BASE_URL = '/api';
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});
const apiService = {
  accessMSAandWO: (token, tempPassword) => apiClient.post('/accessMSAandWO', { token, tempPassword }),
  getMSAandWODetailForSigning: (token, authenticatedUsername) => apiClient.get('/getMSAandWODetailForSigning', { params: { token, authenticatedUsername } }),
  updateSigningStatus: (token, signerData, signerType, authenticatedUsername, jobInfo) => apiClient.post('/updateSigningStatus', { token, signerData, signerType, authenticatedUsername, jobInfo }),
};

// --- CONTEXT & HOOKS (Needed for this page) ---
const AuthContext = createContext();
const useAuth = () => useContext(AuthContext);

const calculatePermissions = (permissions) => {
    if (!permissions) {
        return { canManageMSAWO: false }; 
    }
    return {
        canManageMSAWO: permissions.canManageMSAWO === true,
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
    const sizeClasses = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-lg', '2xl': 'max-w-2xl' };
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

// --- All modal components are now defined at the top level, outside the main page component ---

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

const SignatureModal = ({ isOpen, onClose, onSave, signerName }) => {
    const [activeTab, setActiveTab] = useState('type');
    const [typedSignature, setTypedSignature] = useState('');
    const [selectedFont, setSelectedFont] = useState('font-dancing-script');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const signaturePad = useRef(null);
    const fileInputRef = useRef(null);
    const typeCanvasRef = useRef(null);

    const fonts = [
        { id: 'font-dancing-script', name: 'Dancing Script', className: 'font-dancing-script' },
        { id: 'font-great-vibes', name: 'Great Vibes', className: 'font-great-vibes' },
        { id: 'font-pacifico', name: 'Pacifico', className: 'font-pacifico' },
        { id: 'font-sacramento', name: 'Sacramento', className: 'font-sacramento' },
    ];

    const clearCanvas = () => signaturePad.current?.clear();

    const drawSignatureOnCanvas = useCallback(() => {
        const canvas = typeCanvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        let fontStyle = '30px';
        if (selectedFont === 'font-dancing-script') fontStyle = 'italic 40px "Dancing Script", cursive';
        if (selectedFont === 'font-great-vibes') fontStyle = 'italic 45px "Great Vibes", cursive';
        if (selectedFont === 'font-pacifico') fontStyle = '35px "Pacifico", cursive';
        if (selectedFont === 'font-sacramento') fontStyle = '40px "Sacramento", cursive';
        
        ctx.font = fontStyle;
        ctx.fillStyle = "#000000";
        ctx.textBaseline = 'middle'; 
        ctx.fillText(typedSignature, 20, canvas.height / 2);
    }, [typedSignature, selectedFont]);

    useEffect(() => {
        if(isOpen) {
            setTypedSignature(signerName || '');
            setError('');
            setActiveTab('type');
            if(signaturePad.current) {
                signaturePad.current.clear();
            }
        }
    }, [isOpen, signerName]);

    useEffect(() => {
        if (isOpen && activeTab === 'type') {
            setTimeout(drawSignatureOnCanvas, 100);
        }
    }, [isOpen, activeTab, typedSignature, selectedFont, drawSignatureOnCanvas]);
    
    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (file && (file.type === "image/png" || file.type === "image/jpeg")) {
            const reader = new FileReader();
            reader.onload = (e) => onSave(e.target.result);
            reader.readAsDataURL(file);
            setError('');
        } else {
            setError('Please upload a valid image file (PNG or JPG).');
        }
    };

    const handleSave = () => {
        setLoading(true);
        setError('');
        let signatureData = '';
        if (activeTab === 'type') {
            if (!typedSignature) {
                setError('Please type your signature.');
                setLoading(false);
                return;
            }
            const canvas = typeCanvasRef.current;
            signatureData = canvas.toDataURL('image/png');
        } else if (activeTab === 'draw') {
            if (signaturePad.current.isEmpty()) {
                setError('Please draw your signature.');
                setLoading(false);
                return;
            }
            signatureData = signaturePad.current.getTrimmedCanvas().toDataURL('image/png');
        }
        onSave(signatureData);
        setLoading(false);
    };

    const TabButton = ({ id, children }) => (
        <button
            onClick={() => setActiveTab(id)}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${activeTab === id ? 'bg-white text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
        >
            {children}
        </button>
    );

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Provide Your Signature" size="lg">
            {error && <div className="bg-red-100 border-red-400 text-red-700 px-4 py-2 rounded mb-4">{error}</div>}
            <div className="border-b border-gray-200">
                <nav className="flex space-x-2" aria-label="Tabs">
                    <TabButton id="type">Type</TabButton>
                    <TabButton id="draw">Draw</TabButton>
                    <TabButton id="upload">Upload</TabButton>
                </nav>
            </div>
            <div className="py-4">
                {activeTab === 'type' && (
                    <div className="space-y-4">
                        <input
                            type="text"
                            value={typedSignature}
                            onChange={(e) => setTypedSignature(e.target.value)}
                            className={`w-full p-2 border border-gray-300 rounded-lg text-4xl ${selectedFont}`}
                            placeholder="Type your signature"
                        />
                        <div className="flex space-x-2 flex-wrap gap-2">
                            {fonts.map(font => (<button key={font.id} onClick={() => setSelectedFont(font.className)} className={`px-3 py-1 rounded-md text-sm ${selectedFont === font.className ? 'bg-indigo-600 text-white' : 'bg-gray-200'} ${font.className}`}>{font.name}</button>))}
                        </div>
                        <canvas ref={typeCanvasRef} width="400" height="80" className="hidden"></canvas>
                    </div>
                )}
                {activeTab === 'draw' && (
                    <div className="border border-gray-300 rounded-lg h-48 w-full bg-gray-50">
                        <SignatureCanvas ref={signaturePad} penColor="black" canvasProps={{ className: 'w-full h-full', willReadFrequently: true }} />
                    </div>
                )}
                {activeTab === 'upload' && (
                    <div>
                        <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/png, image/jpeg" />
                        <button onClick={() => fileInputRef.current.click()} className="w-full px-4 py-3 bg-gray-100 text-gray-700 border-2 border-dashed border-gray-300 rounded-lg hover:bg-gray-200">Click to upload an image (PNG or JPG)</button>
                    </div>
                )}
            </div>
            <div className="flex justify-between items-center pt-4 border-t">
                {activeTab === 'draw' && <button onClick={clearCanvas} className="text-sm text-gray-600 hover:text-gray-900">Clear</button>}
                <div className="flex-grow"></div>
                <div className="flex space-x-2">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Cancel</button>
                    {activeTab !== 'upload' && (<button onClick={handleSave} className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 flex items-center justify-center w-28" disabled={loading}>{loading ? <Spinner size="5" /> : 'Adopt & Sign'}</button>)}
                </div>
            </div>
        </Modal>
    );
};

const VendorSigningModal = ({ isOpen, onClose, onSign, signerInfo }) => {
    const [formData, setFormData] = useState({ name: '', title: '' });
    const [signatureImage, setSignatureImage] = useState(null);
    const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    
    useEffect(() => {
        if(isOpen) {
            setFormData({ name: signerInfo?.authorizedSignatureName || '', title: signerInfo?.authorizedPersonTitle || '' });
            setSignatureImage(null);
            setError('');
        }
    }, [isOpen, signerInfo]);

    const handleChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));

    const handleSaveSignature = (image) => {
        setSignatureImage(image);
        setIsSignatureModalOpen(false);
    };
    
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (!signatureImage) {
            setError("Please provide your signature by clicking the button above.");
            return;
        }
        setLoading(true);
        try {
            await onSign({ ...formData, signatureImage }, 'vendor');
            onClose();
        } catch (err) {
            setError(err.message || "An unexpected error occurred.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
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
                        <label className="block text-sm font-medium text-gray-700">Digital Signature <span className="text-red-500">*</span></label>
                        <div className="mt-1 p-4 border border-gray-300 rounded-lg bg-gray-50 h-28 flex items-center justify-center">
                            {signatureImage ? <img src={signatureImage} alt="Signature" className="max-h-full max-w-full" /> : <p className="text-gray-500">Signature will appear here</p>}
                        </div>
                        <button type="button" onClick={() => setIsSignatureModalOpen(true)} className="mt-2 text-sm text-indigo-600 hover:text-indigo-800">Click to Provide Signature</button>
                    </div>
                    <div className="flex justify-end space-x-2 pt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Cancel</button>
                        <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 flex items-center justify-center w-28" disabled={loading}>{loading ? <Spinner size="5" /> : 'Sign'}</button>
                    </div>
                </form>
            </Modal>
            <SignatureModal isOpen={isSignatureModalOpen} onClose={() => setIsSignatureModalOpen(false)} onSave={handleSaveSignature} signerName={formData.name} />
        </>
    );
};

const DirectorSigningModal = ({ isOpen, onClose, onSign, document, user }) => {
    const [password, setPassword] = useState('');
    const [signatureImage, setSignatureImage] = useState(null);
    const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if(isOpen) {
            setPassword('');
            setSignatureImage(null);
            setError('');
        }
    }, [isOpen]);
    
    const handleSaveSignature = (image) => {
        setSignatureImage(image);
        setIsSignatureModalOpen(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (!signatureImage) {
            setError("Please provide your signature by clicking the button above.");
            return;
        }
        setLoading(true);
        try {
            await onSign({ password, signatureImage }, 'taproot');
            onClose();
        } catch (err) {
            setError(err.message || "An unexpected error occurred.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Modal isOpen={isOpen} onClose={onClose} title={`Sign Document: ${document?.contractNumber}`} size="2xl">
                {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[75vh]">
                    <div className="lg:col-span-1 h-full bg-gray-200 rounded-lg overflow-hidden">
                        {document?.pdfUrl ? (<iframe src={document.pdfUrl} title="Document Preview" className="w-full h-full border-0" />) : (<div className="flex items-center justify-center h-full bg-gray-100"><p className="text-gray-500">Could not load document preview.</p></div>)}
                    </div>
                    <div className="lg:col-span-1 flex flex-col justify-between bg-gray-50 p-6 rounded-lg border">
                        <div>
                            <h3 className="text-lg font-bold text-gray-800 mb-4">Confirm Signature</h3>
                            <p className="text-sm text-gray-600 mb-6">Review the document. To finalize and sign, provide your signature and VMS password below.</p>
                            <form id="director-sign-form" onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Digital Signature <span className="text-red-500">*</span></label>
                                    <div className="mt-1 p-4 border border-gray-300 rounded-lg bg-white h-28 flex items-center justify-center">
                                        {signatureImage ? <img src={signatureImage} alt="Signature" className="max-h-full max-w-full" /> : <p className="text-gray-500">Signature will appear here</p>}
                                    </div>
                                    <button type="button" onClick={() => setIsSignatureModalOpen(true)} className="mt-2 text-sm text-indigo-600 hover:text-indigo-800">Click to Provide Signature</button>
                                </div>
                                <div>
                                    <label htmlFor="password" className="block text-sm font-medium text-gray-700">Your VMS Password <span className="text-red-500">*</span></label>
                                    <input type="password" name="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm p-2" />
                                </div>
                            </form>
                        </div>
                        <div className="flex justify-end space-x-2 pt-4 border-t mt-6">
                            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Cancel</button>
                            <button type="submit" form="director-sign-form" className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 flex items-center justify-center w-36" disabled={loading}>{loading ? <Spinner size="5" /> : 'Confirm & Sign'}</button>
                        </div>
                    </div>
                </div>
            </Modal>
            <SignatureModal isOpen={isSignatureModalOpen} onClose={() => setIsSignatureModalOpen(false)} onSave={handleSaveSignature} signerName={user?.userName} />
        </>
    );
};


// --- MAIN E-SIGNING PAGE COMPONENT ---
const MSAandWOSigningPage = ({ token }) => {
    const { user } = useAuth() || {}; 
    const { canManageMSAWO } = usePermissions();

    const [documentData, setDocumentData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isAccessModalOpen, setIsAccessModalOpen] = useState(false);
    const [isVendorSigningModalOpen, setIsVendorSigningModalOpen] = useState(false);
    const [isDirectorSigningModalOpen, setIsDirectorSigningModalOpen] = useState(false);
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
        setTimeout(() => { window.location.reload(); }, 2000);
    }, []);
    
    const handleSign = useCallback(async (signerData, signerType) => {
        setLoading(true);
        setError('');
        try {
            const signerUsername = user?.userIdentifier || 'vendor';
            const jobInfo = {
                jobTitle: documentData.jobTitle,
                clientName: documentData.clientName,
                clientLocation: documentData.clientLocation,
                tentativeStartDate: documentData.tentativeStartDate
            };
            const response = await apiService.updateSigningStatus(token, signerData, signerType, signerUsername, jobInfo);
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
    }, [token, user?.userIdentifier, documentData, handleSignSuccess]);

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
        
        const sessionUser = sessionStorage.getItem('vms_user');
        if (user && user.userIdentifier) {
            fetchDocumentForDirector();
        } else if (sessionUser) {
            setLoading(true); 
        } else {
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
                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${index + 1 <= currentStep ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-600'}`}>{index + 1 < currentStep ? '✓' : index + 1}</div>
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
                                     <DetailItem label="Job Title" value={documentData.jobTitle} />
                                     <DetailItem label="Client Name" value={documentData.clientName} />
                                     <DetailItem label="Client Location" value={documentData.clientLocation} />
                                     <DetailItem label="Tentative Start Date" value={documentData.tentativeStartDate ? new Date(documentData.tentativeStartDate).toLocaleDateString() : 'N/A'} />
                                     <DetailItem label="Service Type" value={documentData.typeOfServices} />
                                     <DetailItem label="Rate" value={`$${documentData.rate} ${documentData.perHour}`} />
                                     <DetailItem label="Status" value={documentData.status} />
                                 </div>
                                 <div className="mt-8 flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                                    {!hasVendorSigned && !user && (<button onClick={() => setIsVendorSigningModalOpen(true)} className="w-full sm:w-auto flex-1 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-semibold shadow-md">Sign as Vendor</button>)}
                                    {hasVendorSigned && !hasTaprootSigned && canManageMSAWO && user && (<button onClick={() => setIsDirectorSigningModalOpen(true)} className="w-full sm:w-auto flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold shadow-md">Sign as Taproot Director</button>)}
                                     {hasTaprootSigned && (<div className="w-full text-center p-4 bg-green-50 text-green-700 rounded-lg font-semibold">This document is fully signed and complete.</div>)}
                                 </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
            <AccessModal isOpen={isAccessModalOpen} onClose={() => { if (!documentData) { setError("Access is required."); } else { setIsAccessModalOpen(false); } }} onAccessGranted={handleAccessGranted} token={token} />
            {documentData && (<>
                <VendorSigningModal isOpen={isVendorSigningModalOpen} onClose={() => setIsVendorSigningModalOpen(false)} onSign={handleSign} signerInfo={documentData} />
                <DirectorSigningModal isOpen={isDirectorSigningModalOpen} onClose={() => setIsDirectorSigningModalOpen(false)} onSign={handleSign} document={documentData} user={user} />
            </>)}
        </>
    );
};

export default MSAandWOSigningPage;