import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../api/apiService';
import Spinner from '../components/Spinner';

// --- Icons ---
const UserIcon = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>;
const MailIcon = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect width="20" height="16" x="2" y="4" rx="2"></rect><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path></svg>;
const PhoneIcon = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>;
const MapPinIcon = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path><circle cx="12" cy="10" r="3"></circle></svg>;
const ShieldIcon = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>;
const EditIcon = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>;
const SaveIcon = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>;
const XIcon = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>;
const BuildingIcon = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect><line x1="9" y1="22" x2="9" y2="22.01"></line><line x1="15" y1="22" x2="15" y2="22.01"></line><line x1="12" y1="18" x2="12" y2="18.01"></line><line x1="12" y1="14" x2="12" y2="14.01"></line><line x1="12" y1="10" x2="12" y2="10.01"></line><line x1="12" y1="6" x2="12" y2="6.01"></line><line x1="16" y1="18" x2="16" y2="18.01"></line><line x1="16" y1="14" x2="16" y2="14.01"></line><line x1="16" y1="10" x2="16" y2="10.01"></line><line x1="16" y1="6" x2="16" y2="6.01"></line><line x1="8" y1="18" x2="8" y2="18.01"></line><line x1="8" y1="14" x2="8" y2="14.01"></line><line x1="8" y1="10" x2="8" y2="10.01"></line><line x1="8" y1="6" x2="8" y2="6.01"></line></svg>;
const CalendarIcon = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>;
const ClockIcon = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>;
const PlusIcon = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>;

