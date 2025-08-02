import React from 'react';

// This helper function is copied from our original script to determine permissions for any given role.
const calculatePermissions = (mockUser) => {
    if (!mockUser) return {};
    const userRole = (mockUser?.userRole || '').trim();
    const backendRole = (mockUser?.backendOfficeRole || '').trim();

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

    const canViewDashboards = isAdmin || isDataViewer || isDataEntry || isDataEntryViewer || isRecruitmentManager || isRecruitmentTeam || isOpsAdmin || isOpsManager || isDevManager || isDevExec;
    const canEditDashboard = isAdmin || isDataEntry || isDataEntryViewer || isDevManager || isDevExec;
    const canAddPosting = canEditDashboard;
    const canViewReports = isAdmin || isRecruitmentManager || isDataViewer || isDataEntryViewer;
    const canEmailReports = isAdmin || isDataEntry || isDataEntryViewer || isRecruitmentManager;

    return {
        isAdmin,
        canViewDashboards,
        canAddPosting,
        canViewReports,
        canEmailReports,
    };
};


const PermissionsPage = () => {
    // Define all possible roles for display in the table.
    const allUserRoles = ['Admin', 'Standard User', 'Data Entry', 'Data Viewer', 'Data Entry & Viewer'];
    const allBackendRoles = ['Operations Admin', 'Operations Manager', 'Development Manager', 'Development Executive', 'Recruitment Manager', 'Recruitment Team'];
    
    const rolesForDisplay = [
        ...allUserRoles.map(r => ({ name: r, type: 'User Role' })),
        ...allBackendRoles.map(r => ({ name: r, type: 'Backend Role' }))
    ];

    // Define the features (columns) to be displayed in the permissions table.
    const features = [
        { name: 'View Dashboards', key: 'canViewDashboards' },
        { name: 'Add/Edit Jobs', key: 'canAddPosting' },
        { name: 'View Reports', key: 'canViewReports' },
        { name: 'Email Reports', key: 'canEmailReports' },
        { name: 'User Management', key: 'isAdmin' },
    ];

    // This function creates a mock user object to pass to the calculation function.
    const getPermissionsForRole = (role) => {
        const mockUser = {
            userRole: role.type === 'User Role' ? role.name : 'Standard User',
            backendOfficeRole: role.type === 'Backend Role' ? role.name : ''
        };
        return calculatePermissions(mockUser);
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Role Permissions Matrix</h2>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-500">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                        <tr>
                            <th scope="col" className="px-6 py-3">Role</th>
                            {features.map(feature => (
                                <th key={feature.key} scope="col" className="px-6 py-3 text-center">{feature.name}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {rolesForDisplay.map(role => {
                            // Don't display the generic "Standard User" as it has no specific permissions.
                            if (role.name === 'Standard User') return null;
                            const permissions = getPermissionsForRole(role);
                            return (
                                <tr key={role.name} className="bg-white border-b hover:bg-gray-50">
                                    <td className="px-6 py-4 font-medium text-gray-900">
                                        {role.name} <span className="text-xs text-gray-400">({role.type})</span>
                                    </td>
                                    {features.map(feature => (
                                        <td key={feature.key} className="px-6 py-4 text-center">
                                            {permissions[feature.key] ? (
                                                <span className="text-green-500" title="Allowed">✔️</span>
                                            ) : (
                                                <span className="text-red-500" title="Not Allowed">❌</span>
                                            )}
                                        </td>
                                    ))}
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default PermissionsPage;