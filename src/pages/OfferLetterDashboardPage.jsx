import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../api/apiService';
import Spinner from '../components/Spinner';
import { usePermissions } from '../hooks/usePermissions';
import Modal from '../components/Modal';

// --- HELPER COMPONENT: Document Preview Modal ---
const DocumentPreviewModal = ({ isOpen, onClose, document }) => {
    if (!isOpen || !document) return null;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={`Preview: Offer for ${document.employeeName}`}
            size="4xl" // Adjusted size for offer letters
        >
            <div className="w-full h-[75vh]">
                {document.pdfUrl ? (
                    <iframe
                        src={document.pdfUrl}
                        title="Document Preview"
                        className="w-full h-full border-0"
                    />
                ) : (
                    <div className="flex items-center justify-center h-full bg-gray-100 rounded-md">
                        <p className="text-gray-500">Could not load document preview.</p>
                    </div>
                )}
            </div>
        </Modal>
    );
};


const OfferLetterDashboardPage = () => {
    const { user } = useAuth();
    const { canManageOfferLetters } = usePermissions();

    const [offerLetters, setOfferLetters] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    
    const [generalFilter, setGeneralFilter] = useState('');
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });
    
    const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
    const [documentToPreview, setDocumentToPreview] = useState(null);

    const tableHeader = useMemo(() => [
        'Employee Name', 'Employee Email', 'Job Title', 'Client', 'Sent On', 'Status', 'Actions'
    ], []);

    const loadData = useCallback(async () => {
        setLoading(true);
        setError('');

        if (!user?.userIdentifier || !canManageOfferLetters) {
            setLoading(false);
            setError('You do not have permission to view this dashboard.');
            return;
        }

        try {
            // NOTE: This will use the placeholder backend function for now.
            // Once implemented, it will fetch real data.
            const result = await apiService.getOfferLetterDashboardData(user.userIdentifier);
            if (result?.data?.success) {
                setOfferLetters(Array.isArray(result.data.data) ? result.data.data : []);
            } else {
                setError(result?.data?.message || 'Unexpected response from server.');
            }
        } catch (err) {
            setError(err?.response?.data?.message || 'Failed to fetch offer letter data.');
        } finally {
            setLoading(false);
        }
    }, [user?.userIdentifier, canManageOfferLetters]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const filteredAndSortedData = useMemo(() => {
        let data = [...offerLetters];

        if (generalFilter) {
            const lower = generalFilter.toLowerCase();
            data = data.filter(item =>
                Object.values(item).some(val => String(val).toLowerCase().includes(lower))
            );
        }

        if (sortConfig.key) {
            const key = sortConfig.key.replace(/\s+/g, '').charAt(0).toLowerCase() + sortConfig.key.replace(/\s+/g, '').slice(1);
            data.sort((a, b) => {
                let valA = a[key];
                let valB = b[key];
                
                if (valA < valB) return sortConfig.direction === 'ascending' ? -1 : 1;
                if (valA > valB) return sortConfig.direction === 'ascending' ? 1 : -1;
                return 0;
            });
        }
        
        return data;
    }, [offerLetters, generalFilter, sortConfig]);

    const handleSort = (key) => {
        let direction = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    const handlePreview = (doc) => {
        if (doc.pdfUrl) {
            setDocumentToPreview(doc);
            setIsPreviewModalOpen(true);
        } else {
            setError('No PDF is available for preview for this document.');
            setTimeout(() => setError(''), 3000);
        }
    };
    
    if (!canManageOfferLetters) {
        return (
            <div className="text-center text-gray-500 p-10 bg-white rounded-xl shadow-sm border">
                <h3 className="text-lg font-medium">Access Denied</h3>
                <p className="mt-1 text-sm">You do not have the necessary permissions to manage offer letters.</p>
            </div>
        );
    }

    return (
        <>
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Offer Letter Dashboard</h1>
                        <p className="mt-1 text-gray-600">Track and manage all sent offer letters.</p>
                    </div>
                </div>

                <div className="bg-white p-4 rounded-xl shadow-sm border">
                    <input
                        type="text"
                        placeholder="Search for an employee, client, or status..."
                        value={generalFilter}
                        onChange={(e) => setGeneralFilter(e.target.value)}
                        className="w-full md:w-1/3 p-2 border border-gray-300 rounded-lg shadow-sm"
                        disabled={loading}
                    />
                </div>

                {loading && <div className="flex justify-center items-center h-64"><Spinner /></div>}
                {error && <div className="bg-red-50 text-red-700 p-4 rounded-lg border border-red-200">Error: {error}</div>}

                {!loading && !error && (
                    <div className="bg-white rounded-xl shadow-lg border overflow-x-auto">
                        <table className="w-full text-sm text-left text-gray-600">
                            <thead className="text-xs text-gray-700 uppercase bg-gray-100">
                                <tr>
                                    {tableHeader.map(h => (
                                        <th key={h} scope="col" className="px-6 py-3 cursor-pointer" onClick={() => h !== 'Actions' && handleSort(h)}>
                                            {h} {sortConfig.key === h ? (sortConfig.direction === 'ascending' ? '▲' : '▼') : ''}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {filteredAndSortedData.length > 0 ? filteredAndSortedData.map(letter => (
                                    <tr key={letter.rowKey} className="bg-white border-b hover:bg-gray-50">
                                        <td className="px-6 py-4 font-medium text-gray-900">{letter.employeeName}</td>
                                        <td className="px-6 py-4">{letter.employeeEmail}</td>
                                        <td className="px-6 py-4">{letter.jobTitle}</td>
                                        <td className="px-6 py-4">{letter.clientName}</td>
                                        <td className="px-6 py-4">{new Date(letter.createdAt).toLocaleDateString()}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                                letter.status === 'Signed' ? 'bg-green-100 text-green-800' : 
                                                letter.status === 'Sent' ? 'bg-blue-100 text-blue-800' : 
                                                'bg-yellow-100 text-yellow-800'
                                            }`}>
                                                {letter.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <button onClick={() => handlePreview(letter)} className="font-medium text-indigo-600 hover:underline mr-4">Preview</button>
                                            {/* Placeholder for future actions */}
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={tableHeader.length} className="text-center py-10 text-gray-500">
                                            No offer letters found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
            
            <DocumentPreviewModal
                isOpen={isPreviewModalOpen}
                onClose={() => setIsPreviewModalOpen(false)}
                document={documentToPreview}
            />
        </>
    );
};

export default OfferLetterDashboardPage;