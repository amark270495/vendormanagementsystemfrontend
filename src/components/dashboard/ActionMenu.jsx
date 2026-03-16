import React, { useState, useEffect, useRef } from 'react';
import { MoreVertical, Edit, Trash2, Eye, XCircle } from 'lucide-react';

const ActionMenu = ({ 
    onEdit, 
    onDelete, 
    onView, 
    onCloseRequest, 
    customActions = [], 
    disabled = false 
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef(null);

    // Smart Click-Outside Detection
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            // Handle escape key
            const handleEsc = (e) => { if (e.key === 'Escape') setIsOpen(false); };
            document.addEventListener('keydown', handleEsc);
            
            return () => {
                document.removeEventListener('mousedown', handleClickOutside);
                document.removeEventListener('keydown', handleEsc);
            };
        }
    }, [isOpen]);

    const toggleMenu = (e) => {
        e.stopPropagation(); // Prevents row click events from firing
        if (!disabled) setIsOpen(!isOpen);
    };

    const handleAction = (e, actionFn) => {
        e.stopPropagation();
        setIsOpen(false);
        if (actionFn) actionFn();
    };

    return (
        <div className="relative" ref={menuRef}>
            {/* Trigger Button */}
            <button
                onClick={toggleMenu}
                disabled={disabled}
                className={`
                    p-2 rounded-xl transition-all duration-200 focus:outline-none 
                    ${disabled ? 'opacity-50 cursor-not-allowed text-slate-300' : 'text-slate-400 hover:bg-slate-100 hover:text-indigo-600 focus:ring-2 focus:ring-indigo-500/30'}
                    ${isOpen ? 'bg-indigo-50 text-indigo-600' : ''}
                `}
            >
                <MoreVertical size={18} />
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 z-[100] py-2 animate-in fade-in zoom-in-95 slide-in-from-top-2 origin-top-right">
                    
                    {onView && (
                        <button onClick={(e) => handleAction(e, onView)} className="w-full px-4 py-2.5 text-left text-sm font-semibold text-slate-600 hover:bg-slate-50 hover:text-indigo-600 flex items-center gap-3 transition-colors">
                            <Eye size={16} /> View Details
                        </button>
                    )}
                    
                    {onEdit && (
                        <button onClick={(e) => handleAction(e, onEdit)} className="w-full px-4 py-2.5 text-left text-sm font-semibold text-slate-600 hover:bg-slate-50 hover:text-blue-600 flex items-center gap-3 transition-colors">
                            <Edit size={16} /> Edit Record
                        </button>
                    )}

                    {onCloseRequest && (
                        <button onClick={(e) => handleAction(e, onCloseRequest)} className="w-full px-4 py-2.5 text-left text-sm font-semibold text-slate-600 hover:bg-slate-50 hover:text-amber-600 flex items-center gap-3 transition-colors">
                            <XCircle size={16} /> Close Request
                        </button>
                    )}

                    {/* Render any custom specific actions passed in */}
                    {customActions.map((action, index) => (
                        <button 
                            key={index}
                            onClick={(e) => handleAction(e, action.onClick)} 
                            className={`w-full px-4 py-2.5 text-left text-sm font-semibold flex items-center gap-3 transition-colors ${action.className || 'text-slate-600 hover:bg-slate-50 hover:text-indigo-600'}`}
                        >
                            {action.icon && <action.icon size={16} />} 
                            {action.label}
                        </button>
                    ))}

                    {onDelete && (
                        <>
                            <div className="h-px bg-slate-100 my-1 mx-3" />
                            <button onClick={(e) => handleAction(e, onDelete)} className="w-full px-4 py-2.5 text-left text-sm font-bold text-rose-500 hover:bg-rose-50 flex items-center gap-3 transition-colors">
                                <Trash2 size={16} /> Delete
                            </button>
                        </>
                    )}
                </div>
            )}
        </div>
    );
};

export default ActionMenu;