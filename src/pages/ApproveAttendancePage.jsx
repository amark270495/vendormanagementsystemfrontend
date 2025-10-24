import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../api/apiService';
import Spinner from '../components/Spinner';
import { usePermissions } from '../hooks/usePermissions';
// Re-use modal for comments if needed, or create a simpler one
import ApprovalCommentModal from '../components/leave/ApprovalCommentModal'; // Placeholder, might need adjustments

// Helper to format dates
const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
        // Use UTC date parts to avoid timezone shifts during display
        const date = new Date(dateString + 'T00:00:00Z');
        return date.toLocaleDateString('en-US', {
            timeZone: 'UTC',
            month: 'short', day: 'numeric', year: 'numeric'
        });
    } catch (e) {
        return dateString;
    }
};

const ApproveAttendancePage = () => {
    const { user } = useAuth();
    const { canApproveAttendance } = usePermissions();

    const [pendingRequests, setPendingRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    // State for the action modal (simplified without comments for now)
    const [isActionModalOpen, setIsActionModalOpen] = useState(false);
    const [currentRequest, setCurrentRequest] = useState(null);
    const [currentAction, setCurrentAction] = useState(null); // 'Approved' or 'Rejected'
    const [actionLoading, setActionLoading] = useState(false);

    const loadPendingRequests = useCallback(async () => {
        if (!user?.userIdentifier || !canApproveAttendance) {
            setLoading(false);
            setError("You do not have permission to approve attendance.");
            return;
        }
        setLoading(true);
        setError('');
        try {
            // *** WORKAROUND: Fetch all attendance for the current year and filter client-side ***
            // Ideally, the backend should have an endpoint specifically for pending requests.
            const currentYear = new Date().getFullYear().toString();
            console.log(`ApproveAttendance: Fetching all attendance for year ${currentYear} to find pending requests.`); // Log

            const result = await apiService.getAttendance({
                 authenticatedUsername: user.userIdentifier,
                 // No specific username to get all (assuming backend supports this IF admin)
                 // Provide the year to satisfy backend validation
                 year: currentYear
            });
            console.log("ApproveAttendance: API response:", result); // Log

            if (result.data.success && Array.isArray(result.data.attendanceRecords)) {
                 // Filter for pending status client-side
                 const pending = (result.data.attendanceRecords || []).filter(r => r.status === 'Pending');
                 console.log(`ApproveAttendance: Found ${pending.length} pending requests.`); // Log
                 setPendingRequests(pending);
                 if(pending.length === 0){
                     // Optionally set a message if no pending requests found after fetch
                     // setError("No pending attendance requests found for the current year.");
                 }
            } else {
                 setError(result.data.message || "Failed to fetch attendance data.");
                 setPendingRequests([]);
            }
        } catch (err) {
             console.error("ApproveAttendance: Fetch error:", err); // Log full error
            // Check if the error is specifically the 400 validation error
            if (err.response?.status === 400 && err.response?.data?.message?.includes('provide a date range')) {
                 setError("Backend error: The getAttendance API requires a date filter. Please update the backend or contact support.");
            } else {
                 setError(err.response?.data?.message || 'Failed to fetch pending attendance requests.');
            }
            setPendingRequests([]);
        } finally {
            setLoading(false);
        }
    }, [user?.userIdentifier, canApproveAttendance]);

    useEffect(() => {
        loadPendingRequests();
    }, [loadPendingRequests]);

    const filteredRequests = useMemo(() => {
        if (!searchTerm) return pendingRequests;
        const lowerSearch = searchTerm.toLowerCase();
        // Ensure properties exist before calling toLowerCase
        return pendingRequests.filter(req =>
            (req.username?.toLowerCase() || '').includes(lowerSearch) ||
            (req.date && req.date.includes(lowerSearch)) || // Date is already string
            (req.requestedStatus?.toLowerCase() || '').includes(lowerSearch)
        );
    }, [pendingRequests, searchTerm]);

    const handleActionClick = (request, action) => {
        setCurrentRequest(request);
        setCurrentAction(action);
        // Using a simple confirm for now
        if (window.confirm(`Are you sure you want to ${action} the request for ${request.username} on ${formatDate(request.date)}?`)) {
            handleConfirmAction(''); // Pass empty comments for now
        }
        // setIsActionModalOpen(true); // Uncomment to use modal
    };

    const handleConfirmAction = async (comments) => {
        setActionLoading(true);
        setError('');
        setSuccess('');
        const req = currentRequest;

        try {
            // Ensure necessary fields are present
            if (!req || !req.date || !req.username) {
                console.error("Confirm Action Error: Missing request data", req);
                throw new Error("Internal Error: Request data is missing.");
            }

            const payload = {
                targetUsername: req.username,
                attendanceDate: req.date,
                action: currentAction,
                approverComments: comments,
                authenticatedUsername: user.userIdentifier
            };

             console.log("Calling approveAttendance with payload:", payload); // Log payload
            const response = await apiService.approveAttendance(payload); // Ensure this exists in apiService
             console.log("approveAttendance response:", response); // Log response

            if (response.data.success) {
                setSuccess(response.data.message);
                // setIsActionModalOpen(false); // If using modal
                setCurrentRequest(null);
                loadPendingRequests(); // Refresh list
                setTimeout(() => setSuccess(''), 3000);
            } else {
                throw new Error(response.data.message);
            }
        } catch (err) {
             console.error("Confirm Action Error:", err); // Log full error
            setError(err.message || "An unknown error occurred while processing the request.");
            // If using modal, might want to re-throw: throw err;
        } finally {
            setActionLoading(false);
            // setIsActionModalOpen(false); // Ensure modal closes even on error
            setCurrentRequest(null); // Clear request even on error for simple confirm
        }
    };

    // --- Render ---

    if (loading && !actionLoading) {
        return <div className="flex justify-center items-center h-64"><Spinner size="12" /></div>;
    }

    if (!loading && !canApproveAttendance) {
        return (
            <div className="text-center text-gray-500 p-10 bg-white rounded-xl shadow-sm border">
                <h3 className="text-lg font-medium">Access Denied</h3>
                <p className="mt-1 text-sm text-gray-500">You do not have permission.</p>
            </div>
        );
    }

    return (
        <>
            <div className="space-y-6">
                 <div>
                    <h1 className="text-3xl font-bold text-gray-900">Approve Attendance</h1>
                    <p className="mt-1 text-gray-600">Review and action pending attendance requests.</p>
                </div>

                {/* Display error/success messages */}
                {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded animate-shake">{error}</div>}
                {success && <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded animate-fadeIn">{success}</div>}

                {/* Search Bar */}
                <div className="bg-white p-4 rounded-xl shadow border border-gray-100 flex justify-end">
                    <input
                        type="text"
                        placeholder="Search by name, date, status..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full sm:w-72 px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                    />
                </div>

                {/* Requests List */}
                <div className="bg-white rounded-xl shadow border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        {/* Show table only if not loading and no critical error preventing load */}
                        {!loading && filteredRequests.length > 0 ? (
                             <table className="w-full text-sm text-left text-gray-600">
                                <thead className="text-xs text-gray-700 uppercase bg-gray-100">
                                    <tr>
                                        <th scope="col" className="px-5 py-3">Employee</th>
                                        <th scope="col" className="px-5 py-3">Date</th>
                                        <th scope="col" className="px-5 py-3">Requested Status</th>
                                        <th scope="col" className="px-5 py-3">Marked On</th>
                                        <th scope="col" className="px-5 py-3 text-center">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {filteredRequests.map(req => (
                                        // Use a more unique key if possible, combining username and date
                                        <tr key={`${req.username}-${req.date}`} className="hover:bg-gray-50">
                                            <td className="px-5 py-4 font-medium text-gray-900">{req.username}</td>
                                            <td className="px-5 py-4">{formatDate(req.date)}</td>
                                            <td className="px-5 py-4">
                                                 <span className={`font-semibold ${req.requestedStatus === 'Present' ? 'text-green-600' : 'text-red-600'}`}>
                                                     {req.requestedStatus || 'N/A'}
                                                 </span>
                                            </td>
                                            <td className="px-5 py-4 text-xs text-gray-500">{formatDate(req.markedOn)}</td>
                                            <td className="px-5 py-4 text-center">
                                                <div className="flex justify-center space-x-2">
                                                    <button
                                                        onClick={() => handleActionClick(req, 'Approved')}
                                                        disabled={actionLoading}
                                                        className="px-3 py-1 bg-green-500 text-white text-xs font-semibold rounded-md hover:bg-green-600 transition disabled:opacity-50"
                                                    >
                                                        Approve
                                                    </button>
                                                    <button
                                                        onClick={() => handleActionClick(req, 'Rejected')}
                                                        disabled={actionLoading}
                                                        className="px-3 py-1 bg-red-500 text-white text-xs font-semibold rounded-md hover:bg-red-600 transition disabled:opacity-50"
                                                    >
                                                        Reject
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : !loading && !error ? ( // Show only if not loading and no error occurred during fetch
                             <p className="text-center text-gray-500 py-10">No pending attendance requests found.</p>
                        ) : null /* Don't show "No pending" if there was an error or still loading */
                        }
                    </div>
                </div>
            </div>

            {/* Re-use or adapt ApprovalCommentModal if comments are needed */}
            {/* <ApprovalCommentModal
                isOpen={isActionModalOpen}
                onClose={() => setIsActionModalOpen(false)}
                onConfirm={handleConfirmAction}
                request={currentRequest} // Adjust props as needed
                action={currentAction}
                loading={actionLoading}
            /> */}
        </>
    );
};

export default ApproveAttendancePage;