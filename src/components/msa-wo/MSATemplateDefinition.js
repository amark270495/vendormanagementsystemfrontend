// src/components/msa-wo/MSATemplateDefinition.js

export const TEMPLATE_STORAGE_KEY =
  "vms2_msa_wo_wysiwyg_templates_v1";

export const DEFAULT_LOGO_URL =
  "https://vmsdashboardea.blob.core.windows.net/images/Company_logo.png?sp=r&st=2026-03-17T13:15:01Z&se=2027-12-30T21:30:01Z&sv=2024-11-04&sr=b&sig=dAq1%2Bxrcn0KMYfrH%2F9OtOfQUZNqrxdZvGwoNFZfcyFY%3D";

export const DEFAULT_FOOTER_TEXT =
  "317 Ranch Road 620 South, Suite 302F | Austin, TX 78734 | (408) 216-7968 |info@taproot-solutions.com";

export const DEFAULT_STYLE_CONFIG = {
  marginTop: 25.4,
  marginBottom: 25.4,
  marginLeft: 25.4,
  marginRight: 25.4,

  fontFamily: '"Times New Roman", Times, serif',
  fontSize: 10.5,
  lineHeight: 1.06,

  titleSize: 14.5,
  sectionTitleSize: 10.5,

  footerFontSize: 8.25,
  footerRuleColor: "#6f2a2a",
  footerRuleWidth: 1.2,

  logoWidth: 86,
};

export const DEFAULT_DOCUMENT_DATA = {
  CURRENT_DATE: new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }),

  vendorName: "Acme Solutions LLC",
  state: "Texas",
  federalId: "12-3456789",
  companyAddress: "123 Tech Lane, Dallas, TX 75201",
  vendorEmail: "legal@acmesolutions.com",

  CONTRACT_NUMBER: "99887",

  candidateName: "John Doe",
  tentativeStartDate: "10/15/2026",
  jobTitle: "Senior Data Engineer",

  clientName: "Global Corp",
  clientLocation: "Remote",

  typeOfServices: "IT Consulting",
  typeOfSubcontract: "C2C",

  rate: "85.00",
  perHour: "PER HOUR",
  net: "30",

  authorizedSignatureName: "Jane Smith",
  authorizedPersonTitle: "CEO",

  vendorSignatureText: "",
  companySignatureText: "",
};

export const DYNAMIC_FIELDS = [
  {
    token: "CURRENT_DATE",
    label: "Current Date",
    dataKey: "CURRENT_DATE",
    group: "Contract",
  },

  {
    token: "VENDOR_NAME",
    label: "Vendor Name",
    dataKey: "vendorName",
    group: "Vendor",
  },

  {
    token: "STATE_NAME",
    label: "Vendor State",
    dataKey: "state",
    group: "Vendor",
  },

  {
    token: "FEDERAL_ID_EIN",
    label: "Vendor EIN",
    dataKey: "federalId",
    group: "Vendor",
  },

  {
    token: "COMPANY_ADDRESS",
    label: "Vendor Address",
    dataKey: "companyAddress",
    group: "Vendor",
  },

  {
    token: "VENDOR_EMAIL_ID",
    label: "Vendor Email",
    dataKey: "vendorEmail",
    group: "Vendor",
  },

  {
    token: "AUTHORIZED_SIGNATURE_NAME",
    label: "Authorized Signer Name",
    dataKey: "authorizedSignatureName",
    group: "Vendor",
  },

  {
    token: "AUTHORIZED_PERSON_TITLE",
    label: "Authorized Signer Title",
    dataKey: "authorizedPersonTitle",
    group: "Vendor",
  },

  {
    token: "CONTRACT_NUMBER",
    label: "Contract Number",
    dataKey: "CONTRACT_NUMBER",
    group: "Work Order",
  },

  {
    token: "CANDIDATE_NAME",
    label: "Candidate Name",
    dataKey: "candidateName",
    group: "Candidate",
  },

  {
    token: "TENTATIVE_START_DATE",
    label: "Tentative Start Date",
    dataKey: "tentativeStartDate",
    group: "Candidate",
  },

  {
    token: "JOB_TITLE_NAME",
    label: "Job Title",
    dataKey: "jobTitle",
    group: "Candidate",
  },

  {
    token: "CLIENT_NAME",
    label: "Client Name",
    dataKey: "clientName",
    group: "Client",
  },

  {
    token: "CLIENT_LOCATION",
    label: "Client Location",
    dataKey: "clientLocation",
    group: "Client",
  },

  {
    token: "TYPE_OF_SERVICES",
    label: "Type of Services",
    dataKey: "typeOfServices",
    group: "Work Order",
  },

  {
    token: "TYPE_OF_SUBCONTRACT",
    label: "Type of Subcontract",
    dataKey: "typeOfSubcontract",
    group: "Work Order",
  },

  {
    token: "RATE",
    label: "Rate",
    dataKey: "rate",
    group: "Work Order",
  },

  {
    token: "PER_HOUR",
    label: "Rate Unit",
    dataKey: "perHour",
    group: "Work Order",
  },

  {
    token: "NET",
    label: "Payment Terms",
    dataKey: "net",
    group: "Work Order",
  },
];

