import React, { useState, useEffect } from 'react';
import Modal from '../Modal.jsx';
import Spinner from '../Spinner.jsx';
import { 
    ShieldCheck, 
    ShieldAlert, 
    Check, 
    Lock, 
    User, 
    Settings2, 
    Briefcase,
    MessageSquare,
    Clock,
    FileSignature,
    Calendar,
    Search,
    ChevronRight
} from 'lucide-react';

// --- Modern Permission Card Component ---
const PermissionCard = ({ allowed, onChange, disabled, label, description }) => {
    return (
        <div 
            onClick={!disabled ? onChange : undefined}
            className={`
                group relative flex items-start gap-3 p-4 rounded-2xl border transition-all duration-300
                ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer active:scale-[0.98]'}
                ${allowed 
                    ? 'bg-indigo-50/50 border-indigo-200 shadow-sm ring-1 ring-indigo-100' 
                    : 'bg-white border-slate-100 hover:border-slate-300 hover:shadow-md'}
            `}
        >
            <div className="flex-1">
                <div className="flex items-center gap-1.5">
                    <p className={`text-sm font-bold tracking-tight ${allowed ? 'text-indigo-900' : 'text-slate-700'}`}>
                        {label}
                    </p>
                    {disabled && <Lock className="w-3 h-3 text-slate-400" />}
                </div>
                {description && (
                    <p className="text-xs text-slate-500 mt-1 leading-normal group-hover:text-slate-600">
                        {description}
                    </p>
                )}
            </div>
            
            {/* Custom Toggle Switch */}
            <div className={`
                relative h-6 w-11 rounded-full transition-colors duration-300 shrink-0
                ${allowed ? 'bg-indigo-600' : 'bg-slate-200'}
            `}>
                <div className={`
                    absolute top-1 left-1 h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-300
                    ${allowed ? 'translate-x-5' : 'translate-x-0'}
                `} />
            </div>
        </div>
    );
};

const EditPermissionsModal = ({ isOpen, onClose, userToEdit, onSave, permissionKeys, currentUsername }) => {
    const [currentPermissions, setCurrentPermissions] = useState({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (userToEdit?.permissions && permissionKeys) {
            const initialPerms = permissionKeys.reduce((acc, p) => {
                acc[p.key] = Boolean(userToEdit.permissions[p.key]);
                return acc;
            }, {});
            setCurrentPermissions(initialPerms);
        }
        setError('');
    }, [isOpen, userToEdit, permissionKeys]);

    const handleToggle = (permissionKey) => {
        if (userToEdit?.username === currentUsername && permissionKey === 'canEditUsers' && currentPermissions[permissionKey]) {
            setError("Security: You cannot revoke your own administrative access.");
            return;
        }
        setCurrentPermissions(prev => ({ ...prev, [permissionKey]: !prev[permissionKey] }));
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
            await onSave(userToEdit.username, permissionsPayload);
            onClose();
        } catch (err) {
            setError(err.message || "Failed to update permissions.");
        } finally {
            setLoading(false);
        }
    };

    if (!userToEdit || !permissionKeys) return null;

    // --- Modern Grouping with Icons ---
    const groups = [
        { title: "Platform Core", icon: <Settings2 size={16} />, keys: ['canViewDashboards', 'canAddPosting', 'canEditDashboard', 'canViewReports', 'canEmailReports'] },
        { title: "Talent & Pipeline", icon: <Briefcase size={16} />, keys: ['canViewCandidates'] },
        { title: "Communications", icon: <MessageSquare size={16} />, keys: ['canMessage'] },
        { title: "Time Tracking", icon: <Clock size={16} />, keys: ['canManageTimesheets', 'canRequestTimesheetApproval'] },
        { title: "Documents", icon: <FileSignature size={16} />, keys: ['canManageMSAWO', 'canManageOfferLetters'] },
        { title: "HR & Attendance", icon: <Calendar size={16} />, keys: ['canManageHolidays', 'canApproveLeave', 'canManageLeaveConfig', 'canRequestLeave', 'canApproveAttendance', 'canSendMonthlyReport'] },
        { title: "Administration", icon: <ShieldCheck size={16} />, keys: ['canEditUsers'] },
    ];

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Access Management" size="3xl">
            {/* Header: Profile Card */}
            <div className="relative mb-8 p-5 rounded-2xl bg-slate-900 text-white overflow-hidden shadow-xl shadow-slate-200">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                    <ShieldCheck size={120} />
                </div>
                <div className="relative flex items-center gap-5">
                    <div className="h-16 w-16 rounded-2xl bg-indigo-500 flex items-center justify-center text-2xl font-bold shadow-lg ring-4 ring-white/10">
                        {userToEdit.displayName?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <h3 className="text-xl font-bold tracking-tight">{userToEdit.displayName}</h3>
                        <p className="text-indigo-200 text-sm font-medium">{userToEdit.username}</p>
                        <div className="mt-2 flex gap-2">
                             <span className="px-2 py-0.5 rounded-md bg-white/10 text-[10px] font-black uppercase tracking-widest border border-white/10">
                                {Object.values(currentPermissions).filter(Boolean).length} Enabled Rights
                             </span>
                        </div>
                    </div>
                </div>
            </div>

            {error && (
                <div className="mb-6 bg-rose-50 border-l-4 border-rose-500 p-4 rounded-r-xl flex items-center gap-3 animate-in slide-in-from-left-2">
                    <ShieldAlert className="w-5 h-5 text-rose-600" />
                    <p className="text-sm font-semibold text-rose-800">{error}</p>
                </div>
            )}

            {/* Scrollable Permissions Area */}
            <div className="space-y-10 max-h-[50vh] overflow-y-auto px-1 custom-scrollbar">
                {groups.map((group, idx) => {
                    const groupPerms = permissionKeys.filter(p => group.keys.includes(p.key));
                    if (groupPerms.length === 0) return null;

                    return (
                        <div key={idx} className="space-y-4">
                            <div className="flex items-center gap-2">
                                <span className="p-1.5 bg-slate-100 rounded-lg text-slate-600">
                                    {group.icon}
                                </span>
                                <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">
                                    {group.title}
                                </h4>
                                <div className="flex-1 h-px bg-slate-100" />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {groupPerms.map(p => (
                                    <PermissionCard
                                        key={p.key}
                                        label={p.name}
                                        description={p.description}
                                        allowed={currentPermissions[p.key]}
                                        onChange={() => handleToggle(p.key)}
                                        disabled={loading || (userToEdit.username === currentUsername && p.key === 'canEditUsers')}
                                    />
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Sticky Footer Actions */}
            <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-100 bg-white">
                <button
                    onClick={onClose}
                    className="px-6 py-2.5 text-slate-500 font-bold hover:text-slate-800 transition-colors"
                    disabled={loading}
                >
                    Cancel
                </button>
                <div className="flex gap-3">
                    <button
                        onClick={handleSaveChanges}
                        disabled={loading}
                        className="px-8 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all flex items-center gap-2 disabled:opacity-70 active:scale-95"
                    >
                        {loading ? <Spinner size="4" color="white" /> : <Check size={18} />}
                        {loading ? 'Saving Changes...' : 'Save Permissions'}
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default EditPermissionsModal;