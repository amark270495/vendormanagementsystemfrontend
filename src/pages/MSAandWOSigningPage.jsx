// src/pages/MSAandWOSigningPage.jsx

import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useSearchParams,
} from "react-router-dom";

import AccessModal from "../components/msa-wo/AccessModal";
import SignatureModal from "../components/msa-wo/SignatureModal";
import Spinner from "../components/Spinner";

import {
  useAuth,
} from "../context/AuthContext";

import {
  usePermissions,
} from "../hooks/usePermissions";

import {
  apiService,
} from "../api/apiService";


/* ============================================================
   HELPERS
============================================================ */

const normalizeSignerType = (
  value
) => {
  /*
   * Normal case:
   *
   * "vendor"
   * "taproot"
   */
  if (
    typeof value ===
    "string"
  ) {
    return value
      .trim()
      .toLowerCase();
  }


  /*
   * Defensive compatibility:
   *
   * {
   *   signerType: "taproot"
   * }
   */
  if (
    value &&
    typeof value ===
      "object"
  ) {
    if (
      typeof value.signerType ===
      "string"
    ) {
      return value.signerType
        .trim()
        .toLowerCase();
    }


    if (
      typeof value.type ===
      "string"
    ) {
      return value.type
        .trim()
        .toLowerCase();
    }
  }


  return "";
};


const formatDate = (
  value
) => {
  if (!value) {
    return "N/A";
  }


  try {
    const rawValue =
      String(
        value
      );


    const normalizedValue =
      /^\d{4}-\d{2}-\d{2}$/.test(
        rawValue
      )
        ? `${rawValue}T00:00:00`
        : rawValue;


    const date =
      new Date(
        normalizedValue
      );


    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return rawValue;
    }


    return date.toLocaleDateString(
      "en-US",
      {
        year:
          "numeric",

        month:
          "short",

        day:
          "numeric",
      }
    );

  } catch {
    return String(
      value
    );
  }
};


const getErrorMessage = (
  error,
  fallback
) =>
  error?.response?.data?.message ||
  error?.message ||
  fallback;


/* ============================================================
   COMPONENT
============================================================ */

