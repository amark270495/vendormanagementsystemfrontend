import React, { useState, useEffect, useCallback, useRef, memo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom'; 
import { Menu, X, LayoutDashboard } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { usePermissions } from '../hooks/usePermissions';
import { apiService } from '../api/apiService';
import Dropdown, { useDropdown } from './Dropdown';

// --- Static Config ---
const DASHBOARD_CONFIGS = {
    'ecaltVMSDisplay': { title: 'Eclat VMS' },
    'taprootVMSDisplay': { title: 'Taproot VMS' },
    'michiganDisplay': { title: 'Michigan VMS' },
    'EclatTexasDisplay': { title: 'Eclat Texas VMS' },
    'TaprootTexasDisplay': { title: 'Taproot Texas VMS' },
    'VirtusaDisplay': { title: 'Virtusa Taproot' },
    'DeloitteDisplay': { title: 'Deloitte Taproot' }
};

// --- Icons (Memoized) ---
const ChevronDownIcon = memo(({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m6 9 6 6 6-6"/></svg>
));

const BellIcon = memo(({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>
));

// --- NavButton (Upgraded for UI/UX) ---
const NavButton = memo(({ label, target, isActive, onClick }) => {
    const baseClass = "px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer select-none text-left";
    const activeClass = "bg-indigo-50 text-indigo-700";
    const inactiveClass = "text-slate-600 hover:bg-slate-50 hover:text-slate-900";

    return (
        <button 
            type="button"
            onClick={() => onClick(target)}
            className={`${baseClass} ${isActive ? activeClass : inactiveClass}`}
        >
            {label}
        </button>
    );
});

// --- DropdownItem (Upgraded for UI/UX) ---
const DropdownItem = memo(({ label, target, onClick, isDestructive }) => {
    const dropdownContext = useDropdown();
    const close = dropdownContext ? dropdownContext.close : null;

    const handleClick = () => {
        onClick(target); 
        if (close) close(); 
    };

    return (
        <button 
            type="button"
            onClick={handleClick} 
            className={`w-full text-left block px-4 py-2.5 text-sm transition-colors ${
                isDestructive 
                    ? 'text-rose-600 hover:bg-rose-50' 
                    : 'text-slate-700 hover:bg-slate-50 hover:text-indigo-600'
            }`}
        >
            {label}
        </button>
    );
});

const TopNav = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate(); 
    const location = useLocation(); 
    const permissions = usePermissions();

    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);

    const prevNotifLengthRef = useRef(0);
    const prevMsgCountRef = useRef(0);
    const audioRef = useRef(null);

    if (!user || !permissions) return null;

    const isPageActive = (target) => {
        if (Array.isArray(target)) {
            return target.some(t => location.pathname === `/${t.replace(/^\//, '')}`);
        }
        if (target === 'dashboard' && location.pathname === '/dashboard') return true;
        return location.pathname === `/${target.replace(/^\//, '')}`;
    };

    const handleNav = useCallback((target) => {
        setIsMobileMenuOpen(false); // ✅ Close mobile menu on click
        if (typeof target === 'function') {
            target(); 
        } else {
            const cleanPath = target.startsWith('/') ? target : `/${target}`;
            navigate(cleanPath);
        }
    }, [navigate]);

    const getLinkClass = (target) => {
        const base = "px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer";
        const active = "bg-indigo-50 text-indigo-700";
        const inactive = "text-slate-600 hover:bg-slate-50 hover:text-slate-900";
        return `${base} ${isPageActive(target) ? active : inactive}`;
    };

    useEffect(() => {
        audioRef.current = {
            notification: new Audio('/sounds/notification.mp3'),
            message: new Audio('/sounds/message.mp3')
        };
    }, []);

    const fetchNotifications = useCallback(async () => {
        if (!user?.userIdentifier) return;
        try {
            const response = await apiService.getNotifications(user.userIdentifier);
            const newNotifs = response?.data?.success ? (response.data.notifications || []) : [];
            if (newNotifs.length > prevNotifLengthRef.current && prevNotifLengthRef.current > 0) {
                if(audioRef.current?.notification) audioRef.current.notification.play().catch(() => {});
            }
            prevNotifLengthRef.current = newNotifs.length;
            setNotifications(newNotifs); 
        } catch (err) { console.error('Fetch notifications error', err); }
    }, [user?.userIdentifier]);

    const fetchUnreadMessages = useCallback(async () => {
        if (!user?.userIdentifier || !permissions.canMessage) return;
        try {
            const response = await apiService.getUnreadMessages(user.userIdentifier);
            if (response.data.success) {
                const count = Object.values(response.data.unreadCounts || {}).reduce((sum, c) => sum + c, 0);
                if (count > prevMsgCountRef.current && prevMsgCountRef.current > 0) {
                    if(audioRef.current?.message) audioRef.current.message.play().catch(() => {});
                }
                prevMsgCountRef.current = count;
                setUnreadMessagesCount(count);
            }
        } catch (err) { console.error('Fetch messages error', err); }
    }, [user?.userIdentifier, permissions.canMessage]);

    useEffect(() => {
        fetchNotifications();
        fetchUnreadMessages();
        const notifInterval = setInterval(fetchNotifications, 30000);
        const msgInterval = setInterval(fetchUnreadMessages, 15000);
        return () => { clearInterval(notifInterval); clearInterval(msgInterval); };
    }, [fetchNotifications, fetchUnreadMessages]);

    const handleMarkAsRead = async () => {
        if (notifications.length === 0) return;
        try {
            const idsToMark = notifications.map(n => ({ id: n.id, partitionKey: n.partitionKey }));
            setNotifications([]); 
            prevNotifLengthRef.current = 0;
            await apiService.markNotificationsAsRead(idsToMark, user.userIdentifier);
        } catch (err) { fetchNotifications(); }
    };

    const showAdminDropdown = permissions.canEditUsers || permissions.canManageHolidays || permissions.canApproveLeave || permissions.canManageLeaveConfig || permissions.canApproveAttendance || permissions.canSendMonthlyReport;
    const showAssetDropdown = permissions.canManageAssets || permissions.canAssignAssets;

    return (
        <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/80 backdrop-blur-md shadow-sm">
            <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    
                    {/* Left: Logo & Nav Links */}
                    <div className="flex items-center gap-6">
                        <div className="flex-shrink-0 flex items-center gap-2 cursor-pointer" onClick={() => handleNav('home')}>
                            <div className="h-8 w-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                                <LayoutDashboard className="h-5 w-5 text-white" />
                            </div>
                            <h1 className="text-xl font-bold text-slate-900 tracking-tight hidden sm:block">VMS Pro</h1>
                        </div>
                        
                        {/* Desktop Navigation */}
                        <nav className="hidden xl:flex items-center gap-1">
                            <NavButton label="Home" target="home" isActive={isPageActive('home')} onClick={handleNav} />
                            
                            {permissions.canViewDashboards && (
                                <Dropdown trigger={
                                    <button className={`flex items-center gap-1 ${getLinkClass('dashboard')}`}>
                                        Dashboards <ChevronDownIcon className="text-slate-400" />
                                    </button>
                                }>
                                    {Object.entries(DASHBOARD_CONFIGS).map(([key, config]) => (
                                        <DropdownItem key={key} label={config.title} target={`dashboard?key=${key}`} onClick={handleNav} />
                                    ))}
                                </Dropdown>
                            )}

                            {permissions.canAddPosting && <NavButton label="New Posting" target="new-posting" isActive={isPageActive('new-posting')} onClick={handleNav} />}
                            {permissions.canViewCandidates && <NavButton label="Candidates" target="candidate-details" isActive={isPageActive('candidate-details')} onClick={handleNav} />}
                            {permissions.canManageBenchSales && <NavButton label="Bench Sales" target="bench-sales" isActive={isPageActive('bench-sales')} onClick={handleNav} />}
                            {permissions.canViewReports && <NavButton label="Reports" target="reports" isActive={isPageActive('reports')} onClick={handleNav} />}

                            {permissions.canMessage && (
                                <button type="button" onClick={() => handleNav('messages')} className={`${getLinkClass('messages')} relative`}>
                                    Messages
                                    {unreadMessagesCount > 0 && (
                                        <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white ring-2 ring-white">
                                            {unreadMessagesCount}
                                        </span>
                                    )}
                                </button>
                            )}

                            {permissions.canManageTimesheets && (
                                <Dropdown trigger={
                                    <button className={`flex items-center gap-1 ${getLinkClass(['create-timesheet-company', 'manage-companies', 'log-hours', 'timesheets-dashboard'])}`}>
                                        Timesheets <ChevronDownIcon className="text-slate-400" />
                                    </button>
                                }>
                                    <DropdownItem label="Create Company" target="create-timesheet-company" onClick={handleNav} />
                                    <DropdownItem label="Manage Companies" target="manage-companies" onClick={handleNav} />
                                    <DropdownItem label="Create Employee" target="create-timesheet-employee" onClick={handleNav} />
                                    <DropdownItem label="Manage Employees" target="manage-timesheet-employees" onClick={handleNav} />
                                    <div className="border-t border-slate-100 my-1" />
                                    <DropdownItem label="Log Hours" target="log-hours" onClick={handleNav} />
                                    <DropdownItem label="Timesheets Dashboard" target="timesheets-dashboard" onClick={handleNav} />
                                </Dropdown>
                            )}

                            {showAssetDropdown && (
                                <Dropdown trigger={
                                    <button className={`flex items-center gap-1 ${getLinkClass(['create-asset', 'asset-dashboard'])}`}>
                                        Assets <ChevronDownIcon className="text-slate-400" />
                                    </button>
                                }>
                                    {permissions.canManageAssets && <DropdownItem label="Create Asset" target="create-asset" onClick={handleNav} />}
                                    <DropdownItem label="Asset Dashboard" target="asset-dashboard" onClick={handleNav} />
                                </Dropdown>
                            )}

                            {(permissions.canManageMSAWO || permissions.canManageOfferLetters) && (
                                <Dropdown trigger={
                                    <button className={`flex items-center gap-1 ${getLinkClass(['msa-wo-dashboard', 'offer-letter-dashboard'])}`}>
                                        E-Sign's <ChevronDownIcon className="text-slate-400" />
                                    </button>
                                }>
                                    {permissions.canManageMSAWO && (
                                        <>
                                            <div className="px-4 py-2 text-xs font-bold text-slate-400 uppercase bg-slate-50">MSA & WO</div>
                                            <DropdownItem label="Create Vendor" target="create-msa-wo-vendor-company" onClick={handleNav} />
                                            <DropdownItem label="Manage Vendors" target="manage-msa-wo-vendor-companies" onClick={handleNav} />
                                            <DropdownItem label="Create MSA/WO" target="create-msa-wo" onClick={handleNav} />
                                            <DropdownItem label="Dashboard" target="msa-wo-dashboard" onClick={handleNav} />
                                        </>
                                    )}
                                    {permissions.canManageOfferLetters && (
                                        <>
                                            <div className="border-t border-slate-100 my-1"></div>
                                            <div className="px-4 py-2 text-xs font-bold text-slate-400 uppercase bg-slate-50">Offer Letter</div>
                                            <DropdownItem label="Create Letter" target="create-offer-letter" onClick={handleNav} />
                                            <DropdownItem label="Dashboard" target="offer-letter-dashboard" onClick={handleNav} />
                                        </>
                                    )}
                                </Dropdown>
                            )}

                            {showAdminDropdown && (
                                <Dropdown trigger={
                                    <button className={`flex items-center gap-1 ${getLinkClass(['admin', 'manage-holidays', 'leave-config', 'approve-leave', 'approve-attendance', 'monthly-attendance-report'])}`}>
                                        Admin <ChevronDownIcon className="text-slate-400" />
                                    </button>
                                }>
                                    {permissions.canEditUsers && <DropdownItem label="User Management" target="admin" onClick={handleNav} />}
                                    <div className="border-t border-slate-100 my-1" />
                                    {permissions.canManageHolidays && <DropdownItem label="Manage Holidays" target="manage-holidays" onClick={handleNav} />}
                                    {permissions.canManageLeaveConfig && <DropdownItem label="Leave Config" target="leave-config" onClick={handleNav} />}
                                    {permissions.canApproveLeave && <DropdownItem label="Approve Leave" target="approve-leave" onClick={handleNav} />}
                                    {permissions.canApproveAttendance && <DropdownItem label="Approve Attendance" target="approve-attendance" onClick={handleNav} />}
                                    {permissions.canSendMonthlyReport && <DropdownItem label="Monthly Reports" target="monthly-attendance-report" onClick={handleNav} />}
                                </Dropdown>
                            )}
                        </nav>
                    </div>

                    {/* Right: Actions, Notifications & Profile */}
                    <div className="flex items-center gap-2 sm:gap-4">
                        
                        {/* Notifications */}
                        <Dropdown width="96" trigger={
                            <button type="button" className="relative p-2 text-slate-400 hover:bg-slate-50 hover:text-indigo-600 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500">
                                <BellIcon />
                                {notifications.length > 0 && (
                                    <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white ring-2 ring-white animate-pulse">
                                        {notifications.length}
                                    </span>
                                )}
                            </button>
                        }>
                            <div className="w-96 max-w-[100vw]">
                                <div className="flex justify-between items-center p-3 border-b border-slate-100 bg-slate-50 rounded-t-xl">
                                    <h4 className="font-semibold text-slate-800 text-sm">Notifications</h4>
                                    {notifications.length > 0 && <button onClick={handleMarkAsRead} className="text-xs font-medium text-indigo-600 hover:text-indigo-800">Mark all read</button>}
                                </div>
                                <div className="max-h-[300px] overflow-y-auto scrollbar-thin">
                                    {notifications.length > 0 ? notifications.map((n, idx) => (
                                        <div key={n.id || idx} className="p-3 border-b border-slate-50 hover:bg-slate-50 transition-colors">
                                            <p className="text-sm text-slate-700 leading-snug break-words">{n.message}</p>
                                            <p className="text-xs text-slate-400 mt-1">{new Date(n.timestamp).toLocaleString()}</p>
                                        </div>
                                    )) : <div className="py-8 text-center text-slate-400"><p className="text-sm">No new notifications</p></div>}
                                </div>
                            </div>
                        </Dropdown>

                        {/* Desktop Profile Dropdown */}
                        <div className="hidden sm:block">
                            <Dropdown width="64" trigger={
                                <button type="button" className="flex items-center gap-2 hover:bg-slate-50 rounded-full pr-3 py-1.5 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500">
                                    <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 border border-indigo-200 shadow-sm">
                                        <span className="text-sm font-bold">{user?.userName ? user.userName.charAt(0).toUpperCase() : 'U'}</span>
                                    </div>
                                    <div className="hidden md:flex flex-col items-start">
                                        <span className="text-sm font-semibold text-slate-700 leading-none">{user?.userName || 'User'}</span>
                                        <span className="text-xs text-slate-500 mt-0.5">{user?.userRole || 'Role'}</span>
                                    </div>
                                    <ChevronDownIcon className="h-4 w-4 text-slate-400 ml-1" />
                                </button>
                            }>
                                <div className="w-64">
                                    <div className="px-4 py-3 border-b border-slate-100 bg-slate-50 rounded-t-xl">
                                        <p className="text-sm font-bold text-slate-900 break-words">{user?.userName || 'User'}</p>
                                        <p className="text-xs text-slate-500 break-all">{user?.userIdentifier}</p>
                                    </div>
                                    <div className="py-1">
                                        <DropdownItem label="My Profile" target="profile" onClick={handleNav} />
                                    </div>
                                    <div className="border-t border-slate-100 py-1">
                                        <DropdownItem label="Sign out" target={logout} onClick={handleNav} isDestructive />
                                    </div>
                                </div>
                            </Dropdown>
                        </div>

                        {/* Mobile Hamburger Button */}
                        <div className="xl:hidden flex items-center ml-2">
                            <button
                                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                                className="inline-flex items-center justify-center p-2 rounded-md text-slate-400 hover:text-slate-500 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            >
                                {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile Menu Slide-down Panel */}
            {isMobileMenuOpen && (
                <div className="xl:hidden border-t border-slate-200 bg-white/95 backdrop-blur-md max-h-[80vh] overflow-y-auto shadow-lg">
                    <div className="pt-2 pb-4 space-y-1 px-4">
                        <NavButton label="Home" target="home" isActive={isPageActive('home')} onClick={handleNav} />
                        <NavButton label="My Profile" target="profile" isActive={isPageActive('profile')} onClick={handleNav} />
                        
                        {permissions.canViewDashboards && <div className="pt-4 pb-1"><p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Dashboards</p></div>}
                        {permissions.canViewDashboards && Object.entries(DASHBOARD_CONFIGS).map(([key, config]) => (
                            <NavButton key={key} label={config.title} target={`dashboard?key=${key}`} isActive={isPageActive(`dashboard?key=${key}`)} onClick={handleNav} />
                        ))}

                        <div className="pt-4 pb-1"><p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Workspace</p></div>
                        {permissions.canAddPosting && <NavButton label="New Posting" target="new-posting" isActive={isPageActive('new-posting')} onClick={handleNav} />}
                        {permissions.canViewCandidates && <NavButton label="Candidates" target="candidate-details" isActive={isPageActive('candidate-details')} onClick={handleNav} />}
                        {permissions.canManageBenchSales && <NavButton label="Bench Sales" target="bench-sales" isActive={isPageActive('bench-sales')} onClick={handleNav} />}
                        {permissions.canViewReports && <NavButton label="Reports" target="reports" isActive={isPageActive('reports')} onClick={handleNav} />}
                        {permissions.canMessage && <NavButton label="Messages" target="messages" isActive={isPageActive('messages')} onClick={handleNav} />}

                        {permissions.canManageTimesheets && <div className="pt-4 pb-1"><p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Timesheets</p></div>}
                        {permissions.canManageTimesheets && (
                            <>
                                <NavButton label="Timesheet Dashboard" target="timesheets-dashboard" isActive={isPageActive('timesheets-dashboard')} onClick={handleNav} />
                                <NavButton label="Manage Companies" target="manage-companies" isActive={isPageActive('manage-companies')} onClick={handleNav} />
                                <NavButton label="Log Hours" target="log-hours" isActive={isPageActive('log-hours')} onClick={handleNav} />
                            </>
                        )}

                        <div className="border-t border-slate-100 my-4"></div>
                        <button 
                            onClick={() => { setIsMobileMenuOpen(false); logout(); navigate('/login'); }} 
                            className="w-full text-left px-3 py-3 text-sm font-medium text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        >
                            Sign out
                        </button>
                    </div>
                </div>
            )}
        </header>
    );
};

export default memo(TopNav);