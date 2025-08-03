import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../api/apiService';
import Spinner from '../components/Spinner';
import UserFormModal from '../components/UserFormModal';
import DeleteUserModal from '../components/DeleteUserModal';

const UserManagementPage = () => {
    const { user } = useAuth();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    
    // State to manage which modals are open
    const [isUserModalOpen, setUserModalOpen] = useState(false);
    const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
    
    // State to keep track of the user being edited or deleted
    const [userToEdit, setUserToEdit] = useState(null);
    const [userToDelete, setUserToDelete] = useState(null);

    // Fetches the list of users from the server
    const fetchUsers = useCallback(async () => {
        if (!user?.userIdentifier) return;
        setLoading(true);
        try {
            const response = await apiService.getUsers(user.userIdentifier);
            if (response.data.success) {
                setUsers(response.data.users);
            } else {
                setError(response.data.message);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to fetch users.');
        } finally {
            setLoading(false);
        }
    }, [user?.userIdentifier]);

    // Fetch users when the component mounts
    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    // Handlers to open the modals
    const handleAddClick = () => {
        setUserToEdit(null); // Ensure we are in "add" mode
        setUserModalOpen(true);
    };
    const handleEditClick = (userToEdit) => {
        setUserToEdit(userToEdit);
        setUserModalOpen(true);
    };
    const handleDeleteClick = (userToDelete) => {
        setUserToDelete(userToDelete);
        setDeleteModalOpen(true);
    };

    // Handles the save action from the UserFormModal
    const handleSaveUser = async (formData) => {
        if (userToEdit) {
            // Update existing user
            await apiService.updateUser(userToEdit.username, formData, user.userIdentifier);
        } else {
            // Add new user
            await apiService.addUser(formData, user.userIdentifier);
        }
        fetchUsers(); // Refresh the user list after saving
    };

    // Handles the delete confirmation
    const handleConfirmDelete = async () => {
        await apiService.deleteUser(userToDelete.username, user.userIdentifier);
        fetchUsers(); // Refresh the user list after deleting
    };

    const RoleBadge = ({ role }) => {
        const roleColor = {
            'Admin': 'bg-red-100 text-red-800',
            'Recruitment Manager': 'bg-purple-100 text-purple-800',
            'Recruitment Team': 'bg-indigo-100 text-indigo-800',
            'Operations Admin': 'bg-blue-100 text-blue-800',
            'Data Entry & Viewer': 'bg-green-100 text-green-800',
            'Data Viewer': 'bg-yellow-100 text-yellow-800',
            'Data Entry': 'bg-teal-100 text-teal-800',
        }[role] || 'bg-gray-100 text-gray-800';
        return <span className={`px-2 py-1 text-xs font-medium rounded-full ${roleColor}`}>{role}</span>
    };

    return (
        <>
            <div className="bg-white p-6 rounded-xl shadow-sm border">
                <div className="flex justify-between items-center mb-5">
                    <div>
                        <h2 className="text-xl font-bold text-gray-800">Users</h2>
                        <p className="text-sm text-gray-500">A list of all users in the system.</p>
                    </div>
                    <button onClick={handleAddClick} className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4 py-2 rounded-lg flex items-center shadow-sm">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 mr-2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                        Add User
                    </button>
                </div>
                {loading && <div className="flex justify-center items-center h-64"><Spinner /></div>}
                {error && <div className="text-red-600 bg-red-50 p-4 rounded-lg border border-red-200">Error: {error}</div>}
                {!loading && !error && (
                    <div className="overflow-x-auto">
                        {users.length > 0 ? (
                            <table className="w-full text-sm text-left text-gray-600">
                                <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                                    <tr>
                                        <th scope="col" className="px-6 py-3">Display Name</th>
                                        <th scope="col" className="px-6 py-3">Username</th>
                                        <th scope="col" className="px-6 py-3">Role</th>
                                        <th scope="col" className="px-6 py-3">Backend Role</th>
                                        <th scope="col" className="px-6 py-3 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {users.map((u) => (
                                        <tr key={u.username} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 font-semibold text-gray-900">{u.displayName}</td>
                                            <td className="px-6 py-4">{u.username}</td>
                                            <td className="px-6 py-4"><RoleBadge role={u.userRole} /></td>
                                            <td className="px-6 py-4"><RoleBadge role={u.backendOfficeRole} /></td>
                                            <td className="px-6 py-4 flex space-x-2 justify-end">
                                                <button onClick={() => handleEditClick(u)} className="text-gray-500 hover:text-indigo-600 p-2 rounded-md" aria-label={`Edit user ${u.displayName}`}><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg></button>
                                                <button onClick={() => handleDeleteClick(u)} className="text-gray-500 hover:text-red-600 p-2 rounded-md" aria-label={`Delete user ${u.displayName}`}><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg></button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                             <div className="text-center text-gray-500 p-10">
                                <h3 className="text-lg font-medium">No Users Found</h3>
                                <p className="text-sm">Click "Add User" to create the first user.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
            {/* Modals for user actions */}
            <UserFormModal isOpen={isUserModalOpen} onClose={() => setUserModalOpen(false)} onSave={handleSaveUser} userToEdit={userToEdit} />
            <DeleteUserModal isOpen={isDeleteModalOpen} onClose={() => setDeleteModalOpen(false)} onConfirm={handleConfirmDelete} userToDelete={userToDelete} />
        </>
    );
};

export default UserManagementPage;