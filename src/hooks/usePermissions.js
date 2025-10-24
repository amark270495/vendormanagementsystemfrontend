import { useMemo } from 'react';
import { useAuth } from '../context/AuthContext';

// Default permissions structure (ensure this matches AuthContext and includes ALL keys)
const defaultPermissions = {
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
    canManageHolidays: false,      // Included
    canApproveLeave: false,        // Included
    canManageLeaveConfig: false,   // Included
    canRequestLeave: false,        // Included
    canSendMonthlyReport: false,    // Included
    canApproveAttendance: false // <-- ADDED PERMISSION
};


// This helper function ensures all keys exist and values are strict booleans.
const calculatePermissions = (userPermissions) => {
    // Start with defaults, then override with actual permissions from the user object
    const merged = { ...defaultPermissions, ...(userPermissions || {}) };

    // Ensure all values returned are strictly boolean true/false
    const finalPermissions = {};
    for (const key in defaultPermissions) {
        // Use hasOwnProperty to be safe, although defaultPermissions structure controls the loop
        if (Object.hasOwnProperty.call(defaultPermissions, key)) {
             finalPermissions[key] = merged[key] === true;
        }
    }
    return finalPermissions;
};

/**
 * Custom hook to safely access permissions throughout the app.
 * Reads permissions directly from the user object in AuthContext.
 */
export const usePermissions = () => {
    const auth = useAuth() || {}; // Get auth context, default to empty object if not ready

    // --- FIX: Read permissions from user object within the context state ---
    const userPermissions = auth.user?.permissions;
    // --- End FIX ---

    // useMemo recalculates the final boolean permissions object only when
    // the userPermissions object reference from the context changes.
    return useMemo(() => calculatePermissions(userPermissions), [userPermissions]);
};