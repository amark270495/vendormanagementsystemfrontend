import React, { useState } from 'react';
import { MSATemplatePages } from '../components/msa-wo/MSATemplatePages';
import '../components/msa-wo/MSADocumentStyles.css';

const MSATemplateEditorPage = () => {
  // Setup Margin State (Default MS Word Margins: 25.4mm / 1 inch)
  const [margins, setMargins] = useState({
    top: 25.4,
    bottom: 25.4,
    left: 25.4,
    right: 25.4
  });

  // Dummy data so you can see exactly how the template looks when populated
  const [documentData, setDocumentData] = useState({
    CURRENT_DATE: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
    vendorName: 'Acme Solutions LLC',
    state: 'Texas',
    federalId: '12-3456789',
    companyAddress: '123 Tech Lane, Dallas, TX 75201',
    vendorEmail: 'legal@acmesolutions.com',
    CONTRACT_NUMBER: '99887',
    candidateName: 'John Doe',
    tentativeStartDate: '10/15/2026',
    jobTitle: 'Senior Data Engineer',
    clientName: 'Global Corp',
    clientLocation: 'Remote',
    typeOfServices: 'IT Consulting',
    typeOfSubcontract: 'Time and Materials',
    rate: '85.00',
    perHour: 'PER HOUR',
    net: '30',
    authorizedSignatureName: 'Jane Smith',
    authorizedPersonTitle: 'CEO'
  });

  const handleMarginChange = (e) => {
    const { name, value } = e.target;
    setMargins(prev => ({ ...prev, [name]: Number(value) }));
  };

  const exportToPDF = () => {
    // Triggers the browser's print dialog which respects the CSS @media print
    window.print();
  };

  return (
    <div className="document-editor-layout">
      {/* SIDEBAR: Configuration & UI (Hidden on Print) */}
      <div className="document-sidebar no-print">
        <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '20px' }}>
          MSA Template Editor
        </h2>
        <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '20px' }}>
          Use this page to preview the document formatting and adjust margins before printing or PDF extraction.
        </p>

        <div style={{ marginBottom: '30px' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 'bold', marginBottom: '10px' }}>Margins (mm)</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <label className="text-sm font-medium">
              Top:
              <input type="number" step="0.1" name="top" value={margins.top} onChange={handleMarginChange} className="mt-1 block w-full border border-gray-300 rounded p-2" />
            </label>
            <label className="text-sm font-medium">
              Bottom:
              <input type="number" step="0.1" name="bottom" value={margins.bottom} onChange={handleMarginChange} className="mt-1 block w-full border border-gray-300 rounded p-2" />
            </label>
            <label className="text-sm font-medium">
              Left:
              <input type="number" step="0.1" name="left" value={margins.left} onChange={handleMarginChange} className="mt-1 block w-full border border-gray-300 rounded p-2" />
            </label>
            <label className="text-sm font-medium">
              Right:
              <input type="number" step="0.1" name="right" value={margins.right} onChange={handleMarginChange} className="mt-1 block w-full border border-gray-300 rounded p-2" />
            </label>
          </div>
        </div>

        <button 
          onClick={exportToPDF}
          className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow transition-colors"
        >
          Print / Export layout to PDF
        </button>
      </div>

      {/* CANVAS: The actual document rendering */}
      <div className="document-canvas">
        <MSATemplatePages data={documentData} margins={margins} />
      </div>
    </div>
  );
};

export default MSATemplateEditorPage;