import React, { useState } from 'react';
import UserManagementPage from './UserManagementPage';
import PermissionsPage from './PermissionsPage';

const AdminPage = () => {
    // This state determines which view is active: 'users' or 'permissions'.
    const [view, setView] = useState('users');

    // This function returns the component corresponding to the active view.
    const renderView = () => {
        switch (view) {
            case 'users':
                return <UserManagementPage />;
            case 'permissions':
                return <PermissionsPage />;
            default:
                return <UserManagementPage />;
        }
    };

    // Helper function to get the CSS classes for the view-switcher buttons.
    const getButtonClasses = (buttonView) => {
        const baseClasses = 'px-4 py-2 transition-colors';
        if (view === buttonView) {
            return `${baseClasses} bg-indigo-600 text-white`;
        }
        return `${baseClasses} bg-white text-gray-800 hover:bg-gray-50`;
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-800">Admin Section</h1>
                {/* View switcher buttons */}
                <div className="flex rounded-lg shadow-sm border">
                    <button 
                        onClick={() => setView('users')} 
                        className={`${getButtonClasses('users')} rounded-l-lg`}
                    >
                        Users
                    </button>
                    <button 
                        onClick={() => setView('permissions')} 
                        className={`${getButtonClasses('permissions')} rounded-r-lg border-l border-gray-200`}
                    >
                        Permissions
                    </button>
                </div>
            </div>
            {/* Render the active view */}
            <div>
                {renderView()}
            </div>
        </div>
    );
};

export default AdminPage;