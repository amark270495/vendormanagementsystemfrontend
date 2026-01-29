import React, { useState, useEffect, useCallback, useRef, memo } from 'react';
import { useAuth } from '../context/AuthContext';
import { usePermissions } from '../hooks/usePermissions';
import { apiService } from '../api/apiService';
import Dropdown from './Dropdown';

// --- Static Config & Icons (Defined once outside to save memory) ---
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

// --- Sub-components for Cleaner Rendering ---
// Wrapped in memo to prevent unnecessary redraws of individual buttons
const NavButton = memo(({ label, target, isActive, badgeCount, onClick }) => {
    const baseClass = "group relative inline-flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ease-in-out cursor-pointer";
    const activeClass = "bg-indigo-50 text-indigo-700";
    const inactiveClass = "text-slate-600 hover:bg-slate-50 hover:text-slate-900";

    return (
        <button 
            onClick={() => onClick(target)}
            className={`${baseClass} ${isActive ? activeClass : inactiveClass}`}
        >
            {label}
            {badgeCount > 0 && (
                <span className="ml-2 flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-bold text-white shadow-sm">
                    {badgeCount}
                </span>
            )}
        </button>
    );
});

const DropdownItem = memo(({ label, target, onClick, isDestructive }) => (
    <button 
        onClick={() => onClick(target)} 
        className={`w-full text-left block px-4 py-2.5 text-sm transition-colors ${isDestructive ? 'text-red-600 hover:bg-red-50' : 'text-slate-700 hover:bg-slate-50 hover:text-indigo-600'}`}
    >
        {label}
    </button>
));

