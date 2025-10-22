import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../api/apiService';
import Spinner from '../components/Spinner';
import ConfirmationModal from '../components/dashboard/ConfirmationModal'; // Reusing confirmation modal
import { usePermissions } from '../hooks/usePermissions';

const HolidayManagementPage = () => {
    const { user } = useAuth();
    // Use the specific permission for holiday management
    const { canManageHolidays } = usePermissions();

    const [holidays, setHolidays] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const [newHolidayDate, setNewHolidayDate] = useState('');
    const [newHolidayDesc, setNewHolidayDesc] = useState('');
    const [isAdding, setIsAdding] = useState(false);

    const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
    const [holidayToDelete, setHolidayToDelete] = useState(null);

    const loadHolidays = useCallback(async () => {
        setLoading(true);
        setError('');
        if (!canManageHolidays) {
            setLoading(false);
            setError("You do not have permission to manage holidays.");
            return;
        }
        try {
            const currentYear = new Date().getFullYear().toString();
            // Fetch holidays for the current year by default
            const response = await apiService.getHolidays({ year: currentYear, authenticatedUsername: user.userIdentifier });
            if (response.data.success) {
                setHolidays(response.data.holidays || []);
            } else {
                setError(response.data.message);
                setHolidays([]); // Ensure empty on failure
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to fetch holidays.');
            setHolidays([]); // Ensure empty on error
        } finally {
            setLoading(false);
        }
    }, [user?.userIdentifier, canManageHolidays]);

    useEffect(() => {
        loadHolidays();
    }, [loadHolidays]);

    const handleAddHoliday = async (e) => {
        e.preventDefault();
        if (!canManageHolidays || !newHolidayDate || !newHolidayDesc) {
            setError("Date and Description are required.");
            return;
        }

        // Basic date format check (YYYY-MM-DD)
        if (!/^\d{4}-\d{2}-\d{2}$/.test(newHolidayDate)) {
             setError("Invalid date format. Please use YYYY-MM-DD.");
            return;
        }

        setIsAdding(true);
        setError('');
        setSuccess('');

        try {
            const response = await apiService.manageHoliday('POST', {
                date: newHolidayDate,
                description: newHolidayDesc,
                authenticatedUsername: user.userIdentifier
            });
            if (response.data.success) {
                setSuccess(response.data.message);
                setNewHolidayDate('');
                setNewHolidayDesc('');
                loadHolidays(); // Refresh list
                setTimeout(() => setSuccess(''), 3000);
            } else {
                setError(response.data.message);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to add holiday.');
        } finally {
            setIsAdding(false);
        }
    };

    const handleDeleteClick = (holiday) => {
        if (!canManageHolidays) return;
        setHolidayToDelete(holiday);
        setDeleteModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!canManageHolidays || !holidayToDelete) return;
        setIsAdding(true); // Reuse adding spinner for delete operation
        setError('');

        try {
            const response = await apiService.manageHoliday('DELETE', {
                date: holidayToDelete.date,
                authenticatedUsername: user.userIdentifier
            });
            if (response.data.success) {
                setSuccess(response.data.message);
                loadHolidays(); // Refresh list
                setTimeout(() => setSuccess(''), 3000);
            } else {
                setError(response.data.message);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to delete holiday.');
        } finally {
            setIsAdding(false);
            setDeleteModalOpen(false);
            setHolidayToDelete(null);
        }
    };

    const formatDate = (dateString) => {
        try {
            return new Date(dateString + 'T00:00:00').toLocaleDateString('en-US', {
                year: 'numeric', month: 'long', day: 'numeric', weekday: 'long'
            });
        } catch (e) {
            return dateString;
        }
    };

    return (
        <>
            <div className="space-y-6">
                <h1 className="text-3xl font-bold text-gray-900">Manage Holidays</h1>
                
                {error && <div className="bg-red-50 border-l-4 border-red-400 text-red-700 p-4 rounded-md" role="alert"><p>{error}</p></div>}
                {success && <div className="bg-green-50 border-l-4 border-green-400 text-green-700 p-4 rounded-md" role="alert"><p>{success}</p></div>}

                {!canManageHolidays && !loading && (
                    <div className="text-center text-gray-500 p-10 bg-white rounded-xl shadow-sm border">
                        <h3 className="text-lg font-medium">Access Denied</h3>
                        <p className="text-sm">You do not have permission to manage holidays.</p>
                    </div>
                )}

                {canManageHolidays && (
                    <>
                        {/* Add Holiday Form */}
                        <form onSubmit={handleAddHoliday} className="bg-white p-6 rounded-lg border shadow-sm space-y-4 md:flex md:items-end md:space-y-0 md:space-x-4">
                            <div className="flex-1">
                                <label htmlFor="newHolidayDate" className="block text-sm font-medium text-gray-700">Date (YYYY-MM-DD) <span className="text-red-500">*</span></label>
                                <input
                                    type="date"
                                    id="newHolidayDate"
                                    value={newHolidayDate}
                                    onChange={(e) => setNewHolidayDate(e.target.value)}
                                    required
                                    className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
                                />
                            </div>
                            <div className="flex-1">
                                <label htmlFor="newHolidayDesc" className="block text-sm font-medium text-gray-700">Description <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    id="newHolidayDesc"
                                    value={newHolidayDesc}
                                    onChange={(e) => setNewHolidayDesc(e.target.value)}
                                    required
                                    placeholder="e.g., New Year's Day"
                                    className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
                                />
                            </div>
                            <button
                                type="submit"
                                className="w-full md:w-auto px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 flex items-center justify-center h-10 disabled:bg-indigo-400"
                                disabled={isAdding || loading}
                            >
                                {isAdding ? <Spinner size="5" /> : 'Add Holiday'}
                            </button>
                        </form>

                        {/* Holiday List */}
                        <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
                            <h2 className="text-lg font-semibold text-gray-800 p-4 border-b">
                                Upcoming Holidays ({new Date().getFullYear()})
                            </h2>
                            {loading ? (
                                <div className="flex justify-center items-center h-48"><Spinner /></div>
                            ) : holidays.length > 0 ? (
                                <ul className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
                                    {holidays.map((holiday) => (
                                        <li key={holiday.date} className="px-4 py-3 flex justify-between items-center hover:bg-gray-50">
                                            <div>
                                                <p className="text-sm font-medium text-gray-900">{holiday.description}</p>
                                                <p className="text-xs text-gray-500">{formatDate(holiday.date)}</p>
                                            </div>
                                            <button
                                                onClick={() => handleDeleteClick(holiday)}
                                                className="text-red-500 hover:text-red-700 p-1 rounded-md text-xs font-medium disabled:opacity-50"
                                                disabled={isAdding}
                                            >
                                                Delete
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-sm text-gray-500 text-center p-6">No holidays added for this year yet.</p>
                            )}
                        </div>
                    </>
                )}
            </div>

            {holidayToDelete && (
                <ConfirmationModal
                    isOpen={isDeleteModalOpen}
                    onClose={() => setDeleteModalOpen(false)}
                    onConfirm={handleConfirmDelete}
                    title="Confirm Delete Holiday"
                    message={`Are you sure you want to delete the holiday "${holidayToDelete.description}" on ${holidayToDelete.date}?`}
                    confirmText="Delete"
                />
            )}
        </>
    );
};

export default HolidayManagementPage;