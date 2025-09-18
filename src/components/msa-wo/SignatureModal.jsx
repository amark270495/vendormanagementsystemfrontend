import React, { useState, useEffect, useRef, useCallback } from 'react';
import Modal from '../Modal';
import Spinner from '../Spinner';
import SignatureCanvas from 'react-signature-canvas';

// --- SVG Icons for Tabs ---
const TypeIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 mr-2" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 7V4h16v3"/><path d="M9 20h6"/><path d="M12 4v16"/></svg>);
const DrawIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 mr-2" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>);
const UploadIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 mr-2" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>);

const SignatureModal = ({ isOpen, onClose, onSign, signerType, signerInfo, requiresPassword = false, documentUrl }) => {
    const [activeTab, setActiveTab] = useState('type');
    const [typedSignature, setTypedSignature] = useState('');
    const [selectedFont, setSelectedFont] = useState('font-dancing-script');
    const [password, setPassword] = useState('');
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
        ctx.fillStyle = "#111827";
        ctx.textBaseline = 'middle';
        ctx.fillText(typedSignature, 20, canvas.height / 2);
    }, [typedSignature, selectedFont]);

    useEffect(() => {
        if (isOpen) {
            setTypedSignature(signerInfo?.name || '');
            setPassword('');
            setError('');
            setActiveTab('type');
            if (signaturePad.current) signaturePad.current.clear();
        }
    }, [isOpen, signerInfo]);

    useEffect(() => {
        if (isOpen && activeTab === 'type') {
            setTimeout(drawSignatureOnCanvas, 100);
        }
    }, [isOpen, activeTab, typedSignature, selectedFont, drawSignatureOnCanvas]);

    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (file && (file.type === "image/png" || file.type === "image/jpeg")) {
            setError('');
            const reader = new FileReader();
            reader.onload = (e) => handleSave(e.target.result);
            reader.readAsDataURL(file);
        } else {
            setError('Please upload a valid image file (PNG or JPG).');
        }
    };

    const handleSave = async (uploadedImage = null) => {
        setLoading(true);
        setError('');

        let signatureData = uploadedImage;

        if (!signatureData) {
            if (activeTab === 'type') {
                if (!typedSignature) {
                    setError('Please type your signature.');
                    setLoading(false); return;
                }
                signatureData = typeCanvasRef.current.toDataURL('image/png');
            } else if (activeTab === 'draw') {
                if (signaturePad.current.isEmpty()) {
                    setError('Please draw your signature.');
                    setLoading(false); return;
                }
                signatureData = signaturePad.current.getTrimmedCanvas().toDataURL('image/png');
            }
        }

        if (requiresPassword && !password) {
            setError('Please enter your password to confirm.');
            setLoading(false); return;
        }

        try {
            const finalSignerData = {
                signatureImage: signatureData,
                password: password,
                name: signerInfo?.name || typedSignature,
                title: signerInfo?.title
            };
            await onSign(finalSignerData, signerType);
            onClose();
        } catch (err) {
            setError(err.message || 'Failed to process signature.');
        } finally {
            setLoading(false);
        }
    };

    const TabButton = ({ id, children }) => (
        <button
            onClick={() => setActiveTab(id)}
            className={`flex items-center justify-center px-5 py-2.5 text-sm font-semibold rounded-t-lg transition-all border-b-2 ${
                activeTab === id
                ? 'text-indigo-600 border-indigo-600 bg-indigo-50'
                : 'text-slate-500 border-transparent hover:text-slate-700 hover:border-slate-300'
            }`}
        >
            {children}
        </button>
    );

    if (!isOpen) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="✍️ Provide Your Signature" size="6xl">
            <div className="flex flex-col md:flex-row gap-6">
                {/* PDF Preview Pane */}
                <div className="md:w-2/3 h-[70vh] bg-slate-100 rounded-lg border">
                    {documentUrl ? (
                        <iframe src={documentUrl} title="Document Preview" className="w-full h-full border-0 rounded-lg"/>
                    ) : (
                        <div className="flex items-center justify-center h-full">
                            <p className="text-slate-500">Document preview is unavailable.</p>
                        </div>
                    )}
                </div>

                {/* Signature Pane */}
                <div className="md:w-1/3 flex flex-col space-y-4">
                    {error && <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded-md">{error}</div>}
                    <div className="border-b border-slate-200">
                        <nav className="flex -mb-px">{['type','draw','upload'].map(tab => (
                            <TabButton id={tab} key={tab}>
                              {tab === 'type' && <TypeIcon/>}
                              {tab === 'draw' && <DrawIcon/>}
                              {tab === 'upload' && <UploadIcon/>}
                              {tab.charAt(0).toUpperCase() + tab.slice(1)}
                            </TabButton>
                        ))}</nav>
                    </div>
                    <div>
                        {/* Type */}
                        <div className={activeTab === 'type' ? 'space-y-4' : 'hidden'}>
                            <input type="text" value={typedSignature} onChange={(e) => setTypedSignature(e.target.value)} className={`w-full p-3 border rounded-lg text-4xl shadow-inner bg-white ${selectedFont}`} placeholder="Type your signature" />
                            <div>
                                <p className="text-xs text-slate-500 mb-2">Choose a style:</p>
                                <div className="flex flex-wrap gap-2">
                                    {fonts.map(font => (
                                        <button key={font.id} onClick={() => setSelectedFont(font.className)} className={`px-3 py-1.5 rounded-full text-sm transition-all ${selectedFont === font.className ? 'bg-indigo-600 text-white' : 'bg-white border hover:bg-slate-100'}`}>
                                            {font.name}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                        {/* Draw */}
                        <div className={activeTab === 'draw' ? 'relative border-2 border-dashed border-slate-300 rounded-lg h-48 bg-white shadow-inner' : 'hidden'}>
                            <SignatureCanvas ref={signaturePad} penColor="black" canvasProps={{ width: 400, height: 190, className: 'w-full h-full' }} />
                            <button onClick={clearCanvas} className="absolute top-2 right-2 px-3 py-1 text-xs bg-gray-200 rounded hover:bg-gray-300">Clear</button>
                        </div>
                        {/* Upload */}
                        <div className={activeTab === 'upload' ? '' : 'hidden'}>
                            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/png, image/jpeg" />
                            <button onClick={() => fileInputRef.current.click()} className="w-full h-48 flex flex-col items-center justify-center bg-white text-slate-600 border-2 border-dashed border-slate-300 rounded-lg hover:bg-slate-50">
                                <UploadIcon /><span>Click to upload an image</span><span className="text-xs">(PNG or JPG)</span>
                            </button>
                        </div>
                        <canvas ref={typeCanvasRef} width="400" height="60" className="hidden"></canvas>
                    </div>
                    {requiresPassword && (
                        <div>
                            <label className="block text-sm font-semibold text-slate-700">Confirm with VMS Password <span className="text-red-500">*</span></label>
                            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1 block w-full border rounded-lg p-2.5 shadow-sm" required />
                        </div>
                    )}
                    <div className="flex justify-end space-x-2 pt-4 border-t mt-auto">
                        <button onClick={onClose} className="px-5 py-2.5 bg-slate-200 rounded-lg hover:bg-slate-300">Cancel</button>
                        <button onClick={() => handleSave()} className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center justify-center w-36 shadow-sm" disabled={loading}>
                            {loading ? <Spinner size="5" /> : 'Confirm & Sign'}
                        </button>
                    </div>
                </div>
            </div>
        </Modal>
    );
};

export default SignatureModal;