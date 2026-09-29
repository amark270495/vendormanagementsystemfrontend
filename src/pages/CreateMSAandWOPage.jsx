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

/*
 * =========================================================
 * HELPERS
 * =========================================================
 */

/*
 * For your current laptop/browser implementation:
 *
 * - Template Editor publishes versions to localStorage.
 * - Create MSA/WO reads the ACTIVE published version.
 * - If no published version exists, the approved default
 *   template is used.
 *
 * Later we will replace this helper with:
 *
 * apiService.getActiveMSATemplate(...)
 */
const loadPublishedTemplate = () => {
  const fallback =
    createDefaultTemplate();

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

    const activeVersions =
      versions
        .filter(
          (template) =>
            template?.status ===
              "ACTIVE" &&
            template?.pages &&
            template?.styleConfig
        )
        .sort(
          (a, b) =>
            Number(
              b.version || 0
            ) -
            Number(
              a.version || 0
            )
        );

    if (
      activeVersions.length ===
      0
    ) {
      return fallback;
    }

    return deepCloneTemplate(
      activeVersions[0]
    );
  } catch (error) {
    console.error(
      "Unable to load published MSA/WO template:",
      error
    );

    return fallback;
  }
};

/*
 * Browser date input gives us:
 *
 * 2026-10-15
 *
 * For the document we want:
 *
 * October 15, 2026
 */
