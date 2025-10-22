import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../api/apiService';
import Spinner from '../components/Spinner';
import { usePermissions } from '../hooks/usePermissions';

const LeaveConfigPage = () => {
    const { user } = useAuth();
    const { canManageLeaveConfig } = usePermissions();

    // Separate states for users and their configs
    const [allUsers, setAllUsers] = useState([]);
    const [leaveConfigs, setLeaveConfigs] = useState({}); // Store configs mapped by username
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [savingStates, setSavingStates] = useState({}); // Track saving state per user row

    // State for editable values in each row
    const [editableConfigs, setEditableConfigs] = useState({});

    const loadData = useCallback(async () => {
        if (!user?.userIdentifier || !canManageLeaveConfig) {
            setLoading(false);
            setError("You do not have permission to manage leave configurations.");
            return;
        }
        setLoading(true);
        setError('');
        setSuccessMessage('');
        try {
            // Fetch users and configs using the dedicated API endpoint
            const response = await apiService.getLeaveConfig({ authenticatedUsername: user.userIdentifier });

            if (response.data.success) {
                // Set users state
                const fetchedUsers = response.data.users || [];
                setAllUsers(fetchedUsers);

                // Set configs state (map)
                const fetchedConfigsMap = response.data.configs || {};
                setLeaveConfigs(fetchedConfigsMap);

                // Initialize editable state based on fetched data or defaults
                const initialEditable = {};
                fetchedUsers.forEach(u => {
                    const config = fetchedConfigsMap[u.username];
                    initialEditable[u.username] = {
                        sickLeave: config?.sickLeave ?? 0, // Default to 0 if no config
                        casualLeave: config?.casualLeave ?? 0 // Default to 0 if no config
                    };
                });
                setEditableConfigs(initialEditable);

                 if (fetchedUsers.length === 0) {
                     setError("No users found in the system to configure."); // More specific message
                 }

            } else {
                setError(response.data.message || "Failed to load configuration data.");
                setAllUsers([]);
                setLeaveConfigs({});
                setEditableConfigs({});
            }
        } catch (err) {
            setError(err.response?.data?.message || 'An unexpected error occurred while fetching data.');
            setAllUsers([]);
            setLeaveConfigs({});
            setEditableConfigs({});
        } finally {
            setLoading(false);
        }
    }, [user?.userIdentifier, canManageLeaveConfig]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    // Handle input changes for a specific user
    const handleInputChange = (username, field, value) => {
        // Ensure value is a non-negative number
        const numericValue = Math.max(0, parseInt(value, 10) || 0);
        setEditableConfigs(prev => ({
            ...prev,
            [username]: {
                ...prev[username],
                [field]: numericValue
            }
        }));
         setSuccessMessage(''); // Clear success message on edit
    };

    // Handle saving config for a specific user
    const handleSaveConfig = async (targetUsername) => {
        if (!canManageLeaveConfig) return; // Extra safety check

        setSavingStates(prev => ({ ...prev, [targetUsername]: true }));
        setError('');
        setSuccessMessage('');
        try {
            const configData = editableConfigs[targetUsername];
            if (!configData) {
                throw new Error("Could not find configuration data for the user.");
            }

            const response = await apiService.manageLeaveConfig(
                {
                    targetUsername: targetUsername,
                    sickLeave: configData.sickLeave,
                    casualLeave: configData.casualLeave
                },
                user.userIdentifier
            );

            if (response.data.success) {
                setSuccessMessage(`Configuration saved for ${targetUsername}.`);
                // Update the main config state to reflect saved data
                setLeaveConfigs(prev => ({
                    ...prev,
                    [targetUsername]: { ...configData }
                }));
                 setTimeout(() => setSuccessMessage(''), 3000);
            } else {
                setError(response.data.message);
            }
        } catch (err) {
            setError(err.message || `Failed to save configuration for ${targetUsername}.`);
             // Optionally revert editable state if save fails?
             // const originalConfig = leaveConfigs[targetUsername];
             // if (originalConfig) handleInputChange(targetUsername, 'sickLeave', originalConfig.sickLeave);
             // if (originalConfig) handleInputChange(targetUsername, 'casualLeave', originalConfig.casualLeave);
        } finally {
            setSavingStates(prev => ({ ...prev, [targetUsername]: false }));
        }
    };

    if (loading) {
        return <div className="flex justify-center items-center h-64"><Spinner size="12" /></div>;
    }

    // Show access denied only if loading is finished and permission is false
    if (!loading && !canManageLeaveConfig) {
        return (
            <div className="text-center text-gray-500 p-10 bg-white rounded-xl shadow-sm border">
                <h3 className="text-lg font-medium">Access Denied</h3>
                <p className="mt-1 text-sm text-gray-500">You do not have the necessary permissions to manage leave configurations.</p>
            </div>
        );
    }

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border">
            <div className="mb-5">
                <h2 className="text-xl font-bold text-gray-800">Manage Leave Quotas</h2>
                <p className="text-sm text-gray-500">Set the annual sick and casual leave allowances for each user.</p>
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

            <div className="overflow-x-auto relative max-h-[70vh]">
                {allUsers.length > 0 ? (
                    <table className="w-full text-sm text-left text-gray-600 border-collapse">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-100 sticky top-0 z-10">
                            <tr>
                                <th scope="col" className="px-4 py-3 border border-gray-200">User</th>
                                <th scope="col" className="px-4 py-3 border border-gray-200 w-32 text-center">Sick Leaves (Days)</th>
                                <th scope="col" className="px-4 py-3 border border-gray-200 w-32 text-center">Casual Leaves (Days)</th>
                                <th scope="col" className="px-4 py-3 border border-gray-200 w-24 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {allUsers.map(u => (
                                <tr key={u.username} className="bg-white border-b hover:bg-gray-50">
                                    <td className="px-4 py-3 font-semibold text-gray-900 border border-gray-200">
                                        {u.displayName}
                                        <p className="text-xs font-normal text-gray-500">{u.username}</p>
                                    </td>
                                    <td className="px-4 py-3 border border-gray-200">
                                        <input
                                            type="number"
                                            min="0"
                                            value={editableConfigs[u.username]?.sickLeave ?? 0}
                                            onChange={(e) => handleInputChange(u.username, 'sickLeave', e.target.value)}
                                            className="w-full p-1 border border-gray-300 rounded text-center focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                                        />
                                    </td>
                                    <td className="px-4 py-3 border border-gray-200">
                                        <input
                                            type="number"
                                            min="0"
                                            value={editableConfigs[u.username]?.casualLeave ?? 0}
                                            onChange={(e) => handleInputChange(u.username, 'casualLeave', e.target.value)}
                                            className="w-full p-1 border border-gray-300 rounded text-center focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                                        />
                                    </td>
                                    <td className="px-4 py-3 text-center border border-gray-200">
                                        <button
                                            onClick={() => handleSaveConfig(u.username)}
                                            className="px-3 py-1 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-xs font-medium disabled:bg-gray-400 w-[60px] h-[30px] flex justify-center items-center"
                                            disabled={savingStates[u.username]}
                                        >
                                            {savingStates[u.username] ? <Spinner size="4" /> : 'Save'}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    // Display the error message if it's set and there are no users, otherwise generic message
                    <div className="text-center text-gray-500 py-10">
                        {error ? error : "No users found to configure."}
                    </div>
                )}
            </div>
        </div>
    );
};

export default LeaveConfigPage;