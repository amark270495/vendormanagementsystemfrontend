import React, { useMemo, useState } from 'react';
import { MSATemplatePages } from '../components/msa-wo/MSATemplatePages';
import {
  DEFAULT_DOCUMENT_DATA,
  DEFAULT_STYLE_CONFIG,
  DEFAULT_TEMPLATE_TEXT,
  TEMPLATE_TEXT_LABELS,
} from '../components/msa-wo/MSATemplateDefinition';
import '../components/msa-wo/MSADocumentStyles.css';

const STORAGE_KEY = 'vms2_msa_template_editor_v2';

const clone = (value) => JSON.parse(JSON.stringify(value));

const MSATemplateEditorPage = () => {
  const saved = useMemo(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }, []);

  const [styles, setStyles] = useState(
    saved?.styles || clone(DEFAULT_STYLE_CONFIG)
  );
  const [documentData, setDocumentData] = useState(
    saved?.documentData || clone(DEFAULT_DOCUMENT_DATA)
  );
  const [templateText, setTemplateText] = useState(
    saved?.templateText || clone(DEFAULT_TEMPLATE_TEXT)
  );
  const [documentMode, setDocumentMode] = useState(
    saved?.documentMode || 'MSA_WO'
  );
  const [logoUrl, setLogoUrl] = useState(saved?.logoUrl || '');
  const [showPageGuides, setShowPageGuides] = useState(false);
  const [selectedTextKey, setSelectedTextKey] = useState('intro');
  const [saveMessage, setSaveMessage] = useState('');

  const updateStyle = (key, value) => {
    setStyles((prev) => ({
      ...prev,
      [key]:
        key === 'footerRuleColor'
          ? value
          : value === ''
          ? ''
          : Number(value),
    }));
  };

  const updateData = (key, value) => {
    setDocumentData((prev) => ({ ...prev, [key]: value }));
  };

  const updateTemplateText = (value) => {
    setTemplateText((prev) => ({
      ...prev,
      [selectedTextKey]: value,
    }));
  };

  const saveTemplate = () => {
    const payload = {
      version: 1,
      savedAt: new Date().toISOString(),
      styles,
      documentData,
      templateText,
      documentMode,
      logoUrl,
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    setSaveMessage(`Saved ${new Date().toLocaleTimeString()}`);
  };

  const resetTemplate = () => {
    const confirmed = window.confirm(
      'Reset the template text, styles, and preview data to defaults?'
    );
    if (!confirmed) return;

    localStorage.removeItem(STORAGE_KEY);
    setStyles(clone(DEFAULT_STYLE_CONFIG));
    setDocumentData(clone(DEFAULT_DOCUMENT_DATA));
    setTemplateText(clone(DEFAULT_TEMPLATE_TEXT));
    setDocumentMode('MSA_WO');
    setLogoUrl('');
    setSaveMessage('Reset to defaults');
  };

  const exportTemplateJson = () => {
    const payload = {
      version: 1,
      exportedAt: new Date().toISOString(),
      styles,
      templateText,
      documentMode,
      logoUrl,
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `vms2-msa-template-${new Date()
      .toISOString()
      .slice(0, 10)}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const printDocument = () => {
    document.body.classList.add('msa-print-mode');

    const cleanup = () => {
      document.body.classList.remove('msa-print-mode');
      window.removeEventListener('afterprint', cleanup);
    };

    window.addEventListener('afterprint', cleanup);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        window.print();
      });
    });
  };

  return (
    <div className="document-editor-layout">
      <aside className="document-sidebar no-print">
        <h1 className="editor-title">MSA / WO Template Editor</h1>
        <p className="editor-subtitle">
          Seven-page source layout, A4 paper, 25.4 mm normal margins, centered
          logo, exact footer, editable legal copy, preview data, and clean
          7-page print/PDF export.
        </p>

        <div className="editor-note">
          The editor saves locally in this browser for now. This tuned version
          uses a new storage key so old experimental font/footer settings do not
          override the source-style defaults. During the VMS 2.0 backend build,
          save the same JSON payload as a versioned template in Azure Storage/Table.
        </div>

        <section className="editor-section">
          <h3>Document</h3>

          <label className="editor-field">
            Package
            <select
              value={documentMode}
              onChange={(event) => setDocumentMode(event.target.value)}
            >
              <option value="MSA_WO">MSA + WO</option>
              <option value="MSA">MSA only</option>
              <option value="WO">WO only</option>
            </select>
          </label>

          <label className="editor-field">
            Logo URL (leave blank to use current Taproot logo)
            <input
              type="url"
              value={logoUrl}
              onChange={(event) => setLogoUrl(event.target.value)}
              placeholder="https://..."
            />
          </label>

          <label className="editor-field">
            <span>
              <input
                type="checkbox"
                checked={showPageGuides}
                onChange={(event) => setShowPageGuides(event.target.checked)}
                style={{ width: 'auto', marginRight: 7 }}
              />
              Show page numbers in preview
            </span>
          </label>
        </section>

        <section className="editor-section">
          <h3>Page style</h3>

          <div className="editor-grid-2">
            <label className="editor-field">
              Top margin (mm)
              <input
                type="number"
                step="0.1"
                value={styles.marginTop}
                onChange={(e) => updateStyle('marginTop', e.target.value)}
              />
            </label>

            <label className="editor-field">
              Bottom margin (mm)
              <input
                type="number"
                step="0.1"
                value={styles.marginBottom}
                onChange={(e) => updateStyle('marginBottom', e.target.value)}
              />
            </label>

            <label className="editor-field">
              Left margin (mm)
              <input
                type="number"
                step="0.1"
                value={styles.marginLeft}
                onChange={(e) => updateStyle('marginLeft', e.target.value)}
              />
            </label>

            <label className="editor-field">
              Right margin (mm)
              <input
                type="number"
                step="0.1"
                value={styles.marginRight}
                onChange={(e) => updateStyle('marginRight', e.target.value)}
              />
            </label>

            <label className="editor-field">
              Font size (pt)
              <input
                type="number"
                step="0.05"
                value={styles.fontSize}
                onChange={(e) => updateStyle('fontSize', e.target.value)}
              />
            </label>

            <label className="editor-field">
              Line height
              <input
                type="number"
                step="0.01"
                value={styles.lineHeight}
                onChange={(e) => updateStyle('lineHeight', e.target.value)}
              />
            </label>

            <label className="editor-field">
              Title size (pt)
              <input
                type="number"
                step="0.5"
                value={styles.titleSize}
                onChange={(e) => updateStyle('titleSize', e.target.value)}
              />
            </label>

            <label className="editor-field">
              Logo width (mm)
              <input
                type="number"
                step="1"
                value={styles.logoWidth}
                onChange={(e) => updateStyle('logoWidth', e.target.value)}
              />
            </label>

            <label className="editor-field">
              Footer font (pt)
              <input
                type="number"
                step="0.25"
                value={styles.footerFontSize}
                onChange={(e) => updateStyle('footerFontSize', e.target.value)}
              />
            </label>

            <label className="editor-field">
              Footer rule
              <input
                type="color"
                value={styles.footerRuleColor}
                onChange={(e) =>
                  updateStyle('footerRuleColor', e.target.value)
                }
              />
            </label>
          </div>
        </section>

        <section className="editor-section">
          <h3>Edit template text</h3>

          <label className="editor-field">
            Section
            <select
              value={selectedTextKey}
              onChange={(event) => setSelectedTextKey(event.target.value)}
            >
              {Object.entries(TEMPLATE_TEXT_LABELS).map(([key, label]) => (
                <option value={key} key={key}>
                  {label}
                </option>
              ))}
            </select>
          </label>

          <label className="editor-field">
            Template copy
            <textarea
              value={templateText[selectedTextKey]}
              onChange={(event) => updateTemplateText(event.target.value)}
            />
          </label>

          <div className="editor-note">
            Keep dynamic fields in double braces, for example{' '}
            <strong>{'{{VENDOR_NAME}}'}</strong> or{' '}
            <strong>{'{{CURRENT_DATE}}'}</strong>.
          </div>
        </section>

        <section className="editor-section">
          <h3>Preview data</h3>

          {[
            ['CURRENT_DATE', 'Current Date'],
            ['vendorName', 'Vendor Name'],
            ['state', 'State'],
            ['federalId', 'Federal ID / EIN'],
            ['companyAddress', 'Company Address'],
            ['vendorEmail', 'Vendor Email'],
            ['CONTRACT_NUMBER', 'Contract Number'],
            ['candidateName', 'Candidate Name'],
            ['tentativeStartDate', 'Tentative Start Date'],
            ['jobTitle', 'Job Title'],
            ['clientName', 'Client Name'],
            ['clientLocation', 'Client Location'],
            ['typeOfServices', 'Type of Services'],
            ['typeOfSubcontract', 'Type of Subcontract'],
            ['rate', 'Rate'],
            ['perHour', 'Rate Unit'],
            ['net', 'Payment Terms (days)'],
            ['authorizedSignatureName', 'Vendor Authorized Signer'],
            ['authorizedPersonTitle', 'Vendor Signer Title'],
            ['vendorSignatureText', 'Vendor Signature Preview'],
            ['companySignatureText', 'Taproot Signature Preview'],
          ].map(([key, label]) => (
            <label className="editor-field" key={key}>
              {label}
              <input
                value={documentData[key] || ''}
                onChange={(event) => updateData(key, event.target.value)}
              />
            </label>
          ))}
        </section>

        <div className="editor-actions">
          <button
            type="button"
            className="editor-button primary"
            onClick={saveTemplate}
          >
            Save Template
          </button>

          <button
            type="button"
            className="editor-button dark"
            onClick={printDocument}
          >
            Print / Export PDF
          </button>
        </div>

        <div className="editor-actions two-columns">
          <button
            type="button"
            className="editor-button light"
            onClick={exportTemplateJson}
          >
            Export JSON
          </button>

          <button
            type="button"
            className="editor-button danger"
            onClick={resetTemplate}
          >
            Reset
          </button>
        </div>

        {saveMessage ? (
          <div className="editor-save-status">{saveMessage}</div>
        ) : null}
      </aside>

      <main className="document-canvas">
        <MSATemplatePages
          data={documentData}
          styles={styles}
          templateText={templateText}
          documentMode={documentMode}
          logoUrl={logoUrl}
          showPageGuides={showPageGuides}
        />
      </main>
    </div>
  );
};

export default MSATemplateEditorPage;
