import React, { useState, Fragment } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  BellIcon, 
  MenuIcon, 
  XIcon, 
  UserCircleIcon, 
  LogoutIcon, 
  CogIcon,
  ChartPieIcon,
  UsersIcon,
  ClockIcon,
  DocumentTextIcon,
  ClipboardCheckIcon
} from '@heroicons/react/outline';
import { Transition, Menu } from '@headlessui/react';

const TopNav = ({ unreadCount = 0 }) => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // --- PERMISSION LOGIC ---
    // Helper to check if a user has access to a specific route
    // Adjust these property names (e.g. user.permissions.x vs user.canX) to match your exact AuthContext data structure
    const hasAccess = (requiredPermission) => {
        if (!user) return false;
        if (user.role === 'SuperAdmin') return true; // SuperAdmin usually accesses everything

        switch (requiredPermission) {
            case 'DASHBOARD':
                return true; // Everyone typically sees a dashboard
            case 'TIMESHEETS':
                return user.role === 'admin' || user.permissions?.canManageTimesheets || user.permissions?.canLogHours;
            case 'CANDIDATES':
                return user.role === 'admin' || user.role === 'recruiter' || user.permissions?.canViewCandidates;
            case 'ONBOARDING':
                 return user.role === 'admin' || user.permissions?.canManageOnboarding;
            case 'REPORTS':
                return user.role === 'admin' || user.permissions?.canViewReports;
            case 'SETTINGS':
                return user.role === 'admin'; 
            default:
                return false;
        }
    };

    // Navigation Configuration
    const navLinks = [
        { name: 'Dashboard', path: '/dashboard', icon: ChartPieIcon, show: hasAccess('DASHBOARD') },
        { name: 'Timesheets', path: '/timesheets', icon: ClockIcon, show: hasAccess('TIMESHEETS') },
        { name: 'Candidates', path: '/candidates', icon: UsersIcon, show: hasAccess('CANDIDATES') },
        { name: 'Onboarding', path: '/onboarding', icon: ClipboardCheckIcon, show: hasAccess('ONBOARDING') },
        { name: 'Reports', path: '/reports', icon: DocumentTextIcon, show: hasAccess('REPORTS') },
    ];

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    return (
        <nav className="sticky top-0 z-50 w-full bg-white/90 backdrop-blur-md border-b border-gray-200 shadow-sm transition-all duration-300">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    
                    {/* LEFT: Logo & Desktop Nav */}
                    <div className="flex items-center">
                        {/* Logo */}
                        <div className="flex-shrink-0 flex items-center cursor-pointer group" onClick={() => navigate('/')}>
                            <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center mr-2 shadow-lg group-hover:bg-blue-700 transition-colors">
                                <span className="text-white font-bold text-xl">V</span>
                            </div>
                            <span className="hidden sm:block text-xl font-bold text-gray-800 tracking-tight">
                                VMS<span className="text-blue-600">Pro</span>
                            </span>
                        </div>
                        
                        {/* Desktop Links */}
                        <div className="hidden md:ml-8 md:flex md:space-x-4">
                            {navLinks.map((link) => (
                                link.show && (
                                    <NavLink
                                        key={link.name}
                                        to={link.path}
                                        className={({ isActive }) =>
                                            `inline-flex items-center px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                                                isActive
                                                    ? 'bg-blue-50 text-blue-700 shadow-sm ring-1 ring-blue-200'
                                                    : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                                            }`
                                        }
                                    >
                                        <link.icon className="h-4 w-4 mr-2" />
                                        {link.name}
                                    </NavLink>
                                )
                            ))}
                        </div>
                    </div>

                    {/* RIGHT: Utilities */}
                    <div className="hidden md:flex md:items-center md:space-x-3">
                        {/* Notifications */}
                        <button className="p-2 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 focus:outline-none relative transition-all">
                            <span className="sr-only">View notifications</span>
                            <BellIcon className="h-6 w-6" aria-hidden="true" />
                            {unreadCount > 0 && (
                                <span className="absolute top-1.5 right-1.5 flex h-3 w-3">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500 border-2 border-white"></span>
                                </span>
                            )}
                        </button>

                        <div className="h-6 w-px bg-gray-300 mx-2"></div>

                        {/* Profile Dropdown */}
                        <Menu as="div" className="relative">
                            <Menu.Button className="flex items-center space-x-3 bg-white hover:bg-gray-50 rounded-full p-1 pr-3 border border-gray-200 transition-all focus:ring-2 focus:ring-blue-100">
                                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold shadow-md">
                                    {user?.name?.charAt(0).toUpperCase() || 'U'}
                                </div>
                                <div className="hidden lg:flex flex-col items-start">
                                    <span className="text-sm font-semibold text-gray-700 leading-tight">{user?.name}</span>
                                    <span className="text-xs text-gray-500 leading-tight capitalize">{user?.role}</span>
                                </div>
                            </Menu.Button>

                            <Transition
                                as={Fragment}
                                enter="transition ease-out duration-100"
                                enterFrom="transform opacity-0 scale-95"
                                enterTo="transform opacity-100 scale-100"
                                leave="transition ease-in duration-75"
                                leaveFrom="transform opacity-100 scale-100"
                                leaveTo="transform opacity-0 scale-95"
                            >
                                <Menu.Items className="origin-top-right absolute right-0 mt-2 w-56 rounded-xl shadow-xl bg-white ring-1 ring-black ring-opacity-5 divide-y divide-gray-100 focus:outline-none">
                                    <div className="px-4 py-3">
                                        <p className="text-xs text-gray-500">Signed in as</p>
                                        <p className="text-sm font-medium text-gray-900 truncate">{user?.email}</p>
                                    </div>
                                    <div className="py-1">
                                        <Menu.Item>
                                            {({ active }) => (
                                                <button onClick={() => navigate('/profile')} className={`${active ? 'bg-blue-50 text-blue-700' : 'text-gray-700'} group flex items-center px-4 py-2 text-sm w-full`}>
                                                    <UserCircleIcon className="mr-3 h-5 w-5 text-gray-400 group-hover:text-blue-500" />
                                                    Your Profile
                                                </button>
                                            )}
                                        </Menu.Item>
                                        {hasAccess('SETTINGS') && (
                                            <Menu.Item>
                                                {({ active }) => (
                                                    <button onClick={() => navigate('/settings')} className={`${active ? 'bg-blue-50 text-blue-700' : 'text-gray-700'} group flex items-center px-4 py-2 text-sm w-full`}>
                                                        <CogIcon className="mr-3 h-5 w-5 text-gray-400 group-hover:text-blue-500" />
                                                        Settings
                                                    </button>
                                                )}
                                            </Menu.Item>
                                        )}
                                    </div>
                                    <div className="py-1">
                                        <Menu.Item>
                                            {({ active }) => (
                                                <button onClick={handleLogout} className={`${active ? 'bg-red-50 text-red-700' : 'text-gray-700'} group flex items-center px-4 py-2 text-sm w-full`}>
                                                    <LogoutIcon className="mr-3 h-5 w-5 text-gray-400 group-hover:text-red-500" />
                                                    Sign out
                                                </button>
                                            )}
                                        </Menu.Item>
                                    </div>
                                </Menu.Items>
                            </Transition>
                        </Menu>
                    </div>

                    {/* Mobile Menu Button */}
                    <div className="-mr-2 flex items-center md:hidden">
                        <button
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            className="bg-white inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                            <span className="sr-only">Open main menu</span>
                            {isMobileMenuOpen ? (
                                <XIcon className="block h-6 w-6" aria-hidden="true" />
                            ) : (
                                <MenuIcon className="block h-6 w-6" aria-hidden="true" />
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu Panel */}
            <Transition
                show={isMobileMenuOpen}
                enter="transition duration-150 ease-out"
                enterFrom="transform scale-95 opacity-0"
                enterTo="transform scale-100 opacity-100"
                leave="transition duration-100 ease-in"
                leaveFrom="transform scale-100 opacity-100"
                leaveTo="transform scale-95 opacity-0"
            >
                <div className="md:hidden bg-white border-t border-gray-100 shadow-lg absolute w-full">
                    <div className="pt-2 pb-3 space-y-1 px-2">
                        {navLinks.map((link) => (
                             link.show && (
                                <NavLink
                                    key={link.name}
                                    to={link.path}
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className={({ isActive }) =>
                                        `block pl-3 pr-4 py-3 rounded-md text-base font-medium flex items-center ${
                                            isActive
                                                ? 'bg-blue-50 text-blue-700'
                                                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                        }`
                                    }
                                >
                                    <link.icon className="h-5 w-5 mr-3" />
                                    {link.name}
                                </NavLink>
                             )
                        ))}
                    </div>
                    
                    {/* Mobile User Info */}
                    <div className="pt-4 pb-4 border-t border-gray-200 bg-gray-50">
                        <div className="flex items-center px-4">
                            <div className="flex-shrink-0">
                                <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">
                                    {user?.name?.charAt(0) || 'U'}
                                </div>
                            </div>
                            <div className="ml-3">
                                <div className="text-base font-medium text-gray-800">{user?.name}</div>
                                <div className="text-sm font-medium text-gray-500">{user?.email}</div>
                            </div>
                        </div>
                        <div className="mt-3 space-y-1 px-2">
                            <button onClick={() => { navigate('/profile'); setIsMobileMenuOpen(false); }} className="block px-3 py-2 rounded-md text-base font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-100 w-full text-left">
                                Your Profile
                            </button>
                            <button onClick={handleLogout} className="block px-3 py-2 rounded-md text-base font-medium text-red-600 hover:text-red-800 hover:bg-red-50 w-full text-left">
                                Sign out
                            </button>
                        </div>
                    </div>
                </div>
            </Transition>
        </nav>
    );
};

export default TopNav;