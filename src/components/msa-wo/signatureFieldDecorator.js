// src/components/msa-wo/signatureFieldDecorator.js

import {
  SIGNATURE_FIELD_IDS,
} from "./signaturePlacement";


/* ============================================================
   INTERNAL CONSTANTS
============================================================ */

const GENERATED_ATTRIBUTE =
  "data-vms-generated-signature-field";


const generatedSelector =
  `[${GENERATED_ATTRIBUTE}="true"]`;


/* ============================================================
   HELPERS
============================================================ */

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


const createGeneratedElement =
  (
    className,
    fieldName
  ) => {

    const element =
      document.createElement(
        "div"
      );


    element.className =
      className;


    element.setAttribute(
      GENERATED_ATTRIBUTE,
      "true"
    );


    element.setAttribute(
      "data-signature-field",
      fieldName
    );


    element.setAttribute(
      "contenteditable",
      "false"
    );


    element.setAttribute(
      "aria-hidden",
      "true"
    );


    return element;
  };


const clearGeneratedChildren =
  (
    element
  ) => {

    Array.from(
      element.querySelectorAll(
        generatedSelector
      )
    ).forEach(
      (
        child
      ) => {
        child.remove();
      }
    );
  };


/* ============================================================
   MSA PAGE 6
============================================================ */

const decorateMSASignatures =
  (
    root
  ) => {

    const msaPage =
      requireElement(
        root.querySelector(
          '.a4-page[data-page-id="msa-page-6"]'
        ),

        "MSA signature page could not be located."
      );


    const signatureBlock =
      requireElement(
        msaPage.querySelector(
          '[data-block-id="p6-signatures"]'
        ),

        "MSA signature block p6-signatures could not be located."
      );


    const sections =
      Array.from(
        signatureBlock
          .querySelectorAll(
            ".signature-columns > section"
          )
      );


    if (
      sections.length <
      2
    ) {
      throw new Error(
        "MSA signature block must contain Vendor and Taproot signature columns."
      );
    }


    const configs = [
      {
        section:
          sections[
            0
          ],

        signatureField:
          SIGNATURE_FIELD_IDS
            .MSA_VENDOR_SIGNATURE,

        auditField:
          SIGNATURE_FIELD_IDS
            .MSA_VENDOR_AUDIT,

        guardName:
          "msa.vendor.meta",
      },

      {
        section:
          sections[
            1
          ],

        signatureField:
          SIGNATURE_FIELD_IDS
            .MSA_TAPROOT_SIGNATURE,

        auditField:
          SIGNATURE_FIELD_IDS
            .MSA_TAPROOT_AUDIT,

        guardName:
          "msa.taproot.meta",
      },
    ];


    configs.forEach(
      (
        config
      ) => {

        const signatureSpace =
          requireElement(
            config.section
              .querySelector(
                ".signature-space"
              ),

            `Signature space could not be located for ${config.signatureField}.`
          );


        const signatureMeta =
          requireElement(
            config.section
              .querySelector(
                ".signature-meta"
              ),

            `Signature metadata could not be located for ${config.signatureField}.`
          );


        /*
         * The source template intentionally contains an empty
         * signature-space.
         *
         * If an editor has inserted visible text inside it,
         * refuse to silently stamp a signature over that text.
         */
        const visibleExistingText =
          Array.from(
            signatureSpace
              .childNodes
          )
            .filter(
              (
                node
              ) =>
                !(
                  node.nodeType ===
                    Node.ELEMENT_NODE &&
                  node.getAttribute?.(
                    GENERATED_ATTRIBUTE
                  ) ===
                    "true"
                )
            )
            .map(
              (
                node
              ) =>
                node.textContent ||
                ""
            )
            .join("")
            .trim();


        if (
          visibleExistingText
        ) {
          throw new Error(
            `The reserved signature space for ${config.signatureField} contains editable content. Remove that content before generating the agreement.`
          );
        }


        clearGeneratedChildren(
          signatureSpace
        );


        signatureSpace
          .classList
          .add(
            "signature-capture-space"
          );


        signatureMeta
          .setAttribute(
            "data-signature-guard",
            config.guardName
          );


        const signatureZone =
          createGeneratedElement(
            "signature-image-zone",
            config.signatureField
          );


        const auditZone =
          createGeneratedElement(
            "signature-audit-zone",
            config.auditField
          );


        signatureSpace
          .appendChild(
            signatureZone
          );


        signatureSpace
          .appendChild(
            auditZone
          );
      }
    );
  };


