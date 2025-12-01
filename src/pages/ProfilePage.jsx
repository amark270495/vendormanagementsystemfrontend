import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../api/apiService';
import Spinner from '../components/Spinner';
import AttendanceCalendar from '../components/profile/AttendanceCalendar';
import LeaveRequestForm from '../components/profile/LeaveRequestForm';
import LeaveHistory from '../components/profile/LeaveHistory';
import AttendanceMarker from '../components/profile/AttendanceMarker'; // Assuming this component exists or needs to be inline

// --- Helper Components & Icons ---
const CalendarIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;
const QuotaIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>;
const RequestIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>;
const HistoryIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1 text-teal-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const UserIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>;
const IdCardIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2" /></svg>;
const BriefcaseIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.03 23.03 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>;
const CakeIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M21 15.25v-4.25a2 2 0 00-2-2H5a2 2 0 00-2 2v4.25a2 2 0 002 2h14a2 2 0 002-2zM6 18v-3M9 18v-3M12 18v-3m3 0v3m3 0v-3m-15-4.5a.75.75 0 100-1.5.75.75 0 000 1.5zM18 10.5a.75.75 0 100-1.5.75.75 0 000 1.5zM9 10.5a.75.75 0 100-1.5.75.75 0 000 1.5zM15 10.5a.75.75 0 100-1.5.75.75 0 000 1.5zM12 10.5a.75.75 0 100-1.5.75.75 0 000 1.5zM6 9V6a3 3 0 013-3h6a3 3 0 013 3v3" /></svg>;
const PhoneIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>;
const LocationIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
const LinkIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.102 1.101" /></svg>;
const HeartIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 015.13-1.424l.89.445.89-.445a4.5 4.5 0 015.13 1.424A4.5 4.5 0 0119.682 11.5a4.5 4.5 0 01-1.424 5.13l-.445.89-.445.89a4.5 4.5 0 01-5.13 1.424A4.5 4.5 0 0112 19.682a4.5 4.5 0 01-1.424-5.13l-.89-.445-.89-.445a4.5 4.5 0 01-1.424-5.13A4.5 4.5 0 014.318 6.318z" /></svg>;
const UsersIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>;
const ChevronDownIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>;
const ChevronUpIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" /></svg>;

const formatDateForInput = (dateString) => {
    if (!dateString) return '';
    try {
        const date = new Date(dateString);
        const userTimezoneOffset = date.getTimezoneOffset() * 60000;
        const adjustedDate = new Date(date.getTime() + userTimezoneOffset);
        return adjustedDate.toISOString().split('T')[0];
    } catch (e) {
        return '';
    }
};

