import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { usePermissions } from '../hooks/usePermissions'; // <-- NEW: Import usePermissions
import { apiService } from '../api/apiService';
import { formatDate, getDeadlineClass } from '../utils/helpers';
import Spinner from '../components/Spinner';
import Dropdown from '../components/Dropdown';
import HeaderMenu from '../components/dashboard/HeaderMenu';
import CandidateDetailsModal from '../components/dashboard/CandidateDetailsModal';
import CandidateProfileViewModal from '../components/dashboard/CandidateProfileViewModal';
import ColumnSettingsModal from '../components/dashboard/ColumnSettingsModal';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
// import { usePermissions } from '../hooks/usePermissions'; // Duplicate import removed

// Component to handle the collapsible skill display
const SkillPill = ({ skill, index }) => (
    <span key={index} className="px-2 py-0.5 text-xs font-medium bg-gray-200 text-gray-800 rounded-lg">
        {skill}
    </span>
);

const CandidateDetailsPage = () => {
    const { user, updatePreferences } = useAuth();
    // Removed canRequestTimesheetApproval since the modal is gone
    const { canViewCandidates, canEditDashboard } = usePermissions(); 

    const [candidates, setCandidates] = useState([]);
    const [duplicateEmails, setDuplicateEmails] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    
    const [generalFilter, setGeneralFilter] = useState('');
    // Kept sortConfig state for front-end sorting logic
    const [sortConfig, setSortConfig] = useState({ key: 'Submission Date', direction: 'descending' });
    const [columnFilters, setColumnFilters] = useState({});

    const [isCandidateModalOpen, setIsCandidateModalOpen] = useState(false);
    const [candidateToEdit, setCandidateToEdit] = useState(null);
    const [isProfileViewModalOpen, setIsProfileViewModalOpen] = useState(false);
    const [candidateToView, setCandidateToView] = useState(null);
    const [isColumnModalOpen, setColumnModalOpen] = useState(false);
    
    // Removed state related to timesheet approval modal
    const [candidateForApproval, setCandidateForApproval] = useState(null);

    // State for tracking which card's skills are expanded
    const [expandedCardId, setExpandedCardId] = useState(null); 

    // Define all possible headers for the table.
    // NOTE: This list is used for export/config, not for displaying every column in the card grid.
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
        if (!user?.userIdentifier || !canViewCandidates) {
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

        // --- 1. General Search Filter (Updated to look at specific key fields) ---
        if (generalFilter) {
            const lowercasedFilter = generalFilter.toLowerCase();
            filteredRows = filteredRows.filter(item => {
                const c = item.original;
                // Handle both array (new) and string (old) skillSet formats
                const skillSetString = Array.isArray(c.skillSet) 
                    ? c.skillSet.join(' ').toLowerCase() 
                    : (typeof c.skillSet === 'string' ? c.skillSet.toLowerCase() : '');

                // Search across Name, Role, Location, Posting ID, Skills, and Remarks
                return (
                    item.display['Full Name'].toLowerCase().includes(lowercasedFilter) ||
                    (c.currentRole && c.currentRole.toLowerCase().includes(lowercasedFilter)) ||
                    (c.currentLocation && c.currentLocation.toLowerCase().includes(lowercasedFilter)) ||
                    (c.referenceFrom && c.referenceFrom.toLowerCase().includes(lowercasedFilter)) ||
                    (c.remarks && c.remarks.toLowerCase().includes(lowercasedFilter)) ||
                    // *** FIX: Added search for postingId ***
                    (c.postingId && c.postingId.toLowerCase().includes(lowercasedFilter)) ||
                    // *** END FIX ***
                    skillSetString.includes(lowercasedFilter)
                );
            });
        }

        // --- 2. Sorting Logic ---
        if (sortConfig.key) {
             filteredRows.sort((a, b) => {
                let valA, valB;
                
                // Determine the values to compare based on the sort key
                if (sortConfig.key === 'Submission Date') {
                    valA = new Date(a.original.submissionDate).getTime() || 0;
                    valB = new Date(b.original.submissionDate).getTime() || 0;
                } else { // Sort by Full Name (default for all other text fields)
                    valA = a.display['Full Name'].toLowerCase();
                    valB = b.display['Full Name'].toLowerCase();
                }

                // Apply ascending/descending order
                if (valA < valB) return sortConfig.direction === 'ascending' ? -1 : 1;
                if (valA > valB) return sortConfig.direction === 'ascending' ? 1 : -1;
                return 0;
            });
        }

        return filteredRows;
    }, [tableRows, generalFilter, sortConfig]);
    
    // Apply specified column widths. (Not needed in card view but kept for PDF/CSV)
    const colWidths = {
        'Full Name': 'w-[7.5%]',
        'Candidate Contact Details': 'w-[9%]',
        'Current Role': 'w-[7.Eclat VMS5%]',
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

    const handleSaveCandidate = async (formData) => {
        if (!canEditDashboard) throw new Error("Permission denied to save candidate details.");
        setLoading(true); // Set loading true on save
        try {
            await apiService.updateCandidateDetails(candidateToEdit.email, formData, user.userIdentifier);
            loadData();
        } catch (error) {
            throw error;
        } finally {
            setLoading(false); // Set loading false on complete
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
                
                <div className="bg-white p-4 rounded-xl shadow-sm border flex flex-col md:flex-row items-center justify-between gap-4">
                    <input 
                        type="text" 
                        placeholder="Search by name, role, location, skills, posting id..." 
                        value={generalFilter} 
                        onChange={(e) => setGeneralFilter(e.target.value)} 
                        className="shadow-sm border-gray-300 rounded-md px-3 py-2 w-full md:w-1/3"
                        disabled={!canViewCandidates && !loading}
                    />
                     <div className="flex items-center space-x-2 w-full md:w-auto">
                        {/* Quick Sort Options */}
                        <Dropdown
                            trigger={
                                <button className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 w-full md:w-auto">
                                    Sort By: {sortConfig.key === 'Submission Date' ? 'Date' : 'Name'} {sortConfig.direction === 'ascending' ? '▲' : '▼'}
                                </button>
                            }
                        >
                            <a href="#" onClick={(e) => { e.preventDefault(); handleSort('Submission Date', 'descending'); }} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Date (Newest)</a>
                            <a href="#" onClick={(e) => { e.preventDefault(); handleSort('Submission Date', 'ascending'); }} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Date (Oldest)</a>
                            <a href="#" onClick={(e) => { e.preventDefault(); handleSort('Full Name', 'ascending'); }} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Name (A-Z)</a>
                            <a href="#" onClick={(e) => { e.preventDefault(); handleSort('Full Name', 'descending'); }} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Name (Z-A)</a>
                        </Dropdown>

                        <button 
                            onClick={loadData}
                            className="px-4 py-2 bg-indigo-500 text-white rounded-md hover:bg-indigo-600 w-full md:w-auto"
                            disabled={loading}
                        >
                            {loading ? <Spinner size="4" /> : 'Refresh'}
                        </button>
                        
                        <Dropdown
                            trigger={
                                <button className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 w-full md:w-auto">Options</button>
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
                            // Extract first 3 skills for tags
                            const skillTags = Array.isArray(c.skillSet) ? c.skillSet.slice(0, 3) : [];

                            return (
                                <div 
                                    key={index} 
                                    className={`relative bg-white p-5 rounded-xl shadow-md border flex flex-col h-full ${isDuplicate ? 'border-yellow-500 ring-1 ring-yellow-500' : 'border-gray-200 hover:shadow-lg transition'}`}
                                >
                                    {isDuplicate && (
                                        <div className="absolute top-0 right-0 bg-yellow-500 text-white text-xs font-bold px-2 py-1 rounded-bl-lg rounded-tr-xl">Duplicate</div>
                                    )}
                                    
                                    <div className="flex items-center space-x-3 mb-2">
                                        <span className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center font-bold text-indigo-700 text-xl">
                                            {c.firstName.charAt(0)}{c.lastName.charAt(0)}
                                        </span>
                                        <h2 className="text-lg font-bold text-gray-900 truncate">
                                            {item.display['Full Name']}
                                        </h2>
                                    </div>
                                    
                                    {/* Skills Preview Section (Visible by default) */}
                                    <div className="flex flex-wrap gap-1.5 mb-3">
                                        {skillTags.map((skill, i) => (
                                            <SkillPill key={i} skill={skill} />
                                        ))}
                                        {c.skillSet.length > 3 && (
                                            <span className="px-2 py-0.5 text-xs font-medium text-indigo-500">+{c.skillSet.length - 3} more</span>
                                        )}
                                    </div>

                                    <div className="space-y-2 text-sm border-t pt-3 flex-grow">
                                        <p className="text-gray-700 flex justify-between items-center">
                                            <span className="font-semibold text-gray-500 flex items-center space-x-1">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-indigo-400" viewBox="0 0 20 20" fill="currentColor"><path d="M10 2a6 6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707l-.707-.707V8a6 6 0 00-6-6zm-6 9.586V8a6 6 0 0112 0v3.586l-1 1H5l-1-1zM9 17h2a1 1 0 00-2 0z" clipRule="evenodd" fillRule="evenodd"></path></svg>
                                                Role:
                                            </span> 
                                            <span className="text-right truncate max-w-[65%]">{c.currentRole || 'N/A'}</span>
                                        </p>
                                        <p className="text-gray-700 flex justify-between items-center">
                                            <span className="font-semibold text-gray-500 flex items-center space-x-1">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-indigo-400" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd"></path></svg>
                                                Location:
                                            </span> 
                                            <span className="text-right truncate max-w-[65%]">{c.currentLocation || 'N/A'}</span>
                                        </p>
                                        <p className="text-gray-700 flex justify-between items-center">
                                            <span className="font-semibold text-gray-500 flex items-center space-x-1">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-indigo-400" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd"></path></svg>
                                                Submitted:
                                            </span> 
                                            <span className="text-right truncate max-w-[65%]">{formatDate(c.submissionDate)}</span>
                                        </p>
                                        <div className="pt-2">
                                            <span className="font-semibold text-gray-500 block mb-1">Status:</span>
                                            {getStatusBadge(c.remarks)}
                                        </div>
                                    </div>

                                    {/* Action buttons are pushed to the bottom via mt-auto */}
                                    <div className="mt-4 pt-3 border-t flex justify-between space-x-2 w-full">
                                        <button 
                                            onClick={() => handleViewProfileClick(c)} 
                                            className="w-1/2 px-3 py-1.5 text-sm font-semibold text-indigo-600 border border-indigo-200 rounded-lg hover:bg-indigo-50 transition"
                                        >
                                            View Profile
                                        </button>
                                        {canEditDashboard && (
                                            <button 
                                                onClick={() => handleEditClick(c)} 
                                                className="w-1/2 px-3 py-1.5 text-sm font-semibold text-teal-600 border border-teal-200 rounded-lg hover:bg-teal-50 transition"
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