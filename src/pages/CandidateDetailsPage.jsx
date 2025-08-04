import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../api/apiService';
import Spinner from '../components/Spinner';
import Dropdown from '../components/Dropdown';
import HeaderMenu from '../components/dashboard/HeaderMenu';
import CandidateDetailsModal from '../components/dashboard/CandidateDetailsModal';
import { formatDate } from '../utils/helpers';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const CandidateDetailsPage = () => {
    const { user } = useAuth();
    const [candidates, setCandidates] = useState([]);
    const [duplicateEmails, setDuplicateEmails] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    
    const [generalFilter, setGeneralFilter] = useState('');
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });
    const [columnFilters, setColumnFilters] = useState({});

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [candidateToEdit, setCandidateToEdit] = useState(null);

    const tableHeader = useMemo(() => [
        'Full Name', 'Email', 'Mobile Number', 'Current Role', 
        'Current Location', 'Submitted For (Posting ID)', 'Client Info', 
        'Submitted By', 'Submission Date', 'Actions'
    ], []);

    const loadData = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const result = await apiService.getCandidateDetailsPageData(user.userIdentifier);
            if (result.data.success) {
                setCandidates(result.data.candidates);
                setDuplicateEmails(result.data.duplicateEmails || []);
            } else {
                setError(result.data.message);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to fetch candidate data.');
        } finally {
            setLoading(false);
        }
    }, [user.userIdentifier]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const tableRows = useMemo(() => {
        return candidates.map(c => [
            `${c.firstName} ${c.middleName || ''} ${c.lastName}`.replace(/\s+/g, ' ').trim(),
            c.email, c.mobileNumber, c.currentRole, c.currentLocation,
            c.postingId, c.clientInfo, c.submittedBy, c.submissionDate
        ]);
    }, [candidates]);

    const filteredAndSortedData = useMemo(() => {
        let filteredRows = [...tableRows];
        // General search filter
        if (generalFilter) {
            const lowercasedFilter = generalFilter.toLowerCase();
            filteredRows = filteredRows.filter(row => 
                row.some(cell => String(cell).toLowerCase().includes(lowercasedFilter))
            );
        }

        // Column-specific filters
        if (Object.keys(columnFilters).length > 0) {
            filteredRows = filteredRows.filter(row => {
                return Object.entries(columnFilters).every(([header, config]) => {
                    if (!config || !config.type || !config.value1) return true;
                    const colIndex = tableHeader.indexOf(header);
                    if (colIndex === -1) return true;
                    
                    const cellValue = String(row[colIndex] || '').toLowerCase();
                    const filterValue1 = String(config.value1).toLowerCase();
                    
                    switch (config.type) {
                        case 'contains': return cellValue.includes(filterValue1);
                        case 'not_contains': return !cellValue.includes(filterValue1);
                        case 'equals': return cellValue === filterValue1;
                        default: return true;
                    }
                });
            });
        }

        // Sorting
        if (sortConfig.key) {
            const sortIndex = tableHeader.indexOf(sortConfig.key);
            if (sortIndex !== -1) {
                filteredRows.sort((a, b) => {
                    let valA = a[sortIndex] || '';
                    let valB = b[sortIndex] || '';
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

    const handleSort = (key, direction) => setSortConfig({ key, direction });
    const handleFilterChange = (header, config) => setColumnFilters(prev => ({ ...prev, [header]: config }));

    const handleEditClick = (rowIndex) => {
        const originalIndex = candidates.findIndex(c => c.email === filteredAndSortedData[rowIndex][1] && c.postingId === filteredAndSortedData[rowIndex][5]);
        if (originalIndex !== -1) {
            setCandidateToEdit(candidates[originalIndex]);
            setIsModalOpen(true);
        }
    };

    const handleSaveCandidate = async (formData) => {
        try {
            await apiService.updateCandidateDetails(candidateToEdit.email, formData, user.userIdentifier);
            loadData();
        } catch (error) {
            throw error;
        }
    };

    const downloadPdf = () => {
        const doc = new jsPDF('landscape');
        doc.autoTable({
            head: [tableHeader],
            body: filteredAndSortedData,
        });
        doc.save(`candidate_details_report.pdf`);
    };

    const downloadCsv = () => {
        const csvContent = [
            tableHeader.join(','),
            ...filteredAndSortedData.map(row => 
                row.map(v => `"${String(v || '').replace(/"/g, '""')}"`).join(',')
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
                    />
                     <div className="flex items-center space-x-2">
                        <button onClick={downloadPdf} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Download PDF</button>
                        <button onClick={downloadCsv} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Download CSV</button>
                    </div>
                </div>

                {loading && <div className="flex justify-center items-center h-64"><Spinner /></div>}
                {error && <div className="text-red-500 bg-red-100 p-4 rounded-lg">Error: {error}</div>}
                
                {!loading && !error && (
                    <div className="bg-white rounded-lg shadow-lg border border-gray-200" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left text-gray-500">
                                <thead className="text-xs text-gray-700 uppercase bg-slate-200 sticky top-0 z-10">
                                    <tr>
                                        {tableHeader.map(h => (
                                            <th key={h} scope="col" className="p-0 border-r border-slate-300 last:border-r-0">
                                                {h === 'Actions' ? (
                                                    <div className="p-3 font-bold">{h}</div>
                                                ) : (
                                                    <Dropdown width="64" trigger={
                                                        <div className="flex items-center justify-between w-full h-full cursor-pointer p-3 hover:bg-slate-300">
                                                            <span className="font-bold">{h}</span>
                                                            {sortConfig.key === h && (sortConfig.direction === 'ascending' ? ' ▲' : ' ▼')}
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
                                    {filteredAndSortedData.map((row, rowIndex) => {
                                        const emailIndex = tableHeader.indexOf('Email');
                                        const email = row[emailIndex];
                                        const isDuplicate = duplicateEmails.includes(email);
                                        return (
                                            <tr key={rowIndex} className={`border-b ${isDuplicate ? 'bg-yellow-100 hover:bg-yellow-200' : 'bg-gray-50 hover:bg-gray-100'}`}>
                                                {row.map((cell, cellIndex) => (
                                                    <td key={cellIndex} className="px-4 py-3 border-r border-slate-200 last:border-r-0 font-medium text-gray-900 align-middle">
                                                        {tableHeader[cellIndex] === 'Submission Date' ? formatDate(cell) : cell}
                                                    </td>
                                                ))}
                                                <td className="px-4 py-3 border-r border-slate-200 last:border-r-0">
                                                    <button onClick={() => handleEditClick(rowIndex)} className="text-indigo-600 hover:text-indigo-900 p-1 font-semibold">Edit</button>
                                                </td>
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
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                onSave={handleSaveCandidate}
                candidateToEdit={candidateToEdit}
            />
        </>
    );
};

export default CandidateDetailsPage;