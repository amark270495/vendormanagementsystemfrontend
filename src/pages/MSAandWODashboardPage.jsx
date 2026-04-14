import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../api/apiService';
import Spinner from '../components/Spinner';
import Dropdown from '../components/Dropdown';
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
            title={`Document Viewer: ${document.contractNumber}`}
            size="5xl"
        >
            <div className="w-full h-[80vh] bg-[#323639] flex flex-col items-center overflow-y-auto p-4 sm:p-8 rounded-b-lg shadow-inner" style={{ scrollbarWidth: 'thin' }}>
                {document.pdfUrl ? (
                    <div className="w-full max-w-4xl h-full bg-white shadow-[0_10px_40px_rgba(0,0,0,0.5)] flex flex-col rounded-sm overflow-hidden border border-gray-400">
                        <div className="bg-[#f4f4f5] border-b border-gray-300 h-10 flex items-center px-4 justify-between text-gray-600 text-xs font-semibold flex-shrink-0">
                            <span>{document.vendorName} - {document.contractNumber}</span>
                            <span className="flex items-center text-green-600">
                                <svg className="w-3.5 h-3.5 mr-1" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd"></path></svg>
                                Secure Encrypted View
                            </span>
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
    
    // Filtering & Sorting State
    const [generalFilter, setGeneralFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });
    
    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    
    // Modal States
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

    // Reset pagination when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [generalFilter, statusFilter, sortConfig]);

    const kpiMetrics = useMemo(() => {
        const total = documents.length;
        const fullySigned = documents.filter(d => d.status === 'Fully Signed').length;
        const vendorSigned = documents.filter(d => d.status === 'Vendor Signed').length;
        const pendingVendor = documents.filter(d => d.status === 'Document Ready' || !d.status).length;
        
        return { total, fullySigned, vendorSigned, pendingVendor };
    }, [documents]);

    const filteredAndSortedData = useMemo(() => {
        let data = [...documents];

        // 1. Status Filter
        if (statusFilter !== 'All') {
            data = data.filter(item => {
                if (statusFilter === 'Pending') return item.status === 'Document Ready' || !item.status;
                return item.status === statusFilter;
            });
        }

        // 2. Global Text Search
        if (generalFilter) {
            const lower = generalFilter.toLowerCase();
            data = data.filter(item =>
                Object.values(item).some(val => String(val).toLowerCase().includes(lower))
            );
        }

        // 3. Sorting
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
    }, [documents, generalFilter, statusFilter, sortConfig]);

    // Pagination Logic
    const totalPages = Math.ceil(filteredAndSortedData.length / itemsPerPage);
    const paginatedData = filteredAndSortedData.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

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
        <div className="min-h-[calc(100vh-64px)] bg-[#f9fafb] p-4 sm:p-8 font-sans">
            <div className="max-w-[1600px] mx-auto space-y-6">
                
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">MSA & WO</h1>
                        <p className="text-sm text-gray-500 mt-2 max-w-xl">
                            Manage, track, and execute Master Services Agreements and Work Orders securely.
                        </p>
                    </div>
                    
                    {/* ENHANCED CONTROLS: Search, Filter, and Refresh */}
                    <div className="flex flex-col sm:flex-row w-full md:w-auto gap-3">
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="block w-full sm:w-48 px-3 py-2.5 bg-white border border-gray-300 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent shadow-sm"
                            disabled={loading || !canManageMSAWO}
                        >
                            <option value="All">All Statuses</option>
                            <option value="Fully Signed">Fully Executed</option>
                            <option value="Vendor Signed">Action Required (Taproot)</option>
                            <option value="Pending">Pending Vendor</option>
                        </select>

                        <div className="relative group w-full sm:w-72">
                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                <svg className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                            </div>
                            <input 
                                type="text" 
                                placeholder="Search records..." 
                                value={generalFilter} 
                                onChange={(e) => setGeneralFilter(e.target.value)} 
                                className="block w-full pl-11 pr-4 py-2.5 bg-white border border-gray-300 rounded-lg text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-shadow shadow-sm" 
                                disabled={loading || !canManageMSAWO}
                            />
                        </div>

                        <button 
                            onClick={loadData}
                            disabled={loading}
                            className="inline-flex items-center justify-center px-4 py-2.5 border border-gray-300 shadow-sm text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                        >
                            <svg className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
                        </button>
                    </div>
                </div>

                {!loading && !error && canManageMSAWO && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-500">Total Agreements</p>
                                <p className="text-2xl font-bold text-gray-900 mt-1">{kpiMetrics.total}</p>
                            </div>
                            <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center border border-gray-100">
                                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                            </div>
                        </div>
                        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-500">Pending Vendor</p>
                                <p className="text-2xl font-bold text-gray-900 mt-1">{kpiMetrics.pendingVendor}</p>
                            </div>
                            <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center border border-blue-100">
                                <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                            </div>
                        </div>
                        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-500">Action Required</p>
                                <p className="text-2xl font-bold text-gray-900 mt-1">{kpiMetrics.vendorSigned}</p>
                            </div>
                            <div className="w-12 h-12 bg-amber-50 rounded-full flex items-center justify-center border border-amber-100">
                                <svg className="w-6 h-6 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                            </div>
                        </div>
                        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-500">Fully Executed</p>
                                <p className="text-2xl font-bold text-gray-900 mt-1">{kpiMetrics.fullySigned}</p>
                            </div>
                            <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center border border-green-100">
                                <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                            </div>
                        </div>
                    </div>
                )}

                {error && (
                    <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded shadow-sm flex items-center">
                        <svg className="h-5 w-5 text-red-500 mr-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"></path></svg>
                        <p className="text-sm text-red-700 font-medium">{error}</p>
                    </div>
                )}
                {success && (
                    <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded shadow-sm flex items-center">
                        <svg className="h-5 w-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path></svg>
                        <p className="text-sm text-green-700 font-medium">{success}</p>
                    </div>
                )}

                {!loading && !error && canManageMSAWO && (
                    <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
                        <div className="overflow-x-auto flex-1" style={{ scrollbarWidth: 'thin' }}>
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-[#f8fafc] sticky top-0 z-10 shadow-sm">
                                    <tr>
                                        {tableHeader.map(h => {
                                            const sortKey = h.charAt(0).toLowerCase() + h.slice(1).replace(/\s/g, '');
                                            const isSorted = sortConfig.key === sortKey;
                                            return (
                                                <th 
                                                    key={h} 
                                                    scope="col" 
                                                    className="px-6 py-3.5 text-left group cursor-pointer border-b border-gray-200"
                                                    onClick={() => handleSort(sortKey)}
                                                >
                                                    <div className="flex items-center space-x-1.5 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                                                        <span>{h}</span>
                                                        <span className={`transition-opacity duration-200 ${isSorted ? 'opacity-100 text-blue-600' : 'opacity-0 group-hover:opacity-50'}`}>
                                                            {isSorted && sortConfig.direction === 'descending' ? (
                                                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7"></path></svg>
                                                            ) : (
                                                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 15l7-7 7 7"></path></svg>
                                                            )}
                                                        </span>
                                                    </div>
                                                </th>
                                            );
                                        })}
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-100">
                                    {paginatedData.map((doc) => (
                                        <tr key={doc.rowKey} className="hover:bg-[#f8fafc] transition-colors duration-150 group">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-semibold text-gray-900">{doc.vendorName}</div>
                                                <div className="text-xs text-gray-500 mt-0.5">{doc.vendorEmail || 'No email provided'}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 font-medium">{doc.candidateName}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{doc.jobTitle}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{doc.clientName}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono bg-gray-50/50 rounded">{doc.contractNumber}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(doc.submittedOn).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wide border ${
                                                    doc.status === 'Fully Signed' ? 'bg-green-50 text-green-700 border-green-200' : 
                                                    doc.status === 'Vendor Signed' ? 'bg-amber-50 text-amber-700 border-amber-200' : 
                                                    'bg-gray-50 text-gray-600 border-gray-200'
                                                }`}>
                                                    {doc.status === 'Vendor Signed' ? 'Needs Your Signature' : doc.status || 'Ready'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium flex justify-end items-center space-x-2">
                                                {doc.status === 'Vendor Signed' && (
                                                    <button 
                                                        onClick={() => handleDirectorSignClick(doc)} 
                                                        className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-bold rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                                                    >
                                                        Review & Sign
                                                    </button>
                                                )}
                                                <Dropdown trigger={
                                                    <button className="text-gray-400 hover:text-gray-900 bg-white hover:bg-gray-100 border border-transparent hover:border-gray-200 p-1.5 rounded-md transition-all focus:outline-none">
                                                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z"></path></svg>
                                                    </button>
                                                }>
                                                    <div className="py-1 min-w-[180px] shadow-lg border border-gray-100 rounded-lg">
                                                        <div className="px-3 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100 mb-1">Document Actions</div>
                                                        <a href="#" onClick={(e) => { e.preventDefault(); handlePreview(doc); }} className="group flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 font-medium">
                                                            <svg className="mr-3 h-4 w-4 text-gray-400 group-hover:text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
                                                            Open Viewer
                                                        </a>
                                                        <a href="#" onClick={(e) => { e.preventDefault(); handleResend(doc); }} className="group flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 font-medium">
                                                            <svg className="mr-3 h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2-2v10a2 2 0 002 2z"></path></svg>
                                                            Resend Email
                                                        </a>
                                                        <a href="#" onClick={(e) => { e.preventDefault(); handleEdit(doc); }} className="group flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 font-medium">
                                                            <svg className="mr-3 h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                                                            Edit Properties
                                                        </a>
                                                        <div className="border-t border-gray-100 my-1"></div>
                                                        <a href="#" onClick={(e) => { e.preventDefault(); handleDelete(doc); }} className="group flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 font-medium">
                                                            <svg className="mr-3 h-4 w-4 text-red-400 group-hover:text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                                            Delete Record
                                                        </a>
                                                    </div>
                                                </Dropdown>
                                            </td>
                                        </tr>
                                    ))}
                                    {paginatedData.length === 0 && (
                                        <tr>
                                            <td colSpan={8} className="px-6 py-20 text-center bg-gray-50/50">
                                                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white border border-gray-200 mb-4 shadow-sm">
                                                    <svg className="h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                                                </div>
                                                <h3 className="text-sm font-bold text-gray-900">No agreements found</h3>
                                                <p className="mt-1 text-sm text-gray-500">We couldn't find any documents matching your current filter.</p>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                        
                        {/* PAGINATION CONTROLS */}
                        {filteredAndSortedData.length > 0 && (
                            <div className="bg-white px-4 py-3 border-t border-gray-200 flex items-center justify-between sm:px-6">
                                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                                    <div className="flex items-center space-x-4">
                                        <p className="text-sm text-gray-700">
                                            Showing <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="font-medium">{Math.min(currentPage * itemsPerPage, filteredAndSortedData.length)}</span> of <span className="font-medium">{filteredAndSortedData.length}</span> results
                                        </p>
                                        <select
                                            value={itemsPerPage}
                                            onChange={(e) => {
                                                setItemsPerPage(Number(e.target.value));
                                                setCurrentPage(1);
                                            }}
                                            className="ml-2 block w-20 pl-3 pr-8 py-1.5 text-sm border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 rounded-md"
                                        >
                                            <option value={10}>10</option>
                                            <option value={25}>25</option>
                                            <option value={50}>50</option>
                                        </select>
                                    </div>
                                    <div>
                                        <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                                            <button
                                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                                disabled={currentPage === 1}
                                                className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                <span className="sr-only">Previous</span>
                                                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd"></path></svg>
                                            </button>
                                            <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                                                Page {currentPage} of {totalPages}
                                            </span>
                                            <button
                                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                                disabled={currentPage === totalPages}
                                                className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                <span className="sr-only">Next</span>
                                                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd"></path></svg>
                                            </button>
                                        </nav>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
                
                {loading && (
                    <div className="flex flex-col justify-center items-center h-[400px] bg-white border border-gray-200 rounded-xl shadow-sm">
                        <Spinner />
                        <p className="mt-4 text-sm text-gray-500 font-medium tracking-wide">Syncing documents...</p>
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