const TopNav = ({ onNavigate, currentPage }) => {
    const { user, logout } = useAuth();
    
    // Destructure permissions
    const {
        canViewDashboards, canAddPosting, canViewReports, canViewCandidates, canEditUsers,
        canMessage, canManageTimesheets, canManageMSAWO, canManageOfferLetters, 
        canManageHolidays, canApproveLeave, canManageLeaveConfig, canApproveAttendance, canSendMonthlyReport
    } = usePermissions();

    const [notifications, setNotifications] = useState([]);
    const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);

    // --- PERFORMANCE OPTIMIZATION: Refs for Audio & Comparisons ---
    // Using refs allows us to compare values without adding them to useEffect dependencies (which causes loops)
    const prevNotifLengthRef = useRef(0);
    const prevMsgCountRef = useRef(0);
    const audioRef = useRef(null);

    // Initialize Audio once
    useEffect(() => {
        audioRef.current = {
            notification: new Audio('/sounds/notification.mp3'),
            message: new Audio('/sounds/message.mp3')
        };
    }, []);

    const playSound = (type) => {
        if (audioRef.current && audioRef.current[type]) {
            audioRef.current[type].play().catch(e => console.warn("Audio play blocked", e));
        }
    };

    // --- Optimized Fetch Logic ---
    const fetchNotifications = useCallback(async () => {
        if (!user?.userIdentifier) return;
        try {
            const response = await apiService.getNotifications(user.userIdentifier);
            const newNotifications = response?.data?.success ? (response.data.notifications || []) : [];
            
            // Compare length with Ref instead of State to avoid dependency loop
            if (newNotifications.length > prevNotifLengthRef.current && prevNotifLengthRef.current > 0) {
                playSound('notification');
            }
            
            prevNotifLengthRef.current = newNotifications.length;
            
            // Only update state if data actually changed (prevents re-render if data is identical)
            setNotifications(prev => {
                if (prev.length === newNotifications.length && prev[0]?.id === newNotifications[0]?.id) return prev;
                return newNotifications;
            });

        } catch (err) {
            console.error('Fetch notifications error', err);
        }
    }, [user?.userIdentifier]);

    const fetchUnreadMessages = useCallback(async () => {
        if (!user?.userIdentifier || !canMessage) return;
        try {
            const response = await apiService.getUnreadMessages(user.userIdentifier);
            if (response.data.success) {
                const count = Object.values(response.data.unreadCounts || {}).reduce((sum, c) => sum + c, 0);
                
                if (count > prevMsgCountRef.current && prevMsgCountRef.current > 0) {
                    playSound('message');
                }
                
                prevMsgCountRef.current = count;
                setUnreadMessagesCount(count);
            }
        } catch (err) {
            console.error('Fetch messages error', err);
        }
    }, [user?.userIdentifier, canMessage]);

    // --- Stable Intervals ---
    useEffect(() => {
        fetchNotifications();
        fetchUnreadMessages();
        
        // These intervals will now stay stable and not reset constantly
        const notifInterval = setInterval(fetchNotifications, 30000);
        const msgInterval = setInterval(fetchUnreadMessages, 15000);

        return () => {
            clearInterval(notifInterval);
            clearInterval(msgInterval);
        };
    }, [fetchNotifications, fetchUnreadMessages]);

    const handleMarkAsRead = async () => {
        if (notifications.length === 0) return;
        try {
            const idsToMark = notifications.map(n => ({ id: n.id, partitionKey: n.partitionKey }));
            // Optimistic update: clear UI immediately for speed
            setNotifications([]); 
            prevNotifLengthRef.current = 0;
            
            await apiService.markNotificationsAsRead(idsToMark, user.userIdentifier);
        } catch (err) {
            console.error('Failed to mark read', err);
            // Re-fetch if failed
            fetchNotifications(); 
        }
    };

    // Calculate Admin visibility once per render
    const showAdminDropdown = canEditUsers || canManageHolidays || canApproveLeave || canManageLeaveConfig || canApproveAttendance || canSendMonthlyReport;

    // Helper to check active state
    const isPageActive = (target) => Array.isArray(target) ? target.includes(currentPage) : currentPage === target;

    // Navigation Handler Wrapper
    const handleNav = useCallback((target) => {
        if (typeof target === 'function') target();
        else onNavigate(target);
    }, [onNavigate]);

    return (
        <header className="sticky top-0 z-50 w-full border-b border-slate-200/60 bg-white/90 backdrop-blur-xl shadow-sm">
            <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    
                    {/* LEFT: Logo & Nav */}
                    <div className="flex items-center gap-8">
                        <div className="flex-shrink-0 flex items-center gap-2 cursor-pointer" onClick={() => handleNav('home')}>
                            <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-200">
                                <span className="text-white font-bold text-lg">V</span>
                            </div>
                            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-700 to-indigo-500">
                                VMS Portal
                            </h1>
                        </div>

                        <nav className="hidden lg:flex items-center gap-1">
                            <NavButton label="Home" target="home" isActive={currentPage === 'home'} onClick={handleNav} />
                            <NavButton label="Profile" target="profile" isActive={currentPage === 'profile'} onClick={handleNav} />

                            {canViewDashboards && (
                                <Dropdown trigger={
                                    <button className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isPageActive('dashboard') ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'}`}>
                                        Dashboards <ChevronDownIcon className="text-slate-400" />
                                    </button>
                                }>
                                    {Object.entries(DASHBOARD_CONFIGS).map(([key, config]) => (
                                        <DropdownItem key={key} label={config.title} target={() => onNavigate('dashboard', { key })} onClick={handleNav} />
                                    ))}
                                </Dropdown>
                            )}

                            {canAddPosting && <NavButton label="New Posting" target="new_posting" isActive={currentPage === 'new_posting'} onClick={handleNav} />}
                            {canViewCandidates && <NavButton label="Candidates" target="candidate_details" isActive={currentPage === 'candidate_details'} onClick={handleNav} />}
                            {canViewReports && <NavButton label="Reports" target="reports" isActive={currentPage === 'reports'} onClick={handleNav} />}
                            
                            {canMessage && <NavButton label="Messages" target="messages" isActive={currentPage === 'messages'} badgeCount={unreadMessagesCount} onClick={handleNav} />}

                            {canManageTimesheets && (
                                <Dropdown trigger={
                                    <button className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isPageActive(['create_timesheet_company', 'manage_companies', 'log_hours', 'timesheets_dashboard']) ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'}`}>
                                        Timesheets <ChevronDownIcon className="text-slate-400" />
                                    </button>
                                }>
                                    <DropdownItem label="Create Company" target="create_timesheet_company" onClick={handleNav} />
                                    <DropdownItem label="Manage Companies" target="manage_companies" onClick={handleNav} />
                                    <DropdownItem label="Create Employee" target="create_timesheet_employee" onClick={handleNav} />
                                    <DropdownItem label="Manage Employees" target="manage_timesheet_employees" onClick={handleNav} />
                                    <div className="border-t border-slate-100 my-1" />
                                    <DropdownItem label="Log Hours" target="log_hours" onClick={handleNav} />
                                    <DropdownItem label="Dashboard" target="timesheets_dashboard" onClick={handleNav} />
                                </Dropdown>
                            )}

                            {(canManageMSAWO || canManageOfferLetters) && (
                                <Dropdown trigger={
                                    <button className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isPageActive(['msa_wo_dashboard', 'offer_letter_dashboard']) ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'}`}>
                                        E-Sign's <ChevronDownIcon className="text-slate-400" />
                                    </button>
                                }>
                                    {canManageMSAWO && (
                                        <>
                                            <div className="px-4 py-2 text-xs font-bold text-slate-400 uppercase bg-slate-50/50">MSA & WO</div>
                                            <DropdownItem label="Create Vendor" target="create_msa_wo_vendor_company" onClick={handleNav} />
                                            <DropdownItem label="Manage Vendors" target="manage_msa_wo_vendor_companies" onClick={handleNav} />
                                            <DropdownItem label="Create MSA/WO" target="create_msa_wo" onClick={handleNav} />
                                            <DropdownItem label="Dashboard" target="msa_wo_dashboard" onClick={handleNav} />
                                        </>
                                    )}
                                    {canManageOfferLetters && (
                                        <>
                                            <div className="border-t border-slate-100 my-1"></div>
                                            <div className="px-4 py-2 text-xs font-bold text-slate-400 uppercase bg-slate-50/50">Offer Letter</div>
                                            <DropdownItem label="Create Letter" target="create_offer_letter" onClick={handleNav} />
                                            <DropdownItem label="Dashboard" target="offer_letter_dashboard" onClick={handleNav} />
                                        </>
                                    )}
                                </Dropdown>
                            )}

                            {showAdminDropdown && (
                                <Dropdown trigger={
                                    <button className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isPageActive(['admin', 'manage_holidays']) ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'}`}>
                                        Admin <ChevronDownIcon className="text-slate-400" />
                                    </button>
                                }>
                                    {canEditUsers && <DropdownItem label="User Management" target="admin" onClick={handleNav} />}
                                    <div className="border-t border-slate-100 my-1" />
                                    {canManageHolidays && <DropdownItem label="Manage Holidays" target="manage_holidays" onClick={handleNav} />}
                                    {canManageLeaveConfig && <DropdownItem label="Leave Config" target="leave_config" onClick={handleNav} />}
                                    {canApproveLeave && <DropdownItem label="Approve Leave" target="approve_leave" onClick={handleNav} />}
                                    {canApproveAttendance && <DropdownItem label="Approve Attendance" target="approve_attendance" onClick={handleNav} />}
                                    {canSendMonthlyReport && <DropdownItem label="Monthly Reports" target="monthly_attendance_report" onClick={handleNav} />}
                                </Dropdown>
                            )}
                        </nav>
                    </div>

                    {/* RIGHT: Notifications & User */}
                    <div className="flex items-center gap-3">
                        <Dropdown width="96" trigger={
                            <button className="relative p-2 rounded-full text-slate-500 hover:text-indigo-600 hover:bg-slate-100 transition-all focus:outline-none">
                                <BellIcon />
                                {notifications.length > 0 && (
                                    <span className="absolute top-1.5 right-2 flex h-2.5 w-2.5">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                                    </span>
                                )}
                            </button>
                        }>
                            <div className="w-80">
                                <div className="flex justify-between items-center p-3 border-b border-slate-100 bg-slate-50/50">
                                    <h4 className="font-semibold text-slate-800 text-sm">Notifications</h4>
                                    {notifications.length > 0 && (
                                        <button onClick={handleMarkAsRead} className="text-xs font-medium text-indigo-600 hover:text-indigo-800">Mark all read</button>
                                    )}
                                </div>
                                <div className="max-h-[300px] overflow-y-auto scrollbar-thin">
                                    {notifications.length > 0 ? notifications.map((n, idx) => (
                                        <div key={n.id || idx} className="p-3 border-b border-slate-50 hover:bg-slate-50 flex gap-3">
                                            <div className="h-2 w-2 mt-1.5 rounded-full bg-indigo-500 flex-shrink-0" />
                                            <div>
                                                <p className="text-sm text-slate-700 leading-snug">{n.message}</p>
                                                <p className="text-xs text-slate-400 mt-1">{new Date(n.timestamp).toLocaleString()}</p>
                                            </div>
                                        </div>
                                    )) : (
                                        <div className="py-8 text-center text-slate-400">
                                            <p className="text-sm">No new notifications</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </Dropdown>

                        <Dropdown trigger={
                            <button className="flex items-center gap-2 pl-2 pr-1 py-1 rounded-full hover:bg-slate-100 transition-all">
                                <div className="h-9 w-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-md ring-2 ring-white">
                                    <span className="text-xs font-bold">{user?.userName ? user.userName.charAt(0).toUpperCase() : 'U'}</span>
                                </div>
                                <ChevronDownIcon className="h-4 w-4 text-slate-400" />
                            </button>
                        }>
                            <div className="w-56">
                                <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50">
                                    <p className="text-sm font-semibold text-slate-900">{user?.userName || 'User'}</p>
                                    <p className="text-xs text-slate-500 truncate">{user?.userIdentifier}</p>
                                </div>
                                <div className="py-1">
                                    <DropdownItem label="My Profile" target="profile" onClick={handleNav} />
                                </div>
                                <div className="border-t border-slate-100 py-1">
                                    <DropdownItem label="Logout" target={logout} onClick={handleNav} isDestructive />
                                </div>
                            </div>
                        </Dropdown>
                    </div>
                </div>
            </div>
        </header>
    );
};

// Memoize the whole component to prevent re-renders when parent state changes (unless props change)
export default memo(TopNav);