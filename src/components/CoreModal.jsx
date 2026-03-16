import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';

const CoreModal = ({ 
    isOpen, 
    onClose, 
    title, 
    subtitle, 
    children, 
    size = 'md', // Options: sm, md, lg, xl, 2xl, 5xl, full
    padding = 'p-6 sm:p-8',
    hideCloseButton = false
}) => {
    const [show, setShow] = useState(false);
    const [render, setRender] = useState(false);

    // Smooth Enter/Exit Animations & Body Scroll Locking
    useEffect(() => {
        if (isOpen) {
            setRender(true);
            document.body.style.overflow = 'hidden'; // Prevent background scrolling
            // Micro-delay to ensure CSS transition triggers after render
            const timer = setTimeout(() => setShow(true), 10); 
            return () => clearTimeout(timer);
        } else {
            setShow(false);
            document.body.style.overflow = 'unset';
            // Wait for slide-out animation to finish before removing from DOM
            const timer = setTimeout(() => setRender(false), 300); 
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    // Handle Escape Key to close
    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === 'Escape' && isOpen) onClose();
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [isOpen, onClose]);

    // Cleanup scroll lock on unmount
    useEffect(() => {
        return () => { document.body.style.overflow = 'unset'; };
    }, []);

    if (!render) return null;

    // Standardized sizes for the entire application
    const sizeClasses = {
        sm: 'max-w-md',
        md: 'max-w-lg',
        lg: 'max-w-2xl',
        xl: 'max-w-4xl',
        '2xl': 'max-w-5xl',
        '5xl': 'max-w-7xl',
        full: 'max-w-[95vw] h-[95vh]'
    };

    return (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 sm:p-6 pointer-events-none">
            
            {/* 1️⃣ Backdrop with Blur */}
            <div 
                className={`absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity duration-300 pointer-events-auto ${show ? 'opacity-100' : 'opacity-0'}`}
                onClick={onClose}
                aria-hidden="true"
            />

            {/* 2️⃣ Modal Panel with Spring Animation */}
            <div 
                className={`
                    relative w-full ${sizeClasses[size]} bg-white rounded-3xl shadow-2xl flex flex-col pointer-events-auto
                    transform transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]
                    ${show ? 'scale-100 opacity-100 translate-y-0' : 'scale-95 opacity-0 translate-y-8'}
                    max-h-[90vh] // Never taller than the screen
                `}
            >
                {/* 3️⃣ Standardized Header (If title is provided) */}
                {(title || !hideCloseButton) && (
                    <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-white/50 rounded-t-3xl shrink-0">
                        <div>
                            {title && <h3 className="text-xl font-black text-slate-800 tracking-tight">{title}</h3>}
                            {subtitle && <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">{subtitle}</p>}
                        </div>
                        {!hideCloseButton && (
                            <button 
                                onClick={onClose}
                                className="p-2.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-2xl transition-all active:scale-95 focus:outline-none focus:ring-2 focus:ring-rose-200"
                            >
                                <X size={20} strokeWidth={2.5} />
                            </button>
                        )}
                    </div>
                )}

                {/* 4️⃣ Scrollable Body */}
                <div className={`${padding} overflow-y-auto custom-scrollbar flex-1 relative`}>
                    {children}
                </div>
            </div>
        </div>
    );
};

export default CoreModal;