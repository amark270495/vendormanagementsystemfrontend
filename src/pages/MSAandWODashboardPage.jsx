import React, { useState, useEffect, useCallback, useMemo } from 'react';

// --- Placeholder for useAuth hook as its source is external ---
const useAuth = () => {
    // In a real app, this would be a React context hook
    // We'll return mock data for this single-file example
    const [user, setUser] = useState({ userIdentifier: 'mock-user-id' });
    
    // Simulate a user login/auth state change
    useEffect(() => {
        // Mock API call to get user data
        const timer = setTimeout(() => {
            setUser({ userIdentifier: 'test-user-123' });
        }, 100);
        return () => clearTimeout(timer);
    }, []);

    return { user };
};

// --- Placeholder for usePermissions hook as its source is external ---
const usePermissions = () => {
    // In a real app, this would check user roles/permissions
    return { canManageMSAWO: true };
};


// --- MOCK apiService for this single file example ---
const apiService = {
    getMSAandWODashboardData: async (userIdentifier) => {
        console.log(`Fetching data for user: ${userIdentifier}`);
        // Simulate an API call delay
        await new Promise(resolve => setTimeout(resolve, 500));
        // Return mock data
        return {
            data: {
                success: true,
                data: [
                    {
                        partitionKey: 'mock1', rowKey: 'row1', vendorName: 'ABC Inc.', candidateName: 'John Doe',
                        contractNumber: 'C-001', submittedOn: '2023-10-26T10:00:00Z', status: 'Pending', pdfUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf'
                    },
                    {
                        partitionKey: 'mock2', rowKey: 'row2', vendorName: 'XYZ Corp.', candidateName: 'Jane Smith',
                        contractNumber: 'C-002', submittedOn: '2023-10-25T15:30:00Z', status: 'Vendor Signed', pdfUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf'
                    },
                    {
                        partitionKey: 'mock3', rowKey: 'row3', vendorName: 'GHI LLC', candidateName: 'Peter Jones',
                        contractNumber: 'C-003', submittedOn: '2023-10-24T08:00:00Z', status: 'Finalized', pdfUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf'
                    },
                ]
            }
        };
    },
    deleteMSAandWO: async (pk, rk, userIdentifier) => {
        console.log(`Deleting document: ${pk}/${rk} by user: ${userIdentifier}`);
        await new Promise(resolve => setTimeout(resolve, 500));
        return { data: { success: true } };
    },
    resendMSAWOEmail: async (pk, rk, userIdentifier) => {
        console.log(`Resending email for document: ${pk}/${rk} by user: ${userIdentifier}`);
        await new Promise(resolve => setTimeout(resolve, 500));
        return { data: { success: true, message: 'Email resent successfully.' } };
    },
    updateMSAandWO: async (updatedData, userIdentifier) => {
        console.log(`Updating document for user: ${userIdentifier}`, updatedData);
        await new Promise(resolve => setTimeout(resolve, 500));
        return { data: { success: true } };
    }
};

// --- MOCK COMPONENTS ---

const Spinner = () => (
    <div className="flex justify-center items-center">
        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-gray-800" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
    </div>
);

const Dropdown = ({ trigger, children, width = '48' }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = React.useRef(null);

    const handleOutsideClick = useCallback((event) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
            setIsOpen(false);
        }
    }, []);

    useEffect(() => {
        document.addEventListener('mousedown', handleOutsideClick);
        return () => {
            document.removeEventListener('mousedown', handleOutsideClick);
        };
    }, [handleOutsideClick]);

    return (
        <div ref={dropdownRef} className="relative inline-block text-left">
            <div onClick={() => setIsOpen(!isOpen)}>
                {trigger}
            </div>
            {isOpen && (
                <div className={`absolute right-0 mt-2 w-${width} rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-20`}>
                    <div className="py-1" role="menu" aria-orientation="vertical" aria-labelledby="options-menu">
                        {children}
                    </div>
                </div>
            )}
        </div>
    );
};

const HeaderMenu = ({ header, onSort }) => (
    <div className="px-4 py-2">
        <div className="text-sm font-semibold text-gray-700">Sort by {header}</div>
        <div className="mt-2 space-y-2">
            <button onClick={() => onSort('ascending')} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md">
                Ascending ▲
            </button>
            <button onClick={() => onSort('descending')} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md">
                Descending ▼
            </button>
        </div>
    </div>
);

