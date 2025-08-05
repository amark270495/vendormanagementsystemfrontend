import React, { createContext, useReducer, useContext, useEffect, useRef } from 'react';

// Create the context to be shared across components
const AuthContext = createContext();

// Define the reducer function to manage state changes
const authReducer = (state, action) => {
    switch (action.type) {
        case 'LOGIN':
            return {
                ...state,
                isAuthenticated: true,
                user: action.payload,
                isFirstLogin: action.payload.isFirstLogin,
                // NEW: Store permissions directly from the payload
                permissions: action.payload.permissions || {}, 
            };
        case 'LOGOUT':
            return {
                ...state,
                isAuthenticated: false,
                user: null,
                isFirstLogin: false,
                permissions: {}, // Clear permissions on logout
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
        // NEW: Action to update permissions if they change (e.g., from admin panel)
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

// Create the AuthProvider component that will wrap our application
export const AuthProvider = ({ children }) => {
    const [state, dispatch] = useReducer(authReducer, {
        isAuthenticated: false,
        user: null,
        isFirstLogin: false,
        permissions: {}, // NEW: Initialize permissions state
    });

    // A unique ID for the current browser tab to handle multi-tab logout
    const tabId = useRef(crypto.randomUUID());

    // This effect runs once on component mount to check for a saved user in session storage
    useEffect(() => {
        try {
            const savedUser = sessionStorage.getItem('vms_user');
            if (savedUser) {
                const userData = JSON.parse(savedUser);
                // Ensure permissions are loaded from session storage
                dispatch({ type: 'LOGIN', payload: { ...userData, permissions: userData.permissions || {} } });
                localStorage.setItem('vms_active_tab', tabId.current);
            }
        } catch (error) {
            console.error("Failed to parse user from session storage", error);
            sessionStorage.clear();
            localStorage.removeItem('vms_active_tab');
        }

        // This function listens for storage changes to log the user out on all tabs
        const handleStorageChange = (event) => {
            if ((event.key === 'vms_active_tab' && event.newValue !== tabId.current) || event.key === 'vms_logout_all') {
                logout(false); // Logout this tab without broadcasting again
            }
        };

        window.addEventListener('storage', handleStorageChange);
        // Cleanup function to remove the event listener when the component unmounts
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);

    // Define the actions that can be performed on the context
    const login = (userData) => {
        // Ensure permissions are saved to session storage
        const userToStore = { ...userData, permissions: userData.permissions || {} };
        sessionStorage.setItem('vms_user', JSON.stringify(userToStore));
        localStorage.setItem('vms_active_tab', tabId.current);
        dispatch({ type: 'LOGIN', payload: userToStore });
    };

    const logout = (broadcast = true) => {
        sessionStorage.removeItem('vms_user');
        if (broadcast) {
            // Set a temporary item in local storage to notify other tabs
            localStorage.setItem('vms_logout_all', Date.now());
            localStorage.removeItem('vms_active_tab');
            // Clean up the temporary item
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

    // NEW: Function to update permissions in the context
    const updatePermissions = (newPermissions) => {
        const updatedUser = { ...state.user, permissions: newPermissions };
        sessionStorage.setItem('vms_user', JSON.stringify(updatedUser));
        dispatch({ type: 'PERMISSIONS_UPDATED', payload: newPermissions });
    };

    // Provide the state and action functions to all child components
    return (
        <AuthContext.Provider value={{ ...state, login, logout, passwordChanged, updatePreferences, updatePermissions }}>
            {children}
        </AuthContext.Provider>
    );
};

// Create a custom hook for easy access to the auth context from any component
export const useAuth = () => {
    return useContext(AuthContext);
};
