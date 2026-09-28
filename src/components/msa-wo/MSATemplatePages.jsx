import React from 'react';
// Import the CSS file directly into the component so the styles always apply
import './MSADocumentStyles.css';

const PageHeader = () => (
  <div className="page-header">
    <div className="logo-placeholder">
      {/* Replace src with your actual company logo URL */}
      <img src="https://vmsdashboardea.blob.core.windows.net/images/Company_logo.png?sp=r&st=2026-03-17T13:15:01Z&se=2027-12-30T21:30:01Z&sv=2024-11-04&sr=b&sig=dAq1%2Bxrcn0KMYfrH%2F9OtOfQUZNqrxdZvGwoNFZfcyFY%3D" alt="Taproot Solutions Inc. Logo" style={{ height: '50px' }} />
    </div>
    <div style={{ textAlign: 'right', fontSize: '10pt', fontWeight: 'bold' }}>
      MASTER SERVICES AGREEMENT
    </div>
  </div>
);

const PageFooter = () => (
  <div className="page-footer">
    Taproot Solutions Inc. | 317 Ranch Road 620 South, Suite 302F, Austin, TX 78734 | Contracts@taproot-solutions.com
  </div>
);

const Field = ({ val, placeholder }) => (
  <span style={{ fontWeight: 'bold', color: val ? '#000' : '#e63946' }}>
    {val || `{${placeholder}}`}
  </span>
);

