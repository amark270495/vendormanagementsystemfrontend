// ===================================================================================
// VMS Dashboard - React Application - FULLY INTEGRATED
// ===================================================================================

// Global error handler for uncaught exceptions
window.onerror = function(message, source, lineno, colno, error) {
    console.error("Global uncaught error:", { message, source, lineno, colno, error });
    // Display a user-friendly message on the page
    const rootElement = document.getElementById('root');
    if (rootElement) {
        rootElement.innerHTML = '<div style="text-align: center; color: red; padding: 20px; font-family: \'Inter\', sans-serif;">An unexpected error occurred. Please refresh the page or contact support. Details might be in the browser console.</div>';
    }
    return true; // Prevent default error handling (e.g., browser's console message)
};

const { useState, useEffect, createContext, useContext, useReducer, useMemo, useCallback, useRef } = React;
const { createRoot } = ReactDOM;
const { Bar, Pie, Doughnut } = ReactChartjs2;

// --- Configuration & Utilities -----------------------------------------------------
const API_BASE_URL = '/api'; // Assumes proxy or same-domain deployment

// Updated DASHBOARD_CONFIGS to display only the specified dashboards
const DASHBOARD_CONFIGS = {
    'ecaltVMSDisplay': { title: 'Eclat VMS', companyName: 'Eclat Solutions LLC', postingFrom: 'All' },
    'taprootVMSDisplay': { title: 'Taproot VMS', companyName: 'Taproot Solutions INC', postingFrom: 'All' },
    'michiganDisplay': { title: 'Michigan VMS', companyName: 'Taproot Solutions INC', postingFrom: 'State Of Michigan' },
    'EclatTexasDisplay': { title: 'Eclat Teaxs VMS', companyName: 'Eclat Solutions LLC', postingFrom: 'State Of Texas' },
    'TaprootTexasDisplay': { title: 'Taproot Texas VMS', companyName: 'Taproot Solutions INC', postingFrom: 'State Of Texas' },
};

const EDITABLE_COLUMNS = ['Working By', '# Submitted', 'Remarks', '1st Candidate Name', '2nd Candidate Name', '3rd Candidate Name'];
const DATE_COLUMNS = ['Posting Date', 'Deadline'];
const NUMBER_COLUMNS = ['# Submitted', 'Max Submissions'];

const formatDate = (isoString) => {
    if (!isoString || isoString === 'Need To Update') return isoString;
    try {
        const date = new Date(isoString);
        if (isNaN(date.getTime())) return isoString;
        return date.toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' });
    } catch (e) {
        return isoString;
    }
};

const getDeadlineClass = (dateString) => {
    if (!dateString || dateString === 'Need To Update') return '';
    const deadline = new Date(dateString);
    const today = new Date();
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(today.getDate() + 7);
    deadline.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    sevenDaysFromNow.setHours(0,0,0,0);
    if (deadline < today) return 'text-red-600 font-bold';
    if (deadline <= sevenDaysFromNow) return 'text-orange-500 font-semibold';
    return 'text-green-600';
};

// --- Fully Integrated API Helper ------------------------------------------------
const api = {
    call: async (endpoint, method = 'GET', body = null, params = {}) => {
        const url = new URL(`${API_BASE_URL}/${endpoint}`, window.location.origin);
        // For GET requests, append params to URL
        if (method === 'GET' && Object.keys(params).length > 0) {
             Object.keys(params).forEach(key => {
                if(params[key] !== null && params[key] !== undefined) {
                    url.searchParams.append(key, params[key])
                }
            });
        }
        
        const options = { 
            method, 
            headers: { 'Content-Type': 'application/json' } 
        };
        if (body) options.body = JSON.stringify(body);

        try {
            const response = await fetch(url, options);
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: 'An unknown error occurred.' }));
                throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error(`API call to ${endpoint} failed:`, error);
            throw error;
        }
    },
    // Authentication
    authenticateUser: (username, password) => api.call('authenticateUser', 'POST', { username, password }),
    changePassword: (targetUsername, newPassword, authenticatedUsername) => api.call('changePassword', 'POST', { targetUsername, newPassword, authenticatedUsername }),
    requestPasswordReset: (username) => api.call('requestPasswordReset', 'POST', { username }),
    // User Management
    getUsers: (authenticatedUsername) => api.call('getUsers', 'GET', null, { authenticatedUsername }),
    addUser: (userData, authenticatedUsername) => api.call('addUser', 'POST', { ...userData, authenticatedUsername }),
    updateUser: (originalUsername, userData, authenticatedUsername) => api.call('updateUser', 'POST', { originalUsername, userData, authenticatedUsername }),
    deleteUser: (usernameToDelete, authenticatedUsername) => api.call('deleteUser', 'POST', { usernameToDelete, authenticatedUsername }),
    // Dashboard & Job Data
    getDashboardData: (sheetKey, authenticatedUsername) => api.call('getDashboardData', 'GET', null, { sheetKey, authenticatedUsername }),
    updateJobPosting: (updates, authenticatedUsername) => api.call('updateJobPosting', 'POST', { updates, authenticatedUsername }),
    updateJobStatus: (postingIds, newStatus, authenticatedUsername) => api.call('updateJobStatus', 'POST', { postingIds, newStatus, authenticatedUsername }),
    archiveOrDeleteJob: (postingIds, actionType, authenticatedUsername) => api.call('archiveOrDeleteJob', 'POST', { postingIds, actionType, authenticatedUsername }),
    saveUserDashboardPreferences: (authenticatedUsername, preferences) => api.call('saveUserDashboardPreferences', 'POST', { authenticatedUsername, preferences }),
    processJobPosting: (formData, authenticatedUsername) => api.call('processJobPosting', 'POST', { formData, authenticatedUsername }),
    // Home Page Data
    getHomePageData: (authenticatedUsername) => api.call('getHomePageData', 'GET', null, { authenticatedUsername }), // Added authenticatedUsername param
    // Reports
    getReportData: (sheetKey, startDate, endDate, authenticatedUsername) => api.call('getReportData', 'GET', null, { sheetKey, startDate, endDate, authenticatedUsername }),
    generateAndSendJobReport: (sheetKey, statusFilter, toEmails, ccEmails, authenticatedUsername) => api.call('generateAndSendJobReport', 'POST', { sheetKey, statusFilter, toEmails, ccEmails, authenticatedUsername }),
    // Notifications
    getNotifications: (authenticatedUsername) => api.call('getNotifications', 'GET', null, { authenticatedUsername }),
    markNotificationsAsRead: (notificationIds, authenticatedUsername) => api.call('markNotificationsAsRead', 'POST', { notificationIds, authenticatedUsername }),
    // Messaging
    getMessages: (user1, user2, authenticatedUsername) => api.call('getMessages', 'GET', null, { user1, user2, authenticatedUsername }),
    saveMessage: (sender, recipient, messageContent, authenticatedUsername) => api.call('saveMessage', 'POST', { sender, recipient, messageContent, authenticatedUsername }),
};

// --- Authentication Context (No Changes) -----------------------------------------------
const AuthContext = createContext();
const authReducer = (state, action) => {
    switch (action.type) {
        case 'LOGIN': return { ...state, isAuthenticated: true, user: action.payload, isFirstLogin: action.payload.isFirstLogin };
        case 'LOGOUT': return { ...state, isAuthenticated: false, user: null, isFirstLogin: false };
        case 'PASSWORD_CHANGED': return { ...state, isFirstLogin: false };
        case 'PREFERENCES_UPDATED': 
            const newUser = { ...state.user, dashboardPreferences: action.payload };
            localStorage.setItem('vms_user', JSON.stringify(newUser));
            return { ...state, user: newUser };
        default: return state;
    }
};
const AuthProvider = ({ children }) => {
    const [state, dispatch] = useReducer(authReducer, { isAuthenticated: false, user: null, isFirstLogin: false });
    useEffect(() => {
        try {
            const savedUser = localStorage.getItem('vms_user');
            if (savedUser) dispatch({ type: 'LOGIN', payload: JSON.parse(savedUser) });
        } catch (error) { localStorage.removeItem('vms_user'); }
    }, []);
    const login = (userData) => { localStorage.setItem('vms_user', JSON.stringify(userData)); dispatch({ type: 'LOGIN', payload: userData }); };
    const logout = () => { localStorage.removeItem('vms_user'); dispatch({ type: 'LOGOUT' }); };
    const passwordChanged = () => {
        const updatedUser = { ...state.user, isFirstLogin: false };
        localStorage.setItem('vms_user', JSON.stringify(updatedUser));
        dispatch({ type: 'PASSWORD_CHANGED' });
    };
    const updatePreferences = (preferences) => {
        dispatch({ type: 'PREFERENCES_UPDATED', payload: preferences });
    };
    return <AuthContext.Provider value={{ ...state, login, logout, passwordChanged, updatePreferences }}>{children}</AuthContext.Provider>;
};
const useAuth = () => useContext(AuthContext);

// --- Reusable UI Components (No Changes) --------------------------------------------------------
const Modal = ({ isOpen, onClose, title, children, size = 'md' }) => {
    if (!isOpen) return null;
    const sizeClasses = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-lg', xl: 'max-w-xl', '2xl': 'max-w-2xl', '4xl': 'max-w-4xl' };
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4" onClick={onClose} aria-modal="true" role="dialog">
            <div className={`bg-white rounded-lg shadow-xl w-full ${sizeClasses[size]} max-h-[90vh] flex flex-col`} onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center p-4 border-b">
                    <h3 className="text-xl font-semibold text-gray-800">{title}</h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-800 p-1 rounded-full hover:bg-gray-100" aria-label="Close modal">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                </div>
                <div className="p-6 overflow-y-auto">{children}</div>
            </div>
        </div>
    );
};
const Spinner = ({ size = '8' }) => <div className={`animate-spin rounded-full h-${size} w-${size} border-b-2 border-indigo-600`}></div>;
const Dropdown = ({ trigger, children, width = '48' }) => {
    const [isOpen, setIsOpen] = useState(false);
    const node = useRef();
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (node.current && !node.current.contains(e.target)) setIsOpen(false);
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);
    return (
        <div className="relative" ref={node}>
            <div onClick={() => setIsOpen(!isOpen)}>{trigger}</div>
            {isOpen && (
                <div className={`absolute right-0 mt-2 w-${width} bg-white rounded-md shadow-lg z-20 py-1`} onClick={(e) => {
                     if (e.target.closest('button.close-on-click')) {
                        setIsOpen(false);
                    }
                }}>
                    {children}
                </div>
            )}
        </div>
    );
};