const ProfilePage = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('overview');
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    
    // --- Overview State ---
    const [formData, setFormData] = useState({
        displayName: '',
        phone: '',
        location: '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    // --- Leaves & Attendance State ---
    const [isApplyLeaveOpen, setIsApplyLeaveOpen] = useState(false);
    const [leaveFormData, setLeaveFormData] = useState({ type: 'Casual Leave', startDate: '', endDate: '', reason: '' });
    const [leaveBalances, setLeaveBalances] = useState([]);
    const [leaveHistory, setLeaveHistory] = useState([]);
    const [attendanceData, setAttendanceData] = useState([]);

    // Initialize Form Data from User Context
    useEffect(() => {
        if (user) {
            setFormData(prev => ({
                ...prev,
                displayName: user.displayName || '',
                phone: user.phone || '',
                location: user.location || ''
            }));
        }
    }, [user]);

    // Fetch Dashboard Data (Leaves, Attendance)
    useEffect(() => {
        const fetchDashboardData = async () => {
            // In a real app, you would fetch this from your API.
            // Example:
            // try {
            //    const leaves = await apiService.getLeaveBalances(user.userIdentifier);
            //    const history = await apiService.getLeaveHistory(user.userIdentifier);
            //    setLeaveBalances(leaves);
            //    setLeaveHistory(history);
            // } catch (error) { ... }

            // --- TEMPORARY: Placeholder Data for UI ---
            setLeaveBalances([
                { type: 'Casual Leave', used: 4, total: 12, color: 'bg-blue-500' },
                { type: 'Sick Leave', used: 2, total: 10, color: 'bg-red-500' },
                { type: 'Privilege Leave', used: 5, total: 15, color: 'bg-green-500' },
            ]);
            setLeaveHistory([
                { id: 1, type: 'Sick Leave', from: '2023-10-10', to: '2023-10-12', status: 'Approved', days: 3 },
                { id: 2, type: 'Casual Leave', from: '2023-11-05', to: '2023-11-05', status: 'Pending', days: 1 },
                { id: 3, type: 'Privilege Leave', from: '2023-08-15', to: '2023-08-20', status: 'Rejected', days: 5 },
            ]);
            // Generate simple attendance mock
            const mockAttendance = Array.from({ length: 30 }, (_, i) => {
                const r = Math.random();
                let status = 'Present';
                if (r > 0.9) status = 'Absent';
                else if (r > 0.8) status = 'Late';
                else if (i % 7 === 0 || i % 7 === 6) status = 'Weekend';
                return { day: i + 1, status };
            });
            setAttendanceData(mockAttendance);
            // ------------------------------------------
        };

        if (user) {
            fetchDashboardData();
        }
    }, [user]);

    // --- Handlers ---
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleLeaveInputChange = (e) => {
        const { name, value } = e.target;
        setLeaveFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ type: '', text: '' });
        
        try {
            const res = await apiService.updateProfile(user.userIdentifier, {
                displayName: formData.displayName,
                phone: formData.phone,
                location: formData.location
            });
            if (res.data.success) {
                setMessage({ type: 'success', text: 'Profile updated successfully!' });
                setIsEditing(false);
            } else {
                setMessage({ type: 'error', text: res.data.message || 'Update failed.' });
            }
        } catch (err) {
            console.error(err);
            setMessage({ type: 'error', text: 'An error occurred while updating profile.' });
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordChange = async (e) => {
        e.preventDefault();
        if (formData.newPassword !== formData.confirmPassword) {
            setMessage({ type: 'error', text: 'New passwords do not match.' });
            return;
        }
        setLoading(true);
        setMessage({ type: '', text: '' });

        try {
            const res = await apiService.changePassword(user.userIdentifier, formData.currentPassword, formData.newPassword);
            if (res.data.success) {
                setMessage({ type: 'success', text: 'Password changed successfully.' });
                setFormData(prev => ({ ...prev, currentPassword: '', newPassword: '', confirmPassword: '' }));
            } else {
                setMessage({ type: 'error', text: res.data.message || 'Failed to change password.' });
            }
        } catch (err) {
            console.error(err);
            setMessage({ type: 'error', text: 'An error occurred.' });
        } finally {
            setLoading(false);
        }
    };

    const handleApplyLeave = async (e) => {
        e.preventDefault();
        setLoading(true);
        
        // --- TODO: REPLACE WITH API CALL ---
        // try {
        //     await apiService.applyLeave(user.userIdentifier, leaveFormData);
        //     // refresh data...
        // } catch(e) { ... }
        
        // Mock simulation for UI feedback
        setTimeout(() => {
            const newLeave = {
                id: Date.now(),
                type: leaveFormData.type,
                from: leaveFormData.startDate,
                to: leaveFormData.endDate,
                status: 'Pending',
                days: Math.ceil((new Date(leaveFormData.endDate) - new Date(leaveFormData.startDate)) / (1000 * 60 * 60 * 24)) + 1
            };
            setLeaveHistory([newLeave, ...leaveHistory]);
            setLeaveFormData({ type: 'Casual Leave', startDate: '', endDate: '', reason: '' });
            setIsApplyLeaveOpen(false);
            setLoading(false);
            setMessage({ type: 'success', text: 'Leave application submitted successfully.' });
        }, 1000);
        // -----------------------------------
    };

    // Helper Component for Data Fields
    const InfoField = ({ icon: Icon, label, value, name, isEditable, type = "text" }) => (
        <div className="flex items-start p-4 bg-gray-50 rounded-xl border border-gray-100 transition-colors hover:border-gray-200">
            <div className="p-2.5 bg-white rounded-lg shadow-sm mr-4 text-indigo-600 shrink-0">
                <Icon className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">{label}</p>
                {isEditable ? (
                    <input
                        type={type}
                        name={name}
                        value={formData[name]}
                        onChange={handleInputChange}
                        className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all shadow-sm"
                        placeholder={`Enter ${label}`}
                    />
                ) : (
                    <p className="text-gray-900 font-medium text-sm sm:text-base truncate">{value || 'Not set'}</p>
                )}
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50/50 pb-12 font-inter">
            {/* Hero Header */}
            <div className="relative h-48 bg-gradient-to-r from-indigo-900 via-slate-800 to-slate-900 overflow-hidden">
                <div className="absolute inset-0 bg-black opacity-20"></div>
                <div className="absolute -bottom-24 -right-10 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl"></div>
                <div className="absolute top-0 left-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl"></div>
            </div>

            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-20 relative z-10">
                {/* Main Card */}
                <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                    
                    {/* Header Content */}
                    <div className="p-6 sm:p-8 flex flex-col sm:flex-row items-center sm:items-end sm:justify-between border-b border-gray-100 bg-white relative">
                        <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6 text-center sm:text-left">
                            {/* Avatar */}
                            <div className="relative -mt-16 sm:-mt-20">
                                <div className="w-32 h-32 rounded-full border-4 border-white shadow-lg bg-indigo-100 flex items-center justify-center overflow-hidden">
                                    <span className="text-4xl font-bold text-indigo-600">
                                        {user?.displayName ? user.displayName.charAt(0).toUpperCase() : 'U'}
                                    </span>
                                </div>
                                <div className="absolute bottom-2 right-2 w-5 h-5 bg-green-500 border-2 border-white rounded-full"></div>
                            </div>
                            
                            {/* Text Info */}
                            <div className="mb-2">
                                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
                                    {user?.displayName || 'User Profile'}
                                </h1>
                                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mt-2">
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-100">
                                        {user?.role || 'Team Member'}
                                    </span>
                                    <span className="flex items-center text-sm text-gray-500">
                                        <BuildingIcon className="w-4 h-4 mr-1.5" />
                                        {user?.department || 'General'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Edit Toggle (Only visible on Overview tab) */}
                        {activeTab === 'overview' && (
                            <button
                                onClick={() => setIsEditing(!isEditing)}
                                disabled={loading}
                                className={`mt-6 sm:mt-0 inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                                    isEditing 
                                        ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' 
                                        : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-500/30'
                                }`}
                            >
                                {isEditing ? (
                                    <>
                                        <XIcon className="w-4 h-4 mr-2" /> Cancel
                                    </>
                                ) : (
                                    <>
                                        <EditIcon className="w-4 h-4 mr-2" /> Edit Profile
                                    </>
                                )}
                            </button>
                        )}
                        
                        {activeTab === 'leaves' && (
                            <button
                                onClick={() => setIsApplyLeaveOpen(!isApplyLeaveOpen)}
                                className="mt-6 sm:mt-0 inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-500/30 transition-all duration-200"
                            >
                                {isApplyLeaveOpen ? <XIcon className="w-4 h-4 mr-2" /> : <PlusIcon className="w-4 h-4 mr-2" />}
                                {isApplyLeaveOpen ? 'Cancel Application' : 'Apply for Leave'}
                            </button>
                        )}
                    </div>

                    {/* Tabs Navigation */}
                    <div className="flex border-b border-gray-100 px-6 sm:px-8 bg-gray-50/30 overflow-x-auto">
                        <button
                            onClick={() => { setActiveTab('overview'); setIsEditing(false); setMessage({type: '', text: ''}); }}
                            className={`pb-4 pt-4 px-2 text-sm font-medium border-b-2 transition-colors mr-8 whitespace-nowrap ${
                                activeTab === 'overview'
                                    ? 'border-indigo-600 text-indigo-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                        >
                            Overview
                        </button>
                        <button
                            onClick={() => { setActiveTab('leaves'); setIsEditing(false); setMessage({type: '', text: ''}); }}
                            className={`pb-4 pt-4 px-2 text-sm font-medium border-b-2 transition-colors mr-8 whitespace-nowrap ${
                                activeTab === 'leaves'
                                    ? 'border-indigo-600 text-indigo-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                        >
                            Time Off & Attendance
                        </button>
                        <button
                            onClick={() => { setActiveTab('security'); setIsEditing(false); setMessage({type: '', text: ''}); }}
                            className={`pb-4 pt-4 px-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                                activeTab === 'security'
                                    ? 'border-indigo-600 text-indigo-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                        >
                            Security
                        </button>
                    </div>

                    {/* Content Area */}
                    <div className="p-6 sm:p-8 bg-white min-h-[400px]">
                        {/* Status Messages */}
                        {message.text && (
                            <div className={`mb-6 p-4 rounded-xl flex items-start ${
                                message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'
                            }`}>
                                <div className={`mt-0.5 mr-3 flex-shrink-0 ${
                                    message.type === 'success' ? 'text-green-500' : 'text-red-500'
                                }`}>
                                    {message.type === 'success' ? (
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                                    ) : (
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                    )}
                                </div>
                                <p className="text-sm font-medium">{message.text}</p>
                            </div>
                        )}

                        {activeTab === 'overview' && (
                            <form onSubmit={handleProfileUpdate} className="space-y-6 animate-fadeIn">
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    <InfoField 
                                        icon={UserIcon} 
                                        label="Display Name" 
                                        value={user?.displayName} 
                                        name="displayName" 
                                        isEditable={isEditing} 
                                    />
                                    <InfoField 
                                        icon={MailIcon} 
                                        label="Email Address" 
                                        value={user?.email} 
                                        name="email" 
                                        isEditable={false} // Email usually readonly
                                    />
                                    <InfoField 
                                        icon={PhoneIcon} 
                                        label="Phone Number" 
                                        value={user?.phone} 
                                        name="phone" 
                                        isEditable={isEditing} 
                                    />
                                    <InfoField 
                                        icon={MapPinIcon} 
                                        label="Location" 
                                        value={user?.location} 
                                        name="location" 
                                        isEditable={isEditing} 
                                    />
                                </div>

                                {isEditing && (
                                    <div className="flex justify-end pt-4 border-t border-gray-100">
                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="inline-flex items-center px-6 py-2.5 bg-indigo-600 border border-transparent rounded-xl font-semibold text-sm text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 shadow-lg shadow-indigo-500/30 transition-all"
                                        >
                                            {loading ? <Spinner size="4" /> : (
                                                <>
                                                    <SaveIcon className="w-4 h-4 mr-2" /> Save Changes
                                                </>
                                            )}
                                        </button>
                                    </div>
                                )}
                            </form>
                        )}

                        {activeTab === 'leaves' && (
                            <div className="space-y-8 animate-fadeIn">
                                {/* Section 1: Leave Balances */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    {leaveBalances.map((leave, idx) => (
                                        <div key={idx} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
                                            <div className={`absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 rounded-full opacity-10 ${leave.color}`}></div>
                                            <div className="relative z-10">
                                                <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">{leave.type}</h4>
                                                <div className="flex items-baseline mt-3">
                                                    <span className="text-3xl font-bold text-gray-900">{leave.total - leave.used}</span>
                                                    <span className="text-sm text-gray-400 ml-2">/ {leave.total} days left</span>
                                                </div>
                                                <div className="w-full bg-gray-100 rounded-full h-1.5 mt-4">
                                                    <div 
                                                        className={`h-1.5 rounded-full ${leave.color.replace('bg-', 'bg-')}`} 
                                                        style={{ width: `${(leave.used / leave.total) * 100}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Section 2: Apply Leave Form (Collapsible) */}
                                {isApplyLeaveOpen && (
                                    <div className="bg-indigo-50/50 p-6 rounded-2xl border border-indigo-100 animate-slideDown">
                                        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                                            <PlusIcon className="w-5 h-5 mr-2 text-indigo-600" /> Apply for New Leave
                                        </h3>
                                        <form onSubmit={handleApplyLeave} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div>
                                                <label className="block text-sm font-semibold text-gray-700 mb-2">Leave Type</label>
                                                <select
                                                    name="type"
                                                    value={leaveFormData.type}
                                                    onChange={handleLeaveInputChange}
                                                    className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500/50 outline-none"
                                                >
                                                    {leaveBalances.map(l => <option key={l.type} value={l.type}>{l.type}</option>)}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold text-gray-700 mb-2">Reason</label>
                                                <input
                                                    type="text"
                                                    name="reason"
                                                    value={leaveFormData.reason}
                                                    onChange={handleLeaveInputChange}
                                                    placeholder="e.g. Doctor's appointment"
                                                    className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500/50 outline-none"
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold text-gray-700 mb-2">From Date</label>
                                                <input
                                                    type="date"
                                                    name="startDate"
                                                    value={leaveFormData.startDate}
                                                    onChange={handleLeaveInputChange}
                                                    className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500/50 outline-none"
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold text-gray-700 mb-2">To Date</label>
                                                <input
                                                    type="date"
                                                    name="endDate"
                                                    value={leaveFormData.endDate}
                                                    onChange={handleLeaveInputChange}
                                                    className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500/50 outline-none"
                                                    required
                                                />
                                            </div>
                                            <div className="md:col-span-2 flex justify-end">
                                                <button
                                                    type="submit"
                                                    disabled={loading}
                                                    className="px-6 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 shadow-lg shadow-indigo-500/30 transition-all"
                                                >
                                                    {loading ? <Spinner size="4" /> : 'Submit Application'}
                                                </button>
                                            </div>
                                        </form>
                                    </div>
                                )}

                                <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                                    {/* Section 3: Attendance Calendar */}
                                    <div className="xl:col-span-1">
                                        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                                            <CalendarIcon className="w-5 h-5 mr-2 text-gray-500" /> Attendance (This Month)
                                        </h3>
                                        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                                            <div className="grid grid-cols-7 gap-2 text-center text-xs font-semibold text-gray-400 mb-2">
                                                <span>Su</span><span>Mo</span><span>Tu</span><span>We</span><span>Th</span><span>Fr</span><span>Sa</span>
                                            </div>
                                            <div className="grid grid-cols-7 gap-2">
                                                {attendanceData.map((day) => (
                                                    <div key={day.day} className="flex flex-col items-center group">
                                                        <div className={`
                                                            w-8 h-8 flex items-center justify-center rounded-lg text-xs font-medium transition-all
                                                            ${day.status === 'Present' ? 'bg-green-50 text-green-700 border border-green-100' : ''}
                                                            ${day.status === 'Absent' ? 'bg-red-50 text-red-700 border border-red-100' : ''}
                                                            ${day.status === 'Late' ? 'bg-yellow-50 text-yellow-700 border border-yellow-100' : ''}
                                                            ${day.status === 'Weekend' ? 'bg-gray-50 text-gray-300' : ''}
                                                        `} title={`${day.status} - Day ${day.day}`}>
                                                            {day.day}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="flex justify-between items-center mt-6 text-xs text-gray-500 px-2">
                                                <div className="flex items-center"><span className="w-2 h-2 rounded-full bg-green-500 mr-1.5"></span> Present</div>
                                                <div className="flex items-center"><span className="w-2 h-2 rounded-full bg-red-500 mr-1.5"></span> Absent</div>
                                                <div className="flex items-center"><span className="w-2 h-2 rounded-full bg-yellow-500 mr-1.5"></span> Late</div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Section 4: Leave History */}
                                    <div className="xl:col-span-2">
                                        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                                            <ClockIcon className="w-5 h-5 mr-2 text-gray-500" /> Leave History
                                        </h3>
                                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                                            <div className="overflow-x-auto">
                                                <table className="min-w-full divide-y divide-gray-100">
                                                    <thead className="bg-gray-50/50">
                                                        <tr>
                                                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</th>
                                                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Duration</th>
                                                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Dates</th>
                                                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="bg-white divide-y divide-gray-100">
                                                        {leaveHistory.map((leave) => (
                                                            <tr key={leave.id} className="hover:bg-gray-50 transition-colors">
                                                                <td className="px-6 py-4 whitespace-nowrap">
                                                                    <span className="text-sm font-medium text-gray-900">{leave.type}</span>
                                                                </td>
                                                                <td className="px-6 py-4 whitespace-nowrap">
                                                                    <span className="text-sm text-gray-500">{leave.days} days</span>
                                                                </td>
                                                                <td className="px-6 py-4 whitespace-nowrap">
                                                                    <span className="text-sm text-gray-500">{leave.from} - {leave.to}</span>
                                                                </td>
                                                                <td className="px-6 py-4 whitespace-nowrap">
                                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                                                                        ${leave.status === 'Approved' ? 'bg-green-100 text-green-800' : ''}
                                                                        ${leave.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' : ''}
                                                                        ${leave.status === 'Rejected' ? 'bg-red-100 text-red-800' : ''}
                                                                    `}>
                                                                        {leave.status}
                                                                    </span>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'security' && (
                            <div className="max-w-xl mx-auto animate-fadeIn">
                                <div className="text-center mb-8">
                                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 mb-4">
                                        <ShieldIcon className="w-6 h-6" />
                                    </div>
                                    <h3 className="text-lg font-bold text-gray-900">Change Password</h3>
                                    <p className="text-sm text-gray-500 mt-1">Ensure your account is secure by using a strong password.</p>
                                </div>

                                <form onSubmit={handlePasswordChange} className="space-y-5">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Current Password</label>
                                        <input
                                            type="password"
                                            name="currentPassword"
                                            value={formData.currentPassword}
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                                            placeholder="Enter current password"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">New Password</label>
                                        <input
                                            type="password"
                                            name="newPassword"
                                            value={formData.newPassword}
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                                            placeholder="Enter new password"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Confirm New Password</label>
                                        <input
                                            type="password"
                                            name="confirmPassword"
                                            value={formData.confirmPassword}
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                                            placeholder="Confirm new password"
                                            required
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full flex justify-center items-center py-3.5 px-4 bg-gray-900 border border-transparent rounded-xl font-bold text-sm text-white hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 transition-all mt-4"
                                    >
                                        {loading ? <Spinner size="5" /> : 'Update Password'}
                                    </button>
                                </form>
                            </div>
                        )}
                    </div>
                </div>
                
                <div className="mt-6 text-center text-xs text-gray-400">
                    <p>Last login: {new Date().toLocaleDateString()} from 192.168.1.1</p>
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;