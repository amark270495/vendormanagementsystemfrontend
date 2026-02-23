import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { usePermissions } from '../hooks/usePermissions';
import { apiService } from '../api/apiService';

// --- Icons ---
const LaptopIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>;
const ClockIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-amber-500 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const ActivityIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-emerald-500 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>;

const getLocalDateString = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const AssetManagementPage = () => {
    const { user } = useAuth();
    const { canManageAssets, canAssignAssets } = usePermissions();

    const [assets, setAssets] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Modal States
    const [activeModal, setActiveModal] = useState(null); 
    const [selectedAsset, setSelectedAsset] = useState(null);
    const [modalData, setModalData] = useState({});
    const [processing, setProcessing] = useState(false);

    // Session Tracking States
    const [assetSessions, setAssetSessions] = useState([]);
    const [loadingSessions, setLoadingSessions] = useState(false);
    const [sessionDate, setSessionDate] = useState(getLocalDateString());
    
    // ✅ NEW: Enhanced Tracking UI States
    const [sessionSummary, setSessionSummary] = useState('0h 0m');
    const [activeTab, setActiveTab] = useState('all'); // 'all', 'attendance', 'idle', 'usage'

    // Fetch Data
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
            setError('Failed to load asset data. Please try again.');
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
        setSessionSummary('0h 0m');
        setActiveTab('all');
        setSessionDate(getLocalDateString());
    };

    const viewAssetSessions = async (asset, selectedDate = sessionDate) => {
        setSelectedAsset(asset);
        setActiveModal('sessions');
        setLoadingSessions(true);
        setAssetSessions([]); 
        setSessionSummary('0h 0m');
        
        try {
            const response = await apiService.getAssetSessions(asset.rowKey, selectedDate, user.userIdentifier);
            if (response.data && response.data.success) {
                setAssetSessions(response.data.sessions);
                // ✅ Capture the total working time calculated by the backend
                if (response.data.formattedWorkingTime) {
                    setSessionSummary(response.data.formattedWorkingTime);
                }
            } else {
                alert("Failed to load sessions: " + (response.data?.message || "Unknown error"));
            }
        } catch (err) {
            console.error("Error loading asset sessions", err);
            alert("Error loading tracking logs from the server.");
        } finally {
            setLoadingSessions(false);
        }
    };

    const handleDateChange = (e) => {
        const newDate = e.target.value;
        setSessionDate(newDate);
        if (selectedAsset) {
            viewAssetSessions(selectedAsset, newDate);
        }
    };

    const handleActionSubmit = async (e) => {
        e.preventDefault();
        setProcessing(true);

        try {
            if (activeModal === 'assign') {
                const targetUser = users.find(u => u.username === modalData.userEmail);
                if (!targetUser) throw new Error("Please select a valid user.");

                await apiService.assignAsset({
                    assetId: selectedAsset.rowKey,
                    assignedToEmail: targetUser.username,
                    assignedToName: targetUser.displayName
                }, user.userIdentifier);
            } 
            else if (activeModal === 'reassign') {
                const targetUser = users.find(u => u.username === modalData.userEmail);
                if (!targetUser) throw new Error("Please select a valid user.");

                await apiService.reassignAsset({
                    assetId: selectedAsset.rowKey,
                    newAssignedToEmail: targetUser.username,
                    newAssignedToName: targetUser.displayName
                }, user.userIdentifier);
            } 
            else if (activeModal === 'service') {
                await apiService.serviceRepairAsset({
                    assetId: selectedAsset.rowKey,
                    serviceDetails: modalData.details,
                    isRepair: modalData.isRepair === 'true'
                }, user.userIdentifier);
            }

            await fetchData();
            closeModal();
        } catch (err) {
            alert(`Action failed: ${err.response?.data?.error || err.message}`);
        } finally {
            setProcessing(false);
        }
    };

    const handleDelete = async (assetId) => {
        if (!window.confirm(`Are you sure you want to permanently delete asset ${assetId}?`)) return;
        try {
            await apiService.deleteAsset(assetId, user.userIdentifier);
            setAssets(assets.filter(a => a.rowKey !== assetId));
        } catch (err) {
            alert('Failed to delete asset. You may not have adequate permissions.');
        }
    };

    const getStatusBadge = (status) => {
        const styles = {
            'Available': 'bg-green-100 text-green-800 border-green-200',
            'Assigned': 'bg-blue-100 text-blue-800 border-blue-200',
            'Service': 'bg-yellow-100 text-yellow-800 border-yellow-200',
            'Repair': 'bg-red-100 text-red-800 border-red-200'
        };
        return <span className={`px-2.5 py-1 text-xs font-bold rounded-full border ${styles[status] || 'bg-gray-100 text-gray-800 border-gray-200'}`}>{status}</span>;
    };

    // ✅ NEW: Dynamic styling for different event types in the log table
    const getEventBadge = (action, category) => {
        const actionLower = action.toLowerCase();
        const catLower = (category || '').toLowerCase();

        if (actionLower.includes('login') || actionLower.includes('unlock')) 
            return <span className="px-2 py-1 text-[11px] font-bold uppercase rounded-md bg-emerald-100 text-emerald-800 border border-emerald-200">{action}</span>;
        
        if (actionLower.includes('logoff') || actionLower.includes('logout') || actionLower.includes('lock')) 
            return <span className="px-2 py-1 text-[11px] font-bold uppercase rounded-md bg-slate-200 text-slate-700 border border-slate-300">{action}</span>;
            
        if (catLower === 'idle' || actionLower === 'idle')
            return <span className="px-2 py-1 text-[11px] font-bold uppercase rounded-md bg-amber-100 text-amber-800 border border-amber-200">{action}</span>;
            
        if (catLower === 'usage' || actionLower.includes('usage'))
            return <span className="px-2 py-1 text-[11px] font-bold uppercase rounded-md bg-indigo-100 text-indigo-800 border border-indigo-200">{action}</span>;

        return <span className="px-2 py-1 text-[11px] font-bold uppercase rounded-md bg-gray-100 text-gray-700 border border-gray-200">{action}</span>;
    };

    // ✅ NEW: Filter logic for the modal tabs
    const filteredSessions = assetSessions.filter(s => {
        const cat = (s.eventCategory || '').toLowerCase();
        const act = s.actionType.toLowerCase();
        
        if (activeTab === 'all') return true;
        if (activeTab === 'attendance') return cat === 'session' || ['login', 'logoff', 'logout', 'lock', 'unlock'].includes(act);
        if (activeTab === 'idle') return cat === 'idle' || act === 'idle';
        if (activeTab === 'usage') return cat === 'usage' || act.includes('usage');
        return true;
    });

    return (
        <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
            {/* Header */}
            <div className="px-6 py-5 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center bg-gradient-to-r from-slate-50 to-white gap-4">
                <div>
                    <h2 className="text-xl font-extrabold text-slate-800 flex items-center">
                        <LaptopIcon /> Company Hardware Assets
                    </h2>
                    <p className="text-sm text-slate-500 mt-1">Manage inventory, assignments, and view usage logs.</p>
                </div>
                <button onClick={fetchData} className="text-sm font-medium px-4 py-2 bg-white border border-slate-300 rounded-lg shadow-sm hover:bg-slate-50 focus:ring-2 focus:ring-indigo-500 transition-all flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                    Refresh
                </button>
            </div>

            {error && <div className="m-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm flex items-center"><svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>{error}</div>}

            {/* Styled Data Grid */}
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50/80">
                        <tr>
                            <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Asset Information</th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Status & Assignment</th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Tracking Logs</th>
                            <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-100">
                        {loading ? (
                            <tr><td colSpan="4" className="px-6 py-12 text-center text-slate-500"><div className="animate-pulse flex flex-col items-center"><div className="h-8 w-8 bg-slate-200 rounded-full mb-3"></div>Loading assets...</div></td></tr>
                        ) : assets.length === 0 ? (
                            <tr><td colSpan="4" className="px-6 py-12 text-center text-slate-500">No assets found in the inventory.</td></tr>
                        ) : (
                            assets.map((asset) => (
                                <tr key={asset.rowKey} className="hover:bg-indigo-50/30 transition-colors group">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="flex-shrink-0 h-10 w-10 bg-slate-100 rounded-lg flex items-center justify-center border border-slate-200">
                                                <LaptopIcon />
                                            </div>
                                            <div className="ml-4">
                                                <div className="text-sm font-bold text-slate-900">{asset.rowKey}</div>
                                                <div className="text-xs text-slate-500">{asset.AssetBrandName} {asset.AssetModelName}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex flex-col items-start gap-1.5">
                                            {getStatusBadge(asset.AssetStatus)}
                                            <div className="text-xs text-slate-500 font-medium">
                                                {asset.AssetAssignedTo ? `Assigned to: ${asset.AssetAssignedTo}` : <span className="italic text-slate-400">Unassigned</span>}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <button 
                                            onClick={() => viewAssetSessions(asset)} 
                                            className="inline-flex items-center px-3 py-1.5 border border-indigo-100 text-xs font-semibold rounded-md text-indigo-700 bg-indigo-50 hover:bg-indigo-100 hover:border-indigo-200 transition-colors"
                                            title="View Usage & Idle Logs"
                                        >
                                            <ActivityIcon />
                                            View Logs
                                        </button>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            {canAssignAssets && asset.AssetStatus === 'Available' && (
                                                <button onClick={() => openModal('assign', asset)} className="text-indigo-600 hover:text-indigo-900 bg-white border border-slate-200 px-3 py-1 rounded hover:bg-slate-50">Assign</button>
                                            )}
                                            {canAssignAssets && asset.AssetStatus === 'Assigned' && (
                                                <button onClick={() => openModal('reassign', asset)} className="text-indigo-600 hover:text-indigo-900 bg-white border border-slate-200 px-3 py-1 rounded hover:bg-slate-50">Reassign</button>
                                            )}
                                            {canManageAssets && (
                                                <>
                                                    <button onClick={() => openModal('service', asset)} className="text-amber-600 hover:text-amber-900 bg-white border border-slate-200 px-3 py-1 rounded hover:bg-slate-50">Service</button>
                                                    <button onClick={() => handleDelete(asset.rowKey)} className="text-red-600 hover:text-red-900 bg-white border border-slate-200 px-3 py-1 rounded hover:bg-slate-50">Delete</button>
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

            {/* ================= MODALS ================= */}
            {activeModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm px-4">
                    <div className={`bg-white rounded-2xl shadow-2xl w-full flex flex-col max-h-[90vh] ${activeModal === 'sessions' ? 'max-w-4xl' : 'max-w-md p-6'}`}>
                        
                        {/* Modal Header */}
                        {activeModal !== 'sessions' && (
                            <h3 className="text-xl font-bold text-slate-900 mb-5 border-b border-slate-100 pb-3">
                                {activeModal === 'assign' && `Assign Asset: ${selectedAsset.rowKey}`}
                                {activeModal === 'reassign' && `Reassign Asset: ${selectedAsset.rowKey}`}
                                {activeModal === 'service' && `Log Service/Repair: ${selectedAsset.rowKey}`}
                            </h3>
                        )}

                        {/* ✅ NEW: Styled Sessions Modal */}
                        {activeModal === 'sessions' && (
                            <div className="flex flex-col h-full overflow-hidden">
                                {/* Session Header */}
                                <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 rounded-t-2xl flex justify-between items-center">
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-900 flex items-center">
                                            <ActivityIcon /> Tracking Logs: {selectedAsset.rowKey}
                                        </h3>
                                        <p className="text-sm text-slate-500 mt-0.5">Monitoring activity, idle time, and usage updates.</p>
                                    </div>
                                    <button onClick={closeModal} className="text-slate-400 hover:text-slate-700 bg-white rounded-full p-1 border border-slate-200">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                                    </button>
                                </div>

                                {/* Controls & Summary Bar */}
                                <div className="px-6 py-4 border-b border-slate-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white">
                                    <div className="flex items-center space-x-3">
                                        <label className="text-sm font-semibold text-slate-700">Filter Date:</label>
                                        <input 
                                            type="date" 
                                            value={sessionDate}
                                            onChange={handleDateChange}
                                            max={getLocalDateString()} 
                                            className="px-3 py-1.5 border border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm font-medium text-slate-700 bg-slate-50"
                                        />
                                    </div>
                                    <div className="flex items-center px-4 py-2 bg-indigo-50 border border-indigo-100 rounded-lg">
                                        <ClockIcon />
                                        <span className="text-sm text-indigo-900 font-medium">
                                            Active Time: <strong className="text-lg font-black ml-1">{sessionSummary}</strong>
                                        </span>
                                    </div>
                                </div>

                                {/* Styled Navigation Tabs */}
                                <div className="px-6 pt-2 border-b border-slate-200 bg-slate-50/50">
                                    <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                                        {['all', 'attendance', 'idle', 'usage'].map((tab) => (
                                            <button
                                                key={tab}
                                                onClick={() => setActiveTab(tab)}
                                                className={`whitespace-nowrap py-3 px-1 border-b-2 font-semibold text-sm transition-colors ${
                                                    activeTab === tab
                                                        ? 'border-indigo-500 text-indigo-600'
                                                        : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                                                }`}
                                            >
                                                {tab === 'all' && 'All Activity'}
                                                {tab === 'attendance' && 'Logins & Logouts'}
                                                {tab === 'idle' && 'Idle Time'}
                                                {tab === 'usage' && 'Usage Notes'}
                                            </button>
                                        ))}
                                    </nav>
                                </div>

                                {/* Table Area */}
                                <div className="flex-1 overflow-y-auto p-6 bg-slate-50/30">
                                    {loadingSessions ? (
                                        <div className="py-16 text-center text-slate-500 flex flex-col items-center">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-4"></div>
                                            Loading tracking data...
                                        </div>
                                    ) : filteredSessions.length === 0 ? (
                                        <div className="py-12 text-center text-slate-500 bg-white rounded-xl border border-dashed border-slate-300">
                                            <ActivityIcon />
                                            <p className="mt-2 text-sm font-medium">No records found for this filter.</p>
                                        </div>
                                    ) : (
                                        <div className="border border-slate-200 rounded-xl shadow-sm overflow-hidden bg-white">
                                            <table className="min-w-full divide-y divide-slate-200">
                                                <thead className="bg-slate-100">
                                                    <tr>
                                                        <th className="px-5 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider w-32">Event</th>
                                                        <th className="px-5 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">User</th>
                                                        <th className="px-5 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Local Time</th>
                                                        <th className="px-5 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Notes / Reason</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100 text-sm">
                                                    {filteredSessions.map(session => (
                                                        <tr key={session.id} className="hover:bg-slate-50/80 transition-colors">
                                                            <td className="px-5 py-3 whitespace-nowrap">
                                                                {getEventBadge(session.actionType, session.eventCategory)}
                                                            </td>
                                                            <td className="px-5 py-3 text-slate-700 font-medium">{session.userEmail}</td>
                                                            <td className="px-5 py-3 text-slate-500">
                                                                {new Date(session.eventTimestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'medium' })}
                                                            </td>
                                                            <td className="px-5 py-3 text-slate-600 italic text-xs max-w-xs truncate" title={session.workDoneNotes}>
                                                                {session.workDoneNotes || '-'}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                                
                                {/* Footer */}
                                <div className="px-6 py-4 border-t border-slate-200 bg-white rounded-b-2xl flex justify-end">
                                    <button type="button" onClick={closeModal} className="px-6 py-2.5 text-sm font-bold text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors border border-slate-200 shadow-sm">
                                        Close Window
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Form Modals (Assign/Service) */}
                        {(activeModal === 'assign' || activeModal === 'reassign' || activeModal === 'service') && (
                            <form onSubmit={handleActionSubmit} className="space-y-5">
                                {(activeModal === 'assign' || activeModal === 'reassign') && (
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Select Employee</label>
                                        <select 
                                            required
                                            value={modalData.userEmail || ''} 
                                            onChange={(e) => setModalData({...modalData, userEmail: e.target.value})}
                                            className="w-full border-slate-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 p-2.5 border bg-slate-50"
                                        >
                                            <option value="" disabled>-- Select an employee --</option>
                                            {users.map(u => (
                                                <option key={u.username} value={u.username}>{u.displayName} ({u.username})</option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                {activeModal === 'service' && (
                                    <>
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Action Type</label>
                                            <select 
                                                required
                                                value={modalData.isRepair || ''} 
                                                onChange={(e) => setModalData({...modalData, isRepair: e.target.value})}
                                                className="w-full border-slate-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 p-2.5 border bg-slate-50"
                                            >
                                                <option value="" disabled>-- Select type --</option>
                                                <option value="false">Routine Service / Maintenance</option>
                                                <option value="true">Hardware Repair</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Details / Notes</label>
                                            <textarea 
                                                required
                                                rows="3"
                                                value={modalData.details || ''} 
                                                onChange={(e) => setModalData({...modalData, details: e.target.value})}
                                                className="w-full border-slate-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 p-2.5 border bg-slate-50"
                                                placeholder="Enter reason for service/repair..."
                                            />
                                        </div>
                                    </>
                                )}

                                <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-slate-100">
                                    <button type="button" onClick={closeModal} className="px-5 py-2 text-sm font-bold text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-sm">
                                        Cancel
                                    </button>
                                    <button type="submit" disabled={processing} className="px-5 py-2 text-sm font-bold text-white bg-indigo-600 border border-transparent rounded-lg hover:bg-indigo-700 disabled:bg-indigo-400 transition-colors shadow-sm">
                                        {processing ? 'Processing...' : 'Confirm Action'}
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