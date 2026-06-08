import React, { useState, useEffect, useCallback, useRef, memo, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom'; 
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
    'DeloitteDisplay': { title: 'Deloitte Taproot' },
    'tsiBdrDisplay': { title: 'TSI - BDM Openings' } 
};

const LOGO_URL = "https://vmsdashboardea.blob.core.windows.net/images/Company_logo.png?sp=r&st=2026-03-17T13:15:01Z&se=2027-12-30T21:30:01Z&sv=2024-11-04&sr=b&sig=dAq1%2Bxrcn0KMYfrH%2F9OtOfQUZNqrxdZvGwoNFZfcyFY%3D";

// --- Premium SVG Icons ---
const Icons = {
    ChevronDown: ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m6 9 6 6 6-6"/></svg>,
    Bell: ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>,
    Message: ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
    Search: ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>,
    Menu: ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></svg>,
    Close: ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><line x1="18" x2="6" y1="6" y2="18"/><line x1="6" x2="18" y1="6" y2="18"/></svg>
};

// --- NavButton ---
const NavButton = memo(({ label, target, isActive, onClick }) => {
    const baseClass = "px-3 py-2 rounded-lg text-[13px] font-bold transition-all duration-200 cursor-pointer select-none text-left whitespace-nowrap tracking-wide";
    const activeClass = "bg-blue-50 text-blue-700 shadow-sm";
    const inactiveClass = "text-slate-600 hover:bg-slate-100 hover:text-slate-900";

    return (
        <button type="button" onClick={() => onClick(target)} className={`${baseClass} ${isActive ? activeClass : inactiveClass}`}>
            {label}
        </button>
    );
});

// --- DropdownItem ---
const DropdownItem = memo(({ label, target, onClick, isDestructive }) => {
    const dropdownContext = useDropdown();
    const close = dropdownContext ? dropdownContext.close : null;

    const handleClick = () => { onClick(target); if (close) close(); };

    return (
        <button type="button" onClick={handleClick} className={`w-full text-left block px-4 py-2.5 text-[13px] font-bold rounded-lg transition-colors ${isDestructive ? 'text-red-600 hover:bg-red-50' : 'text-slate-600 hover:bg-slate-50 hover:text-blue-600'}`}>
            {label}
        </button>
    );
});

