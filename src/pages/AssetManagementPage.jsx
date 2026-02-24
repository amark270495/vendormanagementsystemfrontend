import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { usePermissions } from '../hooks/usePermissions';
import { apiService } from '../api/apiService';

// --- Icons ---
const LaptopIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>;
const ClockIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-amber-500 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const ActivityIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-emerald-500 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>;

// ✅ Helper to get IST date string for initial state
const getISTDateString = () => {
    return new Intl.DateTimeFormat('en-CA', { 
        timeZone: 'Asia/Kolkata',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    }).format(new Date());
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
    const [sessionDate, setSessionDate] = useState(getISTDateString());
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
        setSessionDate(getISTDateString());
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

    // ✅ UPDATED: Calculate working hours with expanded triggers (Wake/Active/Unlock)
    const formattedWorkingTime = useMemo(() => {
        if (!assetSessions.length) return '0h 0m';

        // Include wake and active events from PowerShell or usage updates
        const startTriggers = ['login', 'unlock', 'resume', 'active', 'wake'];
        const endTriggers = ['logout', 'logoff', 'lock', 'idle', 'sleep', 'hibernate'];

        const sorted = [...assetSessions].sort((a, b) => new Date(a.eventTimestamp) - new Date(b.eventTimestamp));
        
        let totalMs = 0;
        let sessionStart = null;

        sorted.forEach(log => {
            const act = log.actionType.toLowerCase();
            if (startTriggers.includes(act) && !sessionStart) {
                sessionStart = new Date(log.eventTimestamp);
            } else if (endTriggers.includes(act) && sessionStart) {
                totalMs += (new Date(log.eventTimestamp) - sessionStart);
                sessionStart = null;
            }
        });

        const totalMinutes = Math.floor(totalMs / 60000);
        return `${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m`;
    }, [assetSessions]);

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
        if (!window.confirm(`Are you sure?`)) return;
        try {
            await apiService.deleteAsset(assetId, user.userIdentifier);
            setAssets(assets.filter(a => a.rowKey !== assetId));
        } catch (err) { alert('Delete failed.'); }
    };

    const getStatusBadge = (status) => {
        const styles = {
            'Available': 'bg-green-100 text-green-800 border-green-200',
            'Assigned': 'bg-blue-100 text-blue-800 border-blue-200',
            'Service': 'bg-yellow-100 text-yellow-800 border-yellow-200',
            'Repair': 'bg-red-100 text-red-800 border-red-200'
        };
        return <span className={`px-2.5 py-1 text-xs font-bold rounded-full border ${styles[status] || 'bg-gray-100 text-gray-800'}`}>{status}</span>;
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
        return <span className="px-2 py-1 text-[11px] font-bold uppercase rounded-md bg-gray-100 text-gray-700">{action}</span>;
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
        <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center bg-gradient-to-r from-slate-50 to-white gap-4">
                <div>
                    <h2 className="text-xl font-extrabold text-slate-800 flex items-center"><LaptopIcon /> Company Hardware Assets</h2>
                    <p className="text-sm text-slate-500 mt-1">Manage inventory, assignments, and IST shift tracking.</p>
                </div>
                <button onClick={fetchData} className="text-sm font-medium px-4 py-2 bg-white border border-slate-300 rounded-lg shadow-sm hover:bg-slate-50 transition-all flex items-center">Refresh</button>
            </div>

            {error && <div className="m-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>}

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
                            <tr><td colSpan="4" className="px-6 py-12 text-center text-slate-500">Loading...</td></tr>
                        ) : assets.length === 0 ? (
                            <tr><td colSpan="4" className="px-6 py-12 text-center text-slate-500">No assets found.</td></tr>
                        ) : (
                            assets.map((asset) => (
                                <tr key={asset.rowKey} className="hover:bg-indigo-50/30 transition-colors group">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="flex-shrink-0 h-10 w-10 bg-slate-100 rounded-lg flex items-center justify-center border border-slate-200"><LaptopIcon /></div>
                                            <div className="ml-4">
                                                <div className="text-sm font-bold text-slate-900">{asset.rowKey}</div>
                                                <div className="text-xs text-slate-500">{asset.AssetBrandName} {asset.AssetModelName}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex flex-col items-start gap-1.5">
                                            {getStatusBadge(asset.AssetStatus)}
                                            <div className="text-xs text-slate-500 font-medium">{asset.AssetAssignedTo ? `Assigned to: ${asset.AssetAssignedTo}` : <span className="italic text-slate-400">Unassigned</span>}</div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <button onClick={() => viewAssetSessions(asset)} className="inline-flex items-center px-3 py-1.5 border border-indigo-100 text-xs font-semibold rounded-md text-indigo-700 bg-indigo-50 hover:bg-indigo-100 transition-colors"><ActivityIcon /> View Logs</button>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            {canAssignAssets && asset.AssetStatus === 'Available' && (<button onClick={() => openModal('assign', asset)} className="text-indigo-600 border border-slate-200 px-3 py-1 rounded hover:bg-slate-50">Assign</button>)}
                                            {canAssignAssets && asset.AssetStatus === 'Assigned' && (<button onClick={() => openModal('reassign', asset)} className="text-indigo-600 border border-slate-200 px-3 py-1 rounded hover:bg-slate-50">Reassign</button>)}
                                            {canManageAssets && (
                                                <><button onClick={() => openModal('service', asset)} className="text-amber-600 border border-slate-200 px-3 py-1 rounded hover:bg-slate-50">Service</button>
                                                <button onClick={() => handleDelete(asset.rowKey)} className="text-red-600 border border-slate-200 px-3 py-1 rounded hover:bg-slate-50">Delete</button></>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {activeModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm px-4">
                    <div className={`bg-white rounded-2xl shadow-2xl w-full flex flex-col max-h-[90vh] ${activeModal === 'sessions' ? 'max-w-4xl' : 'max-w-md p-6'}`}>
                        {activeModal === 'sessions' ? (
                            <div className="flex flex-col h-full overflow-hidden">
                                <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 rounded-t-2xl flex justify-between items-center">
                                    <div><h3 className="text-lg font-bold text-slate-900 flex items-center"><ActivityIcon /> Tracking Logs: {selectedAsset.rowKey}</h3><p className="text-sm text-slate-500 mt-0.5">IST Shift: 19:00 - 04:00</p></div>
                                    <button onClick={closeModal} className="text-slate-400 hover:text-slate-700 bg-white rounded-full p-1 border border-slate-200"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg></button>
                                </div>
                                <div className="px-6 py-4 border-b border-slate-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white">
                                    <div className="flex items-center space-x-3"><label className="text-sm font-semibold text-slate-700">Filter Date:</label><input type="date" value={sessionDate} onChange={handleDateChange} className="px-3 py-1.5 border border-slate-300 rounded-md shadow-sm text-sm font-medium text-slate-700 bg-slate-50" /></div>
                                    <div className="flex items-center px-4 py-2 bg-indigo-50 border border-indigo-100 rounded-lg"><ClockIcon /><span className="text-sm text-indigo-900 font-medium">Active Time: <strong className="text-lg font-black ml-1">{formattedWorkingTime}</strong></span></div>
                                </div>
                                <div className="px-6 pt-2 border-b border-slate-200 bg-slate-50/50">
                                    <nav className="-mb-px flex space-x-6">
                                        {['all', 'attendance', 'idle', 'usage'].map((tab) => (<button key={tab} onClick={() => setActiveTab(tab)} className={`whitespace-nowrap py-3 px-1 border-b-2 font-semibold text-sm transition-colors ${activeTab === tab ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>{tab.charAt(0).toUpperCase() + tab.slice(1)}</button>))}
                                    </nav>
                                </div>
                                <div className="flex-1 overflow-y-auto p-6 bg-slate-50/30">
                                    {loadingSessions ? (<div className="py-16 text-center text-slate-500">Loading tracking data...</div>) : filteredSessions.length === 0 ? (<div className="py-12 text-center text-slate-500 bg-white rounded-xl border border-dashed border-slate-300">No records found for this shift.</div>) : (
                                        <div className="border border-slate-200 rounded-xl shadow-sm overflow-hidden bg-white">
                                            <table className="min-w-full divide-y divide-slate-200">
                                                <thead className="bg-slate-100"><tr><th className="px-5 py-3 text-left text-xs font-bold text-slate-600 uppercase w-32">Event</th><th className="px-5 py-3 text-left text-xs font-bold text-slate-600 uppercase">User</th><th className="px-5 py-3 text-left text-xs font-bold text-slate-600 uppercase">Time (IST)</th><th className="px-5 py-3 text-left text-xs font-bold text-slate-600 uppercase">Notes</th></tr></thead>
                                                <tbody className="divide-y divide-slate-100 text-sm">
                                                    {filteredSessions.map((session, idx) => (
                                                        <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                                                            <td className="px-5 py-3">{getEventBadge(session.actionType, session.eventCategory)}</td>
                                                            <td className="px-5 py-3 text-slate-700 font-medium">{session.userEmail}</td>
                                                            <td className="px-5 py-3 text-slate-500">
                                                                {/* ✅ Prioritize backend-formatted IST time, with fallback for old records */}
                                                                {session.istTimeLogged || new Date(session.eventTimestamp).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour12: false, hour: '2-digit', minute: '2-digit' })}
                                                            </td>
                                                            <td className="px-5 py-3 text-slate-600 italic text-xs">{session.workDoneNotes || '-'}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                                <div className="px-6 py-4 border-t border-slate-200 bg-white rounded-b-2xl flex justify-end"><button type="button" onClick={closeModal} className="px-6 py-2.5 text-sm font-bold text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 border border-slate-200 shadow-sm">Close Window</button></div>
                            </div>
                        ) : (
                            <form onSubmit={handleActionSubmit} className="space-y-5">
                                <h3 className="text-xl font-bold text-slate-900 mb-5 border-b border-slate-100 pb-3">Action: {activeModal}</h3>
                                {(activeModal === 'assign' || activeModal === 'reassign') && (<div><label className="block text-sm font-semibold text-slate-700 mb-1.5">Employee</label><select required value={modalData.userEmail || ''} onChange={(e) => setModalData({...modalData, userEmail: e.target.value})} className="w-full border-slate-300 rounded-lg p-2.5 border"><option value="" disabled>-- Select --</option>{users.map(u => <option key={u.username} value={u.username}>{u.displayName}</option>)}</select></div>)}
                                {activeModal === 'service' && (<><select required value={modalData.isRepair || ''} onChange={(e) => setModalData({...modalData, isRepair: e.target.value})} className="w-full border-slate-300 rounded-lg p-2.5 border"><option value="" disabled>-- Type --</option><option value="false">Service</option><option value="true">Repair</option></select><textarea required rows="3" value={modalData.details || ''} onChange={(e) => setModalData({...modalData, details: e.target.value})} className="w-full border-slate-300 rounded-lg p-2.5 border" placeholder="Details..."></textarea></>)}
                                <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-slate-100"><button type="button" onClick={closeModal} className="px-5 py-2 text-sm font-bold text-slate-600 bg-white border border-slate-300 rounded-lg">Cancel</button><button type="submit" disabled={processing} className="px-5 py-2 text-sm font-bold text-white bg-indigo-600 rounded-lg">{processing ? '...' : 'Confirm'}</button></div>
                            </form>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default AssetManagementPage;