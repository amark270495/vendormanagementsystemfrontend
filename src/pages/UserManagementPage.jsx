import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { usePermissions } from '../hooks/usePermissions';
import { apiService } from '../api/apiService';
import Spinner from '../components/Spinner';
import UserFormModal from '../components/UserFormModal';
import DeleteUserModal from '../components/DeleteUserModal';

// --- Premium UI Icons ---
const Icons = {
    Users: ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
    UserPlus: ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>,
    Edit2: ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>,
    Trash2: ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>,
    AlertTriangle: ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" x2="12" y1="9" y2="13"/><line x1="12" x2="12.01" y1="17" y2="17"/></svg>,
    Search: ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
};

const UserManagementPage = () => {
    const { user } = useAuth();
    const { canEditUsers } = usePermissions(); 

    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    
    // --- New Feature: Local Search State ---
    const [searchTerm, setSearchTerm] = useState('');
    
    const [isUserModalOpen, setUserModalOpen] = useState(false);
    const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
    
    const [userToEdit, setUserToEdit] = useState(null);
    const [userToDelete, setUserToDelete] = useState(null);

    // Helper to format date (Logic Preserved Exactly)
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        try {
            const date = new Date(dateString);
            const userTimezoneOffset = date.getTimezoneOffset() * 60000;
            const adjustedDate = new Date(date.getTime() + userTimezoneOffset);
            return adjustedDate.toLocaleDateString('en-US', {
                month: '2-digit',
                day: '2-digit',
                year: 'numeric'
            });
        } catch (e) {
            return 'Invalid Date';
        }
    };

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        setError('');
        if (!canEditUsers) {
            setLoading(false);
            setError("You do not have permission to manage users.");
            return;
        }
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
    }, [user?.userIdentifier, canEditUsers]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const handleAddClick = () => {
        if (!canEditUsers) return;
        setUserToEdit(null);
        setUserModalOpen(true);
    };
    
    const handleEditClick = (userToEdit) => {
        if (!canEditUsers) return;
        setUserToEdit(userToEdit);
        setUserModalOpen(true);
    };
    
    const handleDeleteClick = (userToDelete) => {
        if (!canEditUsers) return;
        setUserToDelete(userToDelete);
        setDeleteModalOpen(true);
    };

    const handleSaveUser = async (formData) => {
        if (!canEditUsers) throw new Error("Permission denied to save user.");
        try {
            let response;
            if (userToEdit) {
                response = await apiService.updateUser(userToEdit.username, formData, user.userIdentifier);
            } else {
                response = await apiService.addUser(formData, user.userIdentifier);
            }
            fetchUsers(); 
        } catch (error) {
            throw error; 
        }
    };

    const handleConfirmDelete = async () => {
        if (!canEditUsers) throw new Error("Permission denied to delete user.");
        try {
            await apiService.deleteUser(userToDelete.username, user.userIdentifier);
            fetchUsers(); 
        } catch (error) {
            throw error;
        }
    };

    // --- UX Enhancement: Filtered Users based on Search ---
    const filteredUsers = useMemo(() => {
        if (!searchTerm) return users;
        const lowerSearch = searchTerm.toLowerCase();
        return users.filter(u => 
            u.displayName?.toLowerCase().includes(lowerSearch) ||
            u.username?.toLowerCase().includes(lowerSearch) ||
            u.employeeCode?.toLowerCase().includes(lowerSearch) ||
            u.backendOfficeRole?.toLowerCase().includes(lowerSearch)
        );
    }, [users, searchTerm]);

    // --- Premium Role Badges (Glassy styled) ---
    const RoleBadge = ({ role }) => {
        const styleMap = {
            'Admin': 'bg-red-50 text-red-700 border-red-200',
            'Recruitment Manager': 'bg-purple-50 text-purple-700 border-purple-200',
            'Recruitment Team': 'bg-indigo-50 text-indigo-700 border-indigo-200',
            'Operations Admin': 'bg-blue-50 text-blue-700 border-blue-200',
            'Data Entry & Viewer': 'bg-green-50 text-green-700 border-green-200',
            'Data Viewer': 'bg-yellow-50 text-yellow-800 border-yellow-200',
            'Data Entry': 'bg-teal-50 text-teal-700 border-teal-200',
            'Taproot Director': 'bg-emerald-50 text-emerald-700 border-emerald-200',
            'Director': 'bg-pink-50 text-pink-700 border-pink-200',
            'Standard User': 'bg-slate-50 text-slate-700 border-slate-200',
            'Bench Sales Recruiter': 'bg-orange-50 text-orange-700 border-orange-200'
        };
        const styling = styleMap[role] || 'bg-slate-50 text-slate-700 border-slate-200';
        return <span className={`px-2.5 py-1 text-[11px] font-bold tracking-wide rounded-full border ${styling}`}>{role}</span>
    };

    return (
        <div className="max-w-[1600px] mx-auto space-y-8 pb-12">
            
            {/* --- Premium Header Section --- */}
            <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-slate-200 pb-5 gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        <Icons.Users className="w-8 h-8 text-blue-600" />
                        Directory Management
                    </h1>
                    <p className="mt-2 text-sm font-medium text-slate-500">
                        View, edit, and manage system access and roles for all active personnel.
                    </p>
                </div>
                {canEditUsers && (
                    <button 
                        onClick={handleAddClick} 
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-6 rounded-xl flex items-center justify-center transition-all shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 hover:-translate-y-0.5"
                    >
                        <Icons.UserPlus className="w-5 h-5 mr-2" />
                        Provision New User
                    </button>
                )}
            </div>

            {/* --- Status & Data Handlers --- */}
            {loading && (
                <div className="flex flex-col justify-center items-center h-64 bg-white rounded-3xl shadow-xl border border-slate-100">
                    <Spinner size="8" />
                    <p className="mt-4 text-sm font-bold text-slate-400 uppercase tracking-widest">Loading Directory...</p>
                </div>
            )}
            
            {error && (
                <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 px-6 py-5 rounded-2xl shadow-sm">
                    <Icons.AlertTriangle className="w-6 h-6 shrink-0" />
                    <div>
                        <h4 className="text-sm font-bold">System Error</h4>
                        <p className="text-[13px] font-medium mt-0.5">{error}</p>
                    </div>
                </div>
            )}
            
            {!loading && !error && !canEditUsers && (
                <div className="flex flex-col items-center justify-center p-16 bg-white rounded-3xl shadow-xl border border-slate-100 text-center">
                    <Icons.AlertTriangle className="w-12 h-12 text-red-500 mb-4 opacity-80" />
                    <h3 className="text-xl font-bold text-slate-900">Access Restricted</h3>
                    <p className="text-sm font-medium text-slate-500 mt-2 max-w-md">You do not possess the required administrative clearance to view or modify the user directory.</p>
                </div>
            )}

            {/* --- Main Data Table Section --- */}
            {!loading && !error && canEditUsers && (
                <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden flex flex-col relative">
                    
                    {/* Search & Utility Bar */}
                    <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                        <div className="relative w-full max-w-sm">
                            <Icons.Search className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-400" />
                            <input 
                                type="text" 
                                placeholder="Search by name, email, role, or ID..." 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-white border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-xl pl-10 pr-4 py-2 text-[13px] font-bold text-slate-800 transition-all outline-none placeholder:font-medium placeholder:text-slate-400"
                            />
                        </div>
                        <div className="text-[11px] font-black text-slate-400 uppercase tracking-widest">
                            {filteredUsers.length} {filteredUsers.length === 1 ? 'User' : 'Users'} Found
                        </div>
                    </div>

                    {/* The Table */}
                    <div className="overflow-x-auto custom-scrollbar">
                        {filteredUsers.length > 0 ? (
                            <table className="w-full text-left border-collapse min-w-[1200px]">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-slate-200">
                                        <th scope="col" className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Display Name</th>
                                        <th scope="col" className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Username (Email)</th>
                                        <th scope="col" className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">EMP Code</th>
                                        <th scope="col" className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Backend Role</th>
                                        <th scope="col" className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Mobile</th>
                                        <th scope="col" className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Work Location</th>
                                        <th scope="col" className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">DOJ</th>
                                        <th scope="col" className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">DOB</th>
                                        <th scope="col" className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filteredUsers.map((u) => (
                                        <tr key={u.username} className="hover:bg-slate-50/80 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-8 w-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-black text-xs shrink-0">
                                                        {u.displayName ? u.displayName.charAt(0).toUpperCase() : 'U'}
                                                    </div>
                                                    <span className="font-bold text-[13px] text-slate-900 whitespace-nowrap">{u.displayName}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-[13px] font-medium text-slate-600 whitespace-nowrap">{u.username}</td>
                                            <td className="px-6 py-4 text-[13px] font-bold text-slate-500 whitespace-nowrap">{u.employeeCode || '—'}</td>
                                            <td className="px-6 py-4 whitespace-nowrap"><RoleBadge role={u.backendOfficeRole} /></td>
                                            <td className="px-6 py-4 text-[13px] font-medium text-slate-600 whitespace-nowrap">{u.personalMobileNumber || '—'}</td>
                                            <td className="px-6 py-4 text-[13px] font-medium text-slate-600 whitespace-nowrap">{u.workLocation || '—'}</td>
                                            <td className="px-6 py-4 text-[13px] font-bold text-slate-500 whitespace-nowrap">{formatDate(u.dateOfJoining)}</td>
                                            <td className="px-6 py-4 text-[13px] font-bold text-slate-500 whitespace-nowrap">{formatDate(u.dateOfBirth)}</td>
                                            <td className="px-6 py-4 flex space-x-1 justify-end opacity-40 group-hover:opacity-100 transition-opacity">
                                                <button 
                                                    onClick={() => handleEditClick(u)} 
                                                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all" 
                                                    title="Edit User"
                                                >
                                                    <Icons.Edit2 className="w-4 h-4" />
                                                </button>
                                                <button 
                                                    onClick={() => handleDeleteClick(u)} 
                                                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all" 
                                                    title="Revoke Access"
                                                >
                                                    <Icons.Trash2 className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                             <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
                                <Icons.Search className="w-10 h-10 text-slate-300 mb-3" />
                                <h3 className="text-lg font-bold text-slate-800">No matching users found</h3>
                                <p className="text-sm font-medium text-slate-500 mt-1 max-w-sm">
                                    {searchTerm ? `We couldn't find any users matching "${searchTerm}". Try a different search term.` : 'The directory is currently empty. Provision a new user to get started.'}
                                </p>
                                {searchTerm && (
                                    <button onClick={() => setSearchTerm('')} className="mt-4 text-[13px] font-bold text-blue-600 hover:text-blue-800">
                                        Clear search filters
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* --- Modals --- */}
            <UserFormModal 
                isOpen={isUserModalOpen} 
                onClose={() => setUserModalOpen(false)} 
                onSave={handleSaveUser} 
                userToEdit={userToEdit} 
            />
            <DeleteUserModal 
                isOpen={isDeleteModalOpen} 
                onClose={() => setDeleteModalOpen(false)} 
                onConfirm={handleConfirmDelete} 
                userToDelete={userToDelete} 
            />
        </div>
    );
};

export default UserManagementPage;