// src/components/msa-wo/MSATemplatePages.jsx

import React from "react";

import "./MSADocumentStyles.css";

import {
  FIELD_MAP,
  SIGNATURE_FIELD_IDS,
  SIGNATURE_GUARD_IDS,
} from "./MSATemplateDefinition";


/* ============================================================
   DOCUMENT CONSTANTS
============================================================ */

const FOOTER_TEXT =
  "317 Ranch Road 620 South, Suite 302F | Austin, TX 78734 | (408) 216-7968 |info@taproot-solutions.com";


const DEFAULT_LOGO_URL =
  "https://vmsdashboardea.blob.core.windows.net/images/Company_logo.png?sp=r&st=2026-03-17T13:15:01Z&se=2027-12-30T21:30:01Z&sv=2024-11-04&sr=b&sig=dAq1%2Bxrcn0KMYfrH%2F9OtOfQUZNqrxdZvGwoNFZfcyFY%3D";


const tokenRegex =
  /(\{\{[^}]+\}\})/g;


/* ============================================================
   FIELD
============================================================ */

const Field = ({
  token,
  data,
}) => {
  const cleanToken =
    token.replace(
      /^\{\{|\}\}$/g,
      ""
    );


  const fieldMeta =
    FIELD_MAP[
      cleanToken
    ];


  const key =
    fieldMeta?.key;


  const placeholder =
    fieldMeta?.placeholder ||
    cleanToken;


  const value =
    key
      ? data?.[
          key
        ]
      : "";


  return (
    <span
      className={
        `doc-field ${
          value
            ? ""
            : "is-placeholder"
        }`
      }
    >
      {
        value ||
        `{${placeholder}}`
      }
    </span>
  );
};


/* ============================================================
   TEMPLATE TEXT
============================================================ */

const RenderTemplateText = ({
  text = "",
  data,
}) => {
  const parts =
    String(
      text
    ).split(
      tokenRegex
    );


  return (
    <>
      {parts.map(
        (
          part,
          index
        ) =>
          part.startsWith(
            "{{"
          ) &&
          part.endsWith(
            "}}"
          ) ? (

            <Field
              key={
                `${part}-${index}`
              }
              token={
                part
              }
              data={
                data
              }
            />

          ) : (

            <React.Fragment
              key={
                index
              }
            >
              {part}
            </React.Fragment>

          )
      )}
    </>
  );
};


/* ============================================================
   HEADER / FOOTER
============================================================ */

const PageHeader = ({
  logoUrl,
}) => (
  <div className="page-header">

    <img
      src={
        logoUrl ||
        DEFAULT_LOGO_URL
      }
      alt="Taproot Solutions Inc."
    />

  </div>
);


const PageFooter = () => (
  <div className="page-footer">
    {FOOTER_TEXT}
  </div>
);


/* ============================================================
   PAGE
============================================================ */

const Page = ({
  children,
  styleVars,
  logoUrl,
  pageNumber,
  showPageGuides,
}) => (

  <section
    className={
      `a4-page ${
        showPageGuides
          ? "show-page-guides"
          : ""
      }`
    }

    style={
      styleVars
    }

    data-page-number={
      pageNumber
    }
  >

    <PageHeader
      logoUrl={
        logoUrl
      }
    />


    <div className="page-debug-badge">
      Page {pageNumber}
    </div>


    <div className="page-body">
      {children}
    </div>


    <PageFooter />

  </section>
);


/* ============================================================
   CLAUSE
============================================================ */

const Clause = ({
  number,
  title,
  children,
}) => (

  <div className="numbered-clause">

    <div className="numbered-clause-number">
      {number}.
    </div>


    <div className="numbered-clause-body">

      {title ? (

        <span className="numbered-clause-title">
          {title}
        </span>

      ) : null}


      {children}

    </div>

  </div>
);


/* ============================================================
   ALPHA LIST
============================================================ */

const AlphaList = ({
  items,
  data,
  className = "",
}) => (

  <ol
    className={
      `alpha-list ${className}`
    }
  >

    {items.map(
      (
        item,
        index
      ) => (

        <li key={index}>

          <RenderTemplateText
            text={
              item
            }
            data={
              data
            }
          />

        </li>

      )
    )}

  </ol>
);


/* ============================================================
   SIGNATURE BLOCK

   No final signature is rendered here.

   This component creates fixed document zones that the backend
   later uses when flattening the signed PDF.
============================================================ */

