import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { usePermissions } from '../hooks/usePermissions';
import { ShieldAlert } from 'lucide-react';

const ProtectedRoute = ({ children, requiredPermission }) => {
    const { user, loading } = useAuth();
    const permissions = usePermissions();
    const location = useLocation();

    // 1. Wait for Auth context to finish checking local storage / API
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    // 2. If not logged in, kick them to login and save where they were trying to go!
    if (!user) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // 3. If a specific permission is required for this route, check it
    if (requiredPermission && !permissions[requiredPermission]) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-6">
                <div className="bg-white p-10 rounded-3xl shadow-xl flex flex-col items-center text-center max-w-md">
                    <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center text-rose-500 mb-6">
                        <ShieldAlert size={40} />
                    </div>
                    <h1 className="text-2xl font-black text-slate-800 mb-2">Access Restricted</h1>
                    <p className="text-slate-500 font-medium mb-8 leading-relaxed">
                        Your current role (<span className="text-indigo-600 font-bold">{user.userRole || 'User'}</span>) does not have the necessary clearance to view this module.
                    </p>
                    <button 
                        onClick={() => window.history.back()}
                        className="px-8 py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-black transition-all active:scale-95"
                    >
                        Go Back Safely
                    </button>
                </div>
            </div>
        );
    }

    // 4. User is logged in and authorized, render the page!
    return children;
};

export default ProtectedRoute;