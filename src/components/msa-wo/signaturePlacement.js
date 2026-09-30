// src/components/msa-wo/signaturePlacement.js


/* ============================================================
   VMS 2.0
   ADAPTIVE ELECTRONIC SIGNATURE PLACEMENT MANIFEST

   Coordinate system:
   normalized-page

   x / y / width / height are always between 0 and 1.

   This means the Python backend does NOT depend on hard-coded
   A4 point coordinates and can convert the exact browser
   geometry into the actual PDF page geometry.
============================================================ */


/* ============================================================
   FIELD IDS

   IMPORTANT:
   These IDs become part of the stored document evidence.

   Once production documents use these names, do not rename
   them without introducing a new manifest schema version.
============================================================ */

export const SIGNATURE_FIELD_IDS =
  Object.freeze({

    MSA_VENDOR_SIGNATURE:
      "msa.vendor.signature",

    MSA_VENDOR_AUDIT:
      "msa.vendor.audit",

    MSA_TAPROOT_SIGNATURE:
      "msa.taproot.signature",

    MSA_TAPROOT_AUDIT:
      "msa.taproot.audit",

    WO_VENDOR_SIGNATURE:
      "wo.vendor.signature",

    WO_VENDOR_AUDIT:
      "wo.vendor.audit",

    WO_TAPROOT_SIGNATURE:
      "wo.taproot.signature",

    WO_TAPROOT_AUDIT:
      "wo.taproot.audit",
  });


/* ============================================================
   REQUIRED FIELDS
============================================================ */

export const REQUIRED_MSA_WO_SIGNATURE_FIELDS =
  Object.freeze([
    SIGNATURE_FIELD_IDS
      .MSA_VENDOR_SIGNATURE,

    SIGNATURE_FIELD_IDS
      .MSA_VENDOR_AUDIT,

    SIGNATURE_FIELD_IDS
      .MSA_TAPROOT_SIGNATURE,

    SIGNATURE_FIELD_IDS
      .MSA_TAPROOT_AUDIT,

    SIGNATURE_FIELD_IDS
      .WO_VENDOR_SIGNATURE,

    SIGNATURE_FIELD_IDS
      .WO_VENDOR_AUDIT,

    SIGNATURE_FIELD_IDS
      .WO_TAPROOT_SIGNATURE,

    SIGNATURE_FIELD_IDS
      .WO_TAPROOT_AUDIT,
  ]);


/* ============================================================
   CONSTANTS
============================================================ */

export const SIGNATURE_MANIFEST_SCHEMA_VERSION =
  1;


export const SIGNATURE_COORDINATE_SYSTEM =
  "normalized-page";


const DEFAULT_TEMPLATE_ID =
  "TPL-MSA-WO-TAPROOT";


/* ============================================================
   NUMBER HELPERS
============================================================ */

const roundCoordinate =
  (
    value
  ) =>
    Number(
      Number(
        value
      ).toFixed(
        8
      )
    );


const clamp01 =
  (
    value
  ) =>
    Math.min(
      1,

      Math.max(
        0,
        value
      )
    );


/* ============================================================
   NORMALIZED DOM RECT
============================================================ */

const normalizedRectFromDom =
  (
    elementRect,
    pageRect
  ) => {

    if (
      !pageRect ||
      !pageRect.width ||
      !pageRect.height
    ) {
      throw new Error(
        "Invalid A4 page dimensions while building the electronic-signature placement manifest."
      );
    }


    const rawX =
      (
        elementRect.left -
        pageRect.left
      ) /
      pageRect.width;


    const rawY =
      (
        elementRect.top -
        pageRect.top
      ) /
      pageRect.height;


    const rawWidth =
      elementRect.width /
      pageRect.width;


    const rawHeight =
      elementRect.height /
      pageRect.height;


    return {
      x:
        roundCoordinate(
          clamp01(
            rawX
          )
        ),

      y:
        roundCoordinate(
          clamp01(
            rawY
          )
        ),

      width:
        roundCoordinate(
          clamp01(
            rawWidth
          )
        ),

      height:
        roundCoordinate(
          clamp01(
            rawHeight
          )
        ),
    };
  };


/* ============================================================
   RECTANGLE OVERLAP
============================================================ */

const rectanglesOverlap =
  (
    first,
    second
  ) => {

    const firstRight =
      first.x +
      first.width;


    const firstBottom =
      first.y +
      first.height;


    const secondRight =
      second.x +
      second.width;


    const secondBottom =
      second.y +
      second.height;


    return !(
      firstRight <=
        second.x ||

      secondRight <=
        first.x ||

      firstBottom <=
        second.y ||

      secondBottom <=
        first.y
    );
  };


