import React, { useState, useEffect, useRef } from 'react';

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

    // Determine alignment class based on prop
    const alignmentClass = align === 'left' ? 'left-0' : 'right-0';

    return (
        <div className="relative inline-block text-left" ref={node}>
            <div onClick={() => setIsOpen(!isOpen)} className="h-full w-full">
                {trigger}
            </div>

            {isOpen && (
                <div 
                    className={`absolute ${alignmentClass} z-[100] mt-2 w-${width} bg-white rounded-md shadow-2xl ring-1 ring-black ring-opacity-5 focus:outline-none py-1`}
                    // Note: Removed onClick={() => setIsOpen(false)} because 
                    // HeaderMenu has internal clicks (inputs/buttons) that shouldn't close the menu.
                >
                    {children}
                </div>
            )}
        </div>
    );
};

export default Dropdown;