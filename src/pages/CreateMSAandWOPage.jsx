// src/pages/CreateMSAandWOPage.jsx

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { useAuth } from "../context/AuthContext";
import { apiService } from "../api/apiService";
import Spinner from "../components/Spinner";
import { usePermissions } from "../hooks/usePermissions";

import html2pdf from "html2pdf.js";

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

const PDF_GENERATION_TIMEOUT_MS =
  60_000;

const IMAGE_WAIT_TIMEOUT_MS =
  5_000;


/* ============================================================
   HELPERS
============================================================ */

const createContractNumber =
  () => {
    const number =
      Math.floor(
        10000 +
          Math.random() *
            90000
      );

    return `Taproot-Subk-${number}`;
  };


const currentDocumentDate =
  () =>
    new Date().toLocaleDateString(
      "en-US",
      {
        year: "numeric",
        month: "long",
        day: "numeric",
      }
    );


const formatDocumentDate =
  (value) => {
    if (!value) {
      return "";
    }

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


/**
 * Never allow a document image to hold PDF generation forever.
 *
 * Important:
 *
 * image.complete === true
 * image.naturalWidth === 0
 *
 * means the image already failed.
 *
 * In that situation load/error already fired, so attaching a listener
 * afterwards would wait forever.
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

  const waitForImage =
    (image) =>
      new Promise(
        (resolve) => {
          if (
            image.complete
          ) {
            resolve({
              src:
                image.src,

              loaded:
                image.naturalWidth >
                0,
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
                handleLoad
              );

              image.removeEventListener(
                "error",
                handleError
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
                src:
                  image.src,

                loaded,
              });
            };

          const handleLoad =
            () =>
              finish(
                true
              );

          const handleError =
            () =>
              finish(
                false
              );

          image.addEventListener(
            "load",
            handleLoad,
            {
              once: true,
            }
          );

          image.addEventListener(
            "error",
            handleError,
            {
              once: true,
            }
          );

          timeoutId =
            setTimeout(
              () =>
                finish(
                  false
                ),
              timeoutMs
            );
        }
      );

  const results =
    await Promise.all(
      images.map(
        waitForImage
      )
    );

  const failed =
    results.filter(
      (result) =>
        !result.loaded
    );

  if (
    failed.length >
    0
  ) {
    console.warn(
      "[MSA/WO] Some document images did not load:",
      failed
    );
  }
};


/**
 * Promise timeout which clears the timer when the real promise finishes.
 */
const withTimeout = (
  promise,
  timeoutMs,
  message
) =>
  new Promise(
    (
      resolve,
      reject
    ) => {
      const timeoutId =
        setTimeout(
          () => {
            reject(
              new Error(
                message
              )
            );
          },
          timeoutMs
        );

      promise.then(
        (value) => {
          clearTimeout(
            timeoutId
          );

          resolve(
            value
          );
        },
        (error) => {
          clearTimeout(
            timeoutId
          );

          reject(
            error
          );
        }
      );
    }
  );


/**
 * Read ACTIVE template published from our editor.
 *
 * Current laptop/browser version:
 * localStorage.
 *
 * Later:
 * Python API + Azure Storage.
 */
const loadPublishedTemplate =
  () => {
    const fallback =
      createDefaultTemplate();

    fallback.status =
      "ACTIVE";

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
        return fallback;
      }

      const versions =
        JSON.parse(raw);

      if (
        !Array.isArray(
          versions
        )
      ) {
        return fallback;
      }

      const active =
        versions
          .filter(
            (item) =>
              item &&
              item.status ===
                "ACTIVE" &&
              Array.isArray(
                item.pages
              ) &&
              item.styleConfig
          )
          .sort(
            (a, b) =>
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
        active.length ===
        0
      ) {
        return fallback;
      }

      return deepCloneTemplate(
        active[0]
      );
    } catch (
      error
    ) {
      console.error(
        "[MSA/WO] Failed loading published template:",
        error
      );

      return fallback;
    }
  };


