// src/MainApp.jsx

import React, { useState, useEffect } from 'react';
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
import ManageTimesheetEmployeesPage from './pages/ManageTimesheetEmployeesPage';
import ManageCompaniesPage from './pages/ManageCompaniesPage';
import CreateMSAandWOPage from './pages/CreateMSAandWOPage';
import MSAandWODashboardPage from './pages/MSAandWODashboardPage';
import MSAandWOSigningPage from './pages/MSAandWOSigningPage';

const MainApp = () => {
    const [currentPage, setCurrentPage] = useState({ type: 'home' });
    const permissions = usePermissions();

    const handleNavigate = (pageType, params = {}) => {
        setCurrentPage({ type: pageType, ...params });
    };

    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get('token');
        if (token) {
            handleNavigate('msa_wo_signing', { token });
        }
    }, []);

    const renderPage = () => {
        try {
            // *** CHANGE: Use the specific canManageMSAWO permission from the hook. ***
            const { canEditUsers, canAddPosting, canViewReports, canMessage, canViewDashboards, canViewCandidates, canManageTimesheets, canRequestTimesheetApproval, canManageMSAWO } = permissions;

            const pageMap = {
                home: <HomePage />,
                admin: canEditUsers && <AdminPage />,
                new_posting: canAddPosting && <JobPostingFormPage onFormSubmit={() => handleNavigate('dashboard', { key: 'taprootVMSDisplay' })} />,
                reports: canViewReports && <ReportsPage />,
                messages: canMessage && <MessagesPage />,
                dashboard: canViewDashboards && <DashboardPage sheetKey={currentPage.key} />,
                candidate_details: canViewCandidates && <CandidateDetailsPage />,
                create_company: canManageTimesheets && <CreateCompanyPage />,
                manage_companies: canManageTimesheets && <ManageCompaniesPage />,
                create_timesheet_employee: canManageTimesheets && <CreateTimesheetEmployeePage />,
                manage_timesheet_employees: canManageTimesheets && <ManageTimesheetEmployeesPage />,
                log_hours: canManageTimesheets && <LogHoursPage />,
                timesheets_dashboard: (canManageTimesheets || canRequestTimesheetApproval) && <TimesheetsDashboardPage />,
                // *** CHANGE: These routes are now protected by the canManageMSAWO permission. ***
                create_msa_wo: canManageMSAWO && <CreateMSAandWOPage />,
                msa_wo_dashboard: canManageMSAWO && <MSAandWODashboardPage />,
                msa_wo_signing: <MSAandWOSigningPage token={currentPage.token} />
            };

            const PageComponent = pageMap[currentPage.type];
            
            if (PageComponent === false) { // This handles cases where permission is false
                return (
                    <div className="p-8 text-center bg-white rounded-xl shadow-sm border mt-8">
                        <h3 className="text-lg font-medium text-gray-800">Access Denied</h3>
                        <p className="mt-1 text-sm text-gray-500">You do not have the necessary permissions to view this page.</p>
                    </div>
                );
            }
            
            return PageComponent || <HomePage />; // Default to home page if no match

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