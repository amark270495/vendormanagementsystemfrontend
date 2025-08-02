import React, { useState } from 'react';
import { usePermissions } from './hooks/usePermissions';
import TopNav from './components/TopNav';
import HomePage from './pages/HomePage';
import AdminPage from './pages/AdminPage';
import JobPostingFormPage from './pages/JobPostingFormPage';
import ReportsPage from './pages/ReportsPage';
import MessagesPage from './pages/MessagesPage';
import DashboardPage from './pages/DashboardPage';

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
            };

            const PageComponent = pageMap[currentPage.type];
            
            if (PageComponent) {
                return PageComponent;
            }

            // Fallback for pages that are not yet built or if permissions are denied
            return <div className="p-8 text-center">Page: <strong>{currentPage.type}</strong> (Component not created yet or permission denied)</div>;
        } catch (error) {
            console.error("Error rendering page:", error);
            // This is a local fallback in case the global ErrorBoundary fails for some reason.
            return <div className="p-8 text-center text-red-500">An error occurred while trying to display this page.</div>;
        }
    };

    return (
        <div className="min-h-screen bg-gray-100">
            <TopNav onNavigate={handleNavigate} />
            {/* ADDED: overflow-x-hidden to the main content area */}
            <main className="py-6 overflow-x-hidden">
                <div className="px-4 sm:px-6 lg:px-8">
                    {renderPage()}
                </div>
            </main>
        </div>
    );
};

export default MainApp;