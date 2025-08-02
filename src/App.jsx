import React from 'react';
import { useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import ChangePasswordPage from './pages/ChangePasswordPage';
import MainApp from './MainApp';

/**
 * This is the root component of the application.
 * It determines which main view to render based on the user's authentication status.
 */
function App() {
  const { isAuthenticated, isFirstLogin } = useAuth();

  // If the user is not authenticated, show the login page.
  if (!isAuthenticated) {
    return <LoginPage />;
  }

  // If the user is authenticated but it's their first login, force a password change.
  if (isFirstLogin) {
    return <ChangePasswordPage />;
  }

  // If the user is authenticated and has set a password, show the main application.
  return <MainApp />;
}

export default App;