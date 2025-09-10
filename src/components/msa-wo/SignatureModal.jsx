import React, { useState, useRef, useEffect } from 'react';
import Modal from '../Modal';
import Spinner from '../Spinner';
import SignatureCanvas from 'react-signature-canvas';

const SignatureModal = ({ isOpen, onClose, onSign, signerType, requiresPassword }) => {
    const [tab, setTab] = useState('type');
    const [typedSignature, setTypedSignature] = useState('');
    const [font, setFont] = useState('font-dancing-script');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    
    // Additional fields for vendor/director info
    const [name, setName] = useState('');
    const [title, setTitle] = useState('');
    const [password, setPassword] = useState('');
    
    const drawCanvasRef = useRef(null);
    const typeCanvasRef = useRef(null);
    const fileInputRef = useRef(null);

    const fonts = [
        { id: 'font-dancing-script', name: 'Dancing Script' },
        { id: 'font-caveat', name: 'Caveat' },
        { id: 'font-cedarville-cursive', name: 'Cedarville Cursive' },
        { id: 'font-pacifico', name: 'Pacifico' },
    ];

    // Effect to render the typed signature onto the hidden canvas
    useEffect(() => {
        if (tab === 'type' && typeCanvasRef.current) {
            const canvas = typeCanvasRef.current;
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.font = `48px ${font.replace('font-', '').replace('-', ' ')}`;
            ctx.fillStyle = "black";
            ctx.fillText(typedSignature, 30, 100);
        }
    }, [typedSignature, font, tab]);

    const clearDrawCanvas = () => drawCanvasRef.current?.clear();

    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                // We'll pass the base64 string to the onSign handler
                setTypedSignature(e.target.result); 
            };
            reader.readAsDataURL(file);
        } else {
            setError("Please select a valid image file (PNG, JPG, etc.).");
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if ((signerType === 'vendor' && (!name || !title)) || (requiresPassword && !password)) {
            setError("Please fill in all required fields.");
            return;
        }

        let signatureImage = '';
        if (tab === 'type') {
            if (!typedSignature) {
                setError("Please type your signature.");
                return;
            }
            signatureImage = typeCanvasRef.current.toDataURL('image/png');
        } else if (tab === 'draw') {
            if (drawCanvasRef.current.isEmpty()) {
                setError("Please draw your signature.");
                return;
            }
            signatureImage = drawCanvasRef.current.getTrimmedCanvas().toDataURL('image/png');
        } else if (tab === 'upload') {
            if (!typedSignature) { // Reusing typedSignature state for upload base64
                setError("Please upload an image of your signature.");
                return;
            }
            signatureImage = typedSignature;
        }

        setLoading(true);
        try {
            const signerData = {
                signatureImage,
                name: name || typedSignature, // Fallback to typed name if not vendor
                title: title,
                password: password,
            };
            await onSign(signerData, signerType);
            onClose(); // Close modal on success
        } catch (err) {
            setError(err.message || "An unexpected error occurred.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Provide Your Signature" size="lg">
            {error && <div className="bg-red-100 border-l-4 border-red-400 text-red-700 p-3 rounded mb-4 text-sm">{error}</div>}
            
            <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                    {['type', 'draw', 'upload'].map(t => (
                        <button key={t} onClick={() => setTab(t)} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${tab === t ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
                            {t.charAt(0).toUpperCase() + t.slice(1)}
                        </button>
                    ))}
                </nav>
            </div>

            <div className="py-6">
                {/* Type Tab */}
                <div style={{ display: tab === 'type' ? 'block' : 'none' }}>
                    <input type="text" value={typedSignature} onChange={e => setTypedSignature(e.target.value)} placeholder="Type your name here..." className={`w-full p-4 border border-gray-300 rounded-lg text-4xl ${font}`} />
                    <div className="flex justify-between items-center mt-4">
                        <label className="text-sm font-medium">Font:</label>
                        <select value={font} onChange={e => setFont(e.target.value)} className="border-gray-300 rounded-md shadow-sm">
                            {fonts.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                        </select>
                    </div>
                    {/* Hidden canvas for typed signature */}
                    <canvas ref={typeCanvasRef} width={500} height={150} style={{ display: 'none' }}></canvas>
                </div>

                {/* Draw Tab */}
                <div style={{ display: tab === 'draw' ? 'block' : 'none' }}>
                    <div className="bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg">
                        <SignatureCanvas ref={drawCanvasRef} canvasProps={{ className: 'w-full h-48' }} />
                    </div>
                    <button onClick={clearDrawCanvas} className="mt-2 text-sm text-indigo-600 hover:underline">Clear</button>
                </div>

                {/* Upload Tab */}
                <div style={{ display: tab === 'upload' ? 'block' : 'none' }}>
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100" />
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 pt-4 border-t">
                {signerType === 'vendor' && (
                    <>
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-gray-700">Your Full Name <span className="text-red-500">*</span></label>
                            <input type="text" name="name" id="name" value={name} onChange={e => setName(e.target.value)} required className="mt-1 block w-full border border-gray-300 rounded-lg p-2" />
                        </div>
                        <div>
                            <label htmlFor="title" className="block text-sm font-medium text-gray-700">Your Title <span className="text-red-500">*</span></label>
                            <input type="text" name="title" id="title" value={title} onChange={e => setTitle(e.target.value)} required className="mt-1 block w-full border border-gray-300 rounded-lg p-2" />
                        </div>
                    </>
                )}
                 {requiresPassword && (
                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700">Your VMS Password <span className="text-red-500">*</span></label>
                        <input type="password" name="password" id="password" value={password} onChange={e => setPassword(e.target.value)} required className="mt-1 block w-full border border-gray-300 rounded-lg p-2" />
                    </div>
                )}
                
                <p className="text-xs text-gray-500">By clicking "Sign and Submit", you agree that the signature you have created is the electronic equivalent of your handwritten signature.</p>

                <div className="flex justify-end space-x-2 pt-4">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Cancel</button>
                    <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 flex items-center justify-center w-36" disabled={loading}>
                        {loading ? <Spinner size="5" /> : 'Sign and Submit'}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default SignatureModal;