export const FIELD_BY_TOKEN = Object.fromEntries(
  DYNAMIC_FIELDS.map((field) => [
    field.token,
    field,
  ])
);

export const fieldChip = (
  token,
  label = null
) => {
  const field =
    FIELD_BY_TOKEN[token];

  const chipLabel =
    label ||
    field?.label ||
    token;

  return `<span
    class="dynamic-field-chip"
    data-field-token="${token}"
    contenteditable="false"
  >${chipLabel}</span>`;
};

const paragraph = (
  text,
  className = ""
) => `
  <p class="doc-text ${className}">
    ${text}
  </p>
`;

const clause = (
  number,
  title,
  bodyHtml
) => `
  <div class="numbered-clause">

    <div class="numbered-clause-number">
      ${number}.
    </div>

    <div class="numbered-clause-body">

      ${
        title
          ? `
            <div class="numbered-clause-title">
              ${title}
            </div>
          `
          : ""
      }

      ${bodyHtml}

    </div>

  </div>
`;

const alphaList = (items) => `
  <ol class="alpha-list" type="a">

    ${items
      .map(
        (item) => `
          <li>
            ${item}
          </li>
        `
      )
      .join("")}

  </ol>
`;

const htmlBlock = (
  id,
  html,
  extra = {}
) => ({
  id,
  type: "html",
  html,
  ...extra,
});

const tableBlock = (
  id,
  rows,
  extra = {}
) => ({
  id,
  type: "table",
  rows,
  ...extra,
});

const tableCell = (
  html,
  extra = {}
) => ({
  html,
  ...extra,
});

