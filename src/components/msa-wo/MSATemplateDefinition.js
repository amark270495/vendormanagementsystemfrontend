export const DEFAULT_STYLE_CONFIG = {
  marginTop: 25.4,
  marginBottom: 25.4,
  marginLeft: 25.4,
  marginRight: 25.4,
  fontSize: 10.5,
  lineHeight: 1.06,
  titleSize: 14.5,
  sectionTitleSize: 10.5,
  footerFontSize: 8.25,
  logoWidth: 86,
  footerRuleColor: '#6f2a2a',
};

export const DEFAULT_DOCUMENT_DATA = {
  CURRENT_DATE: new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }),
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
  authorizedPersonTitle: 'CEO',
  vendorSignatureText: '',
  companySignatureText: '',
};

export const FIELD_MAP = {
  'CURRENT_DATE': { key: 'CURRENT_DATE', placeholder: 'CURRENT_DATE' },
  'VENDOR_NAME': { key: 'vendorName', placeholder: 'VENDOR_NAME' },
  'VENDOR NAME': { key: 'vendorName', placeholder: 'VENDOR NAME' },
  'STATE_NAME': { key: 'state', placeholder: 'STATE_NAME' },
  'FEDERAL_ID/EIN': { key: 'federalId', placeholder: 'FEDERAL_ID/EIN' },
  'COMPANY_ADDRESS': { key: 'companyAddress', placeholder: 'COMPANY_ADDRESS' },
  'VENDOR_EMAIL_ID': { key: 'vendorEmail', placeholder: 'VENDOR_EMAIL_ID' },
  'CONTRACT_NUMBER': { key: 'CONTRACT_NUMBER', placeholder: 'CONTRACT_NUMBER' },
  'CANDIDATE_NAME': { key: 'candidateName', placeholder: 'CANDIDATE_NAME' },
  'Tentative_Start_Date': { key: 'tentativeStartDate', placeholder: 'Tentative_Start_Date' },
  'Job_Title_Name': { key: 'jobTitle', placeholder: 'Job_Title_Name' },
  'Client_Name': { key: 'clientName', placeholder: 'Client_Name' },
  'Client_Location': { key: 'clientLocation', placeholder: 'Client_Location' },
  'TYPE_OF_SERVICES': { key: 'typeOfServices', placeholder: 'TYPE_OF_SERVICES' },
  'TYPE_OF_SUBCONTRACT': { key: 'typeOfSubcontract', placeholder: 'TYPE_OF_SUBCONTRACT' },
  'RATE': { key: 'rate', placeholder: 'RATE' },
  'PER_HOUR': { key: 'perHour', placeholder: 'PER_HOUR' },
  'NET': { key: 'net', placeholder: 'NET' },
  'Authorized_Signature_Name': { key: 'authorizedSignatureName', placeholder: 'Authorized_Signature_Name' },
  'Authorized_Person_Title': { key: 'authorizedPersonTitle', placeholder: 'Authorized_Person_Title' },
};

