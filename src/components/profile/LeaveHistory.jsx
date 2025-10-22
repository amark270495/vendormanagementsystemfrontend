import React from 'react';

const LeaveHistory = ({ leaveHistory }) => {

    const getStatusBadgeClass = (status) => {
        switch (status) {
            case 'Approved': return 'bg-green-100 text-green-700';
            case 'Rejected': return 'bg-red-100 text-red-700';
            case 'Pending': return 'bg-yellow-100 text-yellow-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        try {
            return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        } catch (e) {
            return dateString; // Fallback if date is invalid
        }
    };

    return (
        <div className="bg-white p-4 rounded-lg border shadow-sm">
            <h3 className="font-semibold text-lg text-gray-800 mb-3 border-b pb-2">Leave History</h3>
            {leaveHistory && leaveHistory.length > 0 ? (
                <ul className="space-y-3 max-h-60 overflow-y-auto pr-2"> {/* Increased max height */}
                    {leaveHistory.map(req => (
                        <li key={req.requestId} className="text-sm p-3 bg-slate-50 rounded-md border border-slate-200 shadow-xs">
                            <div className="flex justify-between items-start mb-1">
                                <span className="font-medium text-slate-700">{req.leaveType}</span>
                                <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${getStatusBadgeClass(req.status)}`}>
                                    {req.status}
                                </span>
                            </div>
                            <p className="text-xs text-slate-500 mb-2">
                                {formatDate(req.startDate)} - {formatDate(req.endDate)}
                            </p>
                            <p className="text-xs text-slate-600 bg-slate-100 p-1.5 rounded border border-slate-200">
                                <span className="font-medium">Reason:</span> {req.reason || 'No reason provided'}
                            </p>
                             {req.approverComments && (
                                <p className="mt-1 text-xs text-slate-600 bg-blue-50 p-1.5 rounded border border-blue-200">
                                    <span className="font-medium">Approver Note:</span> {req.approverComments}
                                </p>
                             )}
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="text-sm text-gray-500 text-center py-4">No leave requests found.</p>
            )}
        </div>
    );
};

export default LeaveHistory;