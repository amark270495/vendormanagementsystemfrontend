import React, { createContext, useReducer, useContext, useEffect, useRef, useState } from 'react';

// --- Default permissions structure (Keeping all your keys) ---
const defaultPermissions = {
    canViewCandidates: false, canEditUsers: false, canAddPosting: false,
    canViewReports: false, canEmailReports: false, canViewDashboards: false,
    canEditDashboard: false, canMessage: false, canManageTimesheets: false,
    canRequestTimesheetApproval: false, canManageMSAWO: false, canManageOfferLetters: false,
    canManageHolidays: false, canApproveLeave: false, canManageLeaveConfig: false,
    canRequestLeave: false, canSendMonthlyReport: false,
    canApproveAttendance: false, 
    canManageBenchSales: false,
    canManageAssets: false,
    canAssignAssets: false
};

// --- RESTORED: All your custom basic info fields ---
const defaultUser = {
    userIdentifier: null,
    userName: null,
    userRole: null,
    backendOfficeRole: null,
    isFirstLogin: false,
    dashboardPreferences: { columnOrder: null, columnVisibility: null },
    permissions: { ...defaultPermissions },
    
    // --- Restored Basic Info ---
    firstName: '',
    lastName: '',
    middleName: '',
    dateOfBirth: '',
    dateOfJoining: '',
    employeeCode: '',
    
    // --- Restored Extended Info ---
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

// Create the context
const AuthContext = createContext({
    isAuthenticated: false,
    user: defaultUser,
    isFirstLogin: false,
    loading: true, // ✅ Added for refresh stability
    login: () => {},
    logout: () => {},
    passwordChanged: () => {},
    updatePreferences: () => {},
    updatePermissions: () => {},
});

const authReducer = (state, action) => {
    switch (action.type) {
        case 'LOGIN':
            const mergedPermissions = { ...defaultPermissions, ...(action.payload.permissions || {}) };
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
    const [loading, setLoading] = useState(true); // ✅ New loading state
    const [state, dispatch] = useReducer(authReducer, {
        isAuthenticated: false,
        user: null,
        isFirstLogin: false,
    });

    const tabId = useRef(crypto.randomUUID()); 

    // ✅ FIX: Load from localStorage (Survivable Refresh)
    useEffect(() => {
        const initAuth = () => {
            try {
                // Using localStorage instead of sessionStorage to survive Ctrl+R
                const savedUser = localStorage.getItem('vms_user');
                if (savedUser) {
                    const userData = JSON.parse(savedUser);
                    dispatch({ type: 'LOGIN', payload: userData });
                    localStorage.setItem('vms_active_tab', tabId.current);
                }
            } catch (error) {
                console.error("Auth hydration failed", error);
                localStorage.removeItem('vms_user');
            } finally {
                setLoading(false); // ✅ Stop loading once check is done
            }
        };

        initAuth();

        // Multi-tab logout listener
        const handleStorageChange = (event) => {
            if ((event.key === 'vms_active_tab' && event.newValue !== tabId.current) || event.key === 'vms_logout_broadcast') {
                if (state.isAuthenticated) {
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
        // ✅ Sync to localStorage
        localStorage.setItem('vms_user', JSON.stringify(userToStore));
        localStorage.setItem('vms_active_tab', tabId.current);
        dispatch({ type: 'LOGIN', payload: userToStore });
    };

    const logout = (broadcast = true) => {
        // ✅ Clear localStorage
        localStorage.removeItem('vms_user');
        if (broadcast) {
            localStorage.setItem('vms_logout_broadcast', Date.now().toString()); 
            localStorage.removeItem('vms_active_tab');
        }
        dispatch({ type: 'LOGOUT' });
    };

    const passwordChanged = () => {
        if (!state.user) return;
        const updatedUser = { ...state.user, isFirstLogin: false };
        localStorage.setItem('vms_user', JSON.stringify(updatedUser));
        dispatch({ type: 'PASSWORD_CHANGED' });
    };

    const updatePreferences = (preferences) => {
        if (!state.user) return;
        const updatedUser = { ...state.user, dashboardPreferences: preferences };
        localStorage.setItem('vms_user', JSON.stringify(updatedUser));
        dispatch({ type: 'PREFERENCES_UPDATED', payload: { dashboardPreferences: preferences } });
    };

    const updatePermissions = (newPermissions) => {
         if (!state.user) return;
         const updatedPermissions = { ...defaultPermissions, ...(state.user.permissions || {}), ...newPermissions };
        const updatedUser = { ...state.user, permissions: updatedPermissions };
        localStorage.setItem('vms_user', JSON.stringify(updatedUser));
        dispatch({ type: 'PERMISSIONS_UPDATED', payload: updatedPermissions }); 
    };

    return (
        <AuthContext.Provider value={{ ...state, loading, login, logout, passwordChanged, updatePreferences, updatePermissions }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);