import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Spinner from './components/Spinner';
import MainApp from './MainApp';
import LoginPage from './pages/LoginPage';
import ChangePasswordPage from './pages/ChangePasswordPage';
import { AuthProvider, useAuth } from './context/AuthContext';
import MSAandWOSigningPage from './pages/MSAandWOSigningPage';
import OfferLetterSigningPage from './pages/OfferLetterSigningPage';

// --- Protected Route Wrapper ---
// Ensures a user is logged in before letting them see the dashboard routes
const ProtectedRoute = ({ children }) => {
    const { isAuthenticated, isFirstLogin } = useAuth();
    const location = useLocation();

    if (!isAuthenticated) {
        // Redirect them to the /login page, but save the current location they were
        // trying to go to, so we can redirect them back there after they log in
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (isFirstLogin) {
        return <Navigate to="/change-password" replace />;
    }

    return children;
};

const AppRoutes = () => {
    return (
        <Routes>
            {/* === PUBLIC ROUTES === */}
            <Route path="/login" element={<LoginPage />} />
            
            {/* Document Signing Routes (Must be accessible without logging in) */}
            <Route path="/msa-sign" element={<MSAandWOSigningPage />} />
            <Route path="/offer-letter/:token" element={<OfferLetterSigningPage />} />

            {/* Change Password Route */}
            <Route path="/change-password" element={<ChangePasswordPage />} />

            {/* === PROTECTED ROUTES (Dashboard) === */}
            {/* The /* means that MainApp will handle all sub-routes 
               (e.g., /home, /profile, /admin) internally. 
            */}
            <Route path="/*" element={
                <ProtectedRoute>
                    <MainApp />
                </ProtectedRoute>
            } />
        </Routes>
    );
};

const App = () => (
    <AuthProvider>
        <Router>
            <AppRoutes />
        </Router>
    </AuthProvider>
);

export default App;