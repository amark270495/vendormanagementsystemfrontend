import React from 'react';

/**
 * Reusable Form Input Component
 * @param {string} label - The text label for the input
 * @param {string} id - Unique ID for accessibility
 * @param {string} type - Input type (text, email, password, number, etc.)
 * @param {string} error - Error message to display (also triggers red error styling)
 * @param {string} helperText - Optional subtle text below the input
 * @param {ReactNode} icon - Optional lucide-react icon component
 */
const FormInput = ({ 
    label, 
    id, 
    type = "text", 
    error, 
    helperText, 
    icon: Icon, 
    className = "", 
    ...props 
}) => {
    return (
        <div className={`flex flex-col mb-4 w-full ${className}`}>
            {label && (
                <label htmlFor={id} className="mb-1.5 text-sm font-semibold text-slate-700">
                    {label} {props.required && <span className="text-rose-500">*</span>}
                </label>
            )}
            <div className="relative">
                {Icon && (
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Icon className="h-4 w-4 text-slate-400" />
                    </div>
                )}
                <input
                    id={id}
                    type={type}
                    className={`
                        block w-full rounded-lg border text-sm transition-all duration-200 ease-in-out
                        ${Icon ? 'pl-9' : 'pl-3'} pr-3 py-2.5
                        focus:outline-none focus:ring-2 focus:ring-offset-1
                        disabled:bg-slate-50 disabled:text-slate-500 disabled:border-slate-200 disabled:shadow-none disabled:cursor-not-allowed
                        ${error 
                            ? 'border-rose-300 text-rose-900 placeholder-rose-300 focus:border-rose-500 focus:ring-rose-500 bg-rose-50/30' 
                            : 'border-slate-300 text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:ring-indigo-500 hover:border-slate-400 bg-white'
                        }
                    `}
                    {...props}
                />
            </div>
            {/* Error Message */}
            {error && <p className="mt-1.5 text-sm font-medium text-rose-600 animate-pulse">{error}</p>}
            {/* Helper Text (Only shows if there is no error) */}
            {!error && helperText && <p className="mt-1.5 text-xs text-slate-500">{helperText}</p>}
        </div>
    );
};

export default FormInput;