import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../api/apiService';
import Spinner from '../components/Spinner';
import AttendanceCalendar from '../components/profile/AttendanceCalendar';
import LeaveRequestForm from '../components/profile/LeaveRequestForm';
import LeaveHistory from '../components/profile/LeaveHistory';

// --- Helper Components & Icons ---
const CalendarIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;
const QuotaIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>;
const RequestIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>;
const HistoryIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1 text-teal-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const UserIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>;
const IdCardIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2" /></svg>;
const BriefcaseIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.03 23.03 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>;
const CakeIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 15.25v-4.25a2 2 0 00-2-2H5a2 2 0 00-2 2v4.25a2 2 0 002 2h14a2 2 0 002-2zM6 18v-3M9 18v-3M12 18v-3m3 0v3m3 0v-3m-15-4.5a.75.75 0 100-1.5.75.75 0 000 1.5zM18 10.5a.75.75 0 100-1.5.75.75 0 000 1.5zM9 10.5a.75.75 0 100-1.5.75.75 0 000 1.5zM15 10.5a.75.75 0 100-1.5.75.75 0 000 1.5zM12 10.5a.75.75 0 100-1.5.75.75 0 000 1.5zM6 9V6a3 3 0 013-3h6a3 3 0 013 3v3" /></svg>;
const PhoneIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>;
const LocationIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
const LinkIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.102 1.101" /></svg>;
const HeartIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 015.13-1.424l.89.445.89-.445a4.5 4.5 0 015.13 1.424A4.5 4.5 0 0119.682 11.5a4.5 4.5 0 01-1.424 5.13l-.445.89-.445.89a4.5 4.5 0 01-5.13 1.424A4.5 4.5 0 0112 19.682a4.5 4.5 0 01-1.424-5.13l-.89-.445-.89-.445a4.5 4.5 0 01-1.424-5.13A4.5 4.5 0 014.318 6.318z" /></svg>;
const UsersIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>;
const ChevronDownIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-1 transition-transform duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>;
const ChevronUpIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-1 transition-transform duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" /></svg>;
const LaptopIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>;


// ✅ NEW HELPER: Gets the IST Date String aligned with the 12:00 PM Noon Night Shift Cutoff
const getISTShiftDateString = () => {
    const d = new Date();
    
    // 1. Get the current hour in IST
    const istFormatter = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Kolkata',
        hour: 'numeric',
        hour12: false
    });
    const istHour = parseInt(istFormatter.format(d), 10);
    
    // 2. If it is before 12:00 PM Noon IST, it belongs to the previous calendar day's shift
    if (istHour < 12) {
        d.setHours(d.getHours() - 12); // Safely push the underlying time back 12 hours
    }
    
    // 3. Return the Date in YYYY-MM-DD format using IST timezone
    return new Intl.DateTimeFormat('en-CA', { 
        timeZone: 'Asia/Kolkata',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    }).format(d);
};