const formatDocumentDate = (
  value
) => {
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

const getCurrentDocumentDate =
  () =>
    new Date().toLocaleDateString(
      "en-US",
      {
        year: "numeric",
        month: "long",
        day: "numeric",
      }
    );

/*
 * html2canvas can capture the document before the
 * company logo has fully loaded.
 *
 * Wait for all images first.
 */
const waitForImages = async (
  rootElement
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

  await Promise.all(
    images.map(
      (image) => {
        if (
          image.complete &&
          image.naturalWidth >
            0
        ) {
          return Promise.resolve();
        }

        return new Promise(
          (resolve) => {
            const finish =
              () =>
                resolve();

            image.addEventListener(
              "load",
              finish,
              {
                once: true,
              }
            );

            image.addEventListener(
              "error",
              finish,
              {
                once: true,
              }
            );
          }
        );
      }
    )
  );
};

/*
 * =========================================================
 * COMPONENT
 * =========================================================
 */

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
    error,
    setError,
  ] =
    useState("");

  const [
    success,
    setSuccess,
  ] =
    useState("");

  /*
   * Vendor company search
   */
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

  const searchRef =
    useRef(null);

  /*
   * PDF document renderer
   */
  const documentRef =
    useRef(null);

  /*
   * Loaded/published template
   */
  const [
    baseTemplate,
    setBaseTemplate,
  ] =
    useState(() =>
      loadPublishedTemplate()
    );

  /*
   * Contract Number
   *
   * Stored full:
   *
   * Taproot-Subk-12345
   */
  const [
    contractNumber,
    setContractNumber,
  ] =
    useState("");

  /*
   * =======================================================
   * CONTRACT NUMBER
   * =======================================================
   */

  const generateContractNumber =
    useCallback(() => {
      const number =
        Math.floor(
          10000 +
            Math.random() *
              90000
        );

      return `Taproot-Subk-${number}`;
    }, []);

  useEffect(() => {
    setContractNumber(
      generateContractNumber()
    );
  }, [
    generateContractNumber,
  ]);

  /*
   * =======================================================
   * LOAD VENDORS
   * =======================================================
   */

  const loadCompanies =
    useCallback(
      async () => {
        if (
          !canManageMSAWO
        ) {
          return;
        }

        try {
          const response =
            await apiService.getMSAWOVendorCompanies(
              user.userIdentifier
            );

          if (
            response.data
              .success
          ) {
            setCompanies(
              response.data
                .companies ||
                []
            );
          }
        } catch (err) {
          console.error(
            "Vendor loading failed:",
            err
          );

          setError(
            "Failed to load vendor companies."
          );
        }
      },
      [
        user.userIdentifier,
        canManageMSAWO,
      ]
    );

  useEffect(() => {
    loadCompanies();
  }, [
    loadCompanies,
  ]);

  /*
   * Reload the current published template when
   * this page opens.
   */
  useEffect(() => {
    setBaseTemplate(
      loadPublishedTemplate()
    );
  }, []);

  /*
   * =======================================================
   * CLOSE VENDOR SEARCH WHEN CLICKING OUTSIDE
   * =======================================================
   */

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

  /*
   * =======================================================
   * VENDOR SEARCH
   * =======================================================
   */

  const filteredCompanies =
    useMemo(() => {
      const value =
        searchTerm
          .trim()
          .toLowerCase();

      if (!value) {
        return [];
      }

      return companies.filter(
        (company) => {
          const vendorName =
            company.vendorName ||
            company.vendorCompanyName ||
            "";

          return vendorName
            .toLowerCase()
            .includes(value);
        }
      );
    }, [
      searchTerm,
      companies,
    ]);

  /*
   * =======================================================
   * VENDOR SELECT
   * =======================================================
   */

  const handleSelectCompany =
    (company) => {
      const vendorName =
        company.vendorName ||
        company.vendorCompanyName ||
        "";

      /*
       * Support both your current fields and the
       * VMS 2.0 Vendor Master field names.
       */
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
        company.authorizedSignPersonName ||
        company.vendorAuthorizedSignPersonName ||
        "";

      const authorizedPersonTitle =
        company.authorizedPersonTitle ||
        company.authorizedSignPersonTitle ||
        company.vendorAuthorizedPersonTitle ||
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

  /*
   * =======================================================
   * FORM CHANGE
   * =======================================================
   */

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

  /*
   * =======================================================
   * CONTRACT NUMBER USED INSIDE WO
   * =======================================================
   *
   * Template already contains:
   *
   * Taproot-Subk-
   *
   * therefore only pass:
   *
   * 12345
   */

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

  /*
   * =======================================================
   * BUILD COMPLETE TEMPLATE FOR PDF
   * =======================================================
   *
   * THIS IS THE CRITICAL FIX.
   *
   * New MSATemplatePages requires:
   *
   * template={...}
   *
   * NOT:
   *
   * data={}
   * margins={}
   */

  const renderedTemplate =
    useMemo(() => {
      const template =
        deepCloneTemplate(
          baseTemplate ||
            createDefaultTemplate()
        );

      /*
       * Create page always generates the complete
       * MSA + Work Order package.
       */
      template.packageMode =
        "MSA_WO";

      template.showPageNumbers =
        false;

      /*
       * Actual transaction data replaces preview data.
       */
      template.documentData = {
        ...template.documentData,

        ...formData,

        CURRENT_DATE:
          getCurrentDocumentDate(),

        CONTRACT_NUMBER:
          contractNumberOnly,

        tentativeStartDate:
          formatDocumentDate(
            formData.tentativeStartDate
          ),
      };

      return template;
    }, [
      baseTemplate,
      formData,
      contractNumberOnly,
    ]);

  /*
   * =======================================================
   * VALIDATION
   * =======================================================
   */

  const validateForm =
    () => {
      if (
        !selectedCompany
      ) {
        return "Please select a valid vendor company first.";
      }

      const requiredFields = [
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
          field,
          label,
        ] of requiredFields
      ) {
        if (
          !formData[
            field
          ]
        ) {
          return `${label} is required.`;
        }
      }

      return null;
    };

  /*
   * =======================================================
   * CREATE PDF
   * =======================================================
   */

  const generatePDFBase64 =
    async () => {
      const element =
        documentRef.current;

      if (!element) {
        throw new Error(
          "MSA/WO document renderer is not available."
        );
      }

      /*
       * Wait for the Taproot logo or any future
       * image inside the template.
       */
      await waitForImages(
        element
      );

      /*
       * Allow browser layout to settle.
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

      const options = {
        margin: 0,

        filename:
          `MSA_WO_${contractNumber}.pdf`,

        image: {
          type: "jpeg",

          quality: 0.98,
        },

        html2canvas: {
          scale: 2,

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
         * Respect our .a4-page CSS page breaks.
         */
        pagebreak: {
          mode: [
            "css",
            "legacy",
          ],
        },
      };

      /*
       * html2pdf returns:
       *
       * data:application/pdf;base64,JVBER...
       */
      return html2pdf()
        .set(options)
        .from(element)
        .outputPdf(
          "datauristring"
        );
    };

  /*
   * =======================================================
   * SUBMIT
   * =======================================================
   */

  const handleSubmit =
    async (event) => {
      event.preventDefault();

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

      setLoading(
        true
      );

      try {
        /*
         * STEP 1
         *
         * Generate PDF from the exact same
         * published WYSIWYG template.
         */
        const pdfBase64 =
          await generatePDFBase64();

        /*
         * STEP 2
         *
         * Build backend payload.
         */
        const payload = {
          ...formData,

          /*
           * Full contract number:
           *
           * Taproot-Subk-12345
           */
          contractNumber,

          /*
           * Useful for backend history/audit.
           */
          templateId:
            renderedTemplate.templateId,

          templateVersion:
            renderedTemplate.version,

          templateName:
            renderedTemplate.templateName,

          /*
           * PDF document
           */
          pdfBase64,
        };

        /*
         * STEP 3
         *
         * Existing Python/Azure Function endpoint.
         */
        const response =
          await apiService.createMSAandWO(
            payload,

            user.userIdentifier
          );

        if (
          response.data
            .success
        ) {
          setSuccess(
            response.data
              .message ||
              "MSA and Work Order created successfully."
          );

          setFormData({});

          setSelectedCompany(
            null
          );

          setSearchTerm(
            ""
          );

          setContractNumber(
            generateContractNumber()
          );

          setTimeout(
            () => {
              setSuccess(
                ""
              );
            },

            3000
          );
        } else {
          setError(
            response.data
              .message ||
              "Unable to create MSA and Work Order."
          );
        }
      } catch (err) {
        console.error(
          "Create MSA/WO error:",
          err
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

  /*
   * =======================================================
   * ACCESS CONTROL
   * =======================================================
   */

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

  /*
   * =======================================================
   * UI
   * =======================================================
   */

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
          Template:
          {" "}
          {
            renderedTemplate.templateName
          }
          {" • "}
          Version
          {" "}
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

          {/* ==========================================
              STEP 1
          ========================================== */}

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
                onChange={(
                  event
                ) => {
                  setSearchTerm(
                    event.target
                      .value
                  );

                  setShowDropdown(
                    true
                  );

                  setSelectedCompany(
                    null
                  );
                }}
                onFocus={() =>
                  setShowDropdown(
                    true
                  )
                }
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
                            className="block w-full text-left px-4 py-3 hover:bg-indigo-50 cursor-pointer"
                          >
                            <div className="font-medium text-gray-900">
                              {name}
                            </div>

                            {(company.federalId ||
                              company.ein) && (
                              <div className="text-xs text-gray-500 mt-1">
                                EIN:
                                {" "}
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
                          Start typing a Vendor name.
                        </p>
                      )}

                    </div>
                  )}

                </div>
              )}

            </div>

          </div>

          {/* ==========================================
              SELECTED VENDOR SUMMARY
          ========================================== */}

          {selectedCompany && (
            <div className="rounded-lg border border-green-200 bg-green-50 p-4">

              <div className="text-sm font-semibold text-green-900">
                Vendor Selected
              </div>

              <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-green-800">

                <div>
                  <strong>
                    Company:
                  </strong>
                  {" "}
                  {
                    formData.vendorName
                  }
                </div>

                <div>
                  <strong>
                    EIN:
                  </strong>
                  {" "}
                  {
                    formData.federalId ||
                    "-"
                  }
                </div>

                <div>
                  <strong>
                    Authorized Signer:
                  </strong>
                  {" "}
                  {
                    formData.authorizedSignatureName ||
                    "-"
                  }
                </div>

                <div>
                  <strong>
                    Title:
                  </strong>
                  {" "}
                  {
                    formData.authorizedPersonTitle ||
                    "-"
                  }
                </div>

              </div>

            </div>
          )}

          {/* ==========================================
              STEP 2
          ========================================== */}

          {selectedCompany && (
            <div className="border-t pt-8">

              <h2 className="text-xl font-semibold text-gray-800 border-b pb-2 mb-4">
                Step 2: Work Order Details
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6">

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
                    Tentative Start Date
                    <span className="text-red-500">
                      *
                    </span>
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
                    Job Title
                    <span className="text-red-500">
                      *
                    </span>
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
                    Client Name
                    <span className="text-red-500">
                      *
                    </span>
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
                    Client Location
                    <span className="text-red-500">
                      *
                    </span>
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
                    Type Of Service
                    <span className="text-red-500">
                      *
                    </span>
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
                    Type Of Subcontract
                    <span className="text-red-500">
                      *
                    </span>
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
                    Per Hour / Day / Month
                    <span className="text-red-500">
                      *
                    </span>
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
                    Payment Terms (NET)
                    <span className="text-red-500">
                      *
                    </span>
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
              Boolean(
                success
              ) ||
              !selectedCompany
            }
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-lg flex items-center justify-center min-w-48 h-12 disabled:bg-indigo-400 disabled:cursor-not-allowed shadow-lg"
          >

            {loading ? (
              <>
                <Spinner size="6" />

                <span className="ml-2">
                  Generating...
                </span>
              </>
            ) : (
              "Generate & Send"
            )}

          </button>

        </div>

      </form>

      {/* ==================================================
          OFF-SCREEN PDF DOCUMENT

          IMPORTANT:
          Do NOT use display:none.

          html2canvas must be able to physically render it.
      ================================================== */}

      <div
        aria-hidden="true"
        style={{
          position:
            "fixed",

          left:
            "-10000px",

          top: 0,

          width:
            "210mm",

          background:
            "#ffffff",

          pointerEvents:
            "none",

          zIndex:
            -1000,
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

            /*
             * CRITICAL:
             *
             * Preview mode resolves dynamic fields.
             */
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