export const DEFAULT_TEMPLATE_TEXT = {
  intro:
    'This MASTER SERVICES AGREEMENT (hereinafter the "Agreement") made and entered into this {{CURRENT_DATE}} (hereinafter the "Effective Date") by and between Taproot Solutions Inc., a Texas corporation, having its principal place of business at 317 Ranch Road 620 South, Suite 302F, Austin, TX 78734, (hereinafter the "Company\'), and {{VENDOR_NAME}} a {{STATE_NAME}} (Federal Tax ID: {{FEDERAL_ID/EIN}}) with its principle office at {{COMPANY_ADDRESS}} (hereinafter the "Contractor").',

  clientDefinition:
    '"Client" is the business entity (individual, corporation, partnership, government-run, federal organization, limited partnership, joint venture or other business entity) for which Company employed Contractor to provide individual consultants or services to perform consulting services.',

  recital1:
    'WHEREAS the Company provides professional services including but not limited to computer advisory assistance, computer software systems analysis and design, and computer software application development; and',

  recital2:
    'WHEREAS the Contractor is an individual, partnership, or company that provides professional services including but not limited to computer advisory assistance, computer software systems analysis and design, and computer software application development; and',

  recital3:
    'WHEREAS the Company desires to utilize the Services of the Contractor and the Contractor desires to render Services to the Company.',

  recital4:
    'NOW, THEREFORE, for good and valuable consideration, the receipt and sufficiency of which is acknowledged, the parties hereto, intending to be legally bound hereby, do hereby promise and agree as follows:',

  clause1:
    'The Contractor shall provide consulting services (hereinafter "Services") or shall provide Services through one or more employee/s, subcontractor/s, or consultant/s hired by the Contractor (hereinafter "Consultants") to assist the Contractor during the term of this Agreement with the project\'s described in the attached work order\'s (hereinafter the "Work Order" or "Work Orders" or “Consulting Services Purchase Order”), which is/are incorporated herein by reference. Additional Work Orders signed by both parties that specifically cite this Agreement and incorporate it by reference may also be entered into by the parties and be controlled by this Agreement. In the event that any terms and conditions of a Work Order are in conflict with this Agreement, the terms and conditions of the Work Order shall govern. No obligations for Services or costs shall be incurred by either party except in accordance with a Work Order.',

  clause2:
    'The Company can terminate this contract for convenience anytime without any notice. If this agreement is terminated all the Work Orders will be terminated with effective termination date same as this agreement',

  clause3a:
    'Contractor agrees that any Consultants provided by Contractor are employees or subcontractors of Contractor and are not employees of Company or Client; that Contractor at all times retains the primary',

  clause3b:
    'control over the Consultants, including the right to recruit, qualify, hire, terminate, set compensation and benefits, establish codes of conduct, monitor, discipline, establish minimum or maximum work hours and other conditions of work; that Contractor’s personnel will not be entitled to any rights, benefits or privileges provided by Company of Client to their own employees; that neither Company nor Client will be liable for payment of employment taxes, workers’ compensation, or other benefits provided to Contractor’s personnel; that Contractor is responsible for these matters and for paying the Consultant in a timely manner and for withholding FICA, FUTA, FIT and similar taxes with respect to the Consultants; and that Contractor’s personnel will abide by the confidentiality and restrictive covenants of this Agreement. Contractor shall indemnify and hold harmless Company from all damages, costs and expenses (including reasonable attorney’s fees) resulting from any claims by Contractor’s personnel that any such personnel benefits are covered by the Client’s or Company’s employee benefit plans. The Contractor shall maintain all necessary personnel and payroll records for Consultants assigned to Client including creating and maintaining any records necessary to comply with the Immigration Reform and Control Act of 1986. The Contractor shall maintain in effect, during the term any and all federal, state and/or local licenses and permits that may be required of employers generally or of the Contractor to supply Consultants to Client, according to the terms of this Agreement.',

  clause4a:
    'The Contractor and its Consultants providing Services to the Company or its Clients shall treat as confidential any information disclosed by the Company or its Clients, including but not limited to all personal information, mailing lists, proprietary data, product designs, capabilities, specifications, program code, software systems and processes, information regarding existing and future technical, business and marketing plans and product strategies, and the identity of actual and potential customers and suppliers (hereinafter "Confidential Information"). Confidential Information may be written, oral, recorded, or contained on tape or other electronic or mechanical media.',

  clause4b:
    'Confidential Information shall not include information which (i) is in or has entered the public domain through no breach of this Agreement or other wrongful act of Contractor or it\'s Consultants; (ii) has been rightfully received from a third party without breach of this Agreement; (iii) has been approved for release by written authorization of the Company or its Clients; or (iv) is required to be disclosed pursuant to the final binding order of a governmental agency or court of competent jurisdiction, provided that the Company or its Clients have been given reasonable notice of the issue of such an order and the opportunity to contest it.',

  clause5Intro:
    'Contractor shall submit proof of each of the following requirements (referred to individually as a “Requirement” or collectively as the “Requirements”) to Company (i) prior to providing Services and (ii) at least fifteen (15) days prior to the expiration of proof of any Requirement:',

  clause6a:
    'Before providing services, Contractor shall provide and maintain in effect throughout the life of this Agreement, and any renewals thereof, Worker’s Compensation insurance in full limits as required by statute applicable to a worker placed at a Client’s location and Employer’s Liability. Such insurance shall name Client and Company as additional insured.',

  clause6b:
    'In addition, Contractor shall maintain in effect, with Company and Client named as additional insured, throughout the term of this Agreement and one year thereafter, at its cost and expense:',

  clause7a:
    'During the term of Contractor’s performance of services for a client on behalf of Company and for one year after the termination of the performance of such services, Contractor agrees that it will not, provide or attempt to provide (or advise others of the opportunity to provide) its employees to any other vendor to client other than through Company, directly or indirectly, any services to such Client. This agreement takes precedence over any other existing contracts the Contractor (or its employees) may have with the Client or its vendors.',

  clause7b:
    'For the purposes of this clause 7, the term “Client” includes any customers, contractors, subcontractors, or clients of the Client for whom Contractor’s Consultants performed services or for whom Company proposed to Client that Contractor would perform services.',

  clause7c:
    'The “restricted period” shall begin on the later of the date of the last performance of services by Contractor for the Client or the date of the last proposal submitted by Company to Client proposing the use of Contractor. The Restricted Period shall end on the latest of the following dates: (1) one year from the date the “restricted period” began, or (1) one year from the date on which an interview with the Client and Contractor or any Consultant of Contractor arranged by Company took place.',

  clause7d:
    'The “restricted location” shall be any Client facility / client business unit where the Contractor’s Consultants’ performed services, were assigned to perform services, or were introduced to or interviewed by the Client to perform services during the last twelve (12) months of the performance of such services.',

  clause7e:
    'Throughout the duration of this Agreement, and for a period of one (1) year after termination or expiration of this Agreement, Contractor shall not directly nor indirectly compete with the business of Company for any follow-on contract or other State or federal government contracts for the services or work provided by the Contractor under this agreement. Contractor acknowledges that Company may in reliance of this Agreement, provide Contractor access to trade secrets, customers and their confidential data and that the provisions of this Agreement are reasonably necessary to protect Taproot Solutions Inc. Contractor agrees to retain said information as confidential and not to use said information for Contractor’s own behalf.',

  clause8:
    'In consideration of the Services rendered by the Contractor to the Company hereunder, the Company agrees to pay fees in accordance with the rates set for in the Work Orders except in the event of a good faith dispute as to the calculation or amount owed as stated in the invoice. In the event of a dispute, the Company shall give written notice to Contractor stating the details of any such dispute and shall promptly pay any undisputed amount. The acceptance of partial payment shall not constitute a waiver of payment in full of the disputed amount. Unless otherwise noted in the applicable Work Order, the Company shall be responsible for any and all approved expenses incurred by the Contractor and its Consultants in connection with performance of the Services hereunder.',

  clause9:
    'Unless other arrangements are specified in the Work Order, the Contractor shall invoice the Company for its services monthly. Company shall pay Contractor, within thirty (30) days of the receipt of the invoice. Applicable taxes, if any, shall be included in the charges payable by the Company. Invoices received after 60 days of the work performed will not be paid.',

  clause10Intro:
    'With respect to the Services, the Contractor warrants to the Company that:',

  clause10a:
    'The Contractor and its Consultants shall perform the Service according to the terms and conditions of this Agreement and in conformity with accepted standards and ethics of the Contractor\'s profession; and',

  clause10b:
    'The Contractor has the technical ability, expertise, manpower, and is in a position to perform hereunder. No other job previously or subsequently undertaken by Contractor will be given priority over the Services; and',

  clause10c:
    'The Contractor is an individual or a duly formed corporation, limited liability company, partnership, or sole proprietorship in good standing under laws of the State of incorporation or organization and that the Contractor is qualified to transact business in all locations where the ownership of its properties or the nature of its operation requires such qualification; and',

  clause10d:
    'The Contractor has full power and authority to enter into and perform the Agreement, that the execution and delivery of the Agreement have been duly authorized, that the Agreement does not violate any law statute or regulation, and that the Agreement does not breach any other agreement or covenant to which Contractor is a party or to which it is bound.',

  clause11:
    'Contractor hereby releases and agrees to indemnify and hold harmless the Company, it\'s officers, agents and employees from any and all liabilities damages, losses, expenses, demands, claims, suits or judgments, including reasonable attorneys\' fees, costs and expenses relating to third party claims arising out of the negligent or intentional acts or omissions of Contractor, agents or employees, including Consultants. If any claim by a third party based upon alleged infringement of a patent, copyright or trade secret is asserted against the Company by virtue of the user of the software or other programming documentation developed hereunder, Contractor will indemnify and hold the Company harmless against damages, reasonable attorneys\' fees, costs associated with the investigation, preparation, defense and/or settlement of such claim.',

  clause12a:
    'Contractor must maintain complete and accurate records of, and supporting documentation for (a) work performed by Contractor and Contractor Personnel; and (b) the amounts billable to and payments made by Company hereunder in accordance with generally accepted accounting principles applied on a consistent basis. Contractor agrees to provide Company with documentation and other information with respect to each invoice as may be reasonably requested by Company to verify accuracy and compliance with the provisions of this Agreement. Following reasonable written notice to Contractor, Company or',

  clause12b:
    'its agents may conduct an audit, during regular business hours, of the books and records maintained by Contractor for Company to verify Contractor’s compliance with this Agreement and the accuracy of charges during the term of this Agreement and for four (4) years after expiration of the Services provided for in this Agreement. Contractor shall reasonably cooperate with Company audits, including, without limitation, making applicable data available in a reasonably requested format. Audits shall be completed not more frequently than once per year, absent reasonable suspicion that a breach has occurred. Costs of the audit will be at Company\'s expense, except that Company will not be required to reimburse Contractor for Contractor’s internal costs of complying with the audit. However, if an audit discloses that monies were incorrectly paid to Contractor then, upon written demand from Company, Contractor will promptly reimburse such monies to Company, and if the overpayment is two percent (2%) or more of the proper and accurate amount due, Contractor will reimburse Company for the cost of the audit, in addition to any other remedies Company may have.',

  clause13:
    'Neither the Contractor nor its Consultants shall have any right, power, or authority to create any obligation, express or implied, or make any representations on behalf of the Company except as the Contractor or its Consultant may be expressly authorized by the Company in advance in a writing signed by the Company and then only to the extent of such authorization.',

  clause14:
    'This Agreement may not be assigned by the either party without prior written consent of the other party.',

  clause15:
    'This Agreement shall be governed by the laws of the State of Texas without regard to conflicts of law principles and the parties agree to submit to the jurisdiction of the courts of the State of Texas.',

  clause16:
    'Contractor shall not be responsible to provide services herein if such failure is due to any cause or condition beyond the consultant’s control.',

  clause17:
    'If any portion of this Agreement shall be held valid or void, such portion shall be deemed modified to the extent necessary to render such provision enforceable under the law, and this Agreement shall remain valid and enforceable as so modified. In the event that the portion of this Agreement in question may not be modified in such a way as to make it enforceable, the Agreement shall be construed as if the portion so invalidated was not part of this Agreement',

  clause18:
    'A waiver by either party of any breach of this Agreement by the other party shall not be construed as a waiver of the other provisions of this Agreement or as a waiver of any such subsequent breach by such a party of the same or any other provisions of this Agreement.',

  clause19:
    'The Contractor and the Company shall cooperate and take such actions and execute and deliver such documents as may be reasonably necessary to carry out the provisions and purposes of this Agreement.',

  clause20:
    'The headings used in the Agreement are for reference purposes only and shall not be deemed a substantive part of this Agreement.',

  clause21:
    'The parties agree that in regards to all their respective dealings under this Agreement, they shall act fairly and in good faith.',

  clause22:
    'This Agreement supersedes and cancels any previous written, oral or implied agreements between the parties. This Agreement expresses the complete and final understanding of the parties related to the Services and may not be changed in any way except in writing signed by both parties. This Agreement may be executed in one or more counterparts all of which shall collectively comprise the final executed and binding Agreement.',

  clause23:
    'Notice required or permitted to be given pursuant to the terms of this Agreement must be sent to the below contact information via email with return receipt or by fax with confirmation or by US Mail or courier. If sent by mail it must be via United States mail, postage prepaid, certified return receipt requested and addressed as provided below, or upon receipt if delivery by any other method:',

  executionParagraph:
    'The parties mutually agree to the terms and conditions set forth herein. Each party acknowledges that it (i) has read this entire Agreement and (ii) has the full power to execute this Agreement. In witness where of the parties hereto have executed this Agreement as of date written above.',

  woIntro:
    'Work to be performed by {{VENDOR NAME}} (Contractor) for Taproot Solutions Inc., (Company) in accordance with the Master Services Agreement (Agreement) executed by and between the parties on {{CURRENT_DATE}}, is hereby detailed and such details are incorporated into and do hereby become a part of the aforementioned Consulting Agreement.',
};