const SignatureBlock = ({
  partyTitle,
  signerName,
  signerTitle,
  date,
  signatureText,
  data,

  signatureFieldId,
  auditFieldId,
  guardId,

  variant =
    "msa",
}) => (

  <div
    className={
      `signature-block signature-block-${variant}`
    }
  >

    <div className="signature-party-title">

      <RenderTemplateText
        text={
          partyTitle
        }
        data={
          data
        }
      />

    </div>


    <div className="signature-capture-frame">

      <div className="signature-label">
        Signature:
      </div>


      <div
        className="signature-placement-zone"
        data-signature-field={
          signatureFieldId
        }
      >

        {signatureText ? (

          <span className="signature-text">
            {signatureText}
          </span>

        ) : null}

      </div>


      <div
        className="signature-audit-zone"
        data-signature-field={
          auditFieldId
        }
      />

    </div>


    <div
      className="signature-meta"
      data-signature-guard={
        guardId
      }
    >

      <div className="signature-meta-row">

        <span className="signature-meta-label">
          Name:
        </span>

        <span>
          <RenderTemplateText
            text={
              signerName
            }
            data={
              data
            }
          />
        </span>

      </div>


      <div className="signature-meta-row">

        <span className="signature-meta-label">
          Title:
        </span>

        <span>
          <RenderTemplateText
            text={
              signerTitle
            }
            data={
              data
            }
          />
        </span>

      </div>


      <div className="signature-date-row">

        <span className="signature-meta-label">
          Date:
        </span>

        <span>
          <RenderTemplateText
            text={
              date
            }
            data={
              data
            }
          />
        </span>

      </div>

    </div>

  </div>
);


/* ============================================================
   MAIN TEMPLATE
============================================================ */

