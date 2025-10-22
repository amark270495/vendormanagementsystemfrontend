import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../api/apiService';
import Spinner from '../components/Spinner';
import { usePermissions } from '../hooks/usePermissions';
import ApprovalCommentModal from '../components/leave/ApprovalCommentModal'; // <-- Import the modal

const LeaveApprovalPage = () => {
    const { user } = useAuth();
    const { canApproveLeave } = usePermissions();

    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [statusFilter, setStatusFilter] = useState('Pending'); // Default to Pending
    const [searchTerm, setSearchTerm] = useState('');

    // State for the comment modal
    const [isCommentModalOpen, setIsCommentModalOpen] = useState(false);
    const [currentRequest, setCurrentRequest] = useState(null);
    const [currentAction, setCurrentAction] = useState(''); // 'Approved' or 'Rejected'
    const [actionLoading, setActionLoading] = useState(false); // Loading state for approve/reject actions

    const loadRequests = useCallback(async () => {
        setLoading(true);
        setError('');
        if (!canApproveLeave) {
            setLoading(false);
            setError("You do not have permission to approve leave requests.");
            return;
        }
        try {
            const params = {
                authenticatedUsername: user.userIdentifier,
                statusFilter: statusFilter === 'All' ? '' : statusFilter, // Backend expects empty string for All
            };
            const response = await apiService.getLeaveRequests(params);
            if (response.data.success) {
                setRequests(response.data.requests || []);
            } else {
                setError(response.data.message);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to fetch leave requests.');
        } finally {
            setLoading(false);
        }
    }, [user?.userIdentifier, canApproveLeave, statusFilter]);

    useEffect(() => {
        loadRequests();
    }, [loadRequests]); // Reload when loadRequests changes (due to statusFilter changing)

    const filteredRequests = useMemo(() => {
        if (!searchTerm) return requests;
        const lowerSearch = searchTerm.toLowerCase();
        return requests.filter(req =>
            req.username?.toLowerCase().includes(lowerSearch) ||
            req.leaveType?.toLowerCase().includes(lowerSearch) ||
            req.reason?.toLowerCase().includes(lowerSearch)
        );
    }, [requests, searchTerm]);

    const handleActionClick = (request, action) => {
        setCurrentRequest(request);
        setCurrentAction(action);
        setIsCommentModalOpen(true);
    };

    const handleConfirmAction = async (comments) => {
        if (!currentRequest || !currentAction) return;
        setActionLoading(true);
        setError('');
        setSuccess('');
        try {
            const payload = {
                requestId: currentRequest.id,
                requestUsername: currentRequest.username,
                action: currentAction,
                approverComments: comments,
                authenticatedUsername: user.userIdentifier
            };
            const response = await apiService.approveLeave(payload);
            if (response.data.success) {
                setSuccess(`Request ${currentAction.toLowerCase()} successfully.`);
                setIsCommentModalOpen(false);
                loadRequests(); // Refresh the list
                setTimeout(() => setSuccess(''), 3000);
            } else {
                setError(response.data.message);
            }
        } catch (err) {
            setError(err.response?.data?.message || `Failed to ${currentAction.toLowerCase()} request.`);
        } finally {
            setActionLoading(false);
        }
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'Approved': return 'bg-green-100 text-green-800';
            case 'Rejected': return 'bg-red-100 text-red-800';
            case 'Pending': return 'bg-yellow-100 text-yellow-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <>
            <div className="space-y-6">
                <h1 className="text-3xl font-bold text-gray-900">Approve Leave Requests</h1>
                <p className="mt-1 text-gray-600">Review and respond to employee leave requests.</p>

                {error && <div className="bg-red-50 border-l-4 border-red-400 text-red-700 p-4 rounded-md" role="alert"><p>{error}</p></div>}
                {success && <div className="bg-green-50 border-l-4 border-green-400 text-green-700 p-4 rounded-md" role="alert"><p>{success}</p></div>}

                {!canApproveLeave && !loading && (
                    <div className="text-center text-gray-500 p-10 bg-white rounded-xl shadow-sm border">
                        <h3 className="text-lg font-medium">Access Denied</h3>
                        <p className="text-sm">You do not have permission to approve leave requests.</p>
                    </div>
                )}

                {canApproveLeave && (
                    <div className="bg-white p-4 rounded-xl shadow-sm border flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <label htmlFor="statusFilter" className="text-sm font-medium text-gray-700">Filter by Status:</label>
                            <select
                                id="statusFilter"
                                name="statusFilter"
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="border border-gray-300 rounded-lg shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                                disabled={loading}
                            >
                                <option value="Pending">Pending</option>
                                <option value="Approved">Approved</option>
                                <option value="Rejected">Rejected</option>
                                <option value="All">All</option>
                            </select>
                        </div>
                        <input
                            type="text"
                            placeholder="Search requests..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="border border-gray-300 rounded-lg shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm w-full md:w-auto"
                            disabled={loading}
                        />
                    </div>
                )}

                {canApproveLeave && (
                    <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
                        {loading ? (
                            <div className="flex justify-center items-center h-64"><Spinner /></div>
                        ) : filteredRequests.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left text-gray-600">
                                    <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                                        <tr>
                                            <th scope="col" className="px-6 py-4">Requester</th>
                                            <th scope="col" className="px-6 py-4">Type</th>
                                            <th scope="col" className="px-6 py-4">Dates</th>
                                            <th scope="col" className="px-6 py-4">Reason</th>
                                            <th scope="col" className="px-6 py-4">Status</th>
                                            <th scope="col" className="px-6 py-4 text-center">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {filteredRequests.map((req) => (
                                            <tr key={req.id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 font-semibold text-gray-900">{req.username}</td>
                                                <td className="px-6 py-4">{req.leaveType}</td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {new Date(req.startDate).toLocaleDateString()} - {new Date(req.endDate).toLocaleDateString()}
                                                </td>
                                                <td className="px-6 py-4 max-w-xs truncate">{req.reason || '-'}</td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(req.status)}`}>
                                                        {req.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    {req.status === 'Pending' ? (
                                                        <div className="flex justify-center space-x-2">
                                                            <button
                                                                onClick={() => handleActionClick(req, 'Approved')}
                                                                className="px-3 py-1 bg-green-500 text-white rounded-md hover:bg-green-600 text-xs font-medium disabled:opacity-50"
                                                                disabled={actionLoading}
                                                            >
                                                                Approve
                                                            </button>
                                                            <button
                                                                onClick={() => handleActionClick(req, 'Rejected')}
                                                                className="px-3 py-1 bg-red-500 text-white rounded-md hover:bg-red-600 text-xs font-medium disabled:opacity-50"
                                                                disabled={actionLoading}
                                                            >
                                                                Reject
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <span className="text-xs text-gray-400">Decided</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <p className="text-sm text-gray-500 text-center p-6">No leave requests match the current filter.</p>
                        )}
                    </div>
                )}
            </div>

            {/* Render the ApprovalCommentModal */}
            <ApprovalCommentModal
                isOpen={isCommentModalOpen}
                onClose={() => setIsCommentModalOpen(false)}
                onConfirm={handleConfirmAction}
                action={currentAction}
                request={currentRequest}
                loading={actionLoading}
            />
        </>
    );
};

export default LeaveApprovalPage;