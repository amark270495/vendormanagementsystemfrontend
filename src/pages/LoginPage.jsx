import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../api/apiService';
import ForgotPasswordModal from '../components/ForgotPasswordModal';
import FormInput from '../components/FormInput';
import { 
    Mail, 
    Lock, 
    Eye, 
    EyeOff, 
    CheckCircle2, 
    AlertCircle, 
    ShieldCheck, 
    ArrowRight,
    Building2,
    Database,
    LockKeyhole
} from 'lucide-react';

const LoginPage = () => {
    // --- State Management ---
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [isForgotPasswordOpen, setForgotPasswordOpen] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [success, setSuccess] = useState(false);
    
    const { login } = useAuth();
    const navigate = useNavigate(); 
    const location = useLocation();

    // Capture the exact URL the user was trying to access
    const intendedDestination = location.state?.from?.pathname + (location.state?.from?.search || '') || '/home';

    // --- Authentication Logic ---
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        setSuccess(false);

        try {
            const response = await apiService.authenticateUser(username, password);
            
            if (response.data.success) {
                const userData = response.data.user || response.data;
                
                setSuccess(true);
                setLoading(false);
                login(userData);
                
                setTimeout(() => {
                    if (userData.isFirstLogin) {
                        navigate('/change-password', { replace: true });
                    } else {
                        navigate(intendedDestination, { replace: true });
                    }
                }, 800);

            } else {
                setError(response.data.message || 'Invalid username or password.');
                setLoading(false);
            }
        } catch (err) {
            if (!success) {
                console.error("Login API Failure:", err);
                setError(err.response?.data?.message || "Connection failed. Please try again later.");
                setLoading(false);
            }
        }
    };

    return (
        <div className="min-h-screen flex bg-white font-sans overflow-hidden selection:bg-blue-500/30">
            
            {/* ========================================================= */}
            {/* LEFT SIDE: Internal Corporate Identity (Hidden on Mobile) */}
            {/* ========================================================= */}
            <div className="hidden lg:flex lg:w-[45%] xl:w-[50%] bg-slate-900 relative overflow-hidden flex-col justify-between p-16 border-r border-slate-800">
                
                {/* Clean, structured corporate background */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    {/* Subtle geometric overlay for a structured, secure feel */}
                    <div className="absolute inset-0" style={{ backgroundImage: 'linear-gradient(to right, rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.02) 1px, transparent 1px)', backgroundSize: '64px 64px' }} />
                    <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-blue-600/10 to-transparent" />
                </div>

                {/* Header Logo */}
                <div className="relative z-10 flex items-center gap-4">
                    <div className="bg-blue-600 p-2.5 rounded-xl shadow-lg border border-blue-500">
                        <Building2 className="h-7 w-7 text-white" strokeWidth={2} />
                    </div>
                    <div>
                        <span className="block text-2xl font-bold tracking-tight text-white leading-none mb-1">
                            VMS Portal
                        </span>
                        <span className="block text-[11px] font-bold tracking-[0.2em] text-blue-400 uppercase">
                            Taproot Solutions Inc.
                        </span>
                    </div>
                </div>

                {/* Center Corporate Message */}
                <div className="relative z-10 max-w-lg my-12">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-slate-800 border border-slate-700 text-slate-300 text-[11px] font-bold uppercase tracking-widest mb-8">
                        <LockKeyhole className="w-3.5 h-3.5 text-blue-400" />
                        Authorized Personnel Only
                    </div>
                    
                    <h1 className="text-4xl font-semibold leading-[1.2] mb-6 text-white tracking-tight">
                        Internal Vendor Management System
                    </h1>
                    
                    <p className="text-base text-slate-400 leading-relaxed font-normal mb-12">
                        Secure access to enterprise workforce data, compliance records, and global analytics. All activity on this portal is monitored and logged in accordance with Taproot Solutions IT policy.
                    </p>

                    {/* Internal Module Indicators */}
                    <div className="flex flex-col gap-4 border-l-2 border-slate-800 pl-6">
                        <div className="flex items-center gap-4">
                            <Database className="h-5 w-5 text-slate-500" strokeWidth={1.5} />
                            <span className="text-slate-300 font-medium text-sm">Centralized Data Architecture</span>
                        </div>
                        <div className="flex items-center gap-4">
                            <ShieldCheck className="h-5 w-5 text-slate-500" strokeWidth={1.5} />
                            <span className="text-slate-300 font-medium text-sm">Enterprise-Grade Security Protocol</span>
                        </div>
                    </div>
                </div>

                {/* Footer Legal/IT Info */}
                <div className="relative z-10 flex flex-col gap-2 mt-8 border-t border-slate-800 pt-8 text-xs text-slate-500 font-medium">
                    <p>© {new Date().getFullYear()} Taproot Solutions Inc. All rights reserved.</p>
                    <div className="flex items-center gap-4">
                        <a href="#" className="hover:text-slate-300 transition-colors">IT Usage Policy</a>
                        <span className="h-1 w-1 bg-slate-700 rounded-full" />
                        <a href="#" className="hover:text-slate-300 transition-colors">Security Guidelines</a>
                    </div>
                </div>
            </div>

            {/* ========================================================= */}
            {/* RIGHT SIDE: Utilitarian Corporate Login Form */}
            {/* ========================================================= */}
            <div className="w-full lg:w-[55%] xl:w-[50%] flex items-center justify-center p-6 sm:p-12 xl:p-20 relative bg-slate-50">
                
                <div className="w-full max-w-[400px] relative z-10 bg-white p-8 sm:p-10 rounded-2xl shadow-sm border border-slate-200">
                    
                    {/* Brand Identity for Mobile Only */}
                    <div className="lg:hidden flex items-center gap-3 mb-8 pb-8 border-b border-slate-100">
                        <div className="bg-blue-600 p-2 rounded-lg">
                            <Building2 className="h-5 w-5 text-white" strokeWidth={2} />
                        </div>
                        <div>
                            <span className="block text-xl font-bold tracking-tight text-slate-900 leading-none">
                                VMS Portal
                            </span>
                        </div>
                    </div>

                    <div className="mb-8">
                        <h2 className="text-2xl font-bold text-slate-900 tracking-tight mb-2">Enterprise Login</h2>
                        <p className="text-slate-500 text-sm font-medium">Sign in with your Taproot credentials.</p>
                    </div>

                    {/* Dynamic Feedback (Error/Success) */}
                    <div className={`transition-all duration-300 overflow-hidden ${error || success ? 'max-h-24 mb-6 opacity-100' : 'max-h-0 opacity-0'}`}>
                        {error && (
                            <div className="p-3.5 rounded-lg bg-rose-50 border border-rose-200 flex items-start gap-3 text-rose-700 text-sm">
                                <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
                                <div className="font-semibold">{error}</div>
                            </div>
                        )}
                        
                        {success && (
                            <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center gap-3 text-emerald-700 text-sm">
                                <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                                <div className="font-semibold">Credentials verified. Routing...</div>
                            </div>
                        )}
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Username Input */}
                        <div>
                            <FormInput
                                label="Corporate Email / ID"
                                id="username"
                                type="text"
                                placeholder="employee@taproot.com"
                                icon={Mail}
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                                autoComplete="username"
                                disabled={loading || success}
                            />
                        </div>

                        {/* Password Input */}
                        <div className="relative">
                            <FormInput
                                label="Network Password"
                                id="password"
                                type={showPassword ? 'text' : 'password'}
                                placeholder="••••••••"
                                icon={Lock}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                autoComplete="current-password"
                                disabled={loading || success}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-[36px] p-1.5 text-slate-400 hover:text-blue-600 rounded-lg transition-colors focus:outline-none"
                                aria-label={showPassword ? "Hide password" : "Show password"}
                                disabled={loading || success}
                            >
                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                        </div>

                        <div className="flex items-center justify-between pt-2 pb-4">
                            <div className="flex items-center">
                                <input
                                    id="remember-me"
                                    type="checkbox"
                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 rounded cursor-pointer"
                                />
                                <label htmlFor="remember-me" className="ml-2 block text-sm font-medium text-slate-600 cursor-pointer">
                                    Remember me
                                </label>
                            </div>
                            <button
                                type="button"
                                onClick={() => setForgotPasswordOpen(true)}
                                className="text-sm font-semibold text-blue-600 hover:text-blue-800 transition-colors focus:outline-none"
                            >
                                Forgot password?
                            </button>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading || success}
                            className={`
                                w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-white font-bold text-sm
                                transition-all duration-200 border
                                ${loading || success
                                    ? 'bg-slate-800 border-slate-800 cursor-wait' 
                                    : 'bg-blue-600 border-blue-600 hover:bg-blue-700 hover:border-blue-700 active:scale-[0.98] shadow-sm'
                                }
                            `}
                        >
                            {loading ? (
                                <>
                                    <svg className="animate-spin h-4 w-4 text-white/70" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Authenticating...
                                </>
                            ) : success ? (
                                'Session Authorized'
                            ) : (
                                <>
                                    Sign In <ArrowRight className="h-4 w-4 ml-1 opacity-80" />
                                </>
                            )}
                        </button>
                    </form>
                </div>

                <div className="absolute bottom-8 text-center w-full">
                    <p className="text-xs text-slate-400 font-medium">
                        System Support: <a href="mailto:admin@vms-dashboard.in" className="text-blue-600 font-semibold hover:underline ml-1">it-desk@taproot.com</a>
                    </p>
                </div>
            </div>

            {/* Forgot Password Modal */}
            <ForgotPasswordModal
                isOpen={isForgotPasswordOpen}
                onClose={() => setForgotPasswordOpen(false)}
            />
        </div>
    );
};

export default LoginPage;