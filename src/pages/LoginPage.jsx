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
    FileSignature,
    Clock4,
    Briefcase,
    ServerCrash
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
        <div className="min-h-screen flex bg-slate-50 font-sans overflow-hidden selection:bg-blue-500/30">
            
            {/* ========================================================= */}
            {/* LEFT SIDE: Taproot Internal Corporate Identity */}
            {/* ========================================================= */}
            <div className="hidden lg:flex lg:w-[45%] xl:w-[50%] bg-[#0B1120] relative overflow-hidden flex-col justify-between p-12 xl:p-16 border-r border-slate-800">
                
                {/* Structured, Secure Background Pattern */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
                    <div className="absolute inset-0" style={{ backgroundImage: 'linear-gradient(to right, #1e293b 1px, transparent 1px), linear-gradient(to bottom, #1e293b 1px, transparent 1px)', backgroundSize: '48px 48px' }} />
                    <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-blue-900/20 via-transparent to-transparent" />
                </div>

                {/* Header Logo (Azure Blob Storage) */}
                <div className="relative z-10 flex flex-col gap-2">
                    <div className="flex items-center gap-3">
                        <div className="bg-white p-1.5 rounded-lg shadow-sm">
                            <img 
                                src="https://vmsdashboardea.blob.core.windows.net/images/Company_logo.png?sp=r&st=2026-03-16T20:51:06Z&se=2026-03-17T05:06:06Z&sv=2024-11-04&sr=b&sig=OkdvwYLGhv3wMw9QfKb2QXE3B14ruv6q0GGKvJEnEkc%3D" 
                                alt="Taproot Solutions Logo" 
                                className="h-8 w-auto object-contain"
                            />
                        </div>
                        <span className="text-2xl font-bold tracking-tight text-white leading-none">
                            Taproot Solutions Inc.
                        </span>
                    </div>
                    <span className="text-sm font-semibold tracking-widest text-blue-400 uppercase ml-[60px]">
                        Vendor Management System
                    </span>
                </div>

                {/* Center Corporate Module Overview */}
                <div className="relative z-10 max-w-lg my-12">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded bg-slate-800/80 border border-slate-700 text-slate-300 text-xs font-bold uppercase tracking-widest mb-8">
                        <ShieldCheck className="w-4 h-4 text-emerald-400" />
                        Secured Gateway
                    </div>
                    
                    <h1 className="text-3xl font-semibold leading-snug mb-6 text-white tracking-tight">
                        Enterprise Operations Portal
                    </h1>
                    
                    <p className="text-sm text-slate-400 leading-relaxed font-medium mb-10">
                        Centralized human resources and recruitment operations. Access is strictly restricted to authorized personnel.
                    </p>

                    {/* Internal Module Capabilities - Specific to Taproot */}
                    <div className="grid grid-cols-1 gap-5">
                        <div className="flex items-start gap-4 p-4 rounded-xl bg-slate-800/40 border border-slate-700/50">
                            <Briefcase className="h-5 w-5 text-blue-400 mt-0.5" strokeWidth={2} />
                            <div>
                                <h3 className="text-slate-200 font-semibold text-sm mb-1">Recruitment & Bench Sales</h3>
                                <p className="text-slate-500 text-xs leading-relaxed">End-to-end job posting management and candidate tracking lifecycle.</p>
                            </div>
                        </div>
                        
                        <div className="flex items-start gap-4 p-4 rounded-xl bg-slate-800/40 border border-slate-700/50">
                            <FileSignature className="h-5 w-5 text-blue-400 mt-0.5" strokeWidth={2} />
                            <div>
                                <h3 className="text-slate-200 font-semibold text-sm mb-1">Automated Documentation</h3>
                                <p className="text-slate-500 text-xs leading-relaxed">Digital signing workflows for Master Service Agreements (MSA) and Work Orders.</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4 p-4 rounded-xl bg-slate-800/40 border border-slate-700/50">
                            <Clock4 className="h-5 w-5 text-blue-400 mt-0.5" strokeWidth={2} />
                            <div>
                                <h3 className="text-slate-200 font-semibold text-sm mb-1">Timesheets & Assets</h3>
                                <p className="text-slate-500 text-xs leading-relaxed">Integrated attendance tracking, leave management, and hardware lifecycle tracking.</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Security Notice */}
                <div className="relative z-10 pt-6 border-t border-slate-800 flex items-center justify-between">
                    <p className="text-xs text-slate-500 font-medium max-w-sm">
                        Protected by SHA-256 encryption and Role-Based Access Control (RBAC). All internal communications are encrypted.
                    </p>
                    <ServerCrash className="h-6 w-6 text-slate-700" strokeWidth={1.5} />
                </div>
            </div>

            {/* ========================================================= */}
            {/* RIGHT SIDE: Utilitarian Corporate Login Form */}
            {/* ========================================================= */}
            <div className="w-full lg:w-[55%] xl:w-[50%] flex items-center justify-center p-6 sm:p-12 xl:p-20 relative bg-slate-50">
                
                <div className="w-full max-w-[400px] relative z-10 bg-white p-8 sm:p-10 rounded-2xl shadow-sm border border-slate-200">
                    
                    {/* Brand Identity for Mobile Only (Azure Blob Storage Logo) */}
                    <div className="lg:hidden flex flex-col gap-2 mb-8 pb-8 border-b border-slate-100">
                        <div className="flex items-center gap-3">
                            <img 
                                src="https://vmsdashboardea.blob.core.windows.net/images/logo.png" 
                                alt="Taproot Solutions Logo" 
                                className="h-7 w-auto object-contain"
                            />
                            <span className="text-xl font-bold tracking-tight text-slate-900 leading-none">
                                Taproot Solutions
                            </span>
                        </div>
                        <span className="text-xs font-bold tracking-widest text-blue-600 uppercase ml-[40px]">
                            VMS Portal
                        </span>
                    </div>

                    <div className="mb-8">
                        <h2 className="text-2xl font-bold text-slate-900 tracking-tight mb-2">System Login</h2>
                        <p className="text-slate-500 text-sm font-medium">Authenticate with your employee credentials.</p>
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
                        Taproot Solutions IT Support: <a href="mailto:admin@vms-dashboard.in" className="text-blue-600 font-semibold hover:underline ml-1">Mail To IT Support Team</a>
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