import { useMemo } from 'react';
import { useAuth } from '../context/AuthContext';

const calculatePermissions = (permissions) => {
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
            canManageMSAWO: false,
            canManageOfferLetters: false, // NEW
        };
    }
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
        canManageOfferLetters: permissions.canManageOfferLetters === true, // NEW
    };
};

export const usePermissions = () => {
    const auth = useAuth() || {};
    const { permissions } = auth; 
    
    return useMemo(() => calculatePermissions(permissions), [permissions]);
};