const TopNav = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate(); 
    const location = useLocation(); 
    const permissions = usePermissions();

    const [notifications, setNotifications] = useState([]);
    const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    
    // Search State
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearchFocused, setIsSearchFocused] = useState(false);
    const searchRef = useRef(null);

    const prevNotifLengthRef = useRef(0);
    const prevMsgCountRef = useRef(0);
    const audioRef = useRef(null);

    const isPageActive = (target) => {
        if (Array.isArray(target)) return target.some(t => location.pathname === `/${t.replace(/^\//, '')}`);
        return location.pathname === `/${target.replace(/^\//, '')}`;
    };

    const handleNav = useCallback((target) => {
        setIsMobileMenuOpen(false);
        setSearchQuery('');
        setIsSearchFocused(false);
        if (typeof target === 'function') { target(); } 
        else { navigate(target.startsWith('/') ? target : `/${target}`); }
    }, [navigate]);

    const getLinkClass = (target) => {
        const base = "px-3 py-2 rounded-lg text-[13px] font-bold transition-all duration-200 cursor-pointer whitespace-nowrap tracking-wide";
        const active = "bg-blue-50 text-blue-700 shadow-sm";
        const inactive = "text-slate-600 hover:bg-slate-100 hover:text-slate-900";
        return `${base} ${isPageActive(target) ? active : inactive}`;
    };

    useEffect(() => {
        audioRef.current = {
            notification: new Audio('/sounds/notification.mp3'),
            message: new Audio('/sounds/message.mp3')
        };
        
        const handleClickOutside = (event) => {
            if (searchRef.current && !searchRef.current.contains(event.target)) {
                setIsSearchFocused(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
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
        } catch (err) {}
    }, [user?.userIdentifier]);

    const fetchUnreadMessages = useCallback(async () => {
        if (!user?.userIdentifier || !permissions?.canMessage) return;
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
        } catch (err) {}
    }, [user?.userIdentifier, permissions?.canMessage]);

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

    if (!user || !permissions) return null;

    const canSeeAdmin = permissions.canAccessAdmin;
    const canSeeAssets = permissions.canAccessAssets;
    const canSeeDocs = permissions.canAccessDocs;

    // --- Search Engine Logic ---
    const searchableRoutes = useMemo(() => {
        const routes = [{ label: 'Home Dashboard', category: 'General', target: 'home' }];
        
        if (permissions.canViewDashboards) {
            Object.entries(DASHBOARD_CONFIGS).forEach(([key, config]) => {
                routes.push({ label: `${config.title} Board`, category: 'Dashboards', target: `dashboard?key=${key}` });
            });
        }
        
        if (permissions.canAddPosting) routes.push({ label: 'Create New Posting', category: 'Recruitment', target: 'new-posting' });
        if (permissions.canViewCandidates) routes.push({ label: 'View Candidates', category: 'Recruitment', target: 'candidate-details' });
        if (permissions.canManageBenchSales) routes.push({ label: 'Bench Sales', category: 'Recruitment', target: 'bench-sales' });
        if (permissions.canViewReports) routes.push({ label: 'Master Reports', category: 'Reports', target: 'reports' });
        if (permissions.canMessage) routes.push({ label: 'Messages', category: 'Communication', target: 'messages' });

        if (permissions.canManageTimesheets) {
            routes.push({ label: 'Create Company', category: 'Timesheets', target: 'create-timesheet-company' });
            routes.push({ label: 'Manage Companies', category: 'Timesheets', target: 'manage-companies' });
            routes.push({ label: 'Create Employee', category: 'Timesheets', target: 'create-timesheet-employee' });
            routes.push({ label: 'Manage Employees', category: 'Timesheets', target: 'manage-timesheet-employees' });
            routes.push({ label: 'Log Hours', category: 'Timesheets', target: 'log-hours' });
            routes.push({ label: 'Timesheet Dashboard', category: 'Timesheets', target: 'timesheets-dashboard' });
        }

        if (canSeeAssets) {
            if (permissions.canManageAssets) routes.push({ label: 'Create Asset', category: 'Assets', target: 'create-asset' });
            routes.push({ label: 'Asset Dashboard', category: 'Assets', target: 'asset-dashboard' });
        }

        if (canSeeDocs) {
            if (permissions.canManageMSAWO) {
                routes.push({ label: 'Create Vendor', category: 'Documents', target: 'create-msa-wo-vendor-company' });
                routes.push({ label: 'Manage Vendors', category: 'Documents', target: 'manage-msa-wo-vendor-companies' });
                routes.push({ label: 'Create MSA/WO', category: 'Documents', target: 'create-msa-wo' });
                routes.push({ label: 'MSA/WO Dashboard', category: 'Documents', target: 'msa-wo-dashboard' });
            }
            if (permissions.canManageOfferLetters) {
                routes.push({ label: 'Create Offer Letter', category: 'Documents', target: 'create-offer-letter' });
                routes.push({ label: 'Offer Letter Dashboard', category: 'Documents', target: 'offer-letter-dashboard' });
            }
        }

        if (canSeeAdmin) {
            if (permissions.canEditUsers) routes.push({ label: 'User Management', category: 'Admin', target: 'admin' });
            if (permissions.canManageHolidays) routes.push({ label: 'Manage Holidays', category: 'Admin', target: 'manage-holidays' });
            if (permissions.canManageLeaveConfig) routes.push({ label: 'Leave Config', category: 'Admin', target: 'leave-config' });
            if (permissions.canApproveLeave) routes.push({ label: 'Approve Leave', category: 'Admin', target: 'approve-leave' });
            if (permissions.canApproveAttendance) routes.push({ label: 'Approve Attendance', category: 'Admin', target: 'approve-attendance' });
            if (permissions.canSendMonthlyReport) routes.push({ label: 'Monthly Reports', category: 'Admin', target: 'monthly-attendance-report' });
        }

        return routes;
    }, [permissions, canSeeAssets, canSeeDocs, canSeeAdmin]);

    const filteredSearchResults = useMemo(() => {
        if (!searchQuery.trim()) return [];
        const query = searchQuery.toLowerCase();
        return searchableRoutes.filter(route => 
            route.label.toLowerCase().includes(query) || 
            route.category.toLowerCase().includes(query)
        );
    }, [searchQuery, searchableRoutes]);

    return (
        <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white shadow-sm text-left">
            <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-[72px] gap-6">
                    
                    {/* --- 1. Brand Logo (RESTORED OLD STYLE EXACTLY) --- */}
                    <div className="flex flex-col items-center cursor-pointer group shrink-0" onClick={() => handleNav('home')}>
                        <img src={LOGO_URL} alt="Taproot Logo" className="h-10 w-auto object-contain mb-1" />
                        <h1 className="text-[10px] font-black tracking-[0.15em] text-slate-900 uppercase leading-none">Vendor Management System</h1>
                        <div className="w-6 h-[2px] bg-blue-600 mt-1 rounded-full group-hover:w-full transition-all duration-300" />
                    </div>

                    {/* --- 2. Desktop Primary Navigation (CLEAN DROPDOWNS) --- */}
                    <nav className="hidden xl:flex items-center gap-1.5 py-1">
                        <NavButton label="Home" target="home" isActive={isPageActive('home')} onClick={handleNav} />
                        
                        {permissions.canViewDashboards && (
                            <Dropdown trigger={
                                <button className={`flex items-center gap-1.5 ${getLinkClass('dashboard')}`}>
                                    Dashboards <Icons.ChevronDown className="text-slate-400" />
                                </button>
                            }>
                                <div className="w-56 py-2 bg-white rounded-xl border border-slate-200 shadow-xl text-left">
                                    {Object.entries(DASHBOARD_CONFIGS).map(([key, config]) => (
                                        <DropdownItem key={key} label={config.title} target={`dashboard?key=${key}`} onClick={handleNav} />
                                    ))}
                                </div>
                            </Dropdown>
                        )}

                        {permissions.canAddPosting && <NavButton label="New Posting" target="new-posting" isActive={isPageActive('new-posting')} onClick={handleNav} />}
                        {permissions.canViewCandidates && <NavButton label="Candidates" target="candidate-details" isActive={isPageActive('candidate-details')} onClick={handleNav} />}
                        {permissions.canManageBenchSales && <NavButton label="Bench Sales" target="bench-sales" isActive={isPageActive('bench-sales')} onClick={handleNav} />}
                        {permissions.canViewReports && <NavButton label="Reports" target="reports" isActive={isPageActive('reports')} onClick={handleNav} />}

                        {permissions.canManageTimesheets && (
                            <Dropdown trigger={
                                <button className={`flex items-center gap-1.5 ${getLinkClass(['create-timesheet-company', 'manage-companies', 'log-hours', 'timesheets-dashboard'])}`}>
                                    Timesheets <Icons.ChevronDown className="text-slate-400" />
                                </button>
                            }>
                                <div className="w-56 py-2 bg-white rounded-xl border border-slate-200 shadow-xl text-left">
                                    <DropdownItem label="Create Company" target="create-timesheet-company" onClick={handleNav} />
                                    <DropdownItem label="Manage Companies" target="manage-companies" onClick={handleNav} />
                                    <DropdownItem label="Create Employee" target="create-timesheet-employee" onClick={handleNav} />
                                    <DropdownItem label="Manage Employees" target="manage-timesheet-employees" onClick={handleNav} />
                                    <div className="border-t border-slate-100 my-1.5" />
                                    <DropdownItem label="Log Hours" target="log-hours" onClick={handleNav} />
                                    <DropdownItem label="Dashboard" target="timesheets-dashboard" onClick={handleNav} />
                                </div>
                            </Dropdown>
                        )}

                        {canSeeAssets && (
                            <Dropdown trigger={
                                <button className={`flex items-center gap-1.5 ${getLinkClass(['create-asset', 'asset-dashboard'])}`}>
                                    Assets <Icons.ChevronDown className="text-slate-400" />
                                </button>
                            }>
                                <div className="w-48 py-2 bg-white rounded-xl border border-slate-200 shadow-xl text-left">
                                    {permissions.canManageAssets && <DropdownItem label="Create Asset" target="create-asset" onClick={handleNav} />}
                                    <DropdownItem label="Asset Dashboard" target="asset-dashboard" onClick={handleNav} />
                                </div>
                            </Dropdown>
                        )}

                        {canSeeDocs && (
                            <Dropdown trigger={
                                <button className={`flex items-center gap-1.5 ${getLinkClass(['msa-wo-dashboard', 'offer-letter-dashboard'])}`}>
                                    Documents <Icons.ChevronDown className="text-slate-400" />
                                </button>
                            }>
                                <div className="w-56 py-2 bg-white rounded-xl border border-slate-200 shadow-xl text-left">
                                    {permissions.canManageMSAWO && (
                                        <>
                                            <div className="px-4 py-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest">MSA & WO</div>
                                            <DropdownItem label="Create Vendor" target="create-msa-wo-vendor-company" onClick={handleNav} />
                                            <DropdownItem label="Manage Vendors" target="manage-msa-wo-vendor-companies" onClick={handleNav} />
                                            <DropdownItem label="Create MSA/WO" target="create-msa-wo" onClick={handleNav} />
                                            <DropdownItem label="Dashboard" target="msa-wo-dashboard" onClick={handleNav} />
                                        </>
                                    )}
                                    {permissions.canManageOfferLetters && (
                                        <>
                                            {permissions.canManageMSAWO && <div className="border-t border-slate-100 my-1.5"></div>}
                                            <div className="px-4 py-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Offer Letter</div>
                                            <DropdownItem label="Create Letter" target="create-offer-letter" onClick={handleNav} />
                                            <DropdownItem label="Dashboard" target="offer-letter-dashboard" onClick={handleNav} />
                                        </>
                                    )}
                                </div>
                            </Dropdown>
                        )}

                        {canSeeAdmin && (
                            <Dropdown trigger={
                                <button className={`flex items-center gap-1.5 ${getLinkClass(['admin', 'manage-holidays', 'leave-config', 'approve-leave', 'approve-attendance', 'monthly-attendance-report'])}`}>
                                    Admin <Icons.ChevronDown className="text-slate-400" />
                                </button>
                            }>
                                <div className="w-56 py-2 bg-white rounded-xl border border-slate-200 shadow-xl text-left">
                                    {permissions.canEditUsers && <DropdownItem label="User Management" target="admin" onClick={handleNav} />}
                                    {permissions.canEditUsers && <div className="border-t border-slate-100 my-1.5" />}
                                    {permissions.canManageHolidays && <DropdownItem label="Manage Holidays" target="manage-holidays" onClick={handleNav} />}
                                    {permissions.canManageLeaveConfig && <DropdownItem label="Leave Config" target="leave-config" onClick={handleNav} />}
                                    {permissions.canApproveLeave && <DropdownItem label="Approve Leave" target="approve-leave" onClick={handleNav} />}
                                    {permissions.canApproveAttendance && <DropdownItem label="Approve Attendance" target="approve-attendance" onClick={handleNav} />}
                                    {permissions.canSendMonthlyReport && <DropdownItem label="Monthly Reports" target="monthly-attendance-report" onClick={handleNav} />}
                                </div>
                            </Dropdown>
                        )}
                    </nav>

                    {/* --- 3. Functional Search & Actions --- */}
                    <div className="flex items-center gap-3 shrink-0 ml-auto xl:ml-0 text-left">
                        
                        {/* Live Search Bar */}
                        <div className="hidden md:block relative z-50" ref={searchRef}>
                            <div className="relative group">
                                <Icons.Search className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                                <input 
                                    type="text" 
                                    placeholder="Search navigation..." 
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onFocus={() => setIsSearchFocused(true)}
                                    className="w-56 lg:w-64 bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 rounded-full pl-10 pr-4 py-2 text-[13px] font-bold text-slate-800 transition-all outline-none" 
                                />
                            </div>

                            {/* Search Results Dropdown */}
                            {isSearchFocused && searchQuery.trim() !== '' && (
                                <div className="absolute top-full right-0 mt-2 w-72 bg-white rounded-xl border border-slate-200 shadow-xl overflow-hidden text-left animate-fade-in">
                                    <div className="max-h-[300px] overflow-y-auto py-2 custom-scrollbar">
                                        {filteredSearchResults.length > 0 ? (
                                            filteredSearchResults.map((route, idx) => (
                                                <button 
                                                    key={idx}
                                                    onClick={() => handleNav(route.target)}
                                                    className="w-full text-left px-4 py-2.5 hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0"
                                                >
                                                    <p className="text-[13px] font-bold text-slate-800">{route.label}</p>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{route.category}</p>
                                                </button>
                                            ))
                                        ) : (
                                            <div className="px-4 py-6 text-center text-slate-500 text-sm font-medium">
                                                No matches found for "{searchQuery}"
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Messages Icon */}
                        {permissions.canMessage && (
                            <button onClick={() => handleNav('messages')} className="relative p-2.5 rounded-full text-slate-500 hover:bg-slate-100 hover:text-blue-600 transition-colors focus:outline-none">
                                <Icons.Message className="w-5 h-5" />
                                {unreadMessagesCount > 0 && (
                                    <span className="absolute top-1.5 right-1.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-blue-600 text-[9px] font-black text-white ring-2 ring-white">
                                        {unreadMessagesCount}
                                    </span>
                                )}
                            </button>
                        )}

                        {/* Notification Popover */}
                        <Dropdown width="96" trigger={
                            <button type="button" className="relative p-2.5 rounded-full text-slate-500 hover:bg-slate-100 hover:text-blue-600 transition-colors focus:outline-none">
                                <Icons.Bell className="w-5 h-5" />
                                {notifications.length > 0 && (
                                    <span className="absolute top-1.5 right-1.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-red-500 text-[9px] font-black text-white ring-2 ring-white">
                                        {notifications.length}
                                    </span>
                                )}
                            </button>
                        }>
                            <div className="w-80 sm:w-96 py-2 bg-white rounded-xl border border-slate-200 shadow-xl overflow-hidden text-left">
                                <div className="flex justify-between items-center px-4 py-2 border-b border-slate-100">
                                    <h4 className="font-bold text-slate-800 text-xs uppercase tracking-widest">Notifications</h4>
                                    {notifications.length > 0 && (
                                        <button onClick={handleMarkAsRead} className="text-[11px] font-bold text-blue-600 hover:text-blue-800 transition-colors">Mark all read</button>
                                    )}
                                </div>
                                <div className="max-h-[300px] overflow-y-auto custom-scrollbar text-left">
                                    {notifications.length > 0 ? notifications.map((n, idx) => (
                                        <div key={n.id || idx} className="px-4 py-3 border-b border-slate-50 hover:bg-slate-50 transition-colors text-left">
                                            <p className="text-[13px] text-slate-700 font-semibold leading-snug break-words">{n.message}</p>
                                            <p className="text-[10px] font-bold text-slate-400 mt-1">{new Date(n.timestamp).toLocaleString()}</p>
                                        </div>
                                    )) : (
                                        <div className="py-12 text-center text-slate-400">
                                            <Icons.Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
                                            <p className="text-sm font-bold">You're all caught up</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </Dropdown>

                        {/* Divider */}
                        <div className="hidden md:block w-px h-6 bg-slate-200 mx-1"></div>

                        {/* User Profile Popover */}
                        <Dropdown width="64" trigger={
                             <button type="button" className="flex items-center gap-2.5 p-1 pr-3 hover:bg-slate-50 rounded-full transition-colors group">
                                <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-sm shadow-sm group-hover:bg-blue-700 transition-colors">
                                    {user?.userName ? String(user.userName).charAt(0).toUpperCase() : 'U'}
                                </div>
                                <div className="hidden md:flex flex-col items-start text-left">
                                    <span className="text-[13px] font-bold text-slate-800 leading-none group-hover:text-blue-600">{user?.userName || 'User'}</span>
                                    <span className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">{user?.userRole || 'Role'}</span>
                                </div>
                                <Icons.ChevronDown className="hidden md:block h-3.5 w-3.5 text-slate-400 group-hover:text-slate-600 ml-1" />
                            </button>
                        }>
                            <div className="w-64 py-2 bg-white rounded-xl border border-slate-200 shadow-xl text-left">
                                <div className="px-4 py-2 border-b border-slate-100 mb-2">
                                    <p className="text-sm font-bold text-slate-900 truncate">{user?.userName}</p>
                                    <p className="text-[11px] font-medium text-slate-500 truncate mt-0.5">{user?.userIdentifier}</p>
                                </div>
                                <DropdownItem label="My Profile" target="profile" onClick={handleNav} />
                                <div className="border-t border-slate-100 my-1"></div>
                                <DropdownItem label="Sign Out" target={logout} onClick={handleNav} isDestructive />
                            </div>
                        </Dropdown>

                        {/* Mobile Menu Hamburger */}
                        <button 
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
                            className="xl:hidden p-2 rounded-xl text-slate-500 hover:bg-slate-50 focus:outline-none transition-colors"
                        >
                            {isMobileMenuOpen ? <Icons.Close className="w-6 h-6" /> : <Icons.Menu className="w-6 h-6" />}
                        </button>
                    </div>
                </div>
            </div>

            {/* --- Mobile Full-Screen Dropdown --- */}
            {isMobileMenuOpen && (
                <div className="xl:hidden absolute top-[72px] left-0 w-full bg-white shadow-2xl border-t border-slate-100 animate-fade-in z-40 max-h-[calc(100vh-72px)] overflow-y-auto">
                    <div className="px-4 py-4 space-y-1 text-left">
                        <button onClick={() => handleNav('home')} className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold ${isPageActive('home') ? 'bg-blue-50 text-blue-700' : 'text-slate-700 hover:bg-slate-50'}`}>Home Dashboard</button>
                        
                        {permissions.canViewDashboards && (
                            <div className="mt-4 mb-2">
                                <div className="px-4 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest border-t border-slate-100">Board Views</div>
                                <div className="grid grid-cols-2 gap-2 mt-2 px-2">
                                    {Object.entries(DASHBOARD_CONFIGS).map(([key, config]) => (
                                        <button key={key} onClick={() => handleNav(`dashboard?key=${key}`)} className="flex flex-col text-left px-4 py-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-100 transition-colors">
                                            <span className="text-[13px] font-bold text-slate-800">{config.title}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="px-4 py-2 mt-2 text-[10px] font-black text-slate-400 uppercase tracking-widest border-t border-slate-100">Workspace</div>
                        {permissions.canAddPosting && <button onClick={() => handleNav('new-posting')} className={`w-full text-left px-4 py-2.5 rounded-xl text-[13px] font-bold ${isPageActive('new-posting') ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'}`}>New Posting</button>}
                        {permissions.canViewCandidates && <button onClick={() => handleNav('candidate-details')} className={`w-full text-left px-4 py-2.5 rounded-xl text-[13px] font-bold ${isPageActive('candidate-details') ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'}`}>Candidates</button>}
                        {permissions.canManageBenchSales && <button onClick={() => handleNav('bench-sales')} className={`w-full text-left px-4 py-2.5 rounded-xl text-[13px] font-bold ${isPageActive('bench-sales') ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'}`}>Bench Sales</button>}
                        {permissions.canViewReports && <button onClick={() => handleNav('reports')} className={`w-full text-left px-4 py-2.5 rounded-xl text-[13px] font-bold ${isPageActive('reports') ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'}`}>Reports</button>}

                        {(permissions.canManageTimesheets || canSeeAssets || canSeeDocs || canSeeAdmin) && (
                            <>
                                <div className="px-4 py-2 mt-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-t border-slate-100">Modules</div>
                                {permissions.canManageTimesheets && <button onClick={() => handleNav('timesheets-dashboard')} className="w-full text-left px-4 py-2.5 rounded-xl text-[13px] font-bold text-slate-600 hover:bg-slate-50">Timesheet Management</button>}
                                {canSeeAssets && <button onClick={() => handleNav('asset-dashboard')} className="w-full text-left px-4 py-2.5 rounded-xl text-[13px] font-bold text-slate-600 hover:bg-slate-50">Asset Inventory</button>}
                                {canSeeDocs && <button onClick={() => handleNav('msa-wo-dashboard')} className="w-full text-left px-4 py-2.5 rounded-xl text-[13px] font-bold text-slate-600 hover:bg-slate-50">Documents & MSA</button>}
                                {canSeeAdmin && <button onClick={() => handleNav('admin')} className="w-full text-left px-4 py-2.5 rounded-xl text-[13px] font-bold text-slate-600 hover:bg-slate-50">Administration Panel</button>}
                            </>
                        )}
                    </div>
                </div>
            )}
        </header>
    );
};

export default memo(TopNav);