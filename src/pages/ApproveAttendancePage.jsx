import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../api/apiService';
import Spinner from '../components/Spinner';
import { usePermissions } from '../hooks/usePermissions';
// NEW: Import the modal we will create
import AttendanceApprovalModal from '../components/admin/AttendanceApprovalModal'; // Adjust path as needed

// Helper to group requests by username
const groupRequestsByUser = (requests) => {
    // Ensure requests is an array
    if (!Array.isArray(requests)) {
        console.error("groupRequestsByUser received non-array:", requests);
        return {};
    }
    return requests.reduce((acc, req) => {
        // *** Add safety check for username ***
        const username = req?.username;
        if (!username) {
            console.warn("Skipping request with missing username:", req);
            return acc;
        }
        // *** End safety check ***
        if (!acc[username]) {
            acc[username] = [];
        }
        acc[username].push(req);
        return acc;
    }, {});
};

const ApproveAttendancePage = () => {
    const { user } = useAuth();
    const { canApproveAttendance } = usePermissions();

    // Store the raw list and the grouped list
    const [allPendingRequests, setAllPendingRequests] = useState([]);
    const [groupedRequests, setGroupedRequests] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(''); // Keep for potential success messages after modal actions
    const [searchTerm, setSearchTerm] = useState('');

    // State for the user-specific calendar modal
    const [isCalendarModalOpen, setIsCalendarModalOpen] = useState(false);
    const [selectedUsername, setSelectedUsername] = useState(null);
    // Remove states related to direct action confirmation from this page
    // const [actionLoading, setActionLoading] = useState(false); // Action loading is handled inside modal


    const loadPendingRequests = useCallback(async () => {
        if (!user?.userIdentifier || !canApproveAttendance) {
            setLoading(false);
            setError("You do not have permission to approve attendance.");
            return;
        }
        setLoading(true);
        setError(''); // Clear previous errors
        try {
            // WORKAROUND: Still fetching all for the year
            const currentYear = new Date().getFullYear().toString();
            console.log(`ApproveAttendance: Fetching all attendance for year ${currentYear} to find pending requests.`); // Log

            // *** Fetching ALL users' attendance - Requires Admin permissions on backend ***
            // *** Ensure backend getAttendance allows fetching without specific 'username' if admin ***
            const result = await apiService.getAttendance({
                 authenticatedUsername: user.userIdentifier,
                 // No specific 'username' parameter to get all (if backend supports)
                 year: currentYear
            });
            console.log("ApproveAttendance: API response:", result); // Log

            if (result.data.success && Array.isArray(result.data.attendanceRecords)) {
                 // Filter for pending status client-side
                 const pending = (result.data.attendanceRecords || []).filter(r => r.status === 'Pending');
                 console.log(`ApproveAttendance: Found ${pending.length} pending requests.`); // Log
                 setAllPendingRequests(pending); // Store the raw list
                 const grouped = groupRequestsByUser(pending); // Group them
                 console.log(`ApproveAttendance: Grouped requests:`, grouped); // Log grouped data
                 setGroupedRequests(grouped);
                 if(pending.length === 0){
                      setError("No pending attendance requests found for the current year."); // Use error state for info message
                 } else {
                     setError(''); // Clear error if requests are found
                 }
            } else {
                 setError(result.data.message || "Failed to fetch attendance data.");
                 setAllPendingRequests([]);
                 setGroupedRequests({});
            }
        } catch (err) {
             console.error("ApproveAttendance: Fetch error:", err); // Log full error
             setError(err.response?.data?.message || 'Failed to fetch pending attendance requests.');
            setAllPendingRequests([]);
            setGroupedRequests({});
        } finally {
            setLoading(false);
        }
    }, [user?.userIdentifier, canApproveAttendance]);

    useEffect(() => {
        loadPendingRequests();
    }, [loadPendingRequests]);

    // Filter the *grouped* requests based on username search
    const filteredUsernames = useMemo(() => {
        const usernames = Object.keys(groupedRequests);
        if (!searchTerm) return usernames;
        const lowerSearch = searchTerm.toLowerCase();
        // Ensure usernames are valid strings before calling toLowerCase
        return usernames.filter(username => typeof username === 'string' && username.toLowerCase().includes(lowerSearch));
    }, [groupedRequests, searchTerm]);

    // Function to open the calendar modal for a specific user
    const handleUserClick = (username) => {
         console.log("User clicked:", username); // Log username being selected
         if (username && username !== 'undefined') { // Add check for 'undefined' string
            setSelectedUsername(username);
            setIsCalendarModalOpen(true);
         } else {
             console.error("Attempted to open modal for invalid username:", username);
             setError("Cannot open details for an invalid user entry.");
         }
    };

    // Callback for the modal to signal that data needs refreshing
    const handleApprovalComplete = () => {
        setIsCalendarModalOpen(false); // Close modal
        setSelectedUsername(null);
        setSuccess('Attendance action completed successfully.'); // Show success message
        loadPendingRequests(); // Reload the list of pending requests
        setTimeout(() => setSuccess(''), 3000); // Clear message after delay
    };

    // --- Render ---

    if (loading) { // Show loader only during initial load
        return <div className="flex justify-center items-center h-64"><Spinner size="12" /></div>;
    }

    // Show access denied if permission check failed (and not loading)
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
                    <p className="mt-1 text-gray-600">Select a user to view their pending attendance requests on a calendar.</p>
                </div>

                {/* Display error/success messages */}
                {/* Show error only if modal is NOT open, to avoid duplicate messages */}
                {error && !isCalendarModalOpen && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded animate-shake">{error}</div>}
                {success && <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded animate-fadeIn">{success}</div>}

                {/* Search Bar */}
                <div className="bg-white p-4 rounded-xl shadow border border-gray-100 flex justify-end">
                    <input
                        type="text"
                        placeholder="Search by username..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full sm:w-72 px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                    />
                </div>

                {/* User List */}
                <div className="bg-white rounded-xl shadow border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        {/* Render list only if not loading */}
                        {!loading && filteredUsernames.length > 0 ? (
                             <ul className="divide-y divide-gray-200">
                                {filteredUsernames.map(username => (
                                    <li key={username}
                                        className="flex items-center justify-between py-4 px-5 hover:bg-gray-50 cursor-pointer transition-colors"
                                        onClick={() => handleUserClick(username)} // Pass username directly
                                    >
                                        <span className="font-medium text-gray-900">{username}</span>
                                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                                            {groupedRequests[username]?.length || 0} Pending
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        ) : !loading && !error ? ( // Show only if not loading and no fetch error
                             <p className="text-center text-gray-500 py-10">No users with pending attendance requests found.</p>
                        ) : null /* Don't show "No users" if there was a fetch error or still loading */
                        }
                    </div>
                </div>
            </div>

            {/* Render the Calendar Modal */}
            {/* Ensure selectedUsername is valid before rendering */}
            {selectedUsername && selectedUsername !== 'undefined' && (
                <AttendanceApprovalModal
                    isOpen={isCalendarModalOpen}
                    onClose={() => {
                        setIsCalendarModalOpen(false);
                        setSelectedUsername(null);
                        // Reload data when modal is closed, in case actions were taken
                        loadPendingRequests();
                    }}
                    selectedUsername={selectedUsername}
                    onApprovalComplete={handleApprovalComplete} // Pass callback
                />
            )}
        </>
    );
};

export default ApproveAttendancePage;