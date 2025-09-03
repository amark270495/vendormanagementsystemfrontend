import React, { useState, useEffect, createContext, useReducer, useContext } from 'react';
import Spinner from './components/Spinner'; 
import MSAandWOSigningPage from './pages/MSAandWOSigningPage';
import MainApp from './MainApp';
import LoginPage from './pages/LoginPage';
import ChangePasswordPage from './pages/ChangePasswordPage';

// --- CONTEXT & AUTH PROVIDER ---
// Safe defaults so useAuth() never returns undefined
const AuthContext = createContext({
    isAuthenticated: false,
    user: null,
    isFirstLogin: false,
    permissions: {},
    isAuthLoading: true,
    login: () => {},
    logout: () => {},
    passwordChanged: () => {},
});

const authReducer = (state, action) => {
    switch (action.type) {
        case 'LOGIN':
            return {
                ...state,
                isAuthenticated: true,
                user: action.payload,
                isFirstLogin: action.payload.isFirstLogin,
                permissions: action.payload.permissions || {},
            };
        case 'LOGOUT':
            return {
                ...state,
                isAuthenticated: false,
                user: null,
                isFirstLogin: false,
                permissions: {},
            };
        case 'PASSWORD_CHANGED':
            return {
                ...state,
                user: { ...state.user, isFirstLogin: false },
                isFirstLogin: false,
            };
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
        <AuthContext.Provider
            value={{ ...state, isAuthLoading, login, logout, passwordChanged }}
        >
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

    if (isAuthLoading || page === 'loading') {
        return (
            <div className="flex justify-center items-center h-screen">
                <Spinner size="12" />
            </div>
        );
    }

    if (page === 'sign') {
        return <MSAandWOSigningPage token={token} />;
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
const App = () => {
    return (
        <AuthProvider>
            <AppContent />
        </AuthProvider>
    );
};

export default App;