/* ============================================================
   RECT VALIDATION
============================================================ */

const validateNormalizedRect =
  (
    rect,
    fieldName
  ) => {

    if (
      !rect ||
      typeof rect !==
        "object"
    ) {
      throw new Error(
        `Invalid placement rectangle for ${fieldName}.`
      );
    }


    for (
      const key of [
        "x",
        "y",
        "width",
        "height",
      ]
    ) {

      const value =
        rect[
          key
        ];


      if (
        typeof value !==
          "number" ||
        !Number.isFinite(
          value
        )
      ) {
        throw new Error(
          `Invalid ${key} coordinate for ${fieldName}.`
        );
      }


      if (
        value < 0 ||
        value > 1
      ) {
        throw new Error(
          `${fieldName}.${key} must be between 0 and 1.`
        );
      }
    }


    if (
      rect.width <=
        0.01 ||
      rect.height <=
        0.005
    ) {
      throw new Error(
        `Electronic-signature field ${fieldName} is too small.`
      );
    }


    if (
      rect.x +
        rect.width >
      1.00001
    ) {
      throw new Error(
        `${fieldName} extends beyond the right edge of the document page.`
      );
    }


    if (
      rect.y +
        rect.height >
      1.00001
    ) {
      throw new Error(
        `${fieldName} extends beyond the bottom edge of the document page.`
      );
    }
  };


/* ============================================================
   BUILD MANIFEST
============================================================ */

