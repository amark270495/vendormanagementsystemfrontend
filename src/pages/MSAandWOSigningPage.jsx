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
  if (
    typeof value ===
    "string"
  ) {
    return value
      .trim()
      .toLowerCase();
  }


  /*
   * Defensive compatibility only.
   *
   * New SignatureModal sends a string,
   * but this protects the page from older components.
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
      return value
        .signerType
        .trim()
        .toLowerCase();
    }


    if (
      typeof value.type ===
      "string"
    ) {
      return value
        .type
        .trim()
        .toLowerCase();
    }
  }


  return "";
};


const formatDate = (
  value,
  includeTime = false
) => {
  if (!value) {
    return "N/A";
  }


  try {
    const raw =
      String(
        value
      );


    const normalized =
      /^\d{4}-\d{2}-\d{2}$/.test(
        raw
      )
        ? `${raw}T00:00:00`
        : raw;


    const date =
      new Date(
        normalized
      );


    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return raw;
    }


    if (
      includeTime
    ) {
      return date.toLocaleString(
        "en-US",
        {
          year:
            "numeric",

          month:
            "short",

          day:
            "numeric",

          hour:
            "numeric",

          minute:
            "2-digit",
        }
      );
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
  fallback =
    "An unexpected error occurred."
) => {
  return (
    error?.response?.data?.message ||
    error?.message ||
    fallback
  );
};


/* ============================================================
   STATUS BADGE
============================================================ */

const StatusBadge = ({
  status,
}) => {
  const normalized =
    String(
      status ||
      ""
    )
      .trim()
      .toLowerCase();


  let classes =
    "bg-slate-100 text-slate-700 ring-slate-200";


  if (
    normalized ===
    "fully signed"
  ) {
    classes =
      "bg-emerald-50 text-emerald-700 ring-emerald-200";
  }


  else if (
    normalized ===
      "vendor signed" ||
    normalized ===
      "director signed" ||
    normalized ===
      "finalization pending"
  ) {
    classes =
      "bg-blue-50 text-blue-700 ring-blue-200";
  }


  else if (
    normalized ===
      "pending"
  ) {
    classes =
      "bg-amber-50 text-amber-700 ring-amber-200";
  }


  return (
    <span
      className={
        `inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.1em] ring-1 ${classes}`
      }
    >
      {
        status ||
        "Unknown"
      }
    </span>
  );
};


/* ============================================================
   DETAIL ITEM
============================================================ */

const DetailItem = ({
  label,
  value,
}) => (
  <div className="border-b border-slate-100 py-3.5 last:border-b-0">

    <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
      {label}
    </div>


    <div className="mt-1 break-words text-sm font-semibold leading-5 text-slate-800">
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
    </div>

  </div>
);


/* ============================================================
   CHECK ICON
============================================================ */

const CheckIcon = ({
  className =
    "w-4 h-4",
}) => (
  <svg
    className={
      className
    }
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2.5"
      d="M5 13l4 4L19 7"
    />
  </svg>
);


/* ============================================================
   LOCK ICON
============================================================ */

const LockIcon = ({
  className =
    "w-4 h-4",
}) => (
  <svg
    className={
      className
    }
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <rect
      x="5"
      y="10"
      width="14"
      height="11"
      rx="2"
      strokeWidth="2"
    />

    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M8 10V7a4 4 0 018 0v3"
    />
  </svg>
);


/* ============================================================
   DOCUMENT ICON
============================================================ */

const DocumentIcon = ({
  className =
    "w-5 h-5",
}) => (
  <svg
    className={
      className
    }
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M7 3h7l5 5v13H7z"
    />

    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M14 3v5h5"
    />
  </svg>
);


