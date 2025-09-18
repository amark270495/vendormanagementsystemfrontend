import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../api/apiService';
import Spinner from '../components/Spinner';
import Dropdown from '../components/Dropdown';
import HeaderMenu from '../components/dashboard/HeaderMenu';
import ConfirmationModal from '../components/dashboard/ConfirmationModal';
import EditMSAandWOModal from '../components/msa-wo/EditMSAandWOModal';
import { usePermissions } from '../hooks/usePermissions';
import Modal from '../components/Modal';
import SignatureModal from '../components/msa-wo/SignatureModal';

const DocumentPreviewModal = ({ isOpen, onClose, document }) => {
    if (!isOpen || !document) return null;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={`Preview: ${document.vendorName} - ${document.contractNumber}`}
            size="4xl"
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

const MSAandWODashboardPage = () => {
    const { user } = useAuth();
    const { canManageMSAWO = false } = usePermissions();
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [generalFilter, setGeneralFilter] = useState('');
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });
    
    const [modalState, setModalState] = useState({ type: null, data: null });
    const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
    const [documentToPreview, setDocumentToPreview] = useState(null);
    
    const [isSigningModalOpen, setIsSigningModalOpen] = useState(false);
    const [signerConfig, setSignerConfig] = useState({});

    const tableHeader = useMemo(() => [
        'Vendor Name', 'Candidate Name', 'Job Title', 'Client Name',
        'Contract Number', 'Submitted On', 'Status', 'Actions'
    ], []);

    const loadData = useCallback(async () => {
        setLoading(true);
        setError('');
        setSuccess('');

        if (!user?.userIdentifier || !canManageMSAWO) {
            setLoading(false);
            setError('You do not have permission to view this dashboard.');
            return;
        }

        try {
            const result = await apiService.getMSAandWODashboardData(user.userIdentifier);
            if (result?.data?.success) {
                setDocuments(Array.isArray(result.data.data) ? result.data.data : []);
            } else {
                setError(result?.data?.message || 'Unexpected response from server.');
            }
        } catch (err) {
            setError(err?.response?.data?.message || 'Failed to fetch dashboard data.');
        } finally {
            setLoading(false);
        }
    }, [user?.userIdentifier, canManageMSAWO]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const filteredAndSortedData = useMemo(() => {
        let data = [...documents];

        if (generalFilter) {
            const lower = generalFilter.toLowerCase();
            data = data.filter(item =>
                Object.values(item).some(val => String(val).toLowerCase().includes(lower))
            );
        }

        if (sortConfig.key) {
            data.sort((a, b) => {
                let valA = a[sortConfig.key];
                let valB = b[sortConfig.key];

                if (sortConfig.key === 'submittedOn') {
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

        return data;
    }, [documents, generalFilter, sortConfig]);

    const handleSort = (key) => {
        let direction = 'ascending';
        if(sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };
    
    const handleEdit = (doc) => setModalState({ type: 'edit', data: doc });
    const handleDelete = (doc) => setModalState({ type: 'delete', data: doc });
    const handleResend = (doc) => setModalState({ type: 'resend', data: doc });
    
    const handleDirectorSignClick = (doc) => {
        setSignerConfig({
            signerType: 'taproot',
            requiresPassword: true,
            signerInfo: { name: user?.userName, title: 'Director' },
            document: doc,
            pdfUrl: doc.pdfUrl // Pass the URL to the modal
        });
        setIsSigningModalOpen(true);
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

    const handleConfirmDelete = async () => {
        const doc = modalState.data;
        if (!doc) return;
        setLoading(true);
        try {
            await apiService.deleteMSAandWO(doc.partitionKey, doc.rowKey, user.userIdentifier);
            setSuccess('Document deleted successfully.');
            loadData();
        } catch (err) {
            setError(err?.response?.data?.message || 'Failed to delete document.');
        } finally {
            setLoading(false);
            setModalState({ type: null, data: null });
        }
    };

    const handleConfirmResend = async () => {
        const doc = modalState.data;
        if (!doc) return;
        setLoading(true);
        try {
            const response = await apiService.resendMSAWOEmail(doc.partitionKey, doc.rowKey, user.userIdentifier);
            setSuccess(response?.data?.message || 'Email resent successfully.');
        } catch (err) {
            setError(err?.response?.data?.message || 'Failed to resend email.');
        } finally {
            setLoading(false);
            setModalState({ type: null, data: null });
        }
    };
    
    const handleSaveChanges = async (updatedData) => {
        setLoading(true);
        try {
            await apiService.updateMSAandWO(updatedData, user.userIdentifier);
            setSuccess('Document updated successfully.');
            loadData();
        } catch (err) {
            setError(err?.response?.data?.message || 'Failed to update document.');
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const handleSign = useCallback(async (signerData, signerType) => {
        setLoading(true);
        setError('');
        const docToSign = signerConfig.document;

        try {
            const response = await apiService.updateSigningStatus(docToSign.rowKey, signerData, signerType, user.userIdentifier, docToSign);
            if (response.data.success) {
                setSuccess('Document successfully signed and finalized!');
                setIsSigningModalOpen(false);
                loadData();
            } else {
                throw new Error(response.data.message);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to sign the document.');
            setLoading(false);
            throw err;
        }
    }, [signerConfig.document, user?.userIdentifier, loadData]);

    return (
        <>
            <div className="space-y-4">
                <h1 className="text-3xl font-bold text-gray-800">MSA and WO Dashboard</h1>

                <div className="bg-white p-4 rounded-lg shadow-sm border">
                    <input type="text" placeholder="Search..." value={generalFilter} onChange={(e) => setGeneralFilter(e.target.value)} className="shadow-sm border-gray-300 rounded-md px-3 py-2 w-full md:w-1/3" disabled={loading || !canManageMSAWO}/>
                </div>

                {loading && <div className="flex justify-center items-center h-64"><Spinner /></div>}
                {error && <div className="text-red-500 bg-red-100 p-4 rounded-lg">Error: {error}</div>}
                {success && <div className="text-green-500 bg-green-100 p-4 rounded-lg">Success: {success}</div>}

                {!loading && !error && canManageMSAWO && (
                    <div className="bg-white rounded-lg shadow-lg border" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left text-gray-500">
                                <thead className="text-xs text-gray-700 uppercase bg-slate-200 sticky top-0 z-10">
                                    <tr>{tableHeader.map(h => (<th key={h} scope="col" className="p-0 border-r last:border-r-0"><div className="flex items-center justify-between w-full h-full cursor-pointer p-3 hover:bg-slate-300" onClick={() => handleSort(h.charAt(0).toLowerCase() + h.slice(1).replace(/\s/g, ''))}><span className="font-bold">{h}</span>{sortConfig.key === (h.charAt(0).toLowerCase() + h.slice(1).replace(/\s/g, '')) && (sortConfig.direction === 'ascending' ? ' ▲' : ' ▼')}</div></th>))}</tr>
                                </thead>
                                <tbody>
                                    {filteredAndSortedData.map((doc) => (
                                        <tr key={doc.rowKey} className="bg-gray-50 border-b hover:bg-gray-100">
                                            <td className="px-4 py-3 border-r font-medium text-gray-900">{doc.vendorName}</td>
                                            <td className="px-4 py-3 border-r">{doc.candidateName}</td>
                                            <td className="px-4 py-3 border-r">{doc.jobTitle}</td>
                                            <td className="px-4 py-3 border-r">{doc.clientName}</td>
                                            <td className="px-4 py-3 border-r">{doc.contractNumber}</td>
                                            <td className="px-4 py-3 border-r">{new Date(doc.submittedOn).toLocaleDateString()}</td>
                                            <td className="px-4 py-3 border-r"><span className={`px-2 py-1 text-xs font-semibold rounded-full ${doc.status === 'Fully Signed' ? 'bg-green-100 text-green-800' : doc.status === 'Vendor Signed' ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'}`}>{doc.status}</span></td>
                                            <td className="px-4 py-3 border-r text-center">
                                                {doc.status === 'Vendor Signed' && (<button onClick={() => handleDirectorSignClick(doc)} className="px-3 py-1.5 bg-green-600 text-white text-xs font-semibold rounded-md hover:bg-green-700 mr-2 shadow-sm">Sign as Taproot</button>)}
                                                <Dropdown trigger={<button className="text-gray-500 hover:text-gray-700 p-1 rounded-full inline-flex items-center justify-center"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="1"></circle><circle cx="12" cy="5" r="1"></circle><circle cx="12" cy="19" r="1"></circle></svg></button>}>
                                                    <a href="#" onClick={(e) => { e.preventDefault(); handlePreview(doc); }} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Preview/Review</a>
                                                    <a href="#" onClick={(e) => { e.preventDefault(); handleEdit(doc); }} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Edit / Cancel</a>
                                                    <a href="#" onClick={(e) => { e.preventDefault(); handleResend(doc); }} className="block px-4 py-2 text-sm text-blue-600 hover:bg-gray-100">Resend Email</a>
                                                    <a href="#" onClick={(e) => { e.preventDefault(); handleDelete(doc); }} className="block px-4 py-2 text-sm text-red-600 hover:bg-gray-100">Delete</a>
                                                </Dropdown>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
            <ConfirmationModal isOpen={modalState.type === 'delete'} onClose={() => setModalState({ type: null, data: null })} onConfirm={handleConfirmDelete} title="Confirm Deletion" message={`Are you sure you want to delete the document for "${modalState.data?.vendorName}"?`} confirmText="Delete"/>
            <ConfirmationModal isOpen={modalState.type === 'resend'} onClose={() => setModalState({ type: null, data: null })} onConfirm={handleConfirmResend} title="Confirm Resend" message={`Are you sure you want to resend the e-sign email to "${modalState.data?.vendorEmail}"?`} confirmText="Resend"/>
            <EditMSAandWOModal isOpen={modalState.type === 'edit'} onClose={() => setModalState({ type: null, data: null })} onSave={handleSaveChanges} documentToEdit={modalState.data}/>
            <DocumentPreviewModal isOpen={isPreviewModalOpen} onClose={() => setIsPreviewModalOpen(false)} document={documentToPreview}/>
            <SignatureModal isOpen={isSigningModalOpen} onClose={() => setIsSigningModalOpen(false)} onSign={handleSign} signerType={signerConfig.signerType} signerInfo={signerConfig.signerInfo} requiresPassword={signerConfig.requiresPassword} documentUrl={signerConfig.pdfUrl} />
        </>
    );
};

export default MSAandWODashboardPage;