import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { usePermissions } from '../hooks/usePermissions'; // We use this to protect the page itself
import { apiService } from '../api/apiService';
import Spinner from '../components/Spinner';

// An interactive toggle component that displays a tick or a cross.
const PermissionToggle = ({ allowed, onChange, disabled }) => {
    const baseClasses = "flex justify-center items-center w-6 h-6 rounded-full transition-colors";
    const disabledClasses = "cursor-not-allowed opacity-50";
    const allowedClasses = "bg-green-100 hover:bg-green-200";
    const deniedClasses = "bg-red-100 hover:bg-red-200";
    const wrapperClasses = "flex justify-center items-center"; // Center the button

    return (
        <div className={wrapperClasses}>
            <button
                type="button"
                onClick={onChange}
                disabled={disabled}
                className={`${baseClasses} ${allowed ? allowedClasses : deniedClasses} ${disabled ? disabledClasses : ''}`}
                aria-label={allowed ? 'Revoke permission' : 'Grant permission'}
            >
                {allowed ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                )}
            </button>
        </div>
    );
};

const PermissionsPage = () => {
    const { user, updatePermissions: updateAuthContextPermissions } = useAuth();
    const { canEditUsers } = usePermissions(); // Permission to access this page

    const [usersWithPermissions, setUsersWithPermissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [savingStates, setSavingStates] = useState({}); // Track saving state per user
    const [successMessage, setSuccessMessage] = useState('');

    // --- UPDATED: Include all relevant permission keys ---
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
        { key: 'canManageHolidays', name: 'Manage Holidays' }, // Added
        { key: 'canApproveLeave', name: 'Approve Leave' },     // Added
        { key: 'canManageLeaveConfig', name: 'Manage Leave Config' }, // Added
        { key: 'canEditUsers', name: 'Edit Users & Permissions' },
    ];
    // --- End UPDATE ---

    const fetchUserPermissions = useCallback(async () => {
        if (!user?.userIdentifier || !canEditUsers) return; // Guard clause
        setLoading(true);
        setError('');
        try {
            const response = await apiService.getUserPermissionsList(user.userIdentifier);
            if (response.data.success) {
                // Ensure every user object has a permissions object, even if empty initially
                 const usersData = response.data.users.map(u => ({
                    ...u,
                    permissions: u.permissions || {} // Default to empty object if missing
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

    const handlePermissionChange = (username, permissionKey, isChecked) => {
        setUsersWithPermissions(prevUsers =>
            prevUsers.map(u =>
                u.username === username
                    ? { ...u, permissions: { ...u.permissions, [permissionKey]: isChecked } }
                    : u
            )
        );
        // Optionally clear success message when changes are made before saving
        setSuccessMessage('');
    };

    const handleSavePermissions = async (usernameToSave) => {
        setSavingStates(prev => ({ ...prev, [usernameToSave]: true })); // Set saving state for specific user
        setError('');
        setSuccessMessage('');
        try {
            const userToUpdate = usersWithPermissions.find(u => u.username === usernameToSave);
            if (!userToUpdate) {
                throw new Error("User not found for update.");
            }

            // --- UPDATED: Ensure all defined keys are included in the payload ---
            const permissionsPayload = permissionKeys.reduce((acc, p) => {
                // Send boolean true/false, default to false if undefined
                acc[p.key] = Boolean(userToUpdate.permissions[p.key]);
                return acc;
            }, {});
            // --- End UPDATE ---

            // Security Check: Prevent self-lockout
             if (userToUpdate.username === user.userIdentifier && permissionsPayload.canEditUsers === false) {
                 throw new Error("You cannot revoke your own administrative permissions.");
             }

            const response = await apiService.updateUserPermissions(userToUpdate.username, permissionsPayload, user.userIdentifier);

            if (response.data.success) {
                setSuccessMessage(`Permissions for ${userToUpdate.displayName} saved successfully!`);
                // If the current user's permissions were updated, update the auth context
                if (userToUpdate.username === user.userIdentifier) {
                    updateAuthContextPermissions(permissionsPayload);
                }
                // Optionally refetch, or just rely on the UI state being correct
                // fetchUserPermissions();
                setTimeout(() => setSuccessMessage(''), 3000);
            } else {
                setError(response.data.message);
                 // Optionally revert UI changes on error
                 // fetchUserPermissions();
            }
        } catch (err) {
            setError(err.message || "Failed to save permissions.");
             // Optionally revert UI changes on error
             // fetchUserPermissions();
        } finally {
             setSavingStates(prev => ({ ...prev, [usernameToSave]: false })); // Clear saving state for specific user
        }
    };

    if (!canEditUsers && !loading) {
        return (
            <div className="text-center text-gray-500 p-10 bg-white rounded-xl shadow-sm border">
                <h3 className="text-lg font-medium">Access Denied</h3>
                <p className="mt-1 text-sm text-gray-500">You do not have the necessary permissions to manage user permissions.</p>
            </div>
        );
    }


    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border">
            <div className="mb-5">
                <h2 className="text-xl font-bold text-gray-800">User Permissions Matrix</h2>
                <p className="text-sm text-gray-500">Manage granular access controls for each user.</p>
            </div>

            {successMessage && (
                <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4 animate-fadeIn" role="alert">
                    {successMessage}
                </div>
            )}
            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 animate-shake" role="alert">
                    {error}
                </div>
            )}

            {loading && <div className="flex justify-center items-center h-64"><Spinner size="10"/></div>}

            {!loading && !error && (
                <div className="overflow-x-auto relative">
                    {usersWithPermissions.length > 0 ? (
                        <table className="w-full text-sm text-left text-gray-600 border-collapse border border-gray-200">
                            <thead className="text-xs text-gray-700 uppercase bg-gray-100 sticky top-0 z-10">
                                <tr>
                                    <th scope="col" className="px-4 py-4 border border-gray-200 min-w-[150px]">User</th>
                                    {permissionKeys.map(p => (
                                        <th key={p.key} scope="col" className="px-4 py-4 text-center border border-gray-200 min-w-[120px]">{p.name}</th>
                                    ))}
                                    <th scope="col" className="px-4 py-4 text-center border border-gray-200 min-w-[80px]">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {usersWithPermissions.map(u => (
                                    <tr key={u.username} className="hover:bg-gray-50">
                                        <td className="px-4 py-3 font-semibold text-gray-900 border border-gray-200">
                                            {u.displayName}
                                            <p className="text-xs font-normal text-gray-500">{u.username}</p>
                                        </td>
                                        {permissionKeys.map(p => (
                                            <td key={p.key} className="px-4 py-3 border border-gray-200">
                                                <PermissionToggle
                                                    allowed={u.permissions[p.key] || false}
                                                    onChange={() => handlePermissionChange(u.username, p.key, !u.permissions[p.key])}
                                                    // Disable toggling 'canEditUsers' for the logged-in user
                                                    disabled={u.username === user.userIdentifier && p.key === 'canEditUsers'}
                                                />
                                            </td>
                                        ))}
                                        <td className="px-4 py-3 text-center border border-gray-200">
                                            <button
                                                onClick={() => handleSavePermissions(u.username)}
                                                className="px-3 py-1.5 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-xs font-medium disabled:bg-gray-400 w-[60px] h-[30px] flex justify-center items-center"
                                                // Disable save if currently saving this user OR if it's the current user trying to remove their own edit rights
                                                disabled={savingStates[u.username] || (u.username === user.userIdentifier && !u.permissions.canEditUsers)}
                                                title={u.username === user.userIdentifier && !u.permissions.canEditUsers ? "Cannot revoke own admin rights" : "Save permissions for this user"}
                                            >
                                                {savingStates[u.username] ? <Spinner size="4" /> : 'Save'}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <div className="text-center text-gray-500 p-10">
                            <h3 className="text-lg font-medium">No Users Found</h3>
                            <p className="text-sm">Please add users via the User Management tab first.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default PermissionsPage;