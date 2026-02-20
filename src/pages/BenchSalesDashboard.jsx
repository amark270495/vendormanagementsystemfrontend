import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { usePermissions } from '../hooks/usePermissions';
import { apiService } from '../api/apiService';

// --- Icons ---
const SearchIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
);
const EditIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
);
const DeleteIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
);
const PlusIcon = () => (
    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
);

const BenchSalesDashboard = () => {
    const { user } = useAuth();
    const { canEditUsers, canManageBenchSales, canAddPosting } = usePermissions();

    const [candidates, setCandidates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    
    // Recruiter List for the "Assigned To" dropdown
    const [recruiters, setRecruiters] = useState([]);

    // Modal States
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCandidate, setEditingCandidate] = useState(null);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [deletingCandidate, setDeletingCandidate] = useState(null);

    // Form State
    const [formData, setFormData] = useState({});

    // Initial Fetch
    useEffect(() => {
        fetchCandidates();
        fetchRecruiters();
    }, []);

    const fetchCandidates = async () => {
        setLoading(true);
        try {
            const response = await apiService.getBenchCandidates(user.userIdentifier);
            if (response.data.success) {
                setCandidates(response.data.candidates);
            }
        } catch (error) {
            console.error("Error fetching bench candidates:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchRecruiters = async () => {
        try {
            const response = await apiService.getUsers(user.userIdentifier);
            if (response.data.success) {
                // Assuming recruiters have a specific role, or you just list all users
                setRecruiters(response.data.users);
            }
        } catch (error) {
            console.error("Error fetching users for recruiters list:", error);
        }
    };

    // --- Derived State (Filtering) ---
    const filteredCandidates = useMemo(() => {
        if (!searchTerm) return candidates;
        const lowerSearch = searchTerm.toLowerCase();
        return candidates.filter(c => 
            c.firstName?.toLowerCase().includes(lowerSearch) ||
            c.lastName?.toLowerCase().includes(lowerSearch) ||
            c.email?.toLowerCase().includes(lowerSearch) ||
            c.companyName?.toLowerCase().includes(lowerSearch) ||
            c.appliedRole?.toLowerCase().includes(lowerSearch) ||
            c.workingBy?.toLowerCase().includes(lowerSearch)
        );
    }, [candidates, searchTerm]);

    // --- Modal Handlers ---
    const openAddModal = () => {
        setEditingCandidate(null);
        setFormData({
            firstName: '', lastName: '', email: '', mobileNumber: '',
            workAuthorizationStatus: '', workAuthorizationValidDate: '',
            totalExperience: '', usExperience: '', skillSet: '',
            companyName: '', appliedRole: '', appliedC2CRate: '', 
            status: 'Submitted', workingBy: user.userName // Default assign to self
        });
        setIsModalOpen(true);
    };

    const openEditModal = (candidate) => {
        setEditingCandidate(candidate);
        setFormData({ ...candidate });
        setIsModalOpen(true);
    };

    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            if (editingCandidate) {
                await apiService.updateBenchCandidate(editingCandidate.rowKey, formData, user.userIdentifier);
            } else {
                await apiService.addBenchCandidate(formData, user.userIdentifier);
            }
            setIsModalOpen(false);
            fetchCandidates();
        } catch (error) {
            alert(error.response?.data?.message || "An error occurred while saving.");
        }
    };

    const confirmDelete = async () => {
        try {
            await apiService.deleteBenchCandidate(deletingCandidate.rowKey, user.userIdentifier);
            setIsDeleteOpen(false);
            fetchCandidates();
        } catch (error) {
            alert(error.response?.data?.message || "An error occurred while deleting.");
        }
    };

    // --- Permissions Logic for Rows ---
    const isAdmin = canEditUsers || canManageBenchSales;
    
    const canEditRow = (candidate) => {
        if (isAdmin) return true;
        if (candidate.submittedBy === user.userIdentifier) return true;
        if (candidate.workingBy === user.userName) return true;
        return false;
    };

    const canDeleteRow = (candidate) => {
        if (isAdmin) return true;
        if (candidate.submittedBy === user.userIdentifier) return true;
        return false;
    };

    const getStatusStyle = (status) => {
        switch(status?.toLowerCase()) {
            case 'submitted': return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'in the review': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'in the interview': return 'bg-purple-100 text-purple-800 border-purple-200';
            case 'selected': return 'bg-green-100 text-green-800 border-green-200';
            case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
            default: return 'bg-slate-100 text-slate-800 border-slate-200';
        }
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Bench Sales Dashboard</h1>
                    <p className="text-sm text-slate-500 mt-1">Manage W2 candidate submissions and marketing.</p>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                            <SearchIcon />
                        </div>
                        <input
                            type="text"
                            placeholder="Search candidates, roles, companies..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="block w-full sm:w-80 pl-10 pr-3 py-2 border border-slate-300 rounded-md leading-5 bg-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-all"
                        />
                    </div>
                    
                    <button
                        onClick={openAddModal}
                        className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                    >
                        <PlusIcon /> Add Candidate
                    </button>
                </div>
            </div>

            {/* Main Table */}
            <div className="bg-white shadow-sm ring-1 ring-slate-200 rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Candidate</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Auth / Skills</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Target Role & Company</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Assigned To</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-200">
                            {loading ? (
                                <tr><td colSpan="6" className="px-6 py-8 text-center text-slate-500">Loading candidates...</td></tr>
                            ) : filteredCandidates.length === 0 ? (
                                <tr><td colSpan="6" className="px-6 py-8 text-center text-slate-500">No candidates found matching your criteria.</td></tr>
                            ) : (
                                filteredCandidates.map((candidate) => (
                                    <tr key={candidate.rowKey} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="font-medium text-slate-900">{candidate.firstName} {candidate.lastName}</div>
                                            <div className="text-sm text-slate-500">{candidate.email}</div>
                                            <div className="text-xs text-slate-400 mt-0.5">{candidate.mobileNumber}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-slate-900 font-medium">{candidate.workAuthorizationStatus || 'N/A'}</div>
                                            <div className="text-xs text-slate-500 truncate max-w-xs" title={candidate.skillSet}>{candidate.skillSet || 'No skills listed'}</div>
                                            <div className="text-xs text-slate-400">Exp: {candidate.totalExperience || '0'} yrs</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-medium text-indigo-600">{candidate.appliedRole || 'Not Specified'}</div>
                                            <div className="text-sm text-slate-700">{candidate.companyName || 'No Company'}</div>
                                            <div className="text-xs text-slate-500">Rate: {candidate.appliedC2CRate || 'N/A'}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-slate-900">
                                                {candidate.workingBy ? (
                                                    <span className="inline-flex items-center gap-1.5">
                                                        <div className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold">
                                                            {candidate.workingBy.charAt(0).toUpperCase()}
                                                        </div>
                                                        {candidate.workingBy}
                                                    </span>
                                                ) : (
                                                    <span className="text-slate-400 italic">Unassigned</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border ${getStatusStyle(candidate.status)}`}>
                                                {candidate.status || 'Draft'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex items-center justify-end gap-3">
                                                {canEditRow(candidate) && (
                                                    <button onClick={() => openEditModal(candidate)} className="text-indigo-600 hover:text-indigo-900 bg-indigo-50 p-1.5 rounded hover:bg-indigo-100 transition-colors" title="Edit">
                                                        <EditIcon />
                                                    </button>
                                                )}
                                                {canDeleteRow(candidate) && (
                                                    <button onClick={() => { setDeletingCandidate(candidate); setIsDeleteOpen(true); }} className="text-red-600 hover:text-red-900 bg-red-50 p-1.5 rounded hover:bg-red-100 transition-colors" title="Delete">
                                                        <DeleteIcon />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* --- ADD/EDIT MODAL --- */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
                    <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                        {/* Background overlay */}
                        <div className="fixed inset-0 bg-slate-900 bg-opacity-75 transition-opacity" onClick={() => setIsModalOpen(false)}></div>
                        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
                        
                        <div className="inline-block align-bottom bg-white rounded-xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl w-full">
                            <form onSubmit={handleSave}>
                                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                                    <h3 className="text-lg leading-6 font-semibold text-slate-900 mb-5 border-b pb-3">
                                        {editingCandidate ? 'Edit Candidate Submission' : 'Add New Candidate Submission'}
                                    </h3>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        {/* Column 1: Personal Info */}
                                        <div className="space-y-4">
                                            <h4 className="font-medium text-indigo-600 text-sm uppercase tracking-wide">Personal Details</h4>
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700">First Name <span className="text-red-500">*</span></label>
                                                <input required type="text" name="firstName" value={formData.firstName || ''} onChange={handleFormChange} className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700">Last Name <span className="text-red-500">*</span></label>
                                                <input required type="text" name="lastName" value={formData.lastName || ''} onChange={handleFormChange} className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700">Email <span className="text-red-500">*</span></label>
                                                <input required type="email" name="email" value={formData.email || ''} onChange={handleFormChange} className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700">Mobile Number <span className="text-red-500">*</span></label>
                                                <input required type="text" name="mobileNumber" value={formData.mobileNumber || ''} onChange={handleFormChange} className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                                            </div>
                                        </div>

                                        {/* Column 2: Professional Info */}
                                        <div className="space-y-4">
                                            <h4 className="font-medium text-indigo-600 text-sm uppercase tracking-wide">Professional Info</h4>
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700">Work Auth Status</label>
                                                <select name="workAuthorizationStatus" value={formData.workAuthorizationStatus || ''} onChange={handleFormChange} className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                                                    <option value="">Select...</option>
                                                    <option value="H1B">H1B</option>
                                                    <option value="US Citizen">US Citizen</option>
                                                    <option value="Green Card">Green Card</option>
                                                    <option value="OPT">OPT</option>
                                                    <option value="CPT">CPT</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700">Skill Set</label>
                                                <input type="text" name="skillSet" placeholder="Java, React, AWS..." value={formData.skillSet || ''} onChange={handleFormChange} className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                                            </div>
                                            <div className="flex gap-2">
                                                <div className="w-1/2">
                                                    <label className="block text-sm font-medium text-slate-700">Total Exp (Yrs)</label>
                                                    <input type="number" name="totalExperience" value={formData.totalExperience || ''} onChange={handleFormChange} className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                                                </div>
                                                <div className="w-1/2">
                                                    <label className="block text-sm font-medium text-slate-700">US Exp (Yrs)</label>
                                                    <input type="number" name="usExperience" value={formData.usExperience || ''} onChange={handleFormChange} className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700">Assigned Recruiter</label>
                                                <select name="workingBy" value={formData.workingBy || ''} onChange={handleFormChange} disabled={!isAdmin} className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm disabled:bg-slate-100">
                                                    <option value="">Unassigned</option>
                                                    {recruiters.map(r => (
                                                        <option key={r.username} value={r.displayName}>{r.displayName}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>

                                        {/* Column 3: Submission Details */}
                                        <div className="space-y-4">
                                            <h4 className="font-medium text-indigo-600 text-sm uppercase tracking-wide">Submission Details</h4>
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700">Applied Role</label>
                                                <input type="text" name="appliedRole" value={formData.appliedRole || ''} onChange={handleFormChange} className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700">Target Company</label>
                                                <input type="text" name="companyName" value={formData.companyName || ''} onChange={handleFormChange} className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                                            </div>
                                            <div className="flex gap-2">
                                                <div className="w-1/2">
                                                    <label className="block text-sm font-medium text-slate-700">C2C Rate</label>
                                                    <input type="text" name="appliedC2CRate" placeholder="$75/hr" value={formData.appliedC2CRate || ''} onChange={handleFormChange} className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                                                </div>
                                                <div className="w-1/2">
                                                    <label className="block text-sm font-medium text-slate-700">Status</label>
                                                    <select name="status" value={formData.status || 'Submitted'} onChange={handleFormChange} className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm font-semibold">
                                                        <option value="Submitted">Submitted</option>
                                                        <option value="In The Review">In The Review</option>
                                                        <option value="In The Interview">In The Interview</option>
                                                        <option value="Selected">Selected</option>
                                                        <option value="Rejected">Rejected</option>
                                                    </select>
                                                </div>
                                            </div>
                                            <div className="bg-slate-50 p-3 rounded border border-slate-200 mt-2">
                                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Company POC</label>
                                                <input type="text" name="pocName" placeholder="POC Name" value={formData.pocName || ''} onChange={handleFormChange} className="mb-2 block w-full border border-slate-300 rounded shadow-sm py-1.5 px-2 text-sm" />
                                                <input type="email" name="pocEmail" placeholder="POC Email" value={formData.pocEmail || ''} onChange={handleFormChange} className="block w-full border border-slate-300 rounded shadow-sm py-1.5 px-2 text-sm" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-slate-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse border-t border-slate-200">
                                    <button type="submit" className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm transition-colors">
                                        Save Candidate
                                    </button>
                                    <button type="button" onClick={() => setIsModalOpen(false)} className="mt-3 w-full inline-flex justify-center rounded-md border border-slate-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm transition-colors">
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* --- DELETE CONFIRMATION MODAL --- */}
            {isDeleteOpen && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                        <div className="fixed inset-0 bg-slate-900 bg-opacity-75 transition-opacity" onClick={() => setIsDeleteOpen(false)}></div>
                        <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>
                        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg w-full">
                            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                                <div className="sm:flex sm:items-start">
                                    <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                                        <DeleteIcon className="h-6 w-6 text-red-600" />
                                    </div>
                                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                                        <h3 className="text-lg leading-6 font-medium text-slate-900">Delete Candidate Record</h3>
                                        <div className="mt-2">
                                            <p className="text-sm text-slate-500">
                                                Are you sure you want to delete the record for <strong>{deletingCandidate?.firstName} {deletingCandidate?.lastName}</strong>? This action cannot be undone.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-slate-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse border-t border-slate-200">
                                <button type="button" onClick={confirmDelete} className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm transition-colors">
                                    Delete
                                </button>
                                <button type="button" onClick={() => setIsDeleteOpen(false)} className="mt-3 w-full inline-flex justify-center rounded-md border border-slate-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm transition-colors">
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default BenchSalesDashboard;