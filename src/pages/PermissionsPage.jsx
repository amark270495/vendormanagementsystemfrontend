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

    const PermissionIcon = ({ allowed }) => (
        <span className={`flex justify-center items-center w-6 h-6 rounded-full ${allowed ? 'bg-green-100' : 'bg-red-100'}`}>
            {allowed ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
            ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
            )}
        </span>
    );

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border">
            <div className="mb-5">
                <h2 className="text-xl font-bold text-gray-800">Role Permissions Matrix</h2>
                <p className="text-sm text-gray-500">An overview of permissions for each user and backend role.</p>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-600">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                        <tr>
                            <th scope="col" className="px-6 py-4">Role</th>
                            {features.map(feature => (
                                <th key={feature.key} scope="col" className="px-6 py-4 text-center">{feature.name}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {rolesForDisplay.map(role => {
                            if (role.name === 'Standard User') return null;
                            const permissions = getPermissionsForRole(role);
                            return (
                                <tr key={role.name} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 font-semibold text-gray-900">
                                        {role.name} <span className="text-xs font-normal text-gray-500">({role.type})</span>
                                    </td>
                                    {features.map(feature => (
                                        <td key={feature.key} className="px-6 py-4">
                                            <div className="flex justify-center">
                                                <PermissionIcon allowed={permissions[feature.key]} />
                                            </div>
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