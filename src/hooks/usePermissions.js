// src/hooks/usePermissions.js

import { useMemo } from 'react';
import { useAuth } from '../context/AuthContext';

// This function calculates the final boolean permissions based on the user object.
const calculatePermissions = (permissions) => {
    // If no permissions object exists, default all to false for security.
    if (!permissions) {
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
            canManageMSAWO: false, // Default canManageMSAWO to false
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
        // *** CHANGE: Correctly map the canManageMSAWO permission from the context. ***
        canManageMSAWO: permissions.canManageMSAWO === true,
    };
};

// Custom hook to easily access permissions throughout the app.
export const usePermissions = () => {
    const { permissions } = useAuth();
    // useMemo ensures that the permissions object is only recalculated when the source permissions change.
    return useMemo(() => calculatePermissions(permissions), [permissions]);
};
