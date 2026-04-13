import React, { useState, useEffect, useRef, useCallback } from 'react';
import Modal from '../Modal';
import Spinner from '../Spinner';
import SignatureCanvas from 'react-signature-canvas';

// --- Polished Enterprise SVG Icons ---
const TypeIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 mr-2" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/></svg>);
const DrawIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 mr-2" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/><path d="M2 2l7.586 7.586"/><circle cx="11" cy="11" r="2"/></svg>);
const UploadIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 mr-2" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>);
const LockIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>);

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
        
        // 1. Determine font style
        let fontStyle = '30px';
        if (selectedFont === 'font-dancing-script') fontStyle = 'italic 40px "Dancing Script", cursive';
        if (selectedFont === 'font-great-vibes') fontStyle = 'italic 45px "Great Vibes", cursive';
        if (selectedFont === 'font-pacifico') fontStyle = '35px "Pacifico", cursive';
        if (selectedFont === 'font-sacramento') fontStyle = '40px "Sacramento", cursive';

        // 2. Measure text width
        ctx.font = fontStyle;
        const textMetrics = ctx.measureText(typedSignature);
        const textWidth = textMetrics.width;

        // 3. Dynamic Resize
        const requiredWidth = Math.max(400, Math.ceil(textWidth + 60)); 
        
        if (canvas.width !== requiredWidth) {
            canvas.width = requiredWidth;
            ctx.font = fontStyle; 
        } else {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }

        ctx.fillStyle = "#111827";
        ctx.textBaseline = 'middle';
        ctx.textAlign = 'left';
        ctx.fillText(typedSignature, 30, canvas.height / 2);
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
        const file = event.target.files;
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
            className={`flex items-center justify-center pb-3 text-sm font-semibold transition-all border-b-2 ${
                activeTab === id
                ? 'text-[#1473E6] border-[#1473E6]'
                : 'text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-300'
            }`}
        >
            {children}
        </button>
    );

    if (!isOpen) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Complete Your Signature" size="6xl">
            <div className="flex flex-col lg:flex-row gap-8">
                
                {/* Left Pane: PDF Preview (Adobe Acrobat Style) */}
                <div className="w-full lg:w-[55%] h-[60vh] lg:h-[75vh] bg-[#323639] rounded-lg shadow-inner flex flex-col overflow-hidden border border-gray-200">
                    {/* Fake PDF Toolbar */}
                    <div className="bg-[#2b2e31] border-b border-[#1f2224] h-10 flex items-center px-4 justify-between flex-shrink-0 text-gray-400">
                        <span className="text-xs font-semibold tracking-wider uppercase">Document Preview</span>
                        <div className="flex space-x-3">
                            <button className="hover:text-white transition-colors"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg></button>
                        </div>
                    </div>
                    {documentUrl ? (
                        <div className="flex-1 p-2 sm:p-6 overflow-y-auto custom-scrollbar flex justify-center">
                             <div className="w-full h-full max-w-2xl bg-white shadow-[0_5px_25px_rgba(0,0,0,0.5)] flex flex-col">
                                <iframe src={documentUrl} title="Document Preview" className="w-full h-full border-0"/>
                             </div>
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center">
                            <svg className="w-12 h-12 text-gray-500 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                            <p className="text-gray-400 text-sm font-medium">Document preview unavailable.</p>
                        </div>
                    )}
                </div>

                {/* Right Pane: Signature Interface */}
                <div className="w-full lg:w-[45%] flex flex-col h-[60vh] lg:h-[75vh]">
                    
                    <div className="mb-6">
                        <h2 className="text-xl font-bold text-gray-900">Adopt Your Signature</h2>
                        <p className="text-sm text-gray-500 mt-1">Review your name and select a signature style.</p>
                    </div>

                    {error && (
                        <div className="bg-red-50 border-l-4 border-red-500 p-3 rounded text-sm text-red-700 mb-4 shadow-sm flex items-center">
                            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"></path></svg>
                            {error}
                        </div>
                    )}

                    {/* Navigation Tabs */}
                    <div className="border-b border-gray-200 mb-6 flex space-x-6">
                        <TabButton id="type"><TypeIcon/> Type</TabButton>
                        <TabButton id="draw"><DrawIcon/> Draw</TabButton>
                        <TabButton id="upload"><UploadIcon/> Upload</TabButton>
                    </div>

                    <div className="flex-1 overflow-y-auto">
                        {/* Type Tab */}
                        <div className={activeTab === 'type' ? 'space-y-6' : 'hidden'}>
                            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 relative flex items-center justify-center min-h-[140px] shadow-inner">
                                {/* The decorative "sign here" line */}
                                <div className="absolute bottom-6 left-6 right-6 border-b-2 border-blue-200 opacity-50 pointer-events-none"></div>
                                <input 
                                    type="text" 
                                    value={typedSignature} 
                                    onChange={(e) => setTypedSignature(e.target.value)} 
                                    className={`w-full bg-transparent text-center text-5xl focus:outline-none text-gray-800 z-10 placeholder-gray-300 ${selectedFont}`} 
                                    placeholder="Your Name Here" 
                                />
                            </div>
                            
                            <div>
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Select Signature Style</p>
                                <div className="grid grid-cols-2 gap-3">
                                    {fonts.map(font => (
                                        <button 
                                            key={font.id} 
                                            onClick={() => setSelectedFont(font.className)} 
                                            className={`p-3 rounded-md border text-center transition-all ${
                                                selectedFont === font.className 
                                                ? 'border-[#1473E6] bg-blue-50 ring-1 ring-[#1473E6]' 
                                                : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                                            }`}
                                        >
                                            <span className={`text-2xl text-gray-800 ${font.className}`}>{signerInfo?.name ? signerInfo.name.split(' ') : 'Signature'}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Draw Tab */}
                        <div className={activeTab === 'draw' ? 'relative w-full h-[250px] bg-[#f8fafc] border border-gray-300 rounded-lg shadow-inner overflow-hidden' : 'hidden'}>
                            {/* Subtle Grid Background */}
                            <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
                            {/* Signature Line */}
                            <div className="absolute bottom-8 left-8 right-8 border-b-2 border-blue-200 opacity-50 pointer-events-none"></div>
                            
                            <SignatureCanvas 
                                ref={signaturePad} 
                                penColor="#111827" 
                                canvasProps={{ className: 'w-full h-full relative z-10' }} 
                            />
                            <button 
                                onClick={clearCanvas} 
                                className="absolute top-3 right-3 px-3 py-1 text-xs font-semibold text-gray-500 bg-white border border-gray-200 rounded hover:text-red-600 hover:border-red-200 transition-colors z-20 shadow-sm"
                            >
                                Clear
                            </button>
                        </div>

                        {/* Upload Tab */}
                        <div className={activeTab === 'upload' ? '' : 'hidden'}>
                            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/png, image/jpeg" />
                            <button 
                                onClick={() => fileInputRef.current.click()} 
                                className="w-full h-[250px] flex flex-col items-center justify-center bg-blue-50/30 text-blue-600 border-2 border-dashed border-blue-300 rounded-lg hover:bg-blue-50 transition-colors"
                            >
                                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm mb-3 border border-blue-100">
                                    <UploadIcon />
                                </div>
                                <span className="font-semibold">Click to upload your signature</span>
                                <span className="text-xs text-gray-500 mt-1 font-medium">JPEG or PNG, up to 5MB</span>
                            </button>
                        </div>

                        {/* Hidden Canvas for saving Typed text */}
                        <canvas ref={typeCanvasRef} height="60" className="hidden"></canvas>
                    </div>

                    {/* Footer / Password / Actions */}
                    <div className="mt-auto pt-6">
                        {requiresPassword && (
                            <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Security Verification</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <LockIcon />
                                    </div>
                                    <input 
                                        type="password" 
                                        value={password} 
                                        onChange={(e) => setPassword(e.target.value)} 
                                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md bg-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#1473E6] focus:border-[#1473E6] sm:text-sm shadow-sm" 
                                        placeholder="Enter your internal VMS password"
                                        required 
                                    />
                                </div>
                            </div>
                        )}
                        
                        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                            <button 
                                onClick={onClose} 
                                className="px-4 py-2 bg-white border border-gray-300 text-gray-700 font-semibold rounded-md hover:bg-gray-50 shadow-sm transition-colors text-sm"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={() => handleSave()} 
                                className="px-6 py-2 bg-[#1473E6] text-white font-semibold rounded-md hover:bg-[#0d66d0] shadow-sm transition-colors flex items-center justify-center min-w-[140px] text-sm" 
                                disabled={loading}
                            >
                                {loading ? <Spinner size="4" /> : 'Confirm & Sign'}
                            </button>
                        </div>
                    </div>

                </div>
            </div>
        </Modal>
    );
};

export default SignatureModal;