import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../api/apiService';
import Spinner from '../components/Spinner';
import ConfirmationModal from '../components/dashboard/ConfirmationModal'; // Reusing confirmation modal
import { usePermissions } from '../hooks/usePermissions';

const HolidayManagementPage = () => {
    const { user } = useAuth();
    const { canManageHolidays } = usePermissions();

    const [holidays, setHolidays] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false); // Separate loading for actions
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const [newHolidayDate, setNewHolidayDate] = useState('');
    const [newHolidayDesc, setNewHolidayDesc] = useState('');
    const [newHolidayType, setNewHolidayType] = useState('Fixed'); // <-- MODIFICATION: Added state for type
    const [yearFilter, setYearFilter] = useState(new Date().getFullYear().toString());

    // State for delete confirmation
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [holidayToDelete, setHolidayToDelete] = useState(null);

    const loadHolidays = useCallback(async (year) => {
        if (!user?.userIdentifier || !canManageHolidays) {
            setLoading(false);
            setError("You do not have permission to manage holidays.");
            return;
        }
        setLoading(true);
        setError('');
        try {
            const result = await apiService.getHolidays({ authenticatedUsername: user.userIdentifier, year: year });
            if (result.data.success) {
                setHolidays(result.data.holidays || []);
            } else {
                setError(result.data.message);
                setHolidays([]); // Ensure empty array on error
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to fetch holidays.');
            setHolidays([]); // Ensure empty array on error
        } finally {
            setLoading(false);
        }
    }, [user?.userIdentifier, canManageHolidays]);

    useEffect(() => {
        if (canManageHolidays) { // Only load if permission is granted
            loadHolidays(yearFilter);
        }
    }, [loadHolidays, yearFilter, canManageHolidays]);

    const handleAddHoliday = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!user?.userIdentifier) {
            setError("Authentication error: Cannot identify the current user. Please try logging out and back in.");
            return;
        }

        // <-- MODIFICATION: Added check for newHolidayType -->
        if (!newHolidayDate || !newHolidayDesc.trim() || !newHolidayType) {
            setError("Please provide a date, description, and holiday type.");
            return;
        }
        setActionLoading(true);
        try {
            // <-- MODIFICATION: Pass all three fields to the API -->
            const response = await apiService.manageHoliday(
                { 
                    date: newHolidayDate, 
                    description: newHolidayDesc.trim(),
                    holidayType: newHolidayType // Pass the selected type
                },
                'POST',
                user.userIdentifier
            );
            if (response.data.success) {
                setSuccess(response.data.message);
                setNewHolidayDate('');
                setNewHolidayDesc('');
                setNewHolidayType('Fixed'); // Reset type dropdown
                loadHolidays(yearFilter); // Refresh list
                setTimeout(() => setSuccess(''), 3000);
            } else {
                setError(response.data.message);
            }
        } catch (err) {
            setError(err.response?.data?.message || "An unexpected error occurred while adding the holiday.");
        } finally {
            setActionLoading(false);
        }
    };

    const handleDeleteClick = (holiday) => {
        setHolidayToDelete(holiday);
        setIsDeleteModalOpen(true);
    };

    const handleConfirmDelete = async () => {
         setError('');
         setSuccess('');
        if (!user?.userIdentifier) {
            setError("Authentication error: Cannot identify the current user. Please try logging out and back in.");
            setIsDeleteModalOpen(false);
            setHolidayToDelete(null);
            return;
        }

        if (!holidayToDelete) return;
        setActionLoading(true);
        setIsDeleteModalOpen(false);

        try {
            const response = await apiService.manageHoliday(
                { date: holidayToDelete.date },
                'DELETE',
                user.userIdentifier
            );
            if (response.data.success) {
                setSuccess(response.data.message);
                loadHolidays(yearFilter); // Refresh list
                setTimeout(() => setSuccess(''), 3000);
            } else {
                setError(response.data.message);
            }
        } catch (err) {
            setError(err.response?.data?.message || `Failed to delete holiday ${holidayToDelete.date}.`);
        } finally {
            setHolidayToDelete(null);
            setActionLoading(false);
        }
    };

    // Generate year options
    const currentYear = new Date().getFullYear();
    const yearOptions = Array.from({ length: 11 }, (_, i) => (currentYear - 5 + i).toString());

    if (loading) {
         return <div className="flex justify-center items-center h-64"><Spinner size="12" /></div>;
    }

     if (!canManageHolidays) { // Show specific message if permission is the issue and no error is present
         return (
             <div className="text-center text-gray-500 p-10 bg-white rounded-xl shadow-sm border">
                 <h3 className="text-lg font-medium">Access Denied</h3>
                 <p className="mt-1 text-sm text-gray-500">You do not have the necessary permissions to manage holidays.</p>
             </div>
         );
     }


    return (
        <>
            <div className="space-y-6">
                {/* Header */}
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Manage Company Holidays</h1>
                    <p className="mt-1 text-gray-600">Add, view, or remove holidays for the selected year.</p>
                </div>

                 {/* Error/Success Feedback */}
                 {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded animate-shake" role="alert">{error}</div>}
                 {success && <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded animate-fadeIn" role="status">{success}</div>}

                {/* Add Holiday Form */}
                <div className="bg-white p-6 rounded-xl shadow border border-gray-100">
                    <h2 className="text-lg font-semibold text-gray-800 mb-4">Add New Holiday</h2>
                    {/* <-- MODIFICATION: Changed grid to 4 cols --> */}
                    <form onSubmit={handleAddHoliday} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                        <div>
                            <label htmlFor="newHolidayDate" className="block text-sm font-medium text-gray-700">Date <span className="text-red-500">*</span></label>
                            <input
                                type="date"
                                id="newHolidayDate"
                                value={newHolidayDate}
                                onChange={(e) => setNewHolidayDate(e.target.value)}
                                required
                                className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
                            />
                        </div>
                        {/* <-- MODIFICATION: Added type dropdown --> */}
                        <div>
                            <label htmlFor="newHolidayType" className="block text-sm font-medium text-gray-700">Type <span className="text-red-500">*</span></label>
                            <select
                                id="newHolidayType"
                                value={newHolidayType}
                                onChange={(e) => setNewHolidayType(e.target.value)}
                                required
                                className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500 h-[42px]" // Match height
                            >
                                <option value="Fixed">Fixed</option>
                                <option value="Optional">Optional</option>
                            </select>
                        </div>
                        <div className="md:col-span-1">
                            <label htmlFor="newHolidayDesc" className="block text-sm font-medium text-gray-700">Description <span className="text-red-500">*</span></label>
                            <input
                                type="text"
                                id="newHolidayDesc"
                                value={newHolidayDesc}
                                onChange={(e) => setNewHolidayDesc(e.target.value)}
                                required
                                placeholder="e.g., Independence Day"
                                className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
                            />
                        </div>
                        <div className="md:col-span-1 flex justify-start md:justify-end">
                            <button
                                type="submit"
                                className="w-full md:w-auto px-5 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 flex items-center justify-center h-10 shadow-sm transition disabled:bg-indigo-400"
                                disabled={actionLoading}
                            >
                                {actionLoading ? <Spinner size="5" /> : 'Add Holiday'}
                            </button>
                        </div>
                    </form>
                </div>

                {/* Holiday List */}
                <div className="bg-white p-6 rounded-xl shadow border border-gray-100">
                     <div className="flex justify-between items-center mb-4">
                         <h2 className="text-lg font-semibold text-gray-800">Holidays for Year:</h2>
                         <select
                             value={yearFilter}
                             onChange={(e) => setYearFilter(e.target.value)}
                             className="border border-gray-300 rounded-lg shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
                         >
                             {yearOptions.map(year => <option key={year} value={year}>{year}</option>)}
                         </select>
                     </div>

                    <div className="overflow-x-auto max-h-[50vh]">
                        {holidays.length > 0 ? (
                            <ul className="divide-y divide-gray-200">
                                {holidays.map(holiday => (
                                    <li key={holiday.date} className="flex items-center justify-between py-3 px-1 hover:bg-gray-50">
                                        <div className="flex items-center">
                                            {/* <-- MODIFICATION: Added type badge --> */}
                                            <span 
                                                className={`text-xs font-semibold mr-3 px-2.5 py-0.5 rounded-full ${
                                                    holiday.holidayType === 'Optional' 
                                                    ? 'bg-blue-100 text-blue-800' 
                                                    : 'bg-gray-100 text-gray-800'
                                                }`}
                                            >
                                                {holiday.holidayType || 'Fixed'}
                                            </span>
                                            <div>
                                                <span className="font-semibold text-gray-800 mr-4">
                                                    {new Date(holiday.date + 'T00:00:00Z').toLocaleDateString('en-US', { timeZone: 'UTC', month: 'long', day: 'numeric' })}
                                                </span>
                                                <span className="text-gray-600">{holiday.description}</span>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleDeleteClick(holiday)}
                                            className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-50"
                                            aria-label={`Delete ${holiday.description}`}
                                            disabled={actionLoading}
                                        >
                                             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-center text-gray-500 py-6">No holidays found for {yearFilter}.</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            {holidayToDelete && (
                <ConfirmationModal
                    isOpen={isDeleteModalOpen}
                    onClose={() => setIsDeleteModalOpen(false)}
                    onConfirm={handleConfirmDelete}
                    title="Confirm Holiday Deletion"
                    message={`Are you sure you want to delete the holiday "${holidayToDelete.description}" on ${new Date(holidayToDelete.date + 'T00:00:00Z').toLocaleDateString('en-US', { timeZone: 'UTC' })}?`}
                    confirmText="Delete"
                />
            )}
        </>
    );
};

export default HolidayManagementPage;