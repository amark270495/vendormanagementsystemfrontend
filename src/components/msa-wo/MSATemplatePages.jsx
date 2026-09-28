import React, { useState, useEffect } from 'react';
import './MSADocumentStyles.css';
import { MSATemplatePages } from './MSATemplatePages';

export const MSADocumentEditor = () => {
  // 1. Setup Margin State (Default MS Word Margins: 25.4mm / 1 inch)
  const [margins, setMargins] = useState({
    top: 25.4,
    bottom: 25.4,
    left: 25.4,
    right: 25.4
  });

  // 2. Document Data State (This would normally come from your Backend/API)
  const [documentData, setDocumentData] = useState({
    CURRENT_DATE: '',
    VENDOR_NAME: '',
    STATE_NAME: '',
    FEDERAL_ID: '',
    COMPANY_ADDRESS: '',
    VENDOR_EMAIL: '',
    CONTRACT_NUMBER: '',
    CANDIDATE_NAME: '',
    Tentative_Start_Date: '',
    Job_Title_Name: '',
    Client_Name: '',
    Client_Location: '',
    TYPE_OF_SERVICES: '',
    TYPE_OF_SUBCONTRACT: '',
    RATE: '',
    PER_HOUR: '/ Hour',
    NET: '30'
  });

  // Simulated Backend Fetch on Mount
  useEffect(() => {
    const fetchBackendData = async () => {
      // Simulate API call: await axios.get('/api/msa-data/123');
      const mockBackendResponse = {
        CURRENT_DATE: 'September 28, 2026',
        VENDOR_NAME: 'Acme Solutions LLC',
        STATE_NAME: 'Texas',
        FEDERAL_ID: '12-3456789',
        COMPANY_ADDRESS: '123 Tech Lane, Dallas, TX 75201',
        VENDOR_EMAIL: 'legal@acmesolutions.com',
        CONTRACT_NUMBER: 'PO-2026-009',
        CANDIDATE_NAME: 'John Doe',
        Tentative_Start_Date: 'October 15, 2026',
        Job_Title_Name: 'Senior Data Engineer',
        Client_Name: 'Global Corp',
        Client_Location: 'Remote',
        TYPE_OF_SERVICES: 'Software Development',
        TYPE_OF_SUBCONTRACT: 'B2B Corp-to-Corp',
        RATE: '85.00',
        PER_HOUR: '/ Hour',
        NET: '45'
      };
      setDocumentData(mockBackendResponse);
    };
    fetchBackendData();
  }, []);

  const handleMarginChange = (e) => {
    const { name, value } = e.target;
    setMargins(prev => ({ ...prev, [name]: Number(value) }));
  };

  const exportToPDF = () => {
    // Triggers the browser's print dialog. 
    // The CSS @media print handles stripping the UI and formatting exact A4 pages.
    window.print();
  };

  return (
    <div className="document-editor-layout">
      {/* SIDEBAR: Configuration & UI (Hidden on Print) */}
      <div className="document-sidebar no-print">
        <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '20px' }}>
          Document Setup
        </h2>

        <div style={{ marginBottom: '30px' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 'bold', marginBottom: '10px' }}>Margins (mm)</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <label>
              Top:
              <input type="number" name="top" value={margins.top} onChange={handleMarginChange} style={{ width: '100%', padding: '5px' }} />
            </label>
            <label>
              Bottom:
              <input type="number" name="bottom" value={margins.bottom} onChange={handleMarginChange} style={{ width: '100%', padding: '5px' }} />
            </label>
            <label>
              Left:
              <input type="number" name="left" value={margins.left} onChange={handleMarginChange} style={{ width: '100%', padding: '5px' }} />
            </label>
            <label>
              Right:
              <input type="number" name="right" value={margins.right} onChange={handleMarginChange} style={{ width: '100%', padding: '5px' }} />
            </label>
          </div>
        </div>

        <button 
          onClick={exportToPDF}
          style={{ width: '100%', padding: '10px', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
        >
          Export to PDF / Print
        </button>
      </div>

      {/* CANVAS: The actual document rendering */}
      <div className="document-canvas">
        <MSATemplatePages data={documentData} margins={margins} />
      </div>
    </div>
  );
};