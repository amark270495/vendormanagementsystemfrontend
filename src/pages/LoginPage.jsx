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
    Zap, 
    ArrowRight,
    Users,
    BarChart3,
    Globe2,
    ShieldCheck
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
        <div className="min-h-screen flex bg-white font-sans overflow-hidden selection:bg-indigo-500/30">
            
            {/* ========================================================= */}
            {/* LEFT SIDE: Premium Enterprise Branding (Hidden on Mobile) */}
            {/* ========================================================= */}
            <div className="hidden lg:flex lg:w-[55%] bg-[#0a0a0f] relative overflow-hidden flex-col justify-between p-16 2xl:p-24 border-r border-white/5">
                
                {/* 🌟 Modern Abstract Glowing Mesh Background */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    {/* Dynamic glowing orbs */}
                    <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] bg-indigo-600/20 rounded-full blur-[120px] mix-blend-screen animate-pulse" style={{ animationDuration: '8s' }} />
                    <div className="absolute bottom-[-10%] right-[-20%] w-[60%] h-[60%] bg-violet-600/20 rounded-full blur-[100px] mix-blend-screen animate-pulse" style={{ animationDuration: '12s', animationDelay: '2s' }} />
                    <div className="absolute top-[30%] left-[20%] w-[50%] h-[50%] bg-blue-500/10 rounded-full blur-[100px] mix-blend-screen" />
                    
                    {/* Subtle dot grid overlay for technical SaaS feel */}
                    <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
                </div>

                {/* Header Logo */}
                <div className="relative z-10 flex items-center gap-3">
                    <div className="bg-gradient-to-b from-white/10 to-white/5 p-2.5 rounded-2xl border border-white/10 shadow-[0_0_30px_rgba(99,102,241,0.2)] backdrop-blur-md">
                        <Zap className="h-6 w-6 text-indigo-400" fill="currentColor" />
                    </div>
                    <span className="text-2xl font-bold tracking-tight text-white">
                        VMS Portal
                    </span>
                </div>

                {/* Center Value Proposition */}
                <div className="relative z-10 max-w-xl mt-8">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-indigo-300 text-[11px] font-bold uppercase tracking-widest mb-8 backdrop-blur-md">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                        </span>
                        Enterprise Portal v2.4
                    </div>
                    
                    <h1 className="text-[3.5rem] font-medium leading-[1.1] mb-6 text-white tracking-tight">
                        Orchestrate your <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-violet-400 to-indigo-300 font-bold">
                            Global Workforce.
                        </span>
                    </h1>
                    
                    <p className="text-lg text-slate-400 leading-relaxed font-normal mb-12 max-w-lg">
                        The unified platform to manage vendors, automate compliance, and gain real-time analytics across your entire enterprise operation.
                    </p>

                    {/* 🌟 Glassmorphism Feature Grid */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white/[0.02] backdrop-blur-md border border-white/[0.05] p-5 rounded-3xl hover:bg-white/[0.04] transition-all duration-300 hover:-translate-y-1 group">
                            <Users className="h-6 w-6 text-indigo-400 mb-4 group-hover:scale-110 transition-transform duration-300" strokeWidth={1.5} />
                            <h3 className="text-white font-semibold text-sm mb-1.5">Unified Tracking</h3>
                            <p className="text-slate-500 text-sm leading-relaxed">Manage thousands of external workers with zero friction.</p>
                        </div>
                        <div className="bg-white/[0.02] backdrop-blur-md border border-white/[0.05] p-5 rounded-3xl hover:bg-white/[0.04] transition-all duration-300 hover:-translate-y-1 group">
                            <Globe2 className="h-6 w-6 text-violet-400 mb-4 group-hover:scale-110 transition-transform duration-300" strokeWidth={1.5} />
                            <h3 className="text-white font-semibold text-sm mb-1.5">Global Compliance</h3>
                            <p className="text-slate-500 text-sm leading-relaxed">Automated MSA and WO tracking across jurisdictions.</p>
                        </div>
                    </div>
                </div>

                {/* Footer / Social Proof */}
                <div className="relative z-10 flex items-center gap-6 mt-8 border-t border-white/10 pt-8">
                    <div className="flex -space-x-3">
                        <img className="w-10 h-10 rounded-full border-2 border-[#0a0a0f] opacity-80" src="https://i.pravatar.cc/100?img=33" alt="User" />
                        <img className="w-10 h-10 rounded-full border-2 border-[#0a0a0f] opacity-80" src="https://i.pravatar.cc/100?img=47" alt="User" />
                        <img className="w-10 h-10 rounded-full border-2 border-[#0a0a0f] opacity-80" src="https://i.pravatar.cc/100?img=12" alt="User" />
                        <div className="w-10 h-10 rounded-full border-2 border-[#0a0a0f] bg-indigo-900/50 flex items-center justify-center text-xs font-bold text-indigo-300 backdrop-blur-sm">
                            +2k
                        </div>
                    </div>
                    <p className="text-sm text-slate-400 font-medium">
                        Trusted by <span className="text-white font-semibold">2,000+</span> recruiters worldwide.
                    </p>
                </div>
            </div>

            {/* ========================================================= */}
            {/* RIGHT SIDE: Ultra-Clean Minimalist Login Form */}
            {/* ========================================================= */}
            <div className="w-full lg:w-[45%] flex items-center justify-center p-6 sm:p-12 xl:p-20 relative bg-white">
                
                <div className="w-full max-w-[420px] relative z-10">
                    
                    {/* Brand Identity for Mobile Only */}
                    <div className="lg:hidden flex items-center gap-3 mb-10">
                        <div className="bg-indigo-600 p-2.5 rounded-xl shadow-lg shadow-indigo-500/20">
                            <Zap className="h-6 w-6 text-white" fill="currentColor" />
                        </div>
                        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">VMS Protal</h1>
                    </div>

                    <div className="mb-8">
                        <h2 className="text-[2rem] font-bold text-slate-900 tracking-tight mb-2">Welcome back</h2>
                        <p className="text-slate-500 text-base">Please enter your details to sign in.</p>
                    </div>

                    {/* Dynamic Feedback (Error/Success) */}
                    <div className={`transition-all duration-300 overflow-hidden ${error || success ? 'max-h-24 mb-6 opacity-100' : 'max-h-0 opacity-0'}`}>
                        {error && (
                            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-100/50 flex items-start gap-3 text-rose-700 text-sm">
                                <AlertCircle className="w-5 h-5 text-rose-500 flex-shrink-0 mt-0.5" />
                                <div className="font-medium leading-relaxed">{error}</div>
                            </div>
                        )}
                        
                        {success && (
                            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100/50 flex items-center gap-3 text-emerald-700 text-sm">
                                <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                                <div className="font-medium">Authentication successful. Securing session...</div>
                            </div>
                        )}
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Username Input */}
                        <div>
                            <FormInput
                                label="Email address"
                                id="username"
                                type="text"
                                placeholder="name@company.com"
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
                                label="Password"
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
                                className="absolute right-3 top-[36px] p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg transition-colors focus:outline-none"
                                aria-label={showPassword ? "Hide password" : "Show password"}
                                disabled={loading || success}
                            >
                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                        </div>

                        {/* Utilities: Remember Me & Forgot Password */}
                        <div className="flex items-center justify-between pt-1 pb-2">
                            <div className="flex items-center group">
                                <div className="relative flex items-start">
                                    <div className="flex items-center h-5">
                                        <input
                                            id="remember-me"
                                            type="checkbox"
                                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-slate-300 rounded cursor-pointer transition-colors"
                                        />
                                    </div>
                                    <div className="ml-2.5 text-sm">
                                        <label htmlFor="remember-me" className="font-medium text-slate-600 cursor-pointer group-hover:text-slate-900 transition-colors">
                                            Remember me
                                        </label>
                                    </div>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={() => setForgotPasswordOpen(true)}
                                className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 transition-colors focus:outline-none"
                            >
                                Forgot password?
                            </button>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading || success}
                            className={`
                                w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl text-white font-semibold text-[15px]
                                transition-all duration-300
                                ${loading || success
                                    ? 'bg-slate-900 shadow-none cursor-wait' 
                                    : 'bg-indigo-600 hover:bg-indigo-700 shadow-[0_8px_20px_-8px_rgba(79,70,229,0.5)] hover:shadow-[0_8px_25px_-5px_rgba(79,70,229,0.6)] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]'
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
                                    <CheckCircle2 className="h-5 w-5 text-emerald-400" /> Secure Session Started
                                </>
                            ) : (
                                <>
                                    Sign in <ArrowRight className="h-4 w-4 ml-1 opacity-80" />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-12 text-center">
                        <p className="text-sm text-slate-500 font-medium">
                            Need help accessing your portal? <a href="mailto:admin@vms-dashboard.in" className="text-indigo-600 font-semibold hover:text-indigo-800 transition-colors ml-1">Contact IT Support</a>
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