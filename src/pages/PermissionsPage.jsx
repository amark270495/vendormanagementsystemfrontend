import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { usePermissions } from '../hooks/usePermissions';
import { apiService } from '../api/apiService';
import Spinner from '../components/Spinner';

/**
 * An interactive toggle component that displays a tick or a cross.
 * @param {object} props
 * @param {boolean} props.allowed - The current permission state (true or false).
 * @param {function} props.onChange - The function to call when the button is clicked.
 * @param {boolean} props.disabled - Whether the button should be disabled.
 */
const PermissionToggle = ({ allowed, onChange, disabled }) => {
    const baseClasses = "flex justify-center items-center w-6 h-6 rounded-full transition-colors";
    const disabledClasses = "cursor-not-allowed opacity-50";
    const allowedClasses = "bg-green-100 hover:bg-green-200";
    const deniedClasses = "bg-red-100 hover:bg-red-200";

    // This wrapper ensures the button is centered in the table cell.
    const wrapperClasses = "flex justify-center items-center";

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
                    // Tick mark SVG for TRUE
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                ) : (
                    // Cross mark SVG for FALSE
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                )}
            </button>
        </div>
    );
};


const PermissionsPage = () => {
    const { user, updateAuthContextPermissions } = useAuth();
    const { canEditUsers } = usePermissions();

    const [usersWithPermissions, setUsersWithPermissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

    // Define the granular permission keys that will be displayed and editable
    const permissionKeys = [
        { key: 'canViewDashboards', name: 'View Dashboards' },
        { key: 'canAddPosting', name: 'Add/Edit Jobs' },
        { key: 'canViewReports', name: 'View Reports' },
        { key: 'canEmailReports', name: 'Email Reports' },
        { key: 'canViewCandidates', name: 'View Candidates' },
        { key: 'canEditDashboard', name: 'Edit Dashboard' },
        { key: 'canMessage', name: 'Send Messages' },
        { key: 'canManageTimesheets', name: 'Manage Timesheets' },
        { key: 'canRequestTimesheetApproval', name: 'Request Timesheet Approval' },
        { key: 'canEditUsers', name: 'Edit Users & Permissions' },
    ];

    const fetchUserPermissions = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const response = await apiService.getUserPermissionsList(user.userIdentifier);
            if (response.data.success) {
                setUsersWithPermissions(response.data.users);
            } else {
                setError(response.data.message);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to fetch user permissions.');
        } finally {
            setLoading(false);
        }
    }, [user.userIdentifier]);

    useEffect(() => {
        if (canEditUsers) {
            fetchUserPermissions();
        } else {
            setLoading(false);
            setError("You do not have permission to view or edit user permissions.");
        }
    }, [fetchUserPermissions, canEditUsers]);

    const handlePermissionChange = (username, permissionKey, isChecked) => {
        setUsersWithPermissions(prevUsers =>
            prevUsers.map(u =>
                u.username === username
                    ? { ...u, permissions: { ...u.permissions, [permissionKey]: isChecked } }
                    : u
            )
        );
    };

    const handleSavePermissions = async (usernameToSave) => {
        setSaving(true);
        setError('');
        setSuccessMessage('');
        try {
            const userToUpdate = usersWithPermissions.find(u => u.username === usernameToSave);
            if (!userToUpdate) {
                throw new Error("User not found for update.");
            }

            // Send only the relevant permissions object
            const permissionsPayload = permissionKeys.reduce((acc, p) => {
                acc[p.key] = userToUpdate.permissions[p.key];
                return acc;
            }, {});

            const response = await apiService.updateUserPermissions(userToUpdate.username, permissionsPayload, user.userIdentifier);

            if (response.data.success) {
                setSuccessMessage(`Permissions for ${userToUpdate.displayName} saved successfully!`);
                // If the current user's permissions were updated, update AuthContext
                if (userToUpdate.username === user.userIdentifier) {
                    updateAuthContextPermissions(permissionsPayload);
                }
                // Re-fetch all permissions to ensure data consistency
                fetchUserPermissions();
                setTimeout(() => setSuccessMessage(''), 3000);
            } else {
                setError(response.data.message);
            }
        } catch (err) {
            setError(err.message || "Failed to save permissions.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border">
            <div className="mb-5">
                <h2 className="text-xl font-bold text-gray-800">User Permissions Matrix</h2>
                <p className="text-sm text-gray-500">Manage granular access controls for each user.</p>
            </div>

            {successMessage && (
                <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4" role="alert">
                    {successMessage}
                </div>
            )}
            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4" role="alert">
                    {error}
                </div>
            )}

            {loading && <div className="flex justify-center items-center h-64"><Spinner /></div>}
            
            {!loading && !canEditUsers && !error && (
                <div className="text-center text-gray-500 p-10">
                    <h3 className="text-lg font-medium">Access Denied</h3>
                    <p className="text-sm">You do not have the necessary permissions to view or edit user permissions.</p>
                </div>
            )}

            {!loading && canEditUsers && !error && (
                <div className="overflow-x-auto">
                    {usersWithPermissions.length > 0 ? (
                        <table className="w-full text-sm text-left text-gray-600">
                            <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                                <tr>
                                    <th scope="col" className="px-6 py-4">User</th>
                                    {permissionKeys.map(p => (
                                        <th key={p.key} scope="col" className="px-6 py-4 text-center">{p.name}</th>
                                    ))}
                                    <th scope="col" className="px-6 py-4 text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {usersWithPermissions.map(u => (
                                    <tr key={u.username} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 font-semibold text-gray-900">
                                            {u.displayName}
                                            <p className="text-xs font-normal text-gray-500">{u.username}</p>
                                        </td>
                                        {permissionKeys.map(p => (
                                            <td key={p.key} className="px-6 py-4">
                                                <PermissionToggle
                                                    allowed={u.permissions[p.key] || false}
                                                    onChange={() => handlePermissionChange(u.username, p.key, !u.permissions[p.key])}
                                                    // Disable editing for the current user's 'canEditUsers' permission to prevent self-lockout
                                                    disabled={u.username === user.userIdentifier && p.key === 'canEditUsers'}
                                                />
                                            </td>
                                        ))}
                                        <td className="px-6 py-4 text-center">
                                            <button
                                                onClick={() => handleSavePermissions(u.username)}
                                                className="px-3 py-1.5 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-xs font-medium disabled:bg-gray-400"
                                                disabled={saving || (u.username === user.userIdentifier && !u.permissions.canEditUsers)}
                                            >
                                                {saving ? <Spinner size="4" /> : 'Save'}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <div className="text-center text-gray-500 p-10">
                            <h3 className="text-lg font-medium">No Users Found</h3>
                            <p className="text-sm">Ensure users are added and the backend is configured correctly.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default PermissionsPage;