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
import CandidateDetailsPage from './pages/CandidateDetailsPage'; // <-- IMPORT

const MainApp = () => {
    const [currentPage, setCurrentPage] = useState({ type: 'home' });
    const permissions = usePermissions();

    const handleNavigate = (pageType, params = {}) => {
        setCurrentPage({ type: pageType, ...params });
    };

    const renderPage = () => {
        try {
            const pageMap = {
                home: <HomePage />,
                admin: permissions.isAdmin && <AdminPage />,
                new_posting: permissions.canAddPosting && <JobPostingFormPage onFormSubmit={() => handleNavigate('dashboard', { key: 'taprootVMSDisplay' })} />,
                reports: permissions.canViewReports && <ReportsPage />,
                messages: <MessagesPage />,
                dashboard: permissions.canViewDashboards && <DashboardPage sheetKey={currentPage.key} />,
                candidate_details: permissions.canViewDashboards && <CandidateDetailsPage />, // <-- ADD ROUTE
            };

            const PageComponent = pageMap[currentPage.type];
            
            if (PageComponent) {
                return PageComponent;
            }

            return <div className="p-8 text-center">Page: <strong>{currentPage.type}</strong> (Component not created yet or permission denied)</div>;
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