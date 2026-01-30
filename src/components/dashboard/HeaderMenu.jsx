import React, { useState, useEffect } from 'react';
import { 
  SortAsc, 
  SortDesc, 
  Filter, 
  RotateCcw, 
  Check, 
  ChevronDown 
} from 'lucide-react';

const DATE_COLUMNS = ['Posting Date', 'Deadline'];
const NUMBER_COLUMNS = ['# Submitted', 'Max Submissions'];

const HeaderMenu = ({ header, onSort, filterConfig, onFilterChange, isFirstColumn }) => {
    const [type, setType] = useState(filterConfig?.type || 'contains');
    const [value1, setValue1] = useState(filterConfig?.value1 || '');
    const [value2, setValue2] = useState(filterConfig?.value2 || '');

    useEffect(() => {
        setType(filterConfig?.type || 'contains');
        setValue1(filterConfig?.value1 || '');
        setValue2(filterConfig?.value2 || '');
    }, [filterConfig]);

    const handleApply = () => {
        onFilterChange(header, { type, value1, value2 });
    };

    const handleClear = () => {
        onFilterChange(header, null);
    };

    const isDate = DATE_COLUMNS.includes(header);
    const isNumber = NUMBER_COLUMNS.includes(header);
    const inputType = isDate ? 'date' : isNumber ? 'number' : 'text';

    const getFilterOptions = () => {
        const common = [
            { value: 'contains', label: 'Contains' },
            { value: 'equals', label: 'Exactly' },
            { value: 'not_contains', label: 'Excludes' }
        ];
        const specific = [
            { value: 'above', label: 'Greater than' },
            { value: 'below', label: 'Less than' },
            { value: 'between', label: 'Between range' }
        ];
        return (isDate || isNumber) ? [...common, ...specific] : common;
    };

    return (
        <div 
            /* ALIGMENT FIX: 
               If isFirstColumn is true, we use left-0. 
               Otherwise, we use right-0 to stay inside the table container.
            */
            className={`
                absolute top-full mt-2 min-w-[260px] bg-white rounded-xl shadow-2xl border border-slate-200 z-[100] overflow-hidden
                ${isFirstColumn ? 'left-0' : 'right-0'}
            `}
            onClick={(e) => e.stopPropagation()}
        >
            {/* Sorting Section */}
            <div className="p-2 space-y-1">
                <p className="px-3 pt-2 pb-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Sort Order</p>
                <button 
                    onClick={() => onSort('ascending')} 
                    className="flex items-center w-full px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-lg transition-colors group"
                >
                    <SortAsc className="mr-2.5 h-4 w-4 text-slate-400 group-hover:text-indigo-600" />
                    <span className="font-medium">Sort Ascending</span>
                </button>
                <button 
                    onClick={() => onSort('descending')} 
                    className="flex items-center w-full px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-lg transition-colors group"
                >
                    <SortDesc className="mr-2.5 h-4 w-4 text-slate-400 group-hover:text-indigo-600" />
                    <span className="font-medium">Sort Descending</span>
                </button>
            </div>

            {/* Filter Section */}
            <div className="border-t border-slate-100 bg-slate-50/50 p-4">
                <div className="flex items-center mb-3">
                    <Filter className="h-3.5 w-3.5 text-slate-500 mr-2" />
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Filter Column</p>
                </div>
                
                <div className="space-y-3">
                    <div className="relative">
                        <select 
                            value={type} 
                            onChange={(e) => setType(e.target.value)} 
                            className="w-full pl-3 pr-10 py-2 bg-white border border-slate-200 rounded-lg text-sm appearance-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all cursor-pointer shadow-sm font-medium text-slate-700"
                        >
                            {getFilterOptions().map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                        </select>
                        <ChevronDown className="absolute right-3 top-2.5 h-4 w-4 text-slate-400 pointer-events-none" />
                    </div>
                    
                    <div className="space-y-2">
                        <input
                            type={inputType}
                            placeholder={type === 'between' ? "From..." : "Value..."}
                            value={value1}
                            onChange={(e) => setValue1(e.target.value)}
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all shadow-sm placeholder:text-slate-400"
                        />

                        {type === 'between' && (
                            <input
                                type={inputType}
                                placeholder="To..."
                                value={value2}
                                onChange={(e) => setValue2(e.target.value)}
                                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all shadow-sm"
                            />
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-2 mt-5">
                    <button 
                        onClick={handleClear} 
                        className="flex-1 inline-flex items-center justify-center px-3 py-2 text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:text-red-600 transition-all active:scale-95 shadow-sm"
                    >
                        <RotateCcw className="mr-1.5 h-3 w-3" />
                        Reset
                    </button>
                    <button 
                        onClick={handleApply} 
                        className="flex-1 inline-flex items-center justify-center px-3 py-2 text-xs font-bold text-white bg-indigo-600 border border-transparent rounded-lg hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all active:scale-95"
                    >
                        <Check className="mr-1.5 h-3 w-3" />
                        Apply
                    </button>
                </div>
            </div>
        </div>
    );
};

export default HeaderMenu;