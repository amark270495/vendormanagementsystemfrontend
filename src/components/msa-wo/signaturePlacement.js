// src/components/msa-wo/signaturePlacement.js


/* ============================================================
   VMS 2.0
   ADAPTIVE ELECTRONIC SIGNATURE PLACEMENT

   IMPORTANT

   The Template Editor does NOT need to manually create
   electronic-signature rectangles.

   signatureFieldDecorator.js creates those fields in the
   export DOM.

   This module:

   1. Measures those generated fields.
   2. Converts them to normalized 0..1 page coordinates.
   3. Verifies they are on the correct physical PDF pages.
   4. Verifies signatures do not collide with audit text.
   5. Verifies signatures do not collide with Name/Title/Date.
   6. Protects against browser sub-pixel rounding errors.
============================================================ */


/* ============================================================
   MANIFEST VERSION
============================================================ */

export const SIGNATURE_MANIFEST_SCHEMA_VERSION =
  1;


export const SIGNATURE_COORDINATE_SYSTEM =
  "normalized-page";


/* ============================================================
   FIELD IDS

   These names become persisted document evidence.

   Do not casually rename them after production deployment.
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
   PROTECTED AREAS
============================================================ */

export const SIGNATURE_GUARD_IDS =
  Object.freeze({
    MSA_VENDOR_META:
      "msa.vendor.meta",

    MSA_TAPROOT_META:
      "msa.taproot.meta",

    WO_VENDOR_NAME:
      "wo.vendor.name",

    WO_VENDOR_TITLE:
      "wo.vendor.title",

    WO_VENDOR_DATE:
      "wo.vendor.date",

    WO_TAPROOT_NAME:
      "wo.taproot.name",

    WO_TAPROOT_TITLE:
      "wo.taproot.title",

    WO_TAPROOT_DATE:
      "wo.taproot.date",
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
   REQUIRED GUARDS
============================================================ */

export const REQUIRED_MSA_WO_SIGNATURE_GUARDS =
  Object.freeze([
    SIGNATURE_GUARD_IDS
      .MSA_VENDOR_META,

    SIGNATURE_GUARD_IDS
      .MSA_TAPROOT_META,

    SIGNATURE_GUARD_IDS
      .WO_VENDOR_NAME,

    SIGNATURE_GUARD_IDS
      .WO_VENDOR_TITLE,

    SIGNATURE_GUARD_IDS
      .WO_VENDOR_DATE,

    SIGNATURE_GUARD_IDS
      .WO_TAPROOT_NAME,

    SIGNATURE_GUARD_IDS
      .WO_TAPROOT_TITLE,

    SIGNATURE_GUARD_IDS
      .WO_TAPROOT_DATE,
  ]);


/* ============================================================
   EXPECTED PAGE POSITIONS

   Page indexes are zero based.

   Page 6 => 5
   Page 7 => 6
============================================================ */

const EXPECTED_FIELD_PAGES =
  Object.freeze({
    [SIGNATURE_FIELD_IDS
      .MSA_VENDOR_SIGNATURE]:
        5,

    [SIGNATURE_FIELD_IDS
      .MSA_VENDOR_AUDIT]:
        5,

    [SIGNATURE_FIELD_IDS
      .MSA_TAPROOT_SIGNATURE]:
        5,

    [SIGNATURE_FIELD_IDS
      .MSA_TAPROOT_AUDIT]:
        5,

    [SIGNATURE_FIELD_IDS
      .WO_VENDOR_SIGNATURE]:
        6,

    [SIGNATURE_FIELD_IDS
      .WO_VENDOR_AUDIT]:
        6,

    [SIGNATURE_FIELD_IDS
      .WO_TAPROOT_SIGNATURE]:
        6,

    [SIGNATURE_FIELD_IDS
      .WO_TAPROOT_AUDIT]:
        6,
  });


const EXPECTED_GUARD_PAGES =
  Object.freeze({
    [SIGNATURE_GUARD_IDS
      .MSA_VENDOR_META]:
        5,

    [SIGNATURE_GUARD_IDS
      .MSA_TAPROOT_META]:
        5,

    [SIGNATURE_GUARD_IDS
      .WO_VENDOR_NAME]:
        6,

    [SIGNATURE_GUARD_IDS
      .WO_VENDOR_TITLE]:
        6,

    [SIGNATURE_GUARD_IDS
      .WO_VENDOR_DATE]:
        6,

    [SIGNATURE_GUARD_IDS
      .WO_TAPROOT_NAME]:
        6,

    [SIGNATURE_GUARD_IDS
      .WO_TAPROOT_TITLE]:
        6,

    [SIGNATURE_GUARD_IDS
      .WO_TAPROOT_DATE]:
        6,
  });


/* ============================================================
   COLLISION TOLERANCE

   Browser rendering works with fractional CSS pixels.

   Two boxes whose borders are physically adjacent can differ
   by a tiny floating point amount.

   0.0005 on an A4 page is approximately:
   0.105mm horizontally
   0.149mm vertically

   That is small enough to ignore rendering noise without
   hiding a meaningful layout collision.
============================================================ */

const RECTANGLE_EPSILON =
  0.0005;


/* ============================================================
   MINIMUM DIMENSIONS
============================================================ */

const MIN_FIELD_WIDTH =
  0.01;


const MIN_FIELD_HEIGHT =
  0.005;


/* ============================================================
   NUMBER HELPERS
============================================================ */

const roundCoordinate =
  (
    value
  ) => {
    return Number(
      Number(
        value
      ).toFixed(
        8
      )
    );
  };


const clamp01 =
  (
    value
  ) => {
    return Math.min(
      1,

      Math.max(
        0,
        value
      )
    );
  };


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


    const x =
      (
        elementRect.left -
        pageRect.left
      ) /
      pageRect.width;


    const y =
      (
        elementRect.top -
        pageRect.top
      ) /
      pageRect.height;


    const width =
      elementRect.width /
      pageRect.width;


    const height =
      elementRect.height /
      pageRect.height;


    return {
      x:
        roundCoordinate(
          clamp01(
            x
          )
        ),

      y:
        roundCoordinate(
          clamp01(
            y
          )
        ),

      width:
        roundCoordinate(
          clamp01(
            width
          )
        ),

      height:
        roundCoordinate(
          clamp01(
            height
          )
        ),
    };
  };


/* ============================================================
   COLLISION DETECTION
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
        second.x +
          RECTANGLE_EPSILON ||

      secondRight <=
        first.x +
          RECTANGLE_EPSILON ||

      firstBottom <=
        second.y +
          RECTANGLE_EPSILON ||

      secondBottom <=
        first.y +
          RECTANGLE_EPSILON
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
        MIN_FIELD_WIDTH ||
      rect.height <=
        MIN_FIELD_HEIGHT
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
   PAGE OVERFLOW VALIDATION

   If the Template Editor has filled an entire physical page
   with content and there is no space left for the signing
   section, we MUST NOT silently stamp over legal text.

   Instead generation stops and the template must be adjusted.
============================================================ */

const validatePageOverflow =
  (
    page,
    pageIndex
  ) => {
    const pageBody =
      page.querySelector(
        ".page-body"
      );


    if (
      !pageBody
    ) {
      return;
    }


    const excessPixels =
      pageBody.scrollHeight -
      pageBody.clientHeight;


    /*
     * 2px tolerance allows browser rounding.
     */
    if (
      excessPixels >
      2
    ) {
      throw new Error(
        `Physical document page ${pageIndex + 1} does not have enough room for its content and signing fields. Reduce page content, font size, line height, or margins in the MSA/WO Template Editor.`
      );
    }
  };


/* ============================================================
   FIELD / AUDIT PAIRS
============================================================ */

const SIGNATURE_AUDIT_PAIRS =
  Object.freeze([
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
  ]);


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
        "TPL-MSA-WO-TAPROOT",

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
        documentRoot
          .querySelectorAll(
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


    /*
     * Current frontend generation is the seven-page
     * MSA + Work Order package.
     */
    if (
      documentType ===
        "MSA_WO" &&
      expectedPageCount !==
        7
    ) {
      throw new Error(
        "MSA + Work Order documents must contain exactly 7 physical pages."
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


        /*
         * Do this after the automatic signing fields have been
         * inserted by signatureFieldDecorator.js.
         */
        validatePageOverflow(
          page,
          pageIndex
        );


        /* ----------------------------------------------------
           SIGNATURE / AUDIT FIELDS
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


            const elementRect =
              element.getBoundingClientRect();


            if (
              elementRect.width <=
                0 ||
              elementRect.height <=
                0
            ) {
              throw new Error(
                `Electronic-signature field ${fieldName} is not visible in the rendered document.`
              );
            }


            const rect =
              normalizedRectFromDom(
                elementRect,
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
                `Duplicate protected signing area detected: ${guardName}.`
              );
            }


            const elementRect =
              element.getBoundingClientRect();


            if (
              elementRect.width <=
                0 ||
              elementRect.height <=
                0
            ) {
              throw new Error(
                `Protected signing area ${guardName} is not visible in the rendered document.`
              );
            }


            const rect =
              normalizedRectFromDom(
                elementRect,
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
       REQUIRED FIELDS
    -------------------------------------------------------- */

    REQUIRED_MSA_WO_SIGNATURE_FIELDS
      .forEach(
        (
          fieldName
        ) => {
          const field =
            fields[
              fieldName
            ];


          if (
            !field
          ) {
            throw new Error(
              `Required electronic-signature field is missing: ${fieldName}.`
            );
          }


          const expectedPage =
            EXPECTED_FIELD_PAGES[
              fieldName
            ];


          if (
            Number.isInteger(
              expectedPage
            ) &&
            field.pageIndex !==
              expectedPage
          ) {
            throw new Error(
              `${fieldName} is on physical page ${field.pageIndex + 1}; expected page ${expectedPage + 1}.`
            );
          }
        }
      );


    /* --------------------------------------------------------
       REQUIRED PROTECTED AREAS
    -------------------------------------------------------- */

    REQUIRED_MSA_WO_SIGNATURE_GUARDS
      .forEach(
        (
          guardName
        ) => {
          const guard =
            guards[
              guardName
            ];


          if (
            !guard
          ) {
            throw new Error(
              `Required protected signing area is missing: ${guardName}.`
            );
          }


          const expectedPage =
            EXPECTED_GUARD_PAGES[
              guardName
            ];


          if (
            Number.isInteger(
              expectedPage
            ) &&
            guard.pageIndex !==
              expectedPage
          ) {
            throw new Error(
              `${guardName} is on physical page ${guard.pageIndex + 1}; expected page ${expectedPage + 1}.`
            );
          }
        }
      );


    /* --------------------------------------------------------
       SIGNATURE VS AUDIT COLLISION
    -------------------------------------------------------- */

    SIGNATURE_AUDIT_PAIRS
      .forEach(
        (
          [
            signatureField,
            auditField,
          ]
        ) => {
          const signatureRect =
            fields[
              signatureField
            ];


          const auditRect =
            fields[
              auditField
            ];


          if (
            signatureRect.pageIndex !==
            auditRect.pageIndex
          ) {
            throw new Error(
              `${signatureField} and ${auditField} must be on the same physical page.`
            );
          }


          if (
            rectanglesOverlap(
              signatureRect,
              auditRect
            )
          ) {
            throw new Error(
              `${signatureField} overlaps ${auditField}.`
            );
          }
        }
      );


    /* --------------------------------------------------------
       FIELD VS PROTECTED AREA COLLISION
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
                `${fieldName} overlaps protected document area ${guardName}. Adjust the MSA/WO template before generating the agreement.`
              );
            }
          }
        );
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
      7,
    expectedDocumentType =
      "MSA_WO"
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
      manifest.documentType &&
      expectedDocumentType &&
      manifest.documentType !==
        expectedDocumentType
    ) {
      throw new Error(
        `Electronic-signature manifest document type ${manifest.documentType} does not match ${expectedDocumentType}.`
      );
    }


    if (
      !manifest.fields ||
      typeof manifest.fields !==
        "object" ||
      Array.isArray(
        manifest.fields
      )
    ) {
      throw new Error(
        "Electronic-signature placement fields are missing."
      );
    }


    if (
      !manifest.guards ||
      typeof manifest.guards !==
        "object" ||
      Array.isArray(
        manifest.guards
      )
    ) {
      throw new Error(
        "Electronic-signature protected areas are missing."
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


          const expectedPage =
            EXPECTED_FIELD_PAGES[
              fieldName
            ];


          if (
            Number.isInteger(
              expectedPage
            ) &&
            field.pageIndex !==
              expectedPage
          ) {
            throw new Error(
              `${fieldName} is assigned to the wrong physical page.`
            );
          }
        }
      );


    REQUIRED_MSA_WO_SIGNATURE_GUARDS
      .forEach(
        (
          guardName
        ) => {
          const guard =
            manifest
              .guards?.[
                guardName
              ];


          if (
            !guard
          ) {
            throw new Error(
              `Missing protected electronic-signature area: ${guardName}.`
            );
          }


          validateNormalizedRect(
            guard,
            guardName
          );


          if (
            !Number.isInteger(
              guard.pageIndex
            ) ||
            guard.pageIndex <
              0 ||
            guard.pageIndex >=
              expectedPageCount
          ) {
            throw new Error(
              `Invalid physical page index for ${guardName}.`
            );
          }
        }
      );


    SIGNATURE_AUDIT_PAIRS
      .forEach(
        (
          [
            signatureField,
            auditField,
          ]
        ) => {
          const signatureRect =
            manifest.fields[
              signatureField
            ];


          const auditRect =
            manifest.fields[
              auditField
            ];


          if (
            rectanglesOverlap(
              signatureRect,
              auditRect
            )
          ) {
            throw new Error(
              `${signatureField} overlaps ${auditField}.`
            );
          }
        }
      );


    Object.entries(
      manifest.fields
    ).forEach(
      (
        [
          fieldName,
          fieldRect,
        ]
      ) => {
        Object.entries(
          manifest.guards
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
                `${fieldName} overlaps protected document area ${guardName}.`
              );
            }
          }
        );
      }
    );


    return true;
  };


export default {
  SIGNATURE_FIELD_IDS,
  SIGNATURE_GUARD_IDS,
  buildSignaturePlacementManifest,
  validateSignaturePlacementManifest,
};