export const TEMPLATE_TEXT_LABELS = {
  intro: 'Page 1 - Intro',
  clientDefinition: 'Page 1 - Client Definition',
  recital1: 'Page 1 - Recital 1',
  recital2: 'Page 1 - Recital 2',
  recital3: 'Page 1 - Recital 3',
  recital4: 'Page 1 - Recital Closing',
  clause1: 'Clause 1 - Scope of Service',
  clause2: 'Clause 2 - Termination',
  clause3a: 'Clause 3 - Independent Contractor (Page 1)',
  clause3b: 'Clause 3 - Independent Contractor (Page 2)',
  clause4a: 'Clause 4 - Confidentiality (1)',
  clause4b: 'Clause 4 - Confidentiality (2)',
  clause5Intro: 'Clause 5 - Requirements Intro',
  clause6a: 'Clause 6 - Insurance (1)',
  clause6b: 'Clause 6 - Insurance (2)',
  clause7a: 'Clause 7(a)',
  clause7b: 'Clause 7(b)',
  clause7c: 'Clause 7(c)',
  clause7d: 'Clause 7(d)',
  clause7e: 'Clause 7(e)',
  clause8: 'Clause 8 - Fees',
  clause9: 'Clause 9 - Invoicing',
  clause10Intro: 'Clause 10 - Intro',
  clause10a: 'Clause 10(a)',
  clause10b: 'Clause 10(b)',
  clause10c: 'Clause 10(c)',
  clause10d: 'Clause 10 - Authority paragraph',
  clause11: 'Clause 11 - Indemnity',
  clause12a: 'Clause 12 - Audit (Page 4)',
  clause12b: 'Clause 12 - Audit (Page 5)',
  clause13: 'Clause 13 - Authority',
  clause14: 'Clause 14 - Assignment',
  clause15: 'Clause 15 - Governing Law',
  clause16: 'Clause 16 - Force Majeure',
  clause17: 'Clause 17 - Partial Invalidity',
  clause18: 'Clause 18 - No waiver',
  clause19: 'Clause 19 - Cooperation',
  clause20: 'Clause 20 - Headings',
  clause21: 'Clause 21 - Good Faith',
  clause22: 'Clause 22 - Entire Agreement',
  clause23: 'Clause 23 - Notices',
  executionParagraph: 'Execution paragraph',
  woIntro: 'Work Order - Intro',
};
