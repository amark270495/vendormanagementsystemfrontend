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
import ManageCompaniesPage from './pages/ManageCompaniesPage';
import CreateTimesheetEmployeePage from './pages/CreateTimesheetEmployeePage';
import ManageTimesheetEmployeesPage from './pages/ManageTimesheetEmployeesPage';
import LogHoursPage from './pages/LogHoursPage';
import TimesheetsDashboardPage from './pages/TimesheetsDashboardPage';
import CreateMSAWOVendorCompanyPage from './pages/CreateMSAWOVendorCompanyPage';
import ManageMSAWOVendorCompaniesPage from './pages/ManageMSAWOVendorCompaniesPage';
import CreateMSAandWOPage from './pages/CreateMSAandWOPage';
import MSAandWODashboardPage from './pages/MSAandWODashboardPage';
import CreateOfferLetterPage from './pages/CreateOfferLetterPage';
import OfferLetterDashboardPage from './pages/OfferLetterDashboardPage';

const MainApp = () => {
  // Restore page from sessionStorage on initial load, or default to home
  const [currentPage, setCurrentPage] = useState(() => {
    try {
      const savedPage = sessionStorage.getItem('vms_currentPage');
      return savedPage ? JSON.parse(savedPage) : { page: 'home', params: {} };
    } catch (e) {
      return { page: 'home', params: {} };
    }
  });

  // Save page to sessionStorage whenever it changes
  const handleNavigate = (page, params = {}) => {
    const newPage = { page, params };
    setCurrentPage(newPage);
    sessionStorage.setItem('vms_currentPage', JSON.stringify(newPage));
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
      // Timesheets
      case 'create_timesheet_company':
        return <CreateTimesheetCompanyPage />;
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
      // E-Sign's
      case 'create_msawo_vendor_company':
        return <CreateMSAWOVendorCompanyPage />;
      case 'manage_msawo_vendor_companies':
        return <ManageMSAWOVendorCompaniesPage />;
      case 'create_msa_wo':
        return <CreateMSAandWOPage onNavigate={handleNavigate} />;
      case 'msa_wo_dashboard':
        return <MSAandWODashboardPage />;
      case 'create_offer_letter':
        return <CreateOfferLetterPage />;
      case 'offer_letter_dashboard':
        return <OfferLetterDashboardPage />;
      default:
        return <HomePage onNavigate={handleNavigate} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <TopNav onNavigate={handleNavigate} currentPage={currentPage} />
      <main className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderPage()}
      </main>
    </div>
  );
};

export default MainApp;