const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message, confirmText }) => {
    if (!isOpen) return null;
    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title}>
            <p className="mb-4 text-gray-600">{message}</p>
            <div className="flex justify-end space-x-2">
                <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300">
                    Cancel
                </button>
                <button onClick={onConfirm} className={`px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700`}>
                    {confirmText}
                </button>
            </div>
        </Modal>
    );
};

const EditMSAandWOModal = ({ isOpen, onClose, onSave, documentToEdit }) => {
    const [formData, setFormData] = useState(documentToEdit || {});
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        setFormData(documentToEdit || {});
        setError('');
        setSuccess('');
    }, [documentToEdit]);

    if (!isOpen) return null;

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await onSave(formData);
            setSuccess('Document saved successfully!');
            setTimeout(onClose, 1500);
        } catch (e) {
            setError(e.message || 'Failed to save changes.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Edit Document">
            <div className="space-y-4">
                {error && <div className="text-red-500">{error}</div>}
                {success && <div className="text-green-500">{success}</div>}
                <label className="block">
                    <span className="text-gray-700">Vendor Name</span>
                    <input type="text" name="vendorName" value={formData.vendorName || ''} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
                </label>
                <label className="block">
                    <span className="text-gray-700">Candidate Name</span>
                    <input type="text" name="candidateName" value={formData.candidateName || ''} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
                </label>
                <label className="block">
                    <span className="text-gray-700">Contract Number</span>
                    <input type="text" name="contractNumber" value={formData.contractNumber || ''} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
                </label>
                <label className="block">
                    <span className="text-gray-700">Status</span>
                    <input type="text" name="status" value={formData.status || ''} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
                </label>
            </div>
            <div className="flex justify-end mt-4 space-x-2">
                <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300">Cancel</button>
                <button onClick={handleSave} disabled={saving} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50">
                    {saving ? 'Saving...' : 'Save Changes'}
                </button>
            </div>
        </Modal>
    );
};

