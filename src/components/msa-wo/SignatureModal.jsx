// src/components/msa-wo/SignatureModal.jsx

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import SignatureCanvas from "react-signature-canvas";

import Modal from "../Modal";
import Spinner from "../Spinner";


/* ============================================================
   CONSTANTS
============================================================ */

const MAX_UPLOAD_SIZE =
  5 * 1024 * 1024;

const ALLOWED_UPLOAD_TYPES = [
  "image/png",
  "image/jpeg",
  "image/jpg",
];


/* ============================================================
   ICONS
============================================================ */

const CloseIcon = ({
  className = "w-5 h-5",
}) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M6 18L18 6M6 6l12 12"
    />
  </svg>
);


const TypeIcon = () => (
  <svg
    className="w-4 h-4"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M5 4h14M9 4v16m6-16v16M7 20h10"
    />
  </svg>
);


const DrawIcon = () => (
  <svg
    className="w-4 h-4"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M15.232 5.232l3.536 3.536M9 15l-4 1 1-4L16.5 1.5a2.121 2.121 0 013 3L9 15z"
    />
  </svg>
);


const UploadIcon = ({
  className = "w-5 h-5",
}) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M12 4v11m0-11l-4 4m4-4l4 4"
    />
  </svg>
);


const LockIcon = ({
  className = "w-4 h-4",
}) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <rect
      x="5"
      y="11"
      width="14"
      height="10"
      rx="2"
      ry="2"
      strokeWidth="2"
    />

    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M8 11V7a4 4 0 018 0v4"
    />
  </svg>
);


const EyeIcon = ({
  className = "w-4 h-4",
}) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7C7.523 19 3.732 16.057 2.458 12z"
    />

    <circle
      cx="12"
      cy="12"
      r="3"
      strokeWidth="2"
    />
  </svg>
);


const EyeOffIcon = ({
  className = "w-4 h-4",
}) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M3 3l18 18M10.58 10.58A2 2 0 0012 14a2 2 0 001.42-.58M9.88 4.24A9.8 9.8 0 0112 4c5 0 9 8 9 8a17.8 17.8 0 01-2.15 3.18M6.61 6.61C4.3 8.2 3 12 3 12s4 8 9 8a9.8 9.8 0 004.39-1.03"
    />
  </svg>
);


const CheckIcon = ({
  className = "w-4 h-4",
}) => (
  <svg
    className={className}
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


const ShieldIcon = ({
  className = "w-4 h-4",
}) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M12 3l7 4v5c0 5-3 8-7 9-4-1-7-4-7-9V7l7-4z"
    />

    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M9 12l2 2 4-4"
    />
  </svg>
);


const DocumentIcon = ({
  className = "w-4 h-4",
}) => (
  <svg
    className={className}
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


const UserIcon = ({
  className = "w-4 h-4",
}) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M20 21a8 8 0 10-16 0"
    />

    <circle
      cx="12"
      cy="7"
      r="4"
      strokeWidth="2"
    />
  </svg>
);


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


/* ============================================================
   COMPONENT
============================================================ */

