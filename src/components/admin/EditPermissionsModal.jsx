import React, { useState, useEffect, useMemo } from 'react';
import Modal from '../Modal.jsx';
import Spinner from '../Spinner.jsx';
import { 
    ShieldCheck, ShieldAlert, Check, Lock, 
    Settings, Users, Briefcase, MessageSquare, 
    Clock, FileSignature, Calendar, ChevronRight,
    UserCircle
} from 'lucide-react';

const EditPermissionsModal = ({ isOpen, onClose, userToEdit, onSave, permissionKeys, currentUsername }) => {
    const [currentPermissions, setCurrentPermissions] = useState({});
    const [activeTab, setActiveTab] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // --- Grouping Logic (Updated to include Bench Sales) ---
    const groups = useMemo(() => [
        { id: 'core', title: "Core Platform", icon: <Settings size={18} />, keys: ['canViewDashboards', 'canAddPosting', 'canEditDashboard', 'canViewReports', 'canEmailReports'] },
        // NEW: Added 'canManageBenchSales' to the Talent tab
        { id: 'talent', title: "Talent", icon: <Briefcase size={18} />, keys: ['canViewCandidates', 'canManageBenchSales'] },
        { id: 'comm', title: "Communication", icon: <MessageSquare size={18} />, keys: ['canMessage'] },
        { id: 'time', title: "Timesheets", icon: <Clock size={18} />, keys: ['canManageTimesheets', 'canRequestTimesheetApproval'] },
        { id: 'esign', title: "E-Signatures", icon: <FileSignature size={18} />, keys: ['canManageMSAWO', 'canManageOfferLetters'] },
        { id: 'hr', title: "Attendance & HR", icon: <Calendar size={18} />, keys: ['canManageHolidays', 'canApproveLeave', 'canManageLeaveConfig', 'canRequestLeave', 'canApproveAttendance', 'canSendMonthlyReport'] },
        { id: 'admin', title: "System", icon: <Lock size={18} />, keys: ['canEditUsers'] },
    ], []);

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

    // --- Toggle Handler with Safety Lock ---
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

    // --- Save Logic ---
    const handleSaveChanges = async () => {
        setLoading(true);
        setError('');
        try {
            const permissionsPayload = permissionKeys.reduce((acc, p) => {
                acc[p.key] = Boolean(currentPermissions[p.key]); 
                return acc;
            }, {});
            
            // Double-check safety logic
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

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="4xl" padding="p-0 overflow-hidden">
            <div className="flex h-[80vh] bg-white">
                
                {/* --- Sidebar Navigation --- */}
                <div className="w-72 bg-slate-50 border-r border-slate-100 flex flex-col p-6">
                    <div className="flex items-center gap-3 mb-8 p-2 bg-white rounded-2xl shadow-sm border border-slate-100">
                        <div className="h-10 w-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold shadow-indigo-100 shadow-lg shrink-0">
                            {userToEdit.displayName?.charAt(0).toUpperCase() || '?'}
                        </div>
                        <div className="min-w-0">
                            <h3 className="text-sm font-bold text-slate-900 truncate">{userToEdit.displayName}</h3>
                            <p className="text-[11px] text-slate-500 font-medium truncate">{userToEdit.username}</p>
                        </div>
                    </div>

                    <nav className="flex-1 space-y-1 overflow-y-auto">
                        {groups.map((group, idx) => (
                            <button
                                key={group.id}
                                onClick={() => setActiveTab(idx)}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                                    activeTab === idx 
                                    ? 'bg-slate-900 text-white shadow-lg shadow-slate-200' 
                                    : 'text-slate-500 hover:bg-slate-200/50 hover:text-slate-900'
                                }`}
                            >
                                <span className={activeTab === idx ? 'text-indigo-400' : 'text-slate-400'}>
                                    {group.icon}
                                </span>
                                <span className="text-xs font-bold uppercase tracking-wider">{group.title}</span>
                                {activeTab === idx && <ChevronRight size={14} className="ml-auto opacity-50" />}
                            </button>
                        ))}
                    </nav>

                    <div className="mt-6 p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100">
                        <div className="flex items-center gap-2 mb-2">
                            <ShieldCheck className="text-indigo-600" size={16} />
                            <span className="text-[10px] font-black uppercase tracking-widest text-indigo-700">System Integrity</span>
                        </div>
                        <p className="text-[10px] text-indigo-600/80 leading-relaxed font-medium">
                            Only authorized admins can modify these security parameters.
                        </p>
                    </div>
                </div>

                {/* --- Main Content Area --- */}
                <div className="flex-1 flex flex-col min-w-0 bg-white">
                    <header className="px-10 py-8 flex justify-between items-start">
                        <div>
                            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                                {groups[activeTab].title}
                            </h2>
                            <p className="text-sm text-slate-500 mt-1 font-medium">Configure access levels for this module.</p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                            <span className="px-3 py-1 bg-slate-100 rounded-full text-[10px] font-black uppercase tracking-tighter text-slate-600 border border-slate-200">
                                {Object.values(currentPermissions).filter(Boolean).length} Active Rights
                            </span>
                        </div>
                    </header>

                    {/* Permissions Card Grid */}
                    <div className="flex-1 overflow-y-auto px-10 pb-8 custom-scrollbar">
                        {error && (
                            <div className="mb-6 p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3 text-rose-600 animate-in fade-in slide-in-from-top-2">
                                <ShieldAlert size={18} />
                                <p className="text-xs font-bold">{error}</p>
                            </div>
                        )}

                        <div className="grid grid-cols-1 gap-3">
                            {permissionKeys
                                .filter(p => groups[activeTab].keys.includes(p.key))
                                .map(p => (
                                    <div 
                                        key={p.key}
                                        onClick={() => handleToggle(p.key)}
                                        className={`group flex items-center justify-between p-5 rounded-2xl border-2 transition-all duration-300 cursor-pointer ${
                                            currentPermissions[p.key] 
                                            ? 'border-indigo-600 bg-indigo-50/20' 
                                            : 'border-slate-50 bg-slate-50/30 hover:border-slate-200 hover:bg-white'
                                        }`}
                                    >
                                        <div className="pr-8">
                                            <h4 className={`text-sm font-bold mb-1 transition-colors ${currentPermissions[p.key] ? 'text-indigo-900' : 'text-slate-700'}`}>
                                                {p.name}
                                            </h4>
                                            <p className="text-xs text-slate-500 leading-normal max-w-md italic">
                                                {p.description || "Grants authorization for this specific platform action."}
                                            </p>
                                        </div>
                                        
                                        <div className={`
                                            w-14 h-7 rounded-full p-1 transition-colors duration-300 shrink-0
                                            ${currentPermissions[p.key] ? 'bg-indigo-600' : 'bg-slate-300'}
                                        `}>
                                            <div className={`bg-white w-5 h-5 rounded-full shadow-md transition-transform duration-300 ${currentPermissions[p.key] ? 'translate-x-7' : 'translate-x-0'}`} />
                                        </div>
                                    </div>
                                ))}
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="px-10 py-6 border-t border-slate-100 flex items-center justify-between">
                        <button 
                            onClick={onClose}
                            className="text-sm font-bold text-slate-400 hover:text-slate-900 transition-colors"
                        >
                            Discard Changes
                        </button>
                        <button 
                            onClick={handleSaveChanges}
                            disabled={loading}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-2xl text-sm font-bold shadow-xl shadow-indigo-100 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2"
                        >
                            {loading ? <Spinner size="4" color="white" /> : <Check size={18} />}
                            {loading ? 'Processing...' : 'Save Configuration'}
                        </button>
                    </div>
                </div>
            </div>
        </Modal>
    );
};

export default EditPermissionsModal;