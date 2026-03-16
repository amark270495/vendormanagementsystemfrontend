import React, { memo } from 'react';
import ActionMenu from '../ActionMenu'; // The optimized ActionMenu we built earlier!

// 1️⃣ REACT.MEMO: This is the magic. It stops the row from re-rendering unless 'row', 'columns', or 'handlers' change.
const TableRow = memo(({ 
    row, 
    columns, 
    onView, 
    onEdit, 
    onDelete, 
    onAddComment,
    index
}) => {
    // We only extract the ID once per row
    const rowId = row['Posting ID'] || row.id || index;

    return (
        <tr className="hover:bg-indigo-50/30 transition-colors border-b border-slate-50 group">
            {columns.map((columnName, cellIndex) => {
                const cellValue = row[columnName];
                
                // Specific styling for status badges
                if (columnName === 'Status') {
                    return (
                        <td key={cellIndex} className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold ${
                                cellValue === 'Open' ? 'bg-emerald-100 text-emerald-800' : 
                                cellValue === 'Closed' ? 'bg-rose-100 text-rose-800' : 
                                'bg-slate-100 text-slate-800'
                            }`}>
                                {cellValue || 'Unknown'}
                            </span>
                        </td>
                    );
                }

                // Default text cell
                return (
                    <td key={cellIndex} className="px-6 py-4 whitespace-nowrap text-sm text-slate-700 truncate max-w-[200px]" title={cellValue}>
                        {cellValue || '---'}
                    </td>
                );
            })}

            {/* 2️⃣ ACTIONS COLUMN: Passing the memoized handlers */}
            <td className="px-6 py-4 whitespace-nowrap text-right sticky right-0 bg-white group-hover:bg-indigo-50/30 transition-colors shadow-[-10px_0_15px_-10px_rgba(0,0,0,0.05)]">
                <ActionMenu 
                    onView={() => onView(row)}
                    onEdit={() => onEdit(row)}
                    onDelete={() => onDelete(row)}
                    customActions={[
                        { label: 'Add Comment', onClick: () => onAddComment(row) }
                    ]}
                />
            </td>
        </tr>
    );
}, (prevProps, nextProps) => {
    // 3️⃣ CUSTOM COMPARISON (Optional but powerful): 
    // Tell React EXACTLY when to re-render. If the row data is identical, return true (do not re-render).
    return prevProps.row === nextProps.row && prevProps.columns === nextProps.columns;
});

export default TableRow;