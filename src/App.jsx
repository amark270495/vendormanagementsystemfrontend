import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MainApp from './MainApp';
import LoginPage from './pages/LoginPage';
import ChangePasswordPage from './pages/ChangePasswordPage';
import { AuthProvider } from './context/AuthContext';
import MSAandWOSigningPage from './pages/MSAandWOSigningPage';
import OfferLetterSigningPage from './pages/OfferLetterSigningPage';
import ProtectedRoute from './components/ProtectedRoute'; // 🌟 Import the new standalone component

const AppRoutes = () => {
    return (
        <Routes>
            {/* === PUBLIC ROUTES === */}
            <Route path="/login" element={<LoginPage />} />
            
            {/* Document Signing Routes (Must be accessible without logging in) */}
            <Route path="/msa-sign" element={<MSAandWOSigningPage />} />
            <Route path="/offer-letter/:token" element={<OfferLetterSigningPage />} />

            {/* Change Password Route */}
            {/* Note: In MainApp, you might want to wrap this in a ProtectedRoute later if only logged-in users should see it */}
            <Route path="/change-password" element={<ChangePasswordPage />} />

            {/* === PROTECTED ROUTES (Dashboard) === */}
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