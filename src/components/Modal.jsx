import React from 'react';

/**
 * A reusable Modal component for displaying dialogs and pop-ups.
 * It handles the overlay, closing logic, and content display.
 */
const Modal = ({ isOpen, onClose, title, children, size = 'md' }) => {
    // If the modal is not set to be open, render nothing.
    if (!isOpen) {
        return null;
    }

    // Define Tailwind CSS classes for different modal sizes.
    const sizeClasses = {
        sm: 'max-w-sm',
        md: 'max-w-md',
        lg: 'max-w-lg',
        xl: 'max-w-xl',
        '2xl': 'max-w-2xl',
        '4xl': 'max-w-4xl',
    };

    return (
        // The main modal container, which includes the dark overlay.
        // Clicking the overlay will close the modal.
        <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4" 
            onClick={onClose} 
            aria-modal="true" 
            role="dialog"
        >
            {/* The modal panel itself. Clicking inside this will not close the modal. */}
            <div 
                className={`bg-white rounded-lg shadow-xl w-full ${sizeClasses[size]} max-h-[90vh] flex flex-col`} 
                onClick={e => e.stopPropagation()}
            >
                {/* Modal Header with title and close button */}
                <div className="flex justify-between items-center p-4 border-b">
                    <h3 className="text-xl font-semibold text-gray-800">{title}</h3>
                    <button 
                        onClick={onClose} 
                        className="text-gray-500 hover:text-gray-800 p-1 rounded-full hover:bg-gray-100" 
                        aria-label="Close modal"
                    >
                        {/* Close (X) icon */}
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>
                {/* Modal Body: This is where the main content of the modal will be displayed. */}
                <div className="p-6 overflow-y-auto">
                    {children}
                </div>
            </div>
        </div>
    );
};

export default Modal;