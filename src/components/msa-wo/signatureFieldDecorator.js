// src/components/msa-wo/signatureFieldDecorator.js

import {
  SIGNATURE_FIELD_IDS,
  SIGNATURE_GUARD_IDS,
} from "./signaturePlacement";


/* ============================================================
   GENERATED ELEMENT MARKER
============================================================ */

const GENERATED_ATTRIBUTE =
  "data-vms-generated-signature-layout";


const GENERATED_VALUE =
  "true";


/* ============================================================
   HELPERS
============================================================ */

const markGenerated =
  (
    element
  ) => {
    element.setAttribute(
      GENERATED_ATTRIBUTE,
      GENERATED_VALUE
    );

    element.setAttribute(
      "contenteditable",
      "false"
    );

    return element;
  };


const getGeneratedSelector =
  () =>
    `[${GENERATED_ATTRIBUTE}="${GENERATED_VALUE}"]`;


const requireElement =
  (
    element,
    message
  ) => {
    if (
      !element
    ) {
      throw new Error(
        message
      );
    }

    return element;
  };


const createField =
  (
    className,
    fieldName
  ) => {
    const element =
      markGenerated(
        document.createElement(
          "div"
        )
      );

    element.className =
      className;

    element.dataset
      .signatureField =
      fieldName;

    element.setAttribute(
      "aria-hidden",
      "true"
    );

    return element;
  };


const createLabel =
  (
    value =
      "Signature:"
  ) => {
    const element =
      markGenerated(
        document.createElement(
          "div"
        )
      );

    element.className =
      "wo-signature-label";

    element.textContent =
      value;

    return element;
  };


const removeGeneratedChildren =
  (
    element
  ) => {
    if (
      !element
    ) {
      return;
    }

    Array.from(
      element.querySelectorAll(
        getGeneratedSelector()
      )
    ).forEach(
      (
        generated
      ) => {
        generated.remove();
      }
    );
  };


/* ============================================================
   LOCATE PHYSICAL PAGES

   Prefer stable page IDs.

   Fall back to physical indexes so older published template
   versions can still be exported.
============================================================ */

const getMsaSignaturePage =
  (
    root
  ) => {
    const pages =
      Array.from(
        root.querySelectorAll(
          ".a4-page"
        )
      );

    return (
      root.querySelector(
        '.a4-page[data-page-id="msa-page-6"]'
      ) ||
      pages[
        5
      ] ||
      null
    );
  };


const getWoSignaturePage =
  (
    root
  ) => {
    const pages =
      Array.from(
        root.querySelectorAll(
          ".a4-page"
        )
      );

    return (
      root.querySelector(
        '.a4-page[data-page-id="wo-page-1"]'
      ) ||
      pages[
        6
      ] ||
      null
    );
  };


/* ============================================================
   MSA SIGNATURE SPACE
============================================================ */

const ensureMsaSignatureSpace =
  (
    section,
    signatureField,
    auditField
  ) => {
    let signatureLabel =
      section.querySelector(
        ".signature-label"
      );


    /*
     * If a user edited the template and removed the dedicated
     * Signature label class, recreate the label automatically.
     */
    if (
      !signatureLabel
    ) {
      signatureLabel =
        markGenerated(
          document.createElement(
            "div"
          )
        );

      signatureLabel.className =
        "signature-label";

      signatureLabel.textContent =
        "Signature:";


      const partyTitle =
        section.querySelector(
          ".signature-party-title"
        );


      if (
        partyTitle
      ) {
        partyTitle.insertAdjacentElement(
          "afterend",
          signatureLabel
        );
      } else {
        section.prepend(
          signatureLabel
        );
      }
    }


    /*
     * Reuse an existing signature-space if the original
     * contract template already contains one.
     */
    let signatureSpace =
      section.querySelector(
        ".signature-space"
      );


    /*
     * Otherwise create the signing space automatically.
     *
     * This is the key behavior requested:
     * Template Editor users do NOT need to manually create
     * or size a signature image box.
     */
    if (
      !signatureSpace
    ) {
      signatureSpace =
        markGenerated(
          document.createElement(
            "div"
          )
        );

      signatureSpace.className =
        [
          "signature-space",
          "signature-capture-space",
          "vms-generated-signature-space",
        ].join(
          " "
        );


      signatureLabel
        .insertAdjacentElement(
          "afterend",
          signatureSpace
        );
    } else {
      signatureSpace.classList.add(
        "signature-capture-space"
      );
    }


    /*
     * Do not silently overwrite actual template content if
     * somebody intentionally inserted text into the physical
     * signature area.
     */
    const nonGeneratedNodes =
      Array.from(
        signatureSpace
          .childNodes
      )
        .filter(
          (
            node
          ) => {
            if (
              node.nodeType ===
              Node.TEXT_NODE
            ) {
              return Boolean(
                node.textContent
                  ?.trim()
              );
            }


            if (
              node.nodeType ===
              Node.ELEMENT_NODE
            ) {
              return (
                node.getAttribute(
                  GENERATED_ATTRIBUTE
                ) !==
                GENERATED_VALUE
              );
            }


            return false;
          }
        );


    const existingVisibleText =
      nonGeneratedNodes
        .map(
          (
            node
          ) =>
            node.textContent ||
            ""
        )
        .join(
          ""
        )
        .trim();


    if (
      existingVisibleText
    ) {
      throw new Error(
        `The MSA reserved signing area for ${signatureField} contains template text. Remove that text or provide additional signing room in the template.`
      );
    }


    removeGeneratedChildren(
      signatureSpace
    );


    const imageZone =
      createField(
        "signature-image-zone",
        signatureField
      );


    const auditZone =
      createField(
        "signature-audit-zone",
        auditField
      );


    signatureSpace.append(
      imageZone,
      auditZone
    );


    return signatureSpace;
  };