export const createInitialPages = () => [
  // =====================================================
  // PAGE 1
  // =====================================================
  {
    id: "msa-page-1",
    part: "MSA",

    blocks: [
      htmlBlock(
        "p1-title",
        `
          <h1 class="doc-main-title">
            MASTER SERVICES AGREEMENT
          </h1>
        `
      ),

      htmlBlock(
        "p1-intro",
        paragraph(
          `This MASTER SERVICES AGREEMENT (hereinafter the "Agreement") made and entered into this ${fieldChip(
            "CURRENT_DATE"
          )} (hereinafter the "Effective Date") by and between Taproot Solutions Inc., a Texas corporation, having its principal place of business at 317 Ranch Road 620 South, Suite 302F, Austin, TX 78734, (hereinafter the "Company"), and ${fieldChip(
            "VENDOR_NAME"
          )} a ${fieldChip(
            "STATE_NAME"
          )} (Federal Tax ID: ${fieldChip(
            "FEDERAL_ID_EIN"
          )}) with its principle office at ${fieldChip(
            "COMPANY_ADDRESS"
          )} (hereinafter the "Contractor").`
        )
      ),

      htmlBlock(
        "p1-client-definition",
        paragraph(
          `"Client" is the business entity (individual, corporation, partnership, government-run, federal organization, limited partnership, joint venture or other business entity) for which Company employed Contractor to provide individual consultants or services to perform consulting services.`
        )
      ),

      htmlBlock(
        "p1-recitals",
        `
          <div class="doc-section-title">
            RECITALS
          </div>

          ${paragraph(
            `WHEREAS the Company provides professional services including but not limited to computer advisory assistance, computer software systems analysis and design, and computer software application development; and`
          )}

          ${paragraph(
            `WHEREAS the Contractor is an individual, partnership, or company that provides professional services including but not limited to computer advisory assistance, computer software systems analysis and design, and computer software application development; and`
          )}

          ${paragraph(
            `WHEREAS the Company desires to utilize the Services of the Contractor and the Contractor desires to render Services to the Company.`
          )}

          ${paragraph(
            `NOW, THEREFORE, for good and valuable consideration, the receipt and sufficiency of which is acknowledged, the parties hereto, intending to be legally bound hereby, do hereby promise and agree as follows:`
          )}

          <div class="doc-section-title centered">
            AGREEMENT
          </div>
        `
      ),

      htmlBlock(
        "p1-clause-1",
        clause(
          1,
          "Scope of Service.",
          paragraph(
            `The Contractor shall provide consulting services (hereinafter "Services") or shall provide Services through one or more employee/s, subcontractor/s, or consultant/s hired by the Contractor (hereinafter "Consultants") to assist the Contractor during the term of this Agreement with the project's described in the attached work order's (hereinafter the "Work Order" or "Work Orders" or “Consulting Services Purchase Order”), which is/are incorporated herein by reference. Additional Work Orders signed by both parties that specifically cite this Agreement and incorporate it by reference may also be entered into by the parties and be controlled by this Agreement. In the event that any terms and conditions of a Work Order are in conflict with this Agreement, the terms and conditions of the Work Order shall govern. No obligations for Services or costs shall be incurred by either party except in accordance with a Work Order.`
          )
        )
      ),

      htmlBlock(
        "p1-clause-2",
        clause(
          2,
          "Termination.",
          paragraph(
            `The Company can terminate this contract for convenience anytime without any notice. If this agreement is terminated all the Work Orders will be terminated with effective termination date same as this agreement`
          )
        )
      ),

      htmlBlock(
        "p1-clause-3a",
        clause(
          3,
          "Independent Contractor.",
          paragraph(
            `Contractor agrees that any Consultants provided by Contractor are employees or subcontractors of Contractor and are not employees of Company or Client; that Contractor at all times retains the primary`,
            "no-bottom"
          )
        )
      ),
    ],
  },

  // =====================================================
  // PAGE 2
  // =====================================================
  {
    id: "msa-page-2",
    part: "MSA",

    blocks: [
      htmlBlock(
        "p2-clause-3b",
        paragraph(
          `control over the Consultants, including the right to recruit, qualify, hire, terminate, set compensation and benefits, establish codes of conduct, monitor, discipline, establish minimum or maximum work hours and other conditions of work; that Contractor’s personnel will not be entitled to any rights, benefits or privileges provided by Company of Client to their own employees; that neither Company nor Client will be liable for payment of employment taxes, workers’ compensation, or other benefits provided to Contractor’s personnel; that Contractor is responsible for these matters and for paying the Consultant in a timely manner and for withholding FICA, FUTA, FIT and similar taxes with respect to the Consultants; and that Contractor’s personnel will abide by the confidentiality and restrictive covenants of this Agreement. Contractor shall indemnify and hold harmless Company from all damages, costs and expenses (including reasonable attorney’s fees) resulting from any claims by Contractor’s personnel that any such personnel benefits are covered by the Client’s or Company’s employee benefit plans. The Contractor shall maintain all necessary personnel and payroll records for Consultants assigned to Client including creating and maintaining any records necessary to comply with the Immigration Reform and Control Act of 1986. The Contractor shall maintain in effect, during the term any and all federal, state and/or local licenses and permits that may be required of employers generally or of the Contractor to supply Consultants to Client, according to the terms of this Agreement.`
        )
      ),

      htmlBlock(
        "p2-clause-4",
        clause(
          4,
          "Confidentiality.",
          `
            ${paragraph(
              `The Contractor and its Consultants providing Services to the Company or its Clients shall treat as confidential any information disclosed by the Company or its Clients, including but not limited to all personal information, mailing lists, proprietary data, product designs, capabilities, specifications, program code, software systems and processes, information regarding existing and future technical, business and marketing plans and product strategies, and the identity of actual and potential customers and suppliers (hereinafter "Confidential Information"). Confidential Information may be written, oral, recorded, or contained on tape or other electronic or mechanical media.`
            )}

            ${paragraph(
              `Confidential Information shall not include information which (i) is in or has entered the public domain through no breach of this Agreement or other wrongful act of Contractor or it's Consultants; (ii) has been rightfully received from a third party without breach of this Agreement; (iii) has been approved for release by written authorization of the Company or its Clients; or (iv) is required to be disclosed pursuant to the final binding order of a governmental agency or court of competent jurisdiction, provided that the Company or its Clients have been given reasonable notice of the issue of such an order and the opportunity to contest it.`
            )}
          `
        )
      ),

      htmlBlock(
        "p2-clause-5",
        clause(
          5,
          "",
          `
            ${paragraph(
              `Contractor shall submit proof of each of the following requirements (referred to individually as a “Requirement” or collectively as the “Requirements”) to Company (i) prior to providing Services and (ii) at least fifteen (15) days prior to the expiration of proof of any Requirement:`
            )}

            ${alphaList([
              "Completed W9 form;",
              "Valid Employer Identification Number;",
              "Employment eligibility through I9 and E-Verify for each Sub-Contractor Personnel engaged to provide Services under this Agreement;",
              "Direct Deposit Form;",
              "Copy of a voided business check;",
              "Executed Sub-Contractor Agreement;",
              "Executed Purchase Order for the engagement demanding payment;",
              "Valid ACORD Certificate of Insurance detailing the appropriate coverages and endorsements as listed in Section 6 plus any required Flow-Down insurance limits and endorsements as listed in Exhibit 1; and",
              "Any other Requirements as listed in an applicable Purchase Order.",
            ])}
          `
        )
      ),

      htmlBlock(
        "p2-clause-6-title",
        clause(
          6,
          "Insurance",
          ""
        )
      ),
    ],
  },

  // =====================================================
  // PAGE 3
  // =====================================================
  {
    id: "msa-page-3",
    part: "MSA",

    blocks: [
      htmlBlock(
        "p3-insurance",
        `
          ${paragraph(
            `Before providing services, Contractor shall provide and maintain in effect throughout the life of this Agreement, and any renewals thereof, Worker’s Compensation insurance in full limits as required by statute applicable to a worker placed at a Client’s location and Employer’s Liability. Such insurance shall name Client and Company as additional insured.`
          )}

          ${paragraph(
            `In addition, Contractor shall maintain in effect, with Company and Client named as additional insured, throughout the term of this Agreement and one year thereafter, at its cost and expense:`
          )}
        `
      ),

      tableBlock(
        "p3-insurance-table",
        [
          [
            tableCell(
              "Comprehensive General Liability Insurance covering bodily damage and property"
            ),
            tableCell(
              "Not less than $1,000,000 per occurrence"
            ),
          ],

          [
            tableCell(
              "Comprehensive Auto Liability including owned, non-owned and hired car coverage"
            ),
            tableCell(
              "Not less than $1,000,000 per occurrence"
            ),
          ],

          [
            tableCell(
              "Errors and Omissions Liability coverage"
            ),
            tableCell(
              "Not less than $1,000,000 per occurrence"
            ),
          ],

          [
            tableCell(
              "Worker’s Compensation"
            ),
            tableCell(
              "As per the laws of the state"
            ),
          ],
        ],

        {
          className:
            "insurance-table",
        }
      ),

      htmlBlock(
        "p3-clause-7",
        clause(
          7,
          "Agreement Not to Solicit or Employ.",
          alphaList([
            `During the term of Contractor’s performance of services for a client on behalf of Company and for one year after the termination of the performance of such services, Contractor agrees that it will not, provide or attempt to provide (or advise others of the opportunity to provide) its employees to any other vendor to client other than through Company, directly or indirectly, any services to such Client. This agreement takes precedence over any other existing contracts the Contractor (or its employees) may have with the Client or its vendors.`,

            `For the purposes of this clause 7, the term “Client” includes any customers, contractors, subcontractors, or clients of the Client for whom Contractor’s Consultants performed services or for whom Company proposed to Client that Contractor would perform services.`,

            `The “restricted period” shall begin on the later of the date of the last performance of services by Contractor for the Client or the date of the last proposal submitted by Company to Client proposing the use of Contractor. The Restricted Period shall end on the latest of the following dates: (1) one year from the date the “restricted period” began, or (1) one year from the date on which an interview with the Client and Contractor or any Consultant of Contractor arranged by Company took place.`,

            `The “restricted location” shall be any Client facility / client business unit where the Contractor’s Consultants’ performed services, were assigned to perform services, or were introduced to or interviewed by the Client to perform services during the last twelve (12) months of the performance of such services.`,

            `Throughout the duration of this Agreement, and for a period of one (1) year after termination or expiration of this Agreement, Contractor shall not directly nor indirectly compete with the business of Company for any follow-on contract or other State or federal government contracts for the services or work provided by the Contractor under this agreement. Contractor acknowledges that Company may in reliance of this Agreement, provide Contractor access to trade secrets, customers and their confidential data and that the provisions of this Agreement are reasonably necessary to protect Taproot Solutions Inc. Contractor agrees to retain said information as confidential and not to use said information for Contractor’s own behalf.`,
          ])
        )
      ),

      htmlBlock(
        "p3-clause-8-title",
        clause(
          8,
          "Fees",
          ""
        )
      ),
    ],
  },

  // =====================================================
  // PAGE 4
  // =====================================================
  {
    id: "msa-page-4",
    part: "MSA",

    blocks: [
      htmlBlock(
        "p4-fees",
        paragraph(
          `In consideration of the Services rendered by the Contractor to the Company hereunder, the Company agrees to pay fees in accordance with the rates set for in the Work Orders except in the event of a good faith dispute as to the calculation or amount owed as stated in the invoice. In the event of a dispute, the Company shall give written notice to Contractor stating the details of any such dispute and shall promptly pay any undisputed amount. The acceptance of partial payment shall not constitute a waiver of payment in full of the disputed amount. Unless otherwise noted in the applicable Work Order, the Company shall be responsible for any and all approved expenses incurred by the Contractor and its Consultants in connection with performance of the Services hereunder.`
        )
      ),

      htmlBlock(
        "p4-clause-9",
        clause(
          9,
          "Invoicing.",
          paragraph(
            `Unless other arrangements are specified in the Work Order, the Contractor shall invoice the Company for its services monthly. Company shall pay Contractor, within thirty (30) days of the receipt of the invoice. Applicable taxes, if any, shall be included in the charges payable by the Company. Invoices received after 60 days of the work performed will not be paid.`
          )
        )
      ),

      htmlBlock(
        "p4-clause-10",
        clause(
          10,
          "Contractor Warranties.",
          `
            ${paragraph(
              `With respect to the Services, the Contractor warrants to the Company that:`
            )}

            ${alphaList([
              "The Contractor and its Consultants shall perform the Service according to the terms and conditions of this Agreement and in conformity with accepted standards and ethics of the Contractor's profession; and",

              "The Contractor has the technical ability, expertise, manpower, and is in a position to perform hereunder. No other job previously or subsequently undertaken by Contractor will be given priority over the Services; and",

              "The Contractor is an individual or a duly formed corporation, limited liability company, partnership, or sole proprietorship in good standing under laws of the State of incorporation or organization and that the Contractor is qualified to transact business in all locations where the ownership of its properties or the nature of its operation requires such qualification; and",
            ])}

            ${paragraph(
              `The Contractor has full power and authority to enter into and perform the Agreement, that the execution and delivery of the Agreement have been duly authorized, that the Agreement does not violate any law statute or regulation, and that the Agreement does not breach any other agreement or covenant to which Contractor is a party or to which it is bound.`
            )}
          `
        )
      ),

      htmlBlock(
        "p4-clause-11",
        clause(
          11,
          "Indemnity.",
          paragraph(
            `Contractor hereby releases and agrees to indemnify and hold harmless the Company, it's officers, agents and employees from any and all liabilities damages, losses, expenses, demands, claims, suits or judgments, including reasonable attorneys' fees, costs and expenses relating to third party claims arising out of the negligent or intentional acts or omissions of Contractor, agents or employees, including Consultants. If any claim by a third party based upon alleged infringement of a patent, copyright or trade secret is asserted against the Company by virtue of the user of the software or other programming documentation developed hereunder, Contractor will indemnify and hold the Company harmless against damages, reasonable attorneys' fees, costs associated with the investigation, preparation, defense and/or settlement of such claim.`
          )
        )
      ),

      htmlBlock(
        "p4-clause-12",
        clause(
          12,
          "Audit:",
          paragraph(
            `Contractor must maintain complete and accurate records of, and supporting documentation for (a) work performed by Contractor and Contractor Personnel; and (b) the amounts billable to and payments made by Company hereunder in accordance with generally accepted accounting principles applied on a consistent basis. Contractor agrees to provide Company with documentation and other information with respect to each invoice as may be reasonably requested by Company to verify accuracy and compliance with the provisions of this Agreement. Following reasonable written notice to Contractor, Company or`,
            "no-bottom"
          )
        )
      ),
    ],
  },

  // =====================================================
  // PAGE 5
  // =====================================================
  {
    id: "msa-page-5",
    part: "MSA",

    blocks: [
      htmlBlock(
        "p5-audit-continuation",
        paragraph(
          `its agents may conduct an audit, during regular business hours, of the books and records maintained by Contractor for Company to verify Contractor’s compliance with this Agreement and the accuracy of charges during the term of this Agreement and for four (4) years after expiration of the Services provided for in this Agreement. Contractor shall reasonably cooperate with Company audits, including, without limitation, making applicable data available in a reasonably requested format. Audits shall be completed not more frequently than once per year, absent reasonable suspicion that a breach has occurred. Costs of the audit will be at Company's expense, except that Company will not be required to reimburse Contractor for Contractor’s internal costs of complying with the audit. However, if an audit discloses that monies were incorrectly paid to Contractor then, upon written demand from Company, Contractor will promptly reimburse such monies to Company, and if the overpayment is two percent (2%) or more of the proper and accurate amount due, Contractor will reimburse Company for the cost of the audit, in addition to any other remedies Company may have.`
        )
      ),

      htmlBlock(
        "p5-clauses",
        `
          ${clause(
            13,
            "Authority",
            paragraph(
              `Neither the Contractor nor its Consultants shall have any right, power, or authority to create any obligation, express or implied, or make any representations on behalf of the Company except as the Contractor or its Consultant may be expressly authorized by the Company in advance in a writing signed by the Company and then only to the extent of such authorization.`
            )
          )}

          ${clause(
            14,
            "Assignment.",
            paragraph(
              `This Agreement may not be assigned by the either party without prior written consent of the other party.`
            )
          )}

          ${clause(
            15,
            "Governing Law.",
            paragraph(
              `This Agreement shall be governed by the laws of the State of Texas without regard to conflicts of law principles and the parties agree to submit to the jurisdiction of the courts of the State of Texas.`
            )
          )}

          ${clause(
            16,
            "Force Majeure",
            paragraph(
              `Contractor shall not be responsible to provide services herein if such failure is due to any cause or condition beyond the consultant’s control.`
            )
          )}

          ${clause(
            17,
            "Partial Invalidity",
            paragraph(
              `If any portion of this Agreement shall be held valid or void, such portion shall be deemed modified to the extent necessary to render such provision enforceable under the law, and this Agreement shall remain valid and enforceable as so modified. In the event that the portion of this Agreement in question may not be modified in such a way as to make it enforceable, the Agreement shall be construed as if the portion so invalidated was not part of this Agreement`
            )
          )}

          ${clause(
            18,
            "No waiver.",
            paragraph(
              `A waiver by either party of any breach of this Agreement by the other party shall not be construed as a waiver of the other provisions of this Agreement or as a waiver of any such subsequent breach by such a party of the same or any other provisions of this Agreement.`
            )
          )}

          ${clause(
            19,
            "Cooperation.",
            paragraph(
              `The Contractor and the Company shall cooperate and take such actions and execute and deliver such documents as may be reasonably necessary to carry out the provisions and purposes of this Agreement.`
            )
          )}

          ${clause(
            20,
            "Headings.",
            paragraph(
              `The headings used in the Agreement are for reference purposes only and shall not be deemed a substantive part of this Agreement.`
            )
          )}

          ${clause(
            21,
            "Good Faith.",
            paragraph(
              `The parties agree that in regards to all their respective dealings under this Agreement, they shall act fairly and in good faith.`
            )
          )}
        `
      ),
    ],
  },

  // =====================================================
  // PAGE 6
  // =====================================================
  {
    id: "msa-page-6",
    part: "MSA",

    blocks: [
      htmlBlock(
        "p6-clause-22",
        clause(
          22,
          "Entire Agreement.",
          paragraph(
            `This Agreement supersedes and cancels any previous written, oral or implied agreements between the parties. This Agreement expresses the complete and final understanding of the parties related to the Services and may not be changed in any way except in writing signed by both parties. This Agreement may be executed in one or more counterparts all of which shall collectively comprise the final executed and binding Agreement.`
          )
        )
      ),

      htmlBlock(
        "p6-clause-23",
        clause(
          23,
          "Notices.",
          paragraph(
            `Notice required or permitted to be given pursuant to the terms of this Agreement must be sent to the below contact information via email with return receipt or by fax with confirmation or by US Mail or courier. If sent by mail it must be via United States mail, postage prepaid, certified return receipt requested and addressed as provided below, or upon receipt if delivery by any other method:`
          )
        )
      ),

      htmlBlock(
        "p6-notices",
        `
          <div class="notice-grid">

            <p>
              Taproot Solutions Inc.,<br/>
              317 Ranch Road 620 South,<br/>
              Suite 302F, Austin, TX 78734<br/>
              Fax: ____________<br/>
              Email:
              <u>
                Contracts@taproot-solutions.com
              </u>
            </p>

            <p>
              <strong>
                ${fieldChip(
                  "VENDOR_NAME"
                )}.
              </strong>

              <br/>

              <strong>
                ${fieldChip(
                  "COMPANY_ADDRESS"
                )}
              </strong>

              <br/>

              Fax: ____________

              <br/>

              Email:
              <strong>
                ${fieldChip(
                  "VENDOR_EMAIL_ID"
                )}
              </strong>
            </p>

          </div>
        `
      ),

      htmlBlock(
        "p6-execution",
        paragraph(
          `The parties mutually agree to the terms and conditions set forth herein. Each party acknowledges that it (i) has read this entire Agreement and (ii) has the full power to execute this Agreement. In witness where of the parties hereto have executed this Agreement as of date written above.`
        )
      ),

      htmlBlock(
        "p6-signatures",
        `
          <div class="signature-columns">

            <section>

              <div class="signature-party-title">
                Contractor:
                ${fieldChip(
                  "VENDOR_NAME"
                )}.
              </div>

              <div class="signature-label">
                Signature:
              </div>

              <div class="signature-space"></div>

              <div class="signature-line"></div>

              <div class="signature-meta">

                <div class="signature-meta-row">
                  Name:
                  ${fieldChip(
                    "AUTHORIZED_SIGNATURE_NAME"
                  )}
                </div>

                <div class="signature-meta-row">
                  Title:
                  ${fieldChip(
                    "AUTHORIZED_PERSON_TITLE"
                  )}
                </div>

                <div class="signature-date-row">
                  Date:
                  ${fieldChip(
                    "CURRENT_DATE"
                  )}
                </div>

              </div>

            </section>

            <section>

              <div class="signature-party-title">
                Company:
                Taproot Solutions INC.
              </div>

              <div class="signature-label">
                Signature:
              </div>

              <div class="signature-space"></div>

              <div class="signature-line"></div>

              <div class="signature-meta">

                <div class="signature-meta-row">
                  Name:
                  Purnima Govada
                </div>

                <div class="signature-meta-row">
                  Title:
                  Director
                </div>

                <div class="signature-date-row">
                  Date:
                  ${fieldChip(
                    "CURRENT_DATE"
                  )}
                </div>

              </div>

            </section>

          </div>
        `
      ),
    ],
  },

  // =====================================================
  // PAGE 7 — WORK ORDER
  // =====================================================
  {
    id: "wo-page-1",
    part: "WO",

    blocks: [
      htmlBlock(
        "p7-title",
        `
          <h1 class="doc-wo-title">
            Consulting Services Purchase Order
          </h1>
        `
      ),

      htmlBlock(
        "p7-intro",
        paragraph(
          `Work to be performed by <strong>${fieldChip(
            "VENDOR_NAME"
          )}</strong> (Contractor) for Taproot Solutions Inc., (Company) in accordance with the Master Services Agreement (Agreement) executed by and between the parties on <strong>${fieldChip(
            "CURRENT_DATE"
          )}</strong>, is hereby detailed and such details are incorporated into and do hereby become a part of the aforementioned Consulting Agreement.`
        )
      ),

      tableBlock(
        "p7-wo-table",
        [
          [
            tableCell(
              "Purchase Order #"
            ),

            tableCell(
              `Taproot-Subk-${fieldChip(
                "CONTRACT_NUMBER"
              )}`
            ),
          ],

          [
            tableCell(
              "Contractor Resources Assigned:"
            ),

            tableCell(
              `<strong>${fieldChip(
                "CANDIDATE_NAME"
              )}</strong>`
            ),
          ],

          [
            tableCell(
              "Tentative Start Date"
            ),

            tableCell(
              `<strong>${fieldChip(
                "TENTATIVE_START_DATE"
              )}</strong>`
            ),
          ],

          [
            tableCell(
              "Job Title :"
            ),

            tableCell(
              `<strong>${fieldChip(
                "JOB_TITLE_NAME"
              )}</strong>`
            ),
          ],

          [
            tableCell(
              "Client Name:"
            ),

            tableCell(
              `<strong>${fieldChip(
                "CLIENT_NAME"
              )}</strong>`
            ),
          ],

          [
            tableCell(
              "Client Location:"
            ),

            tableCell(
              `<strong>${fieldChip(
                "CLIENT_LOCATION"
              )}</strong>`
            ),
          ],

          [
            tableCell(
              "Type of work"
            ),

            tableCell(
              `<strong>${fieldChip(
                "TYPE_OF_SERVICES"
              )}</strong>`
            ),
          ],

          [
            tableCell(
              "Type of Subcontract"
            ),

            tableCell(
              `Time and Materials<br/><strong>${fieldChip(
                "TYPE_OF_SUBCONTRACT"
              )}</strong>`
            ),
          ],

          [
            tableCell(
              "Rate"
            ),

            tableCell(
              `$ <strong>${fieldChip(
                "RATE"
              )} ${fieldChip(
                "PER_HOUR"
              )}</strong>`
            ),
          ],

          [
            tableCell(
              "Payment Terms"
            ),

            tableCell(
              `${fieldChip(
                "NET"
              )} days after receipt of acceptable invoice.`
            ),
          ],

          [
            tableCell(
              "Taproot Subcontract Administrator"
            ),

            tableCell(
              "Purnima Govada, Director"
            ),
          ],
        ],

        {
          className:
            "wo-table",
        }
      ),

      htmlBlock(
        "p7-acceptance",
        `
          <div class="wo-acceptance-head">

            <div>

              <strong>
                <u>
                  Accepted:
                </u>
              </strong>

              <br/>

              <strong>
                <u>
                  Contractor:
                  ${fieldChip(
                    "VENDOR_NAME"
                  )}.
                </u>
              </strong>

            </div>

            <div>

              <strong>
                <u>
                  Accepted:
                </u>
              </strong>

              <br/>

              <strong>
                <u>
                  Company:
                  Taproot Solutions INC.
                </u>
              </strong>

            </div>

          </div>
        `
      ),

      tableBlock(
        "p7-signature-table",
        [
          [
            tableCell(
              `<div class="wo-signature-cell">Signature:</div>`
            ),

            tableCell(
              "",
              {
                divider: true,
              }
            ),

            tableCell(
              `<div class="wo-signature-cell">Signature:</div>`
            ),
          ],

          [
            tableCell(
              `Name: ${fieldChip(
                "AUTHORIZED_SIGNATURE_NAME"
              )}`
            ),

            tableCell(
              "",
              {
                divider: true,
              }
            ),

            tableCell(
              "Name: Purnima Govada"
            ),
          ],

          [
            tableCell(
              `Title: ${fieldChip(
                "AUTHORIZED_PERSON_TITLE"
              )}`
            ),

            tableCell(
              "",
              {
                divider: true,
              }
            ),

            tableCell(
              "Title: Director"
            ),
          ],

          [
            tableCell(
              `Date: ${fieldChip(
                "CURRENT_DATE"
              )}`
            ),

            tableCell(
              "",
              {
                divider: true,
              }
            ),

            tableCell(
              `Date: ${fieldChip(
                "CURRENT_DATE"
              )}`
            ),
          ],
        ],

        {
          className:
            "wo-signature-table",
        }
      ),
    ],
  },
];