// --- Authentication & User Pages (No Changes) ---
const ForgotPasswordModal = ({ isOpen, onClose }) => {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(''); setMessage(''); setLoading(true);
        try {
            const data = await api.requestPasswordReset(email);
            setMessage(data.message);
            setTimeout(() => { onClose(); setMessage(''); setEmail(''); }, 3000);
        } catch (err) {
            setMessage("If your account exists, a password reset email has been sent."); // Generic message for security
            setError(''); // Clear any previous error
        } finally { setLoading(false); }
    };
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Request Password Reset" size="md">
            {message && <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">{message}</div>}
            {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}
            <p className="text-gray-600 mb-4">Enter your username (email address) and we will send you a temporary password.</p>
            <form onSubmit={handleSubmit}>
                <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="reset-email">Username (Email)</label>
                    <input className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700" id="reset-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <div className="flex items-center justify-end">
                    <button className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded flex items-center justify-center" type="submit" disabled={loading}>
                        {loading ? <Spinner size="5" /> : 'Send Reset Email'}
                    </button>
                </div>
            </form>
        </Modal>
    );
};
const LoginPage = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const [isForgotPasswordOpen, setForgotPasswordOpen] = useState(false);
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(''); setLoading(true);
        try {
            const data = await api.authenticateUser(username, password);
            if (data.success) login(data);
            else setError(data.message);
        } catch (err) { setError(err.message); } 
        finally { setLoading(false); }
    };
    return (
        <>
            <div className="min-h-screen bg-slate-100 flex flex-col justify-center items-center">
                <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-lg">
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold text-gray-800">VMS Dashboard</h1>
                        <p className="text-gray-500 mt-2">Welcome back! Please log in.</p>
                    </div>
                    {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">{error}</div>}
                    <form onSubmit={handleSubmit}>
                        <div className="mb-4">
                            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="username">Username (Email)</label>
                            <input className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700" id="username" type="email" value={username} onChange={(e) => setUsername(e.target.value)} required />
                        </div>
                        <div className="mb-6">
                            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">Password</label>
                            <input className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700" id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                        </div>
                        <button className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded w-full flex justify-center items-center" type="submit" disabled={loading}>{loading ? <Spinner size="5" /> : 'Sign In'}</button>
                        <div className="text-center mt-4">
                            <a className="inline-block align-baseline font-bold text-sm text-indigo-600 hover:text-indigo-800" href="#" onClick={(e) => {e.preventDefault(); setForgotPasswordOpen(true);}}>Forgot Password?</a>
                        </div>
                    </form>
                </div>
            </div>
            <ForgotPasswordModal isOpen={isForgotPasswordOpen} onClose={() => setForgotPasswordOpen(false)} />
        </>
    );
};
const ChangePasswordPage = () => {
    const { user, passwordChanged, logout } = useAuth();
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) { setError("Passwords do not match."); return; }
        if (newPassword.length < 6) { setError("Password must be at least 6 characters long."); return; }
        setError(''); setLoading(true);
        try {
            const data = await api.changePassword(user.userIdentifier, newPassword, user.userIdentifier);
            if (data.success) {
                setSuccess("Password changed successfully! You can now access the dashboard.");
                setTimeout(() => passwordChanged(), 2000);
            } else { setError(data.message); }
        } catch (err) { setError(err.message); } 
        finally { setLoading(false); }
    };
    return (
        <div className="min-h-screen bg-slate-100 flex flex-col justify-center items-center">
            <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-lg">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-800">Change Your Password</h1>
                    <p className="text-gray-500 mt-2">This is your first login. Please set a new password.</p>
                </div>
                {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}
                {success && <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">{success}</div>}
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="new-password">New Password</label>
                        <input className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700" id="new-password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
                    </div>
                    <div className="mb-6">
                        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="confirm-password">Confirm New Password</label>
                        <input className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700" id="confirm-password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
                    </div>
                    <button className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded w-full flex justify-center items-center" type="submit" disabled={loading}>
                        {loading ? <Spinner size="5" /> : 'Set New Password'}
                    </button>
                </form>
                <button onClick={logout} className="mt-4 text-sm text-gray-600 hover:text-gray-800 w-full">Logout</button>
            </div>
        </div>
    );
};

