import React, { useState, useEffect } from 'react';
// --- FIX: Reverted to standard relative paths ---
import Modal from '../Modal.jsx'; // Go up one level from 'admin' to 'components'
import Spinner from '../Spinner.jsx'; // Go up one level from 'admin' to 'components'
// --- End FIX ---

// Enhanced Permission Toggle Component
const PermissionToggle = ({ allowed, onChange, disabled, label, description }) => {
    const baseClasses = "relative inline-flex items-center h-6 rounded-full w-11 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed";
    const allowedClasses = "bg-indigo-600";
    const deniedClasses = "bg-gray-300";
    const knobBaseClasses = "inline-block w-4 h-4 transform bg-white rounded-full transition-transform";
    const knobAllowedClasses = "translate-x-6";
    const knobDeniedClasses = "translate-x-1";

    return (
        <div className="flex items-center justify-between py-3 px-1 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 rounded-md transition-colors duration-150">
            <div>
                <span className="text-sm font-medium text-gray-800">{label}</span>
                {description && <p className="text-xs text-gray-500">{description}</p>}
            </div>
            <button
                type="button"
                onClick={onChange}
                disabled={disabled}
                className={`${baseClasses} ${allowed ? allowedClasses : deniedClasses}`}
                aria-pressed={allowed}
                aria-label={label}
                title={disabled ? "Cannot change this permission for yourself" : (allowed ? `Revoke ${label}` : `Grant ${label}`)}
            >
                <span className={`${knobBaseClasses} ${allowed ? knobAllowedClasses : knobDeniedClasses}`} />
            </button>
        </div>
    );
};


