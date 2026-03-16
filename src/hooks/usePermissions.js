import { useMemo } from 'react';
import { useAuth } from '../context/AuthContext';

// --- Default Permissions ---
const DEFAULT_PERMISSIONS = {
    canViewCandidates: false,
    canEditUsers: false,
    canAddPosting: false,
    canViewReports: false,
    canEmailReports: false,
    canViewDashboards: false,
    canEditDashboard: false,
    canMessage: false,
    canManageTimesheets: false,
    canRequestTimesheetApproval: false,
    canManageMSAWO: false,
    canManageOfferLetters: false,
    canManageHolidays: false,
    canApproveLeave: false,
    canManageLeaveConfig: false,
    canRequestLeave: false,
    canSendMonthlyReport: false,
    canApproveAttendance: false,
    canManageBenchSales: false,
    canManageAssets: false,
    canAssignAssets: false
};

// --- Normalize permission values safely (Handles booleans, strings, and numbers) ---
const normalizePermission = (value) => {
    return value === true || value === "true" || value === 1 || value === "1";
};

export const usePermissions = () => {
    const { user } = useAuth();

    return useMemo(() => {
        // If no user is logged in, return strict defaults
        if (!user) {
            return {
                ...DEFAULT_PERMISSIONS,
                role: 'Guest',
                canAccessAssets: false,
                canAccessAdmin: false,
                canAccessDocs: false,
                hasAny: () => false
            };
        }

        const rawPermissions = user.permissions || {};
        const role = user.userRole || user.backendOfficeRole || 'User';

        // --- CRITICAL FIX: Evaluate strictly on granular values ---
        // Removed the blanket override that forced all keys to true
        const evaluatedPermissions = Object.keys(DEFAULT_PERMISSIONS).reduce((acc, key) => {
            acc[key] = normalizePermission(rawPermissions[key]);
            return acc;
        }, {});

        return {
            ...evaluatedPermissions,
            role,

            // --- Category Helpers (For cleaner UI logic) ---
            canAccessAssets: 
                evaluatedPermissions.canManageAssets || 
                evaluatedPermissions.canAssignAssets,

            canAccessAdmin: 
                evaluatedPermissions.canEditUsers || 
                evaluatedPermissions.canManageHolidays || 
                evaluatedPermissions.canApproveLeave || 
                evaluatedPermissions.canApproveAttendance || 
                evaluatedPermissions.canManageLeaveConfig || 
                evaluatedPermissions.canSendMonthlyReport,

            canAccessDocs: 
                evaluatedPermissions.canManageMSAWO || 
                evaluatedPermissions.canManageOfferLetters,

            // --- Utility Helper ---
            hasAny: (permArray = []) => 
                permArray.some((perm) => evaluatedPermissions[perm])
        };
    }, [user]);
};