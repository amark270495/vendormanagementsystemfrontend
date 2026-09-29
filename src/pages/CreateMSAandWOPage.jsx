// src/pages/CreateMSAandWOPage.jsx

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

import { useAuth } from "../context/AuthContext";
import { apiService } from "../api/apiService";
import Spinner from "../components/Spinner";
import { usePermissions } from "../hooks/usePermissions";

import {
  MSATemplatePages,
} from "../components/msa-wo/MSATemplatePages";

import {
  createDefaultTemplate,
  deepCloneTemplate,
  TEMPLATE_STORAGE_KEY,
} from "../components/msa-wo/MSATemplateDefinition";


/* ============================================================
   CONSTANTS
============================================================ */

const EXPECTED_MSA_WO_PAGE_COUNT = 7;

const IMAGE_WAIT_TIMEOUT_MS = 5000;


/* ============================================================
   CONTRACT NUMBER
============================================================ */

const createContractNumber = () => {
  const number =
    Math.floor(
      10000 +
        Math.random() *
          90000
    );

  return `Taproot-Subk-${number}`;
};


/* ============================================================
   DATE HELPERS
============================================================ */

const getCurrentDocumentDate = () =>
  new Date().toLocaleDateString(
    "en-US",
    {
      year: "numeric",
      month: "long",
      day: "numeric",
    }
  );


const formatDocumentDate = (
  value
) => {
  if (!value) {
    return "";
  }

  /*
   * HTML date input gives:
   *
   * 2026-10-15
   *
   * We intentionally add local midnight to avoid
   * timezone conversion changing the date.
   */
  const date =
    new Date(
      `${value}T00:00:00`
    );

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return value;
  }

  return date.toLocaleDateString(
    "en-US",
    {
      year: "numeric",
      month: "long",
      day: "numeric",
    }
  );
};


/* ============================================================
   WAIT FOR IMAGES SAFELY
============================================================ */

/**
 * Prevent an image from holding PDF generation forever.
 *
 * Critical condition:
 *
 * image.complete === true
 * image.naturalWidth === 0
 *
 * means that the browser already completed the image request
 * but loading failed.
 *
 * In that condition we resolve immediately instead of waiting
 * for load/error events that already occurred.
 */
const waitForImages = async (
  rootElement,
  timeoutMs =
    IMAGE_WAIT_TIMEOUT_MS
) => {
  if (!rootElement) {
    return;
  }

  const images =
    Array.from(
      rootElement.querySelectorAll(
        "img"
      )
    );

  if (
    images.length === 0
  ) {
    return;
  }

  const waitForSingleImage =
    (image) =>
      new Promise(
        (resolve) => {
          /*
           * Already finished loading
           * OR already failed.
           */
          if (
            image.complete
          ) {
            resolve({
              loaded:
                image.naturalWidth >
                0,

              src:
                image.currentSrc ||
                image.src,
            });

            return;
          }

          let finished =
            false;

          let timeoutId =
            null;

          const cleanup =
            () => {
              image.removeEventListener(
                "load",
                onLoad
              );

              image.removeEventListener(
                "error",
                onError
              );

              if (
                timeoutId
              ) {
                clearTimeout(
                  timeoutId
                );
              }
            };

          const finish =
            (loaded) => {
              if (
                finished
              ) {
                return;
              }

              finished =
                true;

              cleanup();

              resolve({
                loaded,

                src:
                  image.currentSrc ||
                  image.src,
              });
            };

          const onLoad =
            () =>
              finish(
                true
              );

          const onError =
            () =>
              finish(
                false
              );

          image.addEventListener(
            "load",
            onLoad,
            {
              once: true,
            }
          );

          image.addEventListener(
            "error",
            onError,
            {
              once: true,
            }
          );

          timeoutId =
            setTimeout(
              () => {
                finish(
                  false
                );
              },
              timeoutMs
            );
        }
      );

  const results =
    await Promise.all(
      images.map(
        waitForSingleImage
      )
    );

  const failures =
    results.filter(
      (result) =>
        !result.loaded
    );

  if (
    failures.length >
    0
  ) {
    console.warn(
      "[MSA/WO] Some document images failed to load:",
      failures
    );
  }
};


/* ============================================================
   LOAD ACTIVE TEMPLATE
============================================================ */

/**
 * Current development implementation:
 *
 * ACTIVE templates are stored in browser localStorage.
 *
 * Later VMS 2.0:
 *
 * Replace this function with backend template retrieval from
 * Azure Table/Blob Storage.
 */
