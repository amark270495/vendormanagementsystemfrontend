import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../api/apiService';
import Spinner from '../components/Spinner';
import AttendanceCalendar from '../components/profile/AttendanceCalendar';
import LeaveRequestForm from '../components/profile/LeaveRequestForm';
import LeaveHistory from '../components/profile/LeaveHistory';

// --- Modern Enterprise Icons ---
const CalendarIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;
const QuotaIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>;
const RequestIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>;
const HistoryIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const UserIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>;
const UsersIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>;
const IdCardIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2" /></svg>;
const BriefcaseIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.03 23.03 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>;
const HeartIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 015.13-1.424l.89.445.89-.445a4.5 4.5 0 015.13 1.424A4.5 4.5 0 0119.682 11.5a4.5 4.5 0 01-1.424 5.13l-.445.89-.445.89a4.5 4.5 0 01-5.13 1.424A4.5 4.5 0 0112 19.682a4.5 4.5 0 01-1.424-5.13l-.89-.445-.89-.445a4.5 4.5 0 01-1.424-5.13A4.5 4.5 0 014.318 6.318z" /></svg>;
const ShieldCheckIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>;
const PhoneIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>;
const LocationIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
const LinkIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.102 1.101" /></svg>;
const CakeIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M21 15.25v-4.25a2 2 0 00-2-2H5a2 2 0 00-2 2v4.25a2 2 0 002 2h14a2 2 0 002-2zM6 18v-3M9 18v-3M12 18v-3m3 0v3m3 0v-3m-15-4.5a.75.75 0 100-1.5.75.75 0 000 1.5zM18 10.5a.75.75 0 100-1.5.75.75 0 000 1.5zM9 10.5a.75.75 0 100-1.5.75.75 0 000 1.5zM15 10.5a.75.75 0 100-1.5.75.75 0 000 1.5zM12 10.5a.75.75 0 100-1.5.75.75 0 000 1.5zM6 9V6a3 3 0 013-3h6a3 3 0 013 3v3" /></svg>;
const LaptopIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>;
const EditIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.536L16.732 3.732z" /></svg>;

// --- Helper Functions ---
const getISTShiftDateString = () => {
    const d = new Date();
    const istFormatter = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Kolkata', hour: 'numeric', hour12: false });
    const istHour = parseInt(istFormatter.format(d), 10);
    if (istHour < 12) d.setHours(d.getHours() - 12); 
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
};

const formatMsToTime = (ms) => {
    if (!ms || ms <= 0) return "0h 0m";
    const h = Math.floor(ms / (1000 * 60 * 60));
    const m = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    return `${h}h ${m}m`;
};

const formatDateForInput = (dateString) => {
    if (!dateString) return '';
    if (typeof dateString === 'string' && dateString.includes('T')) return dateString.split('T')[0];
    return dateString;
};

