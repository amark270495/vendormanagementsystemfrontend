import { useMemo } from 'react';
import { useAuth } from '../context/AuthContext';

// This helper function calculates the final boolean permissions.
const calculatePermissions = (permissions) => {
    if (!permissions) {
        // If no permissions object exists, default all to false for security.
        return {
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
        };
    }
    // Ensure each permission is treated as a strict boolean `true`.
    return {
        canViewCandidates: permissions.canViewCandidates === true,
        canEditUsers: permissions.canEditUsers === true,
        canAddPosting: permissions.canAddPosting === true,
        canViewReports: permissions.canViewReports === true,
        canEmailReports: permissions.canEmailReports === true,
        canViewDashboards: permissions.canViewDashboards === true,
        canEditDashboard: permissions.canEditDashboard === true,
        canMessage: permissions.canMessage === true,
        canManageTimesheets: permissions.canManageTimesheets === true,
        canRequestTimesheetApproval: permissions.canRequestTimesheetApproval === true,
        canManageMSAWO: permissions.canManageMSAWO === true,
    };
};

/**
 * Custom hook to safely access permissions throughout the app.
 */
export const usePermissions = () => {
    // --- FIX ---
    // Safely get the entire auth context. If it's not available (e.g., for a vendor),
    // default to an empty object. This prevents the hook from crashing.
    const auth = useAuth() || {};
    const { permissions } = auth; // Now this destructuring is safe, even if auth is {}.
    // --- END FIX ---

    // useMemo ensures the permissions object is only recalculated when the source permissions change.
    return useMemo(() => calculatePermissions(permissions), [permissions]);
};