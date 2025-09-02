import React, { useState, useEffect, createContext, useReducer, useContext, useRef } from 'react';
import Spinner from './components/Spinner'; 
import MSAandWOSigningPage from './pages/MSAandWOSigningPage';
import MainApp from './MainApp';
import LoginPage from './pages/LoginPage';
import ChangePasswordPage from './pages/ChangePasswordPage';

// --- CONTEXT & AUTH PROVIDER ---
// This now includes the isAuthLoading state to solve the race condition.
const AuthContext = createContext();

const authReducer = (state, action) => {
    switch (action.type) {
        case 'LOGIN':
            return { ...state, isAuthenticated: true, user: action.payload, isFirstLogin: action.payload.isFirstLogin, permissions: action.payload.permissions || {} };
        case 'LOGOUT':
            return { ...state, isAuthenticated: false, user: null, isFirstLogin: false, permissions: {} };
        case 'PASSWORD_CHANGED':
            return { ...state, user: { ...state.user, isFirstLogin: false }, isFirstLogin: false };
        // Add other cases like PREFERENCES_UPDATED if needed
        default:
            return state;
    }
};

export const AuthProvider = ({ children }) => {
    const [state, dispatch] = useReducer(authReducer, {
        isAuthenticated: false,
        user: null,
        isFirstLogin: false,
        permissions: {},
    });

    // This loading state is the key to the fix.
    // It tracks whether we have finished checking sessionStorage for a logged-in user.
    const [isAuthLoading, setIsAuthLoading] = useState(true);

    useEffect(() => {
        try {
            const savedUser = sessionStorage.getItem('vms_user');
            if (savedUser) {
                const userData = JSON.parse(savedUser);
                dispatch({ type: 'LOGIN', payload: userData });
            }
        } catch (error) {
            console.error("Failed to parse user from session storage", error);
            sessionStorage.clear();
        } finally {
            // Once we've checked the session, we set loading to false.
            setIsAuthLoading(false);
        }
    }, []);

    const login = (userData) => {
        sessionStorage.setItem('vms_user', JSON.stringify(userData));
        dispatch({ type: 'LOGIN', payload: userData });
    };

    const logout = () => {
        sessionStorage.removeItem('vms_user');
        dispatch({ type: 'LOGOUT' });
    };
    
    const passwordChanged = () => {
        const updatedUser = { ...state.user, isFirstLogin: false };
        sessionStorage.setItem('vms_user', JSON.stringify(updatedUser));
        dispatch({ type: 'PASSWORD_CHANGED' });
    };

    return (
        <AuthContext.Provider value={{ ...state, isAuthLoading, login, logout, passwordChanged }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);


// --- APPLICATION ROUTING LOGIC ---
const AppContent = () => {
    const [page, setPage] = useState('loading');
    const [token, setToken] = useState(null);
    
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

    const { isAuthenticated, isFirstLogin, isAuthLoading } = useAuth();

    // The FIX: Wait for the AuthProvider to finish loading before rendering anything.
    if (isAuthLoading || page === 'loading') {
        return <div className="flex justify-center items-center h-screen"><Spinner size="12" /></div>;
    }

    // Now that we know the auth status, we can safely route.
    if (page === 'sign') {
        // The MSAandWOSigningPage itself will use the `useAuth` hook to see if a director is logged in.
        return <MSAandWOSigningPage token={token} />;
    }

    // Standard application flow for non-signing URLs.
    if (!isAuthenticated) {
        return <LoginPage />;
    }
    if (isFirstLogin) {
        return <ChangePasswordPage />;
    }
    return <MainApp />;
};


// --- ROOT APP COMPONENT ---
// The main App's only job is to wrap the application in the AuthProvider.
const App = () => {
    return (
        <AuthProvider>
            <AppContent />
        </AuthProvider>
    );
};

export default App;