// --- Sub-Components ---
const LeaveBalanceBar = ({ title, data, color }) => {
    const { used, total, remaining } = data;
    const percent = total > 0 ? Math.min((used / total) * 100, 100) : 0;
    const isExhausted = remaining <= 0 && total > 0;
    
    return (
        <div className="p-4 border border-gray-200 rounded-lg bg-white hover:border-gray-300 transition-all duration-200">
            <div className="flex justify-between items-end mb-2">
                <div>
                    <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">{title}</p>
                    <p className={`text-xl font-bold ${isExhausted ? 'text-red-600' : 'text-gray-900'}`}>
                        {remaining} <span className="text-xs font-medium text-gray-500 ml-0.5">left</span>
                    </p>
                </div>
                <div className="text-right">
                    <p className="text-xs font-medium text-gray-500">
                        <span className="text-gray-900 font-semibold">{used}</span> / {total}
                    </p>
                </div>
            </div>
            <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all duration-500 ${isExhausted ? 'bg-red-500' : color}`} style={{ width: `${percent}%` }}></div>
            </div>
        </div>
    );
};

const DetailItem = ({ label, value, icon, isEditing = false, children }) => (
    <div className="flex flex-col p-4 rounded-lg bg-white border border-gray-200 h-full">
        <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-2 mb-2">
            <span className="text-gray-400">{icon}</span> {label}
        </label>
        {isEditing ? (
            <div className="mt-auto w-full">{children}</div>
        ) : (
            <p className="text-[14px] font-medium text-gray-900 break-words mt-auto">
                {value || <span className="text-gray-400 italic">Not provided</span>}
            </p>
        )}
    </div>
);

// --- Attendance Marker Widget (Restored and Styled for Enterprise) ---
const AttendanceMarker = ({ selectedDate, onDateChange, onMarkAttendance, authUser }) => {
    const [statusInfo, setStatusInfo] = useState({ 
        status: null, requestedStatus: null, isHoliday: false, isOnLeave: false, isWeekend: false, isApprovedWeekend: false, weekendWorkStatus: null, isLoading: true, holidayDescription: '' 
    });
    const [actionLoading, setActionLoading] = useState(false);
    const [localError, setLocalError] = useState('');
    const [localSuccess, setLocalSuccess] = useState('');
    const [reason, setReason] = useState('');
    const [showWeekendRequest, setShowWeekendRequest] = useState(false);

    const todayDateString = getISTShiftDateString();

    const fetchStatusForDate = useCallback(async (dateString) => {
        const userId = authUser?.userIdentifier;
        if (!userId || !dateString) {
            setStatusInfo({ status: null, requestedStatus: null, isHoliday: false, isOnLeave: false, isWeekend: false, isApprovedWeekend: false, weekendWorkStatus: null, isLoading: false });
            return;
        }
        setStatusInfo(prev => ({ ...prev, isLoading: true }));
        setLocalError(''); setLocalSuccess('');

        try {
            const dateObj = new Date(dateString + 'T00:00:00Z');
            const dayOfWeek = dateObj.getUTCDay();
            const year = dateString.substring(0, 4);
            const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

            const [attendanceRes, holidayRes, leaveRes, weekendRes] = await Promise.all([
                apiService.getAttendance({ authenticatedUsername: userId, username: userId, startDate: dateString, endDate: dateString }).catch(() => null),
                apiService.getHolidays({ authenticatedUsername: userId, year: year }).catch(() => null),
                apiService.getLeaveRequests({ authenticatedUsername: userId, targetUsername: userId, statusFilter: 'Approved', startDateFilter: dateString, endDateFilter: dateString }).catch(() => null),
                apiService.getWeekendWorkRequests({ authenticatedUsername: userId }).catch(() => null)
            ]);

            let status = null, requestedStatus = null, isHoliday = false, isOnLeave = false, holidayDescription = '';
            let isApprovedWeekend = false, wwStatus = null;
            
            if (weekendRes?.data?.success && Array.isArray(weekendRes.data.requests)) {
                const req = weekendRes.data.requests.find(r => r.partitionKey === userId && r.date === dateString);
                if (req) {
                    wwStatus = req.status; 
                    if (wwStatus === 'Approved') isApprovedWeekend = true;
                }
            }

            if (holidayRes?.data?.success && Array.isArray(holidayRes.data.holidays)) {
                 const holiday = holidayRes.data.holidays.find(h => h.date === dateString);
                 if (holiday) { isHoliday = true; holidayDescription = holiday.description; status = 'Holiday'; }
            }

            if (leaveRes?.data?.success && Array.isArray(leaveRes.data.requests) && leaveRes.data.requests.length > 0) {
                 isOnLeave = true; status = 'On Leave';
            }

            if (attendanceRes?.data?.success && Array.isArray(attendanceRes.data.attendanceRecords) && attendanceRes.data.attendanceRecords.length > 0) {
                const record = attendanceRes.data.attendanceRecords[0];
                 if (status === null && !isWeekend) { status = record.status; requestedStatus = record.requestedStatus || null; } 
                 else if (record.status === 'Pending' && status === null && !isWeekend) { status = 'Pending'; requestedStatus = record.requestedStatus || null; } 
                 else if (isApprovedWeekend) { status = record.status; requestedStatus = record.requestedStatus || null; }
            }

            if (status === null && isWeekend && !isApprovedWeekend) { status = 'Weekend'; }

            setStatusInfo({ status, requestedStatus, isHoliday, isOnLeave, isWeekend, isApprovedWeekend, weekendWorkStatus: wwStatus, isLoading: false, holidayDescription });
        } catch (err) {
            setStatusInfo({ status: null, requestedStatus: null, isHoliday: false, isOnLeave: false, isWeekend: false, isApprovedWeekend: false, weekendWorkStatus: null, isLoading: false });
        }
    }, [authUser?.userIdentifier]); 

    useEffect(() => {
        fetchStatusForDate(selectedDate);
        setShowWeekendRequest(false);
        setReason(''); setLocalError(''); setLocalSuccess('');
    }, [selectedDate, fetchStatusForDate]);

    const handleMark = async (requested) => {
        setActionLoading(true); setLocalError(''); setLocalSuccess('');
        try {
            await onMarkAttendance(selectedDate, requested, ""); 
            fetchStatusForDate(selectedDate);
            setLocalSuccess(`Attendance request for ${formatDateDisplay(selectedDate)} submitted.`);
            setTimeout(() => setLocalSuccess(''), 4000);
        } catch (err) {
            const errorMessage = err.message || "Failed to submit request.";
            setLocalError(errorMessage);
            if (errorMessage.toLowerCase().includes("approved leave")) setStatusInfo(prev => ({ ...prev, status: 'On Leave', isOnLeave: true }));
            else if (errorMessage.toLowerCase().includes("holiday")) setStatusInfo(prev => ({ ...prev, status: 'Holiday', isHoliday: true }));
        } finally { setActionLoading(false); }
    };

    const handleWeekendRequestSubmit = async () => {
        if (!reason.trim()) return setLocalError("Provide a business justification.");
        setActionLoading(true); setLocalError(''); setLocalSuccess('');
        try {
            await apiService.requestWeekendWork({ authenticatedUsername: authUser.userIdentifier, date: selectedDate, reason: reason });
            setLocalSuccess(`Weekend work requested for ${formatDateDisplay(selectedDate)}.`);
            setReason(''); setShowWeekendRequest(false);
            fetchStatusForDate(selectedDate);
            setTimeout(() => setLocalSuccess(''), 4000);
        } catch (err) { setLocalError(err.message || "Failed to submit request."); } 
        finally { setActionLoading(false); }
    };

    const canMarkSelectedDate = !statusInfo.isLoading && !actionLoading && (!statusInfo.isWeekend || statusInfo.isApprovedWeekend) && !statusInfo.isHoliday && !statusInfo.isOnLeave && statusInfo.status !== 'Present' && statusInfo.status !== 'Absent' && statusInfo.status !== 'Rejected';
    const isFutureDate = selectedDate > todayDateString;

    const formatDateDisplay = (dateStr) => {
        if (!dateStr) return '';
        const date = new Date(dateStr + 'T00:00:00Z');
        if (isNaN(date.getTime())) return '';
        return date.toLocaleDateString('en-US', { timeZone: 'UTC', weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 h-full flex flex-col justify-center relative">
            <div className="relative z-10 flex flex-col items-center text-center">
                <div className="w-full mb-6">
                    <label htmlFor="attendanceDate" className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Select Active Date</label>
                    <input 
                        type="date" id="attendanceDate" value={selectedDate} onChange={(e) => onDateChange(e.target.value)} max={todayDateString} 
                        className="w-full bg-white border border-gray-300 text-gray-900 text-base font-medium rounded-md px-4 py-2 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600 transition-all cursor-pointer text-center" 
                    />
                </div>
                
                <h3 className="text-lg font-bold text-gray-900 mb-1">{formatDateDisplay(selectedDate)}</h3>
                
                <div className="min-h-[50px] flex justify-center items-center my-4 w-full">
                    {statusInfo.isLoading ? <Spinner size="8" /> : statusInfo.status ? (
                        <div className={`px-4 py-2 text-sm font-semibold rounded-md w-full border ${statusInfo.status === 'Present' ? 'bg-green-50 text-green-700 border-green-200' : statusInfo.status === 'Absent' || statusInfo.status === 'Rejected' ? 'bg-red-50 text-red-700 border-red-200' : statusInfo.status === 'On Leave' ? 'bg-purple-50 text-purple-700 border-purple-200' : statusInfo.status === 'Pending' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : statusInfo.status === 'Holiday' ? 'bg-orange-50 text-orange-700 border-orange-200' : 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                            {statusInfo.status === 'Pending' ? `Pending (${statusInfo.requestedStatus})` : (statusInfo.status === 'Present' && statusInfo.requestedStatus === 'System Auto-Marked') ? '✅ Auto-Marked Present' : statusInfo.status.toUpperCase()}
                            {statusInfo.isHoliday ? ` - ${statusInfo.holidayDescription || 'Holiday'}` : ''}
                        </div>
                    ) : (
                        <div className="px-4 py-2 text-sm font-semibold rounded-md border border-gray-200 bg-gray-50 text-gray-500 uppercase tracking-wide w-full">
                            {statusInfo.isApprovedWeekend ? 'Approved (Ready to Mark)' : 'Not Marked Yet'}
                        </div>
                    )}
                </div>
                
                {canMarkSelectedDate && !isFutureDate && (
                    <div className="w-full mt-2 space-y-3">
                        <button onClick={() => handleMark('Present')} className="w-full py-2.5 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50" disabled={actionLoading}>
                            {actionLoading ? <Spinner size="5" /> : 'Mark as Present'}
                        </button>
                        <button onClick={() => handleMark('Absent')} className="w-full py-2.5 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50" disabled={actionLoading}>
                            {actionLoading ? <Spinner size="5" /> : 'Mark as Absent'}
                        </button>
                    </div>
                )}

                {statusInfo.isWeekend && !isFutureDate && !statusInfo.isLoading && statusInfo.status === 'Weekend' && (
                    <div className="w-full mt-4">
                        {statusInfo.weekendWorkStatus === 'Pending' ? (
                            <div className="w-full px-4 py-3 bg-yellow-50 text-yellow-800 border border-yellow-200 text-sm font-medium rounded-md text-center">Request Pending Manager Approval</div>
                        ) : statusInfo.weekendWorkStatus === 'Rejected' ? (
                            <div className="w-full px-4 py-3 bg-red-50 text-red-800 border border-red-200 text-sm font-medium rounded-md text-center">Weekend Request Rejected</div>
                        ) : !showWeekendRequest ? (
                            <button onClick={() => setShowWeekendRequest(true)} className="w-full py-2.5 bg-white border border-blue-600 text-blue-600 text-sm font-medium rounded-md hover:bg-blue-50 transition-colors">Request Weekend Work</button>
                        ) : (
                            <div className="w-full bg-gray-50 p-4 rounded-md border border-gray-200 text-left">
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Business Justification</p>
                                <textarea value={reason} onChange={(e) => { setReason(e.target.value); }} placeholder="Why are you working this weekend?" className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600 bg-white mb-3 resize-y" rows="2" />
                                <div className="flex gap-2">
                                    <button onClick={handleWeekendRequestSubmit} className="flex-1 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors" disabled={actionLoading}>{actionLoading ? <Spinner size="4" /> : 'Submit'}</button>
                                    <button onClick={() => { setShowWeekendRequest(false); setReason(''); setLocalError(''); }} className="px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-50 transition-colors" disabled={actionLoading}>Cancel</button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {isFutureDate && <p className="mt-4 text-xs font-medium text-gray-500 bg-gray-50 px-4 py-2 rounded-md border border-gray-200 w-full">Cannot mark future dates</p>}
                
                {localError && <p className="mt-4 w-full text-sm text-red-700 font-medium bg-red-50 py-2 px-3 rounded-md border border-red-200">{localError}</p>}
                {localSuccess && <p className="mt-4 w-full text-sm text-green-800 font-medium bg-green-50 py-2 px-3 rounded-md border border-green-200">{localSuccess}</p>}
            </div>
        </div>
    );
};

// === MAIN PAGE COMPONENT ===
const ProfilePage = () => {
    const { user, login: updateUserInContext } = useAuth();
    
    const [activeTab, setActiveTab] = useState('profile'); 
    
    const [leaveQuota, setLeaveQuota] = useState(null);
    const [leaveHistory, setLeaveHistory] = useState([]);
    const [myAsset, setMyAsset] = useState(null);
    const [loading, setLoading] = useState(true);
    
    const [selectedDate, setSelectedDate] = useState(getISTShiftDateString());
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const [isEditing, setIsEditing] = useState(false);
    const [editLoading, setEditLoading] = useState(false);
    const [formData, setFormData] = useState({});

    // --- State for Statistics Syncing ---
    const [statsAttendanceData, setStatsAttendanceData] = useState({});
    const [statsLeaveMap, setStatsLeaveMap] = useState({});
    const [statsLoading, setStatsLoading] = useState(false);
    const [calendarRefreshKey, setCalendarRefreshKey] = useState(Date.now());

    const employmentTypes = ['Full-Time', 'Part-Time', 'Contractor (C2C)', 'Contractor (1099)'];
    const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
    const relations = ['Spouse', 'Parent', 'Sibling', 'Child', 'Other'];

    const userStr = JSON.stringify(user || {});
    useEffect(() => {
        if (user) {
            setFormData({
                firstName: user.firstName || '', lastName: user.lastName || '', middleName: user.middleName || '',
                dateOfBirth: formatDateForInput(user.dateOfBirth), dateOfJoining: formatDateForInput(user.dateOfJoining),
                employmentType: user.employmentType || 'Full-Time', workLocation: user.workLocation || '', reportsTo: user.reportsTo || '',
                personalMobileNumber: user.personalMobileNumber || '', currentAddress: user.currentAddress || '',
                emergencyContactName: user.emergencyContactName || '', emergencyContactPhone: user.emergencyContactPhone || '',
                emergencyContactRelation: user.emergencyContactRelation || 'Other', bloodGroup: user.bloodGroup || '',
                linkedInProfile: user.linkedInProfile || '',
            });
        }
    }, [userStr]);

    const refreshCalendar = () => setCalendarRefreshKey(Date.now());

    const fetchLeaveHistory = useCallback(async () => {
        if (!user?.userIdentifier) return;
        try {
             const leaveRes = await apiService.getLeaveRequests({ authenticatedUsername: user.userIdentifier, targetUsername: user.userIdentifier });
             if (leaveRes.data.success && Array.isArray(leaveRes.data.requests)) setLeaveHistory(leaveRes.data.requests);
             else setLeaveHistory([]);
        } catch (err) { setLeaveHistory([]); }
    }, [user?.userIdentifier]);

    const loadInitialData = useCallback(async () => {
        if (!user?.userIdentifier) { setLoading(false); return; }
        setLoading(true); setError('');
        try {
            const configRes = await apiService.getLeaveConfig({ authenticatedUsername: user.userIdentifier, targetUsername: user.userIdentifier }).catch(() => null);
            if (configRes?.data?.success && configRes.data.config) setLeaveQuota(configRes.data.config);
            else setLeaveQuota(null);
            
            await fetchLeaveHistory();
            
            try {
                const assetRes = await apiService.getAssets(user.userIdentifier);
                if (assetRes.data && Array.isArray(assetRes.data)) {
                    const assignedAsset = assetRes.data.find(a => a.assignedToEmail === user.userIdentifier || a.AssetAssignedToEmail === user.userIdentifier || a.AssetAssignedTo === user.displayName || a.AssetAssignedTo === user.userName || a.AssetAssignedTo === user.userIdentifier);
                    setMyAsset(assignedAsset || null);
                }
            } catch (assetErr) {}
        } catch (err) {
            setError(`Could not load profile data.`); setLeaveQuota(null); setLeaveHistory([]);
        } finally { setLoading(false); }
    }, [user?.userIdentifier, fetchLeaveHistory]);

    useEffect(() => { loadInitialData(); }, [loadInitialData]);

    const handleMonthNavigation = useCallback(async (monthString, monthEndDay) => {
        if (!user?.userIdentifier) return;
        setStatsLoading(true);
        try {
            const [attendanceRes, leaveRes] = await Promise.all([
                apiService.getAttendance({ authenticatedUsername: user.userIdentifier, username: user.userIdentifier, month: monthString }),
                apiService.getLeaveRequests({ authenticatedUsername: user.userIdentifier, targetUsername: user.userIdentifier, startDateFilter: `${monthString}-01`, endDateFilter: `${monthString}-${monthEndDay}` }),
            ]);

            const attMap = {};
            if (attendanceRes?.data?.success && Array.isArray(attendanceRes.data.attendanceRecords)) {
                attendanceRes.data.attendanceRecords.forEach(att => attMap[att.date] = att);
            }
            setStatsAttendanceData(attMap);

            const lMap = {};
            if (leaveRes?.data?.success && Array.isArray(leaveRes.data.requests)) {
                leaveRes.data.requests.forEach(req => {
                    if (req.status === 'Approved') {
                        const start = new Date(req.startDate + 'T00:00:00Z');
                        const end = new Date(req.endDate + 'T00:00:00Z');
                        for (let d = new Date(start); d <= end; d.setUTCDate(d.getUTCDate() + 1)) {
                            if (d.getUTCDay() !== 0 && d.getUTCDay() !== 6) lMap[d.toISOString().split('T')[0]] = 'Approved';
                        }
                    }
                });
            }
            setStatsLeaveMap(lMap);
        } catch (err) {
            console.error("Stats Sync Error", err);
        } finally { setStatsLoading(false); }
    }, [user?.userIdentifier]);

    const calculateBalance = (typeKey, typeLabel) => {
        if (!leaveQuota) return { total: 0, used: 0, remaining: 0 };
        const total = leaveQuota[typeKey] || 0;
        const used = (leaveHistory || [])
            .filter(req => req.status === 'Approved' && req.leaveType === typeLabel)
            .reduce((acc, req) => {
                const start = new Date(req.startDate); const end = new Date(req.endDate);
                const diffTime = Math.abs(end - start);
                return acc + (isNaN(diffTime) ? 0 : Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1);
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

    const overallPaidTotal = sickLeave.total + casualLeave.total + earnedLeave.total;
    const overallPaidUsed = sickLeave.used + casualLeave.used + earnedLeave.used;
    const overallPaidRemaining = overallPaidTotal - overallPaidUsed;
    const overallPaidPercentage = overallPaidTotal > 0 ? Math.min((overallPaidUsed / overallPaidTotal) * 100, 100) : 0;

    const monthStats = useMemo(() => {
        let totalMs = 0, present = 0, absent = 0, leaves = 0;

        Object.values(statsAttendanceData).forEach(record => {
            if (record.status === 'Present') present++;
            if (record.status === 'Absent' || record.status === 'Rejected') absent++;
            totalMs += (record.standardTimeMs || 0) + (record.extraTimeMs || 0);
        });
        
        leaves = Object.keys(statsLeaveMap).length;

        return { totalHoursStr: formatMsToTime(totalMs), present, absent, leaves };
    }, [statsAttendanceData, statsLeaveMap]);

    const handleMarkAttendance = async (dateToMark, requestedStatus, reason = "") => {
        try {
            const response = await apiService.markAttendance({ authenticatedUsername: user.userIdentifier, date: dateToMark, requestedStatus: requestedStatus, reason: reason });
            if (response.data.success) refreshCalendar();
            else throw new Error(response.data.message);
        } catch (err) { throw new Error(err.response?.data?.message || err.message); }
    };

    const handleLeaveRequested = () => { fetchLeaveHistory(); refreshCalendar(); };
    const handleDateChange = (newDate) => { setSelectedDate(newDate); };
    const handleFormChange = (e) => { setFormData(prev => ({ ...prev, [e.target.name]: e.target.value })); };

    const handleSaveChanges = async (e) => {
        e.preventDefault(); setEditLoading(true); setError(''); setSuccess('');
        try {
            const payload = {
                firstName: formData.firstName, lastName: formData.lastName, middleName: formData.middleName,
                dateOfBirth: formData.dateOfBirth, personalMobileNumber: formData.personalMobileNumber, currentAddress: formData.currentAddress,
                emergencyContactName: formData.emergencyContactName, emergencyContactPhone: formData.emergencyContactPhone,
                emergencyContactRelation: formData.emergencyContactRelation, bloodGroup: formData.bloodGroup, linkedInProfile: formData.linkedInProfile
            };
            const adminPayload = { dateOfJoining: formData.dateOfJoining, employmentType: formData.employmentType, workLocation: formData.workLocation, reportsTo: formData.reportsTo };
            const response = await apiService.updateUser(user.userIdentifier, { ...payload, ...adminPayload }, user.userIdentifier);

            if (response.data.success) {
                setSuccess("Profile updated successfully."); updateUserInContext(response.data.userData); setIsEditing(false);
                setTimeout(() => setSuccess(''), 3000);
            } else { setError(response.data.message || "Failed to update profile."); }
        } catch (err) { setError(err.response?.data?.message || "An unexpected error occurred."); } 
        finally { setEditLoading(false); }
    };

    const renderEditInput = (name, type = 'text') => (
        <input type={type} name={name} id={name} value={formData[name] || ''} onChange={handleFormChange} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-1 focus:ring-blue-600 focus:border-blue-600 bg-white text-sm text-gray-900 outline-none" />
    );

    const renderEditSelect = (name, options) => (
         <select name={name} id={name} value={formData[name] || ''} onChange={handleFormChange} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-1 focus:ring-blue-600 focus:border-blue-600 bg-white text-sm text-gray-900 outline-none cursor-pointer">
            <option value="">Select...</option>
            {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>
    );

    const renderEditTextArea = (name) => (
        <textarea name={name} id={name} value={formData[name] || ''} onChange={handleFormChange} rows="3" className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-1 focus:ring-blue-600 focus:border-blue-600 bg-white text-sm text-gray-900 outline-none resize-y" />
    );

    if (loading) return <div className="flex justify-center items-center h-[70vh]"><Spinner size="10" /></div>;

    return (
        <div className="max-w-7xl mx-auto font-sans pb-12 bg-gray-50 min-h-screen pt-6 px-4 sm:px-6 lg:px-8 space-y-6">
            
            {/* --- CORPORATE HEADER --- */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="h-32 w-full bg-gradient-to-r from-blue-900 to-slate-800 relative"></div>
                
                <div className="px-6 sm:px-8 pb-6 relative flex flex-col sm:flex-row items-center sm:items-end justify-between gap-6">
                    <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6 -mt-16">
                        <div className="w-32 h-32 rounded-lg bg-white p-1 shadow-md relative z-10 border border-gray-200 flex-shrink-0">
                            <div className="w-full h-full bg-gray-100 rounded flex items-center justify-center text-gray-500 text-5xl font-medium">
                                {user?.userName ? user.userName.charAt(0).toUpperCase() : 'U'}
                            </div>
                        </div>
                        <div className="text-center sm:text-left mb-2">
                            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{user?.userName || 'Employee Profile'}</h1>
                            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mt-1.5">
                                <span className="text-sm font-medium text-gray-600 flex items-center gap-1"><BriefcaseIcon /> {user?.backendOfficeRole || 'Staff'}</span>
                                <span className="text-sm font-medium text-gray-600 flex items-center gap-1 border-l border-gray-300 pl-3"><IdCardIcon /> {user?.employeeCode || 'ID: N/A'}</span>
                                <span className="px-2 py-0.5 bg-green-50 text-green-700 text-xs font-semibold rounded border border-green-200 flex items-center gap-1"><ShieldCheckIcon /> Active</span>
                            </div>
                        </div>
                    </div>
                    
                    {activeTab === 'profile' && !isEditing && (
                        <button onClick={() => setIsEditing(true)} className="px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-50 transition-colors flex items-center gap-2 mb-2">
                            <EditIcon /> Edit Details
                        </button>
                    )}
                </div>
            </div>

            {error && <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded text-sm font-medium">{error}</div>}
            {success && <div className="bg-green-50 border-l-4 border-green-500 text-green-800 p-4 rounded text-sm font-medium">{success}</div>}
             
            {/* --- ENTERPRISE TABS --- */}
            <div className="bg-white border-b border-gray-200 px-6 pt-2 rounded-t-lg">
                <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                    <button onClick={() => setActiveTab('profile')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors ${activeTab === 'profile' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
                        <UserIcon /> Profile Details
                    </button>
                    <button onClick={() => setActiveTab('attendance')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors ${activeTab === 'attendance' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
                        <CalendarIcon /> Time & Attendance
                    </button>
                    <button onClick={() => setActiveTab('leaves')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors ${activeTab === 'leaves' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
                        <RequestIcon /> Leave Management
                    </button>
                </nav>
            </div>

            {/* TAB CONTENT: PROFILE */}
            {activeTab === 'profile' && (
                <form onSubmit={handleSaveChanges} className="space-y-6">
                    <div className="bg-white p-6 rounded-b-lg shadow-sm border border-gray-200 border-t-0 space-y-8">
                        <div>
                            <h3 className="text-base font-semibold text-gray-900 mb-4 border-b border-gray-200 pb-2">Personal Information</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                <div className="flex flex-col p-4 rounded-lg bg-white border border-gray-200 h-full">
                                    <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-2 mb-2"><UserIcon /> Full Name</label>
                                    {isEditing ? (
                                        <div className="space-y-2 mt-auto w-full">
                                            <input type="text" name="firstName" placeholder="First Name" value={formData.firstName} onChange={handleFormChange} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600" />
                                            <input type="text" name="middleName" placeholder="Middle (Optional)" value={formData.middleName} onChange={handleFormChange} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600" />
                                            <input type="text" name="lastName" placeholder="Last Name" value={formData.lastName} onChange={handleFormChange} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600" />
                                        </div>
                                    ) : (
                                        <p className="text-[14px] font-medium text-gray-900 mt-auto">{user?.userName}</p>
                                    )}
                                </div>
                                <DetailItem label="Email Address" icon={<UserIcon />} value={user?.userIdentifier} />
                                <DetailItem label="Mobile Number" icon={<PhoneIcon />} isEditing={isEditing} value={user?.personalMobileNumber}>{renderEditInput('personalMobileNumber', 'tel')}</DetailItem>
                                <DetailItem label="Date of Birth" icon={<CakeIcon />} isEditing={isEditing} value={formatDateForInput(user?.dateOfBirth)}>{renderEditInput('dateOfBirth', 'date')}</DetailItem>
                                <DetailItem label="Blood Group" icon={<HeartIcon />} isEditing={isEditing} value={user?.bloodGroup}>{renderEditSelect('bloodGroup', bloodGroups)}</DetailItem>
                                <DetailItem label="LinkedIn Profile" icon={<LinkIcon />} isEditing={isEditing} value={user?.linkedInProfile}>{renderEditInput('linkedInProfile', 'url')}</DetailItem>
                                <div className="md:col-span-2 lg:col-span-3"><DetailItem label="Current Address" icon={<LocationIcon />} isEditing={isEditing} value={user?.currentAddress}>{renderEditTextArea('currentAddress')}</DetailItem></div>
                            </div>
                        </div>

                        <div>
                            <h3 className="text-base font-semibold text-gray-900 mb-4 border-b border-gray-200 pb-2">Employment & Assets</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                <DetailItem label="Date of Joining" icon={<CalendarIcon />} value={formatDateForInput(user?.dateOfJoining)} />
                                <DetailItem label="Employment Type" icon={<BriefcaseIcon />} value={user?.employmentType} />
                                <DetailItem label="Work Location" icon={<LocationIcon />} value={user?.workLocation} />
                                <DetailItem label="Reporting Manager" icon={<UsersIcon />} value={user?.reportsTo} />
                                <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 flex items-start gap-3">
                                        <div className="text-gray-400 mt-0.5"><LaptopIcon /></div>
                                        <div>
                                            <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Allocated Asset Tag</p>
                                            <p className="text-sm font-medium text-gray-900 mt-1">{myAsset?.rowKey || 'Not Assigned'}</p>
                                        </div>
                                    </div>
                                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 flex items-start gap-3">
                                        <div className="text-gray-400 mt-0.5"><LaptopIcon /></div>
                                        <div>
                                            <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Asset Specification</p>
                                            <p className="text-sm font-medium text-gray-900 mt-1">{myAsset ? `${myAsset.AssetBrandName || ''} ${myAsset.AssetModelName || ''}`.trim() : 'N/A'}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div>
                             <h3 className="text-base font-semibold text-gray-900 mb-4 border-b border-gray-200 pb-2">Emergency Contact</h3>
                             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                 <DetailItem label="Contact Name" icon={<UserIcon />} isEditing={isEditing} value={user?.emergencyContactName}>{renderEditInput('emergencyContactName')}</DetailItem>
                                 <DetailItem label="Contact Phone" icon={<PhoneIcon />} isEditing={isEditing} value={user?.emergencyContactPhone}>{renderEditInput('emergencyContactPhone', 'tel')}</DetailItem>
                                 <DetailItem label="Relationship" icon={<UsersIcon />} isEditing={isEditing} value={user?.emergencyContactRelation}>{renderEditSelect('emergencyContactRelation', relations)}</DetailItem>
                             </div>
                        </div>
                        {isEditing && (
                            <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-gray-200">
                                 <button type="button" onClick={() => setIsEditing(false)} className="px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-50" disabled={editLoading}>Cancel</button>
                                <button type="submit" className="px-6 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 shadow-sm" disabled={editLoading}>{editLoading ? <Spinner size="4" /> : 'Save Changes'}</button>
                            </div>
                        )}
                    </div>
                </form>
            )}

            {/* TAB CONTENT: ATTENDANCE */}
            {activeTab === 'attendance' && (
                <div className="grid grid-cols-1 gap-6">
                    <div className="bg-white p-6 rounded-b-lg shadow-sm border border-gray-200 border-t-0 flex flex-col">
                        
                        {/* --- MONTHLY STATISTICS DASHBOARD --- */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 flex flex-col">
                                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Total Logged Hours</span>
                                <span className="text-2xl font-bold text-gray-900">{statsLoading ? '...' : monthStats.totalHoursStr}</span>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 flex flex-col">
                                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Days Present</span>
                                <span className="text-2xl font-bold text-green-700">{statsLoading ? '...' : monthStats.present}</span>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 flex flex-col">
                                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Leaves Taken</span>
                                <span className="text-2xl font-bold text-blue-700">{statsLoading ? '...' : monthStats.leaves}</span>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 flex flex-col">
                                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Absences</span>
                                <span className="text-2xl font-bold text-red-600">{statsLoading ? '...' : monthStats.absent}</span>
                            </div>
                        </div>

                        <div className="flex-1 min-h-[400px]">
                            {/* If you wanted AttendanceMarker alongside the calendar, you can render it here in a grid layout */}
                            <AttendanceCalendar 
                                initialMonthString={getISTShiftDateString().substring(0, 7)} 
                                key={calendarRefreshKey} 
                                onMonthChange={handleMonthNavigation} 
                                onDayClick={handleDateChange} 
                                selectedMarkerDate={selectedDate}
                                onMarkAttendance={handleMarkAttendance}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* TAB CONTENT: LEAVES */}
            {activeTab === 'leaves' && (
                <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                    <div className="xl:col-span-4 space-y-6">
                        <div className="bg-white p-6 rounded-b-lg shadow-sm border border-gray-200 border-t-0">
                            <h3 className="text-base font-semibold text-gray-900 mb-4 border-b border-gray-200 pb-2 flex items-center gap-2"><QuotaIcon /> Paid Time Off (PTO) Balance</h3>
                            {leaveQuota ? (
                                <div className="space-y-4">
                                    {/* Overall Health Card */}
                                    <div className="bg-slate-800 text-white rounded-lg p-5 border border-slate-700">
                                        <div className="flex justify-between items-center mb-2">
                                            <p className="text-[11px] font-semibold text-gray-300 uppercase tracking-wide">Total Paid Leave Balance</p>
                                            <span className="px-2 py-0.5 bg-slate-700 rounded text-[10px] font-medium text-gray-200">{overallPaidPercentage.toFixed(0)}% Used</span>
                                        </div>
                                        <div className="flex items-baseline gap-2">
                                            <h4 className="text-4xl font-bold">{overallPaidRemaining}</h4>
                                            <p className="text-sm font-medium text-gray-400">Days Available</p>
                                        </div>
                                    </div>

                                    {/* Detailed breakdown grid */}
                                    <div className="grid grid-cols-1 gap-3">
                                        <LeaveBalanceBar title="Sick Leave (SL)" data={sickLeave} color="bg-blue-500" />
                                        <LeaveBalanceBar title="Casual Leave (CL)" data={casualLeave} color="bg-indigo-500" />
                                        <LeaveBalanceBar title="Earned Leave (EL)" data={earnedLeave} color="bg-teal-500" />
                                    </div>

                                    {/* Unpaid section */}
                                    <div className="pt-4 border-t border-gray-200 grid grid-cols-2 gap-3">
                                        <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                                            <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide block mb-1">Leave W/O Pay</span>
                                            <span className="text-lg font-bold text-gray-900">{lwp.used} <span className="font-medium text-xs text-gray-500">days</span></span>
                                        </div>
                                        <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                                            <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide block mb-1">Loss Of Pay</span>
                                            <span className="text-lg font-bold text-gray-900">{lop.used} <span className="font-medium text-xs text-gray-500">days</span></span>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-gray-50 rounded-lg p-8 text-center border border-gray-200"><p className="text-sm text-gray-500 font-medium">Leave quotas are not configured for your profile.</p></div>
                            )}
                        </div>
                    </div>
                    
                    <div className="xl:col-span-8 flex flex-col gap-6">
                        <div className="bg-white p-6 rounded-b-lg shadow-sm border border-gray-200 border-t-0">
                            <h3 className="text-base font-semibold text-gray-900 mb-4 border-b border-gray-200 pb-2 flex items-center gap-2"><RequestIcon /> Apply for Leave</h3>
                            <LeaveRequestForm onLeaveRequested={handleLeaveRequested} />
                        </div>
                        
                        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 flex-1">
                            <div className="flex items-center justify-between mb-4 border-b border-gray-200 pb-2">
                                <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2"><HistoryIcon /> Leave Application History</h3>
                                <span className="px-2.5 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-md">{leaveHistory.length} Records</span>
                            </div>
                            <LeaveHistory leaveHistory={leaveHistory} />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProfilePage;