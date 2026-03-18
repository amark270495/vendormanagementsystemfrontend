import React, { useState, useEffect, useRef, memo, useCallback } from 'react';
import { formatDate, getDeadlineClass } from '../../utils/helpers';
import ActionMenu from './ActionMenu';

// --- MultiSelectDropdown ---
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

        const current = Array.isArray(selectedNames) ? selectedNames : [];

        const updated = current.includes(name)
            ? current.filter(n => n !== name)
            : [...current.filter(n => n !== "Need To Update"), name];

        onChange(updated.length === 0 ? ["Need To Update"] : updated);
    };

    const displayArray = Array.isArray(selectedNames) ? selectedNames : [];

    const displayValue =
        displayArray.length > 0 && displayArray[0] !== "Need To Update"
            ? `${displayArray.length} selected`
            : "Unassigned";

    return (
        <div className="relative w-full" ref={dropdownRef}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full border rounded-md p-2 text-sm bg-white"
            >
                {displayValue}
            </button>

            {isOpen && (
                <div className="absolute z-[9999] left-0 mt-1 bg-white border rounded-md shadow-xl max-h-60 overflow-y-auto w-full">
                    <ul>
                        <li onClick={() => handleToggleSelect("Need To Update")} className="px-3 py-2 hover:bg-gray-50 cursor-pointer">
                            Unassigned
                        </li>
                        {options.map(name => (
                            <li key={name} onClick={() => handleToggleSelect(name)} className="px-3 py-2 hover:bg-gray-50 cursor-pointer">
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
const MemoizedTableRow = memo((props) => {
    const {
        row, rowIndex, postingId, displayHeader, editingCell, unsavedChanges,
        canEditDashboard, recruiters, REMARKS_OPTIONS, jobToObject,
        handleCellClick, handleCellEdit, setEditingCell, setModalState,
        getStatusBadge, CANDIDATE_COLUMNS, EDITABLE_COLUMNS, DATE_COLUMNS
    } = props;

    const rowChanges = unsavedChanges[postingId] || {};
    const job = jobToObject(row);

    const currentCustomComment =
        rowChanges['Comments'] !== undefined
            ? rowChanges['Comments']
            : job['Comments'];

    const handleActionTrigger = useCallback((type, jobData) => {
        setModalState({ type, data: jobData });
    }, [setModalState]);

    return (
        <tr className="bg-white hover:bg-indigo-50/40 transition relative z-10 hover:z-50">

            {row.map((cell, cellIndex) => {
                const headerName = displayHeader[cellIndex];

                const isEditing =
                    editingCell?.rowIndex === rowIndex &&
                    editingCell?.cellIndex === cellIndex;

                const hasUnsaved =
                    rowChanges[headerName] !== undefined ||
                    (headerName === 'Remarks' && rowChanges['Comments'] !== undefined);

                let selectedWorkingBy = [];

                if (headerName === 'Working By') {
                    const value =
                        rowChanges[headerName] !== undefined
                            ? rowChanges[headerName]
                            : cell || "Need To Update";

                    selectedWorkingBy = String(value)
                        .split(',')
                        .map(s => s.trim())
                        .filter(s => s && s !== "Need To Update");

                    if (selectedWorkingBy.length === 0) {
                        selectedWorkingBy = ["Need To Update"];
                    }
                }

                return (
                    <td
                        key={cellIndex}
                        onClick={() => !isEditing && handleCellClick(rowIndex, cellIndex)}
                        className={`px-4 py-4 border-r text-[13px] leading-relaxed align-top
                        ${hasUnsaved ? 'bg-amber-50' : ''}
                        ${headerName === 'Deadline' ? getDeadlineClass(cell) : 'text-slate-600'}
                        ${canEditDashboard && (EDITABLE_COLUMNS.includes(headerName) || CANDIDATE_COLUMNS.includes(headerName)) ? 'cursor-pointer hover:bg-indigo-50' : ''}`}
                    >
                        {/* --- WORKING BY --- */}
                        {isEditing && headerName === 'Working By' ? (
                            <MultiSelectDropdown
                                options={recruiters}
                                selectedNames={selectedWorkingBy}
                                onBlur={() => setEditingCell(null)}
                                onChange={(val) => handleCellEdit(rowIndex, cellIndex, val)}
                            />
                        ) : isEditing && headerName === 'Remarks' ? (
                            <select
                                value={rowChanges[headerName] || cell}
                                onBlur={() => setEditingCell(null)}
                                onChange={(e) => {
                                    handleCellEdit(rowIndex, cellIndex, e.target.value);
                                    setEditingCell(null);
                                }}
                                className="w-full border rounded-md p-2 text-sm"
                                autoFocus
                            >
                                <option value="">Select Remark</option>
                                {REMARKS_OPTIONS.map(opt => (
                                    <option key={opt} value={opt}>{opt}</option>
                                ))}
                            </select>
                        ) : (
                            <div
                                contentEditable={
                                    isEditing &&
                                    headerName !== 'Working By' &&
                                    headerName !== 'Remarks' &&
                                    canEditDashboard
                                }
                                suppressContentEditableWarning
                                onBlur={(e) => {
                                    if (isEditing) {
                                        handleCellEdit(rowIndex, cellIndex, e.target.innerText);
                                        setEditingCell(null);
                                    }
                                }}
                                ref={(el) => { if (isEditing && el) el.focus(); }}
                                className={isEditing ? "outline-none ring-2 ring-indigo-500 px-1" : ""}
                            >
                                {/* STATUS */}
                                {headerName === 'Status' ? (
                                    <span className={`px-2 py-1 text-xs rounded ${getStatusBadge(cell)}`}>
                                        {cell}
                                    </span>

                                /* DATE */
                                ) : DATE_COLUMNS.includes(headerName) ? (
                                    formatDate(cell)

                                /* CANDIDATES */
                                ) : CANDIDATE_COLUMNS.includes(headerName) ? (
                                    <span className={canEditDashboard ? 'text-indigo-600 underline font-bold' : ''}>
                                        {cell || 'Add Candidate'}
                                    </span>

                                /* REMARKS + COMMENT */
                                ) : headerName === 'Remarks' ? (
                                    <div className="flex flex-col gap-1">
                                        <span className="font-semibold">
                                            {cell || 'No Remark'}
                                        </span>
                                        {currentCustomComment && (
                                            <div className="text-xs bg-indigo-50 p-2 rounded">
                                                {currentCustomComment}
                                            </div>
                                        )}
                                    </div>

                                /* WORKING BY DISPLAY */
                                ) : headerName === 'Working By' ? (
                                    <div className="flex flex-wrap gap-1">
                                        {selectedWorkingBy.map((name, idx) => (
                                            <span key={idx} className="px-2 py-0.5 text-xs bg-slate-200 rounded">
                                                {name}
                                            </span>
                                        ))}
                                    </div>

                                /* DEFAULT */
                                ) : (
                                    cell
                                )}
                            </div>
                        )}
                    </td>
                );
            })}

            {/* ACTION MENU */}
            <td className="px-4 py-4 text-center relative z-[9999]">
                {canEditDashboard && (
                    <ActionMenu
                        job={job}
                        onAction={handleActionTrigger}
                    />
                )}
            </td>
        </tr>
    );

}, (prev, next) => {
    if (prev.row !== next.row) return false;
    if (prev.unsavedChanges !== next.unsavedChanges) return false;
    return true;
});

export default MemoizedTableRow;