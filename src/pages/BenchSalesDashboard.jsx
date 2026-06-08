import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { usePermissions } from '../hooks/usePermissions';
import { apiService } from '../api/apiService';

// --- Polished Enterprise Icons (Scaled to elegant sizes) ---
const Icons = {
    Search: () => <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>,
    Edit: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>,
    Delete: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>,
    Plus: () => <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4"></path></svg>,
    X: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>,
    Users: () => <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>,
    Building: () => <svg className="w-4 h-4 text-slate-400 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m3-4h1m-1 4h1m-5 8h8"></path></svg>,
    Briefcase: () => <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>,
    TrendingUp: () => <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg>,
    CheckCircle: () => <svg className="w-6 h-6 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>,
    List: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 10h16M4 14h16M4 18h16"></path></svg>,
    Grid: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path></svg>
};

const BenchSalesDashboard = () => {
    const { user } = useAuth();
    const { canEditUsers, canManageBenchSales } = usePermissions();

    const [candidates, setCandidates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [viewMode, setViewMode] = useState('list');
    
    const [recruiters, setRecruiters] = useState([]);

    const [isSlideOverOpen, setIsSlideOverOpen] = useState(false);
    const [editingCandidate, setEditingCandidate] = useState(null);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [deletingCandidate, setDeletingCandidate] = useState(null);
    const [formData, setFormData] = useState({ submissions: [] });

    const [toast, setToast] = useState(null);
    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 4000);
    };

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
            showToast("Error fetching candidates", "error");
        } finally {
            setLoading(false);
        }
    };

    const fetchRecruiters = async () => {
        try {
            const response = await apiService.getUsers(user.userIdentifier);
            if (response.data.success) setRecruiters(response.data.users);
        } catch (error) {}
    };

    const stats = useMemo(() => {
        let totalSubs = 0, interviews = 0, selected = 0;
        candidates.forEach(c => {
            if (c.submissions) {
                totalSubs += c.submissions.length;
                c.submissions.forEach(sub => {
                    if (sub.status === 'In The Interview') interviews++;
                    if (sub.status === 'Selected') selected++;
                });
            }
        });
        return { totalCandidates: candidates.length, totalSubs, interviews, selected };
    }, [candidates]);

    const filteredCandidates = useMemo(() => {
        if (!searchTerm) return candidates;
        const lower = searchTerm.toLowerCase();
        return candidates.filter(c => 
            c.firstName?.toLowerCase().includes(lower) || c.lastName?.toLowerCase().includes(lower) ||
            c.email?.toLowerCase().includes(lower) || c.skillSet?.toLowerCase().includes(lower) ||
            c.assignedTo?.toLowerCase().includes(lower) || c.currentLocation?.toLowerCase().includes(lower)
        );
    }, [candidates, searchTerm]);

    const openAddSlideOver = () => {
        setEditingCandidate(null);
        setFormData({
            firstName: '', lastName: '', email: '', mobileNumber: '', currentLocation: '', workArrangementDesire: '',
            workAuthorizationStatus: '', totalExperience: '', usExperience: '', skillSet: '', assignedTo: user.userName, submissions: [] 
        });
        setIsSlideOverOpen(true);
    };

    const openEditSlideOver = (candidate) => {
        setEditingCandidate(candidate);
        setFormData({ ...candidate, submissions: candidate.submissions || [] });
        setIsSlideOverOpen(true);
    };

    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const addSubmission = () => {
        setFormData(prev => ({
            ...prev,
            submissions: [{ id: crypto.randomUUID(), companyName: '', appliedRole: '', c2cRate: '', status: 'Submitted', pocName: '', pocEmail: '', pocMobile: '' }, ...prev.submissions]
        }));
    };

    const updateSubmission = (id, field, value) => {
        setFormData(prev => ({
            ...prev,
            submissions: prev.submissions.map(sub => sub.id === id ? { ...sub, [field]: value } : sub)
        }));
    };

    const removeSubmission = (id) => {
        setFormData(prev => ({ ...prev, submissions: prev.submissions.filter(sub => sub.id !== id) }));
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            if (editingCandidate) {
                await apiService.updateBenchCandidate(editingCandidate.rowKey, formData, user.userIdentifier);
                showToast("Candidate updated successfully!");
            } else {
                await apiService.addBenchCandidate(formData, user.userIdentifier);
                showToast("New candidate added successfully!");
            }
            setIsSlideOverOpen(false);
            fetchCandidates();
        } catch (error) {
            showToast(error.response?.data?.message || "An error occurred while saving.", "error");
        }
    };

    const confirmDelete = async () => {
        try {
            await apiService.deleteBenchCandidate(deletingCandidate.rowKey, user.userIdentifier);
            showToast("Candidate removed successfully.");
            setIsDeleteOpen(false);
            fetchCandidates();
        } catch (error) {
            showToast(error.response?.data?.message || "An error occurred while deleting.", "error");
        }
    };

    const isAdmin = canEditUsers || canManageBenchSales;
    const canEditRow = (c) => isAdmin || c.submittedBy === user.userIdentifier || c.assignedTo === user.userName;
    const canDeleteRow = (c) => isAdmin || c.submittedBy === user.userIdentifier;
    const getAvatarInitials = (f, l) => `${f?.charAt(0) || ''}${l?.charAt(0) || ''}`.toUpperCase();

    const StatCard = ({ title, value, icon: Icon, colorClass }) => (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 flex items-center gap-4">
            <div className={`p-3 rounded-lg ${colorClass}`}><Icon /></div>
            <div>
                <p className="text-sm font-semibold text-slate-500">{title}</p>
                <h4 className="text-2xl font-bold text-slate-900 mt-0.5">{value}</h4>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 pb-10 relative" style={{ fontFamily: '"Inter", system-ui, sans-serif' }}>
            
            {/* Global Toast */}
            {toast && (
                <div className={`fixed top-6 left-1/2 -translate-x-1/2 z- px-5 py-3 rounded-lg shadow-xl font-semibold text-sm flex items-center gap-2.5 animate-fade-in-down ${toast.type === 'error' ? 'bg-red-600 text-white' : 'bg-slate-900 text-white'}`}>
                    {toast.type === 'error' ? <Icons.X /> : <Icons.CheckCircle />} {toast.message}
                </div>
            )}

            <div className="max-w-[90rem] mx-auto px-4 sm:px-6 lg:px-8 py-8">
                
                {/* Header & Stats */}
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Bench Sales Hub</h1>
                    <p className="mt-1.5 text-sm text-slate-600 font-medium">Accelerate placements and track outbound marketing pipelines seamlessly.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
                    <StatCard title="Total Candidates" value={stats.totalCandidates} icon={Icons.Users} colorClass="bg-blue-100" />
                    <StatCard title="Applications Sent" value={stats.totalSubs} icon={Icons.Briefcase} colorClass="bg-indigo-100" />
                    <StatCard title="Interviews Scheduled" value={stats.interviews} icon={Icons.TrendingUp} colorClass="bg-emerald-100" />
                    <StatCard title="Selected / Offers" value={stats.selected} icon={Icons.CheckCircle} colorClass="bg-teal-100" />
                </div>

                {/* Toolbars */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5 bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                    <div className="relative w-full md:w-[24rem]">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5"><Icons.Search /></div>
                        <input type="text" placeholder="Search by name, skills, or recruiter..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="block w-full rounded-lg border-slate-300 py-2.5 pl-10 text-sm font-medium text-slate-900 placeholder-slate-400 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-all shadow-inner" />
                    </div>
                    
                    <div className="flex items-center gap-3">
                        <div className="bg-slate-100 p-1 rounded-lg flex items-center">
                            <button onClick={() => setViewMode('list')} className={`p-2 rounded-md transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-800'}`}><Icons.List /></button>
                            <button onClick={() => setViewMode('grid')} className={`p-2 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-800'}`}><Icons.Grid /></button>
                        </div>
                        <button onClick={openAddSlideOver} className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition-all">
                            <Icons.Plus /> New Candidate
                        </button>
                    </div>
                </div>

                {/* --- MAIN DATA VIEW --- */}
                {viewMode === 'list' ? (
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-slate-200">
                                <thead className="bg-slate-50">
                                    <tr>
                                        <th className="py-4 pl-6 pr-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Candidate Profile</th>
                                        <th className="px-4 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Auth & Logistics</th>
                                        <th className="px-4 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Expertise</th>
                                        <th className="px-4 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Assigned Recruiter</th>
                                        <th className="px-4 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Pipeline Health</th>
                                        <th className="py-4 pl-3 pr-6 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 bg-white">
                                    {loading ? (
                                        <tr><td colSpan="6" className="py-16 text-center text-sm font-medium text-slate-500">Loading candidates...</td></tr>
                                    ) : filteredCandidates.length === 0 ? (
                                        <tr><td colSpan="6" className="py-16 text-center">
                                            <div className="bg-slate-100 h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-3"><Icons.Users /></div>
                                            <h3 className="text-base font-bold text-slate-900">No candidates found</h3>
                                            <p className="text-sm text-slate-600 mt-1">Adjust your search or add a new candidate.</p>
                                        </td></tr>
                                    ) : (
                                        filteredCandidates.map((c) => (
                                            <tr key={c.rowKey} className="hover:bg-slate-50 transition-colors group">
                                                <td className="whitespace-nowrap py-4 pl-6 pr-3">
                                                    <div className="flex items-center">
                                                        <div className="h-10 w-10 flex-shrink-0 rounded-full bg-blue-100 flex items-center justify-center border border-blue-200">
                                                            <span className="text-sm font-bold text-blue-700">{getAvatarInitials(c.firstName, c.lastName)}</span>
                                                        </div>
                                                        <div className="ml-4">
                                                            <div className="text-sm font-bold text-slate-900">{c.firstName} {c.lastName}</div>
                                                            <div className="text-slate-500 text-xs font-medium mt-0.5">{c.email}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="whitespace-nowrap px-4 py-4">
                                                    <div className="flex flex-wrap gap-2 mb-1.5">
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                                                            {c.workAuthorizationStatus || 'No Auth'}
                                                        </span>
                                                        {c.workArrangementDesire && (
                                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100">
                                                                {c.workArrangementDesire}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="text-sm font-medium text-slate-600 flex items-center">
                                                        <Icons.Building /> 
                                                        <span>{c.currentLocation || 'Location Not Specified'}</span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4 max-w-[220px]">
                                                    <div className="text-sm font-semibold text-slate-900 truncate" title={c.skillSet}>{c.skillSet || 'Not Specified'}</div>
                                                    <div className="text-xs font-medium text-slate-500 mt-1">{c.totalExperience ? `${c.totalExperience} yrs exp` : 'Entry Level'}</div>
                                                </td>
                                                <td className="whitespace-nowrap px-4 py-4">
                                                    {c.assignedTo ? (
                                                        <div className="flex items-center gap-2.5">
                                                            <div className="h-7 w-7 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-700">{c.assignedTo.charAt(0).toUpperCase()}</div>
                                                            <span className="text-sm font-semibold text-slate-800">{c.assignedTo}</span>
                                                        </div>
                                                    ) : <span className="text-xs font-semibold text-slate-400 italic">Unassigned</span>}
                                                </td>
                                                <td className="whitespace-nowrap px-4 py-4">
                                                    <div className="flex items-center">
                                                        <span className="text-sm font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">
                                                            {c.submissions?.length || 0} Applications
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="whitespace-nowrap py-4 pl-3 pr-6 text-right">
                                                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button onClick={() => openEditSlideOver(c)} className="text-slate-500 hover:text-blue-600 bg-white shadow-sm border border-slate-200 hover:border-blue-300 p-1.5 rounded-lg transition-all"><Icons.Edit /></button>
                                                        {canDeleteRow(c) && <button onClick={() => { setDeletingCandidate(c); setIsDeleteOpen(true); }} className="text-slate-500 hover:text-red-600 bg-white shadow-sm border border-slate-200 hover:border-red-300 p-1.5 rounded-lg transition-all"><Icons.Delete /></button>}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : (
                    /* --- KANBAN / GRID VIEW --- */
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {loading ? <div className="text-center w-full col-span-full py-16 text-sm font-medium text-slate-500">Loading Grid...</div> : 
                         filteredCandidates.map(c => (
                            <div key={c.rowKey} className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 flex flex-col hover:shadow-md transition-all relative group">
                                <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => openEditSlideOver(c)} className="text-slate-400 hover:text-blue-600 p-1.5 bg-slate-50 hover:bg-slate-100 rounded-md"><Icons.Edit /></button>
                                </div>
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center text-lg font-bold text-blue-700">{getAvatarInitials(c.firstName, c.lastName)}</div>
                                    <div>
                                        <h3 className="text-base font-bold text-slate-900 leading-tight">{c.firstName} {c.lastName}</h3>
                                        <div className="flex flex-wrap items-center gap-1.5 mt-1">
                                            <p className="text-[11px] font-semibold bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded border border-slate-200">{c.workAuthorizationStatus || 'No Auth'}</p>
                                            {c.workArrangementDesire && <p className="text-[11px] font-semibold bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded border border-blue-100">{c.workArrangementDesire}</p>}
                                        </div>
                                    </div>
                                </div>
                                <div className="mb-4 flex-1">
                                    <p className="text-sm font-semibold text-slate-700 line-clamp-2" title={c.skillSet}>{c.skillSet || 'Skills not listed'}</p>
                                    <p className="text-xs font-medium text-slate-500 mt-1.5 flex items-center"><Icons.Building />{c.currentLocation || 'Location Not Specified'}</p>
                                </div>
                                <div className="flex items-center justify-between border-t border-slate-100 pt-4 mt-auto">
                                    <div className="flex items-center gap-1.5 text-sm font-bold text-slate-700">
                                        <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                        {c.submissions?.length || 0} Apps
                                    </div>
                                    <div className="text-xs font-bold px-2 py-1 rounded-md bg-slate-100 text-slate-600 border border-slate-200">
                                        {c.assignedTo?.split(' ') || 'Unassigned'}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* --- ULTRA MODERN SLIDE-OVER DRAWER --- */}
            {isSlideOverOpen && (
                <div className="relative z-" style={{ fontFamily: '"Inter", system-ui, sans-serif' }}>
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={() => setIsSlideOverOpen(false)}></div>
                    <div className="fixed inset-0 overflow-hidden">
                        <div className="absolute inset-0 overflow-hidden">
                            <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
                                <div className="pointer-events-auto w-screen max-w-3xl transform transition-transform shadow-2xl bg-white flex flex-col">
                                    
                                    {/* Drawer Header */}
                                    <div className="sticky top-0 z-10 bg-white px-6 py-5 border-b border-slate-200 flex items-center justify-between shadow-sm">
                                        <div>
                                            <h2 className="text-xl font-bold text-slate-900">{editingCandidate ? 'Edit Candidate Profile' : 'New Candidate Profile'}</h2>
                                            <p className="text-sm font-medium text-slate-500 mt-0.5">Ensure all details and pipeline tracking are up-to-date.</p>
                                        </div>
                                        <button type="button" onClick={() => setIsSlideOverOpen(false)} className="rounded-lg p-2 bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-800 transition-colors">
                                            <Icons.X />
                                        </button>
                                    </div>

                                    {/* Drawer Body */}
                                    <div className="flex-1 overflow-y-auto px-6 py-6 custom-scrollbar bg-slate-50/50">
                                        <form id="candidate-form" onSubmit={handleSave} className="space-y-8">
                                            
                                            {/* Section 1: Demographics */}
                                            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                                                <div className="flex items-center gap-2 mb-5 border-b border-slate-100 pb-3">
                                                    <div className="h-8 w-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center"><Icons.Users /></div>
                                                    <h3 className="text-lg font-bold text-slate-900">Personal Information</h3>
                                                </div>
                                                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                                                    <div><label className="block text-sm font-semibold text-slate-700 mb-1.5">First Name *</label><input required type="text" name="firstName" value={formData.firstName} onChange={handleFormChange} className="block w-full rounded-lg border-slate-300 py-2.5 px-3 text-sm font-medium text-slate-900 shadow-sm focus:border-blue-600 focus:ring-blue-600" /></div>
                                                    <div><label className="block text-sm font-semibold text-slate-700 mb-1.5">Last Name *</label><input required type="text" name="lastName" value={formData.lastName} onChange={handleFormChange} className="block w-full rounded-lg border-slate-300 py-2.5 px-3 text-sm font-medium text-slate-900 shadow-sm focus:border-blue-600 focus:ring-blue-600" /></div>
                                                    <div className="sm:col-span-2"><label className="block text-sm font-semibold text-slate-700 mb-1.5">Email Address *</label><input required type="email" name="email" value={formData.email} onChange={handleFormChange} className="block w-full rounded-lg border-slate-300 py-2.5 px-3 text-sm font-medium text-slate-900 shadow-sm focus:border-blue-600 focus:ring-blue-600" /></div>
                                                    <div><label className="block text-sm font-semibold text-slate-700 mb-1.5">Mobile Number</label><input type="text" name="mobileNumber" value={formData.mobileNumber} onChange={handleFormChange} className="block w-full rounded-lg border-slate-300 py-2.5 px-3 text-sm font-medium text-slate-900 shadow-sm focus:border-blue-600 focus:ring-blue-600" /></div>
                                                    <div><label className="block text-sm font-semibold text-slate-700 mb-1.5">Current Location</label><input type="text" name="currentLocation" value={formData.currentLocation} onChange={handleFormChange} className="block w-full rounded-lg border-slate-300 py-2.5 px-3 text-sm font-medium text-slate-900 shadow-sm focus:border-blue-600 focus:ring-blue-600" /></div>
                                                </div>
                                            </div>

                                            {/* Section 2: Professional Details */}
                                            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                                                <div className="flex items-center gap-2 mb-5 border-b border-slate-100 pb-3">
                                                    <div className="h-8 w-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center"><Icons.Briefcase /></div>
                                                    <h3 className="text-lg font-bold text-slate-900">Professional Details</h3>
                                                </div>
                                                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                                                    <div className="sm:col-span-2"><label className="block text-sm font-semibold text-slate-700 mb-1.5">Core Skill Set</label><input type="text" name="skillSet" placeholder="e.g. React, Node.js, AWS" value={formData.skillSet} onChange={handleFormChange} className="block w-full rounded-lg border-slate-300 py-2.5 px-3 text-sm font-medium text-slate-900 shadow-sm focus:border-blue-600 focus:ring-blue-600" /></div>
                                                    <div>
                                                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Work Arrangement Desire</label>
                                                        <select name="workArrangementDesire" value={formData.workArrangementDesire} onChange={handleFormChange} className="block w-full rounded-lg border-slate-300 py-2.5 px-3 text-sm font-medium text-slate-900 shadow-sm focus:border-blue-600 focus:ring-blue-600 bg-white">
                                                            <option value="">Select...</option>
                                                            <option value="Remote">Remote</option>
                                                            <option value="Hybrid">Hybrid</option>
                                                            <option value="On-site">On-site</option>
                                                        </select>
                                                    </div>
                                                    <div><label className="block text-sm font-semibold text-slate-700 mb-1.5">Work Auth Status</label><select name="workAuthorizationStatus" value={formData.workAuthorizationStatus} onChange={handleFormChange} className="block w-full rounded-lg border-slate-300 py-2.5 px-3 text-sm font-medium text-slate-900 shadow-sm focus:border-blue-600 focus:ring-blue-600 bg-white"><option value="">Select...</option><option value="H1B">H1B</option><option value="US Citizen">US Citizen</option><option value="Green Card">Green Card</option><option value="OPT">OPT</option><option value="CPT">CPT</option></select></div>
                                                    <div><label className="block text-sm font-semibold text-slate-700 mb-1.5">Assigned Recruiter</label><select name="assignedTo" value={formData.assignedTo} onChange={handleFormChange} disabled={!isAdmin} className="block w-full rounded-lg border-slate-300 py-2.5 px-3 text-sm font-medium text-slate-900 shadow-sm focus:border-blue-600 focus:ring-blue-600 disabled:bg-slate-100 disabled:text-slate-500 bg-white"><option value="">Unassigned</option>{recruiters.map(r => <option key={r.username} value={r.displayName}>{r.displayName}</option>)}</select></div>
                                                    <div><label className="block text-sm font-semibold text-slate-700 mb-1.5">Total Experience (Yrs)</label><input type="number" name="totalExperience" value={formData.totalExperience} onChange={handleFormChange} className="block w-full rounded-lg border-slate-300 py-2.5 px-3 text-sm font-medium text-slate-900 shadow-sm focus:border-blue-600 focus:ring-blue-600" /></div>
                                                    <div><label className="block text-sm font-semibold text-slate-700 mb-1.5">US Experience (Yrs)</label><input type="number" name="usExperience" value={formData.usExperience} onChange={handleFormChange} className="block w-full rounded-lg border-slate-300 py-2.5 px-3 text-sm font-medium text-slate-900 shadow-sm focus:border-blue-600 focus:ring-blue-600" /></div>
                                                </div>
                                            </div>

                                            {/* Section 3: Submissions Pipeline */}
                                            <div>
                                                <div className="flex items-center justify-between mb-5">
                                                    <div className="flex items-center gap-2">
                                                        <div className="h-8 w-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center"><Icons.TrendingUp /></div>
                                                        <h3 className="text-lg font-bold text-slate-900">Application Pipeline</h3>
                                                    </div>
                                                    <button type="button" onClick={addSubmission} className="inline-flex items-center px-4 py-2 bg-slate-900 text-white text-sm font-bold rounded-lg hover:bg-slate-800 transition-colors shadow-sm">
                                                        <Icons.Plus /> Add Application
                                                    </button>
                                                </div>

                                                {formData.submissions?.length === 0 ? (
                                                    <div className="border-2 border-dashed border-slate-300 rounded-xl p-10 text-center bg-white">
                                                        <Icons.Building className="mx-auto w-10 h-10 text-slate-400 mb-3" />
                                                        <p className="text-base font-bold text-slate-900">Pipeline is empty</p>
                                                        <p className="text-sm font-medium text-slate-500 mt-1 mb-4">Track companies you have applied to on behalf of this candidate.</p>
                                                        <button type="button" onClick={addSubmission} className="text-blue-600 font-bold hover:text-blue-800 text-sm">Start Tracking →</button>
                                                    </div>
                                                ) : (
                                                    <div className="space-y-5">
                                                        {formData.submissions.map((sub, idx) => (
                                                            <div key={sub.id} className="relative bg-white border-2 border-slate-200 rounded-xl p-6 shadow-sm hover:border-blue-300 transition-colors">
                                                                <button type="button" onClick={() => removeSubmission(sub.id)} className="absolute top-5 right-5 p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete application"><Icons.Delete /></button>
                                                                
                                                                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 border-b border-slate-100 pb-2">Submission {formData.submissions.length - idx}</h4>

                                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                                                    <div><label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Company Name</label><input type="text" value={sub.companyName} onChange={e => updateSubmission(sub.id, 'companyName', e.target.value)} className="block w-full rounded-lg border-slate-300 py-2 px-3 text-sm font-medium shadow-sm focus:border-blue-600 focus:ring-blue-600 bg-slate-50 focus:bg-white" placeholder="e.g. Google" /></div>
                                                                    <div><label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Applied Role</label><input type="text" value={sub.appliedRole} onChange={e => updateSubmission(sub.id, 'appliedRole', e.target.value)} className="block w-full rounded-lg border-slate-300 py-2 px-3 text-sm font-medium shadow-sm focus:border-blue-600 focus:ring-blue-600 bg-slate-50 focus:bg-white" placeholder="Frontend Eng" /></div>
                                                                    <div>
                                                                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Current Status</label>
                                                                        <select value={sub.status} onChange={e => updateSubmission(sub.id, 'status', e.target.value)} className={`block w-full rounded-lg border-slate-300 py-2 px-3 text-sm font-bold shadow-sm focus:border-blue-600 focus:ring-blue-600 ${sub.status === 'Selected' ? 'text-emerald-800 bg-emerald-100' : sub.status === 'Rejected' ? 'text-red-800 bg-red-100' : 'text-blue-800 bg-blue-50'}`}>
                                                                            <option value="Submitted">Submitted</option><option value="In The Review">In Review</option><option value="In The Interview">Interviewing</option><option value="Selected">Selected 🎊</option><option value="Rejected">Rejected</option>
                                                                        </select>
                                                                    </div>
                                                                    <div><label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">C2C Rate</label><input type="text" value={sub.c2cRate} onChange={e => updateSubmission(sub.id, 'c2cRate', e.target.value)} className="block w-full rounded-lg border-slate-300 py-2 px-3 text-sm font-medium shadow-sm focus:border-blue-600 focus:ring-blue-600 bg-slate-50 focus:bg-white" placeholder="$80/hr" /></div>
                                                                    <div className="md:col-span-2">
                                                                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Client POC Details</label>
                                                                        <div className="flex gap-2">
                                                                            <input type="text" value={sub.pocName} onChange={e => updateSubmission(sub.id, 'pocName', e.target.value)} className="block w-1/3 rounded-lg border-slate-300 py-2 px-3 text-sm font-medium shadow-sm focus:border-blue-600 focus:ring-blue-600 bg-slate-50 focus:bg-white" placeholder="Name" />
                                                                            <input type="email" value={sub.pocEmail} onChange={e => updateSubmission(sub.id, 'pocEmail', e.target.value)} className="block w-1/3 rounded-lg border-slate-300 py-2 px-3 text-sm font-medium shadow-sm focus:border-blue-600 focus:ring-blue-600 bg-slate-50 focus:bg-white" placeholder="Email" />
                                                                            <input type="text" value={sub.pocMobile} onChange={e => updateSubmission(sub.id, 'pocMobile', e.target.value)} className="block w-1/3 rounded-lg border-slate-300 py-2 px-3 text-sm font-medium shadow-sm focus:border-blue-600 focus:ring-blue-600 bg-slate-50 focus:bg-white" placeholder="Phone" />
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </form>
                                    </div>

                                    {/* Drawer Footer - Sticky */}
                                    <div className="sticky bottom-0 z-10 bg-white border-t border-slate-200 px-6 py-4 flex items-center justify-end gap-3 shadow-[0_-10px_30px_rgba(0,0,0,0.05)]">
                                        <button type="button" className="px-5 py-2.5 text-sm font-bold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors" onClick={() => setIsSlideOverOpen(false)}>Cancel</button>
                                        <button type="submit" form="candidate-form" className="px-6 py-2.5 text-sm font-bold text-white bg-blue-600 rounded-lg shadow-sm hover:bg-blue-700 transition-all">Save Profile & Pipeline</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Modal */}
            {isDeleteOpen && (
                <div className="relative z-" style={{ fontFamily: '"Inter", system-ui, sans-serif' }}>
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={() => setIsDeleteOpen(false)}></div>
                    <div className="fixed inset-0 z-10 w-screen overflow-y-auto flex min-h-full items-center justify-center p-4">
                        <div className="relative transform overflow-hidden rounded-2xl bg-white text-left shadow-2xl transition-all sm:w-full sm:max-w-md p-6">
                            <div className="flex flex-col items-center text-center">
                                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100 mb-4 text-red-600">
                                    <Icons.Delete />
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 mb-2">Delete Candidate?</h3>
                                <p className="text-sm font-medium text-slate-600 mb-6 px-2">
                                    Are you sure you want to delete <strong>{deletingCandidate?.firstName} {deletingCandidate?.lastName}</strong>? This action cannot be undone and will permanently remove all their application pipelines.
                                </p>
                                <div className="flex w-full gap-3">
                                    <button type="button" className="flex-1 rounded-lg bg-slate-100 px-4 py-3 text-sm font-bold text-slate-900 hover:bg-slate-200 transition-colors" onClick={() => setIsDeleteOpen(false)}>Cancel</button>
                                    <button type="button" className="flex-1 rounded-lg bg-red-600 px-4 py-3 text-sm font-bold text-white shadow-sm hover:bg-red-700 transition-colors" onClick={confirmDelete}>Yes, Delete</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            
            {/* Custom Styles for Scrollbar */}
            <style jsx>{`
                .custom-scrollbar::-webkit-scrollbar { width: 8px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #cbd5e1; border-radius: 20px; border: 3px solid transparent; background-clip: content-box; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background-color: #94a3b8; }
                @keyframes fade-in-down { 0% { opacity: 0; transform: translate(-50%, -20px); } 100% { opacity: 1; transform: translate(-50%, 0); } }
                .animate-fade-in-down { animation: fade-in-down 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
            `}</style>
        </div>
    );
};

export default BenchSalesDashboard;