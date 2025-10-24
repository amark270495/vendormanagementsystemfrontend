import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { usePermissions } from '../hooks/usePermissions'; // Import usePermissions
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

    // --- Define permission keys - Ensure this list is complete and matches backend ---
    // *** MODIFIED: Added canApproveAttendance and canSendMonthlyReport ***
    const permissionKeys = [
        { key: 'canViewDashboards', name: 'View Dashboards', description: 'Access dashboard pages.' },
        { key: 'canAddPosting', name: 'Add/Edit Jobs', description: 'Submit new job postings via the form.' },
        { key: 'canEditDashboard', name: 'Edit Dashboard Cells', description: 'Directly edit cells like Remarks, Working By.' },
        { key: 'canViewReports', name: 'View Reports', description: 'Access the main Reports page.' },
        { key: 'canEmailReports', name: 'Email Reports', description: 'Send aggregated job reports via email.' },
        { key: 'canViewCandidates', name: 'View Candidates', description: 'Access the Candidate Details page.' },
        { key: 'canMessage', name: 'Send Messages', description: 'Use the internal messaging system.' },
        { key: 'canManageTimesheets', name: 'Manage Timesheets (Full)', description: 'Create companies/employees, log/edit/delete hours.' },
        { key: 'canRequestTimesheetApproval', name: 'Request Timesheet Approval', description: 'Send approval request emails.' },
        { key: 'canManageMSAWO', name: 'Manage MSA/WO', description: 'Create, manage, and view MSA/WO documents.' },
        { key: 'canManageOfferLetters', name: 'Manage Offer Letters', description: 'Create, manage, and view Offer Letters.' },
        { key: 'canManageHolidays', name: 'Manage Holidays', description: 'Add or remove company holidays (Admin Console).' },
        { key: 'canApproveLeave', name: 'Approve Leave', description: 'Approve or reject leave requests (Admin Console).' },
        { key: 'canManageLeaveConfig', name: 'Manage Leave Config', description: 'Set leave quotas for users (Admin Console).' },
        { key: 'canRequestLeave', name: 'Request Leave', description: 'Submit leave requests via My Profile.'},
        { key: 'canSendMonthlyReport', name: 'Send Monthly Report', description: 'Send monthly attendance reports to all users (Admin Console).'}, // Added
        { key: 'canApproveAttendance', name: 'Approve Attendance', description: 'Approve or reject attendance marking requests (Admin Console).' }, // Added
        { key: 'canEditUsers', name: 'Edit Users & Permissions', description: 'Add/edit/delete users and manage all permissions (Admin Console).' },
    ];
    // --- End permission keys ---

    const fetchUserPermissions = useCallback(async () => {
        if (!user?.userIdentifier || !canEditUsers) {
             setLoading(false);
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
                    // Ensure permissions object exists, merge with defaults from permissionKeys
                    permissions: permissionKeys.reduce((acc, pKey) => {
                        acc[pKey.key] = u.permissions ? (u.permissions[pKey.key] === true) : false;
                        return acc;
                    }, {})
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
    }, [user?.userIdentifier, canEditUsers, permissionKeys]); // Added permissionKeys dependency

    useEffect(() => {
        fetchUserPermissions();
    }, [fetchUserPermissions]);

    const handleOpenModal = (userToEdit) => {
        if (!canEditUsers) return;
        setSelectedUser(userToEdit);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedUser(null);
    };

    const handleSavePermissions = async (usernameToSave, updatedPermissions) => {
        setError('');
        setSuccessMessage('');
        try {
            // Ensure all permission keys are present in the payload sent to the backend
            const fullPermissionsPayload = permissionKeys.reduce((acc, pKey) => {
                acc[pKey.key] = updatedPermissions[pKey.key] === true; // Ensure boolean
                return acc;
            }, {});

            const response = await apiService.updateUserPermissions(usernameToSave, fullPermissionsPayload, user.userIdentifier);

            if (response.data.success) {
                setSuccessMessage(`Permissions for ${selectedUser?.displayName || usernameToSave} saved successfully!`);
                // If editing self, update context
                if (usernameToSave === user.userIdentifier) {
                    updateAuthContextPermissions(fullPermissionsPayload);
                }
                fetchUserPermissions(); // Refresh list data
                setTimeout(() => setSuccessMessage(''), 3000);
            } else {
                throw new Error(response.data.message || "Failed to save permissions.");
            }
        } catch (err) {
             console.error("Error saving permissions:", err);
            // Re-throw the error so the modal can display it
            throw err;
        }
    };

    const filteredUsers = usersWithPermissions.filter(u =>
        (u.displayName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (u.username?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    );

    // Render access denied only if loading is finished and permission is false
    if (!loading && !canEditUsers) {
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
                        disabled={loading}
                    />
                </div>

                {successMessage && (
                    <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4 animate-fadeIn" role="alert">
                        {successMessage}
                    </div>
                )}
                 {error && !isModalOpen && ( // Don't show page error if modal is open (modal shows its own)
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
                                <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                                <h3 className="mt-2 text-sm font-medium text-gray-900">No Users Found</h3>
                                <p className="mt-1 text-sm text-gray-500">No users match your search criteria, or no users exist yet.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Render the Modal */}
            <EditPermissionsModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                userToEdit={selectedUser}
                onSave={handleSavePermissions}
                permissionKeys={permissionKeys} // Pass the updated list
                currentUsername={user?.userIdentifier}
            />
        </>
    );
};

export default PermissionsPage;