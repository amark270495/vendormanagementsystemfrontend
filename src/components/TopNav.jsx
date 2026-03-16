import React, { useState, useEffect, useCallback, useRef, memo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, Bell, Clock4 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { usePermissions } from '../hooks/usePermissions';
import { apiService } from '../api/apiService';
import Dropdown, { useDropdown } from './Dropdown';

// -----------------------------
// Dashboard Config
// -----------------------------
const DASHBOARD_CONFIGS = {
    ecaltVMSDisplay: { title: 'Eclat VMS' },
    taprootVMSDisplay: { title: 'Taproot VMS' },
    michiganDisplay: { title: 'Michigan VMS' },
    EclatTexasDisplay: { title: 'Eclat Texas VMS' },
    TaprootTexasDisplay: { title: 'Taproot Texas VMS' },
    VirtusaDisplay: { title: 'Virtusa Taproot' },
    DeloitteDisplay: { title: 'Deloitte Taproot' }
};

const LOGO_URL = "https://vmsdashboardea.blob.core.windows.net/images/Company_logo.png?sp=r&st=2026-03-16T20:51:06Z&se=2026-03-17T05:06:06Z&sv=2024-11-04&sr=b&sig=OkdvwYLGhv3wMw9QfKb2QXE3B14ruv6q0GGKvJEnEkc%3D";

// -----------------------------
// Icons
// -----------------------------
const ChevronDownIcon = memo(({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14"
        viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2.5"
        strokeLinecap="round" strokeLinejoin="round"
        className={className}>
        <path d="m6 9 6 6 6-6" />
    </svg>
));

// -----------------------------
// Nav Button
// -----------------------------
const NavButton = memo(({ label, target, isActive, onClick }) => {

    const base =
        "px-3 py-1.5 rounded-lg text-[12px] font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer";

    const active =
        "bg-blue-50 text-blue-700 shadow-sm ring-1 ring-blue-100";

    const inactive =
        "text-slate-500 hover:bg-slate-50 hover:text-slate-900";

    return (
        <button
            type="button"
            onClick={() => onClick(target)}
            className={`${base} ${isActive ? active : inactive}`}
        >
            {label}
        </button>
    );
});

// -----------------------------
// Dropdown Item
// -----------------------------
const DropdownItem = memo(({ label, target, onClick, isDestructive }) => {

    const dropdownContext = useDropdown();
    const close = dropdownContext?.close;

    const handleClick = () => {
        onClick(target);
        close?.();
    };

    return (
        <button
            type="button"
            onClick={handleClick}
            className={`w-full text-left block px-4 py-2.5 text-sm font-semibold transition-colors ${
                isDestructive
                    ? "text-rose-600 hover:bg-rose-50"
                    : "text-slate-600 hover:bg-slate-50 hover:text-blue-600"
            }`}
        >
            {label}
        </button>
    );
});

// =================================================
// MAIN COMPONENT
// =================================================
const TopNav = () => {

    const { user, logout } = useAuth();
    const permissions = usePermissions();

    const navigate = useNavigate();
    const location = useLocation();

    const [notifications, setNotifications] = useState([]);
    const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const prevNotifLengthRef = useRef(0);
    const audioRef = useRef(null);

    if (!user) return null;

    // -----------------------------
    // Ensure permissions safe
    // -----------------------------
    const safePerm = (perm) => Boolean(permissions?.[perm]);

    // -----------------------------
    // Page Active Checker
    // -----------------------------
    const isPageActive = (target) => {

        if (Array.isArray(target)) {
            return target.some(t =>
                location.pathname === `/${t.replace(/^\//, '')}`
            );
        }

        if (target.includes("?")) {
            const [path, query] = target.split("?");

            return (
                location.pathname === `/${path}` &&
                location.search === `?${query}`
            );
        }

        return location.pathname === `/${target}`;
    };

    // -----------------------------
    // Navigation
    // -----------------------------
    const handleNav = useCallback((target) => {

        setIsMobileMenuOpen(false);

        if (typeof target === "function") {
            target();
        } else {
            navigate(target.startsWith("/") ? target : `/${target}`);
        }

    }, [navigate]);

    // -----------------------------
    // Audio Setup
    // -----------------------------
    useEffect(() => {

        audioRef.current = {
            notification: new Audio("/sounds/notification.mp3"),
            message: new Audio("/sounds/message.mp3")
        };

    }, []);

    // -----------------------------
    // Notifications
    // -----------------------------
    const fetchNotifications = useCallback(async () => {

        if (!user?.userIdentifier) return;

        try {

            const response =
                await apiService.getNotifications(user.userIdentifier);

            const newNotifs =
                response?.data?.success ? response.data.notifications || [] : [];

            if (
                newNotifs.length > prevNotifLengthRef.current &&
                prevNotifLengthRef.current > 0
            ) {
                audioRef.current?.notification?.play().catch(() => {});
            }

            prevNotifLengthRef.current = newNotifs.length;

            setNotifications(newNotifs);

        } catch (err) {
            console.error(err);
        }

    }, [user?.userIdentifier]);

    // -----------------------------
    // Unread Messages
    // -----------------------------
    const fetchUnreadMessages = useCallback(async () => {

        if (!user?.userIdentifier || !safePerm("canMessage")) return;

        try {

            const response =
                await apiService.getUnreadMessages(user.userIdentifier);

            if (response.data.success) {

                const count =
                    Object.values(response.data.unreadCounts || {})
                        .reduce((s, c) => s + c, 0);

                setUnreadMessagesCount(count);
            }

        } catch (err) {
            console.error(err);
        }

    }, [user?.userIdentifier, permissions]);

    // -----------------------------
    // Polling
    // -----------------------------
    useEffect(() => {

        fetchNotifications();
        fetchUnreadMessages();

        const notifInterval =
            setInterval(fetchNotifications, 30000);

        const msgInterval =
            setInterval(fetchUnreadMessages, 15000);

        return () => {

            clearInterval(notifInterval);
            clearInterval(msgInterval);

        };

    }, [fetchNotifications, fetchUnreadMessages]);

    // -----------------------------
    // Permission Groups
    // -----------------------------
    const showAdminDropdown =
        safePerm("canEditUsers") ||
        safePerm("canManageHolidays") ||
        safePerm("canApproveLeave") ||
        safePerm("canManageLeaveConfig") ||
        safePerm("canApproveAttendance") ||
        safePerm("canSendMonthlyReport");

    const showAssetDropdown =
        safePerm("canManageAssets") ||
        safePerm("canAssignAssets");

    // =================================================
    // UI
    // =================================================
    return (

        <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white shadow-sm">

            <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">

                <div className="flex justify-between items-center h-20">

                    {/* LOGO */}
                    <div className="flex items-center gap-8">

                        <div
                            className="flex flex-col items-center cursor-pointer"
                            onClick={() => handleNav("home")}
                        >
                            <img src={LOGO_URL} alt="logo" className="h-8 mb-1" />

                            <h1 className="text-[9px] font-black tracking-[0.2em] text-slate-900 uppercase">
                                Vendor Management System
                            </h1>
                        </div>

                        {/* NAVIGATION */}
                        <nav className="hidden xl:flex items-center gap-1">

                            <NavButton
                                label="Home"
                                target="home"
                                isActive={isPageActive("home")}
                                onClick={handleNav}
                            />

                            {safePerm("canViewDashboards") && (

                                <Dropdown
                                    trigger={
                                        <button className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-bold uppercase">
                                            Dashboards
                                            <ChevronDownIcon />
                                        </button>
                                    }
                                >
                                    <div className="w-56 py-1">

                                        {Object.entries(DASHBOARD_CONFIGS)
                                            .map(([key, config]) => (

                                                <DropdownItem
                                                    key={key}
                                                    label={config.title}
                                                    target={`dashboard?key=${key}`}
                                                    onClick={handleNav}
                                                />

                                            ))}

                                    </div>
                                </Dropdown>

                            )}

                            {safePerm("canAddPosting") &&
                                <NavButton
                                    label="New Posting"
                                    target="new-posting"
                                    isActive={isPageActive("new-posting")}
                                    onClick={handleNav}
                                />}

                            {safePerm("canViewCandidates") &&
                                <NavButton
                                    label="Candidates"
                                    target="candidate-details"
                                    isActive={isPageActive("candidate-details")}
                                    onClick={handleNav}
                                />}

                            {safePerm("canManageBenchSales") &&
                                <NavButton
                                    label="Bench Sales"
                                    target="bench-sales"
                                    isActive={isPageActive("bench-sales")}
                                    onClick={handleNav}
                                />}

                            {safePerm("canViewReports") &&
                                <NavButton
                                    label="Reports"
                                    target="reports"
                                    isActive={isPageActive("reports")}
                                    onClick={handleNav}
                                />}

                        </nav>
                    </div>

                    {/* RIGHT SIDE */}
                    <div className="flex items-center gap-4">

                        {/* NOTIFICATIONS */}
                        <Dropdown
                            trigger={
                                <button className="relative p-2">

                                    <Bell size={20} />

                                    {notifications.length > 0 && (
                                        <span className="absolute top-0 right-0 text-xs bg-red-500 text-white rounded-full px-1">
                                            {notifications.length}
                                        </span>
                                    )}

                                </button>
                            }
                        >

                            <div className="w-80">

                                {notifications.length === 0 && (
                                    <div className="p-6 text-center text-slate-400">
                                        No notifications
                                    </div>
                                )}

                                {notifications.map((n, idx) => (

                                    <div key={idx} className="p-3 border-b">

                                        <p className="text-sm">
                                            {n.message}
                                        </p>

                                        <p className="text-xs text-gray-400">
                                            {new Date(n.timestamp).toLocaleString()}
                                        </p>

                                    </div>

                                ))}

                            </div>

                        </Dropdown>

                        {/* PROFILE */}
                        <Dropdown
                            trigger={
                                <button className="flex items-center gap-2">

                                    <div className="h-8 w-8 bg-blue-600 text-white flex items-center justify-center rounded-full">
                                        {user?.userName?.charAt(0).toUpperCase()}
                                    </div>

                                    <ChevronDownIcon />

                                </button>
                            }
                        >

                            <DropdownItem
                                label="My Profile"
                                target="profile"
                                onClick={handleNav}
                            />

                            <DropdownItem
                                label="Logout"
                                target={logout}
                                onClick={handleNav}
                                isDestructive
                            />

                        </Dropdown>

                    </div>

                </div>

            </div>

        </header>
    );
};

export default memo(TopNav);