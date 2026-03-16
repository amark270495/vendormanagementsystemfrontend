import { useMemo } from 'react';
import { useAuth } from '../context/AuthContext';

const DEFAULT_PERMISSIONS = {
    canViewCandidates: false, canEditUsers: false, canAddPosting: false,
    canViewReports: false, canEmailReports: false, canViewDashboards: false,
    canEditDashboard: false, canMessage: false, canManageTimesheets: false,
    canRequestTimesheetApproval: false, canManageMSAWO: false, canManageOfferLetters: false,
    canManageHolidays: false, canApproveLeave: false, canManageLeaveConfig: false,
    canRequestLeave: false, canSendMonthlyReport: false, canApproveAttendance: false, 
    canManageBenchSales: false, canManageAssets: false, canAssignAssets: false
};

export const usePermissions = () => {
    const { user } = useAuth(); 

    return useMemo(() => {
        const userPerms = user?.permissions || {};
        const role = user?.userRole || user?.backendOfficeRole || 'User';
        
        // Strict Admin Check
        const isSuperAdmin = role === 'Admin' || role === 'SuperAdmin';

        // Evaluate every key strictly against the boolean 'true'
        const evaluatedPermissions = Object.keys(DEFAULT_PERMISSIONS).reduce((acc, key) => {
            acc[key] = isSuperAdmin ? true : (userPerms[key] === true);
            return acc;
        }, {});

        return {
            ...evaluatedPermissions,
            role,
            isSuperAdmin,
            // Category Helpers for Cleaner UI Logic
            canAccessAssets: isSuperAdmin || (userPerms.canManageAssets === true) || (userPerms.canAssignAssets === true),
            canAccessAdmin: isSuperAdmin || (userPerms.canEditUsers === true) || (userPerms.canManageHolidays === true) || (userPerms.canApproveLeave === true) || (userPerms.canApproveAttendance === true),
            canAccessDocs: isSuperAdmin || (userPerms.canManageMSAWO === true) || (userPerms.canManageOfferLetters === true),
            
            hasAny: (permArray) => isSuperAdmin || permArray.some(p => userPerms[p] === true)
        };
    }, [user]); 
};