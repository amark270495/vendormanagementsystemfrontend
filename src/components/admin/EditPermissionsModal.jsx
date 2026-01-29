import React, { useState, useEffect } from 'react';
import Modal from '../Modal.jsx';
import Spinner from '../Spinner.jsx';
import { ShieldCheck, ShieldAlert, Check, X } from 'lucide-react'; // Ensure lucide-react is installed

// --- Enhanced Toggle Component ---
const PermissionToggle = ({ allowed, onChange, disabled, label, description }) => {
    return (
        <div className={`
            flex items-center justify-between p-3 rounded-lg border border-transparent transition-all duration-200
            ${allowed ? 'bg-indigo-50/50 border-indigo-100' : 'hover:bg-slate-50 border-slate-50'}
        `}>
            <div className="flex-1 pr-4">
                <p className={`text-sm font-semibold ${allowed ? 'text-indigo-900' : 'text-slate-700'}`}>
                    {label}
                </p>
                {description && (
                    <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                        {description}
                    </p>
                )}
            </div>
            
            <button
                type="button"
                onClick={onChange}
                disabled={disabled}
                className={`
                    relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent 
                    transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2
                    ${allowed ? 'bg-indigo-600' : 'bg-slate-200'}
                    ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
                `}
                role="switch"
                aria-checked={allowed}
            >
                <span
                    aria-hidden="true"
                    className={`
                        pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 
                        transition duration-200 ease-in-out
                        ${allowed ? 'translate-x-5' : 'translate-x-0'}
                    `}
                />
            </button>
        </div>
    );
};

const EditPermissionsModal = ({ isOpen, onClose, userToEdit, onSave, permissionKeys, currentUsername }) => {
    const [currentPermissions, setCurrentPermissions] = useState({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // --- Initialization Logic ---
    useEffect(() => {
        if (userToEdit?.permissions && permissionKeys) { 
            const initialPerms = permissionKeys.reduce((acc, p) => {
                acc[p.key] = Boolean(userToEdit.permissions[p.key]); 
                return acc;
            }, {});
            setCurrentPermissions(initialPerms);
        } else if (permissionKeys) {
            const initialPerms = permissionKeys.reduce((acc, p) => {
                acc[p.key] = false;
                return acc;
            }, {});
            setCurrentPermissions(initialPerms);
        } else {
            setCurrentPermissions({});
        }
        setError('');
    }, [isOpen, userToEdit, permissionKeys]);

    // --- Handlers ---
    const handleToggle = (permissionKey) => {
        if (userToEdit?.username === currentUsername && permissionKey === 'canEditUsers' && currentPermissions[permissionKey]) {
            setError("Safety Lock: You cannot revoke your own admin rights.");
            setTimeout(() => setError(''), 3000);
            return;
        }

        setCurrentPermissions(prev => ({
            ...prev,
            [permissionKey]: !prev[permissionKey]
        }));
        setError('');
    };

    const handleSaveChanges = async () => {
        setLoading(true);
        setError('');
        try {
            const permissionsPayload = permissionKeys.reduce((acc, p) => {
                acc[p.key] = Boolean(currentPermissions[p.key]); 
                return acc;
            }, {});
            
            if (userToEdit?.username === currentUsername && permissionsPayload.canEditUsers === false) {
                 throw new Error("Safety check failed: Cannot revoke own administrative permissions.");
            }

            await onSave(userToEdit.username, permissionsPayload);
            onClose();
        } catch (err) {
            setError(err.message || "Failed to save permissions.");
        } finally {
            setLoading(false);
        }
    };

    if (!userToEdit || !permissionKeys) return null;

    // --- Grouping Logic ---
    const groups = [
        { title: "Core Platform", keys: ['canViewDashboards', 'canAddPosting', 'canEditDashboard', 'canViewReports', 'canEmailReports'] },
        { title: "Talent Management", keys: ['canViewCandidates'] },
        { title: "Communication", keys: ['canMessage'] },
        { title: "Timesheets", keys: ['canManageTimesheets', 'canRequestTimesheetApproval'] },
        { title: "E-Signatures", keys: ['canManageMSAWO', 'canManageOfferLetters'] },
        { title: "Attendance & HR", keys: ['canManageHolidays', 'canApproveLeave', 'canManageLeaveConfig', 'canRequestLeave', 'canApproveAttendance', 'canSendMonthlyReport'] },
        { title: "System Administration", keys: ['canEditUsers'] },
    ];

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Access Control" size="2xl">
            
            {/* Header: User Profile */}
            <div className="flex items-center gap-4 p-1 mb-6">
                <div className="h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 text-lg font-bold border-2 border-white shadow-sm ring-1 ring-indigo-50">
                    {userToEdit.displayName?.charAt(0).toUpperCase() || '?'}
                </div>
                <div>
                    <h3 className="text-lg font-bold text-slate-900">{userToEdit.displayName}</h3>
                    <p className="text-sm text-slate-500 font-medium">{userToEdit.username}</p>
                </div>
                <div className="ml-auto">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600">
                        <ShieldCheck className="w-3 h-3" />
                        {Object.values(currentPermissions).filter(Boolean).length} Active Rights
                    </span>
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <div className="mb-4 bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-lg flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                    <ShieldAlert className="w-5 h-5 flex-shrink-0" />
                    <p className="text-sm font-medium">{error}</p>
                </div>
            )}

            {/* Scrollable Permissions List */}
            <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                {groups.map((group, idx) => {
                    // Filter keys for this group
                    const groupPerms = permissionKeys.filter(p => group.keys.includes(p.key));
                    if (groupPerms.length === 0) return null;

                    return (
                        <div key={idx}>
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 ml-1">
                                {group.title}
                            </h4>
                            <div className="grid gap-2">
                                {groupPerms.map(p => (
                                    <PermissionToggle
                                        key={p.key}
                                        label={p.name}
                                        description={p.description}
                                        allowed={currentPermissions[p.key] === true}
                                        onChange={() => handleToggle(p.key)}
                                        disabled={loading || (userToEdit.username === currentUsername && p.key === 'canEditUsers')}
                                    />
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Footer Actions */}
            <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-slate-100">
                <button
                    type="button"
                    onClick={onClose}
                    className="px-5 py-2.5 text-slate-600 font-semibold hover:bg-slate-50 rounded-xl transition-colors"
                    disabled={loading}
                >
                    Cancel
                </button>
                <button
                    type="button"
                    onClick={handleSaveChanges}
                    disabled={loading}
                    className="px-6 py-2.5 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all flex items-center gap-2 disabled:opacity-70"
                >
                    {loading ? (
                        <>
                            <Spinner size="4" color="white" />
                            <span>Saving...</span>
                        </>
                    ) : (
                        <>
                            <Check className="w-4 h-4" />
                            <span>Save Changes</span>
                        </>
                    )}
                </button>
            </div>
        </Modal>
    );
};

export default EditPermissionsModal;