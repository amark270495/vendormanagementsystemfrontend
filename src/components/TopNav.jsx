import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { usePermissions } from '../hooks/usePermissions';
import { apiService } from '../api/apiService';
import Dropdown from './Dropdown';

// Define DASHBOARD_CONFIGS outside the component
const DASHBOARD_CONFIGS = {
    'ecaltVMSDisplay': { title: 'Eclat VMS' },
    'taprootVMSDisplay': { title: 'Taproot VMS' },
    'michiganDisplay': { title: 'Michigan VMS' },
    'EclatTexasDisplay': { title: 'Eclat Texas VMS' },
    'TaprootTexasDisplay': { title: 'Taproot Texas VMS' },
    'VirtusaDisplay': { title: 'Virtusa Taproot' },
    'DeloitteDisplay': { title: 'Deloitte Taproot' }
};

// --- Helper Icons (Lucide-style SVGs) ---
const ChevronDownIcon = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m6 9 6 6 6-6"/></svg>
);
const BellIcon = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>
);
const UserIcon = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
);

const TopNav = ({ onNavigate, currentPage }) => {
    const { user, logout } = useAuth();
    
    // --- Destructure all 18 granular permissions ---
    const {
        canViewDashboards, canAddPosting, canViewReports, canViewCandidates, canEditUsers,
        canMessage, canManageTimesheets, canRequestTimesheetApproval, canManageMSAWO,
        canManageOfferLetters, canManageHolidays, canApproveLeave, canManageLeaveConfig,
        canApproveAttendance, canSendMonthlyReport
    } = usePermissions();

    const [notifications, setNotifications] = useState([]);
    const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);

    // --- Sound Playing Logic ---
    const playSound = (soundFile) => {
        const audio = new Audio(`/sounds/${soundFile}`);
        audio.play().catch(e => console.error("Error playing sound:", e));
    };

    const fetchNotifications = useCallback(async () => {
        if (!user?.userIdentifier) return;
        try {
            const response = await apiService.getNotifications(user.userIdentifier);
            const newNotifications = response?.data?.success ? (response.data.notifications || []) : [];

            if (Array.isArray(newNotifications) && Array.isArray(notifications) && newNotifications.length > notifications.length && notifications.length > 0) {
                playSound('notification.mp3');
            }
            setNotifications(newNotifications);
        } catch (err) {
            console.error('Could not fetch notifications', err);
        }
    }, [user?.userIdentifier, notifications]);

    const fetchUnreadMessages = useCallback(async () => {
        if (!user?.userIdentifier || !canMessage) return;
        try {
            const response = await apiService.getUnreadMessages(user.userIdentifier);
            if (response.data.success) {
                const currentUnreadCount = Object.values(response.data.unreadCounts || {}).reduce((sum, count) => sum + count, 0);
                if (currentUnreadCount > unreadMessagesCount && unreadMessagesCount > 0) {
                    playSound('message.mp3');
                }
                setUnreadMessagesCount(currentUnreadCount);
            }
        } catch (err) {
            console.error('Could not fetch unread messages count', err);
        }
    }, [user?.userIdentifier, canMessage, unreadMessagesCount]);

    useEffect(() => {
        fetchNotifications();
        fetchUnreadMessages();
        const notificationInterval = setInterval(fetchNotifications, 30000);
        const messageInterval = setInterval(fetchUnreadMessages, 15000);
        return () => {
            clearInterval(notificationInterval);
            clearInterval(messageInterval);
        };
    }, [fetchNotifications, fetchUnreadMessages]);

    const handleMarkAsRead = async () => {
        if (!Array.isArray(notifications) || notifications.length === 0) return;
        try {
            const idsToMark = notifications.map(n => ({ id: n.id, partitionKey: n.partitionKey }));
            await apiService.markNotificationsAsRead(idsToMark, user.userIdentifier);
            setNotifications([]);
        } catch (err) {
            console.error('Failed to mark notifications as read', err);
        }
    };

    const showAdminDropdown = canEditUsers || canManageHolidays || canApproveLeave || canManageLeaveConfig || canApproveAttendance || canSendMonthlyReport;

    // --- UI Helper Components ---

    const NavButton = ({ label, target, hasBadge, badgeCount, onClickOverride }) => {
        const isActive = Array.isArray(target) ? target.includes(currentPage) : currentPage === target;
        
        const baseClass = "group relative inline-flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ease-in-out";
        const activeClass = "bg-indigo-50 text-indigo-700";
        const inactiveClass = "text-slate-600 hover:bg-slate-50 hover:text-slate-900";

        return (
            <button 
                onClick={() => onClickOverride ? onClickOverride() : onNavigate(target)}
                className={`${baseClass} ${isActive ? activeClass : inactiveClass}`}
            >
                {label}
                {hasBadge && badgeCount > 0 && (
                     <span className="ml-2 flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-bold text-white shadow-sm">
                        {badgeCount}
                    </span>
                )}
            </button>
        );
    };

    const DropdownTriggerButton = ({ label, targetPages }) => {
        const isActive = targetPages ? targetPages.includes(currentPage) : false;
        return (
            <div className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${isActive ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}>
                {label}
                <ChevronDownIcon className={`transition-transform duration-200 ${isActive ? 'text-indigo-500' : 'text-slate-400 group-hover:text-slate-600'}`} />
            </div>
        );
    };

    const DropdownItem = ({ label, target, isDestructive = false }) => (
        <button 
            onClick={typeof target === 'function' ? target : () => onNavigate(target)} 
            className={`w-full text-left block px-4 py-2.5 text-sm transition-colors ${isDestructive ? 'text-red-600 hover:bg-red-50' : 'text-slate-700 hover:bg-slate-50 hover:text-indigo-600'}`}
        >
            {label}
        </button>
    );

    const DropdownHeader = ({ title }) => (
         <div className="px-4 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider bg-slate-50/50">{title}</div>
    );

    return (
        <header className="sticky top-0 z-50 w-full border-b border-slate-200/60 bg-white/90 backdrop-blur-xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)]">
            <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    
                    {/* Left side: Logo and Main Navigation */}
                    <div className="flex items-center gap-8">
                        {/* Logo */}
                        <div className="flex-shrink-0 flex items-center gap-2 cursor-pointer" onClick={() => onNavigate('home')}>
                            <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-200">
                                <span className="text-white font-bold text-lg">V</span>
                            </div>
                            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-700 to-indigo-500">
                                VMS Portal
                            </h1>
                        </div>

                        {/* Desktop Nav */}
                        <nav className="hidden lg:flex items-center gap-1">
                            <NavButton label="Home" target="home" />
                            <NavButton label="Profile" target="profile" />

                            {canViewDashboards && (
                                <Dropdown trigger={<button><DropdownTriggerButton label="Dashboards" targetPages={['dashboard']} /></button>}>
                                    {Object.entries(DASHBOARD_CONFIGS).map(([key, config]) => (
                                        <DropdownItem key={key} label={config.title} target={() => onNavigate('dashboard', { key })} />
                                    ))}
                                </Dropdown>
                            )}

                            {canAddPosting && <NavButton label="New Posting" target="new_posting" />}
                            {canViewCandidates && <NavButton label="Candidates" target="candidate_details" />}
                            {canViewReports && <NavButton label="Reports" target="reports" />}
                            
                            {canMessage && (
                                <NavButton 
                                    label="Messages" 
                                    target="messages" 
                                    hasBadge={true} 
                                    badgeCount={unreadMessagesCount} 
                                />
                            )}

                            {canManageTimesheets && (
                                <Dropdown trigger={<button><DropdownTriggerButton label="Timesheets" targetPages={['create_timesheet_company', 'manage_companies', 'create_timesheet_employee', 'manage_timesheet_employees', 'log_hours', 'timesheets_dashboard']} /></button>}>
                                    <DropdownItem label="Create Company" target="create_timesheet_company" />
                                    <DropdownItem label="Manage Companies" target="manage_companies" />
                                    <DropdownItem label="Create Timesheet Employee" target="create_timesheet_employee" />
                                    <DropdownItem label="Manage Timesheet Employees" target="manage_timesheet_employees" />
                                    <div className="border-t border-slate-100 my-1" />
                                    <DropdownItem label="Log Hours" target="log_hours" />
                                    <DropdownItem label="Timesheets Dashboard" target="timesheets_dashboard" />
                                </Dropdown>
                            )}

                            {(canManageMSAWO || canManageOfferLetters) && (
                                <Dropdown trigger={<button><DropdownTriggerButton label="E-Sign's" targetPages={['create_msa_wo_vendor_company', 'manage_msa_wo_vendor_companies', 'create_msa_wo', 'msa_wo_dashboard', 'create_offer_letter', 'offer_letter_dashboard']} /></button>}>
                                    <DropdownHeader title="MSA & WO" />
                                    {canManageMSAWO && (
                                        <>
                                            <DropdownItem label="Create Vendor Company" target="create_msa_wo_vendor_company" />
                                            <DropdownItem label="Manage Vendor Companies" target="manage_msa_wo_vendor_companies" />
                                            <DropdownItem label="Create MSA/WO" target="create_msa_wo" />
                                            <DropdownItem label="Dashboard" target="msa_wo_dashboard" />
                                        </>
                                    )}
                                    <div className="border-t border-slate-100 my-1"></div>
                                    <DropdownHeader title="Offer Letter" />
                                    {canManageOfferLetters && (
                                        <>
                                            <DropdownItem label="Create Offer Letter" target="create_offer_letter" />
                                            <DropdownItem label="Dashboard" target="offer_letter_dashboard" />
                                        </>
                                    )}
                                </Dropdown>
                            )}

                            {showAdminDropdown && (
                                <Dropdown trigger={<button><DropdownTriggerButton label="Admin" targetPages={['admin', 'manage_holidays', 'approve_leave', 'leave_config', 'approve_attendance', 'monthly_attendance_report']} /></button>}>
                                    {canEditUsers && <DropdownItem label="User Management" target="admin" />}
                                    <div className="border-t border-slate-100 my-1" />
                                    {canManageHolidays && <DropdownItem label="Manage Holidays" target="manage_holidays" />}
                                    {canManageLeaveConfig && <DropdownItem label="Leave Configuration" target="leave_config" />}
                                    <div className="border-t border-slate-100 my-1" />
                                    {canApproveLeave && <DropdownItem label="Approve Leave" target="approve_leave" />}
                                    {canApproveAttendance && <DropdownItem label="Approve Attendance" target="approve_attendance" />}
                                    {canSendMonthlyReport && <DropdownItem label="Send Monthly Reports" target="monthly_attendance_report" />}
                                </Dropdown>
                            )}
                        </nav>
                    </div>

                    {/* Right side: Notifications and User Menu */}
                    <div className="flex items-center gap-3">
                        {/* Notification Bell */}
                        <Dropdown width="96" trigger={
                            <button className="relative p-2 rounded-full text-slate-500 hover:text-indigo-600 hover:bg-slate-100 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-100">
                                <span className="sr-only">View notifications</span>
                                <BellIcon />
                                {Array.isArray(notifications) && notifications.length > 0 && (
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
                                    {Array.isArray(notifications) && notifications.length > 0 && (
                                        <button onClick={handleMarkAsRead} className="text-xs font-medium text-indigo-600 hover:text-indigo-800 transition-colors">
                                            Mark all read
                                        </button>
                                    )}
                                </div>
                                <div className="max-h-[300px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200">
                                    {Array.isArray(notifications) && notifications.length > 0 ? notifications.map((n, idx) => (
                                        <div key={n.id || idx} className="p-3 border-b border-slate-50 hover:bg-slate-50 transition-colors flex gap-3">
                                            <div className="h-2 w-2 mt-1.5 rounded-full bg-indigo-500 flex-shrink-0" />
                                            <div>
                                                <p className="text-sm text-slate-700 leading-snug">{n.message}</p>
                                                <p className="text-xs text-slate-400 mt-1">{new Date(n.timestamp).toLocaleString()}</p>
                                            </div>
                                        </div>
                                    )) : (
                                        <div className="py-8 text-center flex flex-col items-center text-slate-400">
                                            <BellIcon className="h-8 w-8 mb-2 opacity-20" />
                                            <p className="text-sm">No new notifications</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </Dropdown>

                        {/* User Profile Dropdown */}
                        <Dropdown trigger={
                            <button className="flex items-center gap-2 pl-2 pr-1 py-1 rounded-full hover:bg-slate-100 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-100">
                                <div className="text-right hidden sm:block">
                                    <p className="text-xs font-semibold text-slate-700">{user?.userName || 'User'}</p>
                                </div>
                                <div className="h-9 w-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-md ring-2 ring-white">
                                    <span className="text-xs font-bold">{user?.userName ? user.userName.charAt(0).toUpperCase() : 'U'}</span>
                                </div>
                                <ChevronDownIcon className="h-4 w-4 text-slate-400" />
                            </button>
                        }>
                            <div className="w-56">
                                <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50">
                                    <p className="text-sm font-semibold text-slate-900">{user?.userName || 'Guest User'}</p>
                                    <p className="text-xs text-slate-500 truncate" title={user?.userIdentifier}>{user?.userIdentifier || 'No Email'}</p>
                                </div>
                                <div className="py-1">
                                    <DropdownItem label="My Profile" target="profile" />
                                </div>
                                <div className="border-t border-slate-100 py-1">
                                    <DropdownItem label="Sign out" target={logout} isDestructive={true} />
                                </div>
                            </div>
                        </Dropdown>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default TopNav;