// --- UPDATED Attendance Marker Component ---
const AttendanceMarker = ({ selectedDate, onDateChange, onMarkAttendance, authUser }) => {
    const [statusInfo, setStatusInfo] = useState({ 
        status: null, 
        requestedStatus: null, 
        isHoliday: false, 
        isOnLeave: false, 
        isWeekend: false, 
        isLoading: true,
        holidayDescription: '' 
    });
    const [actionLoading, setActionLoading] = useState(false);
    const [localError, setLocalError] = useState('');
    const [localSuccess, setLocalSuccess] = useState('');
    
    // States for reason input and weekend requests
    const [reason, setReason] = useState('');
    const [showWeekendRequest, setShowWeekendRequest] = useState(false);

    // ✅ FIXED: Using the new Shift helper instead of UTC
    const todayDateString = getISTShiftDateString();

    const fetchStatusForDate = useCallback(async (dateString) => {
        const userId = authUser?.userIdentifier;
        
        if (!userId || !dateString) {
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
                apiService.getAttendance({ authenticatedUsername: userId, username: userId, startDate: dateString, endDate: dateString })
                    .catch(err => { console.error("Attendance fetch error:", err); return null; }),
                apiService.getHolidays({ authenticatedUsername: userId, year: year })
                    .catch(err => { console.error("Holiday fetch error:", err); return null; }),
                apiService.getLeaveRequests({ authenticatedUsername: userId, targetUsername: userId, statusFilter: 'Approved', startDateFilter: dateString, endDateFilter: dateString })
                    .catch(err => { console.error("Leave fetch error:", err); return null; })
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
    }, [authUser?.userIdentifier]); 

    useEffect(() => {
        fetchStatusForDate(selectedDate);
        setShowWeekendRequest(false);
        setReason('');
        setLocalError('');
        setLocalSuccess('');
    }, [selectedDate, fetchStatusForDate]);

    const handleMark = async (requested) => {
        setActionLoading(true);
        setLocalError('');
        setLocalSuccess('');
        try {
            await onMarkAttendance(selectedDate, requested, ""); 
            fetchStatusForDate(selectedDate);
            setLocalSuccess(`Attendance request for ${formatDateDisplay(selectedDate)} submitted.`);
             setTimeout(() => setLocalSuccess(''), 4000);
        } catch (err) {
            const errorMessage = err.message || "Failed to submit request.";
            setLocalError(errorMessage);
            
            if (errorMessage.toLowerCase().includes("approved leave")) {
                setStatusInfo(prev => ({
                    ...prev,
                    status: 'On Leave',
                    isOnLeave: true
                }));
            }
            else if (errorMessage.toLowerCase().includes("holiday")) {
                setStatusInfo(prev => ({
                    ...prev,
                    status: 'Holiday',
                    isHoliday: true
                }));
            }
        } finally {
            setActionLoading(false);
        }
    };

    const handleWeekendRequestSubmit = async () => {
        if (!reason.trim()) {
            setLocalError("Please provide a business justification for working this weekend.");
            return;
        }
        setActionLoading(true);
        setLocalError('');
        setLocalSuccess('');
        try {
            await apiService.requestWeekendWork({
                authenticatedUsername: authUser.userIdentifier,
                date: selectedDate,
                reason: reason
            });
            setLocalSuccess(`Weekend work approval requested for ${formatDateDisplay(selectedDate)}.`);
            setReason('');
            setShowWeekendRequest(false);
            setTimeout(() => setLocalSuccess(''), 4000);
        } catch (err) {
            setLocalError(err.message || "Failed to submit weekend request.");
        } finally {
            setActionLoading(false);
        }
    };

    const canMarkSelectedDate = !statusInfo.isLoading && !actionLoading && !statusInfo.isWeekend && !statusInfo.isHoliday && !statusInfo.isOnLeave && statusInfo.status !== 'Present' && statusInfo.status !== 'Absent' && statusInfo.status !== 'Rejected';
    const isFutureDate = selectedDate > todayDateString;

    const formatDateDisplay = (dateStr) => {
        if (!dateStr) return '';
        const date = new Date(dateStr + 'T00:00:00Z');
        if (isNaN(date.getTime())) return '';
        return date.toLocaleDateString('en-US', { timeZone: 'UTC', weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
    };

    return (
        <div className="bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-6 sm:p-8 rounded-2xl shadow-lg border border-indigo-100/60 text-center relative overflow-hidden">
            {/* Subtle background decoration */}
            <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-indigo-100 rounded-full blur-3xl opacity-50 pointer-events-none"></div>
            
            <div className="mb-5 relative z-10">
                <label htmlFor="attendanceDate" className="block text-sm font-semibold text-gray-700 mb-2">Select Date</label>
                <input
                    type="date"
                    id="attendanceDate"
                    value={selectedDate}
                    onChange={(e) => onDateChange(e.target.value)}
                    max={todayDateString}
                    className="w-full sm:w-auto px-4 py-2.5 border border-indigo-200 text-indigo-900 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white/80 backdrop-blur-sm transition-all hover:bg-white cursor-pointer"
                />
            </div>
            
            <p className="text-sm font-medium text-indigo-800 mb-4 relative z-10">
                Status for {formatDateDisplay(selectedDate)}
            </p>
            
            <div className="min-h-[40px] flex justify-center items-center mb-6 relative z-10">
                {statusInfo.isLoading ? (
                    <Spinner size="8" />
                ) : statusInfo.status ? (
                    <span className={`px-5 py-2.5 text-sm font-bold rounded-full shadow-sm tracking-wide ${
                        statusInfo.status === 'Present' ? 'bg-green-100/80 text-green-800 border border-green-200' :
                        statusInfo.status === 'Absent' || statusInfo.status === 'Rejected' ? 'bg-red-100/80 text-red-800 border border-red-200' :
                        statusInfo.status === 'On Leave' ? 'bg-purple-100/80 text-purple-800 border border-purple-200' :
                        statusInfo.status === 'Pending' ? 'bg-yellow-100/80 text-yellow-800 border border-yellow-200' :
                        statusInfo.status === 'Holiday' ? 'bg-pink-100/80 text-pink-800 border border-pink-200' :
                        'bg-gray-100/80 text-gray-700 border border-gray-200'
                    }`}>
                        {statusInfo.status === 'Pending' ? `Pending (${statusInfo.requestedStatus})` : 
                         (statusInfo.status === 'Present' && statusInfo.requestedStatus === 'System Auto-Marked') ? '✅ Auto-Marked Present' : 
                         statusInfo.status}
                        {statusInfo.isHoliday ? ` (${statusInfo.holidayDescription || 'Holiday'})` : ''}
                    </span>
                ) : (
                    <span className="text-base text-gray-500 italic font-semibold px-4 py-2 bg-gray-50/50 rounded-full border border-gray-100">Not Marked</span>
                )}
            </div>
            
             {canMarkSelectedDate && !isFutureDate && (
                 <div className="mt-2 flex flex-col items-center relative z-10">
                     <div className="flex gap-4 justify-center w-full">
                         <button
                             onClick={() => handleMark('Present')}
                             className="px-6 py-2.5 bg-green-600 text-white text-sm font-bold rounded-xl hover:bg-green-500 hover:shadow-lg hover:-translate-y-0.5 shadow-md transition-all duration-200 disabled:opacity-50 disabled:hover:translate-y-0"
                             disabled={actionLoading}
                         >
                             {actionLoading ? <Spinner size="4" /> : 'Mark Present'}
                         </button>
                         <button
                             onClick={() => handleMark('Absent')}
                             className="px-6 py-2.5 bg-red-600 text-white text-sm font-bold rounded-xl hover:bg-red-500 hover:shadow-lg hover:-translate-y-0.5 shadow-md transition-all duration-200 disabled:opacity-50 disabled:hover:translate-y-0"
                             disabled={actionLoading}
                         >
                             {actionLoading ? <Spinner size="4" /> : 'Mark Absent'}
                         </button>
                     </div>
                 </div>
             )}

             {statusInfo.isWeekend && !isFutureDate && !statusInfo.isLoading && statusInfo.status === 'Weekend' && (
                 <div className="mt-4 flex flex-col items-center relative z-10">
                     {!showWeekendRequest ? (
                         <button
                             onClick={() => setShowWeekendRequest(true)}
                             className="px-6 py-2.5 bg-white text-indigo-700 border border-indigo-200 text-sm font-bold rounded-xl hover:bg-indigo-50 hover:shadow-md transition-all duration-200"
                         >
                             Request Approval for Weekend Work
                         </button>
                     ) : (
                         <div className="w-full sm:w-4/5 flex flex-col items-center animate-fadeIn bg-white/60 p-4 rounded-xl border border-indigo-100">
                             <p className="text-sm text-gray-700 mb-3 font-semibold">Why do you need to work this weekend?</p>
                             <textarea
                                 value={reason}
                                 onChange={(e) => { setReason(e.target.value); }}
                                 placeholder="Enter business justification..."
                                 className={`w-full px-4 py-3 text-sm border border-indigo-200 rounded-xl shadow-inner focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white mb-4 resize-none`}
                                 rows="2"
                             />
                             <div className="flex gap-3 w-full justify-center">
                                 <button
                                     onClick={handleWeekendRequestSubmit}
                                     className="px-5 py-2 bg-indigo-600 text-white text-sm font-bold rounded-lg hover:bg-indigo-700 shadow transition-colors disabled:opacity-50"
                                     disabled={actionLoading}
                                 >
                                     {actionLoading ? <Spinner size="4" /> : 'Submit Request'}
                                 </button>
                                 <button
                                     onClick={() => { setShowWeekendRequest(false); setReason(''); setLocalError(''); }}
                                     className="px-5 py-2 bg-gray-100 text-gray-700 text-sm font-bold rounded-lg hover:bg-gray-200 shadow-sm transition-colors border border-gray-200"
                                     disabled={actionLoading}
                                 >
                                     Cancel
                                 </button>
                             </div>
                         </div>
                     )}
                 </div>
             )}

             {isFutureDate && <p className="mt-5 text-sm font-medium text-gray-400 bg-gray-50/50 inline-block px-4 py-1.5 rounded-full relative z-10">Cannot mark attendance for future dates.</p>}
             {!canMarkSelectedDate && !isFutureDate && !statusInfo.isLoading && statusInfo.status !== null && statusInfo.status !== 'Weekend' && (
                 <p className="mt-5 text-sm font-medium text-gray-500 bg-white/60 inline-block px-4 py-2 rounded-lg border border-gray-100 relative z-10 shadow-sm">
                    {statusInfo.status === 'Present' && statusInfo.requestedStatus === 'System Auto-Marked' 
                        ? 'Your attendance was automatically logged by your device.' 
                        : 'Attendance status is final or not applicable for this date.'}
                 </p>
             )}
             {localError && <p className="mt-4 text-sm text-red-600 animate-pulse font-semibold bg-red-50 py-2 rounded-lg relative z-10">{localError}</p>}
             {localSuccess && <p className="mt-4 text-sm text-green-600 font-semibold bg-green-50 py-2 rounded-lg relative z-10">{localSuccess}</p>}
        </div>
    );
};

const formatDateForInput = (dateString) => {
    if (!dateString) return '';
    if (typeof dateString === 'string' && dateString.includes('T')) {
        return dateString.split('T')[0];
    }
    return dateString;
};

const DetailItem = ({ label, value, icon, isEditing = false, children }) => (
    <div className="space-y-1.5 p-3 rounded-lg hover:bg-slate-50 transition-colors duration-200">
        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center">
            {icon} {label}
        </label>
        {isEditing ? (
            children
        ) : (
            <p className="text-base font-semibold text-gray-800 min-h-[28px] break-words">
                {value || <span className="text-gray-300 italic font-medium">N/A</span>}
            </p>
        )}
    </div>
);

const ProfilePage = () => {
    const { user, login: updateUserInContext } = useAuth();
    
    const [leaveQuota, setLeaveQuota] = useState(null);
    const [leaveHistory, setLeaveHistory] = useState([]);
    const [myAsset, setMyAsset] = useState(null);
    const [loading, setLoading] = useState(true);
    
    // ✅ FIXED: Using the new Shift helper instead of UTC
    const [selectedDate, setSelectedDate] = useState(getISTShiftDateString());
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const [isEditing, setIsEditing] = useState(false);
    const [editLoading, setEditLoading] = useState(false);
    const [formData, setFormData] = useState({});
    const [isExpanded, setIsExpanded] = useState(false);

    const employmentTypes = ['Full-Time', 'Part-Time', 'Contractor (C2C)', 'Contractor (1099)'];
    const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
    const relations = ['Spouse', 'Parent', 'Sibling', 'Child', 'Other'];

    const userStr = JSON.stringify(user || {});
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
    }, [userStr]);

    const initialMonthString = selectedDate ? selectedDate.substring(0, 7) : '';
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
             setLeaveHistory([]);
        }
    }, [user?.userIdentifier]);

    const loadInitialData = useCallback(async () => {
        if (!user?.userIdentifier) {
            setLoading(false);
            return;
        }
        setLoading(true);
        setError('');
        try {
            const configRes = await apiService.getLeaveConfig({ authenticatedUsername: user.userIdentifier, targetUsername: user.userIdentifier }).catch(() => null);
            if (configRes?.data?.success && configRes.data.config) {
                setLeaveQuota(configRes.data.config);
            } else {
                 setLeaveQuota(null);
            }
            await fetchLeaveHistory();
            
            try {
                const assetRes = await apiService.getAssets(user.userIdentifier);
                if (assetRes.data && Array.isArray(assetRes.data)) {
                    const assignedAsset = assetRes.data.find(a => 
                        a.assignedToEmail === user.userIdentifier || 
                        a.AssetAssignedToEmail === user.userIdentifier ||
                        a.AssetAssignedTo === user.displayName ||
                        a.AssetAssignedTo === user.userName ||
                        a.AssetAssignedTo === user.userIdentifier
                    );
                    setMyAsset(assignedAsset || null);
                }
            } catch (assetErr) {
                console.log("Asset fetch skipped or forbidden.", assetErr);
            }
            
        } catch (err) {
            setError(`Could not load profile data.`);
            setLeaveQuota(null);
            setLeaveHistory([]);
        } finally {
            setLoading(false);
        }
    }, [user?.userIdentifier, fetchLeaveHistory]);

    useEffect(() => {
        loadInitialData();
    }, [loadInitialData]);

    const handleMarkAttendance = async (dateToMark, requestedStatus, reason = "") => {
        try {
            const response = await apiService.markAttendance({
                authenticatedUsername: user.userIdentifier,
                date: dateToMark,
                requestedStatus: requestedStatus,
                reason: reason
            });
            if (response.data.success) {
                refreshCalendar();
            } else {
                throw new Error(response.data.message);
            }
        } catch (err) {
             throw new Error(err.response?.data?.message || err.message);
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

    const renderEditInput = (name, type = 'text') => (
        <input
            type={type}
            name={name}
            id={name}
            value={formData[name] || ''}
            onChange={handleFormChange}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white transition-shadow"
        />
    );

    const renderEditSelect = (name, options) => (
         <select
            name={name}
            id={name}
            value={formData[name] || ''}
            onChange={handleFormChange}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white h-[42px] transition-shadow cursor-pointer"
        >
            <option value="">Select...</option>
            {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>
    );

    const renderEditTextArea = (name) => (
        <textarea
            name={name}
            id={name}
            value={formData[name] || ''}
            onChange={handleFormChange}
            rows="3"
            className="w-full px-4 py-2 border border-slate-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white transition-shadow resize-y"
        />
    );

    const calculateBalance = (typeKey, typeLabel) => {
        if (!leaveQuota) return { total: 0, used: 0, remaining: 0 };
        
        const total = leaveQuota[typeKey] || 0;
        const used = leaveHistory
            .filter(req => req.status === 'Approved' && req.leaveType === typeLabel)
            .reduce((acc, req) => {
                const start = new Date(req.startDate);
                const end = new Date(req.endDate);
                const diffTime = Math.abs(end - start);
                const diffDays = isNaN(diffTime) ? 0 : Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; 
                return acc + diffDays;
            }, 0);
            
        return { total, used, remaining: total - used };
    };

    const sickLeave = calculateBalance('sickLeave', 'Sick Leave (SL)');
    const casualLeave = calculateBalance('casualLeave', 'Casual Leave (CL)');
    const earnedLeave = calculateBalance('earnedLeave', 'Earned Leave (EL)');
    const maternityLeave = calculateBalance('maternityLeave', 'Maternity Leave');
    const paternityLeave = calculateBalance('paternityLeave', 'Paternity Leave');
    
    const lwp = calculateBalance('lwp', 'Leave Without Pay (LWP)');
    const lop = calculateBalance('lop', 'Loss of Pay (LOP)');

    if (loading) return <div className="flex justify-center items-center h-[70vh]"><Spinner size="12" /></div>;

    return (
        <div className="space-y-8 max-w-7xl mx-auto font-sans pb-12">
             <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                 <div>
                    <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">My Profile</h1>
                    <p className="text-slate-500 mt-1 font-medium text-sm">Manage your personal details and attendance</p>
                 </div>
                 {!isEditing && (
                     <button
                        onClick={() => setIsEditing(true)}
                        className="px-6 py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 hover:shadow-md transition-all flex items-center"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.536L16.732 3.732z" /></svg>
                        Edit Profile
                    </button>
                 )}
             </div>

            {error && <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-r-lg shadow-sm animate-shake font-medium">{error}</div>}
            {success && <div className="bg-green-50 border-l-4 border-green-500 text-green-700 p-4 rounded-r-lg shadow-sm animate-fadeIn font-medium">{success}</div>}
             
            <form onSubmit={handleSaveChanges}>
                <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-slate-200 hover:border-indigo-100 transition-colors">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="space-y-1.5 p-3">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center"><UserIcon /> Full Name</label>
                            {isEditing ? (
                                <div className="space-y-3 mt-2">
                                    <input type="text" name="firstName" placeholder="First Name" value={formData.firstName} onChange={handleFormChange} className="w-full px-4 py-2 border border-slate-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 bg-white" />
                                    <input type="text" name="middleName" placeholder="Middle (Optional)" value={formData.middleName} onChange={handleFormChange} className="w-full px-4 py-2 border border-slate-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 bg-white" />
                                    <input type="text" name="lastName" placeholder="Last Name" value={formData.lastName} onChange={handleFormChange} className="w-full px-4 py-2 border border-slate-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 bg-white" />
                                </div>
                            ) : (
                                <p className="text-2xl font-extrabold text-slate-800 break-words">{user?.userName || 'Demo User'}</p>
                            )}
                        </div>
                        <DetailItem label="Username (Email)" icon={<UserIcon />} value={user?.userIdentifier} />
                        <DetailItem label="Date of Joining" icon={<CalendarIcon />} isEditing={isEditing} value={formatDateForInput(user?.dateOfJoining)}>
                            <input type="date" name="dateOfJoining" value={formData.dateOfJoining} className="w-full px-4 py-2 border border-slate-200 rounded-lg shadow-sm bg-slate-50 text-slate-500 cursor-not-allowed" readOnly title="This field can only be changed by an admin." />
                        </DetailItem>
                        <DetailItem label="Personal Mobile" icon={<PhoneIcon />} isEditing={isEditing} value={user?.personalMobileNumber}>
                            {renderEditInput('personalMobileNumber', 'tel')}
                        </DetailItem>
                    </div>

                    <div className={`transition-all duration-500 ease-in-out origin-top ${isExpanded || isEditing ? 'max-h-[1200px] opacity-100 scale-y-100 mt-6' : 'max-h-0 opacity-0 scale-y-0 overflow-hidden m-0'}`}>
                        <div className="pt-6 border-t border-slate-100 space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                <DetailItem label="Date of Birth" icon={<CakeIcon />} isEditing={isEditing} value={formatDateForInput(user?.dateOfBirth)}>
                                    {renderEditInput('dateOfBirth', 'date')}
                                </DetailItem>
                                <DetailItem label="Blood Group" icon={<HeartIcon />} isEditing={isEditing} value={user?.bloodGroup}>
                                    {renderEditSelect('bloodGroup', bloodGroups)}
                                </DetailItem>
                                <DetailItem label="Employee Code" icon={<IdCardIcon />} value={user?.employeeCode} />
                                <DetailItem label="Backend Role" icon={<BriefcaseIcon />} value={user?.backendOfficeRole} />
                                
                                <DetailItem label="Employment Type" icon={<BriefcaseIcon />} isEditing={isEditing} value={user?.employmentType}>
                                    <input type="text" name="employmentType" value={formData.employmentType} className="w-full px-4 py-2 border border-slate-200 rounded-lg shadow-sm bg-slate-50 text-slate-500 cursor-not-allowed" readOnly title="This field can only be changed by an admin." />
                                </DetailItem>
                                <DetailItem label="Work Location" icon={<LocationIcon />} isEditing={isEditing} value={user?.workLocation}>
                                    <input type="text" name="workLocation" value={formData.workLocation} className="w-full px-4 py-2 border border-slate-200 rounded-lg shadow-sm bg-slate-50 text-slate-500 cursor-not-allowed" readOnly title="This field can only be changed by an admin." />
                                </DetailItem>
                                <DetailItem label="Reports To" icon={<UsersIcon />} isEditing={isEditing} value={user?.reportsTo}>
                                    <input type="text" name="reportsTo" value={formData.reportsTo} className="w-full px-4 py-2 border border-slate-200 rounded-lg shadow-sm bg-slate-50 text-slate-500 cursor-not-allowed" readOnly title="This field can only be changed by an admin." />
                                </DetailItem>
                                
                                <DetailItem label="Asset Tag (ID)" icon={<LaptopIcon />} value={myAsset?.rowKey} />
                                <DetailItem label="Asset Model" icon={<LaptopIcon />} value={myAsset ? `${myAsset.AssetBrandName || ''} ${myAsset.AssetModelName || ''}`.trim() : null} />

                                <DetailItem label="LinkedIn Profile" icon={<LinkIcon />} isEditing={isEditing} value={user?.linkedInProfile}>
                                    {renderEditInput('linkedInProfile', 'url')}
                                </DetailItem>
                                <DetailItem label="Current Address" icon={<LocationIcon />} isEditing={isEditing} value={user?.currentAddress}>
                                    {renderEditTextArea('currentAddress')}
                                </DetailItem>
                            </div>
                            
                            <div className="p-6 bg-slate-50/50 rounded-xl border border-slate-100">
                                 <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-5 flex items-center"><HeartIcon /> Emergency Contact</h3>
                                 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                     <DetailItem label="Contact Name" icon={<UserIcon />} isEditing={isEditing} value={user?.emergencyContactName}>
                                         {renderEditInput('emergencyContactName')}
                                      </DetailItem>
                                      <DetailItem label="Contact Phone" icon={<PhoneIcon />} isEditing={isEditing} value={user?.emergencyContactPhone}>
                                         {renderEditInput('emergencyContactPhone', 'tel')}
                                      </DetailItem>
                                      <DetailItem label="Relation" icon={<UsersIcon />} isEditing={isEditing} value={user?.emergencyContactRelation}>
                                           {renderEditSelect('emergencyContactRelation', relations)}
                                      </DetailItem>
                                 </div>
                            </div>
                        </div>
                    </div>

                    {!isEditing && (
                        <div className="mt-4 pt-4 flex justify-center border-t border-slate-50">
                            <button
                                type="button"
                                onClick={() => setIsExpanded(!isExpanded)}
                                className="px-6 py-2 text-sm font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-full flex items-center transition-colors"
                            >
                                {isExpanded ? 'Hide Details' : 'View Full Profile'}
                                {isExpanded ? <ChevronUpIcon /> : <ChevronDownIcon />}
                            </button>
                        </div>
                    )}

                    {isEditing && (
                        <div className="flex justify-end gap-4 mt-8 pt-6 border-t border-slate-200">
                             <button type="button" onClick={() => setIsEditing(false)} className="px-6 py-2.5 bg-white border border-slate-300 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-colors shadow-sm" disabled={editLoading}>Cancel</button>
                            <button type="submit" className="px-8 py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 hover:shadow-md flex items-center justify-center min-w-[140px] transition-all disabled:bg-indigo-400" disabled={editLoading}>{editLoading ? <Spinner size="5" /> : 'Save Changes'}</button>
                        </div>
                    )}
                </div>
            </form>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    <AttendanceMarker selectedDate={selectedDate} onDateChange={handleDateChange} onMarkAttendance={handleMarkAttendance} authUser={user} />
                    
                    <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-slate-200">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-extrabold text-slate-800 flex items-center"><CalendarIcon /> Attendance History</h3>
                            <button onClick={refreshCalendar} className="text-sm font-semibold text-indigo-600 hover:text-indigo-800 flex items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                                Refresh
                            </button>
                        </div>
                         <AttendanceCalendar initialMonthString={initialMonthString} key={calendarRefreshKey} />
                    </div>
                </div>

                <div className="space-y-8">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                        <h3 className="text-lg font-extrabold mb-5 flex items-center text-slate-800"><QuotaIcon /> Annual Leave Balance</h3>
                        {leaveQuota ? (
                            <div className="text-sm">
                                <div className="grid grid-cols-3 font-bold text-slate-400 text-xs uppercase tracking-wider border-b border-slate-100 pb-2 mb-3">
                                    <span>Type</span><span className="text-center">Used/Total</span><span className="text-right">Left</span>
                                </div>
                                
                                <div className="space-y-3 font-medium text-slate-600">
                                    <div className="grid grid-cols-3 items-center hover:bg-slate-50 p-1.5 -mx-1.5 rounded-lg transition-colors">
                                        <span className="text-slate-800">Sick (SL)</span>
                                        <span className="text-center">{sickLeave.used} / {sickLeave.total}</span>
                                        <span className={`text-right font-bold text-base ${sickLeave.remaining < 0 ? 'text-red-500' : 'text-blue-600'}`}>{sickLeave.remaining}</span>
                                    </div>
                                    <div className="grid grid-cols-3 items-center hover:bg-slate-50 p-1.5 -mx-1.5 rounded-lg transition-colors">
                                        <span className="text-slate-800">Casual (CL)</span>
                                        <span className="text-center">{casualLeave.used} / {casualLeave.total}</span>
                                        <span className={`text-right font-bold text-base ${casualLeave.remaining < 0 ? 'text-red-500' : 'text-blue-600'}`}>{casualLeave.remaining}</span>
                                    </div>
                                    <div className="grid grid-cols-3 items-center hover:bg-slate-50 p-1.5 -mx-1.5 rounded-lg transition-colors">
                                        <span className="text-slate-800">Earned (EL)</span>
                                        <span className="text-center">{earnedLeave.used} / {earnedLeave.total}</span>
                                        <span className={`text-right font-bold text-base ${earnedLeave.remaining < 0 ? 'text-red-500' : 'text-blue-600'}`}>{earnedLeave.remaining}</span>
                                    </div>
                                    <div className="grid grid-cols-3 items-center hover:bg-slate-50 p-1.5 -mx-1.5 rounded-lg transition-colors">
                                        <span className="text-slate-800">Maternity</span>
                                        <span className="text-center">{maternityLeave.used} / {maternityLeave.total}</span>
                                        <span className={`text-right font-bold text-base ${maternityLeave.remaining < 0 ? 'text-red-500' : 'text-blue-600'}`}>{maternityLeave.remaining}</span>
                                    </div>
                                    <div className="grid grid-cols-3 items-center hover:bg-slate-50 p-1.5 -mx-1.5 rounded-lg transition-colors">
                                        <span className="text-slate-800">Paternity</span>
                                        <span className="text-center">{paternityLeave.used} / {paternityLeave.total}</span>
                                        <span className={`text-right font-bold text-base ${paternityLeave.remaining < 0 ? 'text-red-500' : 'text-blue-600'}`}>{paternityLeave.remaining}</span>
                                    </div>
                                </div>
                                
                                <div className="border-t border-slate-100 pt-3 mt-3 space-y-3 font-medium text-slate-500">
                                    <div className="grid grid-cols-3 items-center">
                                        <span className="text-slate-800">LWP</span>
                                        <span className="text-center">{lwp.used} used</span>
                                        <span className="text-right text-slate-300">-</span>
                                    </div>
                                    <div className="grid grid-cols-3 items-center">
                                        <span className="text-slate-800">LOP</span>
                                        <span className="text-center">{lop.used} used</span>
                                        <span className="text-right text-slate-300">-</span>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-slate-50 rounded-lg p-4 text-center border border-slate-100">
                                <p className="text-sm text-slate-500 font-medium">Leave quotas not configured yet.</p>
                            </div>
                        )}
                    </div>
                    
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                         <h3 className="text-lg font-extrabold mb-5 flex items-center text-slate-800"><RequestIcon /> Request Leave</h3>
                        <LeaveRequestForm onLeaveRequested={handleLeaveRequested} />
                    </div>
                    
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                        <h3 className="text-lg font-extrabold mb-5 flex items-center text-slate-800"><HistoryIcon /> Leave History</h3>
                         <LeaveHistory leaveHistory={leaveHistory} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;