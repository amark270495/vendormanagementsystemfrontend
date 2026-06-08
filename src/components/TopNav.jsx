import React, { useState, useEffect, useCallback, useRef, memo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom'; 
import { useAuth } from '../context/AuthContext';
import { usePermissions } from '../hooks/usePermissions';
import { apiService } from '../api/apiService';
import Dropdown, { useDropdown } from './Dropdown';

// --- Static Config ---
const DASHBOARD_CONFIGS = {
    'ecaltVMSDisplay': { title: 'Eclat VMS', desc: 'Main Eclat Pipeline' },
    'taprootVMSDisplay': { title: 'Taproot VMS', desc: 'Main Taproot Pipeline' },
    'michiganDisplay': { title: 'Michigan VMS', desc: 'State of MI' },
    'EclatTexasDisplay': { title: 'Eclat Texas VMS', desc: 'Texas Region' },
    'TaprootTexasDisplay': { title: 'Taproot Texas VMS', desc: 'Texas Region' },
    'VirtusaDisplay': { title: 'Virtusa Taproot', desc: 'Partner Pipeline' },
    'DeloitteDisplay': { title: 'Deloitte Taproot', desc: 'Partner Pipeline' },
    'tsiBdrDisplay': { title: 'TSI - BDM', desc: 'Business Dev' } 
};

const LOGO_URL = "https://vmsdashboardea.blob.core.windows.net/images/Company_logo.png?sp=r&st=2026-03-17T13:15:01Z&se=2027-12-30T21:30:01Z&sv=2024-11-04&sr=b&sig=dAq1%2Bxrcn0KMYfrH%2F9OtOfQUZNqrxdZvGwoNFZfcyFY%3D";

// --- Premium SVG Icons library ---
const Icons = {
    ChevronDown: ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m6 9 6 6 6-6"/></svg>,
    Bell: ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>,
    Message: ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
    Search: ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>,
    Menu: ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></svg>,
    Close: ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><line x1="18" x2="6" y1="6" y2="18"/><line x1="6" x2="18" y1="6" y2="18"/></svg>,
    User: ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
    LogOut: ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>,
    Settings: ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
    Layout: ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><line x1="3" x2="21" y1="9" y2="9"/><line x1="9" x2="9" y1="21" y2="9"/></svg>,
    File: ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/></svg>,
    Shield: ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2-1 4-2 7-2 2.89 0 5 1 7 2a1 1 0 0 1 1 1z"/></svg>,
    Clock: ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
};

// --- Premium NavButton ---
const NavButton = memo(({ label, target, isActive, onClick, highlight }) => {
    const baseClass = "px-3.5 py-2 rounded-xl text-[13px] font-bold transition-all duration-300 cursor-pointer select-none text-left whitespace-nowrap tracking-wide flex items-center gap-1.5";
    const activeClass = "bg-slate-900 text-white shadow-md shadow-slate-900/10";
    const inactiveClass = "text-slate-600 hover:bg-slate-100 hover:text-slate-900";
    const highlightClass = highlight ? "bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200/50" : "";

    return (
        <button type="button" onClick={() => onClick(target)} className={`${baseClass} ${isActive ? activeClass : (highlight ? highlightClass : inactiveClass)}`}>
            {label}
        </button>
    );
});

// --- Rich Dropdown Item ---
const DropdownItem = memo(({ label, subtext, target, onClick, isDestructive, icon: Icon }) => {
    const dropdownContext = useDropdown();
    const close = dropdownContext ? dropdownContext.close : null;

    const handleClick = () => { onClick(target); if (close) close(); };

    return (
        <button type="button" onClick={handleClick} className={`w-full group flex items-start gap-3 px-3.5 py-2.5 rounded-xl transition-all duration-200 ${isDestructive ? 'hover:bg-red-50' : 'hover:bg-slate-50'}`}>
            {Icon && (
                <div className={`mt-0.5 shrink-0 ${isDestructive ? 'text-red-500 group-hover:text-red-600' : 'text-slate-400 group-hover:text-blue-500 transition-colors'}`}>
                    <Icon className="w-[18px] h-[18px]" />
                </div>
            )}
            <div className="flex flex-col text-left min-w-0">
                <span className={`text-[13px] font-bold leading-tight ${isDestructive ? 'text-red-600' : 'text-slate-700 group-hover:text-slate-900'}`}>{label}</span>
                {subtext && <span className="text-[10px] font-medium text-slate-500 mt-0.5 truncate leading-tight">{subtext}</span>}
            </div>
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
    const [searchQuery, setSearchQuery] = useState('');

    const prevNotifLengthRef = useRef(0);
    const prevMsgCountRef = useRef(0);
    const audioRef = useRef(null);

    const isPageActive = (target) => {
        if (Array.isArray(target)) return target.some(t => location.pathname === `/${t.replace(/^\//, '')}`);
        return location.pathname === `/${target.replace(/^\//, '')}`;
    };

    const handleNav = useCallback((target) => {
        setIsMobileMenuOpen(false);
        if (typeof target === 'function') { target(); } 
        else { navigate(target.startsWith('/') ? target : `/${target}`); }
    }, [navigate]);

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

    // Common drop-down trigger styling
    const triggerClass = (isActive) => `flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[13px] font-bold transition-all duration-300 ${isActive ? 'bg-slate-900 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`;

    return (
        <header className="sticky top-0 z- w-full border-b border-slate-200/60 bg-white/80 backdrop-blur-2xl shadow-[0_2px_20px_-10px_rgba(0,0,0,0.05)] text-left">
            <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-[72px] gap-6">
                    
                    {/* --- 1. Brand Logo --- */}
                    <div className="flex flex-col items-start cursor-pointer group shrink-0" onClick={() => handleNav('home')}>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-white rounded-xl shadow-sm border border-slate-100 flex items-center justify-center overflow-hidden transition-transform duration-300 group-hover:scale-105 group-hover:shadow-md">
                                <img src={LOGO_URL} alt="Logo" className="h-6 w-auto object-contain" />
                            </div>
                            <div className="flex flex-col items-start hidden sm:flex">
                                <h1 className="text-[12px] font-black tracking-widest text-slate-900 uppercase leading-none">Taproot VMS</h1>
                                <span className="text-[9px] font-bold text-blue-500 tracking-[0.2em] uppercase mt-1">Enterprise</span>
                            </div>
                        </div>
                    </div>

                    {/* --- 2. Desktop Core Navigation --- */}
                    <nav className="hidden xl:flex items-center gap-1">
                        <NavButton label="Home" target="home" isActive={isPageActive('home')} onClick={handleNav} />
                        
                        {permissions.canViewDashboards && (
                            <Dropdown trigger={
                                <button className={triggerClass(isPageActive('dashboard'))}>
                                    Dashboards <Icons.ChevronDown className={`transition-transform duration-300 ${isPageActive('dashboard') ? 'text-white/70' : 'text-slate-400 group-hover:text-slate-600'}`} />
                                </button>
                            }>
                                <div className="w-64 p-2 bg-white rounded-2xl border border-slate-200/80 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] text-left">
                                    <div className="px-3 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Boards</div>
                                    {Object.entries(DASHBOARD_CONFIGS).map(([key, config]) => (
                                        <DropdownItem key={key} icon={Icons.Layout} label={config.title} subtext={config.desc} target={`dashboard?key=${key}`} onClick={handleNav} />
                                    ))}
                                </div>
                            </Dropdown>
                        )}

                        {permissions.canAddPosting && <NavButton label="New Posting" target="new-posting" isActive={isPageActive('new-posting')} onClick={handleNav} highlight />}
                        {permissions.canViewCandidates && <NavButton label="Candidates" target="candidate-details" isActive={isPageActive('candidate-details')} onClick={handleNav} />}
                        {permissions.canManageBenchSales && <NavButton label="Bench Sales" target="bench-sales" isActive={isPageActive('bench-sales')} onClick={handleNav} />}
                        
                        {(canSeeAssets || canSeeDocs || permissions.canManageTimesheets || canSeeAdmin) && (
                            <Dropdown trigger={
                                <button className={triggerClass(isPageActive(['timesheets-dashboard', 'asset-dashboard', 'msa-wo-dashboard', 'admin']))}>
                                    Modules <Icons.ChevronDown className="text-slate-400" />
                                </button>
                            }>
                                <div className="w-72 p-2 bg-white rounded-2xl border border-slate-200/80 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] text-left flex gap-2">
                                    
                                    {/* Left Column in Dropdown */}
                                    <div className="flex-1 space-y-1 border-r border-slate-100 pr-2">
                                        <div className="px-3 py-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Operations</div>
                                        {permissions.canManageTimesheets && <DropdownItem icon={Icons.Clock} label="Timesheets" subtext="Log & Manage Hours" target="timesheets-dashboard" onClick={handleNav} />}
                                        {canSeeAssets && <DropdownItem icon={Icons.Shield} label="Assets" subtext="Fleet Management" target="asset-dashboard" onClick={handleNav} />}
                                        {permissions.canViewReports && <DropdownItem icon={Icons.Layout} label="Reports" subtext="Master Reporting" target="reports" onClick={handleNav} />}
                                    </div>
                                    
                                    {/* Right Column in Dropdown */}
                                    <div className="flex-1 space-y-1 pl-1">
                                        <div className="px-3 py-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Admin & Docs</div>
                                        {canSeeDocs && <DropdownItem icon={Icons.File} label="Documents" subtext="MSA & Offer Letters" target="msa-wo-dashboard" onClick={handleNav} />}
                                        {canSeeAdmin && <DropdownItem icon={Icons.Settings} label="Admin Panel" subtext="Users & Leaves" target="admin" onClick={handleNav} />}
                                    </div>

                                </div>
                            </Dropdown>
                        )}
                    </nav>

                    {/* --- 3. Global Search Bar --- */}
                    <div className="hidden md:flex flex-1 max-w-md ml-auto mr-4 relative group">
                        <Icons.Search className="absolute left-3.5 top-2.5 w-[15px] h-[15px] text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                        <input 
                            type="text" 
                            placeholder="Search jobs, candidates..." 
                            value={searchQuery}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-slate-100/60 hover:bg-slate-100 border border-transparent focus:border-blue-500/50 focus:bg-white focus:ring-4 focus:ring-blue-500/10 rounded-full pl-10 pr-4 py-2 text-[13px] font-medium text-slate-800 transition-all placeholder:text-slate-400 placeholder:font-medium outline-none shadow-inner" 
                        />
                        <div className="absolute right-3 top-2 flex items-center gap-1 pointer-events-none">
                            <span className="px-1.5 py-0.5 rounded border border-slate-200 bg-white text-[9px] font-bold text-slate-400 shadow-sm">⌘K</span>
                        </div>
                    </div>

                    {/* --- 4. Right Actions Section --- */}
                    <div className="flex items-center gap-1 sm:gap-2 shrink-0 text-left">
                        
                        {/* Messages Icon */}
                        {permissions.canMessage && (
                            <button 
                                onClick={() => handleNav('messages')}
                                className="relative p-2.5 rounded-full text-slate-500 hover:bg-slate-100 hover:text-blue-600 transition-colors focus:outline-none"
                            >
                                <Icons.Message className="w-5 h-5" />
                                {unreadMessagesCount > 0 && (
                                    <span className="absolute top-1.5 right-1.5 flex h-3 w-3">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-600 border-2 border-white"></span>
                                    </span>
                                )}
                            </button>
                        )}

                        {/* Notification Popover */}
                        <Dropdown width="96" trigger={
                            <button type="button" className="relative p-2.5 rounded-full text-slate-500 hover:bg-slate-100 hover:text-blue-600 transition-colors focus:outline-none">
                                <Icons.Bell className="w-5 h-5" />
                                {notifications.length > 0 && (
                                    <span className="absolute top-1.5 right-2 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-red-500 text-[9px] font-black text-white ring-2 ring-white">
                                        {notifications.length}
                                    </span>
                                )}
                            </button>
                        }>
                            <div className="w-80 sm:w-96 rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)] border border-slate-200/80 bg-white/95 backdrop-blur-xl overflow-hidden text-left mt-2">
                                <div className="flex justify-between items-center px-5 py-4 border-b border-slate-100 bg-white">
                                    <h4 className="font-bold text-slate-900 text-sm">Notifications</h4>
                                    {notifications.length > 0 && (
                                        <button onClick={handleMarkAsRead} className="text-[11px] font-bold text-blue-600 hover:text-blue-800 transition-colors bg-blue-50 px-2 py-1 rounded-md">Mark all read</button>
                                    )}
                                </div>
                                <div className="max-h-[360px] overflow-y-auto custom-scrollbar text-left p-2 space-y-1">
                                    {notifications.length > 0 ? notifications.map((n, idx) => (
                                        <div key={n.id || idx} className="px-4 py-3 rounded-xl hover:bg-slate-50 transition-colors cursor-default text-left">
                                            <p className="text-[13px] text-slate-800 leading-snug break-words font-medium">{n.message}</p>
                                            <p className="text-[10px] font-bold text-slate-400 mt-1.5 text-left uppercase tracking-wide">{new Date(n.timestamp).toLocaleString()}</p>
                                        </div>
                                    )) : (
                                        <div className="py-16 text-center flex flex-col items-center justify-center text-slate-400">
                                            <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mb-3">
                                                <Icons.Bell className="w-6 h-6 text-slate-300" />
                                            </div>
                                            <p className="text-sm font-bold text-slate-600">You're all caught up</p>
                                            <p className="text-xs font-medium mt-1">No new notifications</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </Dropdown>

                        {/* Divider */}
                        <div className="hidden sm:block w-px h-8 bg-slate-200 mx-1"></div>

                        {/* User Profile Popover */}
                        <Dropdown width="96" trigger={
                             <button type="button" className="flex items-center gap-2.5 p-1.5 pr-3 hover:bg-slate-50 rounded-full transition-all border border-transparent hover:border-slate-200 group">
                                <div className="h-8 w-8 rounded-full bg-slate-900 flex items-center justify-center text-white font-bold text-sm shadow-md group-hover:scale-105 transition-transform">
                                    {user?.userName ? String(user.userName).charAt(0).toUpperCase() : 'U'}
                                </div>
                                <div className="hidden md:flex flex-col items-start text-left">
                                    <span className="text-[13px] font-bold text-slate-800 leading-none group-hover:text-blue-600 transition-colors">{user?.userName || 'User'}</span>
                                    <span className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">{user?.userRole || 'Role'}</span>
                                </div>
                                <Icons.ChevronDown className="hidden md:block h-3.5 w-3.5 text-slate-400 transition-colors group-hover:text-slate-600 ml-1" />
                            </button>
                        }>
                            <div className="w-72 p-2 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)] border border-slate-200/80 rounded-2xl bg-white/95 backdrop-blur-xl text-left mt-2">
                                {/* Profile Header */}
                                <div className="flex items-center gap-3 px-3 py-3 border-b border-slate-100 mb-2">
                                    <div className="h-12 w-12 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-inner">
                                        {user?.userName ? String(user.userName).charAt(0).toUpperCase() : 'U'}
                                    </div>
                                    <div className="flex flex-col min-w-0">
                                        <p className="text-sm font-extrabold text-slate-900 truncate">{user?.userName}</p>
                                        <p className="text-xs font-medium text-slate-500 truncate">{user?.userIdentifier}</p>
                                    </div>
                                </div>
                                
                                <DropdownItem icon={Icons.User} label="My Profile" subtext="Account settings & preferences" target="profile" onClick={handleNav} />
                                <div className="border-t border-slate-100 my-1"></div>
                                <DropdownItem icon={Icons.LogOut} label="Sign Out" subtext="End your current session" target={logout} onClick={handleNav} isDestructive />
                            </div>
                        </Dropdown>

                        {/* Mobile Menu Hamburger */}
                        <button 
                            type="button" 
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
                            className="xl:hidden p-2.5 ml-1 rounded-xl text-slate-600 hover:bg-slate-100 focus:outline-none transition-colors"
                        >
                            {isMobileMenuOpen ? <Icons.Close className="w-6 h-6" /> : <Icons.Menu className="w-6 h-6" />}
                        </button>
                    </div>
                </div>
            </div>

            {/* --- 5. Premium Responsive Mobile Menu Overlay --- */}
            {isMobileMenuOpen && (
                <div className="xl:hidden absolute top-[73px] left-0 w-full h-[calc(100vh-73px)] bg-slate-900/20 backdrop-blur-md z- animate-fade-in text-left">
                    <div className="w-full max-h-full bg-white shadow-2xl overflow-y-auto border-t border-slate-200 pb-12 rounded-b-3xl">
                        
                        {/* Mobile Search */}
                        <div className="p-4 border-b border-slate-100 md:hidden">
                            <div className="relative">
                                <Icons.Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                                <input type="text" placeholder="Search..." className="w-full bg-slate-100 rounded-xl pl-10 pr-4 py-2.5 text-sm font-medium text-slate-800 outline-none focus:ring-2 focus:ring-blue-500" />
                            </div>
                        </div>

                        <div className="p-4 space-y-1 text-left">
                            <div className="px-3 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Navigation</div>
                            <button onClick={() => handleNav('home')} className={`w-full flex items-center px-4 py-3 rounded-xl text-[14px] font-bold ${isPageActive('home') ? 'bg-blue-50 text-blue-600' : 'text-slate-700 hover:bg-slate-50'}`}>Home Dashboard</button>
                            {permissions.canAddPosting && <button onClick={() => handleNav('new-posting')} className={`w-full flex items-center px-4 py-3 rounded-xl text-[14px] font-bold ${isPageActive('new-posting') ? 'bg-blue-50 text-blue-600' : 'text-slate-700 hover:bg-slate-50'}`}>Create New Posting</button>}
                            {permissions.canViewCandidates && <button onClick={() => handleNav('candidate-details')} className={`w-full flex items-center px-4 py-3 rounded-xl text-[14px] font-bold ${isPageActive('candidate-details') ? 'bg-blue-50 text-blue-600' : 'text-slate-700 hover:bg-slate-50'}`}>Candidate Pipeline</button>}
                            {permissions.canManageBenchSales && <button onClick={() => handleNav('bench-sales')} className={`w-full flex items-center px-4 py-3 rounded-xl text-[14px] font-bold ${isPageActive('bench-sales') ? 'bg-blue-50 text-blue-600' : 'text-slate-700 hover:bg-slate-50'}`}>Bench Sales</button>}
                            
                            {permissions.canViewDashboards && (
                                <div className="mt-4 mb-2">
                                    <div className="px-3 pt-3 pb-1 text-[10px] font-black text-slate-400 uppercase tracking-widest border-t border-slate-100">Board Views</div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                                        {Object.entries(DASHBOARD_CONFIGS).map(([key, config]) => (
                                            <button key={key} onClick={() => handleNav(`dashboard?key=${key}`)} className="flex flex-col items-start px-4 py-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-100 transition-colors">
                                                <span className="text-[13px] font-bold text-slate-800">{config.title}</span>
                                                <span className="text-[10px] font-medium text-slate-500 mt-0.5">{config.desc}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Aggregated Operations Menu for Mobile */}
                            {(permissions.canManageTimesheets || canSeeAssets || canSeeDocs || canSeeAdmin) && (
                                <div className="mt-6 mb-2">
                                    <div className="px-3 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest border-t border-slate-100">System Modules</div>
                                    <div className="space-y-1">
                                        {permissions.canManageTimesheets && <button onClick={() => handleNav('timesheets-dashboard')} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[14px] font-bold text-slate-700 hover:bg-slate-50"><Icons.Clock className="w-5 h-5 text-slate-400"/> Timesheet Management</button>}
                                        {canSeeAssets && <button onClick={() => handleNav('asset-dashboard')} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[14px] font-bold text-slate-700 hover:bg-slate-50"><Icons.Shield className="w-5 h-5 text-slate-400"/> Asset Inventory</button>}
                                        {canSeeDocs && <button onClick={() => handleNav('msa-wo-dashboard')} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[14px] font-bold text-slate-700 hover:bg-slate-50"><Icons.File className="w-5 h-5 text-slate-400"/> Documents & MSA</button>}
                                        {canSeeAdmin && <button onClick={() => handleNav('admin')} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[14px] font-bold text-slate-700 hover:bg-slate-50"><Icons.Settings className="w-5 h-5 text-slate-400"/> Administration</button>}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </header>
    );
};

export default memo(TopNav);