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
    ArrowRight 
} from 'lucide-react';

/**
 * LoginPage Component
 * Optimized for modern UI/UX with a split-screen design.
 * Features:
 * - Integration with existing AuthContext & apiService
 * - Reusable FormInput components for consistent styling
 * - Success/Error state feedback with animations
 * - Responsive design (Mobile & Desktop)
 */
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

    // --- Authentication Logic ---
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        setSuccess(false);

        try {
            // Using your specific authenticateUser service call
            const response = await apiService.authenticateUser(username, password);
            
            if (response.data.success) {
                const userData = response.data.user || response.data;
                
                setSuccess(true);
                setLoading(false);

                // Update AuthContext state
                login(userData);
                
                // Determine redirect destination (default to /home)
                const destination = location.state?.from?.pathname || '/home';
                
                // UX: Brief delay to show success state before navigating
                setTimeout(() => {
                    navigate(destination, { replace: true });
                }, 800);

                return; 
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
        <div className="min-h-screen flex bg-white font-sans overflow-hidden">
            
            {/* LEFT SIDE: Visual/Branding Section (Hidden on Mobile) */}
            <div className="hidden lg:flex lg:w-1/2 bg-indigo-600 relative overflow-hidden flex-col justify-between p-12 text-white">
                {/* Decorative Blur Elements */}
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
                    <div className="absolute -top-24 -left-24 w-96 h-96 bg-white opacity-10 rounded-full blur-3xl animate-pulse"></div>
                    <div className="absolute bottom-0 right-0 w-96 h-96 bg-indigo-400 opacity-20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
                </div>

                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-12">
                        <div className="bg-white/10 backdrop-blur-md p-2 rounded-xl border border-white/20 shadow-xl">
                            <Zap className="h-8 w-8 text-yellow-300" fill="currentColor" />
                        </div>
                        <span className="text-2xl font-bold tracking-tight">VMS Pro</span>
                    </div>

                    <h1 className="text-5xl font-extrabold leading-tight mb-6">
                        The Smarter Way <br />
                        <span className="text-indigo-200">To Manage Workforces</span>
                    </h1>
                    <p className="text-lg text-indigo-100 max-w-md leading-relaxed font-medium">
                        Streamline your vendors, automate attendance, and track assets in one centralized, high-performance platform.
                    </p>

                    <div className="mt-12 space-y-4">
                        {['Secure Enterprise Access', 'Real-time Analytics', 'Automated Reporting'].map((feature) => (
                            <div key={feature} className="flex items-center gap-3">
                                <div className="h-5 w-5 rounded-full bg-indigo-500/50 flex items-center justify-center border border-white/10">
                                    <CheckCircle className="h-3 w-3 text-white" />
                                </div>
                                <span className="text-sm font-semibold text-indigo-50">{feature}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="relative z-10">
                    <p className="text-sm text-indigo-200 font-medium">
                        © {new Date().getFullYear()} VMS Pro Portal • Enterprise v2.4
                    </p>
                </div>
            </div>

            {/* RIGHT SIDE: Login Form Section */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 bg-slate-50 lg:bg-white">
                <div className="w-full max-w-md">
                    
                    {/* Brand Identity for Mobile Only */}
                    <div className="lg:hidden flex flex-col items-center mb-10">
                        <div className="bg-indigo-600 p-3 rounded-2xl shadow-lg mb-4">
                            <ShieldCheck className="h-8 w-8 text-white" />
                        </div>
                        <h1 className="text-2xl font-bold text-slate-900">VMS Pro</h1>
                    </div>

                    <div className="mb-10 text-center lg:text-left">
                        <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Welcome Back</h2>
                        <p className="text-slate-500 mt-2 text-sm font-medium">Please sign in to access your dashboard.</p>
                    </div>

                    {/* Dynamic Feedback (Error/Success) */}
                    {error && (
                        <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-100 flex items-start gap-3 text-rose-700 text-sm animate-in fade-in slide-in-from-top-2">
                            <AlertCircle className="w-5 h-5 text-rose-500 flex-shrink-0" />
                            <div className="font-medium">{error}</div>
                        </div>
                    )}
                    
                    {success && (
                        <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center gap-3 text-emerald-700 text-sm animate-in fade-in slide-in-from-top-2">
                            <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                            <div className="font-medium">Verification successful. Redirecting...</div>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Username Input using Reusable Component */}
                        <FormInput
                            label="Username / Email"
                            id="username"
                            type="text"
                            placeholder="Enter your username"
                            icon={Mail}
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                            autoComplete="username"
                        />

                        {/* Password Input with Toggle Feature */}
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
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-[38px] text-slate-400 hover:text-indigo-600 transition-colors focus:outline-none"
                                aria-label={showPassword ? "Hide password" : "Show password"}
                            >
                                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                            </button>
                        </div>

                        {/* Utilities: Remember Me & Forgot Password */}
                        <div className="flex items-center justify-between py-1">
                            <div className="flex items-center">
                                <input
                                    id="remember-me"
                                    type="checkbox"
                                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-slate-300 rounded cursor-pointer transition-colors"
                                />
                                <label htmlFor="remember-me" className="ml-2 block text-sm text-slate-600 font-medium cursor-pointer">
                                    Remember me
                                </label>
                            </div>

                            <button
                                type="button"
                                onClick={() => setForgotPasswordOpen(true)}
                                className="text-sm font-bold text-indigo-600 hover:text-indigo-500 transition-colors"
                            >
                                Forgot Password?
                            </button>
                        </div>

                        {/* Submit Button with Loading & Success States */}
                        <button
                            type="submit"
                            disabled={loading || success}
                            className={`
                                w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl text-white font-bold text-sm
                                transition-all duration-200 shadow-lg
                                ${loading || success
                                    ? 'bg-indigo-400 cursor-wait' 
                                    : 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-indigo-200 active:scale-[0.98]'
                                }
                            `}
                        >
                            {loading ? (
                                <>
                                    <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Signing in...
                                </>
                            ) : success ? (
                                <>
                                    <CheckCircle className="h-5 w-5" /> Verified
                                </>
                            ) : (
                                <>
                                    Sign In <ArrowRight className="h-4 w-4" />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-10 pt-8 border-t border-slate-100 text-center">
                        <p className="text-sm text-slate-500 font-medium">
                            Need help accessing your account? <br />
                            <a href="mailto:admin@vms-dashboard.in" className="text-indigo-600 font-bold hover:underline">Contact System Admin</a>
                        </p>
                    </div>
                </div>
            </div>

            {/* Forgot Password Modal (Existing Component) */}
            <ForgotPasswordModal
                isOpen={isForgotPasswordOpen}
                onClose={() => setForgotPasswordOpen(false)}
            />
        </div>
    );
};

export default LoginPage;