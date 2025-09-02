import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Spinner from './components/Spinner'; 
import MSAandWOSigningPage from './pages/MSAandWOSigningPage';
import MainApp from './MainApp';
import LoginPage from './pages/LoginPage';
import ChangePasswordPage from './pages/ChangePasswordPage';

/**
 * This component handles the routing logic AFTER the AuthProvider is available.
 * It checks the URL and renders the correct top-level page.
 */
const AppContent = () => {
    const [page, setPage] = useState('loading');
    const [token, setToken] = useState(null);
    
    // This effect runs once to determine the initial page based on the URL.
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const urlToken = params.get('token');

        if (urlToken) {
            setToken(urlToken);
            setPage('sign');
        } else {
            setPage('main');
        }
    }, []);

    const { isAuthenticated, isFirstLogin } = useAuth();

    if (page === 'loading') {
        return <div className="flex justify-center items-center h-screen"><Spinner size="12" /></div>;
    }

    if (page === 'sign') {
        // If the URL has a token, always show the signing page.
        // This page itself has logic to differentiate between a logged-in director and an external vendor.
        return <MSAandWOSigningPage token={token} />;
    }

    // --- Main Authenticated App Flow ---
    if (!isAuthenticated) {
        return <LoginPage />;
    }
    if (isFirstLogin) {
        return <ChangePasswordPage />;
    }
    return <MainApp />;
};


/**
 * This is the root component. Its only job is to provide the
 * AuthContext to the entire application.
 */
const App = () => {
    return (
        <AuthProvider>
            <AppContent />
        </AuthProvider>
    );
};

export default App;