import React, { useState } from 'react';
import { Search, ChevronLeft, ChevronRight, Inbox } from 'lucide-react';

/**
 * Reusable DataTable Component
 * @param {Array} columns - Array of objects: { key: 'id', label: 'ID', render: (row) => JSX }
 * @param {Array} data - Array of data objects
 * @param {string} searchPlaceholder - Placeholder text for the search bar
 * @param {Function} onSearch - (Optional) Custom search handler. If omitted, uses basic local text filtering.
 */
const DataTable = ({ columns, data = [], searchPlaceholder = "Search records...", onSearch }) => {
    const [searchTerm, setSearchTerm] = useState('');

    const handleSearch = (e) => {
        const val = e.target.value;
        setSearchTerm(val);
        if (onSearch) {
            onSearch(val);
        }
    };

    // Basic local filtering if no external onSearch is provided
    const displayData = onSearch 
        ? data 
        : data.filter(row => 
            Object.values(row).some(val => 
                String(val).toLowerCase().includes(searchTerm.toLowerCase())
            )
        );

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
            
            {/* Toolbar / Search */}
            <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="relative max-w-md w-full">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-4 w-4 text-slate-400" />
                    </div>
                    <input
                        type="text"
                        className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow"
                        placeholder={searchPlaceholder}
                        value={searchTerm}
                        onChange={handleSearch}
                    />
                </div>
            </div>

            {/* Table Area */}
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                        <tr>
                            {columns.map((col, idx) => (
                                <th 
                                    key={col.key || idx} 
                                    scope="col" 
                                    className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap"
                                >
                                    {col.label}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-200">
                        {displayData.length > 0 ? (
                            displayData.map((row, rowIndex) => (
                                <tr key={row.id || rowIndex} className="hover:bg-slate-50 transition-colors">
                                    {columns.map((col, colIndex) => (
                                        <td 
                                            key={col.key || colIndex} 
                                            className="px-6 py-4 text-sm text-slate-700 whitespace-nowrap"
                                        >
                                            {/* Use custom render function if provided, otherwise render raw value */}
                                            {col.render ? col.render(row) : row[col.key]}
                                        </td>
                                    ))}
                                </tr>
                            ))
                        ) : (
                            /* Empty State */
                            <tr>
                                <td colSpan={columns.length} className="px-6 py-12 text-center">
                                    <div className="flex flex-col items-center justify-center text-slate-400">
                                        <Inbox className="h-10 w-10 mb-3 text-slate-300" />
                                        <p className="text-base font-medium text-slate-900">No records found</p>
                                        <p className="text-sm">We couldn't find anything matching your criteria.</p>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination / Footer (Static UI for now, ready to wire up) */}
            <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between sm:px-6">
                <div className="hidden sm:block">
                    <p className="text-sm text-slate-700">
                        Showing <span className="font-medium">{displayData.length > 0 ? 1 : 0}</span> to <span className="font-medium">{displayData.length}</span> of <span className="font-medium">{data.length}</span> results
                    </p>
                </div>
                <div className="flex-1 flex justify-between sm:justify-end gap-2">
                    <button className="relative inline-flex items-center px-3 py-2 border border-slate-300 text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                        <ChevronLeft className="h-4 w-4 mr-1" />
                        Previous
                    </button>
                    <button className="relative inline-flex items-center px-3 py-2 border border-slate-300 text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                        Next
                        <ChevronRight className="h-4 w-4 ml-1" />
                    </button>
                </div>
            </div>

        </div>
    );
};

export default DataTable;