import React, { useState, useEffect } from 'react';

const DATE_COLUMNS = ['Posting Date', 'Deadline'];
const NUMBER_COLUMNS = ['# Submitted', 'Max Submissions'];

const HeaderMenu = ({ header, onSort, filterConfig, onFilterChange }) => {
    const [type, setType] = useState(filterConfig?.type || 'contains');
    const [value1, setValue1] = useState(filterConfig?.value1 || '');
    const [value2, setValue2] = useState(filterConfig?.value2 || '');

    useEffect(() => {
        setType(filterConfig?.type || 'contains');
        setValue1(filterConfig?.value1 || '');
        setValue2(filterConfig?.value2 || '');
    }, [filterConfig]);

    const handleApply = () => onFilterChange(header, { type, value1, value2 });
    const handleClear = () => onFilterChange(header, null);

    const isDate = DATE_COLUMNS.includes(header);
    const isNumber = NUMBER_COLUMNS.includes(header);
    const inputType = isDate ? 'date' : isNumber ? 'number' : 'text';

    const getFilterOptions = () => {
        const common = [
            { value: 'contains', label: 'Contains' },
            { value: 'equals', label: 'Equals' },
            { value: 'not_contains', label: 'Not Contain' }
        ];
        return (isDate || isNumber) ? [...common, 
            { value: 'above', label: 'Above' },
            { value: 'below', label: 'Below' },
            { value: 'between', label: 'Between' }
        ] : common;
    };

    return (
        <div className="p-4 w-72 bg-white rounded-lg shadow-2xl border border-slate-200" onClick={(e) => e.stopPropagation()}>
            <div className="space-y-2 mb-4">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Sort Order</p>
                <button onClick={() => onSort('ascending')} className="flex items-center w-full px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 rounded-lg transition-colors">
                    <svg className="h-4 w-4 mr-2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12"/></svg>
                    Sort Ascending
                </button>
                <button onClick={() => onSort('descending')} className="flex items-center w-full px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 rounded-lg transition-colors">
                    <svg className="h-4 w-4 mr-2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M3 4h13M3 8h9m-9 4h9m5-1l-4 4m0 0l-4-4m4 4V10"/></svg>
                    Sort Descending
                </button>
            </div>

            <div className="pt-4 border-t border-slate-100">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1 mb-3">Filter Logic</p>
                <div className="space-y-3">
                    <select value={type} onChange={(e) => setType(e.target.value)} className="w-full border-slate-300 rounded-lg text-sm font-medium focus:ring-blue-500 shadow-sm">
                        {getFilterOptions().map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                    </select>
                    
                    <input
                        type={inputType}
                        placeholder="Search value..."
                        value={value1}
                        onChange={(e) => setValue1(e.target.value)}
                        className="w-full border-slate-300 rounded-lg text-sm p-2 focus:ring-blue-500 shadow-sm"
                    />

                    {type === 'between' && (
                        <input
                            type={inputType}
                            placeholder="And..."
                            value={value2}
                            onChange={(e) => setValue2(e.target.value)}
                            className="w-full border-slate-300 rounded-lg text-sm p-2 focus:ring-blue-500 shadow-sm"
                        />
                    )}
                </div>

                <div className="flex justify-end items-center gap-2 mt-5">
                    <button onClick={handleClear} className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors">Reset</button>
                    <button onClick={handleApply} className="px-4 py-2 text-xs font-bold text-white bg-slate-800 rounded-lg hover:bg-slate-900 transition-all shadow-md">Apply Filter</button>
                </div>
            </div>
        </div>
    );
};

export default HeaderMenu;