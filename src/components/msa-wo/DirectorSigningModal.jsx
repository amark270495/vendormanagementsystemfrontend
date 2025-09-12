import React, { useState, useEffect, useRef, useCallback } from 'react';
import Modal from '../Modal';
import Spinner from '../Spinner';
import SignatureCanvas from 'react-signature-canvas';

// This is the complete, self-contained signing modal for the Director.
// It no longer calls a separate SignatureModal.

const DirectorSigningModal = ({ isOpen, onClose, onSign, document, user }) => {
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
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
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
        if (isOpen) {
            setTypedSignature(user?.userName || '');
            setPassword('');
            setError('');
            setActiveTab('type');
            if (signaturePad.current) {
                signaturePad.current.clear();
            }
        }
    }, [isOpen, user?.userName]);

    useEffect(() => {
        if (isOpen && activeTab === 'type') {
            setTimeout(drawSignatureOnCanvas, 100);
        }
    }, [isOpen, activeTab, typedSignature, selectedFont, drawSignatureOnCanvas]);

    const handleFileChange = async (event) => {
        const file = event.target.files[0];
        if (file && (file.type === "image/png" || file.type === "image/jpeg")) {
            setError('');
            const reader = new FileReader();
            reader.onload = (e) => {
                // For uploads, we call `handleSave` directly with the image data.
                handleSave(e.target.result);
            };
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
        }
       
        if (!password) {
            setError('Please enter your VMS password to confirm.');
            setLoading(false);
            return;
        }

        try {
            const finalSignerData = {
                signatureImage: signatureData,
                password: password,
                name: user?.userName || typedSignature,
                title: 'Director'
            };
            await onSign(finalSignerData, 'taproot');
            onClose(); // Close this modal on success
        } catch (err) {
            setError(err.message || 'Failed to process signature.');
        } finally {
            setLoading(false);
        }
    };

    const TabButton = ({ id, children }) => (
        <button onClick={() => setActiveTab(id)} className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${activeTab === id ? 'bg-white text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}>
            {children}
        </button>
    );

    if (!isOpen) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Sign Document: ${document?.contractNumber}`} size="6xl">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[75vh]">
                <div className="lg:col-span-1 h-full bg-gray-200 rounded-lg overflow-hidden">
                    {document?.pdfUrl ? (
                        <iframe src={document.pdfUrl} title="Document Preview" className="w-full h-full border-0" />
                    ) : (
                        <div className="flex items-center justify-center h-full bg-gray-100"><p className="text-gray-500">Could not load document preview.</p></div>
                    )}
                </div>
                <div className="lg:col-span-1 flex flex-col justify-between bg-gray-50 p-6 rounded-lg border">
                    <div>
                        <h3 className="text-lg font-bold text-gray-800 mb-4">Provide Your Signature</h3>
                        <p className="text-sm text-gray-600 mb-6">Review the document and provide your signature using one of the methods below. Confirm with your VMS password to finalize.</p>
                        
                        {error && <div className="bg-red-100 border-red-400 text-red-700 px-4 py-2 rounded mb-4">{error}</div>}
                        
                        <div className="border-b border-gray-200">
                            <nav className="flex space-x-2" aria-label="Tabs"><TabButton id="type">Type</TabButton><TabButton id="draw">Draw</TabButton><TabButton id="upload">Upload</TabButton></nav>
                        </div>

                        <div className="py-4">
                            {activeTab === 'type' && (
                                <div className="space-y-4">
                                    <input type="text" value={typedSignature} onChange={(e) => setTypedSignature(e.target.value)} className={`w-full p-2 border border-gray-300 rounded-lg text-4xl ${selectedFont}`} placeholder="Type your signature" />
                                    <div className="flex space-x-2 flex-wrap gap-2">{fonts.map(font => (<button key={font.id} onClick={() => setSelectedFont(font.className)} className={`px-3 py-1 rounded-md text-sm ${selectedFont === font.className ? 'bg-indigo-600 text-white' : 'bg-gray-200'} ${font.className}`}>{font.name}</button>))}</div>
                                    <canvas ref={typeCanvasRef} width="400" height="60" className="hidden"></canvas>
                                </div>
                            )}
                            {activeTab === 'draw' && (<div className="border border-gray-300 rounded-lg h-48 w-full bg-gray-50"><SignatureCanvas ref={signaturePad} penColor="black" canvasProps={{ className: 'w-full h-full', willReadFrequently: true }} /></div>)}
                            {activeTab === 'upload' && (
                                <div>
                                    <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/png, image/jpeg" />
                                    <button onClick={() => fileInputRef.current.click()} className="w-full px-4 py-3 bg-gray-100 text-gray-700 border-2 border-dashed border-gray-300 rounded-lg hover:bg-gray-200">Click to upload an image (PNG or JPG)</button>
                                </div>
                            )}
                             <div className="mt-4">
                                <label className="block text-sm font-medium text-gray-700">Confirm with Password <span className="text-red-500">*</span></label>
                                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-lg p-2" required />
                            </div>
                        </div>
                    </div>
                     <div className="flex justify-between items-center pt-4 border-t mt-6">
                        {activeTab === 'draw' && <button onClick={clearCanvas} className="text-sm text-gray-600 hover:text-gray-900">Clear</button>}
                        <div className="flex-grow"></div>
                        <div className="flex space-x-2">
                            <button onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Cancel</button>
                            {activeTab !== 'upload' && (<button onClick={() => handleSave()} className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 flex items-center justify-center w-36" disabled={loading}>{loading ? <Spinner size="5" /> : 'Confirm & Sign'}</button>)}
                        </div>
                    </div>
                </div>
            </div>
        </Modal>
    );
};

export default DirectorSigningModal;