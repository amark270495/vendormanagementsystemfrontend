import React, { useState, useEffect, useCallback, useMemo } from 'react';
import  { useAuth } from '../context/AuthContext';
import { apiService } from '../api/apiService';
import Spinner from '../components/Spinner';
import AttendanceCalendar from '../components/profile/AttendanceCalendar';
import LeaveRequestForm from '../components/profile/LeaveRequestForm';
import LeaveHistory from '../components/profile/LeaveHistory';
import React from 'react';

// --- ICONS (Defined externally for performance) ---
const CalendarIcon = ({ className = "h-5 w-5" }) => <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;
const QuotaIcon = ({ className = "h-5 w-5" }) => <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>;
const RequestIcon = ({ className = "h-5 w-5" }) => <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>;
const HistoryIcon = ({ className = "h-5 w-5" }) => <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const UserIcon = ({ className = "h-5 w-5" }) => <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>;
const IdCardIcon = ({ className = "h-5 w-5" }) => <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2" /></svg>;
const BriefcaseIcon = ({ className = "h-5 w-5" }) => <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.03 23.03 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>;
const CakeIcon = ({ className = "h-5 w-5" }) => <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 15.25v-4.25a2 2 0 00-2-2H5a2 2 0 00-2 2v4.25a2 2 0 002 2h14a2 2 0 002-2zM6 18v-3M9 18v-3M12 18v-3m3 0v3m3 0v-3m-15-4.5a.75.75 0 100-1.5.75.75 0 000 1.5zM18 10.5a.75.75 0 100-1.5.75.75 0 000 1.5zM9 10.5a.75.75 0 100-1.5.75.75 0 000 1.5zM15 10.5a.75.75 0 100-1.5.75.75 0 000 1.5zM12 10.5a.75.75 0 100-1.5.75.75 0 000 1.5zM6 9V6a3 3 0 013-3h6a3 3 0 013 3v3" /></svg>;
const PhoneIcon = ({ className = "h-5 w-5" }) => <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>;
const LocationIcon = ({ className = "h-5 w-5" }) => <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
const LinkIcon = ({ className = "h-5 w-5" }) => <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.102 1.101" /></svg>;
const HeartIcon = ({ className = "h-5 w-5" }) => <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 015.13-1.424l.89.445.89-.445a4.5 4.5 0 015.13 1.424A4.5 4.5 0 0119.682 11.5a4.5 4.5 0 01-1.424 5.13l-.445.89-.445.89a4.5 4.CM 0 01-5.13 1.424A4.5 4.5 0 0112 19.682a4.5 4.5 0 01-1.424-5.13l-.89-.445-.89-.445a4.5 4.5 0 01-1.424-5.13A4.5 4.5 0 014.318 6.318z" /></svg>;
const UsersIcon = ({ className = "h-5 w-5" }) => <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>;
const ChevronDownIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>;
const ChevronUpIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" /></svg>;
const EditIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.536L16.732 3.732z" /></svg>;
const SaveIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V3" /></svg>;
const CancelIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>;
const ProfileCardIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;

