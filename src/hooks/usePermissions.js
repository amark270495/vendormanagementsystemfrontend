import { useMemo } from 'react';
import { useAuth } from '../context/AuthContext';

// --- CRITICAL: Define the canonical list of ALL granular permissions ---
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
    canManageHolidays: false,      // NEW PERMISSION
    canApproveLeave: false,        // NEW PERMISSION
    canManageLeaveConfig: false,   // NEW PERMISSION
    canRequestLeave: false,        // NEW PERMISSION
    canSendMonthlyReport: false,   // NEW PERMISSION
    canApproveAttendance: false    // NEW PERMISSION
};


// This helper function ensures all keys exist and values are strict booleans.
const calculatePermissions = (userPermissions) => {
    // Start with defaults, then override with actual permissions from the user object
    const merged = { ...defaultPermissions, ...(userPermissions || {}) };

    // Ensure all values returned are strictly boolean true/false
    const finalPermissions = {};
    for (const key in defaultPermissions) {
        if (Object.hasOwnProperty.call(defaultPermissions, key)) {
             // CRITICAL: Ensure the value is strictly true/false
             finalPermissions[key] = merged[key] === true;
        }
    }
    return finalPermissions;
};

/**
 * Custom hook to safely access permissions throughout the app.
 */
export const usePermissions = () => {
    const auth = useAuth() || {};

    const userPermissions = auth.user?.permissions;

    return useMemo(() => calculatePermissions(userPermissions), [userPermissions]);
};