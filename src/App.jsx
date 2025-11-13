import React, { useState, useEffect } from 'react';
import Spinner from './components/Spinner';
import MainApp from './MainApp';
import LoginPage from './pages/LoginPage';
import ChangePasswordPage from './pages/ChangePasswordPage';
import { AuthProvider, useAuth } from './context/AuthContext';
import MSAandWOSigningPage from './pages/MSAandWOSigningPage';
import OfferLetterSigningPage from './pages/OfferLetterSigningPage';

const AppContent = () => {
    const { isAuthenticated, isFirstLogin } = useAuth();
    const [page, setPage] = useState('loading');
    const [token, setToken] = useState(null);

    useEffect(() => {
        const path = window.location.pathname;
        const params = new URLSearchParams(window.location.search);
        
        if (path.startsWith('/offer-letter/')) {
            setToken(path.split('/offer-letter/')[1]);
            setPage('offer_letter_sign');
        } else {
            const urlToken = params.get('token');
            if (urlToken) {
                 setToken(urlToken);
                 setPage('msa_sign');
            } else {
                 setPage('main');
            }
        }
    }, []);

    if (page === 'loading') {
        return <div className="flex justify-center items-center h-screen"><Spinner size="12" /></div>;
    }

    if (page === 'msa_sign') {
        return <MSAandWOSigningPage token={token} />;
    }
    
    if (page === 'offer_letter_sign') {
        // *** THIS IS THE FIX ***
        // We must pass the token we found to the page.
        return <OfferLetterSigningPage token={token} />; 
    }

    if (!isAuthenticated) {
        return <LoginPage />;
    }

    if (isFirstLogin) {
        return <ChangePasswordPage />;
    }

    return <MainApp />;
};

const App = () => (
    <AuthProvider>
        <AppContent />
    </AuthProvider>
);

export default App;