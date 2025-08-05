import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../api/apiService';
import Modal from './Modal';
import Spinner from './Spinner';
import { usePermissions } from '../hooks/usePermissions'; // <-- NEW: Import usePermissions

const EmailReportModal = ({ isOpen, onClose, sheetKey }) => {
    const { user } = useAuth();
    // NEW: Destructure canEmailReports from usePermissions
    const { canEmailReports } = usePermissions(); 

    const [toEmails, setToEmails] = useState('');
    const [ccEmails, setCcEmails] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        // Only allow sending email if the user has permission
        if (!canEmailReports) { // NEW: Check canEmailReports permission
            setError("You do not have permission to send email reports.");
            return;
        }

        setError('');
        setSuccess('');
        setLoading(true);

        const toEmailArray = toEmails.split(',').map(e => e.trim()).filter(Boolean);
        const ccEmailArray = ccEmails.split(',').map(e => e.trim()).filter(Boolean);

        if (toEmailArray.length === 0) {
            setError("Please provide at least one recipient email in the 'To' field.");
            setLoading(false);
            return;
        }

        try {
            const response = await apiService.generateAndSendJobReport(sheetKey, statusFilter, toEmailArray, ccEmailArray, user.userIdentifier);
            if (response.data.success) {
                setSuccess(response.data.message);
                setTimeout(() => {
                    onClose();
                    setSuccess('');
                    setToEmails('');
                    setCcEmails('');
                }, 2000);
            } else {
                setError(response.data.message);
            }
        } catch (err) {
            setError(err.response?.data?.message || "Failed to send the report.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Email Job Report" size="lg">
            {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}
            {success && <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">{success}</div>}
            
            {!canEmailReports && !loading && ( // NEW: Access Denied message if no permission
                <div className="text-center text-gray-500 p-4">
                    <h3 className="text-lg font-medium">Access Denied</h3>
                    <p className="text-sm">You do not have the necessary permissions to send email reports.</p>
                </div>
            )}

            {canEmailReports && ( // NEW: Render form only if canEmailReports
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">To (comma-separated)</label>
                        <input type="text" value={toEmails} onChange={e => setToEmails(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">CC (comma-separated)</label>
                        <input type="text" value={ccEmails} onChange={e => setCcEmails(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Job Status to Include</label>
                        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2">
                            <option value="all">All</option>
                            <option value="Open">Open</option>
                            <option value="Closed">Closed</option>
                        </select>
                    </div>
                    <div className="flex justify-end space-x-2 pt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Cancel</button>
                        <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 flex items-center justify-center w-28" disabled={loading}>
                            {loading ? <Spinner size="5" /> : 'Send Email'}
                        </button>
                    </div>
                </form>
            )}
        </Modal>
    );
};

export default EmailReportModal;