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

    return (
        <>
            <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex justify-end mb-4">
                    <button onClick={handleAddClick} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 mr-2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><line x1="19" y1="8" x2="19" y2="14"></line><line x1="22" y1="11" x2="16" y2="11"></line></svg>
                        Add User
                    </button>
                </div>
                {loading && <div className="flex justify-center items-center h-64"><Spinner /></div>}
                {error && <div className="text-red-500 bg-red-100 p-4 rounded-lg">Error: {error}</div>}
                {!loading && !error && (
                    <div className="overflow-x-auto">
                        {users.length > 0 ? (
                            <table className="w-full text-sm text-left text-gray-500">
                                <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                                    <tr>
                                        <th scope="col" className="px-6 py-3">Display Name</th>
                                        <th scope="col" className="px-6 py-3">Username</th>
                                        <th scope="col" className="px-6 py-3">Role</th>
                                        <th scope="col" className="px-6 py-3">Backend Role</th>
                                        <th scope="col" className="px-6 py-3">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.map((u) => (
                                        <tr key={u.username} className="bg-white border-b hover:bg-gray-50">
                                            <td className="px-6 py-4 font-medium text-gray-900">{u.displayName}</td>
                                            <td className="px-6 py-4">{u.username}</td>
                                            <td className="px-6 py-4">{u.userRole}</td>
                                            <td className="px-6 py-4">{u.backendOfficeRole}</td>
                                            <td className="px-6 py-4 flex space-x-2">
                                                <button onClick={() => handleEditClick(u)} className="text-indigo-600 hover:text-indigo-900 p-1" aria-label={`Edit user ${u.displayName}`}><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg></button>
                                                <button onClick={() => handleDeleteClick(u)} className="text-red-600 hover:text-red-900 p-1" aria-label={`Delete user ${u.displayName}`}><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg></button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <p className="text-center text-gray-500 p-4">No users found.</p>
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