const Modal = ({ isOpen, onClose, title, children, size = 'xl' }) => {
    if (!isOpen) return null;

    const sizeClasses = {
        sm: 'max-w-sm',
        md: 'max-w-md',
        lg: 'max-w-lg',
        xl: 'max-w-xl',
        '2xl': 'max-w-2xl',
        '3xl': 'max-w-3xl',
        '4xl': 'max-w-4xl',
        '5xl': 'max-w-5xl',
        '6xl': 'max-w-6xl',
    };

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
            <div className="flex items-center justify-center min-h-screen px-4 py-10 text-center sm:block sm:p-0">
                <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true"></div>
                <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
                <div className={`inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:w-full ${sizeClasses[size]}`}>
                    <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                        <div className="flex justify-between items-center">
                            <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                                {title}
                            </h3>
                            <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
                                <span className="sr-only">Close</span>
                                <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <div className="mt-2">
                            {children}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const DirectorSigningModal = ({ isOpen, onClose, document, onSuccess }) => {
    const [isSigning, setIsSigning] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    if (!isOpen || !document) return null;

    const handleSignDocument = async () => {
        setIsSigning(true);
        setError('');
        try {
            await new Promise(resolve => setTimeout(resolve, 1000));
            setSuccess('Document signed successfully!');
            setTimeout(() => {
                onSuccess();
                onClose();
            }, 1500);
        } catch (e) {
            setError('Failed to sign the document.');
        } finally {
            setIsSigning(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Director Signing" size="md">
            <p className="text-sm text-gray-700">
                You are about to sign and finalize the document for <strong>{document.vendorName}</strong>. This action will change the status to "Finalized".
            </p>
            {error && <div className="mt-4 text-sm text-red-500">{error}</div>}
            {success && <div className="mt-4 text-sm text-green-500">{success}</div>}
            <div className="flex justify-end mt-4 space-x-2">
                <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300">
                    Cancel
                </button>
                <button onClick={handleSignDocument} disabled={isSigning} className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50">
                    {isSigning ? 'Signing...' : 'Confirm Sign'}
                </button>
            </div>
        </Modal>
    );
};


// --- HELPER COMPONENT: Document Preview Modal ---
const DocumentPreviewModal = ({ isOpen, onClose, document }) => {
    if (!isOpen || !document) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Preview: ${document.vendorName} - ${document.contractNumber}`} size="6xl">
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


// --- MAIN COMPONENT: MSAandWODashboardPage ---
const MSAandWODashboardPage = () => {
    const { user } = useAuth();
    const { canManageMSAWO } = usePermissions();
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [generalFilter, setGeneralFilter] = useState('');
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });
    const [modalState, setModalState] = useState({ type: null, data: null });
    const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
    const [documentToPreview, setDocumentToPreview] = useState(null);

    // State for the Director Signing Modal
    const [isDirectorSigningModalOpen, setIsDirectorSigningModalOpen] = useState(false);
    const [documentToSign, setDocumentToSign] = useState(null);

    const tableHeader = useMemo(() => ['Vendor Name', 'Candidate Name', 'Contract Number', 'Submitted On', 'Status', 'Actions'], []);

    const loadData = useCallback(async () => {
        setLoading(true);
        setError('');
        setSuccess('');
        if (!user?.userIdentifier || !canManageMSAWO) {
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
    }, [user?.userIdentifier, canManageMSAWO]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const filteredAndSortedData = useMemo(() => {
        let data = documents.map(doc => ({
            original: doc,
            display: [doc.vendorName, doc.candidateName, doc.contractNumber, new Date(doc.submittedOn).toLocaleDateString(), doc.status]
        }));
        if (generalFilter) {
            const lowercasedFilter = generalFilter.toLowerCase();
            data = data.filter(item => item.display.some(cell => String(cell).toLowerCase().includes(lowercasedFilter)));
        }
        if (sortConfig.key) {
            const sortIndex = tableHeader.indexOf(sortConfig.key);
            if (sortIndex !== -1) {
                data.sort((a, b) => {
                    let valA = a.display[sortIndex];
                    let valB = b.display[sortIndex];
                    if (sortConfig.key === 'Submitted On') {
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
    }, [documents, generalFilter, sortConfig, tableHeader]);

    const handleSort = (key, direction) => setSortConfig({ key, direction });
    const handleEdit = (doc) => setModalState({ type: 'edit', data: doc });
    const handleDelete = (doc) => setModalState({ type: 'delete', data: doc });
    const handleResend = (doc) => setModalState({ type: 'resend', data: doc });

    const handlePreview = (doc) => {
        if (doc.pdfUrl) {
            setDocumentToPreview(doc);
            setIsPreviewModalOpen(true);
        } else {
            setError("No PDF is available for preview for this document.");
            setTimeout(() => setError(''), 3000);
        }
    };

    const handleConfirmDelete = async () => {
        const docToDelete = modalState.data;
        if (!docToDelete) return;
        setLoading(true);
        try {
            await apiService.deleteMSAandWO(docToDelete.partitionKey, docToDelete.rowKey, user.userIdentifier);
            setSuccess('Document deleted successfully.');
            loadData();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to delete document.');
        } finally {
            setLoading(false);
            setModalState({ type: null, data: null });
        }
    };

    const handleConfirmResend = async () => {
        const docToResend = modalState.data;
        if (!docToResend) return;
        setLoading(true);
        try {
            const response = await apiService.resendMSAWOEmail(docToResend.partitionKey, docToResend.rowKey, user.userIdentifier);
            setSuccess(response.data.message);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to resend email.');
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
            setError(err.response?.data?.message || 'Failed to update document.');
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const handleDirectorSignClick = (doc) => {
        setDocumentToSign(doc);
        setIsDirectorSigningModalOpen(true);
    };

    const handleSignSuccess = () => {
        setIsDirectorSigningModalOpen(false);
        setSuccess("Document successfully signed and finalized!");
        loadData(); 
    };

    return (
        <>
            <div className="p-8 space-y-4 font-sans antialiased text-gray-900 bg-gray-100 min-h-screen">
                <h1 className="text-3xl font-bold text-gray-800">MSA and WO Dashboard</h1>
                <div className="bg-white p-4 rounded-lg shadow-sm border">
                    <input type="text" placeholder="Search all columns..." value={generalFilter} onChange={(e) => setGeneralFilter(e.target.value)} className="shadow-sm border-gray-300 rounded-md px-3 py-2 w-full md:w-1/3" disabled={loading || !canManageMSAWO} />
                </div>
                {loading && <div className="flex justify-center items-center h-64"><Spinner /></div>}
                {error && <div className="text-red-500 bg-red-100 p-4 rounded-lg">Error: {error}</div>}
                {success && <div className="text-green-500 bg-green-100 p-4 rounded-lg">Success: {success}</div>}
                {!loading && !error && canManageMSAWO && (
                    <div className="bg-white rounded-lg shadow-lg border" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                        <table className="w-full text-sm text-left text-gray-500">
                            <thead className="text-xs text-gray-700 uppercase bg-slate-200 sticky top-0 z-10">
                                <tr>
                                    {tableHeader.map(h => (
                                        <th key={h} scope="col" className="p-0 border-r last:border-r-0">
                                            {h === 'Actions' ? <div className="p-3 font-bold text-center">{h}</div> : (
                                                <Dropdown width="64" trigger={<div className="flex items-center justify-between w-full h-full cursor-pointer p-3 hover:bg-slate-300"><span className="font-bold">{h}</span>{sortConfig.key === h && (sortConfig.direction === 'ascending' ? ' ▲' : ' ▼')}</div>}>
                                                    <HeaderMenu header={h} onSort={(dir) => handleSort(h, dir)} />
                                                </Dropdown>
                                            )}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {filteredAndSortedData.map((item) => (
                                    <tr key={item.original.rowKey} className="bg-gray-50 border-b hover:bg-gray-100">
                                        {item.display.map((cell, cellIndex) => (<td key={cellIndex} className="px-4 py-3 border-r last:border-r-0 font-medium text-gray-900">{cell}</td>))}
                                        <td className="px-4 py-3 border-r last:border-r-0 text-center">
                                            {item.original.status === 'Vendor Signed' && (
                                                <button onClick={() => handleDirectorSignClick(item.original)} className="px-3 py-1.5 bg-green-600 text-white text-xs font-semibold rounded-md hover:bg-green-700 mr-2 shadow-sm">
                                                    Sign as Taproot
                                                </button>
                                            )}
                                            <Dropdown trigger={<button className="text-gray-500 hover:text-gray-700 p-1 rounded-full inline-flex items-center justify-center"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="1"></circle><circle cx="12" cy="5" r="1"></circle><circle cx="12" cy="19" r="1"></circle></svg></button>}>
                                                <a href="#" onClick={(e) => { e.preventDefault(); handlePreview(item.original); }} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Preview/Review</a>
                                                <a href="#" onClick={(e) => { e.preventDefault(); handleEdit(item.original); }} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Edit / Cancel</a>
                                                <a href="#" onClick={(e) => { e.preventDefault(); handleResend(item.original); }} className="block px-4 py-2 text-sm text-blue-600 hover:bg-gray-100">Resend Email</a>
                                                <a href="#" onClick={(e) => { e.preventDefault(); handleDelete(item.original); }} className="block px-4 py-2 text-sm text-red-600 hover:bg-gray-100">Delete</a>
                                            </Dropdown>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
            
            <ConfirmationModal isOpen={modalState.type === 'delete'} onClose={() => setModalState({ type: null, data: null })} onConfirm={handleConfirmDelete} title="Confirm Deletion" message={`Are you sure you want to delete the document for "${modalState.data?.vendorName}"? This action cannot be undone.`} confirmText="Delete"/>
            <ConfirmationModal isOpen={modalState.type === 'resend'} onClose={() => setModalState({ type: null, data: null })} onConfirm={handleConfirmResend} title="Confirm Resend" message={`Are you sure you want to resend the e-sign email to "${modalState.data?.vendorEmail}"? A new temporary password will be generated.`} confirmText="Resend"/>
            <EditMSAandWOModal isOpen={modalState.type === 'edit'} onClose={() => setModalState({ type: null, data: null })} onSave={handleSaveChanges} documentToEdit={modalState.data}/>
            <DocumentPreviewModal isOpen={isPreviewModalOpen} onClose={() => setIsPreviewModalOpen(false)} document={documentToPreview} />
            
            <DirectorSigningModal
                isOpen={isDirectorSigningModalOpen}
                onClose={() => setIsDirectorSigningModalOpen(false)}
                document={documentToSign}
                onSuccess={handleSignSuccess}
            />
        </>
    );
};

export default MSAandWODashboardPage;