/* ============================================================
   WORK ORDER PAGE 7
============================================================ */

const decorateWOSignatures =
  (
    root
  ) => {

    const woPage =
      requireElement(
        root.querySelector(
          '.a4-page[data-page-id="wo-page-1"]'
        ),

        "Work Order signature page could not be located."
      );


    const signatureBlock =
      requireElement(
        woPage.querySelector(
          '[data-block-id="p7-signature-table"]'
        ),

        "Work Order signature block p7-signature-table could not be located."
      );


    const table =
      requireElement(
        signatureBlock
          .querySelector(
            "table.wo-signature-table"
          ),

        "Work Order signature table could not be located."
      );


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
        "Work Order signature table must contain Signature, Name, Title and Date rows."
      );
    }


    const firstRowCells =
      Array.from(
        rows[
          0
        ].cells ||
        []
      );


    if (
      firstRowCells.length <
      3
    ) {
      throw new Error(
        "Work Order signature table layout is invalid."
      );
    }


    const vendorCell =
      firstRowCells[
        0
      ];


    const taprootCell =
      firstRowCells[
        2
      ];


    const decorateCell =
      (
        cell,
        signatureField,
        auditField
      ) => {

        const signatureContainer =
          requireElement(
            cell.querySelector(
              ".wo-signature-cell"
            ),

            `Work Order signature container is missing for ${signatureField}.`
          );


        /*
         * This is the OFF-SCREEN export DOM only.
         * It does not modify the saved WYSIWYG template.
         */
        signatureContainer
          .innerHTML =
          "";


        signatureContainer
          .classList
          .add(
            "wo-signature-capture-space"
          );


        const label =
          document.createElement(
            "div"
          );


        label.className =
          "wo-signature-label";


        label.textContent =
          "Signature:";


        label.setAttribute(
          GENERATED_ATTRIBUTE,
          "true"
        );


        label.setAttribute(
          "contenteditable",
          "false"
        );


        const signatureZone =
          createGeneratedElement(
            "wo-signature-image-zone",
            signatureField
          );


        const auditZone =
          createGeneratedElement(
            "wo-signature-audit-zone",
            auditField
          );


        signatureContainer
          .appendChild(
            label
          );


        signatureContainer
          .appendChild(
            signatureZone
          );


        signatureContainer
          .appendChild(
            auditZone
          );
      };


    decorateCell(
      vendorCell,

      SIGNATURE_FIELD_IDS
        .WO_VENDOR_SIGNATURE,

      SIGNATURE_FIELD_IDS
        .WO_VENDOR_AUDIT
    );


    decorateCell(
      taprootCell,

      SIGNATURE_FIELD_IDS
        .WO_TAPROOT_SIGNATURE,

      SIGNATURE_FIELD_IDS
        .WO_TAPROOT_AUDIT
    );


    /* --------------------------------------------------------
       PROTECT NAME / TITLE / DATE ROWS
    -------------------------------------------------------- */

    const guardRows = [
      {
        rowIndex:
          1,

        vendor:
          "wo.vendor.name",

        taproot:
          "wo.taproot.name",
      },

      {
        rowIndex:
          2,

        vendor:
          "wo.vendor.title",

        taproot:
          "wo.taproot.title",
      },

      {
        rowIndex:
          3,

        vendor:
          "wo.vendor.date",

        taproot:
          "wo.taproot.date",
      },
    ];


    guardRows.forEach(
      (
        config
      ) => {

        const cells =
          Array.from(
            rows[
              config.rowIndex
            ]?.cells ||
            []
          );


        if (
          cells.length <
          3
        ) {
          throw new Error(
            "Work Order Name/Title/Date signature layout is invalid."
          );
        }


        cells[
          0
        ].setAttribute(
          "data-signature-guard",
          config.vendor
        );


        cells[
          2
        ].setAttribute(
          "data-signature-guard",
          config.taproot
        );
      }
    );
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
        "MSA / WO export renderer is unavailable."
      );
    }


    const pages =
      Array.from(
        documentRoot
          .querySelectorAll(
            ".a4-page"
          )
      );


    if (
      pages.length !==
      7
    ) {
      throw new Error(
        `Expected exactly 7 MSA/WO pages before preparing signature fields. Found ${pages.length}.`
      );
    }


    decorateMSASignatures(
      documentRoot
    );


    decorateWOSignatures(
      documentRoot
    );


    return true;
  };


export default prepareSignaturePlacementFields;