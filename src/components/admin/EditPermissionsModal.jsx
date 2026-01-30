import React, { useState, useEffect, useMemo } from 'react';
import Modal from '../Modal.jsx';
import Spinner from '../Spinner.jsx';
import { 
    ShieldCheck, ShieldAlert, Check, Lock, 
    Settings, Users, Briefcase, MessageSquare, 
    Clock, FileSignature, Calendar, ChevronRight
} from 'lucide-react';

const EditPermissionsModal = ({ isOpen, onClose, userToEdit, onSave, permissionKeys, currentUsername }) => {
    const [currentPermissions, setCurrentPermissions] = useState({});
    const [activeTab, setActiveTab] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const groups = useMemo(() => [
        { id: 'core', title: "Core", icon: <Settings size={18} />, keys: ['canViewDashboards', 'canAddPosting', 'canEditDashboard', 'canViewReports', 'canEmailReports'] },
        { id: 'hr', title: "HR", icon: <Users size={18} />, keys: ['canViewCandidates', 'canManageHolidays', 'canApproveLeave', 'canManageLeaveConfig', 'canRequestLeave', 'canApproveAttendance', 'canSendMonthlyReport'] },
        { id: 'ops', title: "Ops", icon: <Briefcase size={18} />, keys: ['canManageTimesheets', 'canRequestTimesheetApproval', 'canManageMSAWO', 'canManageOfferLetters', 'canMessage'] },
        { id: 'admin', title: "System", icon: <Lock size={18} />, keys: ['canEditUsers'] },
    ], []);

    useEffect(() => {
        if (userToEdit?.permissions && permissionKeys) {
            const initialPerms = permissionKeys.reduce((acc, p) => {
                acc[p.key] = Boolean(userToEdit.permissions[p.key]);
                return acc;
            }, {});
            setCurrentPermissions(initialPerms);
        }
    }, [isOpen, userToEdit, permissionKeys]);

    const handleToggle = (key) => {
        if (userToEdit?.username === currentUsername && key === 'canEditUsers' && currentPermissions[key]) {
            setError("Self-protection: Cannot revoke your own Admin rights.");
            return;
        }
        setCurrentPermissions(prev => ({ ...prev, [key]: !prev[key] }));
        setError('');
    };

    const activeCount = Object.values(currentPermissions).filter(Boolean).length;
    const totalCount = permissionKeys?.length || 0;
    const completionPercentage = Math.round((activeCount / totalCount) * 100);

    if (!userToEdit) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="4xl" padding="p-0 overflow-hidden">
            <div className="flex h-[75vh] bg-white">
                
                {/* --- Left Sidebar (Navigation) --- */}
                <div className="w-64 bg-slate-50 border-r border-slate-100 flex flex-col p-6">
                    <div className="mb-8">
                        <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-xl shadow-lg mb-4">
                            {userToEdit.displayName?.charAt(0).toUpperCase()}
                        </div>
                        <h3 className="font-bold text-slate-900 truncate">{userToEdit.displayName}</h3>
                        <p className="text-xs text-slate-500 font-medium truncate">{userToEdit.username}</p>
                    </div>

                    <nav className="flex-1 space-y-1">
                        {groups.map((group, idx) => (
                            <button
                                key={group.id}
                                onClick={() => setActiveTab(idx)}
                                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
                                    activeTab === idx 
                                    ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-slate-200 font-bold' 
                                    : 'text-slate-500 hover:bg-slate-100 font-medium'
                                }`}
                            >
                                <span className={activeTab === idx ? 'text-indigo-600' : 'text-slate-400'}>
                                    {group.icon}
                                </span>
                                <span className="text-sm">{group.title}</span>
                                {activeTab === idx && <ChevronRight size={14} className="ml-auto" />}
                            </button>
                        ))}
                    </nav>

                    {/* Progress Indicator */}
                    <div className="mt-auto pt-6 border-t border-slate-200">
                        <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                            <span>Access Level</span>
                            <span>{completionPercentage}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                            <div 
                                className="h-full bg-indigo-500 transition-all duration-500" 
                                style={{ width: `${completionPercentage}%` }}
                            />
                        </div>
                    </div>
                </div>

                {/* --- Right Content Area --- */}
                <div className="flex-1 flex flex-col min-w-0">
                    {/* Header */}
                    <header className="px-8 py-6 border-b border-slate-50 flex justify-between items-center">
                        <div>
                            <h2 className="text-xl font-black text-slate-900 tracking-tight">
                                {groups[activeTab].title} Permissions
                            </h2>
                            <p className="text-sm text-slate-500">Configure what this user can access.</p>
                        </div>
                        {error && (
                            <div className="animate-bounce flex items-center gap-2 px-3 py-1.5 bg-rose-50 text-rose-600 rounded-full text-xs font-bold border border-rose-100">
                                <ShieldAlert size={14} /> {error}
                            </div>
                        )}
                    </header>

                    {/* Permissions List */}
                    <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                        <div className="grid grid-cols-1 gap-4">
                            {permissionKeys
                                .filter(p => groups[activeTab].keys.includes(p.key))
                                .map(p => (
                                    <label 
                                        key={p.key}
                                        className={`group relative flex items-center justify-between p-5 rounded-2xl border-2 transition-all duration-200 cursor-pointer ${
                                            currentPermissions[p.key] 
                                            ? 'border-indigo-500 bg-indigo-50/30' 
                                            : 'border-slate-100 bg-white hover:border-slate-200'
                                        }`}
                                    >
                                        <div className="max-w-[80%]">
                                            <span className={`block text-sm font-bold mb-1 ${currentPermissions[p.key] ? 'text-indigo-900' : 'text-slate-800'}`}>
                                                {p.name}
                                            </span>
                                            <span className="block text-xs text-slate-500 leading-relaxed">
                                                {p.description || "Grants access to this specific module and its features."}
                                            </span>
                                        </div>
                                        
                                        <div className="relative inline-flex items-center cursor-pointer">
                                            <input 
                                                type="checkbox" 
                                                className="sr-only" 
                                                checked={!!currentPermissions[p.key]} 
                                                onChange={() => handleToggle(p.key)}
                                                disabled={loading}
                                            />
                                            <div className={`w-12 h-6 rounded-full transition-colors duration-300 ${currentPermissions[p.key] ? 'bg-indigo-600' : 'bg-slate-200'}`}>
                                                <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform duration-300 ${currentPermissions[p.key] ? 'translate-x-6' : ''}`} />
                                            </div>
                                        </div>
                                    </label>
                                ))}
                        </div>
                    </div>

                    {/* Footer */}
                    <footer className="p-6 bg-slate-50/50 border-t border-slate-100 flex justify-end gap-3">
                        <button 
                            onClick={onClose}
                            className="px-6 py-2 text-sm font-bold text-slate-500 hover:text-slate-800 transition-colors"
                        >
                            Discard
                        </button>
                        <button 
                            onClick={() => onSave(userToEdit.username, currentPermissions)}
                            disabled={loading}
                            className="px-8 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-black shadow-lg shadow-slate-200 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2"
                        >
                            {loading ? <Spinner size="4" /> : <Check size={16} />}
                            {loading ? 'Updating...' : 'Save Configuration'}
                        </button>
                    </footer>
                </div>
            </div>
        </Modal>
    );
};

export default EditPermissionsModal;