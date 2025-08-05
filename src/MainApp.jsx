// src/MainApp.jsx (Updated)
import React, { useState } from 'react';
import { usePermissions } from './hooks/usePermissions';
import TopNav from './components/TopNav';
import HomePage from './pages/HomePage';
import AdminPage from './pages/AdminPage';
import JobPostingFormPage from './pages/JobPostingFormPage';
import ReportsPage from './pages/ReportsPage';
import MessagesPage from './pages/MessagesPage';
import DashboardPage from './pages/DashboardPage';
import CandidateDetailsPage from './pages/CandidateDetailsPage';
import CreateCompanyPage from './pages/CreateCompanyPage';
import LogHoursPage from './pages/LogHoursPage';
import TimesheetsDashboardPage from './pages/TimesheetsDashboardPage';
import CreateTimesheetEmployeePage from './pages/CreateTimesheetEmployeePage';
import ManageTimesheetEmployeesPage from './pages/ManageTimesheetEmployeesPage'; // NEW: Import ManageTimesheetEmployeesPage
import ManageCompaniesPage from './pages/ManageCompaniesPage'; // NEW: Import ManageCompaniesPage

const MainApp = () => {
    const [currentPage, setCurrentPage] = useState({ type: 'home' });
    const permissions = usePermissions(); // Get all granular permissions

    const handleNavigate = (pageType, params = {}) => {
        setCurrentPage({ type: pageType, ...params });
    };

    const renderPage = () => {
        try {
            const pageMap = {
                home: <HomePage />,
                admin: permissions.canEditUsers && <AdminPage />,
                new_posting: permissions.canAddPosting && <JobPostingFormPage onFormSubmit={() => handleNavigate('dashboard', { key: 'taprootVMSDisplay' })} />,
                reports: permissions.canViewReports && <ReportsPage />,
                messages: <MessagesPage />,
                dashboard: permissions.canViewDashboards && <DashboardPage sheetKey={currentPage.key} />,
                candidate_details: permissions.canViewCandidates && <CandidateDetailsPage />,
                create_company: permissions.canManageTimesheets && <CreateCompanyPage />,
                manage_companies: permissions.canManageTimesheets && <ManageCompaniesPage />, // NEW: Add ManageCompaniesPage route
                create_timesheet_employee: permissions.canManageTimesheets && <CreateTimesheetEmployeePage />,
                manage_timesheet_employees: permissions.canManageTimesheets && <ManageTimesheetEmployeesPage />, // NEW: Add ManageTimesheetEmployeesPage route
                log_hours: permissions.canManageTimesheets && <LogHoursPage />,
                timesheets_dashboard: (permissions.canManageTimesheets || permissions.canRequestTimesheetApproval) && <TimesheetsDashboardPage />,
            };

            const PageComponent = pageMap[currentPage.type];
            
            // If PageComponent is explicitly false (due to permission check), render permission denied message
            if (PageComponent === false) {
                return (
                    <div className="p-8 text-center bg-white rounded-xl shadow-sm border mt-8">
                        <h3 className="text-lg font-medium text-gray-800">Access Denied</h3>
                        <p className="mt-1 text-sm text-gray-500">You do not have the necessary permissions to view this page.</p>
                    </div>
                );
            }
            
            if (PageComponent) {
                return PageComponent;
            }

            // Fallback for pages not in map or other issues
            return <div className="p-8 text-center">Page: <strong>{currentPage.type}</strong> (Component not found or other issue)</div>;
        } catch (error) {
            console.error("Error rendering page:", error);
            return <div className="p-8 text-center text-red-500">An error occurred while trying to display this page.</div>;
        }
    };

    return (
        <div className="min-h-screen bg-gray-100">
            <TopNav onNavigate={handleNavigate} />
            <main className="py-6">
                <div className="px-4 sm:px-6 lg:px-8 w-full max-w-full overflow-x-hidden">
                    {renderPage()}
                </div>
            </main>
        </div>
    );
};

export default MainApp;