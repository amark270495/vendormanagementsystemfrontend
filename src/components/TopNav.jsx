import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { usePermissions } from '../hooks/usePermissions';
import { apiService } from '../api/apiService';
import Dropdown from './Dropdown';

// Sound file import (ensure path is correct)
import notificationSound from '../sounds/notification.mp3'; // Example notification sound
import messageSound from '../sounds/message.mp3';     // Example message sound

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
        canManageMSAWO,
        canManageOfferLetters,
        // Assuming profile view is available to anyone logged in,
        // otherwise add a specific permission like canViewProfile
    } = usePermissions();

    const [notifications, setNotifications] = useState([]);
    const [unreadMessages, setUnreadMessages] = useState(0);
    const [lastNotificationCount, setLastNotificationCount] = useState(0); // Track previous counts
    const [lastMessageCount, setLastMessageCount] = useState(0);

    const playSound = (soundFile) => {
        try {
            const audio = new Audio(soundFile); // Use imported sound file
            audio.play().catch(e => console.error("Error playing sound:", e));
        } catch (e) {
            console.error("Failed to initialize or play audio:", e);
        }
    };

    const fetchNotifications = useCallback(async () => {
        if (!user?.userIdentifier) return;
        try {
            const response = await apiService.getNotifications(user.userIdentifier);
            if (response.data.success) {
                const currentCount = response.data.notifications.length;
                // Play sound only if the count increases and it's not the initial load
                if (currentCount > lastNotificationCount && lastNotificationCount !== 0) {
                     playSound(notificationSound);
                }
                setNotifications(response.data.notifications);
                setLastNotificationCount(currentCount); // Update the last known count
            }
        } catch (err) {
            console.error('Could not fetch notifications', err);
        }
    }, [user?.userIdentifier, lastNotificationCount]); // Add lastNotificationCount dependency

    const fetchUnreadMessages = useCallback(async () => {
        if (!user?.userIdentifier || !canMessage) return;
        try {
            const response = await apiService.getUnreadMessages(user.userIdentifier);
            if (response.data.success) {
                // Calculate total unread count from the counts object
                const currentTotalUnread = Object.values(response.data.unreadCounts || {}).reduce((sum, count) => sum + count, 0);

                // Play sound only if the count increases and it's not the initial load
                if (currentTotalUnread > lastMessageCount && lastMessageCount !== 0) {
                     playSound(messageSound);
                }
                setUnreadMessages(currentTotalUnread);
                setLastMessageCount(currentTotalUnread); // Update last known count
            }
        } catch (err) {
             console.error('Could not fetch unread messages count', err);
        }
    }, [user?.userIdentifier, canMessage, lastMessageCount]); // Add lastMessageCount dependency


    useEffect(() => {
        // Initial fetch on component mount
        fetchNotifications();
        fetchUnreadMessages();
        // Set initial counts after first fetch to prevent sound on load
        apiService.getNotifications(user.userIdentifier).then(res => setLastNotificationCount(res.data.notifications?.length || 0));
        apiService.getUnreadMessages(user.userIdentifier).then(res => setLastMessageCount(Object.values(res.data.unreadCounts || {}).reduce((sum, count) => sum + count, 0)));


        const notificationInterval = setInterval(fetchNotifications, 30000); // Poll every 30 seconds
        const messageInterval = setInterval(fetchUnreadMessages, 15000); // Poll every 15 seconds
        return () => {
            clearInterval(notificationInterval);
            clearInterval(messageInterval);
        };
    }, [fetchNotifications, fetchUnreadMessages, user?.userIdentifier]); // Added userIdentifier to ensure intervals reset on user change

    const handleMarkAsRead = async () => {
        if (notifications.length === 0) return;
        try {
            const idsToMark = notifications.map(n => ({ id: n.rowKey, partitionKey: n.partitionKey })); // Use rowKey and partitionKey
            await apiService.markNotificationsAsRead(idsToMark, user.userIdentifier);
            // Optimistically update UI
            setNotifications([]);
            setLastNotificationCount(0); // Reset count after marking read
            // Optionally re-fetch to confirm, but optimistic update is faster
            // fetchNotifications();
        } catch (err) {
            console.error('Failed to mark notifications as read', err);
        }
    };

    const getLinkClass = (pageName) => {
        const base = "px-3 py-2 rounded-md text-sm font-medium transition-colors";
        const active = "bg-slate-200 text-slate-900";
        const inactive = "text-slate-500 hover:bg-slate-100 hover:text-slate-800";
        return `${base} ${currentPage === pageName ? active : inactive}`;
    };

    // Helper to determine if any page within a dropdown group is active
    const isDropdownActive = (pages) => pages.includes(currentPage);

    return (
        <header className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-40 border-b border-slate-200">
            <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    <div className="flex items-center space-x-8">
                        <h1 className="text-2xl font-bold text-indigo-600">VMS Portal</h1>
                        <nav className="hidden md:flex space-x-1">
                            {/* --- Core Navigation Links --- */}
                            <a href="#" onClick={() => onNavigate('home')} className={getLinkClass('home')}>Home</a>

                            {canViewDashboards && (
                                <Dropdown trigger={<button className={getLinkClass(isDropdownActive(Object.keys(DASHBOARD_CONFIGS).map(key => `dashboard-${key}`)))}>Dashboards</button>}>
                                    {Object.entries(DASHBOARD_CONFIGS).map(([key, config]) => (
                                        <a href="#" key={key} onClick={() => onNavigate('dashboard', { key })} className={`block px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 ${currentPage === 'dashboard' && window.location.search.includes(key) ? 'font-semibold text-indigo-600' : ''}`}>{config.title}</a>
                                    ))}
                                </Dropdown>
                            )}

                            {canAddPosting && <a href="#" onClick={() => onNavigate('new_posting')} className={getLinkClass('new_posting')}>New Posting</a>}
                            {canViewCandidates && <a href="#" onClick={() => onNavigate('candidate_details')} className={getLinkClass('candidate_details')}>Candidates</a>}
                            {canViewReports && <a href="#" onClick={() => onNavigate('reports')} className={getLinkClass('reports')}>Reports</a>}

                            {canMessage &&
                                <a href="#" onClick={() => onNavigate('messages')} className={`${getLinkClass('messages')} relative`}>
                                    Messages
                                    {unreadMessages > 0 && <span className="absolute -top-1 -right-1 flex h-4 w-4"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span><span className="relative inline-flex rounded-full h-4 w-4 bg-indigo-500 text-white text-xs items-center justify-center">{unreadMessages}</span></span>}
                                </a>
                            }

                            {/* --- Timesheets Dropdown --- */}
                            {(canManageTimesheets || canRequestTimesheetApproval) && ( // Show if user can do either
                                <Dropdown trigger={<button className={getLinkClass(isDropdownActive(['create_timesheet_company', 'manage_companies', 'create_timesheet_employee', 'manage_timesheet_employees', 'log_hours', 'timesheets_dashboard']))}>Timesheets</button>}>
                                    {canManageTimesheets && <a href="#" onClick={() => onNavigate('create_timesheet_company')} className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-100">Create Company</a>}
                                    {canManageTimesheets && <a href="#" onClick={() => onNavigate('manage_companies')} className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-100">Manage Companies</a>}
                                    {canManageTimesheets && <a href="#" onClick={() => onNavigate('create_timesheet_employee')} className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-100">Create Timesheet Employee</a>}
                                    {canManageTimesheets && <a href="#" onClick={() => onNavigate('manage_timesheet_employees')} className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-100">Manage Timesheet Employees</a>}
                                    {canManageTimesheets && <a href="#" onClick={() => onNavigate('log_hours')} className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-100">Log Hours</a>}
                                    {(canManageTimesheets || canRequestTimesheetApproval) && <a href="#" onClick={() => onNavigate('timesheets_dashboard')} className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-100">Timesheets Dashboard</a>}
                                </Dropdown>
                            )}

                            {/* --- E-Sign Dropdown --- */}
                            {(canManageMSAWO || canManageOfferLetters) && (
                                <Dropdown trigger={<button className={getLinkClass(isDropdownActive(['create_msa_wo_vendor_company', 'manage_msa_wo_vendor_companies', 'create_msa_wo', 'msa_wo_dashboard', 'create_offer_letter', 'offer_letter_dashboard']))}>E-Sign's</button>}>
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

                            {/* --- Admin Link --- */}
                            {canEditUsers && <a href="#" onClick={() => onNavigate('admin')} className={getLinkClass('admin')}>Admin</a>}
                        </nav>
                    </div>

                    {/* --- Right Side: Notifications & User Menu --- */}
                    <div className="flex items-center space-x-4">
                        {/* --- Notifications Dropdown --- */}
                        <Dropdown width="80" trigger={
                            <button className="relative text-slate-500 hover:text-slate-700" aria-label="Notifications">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 0 0 1-3.46 0"></path></svg>
                                {notifications.length > 0 && <span className="absolute -top-1 -right-1 flex h-4 w-4"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span><span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 text-white text-xs items-center justify-center">{notifications.length}</span></span>}
                            </button>
                        }>
                            <div className="p-2">
                                <div className="flex justify-between items-center mb-2 px-2">
                                    <h4 className="font-semibold text-slate-800">Notifications</h4>
                                    {notifications.length > 0 && <button onClick={handleMarkAsRead} className="text-xs text-indigo-600 hover:underline">Mark all as read</button>}
                                </div>
                                <div className="max-h-80 overflow-y-auto">
                                    {notifications.length > 0 ? notifications.map(n => (
                                        <div key={n.rowKey} className="p-2 border-b hover:bg-slate-50"> {/* Use rowKey */}
                                            <p className="text-sm text-slate-700">{n.message}</p>
                                            <p className="text-xs text-slate-400">{new Date(n.timestamp).toLocaleString()}</p>
                                            {/* Add link rendering if n.link exists */}
                                        </div>
                                    )) : <p className="text-sm text-slate-500 p-4 text-center">No new notifications.</p>}
                                </div>
                            </div>
                        </Dropdown>

                        {/* --- User Menu Dropdown --- */}
                        <Dropdown trigger={
                            <button className="flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500" aria-label="User menu">
                                <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-slate-600"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg></div>
                            </button>
                        }>
                            <div className="px-4 py-2 border-b">
                                <p className="text-sm font-medium text-slate-900">{user?.userName || 'User'}</p>
                                <p className="text-sm text-slate-500 truncate">{user?.userIdentifier || 'No Email'}</p>
                            </div>
                            {/* NEW: Added My Profile link */}
                            <a href="#" onClick={() => onNavigate('profile')} className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-100">My Profile</a>
                            {canEditUsers && <a href="#" onClick={() => onNavigate('admin')} className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-100">Admin</a>}
                            <a href="#" onClick={logout} className="block px-4 py-2 text-sm text-red-600 hover:bg-slate-100">Logout</a>
                        </Dropdown>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default TopNav;