/* ============================================================
   DECORATE MSA PAGE 6
============================================================ */

const decorateMsaPage =
  (
    root
  ) => {
    const page =
      requireElement(
        getMsaSignaturePage(
          root
        ),
        "MSA signature page 6 could not be located."
      );


    const signatureBlock =
      page.querySelector(
        '[data-block-id="p6-signatures"]'
      ) ||
      page.querySelector(
        ".signature-columns"
      )
        ?.closest(
          ".editable-block"
        ) ||
      page;


    const columns =
      signatureBlock.querySelector(
        ".signature-columns"
      );


    if (
      !columns
    ) {
      throw new Error(
        "Page 6 does not contain the MSA signing section. The document must contain Vendor and Taproot signing columns before it can be sent for signature."
      );
    }


    const sections =
      Array.from(
        columns.querySelectorAll(
          ":scope > section"
        )
      );


    if (
      sections.length <
      2
    ) {
      throw new Error(
        "The MSA signing section must contain both Vendor and Taproot columns."
      );
    }


    const vendorSection =
      sections[
        0
      ];


    const taprootSection =
      sections[
        1
      ];


    ensureMsaSignatureSpace(
      vendorSection,

      SIGNATURE_FIELD_IDS
        .MSA_VENDOR_SIGNATURE,

      SIGNATURE_FIELD_IDS
        .MSA_VENDOR_AUDIT
    );


    ensureMsaSignatureSpace(
      taprootSection,

      SIGNATURE_FIELD_IDS
        .MSA_TAPROOT_SIGNATURE,

      SIGNATURE_FIELD_IDS
        .MSA_TAPROOT_AUDIT
    );


    const vendorMeta =
      requireElement(
        vendorSection.querySelector(
          ".signature-meta"
        ),
        "Vendor Name / Title / Date section is missing from MSA page 6."
      );


    const taprootMeta =
      requireElement(
        taprootSection.querySelector(
          ".signature-meta"
        ),
        "Taproot Name / Title / Date section is missing from MSA page 6."
      );


    vendorMeta.dataset
      .signatureGuard =
      SIGNATURE_GUARD_IDS
        .MSA_VENDOR_META;


    taprootMeta.dataset
      .signatureGuard =
      SIGNATURE_GUARD_IDS
        .MSA_TAPROOT_META;
  };


/* ============================================================
   BUILD WORK ORDER SIGNING CELL
============================================================ */

const decorateWoSignatureCell =
  (
    cell,
    signatureField,
    auditField
  ) => {
    const existingContainer =
      cell.querySelector(
        ".wo-signature-cell"
      );


    const existingLabel =
      existingContainer
        ?.textContent
        ?.trim() ||
      cell.textContent
        ?.trim() ||
      "Signature:";


    let container =
      existingContainer;


    if (
      !container
    ) {
      container =
        markGenerated(
          document.createElement(
            "div"
          )
        );

      cell.innerHTML =
        "";

      cell.appendChild(
        container
      );
    } else {
      container.innerHTML =
        "";
    }


    container.className =
      [
        "wo-signature-cell",
        "wo-signature-capture-space",
      ].join(
        " "
      );


    container.setAttribute(
      GENERATED_ATTRIBUTE,
      GENERATED_VALUE
    );


    container.setAttribute(
      "contenteditable",
      "false"
    );


    const label =
      createLabel(
        existingLabel
          .toLowerCase()
          .includes(
            "signature"
          )
          ? "Signature:"
          : "Signature:"
      );


    const imageZone =
      createField(
        "wo-signature-image-zone",
        signatureField
      );


    const auditZone =
      createField(
        "wo-signature-audit-zone",
        auditField
      );


    container.append(
      label,
      imageZone,
      auditZone
    );
  };


