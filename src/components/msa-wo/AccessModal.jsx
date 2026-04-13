import React, { useState } from 'react';
import Modal from '../Modal';
import Spinner from '../Spinner';
import { apiService } from '../../api/apiService'; 

const AccessModal = ({ isOpen, onClose, onAccessGranted, token, vendorEmail, apiServiceMethod }) => {
    const [tempPassword, setTempPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            // Determine which API function to call.
            // Fallback to the original MSA/WO function for backward compatibility.
            const methodToCall = apiServiceMethod || apiService.accessMSAandWO;
            if (typeof methodToCall !== 'function') {
                throw new Error("A required API function was not provided to the modal.");
            }

            const response = await methodToCall(token, tempPassword);
            if (response.data.success) {
                onAccessGranted(response.data.documentData);
                // onClose(); // <-- *** THIS LINE WAS THE BUG. IT IS NOW REMOVED. ***
                // The onAccessGranted handler in OfferLetterSigningPage will now close the modal.
            } else {
                setError(response.data.message);
            }
        } catch (err) {
            console.error("Error in AccessModal:", err);
            // Log the full error to the console
            setError(err.response?.data?.message || "An unexpected error occurred.");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="" size="md">
            <div className="p-4 sm:p-6 flex flex-col items-center text-center">
                
                {/* Enterprise Security Icon */}
                <div className="w-16 h-16 bg-blue-50/50 rounded-full flex items-center justify-center mb-6 border-[6px] border-blue-50 shadow-sm">
                    <svg className="w-7 h-7 text-[#1473E6]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                        <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                    </svg>
                </div>

                <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight mb-2">Secure Document Access</h2>
                <p className="text-sm text-gray-500 mb-8 max-w-sm leading-relaxed">
                    A secure access code has been sent to <span className="font-semibold text-gray-800">{vendorEmail || 'your email'}</span>. Please enter it below to decrypt and view the document.
                </p>

                <form onSubmit={handleSubmit} className="w-full max-w-sm flex flex-col items-center">
                    
                    {error && (
                        <div className="w-full bg-red-50 border-l-4 border-red-500 p-3 rounded mb-6 text-sm text-red-700 text-left flex items-start shadow-sm">
                            <svg className="w-5 h-5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"></path></svg>
                            <span>{error}</span>
                        </div>
                    )}

                    <div className="w-full mb-6">
                        <label htmlFor="tempPassword" className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2 text-left">
                            Access Code <span className="text-red-500">*</span>
                        </label>
                        <input 
                            type="password" 
                            name="tempPassword" 
                            id="tempPassword" 
                            value={tempPassword} 
                            onChange={(e) => setTempPassword(e.target.value)} 
                            required 
                            autoFocus
                            placeholder="••••••••"
                            className="block w-full border border-gray-300 rounded-lg shadow-inner py-3.5 px-4 text-center text-xl tracking-widest text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#1473E6] focus:border-transparent transition-all" 
                        />
                    </div>
                    
                    <button 
                        type="submit" 
                        className="w-full px-4 py-3.5 bg-[#1473E6] text-white font-bold rounded-lg hover:bg-[#0d66d0] flex items-center justify-center shadow-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1473E6]" 
                        disabled={loading}
                    >
                        {loading ? <Spinner size="5" /> : 'Decrypt & View Document'}
                    </button>

                    <button 
                        type="button" 
                        onClick={onClose} 
                        className="mt-4 text-sm font-medium text-gray-500 hover:text-gray-800 transition-colors"
                        disabled={loading}
                    >
                        Cancel
                    </button>
                </form>
            </div>
        </Modal>
    );
};

export default AccessModal;