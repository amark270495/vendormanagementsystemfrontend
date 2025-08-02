import React, { useState } from 'react';

const HeaderMenu = ({ header, onSort, filterConfig, onFilterChange }) => {
    // Define which columns should have number or date-specific filtering options
    const DATE_COLUMNS = ['Posting Date', 'Deadline'];
    const NUMBER_COLUMNS = ['# Submitted', 'Max Submissions'];

    const isDate = DATE_COLUMNS.includes(header);
    const isNumber = NUMBER_COLUMNS.includes(header);

    // State for the filter inputs within this menu
    const [filterType, setFilterType] = useState(filterConfig?.type || 'contains');
    const [value1, setValue1] = useState(filterConfig?.value1 || '');
    const [value2, setValue2] = useState(filterConfig?.value2 || '');
    
    // Handlers for applying or clearing the filter for this column
    const handleApply = () => onFilterChange(header, { type: filterType, value1, value2 });
    const handleClear = () => {
        setValue1('');
        setValue2('');
        onFilterChange(header, null); // Pass null to clear the filter
    };
    
    // Determines which filter options to show based on column type
    const getFilterOptions = () => {
        const common = [
            { value: 'contains', label: 'Contains' },
            { value: 'equals', label: 'Equals' },
            { value: 'not_contains', label: 'Does not contain' }
        ];
        const specific = [
            { value: 'above', label: 'Above' },
            { value: 'below', label: 'Below' },
            { value: 'between', label: 'Between' }
        ];
        return (isDate || isNumber) ? [...common, ...specific] : common;
    };

    return (
        <div className="p-2 space-y-2" onClick={(e) => e.stopPropagation()}>
            {/* --- SORTING --- */}
            <div>
                <button onClick={() => onSort('ascending')} className="w-full text-left px-2 py-1 text-sm rounded hover:bg-slate-100">Sort Ascending</button>
                <button onClick={() => onSort('descending')} className="w-full text-left px-2 py-1 text-sm rounded hover:bg-slate-100">Sort Descending</button>
            </div>
            <hr/>
            {/* --- FILTERING --- */}
            <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-500 px-2">FILTER</label>
                <select value={filterType} onChange={e => setFilterType(e.target.value)} className="w-full p-1 border rounded text-sm">
                    {getFilterOptions().map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
                <input 
                    type={isDate ? 'date' : isNumber ? 'number' : 'text'} 
                    value={value1} 
                    onChange={e => setValue1(e.target.value)} 
                    className="w-full p-1 border rounded text-sm" 
                    placeholder={filterType === 'between' ? 'From...' : 'Value...'}
                />
                {filterType === 'between' && (
                    <input 
                        type={isDate ? 'date' : isNumber ? 'number' : 'text'} 
                        value={value2} 
                        onChange={e => setValue2(e.target.value)} 
                        className="w-full p-1 border rounded text-sm" 
                        placeholder="To..."
                    />
                )}
                <div className="flex justify-end space-x-2 pt-1">
                    <button onClick={handleClear} className="px-2 py-1 text-xs bg-slate-200 rounded hover:bg-slate-300">Clear</button>
                    <button onClick={handleApply} className="px-2 py-1 text-xs bg-indigo-600 text-white rounded hover:bg-indigo-700">Apply</button>
                </div>
            </div>
        </div>
    );
};

export default HeaderMenu;