import { useMemo } from 'react';
import { useAuth } from '../context/AuthContext';

// This function centralizes the logic for determining user permissions based on their granular permissions.
// It no longer calculates based on userRole and backendRole.
const calculatePermissions = (permissions) => {
    // Return a default set of permissions if there are no permissions (e.g., user not logged in or permissions not loaded).
    if (!permissions) {
        return {
            canViewCandidates: false,
            canEditUsers: false,
            canAddPosting: false,
            canViewReports: false,
            canEmailReports: false,
            canViewDashboards: false, // Assuming dashboards are a general view permission
            canEditDashboard: false, // Assuming dashboard editing is a specific permission
            // Add other permissions here with default false values
        };
    }

    // Directly return the permissions object, ensuring boolean types
    return {
        canViewCandidates: permissions.canViewCandidates === true,
        canEditUsers: permissions.canEditUsers === true,
        canAddPosting: permissions.canAddPosting === true,
        canViewReports: permissions.canViewReports === true,
        canEmailReports: permissions.canEmailReports === true,
        canViewDashboards: permissions.canViewDashboards === true,
        canEditDashboard: permissions.canEditDashboard === true,
        // Map other permissions from the permissions object
    };
};

// The custom hook that components will use to get the current user's permissions.
export const usePermissions = () => {
    const { permissions } = useAuth(); // Get the current user's permissions from the AuthContext.
    
    // useMemo ensures that the permissions are only recalculated when the permissions object changes.
    return useMemo(() => calculatePermissions(permissions), [permissions]);
};