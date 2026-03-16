import React from 'react';
import { ChevronDown, AlertCircle } from 'lucide-react';

const InputField = ({ 
    label, 
    name, 
    type = 'text', 
    required = false, 
    readOnly = false, 
    disabled = false,
    value, 
    onChange, 
    options, 
    icon: Icon,
    error,
    placeholder,
    rows = 3 // For textarea support
}) => {
    
    // Determine the base state classes for the interactive elements
    const baseClasses = "w-full border-none rounded-2xl px-4 py-3 text-sm font-semibold transition-all outline-none ring-1";
    
    const stateClasses = readOnly || disabled 
        ? "bg-slate-100 text-slate-400 ring-slate-200 cursor-not-allowed italic"
        : error 
            ? "bg-rose-50 text-rose-900 ring-rose-300 focus:ring-rose-500 focus:bg-white"
            : "bg-white text-slate-700 ring-slate-200 hover:ring-slate-300 focus:ring-indigo-500/30 focus:shadow-md";

    const isTextarea = type === 'textarea';
    const isSelect = !!options;

    return (
        <div className="relative group flex flex-col gap-1.5 flex-1">
            {/* Label & Icon */}
            <label className={`
                text-[10px] font-bold uppercase tracking-[0.15em] ml-1 flex items-center gap-1.5 transition-colors 
                ${error ? 'text-rose-500' : 'text-slate-400 group-focus-within:text-indigo-500'}
            `}>
                {Icon && <Icon size={12} />}
                {label} {required && <span className="text-rose-400 font-bold">*</span>}
            </label>
            
            {/* Input Area */}
            <div className="relative">
                {isSelect ? (
                    <>
                        <select 
                            name={name} 
                            value={value || ''} 
                            onChange={onChange} 
                            disabled={readOnly || disabled}
                            className={`${baseClasses} ${stateClasses} appearance-none cursor-pointer`}
                        >
                            <option value="">Select Option</option>
                            {options.map(opt => (
                                typeof opt === 'object' 
                                    ? <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    : <option key={opt} value={opt}>{opt}</option>
                            ))}
                        </select>
                        <ChevronDown size={14} className={`absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none transition-colors ${error ? 'text-rose-400' : 'text-slate-300 group-focus-within:text-indigo-400'}`} />
                    </>
                ) : isTextarea ? (
                    <textarea
                        name={name}
                        value={value || ''}
                        onChange={onChange}
                        disabled={readOnly || disabled}
                        readOnly={readOnly}
                        rows={rows}
                        placeholder={placeholder || `Enter ${label.toLowerCase()}...`}
                        className={`${baseClasses} ${stateClasses} resize-none`}
                    />
                ) : (
                    <input 
                        type={type} 
                        name={name} 
                        value={value || ''} 
                        onChange={onChange} 
                        readOnly={readOnly}
                        disabled={readOnly || disabled} 
                        placeholder={placeholder || `Enter ${label.toLowerCase()}...`}
                        className={`${baseClasses} ${stateClasses}`}
                    />
                )}
            </div>

            {/* Validation / Error Message */}
            {error && (
                <div className="flex items-center gap-1 mt-1 text-rose-500 ml-1 animate-in fade-in slide-in-from-top-1">
                    <AlertCircle size={12} />
                    <p className="text-[10px] font-bold uppercase tracking-wide">{error}</p>
                </div>
            )}
        </div>
    );
};

export default InputField;