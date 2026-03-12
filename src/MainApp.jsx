import React from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import TopNav from './components/TopNav';

// Pages
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
import ApproveAttendancePage from './pages/ApproveAttendancePage';
import MonthlyAttendanceReportPage from './pages/MonthlyAttendanceReportPage';
import BenchSalesDashboard from './pages/BenchSalesDashboard';
import CreateAsset from './pages/CreateAsset';
import AssetManagementPage from './pages/AssetManagementPage';

const MainApp = () => {
    const navigate = useNavigate();

    // Helper for legacy components that still expect an `onNavigate` prop
    const handleNavigate = (path, params = {}) => {
        // Build the URL depending on if params exist (e.g. /dashboard?key=123)
        const url = Object.keys(params).length > 0 
            ? `/${path}?${new URLSearchParams(params).toString()}` 
            : `/${path}`;
        
        navigate(url);
    };

    return (
        <div className="min-h-screen bg-slate-50">
            {/* TopNav will now use standard React Router hooks inside it instead of state */}
            <TopNav onNavigate={handleNavigate} />
            
            <main className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <Routes>
                    <Route path="/home" element={<HomePage onNavigate={handleNavigate} />} />
                    <Route path="/dashboard" element={<DashboardPage />} />
                    <Route path="/new-posting" element={<JobPostingFormPage onFormSubmit={() => handleNavigate('home')} />} />
                    <Route path="/candidate-details" element={<CandidateDetailsPage />} />
                    <Route path="/reports" element={<ReportsPage />} />
                    <Route path="/messages" element={<MessagesPage />} />
                    <Route path="/admin" element={<AdminPage onNavigate={handleNavigate} />} />
                    
                    <Route path="/create-timesheet-company" element={<CreateTimesheetCompanyPage onNavigate={handleNavigate} />} />
                    <Route path="/manage-companies" element={<ManageCompaniesPage onNavigate={handleNavigate} />} />
                    <Route path="/create-timesheet-employee" element={<CreateTimesheetEmployeePage />} />
                    <Route path="/manage-timesheet-employees" element={<ManageTimesheetEmployeesPage />} />
                    <Route path="/log-hours" element={<LogHoursPage />} />
                    <Route path="/timesheets-dashboard" element={<TimesheetsDashboardPage />} />
                    
                    <Route path="/create-msa-wo-vendor-company" element={<CreateMSAWOVendorCompanyPage onNavigate={handleNavigate}/>} />
                    <Route path="/manage-msa-wo-vendor-companies" element={<ManageMSAWOVendorCompaniesPage onNavigate={handleNavigate}/>} />
                    <Route path="/create-msa-wo" element={<CreateMSAandWOPage onNavigate={handleNavigate} />} />
                    <Route path="/msa-wo-dashboard" element={<MSAandWODashboardPage />} />
                    
                    <Route path="/create-offer-letter" element={<CreateOfferLetterPage onNavigate={handleNavigate} />} />
                    <Route path="/offer-letter-dashboard" element={<OfferLetterDashboardPage />} />
                    
                    <Route path="/profile" element={<ProfilePage />} />
                    <Route path="/manage-holidays" element={<HolidayManagementPage />} />
                    <Route path="/approve-leave" element={<LeaveApprovalPage />} />
                    <Route path="/leave-config" element={<LeaveConfigPage />} />
                    <Route path="/approve-attendance" element={<ApproveAttendancePage />} />
                    <Route path="/monthly-attendance-report" element={<MonthlyAttendanceReportPage />} />
                    <Route path="/bench-sales" element={<BenchSalesDashboard />} />
                    
                    <Route path="/create-asset" element={<CreateAsset />} />
                    <Route path="/asset-dashboard" element={<AssetManagementPage />} />
                    
                    {/* Fallback routing: If user lands on '/' or an unknown page, send to /home */}
                    <Route path="/" element={<Navigate to="/home" replace />} />
                    <Route path="*" element={<Navigate to="/home" replace />} />
                </Routes>
            </main>
        </div>
    );
};

export default MainApp;