import React, { useState } from 'react';
import UserManagementPage from './UserManagementPage';
import PermissionsPage from './PermissionsPage';
import HolidayManagementPage from './HolidayManagementPage';
import LeaveApprovalPage from './LeaveApprovalPage';
import LeaveConfigPage from './LeaveConfigPage';
import ApproveAttendancePage from './ApproveAttendancePage';
import MonthlyAttendanceReportPage from './MonthlyAttendanceReportPage'; // NEW: Import monthly report page
import { usePermissions } from '../hooks/usePermissions';

const AdminPage = ({ onNavigate }) => {
    // Get all relevant admin permissions
    const { 
        canEditUsers, 
        canManageHolidays, 
        canApproveLeave, 
        canManageLeaveConfig, 
        canApproveAttendance, 
        canSendMonthlyReport // NEW: For reporting tab 
    } = usePermissions();

    // Determine the default view based on available permissions
    const getDefaultView = () => {
        if (canEditUsers) return 'users';
        if (canManageHolidays) return 'holidays';
        if (canApproveLeave) return 'approve_leave';
        if (canManageLeaveConfig) return 'leave_config';
        if (canApproveAttendance) return 'approve_attendance';
        if (canSendMonthlyReport) return 'monthly_report'; // New default tab check
        return 'access_denied'; // Fallback if no admin permissions
    };

    const [view, setView] = useState(getDefaultView());

    // Helper to get button classes
    const getButtonClasses = (buttonView) => {
        const baseClasses = 'px-4 py-2 text-sm font-semibold transition-colors duration-200 focus:outline-none rounded-t-md'; 
        if (view === buttonView) {
            return `${baseClasses} text-indigo-700 bg-white border border-gray-200 border-b-0`;
        }
        return `${baseClasses} text-gray-500 hover:text-gray-700 border border-transparent hover:bg-gray-100`;
    };

    // Render the selected component based on the 'view' state
    const renderView = () => {
        switch (view) {
            case 'users':
                return canEditUsers ? <UserManagementPage /> : null;
            case 'permissions':
                return canEditUsers ? <PermissionsPage /> : null; 
            case 'holidays':
                return canManageHolidays ? <HolidayManagementPage /> : null;
            case 'approve_leave':
                 return canApproveLeave ? <LeaveApprovalPage /> : null;
            case 'leave_config':
                 return canManageLeaveConfig ? <LeaveConfigPage /> : null;
            case 'approve_attendance':
                 return canApproveAttendance ? <ApproveAttendancePage /> : null;
            // NEW: Monthly Report Case
            case 'monthly_report':
                 return canSendMonthlyReport ? <MonthlyAttendanceReportPage /> : null;
            case 'access_denied':
                 return (
                     <div className="text-center text-gray-500 p-10 bg-white rounded-xl shadow-sm border mt-4">
                         <h3 className="text-lg font-medium">Access Denied</h3>
                         <p className="mt-1 text-sm text-gray-500">You do not have the necessary permissions to access any Admin Console sections.</p>
                     </div>
                 );
            default:
                return null; 
        }
    };

    // Check if user has ANY admin permissions to show the console at all
    const hasAnyAdminPermission = canEditUsers || canManageHolidays || canApproveLeave || canManageLeaveConfig || canApproveAttendance || canSendMonthlyReport;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Admin Console</h1>
                <p className="mt-1 text-gray-600">Manage system settings and user access.</p>
            </div>

            {hasAnyAdminPermission ? (
                <>
                    {/* Tab Navigation */}
                    <div className="border-b border-gray-200 bg-gray-50 p-1 rounded-lg">
                        <nav className="-mb-px flex flex-wrap space-x-1" aria-label="Tabs">
                            {canEditUsers && (
                                <>
                                    <button onClick={() => setView('users')} className={getButtonClasses('users')}>
                                        User Management
                                    </button>
                                    <button onClick={() => setView('permissions')} className={getButtonClasses('permissions')}>
                                        Role Permissions
                                    </button>
                                </>
                            )}
                            {canManageHolidays && (
                                <button onClick={() => setView('holidays')} className={getButtonClasses('holidays')}>
                                    Manage Holidays
                                </button>
                            )}
                            {canApproveLeave && (
                                 <button onClick={() => setView('approve_leave')} className={getButtonClasses('approve_leave')}>
                                     Approve Leave
                                 </button>
                            )}
                             {canManageLeaveConfig && (
                                 <button onClick={() => setView('leave_config')} className={getButtonClasses('leave_config')}>
                                     Leave Configuration
                                 </button>
                            )}
                             {canApproveAttendance && (
                                 <button onClick={() => setView('approve_attendance')} className={getButtonClasses('approve_attendance')}>
                                     Approve Attendance
                                 </button>
                            )}
                            {canSendMonthlyReport && (
                                 <button onClick={() => setView('monthly_report')} className={getButtonClasses('monthly_report')}>
                                     Monthly Reports
                                 </button>
                            )}
                        </nav>
                    </div>

                    {/* Content Area */}
                    <div className="mt-4">
                        {renderView()}
                    </div>
                </>
            ) : (
                 renderView()
            )}
        </div>
    );
};

export default AdminPage;