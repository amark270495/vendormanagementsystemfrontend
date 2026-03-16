import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useParams } from 'react-router-dom'; // 🌟 Added Navigate and useParams
import MainApp from './MainApp';
import LoginPage from './pages/LoginPage';
import ChangePasswordPage from './pages/ChangePasswordPage';
import { AuthProvider } from './context/AuthContext';
import MSAandWOSigningPage from './pages/MSAandWOSigningPage';
import OfferLetterSigningPage from './pages/OfferLetterSigningPage';
import ProtectedRoute from './components/ProtectedRoute';

// 🌟 HELPER: Catches the email link format and redirects to the query format
const OfferLetterRedirect = () => {
    const { token } = useParams();
    // Redirects /offer-letter/123 to /offer-letter?token=123
    return <Navigate to={`/offer-letter?token=${token}`} replace />;
};

const AppRoutes = () => {
    return (
        <Routes>
            {/* === PUBLIC ROUTES === */}
            <Route path="/login" element={<LoginPage />} />
            
            {/* Document Signing Routes */}
            <Route path="/msa-sign/:token" element={<MSAandWOSigningPage />} />
            
            {/* 🌟 FIX: Handle BOTH URL structures for the offer letter */}
            {/* 1. Handles the Query Param format that the component likely expects */}
            <Route path="/offer-letter" element={<OfferLetterSigningPage />} />
            
            {/* 2. Catches the Path Param format from your emails and passes it to the redirector */}
            <Route path="/offer-letter/:token" element={<OfferLetterRedirect />} />

            {/* Change Password Route */}
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