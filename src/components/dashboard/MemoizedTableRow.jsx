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
    const displayValue =
        displayArray.length > 0 && displayArray[0] !== "Need To Update"
            ? `${displayArray.length} selected`
            : "Unassigned";

    return (
        <div className="relative w-full" ref={dropdownRef}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="block w-full border border-gray-300 rounded-md shadow-sm p-2 text-sm bg-white text-left focus:ring-2 focus:ring-indigo-500"
            >
                <span className="truncate block pr-4">{displayValue}</span>
            </button>

            {isOpen && (
                <div className="absolute z-[9999] left-0 mt-1 bg-white border border-gray-300 rounded-md shadow-xl max-h-60 overflow-y-auto min-w-full">
                    <ul>
                        <li
                            onClick={() => handleToggleSelect("Need To Update")}
                            className="flex items-center px-4 py-2 text-sm cursor-pointer hover:bg-gray-50"
                        >
                            <input
                                type="checkbox"
                                readOnly
                                checked={displayArray.includes("Need To Update")}
                                className="mr-2"
                            />
                            Unassigned
                        </li>

                        {options.map(name => (
                            <li
                                key={name}
                                onClick={() => handleToggleSelect(name)}
                                className="flex items-center px-4 py-2 text-sm cursor-pointer hover:bg-gray-50"
                            >
                                <input
                                    type="checkbox"
                                    readOnly
                                    checked={displayArray.includes(name)}
                                    className="mr-2"
                                />
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
    handleCellClick, handleCellEdit, setEditingCell, setModalState,
    getStatusBadge, CANDIDATE_COLUMNS, EDITABLE_COLUMNS, DATE_COLUMNS
}) => {

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
        // ✅ FIXED Z-INDEX LAYERING
        <tr className="bg-white hover:bg-indigo-50/40 transition relative z-10 hover:z-50 focus-within:z-50">

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
                    const workingByValue =
                        (rowChanges[headerName] !== undefined
                            ? rowChanges[headerName]
                            : cell) || "Need To Update";

                    const stringValue = Array.isArray(workingByValue)
                        ? workingByValue.join(', ')
                        : String(workingByValue);

                    selectedWorkingBy = stringValue
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
                        onClick={() => {
                            if (!isEditing) handleCellClick(rowIndex, cellIndex);
                        }}
                        className={`px-4 py-4 border-r text-[13px] leading-relaxed align-top
                        ${hasUnsaved ? 'bg-amber-50' : ''}
                        ${headerName === 'Deadline' ? getDeadlineClass(cell) : 'text-slate-600'}
                        ${canEditDashboard && (EDITABLE_COLUMNS.includes(headerName) || CANDIDATE_COLUMNS.includes(headerName)) ? 'cursor-pointer hover:bg-indigo-50/50' : ''}`}
                    >
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
                            <div>
                                {headerName === 'Status' ? (
                                    <span className={`px-2 py-1 text-xs rounded ${getStatusBadge(cell)}`}>
                                        {cell}
                                    </span>
                                ) : DATE_COLUMNS.includes(headerName) ? (
                                    formatDate(cell)
                                ) : (
                                    cell
                                )}
                            </div>
                        )}
                    </td>
                );
            })}

            {/* ✅ FIXED ACTION COLUMN */}
            <td className="px-4 py-4 text-center relative z-[999]">
                {canEditDashboard && (
                    <div className="relative z-[9999]">
                        <ActionMenu
                            job={job}
                            onAction={handleActionTrigger}
                        />
                    </div>
                )}
            </td>
        </tr>
    );
}, (prevProps, nextProps) => {
    if (prevProps.row !== nextProps.row) return false;
    if (prevProps.unsavedChanges !== nextProps.unsavedChanges) return false;
    return true;
});

export default MemoizedTableRow;