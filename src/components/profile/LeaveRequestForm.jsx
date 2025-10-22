import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext'; // Import useAuth
import { apiService } from '../../api/apiService';
import Spinner from '../Spinner';
import { usePermissions } from '../../hooks/usePermissions'; // Import usePermissions

const LeaveRequestForm = ({ onLeaveRequested }) => {
    const { user } = useAuth(); // Get user info from context
    const { canRequestLeave } = usePermissions(); // Get the specific permission

    const [formData, setFormData] = useState({
        leaveType: 'Sick Leave', // Default value
        startDate: '',
        endDate: '',
        reason: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => {
            const newState = { ...prev, [name]: value };
            // Ensure end date is not before start date
            if (name === 'startDate' && newState.endDate && newState.endDate < value) {
                newState.endDate = value;
            }
            return newState;
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        // --- Permission Check ---
        if (!canRequestLeave) {
            setError("You do not have permission to request leave.");
            return;
        }
        // --- End Permission Check ---

        // --- Authentication Check ---
        if (!user?.userIdentifier) {
            setError("Cannot submit request: User is not properly authenticated.");
            return;
        }
        // --- End Authentication Check ---


        // Basic validation
        if (!formData.startDate || !formData.endDate || !formData.reason.trim()) {
            setError("Please fill in all required fields.");
            return;
        }
        if (new Date(formData.endDate) < new Date(formData.startDate)) {
            setError("End date cannot be before start date.");
            return;
        }

        setLoading(true);
        try {
            // --- FIX: Pass user.userIdentifier ---
            const response = await apiService.requestLeave(formData, user.userIdentifier);
            // --- End FIX ---

            if (response.data.success) {
                setSuccess(response.data.message);
                setFormData({ // Clear form
                    leaveType: 'Sick Leave',
                    startDate: '',
                    endDate: '',
                    reason: ''
                });
                if (onLeaveRequested) {
                    onLeaveRequested(); // Notify parent to refresh history
                }
                setTimeout(() => setSuccess(''), 4000);
            } else {
                setError(response.data.message);
            }
        } catch (err) {
            setError(err.response?.data?.message || "An unexpected error occurred while submitting the request.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <h3 className="text-md font-semibold mb-3 flex items-center text-gray-800">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                Request Leave
            </h3>

            {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded text-sm animate-shake">{error}</div>}
            {success && <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-2 rounded text-sm animate-fadeIn">{success}</div>}

            {/* Render form only if user has permission */}
            {canRequestLeave ? (
                <>
                    <div>
                        <label htmlFor="leaveType" className="block text-xs font-medium text-gray-600 mb-1">Leave Type <span className="text-red-500">*</span></label>
                        <select
                            id="leaveType"
                            name="leaveType"
                            value={formData.leaveType}
                            onChange={handleChange}
                            required
                            className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                        >
                            <option value="Sick Leave">Sick Leave</option>
                            <option value="Casual Leave">Casual Leave</option>
                            <option value="Earned Leave">Earned Leave</option>
                            <option value="Unpaid Leave">Unpaid Leave</option>
                            {/* Add other leave types as needed */}
                        </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="startDate" className="block text-xs font-medium text-gray-600 mb-1">Start Date <span className="text-red-500">*</span></label>
                            <input
                                type="date"
                                id="startDate"
                                name="startDate"
                                value={formData.startDate}
                                onChange={handleChange}
                                required
                                className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                            />
                        </div>
                        <div>
                            <label htmlFor="endDate" className="block text-xs font-medium text-gray-600 mb-1">End Date <span className="text-red-500">*</span></label>
                            <input
                                type="date"
                                id="endDate"
                                name="endDate"
                                value={formData.endDate}
                                onChange={handleChange}
                                required
                                min={formData.startDate} // Prevent end date before start date
                                className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                            />
                        </div>
                    </div>
                    <div>
                        <label htmlFor="reason" className="block text-xs font-medium text-gray-600 mb-1">Reason <span className="text-red-500">*</span></label>
                        <textarea
                            id="reason"
                            name="reason"
                            value={formData.reason}
                            onChange={handleChange}
                            required
                            rows="3"
                            placeholder="Briefly explain the reason for your leave..."
                            className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                        ></textarea>
                    </div>
                    <div className="flex justify-end pt-2">
                        <button
                            type="submit"
                            className="px-5 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 flex items-center justify-center w-36 h-10 disabled:bg-indigo-400 shadow transition"
                            disabled={loading}
                        >
                            {loading ? <Spinner size="5" /> : 'Submit Request'}
                        </button>
                    </div>
                </>
            ) : (
                 <p className="text-sm text-gray-500 italic">You do not have permission to request leave.</p>
            )}
        </form>
    );
};

export default LeaveRequestForm;