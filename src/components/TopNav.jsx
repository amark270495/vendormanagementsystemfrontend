import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { usePermissions } from '../hooks/usePermissions';
import { apiService } from '../api/apiService';
import Dropdown from './Dropdown';

// Define DASHBOARD_CONFIGS directly if not imported from elsewhere
const DASHBOARD_CONFIGS = {
    'ecaltVMSDisplay': { title: 'Eclat VMS' },
    'taprootVMSDisplay': { title: 'Taproot VMS' },
    'michiganDisplay': { title: 'Michigan VMS' },
    'EclatTexasDisplay': { title: 'Eclat Texas VMS' },
    'TaprootTexasDisplay': { title: 'Taproot Texas VMS' },
    'VirtusaDisplay': { title: 'Virtusa Taproot' },
    'DeloitteDisplay': { title: 'Deloitte Taproot' }
};


const TopNav = ({ onNavigate, currentPage }) => {
    const { user, logout } = useAuth();
    const {
        canViewDashboards,
        canAddPosting,
        canViewReports,
        canViewCandidates,
        canEditUsers,
        canMessage,
        canManageTimesheets,
        canRequestTimesheetApproval, // Added
        canManageMSAWO,
        canManageOfferLetters,
        canManageHolidays, // Added
        canApproveLeave, // Added
        canManageLeaveConfig // Added
    } = usePermissions();

    const [notifications, setNotifications] = useState([]);
    const [unreadMessagesCount, setUnreadMessagesCount] = useState(0); // Renamed for clarity

    // --- Sound Playing Logic (using original relative path) ---
    const playSound = (soundFile) => {
        // Correct relative path from src/components back to src/sounds
        const audio = new Audio(`../sounds/${soundFile}`);
        audio.play().catch(e => console.error("Error playing sound:", e));
    };
    // --- End Sound Playing Logic ---

    const fetchNotifications = useCallback(async () => {
        if (!user?.userIdentifier) return;
        try {
            const response = await apiService.getNotifications(user.userIdentifier);
            // --- FIX: Safely access notifications array ---
            const newNotifications = response?.data?.success ? (response.data.notifications || []) : [];
            // --- End FIX ---

            // Play sound only if new notifications arrived since the last check
            // --- FIX: Ensure 'notifications' state array is also valid before comparing length ---
            if (Array.isArray(newNotifications) && Array.isArray(notifications) && newNotifications.length > notifications.length && notifications.length > 0) {
                 playSound('notification.mp3');
            }
            // --- End FIX ---
            setNotifications(newNotifications); // Always set state, even if empty
        } catch (err) {
            console.error('Could not fetch notifications', err);
            // Optionally set notifications to empty array on error
            // setNotifications([]);
        }
    }, [user?.userIdentifier, notifications]); // Keep notifications dependency

    const fetchUnreadMessages = useCallback(async () => {
        if (!user?.userIdentifier || !canMessage) return;
        try {
            const response = await apiService.getUnreadMessages(user.userIdentifier);
            if (response.data.success) {
                const currentUnreadCount = Object.values(response.data.unreadCounts || {}).reduce((sum, count) => sum + count, 0);
                 // Play sound only if the count increased
                if (currentUnreadCount > unreadMessagesCount && unreadMessagesCount > 0) {
                    playSound('message.mp3');
                }
                setUnreadMessagesCount(currentUnreadCount);
            }
        } catch (err) {
             console.error('Could not fetch unread messages count', err);
        }
    }, [user?.userIdentifier, canMessage, unreadMessagesCount]); // Use unreadMessagesCount dependency

    useEffect(() => {
        fetchNotifications();
        fetchUnreadMessages();
        const notificationInterval = setInterval(fetchNotifications, 30000); // Poll every 30 seconds
        const messageInterval = setInterval(fetchUnreadMessages, 15000); // Poll every 15 seconds
        return () => {
            clearInterval(notificationInterval);
            clearInterval(messageInterval);
        };
    }, [fetchNotifications, fetchUnreadMessages]);

    const handleMarkAsRead = async () => {
        if (!Array.isArray(notifications) || notifications.length === 0) return; // Add safety check
        try {
            const idsToMark = notifications.map(n => ({ id: n.id, partitionKey: n.partitionKey }));
            await apiService.markNotificationsAsRead(idsToMark, user.userIdentifier);
            // Immediately update UI before next poll
            setNotifications([]);
            // Optionally re-fetch immediately: await fetchNotifications();
        } catch (err) {
            console.error('Failed to mark notifications as read', err);
        }
    };

    const getLinkClass = (pageName) => {
        const base = "px-3 py-2 rounded-md text-sm font-medium transition-colors";
        const active = "bg-slate-200 text-slate-900";
        const inactive = "text-slate-500 hover:bg-slate-100 hover:text-slate-800";
        // Check if the current page *name* matches the link's target page name
        return `${base} ${currentPage === pageName ? active : inactive}`;
    };

    // Determine if any admin sub-link should be shown
    const showAdminDropdown = canEditUsers || canManageHolidays || canApproveLeave || canManageLeaveConfig;

    return (
        <header className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-40 border-b border-slate-200">
            <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Left side: Logo and Main Navigation */}
                    <div className="flex items-center space-x-8">
                        <h1 className="text-2xl font-bold text-indigo-600">VMS Portal</h1>
                        <nav className="hidden md:flex space-x-1">
                            <a href="#" onClick={() => onNavigate('home')} className={getLinkClass('home')}>Home</a>

                             {/* Profile Link */}
                            <a href="#" onClick={() => onNavigate('profile')} className={getLinkClass('profile')}>My Profile</a>


                            {canViewDashboards && (
                                <Dropdown trigger={<button className="px-3 py-2 rounded-md text-sm font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-800">Dashboards</button>}>
                                    {Object.entries(DASHBOARD_CONFIGS).map(([key, config]) => (
                                        <a href="#" key={key} onClick={() => onNavigate('dashboard', { key })} className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-100">{config.title}</a>
                                    ))}
                                </Dropdown>
                            )}

                            {canAddPosting && <a href="#" onClick={() => onNavigate('new_posting')} className={getLinkClass('new_posting')}>New Posting</a>}
                            {canViewCandidates && <a href="#" onClick={() => onNavigate('candidate_details')} className={getLinkClass('candidate_details')}>Candidates</a>}
                            {canViewReports && <a href="#" onClick={() => onNavigate('reports')} className={getLinkClass('reports')}>Reports</a>}

                            {canMessage &&
                                <a href="#" onClick={() => onNavigate('messages')} className={`${getLinkClass('messages')} relative`}>
                                    Messages
                                    {unreadMessagesCount > 0 && <span className="absolute -top-1 -right-1 flex h-4 w-4"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span><span className="relative inline-flex rounded-full h-4 w-4 bg-indigo-500 text-white text-xs items-center justify-center">{unreadMessagesCount}</span></span>}
                                </a>
                            }

                            {canManageTimesheets && (
                                <Dropdown trigger={<button className={getLinkClass(['create_timesheet_company', 'manage_companies', 'create_timesheet_employee', 'manage_timesheet_employees', 'log_hours', 'timesheets_dashboard'].includes(currentPage))}>Timesheets</button>}>
                                    <a href="#" onClick={() => onNavigate('create_timesheet_company')} className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-100">Create Company</a>
                                    <a href="#" onClick={() => onNavigate('manage_companies')} className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-100">Manage Companies</a>
                                    <a href="#" onClick={() => onNavigate('create_timesheet_employee')} className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-100">Create Timesheet Employee</a>
                                    <a href="#" onClick={() => onNavigate('manage_timesheet_employees')} className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-100">Manage Timesheet Employees</a>
                                    <a href="#" onClick={() => onNavigate('log_hours')} className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-100">Log Hours</a>
                                    <a href="#" onClick={() => onNavigate('timesheets_dashboard')} className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-100">Timesheets Dashboard</a>
                                </Dropdown>
                            )}

                             {(canManageMSAWO || canManageOfferLetters) && (
                                <Dropdown trigger={<button className={getLinkClass(['create_msa_wo_vendor_company', 'manage_msa_wo_vendor_companies', 'create_msa_wo', 'msa_wo_dashboard', 'create_offer_letter', 'offer_letter_dashboard'].includes(currentPage))}>E-Sign's</button>}>
                                    <div className="px-4 py-2 text-xs font-bold text-slate-400 uppercase">MSA & WO</div>
                                    {canManageMSAWO && <a href="#" onClick={() => onNavigate('create_msa_wo_vendor_company')} className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-100">Create Vendor Company</a>}
                                    {canManageMSAWO && <a href="#" onClick={() => onNavigate('manage_msa_wo_vendor_companies')} className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-100">Manage Vendor Companies</a>}
                                    {canManageMSAWO && <a href="#" onClick={() => onNavigate('create_msa_wo')} className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-100">Create MSA/WO</a>}
                                    {canManageMSAWO && <a href="#" onClick={() => onNavigate('msa_wo_dashboard')} className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-100">MSA/WO Dashboard</a>}
                                    <div className="border-t my-1"></div>
                                    <div className="px-4 py-2 text-xs font-bold text-slate-400 uppercase">Offer Letter</div>
                                    {canManageOfferLetters && <a href="#" onClick={() => onNavigate('create_offer_letter')} className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-100">Create Offer Letter</a>}
                                    {canManageOfferLetters && <a href="#" onClick={() => onNavigate('offer_letter_dashboard')} className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-100">Offer Letter Dashboard</a>}
                                </Dropdown>
                            )}

                            {/* Admin Dropdown */}
                            {showAdminDropdown && (
                                <Dropdown trigger={<button className={getLinkClass(['admin', 'manage_holidays', 'approve_leave', 'leave_config'].includes(currentPage))}>Admin</button>}>
                                    {canEditUsers && <a href="#" onClick={() => onNavigate('admin')} className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-100">User Management</a>}
                                    {canManageHolidays && <a href="#" onClick={() => onNavigate('manage_holidays')} className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-100">Manage Holidays</a>}
                                    {canApproveLeave && <a href="#" onClick={() => onNavigate('approve_leave')} className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-100">Approve Leave</a>}
                                    {canManageLeaveConfig && <a href="#" onClick={() => onNavigate('leave_config')} className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-100">Leave Configuration</a>}
                                </Dropdown>
                            )}
                        </nav>
                    </div>

                    {/* Right side: Notifications and User Menu */}
                    <div className="flex items-center space-x-4">
                        {/* Notifications Dropdown */}
                        <Dropdown width="80" trigger={
                            <button className="relative text-slate-500 hover:text-slate-700" aria-label="Notifications">
                                {/* --- FIX: Corrected SVG Syntax --- */}
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
                                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                                    <path d="M13.73 21a2 2 0 0 1-3.46 0"></path> {/* Corrected arc flag issue here if present, ensure values are 0 or 1 */}
                                </svg>
                                {/* --- End FIX --- */}
                                {/* --- FIX: Check array length safely --- */}
                                {Array.isArray(notifications) && notifications.length > 0 && <span className="absolute -top-1 -right-1 flex h-4 w-4"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span><span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 text-white text-xs items-center justify-center">{notifications.length}</span></span>}
                                {/* --- End FIX --- */}
                            </button>
                        }>
                            <div className="p-2">
                                <div className="flex justify-between items-center mb-2 px-2">
                                    <h4 className="font-semibold text-slate-800">Notifications</h4>
                                    {/* --- FIX: Check array length safely --- */}
                                    {Array.isArray(notifications) && notifications.length > 0 && <button onClick={handleMarkAsRead} className="text-xs text-indigo-600 hover:underline">Mark all as read</button>}
                                    {/* --- End FIX --- */}
                                </div>
                                <div className="max-h-80 overflow-y-auto">
                                    {/* --- FIX: Check array length safely --- */}
                                    {Array.isArray(notifications) && notifications.length > 0 ? notifications.map(n => (
                                        <div key={n.id || n.timestamp} className="p-2 border-b hover:bg-slate-50">
                                            <p className="text-sm text-slate-700">{n.message}</p>
                                            <p className="text-xs text-slate-400">{new Date(n.timestamp).toLocaleString()}</p>
                                        </div>
                                    )) : <p className="text-sm text-slate-500 p-4 text-center">No new notifications.</p>}
                                    {/* --- End FIX --- */}
                                </div>
                            </div>
                        </Dropdown>

                        {/* User Menu Dropdown */}
                        <Dropdown trigger={
                            <button className="flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500" aria-label="User menu">
                                <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center">
                                    {/* --- FIX: Corrected SVG Syntax --- */}
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-slate-600">
                                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                        <circle cx="12" cy="7" r="4"></circle>
                                    </svg>
                                    {/* --- End FIX --- */}
                                </div>
                            </button>
                        }>
                            <div className="px-4 py-2 border-b">
                                <p className="text-sm font-medium text-slate-900">{user?.userName || 'User'}</p>
                                <p className="text-sm text-slate-500 truncate">{user?.userIdentifier || 'No Email'}</p>
                            </div>
                             {/* Added My Profile Link */}
                            <a href="#" onClick={() => onNavigate('profile')} className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-100">My Profile</a>
                            <a href="#" onClick={logout} className="block px-4 py-2 text-sm text-red-600 hover:bg-slate-100">Logout</a>
                        </Dropdown>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default TopNav;