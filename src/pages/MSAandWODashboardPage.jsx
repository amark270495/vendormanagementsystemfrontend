import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../api/apiService';
import Spinner from '../components/Spinner';
import Dropdown from '../components/Dropdown';
import HeaderMenu from '../components/dashboard/HeaderMenu'; // Left import intact if used elsewhere
import ConfirmationModal from '../components/dashboard/ConfirmationModal';
import EditMSAandWOModal from '../components/msa-wo/EditMSAandWOModal';
import { usePermissions } from '../hooks/usePermissions';
import Modal from '../components/Modal';
import SignatureModal from '../components/msa-wo/SignatureModal';

// Enhanced Preview Modal - Dark "Acrobat" style viewer
const DocumentPreviewModal = ({ isOpen, onClose, document }) => {
    if (!isOpen || !document) return null;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={`Document Viewer: ${document.contractNumber}`}
            size="5xl"
        >
            <div className="w-full h-[80vh] bg-[#323639] flex flex-col items-center overflow-y-auto p-4 sm:p-8 custom-scrollbar rounded-b-lg shadow-inner">
                {document.pdfUrl ? (
                    <div className="w-full max-w-4xl h-full bg-white shadow-[0_10px_40px_rgba(0,0,0,0.5)] flex flex-col">
                         {/* Fake PDF Toolbar for authentic feel */}
                        <div className="bg-[#f4f4f5] border-b border-gray-300 h-10 flex items-center px-4 justify-between text-gray-500 text-sm flex-shrink-0">
                            <span>{document.vendorName} - {document.contractNumber}</span>
                            <span>Secure Preview</span>
                        </div>
                        <iframe
                            src={document.pdfUrl}
                            title="Document Preview"
                            className="w-full flex-1 border-0"
                        />
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                        <svg className="w-16 h-16 text-gray-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                        <p className="text-gray-300 font-medium text-lg">Document Unavailable</p>
                        <p className="text-gray-500 text-sm mt-1">Could not load the secure preview for this file.</p>
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
            pdfUrl: doc.pdfUrl
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
        <div className="min-h-screen bg-[#f8f9fa] py-8 font-sans">
            <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
                
                {/* Enterprise Header Area */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Contract Management</h1>
                        <p className="text-sm text-gray-500 mt-1">Review, track, and securely execute MSA and Work Orders.</p>
                    </div>
                    
                    <div className="relative w-full md:w-80">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                        </div>
                        <input 
                            type="text" 
                            placeholder="Search documents, vendors, or IDs..." 
                            value={generalFilter} 
                            onChange={(e) => setGeneralFilter(e.target.value)} 
                            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-600 focus:border-blue-600 sm:text-sm transition-colors shadow-sm" 
                            disabled={loading || !canManageMSAWO}
                        />
                    </div>
                </div>

                {/* Alert Banners */}
                {error && (
                    <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md shadow-sm">
                        <div className="flex items-center">
                            <svg className="h-5 w-5 text-red-500 mr-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"></path></svg>
                            <p className="text-sm text-red-700 font-medium">{error}</p>
                        </div>
                    </div>
                )}
                {success && (
                    <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-md shadow-sm">
                        <div className="flex items-center">
                            <svg className="h-5 w-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path></svg>
                            <p className="text-sm text-green-700 font-medium">{success}</p>
                        </div>
                    </div>
                )}

                {/* Main Data Table */}
                {!loading && !error && canManageMSAWO && (
                    <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden flex flex-col" style={{ maxHeight: 'calc(100vh - 200px)' }}>
                        <div className="overflow-x-auto flex-1 custom-scrollbar">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50 sticky top-0 z-10 shadow-sm">
                                    <tr>
                                        {tableHeader.map(h => {
                                            const sortKey = h.charAt(0).toLowerCase() + h.slice(1).replace(/\s/g, '');
                                            const isSorted = sortConfig.key === sortKey;
                                            return (
                                                <th 
                                                    key={h} 
                                                    scope="col" 
                                                    className="px-6 py-3 text-left group cursor-pointer"
                                                    onClick={() => handleSort(sortKey)}
                                                >
                                                    <div className="flex items-center space-x-1 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                                        <span>{h}</span>
                                                        <span className={`transition-opacity ${isSorted ? 'opacity-100' : 'opacity-0 group-hover:opacity-50'}`}>
                                                            {isSorted && sortConfig.direction === 'descending' ? (
                                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                                            ) : (
                                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7"></path></svg>
                                                            )}
                                                        </span>
                                                    </div>
                                                </th>
                                            );
                                        })}
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-100">
                                    {filteredAndSortedData.map((doc) => (
                                        <tr key={doc.rowKey} className="hover:bg-blue-50/50 transition-colors duration-150">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{doc.vendorName}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{doc.candidateName}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{doc.jobTitle}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{doc.clientName}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">{doc.contractNumber}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(doc.submittedOn).toLocaleDateString()}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ring-1 ring-inset ${
                                                    doc.status === 'Fully Signed' ? 'bg-green-50 text-green-700 ring-green-600/20' : 
                                                    doc.status === 'Vendor Signed' ? 'bg-amber-50 text-amber-700 ring-amber-600/20' : 
                                                    'bg-blue-50 text-blue-700 ring-blue-600/20'
                                                }`}>
                                                    {doc.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium flex justify-end items-center space-x-3">
                                                {doc.status === 'Vendor Signed' && (
                                                    <button 
                                                        onClick={() => handleDirectorSignClick(doc)} 
                                                        className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-[#1473E6] hover:bg-[#0d66d0] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1473E6] transition-colors"
                                                    >
                                                        Review & Sign
                                                    </button>
                                                )}
                                                <Dropdown trigger={
                                                    <button className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1.5 rounded-md transition-colors focus:outline-none">
                                                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z"></path></svg>
                                                    </button>
                                                }>
                                                    <div className="py-1 min-w-[160px]">
                                                        <a href="#" onClick={(e) => { e.preventDefault(); handlePreview(doc); }} className="group flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900">
                                                            <svg className="mr-3 h-4 w-4 text-gray-400 group-hover:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
                                                            View Document
                                                        </a>
                                                        <a href="#" onClick={(e) => { e.preventDefault(); handleResend(doc); }} className="group flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900">
                                                            <svg className="mr-3 h-4 w-4 text-gray-400 group-hover:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
                                                            Resend Email
                                                        </a>
                                                        <a href="#" onClick={(e) => { e.preventDefault(); handleEdit(doc); }} className="group flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900">
                                                            <svg className="mr-3 h-4 w-4 text-gray-400 group-hover:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                                                            Edit Data
                                                        </a>
                                                        <div className="border-t border-gray-100 my-1"></div>
                                                        <a href="#" onClick={(e) => { e.preventDefault(); handleDelete(doc); }} className="group flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50">
                                                            <svg className="mr-3 h-4 w-4 text-red-400 group-hover:text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                                            Delete Record
                                                        </a>
                                                    </div>
                                                </Dropdown>
                                            </td>
                                        </tr>
                                    ))}
                                    {filteredAndSortedData.length === 0 && (
                                        <tr>
                                            <td colSpan={8} className="px-6 py-16 text-center text-gray-500">
                                                <svg className="mx-auto h-12 w-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                                                <p className="mt-4 text-sm font-medium">No documents found matching your criteria.</p>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
                
                {loading && (
                    <div className="flex flex-col justify-center items-center h-64 bg-white border border-gray-200 rounded-lg shadow-sm">
                        <Spinner />
                        <p className="mt-4 text-sm text-gray-500 font-medium">Loading documents...</p>
                    </div>
                )}
            </div>

            <ConfirmationModal isOpen={modalState.type === 'delete'} onClose={() => setModalState({ type: null, data: null })} onConfirm={handleConfirmDelete} title="Confirm Deletion" message={`Are you sure you want to securely delete the document for "${modalState.data?.vendorName}"? This action cannot be undone.`} confirmText="Delete Document"/>
            <ConfirmationModal isOpen={modalState.type === 'resend'} onClose={() => setModalState({ type: null, data: null })} onConfirm={handleConfirmResend} title="Resend Signature Request" message={`Are you sure you want to resend the e-sign email to "${modalState.data?.vendorEmail}"?`} confirmText="Resend Email"/>
            <EditMSAandWOModal isOpen={modalState.type === 'edit'} onClose={() => setModalState({ type: null, data: null })} onSave={handleSaveChanges} documentToEdit={modalState.data}/>
            <DocumentPreviewModal isOpen={isPreviewModalOpen} onClose={() => setIsPreviewModalOpen(false)} document={documentToPreview}/>
            <SignatureModal isOpen={isSigningModalOpen} onClose={() => setIsSigningModalOpen(false)} onSign={handleSign} signerType={signerConfig.signerType} signerInfo={signerConfig.signerInfo} requiresPassword={signerConfig.requiresPassword} documentUrl={signerConfig.pdfUrl} />
        </div>
    );
};

export default MSAandWODashboardPage;