import React, { useState, useEffect } from 'react';
import TopNav from './components/TopNav';
import HomePage from './pages/HomePage';
import AdminPage from './pages/AdminPage';
import JobPostingFormPage from './pages/JobPostingFormPage';
import ReportsPage from './pages/ReportsPage';
import MessagesPage from './pages/MessagesPage';
import DashboardPage from './pages/DashboardPage';
import CandidateDetailsPage from './pages/CandidateDetailsPage';
import CreateTimesheetCompanyPage from './pages/CreateTimesheetCompanyPage';
import LogHoursPage from './pages/LogHoursPage';
import TimesheetsDashboardPage from './pages/TimesheetsDashboardPage';
import CreateTimesheetEmployeePage from './pages/CreateTimesheetEmployeePage';
import ManageTimesheetEmployeesPage from './pages/ManageTimesheetEmployeesPage';
import ManageCompaniesPage from './pages/ManageCompaniesPage';
import CreateMSAandWOPage from './pages/CreateMSAandWOPage';
import MSAandWODashboardPage from './pages/MSAandWODashboardPage';
import CreateMSAWOVendorCompanyPage from './pages/CreateMSAWOVendorCompanyPage';
import ManageMSAWOVendorCompaniesPage from './pages/ManageMSAWOVendorCompaniesPage';
import CreateOfferLetterPage from './pages/CreateOfferLetterPage';
import OfferLetterDashboardPage from './pages/OfferLetterDashboardPage';
import ProfilePage from './pages/ProfilePage';
import HolidayManagementPage from './pages/HolidayManagementPage';
import LeaveApprovalPage from './pages/LeaveApprovalPage';
import LeaveConfigPage from './pages/LeaveConfigPage';
// *** Import the missing pages ***
import ApproveAttendancePage from './pages/ApproveAttendancePage';
import MonthlyAttendanceReportPage from './pages/MonthlyAttendanceReportPage';


const MainApp = () => {
    const [currentPage, setCurrentPage] = useState({ page: 'home', params: {} });

    useEffect(() => {
        const savedPage = sessionStorage.getItem('vms_currentPage');
        if (savedPage) {
            try {
                const parsedPage = JSON.parse(savedPage);
                setCurrentPage(parsedPage);
            } catch (e) {
                console.error("Could not parse saved page state:", e);
                setCurrentPage({ page: 'home', params: {} });
            }
        }
    }, []);

    const handleNavigate = (page, params = {}) => {
        const newState = { page, params };
        sessionStorage.setItem('vms_currentPage', JSON.stringify(newState));
        setCurrentPage(newState);
    };

    const renderPage = () => {
        switch (currentPage.page) {
            case 'home':
                return <HomePage onNavigate={handleNavigate} />;
            case 'dashboard':
                return <DashboardPage sheetKey={currentPage.params.key} />;
            case 'new_posting':
                return <JobPostingFormPage onFormSubmit={() => handleNavigate('home')} />;
            case 'candidate_details':
                return <CandidateDetailsPage />;
            case 'reports':
                return <ReportsPage />;
            case 'messages':
                return <MessagesPage />;
            case 'admin':
                return <AdminPage onNavigate={handleNavigate} />;
            case 'create_timesheet_company':
                return <CreateTimesheetCompanyPage onNavigate={handleNavigate} />;
            case 'manage_companies':
                return <ManageCompaniesPage onNavigate={handleNavigate} />;
            case 'create_timesheet_employee':
                return <CreateTimesheetEmployeePage />;
            case 'manage_timesheet_employees':
                return <ManageTimesheetEmployeesPage />;
            case 'log_hours':
                return <LogHoursPage />;
            case 'timesheets_dashboard':
                return <TimesheetsDashboardPage />;
            case 'create_msa_wo_vendor_company':
                return <CreateMSAWOVendorCompanyPage onNavigate={handleNavigate}/>;
            case 'manage_msa_wo_vendor_companies':
                return <ManageMSAWOVendorCompaniesPage onNavigate={handleNavigate}/>;
            case 'create_msa_wo':
                return <CreateMSAandWOPage onNavigate={handleNavigate} />;
            case 'msa_wo_dashboard':
                return <MSAandWODashboardPage />;
            case 'create_offer_letter':
                return <CreateOfferLetterPage onNavigate={handleNavigate} />;
            case 'offer_letter_dashboard':
                return <OfferLetterDashboardPage />;
            case 'profile':
                return <ProfilePage />;
            case 'manage_holidays':
                return <HolidayManagementPage />;
            case 'approve_leave':
                return <LeaveApprovalPage />;
            case 'leave_config':
                return <LeaveConfigPage />;
            
            // *** ADDED MISSING CASES HERE ***
            case 'approve_attendance':
                return <ApproveAttendancePage />;
            case 'monthly_attendance_report':
                return <MonthlyAttendanceReportPage />;
            // *** END FIX ***
                
            default:
                return <HomePage onNavigate={handleNavigate} />;
        }
    };

    return (
        <div className="min-h-screen bg-slate-50">
            <TopNav onNavigate={handleNavigate} currentPage={currentPage.page} />
            <main className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {renderPage()}
            </main>
        </div>
    );
};

export default MainApp;