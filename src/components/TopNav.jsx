import React, { useState, useEffect, useCallback, useRef, memo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom'; // ✅ Added for Routing
import { useAuth } from '../context/AuthContext';
import { usePermissions } from '../hooks/usePermissions';
import { apiService } from '../api/apiService';
import Dropdown, { useDropdown } from './Dropdown';

const DASHBOARD_CONFIGS = {
    'ecaltVMSDisplay': { title: 'Eclat VMS' },
    'taprootVMSDisplay': { title: 'Taproot VMS' },
    'michiganDisplay': { title: 'Michigan VMS' },
    'EclatTexasDisplay': { title: 'Eclat Texas VMS' },
    'TaprootTexasDisplay': { title: 'Taproot Texas VMS' },
    'VirtusaDisplay': { title: 'Virtusa Taproot' },
    'DeloitteDisplay': { title: 'Deloitte Taproot' }
};

const ChevronDownIcon = memo(({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m6 9 6 6 6-6"/></svg>
));

const BellIcon = memo(({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>
));

const NavButton = memo(({ label, target, isActive, onClick }) => {
    const baseClass = "px-3 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer select-none";
    const activeClass = "bg-slate-200 text-slate-900";
    const inactiveClass = "text-slate-500 hover:bg-slate-100 hover:text-slate-800";
    return (
        <button onClick={() => onClick(target)} className={`${baseClass} ${isActive ? activeClass : inactiveClass}`}>
            {label}
        </button>
    );
});

const DropdownItem = memo(({ label, target, onClick, isDestructive }) => {
    const { close } = useDropdown() || {};
    const handleClick = () => { onClick(target); if (close) close(); };
    return (
        <button onClick={handleClick} className={`w-full text-left block px-4 py-2.5 text-sm transition-colors ${isDestructive ? 'text-red-600 hover:bg-red-50' : 'text-slate-700 hover:bg-slate-50 hover:text-indigo-600'}`}>
            {label}
        </button>
    );
});

const TopNav = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate(); // ✅ Hook
    const location = useLocation(); // ✅ Hook
    
    const permissions = usePermissions();
    const [notifications, setNotifications] = useState([]);
    const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);

    // ✅ Logic: Checks browser URL to see if item is active
    const isPageActive = (target) => {
        const path = `/${target}`;
        if (Array.isArray(target)) return target.some(t => location.pathname === `/${t}`);
        return location.pathname === path;
    };

    // ✅ Logic: Triggers navigate hook
    const handleNav = useCallback((target) => {
        if (typeof target === 'function') {
            target(); // For logout()
        } else {
            // Remove leading slash if it exists to avoid //home
            const cleanPath = target.startsWith('/') ? target : `/${target}`;
            navigate(cleanPath);
        }
    }, [navigate]);

    const getLinkClass = (target) => {
        const base = "px-3 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer";
        const active = "bg-slate-200 text-slate-900";
        const inactive = "text-slate-500 hover:bg-slate-100 hover:text-slate-800";
        return `${base} ${isPageActive(target) ? active : inactive}`;
    };

    // ... (Keep your Notification/Message fetch logic exactly as it was) ...

    return (
        <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white shadow-sm">
            <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 h-16 flex justify-between items-center">
                <div className="flex items-center gap-8">
                    <div className="flex-shrink-0 flex items-center gap-2 cursor-pointer" onClick={() => handleNav('home')}>
                        <h1 className="text-2xl font-bold text-indigo-600">VMS Portal</h1>
                    </div>
                    <nav className="hidden lg:flex items-center gap-1">
                        <NavButton label="Home" target="home" isActive={isPageActive('home')} onClick={handleNav} />
                        <NavButton label="My Profile" target="profile" isActive={isPageActive('profile')} onClick={handleNav} />
                        
                        {permissions.canViewDashboards && (
                            <Dropdown trigger={<button className={`flex items-center gap-1 ${getLinkClass('dashboard')}`}>Dashboards <ChevronDownIcon className="text-slate-400" /></button>}>
                                {Object.entries(DASHBOARD_CONFIGS).map(([key, config]) => (
                                    <DropdownItem key={key} label={config.title} target={`/dashboard?key=${key}`} onClick={handleNav} />
                                ))}
                            </Dropdown>
                        )}
                        {permissions.canAddPosting && <NavButton label="New Posting" target="new-posting" isActive={isPageActive('new-posting')} onClick={handleNav} />}
                        {permissions.canViewCandidates && <NavButton label="Candidates" target="candidate-details" isActive={isPageActive('candidate-details')} onClick={handleNav} />}
                        {permissions.canManageBenchSales && <NavButton label="Bench Sales" target="bench-sales" isActive={isPageActive('bench-sales')} onClick={handleNav} />}
                        {permissions.canViewReports && <NavButton label="Reports" target="reports" isActive={isPageActive('reports')} onClick={handleNav} />}

                        {permissions.canManageTimesheets && (
                            <Dropdown trigger={<button className={`flex items-center gap-1 ${getLinkClass(['log-hours', 'timesheets-dashboard'])}`}>Timesheets <ChevronDownIcon className="text-slate-400" /></button>}>
                                <DropdownItem label="Log Hours" target="log-hours" onClick={handleNav} />
                                <DropdownItem label="Dashboard" target="timesheets-dashboard" onClick={handleNav} />
                            </Dropdown>
                        )}
                    </nav>
                </div>

                <div className="flex items-center gap-4">
                    {/* Preserved Notifications Dropdown */}
                    <Dropdown width="96" trigger={
                        <button className="relative p-2 text-slate-500 hover:text-indigo-600 transition-colors">
                            <BellIcon />
                            {notifications.length > 0 && <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-white">{notifications.length}</span>}
                        </button>
                    }>
                        <div className="w-96">
                            <div className="flex justify-between items-center p-3 border-b border-slate-100 bg-slate-50">
                                <h4 className="font-semibold text-slate-800 text-sm">Notifications</h4>
                                {notifications.length > 0 && <button onClick={handleMarkAsRead} className="text-xs font-medium text-indigo-600">Mark all read</button>}
                            </div>
                            <div className="max-h-[300px] overflow-y-auto">
                                {notifications.length > 0 ? notifications.map((n, idx) => (
                                    <div key={idx} className="p-3 border-b border-slate-50 hover:bg-slate-50">
                                        <p className="text-sm text-slate-700">{n.message}</p>
                                    </div>
                                )) : <div className="py-8 text-center text-slate-400">No new notifications</div>}
                            </div>
                        </div>
                    </Dropdown>

                    {/* Preserved Profile Dropdown */}
                    <Dropdown trigger={
                         <button className="flex items-center gap-3 hover:bg-slate-50 rounded-full pr-3 py-1 transition-all">
                            <div className="h-9 w-9 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold ring-2 ring-white">
                                {user?.userName ? user.userName.charAt(0).toUpperCase() : 'U'}
                            </div>
                            <ChevronDownIcon className="h-4 w-4 text-slate-400" />
                        </button>
                    }>
                        <div className="w-56 py-1">
                            <div className="px-4 py-2 border-b border-slate-100 mb-1">
                                <p className="text-sm font-bold text-slate-900">{user?.userName}</p>
                                <p className="text-[10px] text-slate-400 uppercase tracking-widest">{user?.backendOfficeRole}</p>
                            </div>
                            <DropdownItem label="My Profile" target="profile" onClick={handleNav} />
                            <DropdownItem label="Sign Out" target={logout} onClick={handleNav} isDestructive />
                        </div>
                    </Dropdown>
                </div>
            </div>
        </header>
    );
};

export default memo(TopNav);