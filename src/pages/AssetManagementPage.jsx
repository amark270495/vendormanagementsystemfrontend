import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { usePermissions } from '../hooks/usePermissions';
import { apiService } from '../api/apiService';

// --- Icons ---
const LaptopIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>;
const ClockIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-amber-500 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const ActivityIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-emerald-500 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>;
const UsersIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>;

// Helper: Gets the IST Date String aligned with the 12:00 PM Noon Night Shift Cutoff
const getISTShiftDateString = () => {
    const d = new Date();
    const istFormatter = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Kolkata',
        hour: 'numeric',
        hour12: false
    });
    const istHour = parseInt(istFormatter.format(d), 10);
    
    // If it is before 12:00 PM Noon IST, it belongs to the previous calendar day's shift
    if (istHour < 12) {
        d.setHours(d.getHours() - 12); 
    }
    
    return new Intl.DateTimeFormat('en-CA', { 
        timeZone: 'Asia/Kolkata',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    }).format(d);
};

// Formats timestamp securely into 12-hour AM/PM format to fix 24:xx bugs
const formatLogTime = (isoString) => {
    if (!isoString) return '-';
    try {
        const dateObj = new Date(isoString);
        return dateObj.toLocaleTimeString('en-US', {
            timeZone: 'Asia/Kolkata',
            hour12: true, 
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch (e) {
        return '-';
    }
};

const AssetManagementPage = () => {
    const { user } = useAuth();
    const { canManageAssets, canAssignAssets } = usePermissions();

    const [assets, setAssets] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [activeModal, setActiveModal] = useState(null); 
    const [selectedAsset, setSelectedAsset] = useState(null);
    const [modalData, setModalData] = useState({});
    const [processing, setProcessing] = useState(false);

    const [assetSessions, setAssetSessions] = useState([]);
    const [loadingSessions, setLoadingSessions] = useState(false);
    
    const [sessionDate, setSessionDate] = useState(getISTShiftDateString());
    const [activeTab, setActiveTab] = useState('all');

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [assetRes, userRes] = await Promise.all([
                apiService.getAssets(user.userIdentifier),
                apiService.getUsers(user.userIdentifier)
            ]);
            setAssets(assetRes.data || []);
            setUsers(userRes.data?.users || []);
            setError('');
        } catch (err) {
            console.error("Error fetching dashboard data:", err);
            setError('Failed to load asset data.');
        } finally {
            setLoading(false);
        }
    }, [user.userIdentifier]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const openModal = (type, asset) => {
        setSelectedAsset(asset);
        setModalData({});
        setActiveModal(type);
    };

    const closeModal = () => {
        setActiveModal(null);
        setSelectedAsset(null);
        setModalData({});
        setAssetSessions([]);
        setActiveTab('all');
        setSessionDate(getISTShiftDateString());
    };

    const viewAssetSessions = async (asset, selectedDate = sessionDate) => {
        setSelectedAsset(asset);
        setActiveModal('sessions');
        setLoadingSessions(true);
        try {
            const response = await apiService.getAssetSessions(asset.rowKey, selectedDate, user.userIdentifier);
            if (response.data && response.data.success) {
                setAssetSessions(response.data.sessions || []);
            }
        } catch (err) {
            console.error("Error loading asset sessions", err);
        } finally {
            setLoadingSessions(false);
        }
    };

    // ✅ FIXED: Calculate accurate working hours strictly capped to the 19:00 - 04:00 IST Shift
    const formattedWorkingTime = useMemo(() => {
        if (!assetSessions.length || !sessionDate) return '0h 0m';

        // 1. Establish strict IST Shift Boundaries for the selected date
        // Base shift start: 19:00 IST on `sessionDate`
        const shiftStartStr = `${sessionDate}T19:00:00.000+05:30`;
        const shiftStartIST = new Date(shiftStartStr);

        // Base shift end: 04:00 IST on `sessionDate + 1 day`
        const shiftEndDate = new Date(shiftStartIST);
        shiftEndDate.setDate(shiftEndDate.getDate() + 1);
        shiftEndDate.setHours(4, 0, 0, 0); // 04:00 AM local time of the Date object

        // For string fallback construction if needed
        const nextDayStr = shiftEndDate.toISOString().split('T')[0];
        const shiftEndIST = new Date(`${nextDayStr}T04:00:00.000+05:30`);


        const startTriggers = ['login', 'unlock', 'resume', 'active', 'wake'];
        const endTriggers = ['logout', 'logoff', 'lock', 'idle', 'sleep', 'hibernate'];

        const sorted = [...assetSessions].sort((a, b) => new Date(a.eventTimestamp) - new Date(b.eventTimestamp));
        
        let totalMs = 0;
        let sessionStart = null;

        sorted.forEach(log => {
            const act = log.actionType.toLowerCase();
            const logTime = new Date(log.eventTimestamp);

            if (startTriggers.includes(act) && !sessionStart) {
                // Clamp the start time so it doesn't count time before 7:00 PM
                sessionStart = logTime < shiftStartIST ? shiftStartIST : logTime;
            } else if (endTriggers.includes(act) && sessionStart) {
                // Clamp the end time so it doesn't count time after 4:00 AM
                let sessionEnd = logTime > shiftEndIST ? shiftEndIST : logTime;
                
                // Only add time if the end is actually after the start
                if (sessionEnd > sessionStart) {
                    totalMs += (sessionEnd - sessionStart);
                }
                sessionStart = null;
            }
        });

        let activeString = "";
        if (sessionStart) {
            const now = new Date();
            
            // Only add active time if "now" is still within the shift boundary
            if (now < shiftEndIST) {
                totalMs += Math.max(0, now - sessionStart);
                activeString = " (Active Now)";
            } else {
                // If they never logged out and the shift is over, cap it at the 4 AM boundary
                if (shiftEndIST > sessionStart) {
                    totalMs += (shiftEndIST - sessionStart);
                }
                activeString = " (Missing Logout)";
            }
        }

        // Cap total hours at 9h (just as a final safety measure)
        const maxShiftMs = 9 * 60 * 60 * 1000;
        if (totalMs > maxShiftMs) totalMs = maxShiftMs;

        const hours = Math.floor(totalMs / (1000 * 60 * 60));
        const minutes = Math.floor((totalMs % (1000 * 60 * 60)) / (1000 * 60));
        return `${hours}h ${minutes}m${activeString}`;
    }, [assetSessions, sessionDate]);

    const handleDateChange = (e) => {
        const newDate = e.target.value;
        setSessionDate(newDate);
        if (selectedAsset) viewAssetSessions(selectedAsset, newDate);
    };

    const handleActionSubmit = async (e) => {
        e.preventDefault();
        setProcessing(true);
        try {
            if (activeModal === 'assign') {
                const targetUser = users.find(u => u.username === modalData.userEmail);
                await apiService.assignAsset({ assetId: selectedAsset.rowKey, assignedToEmail: targetUser.username, assignedToName: targetUser.displayName }, user.userIdentifier);
            } else if (activeModal === 'reassign') {
                const targetUser = users.find(u => u.username === modalData.userEmail);
                await apiService.reassignAsset({ assetId: selectedAsset.rowKey, newAssignedToEmail: targetUser.username, newAssignedToName: targetUser.displayName }, user.userIdentifier);
            } else if (activeModal === 'service') {
                await apiService.serviceRepairAsset({ assetId: selectedAsset.rowKey, serviceDetails: modalData.details, isRepair: modalData.isRepair === 'true' }, user.userIdentifier);
            }
            await fetchData();
            closeModal();
        } catch (err) { alert(`Action failed: ${err.message}`); }
        finally { setProcessing(false); }
    };

    const handleDelete = async (assetId) => {
        if (!window.confirm(`Are you sure you want to delete asset ${assetId}?`)) return;
        try {
            await apiService.deleteAsset(assetId, user.userIdentifier);
            setAssets(assets.filter(a => a.rowKey !== assetId));
        } catch (err) { alert('Delete failed.'); }
    };

    const getStatusBadge = (status) => {
        const styles = {
            'Available': 'bg-green-100/80 text-green-800 border-green-200',
            'Assigned': 'bg-blue-100/80 text-blue-800 border-blue-200',
            'Service': 'bg-yellow-100/80 text-yellow-800 border-yellow-200',
            'Repair': 'bg-red-100/80 text-red-800 border-red-200'
        };
        return <span className={`px-3 py-1 text-xs font-bold rounded-full border ${styles[status] || 'bg-gray-100 text-gray-800 border-gray-200'}`}>{status}</span>;
    };

    const getEventBadge = (action, category) => {
        const actionLower = action.toLowerCase();
        const catLower = (category || '').toLowerCase();
        if (['login', 'unlock', 'resume', 'active', 'wake'].includes(actionLower)) 
            return <span className="px-2 py-1 text-[11px] font-bold uppercase rounded-md bg-emerald-100 text-emerald-800 border border-emerald-200">{action}</span>;
        if (['logout', 'logoff', 'lock', 'sleep', 'hibernate'].includes(actionLower)) 
            return <span className="px-2 py-1 text-[11px] font-bold uppercase rounded-md bg-slate-200 text-slate-700 border border-slate-300">{action}</span>;
        if (catLower === 'idle' || actionLower === 'idle')
            return <span className="px-2 py-1 text-[11px] font-bold uppercase rounded-md bg-amber-100 text-amber-800 border border-amber-200">{action}</span>;
        if (catLower === 'usage' || actionLower.includes('usage'))
            return <span className="px-2 py-1 text-[11px] font-bold uppercase rounded-md bg-indigo-100 text-indigo-800 border border-indigo-200">{action}</span>;
        return <span className="px-2 py-1 text-[11px] font-bold uppercase rounded-md bg-gray-100 text-gray-700 border border-gray-200">{action}</span>;
    };

    const filteredSessions = assetSessions.filter(s => {
        const cat = (s.eventCategory || '').toLowerCase();
        const act = s.actionType.toLowerCase();
        if (activeTab === 'all') return true;
        if (activeTab === 'attendance') return cat === 'session' || ['login', 'logoff', 'logout', 'lock', 'unlock', 'resume', 'wake'].includes(act);
        if (activeTab === 'idle') return cat === 'idle' || act === 'idle';
        if (activeTab === 'usage') return cat === 'usage' || act.includes('usage');
        return true;
    });

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white gap-4">
                <div>
                    <h2 className="text-2xl font-extrabold text-slate-800 flex items-center"><LaptopIcon /> Hardware Assets</h2>
                    <p className="text-sm text-slate-500 mt-1 font-medium">Manage inventory, assignments, and active shift tracking.</p>
                </div>
                <button onClick={fetchData} className="text-sm font-bold px-5 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl shadow-sm hover:bg-slate-50 hover:text-indigo-600 transition-all flex items-center">
                    Refresh List
                </button>
            </div>

            {error && <div className="m-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-r-lg text-sm font-medium">{error}</div>}

            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                            <th className="px-6 py-4 text-left text-xs font-black text-slate-400 uppercase tracking-wider">Asset Information</th>
                            <th className="px-6 py-4 text-left text-xs font-black text-slate-400 uppercase tracking-wider">Status & Assignment</th>
                            <th className="px-6 py-4 text-left text-xs font-black text-slate-400 uppercase tracking-wider">Tracking Logs</th>
                            <th className="px-6 py-4 text-right text-xs font-black text-slate-400 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-100">
                        {loading ? (
                            <tr><td colSpan="4" className="px-6 py-16 text-center text-slate-500 font-medium animate-pulse">Loading assets...</td></tr>
                        ) : assets.length === 0 ? (
                            <tr><td colSpan="4" className="px-6 py-16 text-center text-slate-500 font-medium">No assets found in the system.</td></tr>
                        ) : (
                            assets.map((asset) => (
                                <tr key={asset.rowKey} className="hover:bg-indigo-50/30 transition-colors group">
                                    <td className="px-6 py-5 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="flex-shrink-0 h-12 w-12 bg-slate-50 rounded-xl flex items-center justify-center border border-slate-200 text-slate-400 shadow-sm"><LaptopIcon /></div>
                                            <div className="ml-4">
                                                <div className="text-sm font-extrabold text-slate-900">{asset.rowKey}</div>
                                                <div className="text-xs font-medium text-slate-500 mt-0.5">{asset.AssetBrandName} {asset.AssetModelName}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 whitespace-nowrap">
                                        <div className="flex flex-col items-start gap-2">
                                            {getStatusBadge(asset.AssetStatus)}
                                            <div className="text-xs text-slate-600 font-medium">{asset.AssetAssignedTo ? `Assigned: ${asset.AssetAssignedTo}` : <span className="italic text-slate-400">Unassigned</span>}</div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 whitespace-nowrap">
                                        <button onClick={() => viewAssetSessions(asset)} className="inline-flex items-center px-4 py-2 border border-indigo-100 text-xs font-bold rounded-lg text-indigo-700 bg-indigo-50 hover:bg-indigo-100 hover:shadow-sm transition-all">
                                            <ActivityIcon /> View Logs
                                        </button>
                                    </td>
                                    <td className="px-6 py-5 whitespace-nowrap text-right text-sm font-medium">
                                        <div className="flex justify-end gap-2.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                            {canAssignAssets && asset.AssetStatus === 'Available' && (<button onClick={() => openModal('assign', asset)} className="text-indigo-600 border border-indigo-100 bg-white px-3.5 py-1.5 rounded-lg hover:bg-indigo-50 shadow-sm transition-colors">Assign</button>)}
                                            {canAssignAssets && asset.AssetStatus === 'Assigned' && (<button onClick={() => openModal('reassign', asset)} className="text-indigo-600 border border-indigo-100 bg-white px-3.5 py-1.5 rounded-lg hover:bg-indigo-50 shadow-sm transition-colors">Reassign</button>)}
                                            {canManageAssets && (
                                                <>
                                                    <button onClick={() => openModal('service', asset)} className="text-amber-600 border border-amber-100 bg-white px-3.5 py-1.5 rounded-lg hover:bg-amber-50 shadow-sm transition-colors">Service</button>
                                                    <button onClick={() => handleDelete(asset.rowKey)} className="text-red-600 border border-red-100 bg-white px-3.5 py-1.5 rounded-lg hover:bg-red-50 shadow-sm transition-colors">Delete</button>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* MODALS */}
            {activeModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fadeIn">
                    <div className={`bg-white rounded-2xl shadow-2xl w-full flex flex-col border border-slate-200 overflow-hidden transform transition-all ${activeModal === 'sessions' ? 'max-w-4xl max-h-[90vh]' : 'max-w-md'}`}>
                        
                        {/* SESSIONS LOG MODAL */}
                        {activeModal === 'sessions' ? (
                            <div className="flex flex-col h-full overflow-hidden">
                                <div className="px-6 py-5 border-b border-slate-200 bg-white flex justify-between items-center shadow-sm z-10">
                                    <div>
                                        <h3 className="text-xl font-extrabold text-slate-800 flex items-center"><ActivityIcon /> Tracking Logs: {selectedAsset.rowKey}</h3>
                                        <p className="text-sm font-medium text-slate-500 mt-1">IST Shift Boundary: 19:00 - 04:00 (Cap applied)</p>
                                    </div>
                                    <button onClick={closeModal} className="text-slate-400 hover:text-red-500 bg-slate-50 hover:bg-red-50 rounded-full p-1.5 border border-slate-200 transition-colors"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg></button>
                                </div>
                                <div className="px-6 py-4 border-b border-slate-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-50">
                                    <div className="flex items-center space-x-3">
                                        <label className="text-sm font-bold text-slate-600">Shift Date:</label>
                                        <input type="date" value={sessionDate} onChange={handleDateChange} className="px-3 py-2 border border-slate-300 rounded-lg shadow-sm text-sm font-bold text-indigo-700 bg-white focus:ring-2 focus:ring-indigo-500 outline-none" />
                                    </div>
                                    <div className="flex items-center px-4 py-2 bg-white border border-slate-200 shadow-sm rounded-xl">
                                        <ClockIcon />
                                        <span className="text-sm text-slate-600 font-bold ml-1 tracking-wide">Calculated Shift Time: <strong className="text-lg font-black text-indigo-600 ml-1.5">{formattedWorkingTime}</strong></span>
                                    </div>
                                </div>
                                <div className="px-6 pt-3 border-b border-slate-200 bg-white">
                                    <nav className="-mb-px flex space-x-8">
                                        {['all', 'attendance', 'idle', 'usage'].map((tab) => (
                                            <button key={tab} onClick={() => setActiveTab(tab)} className={`whitespace-nowrap pb-3 px-1 border-b-2 font-bold text-sm tracking-wide transition-colors ${activeTab === tab ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-600 hover:border-slate-300'}`}>
                                                {tab.charAt(0).toUpperCase() + tab.slice(1)} Events
                                            </button>
                                        ))}
                                    </nav>
                                </div>
                                <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
                                    {loadingSessions ? (
                                        <div className="py-16 text-center text-slate-500 font-medium animate-pulse">Loading tracking data...</div>
                                    ) : filteredSessions.length === 0 ? (
                                        <div className="py-16 text-center flex flex-col items-center justify-center bg-white rounded-2xl border border-dashed border-slate-300">
                                            <ActivityIcon />
                                            <p className="text-slate-500 font-medium mt-3">No activity records found for this shift.</p>
                                        </div>
                                    ) : (
                                        <div className="border border-slate-200 rounded-xl shadow-sm overflow-hidden bg-white">
                                            <table className="min-w-full divide-y divide-slate-200">
                                                <thead className="bg-slate-50">
                                                    <tr>
                                                        <th className="px-5 py-4 text-left text-xs font-black text-slate-400 uppercase w-32">Event</th>
                                                        <th className="px-5 py-4 text-left text-xs font-black text-slate-400 uppercase">User Email</th>
                                                        <th className="px-5 py-4 text-left text-xs font-black text-slate-400 uppercase">Time (IST)</th>
                                                        <th className="px-5 py-4 text-left text-xs font-black text-slate-400 uppercase">Details / Notes</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100 text-sm">
                                                    {filteredSessions.map((session, idx) => (
                                                        <tr key={idx} className="hover:bg-indigo-50/20 transition-colors">
                                                            <td className="px-5 py-3.5">{getEventBadge(session.actionType, session.eventCategory)}</td>
                                                            <td className="px-5 py-3.5 text-slate-700 font-bold">{session.userEmail}</td>
                                                            <td className="px-5 py-3.5 text-indigo-600 font-bold tracking-wide whitespace-nowrap">
                                                                {/* Perfectly formatted 12-hour timestamp string */}
                                                                {formatLogTime(session.eventTimestamp)}
                                                            </td>
                                                            <td className="px-5 py-3.5 text-slate-600 italic font-medium">{session.workDoneNotes || '-'}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            
                            /* ACTION MODALS (Assign, Reassign, Service) */
                            <form onSubmit={handleActionSubmit} className="flex flex-col h-full">
                                <div className="px-6 py-5 border-b border-slate-100 bg-white">
                                    <h3 className="text-xl font-extrabold text-slate-800 flex items-center capitalize">
                                        {activeModal === 'assign' || activeModal === 'reassign' ? <UsersIcon /> : <ActivityIcon />}
                                        {activeModal} Asset: <span className="text-indigo-600 ml-2">{selectedAsset.rowKey}</span>
                                    </h3>
                                    <p className="text-xs font-medium text-slate-400 mt-1 uppercase tracking-wider">{selectedAsset.AssetBrandName} {selectedAsset.AssetModelName}</p>
                                </div>

                                <div className="p-6 bg-slate-50 space-y-5 flex-1">
                                    {(activeModal === 'assign' || activeModal === 'reassign') && (
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-2">Select Target Employee</label>
                                            <select 
                                                required 
                                                value={modalData.userEmail || ''} 
                                                onChange={(e) => setModalData({...modalData, userEmail: e.target.value})} 
                                                className="w-full border-slate-300 rounded-xl p-3 shadow-sm focus:ring-2 focus:ring-indigo-500 font-medium text-slate-700"
                                            >
                                                <option value="" disabled>-- Choose Employee --</option>
                                                {users.map(u => <option key={u.username} value={u.username}>{u.displayName} ({u.username})</option>)}
                                            </select>
                                        </div>
                                    )}

                                    {activeModal === 'service' && (
                                        <>
                                            <div>
                                                <label className="block text-sm font-bold text-slate-700 mb-2">Service Type</label>
                                                <select 
                                                    required 
                                                    value={modalData.isRepair || ''} 
                                                    onChange={(e) => setModalData({...modalData, isRepair: e.target.value})} 
                                                    className="w-full border-slate-300 rounded-xl p-3 shadow-sm focus:ring-2 focus:ring-indigo-500 font-medium text-slate-700"
                                                >
                                                    <option value="" disabled>-- Select Type --</option>
                                                    <option value="false">Routine Service / Maintenance</option>
                                                    <option value="true">Hardware Repair</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-bold text-slate-700 mb-2">Service Details</label>
                                                <textarea 
                                                    required 
                                                    rows="4" 
                                                    value={modalData.details || ''} 
                                                    onChange={(e) => setModalData({...modalData, details: e.target.value})} 
                                                    className="w-full border-slate-300 rounded-xl p-3 shadow-sm focus:ring-2 focus:ring-indigo-500 font-medium text-slate-700 resize-none" 
                                                    placeholder="Describe the issue or service performed..."
                                                ></textarea>
                                            </div>
                                        </>
                                    )}
                                </div>

                                <div className="px-6 py-4 border-t border-slate-100 bg-white flex justify-end gap-3 rounded-b-2xl">
                                    <button 
                                        type="button" 
                                        onClick={closeModal} 
                                        className="px-5 py-2.5 text-sm font-bold text-slate-600 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        type="submit" 
                                        disabled={processing} 
                                        className="px-6 py-2.5 text-sm font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 shadow-sm transition-colors flex items-center justify-center min-w-[120px]"
                                    >
                                        {processing ? 'Processing...' : `Confirm ${activeModal}`}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default AssetManagementPage;