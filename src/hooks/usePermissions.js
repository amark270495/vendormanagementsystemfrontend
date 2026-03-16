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

// --- Normalize permission values coming from backend/storage ---
const normalizePermission = (value) => {
    return value === true || value === "true" || value === 1 || value === "1";
};

export const usePermissions = () => {
    const { user } = useAuth();

    return useMemo(() => {

        if (!user) {
            return {
                ...DEFAULT_PERMISSIONS,
                role: 'User',
                isSuperAdmin: false,
                canAccessAssets: false,
                canAccessAdmin: false,
                canAccessDocs: false,
                hasAny: () => false
            };
        }

        const rawPermissions = user?.permissions || {};

        const role =
            user?.userRole ||
            user?.backendOfficeRole ||
            'User';

        const isSuperAdmin =
            role === 'Admin' ||
            role === 'SuperAdmin';

        // --- Evaluate all permissions safely ---
        const evaluatedPermissions = Object.keys(DEFAULT_PERMISSIONS).reduce((acc, key) => {

            const normalizedValue = normalizePermission(rawPermissions[key]);

            acc[key] = isSuperAdmin ? true : normalizedValue;

            return acc;

        }, {});

        return {
            ...evaluatedPermissions,

            role,
            isSuperAdmin,

            // --- Category Helpers (Cleaner UI logic) ---
            canAccessAssets:
                isSuperAdmin ||
                normalizePermission(rawPermissions.canManageAssets) ||
                normalizePermission(rawPermissions.canAssignAssets),

            canAccessAdmin:
                isSuperAdmin ||
                normalizePermission(rawPermissions.canEditUsers) ||
                normalizePermission(rawPermissions.canManageHolidays) ||
                normalizePermission(rawPermissions.canApproveLeave) ||
                normalizePermission(rawPermissions.canApproveAttendance) ||
                normalizePermission(rawPermissions.canManageLeaveConfig) ||
                normalizePermission(rawPermissions.canSendMonthlyReport),

            canAccessDocs:
                isSuperAdmin ||
                normalizePermission(rawPermissions.canManageMSAWO) ||
                normalizePermission(rawPermissions.canManageOfferLetters),

            // --- Utility Helper ---
            hasAny: (permArray = []) =>
                isSuperAdmin ||
                permArray.some((perm) => normalizePermission(rawPermissions[perm]))
        };

    }, [user]);
};