const SignatureModal = ({
  isOpen,
  onClose,
  onSign,
  signerType,
  signerInfo,
  requiresPassword = false,
  documentUrl,
}) => {

  /* ==========================================================
     NORMALIZED TYPE
  ========================================================== */

  const normalizedSignerType =
    useMemo(
      () =>
        normalizeSignerType(
          signerType
        ),
      [
        signerType,
      ]
    );


  /* ==========================================================
     STATE
  ========================================================== */

  const [
    activeTab,
    setActiveTab,
  ] =
    useState(
      "type"
    );


  const [
    typedSignature,
    setTypedSignature,
  ] =
    useState(
      ""
    );


  const [
    selectedFont,
    setSelectedFont,
  ] =
    useState(
      "font-dancing-script"
    );


  const [
    password,
    setPassword,
  ] =
    useState(
      ""
    );


  const [
    showPassword,
    setShowPassword,
  ] =
    useState(
      false
    );


  const [
    uploadedSignature,
    setUploadedSignature,
  ] =
    useState(
      ""
    );


  const [
    uploadedFileName,
    setUploadedFileName,
  ] =
    useState(
      ""
    );


  const [
    consentAccepted,
    setConsentAccepted,
  ] =
    useState(
      false
    );


  const [
    loading,
    setLoading,
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


  /* ==========================================================
     REFS
  ========================================================== */

  const signaturePad =
    useRef(
      null
    );


  const fileInputRef =
    useRef(
      null
    );


  const typeCanvasRef =
    useRef(
      null
    );


  /* ==========================================================
     FONT OPTIONS
  ========================================================== */

  const fonts = [
    {
      id:
        "font-dancing-script",

      className:
        "font-dancing-script",

      label:
        "Dancing",
    },

    {
      id:
        "font-great-vibes",

      className:
        "font-great-vibes",

      label:
        "Elegant",
    },

    {
      id:
        "font-pacifico",

      className:
        "font-pacifico",

      label:
        "Modern",
    },

    {
      id:
        "font-sacramento",

      className:
        "font-sacramento",

      label:
        "Classic",
    },
  ];


  /* ==========================================================
     SIGNER LABELS
  ========================================================== */

  const signerRoleLabel =
    normalizedSignerType ===
    "taproot"
      ? "Taproot Authorized Signer"
      : "Vendor Authorized Signer";


  const signerBadgeLabel =
    normalizedSignerType ===
    "taproot"
      ? "Internal Signature"
      : "Vendor Signature";


  /* ==========================================================
     RESET
  ========================================================== */

  useEffect(
    () => {
      if (
        !isOpen
      ) {
        return;
      }


      setTypedSignature(
        signerInfo?.name ||
        ""
      );


      setSelectedFont(
        "font-dancing-script"
      );


      setPassword(
        ""
      );


      setShowPassword(
        false
      );


      setUploadedSignature(
        ""
      );


      setUploadedFileName(
        ""
      );


      setConsentAccepted(
        false
      );


      setLoading(
        false
      );


      setError(
        ""
      );


      setActiveTab(
        "type"
      );


      if (
        fileInputRef.current
      ) {
        fileInputRef.current.value =
          "";
      }


      window.setTimeout(
        () => {
          signaturePad.current?.clear();
        },
        0
      );
    },
    [
      isOpen,
      signerInfo,
    ]
  );


  /* ==========================================================
     TYPED SIGNATURE CANVAS
  ========================================================== */

  const drawSignatureOnCanvas =
    useCallback(
      () => {
        const canvas =
          typeCanvasRef.current;


        if (
          !canvas
        ) {
          return;
        }


        const ctx =
          canvas.getContext(
            "2d"
          );


        if (
          !ctx
        ) {
          return;
        }


        let fontStyle =
          'italic 46px "Dancing Script", cursive';


        if (
          selectedFont ===
          "font-great-vibes"
        ) {
          fontStyle =
            '48px "Great Vibes", cursive';
        }


        else if (
          selectedFont ===
          "font-pacifico"
        ) {
          fontStyle =
            '38px "Pacifico", cursive';
        }


        else if (
          selectedFont ===
          "font-sacramento"
        ) {
          fontStyle =
            '48px "Sacramento", cursive';
        }


        const text =
          typedSignature
            .trim();


        ctx.font =
          fontStyle;


        const textWidth =
          ctx.measureText(
            text
          ).width;


        const width =
          Math.max(
            520,

            Math.ceil(
              textWidth +
              120
            )
          );


        const height =
          120;


        if (
          canvas.width !==
            width ||
          canvas.height !==
            height
        ) {
          canvas.width =
            width;

          canvas.height =
            height;
        }


        ctx.clearRect(
          0,
          0,
          canvas.width,
          canvas.height
        );


        ctx.font =
          fontStyle;


        ctx.fillStyle =
          "#0f172a";


        ctx.textBaseline =
          "middle";


        ctx.textAlign =
          "left";


        ctx.fillText(
          text,
          50,
          canvas.height /
            2
        );
      },
      [
        typedSignature,
        selectedFont,
      ]
    );


  useEffect(
    () => {
      if (
        !isOpen ||
        activeTab !==
          "type"
      ) {
        return undefined;
      }


      let cancelled =
        false;


      const render =
        async () => {
          try {
            if (
              document.fonts
                ?.ready
            ) {
              await document
                .fonts
                .ready;
            }
          } catch {
            // ignore font readiness error
          }


          if (
            !cancelled
          ) {
            drawSignatureOnCanvas();
          }
        };


      const timeout =
        window.setTimeout(
          render,
          60
        );


      return () => {
        cancelled =
          true;

        window.clearTimeout(
          timeout
        );
      };
    },
    [
      isOpen,
      activeTab,
      typedSignature,
      selectedFont,
      drawSignatureOnCanvas,
    ]
  );


  /* ==========================================================
     DRAW
  ========================================================== */

  const clearCanvas =
    () => {
      signaturePad
        .current
        ?.clear();


      setError(
        ""
      );
    };


  /* ==========================================================
     UPLOAD
  ========================================================== */

  const handleFileChange =
    (
      event
    ) => {
      const file =
        event.target
          .files?.[0];


      if (
        !file
      ) {
        return;
      }


      if (
        !ALLOWED_UPLOAD_TYPES.includes(
          file.type
        )
      ) {
        setError(
          "Please upload a PNG or JPG signature image."
        );

        event.target.value =
          "";

        return;
      }


      if (
        file.size >
        MAX_UPLOAD_SIZE
      ) {
        setError(
          "The signature image must be 5 MB or smaller."
        );

        event.target.value =
          "";

        return;
      }


      const reader =
        new FileReader();


      reader.onload =
        (
          loadEvent
        ) => {
          const value =
            loadEvent.target
              ?.result;


          if (
            typeof value !==
            "string"
          ) {
            setError(
              "Unable to read the selected signature image."
            );

            return;
          }


          setUploadedSignature(
            value
          );


          setUploadedFileName(
            file.name
          );


          setError(
            ""
          );
        };


      reader.onerror =
        () => {
          setError(
            "Unable to read the selected signature image."
          );
        };


      reader.readAsDataURL(
        file
      );
    };


  /* ==========================================================
     BUILD SIGNATURE IMAGE
  ========================================================== */

  const getSignatureImage =
    () => {

      /* ------------------------------------------------------
         TYPE
      ------------------------------------------------------ */

      if (
        activeTab ===
        "type"
      ) {
        if (
          !typedSignature
            .trim()
        ) {
          throw new Error(
            "Enter your name to create a signature."
          );
        }


        drawSignatureOnCanvas();


        const canvas =
          typeCanvasRef
            .current;


        if (
          !canvas
        ) {
          throw new Error(
            "Unable to generate the typed signature."
          );
        }


        return canvas.toDataURL(
          "image/png"
        );
      }


      /* ------------------------------------------------------
         DRAW
      ------------------------------------------------------ */

      if (
        activeTab ===
        "draw"
      ) {
        if (
          !signaturePad
            .current
        ) {
          throw new Error(
            "Signature canvas is unavailable."
          );
        }


        if (
          signaturePad
            .current
            .isEmpty()
        ) {
          throw new Error(
            "Draw your signature before continuing."
          );
        }


        return signaturePad
          .current
          .getTrimmedCanvas()
          .toDataURL(
            "image/png"
          );
      }


      /* ------------------------------------------------------
         UPLOAD
      ------------------------------------------------------ */

      if (
        activeTab ===
        "upload"
      ) {
        if (
          !uploadedSignature
        ) {
          throw new Error(
            "Upload a signature image before continuing."
          );
        }


        return uploadedSignature;
      }


      throw new Error(
        "Select a signature method."
      );
    };


  /* ==========================================================
     SUBMIT
  ========================================================== */

  const handleSave =
    async () => {

      if (
        loading
      ) {
        return;
      }


      setError(
        ""
      );


      /* ------------------------------------------------------
         VALIDATE SIGNER TYPE
      ------------------------------------------------------ */

      if (
        ![
          "vendor",
          "taproot",
        ].includes(
          normalizedSignerType
        )
      ) {
        setError(
          "The signing role is invalid. Please reopen the signing window."
        );

        return;
      }


      /* ------------------------------------------------------
         INTERNAL PASSWORD
      ------------------------------------------------------ */

      if (
        requiresPassword &&
        !password.trim()
      ) {
        setError(
          "Enter your VMS password to authorize this signature."
        );

        return;
      }


      /* ------------------------------------------------------
         CONSENT
      ------------------------------------------------------ */

      if (
        !consentAccepted
      ) {
        setError(
          "Please confirm that you agree to use this electronic signature."
        );

        return;
      }


      setLoading(
        true
      );


      try {
        const signatureImage =
          getSignatureImage();


        const finalSignerData = {
          signatureImage,

          name:
            signerInfo
              ?.name ||
            typedSignature
              .trim() ||
            "",

          title:
            signerInfo
              ?.title ||
            "",

          ...(requiresPassword
            ? {
                password,
              }
            : {}),
        };


        console.log(
          "[SignatureModal] Confirming signature:",
          {
            signerType:
              normalizedSignerType,

            signatureMethod:
              activeTab,

            signerName:
              finalSignerData
                .name,

            signerTitle:
              finalSignerData
                .title,

            hasSignature:
              Boolean(
                signatureImage
              ),

            requiresPassword,

            hasPassword:
              Boolean(
                finalSignerData
                  .password
              ),
          }
        );


        /*
         * Critical:
         *
         * Second argument is ALWAYS a string:
         *
         * "vendor"
         * or
         * "taproot"
         */
        await onSign(
          finalSignerData,
          normalizedSignerType
        );


      } catch (
        err
      ) {
        console.error(
          "[SignatureModal] Signature failed:",
          err
        );


        setError(
          err.response
            ?.data
            ?.message ||
          err.message ||
          "Unable to complete the signature."
        );


      } finally {
        setLoading(
          false
        );
      }
    };


  /* ==========================================================
     TAB COMPONENT
  ========================================================== */

  const TabButton = ({
    id,
    icon,
    label,
  }) => {
    const selected =
      activeTab ===
      id;


    return (
      <button
        type="button"

        disabled={
          loading
        }

        onClick={() => {
          setActiveTab(
            id
          );

          setError(
            ""
          );
        }}

        className={
          `group relative flex flex-1 items-center justify-center gap-2 px-3 py-3 text-sm font-semibold transition-all ${
            selected
              ? "text-blue-600"
              : "text-slate-500 hover:text-slate-800"
          }`
        }
      >

        <span
          className={
            `transition-colors ${
              selected
                ? "text-blue-600"
                : "text-slate-400 group-hover:text-slate-600"
            }`
          }
        >
          {icon}
        </span>


        <span>
          {label}
        </span>


        <span
          className={
            `absolute bottom-0 left-3 right-3 h-0.5 rounded-full transition-all ${
              selected
                ? "bg-blue-600 opacity-100"
                : "bg-transparent opacity-0"
            }`
          }
        />

      </button>
    );
  };


  /* ==========================================================
     HIDDEN
  ========================================================== */

  if (
    !isOpen
  ) {
    return null;
  }


  /* ==========================================================
     RENDER
  ========================================================== */

  return (

    <Modal
      isOpen={
        isOpen
      }

      onClose={() => {
        if (
          !loading
        ) {
          onClose?.();
        }
      }}

      title=""

      size="6xl"
    >

      <div className="-m-6 flex h-[82vh] min-h-[650px] overflow-hidden rounded-xl bg-white">


        {/* ====================================================
            LEFT SIDE - DOCUMENT
        ==================================================== */}

        <section className="relative hidden w-[54%] flex-col overflow-hidden bg-[#202326] lg:flex">


          {/* ==================================================
              VIEWER HEADER
          ================================================== */}

          <div className="flex h-[58px] flex-shrink-0 items-center justify-between border-b border-white/10 bg-[#272a2e] px-5">

            <div className="flex items-center gap-3">

              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 text-slate-300 ring-1 ring-white/10">

                <DocumentIcon className="w-4 h-4" />

              </div>


              <div>

                <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-300">
                  Document Preview
                </div>


                <div className="mt-0.5 text-[11px] text-slate-500">
                  Review before signing
                </div>

              </div>

            </div>


            <div className="flex items-center gap-2 rounded-full bg-white/5 px-3 py-1.5 ring-1 ring-white/10">

              <ShieldIcon className="w-3.5 h-3.5 text-emerald-400" />


              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-300">
                Secure
              </span>

            </div>

          </div>


          {/* ==================================================
              PDF
          ================================================== */}

          <div className="min-h-0 flex-1 bg-[#303336] p-6">

            {documentUrl ? (

              <div className="h-full w-full overflow-hidden rounded-md bg-white shadow-[0_20px_60px_rgba(0,0,0,0.45)] ring-1 ring-black/10">

                <iframe
                  src={
                    documentUrl
                  }

                  title="Contract Preview"

                  className="h-full w-full border-0 bg-white"
                />

              </div>

            ) : (

              <div className="flex h-full items-center justify-center">

                <div className="max-w-sm text-center">

                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5 text-slate-400 ring-1 ring-white/10">

                    <DocumentIcon className="w-7 h-7" />

                  </div>


                  <h3 className="mt-5 font-semibold text-slate-200">
                    Preview unavailable
                  </h3>


                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    The agreement loaded, but the secure PDF preview is unavailable.
                  </p>

                </div>

              </div>

            )}

          </div>


          {/* ==================================================
              VIEWER FOOTER
          ================================================== */}

          <div className="flex h-11 flex-shrink-0 items-center justify-center gap-2 border-t border-white/10 bg-[#272a2e] text-[10px] uppercase tracking-wider text-slate-500">

            <LockIcon className="w-3.5 h-3.5" />

            Protected document session

          </div>

        </section>


        {/* ====================================================
            RIGHT SIDE
        ==================================================== */}

        <section className="flex min-w-0 flex-1 flex-col bg-white">


          {/* ==================================================
              HEADER
          ================================================== */}

          <div className="flex-shrink-0 border-b border-slate-200 bg-white px-7 py-5 lg:px-8">

            <div className="flex items-start justify-between gap-4">

              <div>

                <div className="flex items-center gap-2">

                  <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-blue-700 ring-1 ring-blue-100">

                    <ShieldIcon className="w-3 h-3" />

                    {signerBadgeLabel}

                  </span>

                </div>


                <h2 className="mt-3 text-[26px] font-bold tracking-tight text-slate-950">
                  Adopt Your Signature
                </h2>


                <p className="mt-1 text-sm leading-6 text-slate-500">
                  Choose how your signature should appear on the agreement.
                </p>

              </div>


              <button
                type="button"

                disabled={
                  loading
                }

                onClick={() =>
                  onClose?.()
                }

                className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"

                aria-label="Close signature window"
              >

                <CloseIcon />

              </button>

            </div>


            {/* =================================================
                SIGNER IDENTITY
            ================================================= */}

            <div className="mt-5 flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">

              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-white text-blue-600 shadow-sm ring-1 ring-slate-200">

                <UserIcon className="w-5 h-5" />

              </div>


              <div className="min-w-0">

                <div className="truncate text-sm font-bold text-slate-900">

                  {
                    signerInfo
                      ?.name ||
                    "Authorized Signer"
                  }

                </div>


                <div className="mt-0.5 truncate text-xs text-slate-500">

                  {
                    signerInfo
                      ?.title ||
                    signerRoleLabel
                  }

                </div>

              </div>


              <div className="ml-auto flex-shrink-0">

                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-semibold text-emerald-700">

                  <CheckIcon className="w-3 h-3" />

                  Identity loaded

                </span>

              </div>

            </div>

          </div>


          {/* ==================================================
              ERROR
          ================================================== */}

          {error && (

            <div className="mx-7 mt-4 flex flex-shrink-0 items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 lg:mx-8">

              <div className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">

                <span className="text-xs font-bold">
                  !
                </span>

              </div>


              <div>

                <div className="text-sm font-semibold text-red-800">
                  Unable to continue
                </div>


                <div className="mt-0.5 text-xs leading-5 text-red-700">
                  {error}
                </div>

              </div>

            </div>

          )}


          {/* ==================================================
              SIGNATURE METHODS
          ================================================== */}

          <div className="flex-shrink-0 border-b border-slate-200 px-7 pt-3 lg:px-8">

            <div className="flex">

              <TabButton
                id="type"
                label="Type"
                icon={
                  <TypeIcon />
                }
              />


              <TabButton
                id="draw"
                label="Draw"
                icon={
                  <DrawIcon />
                }
              />


              <TabButton
                id="upload"
                label="Upload"
                icon={
                  <UploadIcon className="w-4 h-4" />
                }
              />

            </div>

          </div>


          {/* ==================================================
              CONTENT
          ================================================== */}

          <div className="min-h-0 flex-1 overflow-y-auto px-7 py-6 lg:px-8">


            {/* =================================================
                TYPE
            ================================================= */}

            {activeTab ===
              "type" && (

              <div>


                <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-b from-slate-50 to-white px-5 py-8 shadow-sm">

                  <div className="absolute left-8 right-8 top-[68%] border-b border-blue-200" />


                  <input
                    type="text"

                    value={
                      typedSignature
                    }

                    disabled={
                      loading
                    }

                    onChange={(
                      event
                    ) => {
                      setTypedSignature(
                        event.target.value
                      );

                      setError(
                        ""
                      );
                    }}

                    placeholder="Your full name"

                    className={
                      `relative z-10 w-full bg-transparent text-center text-[44px] leading-tight text-slate-900 outline-none placeholder:text-slate-300 ${selectedFont}`
                    }
                  />


                  <div className="mt-5 text-center text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                    Signature Preview
                  </div>

                </div>


                <div className="mt-7">

                  <div className="mb-3 flex items-center justify-between">

                    <div>

                      <div className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
                        Signature Style
                      </div>


                      <div className="mt-1 text-xs text-slate-400">
                        Select the style you want to adopt.
                      </div>

                    </div>

                  </div>


                  <div className="grid grid-cols-2 gap-3">

                    {fonts.map(
                      (
                        font
                      ) => {

                        const selected =
                          selectedFont ===
                          font.className;


                        return (

                          <button
                            key={
                              font.id
                            }

                            type="button"

                            disabled={
                              loading
                            }

                            onClick={() => {
                              setSelectedFont(
                                font.className
                              );

                              setError(
                                ""
                              );
                            }}

                            className={
                              `relative min-h-[82px] overflow-hidden rounded-xl border px-3 py-3 text-center transition-all ${
                                selected
                                  ? "border-blue-500 bg-blue-50/50 shadow-sm ring-1 ring-blue-500"
                                  : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                              }`
                            }
                          >

                            {selected && (

                              <div className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-white">

                                <CheckIcon className="w-3 h-3" />

                              </div>

                            )}


                            <div
                              className={
                                `truncate text-[24px] text-slate-800 ${font.className}`
                              }
                            >

                              {
                                typedSignature ||
                                signerInfo?.name ||
                                "Signature"
                              }

                            </div>


                            <div className="mt-2 text-[9px] font-bold uppercase tracking-wider text-slate-400">
                              {font.label}
                            </div>

                          </button>

                        );
                      }
                    )}

                  </div>

                </div>

              </div>

            )}


            {/* =================================================
                DRAW
            ================================================= */}

            {activeTab ===
              "draw" && (

              <div>

                <div className="mb-3 flex items-start justify-between">

                  <div>

                    <div className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
                      Draw Signature
                    </div>


                    <p className="mt-1 text-xs text-slate-400">
                      Use your mouse, trackpad, or touchscreen.
                    </p>

                  </div>


                  <button
                    type="button"

                    disabled={
                      loading
                    }

                    onClick={
                      clearCanvas
                    }

                    className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-500 shadow-sm transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                  >
                    Clear
                  </button>

                </div>


                <div className="relative h-[270px] overflow-hidden rounded-2xl border border-slate-200 bg-[#fbfcfd] shadow-inner">

                  <div
                    className="pointer-events-none absolute inset-0 opacity-40"
                    style={{
                      backgroundImage:
                        "radial-gradient(#cbd5e1 1px, transparent 1px)",

                      backgroundSize:
                        "20px 20px",
                    }}
                  />


                  <div className="pointer-events-none absolute bottom-14 left-8 right-8 border-b border-blue-200" />


                  <div className="pointer-events-none absolute bottom-8 left-8 text-[9px] font-bold uppercase tracking-wider text-slate-300">
                    Sign above the line
                  </div>


                  <SignatureCanvas
                    ref={
                      signaturePad
                    }

                    penColor="#0f172a"

                    canvasProps={{
                      className:
                        "relative z-10 h-full w-full cursor-crosshair",
                    }}
                  />

                </div>

              </div>

            )}


            {/* =================================================
                UPLOAD
            ================================================= */}

            {activeTab ===
              "upload" && (

              <div>

                <div className="mb-3">

                  <div className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
                    Upload Signature
                  </div>


                  <p className="mt-1 text-xs text-slate-400">
                    Upload a clean PNG or JPG of your signature.
                  </p>

                </div>


                <input
                  ref={
                    fileInputRef
                  }

                  type="file"

                  className="hidden"

                  accept="image/png,image/jpeg"

                  onChange={
                    handleFileChange
                  }
                />


                {!uploadedSignature ? (

                  <button
                    type="button"

                    disabled={
                      loading
                    }

                    onClick={() =>
                      fileInputRef
                        .current
                        ?.click()
                    }

                    className="group flex h-[270px] w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50/70 px-6 text-center transition hover:border-blue-400 hover:bg-blue-50/50"
                  >

                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-blue-600 shadow-sm ring-1 ring-slate-200 transition group-hover:scale-105">

                      <UploadIcon className="w-6 h-6" />

                    </div>


                    <div className="mt-4 text-sm font-bold text-slate-800">
                      Upload your signature
                    </div>


                    <div className="mt-1 text-xs text-slate-500">
                      PNG or JPG • Maximum 5 MB
                    </div>


                    <div className="mt-4 rounded-lg bg-white px-4 py-2 text-xs font-semibold text-blue-600 shadow-sm ring-1 ring-slate-200">
                      Browse files
                    </div>

                  </button>

                ) : (

                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">

                    <div className="flex min-h-[190px] items-center justify-center rounded-xl border border-slate-200 bg-white p-6 shadow-inner">

                      <img
                        src={
                          uploadedSignature
                        }

                        alt="Uploaded signature preview"

                        className="max-h-[140px] max-w-full object-contain"
                      />

                    </div>


                    <div className="mt-4 flex items-center justify-between gap-3">

                      <div className="min-w-0">

                        <div className="truncate text-sm font-semibold text-slate-700">
                          {
                            uploadedFileName
                          }
                        </div>


                        <div className="mt-0.5 text-xs text-slate-400">
                          Ready to use
                        </div>

                      </div>


                      <button
                        type="button"

                        disabled={
                          loading
                        }

                        onClick={() =>
                          fileInputRef
                            .current
                            ?.click()
                        }

                        className="flex-shrink-0 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-blue-600 shadow-sm hover:bg-blue-50"
                      >
                        Replace
                      </button>

                    </div>

                  </div>

                )}

              </div>

            )}


            {/* =================================================
                INTERNAL VERIFICATION
            ================================================= */}

            {requiresPassword && (

              <div className="mt-7 rounded-2xl border border-slate-200 bg-slate-50 p-4">

                <div className="flex items-start gap-3">

                  <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-white text-slate-500 shadow-sm ring-1 ring-slate-200">

                    <LockIcon className="w-4 h-4" />

                  </div>


                  <div className="min-w-0 flex-1">

                    <label className="block text-xs font-bold uppercase tracking-[0.12em] text-slate-600">
                      Internal Verification
                    </label>


                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      Confirm your identity using your VMS account password.
                    </p>


                    <div className="relative mt-3">

                      <input
                        type={
                          showPassword
                            ? "text"
                            : "password"
                        }

                        value={
                          password
                        }

                        disabled={
                          loading
                        }

                        onChange={(
                          event
                        ) => {
                          setPassword(
                            event.target.value
                          );

                          setError(
                            ""
                          );
                        }}

                        autoComplete="current-password"

                        placeholder="Enter your VMS password"

                        className="block w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-3 pr-11 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      />


                      <button
                        type="button"

                        onClick={() =>
                          setShowPassword(
                            (
                              value
                            ) =>
                              !value
                          )
                        }

                        className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-slate-400 hover:text-slate-700"

                        aria-label={
                          showPassword
                            ? "Hide password"
                            : "Show password"
                        }
                      >

                        {showPassword ? (
                          <EyeOffIcon />
                        ) : (
                          <EyeIcon />
                        )}

                      </button>

                    </div>

                  </div>

                </div>

              </div>

            )}


            {/* =================================================
                CONSENT
            ================================================= */}

            <label className="mt-6 flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 transition hover:bg-slate-50">

              <input
                type="checkbox"

                checked={
                  consentAccepted
                }

                disabled={
                  loading
                }

                onChange={(
                  event
                ) => {
                  setConsentAccepted(
                    event.target.checked
                  );

                  setError(
                    ""
                  );
                }}

                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />


              <div>

                <div className="text-sm font-semibold text-slate-700">
                  I agree to use this electronic signature
                </div>


                <div className="mt-1 text-xs leading-5 text-slate-500">
                  By selecting Confirm & Sign, I intend to electronically sign this document using the signature shown above.
                </div>

              </div>

            </label>


            {/* Hidden typed signature renderer */}
            <canvas
              ref={
                typeCanvasRef
              }

              width="520"

              height="120"

              className="hidden"
            />

          </div>


          {/* ==================================================
              ACTION FOOTER
          ================================================== */}

          <div className="flex-shrink-0 border-t border-slate-200 bg-white px-7 py-5 shadow-[0_-8px_24px_rgba(15,23,42,0.03)] lg:px-8">

            <div className="mb-4 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">

              <ShieldIcon className="w-3.5 h-3.5 text-emerald-500" />

              Secure electronic signing session

            </div>


            <div className="flex items-center justify-between gap-3">

              <button
                type="button"

                disabled={
                  loading
                }

                onClick={() =>
                  onClose?.()
                }

                className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>


              <button
                type="button"

                disabled={
                  loading
                }

                onClick={
                  handleSave
                }

                className="flex min-w-[170px] items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-blue-400"
              >

                {loading ? (

                  <>
                    <Spinner size="4" />

                    <span>
                      Signing...
                    </span>
                  </>

                ) : (

                  <>
                    <CheckIcon className="w-4 h-4" />

                    <span>
                      Confirm & Sign
                    </span>
                  </>

                )}

              </button>

            </div>

          </div>

        </section>

      </div>

    </Modal>
  );
};


export default SignatureModal;