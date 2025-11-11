import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import Spinner from './Spinner';

const UserFormModal = ({ isOpen, onClose, onSave, userToEdit }) => {
    // These roles should match your backend configuration
    const userRoles = ['Admin', 'Standard User', 'Data Entry', 'Data Viewer', 'Data Entry & Viewer', 'Director'];
    const backendOfficeRoles = ['Operations Admin', 'Operations Manager', 'Development Manager', 'Development Executive', 'Recruitment Manager', 'Recruitment Team', 'Taproot Director'];
    
    // --- UPDATED: Expanded formData state ---
    const [formData, setFormData] = useState({
        username: '',
        firstName: '',
        middleName: '',
        lastName: '',
        dateOfBirth: '',
        dateOfJoining: '',
        password: '',
        userRole: 'Standard User',
        backendOfficeRole: 'Recruitment Team',
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // This effect pre-fills the form when editing a user.
    useEffect(() => {
        if (isOpen) {
            // --- UPDATED: Pre-fill new fields from userToEdit ---
            setFormData({
                username: userToEdit?.username || '',
                firstName: userToEdit?.firstName || '',
                middleName: userToEdit?.middleName || '',
                lastName: userToEdit?.lastName || '',
                // Format dates for the date input (YYYY-MM-DD)
                dateOfBirth: userToEdit?.dateOfBirth ? userToEdit.dateOfBirth.split('T')[0] : '',
                dateOfJoining: userToEdit?.dateOfJoining ? userToEdit.dateOfJoining.split('T')[0] : '',
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
        
        // --- UPDATED: Validation for new fields ---
        if (!formData.username || !formData.firstName || !formData.lastName || !formData.dateOfBirth || !formData.dateOfJoining) {
            return setError("Please fill in all required fields (email, name, DOB, DOJ).");
        }
        if (!userToEdit && !formData.password) {
            return setError("Password is required for new users.");
        }
        if (!userToEdit && formData.password.length < 6) {
            return setError("Password must be at least 6 characters long for new users.");
        }
        
        setLoading(true);
        try {
            // onSave will send the entire formData object
            await onSave(formData);
            onClose(); // Close the modal on successful save
        } catch (err) {
            setError(`Failed to save user: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    // Helper to format date strings from YYYY-MM-DD to a readable format if needed (not used here, but good practice)
    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { timeZone: 'UTC' }); // Use UTC to avoid timezone shift
    };


    return (
        <Modal isOpen={isOpen} onClose={onClose} title={userToEdit ? "Edit User" : "Add New User"} size="2xl"> {/* Made modal larger */}
            {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}
            
            {/* --- UPDATED: Form layout with new fields --- */}
            <form onSubmit={handleSubmit} className="space-y-4">
                
                {/* --- Name Grid --- */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">First Name <span className="text-red-500">*</span></label>
                        <input type="text" id="firstName" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" value={formData.firstName || ''} onChange={handleChange} required />
                    </div>
                    <div>
                        <label htmlFor="middleName" className="block text-sm font-medium text-gray-700">Middle Name</label>
                        <input type="text" id="middleName" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" value={formData.middleName || ''} onChange={handleChange} />
                    </div>
                     <div>
                        <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">Last Name <span className="text-red-500">*</span></label>
                        <input type="text" id="lastName" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" value={formData.lastName || ''} onChange={handleChange} required />
                    </div>
                </div>

                {/* --- User/Pass Grid --- */}
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="username" className="block text-sm font-medium text-gray-700">Username (Email) <span className="text-red-500">*</span></label>
                        <input 
                            type="email" 
                            id="username" 
                            className={`mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 ${userToEdit ? 'bg-gray-100' : ''}`} 
                            value={formData.username || ''} 
                            onChange={handleChange} 
                            required 
                            disabled={!!userToEdit} // Disable editing username (RowKey) for existing users
                        />
                    </div>
                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                            {userToEdit ? "Set New Password (Optional)" : "Password *"}
                        </label>
                        <input 
                            type="password" 
                            id="password" 
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" 
                            value={formData.password || ''} 
                            onChange={handleChange} 
                            required={!userToEdit} // Only required for new users
                            placeholder={userToEdit ? "Leave blank to keep unchanged" : ""}
                        />
                         {!userToEdit && <p className="mt-1 text-xs text-gray-500">Must be at least 6 characters.</p>}
                    </div>
                </div>

                {/* --- Dates Grid --- */}
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-700">Date of Birth <span className="text-red-500">*</span></label>
                        <input type="date" id="dateOfBirth" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" value={formData.dateOfBirth || ''} onChange={handleChange} required />
                    </div>
                    <div>
                        <label htmlFor="dateOfJoining" className="block text-sm font-medium text-gray-700">Date of Joining <span className="text-red-500">*</span></label>
                        <input type="date" id="dateOfJoining" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" value={formData.dateOfJoining || ''} onChange={handleChange} required />
                    </div>
                </div>

                {/* --- Roles Grid --- */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="userRole" className="block text-sm font-medium text-gray-700">User Role</label>
                        <select id="userRole" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 h-[42px]" value={formData.userRole || ''} onChange={handleChange} required>
                            {userRoles.map(role => <option key={role} value={role}>{role}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="backendOfficeRole" className="block text-sm font-medium text-gray-700">Backend Office Role</label>
                        <select id="backendOfficeRole" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 h-[42px]" value={formData.backendOfficeRole || ''} onChange={handleChange} required>
                            {backendOfficeRoles.map(role => <option key={role} value={role}>{role}</option>)}
                        </select>
                    </div>
                </div>

                {/* --- Removed displayName input --- */}

                <div className="flex justify-end space-x-2 pt-4 border-t mt-6">
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