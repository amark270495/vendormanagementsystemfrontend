import { useMemo } from 'react';
import { useAuth } from '../context/AuthContext';

// --- Canonical list of ALL granular permissions (Mirrors AuthContext) ---
const DEFAULT_PERMISSIONS = {
    canViewCandidates: false, canEditUsers: false, canAddPosting: false,
    canViewReports: false, canEmailReports: false, canViewDashboards: false,
    canEditDashboard: false, canMessage: false, canManageTimesheets: false,
    canRequestTimesheetApproval: false, canManageMSAWO: false, canManageOfferLetters: false,
    canManageHolidays: false, canApproveLeave: false, canManageLeaveConfig: false,
    canRequestLeave: false, canSendMonthlyReport: false, canApproveAttendance: false, 
    canManageBenchSales: false, canManageAssets: false, canAssignAssets: false
};

/**
 * Custom hook to safely access permissions and roles throughout the app.
 */
export const usePermissions = () => {
    // Graceful fallback if useAuth fails or isn't wrapped properly
    const { user } = useAuth() || {}; 

    return useMemo(() => {
        const userPerms = user?.permissions || {};
        
        // Extract role, checking both standard and backend specific role fields
        const role = user?.userRole || user?.backendOfficeRole || 'User';

        // 1️⃣ THE BYPASS: SuperAdmins/Admins automatically get TRUE for all permissions
        const isSuperAdmin = role === 'Admin' || role === 'SuperAdmin';

        // 2️⃣ MODERN MERGE: Evaluate permissions cleanly
        const evaluatedPermissions = Object.keys(DEFAULT_PERMISSIONS).reduce((acc, key) => {
            // If they are an admin, auto-grant. Otherwise, strictly enforce the boolean.
            acc[key] = isSuperAdmin ? true : (userPerms[key] === true);
            return acc;
        }, {});

        // 3️⃣ RETURN OBJECT: Raw booleans + advanced helper functions
        return {
            ...evaluatedPermissions,
            role,
            isSuperAdmin,
            
            // Utility: Check if user has AT LEAST ONE of the listed permissions
            hasAny: (permArray) => isSuperAdmin || permArray.some(p => evaluatedPermissions[p]),
            
            // Utility: Check if user has ALL of the listed permissions
            hasAll: (permArray) => isSuperAdmin || permArray.every(p => evaluatedPermissions[p]),
            
            // Utility: Quick role check
            hasRole: (checkRole) => role === checkRole
        };
    }, [user]); // Only recalculate if the central user object updates
};