const DetailItem = ({ label, value, icon, isEditing = false, children }) => (
    <div className="space-y-1">
        <label className="text-sm font-medium text-gray-500 flex items-center">
            {icon} {label}
        </label>
        {isEditing ? (
            children
        ) : (
            <p className="text-md font-semibold text-gray-700 min-h-[28px]">
                {value || <span className="text-gray-400 italic">N/A</span>}
            </p>
        )}
    </div>
);

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

    const employmentTypes = ['Full-Time', 'Part-Time', 'Contractor (C2C)', 'Contractor (1099)'];
    const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
    const relations = ['Spouse', 'Parent', 'Sibling', 'Child', 'Other'];

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
             setLeaveHistory([]);
        }
    }, [user?.userIdentifier]);

    const loadInitialData = useCallback(async () => {
        if (!user?.userIdentifier) {
            setError("User not identified.");
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
            className="w-full p-2 border border-gray-300 rounded-md shadow-sm"
        />
    );

    const renderEditSelect = (name, options) => (
         <select
            name={name}
            id={name}
            value={formData[name] || ''}
            onChange={handleFormChange}
            className="w-full p-2 border border-gray-300 rounded-md shadow-sm bg-white h-[42px]"
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
            className="w-full p-2 border border-gray-300 rounded-md shadow-sm"
        />
    );

    // --- Calculate Remaining Balance Logic ---
    const calculateBalance = (typeKey, typeLabel) => {
        if (!leaveQuota) return { total: 0, used: 0, remaining: 0 };
        
        const total = leaveQuota[typeKey] || 0;
        // typeLabel matches the leaveType string stored in database from LeaveRequestForm
        const used = leaveHistory
            .filter(req => req.status === 'Approved' && req.leaveType === typeLabel)
            .reduce((acc, req) => {
                // Helper to calculate days between two dates inclusive
                const start = new Date(req.startDate);
                const end = new Date(req.endDate);
                const diffTime = Math.abs(end - start);
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; 
                return acc + diffDays;
            }, 0);
            
        return { total, used, remaining: total - used };
    };

    const sickLeave = calculateBalance('sickLeave', 'Sick Leave (SL)');
    const casualLeave = calculateBalance('casualLeave', 'Casual Leave (CL)');
    const earnedLeave = calculateBalance('earnedLeave', 'Earned Leave (EL)');
    const maternityLeave = calculateBalance('maternityLeave', 'Maternity Leave');
    const paternityLeave = calculateBalance('paternityLeave', 'Paternity Leave');
    
    // For LWP and LOP, usually there is no "Quota", just tracking used days. 
    // But if admin set a limit (quota), we show it. If quota is 0/undefined, we can just show used.
    // Here we assume quota logic applies if set.
    const lwp = calculateBalance('lwp', 'Leave Without Pay (LWP)');
    const lop = calculateBalance('lop', 'Loss of Pay (LOP)');


    if (loading) return <div className="flex justify-center items-center h-[70vh]"><Spinner size="12" /></div>;

    return (
        <div className="space-y-8">
             <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                 <h1 className="text-3xl font-bold text-gray-800">My Profile & Attendance</h1>
                 {!isEditing && (
                     <button
                        onClick={() => setIsEditing(true)}
                        className="px-5 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition shadow-sm flex items-center"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.536L16.732 3.732z" /></svg>
                        Edit Profile
                    </button>
                 )}
             </div>

            {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 animate-shake">{error}</div>}
            {success && <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4 animate-fadeIn">{success}</div>}
             
            <form onSubmit={handleSaveChanges}>
                <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-8">
                        <div className="space-y-1">
                            <label className="text-sm font-medium text-gray-500 flex items-center"><UserIcon /> Full Name</label>
                            {isEditing ? (
                                <div className="space-y-2">
                                    <input type="text" name="firstName" placeholder="First Name" value={formData.firstName} onChange={handleFormChange} className="w-full p-2 border border-gray-300 rounded-md shadow-sm mb-2" />
                                    <input type="text" name="middleName" placeholder="Middle (Optional)" value={formData.middleName} onChange={handleFormChange} className="w-full p-2 border border-gray-300 rounded-md shadow-sm mb-2" />
                                    <input type="text" name="lastName" placeholder="Last Name" value={formData.lastName} onChange={handleFormChange} className="w-full p-2 border border-gray-300 rounded-md shadow-sm" />
                                </div>
                            ) : (
                                <p className="text-xl font-bold text-gray-900">{user?.userName || 'User Name'}</p>
                            )}
                        </div>
                        <DetailItem label="Username (Email)" icon={<UserIcon />} value={user?.userIdentifier} />
                        <DetailItem label="Date of Joining" icon={<CalendarIcon />} isEditing={isEditing} value={formatDateForInput(user?.dateOfJoining)}>
                            <input type="date" name="dateOfJoining" value={formData.dateOfJoining} className="w-full p-2 border border-gray-300 rounded-md shadow-sm bg-gray-100" readOnly title="This field can only be changed by an admin." />
                        </DetailItem>
                        <DetailItem label="Personal Mobile" icon={<PhoneIcon />} isEditing={isEditing} value={user?.personalMobileNumber}>
                            {renderEditInput('personalMobileNumber', 'tel')}
                        </DetailItem>
                    </div>

                    <div className={`transition-all duration-500 ease-in-out ${isExpanded || isEditing ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}>
                        <div className="mt-6 pt-6 border-t border-gray-200 space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-8">
                                <DetailItem label="Date of Birth" icon={<CakeIcon />} isEditing={isEditing} value={formatDateForInput(user?.dateOfBirth)}>
                                    {renderEditInput('dateOfBirth', 'date')}
                                </DetailItem>
                                <DetailItem label="Blood Group" icon={<HeartIcon />} isEditing={isEditing} value={user?.bloodGroup}>
                                    {renderEditSelect('bloodGroup', bloodGroups)}
                                </DetailItem>
                                <DetailItem label="Employee Code" icon={<IdCardIcon />} value={user?.employeeCode} />
                                <DetailItem label="Backend Role" icon={<BriefcaseIcon />} value={user?.backendOfficeRole} />
                                <DetailItem label="Employment Type" icon={<BriefcaseIcon />} isEditing={isEditing} value={user?.employmentType}>
                                    <input type="text" name="employmentType" value={formData.employmentType} className="w-full p-2 border border-gray-300 rounded-md shadow-sm bg-gray-100" readOnly title="This field can only be changed by an admin." />
                                </DetailItem>
                                <DetailItem label="Work Location" icon={<LocationIcon />} isEditing={isEditing} value={user?.workLocation}>
                                    <input type="text" name="workLocation" value={formData.workLocation} className="w-full p-2 border border-gray-300 rounded-md shadow-sm bg-gray-100" readOnly title="This field can only be changed by an admin." />
                                </DetailItem>
                                <DetailItem label="Reports To" icon={<UsersIcon />} isEditing={isEditing} value={user?.reportsTo}>
                                    <input type="text" name="reportsTo" value={formData.reportsTo} className="w-full p-2 border border-gray-300 rounded-md shadow-sm bg-gray-100" readOnly title="This field can only be changed by an admin." />
                                </DetailItem>
                                <DetailItem label="LinkedIn Profile" icon={<LinkIcon />} isEditing={isEditing} value={user?.linkedInProfile}>
                                    {renderEditInput('linkedInProfile', 'url')}
                                </DetailItem>
                                <DetailItem label="Current Address" icon={<LocationIcon />} isEditing={isEditing} value={user?.currentAddress}>
                                    {renderEditTextArea('currentAddress')}
                                </DetailItem>
                            </div>
                            
                            <div className="pt-6 mt-6 border-t border-gray-200">
                                 <h3 className="text-lg font-semibold text-gray-800 mb-4">Emergency Contact</h3>
                                 <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-8">
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
                        <div className="mt-4 pt-4 border-t border-gray-200 flex justify-center">
                            <button
                                type="button"
                                onClick={() => setIsExpanded(!isExpanded)}
                                className="text-sm font-semibold text-indigo-600 hover:text-indigo-800 flex items-center"
                            >
                                {isExpanded ? 'Show Less' : 'Show More Details'}
                                {isExpanded ? <ChevronUpIcon /> : <ChevronDownIcon />}
                            </button>
                        </div>
                    )}

                    {isEditing && (
                        <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200">
                             <button type="button" onClick={() => setIsEditing(false)} className="px-5 py-2 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300 transition-colors shadow-sm" disabled={editLoading}>Cancel</button>
                            <button type="submit" className="px-5 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 flex items-center justify-center w-32 transition-colors shadow-md disabled:bg-indigo-400" disabled={editLoading}>{editLoading ? <Spinner size="5" /> : 'Save Changes'}</button>
                        </div>
                    )}
                </div>
            </form>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    <AttendanceMarker selectedDate={selectedDate} onDateChange={handleDateChange} onMarkAttendance={handleMarkAttendance} authUser={user} />
                    <div>
                        <h3 className="text-xl font-semibold mb-3 flex items-center"><CalendarIcon /> Attendance Calendar</h3>
                         <AttendanceCalendar initialMonthString={initialMonthString} key={calendarRefreshKey} />
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="bg-white p-5 rounded-xl shadow-md border border-gray-100">
                        <h3 className="text-md font-semibold mb-3 flex items-center text-gray-800"><QuotaIcon /> Annual Leave Balance</h3>
                        {leaveQuota ? (
                            <div className="text-sm space-y-2">
                                <div className="grid grid-cols-3 font-medium text-gray-500 text-xs uppercase border-b pb-1 mb-1">
                                    <span>Type</span><span className="text-center">Used / Total</span><span className="text-right">Left</span>
                                </div>
                                
                                <div className="grid grid-cols-3 items-center">
                                    <span className="text-gray-700 font-medium">Sick (SL)</span>
                                    <span className="text-center text-gray-600">{sickLeave.used} / {sickLeave.total}</span>
                                    <span className={`text-right font-bold ${sickLeave.remaining < 0 ? 'text-red-600' : 'text-blue-600'}`}>{sickLeave.remaining}</span>
                                </div>
                                <div className="grid grid-cols-3 items-center">
                                    <span className="text-gray-700 font-medium">Casual (CL)</span>
                                    <span className="text-center text-gray-600">{casualLeave.used} / {casualLeave.total}</span>
                                    <span className={`text-right font-bold ${casualLeave.remaining < 0 ? 'text-red-600' : 'text-blue-600'}`}>{casualLeave.remaining}</span>
                                </div>
                                <div className="grid grid-cols-3 items-center">
                                    <span className="text-gray-700 font-medium">Earned (EL)</span>
                                    <span className="text-center text-gray-600">{earnedLeave.used} / {earnedLeave.total}</span>
                                    <span className={`text-right font-bold ${earnedLeave.remaining < 0 ? 'text-red-600' : 'text-blue-600'}`}>{earnedLeave.remaining}</span>
                                </div>
                                <div className="grid grid-cols-3 items-center">
                                    <span className="text-gray-700 font-medium">Maternity</span>
                                    <span className="text-center text-gray-600">{maternityLeave.used} / {maternityLeave.total}</span>
                                    <span className={`text-right font-bold ${maternityLeave.remaining < 0 ? 'text-red-600' : 'text-blue-600'}`}>{maternityLeave.remaining}</span>
                                </div>
                                <div className="grid grid-cols-3 items-center">
                                    <span className="text-gray-700 font-medium">Paternity</span>
                                    <span className="text-center text-gray-600">{paternityLeave.used} / {paternityLeave.total}</span>
                                    <span className={`text-right font-bold ${paternityLeave.remaining < 0 ? 'text-red-600' : 'text-blue-600'}`}>{paternityLeave.remaining}</span>
                                </div>
                                
                                <div className="border-t pt-2 mt-2">
                                    <div className="grid grid-cols-3 items-center">
                                        <span className="text-gray-700 font-medium">LWP</span>
                                        <span className="text-center text-gray-600">{lwp.used} used</span>
                                        <span className="text-right text-gray-400">-</span>
                                    </div>
                                    <div className="grid grid-cols-3 items-center">
                                        <span className="text-gray-700 font-medium">LOP</span>
                                        <span className="text-center text-gray-600">{lop.used} used</span>
                                        <span className="text-right text-gray-400">-</span>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <p className="text-sm text-gray-500 italic">Leave quotas not configured.</p>
                        )}
                    </div>
                    <div className="bg-white p-5 rounded-xl shadow-md border border-gray-100">
                         <h3 className="text-md font-semibold mb-3 flex items-center text-gray-800"><RequestIcon /> Request Leave</h3>
                        <LeaveRequestForm onLeaveRequested={handleLeaveRequested} />
                    </div>
                    <div className="bg-white p-5 rounded-xl shadow-md border border-gray-100">
                        <h3 className="text-md font-semibold mb-3 flex items-center text-gray-800"><HistoryIcon /> Leave History</h3>
                         <LeaveHistory leaveHistory={leaveHistory} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;