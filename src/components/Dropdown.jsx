import React, { useState, useEffect, useRef, createContext, useContext, useCallback } from 'react';

// 1. Create Context for closing
const DropdownContext = createContext();

// 2. Export Hook for child elements (DropdownItems)
export const useDropdown = () => useContext(DropdownContext);

/**
 * Enterprise Dropdown Wrapper
 * * @param {React.ReactNode} trigger - The button/element that toggles the dropdown
 * @param {React.ReactNode} children - The inner menu content (defines its own background/width)
 * @param {string} [align='right'] - 'left' or 'right' alignment origin
 * @param {string} [className=''] - Optional extra classes for the absolute wrapper
 */
const Dropdown = ({ trigger, children, align = 'right', className = '' }) => {
    const [isOpen, setIsOpen] = useState(false);
    const node = useRef();

    // 3. Handle Outside Click & Escape Key (Optimized to run only when open)
    useEffect(() => {
        if (!isOpen) return;

        const handleClickOutside = (e) => {
            if (node.current && !node.current.contains(e.target)) {
                setIsOpen(false);
            }
        };

        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                setIsOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        document.addEventListener("keydown", handleEscape);

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("keydown", handleEscape);
        };
    }, [isOpen]);

    // 4. Stable close function to pass down to children
    const close = useCallback(() => setIsOpen(false), []);

    // 5. Semantic alignment and transform origins
    const alignmentClass = align === 'left' ? 'left-0 origin-top-left' : 'right-0 origin-top-right';

    return (
        <div className="relative inline-block text-left" ref={node}>
            
            {/* --- Scoped Animation Keyframes (Zero-Config) --- */}
            <style>
                {`
                    @keyframes dropdownFadeIn {
                        from { opacity: 0; transform: scale(0.96) translateY(-6px); }
                        to { opacity: 1; transform: scale(1) translateY(0); }
                    }
                    .animate-dropdown {
                        animation: dropdownFadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                    }
                `}
            </style>

            {/* --- Trigger Wrapper --- */}
            <div 
                onClick={(e) => {
                    e.stopPropagation();
                    setIsOpen(!isOpen);
                }} 
                className="h-full w-full cursor-pointer outline-none"
                aria-expanded={isOpen}
                aria-haspopup="menu"
            >
                {trigger}
            </div>

            {/* --- Dropdown Content Engine --- */}
            {isOpen && (
                <DropdownContext.Provider value={{ close }}>
                    <div 
                        className={`absolute ${alignmentClass} z- mt-2 outline-none animate-dropdown ${className}`}
                        role="menu"
                    >
                        {/* Note: We let the child components (passed from TopNav) 
                            handle their own widths, glass backgrounds, and paddings.
                            This makes the Dropdown infinitely reusable.
                        */}
                        {children}
                    </div>
                </DropdownContext.Provider>
            )}
        </div>
    );
};

export default Dropdown;