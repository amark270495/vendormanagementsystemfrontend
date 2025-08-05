import React, { useState } from 'react';
import Modal from '../Modal';
import Spinner from '../Spinner';
import { useAuth } from '../../context/AuthContext';
import { apiService } from '../../api/apiService';
import { usePermissions } from '../../hooks/usePermissions';

const RequestTimesheetApprovalModal = ({ isOpen, onClose, timesheet }) => {
    const { user } = useAuth();
    const { canRequestTimesheetApproval } = usePermissions();

    const [deadlineDate, setDeadlineDate] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!canRequestTimesheetApproval) {
            setError("You do not have permission to request timesheet approvals.");
            return;
        }
        if (!deadlineDate) {
            setError("Please select a deadline date.");
            return;
        }

        setError('');
        setSuccess('');
        setLoading(true);

        try {
            const response = await apiService.sendTimesheetApprovalRequest(
                timesheet.employeeMail,
                timesheet.employeeName,
                timesheet.month,
                timesheet.year,
                deadlineDate,
                timesheet.companyName,
                user.userIdentifier
            );
            if (response.data.success) {
                setSuccess(response.data.message);
                setTimeout(() => {
                    onClose();
                    setSuccess('');
                    setDeadlineDate('');
                }, 2000);
            } else {
                setError(response.data.message);
            }
        } catch (err) {
            setError(err.response?.data?.message || "Failed to send approval request.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Request Timesheet Approval" size="md">
            {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}
            {success && <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">{success}</div>}
            
            {!canRequestTimesheetApproval && !loading && (
                <div className="text-center text-gray-500 p-4">
                    <h3 className="text-lg font-medium">Access Denied</h3>
                    <p className="text-sm">You do not have the necessary permissions to request timesheet approvals.</p>
                </div>
            )}

            {canRequestTimesheetApproval && timesheet && (
                <form onSubmit={handleSubmit} className="space-y-4">
                    <p className="text-gray-700">
                        Request approval for **{timesheet.employeeName}**'s timesheet for **{new Date(timesheet.year, timesheet.month - 1).toLocaleString('en-US', { month: 'long' })} {timesheet.year}** (Client: **{timesheet.clientName}**).
                    </p>
                    <div>
                        <label htmlFor="deadlineDate" className="block text-sm font-medium text-gray-700">Deadline Date to Share <span className="text-red-500">*</span></label>
                        <input
                            type="date"
                            name="deadlineDate"
                            id="deadlineDate"
                            value={deadlineDate}
                            onChange={(e) => setDeadlineDate(e.target.value)}
                            required
                            className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
                            disabled={loading}
                        />
                    </div>
                    <div className="flex justify-end space-x-2 pt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Cancel</button>
                        <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 flex items-center justify-center w-48" disabled={loading}>
                            {loading ? <Spinner size="5" /> : 'Send Request Email'}
                        </button>
                    </div>
                </form>
            )}
        </Modal>
    );
};

export default RequestTimesheetApprovalModal;