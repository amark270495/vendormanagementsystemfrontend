import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../api/apiService';
import Spinner from '../components/Spinner';
import { usePermissions } from '../hooks/usePermissions';

const LeaveConfigPage = () => {
    const { user } = useAuth();
    const { canManageLeaveConfig } = usePermissions();

    const [allUsers, setAllUsers] = useState([]);
    const [leaveConfigs, setLeaveConfigs] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [savingStates, setSavingStates] = useState({});

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
                        sickLeave: config?.sickLeave ?? 0,
                        casualLeave: config?.casualLeave ?? 0,
                        earnedLeave: config?.earnedLeave ?? 0, // Added
                        lwp: config?.lwp ?? 0, // Added
                        lop: config?.lop ?? 0, // Added
                        maternityLeave: config?.maternityLeave ?? 0, // Added
                        paternityLeave: config?.paternityLeave ?? 0 // Added
                    };
                });
                setEditableConfigs(initialEditable);

                 if (fetchedUsers.length === 0) {
                     setError("No users found in the system to configure.");
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
                    ...configData // Send all fields (sick, casual, earned, etc.)
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
        } finally {
            setSavingStates(prev => ({ ...prev, [targetUsername]: false }));
        }
    };

    if (loading) {
        return <div className="flex justify-center items-center h-64"><Spinner size="12" /></div>;
    }

    if (!loading && !canManageLeaveConfig) {
        return (
            <div className="text-center text-gray-500 p-10 bg-white rounded-xl shadow-sm border">
                <h3 className="text-lg font-medium">Access Denied</h3>
                <p className="mt-1 text-sm text-gray-500">You do not have the necessary permissions to manage leave configurations.</p>
            </div>
        );
    }

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border overflow-hidden">
            <div className="mb-5">
                <h2 className="text-xl font-bold text-gray-800">Manage Leave Quotas</h2>
                <p className="text-sm text-gray-500">Set the annual leave allowances for each user.</p>
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
                                <th scope="col" className="px-4 py-3 border border-gray-200 min-w-[150px]">User</th>
                                <th scope="col" className="px-2 py-3 border border-gray-200 w-24 text-center" title="Sick Leave">SL</th>
                                <th scope="col" className="px-2 py-3 border border-gray-200 w-24 text-center" title="Casual Leave">CL</th>
                                <th scope="col" className="px-2 py-3 border border-gray-200 w-24 text-center" title="Earned Leave">EL</th>
                                <th scope="col" className="px-2 py-3 border border-gray-200 w-24 text-center" title="Leave Without Pay">LWP</th>
                                <th scope="col" className="px-2 py-3 border border-gray-200 w-24 text-center" title="Loss Of Pay">LOP</th>
                                <th scope="col" className="px-2 py-3 border border-gray-200 w-24 text-center" title="Maternity Leave">ML</th>
                                <th scope="col" className="px-2 py-3 border border-gray-200 w-24 text-center" title="Paternity Leave">PL</th>
                                <th scope="col" className="px-4 py-3 border border-gray-200 w-24 text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {allUsers.map(u => (
                                <tr key={u.username} className="bg-white border-b hover:bg-gray-50">
                                    <td className="px-4 py-3 font-semibold text-gray-900 border border-gray-200">
                                        {u.displayName}
                                        <p className="text-xs font-normal text-gray-500 truncate max-w-[140px]">{u.username}</p>
                                    </td>
                                    {['sickLeave', 'casualLeave', 'earnedLeave', 'lwp', 'lop', 'maternityLeave', 'paternityLeave'].map(field => (
                                        <td key={field} className="px-2 py-3 border border-gray-200">
                                            <input
                                                type="number"
                                                min="0"
                                                value={editableConfigs[u.username]?.[field] ?? 0}
                                                onChange={(e) => handleInputChange(u.username, field, e.target.value)}
                                                className="w-full p-1 border border-gray-300 rounded text-center focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                                            />
                                        </td>
                                    ))}
                                    <td className="px-4 py-3 text-center border border-gray-200">
                                        <button
                                            onClick={() => handleSaveConfig(u.username)}
                                            className="px-3 py-1 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-xs font-medium disabled:bg-gray-400 w-full h-[30px] flex justify-center items-center"
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
                    <div className="text-center text-gray-500 py-10">
                        {error ? error : "No users found to configure."}
                    </div>
                )}
            </div>
        </div>
    );
};

export default LeaveConfigPage;