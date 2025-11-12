import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../api/apiService';
import Spinner from '../components/Spinner';
import ForgotPasswordModal from '../components/ForgotPasswordModal';

// Eye icon for password visibility toggle (assuming these helpers are defined globally or imported correctly)
const EyeIcon = ({ size = 5, ...props }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size * 4} height={size * 4} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
        <circle cx="12" cy="12" r="3" />
    </svg>
);
const EyeOffIcon = ({ size = 5, ...props }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size * 4} height={size * 4} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
        <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
        <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
        <line x1="2" x2="22" y1="2" y2="22" />
    </svg>
);


const LoginPage = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [isForgotPasswordOpen, setForgotPasswordOpen] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const { login } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const response = await apiService.authenticateUser(username, password);
            if (response.data.success) {
                login(response.data);
            } else {
                // Backend returns 401/404, which is handled as success: false in axios
                setError(response.data.message);
            }
        } catch (err) {
            // --- CRITICAL DIAGNOSTIC CODE ---
            console.error("Login API Failure:", err);
            
            let errorMessage = "An unexpected error occurred. Please try again.";
            
            if (err.response) {
                // If the backend returned a structured response (e.g., 401 Unauthorized)
                if (err.response.data && err.response.data.message) {
                    errorMessage = err.response.data.message;
                } else if (err.response.status === 500) {
                    // Internal Server Error usually means the code crashed (e.g., hash fail, typo, bad import).
                    errorMessage = "Internal Server Error (500). Please check the backend function logs for crash details.";
                }
            } else if (err.code === 'ECONNREFUSED') {
                errorMessage = "Connection Refused. Is the backend function host running?";
            }
            
            setError(errorMessage);
            // --- END CRITICAL DIAGNOSTIC CODE ---

        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <div className="min-h-screen bg-slate-100 flex font-inter">
                <div className="relative hidden lg:flex flex-col justify-center items-center w-1/2 bg-indigo-700 text-white p-12 overflow-hidden">
                     <div className="absolute -top-20 -right-20 w-72 h-72 bg-indigo-500 rounded-full opacity-50"></div>
                     <div className="absolute -bottom-24 -left-20 w-80 h-80 bg-indigo-600 rounded-full opacity-40"></div>
                    <div className="z-10 text-center">
                         <div className="inline-block bg-white/10 p-4 rounded-full mb-6 backdrop-blur-sm border border-white/20">
                            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-10 h-10"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
                        </div>
                        <h1 className="text-4xl font-bold tracking-tight">VMS Portal</h1>
                        <p className="mt-4 text-lg text-indigo-200 max-w-sm">
                            Streamlining Vendor Management for Peak Efficiency and Collaboration.
                        </p>
                    </div>
                </div>

                <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12">
                    <div className="w-full max-w-md">
                        <div className="text-center lg:text-left mb-10">
                            <h2 className="text-3xl font-extrabold text-slate-800">Welcome Back</h2>
                            <p className="text-slate-500 mt-2">Please sign in to access your dashboard.</p>
                        </div>
                        
                        {error && (
                            <div className="bg-red-50 border-l-4 border-red-500 text-red-800 p-4 rounded-r-lg mb-6 shadow-md animate-shake" role="alert">
                                <p className="font-bold">Login Failed</p>
                                <p>{error}</p>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2" htmlFor="username">
                                    Username (Email)
                                </label>
                                <div className="relative">
                                    <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                                         <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                                    </span>
                                    <input
                                        className="block w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                                        id="username"
                                        type="email"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        required
                                        autoComplete="email"
                                        placeholder="you@example.com"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2" htmlFor="password">
                                    Password
                                </label>
                                <div className="relative">
                                    <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                                       <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                                    </span>
                                    <input
                                        className="block w-full pl-10 pr-10 py-3 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                                        id="password"
                                        type={showPassword ? 'text' : 'password'}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        autoComplete="current-password"
                                        placeholder="••••••••"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute inset-y-0 right-0 flex items-center pr-3 cursor-pointer text-slate-400 hover:text-slate-600"
                                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                                    >
                                        {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                                    </button>
                                </div>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="text-sm">
                                    <a href="#" onClick={(e) => { e.preventDefault(); setForgotPasswordOpen(true); }} className="font-medium text-indigo-600 hover:text-indigo-500">
                                        Forgot your password?
                                    </a>
                                </div>
                            </div>
                            <div className="pt-2">
                                <button
                                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-lg flex justify-center items-center h-12 transition-all duration-300 disabled:bg-indigo-400 shadow-lg hover:shadow-indigo-500/50"
                                    type="submit"
                                    disabled={loading}
                                >
                                    {loading ? <Spinner size="6" /> : 'Sign In'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
            <ForgotPasswordModal
                isOpen={isForgotPasswordOpen}
                onClose={() => setForgotPasswordOpen(false)}
            />
        </>
    );
};

export default LoginPage;