const MSAandWOSigningPage =
  () => {

    /* ========================================================
       TOKEN
    ======================================================== */

    const [
      searchParams,
    ] =
      useSearchParams();


    const token =
      searchParams.get(
        "token"
      );


    /* ========================================================
       AUTH
    ======================================================== */

    const authContext =
      useAuth() ||
      {};


    const user =
      authContext.user;


    const {
      canManageMSAWO,
    } =
      usePermissions();


    /*
     * Internal Taproot signer must:
     *
     * 1. Have an authenticated VMS account.
     * 2. Have canManageMSAWO.
     */
    const isInternalSigner =
      Boolean(
        user?.userIdentifier &&
        canManageMSAWO
      );


    /* ========================================================
       DOCUMENT STATE
    ======================================================== */

    const [
      documentData,
      setDocumentData,
    ] =
      useState(
        null
      );


    const [
      loading,
      setLoading,
    ] =
      useState(
        true
      );


    const [
      signing,
      setSigning,
    ] =
      useState(
        false
      );


    const [
      error,
      setError,
    ] =
      useState(
        ""
      );


    const [
      successMessage,
      setSuccessMessage,
    ] =
      useState(
        ""
      );


    /* ========================================================
       MODALS
    ======================================================== */

    const [
      isAccessModalOpen,
      setIsAccessModalOpen,
    ] =
      useState(
        false
      );


    const [
      isSigningModalOpen,
      setIsSigningModalOpen,
    ] =
      useState(
        false
      );


    const [
      signerConfig,
      setSignerConfig,
    ] =
      useState({
        signerType:
          "",

        requiresPassword:
          false,

        signerInfo: {
          name:
            "",

          title:
            "",
        },
      });


    /* ========================================================
       VENDOR AUTHENTICATION SESSION

       This is deliberately kept only in React memory.

       NEVER store it in:
       localStorage
       sessionStorage
       URL
       query parameters
    ======================================================== */

    const [
      vendorTempPassword,
      setVendorTempPassword,
    ] =
      useState(
        ""
      );


    /* ========================================================
       SIGNATURE STATE
    ======================================================== */

    const hasVendorSigned =
      useMemo(
        () => {
          if (
            !documentData
          ) {
            return false;
          }


          if (
            documentData
              .vendorSignedDate ||
            documentData
              .vendorAuthorizedSignature
          ) {
            return true;
          }


          return [
            "Vendor Signed",
            "Finalization Pending",
            "Fully Signed",
          ].includes(
            documentData
              .status
          );
        },
        [
          documentData,
        ]
      );


    const hasTaprootSigned =
      useMemo(
        () => {
          if (
            !documentData
          ) {
            return false;
          }


          if (
            documentData
              .taprootDirectorSignedDate ||
            documentData
              .taprootDirectorSignature
          ) {
            return true;
          }


          return [
            "Director Signed",
            "Finalization Pending",
            "Fully Signed",
          ].includes(
            documentData
              .status
          );
        },
        [
          documentData,
        ]
      );


    const isFullySigned =
      documentData
        ?.status ===
      "Fully Signed";


    /* ========================================================
       INTERNAL DOCUMENT LOAD
    ======================================================== */

    const fetchInternalDocument =
      useCallback(
        async (
          isPolling = false
        ) => {

          if (
            !token ||
            !user
              ?.userIdentifier
          ) {
            return;
          }


          if (
            !isPolling
          ) {
            setLoading(
              true
            );

            setError(
              ""
            );
          }


          try {
            const response =
              await apiService
                .getMSAandWODetailForSigning(
                  token,

                  user
                    .userIdentifier
                );


            if (
              !response.data
                ?.success
            ) {
              throw new Error(
                response.data
                  ?.message ||
                "Failed to retrieve document."
              );
            }


            const receivedDocument =
              response.data
                ?.documentData;


            if (
              !receivedDocument
            ) {
              throw new Error(
                "Document data was not returned by the server."
              );
            }


            setDocumentData(
              receivedDocument
            );


          } catch (
            err
          ) {

            if (
              isPolling
            ) {
              console.error(
                "[MSA/WO] Polling failed:",
                err
              );

              return;
            }


            console.error(
              "[MSA/WO] Internal document retrieval failed:",
              err
            );


            setError(
              getErrorMessage(
                err,
                "Failed to retrieve document."
              )
            );


          } finally {

            if (
              !isPolling
            ) {
              setLoading(
                false
              );
            }

          }
        },
        [
          token,
          user?.userIdentifier,
        ]
      );


    /* ========================================================
       VENDOR DOCUMENT LOAD / REFRESH
    ======================================================== */

    const fetchVendorDocument =
      useCallback(
        async (
          passwordOverride =
            null
        ) => {

          const password =
            passwordOverride ||
            vendorTempPassword;


          if (
            !token ||
            !password
          ) {
            return;
          }


          try {
            const response =
              await apiService
                .accessMSAandWO(
                  token,
                  password
                );


            if (
              !response.data
                ?.success
            ) {
              throw new Error(
                response.data
                  ?.message ||
                "Unable to access document."
              );
            }


            const receivedDocument =
              response.data
                ?.documentData;


            if (
              !receivedDocument
            ) {
              throw new Error(
                "Document data was not returned by the server."
              );
            }


            setDocumentData(
              receivedDocument
            );


          } catch (
            err
          ) {
            console.error(
              "[MSA/WO] Vendor document retrieval failed:",
              err
            );


            setError(
              getErrorMessage(
                err,
                "Unable to retrieve document."
              )
            );
          }
        },
        [
          token,
          vendorTempPassword,
        ]
      );


    /* ========================================================
       REFRESH CURRENT DOCUMENT
    ======================================================== */

    const refreshDocument =
      useCallback(
        async () => {

          if (
            isInternalSigner
          ) {
            await fetchInternalDocument(
              false
            );

            return;
          }


          if (
            vendorTempPassword
          ) {
            await fetchVendorDocument(
              vendorTempPassword
            );
          }

        },
        [
          isInternalSigner,
          fetchInternalDocument,
          fetchVendorDocument,
          vendorTempPassword,
        ]
      );


    /* ========================================================
       VENDOR ACCESS GRANTED

       AccessModal must call:

       onAccessGranted(
         documentData,
         verifiedPassword
       )
    ======================================================== */

    const handleAccessGranted =
      useCallback(
        (
          data,
          verifiedTempPassword
        ) => {

          if (
            !data
          ) {
            setError(
              "Access denied. Document data was not returned."
            );

            return;
          }


          if (
            !verifiedTempPassword
          ) {
            setError(
              "The verified temporary password was not retained. Please authenticate again."
            );

            setIsAccessModalOpen(
              true
            );

            return;
          }


          /*
           * Keep the verified password only in current
           * component memory.
           */
          setVendorTempPassword(
            verifiedTempPassword
          );


          setDocumentData(
            data
          );


          setError(
            ""
          );


          setIsAccessModalOpen(
            false
          );


          setLoading(
            false
          );

        },
        []
      );


    /* ========================================================
       SIGN SUCCESS
    ======================================================== */

    const handleSignSuccess =
      useCallback(
        (
          message
        ) => {

          setError(
            ""
          );


          setSuccessMessage(
            message ||
            "Signature completed successfully."
          );


          setIsSigningModalOpen(
            false
          );


          setSigning(
            false
          );


          /*
           * Allow Azure Table/Blob state to settle,
           * then reload the current document.
           */
          window.setTimeout(
            async () => {

              try {
                await refreshDocument();

              } finally {

                window.setTimeout(
                  () => {
                    setSuccessMessage(
                      ""
                    );
                  },
                  3500
                );

              }

            },
            700
          );

        },
        [
          refreshDocument,
        ]
      );


    /* ========================================================
       SIGN

       Defensive against:
       onSign(data, "taproot")

       AND accidental:
       onSign(data, { signerType: "taproot" })
    ======================================================== */

    const handleSign =
      useCallback(
        async (
          incomingSignerData,
          incomingSignerType
        ) => {

          let signerData =
            incomingSignerData;


          let resolvedSignerType =
            "";


          /* --------------------------------------------------
             SUPPORT WRAPPED PAYLOADS
          -------------------------------------------------- */

          if (
            incomingSignerData &&
            typeof incomingSignerData ===
              "object" &&
            incomingSignerData
              .signerData &&
            typeof incomingSignerData
              .signerData ===
              "object"
          ) {
            signerData =
              incomingSignerData
                .signerData;


            resolvedSignerType =
              normalizeSignerType(
                incomingSignerData
                  .signerType
              );
          }


          /* --------------------------------------------------
             SECOND ARGUMENT
          -------------------------------------------------- */

          if (
            !resolvedSignerType
          ) {
            resolvedSignerType =
              normalizeSignerType(
                incomingSignerType
              );
          }


          /* --------------------------------------------------
             AUTHORITATIVE FALLBACK

             This was established when we opened the modal:
             openSigningModal("vendor")
             openSigningModal("taproot")
          -------------------------------------------------- */

          if (
            !resolvedSignerType
          ) {
            resolvedSignerType =
              normalizeSignerType(
                signerConfig
                  .signerType
              );
          }


          console.log(
            "[MSA/WO] Normalized signing request:",
            {
              incomingSignerType,

              incomingSignerTypeType:
                typeof incomingSignerType,

              resolvedSignerType,

              configuredSignerType:
                signerConfig
                  .signerType,

              hasSignerData:
                Boolean(
                  signerData
                ),

              hasSignature:
                Boolean(
                  signerData
                    ?.signatureImage
                ),

              hasPassword:
                Boolean(
                  signerData
                    ?.password
                ),
            }
          );


          /* --------------------------------------------------
             BASIC VALIDATION
          -------------------------------------------------- */

          if (
            !token
          ) {
            const message =
              "Document signing token is missing.";


            setError(
              message
            );


            throw new Error(
              message
            );
          }


          if (
            !signerData ||
            typeof signerData !==
              "object"
          ) {
            const message =
              "Signature information is missing.";


            setError(
              message
            );


            throw new Error(
              message
            );
          }


          if (
            !signerData
              .signatureImage
          ) {
            const message =
              "Please provide your signature before continuing.";


            setError(
              message
            );


            throw new Error(
              message
            );
          }


          if (
            ![
              "vendor",
              "taproot",
            ].includes(
              resolvedSignerType
            )
          ) {
            const message =
              `Unsupported signer type: ${
                resolvedSignerType ||
                "empty"
              }`;


            setError(
              message
            );


            throw new Error(
              message
            );
          }


          setSigning(
            true
          );


          setError(
            ""
          );


          try {
            let response;


            /* =================================================
               VENDOR
            ================================================= */

            if (
              resolvedSignerType ===
              "vendor"
            ) {

              if (
                !vendorTempPassword
              ) {
                setIsSigningModalOpen(
                  false
                );


                setIsAccessModalOpen(
                  true
                );


                throw new Error(
                  "Your Vendor signing session has expired. Please enter the temporary access code again."
                );
              }


              const vendorSignerData = {
                ...signerData,

                name:
                  signerData
                    .name ||
                  documentData
                    ?.authorizedSignatureName ||
                  "",

                title:
                  signerData
                    .title ||
                  documentData
                    ?.authorizedPersonTitle ||
                  "",
              };


              console.log(
                "[MSA/WO] Sending Vendor signature:",
                {
                  signerType:
                    "vendor",

                  token,

                  name:
                    vendorSignerData
                      .name,

                  title:
                    vendorSignerData
                      .title,

                  hasSignature:
                    Boolean(
                      vendorSignerData
                        .signatureImage
                    ),

                  hasTempPassword:
                    Boolean(
                      vendorTempPassword
                    ),
                }
              );


              /*
               * IMPORTANT:
               * Dedicated API method.
               *
               * signerType is hard-coded to "vendor"
               * in apiService.js.
               */
              response =
                await apiService
                  .updateVendorSigningStatus(
                    token,

                    vendorTempPassword,

                    vendorSignerData
                  );
            }


            /* =================================================
               TAPROOT
            ================================================= */

            else {

              if (
                !isInternalSigner
              ) {
                throw new Error(
                  "You are not authorized to sign this document on behalf of Taproot."
                );
              }


              if (
                !signerData
                  .password
              ) {
                throw new Error(
                  "Please enter your VMS password to authorize this electronic signature."
                );
              }


              const taprootSignerData = {
                ...signerData,

                name:
                  signerData
                    .name ||
                  user
                    ?.userName ||
                  user
                    ?.displayName ||
                  user
                    ?.userIdentifier ||
                  "",

                title:
                  signerData
                    .title ||
                  user
                    ?.userRole ||
                  "Director",
              };


              const jobInfo = {
                jobTitle:
                  documentData
                    ?.jobTitle ||
                  "",

                clientName:
                  documentData
                    ?.clientName ||
                  "",

                clientLocation:
                  documentData
                    ?.clientLocation ||
                  "",

                tentativeStartDate:
                  documentData
                    ?.tentativeStartDate ||
                  "",
              };


              console.log(
                "[MSA/WO] Sending Taproot signature:",
                {
                  signerType:
                    "taproot",

                  token,

                  authenticatedUsername:
                    user
                      ?.userIdentifier,

                  name:
                    taprootSignerData
                      .name,

                  title:
                    taprootSignerData
                      .title,

                  hasSignature:
                    Boolean(
                      taprootSignerData
                        .signatureImage
                    ),

                  hasPassword:
                    Boolean(
                      taprootSignerData
                        .password
                    ),
                }
              );


              /*
               * IMPORTANT:
               *
               * Dedicated method means the browser cannot
               * accidentally send an object as signerType.
               *
               * apiService hard-codes:
               *
               * signerType: "taproot"
               */
              response =
                await apiService
                  .updateTaprootSigningStatus(
                    token,

                    taprootSignerData,

                    user
                      .userIdentifier,

                    jobInfo
                  );
            }


            /* ------------------------------------------------
               RESPONSE
            ------------------------------------------------ */

            if (
              !response.data
                ?.success
            ) {
              throw new Error(
                response.data
                  ?.message ||
                "Failed to sign the document."
              );
            }


            handleSignSuccess(
              response.data
                ?.message
            );


            return response;


          } catch (
            err
          ) {

            console.error(
              "[MSA/WO] Signing failed:",
              err
            );


            const message =
              getErrorMessage(
                err,
                "Failed to sign the document."
              );


            setError(
              message
            );


            setSigning(
              false
            );


            /*
             * Let SignatureModal receive the same failure so
             * it can stop its own spinner and show the error.
             */
            throw err;
          }

        },
        [
          token,
          signerConfig
            .signerType,
          vendorTempPassword,
          documentData,
          isInternalSigner,
          user,
          handleSignSuccess,
        ]
      );


    /* ========================================================
       INITIAL PAGE LOAD
    ======================================================== */

    useEffect(
      () => {

        if (
          !token
        ) {
          setError(
            "No document token was provided in the URL."
          );


          setLoading(
            false
          );


          return;
        }


        /*
         * Authorized internal VMS signer.
         */
        if (
          isInternalSigner
        ) {
          setIsAccessModalOpen(
            false
          );


          fetchInternalDocument(
            false
          );


          return;
        }


        /*
         * External Vendor.
         */
        setDocumentData(
          null
        );


        setIsAccessModalOpen(
          true
        );


        setLoading(
          false
        );

      },
      [
        token,
        isInternalSigner,
        fetchInternalDocument,
      ]
    );


    /* ========================================================
       INTERNAL POLLING
    ======================================================== */

    useEffect(
      () => {

        if (
          !isInternalSigner ||
          !documentData ||
          isFullySigned
        ) {
          return undefined;
        }


        const interval =
          window.setInterval(
            () => {
              fetchInternalDocument(
                true
              );
            },
            10000
          );


        return () => {
          window.clearInterval(
            interval
          );
        };

      },
      [
        isInternalSigner,
        documentData,
        isFullySigned,
        fetchInternalDocument,
      ]
    );


    /* ========================================================
       OPEN SIGNATURE MODAL
    ======================================================== */

    const openSigningModal =
      (
        requestedType
      ) => {

        const type =
          normalizeSignerType(
            requestedType
          );


        setError(
          ""
        );


        /* ----------------------------------------------------
           VENDOR
        ---------------------------------------------------- */

        if (
          type ===
          "vendor"
        ) {

          if (
            hasVendorSigned
          ) {
            setError(
              "The Vendor has already signed this document."
            );

            return;
          }


          if (
            !vendorTempPassword
          ) {
            setError(
              "Please authenticate with your temporary access code before signing."
            );


            setIsAccessModalOpen(
              true
            );


            return;
          }


          setSignerConfig({
            signerType:
              "vendor",

            requiresPassword:
              false,

            signerInfo: {
              name:
                documentData
                  ?.authorizedSignatureName ||
                "",

              title:
                documentData
                  ?.authorizedPersonTitle ||
                "",
            },
          });


          setIsSigningModalOpen(
            true
          );


          return;
        }


        /* ----------------------------------------------------
           TAPROOT
        ---------------------------------------------------- */

        if (
          type ===
          "taproot"
        ) {

          if (
            !isInternalSigner
          ) {
            setError(
              "You are not authorized to sign this document for Taproot."
            );

            return;
          }


          if (
            hasTaprootSigned
          ) {
            setError(
              "Taproot has already signed this document."
            );

            return;
          }


          setSignerConfig({
            signerType:
              "taproot",

            requiresPassword:
              true,

            signerInfo: {
              name:
                user
                  ?.userName ||
                user
                  ?.displayName ||
                user
                  ?.userIdentifier ||
                "",

              title:
                user
                  ?.userRole ||
                "Director",
            },
          });


          setIsSigningModalOpen(
            true
          );


          return;
        }


        setError(
          "Invalid signer type."
        );
      };


    /* ========================================================
       CURRENT PROGRESS
    ======================================================== */

    const currentStep =
      useMemo(
        () => {

          if (
            isFullySigned
          ) {
            return 4;
          }


          if (
            hasVendorSigned &&
            hasTaprootSigned
          ) {
            return 3;
          }


          if (
            hasVendorSigned ||
            hasTaprootSigned
          ) {
            return 2;
          }


          return 1;

        },
        [
          isFullySigned,
          hasVendorSigned,
          hasTaprootSigned,
        ]
      );


    /* ========================================================
       RATE
    ======================================================== */

    const rateDisplay =
      useMemo(
        () => {

          if (
            documentData
              ?.rate ===
              undefined ||
            documentData
              ?.rate ===
              null ||
            documentData
              ?.rate ===
              ""
          ) {
            return "N/A";
          }


          return (
            `$${documentData.rate}` +
            (
              documentData
                ?.perHour
                ? ` ${documentData.perHour}`
                : ""
            )
          );

        },
        [
          documentData,
        ]
      );


    /* ========================================================
       DETAIL ITEM
    ======================================================== */

    const DetailItem =
      ({
        label,
        value,
      }) => (

        <div className="flex flex-col py-3 border-b border-gray-100 last:border-0">

          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">
            {label}
          </span>


          <span className="text-sm font-medium text-gray-900 break-words">
            {
              value ===
                undefined ||
              value ===
                null ||
              value ===
                ""
                ? "N/A"
                : value
            }
          </span>

        </div>
      );


    /* ========================================================
       RENDER
    ======================================================== */

    return (

      <div className="h-screen w-full bg-[#f4f4f5] font-sans flex flex-col overflow-hidden">


        {/* ====================================================
            HEADER
        ==================================================== */}

        <nav className="bg-white border-b border-gray-200 h-16 flex-shrink-0 z-30 shadow-sm relative">

          <div className="h-full w-full px-6 flex justify-between items-center">


            <div className="flex items-center space-x-4">

              <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center shadow-inner">

                <svg
                  className="w-5 h-5 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >

                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />

                </svg>

              </div>


              <div className="flex flex-col">

                <span className="font-bold text-gray-900 text-sm leading-tight">
                  Document Cloud
                </span>

                <span className="text-xs text-gray-500 font-medium">
                  Secure E-Signature Portal
                </span>

              </div>

            </div>


            {isInternalSigner && (

              <div className="flex items-center space-x-3 border-l border-gray-200 pl-6">

                <div className="w-8 h-8 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center">

                  <span className="text-sm font-bold text-blue-700">

                    {
                      (
                        user?.userName ||
                        user?.displayName ||
                        user?.userIdentifier ||
                        "U"
                      )
                        .charAt(
                          0
                        )
                        .toUpperCase()
                    }

                  </span>

                </div>


                <div className="flex flex-col">

                  <span className="text-sm font-semibold text-gray-700">

                    {
                      user?.userName ||
                      user?.displayName ||
                      user?.userIdentifier
                    }

                  </span>


                  <span className="text-[10px] uppercase tracking-wider font-semibold text-gray-400">

                    {
                      user?.userRole ||
                      "Internal Signer"
                    }

                  </span>

                </div>

              </div>

            )}

          </div>


          {/* ==================================================
              ALERTS
          ================================================== */}

          {(error ||
            successMessage) && (

            <div className="absolute top-full left-0 w-full flex justify-center pt-4 px-4 pointer-events-none z-[100]">


              {error && (

                <div className="bg-white border border-red-100 border-l-4 border-l-red-500 shadow-xl rounded-lg py-3 px-5 pointer-events-auto flex items-start space-x-3 w-full max-w-[700px]">

                  <svg
                    className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >

                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />

                  </svg>


                  <span className="text-sm font-medium text-gray-800">
                    {error}
                  </span>

                </div>

              )}


              {successMessage && (

                <div className="bg-white border border-green-100 border-l-4 border-l-green-500 shadow-xl rounded-lg py-3 px-5 pointer-events-auto flex items-start space-x-3 w-full max-w-[700px]">

                  <svg
                    className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >

                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />

                  </svg>


                  <span className="text-sm font-medium text-gray-800">
                    {successMessage}
                  </span>

                </div>

              )}

            </div>

          )}

        </nav>


        {/* ====================================================
            MAIN
        ==================================================== */}

        <main className="flex-1 flex overflow-hidden relative">


          {loading &&
          !documentData ? (

            <div className="absolute inset-0 z-50 bg-white/90 backdrop-blur-sm flex flex-col justify-center items-center">

              <Spinner size="12" />


              <div className="mt-4 text-sm font-semibold text-gray-600">
                Loading secure document...
              </div>

            </div>

          ) : documentData ? (

            <>


              {/* ===============================================
                  PDF VIEWER
              =============================================== */}

              <section className="flex-1 min-w-0 bg-[#303336] flex flex-col overflow-hidden">


                <div className="h-12 flex-shrink-0 bg-[#292c2f] border-b border-black/30 px-5 flex items-center justify-between">

                  <div className="flex items-center space-x-2">

                    <svg
                      className="w-4 h-4 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >

                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"
                      />

                    </svg>


                    <span className="text-[11px] font-bold tracking-wider text-gray-400 uppercase">
                      Document Preview
                    </span>

                  </div>


                  <div className="text-xs font-medium text-gray-400">

                    {
                      documentData
                        .contractNumber ||
                      "MSA / WO"
                    }

                  </div>

                </div>


                <div className="flex-1 min-h-0 p-5">

                  {documentData
                    ?.documentUrl ? (

                    <iframe
                      key={
                        documentData
                          .documentUrl
                      }
                      title="Master Services Agreement and Work Order"
                      src={
                        documentData
                          .documentUrl
                      }
                      className="w-full h-full bg-white border-0 shadow-[0_10px_35px_rgba(0,0,0,0.35)]"
                    />

                  ) : (

                    <div className="h-full flex items-center justify-center">

                      <div className="bg-white p-10 rounded-xl shadow-xl text-center max-w-md">

                        <h3 className="font-semibold text-gray-800">
                          Document Preview Unavailable
                        </h3>


                        <p className="mt-2 text-sm text-gray-500">
                          The document record loaded, but no secure PDF URL was returned.
                        </p>

                      </div>

                    </div>

                  )}

                </div>

              </section>


              {/* ===============================================
                  RIGHT SIDEBAR
              =============================================== */}

              <aside className="w-[420px] max-w-[42vw] bg-white border-l border-gray-200 flex flex-col flex-shrink-0 shadow-[-8px_0_24px_rgba(0,0,0,0.04)] z-20">


                <div className="p-6 border-b border-gray-200 bg-gray-50/70">

                  <h1 className="text-xl font-bold text-gray-900">
                    Master Services Agreement
                  </h1>


                  <p className="text-sm text-gray-500 mt-1">
                    Review and complete the required electronic signatures.
                  </p>

                </div>


                <div className="flex-1 overflow-y-auto p-6">


                  {/* ===========================================
                      PROGRESS
                  =========================================== */}

                  <section className="mb-8">

                    <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-4">
                      Signature Progress
                    </h3>


                    {[
                      "Document Ready",
                      "First Signature",
                      "Both Signatures",
                      "Fully Executed",
                    ].map(
                      (
                        step,
                        index
                      ) => {

                        const stepNumber =
                          index +
                          1;


                        const completed =
                          stepNumber <
                          currentStep;


                        const active =
                          stepNumber ===
                          currentStep;


                        return (

                          <div
                            key={
                              step
                            }
                            className="flex items-center mb-4 last:mb-0"
                          >

                            <div
                              className={
                                `w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 border-2 ${
                                  completed
                                    ? "bg-green-500 border-green-500 text-white"
                                    : active
                                    ? "border-blue-600 bg-blue-50 text-blue-600"
                                    : "border-gray-200 bg-white text-gray-400"
                                }`
                              }
                            >

                              {completed ? (
                                "✓"
                              ) : (
                                <span className="text-[10px] font-bold">
                                  {
                                    stepNumber
                                  }
                                </span>
                              )}

                            </div>


                            <span
                              className={
                                `ml-3 text-sm font-medium ${
                                  active
                                    ? "text-gray-900"
                                    : completed
                                    ? "text-gray-700"
                                    : "text-gray-400"
                                }`
                              }
                            >
                              {step}
                            </span>

                          </div>

                        );
                      }
                    )}

                  </section>


                  {/* ===========================================
                      SIGNATURE STATUS
                  =========================================== */}

                  <section className="grid grid-cols-2 gap-3 mb-8">


                    <div
                      className={
                        `rounded-lg border p-4 ${
                          hasVendorSigned
                            ? "bg-green-50 border-green-200"
                            : "bg-gray-50 border-gray-200"
                        }`
                      }
                    >

                      <div className="text-[10px] uppercase font-bold tracking-wider text-gray-500">
                        Vendor
                      </div>


                      <div
                        className={
                          `mt-1 text-sm font-semibold ${
                            hasVendorSigned
                              ? "text-green-700"
                              : "text-gray-500"
                          }`
                        }
                      >

                        {
                          hasVendorSigned
                            ? "Signed"
                            : "Pending"
                        }

                      </div>


                      {documentData
                        ?.vendorSignedDate && (

                        <div className="mt-1 text-[10px] text-gray-500">

                          {
                            formatDate(
                              documentData
                                .vendorSignedDate
                            )
                          }

                        </div>

                      )}

                    </div>


                    <div
                      className={
                        `rounded-lg border p-4 ${
                          hasTaprootSigned
                            ? "bg-green-50 border-green-200"
                            : "bg-gray-50 border-gray-200"
                        }`
                      }
                    >

                      <div className="text-[10px] uppercase font-bold tracking-wider text-gray-500">
                        Taproot
                      </div>


                      <div
                        className={
                          `mt-1 text-sm font-semibold ${
                            hasTaprootSigned
                              ? "text-green-700"
                              : "text-gray-500"
                          }`
                        }
                      >

                        {
                          hasTaprootSigned
                            ? "Signed"
                            : "Pending"
                        }

                      </div>


                      {documentData
                        ?.taprootDirectorSignedDate && (

                        <div className="mt-1 text-[10px] text-gray-500">

                          {
                            formatDate(
                              documentData
                                .taprootDirectorSignedDate
                            )
                          }

                        </div>

                      )}

                    </div>

                  </section>


                  {/* ===========================================
                      CONTRACT
                  =========================================== */}

                  <section>

                    <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2 border-b border-gray-100 pb-2">
                      Contract Summary
                    </h3>


                    <DetailItem
                      label="Contract ID"
                      value={
                        documentData
                          .contractNumber
                      }
                    />


                    <DetailItem
                      label="Status"
                      value={
                        documentData
                          .status
                      }
                    />


                    <DetailItem
                      label="Vendor"
                      value={
                        documentData
                          .vendorName
                      }
                    />


                    <DetailItem
                      label="Authorized Signer"
                      value={
                        documentData
                          .authorizedSignatureName
                      }
                    />


                    <DetailItem
                      label="Candidate"
                      value={
                        documentData
                          .candidateName
                      }
                    />


                    <DetailItem
                      label="Role"
                      value={
                        documentData
                          .jobTitle
                      }
                    />


                    <DetailItem
                      label="Client"
                      value={
                        documentData
                          .clientName
                      }
                    />


                    <DetailItem
                      label="Location"
                      value={
                        documentData
                          .clientLocation
                      }
                    />


                    <DetailItem
                      label="Start Date"
                      value={
                        formatDate(
                          documentData
                            .tentativeStartDate
                        )
                      }
                    />


                    <DetailItem
                      label="Service"
                      value={
                        documentData
                          .typeOfServices
                      }
                    />


                    <DetailItem
                      label="Subcontract"
                      value={
                        documentData
                          .typeOfSubcontract
                      }
                    />


                    <DetailItem
                      label="Rate"
                      value={
                        rateDisplay
                      }
                    />


                    <DetailItem
                      label="Payment Terms"
                      value={
                        documentData
                          .net
                          ? `NET ${documentData.net}`
                          : "N/A"
                      }
                    />

                  </section>

                </div>


                {/* =============================================
                    ACTIONS
                ============================================= */}

                <div className="p-6 border-t border-gray-200 bg-white">


                  {isFullySigned ? (

                    <div className="w-full py-3.5 px-4 bg-green-50 border border-green-200 text-green-700 rounded-lg text-center">

                      <div className="font-semibold text-sm">
                        ✓ Fully Executed
                      </div>

                    </div>

                  ) : (

                    <>


                      {!isInternalSigner &&
                      !hasVendorSigned && (

                        <button
                          type="button"
                          disabled={
                            signing
                          }
                          onClick={() =>
                            openSigningModal(
                              "vendor"
                            )
                          }
                          className="w-full flex items-center justify-center px-4 py-3.5 bg-blue-600 text-white rounded-lg font-semibold text-sm hover:bg-blue-700 disabled:bg-blue-400"
                        >

                          {signing ? (
                            <>
                              <Spinner size="5" />

                              <span className="ml-2">
                                Signing...
                              </span>
                            </>
                          ) : (
                            "Provide Signature"
                          )}

                        </button>

                      )}


                      {!isInternalSigner &&
                      hasVendorSigned && (

                        <div className="w-full py-3.5 px-4 bg-blue-50 border border-blue-200 text-blue-700 rounded-lg text-center">

                          <div className="font-semibold text-sm">
                            Your signature is complete
                          </div>


                          <div className="text-xs mt-1">
                            Waiting for Taproot.
                          </div>

                        </div>

                      )}


                      {isInternalSigner &&
                      !hasTaprootSigned && (

                        <button
                          type="button"
                          disabled={
                            signing
                          }
                          onClick={() =>
                            openSigningModal(
                              "taproot"
                            )
                          }
                          className="w-full flex items-center justify-center px-4 py-3.5 bg-blue-600 text-white rounded-lg font-semibold text-sm hover:bg-blue-700 disabled:bg-blue-400"
                        >

                          {signing ? (
                            <>
                              <Spinner size="5" />

                              <span className="ml-2">
                                Signing...
                              </span>
                            </>
                          ) : (
                            "Approve & Sign Document"
                          )}

                        </button>

                      )}


                      {isInternalSigner &&
                      hasTaprootSigned && (

                        <div className="w-full py-3.5 px-4 bg-blue-50 border border-blue-200 text-blue-700 rounded-lg text-center">

                          <div className="font-semibold text-sm">
                            Taproot signature is complete
                          </div>


                          <div className="text-xs mt-1">
                            Waiting for Vendor.
                          </div>

                        </div>

                      )}

                    </>

                  )}


                  <div className="mt-4 flex items-center justify-center text-gray-400">

                    <span className="text-[10px] uppercase tracking-wider font-bold">
                      🔒 Secure Electronic Signature
                    </span>

                  </div>

                </div>

              </aside>

            </>

          ) : (

            !isAccessModalOpen && (

              <div className="w-full h-full flex items-center justify-center">

                <div className="bg-white border border-gray-200 rounded-xl shadow-sm px-10 py-8 text-center max-w-lg">

                  <h2 className="text-lg font-semibold text-gray-800">
                    Document unavailable
                  </h2>


                  <p className="mt-2 text-sm text-gray-500">
                    {
                      error ||
                      "Unable to access this agreement."
                    }
                  </p>


                  {!isInternalSigner &&
                  token && (

                    <button
                      type="button"
                      onClick={() => {
                        setError(
                          ""
                        );

                        setIsAccessModalOpen(
                          true
                        );
                      }}
                      className="mt-5 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold"
                    >
                      Authenticate Again
                    </button>

                  )}

                </div>

              </div>

            )

          )}

        </main>


        {/* ====================================================
            VENDOR ACCESS
        ==================================================== */}

        <AccessModal
          isOpen={
            isAccessModalOpen
          }

          onClose={() => {
            setIsAccessModalOpen(
              false
            );
          }}

          onAccessGranted={
            handleAccessGranted
          }

          token={
            token
          }

          vendorEmail={
            documentData
              ?.vendorEmail
          }
        />


        {/* ====================================================
            SIGNATURE
        ==================================================== */}

        <SignatureModal
          isOpen={
            isSigningModalOpen
          }

          onClose={() => {
            if (
              !signing
            ) {
              setIsSigningModalOpen(
                false
              );
            }
          }}

          onSign={
            handleSign
          }

          /*
           * IMPORTANT:
           *
           * This MUST be a literal string:
           *
           * "vendor"
           * or
           * "taproot"
           */
          signerType={
            signerConfig
              .signerType
          }

          signerInfo={
            signerConfig
              .signerInfo
          }

          requiresPassword={
            signerConfig
              .requiresPassword
          }

          documentUrl={
            documentData
              ?.documentUrl
          }
        />

      </div>
    );
  };


export default MSAandWOSigningPage;