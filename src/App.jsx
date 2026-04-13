import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useParams } from 'react-router-dom';
import MainApp from './MainApp';
import LoginPage from './pages/LoginPage';
import ChangePasswordPage from './pages/ChangePasswordPage';
import { AuthProvider } from './context/AuthContext';
import MSAandWOSigningPage from './pages/MSAandWOSigningPage';
import OfferLetterSigningPage from './pages/OfferLetterSigningPage';
import ProtectedRoute from './components/ProtectedRoute';

// HELPER: Catches the email link format and redirects to the query format
const OfferLetterRedirect = () => {
    const { token } = useParams();
    // Redirects /offer-letter/123 to /offer-letter?token=123
    return <Navigate to={`/offer-letter?token=${token}`} replace />;
};

// 🌟 NEW HELPER: For MSA paths if they ever come through as /msa-sign/123
const MsaRedirect = () => {
    const { token } = useParams();
    return <Navigate to={`/msa-sign?token=${token}`} replace />;
};

const AppRoutes = () => {
    return (
        <Routes>
            {/* === PUBLIC ROUTES === */}
            <Route path="/login" element={<LoginPage />} />
            
            {/* 🌟 FIX: Document Signing Routes for MSA */}
            {/* 1. Matches the Query Param format from your Outlook email link (/msa-sign?token=...) */}
            <Route path="/msa-sign" element={<MSAandWOSigningPage />} />
            {/* 2. Matches the Path Param format just in case (/msa-sign/123...) */}
            <Route path="/msa-sign/:token" element={<MsaRedirect />} />
            
            {/* Handle BOTH URL structures for the offer letter */}
            {/* 1. Handles the Query Param format */}
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