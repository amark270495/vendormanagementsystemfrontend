import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Spinner from './components/Spinner'; 
import MSAandWOSigningPage from './pages/MSAandWOSigningPage';
import MainApp from './MainApp';
import LoginPage from './pages/LoginPage';
import ChangePasswordPage from './pages/ChangePasswordPage';

/**
 * This is the root component of the application.
 * It first checks the URL to see if it's a special e-signing link.
 * If so, it shows the signing page.
 * Otherwise, it proceeds with the normal authenticated application flow.
 */
const AppRouter = () => {
  const [route, setRoute] = useState({ page: 'loading', params: {} });

  useEffect(() => {
    // This effect runs once when the app first loads to check the URL
    const path = window.location.pathname;
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');

    // Check if the URL is specifically for signing a document
    if (path === '/sign' && token) {
      // If it is, set the route to show the signing page directly
      setRoute({ page: 'sign', params: { token } });
    } else {
      // Otherwise, proceed to the main application flow
      setRoute({ page: 'main', params: {} });
    }
  }, []); // The empty dependency array [] ensures this effect runs only once

  // While checking the URL, show a loading indicator
  if (route.page === 'loading') {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-100">
        <Spinner size="12" />
      </div>
    );
  }

  // If the route is 'sign', render ONLY the signing page.
  // This page does not require the user to be logged in.
  if (route.page === 'sign') {
    return <MSAandWOSigningPage token={route.params.token} />;
  }
  
  // For any other URL, render the main, authenticated application.
  // The AuthProvider will manage the login state for this part of the app.
  return (
    <AuthProvider>
      <AuthenticatedApp />
    </AuthProvider>
  );
};


/**
 * This component contains the logic for the authenticated part of the application.
 * It's only rendered when the URL is not an e-signing link.
 */
const AuthenticatedApp = () => {
    const { isAuthenticated, isFirstLogin } = useAuth();

    // If the user is not authenticated, show the login page.
    if (!isAuthenticated) {
        return <LoginPage />;
    }

    // If the user is authenticated but it's their first login, force a password change.
    if (isFirstLogin) {
        return <ChangePasswordPage />;
    }

    // If the user is fully authenticated, show the main application dashboard and pages.
    return <MainApp />;
}


export default AppRouter;