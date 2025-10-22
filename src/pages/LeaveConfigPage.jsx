import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../api/apiService';
import Spinner from '../components/Spinner';
import { usePermissions } from '../hooks/usePermissions';

const LeaveConfigPage = () => {
    const { user } = useAuth();
    // Use the specific permission for managing leave configuration
    const { canManageLeaveConfig } = usePermissions();

    const [configs, setConfigs] = useState({}); // Store configs keyed by username
    const [users, setUsers] = useState([]); // Store all users
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [savingUser, setSavingUser] = useState(null); // Track which user's config is being saved

    const [editValues, setEditValues] = useState({}); // Track temporary edits for each user

    const loadConfigData = useCallback(async () => {
        setLoading(true);
        setError('');
        if (!canManageLeaveConfig) {
            setLoading(false);
            setError("You do not have permission to manage leave configurations.");
            return;
        }
        try {
            const response = await apiService.getLeaveConfig({ authenticatedUsername: user.userIdentifier });
            if (response.data.success) {
                setConfigs(response.data.configs || {});
                setUsers(response.data.users || []);
                // Initialize editValues based on fetched configs or defaults
                const initialEdits = (response.data.users || []).reduce((acc, u) => {
                    const existingConfig = response.data.configs[u.username];
                    acc[u.username] = {
                        sickLeave: existingConfig?.sickLeave ?? 0,
                        casualLeave: existingConfig?.casualLeave ?? 0,
                    };
                    return acc;
                }, {});
                setEditValues(initialEdits);

            } else {
                setError(response.data.message);
                setConfigs({});
                setUsers([]);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to fetch leave configurations.');
            setConfigs({});
            setUsers([]);
        } finally {
            setLoading(false);
        }
    }, [user?.userIdentifier, canManageLeaveConfig]);

    useEffect(() => {
        loadConfigData();
    }, [loadConfigData]);

    const handleEditChange = (username, leaveType, value) => {
        const numericValue = parseInt(value, 10);
        if (!isNaN(numericValue) && numericValue >= 0) {
            setEditValues(prev => ({
                ...prev,
                [username]: {
                    ...prev[username],
                    [leaveType]: numericValue
                }
            }));
        } else if (value === '') {
             setEditValues(prev => ({
                ...prev,
                [username]: {
                    ...prev[username],
                    [leaveType]: '' // Allow clearing the input
                }
            }));
        }
    };

    const handleSaveConfig = async (targetUsername) => {
        if (!canManageLeaveConfig) return;
        setSavingUser(targetUsername);
        setError('');
        setSuccess('');

        const configToSave = editValues[targetUsername];
        // Ensure values are numbers before saving, default to 0 if empty
        const sickLeaveValue = configToSave.sickLeave === '' ? 0 : parseInt(configToSave.sickLeave, 10);
        const casualLeaveValue = configToSave.casualLeave === '' ? 0 : parseInt(configToSave.casualLeave, 10);

        if (isNaN(sickLeaveValue) || sickLeaveValue < 0 || isNaN(casualLeaveValue) || casualLeaveValue < 0) {
            setError(`Invalid input for ${targetUsername}. Please enter non-negative numbers.`);
            setSavingUser(null);
            return;
        }


        try {
            const payload = {
                targetUsername: targetUsername,
                sickLeave: sickLeaveValue,
                casualLeave: casualLeaveValue,
                authenticatedUsername: user.userIdentifier
            };
            const response = await apiService.manageLeaveConfig('POST', payload);
            if (response.data.success) {
                setSuccess(`Configuration saved for ${targetUsername}.`);
                // Update the main configs state to reflect the save without full reload
                setConfigs(prev => ({
                    ...prev,
                    [targetUsername]: {
                        ...prev[targetUsername], // Keep potential other config fields
                        sickLeave: sickLeaveValue,
                        casualLeave: casualLeaveValue,
                    }
                }));
                setTimeout(() => setSuccess(''), 3000);
            } else {
                setError(response.data.message);
            }
        } catch (err) {
            setError(err.response?.data?.message || `Failed to save configuration for ${targetUsername}.`);
        } finally {
            setSavingUser(null);
        }
    };

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-900">Manage Leave Quotas</h1>
            <p className="mt-1 text-gray-600">Set the annual sick and casual leave allowances for each user.</p>

            {error && <div className="bg-red-50 border-l-4 border-red-400 text-red-700 p-4 rounded-md" role="alert"><p>{error}</p></div>}
            {success && <div className="bg-green-50 border-l-4 border-green-400 text-green-700 p-4 rounded-md" role="alert"><p>{success}</p></div>}

            {!canManageLeaveConfig && !loading && (
                <div className="text-center text-gray-500 p-10 bg-white rounded-xl shadow-sm border">
                    <h3 className="text-lg font-medium">Access Denied</h3>
                    <p className="text-sm">You do not have permission to manage leave configurations.</p>
                </div>
            )}

            {canManageLeaveConfig && (
                <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
                    {loading ? (
                        <div className="flex justify-center items-center h-64"><Spinner /></div>
                    ) : users.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left text-gray-600">
                                <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                                    <tr>
                                        <th scope="col" className="px-6 py-4">User</th>
                                        <th scope="col" className="px-6 py-4 text-center">Sick Leaves (Yearly)</th>
                                        <th scope="col" className="px-6 py-4 text-center">Casual Leaves (Yearly)</th>
                                        <th scope="col" className="px-6 py-4 text-center">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {users.map((u) => (
                                        <tr key={u.username} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 font-semibold text-gray-900">
                                                {u.displayName}
                                                <p className="text-xs font-normal text-gray-500">{u.username}</p>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <input
                                                    type="number"
                                                    min="0"
                                                    value={editValues[u.username]?.sickLeave ?? ''}
                                                    onChange={(e) => handleEditChange(u.username, 'sickLeave', e.target.value)}
                                                    className="w-20 border border-gray-300 rounded-md shadow-sm p-1.5 text-center focus:ring-indigo-500 focus:border-indigo-500"
                                                    disabled={savingUser === u.username}
                                                />
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <input
                                                    type="number"
                                                    min="0"
                                                    value={editValues[u.username]?.casualLeave ?? ''}
                                                    onChange={(e) => handleEditChange(u.username, 'casualLeave', e.target.value)}
                                                    className="w-20 border border-gray-300 rounded-md shadow-sm p-1.5 text-center focus:ring-indigo-500 focus:border-indigo-500"
                                                    disabled={savingUser === u.username}
                                                />
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <button
                                                    onClick={() => handleSaveConfig(u.username)}
                                                    className="px-3 py-1.5 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-xs font-medium disabled:bg-gray-400 w-20 flex justify-center items-center"
                                                    disabled={savingUser === u.username}
                                                >
                                                    {savingUser === u.username ? <Spinner size="4" /> : 'Save'}
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <p className="text-sm text-gray-500 text-center p-6">No users found to configure.</p>
                    )}
                </div>
            )}
        </div>
    );
};

export default LeaveConfigPage;