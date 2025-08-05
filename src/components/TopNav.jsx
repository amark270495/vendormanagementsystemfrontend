// src/components/TopNav.jsx (Updated)
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { usePermissions } from '../hooks/usePermissions'; 
import { apiService } from '../api/apiService';
import Dropdown from './Dropdown';

const DASHBOARD_CONFIGS = {
    'ecaltVMSDisplay': { title: 'Eclat VMS' },
    'taprootVMSDisplay': { title: 'Taproot VMS' },
    'michiganDisplay': { title: 'Michigan VMS' },
    'EclatTexasDisplay': { title: 'Eclat Texas VMS' },
    'TaprootTexasDisplay': { title: 'Taproot Texas VMS' },
    'VirtusaDisplay': { title: 'Virtusa Taproot' },
    'DeloitteDisplay': { title: 'Deloitte Taproot' }
};

const TopNav = ({ onNavigate }) => {
    const { user, logout } = useAuth();
    const { 
        canViewDashboards, 
        canAddPosting, 
        canViewReports, 
        canViewCandidates, 
        canEditUsers,
        canMessage,
        canManageTimesheets, // <-- NEW: Destructure canManageTimesheets
        canRequestTimesheetApproval // <-- NEW: Destructure canRequestTimesheetApproval
    } = usePermissions(); 
    
    const [notifications, setNotifications] = useState([]);
    
    const fetchNotifications = useCallback(async () => {
        if (!user?.userIdentifier) return;
        try {
            const response = await apiService.getNotifications(user.userIdentifier);
            if (response.data.success) {
                setNotifications(response.data.notifications);
            }
        } catch (err) {
            console.error('Could not fetch notifications', err);
        }
    }, [user?.userIdentifier]);

    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 60000);
        return () => clearInterval(interval);
    }, [fetchNotifications]);

    const handleMarkAsRead = async () => {
        if (notifications.length === 0) return;
        try {
            const idsToMark = notifications.map(n => ({ id: n.id, partitionKey: n.partitionKey }));
            await apiService.markNotificationsAsRead(idsToMark, user.userIdentifier);
            fetchNotifications();
        } catch (err) {
            console.error('Failed to mark notifications as read', err);
        }
    };

    return (
        <header className="bg-white shadow-md sticky top-0 z-40">
            <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    <div className="flex items-center space-x-8">
                        <h1 className="text-2xl font-bold text-indigo-600">VMS Portal</h1>
                        <nav className="hidden md:flex space-x-1">
                            <a href="#" onClick={() => onNavigate('home')} className="px-3 py-2 rounded-md text-sm font-medium text-gray-500 hover:text-gray-700">Home</a>
                            {canViewDashboards && (
                                <Dropdown trigger={<button className="px-3 py-2 rounded-md text-sm font-medium text-gray-500 hover:text-gray-700">Dashboards</button>}>
                                    {Object.entries(DASHBOARD_CONFIGS).map(([key, config]) => (
                                        <a href="#" key={key} onClick={() => onNavigate('dashboard', { key })} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">{config.title}</a>
                                    ))}
                                </Dropdown>
                            )}
                            {canAddPosting && <a href="#" onClick={() => onNavigate('new_posting')} className="px-3 py-2 rounded-md text-sm font-medium text-gray-500 hover:text-gray-700">New Posting</a>}
                            {canViewCandidates && <a href="#" onClick={() => onNavigate('candidate_details')} className="px-3 py-2 rounded-md text-sm font-medium text-gray-500 hover:text-gray-700">Candidates</a>}
                            {canViewReports && <a href="#" onClick={() => onNavigate('reports')} className="px-3 py-2 rounded-md text-sm font-medium text-gray-500 hover:text-gray-700">Reports</a>}
                            {canMessage && <a href="#" onClick={() => onNavigate('messages')} className="px-3 py-2 rounded-md text-sm font-medium text-gray-500 hover:text-gray-700">Messages</a>}
                            {(canManageTimesheets || canRequestTimesheetApproval) && ( // <-- NEW: Conditional Timesheets Dropdown
                                <Dropdown trigger={<button className="px-3 py-2 rounded-md text-sm font-medium text-gray-500 hover:text-gray-700">Timesheets</button>}>
                                    {canManageTimesheets && <a href="#" onClick={() => onNavigate('create_company')} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Create Company</a>}
                                    {canManageTimesheets && <a href="#" onClick={() => onNavigate('log_hours')} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Log Hours</a>}
                                    {(canManageTimesheets || canRequestTimesheetApproval) && <a href="#" onClick={() => onNavigate('timesheets_dashboard')} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Timesheets Dashboard</a>}
                                </Dropdown>
                            )}
                            {canEditUsers && <a href="#" onClick={() => onNavigate('admin')} className="px-3 py-2 rounded-md text-sm font-medium text-gray-500 hover:text-gray-700">Admin</a>}
                        </nav>
                    </div>
                    <div className="flex items-center space-x-4">
                        <Dropdown width="80" trigger={
                            <button className="relative text-gray-500 hover:text-gray-700" aria-label="Notifications">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 0 0 1-3.46 0"></path></svg>
                                {notifications.length > 0 && <span className="absolute -top-1 -right-1 flex h-4 w-4"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span><span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 text-white text-xs items-center justify-center">{notifications.length}</span></span>}
                            </button>
                        }>
                            <div className="p-2">
                                <div className="flex justify-between items-center mb-2 px-2">
                                    <h4 className="font-semibold text-gray-800">Notifications</h4>
                                    {notifications.length > 0 && <button onClick={handleMarkAsRead} className="text-xs text-indigo-600 hover:underline">Mark all as read</button>}
                                </div>
                                <div className="max-h-80 overflow-y-auto">
                                    {notifications.length > 0 ? notifications.map(n => (
                                        <div key={n.id} className="p-2 border-b hover:bg-slate-50">
                                            <p className="text-sm text-gray-700">{n.message}</p>
                                            <p className="text-xs text-gray-400">{new Date(n.timestamp).toLocaleString()}</p>
                                        </div>
                                    )) : <p className="text-sm text-gray-500 p-4 text-center">No new notifications.</p>}
                                </div>
                            </div>
                        </Dropdown>

                        <Dropdown trigger={
                            <button className="flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500" aria-label="User menu">
                                <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-gray-600"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg></div>
                            </button>
                        }>
                            <div className="px-4 py-2 border-b">
                                <p className="text-sm font-medium text-gray-900">{user.userName}</p>
                                <p className="text-sm text-gray-500 truncate">{user.userIdentifier}</p>
                            </div>
                            {canEditUsers && <a href="#" onClick={() => onNavigate('admin')} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Admin</a>}
                            <a href="#" onClick={logout} className="block px-4 py-2 text-sm text-red-600 hover:bg-gray-100">Logout</a>
                        </Dropdown>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default TopNav;