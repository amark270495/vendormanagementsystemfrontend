import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Spinner from './components/Spinner'; 
import MSAandWOSigningPage from './pages/MSAandWOSigningPage';
import MainApp from './MainApp';
import LoginPage from './pages/LoginPage';
import ChangePasswordPage from './pages/ChangePasswordPage';

/**
 * This is the root component of the application.
 * It checks the URL for an e-signing token to decide which view to show.
 */
const AppRouter = () => {
  const [route, setRoute] = useState({ page: 'loading', params: {} });

  useEffect(() => {
    // This effect runs once when the app first loads to check the URL
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');

    // --- CORRECTION ---
    // We now check ONLY for the presence of a token in the URL.
    // If a token exists, we immediately show the signing page.
    if (token) {
      setRoute({ page: 'sign', params: { token } });
    } else {
      // Otherwise, proceed to the main application flow (login/dashboard).
      setRoute({ page: 'main', params: {} });
    }
  }, []); // The empty dependency array ensures this effect runs only once

  // While checking the URL, show a loading indicator
  if (route.page === 'loading') {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-100">
        <Spinner size="12" />
      </div>
    );
  }

  // If the route is 'sign', render ONLY the signing page.
  if (route.page === 'sign') {
    return <MSAandWOSigningPage token={route.params.token} />;
  }
  
  // For any other URL, render the main, authenticated application.
  return (
    <AuthProvider>
      <AuthenticatedApp />
    </AuthProvider>
  );
};


/**
 * This component contains the logic for the authenticated part of the application.
 */
const AuthenticatedApp = () => {
    const { isAuthenticated, isFirstLogin } = useAuth();

    if (!isAuthenticated) {
        return <LoginPage />;
    }

    if (isFirstLogin) {
        return <ChangePasswordPage />;
    }

    return <MainApp />;
}


export default AppRouter;