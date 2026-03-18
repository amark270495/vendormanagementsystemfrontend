import React, {
    useState,
    useEffect,
    useRef,
    createContext,
    useContext,
    useCallback
} from 'react';
import { createPortal } from 'react-dom';

// Context
const DropdownContext = createContext();
export const useDropdown = () => useContext(DropdownContext);

const Dropdown = ({ trigger, children, width = '180px', align = 'right' }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [position, setPosition] = useState({ top: 0, left: 0 });
    const triggerRef = useRef(null);
    const dropdownRef = useRef(null);

    const close = useCallback(() => setIsOpen(false), []);

    // 🔥 Calculate position dynamically
    const updatePosition = useCallback(() => {
        if (!triggerRef.current) return;

        const rect = triggerRef.current.getBoundingClientRect();

        const top = rect.bottom + window.scrollY + 6;

        let left;
        if (align === 'left') {
            left = rect.left + window.scrollX;
        } else {
            left = rect.right + window.scrollX - 180; // fallback width
        }

        setPosition({ top, left });
    }, [align]);

    // Handle open
    const toggleDropdown = () => {
        if (!isOpen) {
            updatePosition();
        }
        setIsOpen(prev => !prev);
    };

    // Close on outside click
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(e.target) &&
                triggerRef.current &&
                !triggerRef.current.contains(e.target)
            ) {
                close();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [close]);

    // Reposition on scroll / resize
    useEffect(() => {
        if (!isOpen) return;

        const handleScroll = () => updatePosition();
        const handleResize = () => updatePosition();

        window.addEventListener('scroll', handleScroll, true);
        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('scroll', handleScroll, true);
            window.removeEventListener('resize', handleResize);
        };
    }, [isOpen, updatePosition]);

    return (
        <>
            {/* Trigger */}
            <div
                ref={triggerRef}
                onClick={toggleDropdown}
                className="inline-block w-full h-full"
            >
                {trigger}
            </div>

            {/* Portal Dropdown */}
            {isOpen &&
                createPortal(
                    <DropdownContext.Provider value={{ close }}>
                        <div
                            ref={dropdownRef}
                            style={{
                                position: 'fixed',
                                top: position.top,
                                left: position.left,
                                width: width,
                                zIndex: 99999
                            }}
                            className="bg-white rounded-xl shadow-2xl border border-slate-200 py-1 animate-in fade-in zoom-in-95 duration-100"
                        >
                            {children}
                        </div>
                    </DropdownContext.Provider>,
                    document.body
                )}
        </>
    );
};

export default Dropdown;