export const MSATemplatePages = ({
  data,
  styles,
  templateText,
  documentMode =
    "MSA_WO",
  logoUrl,
  showPageGuides =
    false,
}) => {

  const styleVars = {
    "--doc-margin-top":
      `${styles.marginTop}mm`,

    "--doc-margin-bottom":
      `${styles.marginBottom}mm`,

    "--doc-margin-left":
      `${styles.marginLeft}mm`,

    "--doc-margin-right":
      `${styles.marginRight}mm`,

    "--doc-font-family":
      styles.fontFamily ||
      '"Times New Roman", Times, serif',

    "--doc-font-size":
      `${styles.fontSize}pt`,

    "--doc-line-height":
      styles.lineHeight,

    "--doc-title-size":
      `${styles.titleSize}pt`,

    "--doc-section-title-size":
      `${styles.sectionTitleSize}pt`,

    "--doc-footer-font-size":
      `${styles.footerFontSize}pt`,

    "--doc-logo-width":
      `${styles.logoWidth}mm`,

    "--doc-footer-rule-width":
      `${styles.footerRuleWidth || 1.2}mm`,

    "--doc-footer-rule-color":
      styles.footerRuleColor,

    "--doc-signature-box-height":
      `${styles.signatureBoxHeight || 27}mm`,

    "--doc-signature-image-zone-height":
      `${styles.signatureImageZoneHeight || 15}mm`,

    "--doc-signature-audit-zone-height":
      `${styles.signatureAuditZoneHeight || 7}mm`,
  };


  const showMSA =
    documentMode ===
      "MSA" ||
    documentMode ===
      "MSA_WO";


  const showWO =
    documentMode ===
      "WO" ||
    documentMode ===
      "MSA_WO";


  const requirementItems = [
    "Completed W9 form;",

    "Valid Employer Identification Number;",

    "Employment eligibility through I9 and E-Verify for each Sub-Contractor Personnel engaged to provide Services under this Agreement;",

    "Direct Deposit Form;",

    "Copy of a voided business check;",

    "Executed Sub-Contractor Agreement;",

    "Executed Purchase Order for the engagement demanding payment;",

    "Valid ACORD Certificate of Insurance detailing the appropriate coverages and endorsements as listed in Section 6 plus any required Flow-Down insurance limits and endorsements as listed in Exhibit 1; and",

    "Any other Requirements as listed in an applicable Purchase Order.",
  ];


  const clause7Items = [
    templateText.clause7a,
    templateText.clause7b,
    templateText.clause7c,
    templateText.clause7d,
    templateText.clause7e,
  ];


  return (
    <>

      {showMSA && (

        <>

          {/* ==================================================
              PAGE 1
          ================================================== */}

          <Page
            styleVars={
              styleVars
            }

            logoUrl={
              logoUrl
            }

            pageNumber={
              1
            }

            showPageGuides={
              showPageGuides
            }
          >

            <h1 className="doc-main-title">
              MASTER SERVICES AGREEMENT
            </h1>


            <p className="doc-text">
              <RenderTemplateText
                text={
                  templateText.intro
                }
                data={
                  data
                }
              />
            </p>


            <p className="doc-text">
              <RenderTemplateText
                text={
                  templateText.clientDefinition
                }
                data={
                  data
                }
              />
            </p>


            <div className="doc-section-title">
              RECITALS
            </div>


            <p className="doc-text">
              <RenderTemplateText
                text={
                  templateText.recital1
                }
                data={
                  data
                }
              />
            </p>


            <p className="doc-text">
              <RenderTemplateText
                text={
                  templateText.recital2
                }
                data={
                  data
                }
              />
            </p>


            <p className="doc-text">
              <RenderTemplateText
                text={
                  templateText.recital3
                }
                data={
                  data
                }
              />
            </p>


            <p className="doc-text">
              <RenderTemplateText
                text={
                  templateText.recital4
                }
                data={
                  data
                }
              />
            </p>


            <div className="doc-section-title centered">
              AGREEMENT
            </div>


            <Clause
              number="1"
              title="Scope of Service."
            >

              <p className="doc-text no-bottom">
                <RenderTemplateText
                  text={
                    templateText.clause1
                  }
                  data={
                    data
                  }
                />
              </p>

            </Clause>


            <Clause
              number="2"
              title="Termination."
            >

              <p className="doc-text no-bottom">
                <RenderTemplateText
                  text={
                    templateText.clause2
                  }
                  data={
                    data
                  }
                />
              </p>

            </Clause>


            <Clause
              number="3"
              title="Independent Contractor."
            >

              <p className="doc-text no-bottom">
                <RenderTemplateText
                  text={
                    templateText.clause3a
                  }
                  data={
                    data
                  }
                />
              </p>

            </Clause>

          </Page>


          {/* ==================================================
              PAGE 2
          ================================================== */}

          <Page
            styleVars={
              styleVars
            }

            logoUrl={
              logoUrl
            }

            pageNumber={
              2
            }

            showPageGuides={
              showPageGuides
            }
          >

            <p className="doc-text">

              <RenderTemplateText
                text={
                  templateText.clause3b
                }
                data={
                  data
                }
              />

            </p>


            <Clause
              number="4"
              title="Confidentiality."
            >

              <p className="doc-text">

                <RenderTemplateText
                  text={
                    templateText.clause4a
                  }
                  data={
                    data
                  }
                />

              </p>


              <p className="doc-text no-bottom">

                <RenderTemplateText
                  text={
                    templateText.clause4b
                  }
                  data={
                    data
                  }
                />

              </p>

            </Clause>


            <Clause number="5">

              <p className="doc-text">

                <RenderTemplateText
                  text={
                    templateText.clause5Intro
                  }
                  data={
                    data
                  }
                />

              </p>


              <AlphaList
                items={
                  requirementItems
                }

                data={
                  data
                }

                className="requirement-list"
              />

            </Clause>


            <Clause
              number="6"
              title="Insurance"
            />

          </Page>


          {/* ==================================================
              PAGE 3
          ================================================== */}

          <Page
            styleVars={
              styleVars
            }

            logoUrl={
              logoUrl
            }

            pageNumber={
              3
            }

            showPageGuides={
              showPageGuides
            }
          >

            <p className="doc-text">

              <RenderTemplateText
                text={
                  templateText.clause6a
                }
                data={
                  data
                }
              />

            </p>


            <p className="doc-text">

              <RenderTemplateText
                text={
                  templateText.clause6b
                }
                data={
                  data
                }
              />

            </p>


            <table className="doc-table insurance-table">

              <tbody>

                <tr>

                  <td>
                    Comprehensive General Liability Insurance covering bodily damage and property
                  </td>

                  <td>
                    Not less than $1,000,000 per occurrence
                  </td>

                </tr>


                <tr>

                  <td>
                    Comprehensive Auto Liability including owned, non-owned and hired car coverage
                  </td>

                  <td>
                    Not less than $1,000,000 per occurrence
                  </td>

                </tr>


                <tr>

                  <td>
                    Errors and Omissions Liability coverage
                  </td>

                  <td>
                    Not less than $1,000,000 per occurrence
                  </td>

                </tr>


                <tr>

                  <td>
                    Worker’s Compensation
                  </td>

                  <td>
                    As per the laws of the state
                  </td>

                </tr>

              </tbody>

            </table>


            <Clause
              number="7"
              title="Agreement Not to Solicit or Employ."
            >

              <AlphaList
                items={
                  clause7Items
                }

                data={
                  data
                }
              />

            </Clause>


            <Clause
              number="8"
              title="Fees"
            />

          </Page>


          {/* ==================================================
              PAGE 4
          ================================================== */}

          <Page
            styleVars={
              styleVars
            }

            logoUrl={
              logoUrl
            }

            pageNumber={
              4
            }

            showPageGuides={
              showPageGuides
            }
          >

            <p className="doc-text">

              <RenderTemplateText
                text={
                  templateText.clause8
                }
                data={
                  data
                }
              />

            </p>


            <Clause
              number="9"
              title="Invoicing."
            >

              <p className="doc-text no-bottom">

                <RenderTemplateText
                  text={
                    templateText.clause9
                  }
                  data={
                    data
                  }
                />

              </p>

            </Clause>


            <Clause
              number="10"
              title="Contractor Warranties."
            >

              <p className="doc-text">

                <RenderTemplateText
                  text={
                    templateText.clause10Intro
                  }
                  data={
                    data
                  }
                />

              </p>


              <AlphaList
                items={[
                  templateText.clause10a,
                  templateText.clause10b,
                  templateText.clause10c,
                ]}
                data={
                  data
                }
              />


              <p className="doc-text no-bottom">

                <RenderTemplateText
                  text={
                    templateText.clause10d
                  }
                  data={
                    data
                  }
                />

              </p>

            </Clause>


            <Clause
              number="11"
              title="Indemnity."
            >

              <p className="doc-text no-bottom">

                <RenderTemplateText
                  text={
                    templateText.clause11
                  }
                  data={
                    data
                  }
                />

              </p>

            </Clause>


            <Clause
              number="12"
              title="Audit:"
            >

              <p className="doc-text no-bottom">

                <RenderTemplateText
                  text={
                    templateText.clause12a
                  }
                  data={
                    data
                  }
                />

              </p>

            </Clause>

          </Page>


          {/* ==================================================
              PAGE 5
          ================================================== */}

          <Page
            styleVars={
              styleVars
            }

            logoUrl={
              logoUrl
            }

            pageNumber={
              5
            }

            showPageGuides={
              showPageGuides
            }
          >

            <p className="doc-text">

              <RenderTemplateText
                text={
                  templateText.clause12b
                }
                data={
                  data
                }
              />

            </p>


            <Clause
              number="13"
              title="Authority"
            >

              <p className="doc-text no-bottom">
                <RenderTemplateText
                  text={
                    templateText.clause13
                  }
                  data={
                    data
                  }
                />
              </p>

            </Clause>


            <Clause
              number="14"
              title="Assignment."
            >

              <p className="doc-text no-bottom">
                <RenderTemplateText
                  text={
                    templateText.clause14
                  }
                  data={
                    data
                  }
                />
              </p>

            </Clause>


            <Clause
              number="15"
              title="Governing Law."
            >

              <p className="doc-text no-bottom">
                <RenderTemplateText
                  text={
                    templateText.clause15
                  }
                  data={
                    data
                  }
                />
              </p>

            </Clause>


            <Clause
              number="16"
              title="Force Majeure"
            >

              <p className="doc-text no-bottom">
                <RenderTemplateText
                  text={
                    templateText.clause16
                  }
                  data={
                    data
                  }
                />
              </p>

            </Clause>


            <Clause
              number="17"
              title="Partial Invalidity"
            >

              <p className="doc-text no-bottom">
                <RenderTemplateText
                  text={
                    templateText.clause17
                  }
                  data={
                    data
                  }
                />
              </p>

            </Clause>


            <Clause
              number="18"
              title="No waiver."
            >

              <p className="doc-text no-bottom">
                <RenderTemplateText
                  text={
                    templateText.clause18
                  }
                  data={
                    data
                  }
                />
              </p>

            </Clause>


            <Clause
              number="19"
              title="Cooperation."
            >

              <p className="doc-text no-bottom">
                <RenderTemplateText
                  text={
                    templateText.clause19
                  }
                  data={
                    data
                  }
                />
              </p>

            </Clause>


            <Clause
              number="20"
              title="Headings."
            >

              <p className="doc-text no-bottom">
                <RenderTemplateText
                  text={
                    templateText.clause20
                  }
                  data={
                    data
                  }
                />
              </p>

            </Clause>


            <Clause
              number="21"
              title="Good Faith."
            >

              <p className="doc-text no-bottom">
                <RenderTemplateText
                  text={
                    templateText.clause21
                  }
                  data={
                    data
                  }
                />
              </p>

            </Clause>

          </Page>


          {/* ==================================================
              PAGE 6 - MSA SIGNATURE PAGE
          ================================================== */}

          <Page
            styleVars={
              styleVars
            }

            logoUrl={
              logoUrl
            }

            pageNumber={
              6
            }

            showPageGuides={
              showPageGuides
            }
          >

            <Clause
              number="22"
              title="Entire Agreement."
            >

              <p className="doc-text no-bottom">

                <RenderTemplateText
                  text={
                    templateText.clause22
                  }
                  data={
                    data
                  }
                />

              </p>

            </Clause>


            <Clause
              number="23"
              title="Notices."
            >

              <p className="doc-text no-bottom">

                <RenderTemplateText
                  text={
                    templateText.clause23
                  }
                  data={
                    data
                  }
                />

              </p>

            </Clause>


            <div className="notice-grid">

              <p>

                Taproot Solutions Inc.,

                <br />

                317 Ranch Road 620 South,

                <br />

                Suite 302F, Austin, TX 78734

                <br />

                Fax: ____________

                <br />

                Email:{" "}

                <u>
                  Contracts@taproot-solutions.com
                </u>

              </p>


              <p>

                <Field
                  token="{{VENDOR_NAME}}"
                  data={
                    data
                  }
                />.

                <br />

                <Field
                  token="{{COMPANY_ADDRESS}}"
                  data={
                    data
                  }
                />

                <br />

                Fax: ____________

                <br />

                Email:{" "}

                <Field
                  token="{{VENDOR_EMAIL_ID}}"
                  data={
                    data
                  }
                />

              </p>

            </div>


            <p className="doc-text">

              <RenderTemplateText
                text={
                  templateText.executionParagraph
                }
                data={
                  data
                }
              />

            </p>


            <div className="signature-columns">

              <SignatureBlock
                partyTitle="Contractor: {{VENDOR_NAME}}."

                signerName="{{Authorized_Signature_Name}}"

                signerTitle="{{Authorized_Person_Title}}"

                date="{{CURRENT_DATE}}"

                signatureText={
                  data?.vendorSignatureText
                }

                data={
                  data
                }

                signatureFieldId={
                  SIGNATURE_FIELD_IDS
                    .MSA_VENDOR_SIGNATURE
                }

                auditFieldId={
                  SIGNATURE_FIELD_IDS
                    .MSA_VENDOR_AUDIT
                }

                guardId={
                  SIGNATURE_GUARD_IDS
                    .MSA_VENDOR_META
                }
              />


              <SignatureBlock
                partyTitle="Company: Taproot Solutions INC."

                signerName="Purnima Govada"

                signerTitle="Director"

                date="{{CURRENT_DATE}}"

                signatureText={
                  data?.companySignatureText
                }

                data={
                  data
                }

                signatureFieldId={
                  SIGNATURE_FIELD_IDS
                    .MSA_TAPROOT_SIGNATURE
                }

                auditFieldId={
                  SIGNATURE_FIELD_IDS
                    .MSA_TAPROOT_AUDIT
                }

                guardId={
                  SIGNATURE_GUARD_IDS
                    .MSA_TAPROOT_META
                }
              />

            </div>

          </Page>

        </>

      )}


      {/* ======================================================
          PAGE 7 - WORK ORDER
      ====================================================== */}

      {showWO && (

        <Page
          styleVars={
            styleVars
          }

          logoUrl={
            logoUrl
          }

          pageNumber={
            showMSA
              ? 7
              : 1
          }

          showPageGuides={
            showPageGuides
          }
        >

          <h1 className="doc-wo-title">
            Consulting Services Purchase Order
          </h1>


          <p className="doc-text">

            <RenderTemplateText
              text={
                templateText.woIntro
              }
              data={
                data
              }
            />

          </p>


          <table className="doc-table wo-table">

            <tbody>

              <tr>

                <td>
                  Purchase Order #
                </td>

                <td>
                  Taproot-Subk-
                  <Field
                    token="{{CONTRACT_NUMBER}}"
                    data={
                      data
                    }
                  />
                </td>

              </tr>


              <tr>

                <td>
                  Contractor Resources Assigned:
                </td>

                <td>

                  <Field
                    token="{{CANDIDATE_NAME}}"
                    data={
                      data
                    }
                  />

                </td>

              </tr>


              <tr>

                <td>
                  Tentative Start Date
                </td>

                <td>

                  <Field
                    token="{{Tentative_Start_Date}}"
                    data={
                      data
                    }
                  />

                </td>

              </tr>


              <tr>

                <td>
                  Job Title :
                </td>

                <td>

                  <Field
                    token="{{Job_Title_Name}}"
                    data={
                      data
                    }
                  />

                </td>

              </tr>


              <tr>

                <td>
                  Client Name:
                </td>

                <td>

                  <Field
                    token="{{Client_Name}}"
                    data={
                      data
                    }
                  />

                </td>

              </tr>


              <tr>

                <td>
                  Client Location:
                </td>

                <td>

                  <Field
                    token="{{Client_Location}}"
                    data={
                      data
                    }
                  />

                </td>

              </tr>


              <tr>

                <td>
                  Type of work
                </td>

                <td>

                  <Field
                    token="{{TYPE_OF_SERVICES}}"
                    data={
                      data
                    }
                  />

                </td>

              </tr>


              <tr>

                <td>
                  Type of Subcontract
                </td>

                <td>

                  Time and Materials

                  <br />

                  <Field
                    token="{{TYPE_OF_SUBCONTRACT}}"
                    data={
                      data
                    }
                  />

                </td>

              </tr>


              <tr>

                <td>
                  Rate
                </td>

                <td>

                  ${" "}

                  <Field
                    token="{{RATE}}"
                    data={
                      data
                    }
                  />{" "}

                  <Field
                    token="{{PER_HOUR}}"
                    data={
                      data
                    }
                  />

                </td>

              </tr>


              <tr>

                <td>
                  Payment Terms
                </td>

                <td>

                  <Field
                    token="{{NET}}"
                    data={
                      data
                    }
                  />{" "}

                  days after receipt of acceptable invoice.

                </td>

              </tr>


              <tr>

                <td>
                  Taproot Subcontract Administrator
                </td>

                <td>
                  Purnima Govada, Director
                </td>

              </tr>

            </tbody>

          </table>


          <div className="wo-signature-columns">

            <SignatureBlock
              variant="wo"

              partyTitle="Accepted:|Contractor: {{VENDOR_NAME}}."

              signerName="{{Authorized_Signature_Name}}"

              signerTitle="{{Authorized_Person_Title}}"

              date="{{CURRENT_DATE}}"

              signatureText={
                data?.vendorSignatureText
              }

              data={
                data
              }

              signatureFieldId={
                SIGNATURE_FIELD_IDS
                  .WO_VENDOR_SIGNATURE
              }

              auditFieldId={
                SIGNATURE_FIELD_IDS
                  .WO_VENDOR_AUDIT
              }

              guardId={
                SIGNATURE_GUARD_IDS
                  .WO_VENDOR_META
              }
            />


            <SignatureBlock
              variant="wo"

              partyTitle="Accepted:|Company: Taproot Solutions INC."

              signerName="Purnima Govada"

              signerTitle="Director"

              date="{{CURRENT_DATE}}"

              signatureText={
                data?.companySignatureText
              }

              data={
                data
              }

              signatureFieldId={
                SIGNATURE_FIELD_IDS
                  .WO_TAPROOT_SIGNATURE
              }

              auditFieldId={
                SIGNATURE_FIELD_IDS
                  .WO_TAPROOT_AUDIT
              }

              guardId={
                SIGNATURE_GUARD_IDS
                  .WO_TAPROOT_META
              }
            />

          </div>

        </Page>

      )}

    </>
  );
};