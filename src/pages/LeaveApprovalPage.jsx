import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../api/apiService';
import Spinner from '../components/Spinner';
import { usePermissions } from '../hooks/usePermissions';
import ApprovalCommentModal from '../components/leave/ApprovalCommentModal'; // Ensure this path is correct

const LeaveApprovalPage = () => {
    const { user } = useAuth();
    const { canApproveLeave } = usePermissions();

    const [leaveRequests, setLeaveRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const [statusFilter, setStatusFilter] = useState('Pending'); // Default to Pending
    const [searchTerm, setSearchTerm] = useState('');

    // State for the modal
    const [isCommentModalOpen, setIsCommentModalOpen] = useState(false);
    // *** MODIFIED: Store only needed identifiers and the original object for display ***
    const [currentRequestData, setCurrentRequestData] = useState({ id: null, username: null, displayData: null });
    const [currentAction, setCurrentAction] = useState(null); // 'Approved' or 'Rejected'
    const [actionLoading, setActionLoading] = useState(false);

    const loadRequests = useCallback(async () => {
        if (!user?.userIdentifier || !canApproveLeave) {
            setLoading(false);
            setError("You do not have permission to approve leave requests.");
            return;
        }
        setLoading(true);
        setError('');
        try {
            const result = await apiService.getLeaveRequests({
                authenticatedUsername: user.userIdentifier,
                statusFilter: statusFilter
            });
            if (result.data.success) {
                // Ensure the 'id' property exists from the start
                const requestsWithId = (result.data.requests || []).map(req => ({
                    ...req,
                    id: req.id // Make sure 'id' is present, API should provide it via RowKey mapping
                }));
                setLeaveRequests(requestsWithId);
            } else {
                setError(result.data.message);
                setLeaveRequests([]);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to fetch leave requests.');
            setLeaveRequests([]);
        } finally {
            setLoading(false);
        }
    }, [user?.userIdentifier, canApproveLeave, statusFilter]);

    useEffect(() => {
        loadRequests();
    }, [loadRequests]); // Reloads when statusFilter changes

    // Filter based on search term (client-side)
    const filteredRequests = useMemo(() => {
        if (!searchTerm) return leaveRequests;
        const lowerSearch = searchTerm.toLowerCase();
        return leaveRequests.filter(req =>
            req.username.toLowerCase().includes(lowerSearch) ||
            req.leaveType.toLowerCase().includes(lowerSearch) ||
            (req.reason && req.reason.toLowerCase().includes(lowerSearch)) // Added null check for reason
        );
    }, [leaveRequests, searchTerm]);

    // --- Action Handlers ---

    // *** MODIFIED: Accept id and username directly ***
    const handleActionClick = (requestId, requestUsername, action, fullRequestData) => {
        console.log("Setting currentRequestData in handleActionClick:", { id: requestId, username: requestUsername, action, displayData: fullRequestData });
        // Store individual pieces needed for API and the full object for modal display
        setCurrentRequestData({ id: requestId, username: requestUsername, displayData: fullRequestData });
        setCurrentAction(action);
        setIsCommentModalOpen(true);
    };

    // *** MODIFIED: Use directly stored id and username ***
    const handleConfirmAction = async (comments) => {
        setActionLoading(true);
        setError('');
        setSuccess('');

        // Get ID and Username directly from the stored state
        const reqId = currentRequestData?.id;
        const reqUsername = currentRequestData?.username;

        console.log("handleConfirmAction triggered. Stored State:", { reqId, reqUsername, currentAction, comments });

        try {
            if (!reqId || !reqUsername) {
                console.error("Critical Error: Stored request ID or Username is missing.", { reqId, reqUsername });
                throw new Error("Internal Error: Essential request data (ID or Username) reference lost. Please try reopening the request.");
            }

            const payload = {
                requestId: reqId,
                requestUsername: reqUsername,
                action: currentAction,
                approverComments: comments,
                authenticatedUsername: user.userIdentifier
            };
            console.log("Sending payload to API:", payload);

            const response = await apiService.approveLeave(payload);

            if (response.data.success) {
                setSuccess(response.data.message);
                setIsCommentModalOpen(false);
                setCurrentRequestData({ id: null, username: null, displayData: null }); // Clear state after success
                loadRequests(); // Refresh the list
                setTimeout(() => setSuccess(''), 3000);
            } else {
                throw new Error(response.data.message);
            }
        } catch (err) {
            console.error("Failed to approve leave in handleConfirmAction:", err);
            setError(err.message || "An unknown error occurred during approval.");
            // Rethrow the error so the modal can potentially display it or handle retries
            throw err;
        } finally {
            setActionLoading(false);
        }
    };

    // Helper to format dates
    const formatDate = (dateString) => {
         if (!dateString) return 'N/A';
        // Use UTC date parts to avoid timezone issues when displaying
        const date = new Date(dateString + 'T00:00:00Z');
        if (isNaN(date.getTime())) return 'Invalid Date';
        return date.toLocaleDateString('en-US', {
            timeZone: 'UTC',
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    // --- Render ---

    if (loading && !actionLoading) { // Don't show main loader during modal action
        return <div className="flex justify-center items-center h-64"><Spinner size="12" /></div>;
    }

    // Show access denied only if loading is finished and permission is false
    if (!loading && !canApproveLeave) {
        return (
            <div className="text-center text-gray-500 p-10 bg-white rounded-xl shadow-sm border">
                <h3 className="text-lg font-medium">Access Denied</h3>
                <p className="mt-1 text-sm text-gray-500">You do not have the necessary permissions to approve leave requests.</p>
            </div>
        );
    }


    return (
        <>
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Approve Leave Requests</h1>
                    <p className="mt-1 text-gray-600">Review and respond to employee leave requests.</p>
                </div>

                {/* Display general errors here, modal errors are handled inside the modal */}
                {error && !isCommentModalOpen && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded animate-shake">{error}</div>}
                {success && <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded animate-fadeIn">{success}</div>}

                {/* Filter and Search Bar */}
                <div className="bg-white p-4 rounded-xl shadow border border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div className="flex items-center space-x-2">
                        <label htmlFor="statusFilter" className="text-sm font-medium text-gray-700">Filter by Status:</label>
                        <select
                            id="statusFilter"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="border border-gray-300 rounded-lg shadow-sm p-2 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                        >
                            <option value="Pending">Pending</option>
                            <option value="Approved">Approved</option>
                            <option value="Rejected">Rejected</option>
                            <option value="All">All</option>
                        </select>
                    </div>
                    <input
                        type="text"
                        placeholder="Search by name, leave type, reason..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full sm:w-72 px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                    />
                </div>

                {/* Requests List */}
                <div className="bg-white rounded-xl shadow border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        {filteredRequests.length > 0 ? (
                            <table className="w-full text-sm text-left text-gray-600">
                                <thead className="text-xs text-gray-700 uppercase bg-gray-100">
                                    <tr>
                                        <th scope="col" className="px-5 py-3">Employee</th>
                                        <th scope="col" className="px-5 py-3">Leave Type</th>
                                        <th scope="col" className="px-5 py-3">Dates</th>
                                        <th scope="col" className="px-5 py-3">Reason</th>
                                        <th scope="col" className="px-5 py-3">Status</th>
                                        <th scope="col" className="px-5 py-3 text-center">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {filteredRequests.map(req => (
                                        <tr key={req.id} className="hover:bg-gray-50"> {/* Use req.id which should be RowKey */}
                                            <td className="px-5 py-4 font-medium text-gray-900">
                                                {req.username}
                                                <p className="text-xs text-gray-500 font-normal">Req. {formatDate(req.requestDate)}</p>
                                            </td>
                                            <td className="px-5 py-4">{req.leaveType}</td>
                                            <td className="px-5 py-4">{formatDate(req.startDate)} - {formatDate(req.endDate)}</td>
                                            <td className="px-5 py-4 max-w-xs truncate" title={req.reason}>{req.reason}</td>
                                            <td className="px-5 py-4">
                                                <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                                                    req.status === 'Approved' ? 'bg-green-100 text-green-700' :
                                                    req.status === 'Rejected' ? 'bg-red-100 text-red-700' :
                                                    'bg-yellow-100 text-yellow-700'
                                                }`}>
                                                    {req.status}
                                                </span>
                                                 {req.approvedBy && (
                                                     <p className="text-[10px] text-gray-400 mt-1">by {req.approvedBy}</p>
                                                 )}
                                            </td>
                                            <td className="px-5 py-4 text-center">
                                                {req.status === 'Pending' ? (
                                                    <div className="flex justify-center space-x-2">
                                                        {/* *** MODIFIED: Pass id and username directly *** */}
                                                        <button
                                                            onClick={() => handleActionClick(req.id, req.username, 'Approved', req)}
                                                            disabled={actionLoading} // Disable buttons during any action
                                                            className="px-3 py-1 bg-green-500 text-white text-xs font-semibold rounded-md hover:bg-green-600 transition disabled:opacity-50"
                                                        >
                                                            Approve
                                                        </button>
                                                        <button
                                                            onClick={() => handleActionClick(req.id, req.username, 'Rejected', req)}
                                                            disabled={actionLoading} // Disable buttons during any action
                                                            className="px-3 py-1 bg-red-500 text-white text-xs font-semibold rounded-md hover:bg-red-600 transition disabled:opacity-50"
                                                        >
                                                            Reject
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <p className="text-xs text-gray-500 italic">
                                                        {req.status}
                                                        {req.decisionDate ? ` on ${formatDate(req.decisionDate)}` : ''}
                                                    </p>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <p className="text-center text-gray-500 py-10">
                                No leave requests match the current filter.
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* Modal for adding comments */}
            <ApprovalCommentModal
                isOpen={isCommentModalOpen}
                onClose={() => {
                    setIsCommentModalOpen(false);
                    // Clear state when modal closes
                    setCurrentRequestData({ id: null, username: null, displayData: null });
                }}
                onConfirm={handleConfirmAction} // This now receives comments
                // Pass the display data part to the modal for rendering info
                request={currentRequestData?.displayData}
                action={currentAction}
                loading={actionLoading} // Pass action loading state to modal
            />
        </>
    );
};

export default LeaveApprovalPage;