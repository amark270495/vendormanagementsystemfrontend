import React, { createContext, useReducer, useContext, useEffect, useRef } from 'react';

// Default permissions structure (ensure it includes ALL possible keys)
const defaultPermissions = {
    canViewCandidates: false, canEditUsers: false, canAddPosting: false,
    canViewReports: false, canEmailReports: false, canViewDashboards: false,
    canEditDashboard: false, canMessage: false, canManageTimesheets: false,
    canRequestTimesheetApproval: false, canManageMSAWO: false, canManageOfferLetters: false,
    canManageHolidays: false, canApproveLeave: false, canManageLeaveConfig: false,
    canRequestLeave: false, canSendMonthlyReport: false
};


// Create the context with safe defaults
const AuthContext = createContext({
    isAuthenticated: false,
    user: null, // User object will contain permissions
    isFirstLogin: false,
    login: () => {},
    logout: () => {},
    passwordChanged: () => {},
    updatePreferences: () => {},
    updatePermissions: () => {},
});

const authReducer = (state, action) => {
    switch (action.type) {
        case 'LOGIN':
            // Ensure payload.permissions has all keys, defaulting to false
            const mergedPermissions = { ...defaultPermissions, ...(action.payload.permissions || {}) };
            return {
                ...state,
                isAuthenticated: true,
                user: { ...action.payload, permissions: mergedPermissions }, // Store merged permissions in user
                isFirstLogin: action.payload.isFirstLogin,
                 // Remove separate permissions state
                 // permissions: mergedPermissions, // No longer needed here
            };
        case 'LOGOUT':
            return {
                ...state,
                isAuthenticated: false,
                user: null,
                isFirstLogin: false,
                 // permissions: {}, // Reset permissions state too
                 // No longer needed here
            };
        case 'PASSWORD_CHANGED':
             if (!state.user) return state; // Safety check
            return {
                ...state,
                user: { ...state.user, isFirstLogin: false },
                isFirstLogin: false, // Keep top-level for direct access if needed
            };
        case 'PREFERENCES_UPDATED':
             if (!state.user) return state; // Safety check
            return {
                ...state,
                // Only update preferences within the user object
                user: { ...state.user, dashboardPreferences: action.payload.dashboardPreferences },
            };
        case 'PERMISSIONS_UPDATED':
             if (!state.user) return state; // Safety check
             // Ensure payload has all keys, defaulting existing ones if somehow missing in payload
             const updatedPermissions = { ...defaultPermissions, ...(state.user.permissions || {}), ...action.payload };
            return {
                ...state,
                // Update permissions within the user object AND the top-level state
                user: { ...state.user, permissions: updatedPermissions },
                // --- Keep this line if usePermissions reads from top level ---
                // permissions: updatedPermissions, // Still update top-level if usePermissions relies on it
                // --- If usePermissions is updated to read from user.permissions, remove the line above ---
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
        // permissions: {}, // Remove initial top-level permissions state
    });

    const tabId = useRef(crypto.randomUUID()); // For multi-tab logout sync

    // Load initial state from sessionStorage
    useEffect(() => {
        try {
            const savedUser = sessionStorage.getItem('vms_user');
            if (savedUser) {
                const userData = JSON.parse(savedUser);
                // Dispatch LOGIN to ensure permissions structure is correct
                dispatch({ type: 'LOGIN', payload: userData });
                localStorage.setItem('vms_active_tab', tabId.current);
            }
        } catch (error) {
            console.error("Failed to parse user from session storage", error);
            sessionStorage.clear();
            localStorage.removeItem('vms_active_tab');
        }

        // Multi-tab logout listener
        const handleStorageChange = (event) => {
            if ((event.key === 'vms_active_tab' && event.newValue !== tabId.current) || event.key === 'vms_logout_all') {
                if (state.isAuthenticated) { // Only logout if currently authenticated
                     console.log("Logging out due to activity in another tab or broadcast.");
                     logout(false); // Logout this tab without broadcasting again
                }
            }
        };

        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
        // Added state.isAuthenticated to dependencies to avoid stale closures
    }, [state.isAuthenticated]); // Depend on isAuthenticated


    const login = (userData) => {
        // Ensure permissions object exists and merge with defaults upon login
         const mergedPermissions = { ...defaultPermissions, ...(userData.permissions || {}) };
         const userToStore = { ...userData, permissions: mergedPermissions };
        sessionStorage.setItem('vms_user', JSON.stringify(userToStore));
        localStorage.setItem('vms_active_tab', tabId.current);
        // Dispatch LOGIN, the reducer handles merging defaults again for safety
        dispatch({ type: 'LOGIN', payload: userToStore });
    };

    const logout = (broadcast = true) => {
        sessionStorage.removeItem('vms_user');
        if (broadcast) {
            localStorage.setItem('vms_logout_all', Date.now().toString()); // Use string value
            localStorage.removeItem('vms_active_tab');
            // Clear broadcast immediately after setting (other tabs just need the event)
            localStorage.removeItem('vms_logout_all');
        }
        dispatch({ type: 'LOGOUT' });
    };

    const passwordChanged = () => {
        if (!state.user) return; // Safety check
        const updatedUser = { ...state.user, isFirstLogin: false };
        sessionStorage.setItem('vms_user', JSON.stringify(updatedUser));
        dispatch({ type: 'PASSWORD_CHANGED' });
    };

    const updatePreferences = (preferences) => {
        if (!state.user) return; // Safety check
        // preferences should be the dashboardPreferences object
        const updatedUser = { ...state.user, dashboardPreferences: preferences };
        sessionStorage.setItem('vms_user', JSON.stringify(updatedUser));
        // Pass only the necessary part to the reducer
        dispatch({ type: 'PREFERENCES_UPDATED', payload: { dashboardPreferences: preferences } });
    };

    const updatePermissions = (newPermissions) => {
         if (!state.user) return; // Safety check
        // newPermissions should be the permissions object
         const updatedPermissions = { ...defaultPermissions, ...(state.user.permissions || {}), ...newPermissions };
        const updatedUser = { ...state.user, permissions: updatedPermissions };
        sessionStorage.setItem('vms_user', JSON.stringify(updatedUser));
        dispatch({ type: 'PERMISSIONS_UPDATED', payload: updatedPermissions }); // Pass the full, updated permissions object
    };


    // Provide the state and dispatcher functions to children
    // Ensure the value provided includes everything needed by consumers (like usePermissions)
    return (
        <AuthContext.Provider value={{ ...state, login, logout, passwordChanged, updatePreferences, updatePermissions }}>
            {children}
        </AuthContext.Provider>
    );
};

// Custom hook to use the auth context
export const useAuth = () => useContext(AuthContext);