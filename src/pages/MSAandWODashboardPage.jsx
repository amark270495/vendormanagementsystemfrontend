import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../api/apiService';
import Spinner from '../components/Spinner';
import Dropdown from '../components/Dropdown';
import HeaderMenu from '../components/dashboard/HeaderMenu';
import ConfirmationModal from '../components/dashboard/ConfirmationModal';
import { usePermissions } from '../hooks/usePermissions';

const MSAandWODashboardPage = () => {
    const { user } = useAuth();
    // Placeholder permission for now, to be replaced by a dedicated permission later
    const canViewMSAWODashboard = user.permissions.canViewDashboards;

    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    
    const [generalFilter, setGeneralFilter] = useState('');
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });
    const [columnFilters, setColumnFilters] = useState({});

    const tableHeader = useMemo(() => [
        'Vendor Name', 'Candidate Name', 'Contract Number', 'Submitted On', 
        'Status', 'Signed By', 'Signed On', 'Actions'
    ], []);

    const loadData = useCallback(async () => {
        setLoading(true);
        setError('');
        if (!user?.userIdentifier || !canViewMSAWODashboard) {
            setLoading(false);
            setError("You do not have permission to view this dashboard.");
            return;
        }
        try {
            const result = await apiService.getMSAandWODashboardData(user.userIdentifier);
            if (result.data.success) {
                setDocuments(Array.isArray(result.data.data) ? result.data.data : []);
            } else {
                setError(result.data.message);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to fetch dashboard data.');
        } finally {
            setLoading(false);
        }
    }, [user?.userIdentifier, canViewMSAWODashboard]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const filteredAndSortedData = useMemo(() => {
        let data = documents.map(doc => ({
            original: doc,
            display: [
                doc.vendorName,
                doc.candidateName,
                doc.contractNumber,
                new Date(doc.submittedOn).toLocaleDateString(),
                doc.status,
                doc.signedBy,
                doc.signedOn ? new Date(doc.signedOn).toLocaleDateString() : 'N/A'
            ]
        }));

        if (generalFilter) {
            const lowercasedFilter = generalFilter.toLowerCase();
            data = data.filter(item => 
                item.display.some(cell => String(cell).toLowerCase().includes(lowercasedFilter))
            );
        }

        if (Object.keys(columnFilters).length > 0) {
            data = data.filter(item => {
                return Object.entries(columnFilters).every(([header, config]) => {
                    if (!config || !config.type || !config.value1) return true;
                    const colIndex = tableHeader.indexOf(header);
                    if (colIndex === -1) return true;
                    
                    const cellValue = String(item.display[colIndex] || '').toLowerCase();
                    const filterValue1 = String(config.value1).toLowerCase();
                    
                    switch (config.type) {
                        case 'contains': return cellValue.includes(filterValue1);
                        case 'not_contains': return !cellValue.includes(filterValue1);
                        case 'equals': return cellValue === filterValue1;
                        default: return true;
                    }
                });
            });
        }

        if (sortConfig.key) {
            const sortIndex = tableHeader.indexOf(sortConfig.key);
            if (sortIndex !== -1) {
                data.sort((a, b) => {
                    let valA = a.display[sortIndex];
                    let valB = b.display[sortIndex];

                    if (sortConfig.key === 'Submitted On' || sortConfig.key === 'Signed On') {
                        valA = new Date(valA).getTime() || 0;
                        valB = new Date(valB).getTime() || 0;
                    } else {
                        valA = String(valA || '').toLowerCase();
                        valB = String(valB || '').toLowerCase();
                    }

                    if (valA < valB) return sortConfig.direction === 'ascending' ? -1 : 1;
                    if (valA > valB) return sortConfig.direction === 'ascending' ? 1 : -1;
                    return 0;
                });
            }
        }
        return data;
    }, [documents, generalFilter, columnFilters, sortConfig, tableHeader]);

    const handleSort = (key, direction) => setSortConfig({ key, direction });
    const handleFilterChange = (header, config) => setColumnFilters(prev => ({ ...prev, [header]: config }));

    const handleViewClick = (doc) => {
        alert(`Viewing document for ${doc.vendorName} with token: ${doc.token}`);
    };

    return (
        <>
            <div className="space-y-4">
                <h1 className="text-3xl font-bold text-gray-800">MSA and WO Dashboard</h1>
                
                <div className="bg-white p-4 rounded-lg shadow-sm border flex flex-wrap items-center justify-between gap-4">
                    <input 
                        type="text" 
                        placeholder="Search all columns..." 
                        value={generalFilter} 
                        onChange={(e) => setGeneralFilter(e.target.value)} 
                        className="shadow-sm border-gray-300 rounded-md px-3 py-2"
                        disabled={loading || !canViewMSAWODashboard}
                    />
                </div>

                {loading && <div className="flex justify-center items-center h-64"><Spinner /></div>}
                {error && <div className="text-red-500 bg-red-100 p-4 rounded-lg">Error: {error}</div>}
                
                {!loading && !error && !canViewMSAWODashboard && (
                    <div className="text-center text-gray-500 p-10 bg-white rounded-xl shadow-sm border">
                        <h3 className="text-lg font-medium">Access Denied</h3>
                        <p className="text-sm">You do not have the necessary permissions to view this dashboard.</p>
                    </div>
                )}

                {!loading && !error && canViewMSAWODashboard && (
                    <div className="bg-white rounded-lg shadow-lg border border-gray-200" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left text-gray-500">
                                <thead className="text-xs text-gray-700 uppercase bg-slate-200 sticky top-0 z-10">
                                    <tr>
                                        {tableHeader.map(h => (
                                            <th 
                                                key={h} 
                                                scope="col" 
                                                className="p-0 border-r border-slate-300 last:border-r-0"
                                                style={{ minWidth: h === 'Vendor Name' || h === 'Candidate Name' ? '150px' : 'auto' }}
                                            >
                                                {h === 'Actions' ? (
                                                    <div className="p-3 font-bold">{h}</div>
                                                ) : (
                                                    <Dropdown width="64" trigger={
                                                        <div className="flex items-center justify-between w-full h-full cursor-pointer p-3 hover:bg-slate-300">
                                                            <span className="font-bold">{h}</span>
                                                            {sortConfig.key === h && (sortConfig.direction === 'ascending' ? ' ▲' : ' ▼')}
                                                        </div>
                                                    }>
                                                        <HeaderMenu header={h} onSort={(dir) => handleSort(h, dir)} filterConfig={columnFilters[h]} onFilterChange={handleFilterChange}/>
                                                    </Dropdown>
                                                )}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredAndSortedData.length > 0 ? (
                                        filteredAndSortedData.map((item, rowIndex) => {
                                            const originalDoc = item.original;
                                            const displayRow = item.display;
                                            return (
                                                <tr key={rowIndex} className="bg-gray-50 border-b hover:bg-gray-100">
                                                    {displayRow.map((cell, cellIndex) => (
                                                        <td key={cellIndex} className="px-4 py-3 border-r border-slate-200 last:border-r-0 font-medium text-gray-900 align-middle">
                                                            {cell}
                                                        </td>
                                                    ))}
                                                    <td className="px-4 py-3 border-r border-slate-200 last:border-r-0 flex space-x-2 justify-center">
                                                        <button 
                                                            onClick={() => handleViewClick(originalDoc)} 
                                                            className="text-blue-600 hover:text-blue-900 p-1 font-semibold" 
                                                            aria-label="View document"
                                                        >
                                                            View
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    ) : (
                                        <tr>
                                            <td colSpan={tableHeader.length} className="px-4 py-8 text-center text-gray-500">
                                                No MSA or WO documents found.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
};

export default MSAandWODashboardPage;