const loadPublishedTemplate = () => {
  const fallback =
    createDefaultTemplate();

  /*
   * The fallback is usable even before somebody has
   * explicitly published the editor template.
   */
  fallback.status =
    fallback.status ||
    "DRAFT";

  if (
    typeof window ===
    "undefined"
  ) {
    return fallback;
  }

  try {
    const raw =
      localStorage.getItem(
        TEMPLATE_STORAGE_KEY
      );

    if (!raw) {
      console.info(
        "[MSA/WO] No saved template versions found. Using default template."
      );

      return fallback;
    }

    const versions =
      JSON.parse(
        raw
      );

    if (
      !Array.isArray(
        versions
      )
    ) {
      console.warn(
        "[MSA/WO] Saved template storage is not an array. Using default template."
      );

      return fallback;
    }

    const activeVersions =
      versions
        .filter(
          (item) =>
            item &&
            item.status ===
              "ACTIVE" &&
            Array.isArray(
              item.pages
            ) &&
            item.pages.length >
              0 &&
            item.styleConfig
        )
        .sort(
          (
            a,
            b
          ) =>
            Number(
              b.version ||
                0
            ) -
            Number(
              a.version ||
                0
            )
        );

    if (
      activeVersions.length ===
      0
    ) {
      console.info(
        "[MSA/WO] No ACTIVE template found. Using default template."
      );

      return fallback;
    }

    console.info(
      "[MSA/WO] Loaded ACTIVE template:",
      {
        templateId:
          activeVersions[0]
            .templateId,

        version:
          activeVersions[0]
            .version,

        templateName:
          activeVersions[0]
            .templateName,
      }
    );

    return deepCloneTemplate(
      activeVersions[0]
    );
  } catch (
    error
  ) {
    console.error(
      "[MSA/WO] Failed to load published template:",
      error
    );

    return fallback;
  }
};


/* ============================================================
   MAIN COMPONENT
============================================================ */

