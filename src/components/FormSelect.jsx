import React from 'react';
import { ChevronDown } from 'lucide-react';

/**
 * Reusable Form Select Component
 * @param {string} label - The text label for the select
 * @param {string} id - Unique ID for accessibility
 * @param {Array} options - Array of objects: { value: '1', label: 'Option 1' }
 * @param {string} error - Error message to display
 * @param {string} helperText - Optional subtle text below the input
 * @param {string} placeholder - Text for the default unselected state
 */
const FormSelect = ({
    label,
    id,
    options = [],
    error,
    helperText,
    className = "",
    placeholder = "Select an option...",
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
                <select
                    id={id}
                    className={`
                        appearance-none block w-full rounded-lg border text-sm transition-all duration-200 ease-in-out px-3 py-2.5 bg-white
                        focus:outline-none focus:ring-2 focus:ring-offset-1
                        disabled:bg-slate-50 disabled:text-slate-500 disabled:border-slate-200 disabled:cursor-not-allowed
                        ${error 
                            ? 'border-rose-300 text-rose-900 focus:border-rose-500 focus:ring-rose-500 bg-rose-50/30' 
                            : 'border-slate-300 text-slate-900 focus:border-indigo-500 focus:ring-indigo-500 hover:border-slate-400'
                        }
                        ${!props.value ? 'text-slate-500' : 'text-slate-900'}
                    `}
                    {...props}
                >
                    {placeholder && (
                        <option value="" disabled className="text-slate-500">
                            {placeholder}
                        </option>
                    )}
                    {options.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                            {opt.label}
                        </option>
                    ))}
                </select>
                {/* Custom Dropdown Arrow to replace the ugly default browser one */}
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <ChevronDown className="h-4 w-4 text-slate-400" />
                </div>
            </div>
            
            {error && <p className="mt-1.5 text-sm font-medium text-rose-600 animate-pulse">{error}</p>}
            {!error && helperText && <p className="mt-1.5 text-xs text-slate-500">{helperText}</p>}
        </div>
    );
};

export default FormSelect;