export const createDefaultTemplate =
  () => ({
    templateId:
      "TPL-MSA-WO-TAPROOT",

    templateName:
      "Taproot MSA + WO",

    version: 1,

    status: "DRAFT",

    packageMode:
      "MSA_WO",

    logoUrl:
      DEFAULT_LOGO_URL,

    footerText:
      DEFAULT_FOOTER_TEXT,

    showPageNumbers:
      false,

    styleConfig: {
      ...DEFAULT_STYLE_CONFIG,
    },

    documentData: {
      ...DEFAULT_DOCUMENT_DATA,

      CURRENT_DATE:
        new Date().toLocaleDateString(
          "en-US",
          {
            year: "numeric",
            month: "long",
            day: "numeric",
          }
        ),
    },

    pages:
      createInitialPages(),

    createdAt:
      new Date().toISOString(),

    updatedAt:
      new Date().toISOString(),
  });

export const deepCloneTemplate = (
  value
) =>
  JSON.parse(
    JSON.stringify(value)
  );

export const makeBlockId = () => {
  if (
    typeof crypto !==
      "undefined" &&
    crypto.randomUUID
  ) {
    return `block-${crypto.randomUUID()}`;
  }

  return `block-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}`;
};

export const createEmptyParagraphBlock =
  () => ({
    id: makeBlockId(),

    type: "html",

    html: `
      <p class="doc-text">
        New paragraph
      </p>
    `,
  });

