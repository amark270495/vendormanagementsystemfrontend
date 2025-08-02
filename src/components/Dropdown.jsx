import React, { useState, useEffect, useRef } from 'react';

/**
 * A reusable Dropdown component.
 * It takes a `trigger` element and `children` to display in the dropdown menu.
 * @param {object} props - The component props.
 * @param {React.ReactNode} props.trigger - The element that opens the dropdown when clicked.
 * @param {React.ReactNode} props.children - The content to be displayed inside the dropdown.
 * @param {string} [props.width='48'] - The width of the dropdown menu (maps to Tailwind's w- class).
 */
const Dropdown = ({ trigger, children, width = '48' }) => {
    const [isOpen, setIsOpen] = useState(false);
    const node = useRef();

    // This effect adds an event listener to the document to handle clicks outside the dropdown.
    useEffect(() => {
        const handleClickOutside = (e) => {
            // If the click is outside the dropdown's DOM node, close the dropdown.
            if (node.current && !node.current.contains(e.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);

        // Cleanup function to remove the event listener when the component is unmounted.
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    return (
        <div className="relative" ref={node}>
            {/* The trigger element. Clicking it toggles the dropdown's visibility. */}
            <div onClick={() => setIsOpen(!isOpen)}>
                {trigger}
            </div>

            {/* The dropdown menu, which is rendered conditionally based on the `isOpen` state. */}
            {isOpen && (
                <div 
                    className={`absolute right-0 mt-2 w-${width} bg-white rounded-md shadow-lg z-20 py-1`}
                    // Clicking inside the dropdown content will also close it.
                    onClick={() => setIsOpen(false)}
                >
                    {children}
                </div>
            )}
        </div>
    );
};

export default Dropdown;