import React, { useState } from 'react';
import { apiService } from '../api/apiService';
import Modal from './Modal';
import Spinner from './Spinner';

const ForgotPasswordModal = ({ isOpen, onClose }) => {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');
        setLoading(true);
        try {
            // In a real app, the backend would handle sending the email.
            // We'll simulate a successful response for now.
            const response = await apiService.requestPasswordReset(email);
            setMessage(response.data.message || "If your account exists, a password reset email has been sent.");
            // Close modal after a delay
            setTimeout(() => {
                onClose();
                setMessage('');
                setEmail('');
            }, 3000);
        } catch (err) {
            // Avoid confirming if an email exists for security reasons.
            setMessage("If your account exists, a password reset email has been sent.");
            setError(''); // Clear specific errors from the user view.
            console.error(err); // Log the actual error for developers.
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Request Password Reset" size="md">
            {message && <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">{message}</div>}
            {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}
            <p className="text-gray-600 mb-4">Enter your username (email address) and we will send you a temporary password.</p>
            <form onSubmit={handleSubmit}>
                <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="reset-email">
                        Username (Email)
                    </label>
                    <input
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700"
                        id="reset-email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </div>
                <div className="flex items-center justify-end">
                    <button
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded flex items-center justify-center w-36"
                        type="submit"
                        disabled={loading}
                    >
                        {loading ? <Spinner size="5" /> : 'Send Reset Email'}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default ForgotPasswordModal;