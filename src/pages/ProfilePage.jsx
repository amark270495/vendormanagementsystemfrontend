import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../api/apiService';
import Spinner from '../components/Spinner';
import AttendanceCalendar from '../components/profile/AttendanceCalendar';
import LeaveRequestForm from '../components/profile/LeaveRequestForm';
import LeaveHistory from '../components/profile/LeaveHistory';

// --- Modern Icons ---
const CalendarIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;
const QuotaIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>;
const RequestIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>;
const HistoryIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const UserIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>;
const UsersIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>;
const IdCardIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2" /></svg>;
const BriefcaseIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.03 23.03 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>;
const CakeIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 15.25v-4.25a2 2 0 00-2-2H5a2 2 0 00-2 2v4.25a2 2 0 002 2h14a2 2 0 002-2zM6 18v-3M9 18v-3M12 18v-3m3 0v3m3 0v-3m-15-4.5a.75.75 0 100-1.5.75.75 0 000 1.5zM18 10.5a.75.75 0 100-1.5.75.75 0 000 1.5zM9 10.5a.75.75 0 100-1.5.75.75 0 000 1.5zM15 10.5a.75.75 0 100-1.5.75.75 0 000 1.5zM12 10.5a.75.75 0 100-1.5.75.75 0 000 1.5zM6 9V6a3 3 0 013-3h6a3 3 0 013 3v3" /></svg>;
const PhoneIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>;
const LocationIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
const LinkIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.102 1.101" /></svg>;
const HeartIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 015.13-1.424l.89.445.89-.445a4.5 4.5 0 015.13 1.424A4.5 4.5 0 0119.682 11.5a4.5 4.5 0 01-1.424 5.13l-.445.89-.445.89a4.5 4.5 0 01-5.13 1.424A4.5 4.5 0 0112 19.682a4.5 4.5 0 01-1.424-5.13l-.89-.445-.89-.445a4.5 4.5 0 01-1.424-5.13A4.5 4.5 0 014.318 6.318z" /></svg>;
const ShieldCheckIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>;
const LaptopIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>;

// --- 1. Leave Balance Bar Widget ---
const LeaveBalanceBar = ({ title, data, color }) => {
    const { used, total, remaining } = data;
    const percent = total > 0 ? Math.min((used / total) * 100, 100) : 0;
    const isExhausted = remaining <= 0 && total > 0;
    
    return (
        <div className="p-4 border border-slate-100 rounded-2xl bg-white hover:border-slate-300 hover:shadow-md transition-all duration-300 group">
            <div className="flex justify-between items-end mb-3">
                <div>
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">{title}</p>
                    <p className={`text-2xl leading-none font-black ${isExhausted ? 'text-red-500' : 'text-slate-800'}`}>
                        {remaining} <span className="text-xs font-bold text-slate-400 ml-0.5">left</span>
                    </p>
                </div>
                <div className="text-right">
                    <p className="text-xs font-bold text-slate-500 bg-slate-50 px-2 py-1 rounded-md border border-slate-100">
                        <span className="text-slate-800">{used}</span> / {total}
                    </p>
                </div>
            </div>
            <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                <div className={`h-full rounded-full transition-all duration-1000 ease-out ${isExhausted ? 'bg-red-500' : color}`} style={{ width: `${percent}%` }}></div>
            </div>
        </div>
    );
};

// --- 2. Detailed Profile Info Card ---
const DetailItem = ({ label, value, icon, isEditing = false, children }) => (
    <div className="flex flex-col p-4 rounded-2xl bg-slate-50/50 border border-slate-100 hover:bg-slate-50 hover:border-indigo-100 transition-colors duration-300 h-full">
        <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-2">
            <span className="text-indigo-400">{icon}</span> {label}
        </label>
        {isEditing ? (
            <div className="mt-auto w-full">{children}</div>
        ) : (
            <p className="text-[15px] font-bold text-slate-800 break-words mt-auto">
                {value || <span className="text-slate-300 italic font-medium">Not provided</span>}
            </p>
        )}
    </div>
);

// --- 3. Shift Time Helper ---
const getISTShiftDateString = () => {
    const d = new Date();
    const istFormatter = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Kolkata', hour: 'numeric', hour12: false });
    const istHour = parseInt(istFormatter.format(d), 10);
    if (istHour < 12) d.setHours(d.getHours() - 12); 
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
};

