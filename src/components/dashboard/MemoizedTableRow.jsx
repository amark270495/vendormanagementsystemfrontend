import React, { useState, useEffect, useRef, memo } from 'react';
import { formatDate, getDeadlineClass } from '../../utils/helpers';
import ActionMenu from './ActionMenu';

// --- MultiSelectDropdown (Encapsulated inside the row component) ---
const MultiSelectDropdown = ({ options, selectedNames, onChange, onBlur }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
                if (onBlur) onBlur(); 
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [onBlur]);

    const handleToggleSelect = (name) => {
        if (name === "Need To Update") {
            onChange(["Need To Update"]);
            return;
        }
        
        const currentSelected = Array.isArray(selectedNames) ? selectedNames : [];
        const newSelectedNames = currentSelected.includes(name)
            ? currentSelected.filter(n => n !== name)
            : [...currentSelected.filter(n => n !== "Need To Update"), name]; 

        if (newSelectedNames.length === 0) {
            onChange(["Need To Update"]);
        } else {
            onChange(newSelectedNames);
        }
    };
    
    const displayArray = Array.isArray(selectedNames) ? selectedNames : [];
    const displayValue = displayArray.length > 0 && displayArray[0] !== "Need To Update"
        ? `${displayArray.length} selected`
        : "Unassigned";

    return (
        <div className="relative w-full" ref={dropdownRef}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="block w-full border border-gray-300 rounded-md shadow-sm p-2 text-sm bg-white text-left focus:ring-2 focus:ring-blue-500 transition-all"
            >
                <span className="truncate block pr-4">{displayValue}</span>
                <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                     <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 3a1 1 0 01.707.293l3 3a1 1 0 01-1.414 1.414L10 5.414 7.707 7.707a1 1 0 01-1.414-1.414l3-3A1 1 0 0110 3zm-3.707 9.293a1 1 0 011.414 0L10 14.586l2.293-2.293a1 1 0 011.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                </span>
            </button>
            {isOpen && (
                <div className="absolute z-50 left-0 mt-1 bg-white border border-gray-300 rounded-md shadow-xl max-h-60 overflow-y-auto min-w-full w-auto">
                    <ul>
                        <li onClick={() => handleToggleSelect("Need To Update")} className="flex items-center px-4 py-2 text-sm text-gray-700 cursor-pointer hover:bg-gray-50">
                            <input type="checkbox" readOnly checked={displayArray.includes("Need To Update")} className="mr-2 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                            Unassigned
                        </li>
                        {options.map(name => (
                            <li key={name} onClick={() => handleToggleSelect(name)} className="flex items-center px-4 py-2 text-sm text-gray-700 cursor-pointer hover:bg-gray-50">
                                <input type="checkbox" readOnly checked={displayArray.includes(name)} className="mr-2 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                                {name}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

// --- Memoized Table Row ---
const MemoizedTableRow = memo(({
    row, rowIndex, postingId, displayHeader, editingCell, unsavedChanges,
    canEditDashboard, recruiters, REMARKS_OPTIONS, jobToObject,
    handleCellClick, handleCellEdit, setEditingCell, setModalState, getStatusBadge, CANDIDATE_COLUMNS, EDITABLE_COLUMNS, DATE_COLUMNS
}) => {
    const rowChanges = unsavedChanges[postingId] || {};
    const dbComment = jobToObject(row)['Comments'];
    const currentCustomComment = rowChanges['Comments'] !== undefined ? rowChanges['Comments'] : dbComment;

    return (
        <tr className="bg-white hover:bg-blue-50/30 transition-colors">
            {row.map((cell, cellIndex) => {
                const headerName = displayHeader[cellIndex];
                const isEditing = editingCell?.rowIndex === rowIndex && editingCell?.cellIndex === cellIndex;
                const hasUnsaved = rowChanges[headerName] !== undefined || (headerName === 'Remarks' && rowChanges['Comments'] !== undefined);

                let selectedWorkingBy = [];
                if (headerName === 'Working By') {
                    const workingByValue = (rowChanges[headerName] !== undefined ? rowChanges[headerName] : cell) || "Need To Update";
                    const stringValue = Array.isArray(workingByValue) ? workingByValue.join(', ') : String(workingByValue);
                    selectedWorkingBy = stringValue.split(',').map(s => s.trim()).filter(s => s && s !== "Need To Update");
                    if (selectedWorkingBy.length === 0) selectedWorkingBy = ["Need To Update"];
                }

                const baseCellClass = `px-4 py-4 border-r border-slate-50 font-medium whitespace-normal break-words align-top text-[13px] leading-relaxed 
                    ${hasUnsaved ? 'bg-amber-50 shadow-inner' : ''} 
                    ${headerName === 'Deadline' ? getDeadlineClass(cell) : 'text-slate-600'} 
                    ${canEditDashboard && (EDITABLE_COLUMNS.includes(headerName) || CANDIDATE_COLUMNS.includes(headerName)) ? 'cursor-pointer hover:bg-blue-50' : ''}`;

                return (
                    <td key={cellIndex} onClick={() => handleCellClick(rowIndex, cellIndex)} className={baseCellClass}>
                        {isEditing && headerName === 'Working By' && canEditDashboard ? (
                            <MultiSelectDropdown
                                options={recruiters}
                                selectedNames={selectedWorkingBy} 
                                onBlur={() => setEditingCell(null)}
                                onChange={(selectedNames) => handleCellEdit(rowIndex, cellIndex, selectedNames)}
                            />
                        ) : isEditing && headerName === 'Remarks' && canEditDashboard ? (
                            <select
                                value={rowChanges[headerName] || cell}
                                onBlur={() => setEditingCell(null)}
                                onChange={(e) => {
                                    handleCellEdit(rowIndex, cellIndex, e.target.value);
                                    setEditingCell(null);
                                }}
                                className="block w-full border-slate-300 rounded-md p-2 text-sm focus:ring-blue-500"
                                autoFocus
                            >
                                <option value="">Select Remark</option>
                                {REMARKS_OPTIONS.map(option => <option key={option} value={option}>{option}</option>)}
                            </select>
                        ) : (
                            <div 
                                contentEditable={isEditing && headerName !== 'Working By' && headerName !== 'Remarks' && canEditDashboard} 
                                suppressContentEditableWarning={true} 
                                onBlur={e => { 
                                    if (isEditing) { 
                                        handleCellEdit(rowIndex, cellIndex, e.target.innerText); 
                                        setEditingCell(null); 
                                    } 
                                }}
                            >
                                {headerName === 'Status' ? (
                                    <span className={`px-2.5 py-1 text-[11px] font-bold rounded-full border uppercase tracking-wider whitespace-nowrap ${getStatusBadge(cell)}`}>
                                        {cell}
                                    </span>
                                ) : DATE_COLUMNS.includes(headerName) ? (
                                    formatDate(cell)
                                ) : CANDIDATE_COLUMNS.includes(headerName) ? (
                                    <span className={canEditDashboard && (cell === 'Need To Update' || !cell) ? 'text-blue-600 hover:text-blue-800 underline decoration-blue-200 underline-offset-4 font-bold' : 'text-slate-700 font-semibold'}>
                                        {cell || 'Add Candidate'}
                                    </span>
                                ) : headerName === 'Remarks' ? (
                                    <div className="flex flex-col gap-2">
                                        <span className="font-bold text-slate-800">
                                            {cell || <span className="text-slate-400 italic font-normal">No Remark</span>}
                                        </span>
                                        {currentCustomComment && (
                                            <div className="text-[11px] bg-indigo-50/60 text-indigo-700 p-2 rounded border border-indigo-100 shadow-sm whitespace-pre-wrap leading-relaxed">
                                                <svg className="w-3.5 h-3.5 inline mr-1 -mt-0.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" /></svg>
                                                {currentCustomComment}
                                            </div>
                                        )}
                                    </div>
                                ) : headerName === 'Working By' ? (
                                    <div className="flex flex-wrap gap-1.5 max-w-full">
                                        {selectedWorkingBy.map((name, idx) => (
                                            <span key={idx} className="px-2 py-0.5 text-[11px] font-bold rounded-md bg-slate-200 text-slate-700 shadow-sm break-words leading-normal inline-block">
                                                {name}
                                            </span>
                                        ))}
                                    </div>
                                ) : (
                                    cell
                                )}
                            </div>
                        )}
                    </td>
                );
            })}
            <td className="px-4 py-4 align-top text-center border-slate-50">
                {canEditDashboard && <ActionMenu job={jobToObject(row)} onAction={(type, job) => setModalState({type, data: job})} />}
            </td>
        </tr>
    );
}, (prevProps, nextProps) => {
    const isCurrentlyEditing = nextProps.editingCell?.rowIndex === nextProps.rowIndex;
    const wasEditing = prevProps.editingCell?.rowIndex === prevProps.rowIndex;
    if (isCurrentlyEditing || wasEditing) return false; 
    if (prevProps.unsavedChanges[nextProps.postingId] !== nextProps.unsavedChanges[nextProps.postingId]) return false; 
    if (prevProps.row !== nextProps.row) return false; 
    return true; 
});

export default MemoizedTableRow;