/* ============================================================
   MAIN COMPONENT
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
     * An internal signer must:
     *
     * 1. Be logged into VMS.
     * 2. Have canManageMSAWO.
     *
     * Vendor links without an authenticated VMS user
     * follow the temporary-password flow.
     */
    const isInternalSigner =
      Boolean(
        user?.userIdentifier &&
        canManageMSAWO
      );


    /* ========================================================
       STATE
    ======================================================== */

    const [
      documentData,
      setDocumentData,
    ] =
      useState(
        null
      );


    const [
      initialLoading,
      setInitialLoading,
    ] =
      useState(
        true
      );


    const [
      refreshing,
      setRefreshing,
    ] =
      useState(
        false
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


    /*
     * Vendor access code.
     *
     * IMPORTANT:
     * This exists ONLY in React memory.
     *
     * It is NOT persisted to:
     * - localStorage
     * - sessionStorage
     * - cookies
     * - URL
     */
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


          /*
           * Signature fields are authoritative.
           */
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
            documentData.status
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
            documentData.status
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
       PDF URL
    ======================================================== */

    const documentUrl =
      documentData
        ?.documentUrl ||
      "";


    /* ========================================================
       INTERNAL DOCUMENT FETCH
    ======================================================== */

    const fetchInternalDocument =
      useCallback(
        async ({
          polling = false,
          silent = false,
        } = {}) => {

          if (
            !token ||
            !user
              ?.userIdentifier
          ) {
            return null;
          }


          if (
            !polling &&
            !silent
          ) {
            setInitialLoading(
              true
            );
          }


          if (
            silent
          ) {
            setRefreshing(
              true
            );
          }


          try {

            if (
              !polling
            ) {
              setError(
                ""
              );
            }


            const response =
              await apiService
                .getMSAandWODetailForSigning(
                  token,

                  user
                    .userIdentifier
                );


            if (
              !response
                ?.data
                ?.success
            ) {
              throw new Error(
                response
                  ?.data
                  ?.message ||
                "Unable to load the agreement."
              );
            }


            const receivedDocument =
              response
                ?.data
                ?.documentData;


            if (
              !receivedDocument
            ) {
              throw new Error(
                "The server did not return document information."
              );
            }


            setDocumentData(
              receivedDocument
            );


            return receivedDocument;

          } catch (
            err
          ) {

            if (
              polling
            ) {
              console.error(
                "[MSA/WO] Background polling failed:",
                err
              );

              return null;
            }


            const message =
              getErrorMessage(
                err,
                "Unable to load the agreement."
              );


            console.error(
              "[MSA/WO] Internal document load failed:",
              err
            );


            setError(
              message
            );


            return null;

          } finally {

            if (
              !polling &&
              !silent
            ) {
              setInitialLoading(
                false
              );
            }


            if (
              silent
            ) {
              setRefreshing(
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
       VENDOR DOCUMENT FETCH
    ======================================================== */

    const fetchVendorDocument =
      useCallback(
        async (
          passwordOverride =
            null,
          {
            silent = false,
          } = {}
        ) => {

          const password =
            passwordOverride ||
            vendorTempPassword;


          if (
            !token ||
            !password
          ) {
            return null;
          }


          if (
            silent
          ) {
            setRefreshing(
              true
            );
          }


          try {
            const response =
              await apiService
                .accessMSAandWO(
                  token,
                  password
                );


            if (
              !response
                ?.data
                ?.success
            ) {
              throw new Error(
                response
                  ?.data
                  ?.message ||
                "Unable to access this agreement."
              );
            }


            const receivedDocument =
              response
                ?.data
                ?.documentData;


            if (
              !receivedDocument
            ) {
              throw new Error(
                "The server did not return document information."
              );
            }


            setDocumentData(
              receivedDocument
            );


            return receivedDocument;

          } catch (
            err
          ) {

            console.error(
              "[MSA/WO] Vendor document refresh failed:",
              err
            );


            const message =
              getErrorMessage(
                err,
                "Unable to access this agreement."
              );


            setError(
              message
            );


            return null;

          } finally {

            if (
              silent
            ) {
              setRefreshing(
                false
              );
            }

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
        async (
          silent =
            false
        ) => {

          if (
            isInternalSigner
          ) {
            return fetchInternalDocument({
              silent,
            });
          }


          if (
            vendorTempPassword
          ) {
            return fetchVendorDocument(
              vendorTempPassword,
              {
                silent,
              }
            );
          }


          return null;

        },
        [
          isInternalSigner,
          fetchInternalDocument,
          fetchVendorDocument,
          vendorTempPassword,
        ]
      );


    /* ========================================================
       VENDOR ACCESS SUCCESS

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
              "Access was granted, but the agreement was not returned."
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
           * Store only in component memory.
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


          setSuccessMessage(
            ""
          );


          setIsAccessModalOpen(
            false
          );


          setInitialLoading(
            false
          );


          console.log(
            "[MSA/WO] Vendor access established:",
            {
              contractNumber:
                data
                  ?.contractNumber,

              vendor:
                data
                  ?.vendorName,

              hasVerifiedAccessCode:
                Boolean(
                  verifiedTempPassword
                ),
            }
          );

        },
        []
      );


    /* ========================================================
       SUCCESS HANDLING
    ======================================================== */

    const handleSignSuccess =
      useCallback(
        async (
          message
        ) => {

          setError(
            ""
          );


          setSuccessMessage(
            message ||
            "Signature completed successfully."
          );


          setSigning(
            false
          );


          setIsSigningModalOpen(
            false
          );


          /*
           * Reload immediately.
           *
           * Backend has already returned success,
           * so Table state should exist.
           */
          try {
            await refreshDocument(
              true
            );

          } catch (
            refreshError
          ) {
            console.error(
              "[MSA/WO] Post-sign refresh failed:",
              refreshError
            );
          }


          window.setTimeout(
            () => {
              setSuccessMessage(
                ""
              );
            },
            4500
          );

        },
        [
          refreshDocument,
        ]
      );


    /* ========================================================
       NEW SAFE SIGNATURE CONTRACT

       SignatureModal calls:

       onSign({
         signerType: "taproot",
         signerData: {
           signatureImage,
           name,
           title,
           password
         }
       })
    ======================================================== */

    const handleSign =
      useCallback(
        async (
          payload
        ) => {

          /* --------------------------------------------------
              VALIDATE WRAPPER
          -------------------------------------------------- */

          if (
            !payload ||
            typeof payload !==
              "object" ||
            Array.isArray(
              payload
            )
          ) {
            const message =
              "Invalid signature request.";


            setError(
              message
            );


            throw new Error(
              message
            );
          }


          const normalizedSignerType =
            normalizeSignerType(
              payload
                .signerType
            );


          const signerData =
            payload
              .signerData;


          console.log(
            "[MSA/WO] Parent received signature:",
            {
              signerType:
                normalizedSignerType,

              signerTypeType:
                typeof normalizedSignerType,

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
            ![
              "vendor",
              "taproot",
            ].includes(
              normalizedSignerType
            )
          ) {
            const message =
              `Unsupported signer type: ${
                normalizedSignerType ||
                "missing"
              }`;


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
              "object" ||
            Array.isArray(
              signerData
            )
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
              "Signature image is missing.";


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


          setSuccessMessage(
            ""
          );


          try {
            let response;


            /* =================================================
               VENDOR SIGNATURE
            ================================================= */

            if (
              normalizedSignerType ===
              "vendor"
            ) {

              if (
                hasVendorSigned
              ) {
                throw new Error(
                  "The Vendor has already signed this agreement."
                );
              }


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
                  "Your signing session has expired. Please enter the temporary access code again."
                );
              }


              const vendorSignerData = {
                signatureImage:
                  signerData
                    .signatureImage,

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
                "[MSA/WO] Calling dedicated Vendor signing API:",
                {
                  signerType:
                    "vendor",

                  token,

                  signerName:
                    vendorSignerData
                      .name,

                  signerTitle:
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
               * =================================================
               * FIX: Matches apiService exactly:
               * updateVendorSigningStatus: (token, tempPassword, signerData)
               * =================================================
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
               TAPROOT SIGNATURE
            ================================================= */

            else {

              if (
                hasTaprootSigned
              ) {
                throw new Error(
                  "Taproot has already signed this agreement."
                );
              }


              if (
                !isInternalSigner
              ) {
                throw new Error(
                  "You are not authorized to sign this agreement on behalf of Taproot."
                );
              }


              if (
                !user
                  ?.userIdentifier
              ) {
                throw new Error(
                  "Authenticated VMS user information is unavailable."
                );
              }


              if (
                !signerData
                  .password
                  ?.trim()
              ) {
                throw new Error(
                  "Enter your VMS password to authorize this electronic signature."
                );
              }


              const taprootSignerData = {
                signatureImage:
                  signerData
                    .signatureImage,

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
                    ?.jobTitle ||
                  user
                    ?.title ||
                  user
                    ?.userRole ||
                  "Director",

                /*
                 * Backend verifies this against TABLE_NAME_USERS.
                 */
                password:
                  signerData
                    .password,
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

                candidateName:
                  documentData
                    ?.candidateName ||
                  "",

                contractNumber:
                  documentData
                    ?.contractNumber ||
                  "",
              };


              console.log(
                "[MSA/WO] Calling dedicated Taproot signing API:",
                {
                  signerType:
                    "taproot",

                  authenticatedUsername:
                    user
                      .userIdentifier,

                  signerName:
                    taprootSignerData
                      .name,

                  signerTitle:
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
               * =================================================
               * FIX: Matches apiService exactly:
               * updateTaprootSigningStatus: (token, signerData, authenticatedUsername, jobInfo)
               * =================================================
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


            /* --------------------------------------------------
               API RESPONSE
            -------------------------------------------------- */

            if (
              !response
                ?.data
                ?.success
            ) {
              throw new Error(
                response
                  ?.data
                  ?.message ||
                "The signature could not be completed."
              );
            }


            await handleSignSuccess(
              response
                ?.data
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
                "The signature could not be completed."
              );


            setError(
              message
            );


            setSigning(
              false
            );


            /*
             * SignatureModal catches this and displays
             * the same backend error.
             */
            throw err;
          }

        },
        [
          token,
          hasVendorSigned,
          hasTaprootSigned,
          vendorTempPassword,
          documentData,
          isInternalSigner,
          user,
          handleSignSuccess,
        ]
      );


    /* ========================================================
       INITIAL LOAD
    ======================================================== */

    useEffect(
      () => {

        if (
          !token
        ) {
          setError(
            "No document token was provided in the signing URL."
          );


          setInitialLoading(
            false
          );


          return;
        }


        /*
         * Internal VMS signer.
         */
        if (
          isInternalSigner
        ) {
          setIsAccessModalOpen(
            false
          );


          fetchInternalDocument();


          return;
        }


        /*
         * External Vendor.
         */
        setInitialLoading(
          false
        );


        setIsAccessModalOpen(
          true
        );

      },
      [
        token,
        isInternalSigner,
        fetchInternalDocument,
      ]
    );


    /* ========================================================
       INTERNAL BACKGROUND POLLING

       Vendor does not need background polling because
       re-calling accessMSAandWO repeatedly would unnecessarily
       re-check its temporary password.
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


        const intervalId =
          window.setInterval(
            () => {

              fetchInternalDocument({
                polling:
                  true,
              });

            },
            15000
          );


        return () => {
          window.clearInterval(
            intervalId
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


        setSuccessMessage(
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
              "The Vendor has already signed this agreement."
            );


            return;
          }


          if (
            !vendorTempPassword
          ) {
            setError(
              "Your Vendor access session is no longer available. Enter the temporary access code again."
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
              "You are not authorized to sign this agreement for Taproot."
            );


            return;
          }


          if (
            hasTaprootSigned
          ) {
            setError(
              "Taproot has already signed this agreement."
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
                  ?.name ||
                user
                  ?.userIdentifier ||
                "",

              title:
                user
                  ?.jobTitle ||
                user
                  ?.title ||
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
          "Invalid signing role."
        );
      };


    /* ========================================================
       PROGRESS
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


          const rateUnit =
            documentData
              ?.perHour
              ? ` ${documentData.perHour}`
              : "";


          return (
            `$${documentData.rate}` +
            rateUnit
          );

        },
        [
          documentData,
        ]
      );


    /* ========================================================
       PAYMENT TERMS
    ======================================================== */

    const paymentTerms =
      useMemo(
        () => {

          if (
            !documentData
              ?.net
          ) {
            return "N/A";
          }


          const text =
            String(
              documentData.net
            );


          if (
            text
              .toLowerCase()
              .includes(
                "net"
              )
          ) {
            return text;
          }


          return `NET ${text}`;

        },
        [
          documentData,
        ]
      );


    /* ========================================================
       MANUAL REFRESH
    ======================================================== */

    const handleManualRefresh =
      async () => {

        setError(
          ""
        );


        await refreshDocument(
          true
        );
      };


    /* ========================================================
       RENDER
    ======================================================== */

    return (

      <div className="flex h-screen w-full flex-col overflow-hidden bg-[#f4f6f8] font-sans">


        {/* ====================================================
            TOP BAR
        ==================================================== */}

        <header className="relative z-30 flex h-16 flex-shrink-0 items-center justify-between border-b border-slate-200 bg-white px-5 shadow-sm lg:px-7">


          <div className="flex items-center gap-3">

            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm">

              <DocumentIcon className="w-5 h-5" />

            </div>


            <div>

              <div className="text-sm font-extrabold tracking-tight text-slate-900">
                Document Cloud
              </div>


              <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                Secure E-Signature Portal
              </div>

            </div>

          </div>


          <div className="flex items-center gap-4">


            {documentData && (

              <div className="hidden items-center gap-3 md:flex">

                <StatusBadge
                  status={
                    documentData
                      .status
                  }
                />


                <button
                  type="button"

                  disabled={
                    refreshing
                  }

                  onClick={
                    handleManualRefresh
                  }

                  className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >

                  {refreshing ? (
                    <>
                      <Spinner size="4" />

                      Refreshing
                    </>
                  ) : (
                    "Refresh"
                  )}

                </button>

              </div>

            )}


            {isInternalSigner && (

              <div className="flex items-center gap-3 border-l border-slate-200 pl-4">

                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-sm font-bold text-white shadow-sm">

                  {
                    (
                      user
                        ?.userName ||
                      user
                        ?.displayName ||
                      user
                        ?.userIdentifier ||
                      "U"
                    )
                      .charAt(
                        0
                      )
                      .toUpperCase()
                  }

                </div>


                <div className="hidden sm:block">

                  <div className="max-w-[180px] truncate text-xs font-bold text-slate-800">

                    {
                      user
                        ?.userName ||
                      user
                        ?.displayName ||
                      user
                        ?.userIdentifier
                    }

                  </div>


                  <div className="mt-0.5 text-[9px] font-bold uppercase tracking-[0.12em] text-slate-400">

                    {
                      user
                        ?.userRole ||
                      "Authorized Signer"
                    }

                  </div>

                </div>

              </div>

            )}

          </div>


          {/* ==================================================
              PAGE ALERT
          ================================================== */}

          {(error ||
            successMessage) && (

            <div className="pointer-events-none absolute left-0 top-full z-[100] flex w-full justify-center px-4 pt-4">

              {error && (

                <div className="pointer-events-auto flex w-full max-w-[720px] items-start gap-3 rounded-xl border border-red-200 bg-white px-4 py-3.5 shadow-xl">

                  <div className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-red-100 text-xs font-black text-red-600">
                    !
                  </div>


                  <div className="min-w-0">

                    <div className="text-xs font-bold uppercase tracking-wider text-red-600">
                      Action required
                    </div>


                    <div className="mt-0.5 text-sm font-medium text-slate-800">
                      {error}
                    </div>

                  </div>

                </div>

              )}


              {successMessage && (

                <div className="pointer-events-auto flex w-full max-w-[720px] items-start gap-3 rounded-xl border border-emerald-200 bg-white px-4 py-3.5 shadow-xl">

                  <div className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">

                    <CheckIcon className="w-3.5 h-3.5" />

                  </div>


                  <div>

                    <div className="text-xs font-bold uppercase tracking-wider text-emerald-600">
                      Completed
                    </div>


                    <div className="mt-0.5 text-sm font-medium text-slate-800">
                      {successMessage}
                    </div>

                  </div>

                </div>

              )}

            </div>

          )}

        </header>


        {/* ====================================================
            MAIN WORKSPACE
        ==================================================== */}

        <main className="relative flex min-h-0 flex-1 overflow-hidden">


          {/* ==================================================
              INITIAL LOADING
          ================================================== */}

          {initialLoading &&
          !documentData ? (

            <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-white/95 backdrop-blur-sm">

              <Spinner size="12" />


              <div className="mt-5 text-sm font-bold text-slate-700">
                Loading secure agreement
              </div>


              <div className="mt-1 text-xs text-slate-400">
                Verifying access and preparing the document...
              </div>

            </div>

          ) : documentData ? (

            <>


              {/* ===============================================
                  PDF WORKSPACE
              =============================================== */}

              <section className="relative flex min-w-0 flex-1 flex-col overflow-hidden bg-[#303336]">


                <div className="flex h-12 flex-shrink-0 items-center justify-between border-b border-black/30 bg-[#292c2f] px-5">

                  <div className="flex items-center gap-2 text-slate-400">

                    <DocumentIcon className="w-4 h-4" />


                    <span className="text-[10px] font-bold uppercase tracking-[0.14em]">
                      Agreement Preview
                    </span>

                  </div>


                  <div className="flex items-center gap-4">

                    <span className="hidden text-[10px] font-medium text-slate-500 sm:block">

                      {
                        documentData
                          .documentType ===
                          "MSA_WO"
                          ? "MSA + Work Order"
                          : documentData
                              .documentType ||
                            "Agreement"
                      }

                    </span>


                    <span className="rounded-md bg-white/[0.06] px-2.5 py-1 text-[10px] font-semibold text-slate-400">

                      {
                        documentData
                          .contractNumber ||
                        "Contract"
                      }

                    </span>

                  </div>

                </div>


                <div className="relative min-h-0 flex-1 p-4 lg:p-5">

                  <div
                    className="pointer-events-none absolute inset-0 opacity-[0.03]"
                    style={{
                      backgroundImage:
                        "radial-gradient(#ffffff 1px, transparent 1px)",

                      backgroundSize:
                        "22px 22px",
                    }}
                  />


                  {documentUrl ? (

                    <div className="relative h-full w-full overflow-hidden rounded-md bg-white shadow-[0_20px_60px_rgba(0,0,0,0.4)]">

                      <iframe
                        key={
                          documentUrl
                        }

                        title="Master Services Agreement and Work Order"

                        src={
                          documentUrl
                        }

                        className="h-full w-full border-0 bg-white"
                      />

                    </div>

                  ) : (

                    <div className="relative flex h-full items-center justify-center">

                      <div className="max-w-sm rounded-2xl bg-[#292c2f] px-8 py-10 text-center ring-1 ring-white/10">

                        <DocumentIcon className="mx-auto h-12 w-12 text-slate-500" />


                        <h3 className="mt-4 text-sm font-bold text-slate-200">
                          Preview unavailable
                        </h3>


                        <p className="mt-2 text-xs leading-5 text-slate-500">
                          The agreement loaded successfully, but the secure PDF preview URL was unavailable.
                        </p>

                      </div>

                    </div>

                  )}

                </div>

              </section>


              {/* ===============================================
                  INFORMATION SIDEBAR
              =============================================== */}

              <aside className="relative z-20 flex w-[410px] max-w-[43vw] flex-shrink-0 flex-col border-l border-slate-200 bg-white shadow-[-8px_0_25px_rgba(15,23,42,0.04)]">


                {/* =============================================
                    SIDEBAR HEADER
                ============================================= */}

                <div className="flex-shrink-0 border-b border-slate-200 bg-gradient-to-b from-white to-slate-50/50 px-6 py-5">

                  <div className="flex items-start justify-between gap-3">

                    <div>

                      <div className="text-[10px] font-bold uppercase tracking-[0.13em] text-blue-600">
                        Contract
                      </div>


                      <h1 className="mt-1 text-lg font-extrabold leading-tight tracking-tight text-slate-950">
                        Master Services Agreement
                      </h1>


                      <p className="mt-1.5 text-xs leading-5 text-slate-500">
                        Review the agreement and complete the required electronic signatures.
                      </p>

                    </div>

                  </div>

                </div>


                {/* =============================================
                    SCROLLABLE SIDEBAR
                ============================================= */}

                <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">


                  {/* ===========================================
                      PROGRESS
                  =========================================== */}

                  <section>

                    <div className="mb-4 flex items-center justify-between">

                      <h2 className="text-[10px] font-bold uppercase tracking-[0.13em] text-slate-400">
                        Signing Progress
                      </h2>


                      <span className="text-[10px] font-semibold text-slate-400">
                        Step {currentStep} of 4
                      </span>

                    </div>


                    <div className="relative">

                      {[
                        "Agreement ready",
                        "First signature",
                        "Both parties signed",
                        "Fully executed",
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
                              className="relative flex items-center pb-4 last:pb-0"
                            >

                              {index <
                                3 && (

                                <div
                                  className={
                                    `absolute left-[13px] top-7 h-[calc(100%-20px)] w-px ${
                                      completed
                                        ? "bg-emerald-300"
                                        : "bg-slate-200"
                                    }`
                                  }
                                />

                              )}


                              <div
                                className={
                                  `relative z-10 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full border-2 text-[10px] font-bold ${
                                    completed
                                      ? "border-emerald-500 bg-emerald-500 text-white"
                                      : active
                                      ? "border-blue-600 bg-blue-50 text-blue-600"
                                      : "border-slate-200 bg-white text-slate-400"
                                  }`
                                }
                              >

                                {completed ? (

                                  <CheckIcon className="w-3.5 h-3.5" />

                                ) : (

                                  stepNumber

                                )}

                              </div>


                              <div
                                className={
                                  `ml-3 text-xs font-semibold ${
                                    active
                                      ? "text-slate-900"
                                      : completed
                                      ? "text-slate-700"
                                      : "text-slate-400"
                                  }`
                                }
                              >
                                {step}
                              </div>

                            </div>

                          );
                        }
                      )}

                    </div>

                  </section>


                  {/* ===========================================
                      SIGNATURE CARDS
                  =========================================== */}

                  <section className="mt-7">

                    <h2 className="mb-3 text-[10px] font-bold uppercase tracking-[0.13em] text-slate-400">
                      Parties
                    </h2>


                    <div className="grid grid-cols-2 gap-3">

                      {/* VENDOR */}

                      <div
                        className={
                          `rounded-xl border p-3.5 ${
                            hasVendorSigned
                              ? "border-emerald-200 bg-emerald-50/70"
                              : "border-slate-200 bg-slate-50"
                          }`
                        }
                      >

                        <div className="flex items-center justify-between">

                          <span className="text-[9px] font-bold uppercase tracking-[0.12em] text-slate-500">
                            Vendor
                          </span>


                          <div
                            className={
                              `flex h-5 w-5 items-center justify-center rounded-full ${
                                hasVendorSigned
                                  ? "bg-emerald-500 text-white"
                                  : "bg-slate-200 text-slate-400"
                              }`
                            }
                          >

                            {hasVendorSigned ? (
                              <CheckIcon className="w-3 h-3" />
                            ) : (
                              <LockIcon className="w-2.5 h-2.5" />
                            )}

                          </div>

                        </div>


                        <div
                          className={
                            `mt-2 text-xs font-bold ${
                              hasVendorSigned
                                ? "text-emerald-700"
                                : "text-slate-600"
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
                          .vendorSignedDate && (

                          <div className="mt-1 text-[9px] leading-4 text-slate-400">

                            {
                              formatDate(
                                documentData
                                  .vendorSignedDate,
                                true
                              )
                            }

                          </div>

                        )}

                      </div>


                      {/* TAPROOT */}

                      <div
                        className={
                          `rounded-xl border p-3.5 ${
                            hasTaprootSigned
                              ? "border-emerald-200 bg-emerald-50/70"
                              : "border-slate-200 bg-slate-50"
                          }`
                        }
                      >

                        <div className="flex items-center justify-between">

                          <span className="text-[9px] font-bold uppercase tracking-[0.12em] text-slate-500">
                            Taproot
                          </span>


                          <div
                            className={
                              `flex h-5 w-5 items-center justify-center rounded-full ${
                                hasTaprootSigned
                                  ? "bg-emerald-500 text-white"
                                  : "bg-slate-200 text-slate-400"
                              }`
                            }
                          >

                            {hasTaprootSigned ? (
                              <CheckIcon className="w-3 h-3" />
                            ) : (
                              <LockIcon className="w-2.5 h-2.5" />
                            )}

                          </div>

                        </div>


                        <div
                          className={
                            `mt-2 text-xs font-bold ${
                              hasTaprootSigned
                                ? "text-emerald-700"
                                : "text-slate-600"
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
                          .taprootDirectorSignedDate && (

                          <div className="mt-1 text-[9px] leading-4 text-slate-400">

                            {
                              formatDate(
                                documentData
                                  .taprootDirectorSignedDate,
                                true
                              )
                            }

                          </div>

                        )}

                      </div>

                    </div>

                  </section>


                  {/* ===========================================
                      CONTRACT SUMMARY
                  =========================================== */}

                  <section className="mt-7">

                    <div className="mb-2 flex items-center justify-between border-b border-slate-100 pb-3">

                      <h2 className="text-[10px] font-bold uppercase tracking-[0.13em] text-slate-400">
                        Contract Summary
                      </h2>


                      <StatusBadge
                        status={
                          documentData
                            .status
                        }
                      />

                    </div>


                    <DetailItem
                      label="Contract Number"
                      value={
                        documentData
                          .contractNumber
                      }
                    />


                    <DetailItem
                      label="Vendor Company"
                      value={
                        documentData
                          .vendorName
                      }
                    />


                    <DetailItem
                      label="Vendor Authorized Signer"
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
                      label="Job Title"
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
                      label="Client Location"
                      value={
                        documentData
                          .clientLocation
                      }
                    />


                    <DetailItem
                      label="Tentative Start Date"
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
                        paymentTerms
                      }
                    />

                  </section>

                </div>


                {/* =============================================
                    SIGNING ACTION
                ============================================= */}

                <div className="flex-shrink-0 border-t border-slate-200 bg-white p-6 shadow-[0_-10px_25px_rgba(15,23,42,0.03)]">


                  {/* ===========================================
                      FULLY SIGNED
                  =========================================== */}

                  {isFullySigned ? (

                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-center">

                      <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500 text-white">

                        <CheckIcon className="w-5 h-5" />

                      </div>


                      <div className="mt-2 text-sm font-bold text-emerald-800">
                        Agreement Fully Executed
                      </div>


                      <p className="mt-1 text-[11px] leading-5 text-emerald-700">
                        All required signatures have been completed.
                      </p>

                    </div>

                  ) : (

                    <>


                      {/* =======================================
                          VENDOR
                      ======================================= */}

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

                          className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 px-5 py-3.5 text-sm font-bold text-white shadow-[0_5px_16px_rgba(37,99,235,0.2)] transition hover:-translate-y-[1px] hover:from-blue-700 hover:to-blue-800 hover:shadow-[0_7px_20px_rgba(37,99,235,0.26)] disabled:translate-y-0 disabled:cursor-not-allowed disabled:from-blue-400 disabled:to-blue-400 disabled:shadow-none"
                        >

                          {signing ? (

                            <>
                              <Spinner size="5" />
                              Completing Signature...
                            </>

                          ) : (

                            <>
                              <CheckIcon className="w-4 h-4" />
                              Review & Sign Agreement
                            </>

                          )}

                        </button>

                      )}


                      {!isInternalSigner &&
                      hasVendorSigned && (

                        <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3.5 text-center">

                          <div className="text-xs font-bold text-blue-800">
                            Your signature is complete
                          </div>


                          <p className="mt-1 text-[10px] leading-4 text-blue-600">
                            The agreement is awaiting Taproot's authorized signature.
                          </p>

                        </div>

                      )}


                      {/* =======================================
                          TAPROOT
                      ======================================= */}

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

                          className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-3.5 text-sm font-bold text-white shadow-[0_5px_16px_rgba(37,99,235,0.2)] transition hover:-translate-y-[1px] hover:from-blue-700 hover:to-indigo-700 hover:shadow-[0_7px_20px_rgba(37,99,235,0.26)] disabled:translate-y-0 disabled:cursor-not-allowed disabled:from-blue-400 disabled:to-blue-400 disabled:shadow-none"
                        >

                          {signing ? (

                            <>
                              <Spinner size="5" />
                              Applying Signature...
                            </>

                          ) : (

                            <>
                              <CheckIcon className="w-4 h-4" />
                              Approve & Sign Agreement
                            </>

                          )}

                        </button>

                      )}


                      {isInternalSigner &&
                      hasTaprootSigned && (

                        <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3.5 text-center">

                          <div className="text-xs font-bold text-blue-800">
                            Taproot signature completed
                          </div>


                          <p className="mt-1 text-[10px] leading-4 text-blue-600">
                            The agreement is awaiting the Vendor's authorized signature.
                          </p>

                        </div>

                      )}

                    </>

                  )}


                  <div className="mt-4 flex items-center justify-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.14em] text-slate-400">

                    <LockIcon className="w-3 h-3" />

                    Secure electronic signing session

                  </div>

                </div>

              </aside>

            </>

          ) : (

            !isAccessModalOpen && (

              <div className="flex h-full w-full items-center justify-center bg-slate-50 p-6">

                <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">

                  <DocumentIcon className="mx-auto h-12 w-12 text-slate-300" />


                  <h2 className="mt-4 text-lg font-bold text-slate-900">
                    Agreement unavailable
                  </h2>


                  <p className="mt-2 text-sm leading-6 text-slate-500">
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

                      className="mt-6 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700"
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
            VENDOR ACCESS MODAL
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
            SIGNATURE MODAL
        ==================================================== */}

        <SignatureModal
          isOpen={
            isSigningModalOpen
          }

          onClose={() => {

            if (
              signing
            ) {
              return;
            }


            setIsSigningModalOpen(
              false
            );

          }}

          onSign={
            handleSign
          }

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
            documentUrl
          }
        />

      </div>
    );
  };

export default MSAandWOSigningPage;