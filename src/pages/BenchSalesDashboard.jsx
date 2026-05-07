import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { usePermissions } from '../hooks/usePermissions';
import { apiService } from '../api/apiService';

// --- Polished Enterprise Icons ---
const SearchIcon = () => (
    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
);
const EditIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
);
const DeleteIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
);
const PlusIcon = () => (
    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
);
const XIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M6 18L18 6M6 6l12 12"></path></svg>
);
const UsersIcon = () => (
    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
);
const BuildingIcon = () => (
    <svg className="w-4 h-4 text-gray-400 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m3-4h1m-1 4h1m-5 8h8"></path></svg>
);

const BenchSalesDashboard = () => {
    const { user } = useAuth();
    const { canEditUsers, canManageBenchSales, canAddPosting } = usePermissions();

    const [candidates, setCandidates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    
    const [recruiters, setRecruiters] = useState([]);

    // Modal States
    const [isSlideOverOpen, setIsSlideOverOpen] = useState(false);
    const [editingCandidate, setEditingCandidate] = useState(null);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [deletingCandidate, setDeletingCandidate] = useState(null);

    // Form State (Now includes an array for submissions)
    const [formData, setFormData] = useState({ submissions: [] });

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
                setRecruiters(response.data.users);
            }
        } catch (error) {
            console.error("Error fetching users for recruiters list:", error);
        }
    };

    const filteredCandidates = useMemo(() => {
        if (!searchTerm) return candidates;
        const lowerSearch = searchTerm.toLowerCase();
        return candidates.filter(c => 
            c.firstName?.toLowerCase().includes(lowerSearch) ||
            c.lastName?.toLowerCase().includes(lowerSearch) ||
            c.email?.toLowerCase().includes(lowerSearch) ||
            c.skillSet?.toLowerCase().includes(lowerSearch) ||
            c.assignedTo?.toLowerCase().includes(lowerSearch)
        );
    }, [candidates, searchTerm]);

    // --- Modal & Form Handlers ---
    const openAddSlideOver = () => {
        setEditingCandidate(null);
        setFormData({
            firstName: '', lastName: '', email: '', mobileNumber: '',
            currentLocation: '', workArrangementDesire: '',
            workAuthorizationStatus: '', totalExperience: '', usExperience: '', skillSet: '',
            assignedTo: user.userName,
            submissions: [] // Initialize empty array for companies
        });
        setIsSlideOverOpen(true);
    };

    const openEditSlideOver = (candidate) => {
        setEditingCandidate(candidate);
        // Ensure submissions is always an array
        setFormData({ ...candidate, submissions: candidate.submissions || [] });
        setIsSlideOverOpen(true);
    };

    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // --- Submissions (Nested Array) Handlers ---
    const addSubmission = () => {
        setFormData(prev => ({
            ...prev,
            submissions: [
                ...prev.submissions,
                { id: crypto.randomUUID(), companyName: '', appliedRole: '', c2cRate: '', status: 'Submitted', pocName: '', pocEmail: '', pocMobile: '' }
            ]
        }));
    };

    const updateSubmission = (id, field, value) => {
        setFormData(prev => ({
            ...prev,
            submissions: prev.submissions.map(sub => sub.id === id ? { ...sub, [field]: value } : sub)
        }));
    };

    const removeSubmission = (id) => {
        setFormData(prev => ({
            ...prev,
            submissions: prev.submissions.filter(sub => sub.id !== id)
        }));
    };

    // --- API Calls ---
    const handleSave = async (e) => {
        e.preventDefault();
        try {
            if (editingCandidate) {
                await apiService.updateBenchCandidate(editingCandidate.rowKey, formData, user.userIdentifier);
            } else {
                await apiService.addBenchCandidate({ candidateData: formData, authenticatedUsername: user.userIdentifier });
            }
            setIsSlideOverOpen(false);
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

    // --- Permissions & Styling ---
    const isAdmin = canEditUsers || canManageBenchSales;
    const canEditRow = (candidate) => isAdmin || candidate.submittedBy === user.userIdentifier || candidate.assignedTo === user.userName;
    const canDeleteRow = (candidate) => isAdmin || candidate.submittedBy === user.userIdentifier;

    const getStatusStyle = (status) => {
        switch(status?.toLowerCase()) {
            case 'submitted': return 'bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-600/20';
            case 'in the review': return 'bg-yellow-50 text-yellow-700 ring-1 ring-inset ring-yellow-600/20';
            case 'in the interview': return 'bg-purple-50 text-purple-700 ring-1 ring-inset ring-purple-600/20';
            case 'selected': return 'bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20';
            case 'rejected': return 'bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/10';
            default: return 'bg-gray-50 text-gray-600 ring-1 ring-inset ring-gray-500/10';
        }
    };

    const getAvatarInitials = (firstName, lastName) => `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();

    return (
        <div className="min-h-screen bg-gray-50 font-sans">
            <div className="max-w-[90rem] mx-auto px-4 sm:px-6 lg:px-8 py-8">
                
                {/* Header Area */}
                <div className="sm:flex sm:items-center sm:justify-between mb-8">
                    <div>
                        <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">Bench Candidates</h1>
                        <p className="mt-1.5 text-sm text-gray-500">
                            Manage W2 candidates and track their multi-company application pipeline.
                        </p>
                    </div>
                    
                    <div className="mt-4 sm:mt-0 sm:flex-none flex flex-col sm:flex-row gap-3">
                        <div className="relative rounded-md shadow-sm">
                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3"><SearchIcon /></div>
                            <input type="text" placeholder="Search candidates..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="block w-full sm:w-72 rounded-md border-0 py-2 pl-10 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 transition-all"/>
                        </div>
                        <button onClick={openAddSlideOver} className="inline-flex items-center justify-center rounded-md bg-indigo-600 px-3.5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 transition-all">
                            <PlusIcon /> Add Candidate
                        </button>
                    </div>
                </div>

                {/* Main Table Card */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50/50">
                                <tr>
                                    <th scope="col" className="py-3.5 pl-6 pr-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Candidate</th>
                                    <th scope="col" className="px-3 py-3.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Location & Auth</th>
                                    <th scope="col" className="px-3 py-3.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Skill Set</th>
                                    <th scope="col" className="px-3 py-3.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Assigned To</th>
                                    <th scope="col" className="px-3 py-3.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Pipeline</th>
                                    <th scope="col" className="relative py-3.5 pl-3 pr-6 text-right text-xs font-medium text-gray-500 uppercase tracking-wide">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 bg-white">
                                {loading ? (
                                    <tr><td colSpan="6" className="py-12 text-center"><div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-solid border-indigo-600 border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div></td></tr>
                                ) : filteredCandidates.length === 0 ? (
                                    <tr><td colSpan="6" className="py-16 text-center"><UsersIcon className="mx-auto" /><h3 className="mt-4 text-sm font-semibold text-gray-900">No candidates found</h3></td></tr>
                                ) : (
                                    filteredCandidates.map((candidate) => (
                                        <tr key={candidate.rowKey} className="hover:bg-gray-50/50 transition-colors group">
                                            <td className="whitespace-nowrap py-4 pl-6 pr-3">
                                                <div className="flex items-center">
                                                    <div className="h-10 w-10 flex-shrink-0 rounded-full bg-indigo-50 flex items-center justify-center border border-indigo-100">
                                                        <span className="text-sm font-medium text-indigo-600">{getAvatarInitials(candidate.firstName, candidate.lastName)}</span>
                                                    </div>
                                                    <div className="ml-4">
                                                        <div className="font-medium text-gray-900">{candidate.firstName} {candidate.lastName}</div>
                                                        <div className="text-gray-500 text-sm mt-0.5">{candidate.email}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="whitespace-nowrap px-3 py-4">
                                                <div className="text-sm text-gray-900">{candidate.currentLocation || 'N/A'}</div>
                                                <div className="text-xs text-gray-500 mt-1 flex gap-2">
                                                    <span>{candidate.workAuthorizationStatus || 'No Auth'}</span>
                                                    <span>•</span>
                                                    <span>{candidate.workArrangementDesire || 'Any'}</span>
                                                </div>
                                            </td>
                                            <td className="whitespace-nowrap px-3 py-4">
                                                <div className="text-sm text-gray-900 truncate max-w-[200px]" title={candidate.skillSet}>{candidate.skillSet || 'Not Specified'}</div>
                                                <div className="text-xs text-gray-500 mt-1">Exp: {candidate.totalExperience || '0'}y (US: {candidate.usExperience || '0'}y)</div>
                                            </td>
                                            <td className="whitespace-nowrap px-3 py-4">
                                                {candidate.assignedTo ? (
                                                    <div className="flex items-center gap-2">
                                                        <div className="h-6 w-6 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-medium text-gray-600 border border-gray-200">{candidate.assignedTo.charAt(0).toUpperCase()}</div>
                                                        <span className="text-sm text-gray-700">{candidate.assignedTo}</span>
                                                    </div>
                                                ) : <span className="inline-flex items-center rounded-md bg-gray-50 px-2 py-1 text-xs font-medium text-gray-500 ring-1 ring-inset ring-gray-500/10">Unassigned</span>}
                                            </td>
                                            <td className="whitespace-nowrap px-3 py-4">
                                                <div className="flex items-center text-sm text-gray-700">
                                                    <BuildingIcon />
                                                    <span className="font-medium">{candidate.submissions?.length || 0}</span>&nbsp;Applications
                                                </div>
                                            </td>
                                            <td className="whitespace-nowrap py-4 pl-3 pr-6 text-right text-sm font-medium">
                                                <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    {canEditRow(candidate) && (
                                                        <button onClick={() => openEditSlideOver(candidate)} className="text-gray-400 hover:text-indigo-600 p-1.5 rounded-md hover:bg-indigo-50 transition-colors" title="Edit Pipeline"><EditIcon /></button>
                                                    )}
                                                    {canDeleteRow(candidate) && (
                                                        <button onClick={() => { setDeletingCandidate(candidate); setIsDeleteOpen(true); }} className="text-gray-400 hover:text-red-600 p-1.5 rounded-md hover:bg-red-50 transition-colors" title="Delete"><DeleteIcon /></button>
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
            </div>

            {/* --- SLIDE-OVER (DRAWER) FOR ADD/EDIT & SUBMISSIONS --- */}
            {isSlideOverOpen && (
                <div className="relative z-50">
                    <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm transition-opacity" onClick={() => setIsSlideOverOpen(false)}></div>
                    <div className="fixed inset-0 overflow-hidden">
                        <div className="absolute inset-0 overflow-hidden">
                            <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10 sm:pl-16">
                                {/* Increased width to max-w-3xl to accommodate the nested table comfortably */}
                                <div className="pointer-events-auto w-screen max-w-3xl transform transition-transform ease-in-out duration-300">
                                    <form onSubmit={handleSave} className="flex h-full flex-col divide-y divide-gray-200 bg-white shadow-2xl">
                                        
                                        {/* Slide-over Header */}
                                        <div className="bg-gray-50 px-6 py-6 sm:px-8 flex-shrink-0">
                                            <div className="flex items-center justify-between">
                                                <h2 className="text-xl font-semibold leading-6 text-gray-900">
                                                    {editingCandidate ? 'Candidate Profile & Pipeline' : 'New Candidate'}
                                                </h2>
                                                <button type="button" className="text-gray-400 hover:text-gray-500" onClick={() => setIsSlideOverOpen(false)}><XIcon /></button>
                                            </div>
                                        </div>

                                        {/* Slide-over Body */}
                                        <div className="h-0 flex-1 overflow-y-auto px-6 py-8 sm:px-8">
                                            <div className="flex flex-col gap-y-10">
                                                
                                                {/* Candidate Personal & Professional Info */}
                                                <div>
                                                    <h3 className="text-sm font-semibold text-gray-900 border-b border-gray-200 pb-2 mb-4 uppercase tracking-wider text-indigo-600">Candidate Details</h3>
                                                    <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
                                                        <div><label className="block text-sm font-medium text-gray-900">First Name *</label><input required type="text" name="firstName" value={formData.firstName || ''} onChange={handleFormChange} className="mt-1.5 block w-full rounded-md border-0 py-2 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm" /></div>
                                                        <div><label className="block text-sm font-medium text-gray-900">Last Name *</label><input required type="text" name="lastName" value={formData.lastName || ''} onChange={handleFormChange} className="mt-1.5 block w-full rounded-md border-0 py-2 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm" /></div>
                                                        <div><label className="block text-sm font-medium text-gray-900">Email *</label><input required type="email" name="email" value={formData.email || ''} onChange={handleFormChange} className="mt-1.5 block w-full rounded-md border-0 py-2 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm" /></div>
                                                        <div><label className="block text-sm font-medium text-gray-900">Mobile</label><input type="text" name="mobileNumber" value={formData.mobileNumber || ''} onChange={handleFormChange} className="mt-1.5 block w-full rounded-md border-0 py-2 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm" /></div>
                                                        <div><label className="block text-sm font-medium text-gray-900">Current Location</label><input type="text" name="currentLocation" value={formData.currentLocation || ''} onChange={handleFormChange} className="mt-1.5 block w-full rounded-md border-0 py-2 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm" /></div>
                                                        <div>
                                                            <label className="block text-sm font-medium text-gray-900">Work Arrangement Desire</label>
                                                            <select name="workArrangementDesire" value={formData.workArrangementDesire || ''} onChange={handleFormChange} className="mt-1.5 block w-full rounded-md border-0 py-2.5 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm">
                                                                <option value="">Select...</option>
                                                                <option value="Remote">Remote</option>
                                                                <option value="Hybrid">Hybrid</option>
                                                                <option value="On-site">On-site</option>
                                                            </select>
                                                        </div>
                                                        <div>
                                                            <label className="block text-sm font-medium text-gray-900">Work Auth Status</label>
                                                            <select name="workAuthorizationStatus" value={formData.workAuthorizationStatus || ''} onChange={handleFormChange} className="mt-1.5 block w-full rounded-md border-0 py-2.5 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm">
                                                                <option value="">Select...</option>
                                                                <option value="H1B">H1B</option><option value="US Citizen">US Citizen</option><option value="Green Card">Green Card</option><option value="OPT">OPT</option><option value="CPT">CPT</option>
                                                            </select>
                                                        </div>
                                                        <div>
                                                            <label className="block text-sm font-medium text-gray-900">Assigned Recruiter</label>
                                                            <select name="assignedTo" value={formData.assignedTo || ''} onChange={handleFormChange} disabled={!isAdmin} className="mt-1.5 block w-full rounded-md border-0 py-2.5 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-indigo-600 disabled:bg-gray-50 sm:text-sm">
                                                                <option value="">Unassigned</option>
                                                                {recruiters.map(r => <option key={r.username} value={r.displayName}>{r.displayName}</option>)}
                                                            </select>
                                                        </div>
                                                        <div className="sm:col-span-2"><label className="block text-sm font-medium text-gray-900">Skill Set</label><input type="text" name="skillSet" placeholder="Java, React, AWS..." value={formData.skillSet || ''} onChange={handleFormChange} className="mt-1.5 block w-full rounded-md border-0 py-2 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm" /></div>
                                                        <div><label className="block text-sm font-medium text-gray-900">Total Exp (Yrs)</label><input type="number" name="totalExperience" value={formData.totalExperience || ''} onChange={handleFormChange} className="mt-1.5 block w-full rounded-md border-0 py-2 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm" /></div>
                                                        <div><label className="block text-sm font-medium text-gray-900">US Exp (Yrs)</label><input type="number" name="usExperience" value={formData.usExperience || ''} onChange={handleFormChange} className="mt-1.5 block w-full rounded-md border-0 py-2 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm" /></div>
                                                    </div>
                                                </div>

                                                {/* --- THE SUBMISSIONS / APPLICATION PIPELINE PIPELINE SECTION --- */}
                                                <div>
                                                    <div className="flex items-center justify-between border-b border-gray-200 pb-2 mb-4">
                                                        <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider text-indigo-600">Application Pipeline</h3>
                                                        <button type="button" onClick={addSubmission} className="inline-flex items-center text-xs font-semibold text-indigo-600 hover:text-indigo-500 bg-indigo-50 px-2.5 py-1.5 rounded-md transition-colors">
                                                            + Add Company
                                                        </button>
                                                    </div>

                                                    {formData.submissions?.length === 0 ? (
                                                        <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                                                            <p className="text-sm text-gray-500">No companies applied to yet.</p>
                                                            <button type="button" onClick={addSubmission} className="mt-2 text-sm font-medium text-indigo-600 hover:text-indigo-500">Start adding submissions</button>
                                                        </div>
                                                    ) : (
                                                        <div className="space-y-6">
                                                            {formData.submissions.map((sub, index) => (
                                                                <div key={sub.id} className="bg-gray-50 p-4 rounded-lg border border-gray-200 relative group">
                                                                    <button type="button" onClick={() => removeSubmission(sub.id)} className="absolute top-3 right-3 text-gray-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity" title="Remove Submission">
                                                                        <XIcon />
                                                                    </button>
                                                                    
                                                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                                                        {/* Core Submission Info */}
                                                                        <div>
                                                                            <label className="block text-xs font-medium text-gray-700">Company Name</label>
                                                                            <input type="text" value={sub.companyName} onChange={(e) => updateSubmission(sub.id, 'companyName', e.target.value)} className="mt-1 block w-full rounded border-gray-300 py-1.5 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500" placeholder="e.g. Google" />
                                                                        </div>
                                                                        <div>
                                                                            <label className="block text-xs font-medium text-gray-700">Applied Role</label>
                                                                            <input type="text" value={sub.appliedRole} onChange={(e) => updateSubmission(sub.id, 'appliedRole', e.target.value)} className="mt-1 block w-full rounded border-gray-300 py-1.5 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500" placeholder="Sr. Developer" />
                                                                        </div>
                                                                        <div>
                                                                            <label className="block text-xs font-medium text-gray-700">Status</label>
                                                                            <select value={sub.status} onChange={(e) => updateSubmission(sub.id, 'status', e.target.value)} className="mt-1 block w-full rounded border-gray-300 py-1.5 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500 bg-white">
                                                                                <option value="Submitted">Submitted</option>
                                                                                <option value="In The Review">In The Review</option>
                                                                                <option value="In The Interview">In The Interview</option>
                                                                                <option value="Selected">Selected</option>
                                                                                <option value="Rejected">Rejected</option>
                                                                            </select>
                                                                        </div>

                                                                        {/* Extended Details */}
                                                                        <div>
                                                                            <label className="block text-xs font-medium text-gray-700">C2C Rate</label>
                                                                            <input type="text" value={sub.c2cRate} onChange={(e) => updateSubmission(sub.id, 'c2cRate', e.target.value)} className="mt-1 block w-full rounded border-gray-300 py-1.5 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500" placeholder="$80/hr" />
                                                                        </div>
                                                                        <div className="sm:col-span-2">
                                                                            <label className="block text-xs font-medium text-gray-700">POC Details (Name / Email / Phone)</label>
                                                                            <div className="mt-1 flex gap-2">
                                                                                <input type="text" value={sub.pocName} onChange={(e) => updateSubmission(sub.id, 'pocName', e.target.value)} className="block w-1/3 rounded border-gray-300 py-1.5 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500" placeholder="Name" />
                                                                                <input type="email" value={sub.pocEmail} onChange={(e) => updateSubmission(sub.id, 'pocEmail', e.target.value)} className="block w-1/3 rounded border-gray-300 py-1.5 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500" placeholder="Email" />
                                                                                <input type="text" value={sub.pocMobile} onChange={(e) => updateSubmission(sub.id, 'pocMobile', e.target.value)} className="block w-1/3 rounded border-gray-300 py-1.5 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500" placeholder="Phone" />
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>

                                            </div>
                                        </div>

                                        {/* Slide-over Footer */}
                                        <div className="flex flex-shrink-0 justify-end px-6 py-4 border-t border-gray-200 bg-gray-50">
                                            <button type="button" className="rounded-md bg-white px-3.5 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50" onClick={() => setIsSlideOverOpen(false)}>Cancel</button>
                                            <button type="submit" className="ml-4 inline-flex justify-center rounded-md bg-indigo-600 px-3.5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500">Save Candidate & Pipeline</button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BenchSalesDashboard;