import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../api/apiService';
import Spinner from '../components/Spinner';
import { formatDate } from '../utils/helpers';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const CandidateDetailsPage = () => {
    const { user } = useAuth();
    const [data, setData] = useState({ header: [], rows: [] });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [generalFilter, setGeneralFilter] = useState('');

    const loadData = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const result = await apiService.getCandidateDetailsPageData(user.userIdentifier);
            if (result.data.success) {
                setData({ header: result.data.header, rows: result.data.rows });
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

    const filteredData = useMemo(() => {
        if (!generalFilter) {
            return data.rows;
        }
        const lowercasedFilter = generalFilter.toLowerCase();
        return data.rows.filter(row => 
            row.some(cell => String(cell).toLowerCase().includes(lowercasedFilter))
        );
    }, [data.rows, generalFilter]);

    const downloadPdf = () => {
        const doc = new jsPDF('landscape');
        doc.autoTable({
            head: [data.header],
            body: filteredData,
        });
        doc.save(`candidate_details_report.pdf`);
    };

    const downloadCsv = () => {
        const csvContent = [
            data.header.join(','),
            ...filteredData.map(row => 
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
                                    {data.header.map(h => (
                                        <th key={h} scope="col" className="px-4 py-3 border-r border-slate-300 last:border-r-0 font-bold">
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {filteredData.map((row, rowIndex) => (
                                    <tr key={rowIndex} className="bg-gray-50 border-b hover:bg-gray-100">
                                        {row.map((cell, cellIndex) => {
                                            const headerName = data.header[cellIndex];
                                            return (
                                                <td key={cellIndex} className="px-4 py-3 border-r border-slate-200 last:border-r-0 font-medium text-gray-900 align-middle">
                                                    {headerName === 'Submission Date' ? formatDate(cell) : cell}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CandidateDetailsPage;