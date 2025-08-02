import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../api/apiService';
import Spinner from '../components/Spinner';
import ForgotPasswordModal from '../components/ForgotPasswordModal';

const LoginPage = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [isForgotPasswordOpen, setForgotPasswordOpen] = useState(false);
    const { login } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const response = await apiService.authenticateUser(username, password);
            if (response.data.success) {
                login(response.data); // Pass the user data to the login function in AuthContext
            } else {
                setError(response.data.message);
            }
        } catch (err) {
            const errorMessage = err.response?.data?.message || "An unexpected error occurred. Please try again.";
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <div className="min-h-screen bg-slate-100 flex flex-col justify-center items-center p-4">
                <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-lg">
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold text-gray-800">VMS Dashboard</h1>
                        <p className="text-gray-500 mt-2">Welcome back! Please log in.</p>
                    </div>

                    {error && (
                        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        <div className="mb-4">
                            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="username">
                                Username (Email)
                            </label>
                            <input
                                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700"
                                id="username"
                                type="email"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                            />
                        </div>
                        <div className="mb-6">
                            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">
                                Password
                            </label>
                            <input
                                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700"
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                        <button
                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded w-full flex justify-center items-center h-10"
                            type="submit"
                            disabled={loading}
                        >
                            {loading ? <Spinner size="5" /> : 'Sign In'}
                        </button>
                        <div className="text-center mt-4">
                            <a
                                className="inline-block align-baseline font-bold text-sm text-indigo-600 hover:text-indigo-800 cursor-pointer"
                                onClick={() => setForgotPasswordOpen(true)}
                            >
                                Forgot Password?
                            </a>
                        </div>
                    </form>
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