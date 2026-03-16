import React, { useState, useEffect, useCallback, memo } from 'react';
import { 
    User, 
    Calendar, 
    ShieldCheck, 
    Briefcase, 
    Phone, 
    Mail, 
    MapPin, 
    Linkedin, 
    Heart, 
    IdCard, 
    Laptop, 
    Cake, 
    Clock, 
    CheckCircle, 
    AlertCircle, 
    RefreshCw, 
    Edit3, 
    Save, 
    X,
    ChevronRight,
    History,
    FileText,
    PieChart
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../api/apiService';
import Spinner from '../components/Spinner';
import PageHeader from '../components/PageHeader';
import FormInput from '../components/FormInput';
import FormSelect from '../components/FormSelect';
import AttendanceCalendar from '../components/profile/AttendanceCalendar';
import LeaveRequestForm from '../components/profile/LeaveRequestForm';
import LeaveHistory from '../components/profile/LeaveHistory';

/**
 * Helper: IST Shift Date String
 * Logic preserved: If current IST hour is < 12, consider it the previous day's shift.
 */
const getISTShiftDateString = () => {
    const d = new Date();
    const istFormatter = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Kolkata', hour: 'numeric', hour12: false });
    const istHour = parseInt(istFormatter.format(d), 10);
    if (istHour < 12) d.setHours(d.getHours() - 12); 
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
};

const formatDateForInput = (dateString) => {
    if (!dateString) return '';
    if (typeof dateString === 'string' && dateString.includes('T')) return dateString.split('T')[0];
    return dateString;
};

// --- Modern Sub-Component: Leave Balance Widget ---
const LeaveBalanceCard = ({ title, used, total, remaining, colorClass }) => {
    const percent = total > 0 ? Math.min((used / total) * 100, 100) : 0;
    const isExhausted = remaining <= 0 && total > 0;

    return (
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all group">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{title}</p>
                    <h4 className={`text-2xl font-black ${isExhausted ? 'text-rose-500' : 'text-slate-800'}`}>
                        {remaining} <span className="text-xs font-bold text-slate-400 ml-0.5 tracking-normal">days left</span>
                    </h4>
                </div>
                <div className="bg-slate-50 px-2 py-1 rounded-lg border border-slate-100">
                    <p className="text-[10px] font-bold text-slate-500">
                        <span className="text-slate-900">{used}</span> / {total}
                    </p>
                </div>
            </div>
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div 
                    className={`h-full rounded-full transition-all duration-1000 ease-out ${isExhausted ? 'bg-rose-400' : colorClass}`} 
                    style={{ width: `${percent}%` }}
                />
            </div>
        </div>
    );
};

// --- Modern Sub-Component: Attendance Marker ---
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
        if (!userId || !dateString) return;
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
            if (status === null && isWeekend && !isApprovedWeekend) status = 'Weekend';

            setStatusInfo({ status, requestedStatus, isHoliday, isOnLeave, isWeekend, isApprovedWeekend, weekendWorkStatus: wwStatus, isLoading: false, holidayDescription });
        } catch (err) {
            setStatusInfo(prev => ({ ...prev, isLoading: false }));
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
            setLocalSuccess(`Attendance for ${selectedDate} submitted.`);
            setTimeout(() => setLocalSuccess(''), 4000);
        } catch (err) {
            setLocalError(err.message || "Failed to submit request.");
        } finally { setActionLoading(false); }
    };

    const handleWeekendRequestSubmit = async () => {
        if (!reason.trim()) return setLocalError("Provide a business justification.");
        setActionLoading(true); setLocalError('');
        try {
            await apiService.requestWeekendWork({ authenticatedUsername: authUser.userIdentifier, date: selectedDate, reason: reason });
            setLocalSuccess(`Weekend request submitted for ${selectedDate}.`);
            setReason(''); setShowWeekendRequest(false);
            fetchStatusForDate(selectedDate);
        } catch (err) { setLocalError(err.message || "Failed to submit request."); } 
        finally { setActionLoading(false); }
    };

    const canMarkSelectedDate = !statusInfo.isLoading && !actionLoading && (!statusInfo.isWeekend || statusInfo.isApprovedWeekend) && !statusInfo.isHoliday && !statusInfo.isOnLeave && statusInfo.status !== 'Present' && statusInfo.status !== 'Absent' && statusInfo.status !== 'Rejected';
    const isFutureDate = selectedDate > todayDateString;

    const formatDateDisplay = (dateStr) => {
        if (!dateStr) return '';
        const date = new Date(dateStr + 'T00:00:00Z');
        return date.toLocaleDateString('en-US', { timeZone: 'UTC', weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
    };

    return (
        <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm flex flex-col gap-6 h-full relative overflow-hidden">
            <div className="absolute top-0 right-0 -mt-8 -mr-8 w-32 h-32 bg-indigo-50 rounded-full blur-3xl opacity-50" />
            
            <div className="relative z-10">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Target Shift Date</label>
                <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-indigo-500" />
                    <input 
                        type="date" 
                        value={selectedDate} 
                        onChange={(e) => onDateChange(e.target.value)} 
                        max={todayDateString} 
                        className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-lg font-bold rounded-2xl pl-12 pr-4 py-4 focus:ring-2 focus:ring-indigo-500 outline-none transition-all shadow-inner cursor-pointer" 
                    />
                </div>
            </div>
            
            <div className="text-center py-6 px-4 bg-slate-50/50 rounded-3xl border border-slate-100 flex-1 flex flex-col justify-center">
                <h3 className="text-lg font-black text-slate-800">{formatDateDisplay(selectedDate)}</h3>
                <div className="mt-4 flex justify-center">
                    {statusInfo.isLoading ? <Spinner size="6" /> : (
                        <span className={`inline-flex px-6 py-2.5 rounded-2xl text-[11px] font-black uppercase tracking-widest border shadow-sm ${
                            statusInfo.status === 'Present' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                            statusInfo.status === 'Absent' || statusInfo.status === 'Rejected' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                            statusInfo.status === 'Pending' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                            statusInfo.status === 'On Leave' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                            statusInfo.status === 'Holiday' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                            'bg-slate-100 text-slate-600 border-slate-200'
                        }`}>
                            {statusInfo.status === 'Pending' ? `Pending (${statusInfo.requestedStatus})` : statusInfo.status || 'Not Marked'}
                        </span>
                    )}
                </div>
                {statusInfo.isHoliday && <p className="mt-2 text-xs font-bold text-orange-600 italic">"{statusInfo.holidayDescription}"</p>}
            </div>

            <div className="space-y-3 relative z-10">
                {canMarkSelectedDate && !isFutureDate && (
                    <>
                        <button onClick={() => handleMark('Present')} className="w-full py-4 bg-indigo-600 text-white font-black text-sm rounded-2xl hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all active:scale-[0.98] flex items-center justify-center gap-2" disabled={actionLoading}>
                            {actionLoading ? <Spinner size="4" /> : <><CheckCircle className="w-4 h-4" /> Mark Present</>}
                        </button>
                        <button onClick={() => handleMark('Absent')} className="w-full py-4 bg-white border border-slate-200 text-slate-600 font-black text-sm rounded-2xl hover:bg-slate-50 transition-all active:scale-[0.98] flex items-center justify-center gap-2" disabled={actionLoading}>
                            {actionLoading ? <Spinner size="4" /> : <><X className="w-4 h-4" /> Mark Absent</>}
                        </button>
                    </>
                )}

                {statusInfo.isWeekend && !isFutureDate && statusInfo.status === 'Weekend' && !showWeekendRequest && (
                    <button onClick={() => setShowWeekendRequest(true)} className="w-full py-4 bg-indigo-50 text-indigo-700 font-black text-sm rounded-2xl hover:bg-indigo-100 transition-all border border-indigo-100">
                        Request Weekend Work
                    </button>
                )}

                {showWeekendRequest && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                        <textarea 
                            value={reason} 
                            onChange={(e) => setReason(e.target.value)} 
                            placeholder="Why are you working this weekend?" 
                            className="w-full p-4 text-sm border border-slate-200 rounded-2xl bg-slate-50 focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none font-medium" 
                            rows="3" 
                        />
                        <div className="flex gap-2">
                            <button onClick={handleWeekendRequestSubmit} className="flex-1 py-3 bg-indigo-600 text-white font-black rounded-xl text-xs" disabled={actionLoading}>Submit</button>
                            <button onClick={() => setShowWeekendRequest(false)} className="px-6 py-3 bg-slate-100 text-slate-600 font-black rounded-xl text-xs">Cancel</button>
                        </div>
                    </div>
                )}

                {isFutureDate && <p className="text-center text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 py-3 rounded-xl border border-slate-100">Future dates cannot be marked</p>}
            </div>

            {(localError || localSuccess) && (
                <div className={`p-4 rounded-2xl text-xs font-bold border animate-in fade-in ${localError ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
                    <div className="flex items-start gap-2">
                        {localError ? <AlertCircle className="h-4 w-4 mt-0.5" /> : <CheckCircle className="h-4 w-4 mt-0.5" />}
                        <span>{localError || localSuccess}</span>
                    </div>
                </div>
            )}
        </div>
    );
};

// === MAIN PAGE COMPONENT ===
const ProfilePage = () => {
    const { user, login: updateUserInContext } = useAuth();
    
    // State
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
    const [calendarRefreshKey, setCalendarRefreshKey] = useState(Date.now());

    // Initialization
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
    }, [user]);

    const fetchLeaveHistory = useCallback(async () => {
        if (!user?.userIdentifier) return;
        try {
             const leaveRes = await apiService.getLeaveRequests({ authenticatedUsername: user.userIdentifier, targetUsername: user.userIdentifier });
             if (leaveRes.data.success) setLeaveHistory(leaveRes.data.requests || []);
        } catch (err) { setLeaveHistory([]); }
    }, [user?.userIdentifier]);

    const loadInitialData = useCallback(async () => {
        if (!user?.userIdentifier) { setLoading(false); return; }
        setLoading(true);
        try {
            const [configRes, assetRes] = await Promise.all([
                apiService.getLeaveConfig({ authenticatedUsername: user.userIdentifier, targetUsername: user.userIdentifier }).catch(() => null),
                apiService.getAssets(user.userIdentifier).catch(() => null)
            ]);

            if (configRes?.data?.success) setLeaveQuota(configRes.data.config);
            await fetchLeaveHistory();
            
            if (assetRes?.data && Array.isArray(assetRes.data)) {
                const assigned = assetRes.data.find(a => 
                    a.assignedToEmail === user.userIdentifier || 
                    a.AssetAssignedToEmail === user.userIdentifier || 
                    a.AssetAssignedTo === user.displayName || 
                    a.AssetAssignedTo === user.userName
                );
                setMyAsset(assigned || null);
            }
        } catch (err) {
            setError("Modules failed to synchronize.");
        } finally { setLoading(false); }
    }, [user?.userIdentifier, fetchLeaveHistory]);

    useEffect(() => { loadInitialData(); }, [loadInitialData]);

    const handleMarkAttendance = async (dateToMark, requestedStatus, reason = "") => {
        const response = await apiService.markAttendance({ authenticatedUsername: user.userIdentifier, date: dateToMark, requestedStatus, reason });
        if (response.data.success) setCalendarRefreshKey(Date.now());
        else throw new Error(response.data.message);
    };

    const handleSaveChanges = async (e) => {
        if(e) e.preventDefault();
        setEditLoading(true); setError(''); setSuccess('');
        try {
            const payload = {
                firstName: formData.firstName, lastName: formData.lastName, middleName: formData.middleName,
                dateOfBirth: formData.dateOfBirth, personalMobileNumber: formData.personalMobileNumber, currentAddress: formData.currentAddress,
                emergencyContactName: formData.emergencyContactName, emergencyContactPhone: formData.emergencyContactPhone,
                emergencyContactRelation: formData.emergencyContactRelation, bloodGroup: formData.bloodGroup, linkedInProfile: formData.linkedInProfile
            };
            const adminFields = { dateOfJoining: formData.dateOfJoining, employmentType: formData.employmentType, workLocation: formData.workLocation, reportsTo: formData.reportsTo };
            
            const response = await apiService.updateUser(user.userIdentifier, { ...payload, ...adminFields }, user.userIdentifier);
            if (response.data.success) {
                setSuccess("Identity updated successfully!"); 
                updateUserInContext(response.data.userData); 
                setIsEditing(false);
                setTimeout(() => setSuccess(''), 3000);
            } else throw new Error(response.data.message);
        } catch (err) { setError(err.message || "Operation failed."); } 
        finally { setEditLoading(false); }
    };

    // --- Leave Calculations (Logic Preserved) ---
    const calculateLeaveStats = (typeKey, typeLabel) => {
        const total = leaveQuota?.[typeKey] || 0;
        const used = leaveHistory.filter(r => r.status === 'Approved' && r.leaveType === typeLabel)
            .reduce((acc, r) => {
                const start = new Date(r.startDate); const end = new Date(r.endDate);
                const diff = Math.abs(end - start);
                return acc + (isNaN(diff) ? 0 : Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1);
            }, 0);
        return { total, used, remaining: total - used };
    };

    const sickLeave = calculateLeaveStats('sickLeave', 'Sick Leave (SL)');
    const casualLeave = calculateLeaveStats('casualLeave', 'Casual Leave (CL)');
    const earnedLeave = calculateLeaveStats('earnedLeave', 'Earned Leave (EL)');
    const maternityLeave = calculateLeaveStats('maternityLeave', 'Maternity Leave');
    const paternityLeave = calculateLeaveStats('paternityLeave', 'Paternity Leave');

    if (loading) return <div className="flex justify-center items-center h-[60vh]"><Spinner size="12" /></div>;

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500 pb-12">
            
            <PageHeader 
                title="Personnel Profile" 
                description="Monitor attendance health, manage personal identity, and track employment assets."
                breadcrumbs={[{ label: 'Home', path: '/home' }, { label: 'Member Profile' }]}
                actionElement={
                    activeTab === 'profile' && !isEditing && (
                        <button onClick={() => setIsEditing(true)} className="flex items-center gap-2 bg-slate-900 text-white px-6 py-2.5 rounded-xl font-black text-xs shadow-lg hover:bg-slate-800 transition-all active:scale-[0.98]">
                            <Edit3 className="w-4 h-4" /> Update Dossier
                        </button>
                    )
                }
            />

            {/* --- Hero Branding Card --- */}
            <div className="bg-white rounded-[40px] border border-slate-200 shadow-sm overflow-hidden">
                <div className="h-40 bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 relative">
                    <div className="absolute inset-0 bg-black/10" />
                    <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-black/30 to-transparent" />
                </div>
                <div className="px-10 pb-10 flex flex-col md:flex-row items-center md:items-end gap-8 -mt-20">
                    <div className="w-44 h-44 rounded-[40px] bg-white p-2 shadow-2xl ring-1 ring-slate-100 flex-shrink-0 relative z-10">
                        <div className="w-full h-full bg-slate-50 rounded-[32px] flex items-center justify-center text-indigo-500 text-8xl font-black border border-slate-100">
                            {user?.userName?.charAt(0).toUpperCase()}
                        </div>
                    </div>
                    <div className="flex-1 text-center md:text-left mb-2">
                        <h1 className="text-4xl font-black text-slate-900 tracking-tight drop-shadow-sm">{user?.userName}</h1>
                        <div className="flex flex-wrap justify-center md:justify-start gap-4 mt-5">
                            <span className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 text-[10px] font-black rounded-xl border border-indigo-100 uppercase tracking-[0.1em]">
                                <Briefcase className="w-3.5 h-3.5" /> {user?.backendOfficeRole || 'Associate'}
                            </span>
                            <span className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 text-[10px] font-black rounded-xl border border-emerald-100 uppercase tracking-[0.1em]">
                                <ShieldCheck className="w-3.5 h-3.5" /> Verified Account
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- Navigation Tabs --- */}
            <div className="flex justify-center">
                <div className="bg-white p-2 rounded-2xl shadow-sm border border-slate-200 flex gap-2 overflow-x-auto no-scrollbar max-w-full">
                    {[
                        { id: 'profile', icon: User, label: 'Identity' },
                        { id: 'attendance', icon: Clock, label: 'Time Tracking' },
                        { id: 'leaves', icon: PieChart, label: 'Leaves & PTO' }
                    ].map(tab => (
                        <button 
                            key={tab.id}
                            onClick={() => { setActiveTab(tab.id); setIsEditing(false); }}
                            className={`flex items-center gap-2 px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                                activeTab === tab.id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100 scale-105' : 'text-slate-500 hover:bg-slate-50'
                            }`}
                        >
                            <tab.icon className="w-4 h-4" /> {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* --- Dynamic Content Area --- */}
            <div className="mt-4 min-h-[600px]">
                {activeTab === 'profile' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in slide-in-from-bottom-8 duration-700">
                        {/* Information Grid */}
                        <div className="lg:col-span-2 space-y-8">
                            <div className="bg-white p-10 rounded-[40px] border border-slate-200 shadow-sm">
                                <div className="flex items-center justify-between mb-10">
                                    <h3 className="text-xl font-black text-slate-900 flex items-center gap-3">
                                        <IdCard className="w-6 h-6 text-indigo-500" /> General Information
                                    </h3>
                                </div>
                                
                                {!isEditing ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <DetailItem label="Full Registered Name" value={user?.userName} icon={User} />
                                        <DetailItem label="Corporate Email" value={user?.userIdentifier} icon={Mail} />
                                        <DetailItem label="Personal Mobile" value={user?.personalMobileNumber} icon={Phone} />
                                        <DetailItem label="Date of Birth" value={formatDateForInput(user?.dateOfBirth)} icon={Cake} />
                                        <DetailItem label="Blood Type" value={user?.bloodGroup} icon={Heart} />
                                        <DetailItem label="LinkedIn Handle" value={user?.linkedInProfile} icon={Linkedin} />
                                        <div className="md:col-span-2">
                                            <DetailItem label="Residential Address" value={user?.currentAddress} icon={MapPin} />
                                        </div>
                                    </div>
                                ) : (
                                    <form onSubmit={handleSaveChanges} className="space-y-8">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                                            <FormInput label="First Name" value={formData.firstName} onChange={(e) => setFormData({...formData, firstName: e.target.value})} required />
                                            <FormInput label="Last Name" value={formData.lastName} onChange={(e) => setFormData({...formData, lastName: e.target.value})} required />
                                            <FormInput label="Mobile" type="tel" value={formData.personalMobileNumber} onChange={(e) => setFormData({...formData, personalMobileNumber: e.target.value})} icon={Phone} />
                                            <FormInput label="Birth Date" type="date" value={formData.dateOfBirth} onChange={(e) => setFormData({...formData, dateOfBirth: e.target.value})} icon={Cake} />
                                            <FormSelect label="Blood Group" value={formData.bloodGroup} onChange={(e) => setFormData({...formData, bloodGroup: e.target.value})} options={['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(v => ({value: v, label: v}))} />
                                            <FormInput label="LinkedIn URL" value={formData.linkedInProfile} onChange={(e) => setFormData({...formData, linkedInProfile: e.target.value})} icon={Linkedin} />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="block text-sm font-black text-slate-700 uppercase tracking-widest text-[10px]">Residential Address</label>
                                            <textarea 
                                                value={formData.currentAddress} 
                                                onChange={(e) => setFormData({...formData, currentAddress: e.target.value})} 
                                                rows="4" 
                                                className="w-full p-5 border border-slate-200 rounded-[24px] focus:ring-2 focus:ring-indigo-500 outline-none bg-slate-50 transition-all font-semibold text-sm" 
                                            />
                                        </div>
                                        <div className="flex flex-col sm:flex-row justify-end gap-4 pt-8 border-t border-slate-100">
                                            <button type="button" onClick={() => setIsEditing(false)} className="px-10 py-3.5 bg-white border border-slate-200 text-slate-600 font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-slate-50 transition-all">Cancel</button>
                                            <button type="submit" className="flex items-center justify-center gap-2 px-12 py-3.5 bg-indigo-600 text-white font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all" disabled={editLoading}>
                                                {editLoading ? <Spinner size="4" /> : <><Save className="w-4 h-4" /> Apply Changes</>}
                                            </button>
                                        </div>
                                    </form>
                                )}
                            </div>
                        </div>

                        {/* Sidebar: Work Identity & Inventory */}
                        <div className="space-y-8">
                            <div className="bg-white p-10 rounded-[40px] border border-slate-200 shadow-sm">
                                <h3 className="text-xl font-black text-slate-900 mb-8 flex items-center gap-3">
                                    <Briefcase className="w-6 h-6 text-indigo-500" /> Work Profile
                                </h3>
                                <div className="space-y-2">
                                    <SidebarItem label="Employee Code" value={user?.employeeCode} icon={IdCard} />
                                    <SidebarItem label="Start Date" value={formatDateForInput(user?.dateOfJoining)} icon={Calendar} />
                                    <SidebarItem label="Office Branch" value={user?.workLocation} icon={MapPin} />
                                    <SidebarItem label="Reporting Manager" value={user?.reportsTo} icon={User} />
                                    <SidebarItem label="Employment" value={user?.employmentType} icon={Briefcase} />
                                </div>
                            </div>

                            <div className="bg-slate-900 p-10 rounded-[40px] shadow-2xl text-white relative overflow-hidden group">
                                <div className="absolute -top-10 -left-10 w-40 h-40 bg-indigo-500 rounded-full blur-3xl opacity-20 group-hover:opacity-40 transition-opacity" />
                                <Laptop className="absolute -right-8 -bottom-8 w-48 h-48 text-white/5 group-hover:scale-110 transition-transform duration-1000" />
                                <h3 className="text-lg font-black mb-10 flex items-center gap-3 text-indigo-400 uppercase tracking-widest">
                                    <Laptop className="w-6 h-6" /> Assigned Hardware
                                </h3>
                                {myAsset ? (
                                    <div className="space-y-6 relative z-10">
                                        <div>
                                            <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mb-2">Inventory ID</p>
                                            <p className="text-3xl font-black text-white leading-none">{myAsset.rowKey}</p>
                                        </div>
                                        <div>
                                            <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mb-2">Model</p>
                                            <p className="text-sm font-bold text-indigo-100">{myAsset.AssetBrandName} {myAsset.AssetModelName}</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="py-6 text-center border-2 border-white/5 border-dashed rounded-3xl relative z-10">
                                        <p className="text-xs font-bold text-slate-400 italic">No enterprise assets assigned.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'attendance' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in slide-in-from-bottom-8 duration-700">
                        <AttendanceMarker selectedDate={selectedDate} onDateChange={setSelectedDate} onMarkAttendance={handleMarkAttendance} authUser={user} />
                        <div className="lg:col-span-2 bg-white p-10 rounded-[40px] border border-slate-200 shadow-sm h-full flex flex-col">
                            <div className="flex flex-col sm:flex-row justify-between items-center mb-10 border-b border-slate-100 pb-8 gap-4">
                                <div>
                                    <h3 className="text-xl font-black text-slate-900 flex items-center gap-3"><Clock className="w-6 h-6 text-indigo-500" /> Shift History</h3>
                                    <p className="text-sm text-slate-400 font-medium mt-1 uppercase tracking-widest text-[10px]">Calendar Visualization</p>
                                </div>
                                <button onClick={() => setCalendarRefreshKey(Date.now())} className="p-4 bg-indigo-50 rounded-2xl text-indigo-600 hover:bg-indigo-100 transition-all border border-indigo-100 group">
                                    <RefreshCw className="w-5 h-5 group-active:rotate-180 transition-transform duration-500" />
                                </button>
                            </div>
                            <div className="flex-1">
                                <AttendanceCalendar key={calendarRefreshKey} initialMonthString={selectedDate.substring(0, 7)} />
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'leaves' && (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in slide-in-from-bottom-8 duration-700">
                        {/* Comprehensive Balances */}
                        <div className="lg:col-span-4 space-y-8">
                            <div className="bg-white p-10 rounded-[40px] border border-slate-200 shadow-sm relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full blur-3xl opacity-60" />
                                <h3 className="text-xl font-black text-slate-900 mb-10 border-b border-slate-100 pb-6 relative z-10 flex items-center gap-3">
                                    <PieChart className="w-6 h-6 text-indigo-500" /> Annual Quotas
                                </h3>
                                
                                {leaveQuota ? (
                                    <div className="space-y-5 relative z-10">
                                        <LeaveBalanceCard title="Sick Leave (SL)" {...sickLeave} colorClass="bg-rose-500" />
                                        <LeaveBalanceCard title="Casual Leave (CL)" {...casualLeave} colorClass="bg-indigo-500" />
                                        <LeaveBalanceCard title="Earned Leave (EL)" {...earnedLeave} colorClass="bg-emerald-500" />
                                        <div className="grid grid-cols-2 gap-4">
                                            <LeaveBalanceCard title="Maternity" {...maternityLeave} colorClass="bg-purple-500" />
                                            <LeaveBalanceCard title="Paternity" {...paternityLeave} colorClass="bg-blue-500" />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="py-20 text-center bg-slate-50 rounded-[32px] border-2 border-slate-100 border-dashed">
                                        <AlertCircle className="w-10 h-10 text-slate-300 mx-auto mb-4" />
                                        <p className="text-sm font-black text-slate-400 uppercase tracking-widest">No Quota Data</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Request Forms and History */}
                        <div className="lg:col-span-8 space-y-8">
                            <div className="bg-white p-10 rounded-[40px] border border-slate-200 shadow-sm">
                                <h3 className="text-xl font-black text-slate-900 mb-10 flex items-center gap-3 border-b border-slate-100 pb-6">
                                    <FileText className="w-6 h-6 text-indigo-500" /> Submit Application
                                </h3>
                                <LeaveRequestForm onLeaveRequested={() => { loadInitialData(); setCalendarRefreshKey(Date.now()); }} />
                            </div>
                            
                            <div className="bg-white p-10 rounded-[40px] border border-slate-200 shadow-sm">
                                <div className="flex items-center justify-between mb-10 border-b border-slate-100 pb-6">
                                    <h3 className="text-xl font-black text-slate-900 flex items-center gap-3">
                                        <History className="w-6 h-6 text-indigo-500" /> Application Log
                                    </h3>
                                    <div className="px-5 py-2 bg-slate-100 text-slate-600 text-[10px] font-black uppercase tracking-widest rounded-xl border border-slate-200">
                                        {leaveHistory.length} Records
                                    </div>
                                </div>
                                <LeaveHistory leaveHistory={leaveHistory} />
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Notification Toast Feedback */}
            {(success || error) && (
                <div className={`fixed bottom-12 right-12 flex items-center gap-4 px-10 py-6 rounded-[32px] shadow-[0_20px_50px_rgba(0,0,0,0.2)] z-[60] border-4 animate-in slide-in-from-right-12 ${
                    success ? 'bg-emerald-600 border-emerald-400 text-white' : 'bg-rose-600 border-rose-400 text-white'
                }`}>
                    {success ? <CheckCircle className="w-8 h-8" /> : <AlertCircle className="w-8 h-8" />}
                    <div className="flex flex-col">
                        <span className="font-black text-lg leading-tight uppercase tracking-widest">{success ? 'Success' : 'Error'}</span>
                        <span className="font-bold opacity-90 text-sm">{success || error}</span>
                    </div>
                </div>
            )}
        </div>
    );
};

// --- Atomic Style Helpers ---
const DetailItem = ({ label, value, icon: Icon }) => (
    <div className="p-6 rounded-[32px] bg-slate-50/50 border border-slate-100 hover:border-indigo-200 hover:bg-white transition-all group flex flex-col h-full shadow-sm hover:shadow-md">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 group-hover:text-indigo-500 transition-colors flex items-center gap-2">
            <Icon className="w-3.5 h-3.5" /> {label}
        </p>
        <p className="text-[15px] font-bold text-slate-800 break-words mt-auto">
            {value || <span className="text-slate-300 italic font-medium">Undefined</span>}
        </p>
    </div>
);

const SidebarItem = ({ label, value, icon: Icon }) => (
    <div className="flex items-start gap-4 p-5 rounded-[24px] hover:bg-slate-50 transition-all border border-transparent hover:border-slate-100 group">
        <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center flex-shrink-0 text-slate-500 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
            <Icon className="w-5 h-5" />
        </div>
        <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
            <p className="text-sm font-black text-slate-800 leading-tight">{value || '---'}</p>
        </div>
    </div>
);

export default memo(ProfilePage);