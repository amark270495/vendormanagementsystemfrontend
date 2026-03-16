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
    ServerCrash,
    LayoutDashboard
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

    // Authenticated SAS URL for Company Logo
    const LOGO_URL = "https://vmsdashboardea.blob.core.windows.net/images/Company_logo.png?sp=r&st=2026-03-16T20:51:06Z&se=2026-03-17T05:06:06Z&sv=2024-11-04&sr=b&sig=OkdvwYLGhv3wMw9QfKb2QXE3B14ruv6q0GGKvJEnEkc%3D";

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
            <div className="hidden lg:flex lg:w-[45%] xl:w-[50%] bg-[#0B1120] relative overflow-hidden flex-col justify-between p-12 xl:p-16 border-r border-slate-800 text-center">
                
                {/* Structured, Secure Background Pattern */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
                    <div className="absolute inset-0" style={{ backgroundImage: 'linear-gradient(to right, #1e293b 1px, transparent 1px), linear-gradient(to bottom, #1e293b 1px, transparent 1px)', backgroundSize: '48px 48px' }} />
                    <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-blue-900/20 via-transparent to-transparent" />
                </div>

                {/* Header Logo (Centered & Fixed Alignment) */}
                <div className="relative z-10 flex flex-col items-center w-full max-w-md mx-auto">
                    <div className="bg-white p-2 rounded-xl shadow-xl mb-4">
                        <img 
                            src={LOGO_URL} 
                            alt="Taproot Solutions Logo" 
                            className="h-12 w-auto object-contain"
                        />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-white tracking-tight leading-tight">
                            Taproot Solutions Inc.
                        </h2>
                        <div className="flex items-center justify-center gap-3 mt-1">
                            <div className="h-px w-8 bg-blue-500/50" />
                            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-400">
                                VMS Portal
                            </span>
                            <div className="h-px w-8 bg-blue-500/50" />
                        </div>
                    </div>
                </div>

                {/* Center Corporate Module Overview */}
                <div className="relative z-10 max-w-lg mx-auto my-12 text-left">
                    <div className="flex justify-center lg:justify-start mb-8">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded bg-slate-800/80 border border-slate-700 text-slate-300 text-xs font-bold uppercase tracking-widest">
                            <ShieldCheck className="w-4 h-4 text-emerald-400" />
                            Secured Gateway
                        </div>
                    </div>
                    
                    <h1 className="text-3xl font-semibold leading-snug mb-6 text-white tracking-tight">
                        Enterprise Operations Portal
                    </h1>
                    
                    <p className="text-sm text-slate-400 leading-relaxed font-medium mb-10">
                        Centralized human resources and recruitment operations. Access is strictly restricted to authorized personnel and activity is monitored.
                    </p>

                    {/* Internal Module Capabilities */}
                    <div className="grid grid-cols-1 gap-5">
                        {[
                            { icon: Briefcase, title: "Recruitment & Bench Sales", desc: "End-to-end job posting management and candidate tracking lifecycle." },
                            { icon: FileSignature, title: "Automated Documentation", desc: "Digital signing workflows for Master Service Agreements (MSA) and Work Orders." },
                            { icon: Clock4, title: "Timesheets & Assets", desc: "Integrated attendance tracking, leave management, and hardware lifecycle tracking." }
                        ].map((item, index) => (
                            <div key={index} className="flex items-start gap-4 p-4 rounded-xl bg-slate-800/40 border border-slate-700/50">
                                <item.icon className="h-5 w-5 text-blue-400 mt-0.5" strokeWidth={2} />
                                <div>
                                    <h3 className="text-slate-200 font-semibold text-sm mb-1">{item.title}</h3>
                                    <p className="text-slate-500 text-xs leading-relaxed">{item.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Footer Security Notice */}
                <div className="relative z-10 pt-6 border-t border-slate-800 flex items-center justify-between text-left">
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider max-w-sm">
                        Protected by SHA-256 Encryption & RBAC
                    </p>
                    <ServerCrash className="h-5 w-5 text-slate-700" strokeWidth={1.5} />
                </div>
            </div>

            {/* ========================================================= */}
            {/* RIGHT SIDE: Utilitarian Corporate Login Form */}
            {/* ========================================================= */}
            <div className="w-full lg:w-[55%] xl:w-[50%] flex items-center justify-center p-6 sm:p-12 xl:p-20 relative bg-slate-50">
                
                <div className="w-full max-w-[420px] relative z-10 bg-white p-8 sm:p-10 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-slate-100">
                    
                    {/* Brand Identity for Mobile Only (Centered Fix) */}
                    <div className="lg:hidden flex flex-col items-center mb-10 pb-6 border-b border-slate-100 w-full">
                        <div className="bg-white p-2 rounded-xl shadow-md border border-slate-50 mb-3">
                            <img 
                                src={LOGO_URL} 
                                alt="Taproot Logo" 
                                className="h-10 w-auto object-contain" 
                            />
                        </div>
                        <h1 className="text-xl font-bold tracking-tight text-slate-900 leading-none mb-1">
                            Taproot Solutions Inc.
                        </h1>
                        <span className="text-[10px] font-black tracking-[0.2em] text-blue-600 uppercase">
                            VMS Portal
                        </span>
                    </div>

                    <div className="mb-8">
                        <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-2">System Login</h2>
                        <p className="text-slate-500 text-sm font-medium">Authenticate with your employee credentials.</p>
                    </div>

                    {/* Dynamic Feedback (Error/Success) */}
                    <div className={`transition-all duration-300 overflow-hidden ${error || success ? 'max-h-24 mb-6 opacity-100' : 'max-h-0 opacity-0'}`}>
                        {error && (
                            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-3 text-rose-700 text-xs font-bold uppercase tracking-wide">
                                <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                                <div>{error}</div>
                            </div>
                        )}
                        
                        {success && (
                            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-3 text-emerald-700 text-xs font-bold uppercase tracking-wide">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                                <div>Authorized. Securing Session...</div>
                            </div>
                        )}
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <FormInput
                            label="Employee Email"
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
                                className="absolute right-4 top-[38px] text-slate-400 hover:text-blue-600 transition-colors"
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>

                        <div className="flex items-center justify-between pt-1">
                            <label className="flex items-center gap-2 cursor-pointer group">
                                <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 transition-colors" />
                                <span className="text-xs font-bold text-slate-500 group-hover:text-slate-700">Remember Me</span>
                            </label>
                            <button 
                                type="button" 
                                onClick={() => setForgotPasswordOpen(true)} 
                                className="text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors"
                            >
                                Forgot Password?
                            </button>
                        </div>

                        <button
                            type="submit"
                            disabled={loading || success}
                            className={`
                                w-full flex items-center justify-center gap-3 py-4 px-6 rounded-2xl text-white font-black text-xs uppercase tracking-[0.2em]
                                transition-all duration-300 shadow-xl
                                ${loading || success 
                                    ? 'bg-slate-800 cursor-not-allowed' 
                                    : 'bg-blue-600 hover:bg-blue-700 hover:shadow-blue-200 active:scale-[0.98]'
                                }
                            `}
                        >
                            {loading ? (
                                "Authenticating..."
                            ) : success ? (
                                <><CheckCircle2 size={16}/> Authorized</>
                            ) : (
                                <><LayoutDashboard size={16}/> Access Portal <ArrowRight size={16}/></>
                            )}
                        </button>
                    </form>
                </div>

                {/* Footer Support Info */}
                <div className="absolute bottom-8 text-center w-full">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                        Support: <a href="mailto:admin@vms-dashboard.in" className="text-blue-600 hover:underline">Mail To IT Support Team</a>
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