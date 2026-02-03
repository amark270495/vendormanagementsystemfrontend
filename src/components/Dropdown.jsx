import React, { useState, useEffect, useRef, createContext, useContext, useCallback } from 'react';

// 1. Create a Context to share the close function
const DropdownContext = createContext();

// 2. Export a hook for children to use
export const useDropdown = () => useContext(DropdownContext);

/**
 * @param {string} [props.align='right'] - 'left' or 'right' alignment.
 */
const Dropdown = ({ trigger, children, width = '48', align = 'right' }) => {
    const [isOpen, setIsOpen] = useState(false);
    const node = useRef();

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (node.current && !node.current.contains(e.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // 3. Create a stable close function
    const close = useCallback(() => setIsOpen(false), []);

    const alignmentClass = align === 'left' ? 'left-0' : 'right-0';

    return (
        <div className="relative inline-block text-left" ref={node}>
            <div onClick={() => setIsOpen(!isOpen)} className="h-full w-full">
                {trigger}
            </div>

            {isOpen && (
                // 4. Wrap children in the Provider
                <DropdownContext.Provider value={{ close }}>
                    <div 
                        className={`absolute ${alignmentClass} z-[100] mt-2 w-${width} bg-white rounded-md shadow-2xl ring-1 ring-black ring-opacity-5 focus:outline-none py-1`}
                    >
                        {children}
                    </div>
                </DropdownContext.Provider>
            )}
        </div>
    );
};

export default Dropdown;