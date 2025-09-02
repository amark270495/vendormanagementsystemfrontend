import React, { useState } from 'react';
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

const MainApp = () => {
  const [currentPage, setCurrentPage] = useState({ page: 'home', params: {} });

  const handleNavigate = (page, params = {}) => {
    setCurrentPage({ page, params });
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
        return <AdminPage />;
      case 'create_company':
        return <CreateCompanyPage />;
      case 'manage_companies':
        return <ManageCompaniesPage />;
      case 'create_timesheet_employee':
        return <CreateTimesheetEmployeePage />;
      case 'manage_timesheet_employees':
        return <ManageTimesheetEmployeesPage />;
      case 'log_hours':
        return <LogHoursPage />;
      case 'timesheets_dashboard':
        return <TimesheetsDashboardPage />;
      case 'create_msa_wo':
        return <CreateMSAandWOPage />;
      case 'msa_wo_dashboard':
        return <MSAandWODashboardPage />;
      default:
        return <HomePage onNavigate={handleNavigate} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <TopNav onNavigate={handleNavigate} />
      <main className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderPage()}
      </main>
    </div>
  );
};

export default MainApp;