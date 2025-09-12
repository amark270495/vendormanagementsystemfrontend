import React, { useState, useEffect, useCallback, useMemo, useRef, createContext, useReducer, useContext } from 'react';
import SignatureCanvas from 'react-signature-canvas';

// Assuming Modal and Spinner are in the same directory or correctly pathed
// For simplicity, including their basic structure here.
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
const Spinner = ({ size = '8' }) => (<div className={`animate-spin rounded-full h-${size} w-${size} border-b-2 border-white`}></div>);


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
        
        // --- FIX: Adjust font size and style for better rendering ---
        let fontStyle = '30px';
        if (selectedFont === 'font-dancing-script') fontStyle = 'italic 40px "Dancing Script", cursive';
        if (selectedFont === 'font-great-vibes') fontStyle = 'italic 45px "Great Vibes", cursive';
        if (selectedFont === 'font-pacifico') fontStyle = '35px "Pacifico", cursive';
        if (selectedFont === 'font-sacramento') fontStyle = '40px "Sacramento", cursive';
        
        ctx.font = fontStyle;
        ctx.fillStyle = "#000000";
        // Adjust text position to be centered vertically
        ctx.textBaseline = 'middle'; 
        ctx.fillText(typedSignature, 20, canvas.height / 2);
    }, [typedSignature, selectedFont]);

    useEffect(() => {
        if(isOpen) {
            // Pre-fill with signer's name and reset state
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
            // Delay drawing to ensure font is loaded
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
                        {/* --- FIX: Reduced canvas height to create a more compact image --- */}
                        <canvas ref={typeCanvasRef} width="400" height="80" className="hidden"></canvas>
                    </div>
                )}
                {activeTab === 'draw' && (
                    <div className="border border-gray-300 rounded-lg h-48 w-full bg-gray-50">
                        <SignatureCanvas ref={signaturePad} penColor="black" canvasProps={{ className: 'w-full h-full' }} />
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

export default SignatureModal;