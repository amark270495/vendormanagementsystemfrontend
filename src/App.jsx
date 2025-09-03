import React, { useState, useEffect } from 'react';
import Spinner from './components/Spinner';
import MSAandWOSigningPage from './pages/MSAandWOSigningPage';
import MainApp from './MainApp';
import LoginPage from './pages/LoginPage';
import ChangePasswordPage from './pages/ChangePasswordPage';
import { AuthProvider, useAuth } from './context/AuthContext';

// --- APPLICATION ROUTING LOGIC ---
const AppContent = () => {
    const [page, setPage] = useState('loading');
    const [token, setToken] = useState(null);
    const { isAuthenticated, isFirstLogin } = useAuth();

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const urlToken = params.get('token');

        if (urlToken && urlToken.length > 10) {
            setToken(urlToken);
            setPage('sign');
        } else {
            setPage('main');
        }
    }, []);

    if (page === 'loading') {
        return (
            <div className="flex justify-center items-center h-screen">
                <Spinner size="12" />
            </div>
        );
    }

    if (page === 'sign') {
        return token ? <MSAandWOSigningPage token={token} /> : <LoginPage />;
    }

    if (!isAuthenticated) {
        return <LoginPage />;
    }

    if (isFirstLogin) {
        return <ChangePasswordPage />;
    }

    return <MainApp />;
};

// --- ROOT APP COMPONENT ---
const App = () => (
    <AuthProvider>
        <AppContent />
    </AuthProvider>
);

export default App;