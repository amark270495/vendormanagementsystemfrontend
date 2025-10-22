import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { usePermissions } from '../hooks/usePermissions';
import { apiService } from '../api/apiService';
import Spinner from '../components/Spinner';
import EditPermissionsModal from '../components/admin/EditPermissionsModal'; // Import the modal

const PermissionsPage = () => {
    const { user, updatePermissions: updateAuthContextPermissions } = useAuth();
    const { canEditUsers } = usePermissions(); // Permission to access this page

    const [usersWithPermissions, setUsersWithPermissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    // State for the modal
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);

    // --- Define permission keys - Make sure this is comprehensive ---
    const permissionKeys = [
        { key: 'canViewDashboards', name: 'View Dashboards' },
        { key: 'canAddPosting', name: 'Add/Edit Jobs' },
        { key: 'canViewReports', name: 'View Reports' },
        { key: 'canEmailReports', name: 'Email Reports' },
        { key: 'canViewCandidates', name: 'View Candidates' },
        { key: 'canEditDashboard', name: 'Edit Dashboard Cells' },
        { key: 'canMessage', name: 'Send Messages' },
        { key: 'canManageTimesheets', name: 'Manage Timesheets (Full)' },
        { key: 'canRequestTimesheetApproval', name: 'Request Timesheet Approval' },
        { key: 'canManageMSAWO', name: 'Manage MSA/WO' },
        { key: 'canManageOfferLetters', name: 'Manage Offer Letters' },
        { key: 'canManageHolidays', name: 'Manage Holidays' },
        { key: 'canApproveLeave', name: 'Approve Leave' },
        { key: 'canManageLeaveConfig', name: 'Manage Leave Config' },
        { key: 'canRequestLeave', name: 'Request Leave'}, // Added from tableUtils
        { key: 'canSendMonthlyReport', name: 'Send Monthly Report'}, // Added from tableUtils
        { key: 'canEditUsers', name: 'Edit Users & Permissions' },
    ];
    // --- End permission keys ---

    const fetchUserPermissions = useCallback(async () => {
        if (!user?.userIdentifier || !canEditUsers) {
             setLoading(false); // Stop loading if no permission
             setError("You do not have permission to view or edit user permissions.");
            return;
        }
        setLoading(true);
        setError('');
        try {
            const response = await apiService.getUserPermissionsList(user.userIdentifier);
            if (response.data.success) {
                 const usersData = response.data.users.map(u => ({
                    ...u,
                    permissions: u.permissions || {} // Ensure permissions object exists
                }));
                setUsersWithPermissions(usersData);
            } else {
                setError(response.data.message);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to fetch user permissions.');
        } finally {
            setLoading(false);
        }
    }, [user?.userIdentifier, canEditUsers]);

    useEffect(() => {
        fetchUserPermissions();
    }, [fetchUserPermissions]);

    const handleOpenModal = (userToEdit) => {
        if (!canEditUsers) return; // Add check here too for safety
        setSelectedUser(userToEdit);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedUser(null);
    };

    const handleSavePermissions = async (usernameToSave, updatedPermissions) => {
        // This function is now passed to the modal as the onSave prop.
        // It will be called *by the modal* when its internal save button is clicked.
        setError('');
        setSuccessMessage('');
        try {
            const response = await apiService.updateUserPermissions(usernameToSave, updatedPermissions, user.userIdentifier);

            if (response.data.success) {
                setSuccessMessage(`Permissions for ${selectedUser?.displayName || usernameToSave} saved successfully!`);
                // If the current user's permissions were updated, update the auth context
                if (usernameToSave === user.userIdentifier) {
                    updateAuthContextPermissions(updatedPermissions);
                }
                // Refresh the main list data after saving
                fetchUserPermissions();
                setTimeout(() => setSuccessMessage(''), 3000);
                 // The modal will close itself on successful save via its `onSave` prop.
                 // handleCloseModal(); // Let the modal handle closing on success
            } else {
                 // Throw error to be caught by the modal's save handler
                throw new Error(response.data.message || "Failed to save permissions.");
            }
        } catch (err) {
             console.error("Error saving permissions:", err);
             // Re-throw the error so the modal can display it
            throw err;
        }
        // Loading state is handled within the modal now
    };

    // Filter users based on search term
    const filteredUsers = usersWithPermissions.filter(u =>
        (u.displayName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (u.username?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    );

    // Render logic
    if (!canEditUsers && !loading) {
        return (
            <div className="text-center text-gray-500 p-10 bg-white rounded-xl shadow-sm border">
                <h3 className="text-lg font-medium">Access Denied</h3>
                <p className="mt-1 text-sm text-gray-500">You do not have the necessary permissions to manage user permissions.</p>
            </div>
        );
    }

    return (
        <>
            <div className="bg-white p-6 rounded-xl shadow-sm border">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-5 gap-4">
                    <div>
                        <h2 className="text-xl font-bold text-gray-800">User Permissions</h2>
                        <p className="text-sm text-gray-500">Manage granular access controls for each user.</p>
                    </div>
                    <input
                        type="text"
                        placeholder="Search users by name or email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full sm:w-64 px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                        disabled={loading} // Disable search while loading
                    />
                </div>

                {successMessage && (
                    <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4 animate-fadeIn" role="alert">
                        {successMessage}
                    </div>
                )}
                 {/* Display general page error if any */}
                {error && !isModalOpen && ( // Only show page error if modal isn't showing its own
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 animate-shake" role="alert">
                        {error}
                    </div>
                )}

                {loading && <div className="flex justify-center items-center h-64"><Spinner size="10"/></div>}

                {!loading && !error && (
                    <div className="overflow-x-auto">
                        {filteredUsers.length > 0 ? (
                            <ul className="divide-y divide-gray-200">
                                {filteredUsers.map(u => (
                                    <li key={u.username} className="flex flex-col sm:flex-row items-start sm:items-center justify-between py-4 px-2 hover:bg-gray-50 transition-colors duration-150 gap-3 sm:gap-0">
                                        {/* User Info */}
                                        <div className="flex items-center space-x-3 min-w-0 flex-1">
                                             <span className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center font-bold text-indigo-700 text-lg flex-shrink-0">
                                                {u.displayName?.charAt(0).toUpperCase() || '?'}
                                            </span>
                                            <div className="min-w-0">
                                                <p className="text-sm font-semibold text-gray-900 truncate">{u.displayName}</p>
                                                <p className="text-xs text-gray-500 truncate">{u.username}</p>
                                                <p className="text-xs text-gray-500 truncate">{u.backendOfficeRole}</p>
                                            </div>
                                        </div>
                                        {/* Edit Button */}
                                        <button
                                            onClick={() => handleOpenModal(u)}
                                            className="ml-auto sm:ml-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-xs font-semibold transition-colors shadow-sm flex-shrink-0"
                                            aria-label={`Edit permissions for ${u.displayName}`}
                                        >
                                            Edit Permissions
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <div className="text-center text-gray-500 py-10">
                                <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm6-11a3 3 0 100-6 3 3 0 000 6zm-3 11a6 6 0 01-10.84-3.21A3.988 3.988 0 0112 18a3.988 3.988 0 014.16-2.21A6.002 6.002 0 0118 21z" /></svg>
                                <h3 className="mt-2 text-sm font-medium text-gray-900">No Users Found</h3>
                                <p className="mt-1 text-sm text-gray-500">No users match your search criteria, or no users exist yet.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Render the Modal (controlled by isModalOpen and selectedUser) */}
            <EditPermissionsModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                userToEdit={selectedUser}
                onSave={handleSavePermissions} // Pass the save handler
                permissionKeys={permissionKeys} // Pass the definition of keys
                currentUsername={user?.userIdentifier} // Pass current user's name for self-lock check
            />
        </>
    );
};

export default PermissionsPage;