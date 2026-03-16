import React, { useState, useEffect, useCallback, useRef, memo } from 'react';
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
    'DeloitteDisplay': { title: 'Deloitte Taproot' }
};

const LOGO_URL = "https://vmsdashboardea.blob.core.windows.net/images/Company_logo.png?sp=r&st=2026-03-16T20:51:06Z&se=2026-03-17T05:06:06Z&sv=2024-11-04&sr=b&sig=OkdvwYLGhv3wMw9QfKb2QXE3B14ruv6q0GGKvJEnEkc%3D";

// --- Icons (Memoized) ---
const ChevronDownIcon = memo(({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m6 9 6 6 6-6"/></svg>
));

const BellIcon = memo(({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>
));

// --- NavButton ---
const NavButton = memo(({ label, target, isActive, onClick }) => {
    const baseClass = "px-3 py-2 rounded-md text-sm font-bold uppercase tracking-wider transition-colors cursor-pointer select-none text-left";
    const activeClass = "bg-blue-50 text-blue-700 ring-1 ring-blue-100";
    const inactiveClass = "text-slate-500 hover:bg-slate-50 hover:text-slate-900";

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
            className={`w-full text-left block px-4 py-2.5 text-sm font-semibold transition-colors ${isDestructive ? 'text-red-600 hover:bg-red-50' : 'text-slate-700 hover:bg-slate-50 hover:text-blue-600'}`}
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
        return location.pathname === `/${target.replace(/^\//, '')}`;
    };

    const handleNav = useCallback((target) => {
        if (typeof target === 'function') {
            target(); 
        } else {
            const cleanPath = target.startsWith('/') ? target : `/${target}`;
            navigate(cleanPath);
        }
    }, [navigate]);

    const getLinkClass = (target) => {
        const base = "px-3 py-2 rounded-md text-sm font-bold uppercase tracking-wider transition-colors cursor-pointer";
        const active = "bg-blue-50 text-blue-700 ring-1 ring-blue-100";
        const inactive = "text-slate-500 hover:bg-slate-50 hover:text-slate-900";
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
        <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white shadow-sm">
            <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-20">
                    <div className="flex items-center gap-8">
                        {/* Taproot Identity Section */}
                        <div className="flex flex-col items-center cursor-pointer group" onClick={() => handleNav('home')}>
                            <img src={LOGO_URL} alt="Taproot Logo" className="h-8 w-auto mb-1" />
                            <h1 className="text-[9px] font-black tracking-[0.2em] text-slate-900 uppercase leading-none">VMS Portal</h1>
                            <div className="w-6 h-0.5 bg-blue-600 mt-1 rounded-full group-hover:w-full transition-all duration-300" />
                        </div>

                        <nav className="hidden lg:flex items-center gap-1">
                            <NavButton label="Home" target="home" isActive={isPageActive('home')} onClick={handleNav} />
                            
                            {permissions.canViewDashboards && (
                                <Dropdown trigger={
                                    <button className={`flex items-center gap-1 ${getLinkClass('dashboard')}`}>
                                        Dashboards <ChevronDownIcon className="text-slate-400" />
                                    </button>
                                }>
                                    <div className="w-56 py-1 shadow-xl border border-slate-100 rounded-xl">
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
                                    {unreadMessagesCount > 0 && (
                                        <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white ring-2 ring-white">
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
                                    <div className="w-60 py-1 shadow-xl border border-slate-100 rounded-xl">
                                        <DropdownItem label="Create Company" target="create-timesheet-company" onClick={handleNav} />
                                        <DropdownItem label="Manage Companies" target="manage-companies" onClick={handleNav} />
                                        <DropdownItem label="Create Employee" target="create-timesheet-employee" onClick={handleNav} />
                                        <DropdownItem label="Manage Employees" target="manage-timesheet-employees" onClick={handleNav} />
                                        <div className="border-t border-slate-100 my-1" />
                                        <DropdownItem label="Log Hours" target="log-hours" onClick={handleNav} />
                                        <DropdownItem label="Dashboard" target="timesheets-dashboard" onClick={handleNav} />
                                    </div>
                                </Dropdown>
                            )}

                            {showAssetDropdown && (
                                <Dropdown trigger={
                                    <button className={`flex items-center gap-1 ${getLinkClass(['create-asset', 'asset-dashboard'])}`}>
                                        Assets <ChevronDownIcon className="text-slate-400" />
                                    </button>
                                }>
                                    <div className="w-56 py-1 shadow-xl border border-slate-100 rounded-xl">
                                        {permissions.canManageAssets && <DropdownItem label="Create Asset" target="create-asset" onClick={handleNav} />}
                                        <DropdownItem label="Asset Dashboard" target="asset-dashboard" onClick={handleNav} />
                                    </div>
                                </Dropdown>
                            )}

                            {(permissions.canManageMSAWO || permissions.canManageOfferLetters) && (
                                <Dropdown trigger={
                                    <button className={`flex items-center gap-1 ${getLinkClass(['msa-wo-dashboard', 'offer-letter-dashboard'])}`}>
                                        Documents <ChevronDownIcon className="text-slate-400" />
                                    </button>
                                }>
                                    <div className="w-64 py-1 shadow-xl border border-slate-100 rounded-xl">
                                        {permissions.canManageMSAWO && (
                                            <>
                                                <div className="px-4 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50/50">MSA & WO</div>
                                                <DropdownItem label="Create Vendor" target="create-msa-wo-vendor-company" onClick={handleNav} />
                                                <DropdownItem label="Manage Vendors" target="manage-msa-wo-vendor-companies" onClick={handleNav} />
                                                <DropdownItem label="Create MSA/WO" target="create-msa-wo" onClick={handleNav} />
                                                <DropdownItem label="Dashboard" target="msa-wo-dashboard" onClick={handleNav} />
                                            </>
                                        )}
                                        {permissions.canManageOfferLetters && (
                                            <>
                                                <div className="border-t border-slate-100 my-1"></div>
                                                <div className="px-4 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50/50">Offer Letter</div>
                                                <DropdownItem label="Create Letter" target="create-offer-letter" onClick={handleNav} />
                                                <DropdownItem label="Dashboard" target="offer-letter-dashboard" onClick={handleNav} />
                                            </>
                                        )}
                                    </div>
                                </Dropdown>
                            )}

                            {showAdminDropdown && (
                                <Dropdown trigger={
                                    <button className={`flex items-center gap-1 ${getLinkClass(['admin', 'manage-holidays', 'leave-config', 'approve-leave', 'approve-attendance', 'monthly-attendance-report'])}`}>
                                        Admin <ChevronDownIcon className="text-slate-400" />
                                    </button>
                                }>
                                    <div className="w-60 py-1 shadow-xl border border-slate-100 rounded-xl">
                                        {permissions.canEditUsers && <DropdownItem label="User Management" target="admin" onClick={handleNav} />}
                                        <div className="border-t border-slate-100 my-1" />
                                        {permissions.canManageHolidays && <DropdownItem label="Manage Holidays" target="manage-holidays" onClick={handleNav} />}
                                        {permissions.canManageLeaveConfig && <DropdownItem label="Leave Config" target="leave-config" onClick={handleNav} />}
                                        {permissions.canApproveLeave && <DropdownItem label="Approve Leave" target="approve-leave" onClick={handleNav} />}
                                        {permissions.canApproveAttendance && <DropdownItem label="Approve Attendance" target="approve-attendance" onClick={handleNav} />}
                                        {permissions.canSendMonthlyReport && <DropdownItem label="Monthly Reports" target="monthly-attendance-report" onClick={handleNav} />}
                                    </div>
                                </Dropdown>
                            )}
                        </nav>
                    </div>

                    <div className="flex items-center gap-4">
                        <Dropdown width="96" trigger={
                            <button type="button" className="relative p-2 text-slate-500 hover:text-blue-600 transition-colors focus:outline-none">
                                <BellIcon />
                                {notifications.length > 0 && (
                                    <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-white">
                                        {notifications.length}
                                    </span>
                                )}
                            </button>
                        }>
                            <div className="w-96 shadow-2xl border border-slate-100 rounded-2xl overflow-hidden">
                                <div className="flex justify-between items-center p-4 border-b border-slate-100 bg-slate-50/50">
                                    <h4 className="font-bold text-slate-800 text-sm tracking-tight">Notifications</h4>
                                    {notifications.length > 0 && <button onClick={handleMarkAsRead} className="text-[11px] font-black uppercase text-blue-600 hover:text-blue-800">Clear All</button>}
                                </div>
                                <div className="max-h-[350px] overflow-y-auto scrollbar-thin">
                                    {notifications.length > 0 ? notifications.map((n, idx) => (
                                        <div key={n.id || idx} className="p-4 border-b border-slate-50 hover:bg-slate-50 transition-colors">
                                            <p className="text-sm text-slate-700 leading-snug break-words">{n.message}</p>
                                            <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-wide">{new Date(n.timestamp).toLocaleString()}</p>
                                        </div>
                                    )) : <div className="py-12 text-center text-slate-400 italic text-sm">No new notifications</div>}
                                </div>
                            </div>
                        </Dropdown>

                        <Dropdown width="96" trigger={
                             <button type="button" className="flex items-center gap-3 hover:bg-slate-50 rounded-2xl pr-3 py-1.5 transition-all">
                                <div className="h-9 w-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md font-black">
                                    {user?.userName ? user.userName.charAt(0).toUpperCase() : 'U'}
                                </div>
                                <div className="hidden md:flex flex-col items-start text-left">
                                    <span className="text-sm font-bold text-slate-800 leading-none">{user?.userName || 'User'}</span>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">{user?.userRole || 'Role'}</span>
                                </div>
                                <ChevronDownIcon className="h-4 w-4 text-slate-300" />
                            </button>
                        }>
                            <div className="w-72 py-2 shadow-2xl border border-slate-100 rounded-2xl overflow-hidden bg-white">
                                <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50">
                                    <p className="text-sm font-bold text-slate-900 break-words leading-none mb-1">{user?.userName}</p>
                                    <p className="text-[11px] font-medium text-slate-400 break-all">{user?.userIdentifier}</p>
                                </div>
                                <div className="py-1">
                                    <DropdownItem label="Personal Profile" target="profile" onClick={handleNav} />
                                </div>
                                <div className="border-t border-slate-100 py-1">
                                    <DropdownItem label="Sign Out System" target={logout} onClick={handleNav} isDestructive />
                                </div>
                            </div>
                        </Dropdown>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default memo(TopNav);