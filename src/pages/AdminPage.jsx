import React, { useState } from 'react';
import UserManagementPage from './UserManagementPage';
import PermissionsPage from './PermissionsPage';
import { usePermissions } from '../hooks/usePermissions'; // <-- NEW: Import usePermissions

const AdminPage = () => {
    // NEW: Destructure canEditUsers from usePermissions
    const { canEditUsers } = usePermissions(); 

    const [view, setView] = useState('users');

    const renderView = () => {
        // Only render sub-pages if the user has permission
        if (!canEditUsers) {
            return (
                <div className="text-center text-gray-500 p-10 bg-white rounded-xl shadow-sm border">
                    <h3 className="text-lg font-medium">Access Denied</h3>
                    <p className="mt-1 text-sm text-gray-500">You do not have the necessary permissions to access the Admin Console.</p>
                </div>
            );
        }

        switch (view) {
            case 'users':
                return <UserManagementPage />;
            case 'permissions':
                return <PermissionsPage />;
            default:
                return <UserManagementPage />;
        }
    };

    const getButtonClasses = (buttonView) => {
        const baseClasses = 'px-4 py-2 text-sm font-semibold transition-colors duration-200 focus:outline-none';
        if (view === buttonView) {
            return `${baseClasses} text-indigo-600 border-b-2 border-indigo-600`;
        }
        return `${baseClasses} text-gray-600 hover:text-gray-900 border-b-2 border-transparent`;
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Admin Console</h1>
                    <p className="mt-1 text-gray-600">Manage users and their permissions.</p>
                </div>
            </div>
            
            {canEditUsers && ( // NEW: Conditionally render navigation tabs
                <div className="border-b border-gray-200">
                    <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                         <button 
                            onClick={() => setView('users')} 
                            className={getButtonClasses('users')}
                        >
                            User Management
                        </button>
                        <button 
                            onClick={() => setView('permissions')} 
                            className={getButtonClasses('permissions')}
                        >
                            Role Permissions
                        </button>
                    </nav>
                </div>
            )}
            
            <div>
                {renderView()}
            </div>
        </div>
    );
};

export default AdminPage;