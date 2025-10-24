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
    const [currentRequest, setCurrentRequest] = useState(null); // This will hold the full request object
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
                setLeaveRequests(result.data.requests || []);
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

    // 1. When admin clicks "Approve" or "Reject" button
    const handleActionClick = (request, action) => {
        console.log("Setting currentRequest in handleActionClick:", request); // Log when setting
        setCurrentRequest(request); // 'request' is the full object { id, username, ... }
        setCurrentAction(action);
        setIsCommentModalOpen(true);
    };

    // 2. When admin confirms in the modal
    const handleConfirmAction = async (comments) => {
        setActionLoading(true);
        setError('');
        setSuccess('');

        // *** ADDED DETAILED LOGGING HERE ***
        console.log("handleConfirmAction triggered. Current State:", {
            currentRequest,
            currentAction,
            comments
        });

        const req = currentRequest; // Get the request object from state

        try {
            // *** MODIFIED CHECK WITH MORE INFO ***
            if (!req || typeof req !== 'object') {
                console.error("Critical Error: currentRequest is null or not an object.", req);
                throw new Error("Internal Error: Request data reference lost. Please try again.");
            }
            if (!req.id || !req.username) {
                 console.error("Critical Error: currentRequest is missing 'id' or 'username'.", req);
                 // Try to log what properties *are* present
                 console.log("Properties present in currentRequest:", Object.keys(req));
                throw new Error("Internal Error: Essential request data (ID or Username) is missing.");
            }
            // *** END MODIFIED CHECK ***


            const payload = {
                requestId: req.id,           // This is the RowKey
                requestUsername: req.username, // This is the PartitionKey (user who requested)
                action: currentAction,
                approverComments: comments,
                authenticatedUsername: user.userIdentifier // Add the admin's username
            };
            console.log("Sending payload to API:", payload); // Log the payload being sent

            const response = await apiService.approveLeave(payload);

            if (response.data.success) {
                setSuccess(response.data.message);
                setIsCommentModalOpen(false);
                setCurrentRequest(null); // Clear state after success
                loadRequests(); // Refresh the list
                setTimeout(() => setSuccess(''), 3000);
            } else {
                throw new Error(response.data.message);
            }
        } catch (err) {
            console.error("Failed to approve leave in handleConfirmAction:", err);
            // Error will be shown inside the modal via throw err
            setError(err.message || "An unknown error occurred during approval."); // Set error state here as well
            // *Do not clear currentRequest here on error*, allow retry if needed, or close modal handles it.
            // Rethrow the error if the modal needs to display it internally.
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
                                        <tr key={req.id} className="hover:bg-gray-50">
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
                                                        <button
                                                            onClick={() => handleActionClick(req, 'Approved')}
                                                            disabled={actionLoading} // Disable buttons during any action
                                                            className="px-3 py-1 bg-green-500 text-white text-xs font-semibold rounded-md hover:bg-green-600 transition disabled:opacity-50"
                                                        >
                                                            Approve
                                                        </button>
                                                        <button
                                                            onClick={() => handleActionClick(req, 'Rejected')}
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
                    // Don't clear currentRequest here, might be needed if modal had error
                }}
                onConfirm={handleConfirmAction} // This now receives comments
                request={currentRequest}
                action={currentAction}
                loading={actionLoading} // Pass action loading state to modal
            />
        </>
    );
};

export default LeaveApprovalPage;