const AttendanceMarker = ({ selectedDate, onDateChange, onMarkAttendance, authUser }) => {
    const [statusInfo, setStatusInfo] =useState({ status: null, requestedStatus: null, isHoliday: false, isOnLeave: false, isWeekend: false, isLoading: true });
    const [actionLoading, setActionLoading] = useState(false);
    const [localError, setLocalError] = useState('');
    const [localSuccess, setLocalSuccess] = useState('');

    const todayDateString = new Intl.DateTimeFormat('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit', timeZone: 'UTC' }).format(new Date());

    const fetchStatusForDate = useCallback(async (dateString) => {
        if (!authUser?.userIdentifier || !dateString) {
            setStatusInfo({ status: null, requestedStatus: null, isHoliday: false, isOnLeave: false, isWeekend: false, isLoading: false });
            return;
        }
        setStatusInfo(prev => ({ ...prev, isLoading: true }));
        setLocalError('');
        setLocalSuccess('');

        try {
            const dateObj = new Date(dateString + 'T00:00:00Z');
            const dayOfWeek = dateObj.getUTCDay();
            const year = dateString.substring(0, 4);
            const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

            const [attendanceRes, holidayRes, leaveRes] = await Promise.all([
                apiService.getAttendance({ authenticatedUsername: authUser.userIdentifier, username: authUser.userIdentifier, startDate: dateString, endDate: dateString }).catch(err => null),
                apiService.getHolidays({ authenticatedUsername: authUser.userIdentifier, year: year }).catch(err => null),
                apiService.getLeaveRequests({ authenticatedUsername: authUser.userIdentifier, targetUsername: authUser.userIdentifier, statusFilter: 'Approved', startDateFilter: dateString, endDateFilter: dateString }).catch(err => null)
            ]);

            let status = null;
            let requestedStatus = null;
            let isHoliday = false;
            let isOnLeave = false;
            let holidayDescription = '';

            if (holidayRes?.data?.success && Array.isArray(holidayRes.data.holidays)) {
                 const holiday = holidayRes.data.holidays.find(h => h.date === dateString);
                 if (holiday) {
                     isHoliday = true;
                     holidayDescription = holiday.description;
                     status = 'Holiday';
                 }
            }

            if (leaveRes?.data?.success && Array.isArray(leaveRes.data.requests) && leaveRes.data.requests.length > 0) {
                 isOnLeave = true;
                 status = 'On Leave';
            }

            if (attendanceRes?.data?.success && Array.isArray(attendanceRes.data.attendanceRecords) && attendanceRes.data.attendanceRecords.length > 0) {
                const record = attendanceRes.data.attendanceRecords[0];
                 if (status === null && !isWeekend) {
                     status = record.status;
                     requestedStatus = record.requestedStatus || null;
                 } else if (record.status === 'Pending' && status === null && !isWeekend) {
                     status = 'Pending';
                     requestedStatus = record.requestedStatus || null;
                 }
            }

            if (status === null && isWeekend) {
                 status = 'Weekend';
            }

            setStatusInfo({
                status: status,
                requestedStatus: requestedStatus,
                isHoliday: isHoliday,
                isOnLeave: isOnLeave,
                isWeekend: isWeekend,
                isLoading: false,
                holidayDescription: holidayDescription
            });

        } catch (err) {
            console.error(`Error fetching status for ${dateString}:`, err);
            setLocalError(`Failed to load status for ${dateString}.`);
            setStatusInfo({ status: null, requestedStatus: null, isHoliday: false, isOnLeave: false, isWeekend: false, isLoading: false });
        }
    }, [authUser]);

    useEffect(() => {
        fetchStatusForDate(selectedDate);
    }, [selectedDate, fetchStatusForDate]);

    const handleMark = async (requested) => {
        setActionLoading(true);
        setLocalError('');
        setLocalSuccess('');
        try {
            await onMarkAttendance(selectedDate, requested);
            fetchStatusForDate(selectedDate);
            setLocalSuccess(`Attendance request for ${formatDateDisplay(selectedDate)} submitted.`);
             setTimeout(() => setLocalSuccess(''), 4000);
        } catch (err) {
            setLocalError(err.message || "Failed to submit request.");
        } finally {
            setActionLoading(false);
        }
    };

    const canMarkSelectedDate = !statusInfo.isLoading && !actionLoading && !statusInfo.isWeekend && !statusInfo.isHoliday && !statusInfo.isOnLeave && statusInfo.status !== 'Present' && statusInfo.status !== 'Absent' && statusInfo.status !== 'Rejected';
    const isFutureDate = selectedDate > todayDateString;

    const formatDateDisplay = (dateStr) => {
        return new Date(dateStr + 'T00:00:00Z').toLocaleDateString('en-US', { timeZone: 'UTC', weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
             <h3 className="text-lg font-semibold mb-4 text-gray-800 flex items-center"><CalendarIcon className="h-5 w-5 mr-2 text-indigo-500" /> Mark Your Attendance</h3>
            <div className="text-center">
                <div className="mb-4">
                    <label htmlFor="attendanceDate" className="block text-sm font-medium text-gray-700 mb-1">Select Date:</label>
                    <input
                        type="date"
                        id="attendanceDate"
                        value={selectedDate}
                        onChange={(e) => onDateChange(e.target.value)}
                        max={todayDateString}
                        className="w-full sm:w-auto px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                </div>
                <p className="text-sm font-medium text-gray-500 mb-3">
                    Status for {formatDateDisplay(selectedDate)}
                </p>
                <div className="min-h-[40px] flex justify-center items-center mb-4">
                    {statusInfo.isLoading ? (
                        <Spinner size="8" />
                    ) : statusInfo.status ? (
                        <span className={`px-4 py-2 text-base font-bold rounded-full shadow-sm ${
                            statusInfo.status === 'Present' ? 'bg-green-100 text-green-800 ring-1 ring-green-200' :
                            statusInfo.status === 'Absent' || statusInfo.status === 'Rejected' ? 'bg-red-100 text-red-800 ring-1 ring-red-200' :
                            statusInfo.status === 'On Leave' ? 'bg-purple-100 text-purple-800 ring-1 ring-purple-200' :
                            statusInfo.status === 'Pending' ? 'bg-yellow-100 text-yellow-800 ring-1 ring-yellow-200' :
                            'bg-gray-100 text-gray-700 ring-1 ring-gray-200'
                        }`}>
                            {statusInfo.status === 'Pending' ? `Pending (${statusInfo.requestedStatus})` : statusInfo.status}
                            {statusInfo.isHoliday ? ` (${statusInfo.holidayDescription})` : ''}
                        </span>
                    ) : (
                        <span className="text-base text-gray-500 italic font-semibold">Not Marked</span>
                    )}
                </div>
                 {canMarkSelectedDate && !isFutureDate && (
                     <div className="mt-4 space-x-3 flex justify-center">
                         <button
                             onClick={() => handleMark('Present')}
                             className="px-5 py-2 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700 shadow transition disabled:opacity-50"
                             disabled={actionLoading}
                        >
                            {actionLoading ? <Spinner size="4" /> : 'Mark Present'}
                         </button>
                         <button
                             onClick={() => handleMark('Absent')}
                             className="px-5 py-2 bg-red-600 text-white text-sm font-semibold rounded-lg hover:bg-red-700 shadow transition disabled:opacity-50"
                             disabled={actionLoading}
                        >
                             {actionLoading ? <Spinner size="4" /> : 'Mark Absent'}
                         </button>
                     </div>
                )}
                 {isFutureDate && <p className="mt-4 text-xs text-gray-500">Cannot mark attendance for future dates.</p>}
                 {!canMarkSelectedDate && !isFutureDate && !statusInfo.isLoading && statusInfo.status !== null && (
                     <p className="mt-4 text-sm text-gray-500">Attendance status is final or not applicable for this date.</p>
                 )}
                 {localError && <p className="mt-4 text-sm text-red-600">{localError}</p>}
                 {localSuccess && <p className="mt-4 text-sm text-green-600">{localSuccess}</p>}
            </div>
        </div>
    );
};

const formatDateForInput = (dateString) => {
    if (!dateString) return '';
    try {
        const date = new Date(dateString);
        const userTimezoneOffset = date.getTimezoneOffset() * 60000;
        const adjustedDate = new Date(date.getTime() + userTimezoneOffset);
        return adjustedDate.toISOString().split('T')[0];
    } catch (e) {
        console.warn("Invalid date for input formatting:", dateString);
        return '';
    }
};

// --- NEW LOCAL HELPER COMPONENTS ---

const PageHeader = ({ user, isEditing, onEditClick, onCancelClick, onSaveClick, editLoading }) => (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
            <h1 className="text-3xl font-bold text-gray-800">My Profile & Attendance</h1>
            <p className="mt-1 text-gray-600">Welcome, {user?.firstName || user?.userName}!</p>
        </div>
        <div>
            {isEditing ? (
                <div className="flex space-x-3">
                    <button
                        onClick={onCancelClick}
                        className="px-5 py-2 bg-white text-gray-700 font-semibold rounded-lg border border-gray-300 hover:bg-gray-100 transition shadow-sm flex items-center"
                        disabled={editLoading}
                    >
                        <CancelIcon />
                    </button>
                    <button
                        type="submit" // Triggers the form's onSubmit
                        className="px-5 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 flex items-center justify-center w-32 transition-colors shadow-md disabled:bg-green-400"
                        disabled={editLoading}
                    >
                        {editLoading ? <Spinner size="5" /> : <SaveIcon />}
                    </button>
                </div>
            ) : (
                <button
                    onClick={onEditClick}
                    className="px-5 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition shadow-sm flex items-center"
                >
                    <EditIcon />
                    Edit Profile
                </button>
            )}
        </div>
    </div>
);

const ProfileCard = ({ user, isEditing, formData, onFormChange, allUsers, isExpanded, onToggleExpand }) => {
    // Dropdown options
    const employmentTypes = ['Full-Time', 'Part-Time', 'Contractor (C2C)', 'Contractor (1099)'];
    const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
    const relations = ['Spouse', 'Parent', 'Sibling', 'Child', 'Other'];

    // Local helper components for View/Edit fields
    const ViewItem = ({ label, value, icon }) => (
        <div className="space-y-1">
            <label className="text-sm font-medium text-gray-500 flex items-center">{icon} {label}</label>
            <p className="text-md font-semibold text-gray-700 min-h-[28px] break-words">
                {value || <span className="text-gray-400 italic">N/A</span>}
            </p>
        </div>
    );

    const EditInput = ({ label, name, type = 'text', icon, value, onChange }) => (
        <div className="space-y-1">
            <label htmlFor={name} className="text-sm font-medium text-gray-500 flex items-center">{icon} {label}</label>
            <input
                type={type}
                name={name}
                id={name}
                value={value || ''}
                onChange={onChange}
                className="w-full p-2 border border-gray-300 rounded-md shadow-sm"
            />
        </div>
    );
    
    const EditSelect = ({ label, name, icon, value, onChange, options }) => (
        <div className="space-y-1">
            <label htmlFor={name} className="text-sm font-medium text-gray-500 flex items-center">{icon} {label}</label>
            <select
                name={name}
                id={name}
                value={value || ''}
                onChange={onChange}
                className="w-full p-2 border border-gray-300 rounded-md shadow-sm bg-white h-[42px]"
            >
                <option value="">Select...</option>
                {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
        </div>
    );

    const EditReadOnly = ({ label, value, icon, title = "" }) => (
         <div className="space-y-1">
            <label className="text-sm font-medium text-gray-500 flex items-center">{icon} {label}</label>
            <p className="text-md font-semibold text-gray-700 min-h-[28px] p-2 bg-gray-100 rounded-md border border-gray-200" title={title}>
                {value || <span className="text-gray-400 italic">N/A</span>}
            </p>
        </div>
    );

    return (
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
            {/* --- Card Header --- */}
            <div className="flex items-center p-6 space-x-4 bg-indigo-50 border-b border-indigo-200">
                <span className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-white text-3xl flex-shrink-0 shadow-lg ring-4 ring-white">
                    {user?.firstName?.charAt(0) || user?.userName?.charAt(0) || '?'}
                </span>
                <div>
                    {isEditing ? (
                        <div className="flex items-center gap-2">
                            <input type="text" name="firstName" placeholder="First" value={formData.firstName} onChange={onFormChange} className="p-2 border border-gray-300 rounded-md shadow-sm text-xl font-bold" />
                            <input type="text" name="lastName" placeholder="Last" value={formData.lastName} onChange={onFormChange} className="p-2 border border-gray-300 rounded-md shadow-sm text-xl font-bold" />
                        </div>
                    ) : (
                        <h2 className="text-2xl font-bold text-gray-900">{user?.userName || 'User Name'}</h2>
                    )}
                    <p className="text-sm text-gray-600">{user?.backendOfficeRole || 'Role not specified'}</p>
                </div>
            </div>

            {/* --- Always Visible Section --- */}
            <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-6">
                <ViewItem label="Username (Email)" icon={<UserIcon className="h-4 w-4 mr-1 text-gray-400" />} value={user?.userIdentifier} />
                <ViewItem label="Date of Joining" icon={<CalendarIcon className="h-4 w-4 mr-1 text-gray-400" />} value={formatDateForInput(user?.dateOfJoining)} />
                {isEditing ? (
                    <EditInput label="Personal Mobile" name="personalMobileNumber" icon={<PhoneIcon className="h-4 w-4 mr-1 text-gray-400" />} value={formData.personalMobileNumber} onChange={onFormChange} />
                ) : (
                    <ViewItem label="Personal Mobile" icon={<PhoneIcon className="h-4 w-4 mr-1 text-gray-400" />} value={user?.personalMobileNumber} />
                )}
            </div>

            {/* --- Collapsible Section --- */}
            <div className={`transition-all duration-500 ease-in-out ${isExpanded || isEditing ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}>
                <div className="p-6 border-t border-gray-100 space-y-8">
                    {/* Personal & Employment Info */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-6">
                        {isEditing ? (
                            <EditInput label="Date of Birth" name="dateOfBirth" type="date" icon={<CakeIcon className="h-4 w-4 mr-1 text-gray-400" />} value={formData.dateOfBirth} onChange={onFormChange} />
                        ) : (
                            <ViewItem label="Date of Birth" icon={<CakeIcon className="h-4 w-4 mr-1 text-gray-400" />} value={formatDateForInput(user?.dateOfBirth)} />
                        )}
                        {isEditing ? (
                            <EditSelect label="Blood Group" name="bloodGroup" icon={<HeartIcon className="h-4 w-4 mr-1 text-gray-400" />} value={formData.bloodGroup} onChange={onFormChange} options={bloodGroups} />
                        ) : (
                            <ViewItem label="Blood Group" icon={<HeartIcon className="h-4 w-4 mr-1 text-gray-400" />} value={user?.bloodGroup} />
                        )}
                        <EditReadOnly label="Employee Code" icon={<IdCardIcon className="h-4 w-4 mr-1 text-gray-400" />} value={user?.employeeCode} />
                        <EditReadOnly label="Employment Type" icon={<BriefcaseIcon className="h-4 w-4 mr-1 text-gray-400" />} value={user?.employmentType} title="This field can only be changed by an admin." />
                        <EditReadOnly label="Work Location" icon={<LocationIcon className="h-4 w-4 mr-1 text-gray-400" />} value={user?.workLocation} title="This field can only be changed by an admin." />
                        <EditReadOnly label="Reports To" icon={<UsersIcon className="h-4 w-4 mr-1 text-gray-400" />} value={user?.reportsTo} title="This field can only be changed by an admin." />
                        {isEditing ? (
                            <EditInput label="LinkedIn Profile" name="linkedInProfile" type="url" icon={<LinkIcon className="h-4 w-4 mr-1 text-gray-400" />} value={formData.linkedInProfile} onChange={onFormChange} />
                        ) : (
                            <ViewItem label="LinkedIn Profile" icon={<LinkIcon className="h-4 w-4 mr-1 text-gray-400" />} value={user?.linkedInProfile} />
                        )}
                        <div className="md:col-span-3">
                            {isEditing ? (
                                <div className="space-y-1">
                                    <label htmlFor="currentAddress" className="text-sm font-medium text-gray-500 flex items-center"><LocationIcon className="h-4 w-4 mr-1 text-gray-400" /> Current Address</label>
                                    <textarea name="currentAddress" id="currentAddress" value={formData.currentAddress} onChange={onFormChange} rows="3" className="w-full p-2 border border-gray-300 rounded-md shadow-sm" />
                                </div>
                            ) : (
                                <ViewItem label="Current Address" icon={<LocationIcon className="h-4 w-4 mr-1 text-gray-400" />} value={user?.currentAddress} />
                            )}
                        </div>
                    </div>
                    
                    {/* Emergency Contact */}
                    <div className="pt-6 border-t border-gray-100">
                         <h3 className="text-lg font-semibold text-gray-800 mb-4">Emergency Contact</h3>
                         <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-6">
                            {isEditing ? (
                                <EditInput label="Contact Name" name="emergencyContactName" icon={<UserIcon className="h-4 w-4 mr-1 text-gray-400" />} value={formData.emergencyContactName} onChange={onFormChange} />
                            ) : (
                                <ViewItem label="Contact Name" icon={<UserIcon className="h-4 w-4 mr-1 text-gray-400" />} value={user?.emergencyContactName} />
                            )}
                            {isEditing ? (
                                <EditInput label="Contact Phone" name="emergencyContactPhone" type="tel" icon={<PhoneIcon className="h-4 w-4 mr-1 text-gray-400" />} value={formData.emergencyContactPhone} onChange={onFormChange} />
                            ) : (
                                <ViewItem label="Contact Phone" icon={<PhoneIcon className="h-4 w-4 mr-1 text-gray-400" />} value={user?.emergencyContactPhone} />
                            )}
                            {isEditing ? (
                                <EditSelect label="Relation" name="emergencyContactRelation" icon={<UsersIcon className="h-4 w-4 mr-1 text-gray-400" />} value={formData.emergencyContactRelation} onChange={onFormChange} options={relations} />
                            ) : (
                                <ViewItem label="Relation" icon={<UsersIcon className="h-4 w-4 mr-1 text-gray-400" />} value={user?.emergencyContactRelation} />
                            )}
                         </div>
                    </div>
                </div>
            </div>

            {/* --- Card Footer --- */}
            <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-center">
                <button
                    type="button"
                    onClick={onToggleExpand}
                    className="text-sm font-semibold text-indigo-600 hover:text-indigo-800 flex items-center"
                >
                    {isExpanded ? 'Show Less' : 'Show More Details'}
                    {isExpanded ? <ChevronUpIcon /> : <ChevronDownIcon />}
                </button>
            </div>
        </div>
    );
};

// --- Main Page Component ---
const ProfilePage = () => {
    const { user, login: updateUserInContext } = useAuth();
    
    const [leaveQuota, setLeaveQuota] = useState(null);
    const [leaveHistory, setLeaveHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    
    const [selectedDate, setSelectedDate] = useState(
        new Intl.DateTimeFormat('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit', timeZone: 'UTC' }).format(new Date())
    );
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const [isEditing, setIsEditing] = useState(false);
    const [editLoading, setEditLoading] = useState(false);
    const [formData, setFormData] = useState({});
    const [isExpanded, setIsExpanded] = useState(false);
    const [allUsers, setAllUsers] = useState([]);

    useEffect(() => {
        if (isEditing && user?.userIdentifier) {
            apiService.getUsers(user.userIdentifier)
                .then(res => {
                    if (res.data.success) {
                        setAllUsers(res.data.users.filter(u => u.username !== user.userIdentifier));
                    }
                })
                .catch(err => console.error("Failed to fetch users for 'Reports To' dropdown", err));
        }
    }, [isEditing, user?.userIdentifier]);

    useEffect(() => {
        if (user) {
            setFormData({
                firstName: user.firstName || '',
                lastName: user.lastName || '',
                middleName: user.middleName || '',
                dateOfBirth: formatDateForInput(user.dateOfBirth),
                dateOfJoining: formatDateForInput(user.dateOfJoining),
                employmentType: user.employmentType || 'Full-Time',
                workLocation: user.workLocation || '',
                reportsTo: user.reportsTo || '',
                personalMobileNumber: user.personalMobileNumber || '',
                currentAddress: user.currentAddress || '',
                emergencyContactName: user.emergencyContactName || '',
                emergencyContactPhone: user.emergencyContactPhone || '',
                emergencyContactRelation: user.emergencyContactRelation || 'Other',
                bloodGroup: user.bloodGroup || '',
                linkedInProfile: user.linkedInProfile || '',
            });
        }
    }, [user]);

    const initialMonthString = selectedDate.substring(0, 7);
    const [calendarRefreshKey, setCalendarRefreshKey] = useState(Date.now());
    const refreshCalendar = () => setCalendarRefreshKey(Date.now());

    const fetchLeaveHistory = useCallback(async () => {
        if (!user?.userIdentifier) return;
        try {
             const leaveRes = await apiService.getLeaveRequests({
                 authenticatedUsername: user.userIdentifier,
                 targetUsername: user.userIdentifier
             });
             if (leaveRes.data.success && Array.isArray(leaveRes.data.requests)) {
                 setLeaveHistory(leaveRes.data.requests);
             } else {
                 setLeaveHistory([]);
             }
        } catch (err) {
             console.error("Error fetching leave history:", err);
             setLeaveHistory([]);
        }
    }, [user?.userIdentifier]);

    const loadInitialData = useCallback(async () => {
        if (!user?.userIdentifier) {
            setError("User not identified. Cannot load profile data.");
            setLoading(false);
            return;
        }
        setLoading(true);
        setError('');
        try {
            const configRes = await apiService.getLeaveConfig({ authenticatedUsername: user.userIdentifier, targetUsername: user.userIdentifier });
            if (configRes?.data?.success && configRes.data.config) {
                setLeaveQuota(configRes.data.config);
            } else {
                 setLeaveQuota(null);
            }
            await fetchLeaveHistory();
        } catch (err) {
            console.error("Could not load initial profile data:", err);
            setError(`Could not load initial profile data. Please try again later.`);
            setLeaveQuota(null);
            setLeaveHistory([]);
        } finally {
            setLoading(false);
        }
    }, [user?.userIdentifier, fetchLeaveHistory]);

    useEffect(() => {
        loadInitialData();
    }, [loadInitialData]);

    const handleMarkAttendance = async (dateToMark, requestedStatus) => {
        try {
            const response = await apiService.markAttendance({
                authenticatedUsername: user.userIdentifier,
                date: dateToMark,
                requestedStatus: requestedStatus
            });
            if (response.data.success) {
                refreshCalendar();
            } else {
                throw new Error(response.data.message);
            }
        } catch (err) {
             const errorMsg = err.response?.data?.message || err.message || `Failed to submit attendance request.`;
             console.error("Error in handleMarkAttendance:", errorMsg)
             throw new Error(errorMsg);
        }
    };

    const handleLeaveRequested = () => {
        fetchLeaveHistory();
        refreshCalendar();
    };

    const handleDateChange = (newDate) => {
        setSelectedDate(newDate);
    };

    const handleFormChange = (e) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSaveChanges = async (e) => {
        e.preventDefault();
        setEditLoading(true);
        setError('');
        setSuccess('');

        try {
            const payload = {
                firstName: formData.firstName,
                lastName: formData.lastName,
                middleName: formData.middleName,
                dateOfBirth: formData.dateOfBirth,
                personalMobileNumber: formData.personalMobileNumber,
                currentAddress: formData.currentAddress,
                emergencyContactName: formData.emergencyContactName,
                emergencyContactPhone: formData.emergencyContactPhone,
                emergencyContactRelation: formData.emergencyContactRelation,
                bloodGroup: formData.bloodGroup,
                linkedInProfile: formData.linkedInProfile
            };
            
            const adminPayload = {
                dateOfJoining: formData.dateOfJoining,
                employmentType: formData.employmentType,
                workLocation: formData.workLocation,
                reportsTo: formData.reportsTo,
            };

            const response = await apiService.updateUser(user.userIdentifier, { ...payload, ...adminPayload }, user.userIdentifier);

            if (response.data.success) {
                setSuccess("Profile updated successfully!");
                updateUserInContext(response.data.userData);
                setIsEditing(false);
                setIsExpanded(false); // Collapse on save
                setTimeout(() => setSuccess(''), 3000);
            } else {
                setError(response.data.message || "Failed to update profile.");
            }
        } catch (err) {
             setError(err.response?.data?.message || "An unexpected error occurred.");
        } finally {
             setEditLoading(false);
        }
    };
    
    const handleCancelEdit = () => {
        setIsEditing(false);
        setIsExpanded(false); // Collapse on cancel
        if (user) {
            setFormData({
                firstName: user.firstName || '',
                lastName: user.lastName || '',
                middleName: user.middleName || '',
                dateOfBirth: formatDateForInput(user.dateOfBirth),
                dateOfJoining: formatDateForInput(user.dateOfJoining),
                personalMobileNumber: user.personalMobileNumber || '',
                currentAddress: user.currentAddress || '',
                emergencyContactName: user.emergencyContactName || '',
                emergencyContactPhone: user.emergencyContactPhone || '',
                emergencyContactRelation: user.emergencyContactRelation || 'Other',
                bloodGroup: user.bloodGroup || '',
                employmentType: user.employmentType || 'Full-Time',
                reportsTo: user.reportsTo || '',
                workLocation: user.workLocation || '',
                linkedInProfile: user.linkedInProfile || '',
            });
        }
        setError('');
        setSuccess('');
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-[70vh]">
                <Spinner size="12" />
                <p className="ml-4 text-gray-600">Loading your profile...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8">
             <form onSubmit={handleSaveChanges}>
                <PageHeader 
                    user={user} 
                    isEditing={isEditing} 
                    onEditClick={() => { setIsEditing(true); setIsExpanded(true); }}
                    onCancelClick={handleCancelEdit}
                    onSaveClick={handleSaveChanges}
                    editLoading={editLoading}
                />

                {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 animate-shake">{error}</div>}
                {success && <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4 animate-fadeIn">{success}</div>}
                
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* --- MAIN COLUMN (Left) --- */}
                    <div className="lg:col-span-2 space-y-8">
                        <ProfileCard 
                            user={user}
                            isEditing={isEditing}
                            formData={formData}
                            onFormChange={handleFormChange}
                            allUsers={allUsers}
                            isExpanded={isExpanded}
                            onToggleExpand={() => setIsExpanded(!isExpanded)}
                        />
                        <AttendanceMarker
                            selectedDate={selectedDate}
                            onDateChange={handleDateChange}
                            onMarkAttendance={handleMarkAttendance}
                            authUser={user} 
                        />
                        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
                             <h3 className="text-xl font-semibold mb-4 text-gray-800 flex items-center"><CalendarIcon className="h-5 w-5 mr-2 text-indigo-500" /> Attendance Calendar</h3>
                             <AttendanceCalendar initialMonthString={initialMonthString} key={calendarRefreshKey} />
                        </div>
                    </div>

                    {/* --- SIDEBAR (Right) --- */}
                    <div className="lg:col-span-1 space-y-8">
                        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
                            <h3 className="text-lg font-semibold mb-4 text-gray-800 flex items-center"><QuotaIcon className="text-blue-500" /> Leave Quota (Annual)</h3>
                            {leaveQuota ? (
                                <div className="text-sm space-y-3">
                                    <p className="flex justify-between"><span>Sick Leave:</span> <span className="font-bold text-gray-700">{leaveQuota.sickLeave ?? 'N/A'} days</span></p>
                                    <p className="flex justify-between"><span>Casual Leave:</span> <span className="font-bold text-gray-700">{leaveQuota.casualLeave ?? 'N/A'} days</span></p>
                                </div>
                            ) : (
                                <p className="text-sm text-gray-500 italic">Leave quotas not set.</p>
                            )}
                        </div>
                        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
                             <h3 className="text-lg font-semibold text-gray-800 flex items-center"><RequestIcon className="text-purple-500" /> Request Leave</h3>
                            <LeaveRequestForm onLeaveRequested={handleLeaveRequested} />
                        </div>
                        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
                            <h3 className="text-lg font-semibold text-gray-800 flex items-center"><HistoryIcon className="text-teal-500" /> Leave History</h3>
                             <LeaveHistory leaveHistory={leaveHistory} />
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default ProfilePage;