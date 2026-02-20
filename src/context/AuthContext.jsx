import React, { createContext, useReducer, useContext, useEffect, useRef } from 'react';

// Default permissions structure (ensure it includes ALL possible keys)
const defaultPermissions = {
    canViewCandidates: false, canEditUsers: false, canAddPosting: false,
    canViewReports: false, canEmailReports: false, canViewDashboards: false,
    canEditDashboard: false, canMessage: false, canManageTimesheets: false,
    canRequestTimesheetApproval: false, canManageMSAWO: false, canManageOfferLetters: false,
    canManageHolidays: false, canApproveLeave: false, canManageLeaveConfig: false,
    canRequestLeave: false, canSendMonthlyReport: false,
    canApproveAttendance: false, 
    canManageBenchSales: false, // <-- FOR BENCH SALES
    canManageAssets: false,     // <-- NEWLY ADDED FOR ASSET MANAGEMENT
    canAssignAssets: false      // <-- NEWLY ADDED FOR ASSET MANAGEMENT
};


// --- Define the default shape of the user object ---
const defaultUser = {
    userIdentifier: null,
    userName: null,
    userRole: null,
    backendOfficeRole: null,
    isFirstLogin: false,
    dashboardPreferences: { columnOrder: null, columnVisibility: null },
    permissions: { ...defaultPermissions },
    
    // --- Basic Info ---
    firstName: '',
    lastName: '',
    middleName: '',
    dateOfBirth: '',
    dateOfJoining: '',
    employeeCode: '',
    
    // --- New Fields ---
    personalMobileNumber: '',
    currentAddress: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    emergencyContactRelation: '',
    bloodGroup: '',
    employmentType: '',
    reportsTo: '',
    workLocation: '',
    linkedInProfile: ''
};


// Create the context with safe defaults
const AuthContext = createContext({
    isAuthenticated: false,
    user: defaultUser,
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
            
            // --- UPDATED: Merge payload with defaultUser to ensure all fields exist ---
            const mergedUser = { 
                ...defaultUser, 
                ...action.payload, 
                permissions: mergedPermissions 
            };
            
            return {
                ...state,
                isAuthenticated: true,
                user: mergedUser,
                isFirstLogin: action.payload.isFirstLogin,
            };
        case 'LOGOUT':
            return {
                ...state,
                isAuthenticated: false,
                user: null, 
                isFirstLogin: false,
            };
        case 'PASSWORD_CHANGED':
             if (!state.user) return state; 
            return {
                ...state,
                user: { ...state.user, isFirstLogin: false },
                isFirstLogin: false, 
            };
        case 'PREFERENCES_UPDATED':
             if (!state.user) return state; 
            return {
                ...state,
                user: { ...state.user, dashboardPreferences: action.payload.dashboardPreferences },
            };
        case 'PERMISSIONS_UPDATED':
             if (!state.user) return state; 
             const updatedPermissions = { ...defaultPermissions, ...(state.user.permissions || {}), ...action.payload };
            return {
                ...state,
                user: { ...state.user, permissions: updatedPermissions },
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
    });

    const tabId = useRef(crypto.randomUUID()); 

    // Load initial state from sessionStorage
    useEffect(() => {
        try {
            const savedUser = sessionStorage.getItem('vms_user');
            if (savedUser) {
                const userData = JSON.parse(savedUser);
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
                if (state.isAuthenticated) {
                     console.log("Logging out due to activity in another tab or broadcast.");
                     logout(false);
                }
            }
        };

        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, [state.isAuthenticated]);


    const login = (userData) => {
         const mergedPermissions = { ...defaultPermissions, ...(userData.permissions || {}) };
         const userToStore = { 
            ...defaultUser, 
            ...userData, 
            permissions: mergedPermissions 
        };
        sessionStorage.setItem('vms_user', JSON.stringify(userToStore));
        localStorage.setItem('vms_active_tab', tabId.current);
        dispatch({ type: 'LOGIN', payload: userToStore });
    };

    const logout = (broadcast = true) => {
        sessionStorage.removeItem('vms_user');
        if (broadcast) {
            localStorage.setItem('vms_logout_all', Date.now().toString()); 
            localStorage.removeItem('vms_active_tab');
            localStorage.removeItem('vms_logout_all');
        }
        dispatch({ type: 'LOGOUT' });
    };

    const passwordChanged = () => {
        if (!state.user) return;
        const updatedUser = { ...state.user, isFirstLogin: false };
        sessionStorage.setItem('vms_user', JSON.stringify(updatedUser));
        dispatch({ type: 'PASSWORD_CHANGED' });
    };

    const updatePreferences = (preferences) => {
        if (!state.user) return;
        const updatedUser = { ...state.user, dashboardPreferences: preferences };
        sessionStorage.setItem('vms_user', JSON.stringify(updatedUser));
        dispatch({ type: 'PREFERENCES_UPDATED', payload: { dashboardPreferences: preferences } });
    };

    const updatePermissions = (newPermissions) => {
         if (!state.user) return;
         const updatedPermissions = { ...defaultPermissions, ...(state.user.permissions || {}), ...newPermissions };
        const updatedUser = { ...state.user, permissions: updatedPermissions };
        sessionStorage.setItem('vms_user', JSON.stringify(updatedUser));
        dispatch({ type: 'PERMISSIONS_UPDATED', payload: updatedPermissions }); 
    };


    return (
        <AuthContext.Provider value={{ ...state, login, logout, passwordChanged, updatePreferences, updatePermissions }}>
            {children}
        </AuthContext.Provider>
    );
};

// Custom hook to use the auth context
export const useAuth = () => useContext(AuthContext);