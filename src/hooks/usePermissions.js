import { useMemo } from 'react';
import { useAuth } from '../context/AuthContext';

// This function centralizes the logic for determining user permissions based on their roles.
const calculatePermissions = (user) => {
    // Return a default set of permissions if there is no user.
    if (!user) {
        return {
            isAdmin: false,
            canViewDashboards: false,
            canEditDashboard: false,
            canAddPosting: false,
            canViewReports: false,
            canEmailReports: false,
        };
    }

    const userRole = (user?.userRole || '').trim();
    const backendRole = (user?.backendOfficeRole || '').trim();

    // Direct role checks for clarity
    const isAdmin = userRole === 'Admin';
    const isDataEntry = userRole === 'Data Entry';
    const isDataViewer = userRole === 'Data Viewer';
    const isDataEntryViewer = userRole === 'Data Entry & Viewer';
    
    const isRecruitmentManager = backendRole === 'Recruitment Manager';
    const isRecruitmentTeam = backendRole === 'Recruitment Team';
    const isOpsAdmin = backendRole === 'Operations Admin';
    const isOpsManager = backendRole === 'Operations Manager';
    const isDevManager = backendRole === 'Development Manager';
    const isDevExec = backendRole === 'Development Executive';

    // Aggregate permissions based on the roles.
    const canViewDashboards = isAdmin || isDataViewer || isDataEntry || isDataEntryViewer || isRecruitmentManager || isRecruitmentTeam || isOpsAdmin || isOpsManager || isDevManager || isDevExec;
    const canEditDashboard = isAdmin || isDataEntry || isDataEntryViewer || isDevManager || isDevExec;
    const canAddPosting = canEditDashboard;
    const canViewReports = isAdmin || isRecruitmentManager || isDataViewer || isDataEntryViewer;
    const canEmailReports = isAdmin || isDataEntry || isDataEntryViewer || isRecruitmentManager;

    return {
        isAdmin,
        canViewDashboards,
        canEditDashboard,
        canAddPosting,
        canViewReports,
        canEmailReports,
    };
};

// The custom hook that components will use to get the current user's permissions.
export const usePermissions = () => {
    const { user } = useAuth(); // Get the current user from the AuthContext.
    
    // useMemo ensures that the permissions are only recalculated when the user object changes.
    return useMemo(() => calculatePermissions(user), [user]);
};
