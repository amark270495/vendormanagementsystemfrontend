import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { usePermissions } from '../hooks/usePermissions';
import { apiService } from '../api/apiService';

const AssetManagementPage = () => {
    const { user } = useAuth();
    const { canManageAssets, canAssignAssets } = usePermissions();

    const [assets, setAssets] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Modal States
    const [activeModal, setActiveModal] = useState(null); // 'assign', 'reassign', 'service', null
    const [selectedAsset, setSelectedAsset] = useState(null);
    const [modalData, setModalData] = useState({});
    const [processing, setProcessing] = useState(false);

    // Fetch Data
    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            // Fetch both Assets and Users simultaneously
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

    // Handlers
    const openModal = (type, asset) => {
        setSelectedAsset(asset);
        setModalData({});
        setActiveModal(type);
    };

    const closeModal = () => {
        setActiveModal(null);
        setSelectedAsset(null);
        setModalData({});
    };

    // Action Execution
    const handleActionSubmit = async (e) => {
        e.preventDefault();
        setProcessing(true);

        try {
            if (activeModal === 'assign') {
                const targetUser = users.find(u => u.email === modalData.userEmail);
                await apiService.assignAsset({
                    assetId: selectedAsset.rowKey,
                    assignedToEmail: targetUser.email,
                    assignedToName: targetUser.displayName
                }, user.userIdentifier);
            } 
            else if (activeModal === 'reassign') {
                const targetUser = users.find(u => u.email === modalData.userEmail);
                await apiService.reassignAsset({
                    assetId: selectedAsset.rowKey,
                    newAssignedToEmail: targetUser.email,
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

            // Refresh grid and close modal on success
            await fetchData();
            closeModal();
        } catch (err) {
            alert(`Action failed: ${err.response?.data?.error || err.message}`);
        } finally {
            setProcessing(false);
        }
    };

    // Delete Asset
    const handleDelete = async (assetId) => {
        if (!window.confirm(`Are you sure you want to permanently delete asset ${assetId}?`)) return;
        try {
            await apiService.deleteAsset(assetId, user.userIdentifier);
            setAssets(assets.filter(a => a.rowKey !== assetId));
        } catch (err) {
            alert('Failed to delete asset. You may not have adequate permissions.');
        }
    };

    // UI Helpers
    const getStatusBadge = (status) => {
        const styles = {
            'Available': 'bg-green-100 text-green-800',
            'Assigned': 'bg-blue-100 text-blue-800',
            'Service': 'bg-yellow-100 text-yellow-800',
            'Repair': 'bg-red-100 text-red-800'
        };
        return <span className={`px-2 py-1 text-xs font-semibold rounded-full ${styles[status] || 'bg-gray-100 text-gray-800'}`}>{status}</span>;
    };

    return (
        <div className="bg-white rounded-lg shadow-sm border border-slate-200">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50 rounded-t-lg">
                <h2 className="text-lg font-bold text-slate-800">Company Hardware Assets</h2>
                <button onClick={fetchData} className="text-sm px-3 py-1.5 bg-white border border-slate-300 rounded hover:bg-slate-50 transition-colors">
                    Refresh Grid
                </button>
            </div>

            {/* Error State */}
            {error && <div className="m-4 p-4 bg-red-50 text-red-700 rounded-md text-sm">{error}</div>}

            {/* Data Grid */}
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Asset Tag</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Specs</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Assigned To</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-200">
                        {loading ? (
                            <tr><td colSpan="5" className="px-6 py-4 text-center text-slate-500">Loading assets...</td></tr>
                        ) : assets.length === 0 ? (
                            <tr><td colSpan="5" className="px-6 py-4 text-center text-slate-500">No assets found in the inventory.</td></tr>
                        ) : (
                            assets.map((asset) => (
                                <tr key={asset.rowKey} className="hover:bg-slate-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-indigo-600">
                                        {asset.rowKey}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">
                                        <div className="font-semibold">{asset.AssetBrandName} {asset.AssetModelName}</div>
                                        <div className="text-xs text-slate-500">{asset.AssetCPUModel} | {asset.AssetRamSize}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {getStatusBadge(asset.AssetStatus)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                        {asset.AssetAssignedTo || <span className="italic text-slate-400">Unassigned</span>}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                                        {canAssignAssets && asset.AssetStatus === 'Available' && (
                                            <button onClick={() => openModal('assign', asset)} className="text-indigo-600 hover:text-indigo-900">Assign</button>
                                        )}
                                        {canAssignAssets && asset.AssetStatus === 'Assigned' && (
                                            <button onClick={() => openModal('reassign', asset)} className="text-indigo-600 hover:text-indigo-900">Reassign</button>
                                        )}
                                        {canManageAssets && (asset.AssetStatus === 'Available' || asset.AssetStatus === 'Assigned') && (
                                            <button onClick={() => openModal('service', asset)} className="text-yellow-600 hover:text-yellow-900">Service/Repair</button>
                                        )}
                                        {canManageAssets && (
                                            <button onClick={() => handleDelete(asset.rowKey)} className="text-red-600 hover:text-red-900">Delete</button>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* ================= MODALS ================= */}
            {activeModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 px-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
                        <h3 className="text-lg font-bold text-slate-900 mb-4">
                            {activeModal === 'assign' && `Assign Asset ${selectedAsset.rowKey}`}
                            {activeModal === 'reassign' && `Reassign Asset ${selectedAsset.rowKey}`}
                            {activeModal === 'service' && `Log Service/Repair for ${selectedAsset.rowKey}`}
                        </h3>
                        
                        <form onSubmit={handleActionSubmit} className="space-y-4">
                            {/* Assign / Reassign Fields */}
                            {(activeModal === 'assign' || activeModal === 'reassign') && (
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Select Employee</label>
                                    <select 
                                        required
                                        value={modalData.userEmail || ''} 
                                        onChange={(e) => setModalData({...modalData, userEmail: e.target.value})}
                                        className="w-full border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 p-2 border"
                                    >
                                        <option value="" disabled>-- Select an employee --</option>
                                        {users.map(u => (
                                            <option key={u.email} value={u.email}>{u.displayName} ({u.email})</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {/* Service / Repair Fields */}
                            {activeModal === 'service' && (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Action Type</label>
                                        <select 
                                            required
                                            value={modalData.isRepair || ''} 
                                            onChange={(e) => setModalData({...modalData, isRepair: e.target.value})}
                                            className="w-full border-slate-300 rounded-md shadow-sm p-2 border"
                                        >
                                            <option value="" disabled>-- Select type --</option>
                                            <option value="false">Routine Service / Maintenance</option>
                                            <option value="true">Hardware Repair</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Details / Notes</label>
                                        <textarea 
                                            required
                                            rows="3"
                                            value={modalData.details || ''} 
                                            onChange={(e) => setModalData({...modalData, details: e.target.value})}
                                            className="w-full border-slate-300 rounded-md shadow-sm p-2 border"
                                            placeholder="Enter reason for service/repair..."
                                        />
                                    </div>
                                </>
                            )}

                            <div className="flex justify-end gap-3 mt-6">
                                <button type="button" onClick={closeModal} className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50">
                                    Cancel
                                </button>
                                <button type="submit" disabled={processing} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 disabled:bg-indigo-400">
                                    {processing ? 'Processing...' : 'Confirm'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AssetManagementPage;