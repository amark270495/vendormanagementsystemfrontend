import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { usePermissions } from '../hooks/usePermissions'; 
import { apiService } from '../api/apiService';
import Spinner from '../components/Spinner';
import EditPermissionsModal from '../components/admin/EditPermissionsModal'; 

// *** UPDATED: Added Asset Management permissions to the list ***
const permissionKeys = [
    { key: 'canViewDashboards', name: 'View Dashboards', description: 'Access dashboard pages.' },
    { key: 'canAddPosting', name: 'Add/Edit Jobs', description: 'Submit new job postings via the form.' },
    { key: 'canEditDashboard', name: 'Edit Dashboard Cells', description: 'Directly edit cells like Remarks, Working By.' },
    { key: 'canViewReports', name: 'View Reports', description: 'Access the main Reports page.' },
    { key: 'canEmailReports', name: 'Email Reports', description: 'Send aggregated job reports via email.' },
    { key: 'canViewCandidates', name: 'View Candidates', description: 'Access the Candidate Details page.' },
    
    // --- BENCH SALES PERMISSION ---
    { key: 'canManageBenchSales', name: 'Manage Bench Sales', description: 'Allows user to view, edit, and assign candidates on the Bench Sales dashboard.' },
    
    // --- NEW ASSET MANAGEMENT PERMISSIONS ---
    { key: 'canManageAssets', name: 'Manage Hardware Assets', description: 'Create, update, delete, and log service for company hardware.' },
    { key: 'canAssignAssets', name: 'Assign Assets', description: 'Assign or reassign hardware to employees.' },
    
    { key: 'canMessage', name: 'Send Messages', description: 'Use the internal messaging system.' },
    { key: 'canManageTimesheets', name: 'Manage Timesheets (Full)', description: 'Create companies/employees, log/edit/delete hours.' },
    { key: 'canRequestTimesheetApproval', name: 'Request Timesheet Approval', description: 'Send approval request emails.' },
    { key: 'canManageMSAWO', name: 'Manage MSA/WO', description: 'Create, manage, and view MSA/WO documents.' },
    { key: 'canManageOfferLetters', name: 'Manage Offer Letters', description: 'Create, manage, and view Offer Letters.' },
    { key: 'canManageHolidays', name: 'Manage Holidays', description: 'Add or remove company holidays (Admin Console).' },
    { key: 'canApproveLeave', name: 'Approve Leave', description: 'Approve or reject leave requests (Admin Console).' },
    { key: 'canManageLeaveConfig', name: 'Manage Leave Config', description: 'Set leave quotas for users (Admin Console).' },
    { key: 'canRequestLeave', name: 'Request Leave', description: 'Submit leave requests via My Profile.'},
    { key: 'canSendMonthlyReport', name: 'Send Monthly Report', description: 'Send monthly attendance reports to all users (Admin Console).'},
    { key: 'canApproveAttendance', name: 'Approve Attendance', description: 'Approve or reject attendance marking requests (Admin Console).' },
    { key: 'canEditUsers', name: 'Edit Users & Permissions', description: 'Add/edit/delete users and manage all permissions (Admin Console).' },
];

const PermissionsPage = () => {
    const { user, updatePermissions: updateAuthContextPermissions } = useAuth();
    const { canEditUsers } = usePermissions(); 

    const [usersWithPermissions, setUsersWithPermissions] = useState([]);
    const [loading, setLoading] = useState(true); 
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);

    const fetchUserPermissions = useCallback(async () => {
        if (!user?.userIdentifier) {
            setError("User not identified.");
            setLoading(false);
            return;
        }

        setLoading(true);
        setError('');
        
        try {
            const response = await apiService.getUserPermissionsList(user.userIdentifier);

            if (response?.data?.success && Array.isArray(response.data.users)) {
                try {
                    const usersData = response.data.users.map((u) => {
                        if (!u || typeof u !== 'object') return null;
                        return {
                            ...u,
                            permissions: permissionKeys.reduce((acc, pKey) => {
                                acc[pKey.key] = u.permissions ? (u.permissions[pKey.key] === true) : false;
                                return acc;
                            }, {})
                        };
                    }).filter(Boolean);

                    setUsersWithPermissions(usersData);
                    if (usersData.length === 0) {
                         setError("No users found in the system.");
                    }
                } catch (processingError) {
                    setError("Failed to process user data received from the server.");
                }
            } else {
                 const errorMessage = response?.data?.message || "Received invalid data structure from API.";
                 throw new Error(errorMessage);
            }
        } catch (err) {
            setError(err?.response?.data?.message || err?.message || 'Failed to fetch user permissions.');
        } finally {
            setLoading(false);
        }
    }, [user?.userIdentifier, canEditUsers]);

    useEffect(() => {
        if (user?.userIdentifier && canEditUsers) {
            fetchUserPermissions();
        } else if (user?.userIdentifier && !canEditUsers) {
             setLoading(false);
             setError("You do not have permission to view or edit user permissions.");
        } else {
            setLoading(false);
        }
    }, [fetchUserPermissions, canEditUsers, user?.userIdentifier]);


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
            const fullPermissionsPayload = permissionKeys.reduce((acc, pKey) => {
                acc[pKey.key] = updatedPermissions[pKey.key] === true;
                return acc;
            }, {});

            const response = await apiService.updateUserPermissions(usernameToSave, fullPermissionsPayload, user.userIdentifier);

            if (response.data.success) {
                setSuccessMessage(`Permissions for ${selectedUser?.displayName || usernameToSave} saved successfully!`);
                if (usernameToSave === user.userIdentifier) {
                    updateAuthContextPermissions(fullPermissionsPayload);
                }
                fetchUserPermissions();
                setTimeout(() => setSuccessMessage(''), 3000);
            } else {
                throw new Error(response.data.message || "Failed to save permissions.");
            }
        } catch (err) {
            throw err;
        }
    };

    const filteredUsers = usersWithPermissions.filter(u =>
        (u.displayName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (u.username?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    );

    if (!loading && user?.userIdentifier && !canEditUsers) {
        return (
            <div className="text-center text-gray-500 p-10 bg-white rounded-xl shadow-sm border">
                <h3 className="text-lg font-medium">Access Denied</h3>
                <p className="mt-1 text-sm text-gray-500">You do not have the necessary permissions to manage user permissions.</p>
            </div>
        );
    }
    
    if (loading) {
         return <div className="flex justify-center items-center h-64"><Spinner size="10"/></div>;
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
                    />
                </div>

                {successMessage && (
                    <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4 animate-fadeIn" role="alert">
                        {successMessage}
                    </div>
                )}
                 {error && !isModalOpen && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 animate-shake" role="alert">
                        {error}
                    </div>
                )}

                <div className="overflow-x-auto">
                    {!error && !loading && filteredUsers.length > 0 ? (
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
                                    >
                                        Edit Permissions
                                    </button>
                                </li>
                            ))}
                        </ul>
                    ) : !error && !loading ? ( 
                        <div className="text-center text-gray-500 py-10">
                            <h3 className="mt-2 text-sm font-medium text-gray-900">No Users Found</h3>
                            <p className="mt-1 text-sm text-gray-500">No users match your search criteria, or no users exist yet.</p>
                        </div>
                    ) : null }
                </div>
            </div>

            <EditPermissionsModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                userToEdit={selectedUser}
                onSave={handleSavePermissions}
                permissionKeys={permissionKeys} 
                currentUsername={user?.userIdentifier}
            />
        </>
    );
};

export default PermissionsPage;