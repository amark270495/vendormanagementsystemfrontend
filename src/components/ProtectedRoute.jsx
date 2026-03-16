import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { usePermissions } from '../hooks/usePermissions';
import { ShieldAlert } from 'lucide-react';

const ProtectedRoute = ({ children, requiredPermission }) => {
    // 🌟 Notice we pulled in isFirstLogin here!
    const { user, isAuthenticated, loading, isFirstLogin } = useAuth();
    const permissions = usePermissions();
    const location = useLocation();

    // 1️⃣ Hydration Guard: Wait for Auth context
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
                    <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Authenticating...</p>
                </div>
            </div>
        );
    }

    // 2️⃣ Auth Guard: If not logged in, redirect to login AND save the attempted URL
    if (!isAuthenticated || !user) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // 3️⃣ First Login Guard: Force password change
    if (isFirstLogin && location.pathname !== '/change-password') {
        return <Navigate to="/change-password" replace />;
    }

    // 4️⃣ Permission Guard: Check if a specific permission was requested
    if (requiredPermission && !permissions[requiredPermission]) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-6">
                <div className="bg-white p-10 rounded-3xl shadow-xl border border-slate-100 flex flex-col items-center text-center max-w-md animate-in fade-in zoom-in-95 duration-300">
                    <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center text-rose-500 mb-6 shadow-inner">
                        <ShieldAlert size={40} strokeWidth={2.5} />
                    </div>
                    <h1 className="text-2xl font-black text-slate-800 mb-2">Access Restricted</h1>
                    <p className="text-sm text-slate-500 font-medium mb-8 leading-relaxed">
                        Your current system role (<span className="text-indigo-600 font-bold">{permissions.role}</span>) does not have the necessary security clearance to view this module.
                    </p>
                    <button 
                        onClick={() => window.history.back()}
                        className="px-8 py-3 bg-slate-900 text-white text-sm font-bold rounded-xl hover:bg-black transition-all active:scale-95 shadow-lg shadow-slate-200"
                    >
                        Go Back Safely
                    </button>
                </div>
            </div>
        );
    }

    // 5️⃣ Success: Render the protected component
    return children;
};

export default ProtectedRoute;