import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../api/apiService';
import Spinner from '../components/Spinner';
import Dropdown from '../components/Dropdown';
import HeaderMenu from '../components/dashboard/HeaderMenu';
import CandidateDetailsModal from '../components/dashboard/CandidateDetailsModal';
import CandidateProfileViewModal from '../components/dashboard/CandidateProfileViewModal';
import ColumnSettingsModal from '../components/dashboard/ColumnSettingsModal';
// Removed: import RequestCandidateTimesheetApprovalModal
import { formatDate } from '../utils/helpers';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { usePermissions } from '../hooks/usePermissions';

const CandidateDetailsPage = () => {
    const { user, updatePreferences } = useAuth();
    // Removed canRequestTimesheetApproval since the modal is gone
    const { canViewCandidates, canEditDashboard } = usePermissions(); 

    const [candidates, setCandidates] = useState([]);
    const [duplicateEmails, setDuplicateEmails] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    
    const [generalFilter, setGeneralFilter] = useState('');
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });
    const [columnFilters, setColumnFilters] = useState({});

    const [isCandidateModalOpen, setIsCandidateModalOpen] = useState(false);
    const [candidateToEdit, setCandidateToEdit] = useState(null);
    const [isProfileViewModalOpen, setIsProfileViewModalOpen] = useState(false);
    const [candidateToView, setCandidateToView] = useState(null);
    const [isColumnModalOpen, setIsColumnModalOpen] = useState(false);
    
    // Removed state related to timesheet approval modal
    const [candidateForApproval, setCandidateForApproval] = useState(null);

    // Define all possible headers for the table.
    const allHeaders = useMemo(() => {
        const baseHeaders = [
            'Full Name', 'Candidate Contact Details', 'Current Role', 
            'Current Location', 'Skill Set', 'Submitted For (Posting ID)', 'Client Info', 
            'Submitted By', 'Submission Date', 'Remarks', 'Resume Worked By', 'Reference From'
        ];
        return baseHeaders;
    }, []);

    // Memoize user preferences from AuthContext.
    const userPrefs = useMemo(() => {
        const safeParse = (jsonString, def = []) => {
            try {
                const parsed = JSON.parse(jsonString);
                return Array.isArray(parsed) ? parsed : def;
            } catch (e) {
                return Array.isArray(jsonString) ? jsonString : def;
            }
        };
        // Use a specific key for this page's preferences to avoid conflicts.
        return {
            order: safeParse(user?.dashboardPreferences?.candidateColumnOrder, []),
            visibility: safeParse(user?.dashboardPreferences?.candidateColumnVisibility, []),
        };
    }, [user]);

    const loadData = useCallback(async () => {
        setLoading(true);
        setError('');
        if (!canViewCandidates) {
            setLoading(false);
            setError("You do not have permission to view candidate details.");
            return;
        }
        try {
            const result = await apiService.getCandidateDetailsPageData(user.userIdentifier);
            if (result.data.success) {
                setCandidates(Array.isArray(result.data.candidates) ? result.data.candidates : []);
                setDuplicateEmails(result.data.duplicateEmails || []);
            } else {
                setError(result.data.message);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to fetch candidate data.');
        } finally {
            setLoading(false);
        }
    }, [user.userIdentifier, canViewCandidates]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    // Transform raw candidate data into a display-friendly format.
    const tableRows = useMemo(() => {
        return candidates.map(c => ({
            original: c,
            display: {
                'Full Name': `${c.firstName} ${c.middleName || ''} ${c.lastName}`.replace(/\s+/g, ' ').trim(),
                'Candidate Contact Details': (
                    <div>
                        <p className="font-semibold">{c.email}</p>
                        <p className="text-gray-600">{c.mobileNumber}</p>
                    </div>
                ),
                'Current Role': c.currentRole,
                'Current Location': c.currentLocation,
                'Skill Set': c.skillSet || [],
                'Submitted For (Posting ID)': c.postingId,
                'Client Info': c.clientInfo,
                'Submitted By': c.submittedBy,
                'Submission Date': c.submissionDate,
                'Remarks': c.remarks,
                'Resume Worked By': c.resumeWorkedBy,
                'Reference From': c.referenceFrom
            }
        }));
    }, [candidates]);

    // Determine the final ordered and visible headers based on user preferences.
    const displayHeader = useMemo(() => {
        const ordered = userPrefs.order.length > 0
            ? userPrefs.order.filter(h => allHeaders.includes(h))
            : allHeaders;
        
        const remaining = allHeaders.filter(h => !ordered.includes(h));
        let finalHeaders = [...ordered, ...remaining];

        if (userPrefs.visibility.length > 0) {
            finalHeaders = finalHeaders.filter(h => !userPrefs.visibility.includes(h));
        }

        // Only include "Actions" if the user can perform *any* action
        if (canEditDashboard) {
            finalHeaders.push('Actions');
        }
        
        return finalHeaders;
    }, [allHeaders, userPrefs, canEditDashboard]);

    // Filter and sort the data for display.
    const filteredAndSortedData = useMemo(() => {
        let filteredRows = [...tableRows];

        if (generalFilter) {
            const lowercasedFilter = generalFilter.toLowerCase();
            filteredRows = filteredRows.filter(item => 
                Object.values(item.original).some(val => String(val).toLowerCase().includes(lowercasedFilter))
            );
        }

        if (sortConfig.key) {
             filteredRows.sort((a, b) => {
                let valA, valB;
                 if (sortConfig.key === 'Candidate Contact Details') {
                    valA = a.original.email;
                    valB = b.original.email;
                } else {
                    valA = a.display[sortConfig.key];
                    valB = b.display[sortConfig.key];
                }
                
                if (Array.isArray(valA)) valA = valA.join(', ');
                if (Array.isArray(valB)) valB = valB.join(', ');
                
                if (sortConfig.key === 'Submission Date') {
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

        return filteredRows;
    }, [tableRows, generalFilter, columnFilters, sortConfig]);
    
    // Apply specified column widths. (Not needed in card view but kept for PDF/CSV)
    const colWidths = {
        'Full Name': 'w-[7.5%]',
        'Candidate Contact Details': 'w-[9%]',
        'Current Role': 'w-[7.5%]',
        'Skill Set': 'w-[16%]',
        'Submitted By': 'w-[9%]',
        'Actions': 'w-[4%]'
    };

    const handleSort = (key, direction) => setSortConfig({ key, direction });
    const handleFilterChange = (header, config) => setColumnFilters(prev => ({ ...prev, [header]: config }));

    const handleEditClick = (candidateData) => {
        if (!canEditDashboard) return;
        setCandidateToEdit(candidateData);
        setIsCandidateModalOpen(true);
    };

    const handleViewProfileClick = (candidateData) => {
        setCandidateToView(candidateData);
        setIsProfileViewModalOpen(true);
    };

    // Removed handleApprovalRequestClick since the modal is gone

    const handleSaveCandidate = async (formData) => {
        if (!canEditDashboard) throw new Error("Permission denied to save candidate details.");
        try {
            await apiService.updateCandidateDetails(candidateToEdit.email, formData, user.userIdentifier);
            loadData();
        } catch (error) {
            throw error;
        }
    };
    
    // Save the new column settings to the backend and update the global state.
    const handleSaveColumnSettings = async (newPrefs) => {
        setLoading(true);
        try {
            const newPreferences = {
                ...user.dashboardPreferences,
                candidateColumnOrder: JSON.stringify(newPrefs.order),
                candidateColumnVisibility: JSON.stringify(newPrefs.visibility)
            };
            await apiService.saveUserDashboardPreferences(user.userIdentifier, newPreferences);
            updatePreferences(newPreferences);
        } catch(err) {
            setError(`Failed to save column settings: ${err.message}`);
        } finally {
            setLoading(false);
            setIsColumnModalOpen(false);
        }
    };

    const downloadPdf = () => {
        const doc = new jsPDF('landscape');
        const exportHeaders = allHeaders; // Use all headers for export simplicity
        const body = filteredAndSortedData.map(item => {
            return exportHeaders.map(header => {
                let cell = item.display[header];
                if (header === 'Candidate Contact Details') {
                    return `${item.original.email}, ${item.original.mobileNumber}`;
                }
                if (header === 'Submission Date') {
                    return formatDate(cell);
                }
                return Array.isArray(cell) ? cell.join(', ') : cell;
            });
        });
        doc.autoTable({ head: [exportHeaders], body });
        doc.save(`candidate_details_report.pdf`);
    };

    const downloadCsv = () => {
        const exportHeaders = allHeaders; // Use all headers for export simplicity
        const csvContent = [
            exportHeaders.join(','),
            ...filteredAndSortedData.map(item => 
                exportHeaders.map(header => {
                    let cell = item.display[header];
                    if (header === 'Candidate Contact Details') {
                        cell = `${item.original.email}, ${item.original.mobileNumber}`;
                    }
                    if (header === 'Submission Date') {
                        cell = formatDate(cell);
                    }
                    return `"${String(Array.isArray(cell) ? cell.join('; ') : (cell || '')).replace(/"/g, '""')}"`;
                }).join(',')
            )
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `candidate_details_report.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const getStatusBadge = (remarks) => {
        const colorMap = {
            'Submitted To Client': 'bg-blue-100 text-blue-700',
            'Resume Shortlisted For Interview': 'bg-green-100 text-green-700',
            'Candidate Selected': 'bg-teal-100 text-teal-700',
            'Client Reject Due To Candidate Not Up To Mark': 'bg-red-100 text-red-700',
            'Rejected Due To Some Other Reasons': 'bg-red-100 text-red-700',
            'Resume Is Under View': 'bg-yellow-100 text-yellow-700',
        };
        const defaultColor = 'bg-gray-100 text-gray-700';
        const text = remarks || 'No Update';
        return (
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${colorMap[text] || defaultColor}`}>
                {text.length > 25 ? text.substring(0, 25) + '...' : text}
            </span>
        );
    };

    return (
        <>
            <div className="space-y-6">
                <h1 className="text-3xl font-bold text-gray-800">Candidate Details</h1>
                
                <div className="bg-white p-4 rounded-xl shadow-sm border flex flex-wrap items-center justify-between gap-4">
                    <input 
                        type="text" 
                        placeholder="Search all candidates..." 
                        value={generalFilter} 
                        onChange={(e) => setGeneralFilter(e.target.value)} 
                        className="shadow-sm border-gray-300 rounded-md px-3 py-2 w-full md:w-1/3"
                        disabled={!canViewCandidates && !loading}
                    />
                     <div className="flex items-center space-x-2">
                        <button 
                            onClick={loadData}
                            className="px-4 py-2 bg-indigo-500 text-white rounded-md hover:bg-indigo-600"
                            disabled={loading}
                        >
                            {loading ? 'Refreshing...' : 'Refresh Data'}
                        </button>
                        <Dropdown
                            trigger={
                                <button className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Options</button>
                            }
                        >
                            <a href="#" onClick={(e) => { e.preventDefault(); downloadPdf(); }} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Export PDF</a>
                            <a href="#" onClick={(e) => { e.preventDefault(); downloadCsv(); }} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Export CSV</a>
                        </Dropdown>
                    </div>
                </div>

                {loading && <div className="flex justify-center items-center h-64"><Spinner /></div>}
                {error && <div className="text-red-500 bg-red-100 p-4 rounded-lg">Error: {error}</div>}
                
                {!loading && !error && !canViewCandidates && (
                    <div className="text-center text-gray-500 p-10 bg-white rounded-xl shadow-sm border">
                        <h3 className="text-lg font-medium">Access Denied</h3>
                        <p className="mt-1 text-sm text-gray-500">You do not have the necessary permissions to view candidate details.</p>
                    </div>
                )}

                {/* NEW: Card-Based Grid Display */}
                {!loading && !error && canViewCandidates && filteredAndSortedData.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {filteredAndSortedData.map((item, index) => {
                            const c = item.original;
                            const isDuplicate = duplicateEmails.includes(c.email);
                            return (
                                <div 
                                    key={index} 
                                    className={`relative bg-white p-5 rounded-xl shadow-md border ${isDuplicate ? 'border-yellow-500 ring-1 ring-yellow-500' : 'border-gray-200 hover:shadow-lg transition'}`}
                                >
                                    {isDuplicate && (
                                        <div className="absolute top-0 right-0 bg-yellow-500 text-white text-xs font-bold px-2 py-1 rounded-bl-lg rounded-tr-xl">Duplicate</div>
                                    )}
                                    <h2 className="text-lg font-bold text-gray-900 mb-2 truncate">
                                        {item.display['Full Name']}
                                    </h2>
                                    
                                    <div className="space-y-2 text-sm">
                                        <p className="text-gray-700">
                                            <span className="font-semibold text-gray-500 mr-2">Role:</span> {c.currentRole || 'N/A'}
                                        </p>
                                        <p className="text-gray-700">
                                            <span className="font-semibold text-gray-500 mr-2">Location:</span> {c.currentLocation || 'N/A'}
                                        </p>
                                        <p className="text-gray-700 truncate">
                                            <span className="font-semibold text-gray-500 mr-2">Email:</span> {c.email}
                                        </p>
                                        <p className="text-gray-700">
                                            <span className="font-semibold text-gray-500 mr-2">Posting ID:</span> {c.postingId}
                                        </p>
                                        <p className="text-gray-700">
                                            <span className="font-semibold text-gray-500 mr-2">Submitted By:</span> {c.submittedBy}
                                        </p>
                                        <div className="pt-2">
                                            <span className="font-semibold text-gray-500 block mb-1">Status:</span>
                                            {getStatusBadge(c.remarks)}
                                        </div>
                                    </div>

                                    <div className="mt-4 pt-3 border-t flex justify-between space-x-2">
                                        <button 
                                            onClick={() => handleViewProfileClick(c)} 
                                            className="px-3 py-1 text-sm text-indigo-600 border border-indigo-200 rounded-lg hover:bg-indigo-50 transition"
                                        >
                                            View Profile
                                        </button>
                                        {canEditDashboard && (
                                            <button 
                                                onClick={() => handleEditClick(c)} 
                                                className="px-3 py-1 text-sm text-teal-600 border border-teal-200 rounded-lg hover:bg-teal-50 transition"
                                            >
                                                Edit Details
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
                 {!loading && !error && canViewCandidates && filteredAndSortedData.length === 0 && (
                     <div className="text-center text-gray-500 p-10 bg-white rounded-xl shadow-sm border">
                        <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7h16M4 7L12 4l8 3M12 4v17M4 11h16M4 15h16" /></svg>
                        <h3 className="mt-2 text-sm font-medium text-gray-900">No Candidates Found</h3>
                        <p className="mt-1 text-sm text-gray-500">Try adjusting your search filter.</p>
                    </div>
                 )}
            </div>
            <CandidateDetailsModal 
                isOpen={isCandidateModalOpen} 
                onClose={() => setIsCandidateModalOpen(false)} 
                onSave={handleSaveCandidate}
                candidateToEdit={candidateToEdit}
            />
            <CandidateProfileViewModal
                isOpen={isProfileViewModalOpen}
                onClose={() => setIsProfileViewModalOpen(false)}
                candidate={candidateToView}
            />
            <ColumnSettingsModal
                isOpen={isColumnModalOpen}
                onClose={() => setIsColumnModalOpen(false)}
                allHeaders={allHeaders}
                userPrefs={userPrefs}
                onSave={handleSaveColumnSettings}
            />
        </>
    );
};

export default CandidateDetailsPage;