const EditPermissionsModal = ({ isOpen, onClose, userToEdit, onSave, permissionKeys, currentUsername }) => {
    const [currentPermissions, setCurrentPermissions] = useState({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        // Initialize local state when modal opens or user changes
        if (userToEdit?.permissions && permissionKeys) { // Added check for permissionKeys
            // Ensure all keys from permissionKeys exist, defaulting to false
            const initialPerms = permissionKeys.reduce((acc, p) => {
                acc[p.key] = Boolean(userToEdit.permissions[p.key]); // Ensure boolean
                return acc;
            }, {});
             setCurrentPermissions(initialPerms);
        } else if (permissionKeys) { // Added check for permissionKeys
             // Initialize with all false if no permissions object exists
            const initialPerms = permissionKeys.reduce((acc, p) => {
                acc[p.key] = false;
                return acc;
            }, {});
            setCurrentPermissions(initialPerms);
        } else {
             // Fallback if permissionKeys itself is not ready
             setCurrentPermissions({});
        }
        setError(''); // Reset error on open/user change
    }, [isOpen, userToEdit, permissionKeys]);

    const handleToggle = (permissionKey) => {
        // Prevent self-lockout for 'canEditUsers'
        if (userToEdit?.username === currentUsername && permissionKey === 'canEditUsers' && currentPermissions[permissionKey]) {
            setError("You cannot revoke your own 'Edit Users & Permissions' right.");
            setTimeout(() => setError(''), 4000); // Clear error after a delay
            return;
        }
        setCurrentPermissions(prev => ({
            ...prev,
            [permissionKey]: !prev[permissionKey]
        }));
         setError(''); // Clear error on successful toggle
    };

    const handleSaveChanges = async () => {
        setLoading(true);
        setError('');
        try {
            // Payload construction needs to ensure all keys defined in permissionKeys are present
            const permissionsPayload = permissionKeys.reduce((acc, p) => {
                acc[p.key] = Boolean(currentPermissions[p.key]); // Ensure boolean value
                return acc;
            }, {});

             // Double-check self-lockout before sending API request
             if (userToEdit?.username === currentUsername && permissionsPayload.canEditUsers === false) {
                 throw new Error("Safety check failed: Cannot revoke own administrative permissions.");
             }

            await onSave(userToEdit.username, permissionsPayload);
            onClose(); // Close modal on success
        } catch (err) {
            setError(err.message || "Failed to save permissions.");
        } finally {
            setLoading(false);
        }
    };

    if (!userToEdit || !permissionKeys) return null; // Added check for permissionKeys

     // Group permissions for better organization (optional, adjust as needed)
     // *** MODIFIED: Include new permissions in relevant groups ***
     const corePermissions = permissionKeys.filter(p => ['canViewDashboards', 'canAddPosting', 'canEditDashboard', 'canViewReports', 'canEmailReports'].includes(p.key));
     const candidatePermissions = permissionKeys.filter(p => ['canViewCandidates'].includes(p.key));
     const communicationPermissions = permissionKeys.filter(p => ['canMessage'].includes(p.key));
     const timesheetPermissions = permissionKeys.filter(p => ['canManageTimesheets', 'canRequestTimesheetApproval'].includes(p.key));
     const esignPermissions = permissionKeys.filter(p => ['canManageMSAWO', 'canManageOfferLetters'].includes(p.key));
     // Added canApproveAttendance, canSendMonthlyReport to this group
     const attendanceLeavePermissions = permissionKeys.filter(p => [
         'canManageHolidays',
         'canApproveLeave',
         'canManageLeaveConfig',
         'canRequestLeave',
         'canApproveAttendance', // Added
         'canSendMonthlyReport' // Added
        ].includes(p.key));
     const adminPermissions = permissionKeys.filter(p => ['canEditUsers'].includes(p.key));


    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Permissions for ${userToEdit.displayName}`} size="2xl">
            {/* User Info Header */}
             <div className="p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-t-lg mb-4 border-b border-indigo-200 flex items-center space-x-3">
                 <span className="w-10 h-10 rounded-full bg-indigo-200 flex items-center justify-center font-bold text-indigo-700 text-xl flex-shrink-0">
                    {userToEdit.displayName?.charAt(0).toUpperCase() || '?'}
                </span>
                <div>
                     <p className="text-sm font-semibold text-gray-900">{userToEdit.displayName}</p>
                     <p className="text-xs text-gray-600">{userToEdit.username}</p>
                </div>
            </div>

            {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 animate-shake">{error}</div>}

            {/* Permissions List with Sections */}
            <div className="space-y-4 max-h-[60vh] overflow-y-auto px-4 py-2 custom-scrollbar">

                 {/* Render grouped permissions */}
                {[
                    { title: "Core Access", perms: corePermissions },
                    { title: "Candidate Management", perms: candidatePermissions },
                    { title: "Communication", perms: communicationPermissions },
                    { title: "Timesheets", perms: timesheetPermissions },
                    { title: "E-Signatures", perms: esignPermissions },
                    { title: "Attendance & Leave", perms: attendanceLeavePermissions },
                    { title: "Administration", perms: adminPermissions },
                ].map((group, index) => group.perms.length > 0 && (
                    <div key={index}>
                         <h4 className="text-xs font-bold uppercase text-gray-500 tracking-wider mb-1 mt-3">{group.title}</h4>
                        <div className="bg-gray-50 p-2 rounded-md border border-gray-200">
                             {group.perms.map(p => (
                                <PermissionToggle
                                    key={p.key}
                                    label={p.name}
                                    description={p.description} // Pass description
                                    // *** Safely access permission, default to false ***
                                    allowed={currentPermissions[p.key] === true}
                                    onChange={() => handleToggle(p.key)}
                                    disabled={loading || (userToEdit.username === currentUsername && p.key === 'canEditUsers')}
                                />
                            ))}
                        </div>
                    </div>
                ))}

            </div>

             {/* Action Buttons */}
            <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200">
                <button
                    type="button"
                    onClick={onClose}
                    className="px-5 py-2 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300 transition-colors shadow-sm disabled:opacity-50"
                    disabled={loading}
                >
                    Cancel
                </button>
                <button
                    type="button"
                    onClick={handleSaveChanges}
                    className="px-5 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 flex items-center justify-center w-32 transition-colors shadow-md disabled:bg-indigo-400"
                    disabled={loading}
                >
                    {loading ? <Spinner size="5" /> : 'Save Changes'}
                </button>
            </div>
        </Modal>
    );
};

export default EditPermissionsModal;