import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../api/apiService';
import Spinner from '../components/Spinner';
import Dropdown from '../components/Dropdown';
import HeaderMenu from '../components/dashboard/HeaderMenu';
import CandidateDetailsModal from '../components/dashboard/CandidateDetailsModal';
import CandidateProfileViewModal from '../components/dashboard/CandidateProfileViewModal';
import { formatDate } from '../utils/helpers';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { usePermissions } from '../hooks/usePermissions';

const CandidateDetailsPage = () => {
    const { user } = useAuth();
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

    const tableHeader = useMemo(() => {
        const baseHeaders = [
            'Full Name', 'Candidate Contact Details', 'Current Role', 
            'Current Location', 'Skill Set', 'Submitted For (Posting ID)', 'Client Info', 
            'Submitted By', 'Submission Date', 'Remarks', 'Resume Worked By', 'Reference From'
        ];
        if (canEditDashboard) { 
            return [...baseHeaders, 'Actions'];
        }
        return baseHeaders;
    }, [canEditDashboard]); 

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

    const tableRows = useMemo(() => {
        return candidates.map(c => ({
            original: c,
            // The `display` array now holds JSX for the contact column
            display: [
                `${c.firstName} ${c.middleName || ''} ${c.lastName}`.replace(/\s+/g, ' ').trim(),
                (
                    <div>
                        <p className="font-semibold">{c.email}</p>
                        <p className="text-gray-600">{c.mobileNumber}</p>
                    </div>
                ),
                c.currentRole,
                c.currentLocation,
                c.skillSet || [],
                c.postingId,
                c.clientInfo,
                c.submittedBy,
                c.submissionDate,
                c.remarks,
                c.resumeWorkedBy,
                c.referenceFrom
            ],
            // A raw data representation for filtering/sorting the merged column
            filterSortData: {
                'Candidate Contact Details': `${c.email} ${c.mobileNumber}`
            }
        }));
    }, [candidates]);

    const filteredAndSortedData = useMemo(() => {
        let filteredRows = [...tableRows];
        if (generalFilter) {
            const lowercasedFilter = generalFilter.toLowerCase();
            filteredRows = filteredRows.filter(item => 
                Object.values(item.original).some(val => String(val).toLowerCase().includes(lowercasedFilter)) ||
                item.display.some(cell => {
                    if (typeof cell === 'string') return cell.toLowerCase().includes(lowercasedFilter);
                    if (Array.isArray(cell)) return cell.join(', ').toLowerCase().includes(lowercasedFilter);
                    return false;
                })
            );
        }

        if (sortConfig.key) {
            const sortIndex = tableHeader.indexOf(sortConfig.key);
            if (sortIndex !== -1) {
                filteredRows.sort((a, b) => {
                    let valA, valB;
                    if (sortConfig.key === 'Candidate Contact Details') {
                        valA = a.original.email.toLowerCase();
                        valB = b.original.email.toLowerCase();
                    } else {
                        valA = a.display[sortIndex] || '';
                        valB = b.display[sortIndex] || '';
                    }
                    
                    if (Array.isArray(valA)) valA = valA.join(', ');
                    if (Array.isArray(valB)) valB = valB.join(', ');
                    
                    if (sortConfig.key === 'Submission Date') {
                        valA = new Date(valA).getTime() || 0;
                        valB = new Date(valB).getTime() || 0;
                    } else {
                        valA = String(valA).toLowerCase();
                        valB = String(valB).toLowerCase();
                    }

                    if (valA < valB) return sortConfig.direction === 'ascending' ? -1 : 1;
                    if (valA > valB) return sortConfig.direction === 'ascending' ? 1 : -1;
                    return 0;
                });
            }
        }

        return filteredRows;
    }, [tableRows, generalFilter, columnFilters, sortConfig, tableHeader]);
    
    const colWidths = {
        'Full Name': 'w-[12%]',
        'Candidate Contact Details': 'w-[15%]',
        'Current Role': 'w-[12%]',
        'Skill Set': 'w-[15%]',
        'Submitted By': 'w-[10%]',
        'Actions': 'w-[5%]'
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
        try {
            await apiService.updateCandidateDetails(candidateToEdit.email, formData, user.userIdentifier);
            loadData();
        } catch (error) {
            throw error;
        }
    };

    const downloadPdf = () => {
        const doc = new jsPDF('landscape');
        const exportHeaders = tableHeader.filter(h => h !== 'Actions');
        const body = filteredAndSortedData.map(item => {
            return item.display.slice(0, exportHeaders.length).map((cell, index) => {
                if (tableHeader[index] === 'Candidate Contact Details') {
                    return `${item.original.email}, ${item.original.mobileNumber}`;
                }
                return Array.isArray(cell) ? cell.join(', ') : cell;
            });
        });
        doc.autoTable({ head: [exportHeaders], body });
        doc.save(`candidate_details_report.pdf`);
    };

    const downloadCsv = () => {
        const exportHeaders = tableHeader.filter(h => h !== 'Actions');
        const csvContent = [
            exportHeaders.join(','),
            ...filteredAndSortedData.map(item => 
                exportHeaders.map(header => {
                    const cellIndex = tableHeader.indexOf(header);
                    let cell = item.display[cellIndex];
                    if (header === 'Candidate Contact Details') {
                        cell = `${item.original.email}, ${item.original.mobileNumber}`;
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

    return (
        <>
            <div className="space-y-4">
                <h1 className="text-3xl font-bold text-gray-800">Candidate Details</h1>
                
                <div className="bg-white p-4 rounded-lg shadow-sm border flex flex-wrap items-center justify-between gap-4">
                    <input 
                        type="text" 
                        placeholder="Search all columns..." 
                        value={generalFilter} 
                        onChange={(e) => setGeneralFilter(e.target.value)} 
                        className="shadow-sm border-gray-300 rounded-md px-3 py-2"
                        disabled={!canViewCandidates && !loading}
                    />
                     <div className="flex items-center space-x-2">
                        <button onClick={downloadPdf} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300" disabled={!canViewCandidates || loading}>Download PDF</button>
                        <button onClick={downloadCsv} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300" disabled={!canViewCandidates || loading}>Download CSV</button>
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

                {!loading && !error && canViewCandidates && (
                    <div className="bg-white rounded-lg shadow-lg border border-gray-200" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left text-gray-500 table-fixed">
                                <thead className="text-xs text-gray-700 uppercase bg-slate-200 sticky top-0 z-10">
                                    <tr>
                                        {tableHeader.map(h => (
                                            <th key={h} scope="col" className={`p-0 border-r border-slate-300 last:border-r-0 ${colWidths[h] || ''}`}>
                                                {h === 'Actions' ? (
                                                    <div className="p-3 font-bold">{h}</div>
                                                ) : (
                                                    <Dropdown width="64" trigger={
                                                        <div className="flex items-center justify-between w-full h-full cursor-pointer p-3 hover:bg-slate-300">
                                                            <span className="font-bold truncate">{h}</span>
                                                            {sortConfig.key === h && (sortConfig.direction === 'ascending' ? '▲' : '▼')}
                                                        </div>
                                                    }>
                                                        <HeaderMenu header={h} onSort={(dir) => handleSort(h, dir)} filterConfig={columnFilters[h]} onFilterChange={handleFilterChange}/>
                                                    </Dropdown>
                                                )}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredAndSortedData.map((item, rowIndex) => {
                                        const originalCandidate = item.original;
                                        const displayRow = item.display;
                                        const isDuplicate = duplicateEmails.includes(originalCandidate.email);
                                        return (
                                            <tr key={rowIndex} className={`border-b ${isDuplicate ? 'bg-yellow-100 hover:bg-yellow-200' : 'bg-gray-50 hover:bg-gray-100'}`}>
                                                {displayRow.map((cell, cellIndex) => {
                                                    const headerName = tableHeader[cellIndex];
                                                    
                                                    const tdClasses = "px-4 py-3 border-r border-slate-200 align-middle whitespace-normal break-words";

                                                    if (headerName === 'Full Name') {
                                                        return (
                                                            <td key={cellIndex} className={`${tdClasses} font-medium text-gray-900`}>
                                                                <button onClick={() => handleViewProfileClick(originalCandidate)} className="text-indigo-600 hover:text-indigo-900 hover:underline text-left">
                                                                    {cell}
                                                                </button>
                                                            </td>
                                                        );
                                                    }
                                                    
                                                    if (headerName === 'Skill Set') {
                                                        return (
                                                            <td key={cellIndex} className={tdClasses}>
                                                                <div className="flex flex-wrap gap-1">
                                                                    {Array.isArray(cell) && cell.slice(0, 3).map((skill, i) => (
                                                                        <span key={i} className="px-2 py-1 text-xs font-medium bg-gray-200 text-gray-800 rounded-full">
                                                                            {skill}
                                                                        </span>
                                                                    ))}
                                                                    {Array.isArray(cell) && cell.length > 3 && (
                                                                        <span className="px-2 py-1 text-xs font-medium bg-gray-300 text-gray-900 rounded-full">
                                                                            +{cell.length - 3}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </td>
                                                        );
                                                    }

                                                    return (
                                                        <td key={cellIndex} className={`${tdClasses} font-medium text-gray-900`}>
                                                            {headerName === 'Submission Date' ? formatDate(cell) : cell}
                                                        </td>
                                                    );
                                                })}
                                                {canEditDashboard && (
                                                    <td className="px-4 py-3 border-r border-slate-200 last:border-r-0">
                                                        <button onClick={() => handleEditClick(originalCandidate)} className="text-indigo-600 hover:text-indigo-900 p-1 font-semibold">Edit</button>
                                                    </td>
                                                )}
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
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
        </>
    );
};

export default CandidateDetailsPage;