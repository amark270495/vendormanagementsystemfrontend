import React, { useState, useEffect, useCallback } from 'react';
import Modal from './Modal';
import Spinner from './Spinner';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../api/apiService';

const UserFormModal = ({ isOpen, onClose, onSave, userToEdit }) => {
    // Define all roles and employment types
    const userRoles = ['Admin', 'Standard User', 'Data Entry', 'Data Viewer', 'Data Entry & Viewer', 'Director'];
    const backendOfficeRoles = ['Operations Admin', 'Operations Manager', 'Development Manager', 'Development Executive', 'Recruitment Manager', 'Recruitment Team', 'Taproot Director'];
    const employmentTypes = ['Full-Time', 'Part-Time', 'Contractor (C2C)', 'Contractor (1099)'];
    const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
    const relations = ['Spouse', 'Parent', 'Sibling', 'Child', 'Other'];

    // --- State ---
    const [formData, setFormData] = useState({});
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [allUsers, setAllUsers] = useState([]); // For 'Reports To' dropdown
    const { user: currentUser } = useAuth(); // Get the currently logged-in user

    // --- Fetch Users for 'Reports To' Dropdown ---
    // This runs once when the modal is first opened
    useEffect(() => {
        if (isOpen && currentUser?.userIdentifier) {
            const fetchUsersForDropdown = async () => {
                try {
                    const response = await apiService.getUsers(currentUser.userIdentifier);
                    if (response.data.success) {
                        setAllUsers(response.data.users || []);
                    }
                } catch (err) {
                    console.error("Failed to fetch users for 'Reports To' dropdown:", err);
                    // Non-critical error, so we don't set the main error state
                }
            };
            fetchUsersForDropdown();
        }
    }, [isOpen, currentUser?.userIdentifier]); // Only re-run if modal opens

    // --- Initialize Form Data ---
    // This effect runs when the modal opens OR the userToEdit changes
    useEffect(() => {
        if (isOpen) {
            // Helper to format date for input field
            const formatDateForInput = (dateString) => {
                if (!dateString) return '';
                try {
                    const date = new Date(dateString);
                    // Adjust for timezone offset to get the correct YYYY-MM-DD
                    const userTimezoneOffset = date.getTimezoneOffset() * 60000;
                    const adjustedDate = new Date(date.getTime() + userTimezoneOffset);
                    return adjustedDate.toISOString().split('T')[0];
                } catch (e) { return ''; }
            };

            // Set form data from userToEdit (editing) or defaults (adding)
            setFormData({
                // Basic Info
                username: userToEdit?.username || '',
                password: '', // Always empty for security
                firstName: userToEdit?.firstName || '',
                lastName: userToEdit?.lastName || '',
                middleName: userToEdit?.middleName || '',
                dateOfBirth: formatDateForInput(userToEdit?.dateOfBirth),
                
                // Employment Info
                userRole: userToEdit?.userRole || 'Standard User',
                backendOfficeRole: userToEdit?.backendOfficeRole || 'Recruitment Team',
                employmentType: userToEdit?.employmentType || 'Full-Time',
                dateOfJoining: formatDateForInput(userToEdit?.dateOfJoining),
                workLocation: userToEdit?.workLocation || '',
                reportsTo: userToEdit?.reportsTo || '',

                // Contact Info
                personalMobileNumber: userToEdit?.personalMobileNumber || '',
                currentAddress: userToEdit?.currentAddress || '',
                linkedInProfile: userToEdit?.linkedInProfile || '',
                
                // Emergency Contact
                emergencyContactName: userToEdit?.emergencyContactName || '',
                emergencyContactPhone: userToEdit?.emergencyContactPhone || '',
                emergencyContactRelation: userToEdit?.emergencyContactRelation || 'Other',
                
                // Other
                bloodGroup: userToEdit?.bloodGroup || '',
            });
            setError(''); // Clear any previous errors
        }
    }, [userToEdit, isOpen]); // Re-run when modal opens or user changes

    const handleChange = (e) => setFormData(prev => ({ ...prev, [e.target.id]: e.target.value }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        
        // --- Validation ---
        if (!userToEdit && !formData.password) {
            return setError("Password is required for new users.");
        }
        if (formData.password && formData.password.length < 6) {
            return setError("Password must be at least 6 characters long.");
        }
        // Add other required field checks from your backend logic
        const requiredFields = [
            'username', 'firstName', 'lastName', 'dateOfBirth', 'dateOfJoining',
            'personalMobileNumber', 'currentAddress', 'emergencyContactName', 
            'emergencyContactPhone', 'emergencyContactRelation', 'employmentType', 'workLocation'
        ];
        const missingFields = requiredFields.filter(field => !formData[field]);
        if (missingFields.length > 0) {
            return setError(`Missing required fields: ${missingFields.join(', ')}.`);
        }
        // --- End Validation ---

        setLoading(true);
        try {
            await onSave(formData); // onSave (from parent) handles add vs update
            onClose(); // Close the modal on successful save
        } catch (err) {
            setError(`Failed to save user: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };
    
    // Helper to create a grouped section in the form
    const FormSection = ({ title, children }) => (
        <fieldset className="border border-gray-200 p-4 rounded-lg">
            <legend className="text-sm font-semibold text-indigo-600 px-2">{title}</legend>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                {children}
            </div>
        </fieldset>
    );

    // Helper for form inputs
    const FormInput = ({ id, label, type = 'text', required = false, fullWidth = false, children }) => (
        <div className={fullWidth ? 'md:col-span-2' : ''}>
            <label htmlFor={id} className="block text-sm font-medium text-gray-700">
                {label} {required && <span className="text-red-500">*</span>}
            </label>
            {children ? (
                children // Pass custom elements like <select>
            ) : (
                <input 
                    type={type} 
                    id={id}
                    name={id}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" 
                    value={formData[id] || ''} 
                    onChange={handleChange} 
                    required={required}
                    disabled={id === 'username' && !!userToEdit} // Disable username edit
                />
            )}
        </div>
    );


    return (
        <Modal isOpen={isOpen} onClose={onClose} title={userToEdit ? "Edit User" : "Add New User"} size="2xl">
            {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 animate-shake">{error}</div>}
            
            <form onSubmit={handleSubmit} className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
                
                <FormSection title="Basic Info">
                    <FormInput id="username" label="Username (Email)" type="email" required disabled={!!userToEdit}>
                         <input 
                            type="email" 
                            id="username"
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 disabled:bg-gray-100" 
                            value={formData.username || ''} 
                            onChange={handleChange} 
                            required
                            disabled={!!userToEdit} // Disable username editing
                        />
                    </FormInput>
                    <FormInput id="password" label={userToEdit ? "New Password (Optional)" : "Password"} type="password" required={!userToEdit}>
                         <input 
                            type="password" 
                            id="password"
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" 
                            value={formData.password || ''} 
                            onChange={handleChange} 
                            required={!userToEdit} // Required only for new user
                            placeholder={userToEdit ? "Leave blank to keep unchanged" : ""}
                        />
                    </FormInput>
                    <FormInput id="firstName" label="First Name" required />
                    <FormInput id="lastName" label="Last Name" required />
                    <FormInput id="middleName" label="Middle Name (Optional)" />
                    <FormInput id="dateOfBirth" label="Date of Birth" type="date" required />
                </FormSection>

                <FormSection title="Employment & Role">
                    <FormInput id="userRole" label="User Role" required>
                        <select id="userRole" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" value={formData.userRole || ''} onChange={handleChange} required>
                            {userRoles.map(role => <option key={role} value={role}>{role}</option>)}
                        </select>
                    </FormInput>
                    <FormInput id="backendOfficeRole" label="Backend Office Role" required>
                        <select id="backendOfficeRole" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" value={formData.backendOfficeRole || ''} onChange={handleChange} required>
                            {backendOfficeRoles.map(role => <option key={role} value={role}>{role}</option>)}
                        </select>
                    </FormInput>
                    <FormInput id="employmentType" label="Employment Type" required>
                        <select id="employmentType" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" value={formData.employmentType || ''} onChange={handleChange} required>
                            {employmentTypes.map(type => <option key={type} value={type}>{type}</option>)}
                        </select>
                    </FormInput>
                    <FormInput id="dateOfJoining" label="Date of Joining" type="date" required />
                    <FormInput id="workLocation" label="Work Location" required />
                    <FormInput id="reportsTo" label="Reports To (Manager)">
                        <select id="reportsTo" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" value={formData.reportsTo || ''} onChange={handleChange}>
                            <option value="">Select a Manager...</option>
                            {allUsers
                                .filter(u => u.username !== formData.username) // Can't report to self
                                .map(u => (
                                <option key={u.username} value={u.displayName}>{u.displayName} ({u.backendOfficeRole})</option>
                            ))}
                        </select>
                    </FormInput>
                </FormSection>

                <FormSection title="Contact & Personal Details">
                    <FormInput id="personalMobileNumber" label="Personal Mobile Number" type="tel" required />
                    <FormInput id="currentAddress" label="Current Address" required fullWidth>
                        <textarea id="currentAddress" rows="3" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" value={formData.currentAddress || ''} onChange={handleChange} required />
                    </FormInput>
                    <FormInput id="linkedInProfile" label="LinkedIn Profile URL (Optional)">
                         <input 
                            type="url" 
                            id="linkedInProfile"
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" 
                            value={formData.linkedInProfile || ''} 
                            onChange={handleChange} 
                            placeholder="https://linkedin.com/in/..."
                        />
                    </FormInput>
                    <FormInput id="bloodGroup" label="Blood Group (Optional)">
                        <select id="bloodGroup" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" value={formData.bloodGroup || ''} onChange={handleChange}>
                            <option value="">Select...</option>
                            {bloodGroups.map(group => <option key={group} value={group}>{group}</option>)}
                        </select>
                    </FormInput>
                </FormSection>

                <FormSection title="Emergency Contact">
                    <FormInput id="emergencyContactName" label="Contact Name" required />
                    <FormInput id="emergencyContactPhone" label="Contact Phone" type="tel" required />
                    <FormInput id="emergencyContactRelation" label="Relation" required>
                         <select id="emergencyContactRelation" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" value={formData.emergencyContactRelation || ''} onChange={handleChange} required>
                            {relations.map(rel => <option key={rel} value={rel}>{rel}</option>)}
                        </select>
                    </FormInput>
                </FormSection>

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