import React, { useState, useEffect, useCallback, useRef, memo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom'; 
import { Menu, X, Bell, Clock4, ShieldCheck, LayoutDashboard, Briefcase, FileSignature } from 'lucide-react'; 
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

const LOGO_URL = "https://vmsdashboardea.blob.core.windows.net/images/Company_logo.png?sp=r&st=2026-03-16T20:51:06Z&se=2026-03-17T05:06:06Z&sv=2024-11-04&sr=b&sig=OkdvwYLGhv3wMw9QfKb2QXE3B14ruv6q0GGKvJEnEkc%3D";

const ChevronDownIcon = memo(({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m6 9 6 6 6-6"/></svg>
));

const NavButton = memo(({ label, target, isActive, onClick }) => {
    const baseClass = "px-3 py-1.5 rounded-lg text-[12px] font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer select-none text-left w-full xl:w-auto";
    const activeClass = "bg-blue-50 text-blue-700 shadow-sm ring-1 ring-blue-100";
    const inactiveClass = "text-slate-500 hover:bg-slate-50 hover:text-slate-900";

    return (
        <button type="button" onClick={() => onClick(target)} className={`${baseClass} ${isActive ? activeClass : inactiveClass}`}>
            {label}
        </button>
    );
});

const DropdownItem = memo(({ label, target, onClick, isDestructive }) => {
    const dropdownContext = useDropdown();
    const close = dropdownContext ? dropdownContext.close : null;
    const handleClick = () => { onClick(target); if (close) close(); };

    return (
        <button type="button" onClick={handleClick} className={`w-full text-left block px-4 py-2.5 text-sm font-semibold transition-colors ${isDestructive ? 'text-rose-600 hover:bg-rose-50' : 'text-slate-600 hover:bg-slate-50 hover:text-blue-600'}`}>
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
    const audioRef = useRef(null);

    const isPageActive = (target) => {
        if (Array.isArray(target)) return target.some(t => location.pathname.includes(t));
        return location.pathname === `/${target.replace(/^\//, '')}`;
    };

    const handleNav = useCallback((target) => {
        setIsMobileMenuOpen(false);
        if (typeof target === 'function') target(); 
        else navigate(target.startsWith('/') ? target : `/${target}`);
    }, [navigate]);

    const getLinkClass = (target) => {
        const base = "px-3 py-1.5 rounded-lg text-[12px] font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer";
        const active = "bg-blue-50 text-blue-700 shadow-sm ring-1 ring-blue-100";
        const inactive = "text-slate-500 hover:bg-slate-50 hover:text-slate-900";
        return `${base} ${isPageActive(target) ? active : inactive}`;
    };

    useEffect(() => {
        audioRef.current = { notification: new Audio('/sounds/notification.mp3'), message: new Audio('/sounds/message.mp3') };
    }, []);

    const fetchNotifications = useCallback(async () => {
        if (!user?.userIdentifier) return;
        try {
            const response = await apiService.getNotifications(user.userIdentifier);
            const newNotifs = response?.data?.success ? (response.data.notifications || []) : [];
            if (newNotifs.length > prevNotifLengthRef.current && prevNotifLengthRef.current > 0) {
                audioRef.current?.notification?.play().catch(() => {});
            }
            prevNotifLengthRef.current = newNotifs.length;
            setNotifications(newNotifs); 
        } catch (err) { console.error(err); }
    }, [user?.userIdentifier]);

    const fetchUnreadMessages = useCallback(async () => {
        if (!user?.userIdentifier || !permissions.canMessage) return;
        try {
            const response = await apiService.getUnreadMessages(user.userIdentifier);
            if (response.data.success) {
                const count = Object.values(response.data.unreadCounts || {}).reduce((sum, c) => sum + c, 0);
                setUnreadMessagesCount(count);
            }
        } catch (err) { console.error(err); }
    }, [user?.userIdentifier, permissions.canMessage]);

    // ✅ Re-defined handleMarkAsRead
    const handleClearNotifications = async () => {
        if (notifications.length === 0) return;
        try {
            const idsToMark = notifications.map(n => ({ id: n.id, partitionKey: n.partitionKey }));
            setNotifications([]); 
            prevNotifLengthRef.current = 0;
            await apiService.markNotificationsAsRead(idsToMark, user.userIdentifier);
        } catch (err) { fetchNotifications(); }
    };

    useEffect(() => {
        fetchNotifications();
        fetchUnreadMessages();
        const nInt = setInterval(fetchNotifications, 30000);
        const mInt = setInterval(fetchUnreadMessages, 15000);
        return () => { clearInterval(nInt); clearInterval(mInt); };
    }, [fetchNotifications, fetchUnreadMessages]);

    if (!user || !permissions) return null;

    return (
        <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white shadow-sm">
            <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-20">
                    
                    {/* Brand Section */}
                    <div className="flex items-center gap-8">
                        <div className="flex flex-col items-center cursor-pointer group shrink-0" onClick={() => handleNav('home')}>
                            <img src={LOGO_URL} alt="Logo" className="h-8 w-auto object-contain mb-1" />
                            <h1 className="text-[9px] font-black tracking-[0.2em] text-slate-900 uppercase leading-none">VMS Portal</h1>
                            <div className="w-6 h-0.5 bg-blue-600 mt-1 rounded-full group-hover:w-full transition-all duration-300" />
                        </div>
                                                
                        {/* Desktop Navigation */}
                        <nav className="hidden xl:flex items-center gap-1">
                            <NavButton label="Home" target="home" isActive={isPageActive('home')} onClick={handleNav} />
                            
                            {permissions.canViewDashboards && (
                                <Dropdown trigger={<button className={`flex items-center gap-1.5 ${getLinkClass('dashboard')}`}>Dashboards <ChevronDownIcon className="opacity-50" /></button>}>
                                    <div className="w-56 py-1">
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

                            {permissions.canMessage && (
                                <button type="button" onClick={() => handleNav('messages')} className={`${getLinkClass('messages')} relative`}>
                                    Messages
                                    {unreadMessagesCount > 0 && <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-black text-white ring-2 ring-white">{unreadMessagesCount}</span>}
                                </button>
                            )}

                            {permissions.canManageTimesheets && (
                                <Dropdown trigger={<button className={`flex items-center gap-1.5 ${getLinkClass(['timesheet', 'log-hours'])}`}>Timesheets <ChevronDownIcon className="opacity-50" /></button>}>
                                    <div className="w-60 py-1">
                                        <DropdownItem label="Create Company" target="create-timesheet-company" onClick={handleNav} />
                                        <DropdownItem label="Manage Companies" target="manage-companies" onClick={handleNav} />
                                        <DropdownItem label="Create Employee" target="create-timesheet-employee" onClick={handleNav} />
                                        <DropdownItem label="Manage Employees" target="manage-timesheet-employees" onClick={handleNav} />
                                        <div className="border-t border-slate-100 my-1" />
                                        <DropdownItem label="Log Hours" target="log-hours" onClick={handleNav} />
                                        <DropdownItem label="Timesheets Dashboard" target="timesheets-dashboard" onClick={handleNav} />
                                    </div>
                                </Dropdown>
                            )}

                            {(permissions.canManageAssets || permissions.canAssignAssets) && (
                                <Dropdown trigger={<button className={`flex items-center gap-1.5 ${getLinkClass('asset')}`}>Assets <ChevronDownIcon className="opacity-50" /></button>}>
                                    <div className="w-56 py-1">
                                        {permissions.canManageAssets && <DropdownItem label="Create Asset" target="create-asset" onClick={handleNav} />}
                                        <DropdownItem label="Asset Dashboard" target="asset-dashboard" onClick={handleNav} />
                                    </div>
                                </Dropdown>
                            )}

                            {(permissions.canManageMSAWO || permissions.canManageOfferLetters) && (
                                <Dropdown trigger={<button className={`flex items-center gap-1.5 ${getLinkClass(['msa-wo', 'offer-letter'])}`}>Documents <ChevronDownIcon className="opacity-50" /></button>}>
                                    <div className="w-64 py-1">
                                        {permissions.canManageMSAWO && <>
                                            <div className="px-4 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50/50">MSA & WO</div>
                                            <DropdownItem label="Create Vendor" target="create-msa-wo-vendor-company" onClick={handleNav} />
                                            <DropdownItem label="Manage Vendors" target="manage-msa-wo-vendor-companies" onClick={handleNav} />
                                            <DropdownItem label="Create MSA/WO" target="create-msa-wo" onClick={handleNav} />
                                            <DropdownItem label="Dashboard" target="msa-wo-dashboard" onClick={handleNav} />
                                        </>}
                                        {permissions.canManageOfferLetters && <>
                                            <div className="border-t border-slate-100 my-1"></div>
                                            <div className="px-4 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50/50">Offer Letters</div>
                                            <DropdownItem label="Generate Letter" target="create-offer-letter" onClick={handleNav} />
                                            <DropdownItem label="Dashboard" target="offer-letter-dashboard" onClick={handleNav} />
                                        </>}
                                    </div>
                                </Dropdown>
                            )}

                            {(permissions.canEditUsers || permissions.canManageHolidays || permissions.canApproveLeave || permissions.canApproveAttendance) && (
                                <Dropdown trigger={<button className={`flex items-center gap-1.5 ${getLinkClass('admin')}`}>Admin <ChevronDownIcon className="opacity-50" /></button>}>
                                    <div className="w-60 py-1">
                                        {permissions.canEditUsers && <DropdownItem label="User Management" target="admin" onClick={handleNav} />}
                                        <div className="border-t border-slate-100 my-1" />
                                        {permissions.canManageHolidays && <DropdownItem label="Manage Holidays" target="manage-holidays" onClick={handleNav} />}
                                        {permissions.canManageLeaveConfig && <DropdownItem label="Leave Configuration" target="leave-config" onClick={handleNav} />}
                                        {permissions.canApproveLeave && <DropdownItem label="Approve Leave" target="approve-leave" onClick={handleNav} />}
                                        {permissions.canApproveAttendance && <DropdownItem label="Approve Attendance" target="approve-attendance" onClick={handleNav} />}
                                        {permissions.canSendMonthlyReport && <DropdownItem label="Monthly Reports" target="monthly-attendance-report" onClick={handleNav} />}
                                    </div>
                                </Dropdown>
                            )}
                        </nav>
                    </div>

                    {/* Right Section */}
                    <div className="flex items-center gap-3 sm:gap-5">
                        {/* Notifications */}
                        <Dropdown width="96" trigger={
                            <button type="button" className="relative p-2 text-slate-400 hover:bg-slate-50 hover:text-blue-600 rounded-xl transition-all">
                                <Bell size={20} />
                                {notifications.length > 0 && <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-black text-white ring-2 ring-white">{notifications.length}</span>}
                            </button>
                        }>
                            <div className="w-96 max-w-[100vw]">
                                <div className="flex justify-between items-center p-4 border-b border-slate-100 bg-slate-50/50 rounded-t-2xl">
                                    <h4 className="font-bold text-slate-800 text-sm tracking-tight">Notifications</h4>
                                    {/* ✅ Function name corrected here */}
                                    {notifications.length > 0 && <button onClick={handleClearNotifications} className="text-[11px] font-black uppercase tracking-wider text-blue-600 hover:text-blue-800">Clear All</button>}
                                </div>
                                <div className="max-h-[350px] overflow-y-auto scrollbar-thin">
                                    {notifications.length > 0 ? notifications.map((n, idx) => (
                                        <div key={idx} className="p-4 border-b border-slate-50 hover:bg-blue-50/30 transition-colors">
                                            <p className="text-sm text-slate-700 font-medium leading-relaxed">{n.message}</p>
                                            <p className="text-[10px] font-bold text-slate-400 mt-2 flex items-center gap-1.5 uppercase"><Clock4 size={10} /> {new Date(n.timestamp).toLocaleString()}</p>
                                        </div>
                                    )) : <div className="py-12 flex flex-col items-center justify-center text-slate-400"><Bell size={24} className="opacity-20" /><p className="text-sm font-medium italic">No new notifications</p></div>}
                                </div>
                            </div>
                        </Dropdown>

                        {/* Profile Section */}
                        <div className="hidden sm:block">
                            <Dropdown width="64" trigger={
                                <button type="button" className="flex items-center gap-3 hover:bg-slate-50 rounded-2xl pl-1.5 pr-3 py-1.5 transition-all focus:outline-none">
                                    <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center text-white shadow-md font-black">{user?.userName?.charAt(0).toUpperCase()}</div>
                                    <div className="hidden md:flex flex-col items-start text-left">
                                        <span className="text-sm font-bold text-slate-800 leading-none">{user?.userName}</span>
                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">{user?.userRole}</span>
                                    </div>
                                    <ChevronDownIcon className="h-3.5 w-3.5 text-slate-300 ml-1" />
                                </button>
                            }>
                                <div className="w-64">
                                    <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50 rounded-t-2xl">
                                        <p className="text-sm font-bold text-slate-900 break-words leading-none mb-1">{user?.userName}</p>
                                        <p className="text-[11px] font-medium text-slate-400 break-all">{user?.userIdentifier}</p>
                                    </div>
                                    <div className="py-2">
                                        <DropdownItem label="Personal Profile" target="profile" onClick={handleNav} />
                                    </div>
                                    <div className="border-t border-slate-100 py-2">
                                        <DropdownItem label="Sign Out System" target={logout} onClick={handleNav} isDestructive />
                                    </div>
                                </div>
                            </Dropdown>
                        </div>

                        {/* Mobile Toggle */}
                        <div className="xl:hidden flex items-center">
                            <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2.5 rounded-xl text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-all">
                                {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile Sidebar */}
            {isMobileMenuOpen && (
                <div className="xl:hidden border-t border-slate-200 bg-white/95 backdrop-blur-xl h-[calc(100vh-80px)] overflow-y-auto shadow-2xl">
                    <div className="p-6 space-y-6">
                        <div className="space-y-1">
                            <NavButton label="Dashboard Home" target="home" isActive={isPageActive('home')} onClick={handleNav} />
                            <NavButton label="My Profile" target="profile" isActive={isPageActive('profile')} onClick={handleNav} />
                        </div>
                        
                        {permissions.canViewDashboards && (
                            <div className="space-y-1">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-3 mb-2">Dashboards</p>
                                {Object.entries(DASHBOARD_CONFIGS).map(([k, v]) => (
                                    <NavButton key={k} label={v.title} target={`dashboard?key=${k}`} isActive={location.search.includes(k)} onClick={handleNav} />
                                ))}
                            </div>
                        )}

                        <div className="space-y-1">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-3 mb-2">Workspace</p>
                            {permissions.canAddPosting && <NavButton label="New Posting" target="new-posting" isActive={isPageActive('new-posting')} onClick={handleNav} />}
                            {permissions.canViewCandidates && <NavButton label="Candidates" target="candidate-details" isActive={isPageActive('candidate-details')} onClick={handleNav} />}
                            {permissions.canManageBenchSales && <NavButton label="Bench Sales" target="bench-sales" isActive={isPageActive('bench-sales')} onClick={handleNav} />}
                            {permissions.canMessage && <NavButton label="Messages" target="messages" isActive={isPageActive('messages')} onClick={handleNav} />}
                        </div>

                        <div className="pt-4 border-t border-slate-100">
                            <button onClick={() => { setIsMobileMenuOpen(false); logout(); navigate('/login'); }} className="w-full flex items-center justify-center py-4 rounded-2xl bg-rose-50 text-rose-600 font-bold text-sm border border-rose-100 transition-all">Sign Out</button>
                        </div>
                    </div>
                </div>
            )}
        </header>
    );
};

export default memo(TopNav);