/* ============================================================
   DECORATE WORK ORDER PAGE 7
============================================================ */

const decorateWoPage =
  (
    root
  ) => {
    const page =
      requireElement(
        getWoSignaturePage(
          root
        ),
        "Work Order signature page 7 could not be located."
      );


    const block =
      page.querySelector(
        '[data-block-id="p7-signature-table"]'
      ) ||
      page;


    const table =
      block.querySelector(
        "table.wo-signature-table"
      );


    if (
      !table
    ) {
      throw new Error(
        "Page 7 does not contain the Work Order signing table. The document must contain Signature, Name, Title and Date rows."
      );
    }


    const rows =
      Array.from(
        table.rows ||
        []
      );


    if (
      rows.length <
      4
    ) {
      throw new Error(
        "The Work Order signing table must contain Signature, Name, Title and Date rows."
      );
    }


    const getSignerCells =
      (
        rowIndex
      ) => {
        const cells =
          Array.from(
            rows[
              rowIndex
            ]?.cells ||
            []
          );


        if (
          cells.length <
          3
        ) {
          throw new Error(
            "Work Order signing table must contain Vendor, divider and Taproot columns."
          );
        }


        return {
          vendor:
            cells[
              0
            ],

          taproot:
            cells[
              2
            ],
        };
      };


    /* --------------------------------------------------------
       SIGNATURE ROW
    -------------------------------------------------------- */

    const signatureCells =
      getSignerCells(
        0
      );


    decorateWoSignatureCell(
      signatureCells.vendor,

      SIGNATURE_FIELD_IDS
        .WO_VENDOR_SIGNATURE,

      SIGNATURE_FIELD_IDS
        .WO_VENDOR_AUDIT
    );


    decorateWoSignatureCell(
      signatureCells.taproot,

      SIGNATURE_FIELD_IDS
        .WO_TAPROOT_SIGNATURE,

      SIGNATURE_FIELD_IDS
        .WO_TAPROOT_AUDIT
    );


    /* --------------------------------------------------------
       NAME ROW
    -------------------------------------------------------- */

    const nameCells =
      getSignerCells(
        1
      );


    nameCells.vendor.dataset
      .signatureGuard =
      SIGNATURE_GUARD_IDS
        .WO_VENDOR_NAME;


    nameCells.taproot.dataset
      .signatureGuard =
      SIGNATURE_GUARD_IDS
        .WO_TAPROOT_NAME;


    /* --------------------------------------------------------
       TITLE ROW
    -------------------------------------------------------- */

    const titleCells =
      getSignerCells(
        2
      );


    titleCells.vendor.dataset
      .signatureGuard =
      SIGNATURE_GUARD_IDS
        .WO_VENDOR_TITLE;


    titleCells.taproot.dataset
      .signatureGuard =
      SIGNATURE_GUARD_IDS
        .WO_TAPROOT_TITLE;


    /* --------------------------------------------------------
       DATE ROW
    -------------------------------------------------------- */

    const dateCells =
      getSignerCells(
        3
      );


    dateCells.vendor.dataset
      .signatureGuard =
      SIGNATURE_GUARD_IDS
        .WO_VENDOR_DATE;


    dateCells.taproot.dataset
      .signatureGuard =
      SIGNATURE_GUARD_IDS
        .WO_TAPROOT_DATE;
  };


/* ============================================================
   PUBLIC FUNCTION
============================================================ */

export const prepareSignaturePlacementFields =
  (
    documentRoot
  ) => {
    if (
      !documentRoot
    ) {
      throw new Error(
        "MSA / WO export document is unavailable."
      );
    }


    const pages =
      Array.from(
        documentRoot.querySelectorAll(
          ".a4-page"
        )
      );


    if (
      pages.length !==
      7
    ) {
      throw new Error(
        `Expected exactly 7 MSA/WO physical pages before preparing signatures. Found ${pages.length}.`
      );
    }


    decorateMsaPage(
      documentRoot
    );


    decorateWoPage(
      documentRoot
    );


    return {
      success:
        true,

      pageCount:
        pages.length,
    };
  };


export default prepareSignaturePlacementFields;