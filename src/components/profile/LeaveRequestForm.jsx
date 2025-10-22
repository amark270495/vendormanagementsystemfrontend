import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { apiService } from '../../api/apiService';
import Spinner from '../Spinner'; // Assuming Spinner is in components directory

const LeaveRequestForm = ({ onLeaveRequested }) => {
    const { user } = useAuth();
    const [leaveType, setLeaveType] = useState('Sick Leave'); // Default value
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [reason, setReason] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Define available leave types (could be dynamic later)
    const leaveTypes = ['Sick Leave', 'Casual Leave', 'Paid Leave', 'Unpaid Leave'];

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        // Basic validation
        if (!startDate || !endDate) {
            setError('Please select both start and end dates.');
            return;
        }
        if (new Date(startDate) > new Date(endDate)) {
            setError('End date cannot be before start date.');
            return;
        }
        if (!reason.trim()) {
            setError('Please provide a reason for your leave.');
            return;
        }

        setLoading(true);
        try {
            const response = await apiService.requestLeave({
                authenticatedUsername: user.userIdentifier,
                leaveType,
                startDate,
                endDate,
                reason
            });

            if (response.data.success) {
                setSuccess('Leave request submitted successfully!');
                // Clear form
                setLeaveType('Sick Leave');
                setStartDate('');
                setEndDate('');
                setReason('');
                // Call the callback to refresh history in parent
                if (onLeaveRequested) {
                    onLeaveRequested();
                }
                setTimeout(() => setSuccess(''), 3000); // Clear success message after 3 seconds
            } else {
                setError(response.data.message);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to submit leave request.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white p-4 rounded-lg border shadow-sm">
            <h3 className="font-semibold text-lg text-gray-800 mb-4">Request Leave</h3>

            {error && <div className="bg-red-50 border-l-4 border-red-400 text-red-700 p-3 rounded mb-4 text-sm">{error}</div>}
            {success && <div className="bg-green-50 border-l-4 border-green-400 text-green-700 p-3 rounded mb-4 text-sm">{success}</div>}

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="leaveType" className="block text-sm font-medium text-gray-700">Leave Type <span className="text-red-500">*</span></label>
                    <select
                        id="leaveType"
                        value={leaveType}
                        onChange={(e) => setLeaveType(e.target.value)}
                        required
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm h-10"
                    >
                        {leaveTypes.map(type => (
                            <option key={type} value={type}>{type}</option>
                        ))}
                    </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">Start Date <span className="text-red-500">*</span></label>
                        <input
                            type="date"
                            id="startDate"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            required
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                        />
                    </div>
                    <div>
                        <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">End Date <span className="text-red-500">*</span></label>
                        <input
                            type="date"
                            id="endDate"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            required
                            min={startDate} // Prevent end date before start date
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                        />
                    </div>
                </div>

                <div>
                    <label htmlFor="reason" className="block text-sm font-medium text-gray-700">Reason <span className="text-red-500">*</span></label>
                    <textarea
                        id="reason"
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        required
                        rows="3"
                        placeholder="Briefly explain the reason for your leave..."
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                    />
                </div>

                <div className="flex justify-end">
                    <button
                        type="submit"
                        disabled={loading}
                        className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400 flex items-center justify-center w-36 h-10 text-sm"
                    >
                        {loading ? <Spinner size="5" /> : 'Submit Request'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default LeaveRequestForm;