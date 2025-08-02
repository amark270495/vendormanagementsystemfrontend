import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import Spinner from './Spinner';

const UserFormModal = ({ isOpen, onClose, onSave, userToEdit }) => {
    const userRoles = ['Admin', 'Standard User', 'Data Entry', 'Data Viewer', 'Data Entry & Viewer'];
    const backendOfficeRoles = ['Operations Admin', 'Operations Manager', 'Development Manager', 'Development Executive', 'Recruitment Manager', 'Recruitment Team'];
    
    const [formData, setFormData] = useState({});
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // This effect pre-fills the form when editing a user.
    useEffect(() => {
        if (isOpen) {
            setFormData({
                displayName: userToEdit?.displayName || '',
                username: userToEdit?.username || '',
                password: '', // Password is not pre-filled for security
                userRole: userToEdit?.userRole || 'Standard User',
                backendOfficeRole: userToEdit?.backendOfficeRole || 'Recruitment Team',
            });
            setError(''); // Clear any previous errors
        }
    }, [userToEdit, isOpen]);

    const handleChange = (e) => setFormData(prev => ({ ...prev, [e.target.id]: e.target.value }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (!formData.displayName || !formData.username || (!userToEdit && !formData.password)) {
            return setError("Please fill in all required fields.");
        }
        if (!userToEdit && formData.password.length < 6) {
            return setError("Password must be at least 6 characters long for new users.");
        }
        setLoading(true);
        try {
            await onSave(formData);
            onClose(); // Close the modal on successful save
        } catch (err) {
            setError(`Failed to save user: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={userToEdit ? "Edit User" : "Add New User"} size="lg">
            {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="displayName" className="block text-sm font-medium text-gray-700">Display Name</label>
                    <input type="text" id="displayName" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" value={formData.displayName || ''} onChange={handleChange} required />
                </div>
                <div>
                    <label htmlFor="username" className="block text-sm font-medium text-gray-700">Username (Email)</label>
                    <input type="email" id="username" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 bg-gray-100" value={formData.username || ''} onChange={handleChange} required disabled={!!userToEdit} />
                </div>
                {!userToEdit && (
                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
                        <input type="password" id="password" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" value={formData.password || ''} onChange={handleChange} required={!userToEdit} />
                        <p className="mt-1 text-sm text-gray-500">Password must be at least 6 characters.</p>
                    </div>
                )}
                <div>
                    <label htmlFor="userRole" className="block text-sm font-medium text-gray-700">User Role</label>
                    <select id="userRole" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" value={formData.userRole || ''} onChange={handleChange} required>
                        {userRoles.map(role => <option key={role} value={role}>{role}</option>)}
                    </select>
                </div>
                <div>
                    <label htmlFor="backendOfficeRole" className="block text-sm font-medium text-gray-700">Backend Office Role</label>
                    <select id="backendOfficeRole" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" value={formData.backendOfficeRole || ''} onChange={handleChange} required>
                        {backendOfficeRoles.map(role => <option key={role} value={role}>{role}</option>)}
                    </select>
                </div>
                <div className="flex justify-end space-x-2 pt-4">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Cancel</button>
                    <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 flex items-center justify-center w-28" disabled={loading}>
                        {loading ? <Spinner size="5" /> : 'Save User'}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default UserFormModal;