/* ============================================================
   PAGE
============================================================ */

const CreateMSAandWOPage = ({
  onNavigate,
}) => {
  const { user } =
    useAuth();

  const {
    canManageMSAWO,
  } =
    usePermissions();

  const [
    formData,
    setFormData,
  ] =
    useState({});

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

  const [
    baseTemplate,
    setBaseTemplate,
  ] =
    useState(
      () =>
        loadPublishedTemplate()
    );

  const [
    contractNumber,
    setContractNumber,
  ] =
    useState(
      () =>
        createContractNumber()
    );

  const searchRef =
    useRef(null);

  const documentRef =
    useRef(null);


  /* ==========================================================
     LOAD VENDORS
  ========================================================== */

  const loadCompanies =
    useCallback(
      async () => {
        if (
          !canManageMSAWO ||
          !user?.userIdentifier
        ) {
          return;
        }

        try {
          const response =
            await apiService
              .getMSAWOVendorCompanies(
                user.userIdentifier
              );

          if (
            response.data
              ?.success
          ) {
            setCompanies(
              response.data
                .companies ||
                []
            );
          } else {
            throw new Error(
              response.data
                ?.message ||
                "Failed to load vendor companies."
            );
          }
        } catch (
          err
        ) {
          console.error(
            "[MSA/WO] Vendor loading error:",
            err
          );

          setError(
            err.response
              ?.data
              ?.message ||
              err.message ||
              "Failed to load vendor companies."
          );
        }
      },
      [
        canManageMSAWO,
        user?.userIdentifier,
      ]
    );

  useEffect(() => {
    loadCompanies();
  }, [
    loadCompanies,
  ]);


  /*
   * Refresh currently ACTIVE template when entering page.
   */
  useEffect(() => {
    setBaseTemplate(
      loadPublishedTemplate()
    );
  }, []);


  /* ==========================================================
     DROPDOWN OUTSIDE CLICK
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
     SEARCH
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
            const name =
              company.vendorName ||
              company.vendorCompanyName ||
              "";

            return name
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
        company.vendorName ||
        company.vendorCompanyName ||
        "";

      const state =
        company.state ||
        company.companyStateName ||
        "";

      const federalId =
        company.federalId ||
        company.ein ||
        "";

      const companyAddress =
        company.companyAddress ||
        company.vendorCompanyAddress ||
        "";

      const vendorEmail =
        company.vendorEmail ||
        company.vendorPocEmail ||
        company.vendorPOCMail ||
        "";

      const authorizedSignatureName =
        company.authorizedSignatureName ||
        company.vendorAuthorizedSignPersonName ||
        company.authorizedSignPersonName ||
        "";

      const authorizedPersonTitle =
        company.authorizedPersonTitle ||
        company.vendorAuthorizedPersonTitle ||
        company.authorizedSignPersonTitle ||
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

      setFormData(
        (previous) => ({
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
     FORM
  ========================================================== */

  const handleChange =
    (event) => {
      const {
        name,
        value,
      } =
        event.target;

      setFormData(
        (previous) => ({
          ...previous,

          [name]:
            value,
        })
      );
    };


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
     BUILD DOCUMENT TEMPLATE
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
         * Create page always creates MSA + WO.
         */
        template.packageMode =
          "MSA_WO";

        template.showPageNumbers =
          false;

        template.documentData = {
          ...template.documentData,

          ...formData,

          CURRENT_DATE:
            currentDocumentDate(),

          CONTRACT_NUMBER:
            contractNumberOnly,

          tentativeStartDate:
            formatDocumentDate(
              formData.tentativeStartDate
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
     VALIDATION
  ========================================================== */

  const validateForm =
    () => {
      if (
        !selectedCompany
      ) {
        return "Please select a valid Vendor Company first.";
      }

      const required = [
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
        ] of required
      ) {
        if (
          !String(
            formData[key] ??
              ""
          ).trim()
        ) {
          return `${label} is required.`;
        }
      }

      return null;
    };


  /* ==========================================================
     PDF GENERATION
  ========================================================== */

  const generatePDFBase64 =
    async () => {
      const element =
        documentRef.current;

      if (!element) {
        throw new Error(
          "Document renderer is not available."
        );
      }

      console.log(
        "[MSA/WO] Waiting for document resources..."
      );

      /*
       * Wait for browser fonts where available.
       */
      if (
        document.fonts
          ?.ready
      ) {
        try {
          await document
            .fonts
            .ready;
        } catch {
          // Do not block generation.
        }
      }

      /*
       * Never wait forever on the Blob logo.
       */
      await waitForImages(
        element
      );

      /*
       * Allow React/CSS to settle.
       */
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

      const pageElements =
        element.querySelectorAll(
          ".a4-page"
        );

      if (
        pageElements.length !==
        7
      ) {
        throw new Error(
          `Document renderer contains ${pageElements.length} pages. Expected exactly 7 pages for MSA + WO.`
        );
      }

      console.log(
        "[MSA/WO] Generating seven-page PDF..."
      );

      const options = {
        margin: 0,

        filename:
          `MSA_WO_${contractNumber}.pdf`,

        image: {
          type: "jpeg",

          quality:
            0.95,
        },

        html2canvas: {
          /*
           * 1.5 gives good document quality without
           * putting unnecessary memory pressure on
           * seven full A4 canvases.
           */
          scale: 1.5,

          useCORS: true,

          allowTaint: false,

          backgroundColor:
            "#ffffff",

          logging: false,

          scrollX: 0,

          scrollY: 0,

          windowWidth:
            element.scrollWidth,
        },

        jsPDF: {
          unit: "mm",

          format: "a4",

          orientation:
            "portrait",

          compress: true,
        },

        /*
         * Respect CSS:
         *
         * break-after: page
         * page-break-after: always
         *
         * Do NOT force "after: .a4-page":
         * that can create a blank final sheet.
         */
        pagebreak: {
          mode: [
            "css",
            "legacy",
          ],
        },
      };

      const pdfPromise =
        html2pdf()
          .set(options)
          .from(element)
          .toPdf()
          .outputPdf(
            "datauristring"
          );

      const pdfBase64 =
        await withTimeout(
          pdfPromise,

          PDF_GENERATION_TIMEOUT_MS,

          "PDF generation timed out. Check the document logo, A4 layout, browser memory, or page overflow."
        );

      if (
        typeof pdfBase64 !==
          "string" ||
        !pdfBase64.startsWith(
          "data:application/pdf"
        )
      ) {
        throw new Error(
          "PDF generator returned invalid document data."
        );
      }

      console.log(
        "[MSA/WO] PDF created.",
        {
          characters:
            pdfBase64.length,

          pages:
            pageElements.length,
        }
      );

      return pdfBase64;
    };


  /* ==========================================================
     SUBMIT
  ========================================================== */

  const handleSubmit =
    async (event) => {
      event.preventDefault();

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
        /*
         * Stage 1
         */
        setGenerationStage(
          "Preparing document..."
        );

        const pdfBase64 =
          await generatePDFBase64();

        /*
         * Stage 2
         */
        setGenerationStage(
          "Saving & sending..."
        );

        const payload = {
          ...formData,

          contractNumber,

          templateId:
            renderedTemplate.templateId,

          templateVersion:
            renderedTemplate.version,

          templateName:
            renderedTemplate.templateName,

          documentType:
            "MSA_WO",

          pdfBase64,
        };

        console.log(
          "[MSA/WO] Sending request to backend.",
          {
            contractNumber,

            vendorName:
              payload.vendorName,

            vendorEmail:
              payload.vendorEmail,

            templateVersion:
              payload.templateVersion,

            pdfCharacters:
              pdfBase64.length,
          }
        );

        const response =
          await apiService
            .createMSAandWO(
              payload,

              user.userIdentifier
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

        setSuccess(
          response.data
            .message ||
            "MSA and Work Order created successfully."
        );

        setGenerationStage(
          ""
        );

        setFormData({});

        setSelectedCompany(
          null
        );

        setSearchTerm("");

        setContractNumber(
          createContractNumber()
        );

        /*
         * Refresh active template in case it changed.
         */
        setBaseTemplate(
          loadPublishedTemplate()
        );
      } catch (
        err
      ) {
        console.error(
          "[MSA/WO] Creation failed:",
          err
        );

        setGenerationStage(
          ""
        );

        setError(
          err.response?.data
            ?.message ||
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
     ACCESS
  ========================================================== */

  if (
    !canManageMSAWO
  ) {
    return (
      <div className="text-center text-gray-500 p-10 bg-white rounded-xl shadow-sm border">
        <h3 className="text-lg font-medium">
          Access Denied
        </h3>
      </div>
    );
  }


  /* ==========================================================
     RENDER
  ========================================================== */

  return (
    <div className="space-y-6 max-w-4xl mx-auto relative">

      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900">
          Create MSA and Work Order
        </h1>

        <p className="mt-2 text-gray-600">
          Select a Vendor and complete the Work Order details.
        </p>

        <p className="mt-1 text-xs text-gray-500">
          Template:{" "}
          {
            renderedTemplate.templateName
          }
          {" • "}
          Version{" "}
          {
            renderedTemplate.version
          }
          {" • "}
          {
            renderedTemplate.status
          }
        </p>
      </div>


      <form
        onSubmit={
          handleSubmit
        }
      >
        <div className="bg-white p-6 md:p-8 rounded-xl shadow-lg border space-y-8">

          {error && (
            <div className="bg-red-50 border-l-4 border-red-400 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-50 border-l-4 border-green-400 text-green-700 px-4 py-3 rounded-lg">
              {success}
            </div>
          )}


          {/* =================================================
              STEP 1
          ================================================= */}

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
              Vendor Company Name{" "}

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
                onFocus={() =>
                  setShowDropdown(
                    true
                  )
                }
                onChange={(
                  event
                ) => {
                  setSearchTerm(
                    event.target.value
                  );

                  setShowDropdown(
                    true
                  );

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
                          company.vendorName ||
                          company.vendorCompanyName ||
                          "";

                        return (
                          <button
                            key={
                              company.vendorId ||
                              company.id ||
                              `${name}-${index}`
                            }
                            type="button"
                            onClick={() =>
                              handleSelectCompany(
                                company
                              )
                            }
                            className="block w-full text-left px-4 py-3 hover:bg-indigo-50"
                          >
                            <div className="font-medium text-gray-900">
                              {name}
                            </div>

                            {(company.federalId ||
                              company.ein) && (
                              <div className="mt-1 text-xs text-gray-500">
                                EIN:{" "}
                                {company.federalId ||
                                  company.ein}
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
                            onClick={() =>
                              onNavigate(
                                "create_msawo_vendor_company"
                              )
                            }
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


          {/* =================================================
              SELECTED VENDOR
          ================================================= */}

          {selectedCompany && (
            <div className="rounded-lg border border-green-200 bg-green-50 p-4">
              <div className="text-sm font-semibold text-green-900">
                Vendor Selected
              </div>

              <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-green-800">

                <div>
                  <strong>
                    Company:
                  </strong>{" "}
                  {
                    formData.vendorName
                  }
                </div>

                <div>
                  <strong>
                    EIN:
                  </strong>{" "}
                  {
                    formData.federalId ||
                    "-"
                  }
                </div>

                <div>
                  <strong>
                    Authorized Signer:
                  </strong>{" "}
                  {
                    formData.authorizedSignatureName ||
                    "-"
                  }
                </div>

                <div>
                  <strong>
                    Title:
                  </strong>{" "}
                  {
                    formData.authorizedPersonTitle ||
                    "-"
                  }
                </div>
              </div>
            </div>
          )}


          {/* =================================================
              STEP 2
          ================================================= */}

          {selectedCompany && (
            <div className="border-t pt-8">

              <h2 className="text-xl font-semibold text-gray-800 border-b pb-2 mb-4">
                Step 2: Work Order Details
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6">

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Candidate Name{" "}
                    <span className="text-red-500">*</span>
                  </label>

                  <input
                    type="text"
                    name="candidateName"
                    value={
                      formData.candidateName ||
                      ""
                    }
                    onChange={
                      handleChange
                    }
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-lg p-3"
                  />
                </div>


                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Tentative Start Date{" "}
                    <span className="text-red-500">*</span>
                  </label>

                  <input
                    type="date"
                    name="tentativeStartDate"
                    value={
                      formData.tentativeStartDate ||
                      ""
                    }
                    onChange={
                      handleChange
                    }
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-lg p-3"
                  />
                </div>


                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Job Title{" "}
                    <span className="text-red-500">*</span>
                  </label>

                  <input
                    type="text"
                    name="jobTitle"
                    value={
                      formData.jobTitle ||
                      ""
                    }
                    onChange={
                      handleChange
                    }
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-lg p-3"
                  />
                </div>


                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Client Name{" "}
                    <span className="text-red-500">*</span>
                  </label>

                  <input
                    type="text"
                    name="clientName"
                    value={
                      formData.clientName ||
                      ""
                    }
                    onChange={
                      handleChange
                    }
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-lg p-3"
                  />
                </div>


                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Client Location{" "}
                    <span className="text-red-500">*</span>
                  </label>

                  <input
                    type="text"
                    name="clientLocation"
                    value={
                      formData.clientLocation ||
                      ""
                    }
                    onChange={
                      handleChange
                    }
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-lg p-3"
                  />
                </div>


                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Type Of Service{" "}
                    <span className="text-red-500">*</span>
                  </label>

                  <select
                    name="typeOfServices"
                    value={
                      formData.typeOfServices ||
                      ""
                    }
                    onChange={
                      handleChange
                    }
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-lg p-3 h-[50px]"
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


                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Type Of Subcontract{" "}
                    <span className="text-red-500">*</span>
                  </label>

                  <select
                    name="typeOfSubcontract"
                    value={
                      formData.typeOfSubcontract ||
                      ""
                    }
                    onChange={
                      handleChange
                    }
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-lg p-3 h-[50px]"
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


                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Rate{" "}
                    <span className="text-red-500">*</span>
                  </label>

                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    name="rate"
                    value={
                      formData.rate ||
                      ""
                    }
                    onChange={
                      handleChange
                    }
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-lg p-3"
                  />
                </div>


                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Per Hour / Day / Month{" "}
                    <span className="text-red-500">*</span>
                  </label>

                  <select
                    name="perHour"
                    value={
                      formData.perHour ||
                      ""
                    }
                    onChange={
                      handleChange
                    }
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-lg p-3 h-[50px]"
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


                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Payment Terms (NET){" "}
                    <span className="text-red-500">*</span>
                  </label>

                  <select
                    name="net"
                    value={
                      formData.net ||
                      ""
                    }
                    onChange={
                      handleChange
                    }
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-lg p-3 h-[50px]"
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


        <div className="mt-6 flex justify-end">
          <button
            type="submit"
            disabled={
              loading ||
              Boolean(success) ||
              !selectedCompany
            }
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-lg flex items-center justify-center min-w-56 h-12 disabled:bg-indigo-400 disabled:cursor-not-allowed shadow-lg"
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


      {/* =====================================================
          OFF-SCREEN PDF RENDERER

          IMPORTANT:
          Do not use display:none.
          html2canvas needs the DOM to be rendered.
      ===================================================== */}

      <div
        aria-hidden="true"
        style={{
          position:
            "fixed",

          top: 0,

          left:
            "-12000px",

          width:
            "210mm",

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