export const buildSignaturePlacementManifest =
  (
    documentRoot,

    {
      expectedPageCount =
        7,

      templateId =
        DEFAULT_TEMPLATE_ID,

      templateVersion =
        1,

      documentType =
        "MSA_WO",
    } = {}
  ) => {

    if (
      !documentRoot
    ) {
      throw new Error(
        "Document renderer is unavailable."
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
      expectedPageCount
    ) {
      throw new Error(
        `Document contains ${pages.length} rendered pages. Expected exactly ${expectedPageCount}.`
      );
    }


    const fields =
      {};


    const guards =
      {};


    pages.forEach(
      (
        page,
        pageIndex
      ) => {

        const pageRect =
          page.getBoundingClientRect();


        if (
          pageRect.width <=
            0 ||
          pageRect.height <=
            0
        ) {
          throw new Error(
            `Physical page ${pageIndex + 1} has invalid rendered dimensions.`
          );
        }


        /* ----------------------------------------------------
           SIGNATURE FIELDS
        ---------------------------------------------------- */

        const signatureElements =
          Array.from(
            page.querySelectorAll(
              "[data-signature-field]"
            )
          );


        signatureElements.forEach(
          (
            element
          ) => {

            const fieldName =
              element.dataset
                .signatureField;


            if (
              !fieldName
            ) {
              return;
            }


            if (
              fields[
                fieldName
              ]
            ) {
              throw new Error(
                `Duplicate electronic-signature field detected: ${fieldName}.`
              );
            }


            const rect =
              normalizedRectFromDom(
                element
                  .getBoundingClientRect(),

                pageRect
              );


            validateNormalizedRect(
              rect,
              fieldName
            );


            fields[
              fieldName
            ] = {
              pageIndex,

              ...rect,
            };
          }
        );


        /* ----------------------------------------------------
           PROTECTED AREAS

           Examples:
           - Name
           - Title
           - Date
           - other template content that signatures must never
             overlap.
        ---------------------------------------------------- */

        const guardElements =
          Array.from(
            page.querySelectorAll(
              "[data-signature-guard]"
            )
          );


        guardElements.forEach(
          (
            element
          ) => {

            const guardName =
              element.dataset
                .signatureGuard;


            if (
              !guardName
            ) {
              return;
            }


            if (
              guards[
                guardName
              ]
            ) {
              throw new Error(
                `Duplicate protected signature area detected: ${guardName}.`
              );
            }


            const rect =
              normalizedRectFromDom(
                element
                  .getBoundingClientRect(),

                pageRect
              );


            validateNormalizedRect(
              rect,
              guardName
            );


            guards[
              guardName
            ] = {
              pageIndex,

              ...rect,
            };
          }
        );
      }
    );


    /* --------------------------------------------------------
       ALL REQUIRED FIELDS MUST EXIST
    -------------------------------------------------------- */

    REQUIRED_MSA_WO_SIGNATURE_FIELDS
      .forEach(
        (
          fieldName
        ) => {

          if (
            !fields[
              fieldName
            ]
          ) {
            throw new Error(
              `Required electronic-signature field is missing: ${fieldName}.`
            );
          }
        }
      );


    /* --------------------------------------------------------
       FIELD / GUARD COLLISION VALIDATION
    -------------------------------------------------------- */

    Object.entries(
      fields
    ).forEach(
      (
        [
          fieldName,
          fieldRect,
        ]
      ) => {

        Object.entries(
          guards
        ).forEach(
          (
            [
              guardName,
              guardRect,
            ]
          ) => {

            if (
              fieldRect.pageIndex !==
              guardRect.pageIndex
            ) {
              return;
            }


            if (
              rectanglesOverlap(
                fieldRect,
                guardRect
              )
            ) {
              throw new Error(
                `${fieldName} overlaps protected document area ${guardName}. Adjust the document template before generating the agreement.`
              );
            }
          }
        );
      }
    );


    /* --------------------------------------------------------
       SIGNATURE AND AUDIT AREAS MAY NOT OVERLAP
    -------------------------------------------------------- */

    const pairs = [
      [
        SIGNATURE_FIELD_IDS
          .MSA_VENDOR_SIGNATURE,

        SIGNATURE_FIELD_IDS
          .MSA_VENDOR_AUDIT,
      ],

      [
        SIGNATURE_FIELD_IDS
          .MSA_TAPROOT_SIGNATURE,

        SIGNATURE_FIELD_IDS
          .MSA_TAPROOT_AUDIT,
      ],

      [
        SIGNATURE_FIELD_IDS
          .WO_VENDOR_SIGNATURE,

        SIGNATURE_FIELD_IDS
          .WO_VENDOR_AUDIT,
      ],

      [
        SIGNATURE_FIELD_IDS
          .WO_TAPROOT_SIGNATURE,

        SIGNATURE_FIELD_IDS
          .WO_TAPROOT_AUDIT,
      ],
    ];


    pairs.forEach(
      (
        [
          signatureFieldName,
          auditFieldName,
        ]
      ) => {

        const signatureRect =
          fields[
            signatureFieldName
          ];


        const auditRect =
          fields[
            auditFieldName
          ];


        if (
          signatureRect.pageIndex !==
          auditRect.pageIndex
        ) {
          throw new Error(
            `${signatureFieldName} and ${auditFieldName} must be on the same page.`
          );
        }


        if (
          rectanglesOverlap(
            signatureRect,
            auditRect
          )
        ) {
          throw new Error(
            `${signatureFieldName} overlaps ${auditFieldName}.`
          );
        }
      }
    );


    return {
      schemaVersion:
        SIGNATURE_MANIFEST_SCHEMA_VERSION,

      coordinateSystem:
        SIGNATURE_COORDINATE_SYSTEM,

      documentType,

      templateId,

      templateVersion,

      pageCount:
        pages.length,

      createdAt:
        new Date()
          .toISOString(),

      fields,

      guards,
    };
  };


/* ============================================================
   VALIDATE EXISTING MANIFEST
============================================================ */

export const validateSignaturePlacementManifest =
  (
    manifest,
    expectedPageCount =
      7
  ) => {

    if (
      !manifest ||
      typeof manifest !==
        "object" ||
      Array.isArray(
        manifest
      )
    ) {
      throw new Error(
        "Electronic-signature placement manifest is missing."
      );
    }


    if (
      manifest.schemaVersion !==
      SIGNATURE_MANIFEST_SCHEMA_VERSION
    ) {
      throw new Error(
        "Unsupported electronic-signature placement manifest version."
      );
    }


    if (
      manifest.coordinateSystem !==
      SIGNATURE_COORDINATE_SYSTEM
    ) {
      throw new Error(
        "Unsupported electronic-signature coordinate system."
      );
    }


    if (
      manifest.pageCount !==
      expectedPageCount
    ) {
      throw new Error(
        `Electronic-signature placement manifest contains ${manifest.pageCount} pages instead of ${expectedPageCount}.`
      );
    }


    if (
      !manifest.fields ||
      typeof manifest.fields !==
        "object"
    ) {
      throw new Error(
        "Electronic-signature placement fields are missing."
      );
    }


    REQUIRED_MSA_WO_SIGNATURE_FIELDS
      .forEach(
        (
          fieldName
        ) => {

          const field =
            manifest
              .fields?.[
                fieldName
              ];


          if (
            !field
          ) {
            throw new Error(
              `Missing electronic-signature placement field: ${fieldName}.`
            );
          }


          validateNormalizedRect(
            field,
            fieldName
          );


          if (
            !Number.isInteger(
              field.pageIndex
            ) ||
            field.pageIndex <
              0 ||
            field.pageIndex >=
              expectedPageCount
          ) {
            throw new Error(
              `Invalid physical page index for ${fieldName}.`
            );
          }
        }
      );


    return true;
  };