const CreateMSAandWOPage = ({
  onNavigate,
}) => {
  const {
    user,
  } =
    useAuth();

  const {
    canManageMSAWO,
  } =
    usePermissions();


  /* ==========================================================
     FORM
  ========================================================== */

  const [
    formData,
    setFormData,
  ] =
    useState({});


  /* ==========================================================
     UI STATE
  ========================================================== */

  const [
    loading,
    setLoading,
  ] =
    useState(false);

  const [
    generationStage,
    setGenerationStage,
  ] =
    useState("");

  const [
    error,
    setError,
  ] =
    useState("");

  const [
    success,
    setSuccess,
  ] =
    useState("");


  /* ==========================================================
     VENDOR SEARCH
  ========================================================== */

  const [
    companies,
    setCompanies,
  ] =
    useState([]);

  const [
    searchTerm,
    setSearchTerm,
  ] =
    useState("");

  const [
    selectedCompany,
    setSelectedCompany,
  ] =
    useState(null);

  const [
    showDropdown,
    setShowDropdown,
  ] =
    useState(false);


  /* ==========================================================
     TEMPLATE
  ========================================================== */

  const [
    baseTemplate,
    setBaseTemplate,
  ] =
    useState(
      () =>
        loadPublishedTemplate()
    );


  /* ==========================================================
     CONTRACT NUMBER
  ========================================================== */

  const [
    contractNumber,
    setContractNumber,
  ] =
    useState(
      () =>
        createContractNumber()
    );


  /* ==========================================================
     REFS
  ========================================================== */

  const searchRef =
    useRef(null);

  const documentRef =
    useRef(null);


  /* ==========================================================
     LOAD VENDOR COMPANIES
  ========================================================== */

  const loadCompanies =
    useCallback(
      async () => {
        if (
          !canManageMSAWO ||
          !user
            ?.userIdentifier
        ) {
          return;
        }

        try {
          setError(
            ""
          );

          const response =
            await apiService
              .getMSAWOVendorCompanies(
                user.userIdentifier,
                100
              );

          if (
            response.data
              ?.success
          ) {
            setCompanies(
              response.data
                ?.companies ||
                []
            );

            return;
          }

          throw new Error(
            response.data
              ?.message ||
              "Failed to load vendor companies."
          );
        } catch (
          err
        ) {
          console.error(
            "[MSA/WO] Vendor loading failed:",
            err
          );

          setError(
            err.response?.data
              ?.message ||
              err.message ||
              "Failed to load vendor companies."
          );
        }
      },
      [
        canManageMSAWO,
        user
          ?.userIdentifier,
      ]
    );


  useEffect(() => {
    loadCompanies();
  }, [
    loadCompanies,
  ]);


  /*
   * Reload the current ACTIVE template when page mounts.
   */
  useEffect(() => {
    setBaseTemplate(
      loadPublishedTemplate()
    );
  }, []);


  /* ==========================================================
     CLOSE VENDOR SEARCH ON OUTSIDE CLICK
  ========================================================== */

  useEffect(() => {
    const handleClickOutside =
      (event) => {
        if (
          searchRef.current &&
          !searchRef.current.contains(
            event.target
          )
        ) {
          setShowDropdown(
            false
          );
        }
      };

    document.addEventListener(
      "mousedown",
      handleClickOutside
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );
    };
  }, []);


  /* ==========================================================
     FILTER VENDORS
  ========================================================== */

  const filteredCompanies =
    useMemo(
      () => {
        const search =
          searchTerm
            .trim()
            .toLowerCase();

        if (!search) {
          return [];
        }

        return companies.filter(
          (company) => {
            const vendorName =
              company
                ?.vendorName ||
              company
                ?.vendorCompanyName ||
              "";

            return vendorName
              .toLowerCase()
              .includes(
                search
              );
          }
        );
      },
      [
        companies,
        searchTerm,
      ]
    );


  /* ==========================================================
     SELECT VENDOR
  ========================================================== */

  const handleSelectCompany =
    (company) => {
      const vendorName =
        company
          ?.vendorName ||
        company
          ?.vendorCompanyName ||
        "";

      const state =
        company
          ?.state ||
        company
          ?.companyStateName ||
        "";

      const federalId =
        company
          ?.federalId ||
        company
          ?.ein ||
        "";

      const companyAddress =
        company
          ?.companyAddress ||
        company
          ?.vendorCompanyAddress ||
        "";

      const vendorEmail =
        company
          ?.vendorEmail ||
        company
          ?.vendorPocEmail ||
        company
          ?.vendorPOCMail ||
        "";

      const authorizedSignatureName =
        company
          ?.authorizedSignatureName ||
        company
          ?.vendorAuthorizedSignPersonName ||
        company
          ?.authorizedSignPersonName ||
        "";

      const authorizedPersonTitle =
        company
          ?.authorizedPersonTitle ||
        company
          ?.vendorAuthorizedPersonTitle ||
        company
          ?.authorizedSignPersonTitle ||
        "";

      setSelectedCompany(
        company
      );

      setSearchTerm(
        vendorName
      );

      setShowDropdown(
        false
      );

      setError(
        ""
      );

      setFormData(
        (
          previous
        ) => ({
          ...previous,

          vendorName,

          state,

          federalId,

          companyAddress,

          vendorEmail,

          authorizedSignatureName,

          authorizedPersonTitle,
        })
      );
    };


  /* ==========================================================
     INPUT CHANGE
  ========================================================== */

  const handleChange =
    (event) => {
      const {
        name,
        value,
      } =
        event.target;

      setFormData(
        (
          previous
        ) => ({
          ...previous,

          [name]:
            value,
        })
      );
    };


  /* ==========================================================
     CONTRACT NUMBER FOR TEMPLATE FIELD
  ========================================================== */

  const contractNumberOnly =
    useMemo(
      () =>
        contractNumber.replace(
          /^Taproot-Subk-/i,
          ""
        ),
      [
        contractNumber,
      ]
    );


  /* ==========================================================
     BUILD RENDERED TEMPLATE
  ========================================================== */

  const renderedTemplate =
    useMemo(
      () => {
        const template =
          deepCloneTemplate(
            baseTemplate ||
              createDefaultTemplate()
          );

        /*
         * This page currently generates both documents.
         */
        template.packageMode =
          "MSA_WO";

        template.showPageNumbers =
          false;

        /*
         * Template Preview Data is replaced with
         * the real contract transaction data.
         */
        template.documentData = {
          ...template
            .documentData,

          ...formData,

          CURRENT_DATE:
            getCurrentDocumentDate(),

          /*
           * Definition already contains:
           *
           * Taproot-Subk-
           *
           * so only the number goes into the field.
           */
          CONTRACT_NUMBER:
            contractNumberOnly,

          tentativeStartDate:
            formatDocumentDate(
              formData
                .tentativeStartDate
            ),
        };

        return template;
      },
      [
        baseTemplate,
        formData,
        contractNumberOnly,
      ]
    );


  /* ==========================================================
     VALIDATE FORM
  ========================================================== */

  const validateForm =
    () => {
      if (
        !selectedCompany
      ) {
        return (
          "Please select a valid Vendor Company first."
        );
      }

      const requiredFields = [
        [
          "vendorName",
          "Vendor Company",
        ],

        [
          "vendorEmail",
          "Vendor Email",
        ],

        [
          "candidateName",
          "Candidate Name",
        ],

        [
          "tentativeStartDate",
          "Tentative Start Date",
        ],

        [
          "jobTitle",
          "Job Title",
        ],

        [
          "clientName",
          "Client Name",
        ],

        [
          "clientLocation",
          "Client Location",
        ],

        [
          "typeOfServices",
          "Type of Service",
        ],

        [
          "typeOfSubcontract",
          "Type of Subcontract",
        ],

        [
          "rate",
          "Rate",
        ],

        [
          "perHour",
          "Rate Unit",
        ],

        [
          "net",
          "Payment Terms",
        ],
      ];

      for (
        const [
          key,
          label,
        ] of requiredFields
      ) {
        const value =
          formData[
            key
          ];

        if (
          value ===
            undefined ||
          value ===
            null ||
          String(
            value
          ).trim() ===
            ""
        ) {
          return `${label} is required.`;
        }
      }

      return null;
    };


  /* ==========================================================
     GENERATE EXACT 7-PAGE PDF
  ========================================================== */

  const generatePDFBase64 =
    async () => {
      const rootElement =
        documentRef.current;

      if (!rootElement) {
        throw new Error(
          "MSA/WO document renderer is not available."
        );
      }

      console.log(
        "[MSA/WO] Preparing document resources..."
      );


      /* ------------------------------------------------------
         WAIT FOR FONTS
      ------------------------------------------------------ */

      if (
        document.fonts
          ?.ready
      ) {
        try {
          await document
            .fonts
            .ready;
        } catch (
          fontError
        ) {
          console.warn(
            "[MSA/WO] Font readiness check failed:",
            fontError
          );
        }
      }


      /* ------------------------------------------------------
         WAIT FOR LOGO
      ------------------------------------------------------ */

      await waitForImages(
        rootElement,
        IMAGE_WAIT_TIMEOUT_MS
      );


      /* ------------------------------------------------------
         LET REACT/CSS FINISH LAYOUT
      ------------------------------------------------------ */

      await new Promise(
        (resolve) => {
          requestAnimationFrame(
            () => {
              requestAnimationFrame(
                resolve
              );
            }
          );
        }
      );


      /* ------------------------------------------------------
         GET PHYSICAL A4 PAGES
      ------------------------------------------------------ */

      const pageElements =
        Array.from(
          rootElement
            .querySelectorAll(
              ".a4-page"
            )
        );

      console.log(
        "[MSA/WO] Physical A4 pages detected:",
        pageElements.length
      );

      if (
        pageElements.length !==
        EXPECTED_MSA_WO_PAGE_COUNT
      ) {
        throw new Error(
          `The MSA + WO template currently contains ${pageElements.length} physical pages. Expected exactly ${EXPECTED_MSA_WO_PAGE_COUNT}.`
        );
      }


      /* ------------------------------------------------------
         CREATE REAL A4 PDF
      ------------------------------------------------------ */

      const pdf =
        new jsPDF({
          orientation:
            "portrait",

          unit:
            "mm",

          format:
            "a4",

          compress:
            true,

          putOnlyUsedFonts:
            true,
        });


      const PDF_WIDTH_MM =
        210;

      const PDF_HEIGHT_MM =
        297;


      /* ------------------------------------------------------
         RENDER ONE HTML PAGE -> ONE PDF PAGE
      ------------------------------------------------------ */

      for (
        let pageIndex =
          0;
        pageIndex <
        pageElements.length;
        pageIndex += 1
      ) {
        const pageElement =
          pageElements[
            pageIndex
          ];

        setGenerationStage(
          `Rendering page ${
            pageIndex +
            1
          } of ${
            pageElements.length
          }...`
        );

        console.log(
          `[MSA/WO] Rendering page ${
            pageIndex +
            1
          } of ${
            pageElements.length
          }`
        );


        /*
         * offsetWidth/offsetHeight give the actual fixed
         * physical A4 element dimensions rather than an
         * overflowing scrollHeight.
         *
         * This is critical because a long content block could
         * otherwise produce a canvas taller than one A4 sheet.
         */
        const captureWidth =
          pageElement
            .offsetWidth;

        const captureHeight =
          pageElement
            .offsetHeight;


        if (
          !captureWidth ||
          !captureHeight
        ) {
          throw new Error(
            `Page ${
              pageIndex +
              1
            } has invalid rendering dimensions.`
          );
        }


        const canvas =
          await html2canvas(
            pageElement,
            {
              scale:
                1.5,

              useCORS:
                true,

              allowTaint:
                false,

              logging:
                false,

              backgroundColor:
                "#ffffff",

              scrollX:
                0,

              scrollY:
                0,

              width:
                captureWidth,

              height:
                captureHeight,

              windowWidth:
                captureWidth,

              windowHeight:
                captureHeight,

              /*
               * Remove UI-only styling in the cloned page.
               */
              onclone: (
                clonedDocument
              ) => {
                const clonedPages =
                  clonedDocument
                    .querySelectorAll(
                      ".a4-page"
                    );

                clonedPages.forEach(
                  (
                    clonedPage
                  ) => {
                    clonedPage.style.boxShadow =
                      "none";

                    clonedPage.style.margin =
                      "0";

                    clonedPage.style.transform =
                      "none";

                    clonedPage.style.pageBreakBefore =
                      "auto";

                    clonedPage.style.pageBreakAfter =
                      "auto";

                    clonedPage.style.pageBreakInside =
                      "auto";

                    clonedPage.style.breakBefore =
                      "auto";

                    clonedPage.style.breakAfter =
                      "auto";

                    clonedPage.style.breakInside =
                      "auto";

                    clonedPage.style.overflow =
                      "hidden";
                  }
                );


                const badges =
                  clonedDocument
                    .querySelectorAll(
                      ".page-debug-badge"
                    );

                badges.forEach(
                  (
                    badge
                  ) => {
                    badge.style.display =
                      "none";
                  }
                );


                const selected =
                  clonedDocument
                    .querySelectorAll(
                      ".is-selected"
                    );

                selected.forEach(
                  (
                    node
                  ) => {
                    node.style.outline =
                      "none";
                  }
                );
              },
            }
          );


        if (
          !canvas.width ||
          !canvas.height
        ) {
          throw new Error(
            `Unable to render document page ${
              pageIndex +
              1
            }.`
          );
        }


        /*
         * JPEG dramatically reduces request size compared to
         * PNG while retaining very good contract readability.
         */
        const imageData =
          canvas.toDataURL(
            "image/jpeg",
            0.95
          );


        /*
         * jsPDF already creates page #1.
         */
        if (
          pageIndex >
          0
        ) {
          pdf.addPage(
            "a4",
            "portrait"
          );
        }


        /*
         * One HTML A4 page -> exactly one PDF A4 page.
         */
        pdf.addImage(
          imageData,

          "JPEG",

          0,
          0,

          PDF_WIDTH_MM,
          PDF_HEIGHT_MM,

          undefined,

          "FAST"
        );


        /*
         * Release browser memory before rendering next page.
         */
        canvas.width =
          1;

        canvas.height =
          1;
      }


      /* ------------------------------------------------------
         VERIFY FINAL PAGE COUNT
      ------------------------------------------------------ */

      const finalPageCount =
        pdf.getNumberOfPages();

      console.log(
        "[MSA/WO] Final jsPDF page count:",
        finalPageCount
      );

      if (
        finalPageCount !==
        EXPECTED_MSA_WO_PAGE_COUNT
      ) {
        throw new Error(
          `PDF generator produced ${finalPageCount} pages. Expected exactly ${EXPECTED_MSA_WO_PAGE_COUNT}.`
        );
      }


      /* ------------------------------------------------------
         EXPORT AS DATA URI
      ------------------------------------------------------ */

      setGenerationStage(
        "Preparing PDF upload..."
      );

      const pdfBase64 =
        pdf.output(
          "datauristring"
        );


      if (
        typeof pdfBase64 !==
          "string" ||
        !pdfBase64.startsWith(
          "data:application/pdf"
        )
      ) {
        throw new Error(
          "The browser did not generate valid PDF data."
        );
      }


      console.log(
        "[MSA/WO] PDF generated successfully:",
        {
          pages:
            finalPageCount,

          characters:
            pdfBase64.length,
        }
      );


      return pdfBase64;
    };


  /* ==========================================================
     RESET FORM AFTER SUCCESS
  ========================================================== */

  const resetAfterSuccess =
    () => {
      setFormData({});

      setSelectedCompany(
        null
      );

      setSearchTerm("");

      setShowDropdown(
        false
      );

      setContractNumber(
        createContractNumber()
      );

      /*
       * Pick up newly published document template versions.
       */
      setBaseTemplate(
        loadPublishedTemplate()
      );
    };


  /* ==========================================================
     SUBMIT
  ========================================================== */

  const handleSubmit =
    async (
      event
    ) => {
      event.preventDefault();


      /*
       * Prevent double click while request is active.
       */
      if (
        loading
      ) {
        return;
      }


      if (
        !canManageMSAWO
      ) {
        setError(
          "You do not have permission to create MSA/WO documents."
        );

        return;
      }


      const validationError =
        validateForm();


      if (
        validationError
      ) {
        setError(
          validationError
        );

        return;
      }


      setError("");
      setSuccess("");
      setLoading(true);


      try {
        /* ----------------------------------------------------
           STEP 1
           Generate exact seven-page document.
        ---------------------------------------------------- */

        setGenerationStage(
          "Preparing document..."
        );


        const pdfBase64 =
          await generatePDFBase64();


        /* ----------------------------------------------------
           STEP 2
           Build backend transaction payload.
        ---------------------------------------------------- */

        setGenerationStage(
          "Saving & sending..."
        );


        const payload = {
          ...formData,


          /*
           * Complete Contract ID:
           *
           * Taproot-Subk-12345
           */
          contractNumber,


          /*
           * Template audit information.
           */
          templateId:
            renderedTemplate
              .templateId,

          templateVersion:
            renderedTemplate
              .version,

          templateName:
            renderedTemplate
              .templateName,


          /*
           * Backend uses this to validate exactly 7 pages.
           */
          documentType:
            "MSA_WO",


          /*
           * Browser generated PDF.
           */
          pdfBase64,
        };


        console.log(
          "[MSA/WO] Calling createMSAandWO:",
          {
            contractNumber:
              payload
                .contractNumber,

            vendorName:
              payload
                .vendorName,

            vendorEmail:
              payload
                .vendorEmail,

            candidateName:
              payload
                .candidateName,

            clientName:
              payload
                .clientName,

            templateId:
              payload
                .templateId,

            templateVersion:
              payload
                .templateVersion,

            documentType:
              payload
                .documentType,

            pdfCharacters:
              pdfBase64
                .length,
          }
        );


        /* ----------------------------------------------------
           STEP 3
           Backend
        ---------------------------------------------------- */

        const response =
          await apiService
            .createMSAandWO(
              payload,

              user
                .userIdentifier
            );


        console.log(
          "[MSA/WO] Backend response:",
          response.data
        );


        if (
          !response.data
            ?.success
        ) {
          throw new Error(
            response.data
              ?.message ||
              "Unable to create MSA and Work Order."
          );
        }


        setGenerationStage(
          ""
        );


        setSuccess(
          response.data
            ?.message ||
            "MSA and Work Order created successfully."
        );


        resetAfterSuccess();


        setTimeout(
          () => {
            setSuccess(
              ""
            );
          },
          5000
        );

      } catch (
        err
      ) {
        console.error(
          "[MSA/WO] Create failed:",
          err
        );


        setGenerationStage(
          ""
        );


        /*
         * Axios backend error.
         */
        const backendMessage =
          err.response
            ?.data
            ?.message;


        /*
         * Network timeout.
         */
        const timeoutMessage =
          err.code ===
          "ECONNABORTED"
            ? "The server request timed out. The PDF may already have been created; check the MSA/WO Dashboard before trying again."
            : null;


        setError(
          backendMessage ||
          timeoutMessage ||
          err.message ||
          "An unexpected error occurred."
        );

      } finally {
        setLoading(
          false
        );
      }
    };


  /* ==========================================================
     ACCESS CONTROL
  ========================================================== */

  if (
    !canManageMSAWO
  ) {
    return (
      <div className="text-center text-gray-500 p-10 bg-white rounded-xl shadow-sm border">
        <h3 className="text-lg font-medium">
          Access Denied
        </h3>

        <p className="mt-2 text-sm">
          You do not have permission to manage MSA and Work Orders.
        </p>
      </div>
    );
  }


  /* ==========================================================
     RENDER
  ========================================================== */

  return (
    <div className="space-y-6 max-w-4xl mx-auto relative">

      {/* ======================================================
          PAGE HEADER
      ====================================================== */}

      <div className="text-center">

        <h1 className="text-3xl font-bold text-gray-900">
          Create MSA and Work Order
        </h1>

        <p className="mt-2 text-gray-600">
          Select a Vendor and complete the Work Order details.
        </p>

        <div className="mt-2 flex flex-wrap justify-center gap-x-2 gap-y-1 text-xs text-gray-500">

          <span>
            Contract:
            {" "}
            <strong>
              {
                contractNumber
              }
            </strong>
          </span>

          <span>
            •
          </span>

          <span>
            Template:
            {" "}
            {
              renderedTemplate
                .templateName
            }
          </span>

          <span>
            •
          </span>

          <span>
            Version
            {" "}
            {
              renderedTemplate
                .version
            }
          </span>

          <span>
            •
          </span>

          <span>
            {
              renderedTemplate
                .status
            }
          </span>

        </div>

      </div>


      {/* ======================================================
          FORM
      ====================================================== */}

      <form
        onSubmit={
          handleSubmit
        }
      >

        <div className="bg-white p-6 md:p-8 rounded-xl shadow-lg border space-y-8">


          {/* ==================================================
              ERROR
          ================================================== */}

          {error && (
            <div className="bg-red-50 border-l-4 border-red-400 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}


          {/* ==================================================
              SUCCESS
          ================================================== */}

          {success && (
            <div className="bg-green-50 border-l-4 border-green-400 text-green-700 px-4 py-3 rounded-lg">
              {success}
            </div>
          )}


          {/* ==================================================
              STEP 1
              VENDOR COMPANY
          ================================================== */}

          <div
            ref={
              searchRef
            }
          >

            <h2 className="text-xl font-semibold text-gray-800 border-b pb-2 mb-4">
              Step 1: Select Vendor Company
            </h2>


            <label
              htmlFor="companySearch"
              className="block text-sm font-medium text-gray-700"
            >
              Vendor Company Name

              <span className="text-red-500">
                *
              </span>
            </label>


            <div className="relative">

              <input
                id="companySearch"
                type="text"
                value={
                  searchTerm
                }
                onFocus={() => {
                  setShowDropdown(
                    true
                  );
                }}
                onChange={(
                  event
                ) => {
                  setSearchTerm(
                    event
                      .target
                      .value
                  );

                  setShowDropdown(
                    true
                  );

                  /*
                   * User changed text manually.
                   * Previous Vendor selection is no longer trusted.
                   */
                  setSelectedCompany(
                    null
                  );
                }}
                placeholder="Type to search for a vendor..."
                className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm p-3 focus:ring-indigo-500 focus:border-indigo-500"
                autoComplete="off"
              />


              {showDropdown && (
                <div className="absolute z-30 w-full bg-white border border-gray-200 rounded-lg mt-1 shadow-lg max-h-60 overflow-y-auto">

                  {filteredCompanies.length >
                  0 ? (

                    filteredCompanies.map(
                      (
                        company,
                        index
                      ) => {
                        const name =
                          company
                            ?.vendorName ||
                          company
                            ?.vendorCompanyName ||
                          "";

                        const ein =
                          company
                            ?.federalId ||
                          company
                            ?.ein ||
                          "";

                        return (
                          <button
                            key={
                              company
                                ?.vendorId ||
                              company
                                ?.id ||
                              `${name}-${index}`
                            }
                            type="button"
                            onClick={() => {
                              handleSelectCompany(
                                company
                              );
                            }}
                            className="block w-full text-left px-4 py-3 border-b last:border-b-0 hover:bg-indigo-50 focus:bg-indigo-50 focus:outline-none"
                          >

                            <div className="font-medium text-gray-900">
                              {name}
                            </div>

                            {ein && (
                              <div className="mt-1 text-xs text-gray-500">
                                EIN:
                                {" "}
                                {ein}
                              </div>
                            )}

                          </button>
                        );
                      }
                    )

                  ) : (

                    <div className="p-4 text-center text-gray-500">

                      {searchTerm ? (
                        <>
                          <p>
                            No results found for "
                            {
                              searchTerm
                            }
                            ".
                          </p>

                          <button
                            type="button"
                            onClick={() => {
                              onNavigate?.(
                                "create_msawo_vendor_company"
                              );
                            }}
                            className="mt-2 text-sm text-indigo-600 hover:underline font-semibold"
                          >
                            + Add New Vendor Company
                          </button>
                        </>
                      ) : (
                        <p>
                          Start typing a Vendor Company name.
                        </p>
                      )}

                    </div>

                  )}

                </div>
              )}

            </div>

          </div>


          {/* ==================================================
              SELECTED VENDOR SUMMARY
          ================================================== */}

          {selectedCompany && (

            <div className="rounded-lg border border-green-200 bg-green-50 p-4">

              <div className="text-sm font-semibold text-green-900">
                Vendor Selected
              </div>


              <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 text-sm text-green-800">

                <div>
                  <strong>
                    Company:
                  </strong>

                  {" "}

                  {
                    formData
                      .vendorName ||
                    "-"
                  }
                </div>


                <div>
                  <strong>
                    EIN:
                  </strong>

                  {" "}

                  {
                    formData
                      .federalId ||
                    "-"
                  }
                </div>


                <div>
                  <strong>
                    Authorized Signer:
                  </strong>

                  {" "}

                  {
                    formData
                      .authorizedSignatureName ||
                    "-"
                  }
                </div>


                <div>
                  <strong>
                    Title:
                  </strong>

                  {" "}

                  {
                    formData
                      .authorizedPersonTitle ||
                    "-"
                  }
                </div>


                <div className="md:col-span-2">
                  <strong>
                    Vendor Email:
                  </strong>

                  {" "}

                  {
                    formData
                      .vendorEmail ||
                    "-"
                  }
                </div>

              </div>

            </div>

          )}


          {/* ==================================================
              STEP 2
          ================================================== */}

          {selectedCompany && (

            <div className="border-t pt-8">

              <h2 className="text-xl font-semibold text-gray-800 border-b pb-2 mb-4">
                Step 2: Work Order Details
              </h2>


              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6">


                {/* Candidate Name */}

                <div>

                  <label className="block text-sm font-medium text-gray-700">
                    Candidate Name

                    <span className="text-red-500">
                      *
                    </span>
                  </label>

                  <input
                    type="text"
                    name="candidateName"
                    value={
                      formData
                        .candidateName ||
                      ""
                    }
                    onChange={
                      handleChange
                    }
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-lg p-3 focus:ring-indigo-500 focus:border-indigo-500"
                  />

                </div>


                {/* Start Date */}

                <div>

                  <label className="block text-sm font-medium text-gray-700">
                    Tentative Start Date

                    <span className="text-red-500">
                      *
                    </span>
                  </label>

                  <input
                    type="date"
                    name="tentativeStartDate"
                    value={
                      formData
                        .tentativeStartDate ||
                      ""
                    }
                    onChange={
                      handleChange
                    }
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-lg p-3 focus:ring-indigo-500 focus:border-indigo-500"
                  />

                </div>


                {/* Job Title */}

                <div>

                  <label className="block text-sm font-medium text-gray-700">
                    Job Title

                    <span className="text-red-500">
                      *
                    </span>
                  </label>

                  <input
                    type="text"
                    name="jobTitle"
                    value={
                      formData
                        .jobTitle ||
                      ""
                    }
                    onChange={
                      handleChange
                    }
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-lg p-3 focus:ring-indigo-500 focus:border-indigo-500"
                  />

                </div>


                {/* Client Name */}

                <div>

                  <label className="block text-sm font-medium text-gray-700">
                    Client Name

                    <span className="text-red-500">
                      *
                    </span>
                  </label>

                  <input
                    type="text"
                    name="clientName"
                    value={
                      formData
                        .clientName ||
                      ""
                    }
                    onChange={
                      handleChange
                    }
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-lg p-3 focus:ring-indigo-500 focus:border-indigo-500"
                  />

                </div>


                {/* Client Location */}

                <div className="md:col-span-2">

                  <label className="block text-sm font-medium text-gray-700">
                    Client Location

                    <span className="text-red-500">
                      *
                    </span>
                  </label>

                  <input
                    type="text"
                    name="clientLocation"
                    value={
                      formData
                        .clientLocation ||
                      ""
                    }
                    onChange={
                      handleChange
                    }
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-lg p-3 focus:ring-indigo-500 focus:border-indigo-500"
                  />

                </div>


                {/* Type Of Service */}

                <div>

                  <label className="block text-sm font-medium text-gray-700">
                    Type Of Service

                    <span className="text-red-500">
                      *
                    </span>
                  </label>

                  <select
                    name="typeOfServices"
                    value={
                      formData
                        .typeOfServices ||
                      ""
                    }
                    onChange={
                      handleChange
                    }
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-lg p-3 h-[50px] focus:ring-indigo-500 focus:border-indigo-500"
                  >

                    <option value="">
                      Select Service
                    </option>

                    <option value="IT Consulting">
                      IT Consulting
                    </option>

                    <option value="Staffing">
                      Staffing
                    </option>

                  </select>

                </div>


                {/* Type Of Subcontract */}

                <div>

                  <label className="block text-sm font-medium text-gray-700">
                    Type Of Subcontract

                    <span className="text-red-500">
                      *
                    </span>
                  </label>

                  <select
                    name="typeOfSubcontract"
                    value={
                      formData
                        .typeOfSubcontract ||
                      ""
                    }
                    onChange={
                      handleChange
                    }
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-lg p-3 h-[50px] focus:ring-indigo-500 focus:border-indigo-500"
                  >

                    <option value="">
                      Select Subcontract
                    </option>

                    <option value="C2C">
                      C2C
                    </option>

                    <option value="W2">
                      W2
                    </option>

                    <option value="Fixed Price">
                      Fixed Price
                    </option>

                  </select>

                </div>


                {/* Rate */}

                <div>

                  <label className="block text-sm font-medium text-gray-700">
                    Rate

                    <span className="text-red-500">
                      *
                    </span>
                  </label>

                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    name="rate"
                    value={
                      formData
                        .rate ||
                      ""
                    }
                    onChange={
                      handleChange
                    }
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-lg p-3 focus:ring-indigo-500 focus:border-indigo-500"
                  />

                </div>


                {/* Rate Unit */}

                <div>

                  <label className="block text-sm font-medium text-gray-700">
                    Per Hour / Day / Month

                    <span className="text-red-500">
                      *
                    </span>
                  </label>

                  <select
                    name="perHour"
                    value={
                      formData
                        .perHour ||
                      ""
                    }
                    onChange={
                      handleChange
                    }
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-lg p-3 h-[50px] focus:ring-indigo-500 focus:border-indigo-500"
                  >

                    <option value="">
                      Select Option
                    </option>

                    <option value="PER HOUR">
                      Per Hour
                    </option>

                    <option value="PER DAY">
                      Per Day
                    </option>

                    <option value="PER MONTH">
                      Per Month
                    </option>

                  </select>

                </div>


                {/* NET */}

                <div className="md:col-span-2">

                  <label className="block text-sm font-medium text-gray-700">
                    Payment Terms (NET)

                    <span className="text-red-500">
                      *
                    </span>
                  </label>

                  <select
                    name="net"
                    value={
                      formData
                        .net ||
                      ""
                    }
                    onChange={
                      handleChange
                    }
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-lg p-3 h-[50px] focus:ring-indigo-500 focus:border-indigo-500"
                  >

                    <option value="">
                      Select Days
                    </option>

                    <option value="30">
                      30 Days
                    </option>

                    <option value="45">
                      45 Days
                    </option>

                    <option value="60">
                      60 Days
                    </option>

                  </select>

                </div>

              </div>

            </div>

          )}

        </div>


        {/* ====================================================
            SUBMIT
        ==================================================== */}

        <div className="mt-6 flex justify-end">

          <button
            type="submit"
            disabled={
              loading ||
              !selectedCompany
            }
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-lg flex items-center justify-center min-w-[230px] h-12 disabled:bg-indigo-400 disabled:cursor-not-allowed shadow-lg transition-colors"
          >

            {loading ? (
              <>
                <Spinner size="6" />

                <span className="ml-2">
                  {
                    generationStage ||
                    "Processing..."
                  }
                </span>
              </>
            ) : (
              "Generate MSA & WO"
            )}

          </button>

        </div>

      </form>


      {/* ======================================================
          OFF-SCREEN DOCUMENT

          IMPORTANT:

          Do not use:
          display:none
          visibility:hidden

          html2canvas needs a rendered DOM element.

          Each .a4-page will be captured separately.
      ====================================================== */}

      <div
        aria-hidden="true"
        style={{
          position:
            "fixed",

          left:
            "-12000px",

          top:
            "0",

          width:
            "210mm",

          margin:
            0,

          padding:
            0,

          background:
            "#ffffff",

          pointerEvents:
            "none",

          zIndex:
            -9999,
        }}
      >

        <div
          ref={
            documentRef
          }
          className="pdf-export-root"
        >

          <MSATemplatePages
            template={
              renderedTemplate
            }
            editMode={
              false
            }
            selectedBlockId={
              null
            }
          />

        </div>

      </div>

    </div>
  );
};


export default CreateMSAandWOPage;