// --- 4. Attendance Marker Widget ---
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
        <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-100 h-full flex flex-col justify-center relative overflow-hidden">
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-indigo-50 rounded-full blur-3xl opacity-70 pointer-events-none"></div>

            <div className="relative z-10 flex flex-col items-center text-center">
                <div className="w-full mb-6">
                    <label htmlFor="attendanceDate" className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Select Active Date</label>
                    <input 
                        type="date" id="attendanceDate" value={selectedDate} onChange={(e) => onDateChange(e.target.value)} max={todayDateString} 
                        className="w-full bg-slate-50 border border-slate-200 text-indigo-900 text-lg font-bold rounded-2xl px-4 py-3 shadow-inner focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all cursor-pointer text-center" 
                    />
                </div>
                
                <h3 className="text-xl font-black text-slate-800 mb-1">{formatDateDisplay(selectedDate)}</h3>
                
                <div className="min-h-[50px] flex justify-center items-center my-4 w-full">
                    {statusInfo.isLoading ? <Spinner size="8" /> : statusInfo.status ? (
                        <div className={`px-6 py-3 text-sm font-black rounded-2xl shadow-sm w-full border ${statusInfo.status === 'Present' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : statusInfo.status === 'Absent' || statusInfo.status === 'Rejected' ? 'bg-rose-50 text-rose-700 border-rose-200' : statusInfo.status === 'On Leave' ? 'bg-purple-50 text-purple-700 border-purple-200' : statusInfo.status === 'Pending' ? 'bg-amber-50 text-amber-700 border-amber-200' : statusInfo.status === 'Holiday' ? 'bg-orange-50 text-orange-700 border-orange-200' : 'bg-slate-50 text-slate-600 border-slate-200'}`}>
                            {statusInfo.status === 'Pending' ? `Pending (${statusInfo.requestedStatus})` : (statusInfo.status === 'Present' && statusInfo.requestedStatus === 'System Auto-Marked') ? '✅ Auto-Marked Present' : statusInfo.status.toUpperCase()}
                            {statusInfo.isHoliday ? ` - ${statusInfo.holidayDescription || 'Holiday'}` : ''}
                        </div>
                    ) : (
                        <div className="px-6 py-3 text-sm font-black rounded-2xl border border-slate-200 bg-slate-50 text-slate-400 uppercase tracking-widest w-full">
                            {statusInfo.isApprovedWeekend ? 'Approved (Ready to Mark)' : 'Not Marked Yet'}
                        </div>
                    )}
                </div>
                
                {canMarkSelectedDate && !isFutureDate && (
                    <div className="w-full mt-2 space-y-3">
                        <button onClick={() => handleMark('Present')} className="w-full py-3.5 bg-indigo-600 text-white text-sm font-black rounded-2xl hover:bg-indigo-500 shadow-md hover:shadow-lg transition-all disabled:opacity-50" disabled={actionLoading}>
                            {actionLoading ? <Spinner size="5" /> : 'Mark as Present'}
                        </button>
                        <button onClick={() => handleMark('Absent')} className="w-full py-3.5 bg-white border-2 border-slate-100 text-slate-600 text-sm font-black rounded-2xl hover:bg-slate-50 hover:border-slate-200 transition-all disabled:opacity-50" disabled={actionLoading}>
                            {actionLoading ? <Spinner size="5" /> : 'Mark as Absent'}
                        </button>
                    </div>
                )}

                {statusInfo.isWeekend && !isFutureDate && !statusInfo.isLoading && statusInfo.status === 'Weekend' && (
                    <div className="w-full mt-4">
                        {statusInfo.weekendWorkStatus === 'Pending' ? (
                            <div className="w-full px-4 py-3 bg-amber-50 text-amber-800 border border-amber-200 text-xs font-bold rounded-xl text-center">Request Pending Manager Approval</div>
                        ) : statusInfo.weekendWorkStatus === 'Rejected' ? (
                            <div className="w-full px-4 py-3 bg-rose-50 text-rose-800 border border-rose-200 text-xs font-bold rounded-xl text-center">Weekend Request Rejected</div>
                        ) : !showWeekendRequest ? (
                            <button onClick={() => setShowWeekendRequest(true)} className="w-full py-3.5 bg-white border-2 border-indigo-100 text-indigo-600 text-sm font-black rounded-2xl hover:bg-indigo-50 transition-all">Request Weekend Work</button>
                        ) : (
                            <div className="w-full bg-slate-50 p-4 rounded-2xl border border-slate-200 text-left animate-fadeIn">
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Business Justification</p>
                                <textarea value={reason} onChange={(e) => { setReason(e.target.value); }} placeholder="Why are you working this weekend?" className="w-full px-4 py-3 text-sm border border-slate-200 rounded-xl shadow-inner focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white mb-3 resize-none" rows="2" />
                                <div className="flex gap-2">
                                    <button onClick={handleWeekendRequestSubmit} className="flex-1 py-2.5 bg-indigo-600 text-white text-xs font-black rounded-xl hover:bg-indigo-500 shadow-sm transition-all" disabled={actionLoading}>{actionLoading ? <Spinner size="4" /> : 'Submit'}</button>
                                    <button onClick={() => { setShowWeekendRequest(false); setReason(''); setLocalError(''); }} className="px-4 py-2.5 bg-white border border-slate-200 text-slate-600 text-xs font-black rounded-xl hover:bg-slate-50 transition-all" disabled={actionLoading}>Cancel</button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {isFutureDate && <p className="mt-4 text-xs font-bold text-slate-400 uppercase tracking-widest bg-slate-50 px-4 py-2 rounded-xl border border-slate-100 w-full">Cannot mark future dates</p>}
                
                {localError && <p className="mt-4 w-full text-xs text-rose-600 animate-pulse font-bold bg-rose-50 py-3 px-4 rounded-xl border border-rose-100">{localError}</p>}
                {localSuccess && <p className="mt-4 w-full text-xs text-emerald-600 font-bold bg-emerald-50 py-3 px-4 rounded-xl border border-emerald-100">{localSuccess}</p>}
            </div>
        </div>
    );
};

const formatDateForInput = (dateString) => {
    if (!dateString) return '';
    if (typeof dateString === 'string' && dateString.includes('T')) return dateString.split('T')[0];
    return dateString;
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

    const initialMonthString = selectedDate ? selectedDate.substring(0, 7) : '';
    const [calendarRefreshKey, setCalendarRefreshKey] = useState(Date.now());
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
                setSuccess("Profile updated successfully!"); updateUserInContext(response.data.userData); setIsEditing(false);
                setTimeout(() => setSuccess(''), 3000);
            } else { setError(response.data.message || "Failed to update profile."); }
        } catch (err) { setError(err.response?.data?.message || "An unexpected error occurred."); } 
        finally { setEditLoading(false); }
    };

    const renderEditInput = (name, type = 'text') => (
        <input type={type} name={name} id={name} value={formData[name] || ''} onChange={handleFormChange} className="w-full px-4 py-3 border border-slate-200 rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white transition-all text-sm font-semibold text-slate-700" />
    );

    const renderEditSelect = (name, options) => (
         <select name={name} id={name} value={formData[name] || ''} onChange={handleFormChange} className="w-full px-4 py-3 border border-slate-200 rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white transition-all cursor-pointer text-sm font-semibold text-slate-700">
            <option value="">Select...</option>
            {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>
    );

    const renderEditTextArea = (name) => (
        <textarea name={name} id={name} value={formData[name] || ''} onChange={handleFormChange} rows="3" className="w-full px-4 py-3 border border-slate-200 rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white transition-all resize-y text-sm font-semibold text-slate-700" />
    );

    // --- Analytics Calculations (FIXED) ---
    const calculateBalance = (typeKey, typeLabel) => {
        if (!leaveQuota) return { total: 0, used: 0, remaining: 0 };
        const total = leaveQuota[typeKey] || 0;
        
        // SAFE FALLBACK: (leaveHistory || []) ensures it never crashes if undefined
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

    // Overall PTO Calculation
    const overallPaidTotal = sickLeave.total + casualLeave.total + earnedLeave.total;
    const overallPaidUsed = sickLeave.used + casualLeave.used + earnedLeave.used;
    const overallPaidRemaining = overallPaidTotal - overallPaidUsed;
    const overallPaidPercentage = overallPaidTotal > 0 ? Math.min((overallPaidUsed / overallPaidTotal) * 100, 100) : 0;

    if (loading) return <div className="flex justify-center items-center h-[70vh]"><Spinner size="12" /></div>;

    return (
        <div className="max-w-7xl mx-auto font-sans pb-12 space-y-6">
            
            {/* --- HERO HEADER --- */}
            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden relative">
                {/* Gradient Cover Photo */}
                <div className="h-32 sm:h-40 w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 relative">
                    <div className="absolute inset-0 bg-black/10"></div>
                </div>
                
                <div className="px-6 sm:px-10 pb-6 sm:pb-8 relative flex flex-col sm:flex-row items-center sm:items-end justify-between gap-6">
                    <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6 -mt-16 sm:-mt-20">
                        <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-3xl bg-white p-1.5 shadow-xl relative z-10 flex-shrink-0">
                            <div className="w-full h-full bg-slate-100 rounded-2xl flex items-center justify-center text-indigo-300 text-6xl font-black overflow-hidden border border-slate-100">
                                {user?.userName ? user.userName.charAt(0).toUpperCase() : 'U'}
                            </div>
                        </div>
                        <div className="text-center sm:text-left mb-2">
                            <h1 className="text-3xl sm:text-4xl font-black text-slate-800 tracking-tight">{user?.userName || 'Demo User'}</h1>
                            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mt-2">
                                <span className="px-3 py-1 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-lg border border-indigo-100 flex items-center gap-1.5"><BriefcaseIcon /> {user?.backendOfficeRole || 'Employee'}</span>
                                <span className="px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-lg border border-emerald-100 flex items-center gap-1.5"><ShieldCheckIcon /> Active Status</span>
                            </div>
                        </div>
                    </div>
                    
                    {activeTab === 'profile' && !isEditing && (
                        <button onClick={() => setIsEditing(true)} className="px-6 py-3 bg-slate-800 text-white text-sm font-black rounded-xl hover:bg-slate-700 shadow-md hover:shadow-lg transition-all flex items-center gap-2 mb-2 w-full sm:w-auto justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.536L16.732 3.732z" /></svg>
                            Edit Profile Details
                        </button>
                    )}
                </div>
            </div>

            {error && <div className="bg-rose-50 border border-rose-200 text-rose-700 px-5 py-4 rounded-2xl flex items-center shadow-sm animate-shake"><svg className="w-5 h-5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg><span className="font-bold text-sm">{error}</span></div>}
            {success && <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-5 py-4 rounded-2xl flex items-center shadow-sm animate-fadeIn"><svg className="w-5 h-5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg><span className="font-bold text-sm">{success}</span></div>}
             
            {/* --- SEGMENTED TABS --- */}
            <div className="flex justify-center w-full">
                <div className="bg-white p-1.5 rounded-2xl shadow-sm border border-slate-100 flex flex-col sm:flex-row w-full sm:w-auto overflow-hidden">
                    <button onClick={() => setActiveTab('profile')} className={`py-3 px-8 text-sm font-black rounded-xl transition-all duration-300 flex items-center justify-center gap-2 ${activeTab === 'profile' ? 'bg-indigo-600 text-white shadow-md transform scale-100' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800 scale-95'}`}>
                        <UserIcon /> User Profile
                    </button>
                    <button onClick={() => setActiveTab('attendance')} className={`py-3 px-8 text-sm font-black rounded-xl transition-all duration-300 flex items-center justify-center gap-2 ${activeTab === 'attendance' ? 'bg-indigo-600 text-white shadow-md transform scale-100' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800 scale-95'}`}>
                        <CalendarIcon /> Attendance
                    </button>
                    <button onClick={() => setActiveTab('leaves')} className={`py-3 px-8 text-sm font-black rounded-xl transition-all duration-300 flex items-center justify-center gap-2 ${activeTab === 'leaves' ? 'bg-indigo-600 text-white shadow-md transform scale-100' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800 scale-95'}`}>
                        <RequestIcon /> Leaves & PTO
                    </button>
                </div>
            </div>

            {/* ========================================= */}
            {/* TAB CONTENT: PROFILE */}
            {/* ========================================= */}
            {activeTab === 'profile' && (
                <form onSubmit={handleSaveChanges} className="animate-fadeIn">
                    <div className="bg-white p-6 sm:p-10 rounded-3xl shadow-sm border border-slate-100 space-y-10">
                        
                        {/* Block 1 */}
                        <div>
                            <h3 className="text-lg font-black text-slate-800 flex items-center gap-2.5 mb-6"><UserIcon /> Personal Information</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                                <div className="flex flex-col p-4 rounded-2xl bg-slate-50/50 border border-slate-100 h-full">
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-2"><span className="text-indigo-400"><UserIcon /></span> Full Name</label>
                                    {isEditing ? (
                                        <div className="space-y-3 mt-auto w-full">
                                            <input type="text" name="firstName" placeholder="First Name" value={formData.firstName} onChange={handleFormChange} className="w-full px-4 py-2.5 border border-slate-300 rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-500 bg-white text-sm font-semibold" />
                                            <input type="text" name="middleName" placeholder="Middle (Optional)" value={formData.middleName} onChange={handleFormChange} className="w-full px-4 py-2.5 border border-slate-300 rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-500 bg-white text-sm font-semibold" />
                                            <input type="text" name="lastName" placeholder="Last Name" value={formData.lastName} onChange={handleFormChange} className="w-full px-4 py-2.5 border border-slate-300 rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-500 bg-white text-sm font-semibold" />
                                        </div>
                                    ) : (
                                        <p className="text-[15px] font-bold text-slate-800 mt-auto">{user?.userName}</p>
                                    )}
                                </div>
                                <DetailItem label="Email Address" icon={<UserIcon />} value={user?.userIdentifier} />
                                <DetailItem label="Personal Mobile" icon={<PhoneIcon />} isEditing={isEditing} value={user?.personalMobileNumber}>
                                    {renderEditInput('personalMobileNumber', 'tel')}
                                </DetailItem>
                                <DetailItem label="Date of Birth" icon={<CakeIcon />} isEditing={isEditing} value={formatDateForInput(user?.dateOfBirth)}>
                                    {renderEditInput('dateOfBirth', 'date')}
                                </DetailItem>
                                <DetailItem label="Blood Group" icon={<HeartIcon />} isEditing={isEditing} value={user?.bloodGroup}>
                                    {renderEditSelect('bloodGroup', bloodGroups)}
                                </DetailItem>
                                <DetailItem label="LinkedIn Profile" icon={<LinkIcon />} isEditing={isEditing} value={user?.linkedInProfile}>
                                    {renderEditInput('linkedInProfile', 'url')}
                                </DetailItem>
                                <div className="md:col-span-2 lg:col-span-3">
                                    <DetailItem label="Current Address" icon={<LocationIcon />} isEditing={isEditing} value={user?.currentAddress}>
                                        {renderEditTextArea('currentAddress')}
                                    </DetailItem>
                                </div>
                            </div>
                        </div>

                        <hr className="border-slate-100" />

                        {/* Block 2 */}
                        <div>
                            <h3 className="text-lg font-black text-slate-800 flex items-center gap-2.5 mb-6"><BriefcaseIcon /> Employment & Assets</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                                <DetailItem label="Employee Code" icon={<IdCardIcon />} value={user?.employeeCode} />
                                <DetailItem label="Date of Joining" icon={<CalendarIcon />} isEditing={isEditing} value={formatDateForInput(user?.dateOfJoining)}>
                                    <input type="date" name="dateOfJoining" value={formData.dateOfJoining} className="w-full px-4 py-3 border border-slate-200 rounded-xl shadow-sm bg-slate-50 text-slate-500 cursor-not-allowed mt-1 text-sm font-semibold" readOnly title="Only an admin can edit this." />
                                </DetailItem>
                                <DetailItem label="Employment Type" icon={<BriefcaseIcon />} isEditing={isEditing} value={user?.employmentType}>
                                    <input type="text" name="employmentType" value={formData.employmentType} className="w-full px-4 py-3 border border-slate-200 rounded-xl shadow-sm bg-slate-50 text-slate-500 cursor-not-allowed mt-1 text-sm font-semibold" readOnly title="Only an admin can edit this." />
                                </DetailItem>
                                <DetailItem label="Work Location" icon={<LocationIcon />} isEditing={isEditing} value={user?.workLocation}>
                                    <input type="text" name="workLocation" value={formData.workLocation} className="w-full px-4 py-3 border border-slate-200 rounded-xl shadow-sm bg-slate-50 text-slate-500 cursor-not-allowed mt-1 text-sm font-semibold" readOnly title="Only an admin can edit this." />
                                </DetailItem>
                                <DetailItem label="Reports To" icon={<UsersIcon />} isEditing={isEditing} value={user?.reportsTo}>
                                    <input type="text" name="reportsTo" value={formData.reportsTo} className="w-full px-4 py-3 border border-slate-200 rounded-xl shadow-sm bg-slate-50 text-slate-500 cursor-not-allowed mt-1 text-sm font-semibold" readOnly title="Only an admin can edit this." />
                                </DetailItem>
                                
                                <div className="flex flex-col gap-3">
                                    <div className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-indigo-100 text-indigo-500 rounded-xl flex items-center justify-center"><LaptopIcon /></div>
                                            <div>
                                                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Asset Tag</p>
                                                <p className="text-sm font-bold text-indigo-900">{myAsset?.rowKey || 'None Assigned'}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-white text-slate-400 rounded-xl flex items-center justify-center shadow-sm border border-slate-100"><LaptopIcon /></div>
                                            <div>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Asset Model</p>
                                                <p className="text-sm font-bold text-slate-700">{myAsset ? `${myAsset.AssetBrandName || ''} ${myAsset.AssetModelName || ''}`.trim() : 'N/A'}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <hr className="border-slate-100" />

                        {/* Block 3 */}
                        <div>
                             <h3 className="text-lg font-black text-slate-800 flex items-center gap-2.5 mb-6"><HeartIcon /> Emergency Contact</h3>
                             <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
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

                        {/* Save Actions */}
                        {isEditing && (
                            <div className="flex flex-col sm:flex-row justify-end gap-3 mt-10 pt-6 border-t border-slate-200">
                                 <button type="button" onClick={() => setIsEditing(false)} className="px-8 py-3 bg-white border-2 border-slate-200 text-slate-600 font-black rounded-xl hover:bg-slate-50 transition-colors" disabled={editLoading}>Cancel Edits</button>
                                <button type="submit" className="px-10 py-3 bg-indigo-600 text-white font-black rounded-xl hover:bg-indigo-700 shadow-md hover:shadow-lg flex items-center justify-center min-w-[160px] transition-all disabled:opacity-50" disabled={editLoading}>{editLoading ? <Spinner size="5" /> : 'Save Profile Changes'}</button>
                            </div>
                        )}
                    </div>
                </form>
            )}

            {/* ========================================= */}
            {/* TAB CONTENT: ATTENDANCE */}
            {/* ========================================= */}
            {activeTab === 'attendance' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 animate-fadeIn">
                    <div className="lg:col-span-4">
                        <AttendanceMarker selectedDate={selectedDate} onDateChange={handleDateChange} onMarkAttendance={handleMarkAttendance} authUser={user} />
                    </div>
                    
                    <div className="lg:col-span-8 bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col h-full">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4 border-b border-slate-100 pb-6">
                            <div>
                                <h3 className="text-xl font-extrabold text-slate-800 flex items-center gap-2"><CalendarIcon /> Monthly Timesheet</h3>
                                <p className="text-sm text-slate-500 font-medium mt-1">View your past and present shift records</p>
                            </div>
                            <button onClick={refreshCalendar} className="px-5 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-sm font-bold rounded-xl flex items-center justify-center transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                                Sync Calendar
                            </button>
                        </div>
                        <div className="flex-1 min-h-[400px]">
                            <AttendanceCalendar initialMonthString={initialMonthString} key={calendarRefreshKey} />
                        </div>
                    </div>
                </div>
            )}

            {/* ========================================= */}
            {/* TAB CONTENT: LEAVES */}
            {/* ========================================= */}
            {activeTab === 'leaves' && (
                <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 lg:gap-8 animate-fadeIn">
                    
                    {/* Left Column: Comprehensive Balances */}
                    <div className="xl:col-span-5 space-y-6 lg:space-y-8">
                        <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-slate-100 relative overflow-hidden">
                            <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-indigo-50/50 rounded-full blur-3xl pointer-events-none"></div>

                            <h3 className="text-xl font-extrabold mb-6 flex items-center text-slate-800 gap-2 border-b border-slate-100 pb-5 relative z-10"><QuotaIcon /> Paid Time Off Tracker</h3>
                            
                            {leaveQuota ? (
                                <div className="space-y-6 relative z-10">
                                    
                                    {/* Overall PTO Health Card */}
                                    <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-md relative overflow-hidden group">
                                        <div className="absolute right-0 top-0 w-32 h-full bg-gradient-to-l from-indigo-500/20 to-transparent pointer-events-none"></div>
                                        <div className="flex justify-between items-center mb-4 relative z-10">
                                            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Total Paid Leave Balance</p>
                                            <div className="bg-white/10 px-2 py-1 rounded-md backdrop-blur-sm">
                                                <p className="text-[10px] font-bold text-white uppercase">{overallPaidPercentage.toFixed(0)}% Used</p>
                                            </div>
                                        </div>
                                        <div className="flex items-end gap-3 relative z-10">
                                            <h4 className="text-5xl font-black">{overallPaidRemaining}</h4>
                                            <p className="text-sm font-bold text-slate-400 mb-1.5">days available</p>
                                        </div>
                                        <div className="w-full h-1.5 bg-white/10 rounded-full mt-5 overflow-hidden">
                                            <div className="h-full bg-indigo-400 rounded-full transition-all duration-1000" style={{ width: `${overallPaidPercentage}%` }}></div>
                                        </div>
                                    </div>

                                    {/* Detailed breakdown grid */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2 gap-4">
                                        <LeaveBalanceBar title="Sick (SL)" data={sickLeave} color="bg-rose-400" />
                                        <LeaveBalanceBar title="Casual (CL)" data={casualLeave} color="bg-blue-400" />
                                        <LeaveBalanceBar title="Earned (EL)" data={earnedLeave} color="bg-emerald-400" />
                                        <LeaveBalanceBar title="Maternity" data={maternityLeave} color="bg-purple-400" />
                                        <LeaveBalanceBar title="Paternity" data={paternityLeave} color="bg-indigo-400" />
                                    </div>
                                    
                                    {/* Unpaid section */}
                                    <div className="pt-5 border-t border-slate-100 grid grid-cols-2 gap-4">
                                        <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-100 flex flex-col hover:bg-slate-100 transition-colors">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Leave W/O Pay</span>
                                            <span className="text-xl font-black text-slate-700">{lwp.used} <span className="font-bold text-xs text-slate-400 ml-0.5">days</span></span>
                                        </div>
                                        <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-100 flex flex-col hover:bg-slate-100 transition-colors">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Loss Of Pay</span>
                                            <span className="text-xl font-black text-slate-700">{lop.used} <span className="font-bold text-xs text-slate-400 ml-0.5">days</span></span>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-slate-50 rounded-2xl p-10 text-center border border-slate-100 border-dashed relative z-10">
                                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm border border-slate-100 mx-auto mb-4 text-slate-300"><QuotaIcon /></div>
                                    <p className="text-base text-slate-600 font-bold">Leave quotas not configured</p>
                                    <p className="text-sm text-slate-400 mt-1">Please contact your HR administrator to set up your annual allowances.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Column: Request Form & History Feed */}
                    <div className="xl:col-span-7 flex flex-col gap-6 lg:gap-8">
                        
                        <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-slate-100">
                             <h3 className="text-xl font-extrabold mb-6 flex items-center text-slate-800 gap-2 border-b border-slate-100 pb-5"><RequestIcon /> Submit New Request</h3>
                            <LeaveRequestForm onLeaveRequested={handleLeaveRequested} />
                        </div>

                        <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-slate-100 flex-1">
                            <div className="flex items-center justify-between mb-6 border-b border-slate-100 pb-5">
                                <h3 className="text-xl font-extrabold text-slate-800 flex items-center gap-2"><HistoryIcon /> Application History</h3>
                                <span className="px-3 py-1 bg-slate-100 text-slate-600 text-xs font-bold rounded-lg">{leaveHistory.length} Records</span>
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