import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../api/apiService';
import Spinner from '../components/Spinner';
import Dropdown from '../components/Dropdown';
import ConfirmationModal from '../components/dashboard/ConfirmationModal';
import EditOfferLetterModal from '../components/offer-letter/EditOfferLetterModal';
import { usePermissions } from '../hooks/usePermissions';
import Modal from '../components/Modal';

// --- HELPER COMPONENT: Document Preview Modal ---
const DocumentPreviewModal = ({ isOpen, onClose, document }) => {
    if (!isOpen || !document) return null;
    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Preview: Offer for ${document.employeeName}`} size="4xl">
            <div className="w-full h-[75vh]">
                {document.pdfUrl ? (
                    <iframe src={document.pdfUrl} title="Document Preview" className="w-full h-full border-0"/>
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
    const [success, setSuccess] = useState('');
    
    const [generalFilter, setGeneralFilter] = useState('');
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });
    
    const [modalState, setModalState] = useState({ type: null, data: null });
    
    const tableHeader = useMemo(() => [
        'Employee Name', 'Employee Email', 'Job Title', 'Client', 'Sent On', 'Status', 'Actions'
    ], []);

    const loadData = useCallback(async () => {
        setLoading(true);
        setError('');
        // Do not clear success, let it show
        if (!user?.userIdentifier || !canManageOfferLetters) {
            setLoading(false);
            setError('You do not have permission to view this dashboard.');
            return;
        }
        
        try {
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
            data = data.filter(item => Object.values(item).some(val => String(val).toLowerCase().includes(lower)));
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
        if (sortConfig.key === key && sortConfig.direction === 'ascending') direction = 'descending';
        setSortConfig({ key, direction });
    };

    const handlePreview = (doc) => {
        if (doc.pdfUrl) setModalState({ type: 'preview', data: doc });
        else {
            setError('No PDF is available for preview.');
            setTimeout(() => setError(''), 3000);
        }
    };
    
    const handleEdit = (doc) => setModalState({ type: 'edit', data: doc });
    const handleDelete = (doc) => setModalState({ type: 'delete', data: doc });

    // --- NEW: Handler to open the resend confirmation modal ---
    const handleResend = (doc) => setModalState({ type: 'resend', data: doc });

    const handleConfirmDelete = async () => {
        const doc = modalState.data;
        if (!doc) return;
        setLoading(true);
        try {
            // Note: deleteOfferLetter requires (rowKey, authenticatedUsername, pdfUrl)
            // The rowKey is the token, which is stored in doc.rowKey (and doc.partitionKey)
            await apiService.deleteOfferLetter(doc.rowKey, user.userIdentifier, doc.pdfUrl);
            setSuccess('Offer letter deleted successfully.');
            loadData();
        } catch (err) {
            setError(err?.response?.data?.message || 'Failed to delete offer letter.');
        } finally {
            setLoading(false);
            setModalState({ type: null, data: null });
        }
    };

    // --- NEW: Handler to call the resend API ---
    const handleConfirmResend = async () => {
        const doc = modalState.data;
        if (!doc) return;
        setLoading(true);
        setError('');
        setSuccess('');
        try {
            // apiService.resendOfferLetter(rowKey, authenticatedUsername)
            const response = await apiService.resendOfferLetter(doc.rowKey, user.userIdentifier);
            if (response.data.success) {
                setSuccess(response.data.message || 'Email resent successfully.');
            } else {
                setError(response.data.message || 'Failed to resend email.');
            }
        } catch (err) {
            setError(err?.response?.data?.message || 'Failed to resend email.');
        } finally {
            setLoading(false);
            setModalState({ type: null, data: null }); // Close modal
            setTimeout(() => setSuccess(''), 4000); // Clear success message
        }
    };

    const handleSaveChanges = async (updatedData) => {
        setLoading(true);
        try {
            await apiService.updateOfferLetter(updatedData, user.userIdentifier);
            setSuccess('Offer letter updated successfully.');
            loadData();
        } catch (err) {
            setError(err?.response?.data?.message || 'Failed to update offer letter.');
            throw err;
        } finally {
            setLoading(false);
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
                 <div>
                    <h1 className="text-3xl font-bold text-gray-900">Offer Letter Dashboard</h1>
                    <p className="mt-1 text-gray-600">Track and manage all sent offer letters.</p>
                 </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border">
                    <input type="text" placeholder="Search..." value={generalFilter} onChange={(e) => setGeneralFilter(e.target.value)} className="w-full md:w-1/3 p-2 border border-gray-300 rounded-lg shadow-sm" disabled={loading}/>
                </div>
              
                 {loading && <div className="flex justify-center items-center h-64"><Spinner /></div>}
                {error && <div className="bg-red-50 text-red-700 p-4 rounded-lg border border-red-200">Error: {error}</div>}
                {success && <div className="bg-green-50 text-green-700 p-4 rounded-lg border border-green-200">{success}</div>}
                
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
                                        <td className="px-6 py-4"><span className={`px-2 py-1 text-xs font-semibold rounded-full ${letter.status === 'Signed' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>{letter.status}</span></td>
                                        <td className="px-6 py-4">
                                            {/* --- MODIFIED: Added Resend Button --- */}
                                            <Dropdown trigger={<button className="text-gray-500 hover:text-gray-700 p-1 rounded-full font-bold">...</button>}>
                                                <a href="#" onClick={(e) => { e.preventDefault(); handlePreview(letter); }} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Preview/View</a>
                                                <a href="#" onClick={(e) => { e.preventDefault(); handleEdit(letter); }} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Edit</a>
                                                <a href="#" onClick={(e) => { e.preventDefault(); handleResend(letter); }} className="block px-4 py-2 text-sm text-blue-600 hover:bg-gray-100">Resend Email</a>
                                                <div className="border-t border-gray-100 my-1"></div>
                                                <a href="#" onClick={(e) => { e.preventDefault(); handleDelete(letter); }} className="block px-4 py-2 text-sm text-red-600 hover:bg-gray-100">Delete</a>
                                            </Dropdown>
                                        </td>
                                     </tr>
                                )) : (
                                    <tr><td colSpan={tableHeader.length} className="text-center py-10 text-gray-500">No offer letters found.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
            
            {/* --- MODIFIED: Added Resend Confirmation Modal --- */}
            <DocumentPreviewModal isOpen={modalState.type === 'preview'} onClose={() => setModalState({type: null, data: null})} document={modalState.data} />
            <ConfirmationModal isOpen={modalState.type === 'delete'} onClose={() => setModalState({type: null, data: null})} onConfirm={handleConfirmDelete} title="Confirm Deletion" message={`Are you sure you want to delete the offer letter for "${modalState.data?.employeeName}"?`} confirmText="Delete"/>
            <ConfirmationModal 
                isOpen={modalState.type === 'resend'} 
                onClose={() => setModalState({type: null, data: null})} 
                onConfirm={handleConfirmResend} 
                title="Confirm Resend" 
                message={`Are you sure you want to resend the offer letter to "${modalState.data?.employeeEmail}"? This will generate a new temporary password.`} 
                confirmText="Resend"
            />
            <EditOfferLetterModal isOpen={modalState.type === 'edit'} onClose={() => setModalState({type: null, data: null})} onSave={handleSaveChanges} letterToEdit={modalState.data} />
        </>
    );
};

export default OfferLetterDashboardPage;