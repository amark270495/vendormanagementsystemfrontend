import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../api/apiService';
import Spinner from '../components/Spinner';

const ChangePasswordPage = () => {
    const { user, passwordChanged, logout } = useAuth();
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }
        if (newPassword.length < 8) {
            setError("Password must be at least 8 characters long.");
            return;
        }

        setError('');
        setLoading(true);
        try {
            const response = await apiService.changePassword(user.userIdentifier, newPassword, user.userIdentifier);
            if (response.data.success) {
                setSuccess("Password changed successfully! Redirecting to the dashboard...");
                setTimeout(() => {
                    passwordChanged();
                }, 2000);
            } else {
                setError(response.data.message);
            }
        } catch (err) {
            const errorMessage = err.response?.data?.message || "An unexpected error occurred.";
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-4">
            <div className="w-full max-w-md mx-auto">
                 <div className="text-center mb-6">
                    <div className="inline-block bg-indigo-600 p-3 rounded-full mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900">Create a New Password</h1>
                    <p className="text-gray-600 mt-2">For security, you must change your password on first login.</p>
                </div>

                <div className="bg-white p-8 rounded-2xl shadow-md">
                    {error && <div className="bg-red-50 border-l-4 border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6">{error}</div>}
                    {success && <div className="bg-green-50 border-l-4 border-green-400 text-green-700 px-4 py-3 rounded-lg mb-6">{success}</div>}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="new-password">
                                New Password
                            </label>
                            <input
                                className="block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                id="new-password"
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                required
                                placeholder="Enter your new password"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="confirm-password">
                                Confirm New Password
                            </label>
                            <input
                                className="block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                id="confirm-password"
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                placeholder="Confirm your new password"
                            />
                        </div>
                         <div className="pt-2">
                            <button
                                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-lg flex justify-center items-center h-12 transition-colors duration-300 disabled:bg-indigo-400"
                                type="submit"
                                disabled={loading || success}
                            >
                                {loading ? <Spinner size="6" /> : 'Set New Password'}
                            </button>
                        </div>
                    </form>
                </div>
                <button onClick={logout} className="mt-6 text-sm font-medium text-gray-600 hover:text-gray-900 w-full">
                    Logout and return to Sign In
                </button>
            </div>
        </div>
    );
};

export default ChangePasswordPage;