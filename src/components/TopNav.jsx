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

// --- Premium SVG Icons Library ---
const Icons = {
    ChevronDown: ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m6 9 6 6 6-6"/></svg>,
    Bell: ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>,
    Message: ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
    Search: ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>,
    Menu: ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></svg>,
    Close: ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><line x1="18" x2="6" y1="6" y2="18"/><line x1="6" x2="18" y1="6" y2="18"/></svg>,
    Layout: ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><line x1="3" x2="21" y1="9" y2="9"/><line x1="9" x2="9" y1="21" y2="9"/></svg>,
    PlusCircle: ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10"/><path d="M8 12h8"/><path d="M12 8v8"/></svg>,
    Users: ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
    TrendingUp: ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>,
    Building: ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect x="4" y="2" width="16" height="20" rx="2" ry="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M12 6h.01"/><path d="M12 10h.01"/><path d="M12 14h.01"/><path d="M16 10h.01"/><path d="M16 14h.01"/><path d="M8 10h.01"/><path d="M8 14h.01"/></svg>,
    UserPlus: ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>,
    Clock: ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
    Laptop: ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M20 16V7a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v9m16 0H4m16 0 1.28 2.55a1 1 0 0 1-.9 1.45H3.62a1 1 0 0 1-.9-1.45L4 16"/></svg>,
    Store: ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"/><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4"/><path d="M2 7h20"/><path d="M22 7v3a2 2 0 0 1-2 2v0a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 16 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 12 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 8 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 4 12v0a2 2 0 0 1-2-2V7"/></svg>,
    FileSignature: ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><path d="m15.5 15.5-2.5 2.5a2.12 2.12 0 1 1-3-3l2.5-2.5"/><path d="m12 18-2-2"/><path d="m10.5 17.5-2 2a2.12 2.12 0 1 1-3-3l2-2"/></svg>,
    FileText: ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/></svg>,
    PieChart: ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M21.21 15.89A10 10 0 1 1 8 2.83"/><path d="M22 12A10 10 0 0 0 12 2v10z"/></svg>,
    Settings: ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
    Calendar: ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>,
    CheckSquare: ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>,
    User: ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
    LogOut: ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>
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

// --- Enhanced DropdownItem WITH ICONS ---
const DropdownItem = memo(({ label, target, onClick, isDestructive, icon: Icon }) => {
    const dropdownContext = useDropdown();
    const close = dropdownContext ? dropdownContext.close : null;

    const handleClick = () => { onClick(target); if (close) close(); };

    return (
        <button 
            type="button" 
            onClick={handleClick} 
            className={`w-full group flex items-center gap-3 px-3.5 py-2.5 text-[13px] font-bold rounded-lg transition-colors ${isDestructive ? 'text-red-600 hover:bg-red-50' : 'text-slate-700 hover:bg-slate-50 hover:text-blue-700'}`}
        >
            {Icon && (
                <Icon className={`w-4 h-4 shrink-0 transition-colors ${isDestructive ? 'text-red-400 group-hover:text-red-600' : 'text-slate-400 group-hover:text-blue-600'}`} />
            )}
            <span className="truncate">{label}</span>
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
    
    // --- Global Search State ---
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearchFocused, setIsSearchFocused] = useState(false);
    const searchRef = useRef(null);

    const prevNotifLengthRef = useRef(0);
    const prevMsgCountRef = useRef(0);
    const audioRef = useRef(null);

    const isPageActive = useCallback((target) => {
        if (Array.isArray(target)) return target.some(t => location.pathname === `/${t.replace(/^\//, '')}`);
        return location.pathname === `/${target.replace(/^\//, '')}`;
    }, [location.pathname]);

    const handleNav = useCallback((target) => {
        setIsMobileMenuOpen(false);
        setSearchQuery('');
        setIsSearchFocused(false);
        if (typeof target === 'function') { target(); } 
        else { navigate(target.startsWith('/') ? target : `/${target}`); }
    }, [navigate]);

    const triggerClass = useCallback((targets) => {
        const isActive = isPageActive(targets);
        return `flex items-center gap-1.5 px-3 py-2 rounded-lg text-[13px] font-bold transition-all duration-200 cursor-pointer whitespace-nowrap tracking-wide ${isActive ? 'bg-blue-50 text-blue-700 shadow-sm' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`;
    }, [isPageActive]);

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

    // --- Dynamic Permission Groups ---
    const canSeeAdmin = permissions.canAccessAdmin;
    const canSeeAssets = permissions.canAccessAssets;
    const canSeeDocs = permissions.canAccessDocs;

    const showRecruitment = permissions.canAddPosting || permissions.canViewCandidates || permissions.canManageBenchSales;
    const showOperations = permissions.canManageTimesheets || canSeeAssets;
    const showDocsReports = canSeeDocs || permissions.canViewReports;

    // --- Search Engine Mapping ---
    const searchableRoutes = useMemo(() => {
        const routes = [{ label: 'Home Dashboard', category: 'General', target: 'home' }];
        
        if (permissions.canViewDashboards) {
            Object.entries(DASHBOARD_CONFIGS).forEach(([key, config]) => {
                routes.push({ label: `${config.title} Board`, category: 'Dashboards', target: `dashboard?key=${key}` });
            });
        }
        
        if (permissions.canAddPosting) routes.push({ label: 'New Posting', category: 'Recruitment', target: 'new-posting' });
        if (permissions.canViewCandidates) routes.push({ label: 'Candidates List', category: 'Recruitment', target: 'candidate-details' });
        if (permissions.canManageBenchSales) routes.push({ label: 'Bench Sales', category: 'Recruitment', target: 'bench-sales' });
        if (permissions.canViewReports) routes.push({ label: 'Master Reports', category: 'Documents & Reports', target: 'reports' });
        if (permissions.canMessage) routes.push({ label: 'Direct Messages', category: 'Communication', target: 'messages' });

        if (permissions.canManageTimesheets) {
            routes.push({ label: 'Create Timesheet Company', category: 'Operations', target: 'create-timesheet-company' });
            routes.push({ label: 'Manage Companies', category: 'Operations', target: 'manage-companies' });
            routes.push({ label: 'Create Employee', category: 'Operations', target: 'create-timesheet-employee' });
            routes.push({ label: 'Manage Employees', category: 'Operations', target: 'manage-timesheet-employees' });
            routes.push({ label: 'Log Hours', category: 'Operations', target: 'log-hours' });
            routes.push({ label: 'Timesheet Dashboard', category: 'Operations', target: 'timesheets-dashboard' });
        }

        if (canSeeAssets) {
            if (permissions.canManageAssets) routes.push({ label: 'Create Asset', category: 'Operations', target: 'create-asset' });
            routes.push({ label: 'Asset Dashboard', category: 'Operations', target: 'asset-dashboard' });
        }

        if (canSeeDocs) {
            if (permissions.canManageMSAWO) {
                routes.push({ label: 'Create Vendor', category: 'Documents & Reports', target: 'create-msa-wo-vendor-company' });
                routes.push({ label: 'Manage Vendors', category: 'Documents & Reports', target: 'manage-msa-wo-vendor-companies' });
                routes.push({ label: 'Create MSA/WO', category: 'Documents & Reports', target: 'create-msa-wo' });
                routes.push({ label: 'MSA/WO Dashboard', category: 'Documents & Reports', target: 'msa-wo-dashboard' });
            }
            if (permissions.canManageOfferLetters) {
                routes.push({ label: 'Create Offer Letter', category: 'Documents & Reports', target: 'create-offer-letter' });
                routes.push({ label: 'Offer Letter Dashboard', category: 'Documents & Reports', target: 'offer-letter-dashboard' });
            }
        }

        if (canSeeAdmin) {
            if (permissions.canEditUsers) routes.push({ label: 'User Management', category: 'Admin Panel', target: 'admin' });
            if (permissions.canManageHolidays) routes.push({ label: 'Manage Holidays', category: 'Admin Panel', target: 'manage-holidays' });
            if (permissions.canManageLeaveConfig) routes.push({ label: 'Leave Config', category: 'Admin Panel', target: 'leave-config' });
            if (permissions.canApproveLeave) routes.push({ label: 'Approve Leave', category: 'Admin Panel', target: 'approve-leave' });
            if (permissions.canApproveAttendance) routes.push({ label: 'Approve Attendance', category: 'Admin Panel', target: 'approve-attendance' });
            if (permissions.canSendMonthlyReport) routes.push({ label: 'Monthly Reports', category: 'Admin Panel', target: 'monthly-attendance-report' });
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
        <header className="sticky top-0 z-50 w-full border-b border-slate-200/80 bg-white/90 backdrop-blur-2xl shadow-sm text-left">
            <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-[72px] gap-6">
                    
                    {/* --- 1. Old School Brand Logo --- */}
                    <div className="flex flex-col items-center cursor-pointer group shrink-0" onClick={() => handleNav('home')}>
                        <img src={LOGO_URL} alt="Taproot Logo" className="h-10 w-auto object-contain mb-0.5" />
                        <h1 className="text-[9px] font-black tracking-[0.15em] text-slate-900 uppercase leading-none">Vendor Management Portal</h1>
                        <div className="w-6 h-[2px] bg-blue-600 mt-1 rounded-full group-hover:w-full transition-all duration-300" />
                    </div>

                    {/* --- 2. Clean Dropdown Navigation (align="left" stops overlap) --- */}
                    <nav className="hidden xl:flex items-center gap-1.5 py-1">
                        <NavButton label="Home" target="home" isActive={isPageActive('home')} onClick={handleNav} />
                        
                        {/* --- ENTERPRISE RECRUITMENT HUB MEGA DROPDOWN (Dual Column Layout) --- */}
                        {(showRecruitment || permissions.canViewDashboards || permissions.canViewReports) && (
                            <Dropdown align="left" trigger={
                                <button className={triggerClass(['new-posting', 'candidate-details', 'bench-sales', 'dashboard', 'reports'])}>
                                    Recruitment Hub <Icons.ChevronDown className="text-slate-400" />
                                </button>
                            }>
                                <div className="w-[620px] p-4 bg-white rounded-2xl border border-slate-200 shadow-2xl flex gap-6 text-left max-h-[85vh] overflow-y-auto custom-scrollbar">
                                    
                                    {/* Left Column: Actions & Analytics */}
                                    <div className="w-52 shrink-0 flex flex-col gap-4">
                                        {showRecruitment && (
                                            <div className="flex flex-col gap-0.5">
                                                <div className="px-3.5 py-1 text-[10px] font-black text-slate-400 uppercase tracking-widest">Actions</div>
                                                {permissions.canAddPosting && <DropdownItem icon={Icons.PlusCircle} label="New Posting" target="new-posting" onClick={handleNav} />}
                                                {permissions.canViewCandidates && <DropdownItem icon={Icons.Users} label="Candidates" target="candidate-details" onClick={handleNav} />}
                                                {permissions.canManageBenchSales && <DropdownItem icon={Icons.TrendingUp} label="Bench Sales" target="bench-sales" onClick={handleNav} />}
                                            </div>
                                        )}
                                        
                                        {permissions.canViewReports && (
                                            <div className="flex flex-col gap-0.5 mt-auto">
                                                <div className="px-3.5 py-1 text-[10px] font-black text-slate-400 uppercase tracking-widest">Analytics</div>
                                                <DropdownItem icon={Icons.PieChart} label="Master Reports" target="reports" onClick={handleNav} />
                                            </div>
                                        )}
                                    </div>

                                    {/* Vertical Divider Line */}
                                    <div className="w-px bg-slate-100 self-stretch" />

                                    {/* Right Column: VMS Boards Grid Layout */}
                                    {permissions.canViewDashboards && (
                                        <div className="flex-1">
                                            <div className="px-3.5 py-1 mb-1 text-[10px] font-black text-slate-400 uppercase tracking-widest">Openings Dashboard</div>
                                            <div className="grid grid-cols-2 gap-x-2 gap-y-0.5">
                                                {Object.entries(DASHBOARD_CONFIGS).map(([key, config]) => (
                                                    <DropdownItem key={key} icon={Icons.Layout} label={config.title} target={`dashboard?key=${key}`} onClick={handleNav} />
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </Dropdown>
                        )}

                        {/* --- ENTERPRISE OPERATIONS DROPDOWN (Dual Column Layout) --- */}
                        {showOperations && (
                            <Dropdown align="left" trigger={
                                <button className={triggerClass(['create-timesheet-company', 'manage-companies', 'create-timesheet-employee', 'manage-timesheet-employees', 'log-hours', 'timesheets-dashboard', 'create-asset', 'asset-dashboard'])}>
                                    Operations <Icons.ChevronDown className="text-slate-400" />
                                </button>
                            }>
                                <div className="w-[500px] p-4 bg-white rounded-2xl border border-slate-200 shadow-2xl flex gap-6 text-left max-h-[85vh] overflow-y-auto custom-scrollbar">
                                    {permissions.canManageTimesheets && (
                                        <div className="flex-1 flex flex-col gap-0.5">
                                            <div className="px-3.5 py-1 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Timesheets</div>
                                            <DropdownItem icon={Icons.Building} label="Create Company" target="create-timesheet-company" onClick={handleNav} />
                                            <DropdownItem icon={Icons.Building} label="Manage Companies" target="manage-companies" onClick={handleNav} />
                                            <DropdownItem icon={Icons.UserPlus} label="Create Employee" target="create-timesheet-employee" onClick={handleNav} />
                                            <DropdownItem icon={Icons.Users} label="Manage Employees" target="manage-timesheet-employees" onClick={handleNav} />
                                            <DropdownItem icon={Icons.Clock} label="Log Hours" target="log-hours" onClick={handleNav} />
                                            <DropdownItem icon={Icons.Layout} label="Timesheets Dashboard" target="timesheets-dashboard" onClick={handleNav} />
                                        </div>
                                    )}
                                    
                                    {canSeeAssets && (
                                        <>
                                            {permissions.canManageTimesheets && <div className="w-px bg-slate-100 self-stretch" />}
                                            <div className="w-48 shrink-0 flex flex-col gap-0.5">
                                                <div className="px-3.5 py-1 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Assets</div>
                                                {permissions.canManageAssets && <DropdownItem icon={Icons.PlusCircle} label="Create Asset" target="create-asset" onClick={handleNav} />}
                                                <DropdownItem icon={Icons.Laptop} label="Asset Dashboard" target="asset-dashboard" onClick={handleNav} />
                                            </div>
                                        </>
                                    )}
                                </div>
                            </Dropdown>
                        )}

                        {/* --- ENTERPRISE DOCS & REPORTS DROPDOWN (Dual Column Layout) --- */}
                        {showDocsReports && canSeeDocs && (
                            <Dropdown align="left" trigger={
                                <button className={triggerClass(['msa-wo-dashboard', 'offer-letter-dashboard', 'create-msa-wo-vendor-company', 'manage-msa-wo-vendor-companies', 'create-msa-wo', 'create-offer-letter'])}>
                                    Docs & Reports <Icons.ChevronDown className="text-slate-400" />
                                </button>
                            }>
                                <div className="w-[460px] p-4 bg-white rounded-2xl border border-slate-200 shadow-2xl flex gap-6 text-left max-h-[85vh] overflow-y-auto custom-scrollbar">
                                    {permissions.canManageMSAWO && (
                                        <div className="flex-1 flex flex-col gap-0.5">
                                            <div className="px-3.5 py-1 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">MSA & WO</div>
                                            <DropdownItem icon={Icons.Store} label="Create Vendor" target="create-msa-wo-vendor-company" onClick={handleNav} />
                                            <DropdownItem icon={Icons.Store} label="Manage Vendors" target="manage-msa-wo-vendor-companies" onClick={handleNav} />
                                            <DropdownItem icon={Icons.FileSignature} label="Create MSA/WO" target="create-msa-wo" onClick={handleNav} />
                                            <DropdownItem icon={Icons.FileText} label="MSA & WO Dashboard" target="msa-wo-dashboard" onClick={handleNav} />
                                        </div>
                                    )}
                                    
                                    {permissions.canManageOfferLetters && (
                                        <>
                                            {permissions.canManageMSAWO && <div className="w-px bg-slate-100 self-stretch" />}
                                            <div className="w-44 shrink-0 flex flex-col gap-0.5">
                                                <div className="px-3.5 py-1 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Offer Letter</div>
                                                <DropdownItem icon={Icons.FileSignature} label="Create Letter" target="create-offer-letter" onClick={handleNav} />
                                                <DropdownItem icon={Icons.FileText} label="Offer Letters Dashboard" target="offer-letter-dashboard" onClick={handleNav} />
                                            </div>
                                        </>
                                    )}
                                </div>
                            </Dropdown>
                        )}

                        {/* --- ENTERPRISE ADMINISTRATION DROPDOWN (Grid Layout Structure) --- */}
                        {canSeeAdmin && (
                            <Dropdown align="left" trigger={
                                <button className={triggerClass(['admin', 'manage-holidays', 'leave-config', 'approve-leave', 'approve-attendance', 'monthly-attendance-report'])}>
                                    Admin <Icons.ChevronDown className="text-slate-400" />
                                </button>
                            }>
                                <div className="w-[460px] p-4 bg-white rounded-2xl border border-slate-200 shadow-2xl text-left max-h-[85vh] overflow-y-auto custom-scrollbar">
                                    <div className="px-3.5 py-1 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 border-b border-slate-50 pb-1">Administration Panel</div>
                                    <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
                                        {permissions.canEditUsers && <DropdownItem icon={Icons.Users} label="User Management" target="admin" onClick={handleNav} />}
                                        {permissions.canManageHolidays && <DropdownItem icon={Icons.Calendar} label="Manage Holidays" target="manage-holidays" onClick={handleNav} />}
                                        {permissions.canManageLeaveConfig && <DropdownItem icon={Icons.Settings} label="Leave Config" target="leave-config" onClick={handleNav} />}
                                        {permissions.canApproveLeave && <DropdownItem icon={Icons.CheckSquare} label="Approve Leave" target="approve-leave" onClick={handleNav} />}
                                        {permissions.canApproveAttendance && <DropdownItem icon={Icons.CheckSquare} label="Approve Attendance" target="approve-attendance" onClick={handleNav} />}
                                        {permissions.canSendMonthlyReport && <DropdownItem icon={Icons.PieChart} label="Monthly Attendance Reports" target="monthly-attendance-report" onClick={handleNav} />}
                                    </div>
                                </div>
                            </Dropdown>
                        )}
                    </nav>

                    {/* --- 3. Live Functional Search Bar --- */}
                    <div className="hidden md:block relative z-50 ml-auto xl:ml-4" ref={searchRef}>
                        <div className="relative group">
                            <Icons.Search className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                            <input 
                                type="text" 
                                placeholder="Search navigation..." 
                                value={searchQuery}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value);
                                    setIsSearchFocused(true);
                                }}
                                onFocus={() => setIsSearchFocused(true)}
                                className="w-56 lg:w-64 bg-slate-100/50 border border-slate-200 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 rounded-full pl-10 pr-4 py-2 text-[13px] font-bold text-slate-800 transition-all outline-none placeholder:font-medium placeholder:text-slate-400" 
                            />
                        </div>

                        {/* Search Results Dropdown */}
                        {isSearchFocused && searchQuery.trim() !== '' && (
                            <div className="absolute top-full right-0 mt-2 w-72 bg-white rounded-xl border border-slate-200 shadow-xl overflow-hidden text-left animate-dropdown z-50">
                                <div className="max-h-[300px] overflow-y-auto py-1 custom-scrollbar">
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

                    {/* --- 4. Right Actions Section (Icons & Profile) --- */}
                    <div className="flex items-center gap-1.5 shrink-0 text-left">
                        
                        {permissions.canMessage && (
                            <button onClick={() => handleNav('messages')} className="relative p-2.5 rounded-full text-slate-500 hover:bg-slate-100 hover:text-blue-600 transition-colors focus:outline-none">
                                <Icons.Message className="w-5 h-5" />
                                {unreadMessagesCount > 0 && (
                                    <span className="absolute top-1.5 right-1.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-blue-600 text-[9px] font-black text-white ring-2 ring-white animate-pulse">
                                        {unreadMessagesCount}
                                    </span>
                                )}
                            </button>
                        )}

                        <Dropdown trigger={
                            <button type="button" className="relative p-2.5 rounded-full text-slate-500 hover:bg-slate-100 hover:text-blue-600 transition-colors focus:outline-none">
                                <Icons.Bell className="w-5 h-5" />
                                {notifications.length > 0 && (
                                    <span className="absolute top-1.5 right-1.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-red-500 text-[9px] font-black text-white ring-2 ring-white">
                                        {notifications.length}
                                    </span>
                                )}
                            </button>
                        }>
                            <div className="w-80 sm:w-96 bg-white rounded-xl border border-slate-200 shadow-xl overflow-hidden text-left py-1">
                                <div className="flex justify-between items-center px-4 py-3 border-b border-slate-100">
                                    <h4 className="font-bold text-slate-800 text-xs uppercase tracking-widest">Notifications</h4>
                                    {notifications.length > 0 && (
                                        <button onClick={handleMarkAsRead} className="text-[11px] font-bold text-blue-600 hover:text-blue-800 transition-colors bg-blue-50 px-2 py-0.5 rounded-md">Mark read</button>
                                    )}
                                </div>
                                <div className="max-h-[300px] overflow-y-auto custom-scrollbar text-left">
                                    {notifications.length > 0 ? notifications.map((n, idx) => (
                                        <div key={n.id || idx} className="px-4 py-3 border-b border-slate-50 hover:bg-slate-50 transition-colors text-left">
                                            <p className="text-[13px] text-slate-800 font-medium leading-snug break-words">{n.message}</p>
                                            <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-wide">{new Date(n.timestamp).toLocaleString()}</p>
                                        </div>
                                    )) : (
                                        <div className="py-12 text-center flex flex-col items-center justify-center text-slate-400">
                                            <Icons.Bell className="w-8 h-8 mb-2 opacity-30" />
                                            <p className="text-sm font-bold">You're all caught up</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </Dropdown>

                        <div className="hidden md:block w-px h-6 bg-slate-200 mx-1"></div>

                        {/* Profile Dropdown */}
                        <Dropdown trigger={
                             <button type="button" className="flex items-center gap-2.5 p-1 pr-3 hover:bg-slate-50 rounded-full transition-colors group border border-transparent hover:border-slate-200">
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
                                <DropdownItem icon={Icons.User} label="My Profile" target="profile" onClick={handleNav} />
                                <div className="border-t border-slate-100 my-1"></div>
                                <DropdownItem icon={Icons.LogOut} label="Sign Out" target={logout} onClick={handleNav} isDestructive />
                            </div>
                        </Dropdown>

                        {/* Mobile Menu Hamburger */}
                        <button 
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
                            className="xl:hidden p-2 rounded-xl text-slate-500 hover:bg-slate-100 focus:outline-none transition-colors ml-1"
                        >
                            {isMobileMenuOpen ? <Icons.Close className="w-6 h-6" /> : <Icons.Menu className="w-6 h-6" />}
                        </button>
                    </div>
                </div>
            </div>

            {/* --- 5. Mobile Full-Screen Grouped Menu --- */}
            {isMobileMenuOpen && (
                <div className="xl:hidden absolute top-[72px] left-0 w-full bg-white shadow-2xl border-t border-slate-100 z-50 max-h-[calc(100vh-72px)] overflow-y-auto">
                    <div className="px-4 py-4 space-y-1 text-left">
                        
                        {/* Mobile Search */}
                        <div className="mb-4 md:hidden relative">
                            <Icons.Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                            <input 
                                type="text" 
                                placeholder="Search navigation..." 
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 bg-slate-100 rounded-xl text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500" 
                            />
                            {searchQuery.trim() !== '' && (
                                <div className="mt-2 bg-slate-50 rounded-xl border border-slate-100 max-h-48 overflow-y-auto">
                                    {filteredSearchResults.length > 0 ? (
                                        filteredSearchResults.map((route, idx) => (
                                            <button key={idx} onClick={() => handleNav(route.target)} className="w-full text-left px-4 py-2 border-b border-slate-100 last:border-0 hover:bg-slate-200">
                                                <p className="text-[13px] font-bold text-slate-800">{route.label}</p>
                                            </button>
                                        ))
                                    ) : (
                                        <div className="p-4 text-center text-xs text-slate-500 font-bold">No results found</div>
                                    )}
                                </div>
                            )}
                        </div>

                        <button onClick={() => handleNav('home')} className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold ${isPageActive('home') ? 'bg-blue-50 text-blue-700' : 'text-slate-700 hover:bg-slate-50'}`}>Home Dashboard</button>
                        
                        {/* Merged Mobile Recruitment Hub */}
                        {(showRecruitment || permissions.canViewDashboards || permissions.canViewReports) && (
                            <div className="mt-4 mb-2">
                                <div className="px-4 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest border-t border-slate-100">Recruitment Hub</div>
                                
                                {showRecruitment && (
                                    <div className="space-y-1 mb-2">
                                        {permissions.canAddPosting && <button onClick={() => handleNav('new-posting')} className={`w-full text-left px-4 py-2.5 rounded-xl text-[13px] font-bold flex items-center gap-2 ${isPageActive('new-posting') ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'}`}><Icons.PlusCircle className="w-4 h-4"/> New Posting</button>}
                                        {permissions.canViewCandidates && <button onClick={() => handleNav('candidate-details')} className={`w-full text-left px-4 py-2.5 rounded-xl text-[13px] font-bold flex items-center gap-2 ${isPageActive('candidate-details') ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'}`}><Icons.Users className="w-4 h-4"/> Candidates</button>}
                                        {permissions.canManageBenchSales && <button onClick={() => handleNav('bench-sales')} className={`w-full text-left px-4 py-2.5 rounded-xl text-[13px] font-bold flex items-center gap-2 ${isPageActive('bench-sales') ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'}`}><Icons.TrendingUp className="w-4 h-4"/> Bench Sales</button>}
                                    </div>
                                )}

                                {permissions.canViewDashboards && (
                                    <div className="mb-2">
                                        <div className="px-4 py-1 text-[9px] font-bold text-slate-400 uppercase tracking-widest">Active Boards</div>
                                        <div className="grid grid-cols-2 gap-2 mt-1 px-2">
                                            {Object.entries(DASHBOARD_CONFIGS).map(([key, config]) => (
                                                <button key={key} onClick={() => handleNav(`dashboard?key=${key}`)} className="flex flex-col text-left px-4 py-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-100 transition-colors">
                                                    <span className="text-[13px] font-bold text-slate-800">{config.title}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {permissions.canViewReports && (
                                    <div>
                                        <div className="px-4 py-1 text-[9px] font-bold text-slate-400 uppercase tracking-widest">Analytics</div>
                                        <button onClick={() => handleNav('reports')} className="w-full text-left px-4 py-2.5 rounded-xl text-[13px] font-bold text-slate-600 hover:bg-slate-50 flex items-center gap-2"><Icons.PieChart className="w-4 h-4"/> Master Reports</button>
                                    </div>
                                )}
                            </div>
                        )}

                        {showOperations && (
                            <div className="mt-4 mb-2">
                                <div className="px-4 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest border-t border-slate-100">Operations</div>
                                {permissions.canManageTimesheets && <button onClick={() => handleNav('timesheets-dashboard')} className="w-full text-left px-4 py-2.5 rounded-xl text-[13px] font-bold text-slate-600 hover:bg-slate-50 flex items-center gap-2"><Icons.Clock className="w-4 h-4"/> Timesheet Management</button>}
                                {canSeeAssets && <button onClick={() => handleNav('asset-dashboard')} className="w-full text-left px-4 py-2.5 rounded-xl text-[13px] font-bold text-slate-600 hover:bg-slate-50 flex items-center gap-2"><Icons.Laptop className="w-4 h-4"/> Asset Inventory</button>}
                            </div>
                        )}

                        {showDocsReports && canSeeDocs && (
                            <div className="mt-4 mb-2">
                                <div className="px-4 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest border-t border-slate-100">Docs & Reports</div>
                                <button onClick={() => handleNav('msa-wo-dashboard')} className="w-full text-left px-4 py-2.5 rounded-xl text-[13px] font-bold text-slate-600 hover:bg-slate-50 flex items-center gap-2"><Icons.FileSignature className="w-4 h-4"/> Documents (MSA/Offers)</button>
                            </div>
                        )}

                        {canSeeAdmin && (
                            <div className="mt-4 mb-6">
                                <div className="px-4 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest border-t border-slate-100">Admin</div>
                                <button onClick={() => handleNav('admin')} className="w-full text-left px-4 py-2.5 rounded-xl text-[13px] font-bold text-slate-600 hover:bg-slate-50 flex items-center gap-2"><Icons.Settings className="w-4 h-4"/> System Administration</button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </header>
    );
};

export default memo(TopNav);