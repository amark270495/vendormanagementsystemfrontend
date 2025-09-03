import React, { createContext, useReducer, useContext, useEffect, useRef } from 'react';

// Create the context with safe defaults so useAuth() never returns undefined
const AuthContext = createContext({
    isAuthenticated: false,
    user: null,
    isFirstLogin: false,
    permissions: {},
    login: () => {},
    logout: () => {},
    passwordChanged: () => {},
    updatePreferences: () => {},
    updatePermissions: () => {},
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
        case 'PREFERENCES_UPDATED':
            return {
                ...state,
                user: action.payload,
            };
        case 'PERMISSIONS_UPDATED':
            return {
                ...state,
                user: { ...state.user, permissions: action.payload },
                permissions: action.payload,
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

    const tabId = useRef(crypto.randomUUID());

    useEffect(() => {
        try {
            const savedUser = sessionStorage.getItem('vms_user');
            if (savedUser) {
                const userData = JSON.parse(savedUser);
                dispatch({ type: 'LOGIN', payload: { ...userData, permissions: userData.permissions || {} } });
                localStorage.setItem('vms_active_tab', tabId.current);
            }
        } catch (error) {
            console.error("Failed to parse user from session storage", error);
            sessionStorage.clear();
            localStorage.removeItem('vms_active_tab');
        }

        const handleStorageChange = (event) => {
            if ((event.key === 'vms_active_tab' && event.newValue !== tabId.current) || event.key === 'vms_logout_all') {
                logout(false);
            }
        };

        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);

    const login = (userData) => {
        const userToStore = { ...userData, permissions: userData.permissions || {} };
        sessionStorage.setItem('vms_user', JSON.stringify(userToStore));
        localStorage.setItem('vms_active_tab', tabId.current);
        dispatch({ type: 'LOGIN', payload: userToStore });
    };

    const logout = (broadcast = true) => {
        sessionStorage.removeItem('vms_user');
        if (broadcast) {
            localStorage.setItem('vms_logout_all', Date.now());
            localStorage.removeItem('vms_active_tab');
            localStorage.removeItem('vms_logout_all');
        }
        dispatch({ type: 'LOGOUT' });
    };

    const passwordChanged = () => {
        const updatedUser = { ...state.user, isFirstLogin: false };
        sessionStorage.setItem('vms_user', JSON.stringify(updatedUser));
        dispatch({ type: 'PASSWORD_CHANGED' });
    };

    const updatePreferences = (preferences) => {
        const updatedUser = { ...state.user, dashboardPreferences: preferences };
        sessionStorage.setItem('vms_user', JSON.stringify(updatedUser));
        dispatch({ type: 'PREFERENCES_UPDATED', payload: updatedUser });
    };

    const updatePermissions = (newPermissions) => {
        const updatedUser = { ...state.user, permissions: newPermissions };
        sessionStorage.setItem('vms_user', JSON.stringify(updatedUser));
        dispatch({ type: 'PERMISSIONS_UPDATED', payload: newPermissions });
    };

    return (
        <AuthContext.Provider value={{ ...state, login, logout, passwordChanged, updatePreferences, updatePermissions }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);