// --- User Management Modals ---
const UserFormModal = ({ isOpen, onClose, onSave, userToEdit }) => {
    // Define available user roles and backend office roles
    const userRoles = ['Admin', 'Standard User', 'Data Entry', 'Data Viewer', 'Data Entry & Viewer', ]; // 'Standard User' replaces generic 'User'
    const backendOfficeRoles = [
        'Operations Admin', 
        'Operations Manager', 
        'Development Manager', 
        'Development Executive', 
        'Recruitment Manager', 
        'Recruitment Team'
    ];

    const [formData, setFormData] = useState({ 
        displayName: '', 
        username: '', 
        password: '', 
        userRole: 'Standard User', // Default to Standard User
        backendOfficeRole: 'Recruitment Team' // Default to a basic role
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (userToEdit) {
            setFormData({ 
                displayName: userToEdit.displayName || '', 
                username: userToEdit.username || '', 
                password: '', // Password is not pre-filled for security
                userRole: userToEdit.userRole || 'Standard User', 
                backendOfficeRole: userToEdit.backendOfficeRole || 'Recruitment Team' 
            });
        } else {
            setFormData({ 
                displayName: '', 
                username: '', 
                password: '', 
                userRole: 'Standard User', 
                backendOfficeRole: 'Recruitment Team' 
            });
        }
        setError('');
    }, [userToEdit, isOpen]);

    const handleChange = (e) => {
        const { id, value } = e.target;
        setFormData(prev => ({ ...prev, [id]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (!formData.displayName || !formData.username || (!userToEdit && !formData.password)) { 
            setError("Please fill in all required fields (Display Name, Username, and Password for new users)."); 
            return; 
        }
        if (!userToEdit && formData.password.length < 6) { 
            setError("Password must be at least 6 characters long."); 
            return; 
        }
        setLoading(true);
        try {
            await onSave(formData);
            onClose();
        } catch (err) { 
            setError(`Failed to save user: ${err.message}`); 
        } finally { 
            setLoading(false); 
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={userToEdit ? "Edit User" : "Add New User"} size="lg">
            {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="displayName" className="block text-sm font-medium text-gray-700">Display Name</label>
                    <input type="text" id="displayName" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" value={formData.displayName} onChange={handleChange} required />
                </div>
                <div>
                    <label htmlFor="username" className="block text-sm font-medium text-gray-700">Username (Email)</label>
                    <input type="email" id="username" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" value={formData.username} onChange={handleChange} required disabled={!!userToEdit} />
                </div>
                {!userToEdit && (
                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
                        <input type="password" id="password" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" value={formData.password} onChange={handleChange} required={!userToEdit} />
                        <p className="mt-1 text-sm text-gray-500">For new users, password must be at least 6 characters.</p>
                    </div>
                )}
                <div>
                    <label htmlFor="userRole" className="block text-sm font-medium text-gray-700">User Role</label>
                    <select id="userRole" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" value={formData.userRole} onChange={handleChange} required>
                        {userRoles.map(role => <option key={role} value={role}>{role}</option>)}
                    </select>
                </div>
                <div>
                    <label htmlFor="backendOfficeRole" className="block text-sm font-medium text-gray-700">Backend Office Role</label>
                    <select id="backendOfficeRole" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" value={formData.backendOfficeRole} onChange={handleChange} required>
                        {backendOfficeRoles.map(role => <option key={role} value={role}>{role}</option>)}
                    </select>
                </div>
                <div className="flex justify-end space-x-2">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Cancel</button>
                    <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 flex items-center justify-center" disabled={loading}>
                        {loading ? <Spinner size="5" /> : 'Save User'}
                    </button>
                </div>
            </form>
        </Modal>
    );
};
const DeleteUserModal = ({ isOpen, onClose, onConfirm, userToDelete }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const handleDelete = async () => {
        setLoading(true); setError('');
        try {
            await onConfirm();
            onClose();
        } catch (err) { setError(`Failed to delete user: ${err.message}`); } 
        finally { setLoading(false); }
    };
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Confirm Delete" size="sm">
            {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}
            <p className="text-gray-700 mb-4">Are you sure you want to delete user "<strong>{userToDelete?.displayName}</strong>" ({userToDelete?.username})? This action cannot be undone.</p>
            <div className="flex justify-end space-x-2">
                <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Cancel</button>
                <button type="button" onClick={handleDelete} className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center justify-center" disabled={loading}>
                    {loading ? <Spinner size="5" /> : 'Delete'}
                </button>
            </div>
        </Modal>
    );
};
const AdminPage = () => {
    const { user } = useAuth();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isUserModalOpen, setUserModalOpen] = useState(false);
    const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
    const [userToEdit, setUserToEdit] = useState(null);
    const [userToDelete, setUserToDelete] = useState(null);
    const fetchUsers = useCallback(async () => {
        setLoading(true);
        try {
            const data = await api.getUsers(user.userIdentifier);
            if (data.success) setUsers(data.users);
            else setError(data.message);
        } catch (err) { setError(err.message); } 
        finally { setLoading(false); }
    }, [user.userIdentifier]);
    useEffect(() => { fetchUsers(); }, [fetchUsers]);
    const handleAddClick = () => { setUserToEdit(null); setUserModalOpen(true); };
    const handleEditClick = (user) => { setUserToEdit(user); setUserModalOpen(true); };
    const handleDeleteClick = (user) => { setUserToDelete(user); setDeleteModalOpen(true); };
    const handleSaveUser = async (formData) => {
        if (userToEdit) await api.updateUser(userToEdit.username, formData, user.userIdentifier);
        else await api.addUser(formData, user.userIdentifier);
        fetchUsers();
    };
    const handleConfirmDelete = async () => {
        await api.deleteUser(userToDelete.username, user.userIdentifier);
        fetchUsers();
    };
    return (
        <>
            <div className="space-y-6">
                <h1 className="text-3xl font-bold text-gray-800">Admin - User Management</h1>
                <div className="bg-white p-6 rounded-lg shadow">
                    <div className="flex justify-end mb-4">
                        <button onClick={handleAddClick} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 mr-2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><line x1="19" y1="8" x2="19" y2="14"></line><line x1="22" y1="11" x2="16" y2="11"></line></svg>
                            Add User
                        </button>
                    </div>
                    {loading && <div className="flex justify-center items-center h-64"><Spinner /></div>}
                    {error && <div className="text-red-500 bg-red-100 p-4 rounded-lg">Error: {error}</div>}
                    {!loading && !error && (
                        <div className="overflow-x-auto">
                            {users.length > 0 ? (
                                <table className="w-full text-sm text-left text-gray-500">
                                    <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                                        <tr>
                                            <th scope="col" className="px-6 py-3">Display Name</th>
                                            <th scope="col" className="px-6 py-3">Username</th>
                                            <th scope="col" className="px-6 py-3">Role</th>
                                            <th scope="col" className="px-6 py-3">Backend Role</th>
                                            <th scope="col" className="px-6 py-3">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {users.map((u) => (
                                            <tr key={u.username} className="bg-white border-b hover:bg-gray-50">
                                                <td className="px-6 py-4 font-medium text-gray-900">{u.displayName}</td>
                                                <td className="px-6 py-4">{u.username}</td>
                                                <td className="px-6 py-4">{u.userRole}</td>
                                                <td className="px-6 py-4">{u.backendOfficeRole}</td>
                                                <td className="px-6 py-4 flex space-x-2">
                                                    <button onClick={() => handleEditClick(u)} className="text-indigo-600 hover:text-indigo-900 p-1 rounded-full hover:bg-gray-100" aria-label={`Edit user ${u.displayName}`}><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg></button>
                                                    <button onClick={() => handleDeleteClick(u)} className="text-red-600 hover:text-red-900 p-1 rounded-full hover:bg-gray-100" aria-label={`Delete user ${u.displayName}`}><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg></button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                <p className="text-center text-gray-500 p-4">No users found.</p>
                            )}
                        </div>
                    )}
                </div>
            </div>
            <UserFormModal isOpen={isUserModalOpen} onClose={() => setUserModalOpen(false)} onSave={handleSaveUser} userToEdit={userToEdit} />
            <DeleteUserModal isOpen={isDeleteModalOpen} onClose={() => setDeleteModalOpen(false)} onConfirm={handleConfirmDelete} userToDelete={userToDelete} />
        </>
    );
};

// --- NEW: Home Page ---
const HomePage = () => {
    const { user } = useAuth(); // Get user from AuthContext
    const [data, setData] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                // Pass authenticatedUsername to getHomePageData
                const result = await api.getHomePageData(user.userIdentifier);
                if (result.success) setData(result.data);
                else setError(result.message);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [user.userIdentifier]); // Depend on user.userIdentifier

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-800">Home - Open Jobs Summary</h1>
            {loading && <div className="flex justify-center items-center h-64"><Spinner /></div>}
            {error && <div className="text-red-500 bg-red-100 p-4 rounded-lg">Error: {error}</div>}
            {!loading && !error && (
                Object.keys(data).length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {Object.entries(data).map(([assignee, jobs]) => (
                            <div key={assignee} className="bg-white p-6 rounded-lg shadow-md border">
                                <h2 className="text-xl font-semibold text-indigo-700 mb-4 border-b pb-2">{assignee}</h2>
                                <div className="space-y-3 max-h-80 overflow-y-auto">
                                    {jobs.map(job => (
                                        <div key={job.postingId} className="p-3 bg-slate-50 rounded-md">
                                            <p className="font-bold text-gray-800">{job.jobTitle}</p>
                                            <p className="text-sm text-gray-600">{job.clientName}</p>
                                            <p className={`text-sm font-medium ${getDeadlineClass(job.deadline)}`}>Deadline: {formatDate(job.deadline)}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-center text-gray-500 p-4">No open job postings found.</p>
                )
            )}
        </div>
    );
};

// --- NEW: Job Posting Form Page ---
const JobPostingFormPage = ({ onFormSubmit }) => {
    const { user } = useAuth();
    const [formData, setFormData] = useState({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Predefined options for 'Posting From'
    const postingFromOptions = [
        'State Of Texas', 'State Of Michigan', 'State of North Carolina', 
        'State Of New Jersey', 'State Of Georgia', 'State Of Iowa', 
        'State Of Connecticut', 'State Of Virginia', 'State Of Indiana'
    ];

    const formFields = [
        { name: 'Posting ID', type: 'text', required: true },
        { name: 'Posting Title', type: 'text', required: true },
        { name: 'Posting Date', type: 'date', required: true },
        { name: 'Last Submission Date', type: 'date', required: true },
        { name: 'Max Submissions', type: 'number', required: true },
        { name: 'Max C2C Rate', type: 'text', required: true },
        { name: 'Client Name', type: 'text', required: true },
        { name: 'Company Name', type: 'select', required: true, options: ['Eclat Solutions LLC', 'Taproot Solutions INC'] },
        { name: 'Posting From', type: 'select', required: true, options: postingFromOptions }, // Changed to select with predefined options
        { name: 'Work Location', type: 'text', required: true }, // NEW: Work Location field
        { name: 'Work Position Type', type: 'text', required: true },
        { name: 'Required Skill Set', type: 'textarea', required: true },
        { name: 'Any Required Certificates', type: 'textarea' },
    ];

    const handleChange = (e) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(''); setSuccess(''); setLoading(true);

        // Check for Data Entry or Admin role for submitting new postings
        const canAddPosting = user.userRole.includes('Admin') || 
                             user.backendOfficeRole.includes('Data Entry') ||
                             user.backendOfficeRole.includes('Data Entry & Viewer');

        if (!canAddPosting) {
            setError("You do not have permission to add new job postings.");
            setLoading(false);
            return;
        }

        try {
            const result = await api.processJobPosting(formData, user.userIdentifier);
            if (result.success) {
                setSuccess(result.message);
                setFormData({}); // Clear form
                if (onFormSubmit) onFormSubmit();
            } else {
                setError(result.message);
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-800">Add New Job Posting</h1>
            <div className="bg-white p-8 rounded-lg shadow-lg">
                {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}
                {success && <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">{success}</div>}
                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {formFields.map(field => (
                        <div key={field.name} className={field.type === 'textarea' ? 'md:col-span-2' : ''}>
                            <label className="block text-sm font-medium text-gray-700">{field.name} {field.required && '*'}</label>
                            {field.type === 'textarea' ? (
                                <textarea name={field.name} value={formData[field.name] || ''} onChange={handleChange} required={field.required} rows="4" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"></textarea>
                            ) : field.type === 'select' ? (
                                <select name={field.name} value={formData[field.name] || ''} onChange={handleChange} required={field.required} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2">
                                    <option value="">Select an option</option>
                                    {field.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                </select>
                            ) : (
                                <input type={field.type} name={field.name} value={formData[field.name] || ''} onChange={handleChange} required={field.required} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
                            )}
                        </div>
                    ))}
                    <div className="md:col-span-2 flex justify-end">
                        <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-6 rounded-lg flex items-center justify-center" disabled={loading}>
                            {loading ? <Spinner size="5" /> : 'Submit Job'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// --- NEW/ENHANCED: Reports Page ---
const ReportsPage = () => {
    const { user } = useAuth();
    const [reportData, setReportData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [filters, setFilters] = useState({
        sheetKey: 'taprootVMSDisplay',
        startDate: '',
        endDate: ''
    });
    const [isEmailModalOpen, setEmailModalOpen] = useState(false);

    // Check for Reports access
    const canViewReports = user?.userRole?.includes('Admin') || 
                           user?.backendOfficeRole?.includes('Recruitment Manager') ||
                           user?.backendOfficeRole?.includes('Data Viewer') || // Added Data Viewer
                           user?.backendOfficeRole?.includes('Data Entry & Viewer'); // Added Data Entry & Viewer

    // Check for Email Reports access
    const canEmailReports = user?.userRole?.includes('Admin') ||
                            user?.backendOfficeRole?.includes('Data Entry') ||
                            user?.backendOfficeRole?.includes('Data Entry & Viewer') ||
                            user?.backendOfficeRole?.includes('Recruitment Manager');

    // Call generateReport when the component mounts or when dependencies change
    useEffect(() => {
        if (!canViewReports) {
            setError("You do not have permission to view reports.");
            setLoading(false);
            return;
        }
        // Only generate if not already loaded or loading, and user is authorized
        if (!reportData && !loading && user?.userIdentifier) { 
            generateReport();
        }
    }, [canViewReports, reportData, loading, user?.userIdentifier]); // Depend on user.userIdentifier

    const handleFilterChange = (e) => {
        setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const generateReport = async () => {
        setLoading(true); setError(''); setReportData(null);
        if (!canViewReports) {
            setError("You do not have permission to generate reports.");
            setLoading(false);
            return;
        }
        // Safeguard: Ensure user.userIdentifier is available before making the call
        if (!user?.userIdentifier) {
            setError("User identifier is missing. Please log in again.");
            setLoading(false);
            console.error("Attempted to generate report without user.userIdentifier."); // Log for debugging
            return;
        }

        console.log("Attempting to fetch report data with user.userIdentifier:", user.userIdentifier); // Added logging
        try {
            const result = await api.getReportData(filters.sheetKey, filters.startDate, filters.endDate, user.userIdentifier);
            if (result.success) {
                setReportData(result); 
            } else {
                setError(result.message);
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };
    
    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false, // Allow charts to not maintain aspect ratio
        plugins: { legend: { position: 'top' }, title: { display: true, text: 'Chart' } }
    };

    const chartColors = ['#4f46e5', '#f97316', '#10b981', '#ef4444', '#3b82f6', '#eab308', '#8b5cf6'];

    const getChartData = (labels, data, label) => ({
        labels,
        datasets: [{
            label,
            data,
            backgroundColor: chartColors.slice(0, labels.length),
            borderColor: '#ffffff',
            borderWidth: 1
        }]
    });
    
    return (
        <>
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-800">Reports</h1>
            <div className="bg-white p-4 rounded-lg shadow-sm border flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-4">
                    <select name="sheetKey" value={filters.sheetKey} onChange={handleFilterChange} className="shadow-sm border-gray-300 rounded-md" disabled={!canViewReports}>
                        {Object.entries(DASHBOARD_CONFIGS).map(([key, config]) => (
                            <option key={key} value={key}>{config.title}</option>
                        ))}
                    </select>
                    <input type="date" name="startDate" value={filters.startDate} onChange={handleFilterChange} className="shadow-sm border-gray-300 rounded-md" disabled={!canViewReports}/>
                    <input type="date" name="endDate" value={filters.endDate} onChange={handleFilterChange} className="shadow-sm border-gray-300 rounded-md" disabled={!canViewReports}/>
                </div>
                <div className="flex items-center space-x-2">
                    <button onClick={generateReport} className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700" disabled={loading || !canViewReports}>
                        {loading ? <Spinner size="5" /> : 'Generate Report'}
                    </button>
                     <button onClick={() => setEmailModalOpen(true)} className="px-4 py-2 bg-emerald-500 text-white rounded-md hover:bg-emerald-600" disabled={!reportData || !canEmailReports}>
                        Email Report
                    </button>
                </div>
            </div>
            {loading && <div className="flex justify-center items-center h-64"><Spinner /></div>}
            {error && <div className="text-red-500 bg-red-100 p-4 rounded-lg">Error: {error}</div>}
            {reportData && canViewReports ? (
                <div className="space-y-8">
                    {/* Summary Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 text-center">
                        <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-200 transform hover:scale-105 transition-transform duration-200 ease-in-out">
                            <p className="text-3xl font-extrabold text-gray-800">{reportData.totalJobs}</p>
                            <p className="text-sm text-gray-500">Total Jobs</p>
                        </div>
                        <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-200 transform hover:scale-105 transition-transform duration-200 ease-in-out">
                            <p className="text-3xl font-extrabold text-green-600">{reportData.openJobs}</p>
                            <p className="text-sm text-gray-500">Open</p>
                        </div>
                        <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-200 transform hover:scale-105 transition-transform duration-200 ease-in-out">
                            <p className="text-3xl font-extrabold text-red-600">{reportData.closedJobs}</p>
                            <p className="text-sm text-gray-500">Closed</p>
                        </div>
                        <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-200 transform hover:scale-105 transition-transform duration-200 ease-in-out">
                            <p className="text-3xl font-extrabold text-blue-600">{reportData.totalResumesSubmitted}</p>
                            <p className="text-sm text-gray-500">Submitted</p>
                        </div>
                        <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-200 transform hover:scale-105 transition-transform duration-200 ease-in-out">
                            <p className="text-3xl font-extrabold text-gray-800">{reportData.totalMaxSubmissions}</p>
                            <p className="text-sm text-gray-500">Max Allowed</p>
                        </div>
                    </div>
                    {/* Charts */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200 flex flex-col items-center" style={{ height: '400px' }}>
                            <h3 className="font-semibold text-lg text-gray-800 mb-4">Jobs by Client</h3>
                            <div className="relative w-full h-full">
                                <Bar options={{...chartOptions, title: {display: false}}} data={getChartData(Object.keys(reportData.clientJobCounts), Object.values(reportData.clientJobCounts), '# of Jobs')} />
                            </div>
                        </div>
                        <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200 flex flex-col items-center" style={{ height: '400px' }}>
                            <h3 className="font-semibold text-lg text-gray-800 mb-4">Jobs by Position Type</h3>
                            <div className="relative w-full h-full">
                                <Pie options={{...chartOptions, title: {display: false}}} data={getChartData(Object.keys(reportData.positionTypeCounts), Object.values(reportData.positionTypeCounts), '# of Jobs')} />
                            </div>
                        </div>
                        <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200 lg:col-span-2 flex flex-col items-center" style={{ height: '400px' }}>
                            <h3 className="font-semibold text-lg text-gray-800 mb-4">Jobs by Assignee</h3>
                            <div className="relative w-full h-full">
                                <Doughnut options={{...chartOptions, title: {display: false}}} data={getChartData(Object.keys(reportData.workingByCounts), Object.values(reportData.workingByCounts), '# of Jobs')} />
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                !loading && !error && <p className="text-center text-gray-500 p-4">Select filters and click "Generate Report" to view data.</p>
            )}
        </div>
        <EmailReportModal 
            isOpen={isEmailModalOpen}
            onClose={() => setEmailModalOpen(false)}
            sheetKey={filters.sheetKey}
        />
        </>
    );
};

const EmailReportModal = ({ isOpen, onClose, sheetKey }) => {
    const { user } = useAuth();
    const [toEmails, setToEmails] = useState('');
    const [ccEmails, setCcEmails] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(''); setSuccess(''); setLoading(true);
        const toEmailArray = toEmails.split(',').map(e => e.trim()).filter(e => e);
        const ccEmailArray = ccEmails.split(',').map(e => e.trim()).filter(e => e);

        if(toEmailArray.length === 0) {
            setError("Please provide at least one recipient email.");
            setLoading(false);
            return;
        }

        try {
            const result = await api.generateAndSendJobReport(sheetKey, statusFilter, toEmailArray, ccEmailArray, user.userIdentifier);
            if(result.success) {
                setSuccess(result.message);
                setTimeout(() => {
                    onClose();
                    setSuccess('');
                    setToEmails('');
                    setCcEmails('');
                }, 2000);
            } else {
                setError(result.message);
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Email Job Report" size="lg">
            {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}
            {success && <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">{success}</div>}
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">To (comma-separated)</label>
                    <input type="text" value={toEmails} onChange={e => setToEmails(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" required />
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700">CC (comma-separated)</label>
                    <input type="text" value={ccEmails} onChange={e => setCcEmails(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Job Status to Include</label>
                    <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2">
                        <option value="all">All</option>
                        <option value="open">Open</option>
                        <option value="closed">Closed</option>
                    </select>
                </div>
                <div className="flex justify-end space-x-2">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Cancel</button>
                    <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 flex items-center justify-center" disabled={loading}>
                        {loading ? <Spinner size="5" /> : 'Send Email'}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

// --- Header Menu Component for Sorting and Filtering (No Changes)---
const HeaderMenu = ({ header, sortConfig, onSort, filterConfig, onFilterChange }) => {
    const [filterType, setFilterType] = useState(filterConfig?.type || 'contains');
    const [value1, setValue1] = useState(filterConfig?.value1 || '');
    const [value2, setValue2] = useState(filterConfig?.value2 || '');
    const isDate = DATE_COLUMNS.includes(header);
    const isNumber = NUMBER_COLUMNS.includes(header);
    const handleApply = () => onFilterChange(header, { type: filterType, value1, value2 });
    const handleClear = () => { setValue1(''); setValue2(''); onFilterChange(header, null); };
    const getFilterOptions = () => {
        const commonOptions = [{ value: 'contains', label: 'Contains' }, { value: 'equals', label: 'Equals' }, { value: 'not_contains', label: 'Does not contain' }];
        const numericDateOptions = [{ value: 'above', label: 'Above' }, { value: 'below', label: 'Below' }, { value: 'between', label: 'Between' }];
        if (isDate || isNumber) return [...commonOptions, ...numericDateOptions];
        return commonOptions;
    };
    return (
        <div className="p-2 space-y-2">
            <div>
                <button onClick={() => onSort('ascending')} className="w-full text-left px-2 py-1 text-sm rounded hover:bg-slate-100">Sort Ascending</button>
                <button onClick={() => onSort('descending')} className="w-full text-left px-2 py-1 text-sm rounded hover:bg-slate-100">Sort Descending</button>
            </div>
            <hr/>
            <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-500 px-2">FILTER</label>
                <select value={filterType} onChange={e => setFilterType(e.target.value)} className="w-full p-1 border rounded text-sm">
                    {getFilterOptions().map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
                <input type={isDate ? 'date' : isNumber ? 'number' : 'text'} value={value1} onChange={e => setValue1(e.target.value)} className="w-full p-1 border rounded text-sm" placeholder={filterType === 'between' ? 'From...' : 'Value...'}/>
                {filterType === 'between' && (<input type={isDate ? 'date' : isNumber ? 'number' : 'text'} value={value2} onChange={e => setValue2(e.target.value)} className="w-full p-1 border rounded text-sm" placeholder="To..."/>)}
                <div className="flex justify-end space-x-2 pt-1">
                    <button onClick={handleClear} className="px-2 py-1 text-xs bg-slate-200 rounded hover:bg-slate-300 close-on-click">Clear</button>
                    <button onClick={handleApply} className="px-2 py-1 text-xs bg-indigo-600 text-white rounded hover:bg-indigo-700 close-on-click">Apply</button>
                </div>
            </div>
        </div>
    );
};

// --- Dashboard Page and Components (Minor changes for API calls) -------------------------------------------------
const DashboardPage = ({ sheetKey }) => {
    const { user, updatePreferences } = useAuth();
    const [rawData, setRawData] = useState({ header: [], rows: [] });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });
    const [generalFilter, setGeneralFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [unsavedChanges, setUnsavedChanges] = useState({});
    const [modalState, setModalState] = useState({ type: null, job: null });
    const [isColumnModalOpen, setColumnModalOpen] = useState(false);
    const [columnFilters, setColumnFilters] = useState({});
    
    // Determine if the user can edit the dashboard
    const canEditDashboard = user?.userRole?.includes('Admin') ||
                             user?.backendOfficeRole?.includes('Data Entry') || // Added Data Entry
                             user?.backendOfficeRole?.includes('Data Entry & Viewer');

    const userPrefs = useMemo(() => {
        const safeParse = (jsonString, defaultValue = []) => {
            if (typeof jsonString === 'string') { try { const parsed = JSON.parse(jsonString); return Array.isArray(parsed) ? parsed : defaultValue; } catch (e) { return defaultValue; } }
            return Array.isArray(jsonString) ? jsonString : defaultValue;
        };
        const prefs = user?.dashboardPreferences;
        return { order: safeParse(prefs?.columnOrder), visibility: safeParse(prefs?.columnVisibility) };
    }, [user]);
    const loadData = useCallback(async () => {
        setLoading(true); setError(''); setUnsavedChanges({});
        try {
            const result = await api.getDashboardData(sheetKey, user.userIdentifier);
            if (result.success) setRawData({ header: result.header, rows: result.rows });
            else setError(result.message);
        } catch (err) { setError(err.message); } 
        finally { setLoading(false); }
    }, [sheetKey, user.userIdentifier]);
    useEffect(() => { loadData(); }, [loadData]);
    const transformedData = useMemo(() => {
        let { header, rows } = rawData;
        if (!header || header.length === 0) return { header: [], rows: [] };
        const headerRenames = { 'Last Submission Date': 'Deadline', 'No. of Resumes Submitted': '# Submitted' };
        const originalHeaderMap = header.reduce((acc, h, i) => ({ ...acc, [h]: i }), {});
        let transformedHeader = header.map(h => headerRenames[h] || h);

        const clientIndex = originalHeaderMap['Client Name'];
        const postingFromIndex = originalHeaderMap['Posting From'];
        const workLocationIndex = originalHeaderMap['Work Location']; // NEW: Get Work Location Index

        const clientInfoIndex = transformedHeader.indexOf('Client Name');

        // Merge Client Name, Posting From, and Work Location into "Client Info"
        if (clientIndex !== undefined && postingFromIndex !== undefined && workLocationIndex !== undefined && clientInfoIndex !== -1) {
            transformedHeader[clientInfoIndex] = 'Client Info';
            transformedHeader = transformedHeader.filter(h => h !== 'Posting From' && h !== 'Work Location'); // Remove original columns
        }
        
        transformedHeader = transformedHeader.filter(h => h !== 'Company Name');

        const transformedRows = rows.map(row => {
            const newRow = [];
            transformedHeader.forEach(newHeaderName => {
                if (newHeaderName === 'Client Info') {
                    const client = row[clientIndex] || '';
                    const postingFrom = row[postingFromIndex] || '';
                    const workLocation = row[workLocationIndex] || ''; // NEW: Get Work Location
                    let clientInfo = client;
                    if (postingFrom && postingFrom !== 'All' && postingFrom !== 'Need To Update') {
                        clientInfo += ` / ${postingFrom}`;
                    }
                    if (workLocation && workLocation !== 'Need To Update') {
                        clientInfo += ` (${workLocation})`;
                    }
                    newRow.push(clientInfo);
                } else {
                    const originalHeaderName = Object.keys(headerRenames).find(key => headerRenames[key] === newHeaderName) || newHeaderName;
                    const originalIndex = originalHeaderMap[originalHeaderName];
                    newRow.push(row[originalIndex]);
                }
            });
            return newRow;
        });
        return { header: transformedHeader, rows: transformedRows };
    }, [rawData]);
    const { displayHeader, displayData } = useMemo(() => {
        let { header, rows } = transformedData;
        const defaultOrder = ['Posting ID', 'Posting Title', 'Posting Date', 'Max Submissions', 'Max C2C Rate', 'Required Skill Set', 'Any Required Certificates', 'Work Position Type', 'Working By', 'Remarks', '1st Candidate Name', '2nd Candidate Name', '3rd Candidate Name', 'Status', 'Deadline', 'Client Info', '# Submitted'];
        if (userPrefs.order.length > 0) {
            const orderedHeader = userPrefs.order.filter(h => header.includes(h));
            const remainingHeader = header.filter(h => !userPrefs.order.includes(h));
            const finalHeaderOrder = [...orderedHeader, ...remainingHeader];
            const reorderIndices = finalHeaderOrder.map(h => header.indexOf(h));
            rows = rows.map(row => reorderIndices.map(i => row[i]));
            header = finalHeaderOrder;
        } else {
            const defaultOrderedHeader = defaultOrder.filter(h => header.includes(h));
            const remainingFromBackend = header.filter(h => !defaultOrder.includes(h));
            const finalHeaderOrder = [...defaultOrderedHeader, ...remainingFromBackend];
            const reorderIndices = finalHeaderOrder.map(h => header.indexOf(h));
            rows = rows.map(row => reorderIndices.map(i => row[i]));
            header = finalHeaderOrder;
        }
        if (userPrefs.visibility.length > 0) {
            const visibleIndices = [];
            const visibleHeader = header.filter((h, i) => {
                if (!userPrefs.visibility.includes(h)) { visibleIndices.push(i); return true; }
                return false;
            });
            rows = rows.map(row => visibleIndices.map(i => row[i]));
            header = visibleHeader;
        }
        return { displayHeader: header, displayData: rows };
    }, [transformedData, userPrefs]);
    const handleSort = (key, direction) => setSortConfig({ key, direction });
    const handleCellEdit = (rowIndex, cellIndex, value) => {
        if (!canEditDashboard) { // Prevent editing if not authorized
            setError("You do not have permission to edit dashboard data.");
            return;
        }
        const postingId = filteredAndSortedData[rowIndex][displayHeader.indexOf('Posting ID')];
        const headerName = displayHeader[cellIndex];
        setUnsavedChanges(prev => ({ ...prev, [postingId]: { ...prev[postingId], [headerName]: value } }));
    };
    const handleSaveChanges = async () => {
        if (!canEditDashboard) { // Prevent saving if not authorized
            setError("You do not have permission to save dashboard changes.");
            return;
        }
        const headerToBackendKeyMap = { 'Working By': 'workingBy', '# Submitted': 'noOfResumesSubmitted', 'Remarks': 'remarks', '1st Candidate Name': 'candidateName1', '2nd Candidate Name': 'candidateName2', '3rd Candidate Name': 'candidateName3' };
        const updates = Object.entries(unsavedChanges).map(([postingId, changes]) => {
            const backendChanges = {};
            Object.entries(changes).forEach(([headerName, value]) => {
                const backendKey = headerToBackendKeyMap[headerName];
                if (backendKey) { 
                    if (backendKey === 'noOfResumesSubmitted') backendChanges[backendKey] = parseInt(value, 10) || 0;
                    else backendChanges[backendKey] = value;
                }
            });
            return { rowKey: postingId, changes: backendChanges };
        });
        if (updates.length === 0) {
            setError("No changes to save.");
            return;
        }
        setLoading(true);
        try {
            await api.updateJobPosting(updates, user.userIdentifier);
            setUnsavedChanges({});
            loadData(); 
        } catch (err) { setError(`Failed to save: ${err.message}`); } 
        finally { setLoading(false); }
    };
    const handleAction = async (actionType, job) => {
        // Permissions for these actions: Admin, Data Entry, Data Entry & Viewer
        const isAuthorizedForActions = user?.userRole?.includes('Admin') ||
                                       user?.backendOfficeRole?.includes('Data Entry') ||
                                       user?.backendOfficeRole?.includes('Data Entry & Viewer');

        if (!isAuthorizedForActions) { 
            setError("You do not have permission to perform this action on job postings.");
            setModalState({ type: null, job: null });
            return;
        }
        setLoading(true);
        const postingId = job['Posting ID'];
        try {
            if (actionType === 'close') await api.updateJobStatus([postingId], 'Closed', user.userIdentifier);
            else await api.archiveOrDeleteJob([postingId], actionType, user.userIdentifier);
            loadData();
        } catch (err) { setError(`Action '${actionType}' failed: ${err.message}`); } 
        finally { setLoading(false); setModalState({ type: null, job: null }); }
    };
    const handleColumnFilterChange = (header, config) => {
        setColumnFilters(prev => {
            const newFilters = { ...prev };
            if (config) newFilters[header] = config;
            else delete newFilters[header];
            return newFilters;
        });
    };
    const filteredAndSortedData = useMemo(() => {
        let processData = [...displayData];
        if (statusFilter) {
            const statusIndex = displayHeader.indexOf('Status');
            if (statusIndex > -1) processData = processData.filter(row => String(row[statusIndex]).toLowerCase() === statusFilter.toLowerCase());
        }
        if (generalFilter) {
            processData = processData.filter(row => row.some(cell => String(cell).toLowerCase().includes(generalFilter.toLowerCase())));
        }
        Object.entries(columnFilters).forEach(([header, config]) => {
            if (!config || !config.value1) return;
            const headerIndex = displayHeader.indexOf(header);
            if (headerIndex === -1) return;
            const isDate = DATE_COLUMNS.includes(header);
            const isNumber = NUMBER_COLUMNS.includes(header);
            processData = processData.filter(row => {
                const cellValueRaw = row[headerIndex];
                if (cellValueRaw === null || cellValueRaw === undefined) return false;
                if (isDate) {
                    const cellDate = new Date(cellValueRaw);
                    if (isNaN(cellDate.getTime())) return false;
                    const filterDate1 = new Date(config.value1);
                    switch (config.type) {
                        case 'equals': return cellDate.getTime() === filterDate1.getTime();
                        case 'above': return cellDate > filterDate1;
                        case 'below': return cellDate < filterDate1;
                        case 'between': const filterDate2 = new Date(config.value2); return cellDate >= filterDate1 && cellDate <= filterDate2;
                        default: return true;
                    }
                } else if (isNumber) {
                    const cellNum = parseFloat(cellValueRaw);
                    const filterNum1 = parseFloat(config.value1);
                    if (isNaN(cellNum) || isNaN(filterNum1)) return false;
                    switch (config.type) {
                        case 'equals': return cellNum === filterNum1;
                        case 'above': return cellNum > filterNum1;
                        case 'below': return cellNum < filterNum1;
                        case 'between': const filterNum2 = parseFloat(config.value2); return cellNum >= filterNum1 && cellNum <= filterNum2;
                        default: return true;
                    }
                }
                const cellValue = String(cellValueRaw).toLowerCase();
                const filterValue1 = String(config.value1).toLowerCase();
                switch (config.type) {
                    case 'contains': return cellValue.includes(filterValue1);
                    case 'equals': return cellValue === filterValue1;
                    case 'not_contains': return !cellValue.includes(filterValue1);
                    default: return true;
                }
            });
        });
        if (sortConfig.key !== null) {
            const sortIndex = displayHeader.indexOf(sortConfig.key);
            processData.sort((a, b) => {
                const valA = a[sortIndex];
                const valB = b[sortIndex];
                if (valA < valB) return sortConfig.direction === 'ascending' ? -1 : 1;
                if (valA > valB) return sortConfig.direction === 'ascending' ? 1 : -1;
                return 0;
            });
        }
        return processData;
    }, [displayData, sortConfig, generalFilter, statusFilter, displayHeader, columnFilters]);
    const downloadCsv = () => {
        const csvRows = [displayHeader.join(','), ...filteredAndSortedData.map(row => row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))];
        const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.setAttribute('hidden', ''); a.setAttribute('href', url); a.setAttribute('download', `${sheetKey}_report.csv`);
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
    };
    const downloadPdf = () => {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF('landscape');
        doc.autoTable({ head: [displayHeader], body: filteredAndSortedData });
        doc.save(`${sheetKey}_report.pdf`);
    };
    const jobToObject = (row) => displayHeader.reduce((obj, h, i) => ({...obj, [h]: row[i]}), {});
    const handleSaveColumnSettings = async (newPrefs) => {
        setLoading(true);
        try {
            await api.saveUserDashboardPreferences(user.userIdentifier, { columnOrder: newPrefs.order, columnVisibility: newPrefs.visibility });
            // Update the user preferences in the auth context
            updatePreferences({ columnOrder: JSON.stringify(newPrefs.order), columnVisibility: JSON.stringify(newPrefs.visibility) });
        } catch(err) { setError(`Failed to save column settings: ${err.message}`); } 
        finally { setLoading(false); setColumnModalOpen(false); }
    };
    return (
        <div className="space-y-4">
            <div className="bg-white p-4 rounded-lg shadow-sm border">
                <h2 className="text-xl font-bold text-gray-800">{DASHBOARD_CONFIGS[sheetKey]?.title || 'Dashboard'}</h2>
            </div>
            {/* Re-adding filter, search, save changes, and options */}
            <div className="bg-white p-4 rounded-lg shadow-sm border flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-4">
                    <input
                        type="text"
                        placeholder="Search all columns..."
                        value={generalFilter}
                        onChange={(e) => setGeneralFilter(e.target.value)}
                        className="shadow-sm border-gray-300 rounded-md px-3 py-2"
                    />
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="shadow-sm border-gray-300 rounded-md px-3 py-2"
                    >
                        <option value="">All Statuses</option>
                        <option value="Open">Open</option>
                        <option value="Closed">Closed</option>
                    </select>
                </div>
                <div className="flex items-center space-x-2">
                    {Object.keys(unsavedChanges).length > 0 && (
                        <button
                            onClick={handleSaveChanges}
                            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center justify-center"
                            disabled={loading}
                        >
                            {loading ? <Spinner size="5" /> : 'Save Changes'}
                        </button>
                    )}
                    <Dropdown trigger={
                        <button className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 flex items-center">
                            Options
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-2"><polyline points="6 9 12 15 18 9"></polyline></svg>
                        </button>
                    }>
                        <a href="#" onClick={(e) => {e.preventDefault(); setColumnModalOpen(true);}} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Column Settings</a>
                        <a href="#" onClick={(e) => {e.preventDefault(); downloadPdf();}} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Download PDF</a>
                        <a href="#" onClick={(e) => {e.preventDefault(); downloadCsv();}} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Download CSV</a>
                    </Dropdown>
                </div>
            </div>
            {loading && <div className="flex justify-center items-center h-64"><Spinner /></div>}
            {error && <div className="text-red-500 bg-red-100 p-4 rounded-lg">Error: {error}</div>}
            {!loading && !error && (
                filteredAndSortedData.length > 0 ? (
                    <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-y-auto relative" style={{ maxHeight: '70vh' }}>
                        <table className="w-full text-sm text-left text-gray-500 table-layout">
                            <thead className="text-xs text-gray-700 uppercase bg-slate-200 sticky top-0 z-10">
                                <tr>
                                    {displayHeader.map(h => {
                                        const isSkillColumn = h === 'Required Skill Set'; const isTitleColumn = h === 'Posting Title';
                                        let style = { minWidth: '140px' };
                                        if (isSkillColumn) style = { width: '300px' }; else if (isTitleColumn) style = { width: '200px' };
                                        return (
                                            <th key={h} scope="col" className="p-0" style={style}>
                                                <Dropdown width="64" trigger={<div className="header-menu-trigger font-bold"><span>{h} {sortConfig.key === h ? (sortConfig.direction === 'ascending' ? '▲' : '▼') : ''}</span></div>}>
                                                    <HeaderMenu header={h} sortConfig={sortConfig} onSort={(dir) => handleSort(h, dir)} filterConfig={columnFilters[h]} onFilterChange={handleColumnFilterChange}/>
                                                </Dropdown>
                                            </th>
                                        );
                                    })}
                                    <th scope="col" className="px-4 py-3" style={{width: '80px'}}>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredAndSortedData.map((row, rowIndex) => (
                                    <tr key={row[0] || rowIndex} className="bg-white border-b hover:bg-gray-50">
                                        {row.map((cell, cellIndex) => {
                                            const headerName = displayHeader[cellIndex]; 
                                            // Only allow editing if canEditDashboard is true AND the column is editable
                                            const isEditable = canEditDashboard && EDITABLE_COLUMNS.includes(headerName); 
                                            const isDate = DATE_COLUMNS.includes(headerName);
                                            const postingId = row[displayHeader.indexOf('Posting ID')]; 
                                            const isModified = unsavedChanges[postingId] && unsavedChanges[postingId][headerName] !== undefined;
                                            const deadlineClass = headerName === 'Deadline' ? getDeadlineClass(cell) : '';
                                            return (
                                                <td key={cellIndex} className={`px-4 py-3 text-center align-middle ${isModified ? 'modified-cell' : ''} ${deadlineClass}`} contentEditable={isEditable} suppressContentEditableWarning={true}
                                                    onFocus={e => { if (!isEditable) return; if (e.target.innerText === 'Need To Update') e.target.innerText = ''; }}
                                                    onBlur={e => { if (!isEditable) return; let currentValue = e.target.innerText.trim(); if (currentValue === '') { currentValue = 'Need To Update'; e.target.innerText = 'Need To Update'; } handleCellEdit(rowIndex, cellIndex, currentValue); }}>
                                                    {isDate ? formatDate(cell) : cell}
                                                </td>
                                            );
                                        })}
                                        {/* Action menu is only available if canEditDashboard is true */}
                                        <td className="px-4 py-3">
                                            {canEditDashboard ? (
                                                <ActionMenu job={row} onAction={(type, job) => setModalState({type, job: jobToObject(job)})} />
                                            ) : (
                                                <button className="text-gray-400 p-1 rounded-full cursor-not-allowed" aria-label="No actions available"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><circle cx="12" cy="12" r="1"></circle><circle cx="12" cy="5" r="1"></circle><circle cx="12" cy="19" r="1"></circle></svg></button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    !loading && !error && <p className="text-center text-gray-500 p-4">No job postings found matching your filters.</p>
                )
            )}
            <ConfirmationModal isOpen={['close', 'archive', 'delete'].includes(modalState.type)} onClose={() => setModalState({type: null, job: null})} onConfirm={() => handleAction(modalState.type, modalState.job)} title={`Confirm ${modalState.type}`} message={`Are you sure you want to ${modalState.type} the job "${modalState.job?.['Posting Title']}"?`} confirmText={modalState.type}/>
            <ViewDetailsModal isOpen={modalState.type === 'details'} onClose={() => setModalState({type: null, job: null})} job={modalState.job}/>
            <ColumnSettingsModal isOpen={isColumnModalOpen} onClose={() => setColumnModalOpen(false)} allHeaders={transformedData.header} userPrefs={userPrefs} onSave={handleSaveColumnSettings}/>
        </div>
    );
};
const ColumnSettingsModal = ({ isOpen, onClose, allHeaders, userPrefs, onSave }) => {
    const [order, setOrder] = useState([]); const [visibility, setVisibility] = useState({}); const dragItem = useRef(); const dragOverItem = useRef();
    useEffect(() => {
        if (!isOpen) return;
        const initialOrder = userPrefs.order.length > 0 ? userPrefs.order.filter(h => allHeaders.includes(h)) : allHeaders;
        const remainingHeaders = allHeaders.filter(h => !initialOrder.includes(h));
        setOrder([...initialOrder, ...remainingHeaders]);
        const initialVisibility = {}; allHeaders.forEach(h => { initialVisibility[h] = !userPrefs.visibility.includes(h); }); setVisibility(initialVisibility);
    }, [isOpen, allHeaders, userPrefs]);
    const handleDragStart = (e, position) => { dragItem.current = position; e.target.classList.add('dragging'); };
    const handleDragEnter = (e, position) => { dragOverItem.current = position; };
    const handleDrop = (e) => {
        const newOrder = [...order]; const dragItemContent = newOrder[dragItem.current];
        newOrder.splice(dragItem.current, 1); newOrder.splice(dragOverItem.current, 0, dragItemContent);
        dragItem.current = null; dragOverItem.current = null; setOrder(newOrder);
        e.target.closest('.column-list-item').classList.remove('dragging');
    };
    const handleVisibilityChange = (header) => setVisibility(prev => ({...prev, [header]: !prev[header]}));
    const handleSave = () => { const hiddenColumns = Object.entries(visibility).filter(([_, isVisible]) => !isVisible).map(([header]) => header); onSave({ order, visibility: hiddenColumns }); };
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Column Settings" size="lg">
            <p className="text-gray-600 mb-4">Drag and drop to reorder. Check/uncheck to show/hide.</p>
            <div className="space-y-2">
                {order.map((header, index) => (
                    <div key={header} className="flex items-center justify-between p-2 bg-gray-50 rounded-md border cursor-grab column-list-item" draggable onDragStart={(e) => handleDragStart(e, index)} onDragEnter={(e) => handleDragEnter(e, index)} onDragEnd={(e) => e.target.classList.remove('dragging')} onDragOver={(e) => e.preventDefault()} onDrop={handleDrop}>
                        <span>{header}</span>
                        <input type="checkbox" checked={visibility[header] || false} onChange={() => handleVisibilityChange(header)} className="h-5 w-5 rounded"/>
                    </div>
                ))}
            </div>
            <div className="flex justify-end mt-6 space-x-2">
                <button onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Cancel</button>
                <button onClick={handleSave} className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">Save Settings</button>
            </div>
        </Modal>
    );
};
const ActionMenu = ({ job, onAction }) => (
    <Dropdown trigger={<button className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100" aria-label="Job actions menu"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><circle cx="12" cy="12" r="1"></circle><circle cx="12" cy="5" r="1"></circle><circle cx="12" cy="19" r="1"></circle></svg></button>}>
        <a href="#" onClick={(e) => {e.preventDefault(); onAction('details', job)}} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">View Details</a>
        <a href="#" onClick={(e) => {e.preventDefault(); onAction('close', job)}} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Close Job</a>
        <a href="#" onClick={(e) => {e.preventDefault(); onAction('archive', job)}} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Archive Job</a>
        <a href="#" onClick={(e) => {e.preventDefault(); onAction('delete', job)}} className="block px-4 py-2 text-sm text-red-600 hover:bg-gray-100">Delete Job</a>
    </Dropdown>
);
const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message, confirmText }) => {
    const confirmButtonClasses = { delete: 'bg-red-600 hover:bg-red-700', archive: 'bg-yellow-500 hover:bg-yellow-600', close: 'bg-blue-500 hover:bg-blue-600' };
    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
            <p className="text-gray-600">{message}</p>
            <div className="flex justify-end mt-6 space-x-2">
                <button onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Cancel</button>
                <button onClick={onConfirm} className={`px-4 py-2 text-white rounded-md ${confirmButtonClasses[confirmText] || 'bg-indigo-600'}`}>{confirmText}</button>
            </div>
        </Modal>
    );
};
const ViewDetailsModal = ({ isOpen, onClose, job }) => (
    <Modal isOpen={isOpen} onClose={onClose} title="Job Details" size="lg">
        {job && <div className="space-y-4">{Object.entries(job).map(([key, value]) => (<div key={key}><h4 className="text-sm font-medium text-gray-500">{key}</h4><p className="text-gray-800">{String(DATE_COLUMNS.includes(key) ? formatDate(value) : value)}</p></div>))}</div>}
    </Modal>
);

// --- NEW: Messages Page Component ---
const MessagesPage = () => {
    const { user } = useAuth();
    const [users, setUsers] = useState([]);
    const [selectedRecipient, setSelectedRecipient] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loadingUsers, setLoadingUsers] = useState(true);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [error, setError] = useState('');
    const messagesEndRef = useRef(null); // Ref for scrolling to the bottom of messages

    // Fetch all users for recipient selection
    useEffect(() => {
        const fetchUsers = async () => {
            setLoadingUsers(true);
            try {
                const result = await api.getUsers(user.userIdentifier);
                if (result.success) {
                    // Filter out the current user from the list of recipients
                    setUsers(result.users.filter(u => u.username !== user.userIdentifier));
                } else {
                    setError(result.message);
                }
            } catch (err) {
                setError(`Failed to fetch users: ${err.message}`);
            } finally {
                setLoadingUsers(false);
            }
        };
        fetchUsers();
    }, [user.userIdentifier]);

    // Fetch messages for the selected recipient
    useEffect(() => {
        let messagePollingInterval;
        const fetchMessages = async () => {
            if (!selectedRecipient) {
                setMessages([]);
                return;
            }
            setLoadingMessages(true);
            setError('');
            try {
                const result = await api.getMessages(user.userIdentifier, selectedRecipient.username, user.userIdentifier);
                if (result.success) {
                    setMessages(result.messages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp)));
                } else {
                    setError(result.message);
                }
            } catch (err) {
                setError(`Failed to fetch messages: ${err.message}`);
            } finally {
                setLoadingMessages(false);
            }
        };

        fetchMessages(); // Initial fetch
        messagePollingInterval = setInterval(fetchMessages, 5000); // Poll every 5 seconds

        return () => clearInterval(messagePollingInterval); // Cleanup on unmount or recipient change
    }, [selectedRecipient, user.userIdentifier]);

    // Scroll to the bottom of the messages whenever messages update
    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !selectedRecipient) return;

        const messageToSend = newMessage.trim();
        setNewMessage(''); // Clear input immediately

        try {
            // Optimistically add message to UI
            const tempMessage = {
                sender: user.userIdentifier,
                recipient: selectedRecipient.username,
                messageContent: messageToSend,
                timestamp: new Date().toISOString(),
                id: Date.now() // Temporary ID
            };
            setMessages(prev => [...prev, tempMessage]);

            const result = await api.saveMessage(user.userIdentifier, selectedRecipient.username, messageToSend, user.userIdentifier);
            if (!result.success) {
                setError(result.message);
                // Optional: Revert optimistic update if save fails
                setMessages(prev => prev.filter(msg => msg.id !== tempMessage.id));
            }
        } catch (err) {
            setError(`Failed to send message: ${err.message}`);
            // Optional: Revert optimistic update if send fails
            setMessages(prev => prev.filter(msg => msg.id !== tempMessage.id));
        }
    };

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-800">Internal Messaging</h1>
            <div className="flex flex-col md:flex-row bg-white rounded-lg shadow-lg h-[70vh]">
                {/* User List Sidebar */}
                <div className="w-full md:w-1/4 border-r border-gray-200 p-4 overflow-y-auto">
                    <h2 className="text-lg font-semibold text-gray-700 mb-4">Users</h2>
                    {loadingUsers && <Spinner size="6" />}
                    {error && <div className="text-red-500 text-sm">{error}</div>}
                    {!loadingUsers && users.length === 0 && <p className="text-gray-500 text-sm">No other users found.</p>}
                    <ul className="space-y-2">
                        {users.map(u => (
                            <li key={u.username}>
                                <button 
                                    onClick={() => setSelectedRecipient(u)}
                                    className={`w-full text-left p-3 rounded-md transition-colors duration-200 
                                                ${selectedRecipient?.username === u.username ? 'bg-emerald-100 text-emerald-800 font-semibold' : 'hover:bg-gray-100 text-gray-700'}`}
                                >
                                    <p className="font-medium">{u.displayName}</p>
                                    <p className="text-xs text-gray-500 break-all">ID: {u.userIdentifier}</p> {/* Display full user ID */}
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Chat Window */}
                <div className="flex-1 flex flex-col">
                    {selectedRecipient ? (
                        <>
                            <div className="p-4 border-b border-gray-200 bg-gray-50">
                                <h2 className="text-lg font-semibold text-gray-800">Chat with {selectedRecipient.displayName}</h2>
                                <p className="text-sm text-gray-500 break-all">ID: {selectedRecipient.userIdentifier}</p>
                            </div>
                            <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-gray-50">
                                {loadingMessages && <div className="flex justify-center"><Spinner size="6" /></div>}
                                {messages.length === 0 && !loadingMessages && <p className="text-gray-500 text-center">No messages yet. Start a conversation!</p>}
                                {messages.map((msg, index) => (
                                    <div key={msg.id || index} className={`flex ${msg.sender === user.userIdentifier ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-xs p-3 rounded-lg shadow-md ${msg.sender === user.userIdentifier ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-800'}`}>
                                            <p className="text-xs font-semibold mb-1">{msg.sender === user.userIdentifier ? 'You' : selectedRecipient.displayName}</p>
                                            <p>{msg.messageContent}</p>
                                            <p className="text-right text-xs mt-1 opacity-75">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                        </div>
                                    </div>
                                ))}
                                <div ref={messagesEndRef} /> {/* Scroll to this element */}
                            </div>
                            <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200 bg-white flex items-center space-x-2">
                                <input 
                                    type="text" 
                                    value={newMessage} 
                                    onChange={(e) => setNewMessage(e.target.value)} 
                                    placeholder="Type your message..." 
                                    className="flex-1 border border-gray-300 rounded-md p-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    disabled={loadingMessages}
                                />
                                <button 
                                    type="submit" 
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md disabled:bg-gray-400"
                                    disabled={!newMessage.trim() || loadingMessages}
                                >
                                    Send
                                </button>
                            </form>
                        </>
                    ) : (
                        <div className="flex-1 flex items-center justify-center text-gray-500">
                            Select a user to start a conversation.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// --- Main App Structure (Enhanced) ---------------------------------------------------
const TopNav = ({ user, logout, currentPage, setCurrentPage }) => {
    const isAdmin = user?.userRole?.includes('Admin');
    const isDataEntry = user?.backendOfficeRole?.includes('Data Entry') || user?.backendOfficeRole?.includes('Data Entry & Viewer');
    // FIX: Refined canAccessReportsNav to align with backend and ReportsPage permissions
    const canAccessReportsNav = isAdmin || 
                                user?.backendOfficeRole?.includes('Recruitment Manager') ||
                                user?.backendOfficeRole?.includes('Data Entry & Viewer') ||
                                user?.backendOfficeRole?.includes('Data Viewer');

    const [notifications, setNotifications] = useState([]);
    const [error, setError] = useState('');

    const fetchNotifications = useCallback(async () => {
        try {
            const result = await api.getNotifications(user.userIdentifier);
            if (result.success) setNotifications(result.notifications);
        } catch (err) {
            setError('Could not fetch notifications');
        }
    }, [user.userIdentifier]);

    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 60000); // Poll every minute
        return () => clearInterval(interval);
    }, [fetchNotifications]);

    const handleMarkAsRead = async (notifsToMark) => {
        try {
            await api.markNotificationsAsRead(notifsToMark, user.userIdentifier);
            fetchNotifications(); // Refresh list
        } catch (err) {
            setError('Failed to mark as read');
        }
    };

    return (
        <header className="bg-white shadow-md sticky top-0 z-40">
            <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    <div className="flex items-center space-x-8">
                        <h1 className="text-2xl font-bold text-indigo-600">VMS Portal</h1>
                        <nav className="hidden md:flex space-x-1">
                            {/* Home is accessible by all */}
                            <a href="#" onClick={(e) => {e.preventDefault(); setCurrentPage({type: 'home'})}} className={`px-3 py-2 rounded-md text-sm font-medium ${currentPage.type === 'home' ? 'text-indigo-600 bg-indigo-50' : 'text-gray-500 hover:text-gray-700'}`}>Home</a>
                            
                            {/* Dashboards are accessible by Data Viewer, Recruitment Manager, Recruitment Team, Admin */}
                            {/* The original isDataViewer in TopNav was too broad for dashboards, so using a more specific check here */}
                            {(user?.userRole?.includes('Admin') || user?.backendOfficeRole?.includes('Data Viewer') || user?.backendOfficeRole?.includes('Data Entry') || user?.backendOfficeRole?.includes('Data Entry & Viewer') || user?.backendOfficeRole?.includes('Recruitment Manager') || user?.backendOfficeRole?.includes('Recruitment Team')) && (
                                <Dropdown trigger={<button className={`px-3 py-2 rounded-md text-sm font-medium ${currentPage.type === 'dashboard' ? 'text-indigo-600 bg-indigo-50' : 'text-gray-500 hover:text-gray-700'}`}>Dashboards</button>}>
                                    {Object.entries(DASHBOARD_CONFIGS).map(([key, config]) => (
                                        <a href="#" key={key} onClick={(e) => {e.preventDefault(); setCurrentPage({type: 'dashboard', key})}} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">{config.title}</a>
                                    ))}
                                </Dropdown>
                            )}

                            {/* New Posting is accessible by Data Entry, Data Entry & Viewer, Admin */}
                            {(isDataEntry || isAdmin) && (
                                <a href="#" onClick={(e) => {e.preventDefault(); setCurrentPage({type: 'new_posting'})}} className={`px-3 py-2 rounded-md text-sm font-medium ${currentPage.type === 'new_posting' ? 'text-indigo-600 bg-indigo-50' : 'text-gray-500 hover:text-gray-700'}`}>New Posting</a>
                            )}
                            
                            {/* Reports are accessible by Recruitment Manager, Admin, Data Viewer, Data Entry & Viewer */}
                            {canAccessReportsNav && ( // FIX: Using the new canAccessReportsNav variable
                                <a href="#" onClick={(e) => {e.preventDefault(); setCurrentPage({type: 'reports'})}} className={`px-3 py-2 rounded-md text-sm font-medium ${currentPage.type === 'reports' ? 'text-indigo-600 bg-indigo-50' : 'text-gray-500 hover:text-gray-700'}`}>Reports</a>
                            )}

                            {/* Messages are accessible by all authenticated users */}
                            <a href="#" onClick={(e) => {e.preventDefault(); setCurrentPage({type: 'messages'})}} className={`px-3 py-2 rounded-md text-sm font-medium ${currentPage.type === 'messages' ? 'text-indigo-600 bg-indigo-50' : 'text-gray-500 hover:text-gray-700'}`}>Messages</a>
                            
                            {/* Admin is accessible only by Admin */}
                            {isAdmin && <a href="#" onClick={(e) => {e.preventDefault(); setCurrentPage({type: 'admin'})}} className={`px-3 py-2 rounded-md text-sm font-medium ${currentPage.type === 'admin' ? 'text-indigo-600 bg-indigo-50' : 'text-gray-500 hover:text-gray-700'}`}>Admin</a>}
                        </nav>
                    </div>
                    <div className="flex items-center space-x-4">
                        <Dropdown 
                            width="80"
                            trigger={
                                <button className="relative text-gray-500 hover:text-gray-700" aria-label="Notifications">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
                                    {/* Updated notification badge color */}
                                    {notifications.length > 0 && <span className="absolute -top-1 -right-1 flex h-4 w-4"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span><span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 text-white text-xs items-center justify-center">{notifications.length}</span></span>}
                                </button>
                            }>
                            <div className="p-2">
                                <div className="flex justify-between items-center mb-2 px-2">
                                    <h4 className="font-semibold text-gray-800">Notifications</h4>
                                    <button onClick={() => handleMarkAsRead(notifications)} className="text-xs text-indigo-600 hover:underline close-on-click">Mark all as read</button>
                                </div>
                                <div className="max-h-80 overflow-y-auto">
                                    {notifications.length > 0 ? notifications.map(n => (
                                        <div key={n.id} className="p-2 border-b hover:bg-slate-50">
                                            <p className="text-sm text-gray-700">{n.message}</p>
                                            <p className="text-xs text-gray-400">{new Date(n.timestamp).toLocaleString()}</p>
                                        </div>
                                    )) : <p className="text-sm text-gray-500 p-4 text-center">No new notifications.</p>}
                                </div>
                            </div>
                        </Dropdown>

                        <Dropdown trigger={
                            <button className="flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500" aria-label="User menu">
                                <span className="sr-only">Open user menu</span>
                                <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-gray-600"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg></div>
                            </button>
                        }>
                            <div className="px-4 py-2 border-b">
                                <p className="text-sm font-medium text-gray-900">{user.userName}</p>
                                <p className="text-sm text-gray-500 truncate">{user.userIdentifier}</p>
                            </div>
                            <a href="#" onClick={logout} className="block px-4 py-2 text-sm text-red-600 hover:bg-gray-100 close-on-click">Logout</a>
                        </Dropdown>
                    </div>
                </div>
            </div>
        </header>
    );
};

const MainApp = () => {
    const [currentPage, setCurrentPage] = useState({type: 'home'});
    const { user, logout } = useAuth();
    
    const renderPage = () => {
        // All users have home access
        if (currentPage.type === 'home') return <HomePage />;
        if (currentPage.type === 'messages') return <MessagesPage />;

        // Access control for other pages
        const isAdmin = user?.userRole?.includes('Admin');
        const isDataEntry = user?.backendOfficeRole?.includes('Data Entry') || user?.backendOfficeRole?.includes('Data Entry & Viewer');
        const isDataViewer = user?.backendOfficeRole?.includes('Data Viewer') || user?.backendOfficeRole?.includes('Data Entry') || user?.backendOfficeRole?.includes('Data Entry & Viewer') || user?.backendOfficeRole?.includes('Recruitment Manager') || user?.backendOfficeRole?.includes('Recruitment Team'); // Data Entry can also view dashboards
        const isRecruitmentManager = user?.backendOfficeRole?.includes('Recruitment Manager');

        switch(currentPage.type) {
            case 'dashboard': 
                if (isDataViewer || isAdmin) return <DashboardPage sheetKey={currentPage.key} />;
                return <div className="text-center text-red-500 p-8">Permission Denied: You do not have access to dashboards.</div>;
            case 'new_posting': 
                if (isDataEntry || isAdmin) return <JobPostingFormPage onFormSubmit={() => setCurrentPage({type: 'dashboard', key: 'taprootVMSDisplay'})} />;
                return <div className="text-center text-red-500 p-8">Permission Denied: You do not have permission to add new postings.</div>;
            case 'reports': 
                // FIX: Ensure this matches backend and TopNav's canAccessReportsNav
                if (isAdmin || isRecruitmentManager || user?.backendOfficeRole?.includes('Data Viewer') || user?.backendOfficeRole?.includes('Data Entry & Viewer')) return <ReportsPage />;
                return <div className="text-center text-red-500 p-8">Permission Denied: You do not have access to reports.</div>;
            case 'admin': 
                if (isAdmin) return <AdminPage />;
                return <div className="text-center text-red-500 p-8">Permission Denied: You do not have administrative access.</div>;
            default: return <HomePage />;
        }
    };

    return (
        <div className="min-h-screen bg-gray-100">
            <TopNav user={user} logout={logout} currentPage={currentPage} setCurrentPage={setCurrentPage} />
            <main className="py-6">
                <div className="px-4 sm:px-6 lg:px-8">
                    {renderPage()}
                </div>
            </main>
        </div>
    );
};

const App = () => {
    const { isAuthenticated, isFirstLogin } = useAuth();
    if (!isAuthenticated) return <LoginPage />;
    if (isFirstLogin) return <ChangePasswordPage />;
    return <MainApp />;
};

try {
    const root = createRoot(document.getElementById('root'));
    root.render(<AuthProvider><App /></AuthProvider>);
} catch (e) {
    console.error("Error rendering React app:", e);
    // Fallback UI to display if React app fails to render
    const rootElement = document.getElementById('root');
    if (rootElement) {
        rootElement.innerHTML = '<div style="text-align: center; color: red; padding: 20px; font-family: \'Inter\', sans-serif;">Failed to load application. Please check the console for more details.</div>';
    }
}
