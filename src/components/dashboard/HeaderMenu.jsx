import React, { useState, useEffect } from 'react';

// These constants should match the ones in DashboardPage.jsx for consistency
const DATE_COLUMNS = ['Posting Date', 'Deadline'];
const NUMBER_COLUMNS = ['# Submitted', 'Max Submissions'];

const HeaderMenu = ({ header, onSort, filterConfig, onFilterChange }) => {
    // State to manage the filter inputs within the dropdown
    const [type, setType] = useState(filterConfig?.type || 'contains');
    const [value1, setValue1] = useState(filterConfig?.value1 || '');
    const [value2, setValue2] = useState(filterConfig?.value2 || '');

    // Effect to reset the state if the filter config changes from outside
    useEffect(() => {
        setType(filterConfig?.type || 'contains');
        setValue1(filterConfig?.value1 || '');
        setValue2(filterConfig?.value2 || '');
    }, [filterConfig]);

    // Handlers to apply or clear the filter
    const handleApply = () => {
        onFilterChange(header, { type, value1, value2 });
    };

    const handleClear = () => {
        onFilterChange(header, null);
    };

    // Determine the correct input type based on the column name
    const isDate = DATE_COLUMNS.includes(header);
    const isNumber = NUMBER_COLUMNS.includes(header);
    const inputType = isDate ? 'date' : isNumber ? 'number' : 'text';

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
        // Stop click propagation to prevent the dropdown from closing when interacting with inputs
        <div className="p-3 w-full" onClick={(e) => e.stopPropagation()}>
            {/* Sorting options */}
            <div className="space-y-1">
                <button onClick={() => onSort('ascending')} className="w-full text-left px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded-md">Sort Ascending</button>
                <button onClick={() => onSort('descending')} className="w-full text-left px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded-md">Sort Descending</button>
            </div>

            {/* Filtering section */}
            <div className="mt-2 pt-2 border-t border-gray-200">
                <p className="text-xs font-semibold text-gray-500 uppercase px-1 mb-2">Filter</p>
                
                {/* This is the corrected layout: using a vertical stack (space-y-2) */}
                <div className="space-y-2">
                    <select value={type} onChange={(e) => setType(e.target.value)} className="w-full border-gray-300 rounded-md shadow-sm text-sm focus:ring-indigo-500 focus:border-indigo-500">
                        {getFilterOptions().map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                    </select>
                    
                    <input
                        type={inputType}
                        placeholder="Value..."
                        value={value1}
                        onChange={(e) => setValue1(e.target.value)}
                        className="w-full border-gray-300 rounded-md shadow-sm text-sm focus:ring-indigo-500 focus:border-indigo-500"
                    />

                    {/* Conditionally show the second input for the "between" filter type */}
                    {type === 'between' && (
                        <input
                            type={inputType}
                            placeholder="Value 2..."
                            value={value2}
                            onChange={(e) => setValue2(e.target.value)}
                            className="w-full border-gray-300 rounded-md shadow-sm text-sm focus:ring-indigo-500 focus:border-indigo-500"
                        />
                    )}
                </div>

                {/* Action buttons for the filter */}
                <div className="flex justify-end space-x-2 mt-3">
                    <button onClick={handleClear} className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">Clear</button>
                    <button onClick={handleApply} className="px-3 py-1.5 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700">Apply</button>
                </div>
            </div>
        </div>
    );
};

export default HeaderMenu;