export const createEmptyTableBlock =
  () => ({
    id: makeBlockId(),

    type: "table",

    className: "",

    rows: [
      [
        {
          html: "Cell 1",
        },

        {
          html: "Cell 2",
        },
      ],

      [
        {
          html: "Cell 3",
        },

        {
          html: "Cell 4",
        },
      ],
    ],
  });

export const getDynamicFieldValue = (
  token,
  data
) => {
  const field =
    FIELD_BY_TOKEN[token];

  if (!field) {
    return "";
  }

  return data?.[
    field.dataKey
  ] ?? "";
};

export const escapeHtml = (
  value
) =>
  String(value ?? "")
    .replaceAll(
      "&",
      "&amp;"
    )
    .replaceAll(
      "<",
      "&lt;"
    )
    .replaceAll(
      ">",
      "&gt;"
    )
    .replaceAll(
      '"',
      "&quot;"
    )
    .replaceAll(
      "'",
      "&#039;"
    );

export const resolveDynamicFields = (
  html,
  data,
  editMode = false
) => {
  if (!html) {
    return "";
  }

  if (editMode) {
    return html;
  }

  return html.replace(
    /<span\b[^>]*data-field-token=["']([^"']+)["'][^>]*>[\s\S]*?<\/span>/gi,

    (_, token) => {
      const value =
        getDynamicFieldValue(
          token,
          data
        );

      return `
        <span class="resolved-dynamic-field">
          ${escapeHtml(value)}
        </span>
      `;
    }
  );
};