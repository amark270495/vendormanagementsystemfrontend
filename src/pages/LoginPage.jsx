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
    ShieldCheck, 
    CheckCircle, 
    AlertCircle, 
    Zap, 
    ArrowRight,
    Users,
    BarChart3
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

    // 🌟 Capture the exact URL the user was trying to access before being redirected to login
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
                
                // UX: Brief delay for the success animation
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
        <div className="min-h-screen flex bg-slate-50 font-sans overflow-hidden">
            
            {/* ========================================================= */}
            {/* LEFT SIDE: Premium Enterprise Branding (Hidden on Mobile) */}
            {/* ========================================================= */}
            <div className="hidden lg:flex lg:w-1/2 bg-slate-950 relative overflow-hidden flex-col justify-between p-14 text-white">
                
                {/* 🌟 Modern Abstract Mesh/Orb Background */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-600/30 rounded-full blur-[120px] mix-blend-screen animate-pulse duration-10000" />
                    <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-violet-600/20 rounded-full blur-[100px] mix-blend-screen" />
                    <div className="absolute top-[40%] left-[20%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[80px] mix-blend-screen" />
                    
                    {/* Subtle grid overlay for tech feel */}
                    <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDEwIEwgNDAgMTAgTSAxMCAwIEwgMTAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjAyKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-50" />
                </div>

                {/* Header Logo */}
                <div className="relative z-10 flex items-center gap-3">
                    <div className="bg-gradient-to-br from-indigo-500 to-violet-600 p-2.5 rounded-2xl shadow-lg shadow-indigo-500/30 border border-white/10">
                        <Zap className="h-7 w-7 text-white" fill="currentColor" />
                    </div>
                    <span className="text-3xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                        VMS Pro
                    </span>
                </div>

                {/* Center Value Proposition */}
                <div className="relative z-10 max-w-lg mt-12">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-400/20 text-indigo-300 text-xs font-bold uppercase tracking-widest mb-6 backdrop-blur-md">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                        </span>
                        Enterprise Portal v2.4
                    </div>
                    <h1 className="text-5xl font-black leading-[1.15] mb-6 text-white">
                        Master your <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-400">
                            Workforce Ecosystem
                        </span>
                    </h1>
                    <p className="text-lg text-slate-400 leading-relaxed font-medium mb-10">
                        Centralize vendor management, automate compliance, and gain real-time analytics across your entire global operation.
                    </p>

                    {/* 🌟 Glassmorphism Feature Cards */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.05] p-5 rounded-3xl hover:bg-white/[0.05] transition-colors">
                            <Users className="h-6 w-6 text-indigo-400 mb-3" />
                            <h3 className="text-white font-bold text-sm mb-1">Unified Tracking</h3>
                            <p className="text-slate-500 text-xs leading-relaxed">Manage thousands of external workers with zero friction.</p>
                        </div>
                        <div className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.05] p-5 rounded-3xl hover:bg-white/[0.05] transition-colors">
                            <BarChart3 className="h-6 w-6 text-violet-400 mb-3" />
                            <h3 className="text-white font-bold text-sm mb-1">Live Analytics</h3>
                            <p className="text-slate-500 text-xs leading-relaxed">Instant insights into spend, attendance, and vendor health.</p>
                        </div>
                    </div>
                </div>

                {/* Footer Copyright */}
                <div className="relative z-10 flex items-center gap-4 text-sm text-slate-500 font-medium">
                    <span>© {new Date().getFullYear()} VMS Pro Portal</span>
                    <span className="h-1 w-1 bg-slate-700 rounded-full" />
                    <a href="#" className="hover:text-white transition-colors">Privacy</a>
                    <span className="h-1 w-1 bg-slate-700 rounded-full" />
                    <a href="#" className="hover:text-white transition-colors">Terms</a>
                </div>
            </div>

            {/* ========================================================= */}
            {/* RIGHT SIDE: Ultra-Clean Login Form Section */}
            {/* ========================================================= */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 xl:p-24 relative">
                
                {/* Mobile Background Blur */}
                <div className="absolute inset-0 bg-white lg:hidden z-0" />
                
                <div className="w-full max-w-md relative z-10">
                    
                    {/* Brand Identity for Mobile Only */}
                    <div className="lg:hidden flex flex-col items-center mb-10">
                        <div className="bg-gradient-to-br from-indigo-500 to-violet-600 p-3.5 rounded-2xl shadow-xl shadow-indigo-500/20 mb-5">
                            <Zap className="h-8 w-8 text-white" fill="currentColor" />
                        </div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight">VMS Pro</h1>
                    </div>

                    <div className="mb-10 text-center lg:text-left">
                        <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight mb-2">Welcome Back</h2>
                        <p className="text-slate-500 text-base font-medium">Enter your credentials to access your secure portal.</p>
                    </div>

                    {/* Dynamic Feedback (Error/Success) */}
                    {error && (
                        <div className="mb-8 p-4 rounded-2xl bg-rose-50/80 border border-rose-100 flex items-start gap-3 text-rose-700 text-sm animate-in fade-in zoom-in-95 duration-200">
                            <AlertCircle className="w-5 h-5 text-rose-500 flex-shrink-0 mt-0.5" />
                            <div className="font-semibold leading-relaxed">{error}</div>
                        </div>
                    )}
                    
                    {success && (
                        <div className="mb-8 p-4 rounded-2xl bg-emerald-50/80 border border-emerald-100 flex items-center gap-3 text-emerald-700 text-sm animate-in fade-in zoom-in-95 duration-200">
                            <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                            <div className="font-semibold">Authentication successful. Securing session...</div>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Username Input */}
                        <div className="space-y-1.5">
                            <FormInput
                                label="Enterprise Email / Username"
                                id="username"
                                type="text"
                                placeholder="name@company.com"
                                icon={Mail}
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                                autoComplete="username"
                            />
                        </div>

                        {/* Password Input */}
                        <div className="space-y-1.5 relative">
                            <FormInput
                                label="Security Password"
                                id="password"
                                type={showPassword ? 'text' : 'password'}
                                placeholder="••••••••"
                                icon={Lock}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                autoComplete="current-password"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-[34px] p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                                aria-label={showPassword ? "Hide password" : "Show password"}
                            >
                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                        </div>

                        {/* Utilities: Remember Me & Forgot Password */}
                        <div className="flex items-center justify-between pt-2">
                            <div className="flex items-center group">
                                <input
                                    id="remember-me"
                                    type="checkbox"
                                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-slate-300 rounded cursor-pointer transition-colors"
                                />
                                <label htmlFor="remember-me" className="ml-2.5 block text-sm text-slate-600 font-semibold cursor-pointer group-hover:text-slate-900 transition-colors">
                                    Keep me logged in
                                </label>
                            </div>

                            <button
                                type="button"
                                onClick={() => setForgotPasswordOpen(true)}
                                className="text-sm font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
                            >
                                Forgot Password?
                            </button>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading || success}
                            className={`
                                w-full flex items-center justify-center gap-2 py-4 px-4 rounded-2xl text-white font-bold text-[15px]
                                transition-all duration-300 shadow-xl mt-4
                                ${loading || success
                                    ? 'bg-slate-800 shadow-none cursor-wait' 
                                    : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200 hover:shadow-indigo-300 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]'
                                }
                            `}
                        >
                            {loading ? (
                                <>
                                    <svg className="animate-spin h-5 w-5 text-white/70" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Authenticating...
                                </>
                            ) : success ? (
                                <>
                                    <CheckCircle className="h-5 w-5 text-emerald-400" /> Redirecting...
                                </>
                            ) : (
                                <>
                                    Access Dashboard <ArrowRight className="h-4 w-4 ml-1 opacity-80" />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-12 text-center">
                        <p className="text-sm text-slate-500 font-medium bg-slate-100/50 inline-block px-4 py-2 rounded-full border border-slate-200">
                            Having trouble? <a href="mailto:admin@vms-dashboard.in" className="text-indigo-600 font-bold hover:text-indigo-800 transition-colors ml-1">Contact IT Support</a>
                        </p>
                    </div>
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