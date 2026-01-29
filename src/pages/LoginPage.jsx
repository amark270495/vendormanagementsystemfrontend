import React, { useState } from 'react';
import { User, Lock, Eye, EyeOff, CheckCircle, AlertCircle, Zap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../api/apiService';
import ForgotPasswordModal from '../components/ForgotPasswordModal';

const LoginPage = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [isForgotPasswordOpen, setForgotPasswordOpen] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [success, setSuccess] = useState(false);
    
    // Access the real AuthContext
    const { login } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        setSuccess(false);

        try {
            const response = await apiService.authenticateUser(username, password);
            
            if (response.data.success) {
                setSuccess(true);
                // Slight delay to show the success checkmark animation before updating auth state
                setTimeout(() => {
                    login(response.data);
                }, 800);
            } else {
                setError(response.data.message);
            }
        } catch (err) {
            console.error("Login API Failure:", err);
            let errorMessage = "An unexpected error occurred. Please try again.";
            
            if (err.response) {
                if (err.response.data && err.response.data.message) {
                    errorMessage = err.response.data.message;
                } else if (err.response.status === 500) {
                    errorMessage = "Server error. Please contact support.";
                }
            } else if (err.code === 'ECONNREFUSED') {
                errorMessage = "Connection refused. Server may be offline.";
            }
            
            setError(errorMessage);
        } finally {
            // Only stop loading if we didn't succeed (if success, we want to keep the success state visible until redirect)
            if (!response?.data?.success && !success) {
                setLoading(false);
            }
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 font-sans relative overflow-hidden p-4">
            
            {/* --- Background Animation --- */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
                <div className="absolute -top-24 -left-24 w-96 h-96 bg-indigo-500 rounded-full mix-blend-multiply filter blur-[128px] opacity-20 animate-pulse"></div>
                <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-[128px] opacity-20 animate-pulse" style={{ animationDelay: '2s' }}></div>
                <div className="absolute -bottom-32 left-20 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-[128px] opacity-20 animate-pulse" style={{ animationDelay: '4s' }}></div>
            </div>

            {/* --- Split Card Container --- */}
            <div className="z-10 w-full max-w-5xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-[600px]">
                
                {/* LEFT SIDE: Branding & Features */}
                <div className="md:w-1/2 bg-indigo-600 relative overflow-hidden flex flex-col justify-center items-center text-center p-12 text-white">
                    {/* Decorative Background for Left Panel */}
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 to-purple-800 opacity-90"></div>
                    <div className="absolute -top-24 -left-24 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl"></div>
                    <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-indigo-400 opacity-20 rounded-full blur-3xl"></div>
                    
                    {/* Content */}
                    <div className="relative z-10 max-w-md">
                        <div className="mb-8 inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 shadow-xl">
                            <Zap className="w-10 h-10 text-yellow-300" fill="currentColor" />
                        </div>
                        <h1 className="text-4xl font-bold mb-6 tracking-tight">VMS Portal</h1>
                        <p className="text-lg text-indigo-100 leading-relaxed font-medium">
                            Streamline your workforce, manage attendance, and automate your workflows in one secure platform.
                        </p>
                        
                        {/* Feature Pills */}
                        <div className="mt-10 flex flex-wrap justify-center gap-3">
                            {['Secure Access', 'Real-time Analytics', 'Automated Reports'].map((item) => (
                                <span key={item} className="px-4 py-2 rounded-full bg-black/20 text-white text-xs font-semibold backdrop-blur-md border border-white/10">
                                    {item}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>

                {/* RIGHT SIDE: Login Form */}
                <div className="md:w-1/2 bg-white p-8 md:p-12 flex flex-col justify-center relative">
                    <div className="w-full max-w-md mx-auto">
                        <div className="mb-10 text-center md:text-left">
                            <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Welcome Back</h2>
                            <p className="text-slate-500 mt-2 text-sm">Please sign in to access your dashboard.</p>
                        </div>

                        {/* Error & Success Messages */}
                        {error && (
                            <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-100 flex items-start animate-in fade-in slide-in-from-top-2">
                                <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" />
                                <div className="text-sm text-red-700">{error}</div>
                            </div>
                        )}
                        
                        {success && (
                            <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center animate-in fade-in slide-in-from-top-2">
                                <CheckCircle className="w-5 h-5 text-emerald-500 mr-3 flex-shrink-0" />
                                <div className="text-sm text-emerald-700 font-medium">Login Successful. Redirecting...</div>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Username Input */}
                            <div className="group">
                                <label className="block text-sm font-semibold text-slate-700 mb-2" htmlFor="username">
                                    Username / Email
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <User className="h-5 w-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                                    </div>
                                    <input
                                        id="username"
                                        type="text"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        className="block w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                                        placeholder="Enter your username"
                                        required
                                        autoComplete="username"
                                    />
                                </div>
                            </div>

                            {/* Password Input */}
                            <div className="group">
                                <div className="flex items-center justify-between mb-2">
                                    <label className="block text-sm font-semibold text-slate-700" htmlFor="password">
                                        Password
                                    </label>
                                    <button
                                        type="button"
                                        onClick={() => setForgotPasswordOpen(true)}
                                        className="text-sm font-medium text-indigo-600 hover:text-indigo-500 transition-colors focus:outline-none"
                                    >
                                        Forgot Password?
                                    </button>
                                </div>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <Lock className="h-5 w-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                                    </div>
                                    <input
                                        id="password"
                                        type={showPassword ? 'text' : 'password'}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="block w-full pl-11 pr-12 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                                        placeholder="••••••••"
                                        required
                                        autoComplete="current-password"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer focus:outline-none"
                                    >
                                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                    </button>
                                </div>
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={loading || success}
                                className={`
                                    w-full flex justify-center items-center py-4 px-4 border border-transparent rounded-xl shadow-lg shadow-indigo-500/20 
                                    text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 
                                    transform transition-all active:scale-[0.98]
                                    ${(loading || success) ? 'opacity-80 cursor-not-allowed' : ''}
                                `}
                            >
                                {loading ? (
                                    <>
                                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Signing In...
                                    </>
                                ) : success ? (
                                    <>
                                        <CheckCircle className="mr-2 h-5 w-5" />
                                        Verified
                                    </>
                                ) : (
                                    'Sign In to Dashboard'
                                )}
                            </button>
                        </form>
                    </div>

                    {/* Footer for Mobile */}
                    <div className="mt-8 text-center md:hidden">
                        <p className="text-slate-400 text-xs">
                            © {new Date().getFullYear()} VMS Portal
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