// Explicit Named Export
export const MSATemplatePages = ({ data, margins }) => {
  const customStyle = {
    '--doc-margin-top': `${margins?.top || 25.4}mm`,
    '--doc-margin-bottom': `${margins?.bottom || 25.4}mm`,
    '--doc-margin-left': `${margins?.left || 25.4}mm`,
    '--doc-margin-right': `${margins?.right || 25.4}mm`,
  };

  return (
    <>
      {/* PAGE 1: MSA Core Terms */}
      <div className="a4-page" style={customStyle}>
        <PageHeader />
        <div style={{ flex: 1 }}>
          <h2 style={{ textAlign: 'center', fontSize: '14pt', marginBottom: '20px' }}>MASTER SERVICES AGREEMENT</h2>
          
          <p className="doc-text">
            This MASTER SERVICES AGREEMENT (hereinafter the "Agreement") made and entered into this <Field val={data.CURRENT_DATE} placeholder="CURRENT_DATE" /> (hereinafter the "Effective Date") by and between Taproot Solutions Inc., a Texas corporation, having its principal place of business at 317 Ranch Road 620 South, Suite 302F, Austin, TX 78734, (hereinafter the "Company"), and <Field val={data.vendorName} placeholder="VENDOR_NAME" /> a <Field val={data.state} placeholder="STATE_NAME" /> (Federal Tax ID: <Field val={data.federalId} placeholder="FEDERAL_ID/EIN" />) with its principle office at <Field val={data.companyAddress} placeholder="COMPANY_ADDRESS" /> (hereinafter the "Contractor").
          </p>
          <p className="doc-text">
            "Client" is the business entity (individual, corporation, partnership, government-run, federal organization, limited partnership, joint venture or other business entity) for which Company employed Contractor to provide individual consultants or services to perform consulting services.
          </p>

          <div className="doc-section-title">RECITALS</div>
          <p className="doc-text">
            WHEREAS the Company provides professional services including but not limited to computer advisory assistance, computer software systems analysis and design, and computer software application development; and<br/>
            WHEREAS the Contractor is an individual, partnership, or company that provides professional services including but not limited to computer advisory assistance, computer software systems analysis and design, and computer software application development; and<br/>
            WHEREAS the Company desires to utilize the Services of the Contractor and the Contractor desires to render Services to the Company.
          </p>

          <div className="doc-section-title">AGREEMENT</div>
          <div className="doc-section-title">1. Scope of Service.</div>
          <p className="doc-text">
            The Contractor shall provide consulting services (hereinafter "Services") or shall provide Services through one or more employee/s, subcontractor/s, or consultant/s hired by the Contractor (hereinafter "Consultants") to assist the Contractor during the term of this Agreement with the project's described in the attached work order's (hereinafter the "Work Order" or "Work Orders" or “Consulting Services Purchase Order”), which is/are incorporated herein by reference. Additional Work Orders signed by both parties that specifically cite this Agreement and incorporate it by reference may also be entered into by the parties and be controlled by this Agreement. In the event that any terms and conditions of a Work Order are in conflict with this Agreement, the terms and conditions of the Work Order shall govern. No obligations for Services or costs shall be incurred by either party except in accordance with a Work Order.
          </p>

          <div className="doc-section-title">2. Termination.</div>
          <p className="doc-text">
            The Company can terminate this contract for convenience anytime without any notice. If this agreement is terminated all the Work Orders will be terminated with effective termination date same as this agreement.
          </p>

          <div className="doc-section-title">3. Independent Contractor.</div>
          <p className="doc-text">
             Contractor agrees that any Consultants provided by Contractor are employees or subcontractors of Contractor and are not employees of Company or Client; that Contractor at all times retains the primary control over the Consultants, including the right to recruit, qualify, hire, terminate, set compensation and benefits, establish codes of conduct, monitor, discipline, establish minimum or maximum work hours and other conditions of work; that Contractor’s personnel will not be entitled to any rights, benefits or privileges provided by Company of Client to their own employees; that neither Company nor Client will be liable for payment of employment taxes, workers’ compensation, or other benefits provided to Contractor’s personnel; that Contractor is responsible for these matters and for paying the Consultant in a timely manner and for withholding FICA, FUTA, FIT and similar taxes with respect to the Consultants; and that Contractor’s personnel will abide by the confidentiality and restrictive covenants of this Agreement.
          </p>
        </div>
        <PageFooter />
      </div>

      {/* PAGE 2: Insurance & Financials */}
      <div className="a4-page" style={customStyle}>
        <PageHeader />
        <div style={{ flex: 1 }}>
          <div className="doc-section-title">6. Insurance</div>
          <p className="doc-text">
            Before providing services, Contractor shall provide and maintain in effect throughout the life of this Agreement, and any renewals thereof, Worker’s Compensation insurance in full limits as required by statute applicable to a worker placed at a Client’s location and Employer’s Liability. Such insurance shall name Client and Company as additional insured.<br /><br />
            In addition, Contractor shall maintain in effect, with Company and Client named as additional insured, throughout the term of this Agreement and one year thereafter, at its cost and expense:
          </p>
          <table className="doc-table">
            <tbody>
              <tr>
                <td>Comprehensive General Liability Insurance covering bodily damage and property</td>
                <td>Not less than $1,000,000 per occurrence</td>
              </tr>
              <tr>
                <td>Comprehensive Auto Liability including owned, non-owned and hired car coverage</td>
                <td>Not less than $1,000,000 per occurrence</td>
              </tr>
              <tr>
                <td>Errors and Omissions Liability coverage</td>
                <td>Not less than $1,000,000 per occurrence</td>
              </tr>
              <tr>
                <td>Worker’s Compensation</td>
                <td>As per the laws of the state</td>
              </tr>
            </tbody>
          </table>

          <div className="doc-section-title">8. Fees</div>
          <p className="doc-text">
            In consideration of the Services rendered by the Contractor to the Company hereunder, the Company agrees to pay fees in accordance with the rates set for in the Work Orders except in the event of a good faith dispute as to the calculation or amount owed as stated in the invoice. In the event of a dispute, the Company shall give written notice to Contractor stating the details of any such dispute and shall promptly pay any undisputed amount. The acceptance of partial payment shall not constitute a waiver of payment in full of the disputed amount. Unless otherwise noted in the applicable Work Order, the Company shall be responsible for any and all approved expenses incurred by the Contractor and its Consultants in connection with performance of the Services hereunder.
          </p>

          <div className="doc-section-title">9. Invoicing.</div>
          <p className="doc-text">
            Unless other arrangements are specified in the Work Order, the Contractor shall invoice the Company for its services monthly. Company shall pay Contractor, within thirty (30) days of the receipt of the invoice. Applicable taxes, if any, shall be included in the charges payable by the Company. Invoices received after 60 days of the work performed will not be paid.
          </p>
          
          <div className="doc-section-title">18. Notices.</div>
          <p className="doc-text">Notice required or permitted to be given pursuant to the terms of this Agreement must be sent to the below contact information via email with return receipt or by fax with confirmation or by US Mail or courier. If sent by mail it must be via United States mail, postage prepaid, certified return receipt requested and addressed as provided below, or upon receipt if delivery by any other method:</p>
          <table className="doc-table">
             <tbody>
                 <tr>
                     <td>
                         <strong>Taproot Solutions Inc.</strong><br/>
                         317 Ranch Road 620 South,<br/>
                         Suite 302F, Austin, TX 78734<br/>
                         Email: Contracts@taproot-solutions.com
                     </td>
                     <td>
                         <strong><Field val={data.vendorName} placeholder="VENDOR_NAME" /></strong><br/>
                         <Field val={data.companyAddress} placeholder="COMPANY_ADDRESS" /><br/>
                         Email: <Field val={data.vendorEmail} placeholder="VENDOR_EMAIL_ID" />
                     </td>
                 </tr>
             </tbody>
          </table>
        </div>
        <PageFooter />
      </div>

      {/* PAGE 3: Signatures */}
      <div className="a4-page" style={customStyle}>
        <PageHeader />
        <div style={{ flex: 1 }}>
          <p className="doc-text" style={{ marginTop: '40px' }}>
            The parties mutually agree to the terms and conditions set forth herein. Each party acknowledges that it (i) has read this entire Agreement and (ii) has the full power to execute this Agreement. In witness where of the parties hereto have executed this Agreement as of date written above.
          </p>

          <table className="doc-table" style={{ marginTop: '50px', border: 'none' }}>
            <tbody>
              <tr>
                <td style={{ border: 'none', width: '50%' }}>
                  <strong>Contractor: <Field val={data.vendorName} placeholder="VENDOR_NAME" /></strong><br/><br/>
                  Signature: <br/>
                  <div style={{ borderBottom: '1px solid #000', width: '80%', height: '40px', marginBottom: '10px' }}>
                    {/* Placeholder for Signature */}
                  </div>
                  Name: <Field val={data.authorizedSignatureName} placeholder="Authorized_Signature_Name" /><br/><br/>
                  Title: <Field val={data.authorizedPersonTitle} placeholder="Authorized_Person_Title" /><br/><br/>
                  Date: <Field val={data.CURRENT_DATE} placeholder="CURRENT_DATE" />
                </td>
                <td style={{ border: 'none', width: '50%' }}>
                  <strong>Company: Taproot Solutions INC.</strong><br/><br/>
                  Signature: <br/>
                  <div style={{ borderBottom: '1px solid #000', width: '80%', height: '40px', marginBottom: '10px' }}>
                     {/* Placeholder for Signature */}
                  </div>
                  Name: Purnima Govada<br/><br/>
                  Title: Director<br/><br/>
                  Date: <Field val={data.CURRENT_DATE} placeholder="CURRENT_DATE" />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <PageFooter />
      </div>

      {/* PAGE 4: Work Order */}
      <div className="a4-page" style={customStyle}>
        <PageHeader />
        <div style={{ flex: 1 }}>
          <h2 style={{ textAlign: 'center', fontSize: '14pt', marginBottom: '20px' }}>Consulting Services Purchase Order</h2>
          <p className="doc-text">
            Work to be performed by <strong><Field val={data.vendorName} placeholder="VENDOR_NAME" /></strong> (Contractor) for Taproot Solutions Inc., (Company) in accordance with the Master Services Agreement (Agreement) executed by and between the parties on <strong><Field val={data.CURRENT_DATE} placeholder="CURRENT_DATE" /></strong>, is hereby detailed and such details are incorporated into and do hereby become a part of the aforementioned Consulting Agreement.
          </p>

          <table className="doc-table" style={{ width: '100%', margin: '30px 0' }}>
            <tbody>
              <tr>
                <td style={{ fontWeight: 'bold', width: '40%' }}>Purchase Order #</td>
                <td>Taproot-Subk-<Field val={data.CONTRACT_NUMBER} placeholder="CONTRACT_NUMBER" /></td>
              </tr>
              <tr>
                <td style={{ fontWeight: 'bold' }}>Contractor Resources Assigned:</td>
                <td><Field val={data.candidateName} placeholder="CANDIDATE_NAME" /></td>
              </tr>
              <tr>
                <td style={{ fontWeight: 'bold' }}>Tentative Start Date</td>
                <td><Field val={data.tentativeStartDate} placeholder="Tentative_Start_Date" /></td>
              </tr>
              <tr>
                <td style={{ fontWeight: 'bold' }}>Job Title:</td>
                <td><Field val={data.jobTitle} placeholder="Job_Title_Name" /></td>
              </tr>
              <tr>
                <td style={{ fontWeight: 'bold' }}>Client Name:</td>
                <td><Field val={data.clientName} placeholder="Client_Name" /></td>
              </tr>
              <tr>
                <td style={{ fontWeight: 'bold' }}>Client Location:</td>
                <td><Field val={data.clientLocation} placeholder="Client_Location" /></td>
              </tr>
              <tr>
                <td style={{ fontWeight: 'bold' }}>Type of work</td>
                <td><Field val={data.typeOfServices} placeholder="TYPE_OF_SERVICES" /></td>
              </tr>
              <tr>
                <td style={{ fontWeight: 'bold' }}>Type of Subcontract</td>
                <td>Time and Materials<br/><Field val={data.typeOfSubcontract} placeholder="TYPE_OF_SUBCONTRACT" /></td>
              </tr>
              <tr>
                <td style={{ fontWeight: 'bold' }}>Rate</td>
                <td>$ <Field val={data.rate} placeholder="RATE" /> <Field val={data.perHour} placeholder="PER_HOUR" /></td>
              </tr>
              <tr>
                <td style={{ fontWeight: 'bold' }}>Payment Terms</td>
                <td><Field val={data.net} placeholder="NET" /> days after receipt of acceptable invoice.</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 'bold' }}>Taproot Subcontract Administrator</td>
                <td>Purnima Govada, Director</td>
              </tr>
            </tbody>
          </table>
          
          <table className="doc-table" style={{ marginTop: '50px', border: 'none' }}>
            <tbody>
              <tr>
                <td style={{ border: 'none', width: '50%' }}>
                  <strong>Accepted:</strong><br/>
                  <strong>Contractor: <Field val={data.vendorName} placeholder="VENDOR_NAME" /></strong><br/><br/>
                  Signature: <br/>
                  <div style={{ borderBottom: '1px solid #000', width: '80%', height: '40px', marginBottom: '10px' }}></div>
                  Name: <Field val={data.authorizedSignatureName} placeholder="Authorized_Signature_Name" /><br/><br/>
                  Title: <Field val={data.authorizedPersonTitle} placeholder="Authorized_Person_Title" /><br/><br/>
                  Date: <Field val={data.CURRENT_DATE} placeholder="CURRENT_DATE" />
                </td>
                <td style={{ border: 'none', width: '50%' }}>
                  <strong>Accepted:</strong><br/>
                  <strong>Company: Taproot Solutions INC.</strong><br/><br/>
                  Signature: <br/>
                  <div style={{ borderBottom: '1px solid #000', width: '80%', height: '40px', marginBottom: '10px' }}></div>
                  Name: Purnima Govada<br/><br/>
                  Title: Director<br/><br/>
                  Date: <Field val={data.CURRENT_DATE} placeholder="CURRENT_DATE" />
                </td>
              </tr>
            </tbody>
          </table>

        </div>
        <PageFooter />
      </div>
    </>
  );
};