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
   CONFIGURATION
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

const SignatureIcon = ({
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
      d="M3 17c3-1 4-6 6-6 1.5 0 .5 4 2 4 2 0 3-6 5-6 1.5 0 .5 4 2 4 1 0 2-.5 3-1"
    />

    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M3 21h18"
    />
  </svg>
);


const TypeIcon = ({
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
      d="M5 4h14M9 4v16m6-16v16M7 20h10"
    />
  </svg>
);


const DrawIcon = ({
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
      d="M4 20l4.5-1 10-10a2.12 2.12 0 00-3-3l-10 10L4 20z"
    />

    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M13.5 7.5l3 3"
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
      d="M12 16V4m0 0L7.5 8.5M12 4l4.5 4.5"
    />

    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M5 15v4a1 1 0 001 1h12a1 1 0 001-1v-4"
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
      d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"
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
      d="M3 3l18 18"
    />

    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M10.6 10.6A2 2 0 0013.4 13.4"
    />

    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M9.9 4.4A10.4 10.4 0 0112 4.2c6 0 9.5 7.8 9.5 7.8a17 17 0 01-2.6 3.8M6.4 6.4C3.9 8.4 2.5 12 2.5 12s3.5 7.8 9.5 7.8a10 10 0 004.4-1"
    />
  </svg>
);


const UserIcon = ({
  className = "w-5 h-5",
}) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <circle
      cx="12"
      cy="8"
      r="4"
      strokeWidth="2"
    />

    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M4 21a8 8 0 0116 0"
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


const DocumentIcon = ({
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


const TrashIcon = ({
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
      d="M4 7h16M9 7V4h6v3m-8 0l1 13h8l1-13"
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
     SIGNER TYPE
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


  const [
    dragActive,
    setDragActive,
  ] =
    useState(
      false
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
     SIGNATURE FONTS
  ========================================================== */

  const fonts =
    useMemo(
      () => [
        {
          id:
            "font-dancing-script",

          className:
            "font-dancing-script",

          label:
            "Natural",
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
      ],
      []
    );


  /* ==========================================================
     DISPLAY LABELS
  ========================================================== */

  const signerLabel =
    normalizedSignerType ===
    "taproot"
      ? "Taproot Authorized Signer"
      : "Vendor Authorized Signer";


  const securityLabel =
    normalizedSignerType ===
    "taproot"
      ? "Internal Authorized Signature"
      : "External Authorized Signature";


  /* ==========================================================
     RESET MODAL
  ========================================================== */

  useEffect(
    () => {
      if (
        !isOpen
      ) {
        return;
      }


      setActiveTab(
        "type"
      );


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


      setDragActive(
        false
      );


      if (
        fileInputRef.current
      ) {
        fileInputRef.current.value =
          "";
      }


      window.setTimeout(
        () => {
          signaturePad
            .current
            ?.clear();
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
     TYPED SIGNATURE RENDERING
  ========================================================== */

  const drawSignatureOnCanvas =
    useCallback(
      () => {
        const canvas =
          typeCanvasRef.current;


        if (!canvas) {
          return;
        }


        const context =
          canvas.getContext(
            "2d"
          );


        if (!context) {
          return;
        }


        let font =
          'italic 48px "Dancing Script", cursive';


        if (
          selectedFont ===
          "font-great-vibes"
        ) {
          font =
            '50px "Great Vibes", cursive';
        }


        else if (
          selectedFont ===
          "font-pacifico"
        ) {
          font =
            '40px "Pacifico", cursive';
        }


        else if (
          selectedFont ===
          "font-sacramento"
        ) {
          font =
            '50px "Sacramento", cursive';
        }


        const text =
          typedSignature.trim();


        context.font =
          font;


        const measuredWidth =
          context.measureText(
            text
          ).width;


        const width =
          Math.max(
            600,

            Math.ceil(
              measuredWidth +
              160
            )
          );


        const height =
          140;


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


        context.clearRect(
          0,
          0,
          canvas.width,
          canvas.height
        );


        context.font =
          font;


        context.fillStyle =
          "#0f172a";


        context.textAlign =
          "left";


        context.textBaseline =
          "middle";


        context.fillText(
          text,
          60,
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


      const paint =
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
            // Font readiness is non-fatal.
          }


          if (
            !cancelled
          ) {
            drawSignatureOnCanvas();
          }
        };


      const timer =
        window.setTimeout(
          paint,
          60
        );


      return () => {
        cancelled =
          true;

        window.clearTimeout(
          timer
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
     FILE PROCESSING
  ========================================================== */

  const processSignatureFile =
    (
      file
    ) => {
      if (!file) {
        return;
      }


      if (
        !ALLOWED_UPLOAD_TYPES.includes(
          file.type
        )
      ) {
        setError(
          "Please choose a PNG or JPG signature image."
        );

        return;
      }


      if (
        file.size >
        MAX_UPLOAD_SIZE
      ) {
        setError(
          "Signature image must be smaller than 5 MB."
        );

        return;
      }


      const reader =
        new FileReader();


      reader.onload =
        (
          event
        ) => {
          const result =
            event.target?.result;


          if (
            typeof result !==
            "string"
          ) {
            setError(
              "Unable to read the selected image."
            );

            return;
          }


          setUploadedSignature(
            result
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
            "Unable to read the selected image."
          );
        };


      reader.readAsDataURL(
        file
      );
    };


  const handleFileChange =
    (
      event
    ) => {
      const file =
        event.target.files?.[0];


      processSignatureFile(
        file
      );
    };


  const handleDragOver =
    (
      event
    ) => {
      event.preventDefault();

      setDragActive(
        true
      );
    };


  const handleDragLeave =
    (
      event
    ) => {
      event.preventDefault();

      setDragActive(
        false
      );
    };


  const handleDrop =
    (
      event
    ) => {
      event.preventDefault();

      setDragActive(
        false
      );


      const file =
        event.dataTransfer
          ?.files?.[0];


      processSignatureFile(
        file
      );
    };


  /* ==========================================================
     BUILD SIGNATURE IMAGE
  ========================================================== */

  const getSignatureImage =
    () => {

      /* TYPE */

      if (
        activeTab ===
        "type"
      ) {
        if (
          !typedSignature.trim()
        ) {
          throw new Error(
            "Enter your name before signing."
          );
        }


        drawSignatureOnCanvas();


        if (
          !typeCanvasRef.current
        ) {
          throw new Error(
            "Unable to generate the typed signature."
          );
        }


        return typeCanvasRef
          .current
          .toDataURL(
            "image/png"
          );
      }


      /* DRAW */

      if (
        activeTab ===
        "draw"
      ) {
        if (
          !signaturePad.current
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


      /* UPLOAD */

      if (
        activeTab ===
        "upload"
      ) {
        if (
          !uploadedSignature
        ) {
          throw new Error(
            "Upload your signature image before continuing."
          );
        }


        return uploadedSignature;
      }


      throw new Error(
        "Choose a signature method."
      );
    };


  /* ==========================================================
     SUBMIT SIGNATURE
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


      if (
        ![
          "vendor",
          "taproot",
        ].includes(
          normalizedSignerType
        )
      ) {
        setError(
          "Signing role is invalid. Close the window and reopen the signing process."
        );

        return;
      }


      if (
        requiresPassword &&
        !password.trim()
      ) {
        setError(
          "Enter your VMS password to verify your identity."
        );

        return;
      }


      if (
        !consentAccepted
      ) {
        setError(
          "Please confirm your electronic signature consent before continuing."
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
            signerInfo?.name ||
            typedSignature.trim() ||
            "",

          title:
            signerInfo?.title ||
            "",

          ...(requiresPassword
            ? {
                password:
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
              finalSignerData.name,

            signerTitle:
              finalSignerData.title,

            hasSignature:
              Boolean(
                finalSignerData
                  .signatureImage
              ),

            hasPassword:
              Boolean(
                finalSignerData
                  .password
              ),

            consentAccepted,
          }
        );


        /*
         * =====================================================
         * NEW SAFE CONTRACT
         *
         * ONE ARGUMENT.
         *
         * No positional signerType arguments anymore.
         *
         * This permanently eliminates:
         *
         * [object Object]
         *
         * argument-order bugs.
         * =====================================================
         */
        await onSign({
          signerType:
            normalizedSignerType,

          signerData:
            finalSignerData,
        });


        /*
         * Parent closes after successful API response.
         * Do NOT close early here.
         */

      } catch (
        err
      ) {
        console.error(
          "[SignatureModal] Signature failed:",
          err
        );


        setError(
          err.response?.data?.message ||
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
     TAB BUTTON
  ========================================================== */

  const MethodTab = ({
    id,
    icon,
    title,
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
          `relative flex flex-1 items-center justify-center gap-2 px-4 py-3.5 text-sm font-semibold transition-all ${
            selected
              ? "text-blue-600"
              : "text-slate-500 hover:text-slate-800"
          }`
        }
      >

        <span
          className={
            `flex h-7 w-7 items-center justify-center rounded-lg transition ${
              selected
                ? "bg-blue-50 text-blue-600"
                : "text-slate-400"
            }`
          }
        >
          {icon}
        </span>


        <span>
          {title}
        </span>


        <span
          className={
            `absolute bottom-0 left-4 right-4 h-[2px] rounded-full transition ${
              selected
                ? "bg-blue-600"
                : "bg-transparent"
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

      title="Complete Your Signature"

      size="6xl"
    >

      <div className="-m-6 flex h-[82vh] min-h-[680px] overflow-hidden rounded-b-xl bg-white">


        {/* ====================================================
            DOCUMENT WORKSPACE
        ==================================================== */}

        <section className="relative hidden w-[55%] flex-col overflow-hidden bg-[#24272a] lg:flex">


          {/* ==================================================
              DOCUMENT TOPBAR
          ================================================== */}

          <div className="flex h-[58px] flex-shrink-0 items-center justify-between border-b border-white/10 bg-[#292d30] px-5">

            <div className="flex items-center gap-3">

              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/[0.06] text-slate-300 ring-1 ring-white/10">

                <DocumentIcon />

              </div>


              <div>

                <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-300">
                  Agreement Preview
                </div>


                <div className="mt-0.5 text-[10px] text-slate-500">
                  Review the complete document before signing
                </div>

              </div>

            </div>


            <div className="flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1.5 text-emerald-300 ring-1 ring-emerald-400/20">

              <ShieldIcon className="w-3.5 h-3.5" />


              <span className="text-[9px] font-bold uppercase tracking-widest">
                Protected
              </span>

            </div>

          </div>


          {/* ==================================================
              DOCUMENT AREA
          ================================================== */}

          <div className="relative min-h-0 flex-1 bg-[#303336] p-6">

            <div
              className="pointer-events-none absolute inset-0 opacity-[0.04]"
              style={{
                backgroundImage:
                  "radial-gradient(#ffffff 1px, transparent 1px)",

                backgroundSize:
                  "22px 22px",
              }}
            />


            {documentUrl ? (

              <div className="relative h-full overflow-hidden rounded-lg bg-white shadow-[0_30px_80px_rgba(0,0,0,0.45)] ring-1 ring-black/30">

                <iframe
                  src={
                    documentUrl
                  }

                  title="Document Preview"

                  className="h-full w-full border-0 bg-white"
                />

              </div>

            ) : (

              <div className="relative flex h-full items-center justify-center">

                <div className="max-w-sm text-center">

                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white/[0.06] text-slate-400 ring-1 ring-white/10">

                    <DocumentIcon className="w-8 h-8" />

                  </div>


                  <h3 className="mt-5 font-semibold text-white">
                    Document preview unavailable
                  </h3>


                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    The agreement is available for signing, but its visual preview could not be loaded.
                  </p>

                </div>

              </div>

            )}

          </div>


          {/* ==================================================
              SECURE BAR
          ================================================== */}

          <div className="flex h-11 flex-shrink-0 items-center justify-center gap-2 border-t border-white/10 bg-[#292d30] text-[9px] font-bold uppercase tracking-[0.14em] text-slate-500">

            <LockIcon className="w-3.5 h-3.5" />

            Encrypted signing session

            <span className="mx-1 text-slate-700">
              •
            </span>

            Secure document preview

          </div>

        </section>


        {/* ====================================================
            SIGNATURE WORKSPACE
        ==================================================== */}

        <section className="flex min-w-0 flex-1 flex-col bg-white">


          {/* ==================================================
              SIGNER HEADER
          ================================================== */}

          <div className="flex-shrink-0 border-b border-slate-200 bg-white px-7 pb-5 pt-6 lg:px-8">

            <div className="flex items-start gap-4">

              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 text-blue-600 shadow-sm ring-1 ring-blue-100">

                <SignatureIcon className="w-6 h-6" />

              </div>


              <div className="min-w-0 flex-1">

                <div className="flex flex-wrap items-center gap-2">

                  <h2 className="text-[25px] font-bold tracking-tight text-slate-950">
                    Create your signature
                  </h2>


                  <span className="inline-flex rounded-full bg-blue-50 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.12em] text-blue-700 ring-1 ring-blue-100">
                    {securityLabel}
                  </span>

                </div>


                <p className="mt-1.5 text-sm leading-6 text-slate-500">
                  Review your identity, choose your signature style, and securely authorize the document.
                </p>

              </div>

            </div>


            {/* =================================================
                IDENTITY CARD
            ================================================= */}

            <div className="mt-5 flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3">

              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-white text-blue-600 shadow-sm ring-1 ring-slate-200">

                <UserIcon />

              </div>


              <div className="min-w-0 flex-1">

                <div className="truncate text-sm font-bold text-slate-900">
                  {
                    signerInfo?.name ||
                    "Authorized Signer"
                  }
                </div>


                <div className="mt-0.5 truncate text-xs text-slate-500">
                  {
                    signerInfo?.title ||
                    signerLabel
                  }
                </div>

              </div>


              <span className="inline-flex flex-shrink-0 items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1.5 text-[10px] font-bold text-emerald-700 ring-1 ring-emerald-100">

                <CheckIcon className="w-3 h-3" />

                Verified identity

              </span>

            </div>

          </div>


          {/* ==================================================
              ERROR
          ================================================== */}

          {error && (

            <div className="mx-7 mt-4 flex flex-shrink-0 items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3.5 lg:mx-8">

              <div className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-red-100 text-xs font-black text-red-600">
                !
              </div>


              <div className="min-w-0">

                <div className="text-sm font-bold text-red-800">
                  Signature could not be completed
                </div>


                <p className="mt-0.5 text-xs leading-5 text-red-700">
                  {error}
                </p>

              </div>

            </div>

          )}


          {/* ==================================================
              METHOD TABS
          ================================================== */}

          <div className="flex-shrink-0 border-b border-slate-200 px-7 pt-2 lg:px-8">

            <div className="flex">

              <MethodTab
                id="type"
                title="Type"
                icon={
                  <TypeIcon />
                }
              />


              <MethodTab
                id="draw"
                title="Draw"
                icon={
                  <DrawIcon />
                }
              />


              <MethodTab
                id="upload"
                title="Upload"
                icon={
                  <UploadIcon className="w-4 h-4" />
                }
              />

            </div>

          </div>


          {/* ==================================================
              SCROLLABLE CONTENT
          ================================================== */}

          <div className="min-h-0 flex-1 overflow-y-auto px-7 py-6 lg:px-8">


            {/* =================================================
                TYPE SIGNATURE
            ================================================= */}

            {activeTab ===
              "type" && (

              <div>


                <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-b from-[#fbfcfe] to-white p-7 shadow-[inset_0_1px_2px_rgba(15,23,42,0.03)]">

                  <div className="pointer-events-none absolute bottom-[41px] left-9 right-9 border-b border-blue-200" />


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
                      `relative z-10 w-full bg-transparent py-3 text-center text-[46px] leading-none text-slate-900 outline-none placeholder:text-slate-300 ${selectedFont}`
                    }
                  />


                  <div className="mt-6 text-center text-[9px] font-bold uppercase tracking-[0.18em] text-slate-400">
                    Signature preview
                  </div>

                </div>


                {/* =============================================
                    STYLE SELECTOR
                ============================================= */}

                <div className="mt-7">

                  <div className="mb-3">

                    <h3 className="text-xs font-bold uppercase tracking-[0.12em] text-slate-600">
                      Choose a signature style
                    </h3>


                    <p className="mt-1 text-xs text-slate-400">
                      Select the representation that will appear on the signed agreement.
                    </p>

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
                              `group relative min-h-[92px] overflow-hidden rounded-xl border px-4 py-4 transition-all ${
                                selected
                                  ? "border-blue-500 bg-blue-50/60 shadow-[0_4px_14px_rgba(37,99,235,0.08)] ring-1 ring-blue-500"
                                  : "border-slate-200 bg-white hover:border-blue-200 hover:bg-slate-50"
                              }`
                            }
                          >

                            {selected && (

                              <div className="absolute right-2.5 top-2.5 flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-white shadow-sm">

                                <CheckIcon className="w-3 h-3" />

                              </div>

                            )}


                            <div
                              className={
                                `truncate pr-4 text-center text-[24px] text-slate-800 ${font.className}`
                              }
                            >
                              {
                                typedSignature ||
                                signerInfo?.name ||
                                "Signature"
                              }
                            </div>


                            <div
                              className={
                                `mt-3 text-center text-[9px] font-bold uppercase tracking-[0.15em] ${
                                  selected
                                    ? "text-blue-500"
                                    : "text-slate-400"
                                }`
                              }
                            >
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
                DRAW SIGNATURE
            ================================================= */}

            {activeTab ===
              "draw" && (

              <div>


                <div className="mb-3 flex items-center justify-between gap-4">

                  <div>

                    <h3 className="text-xs font-bold uppercase tracking-[0.12em] text-slate-600">
                      Draw your signature
                    </h3>


                    <p className="mt-1 text-xs text-slate-400">
                      Use your mouse, trackpad, stylus, or touchscreen.
                    </p>

                  </div>


                  <button
                    type="button"

                    disabled={
                      loading
                    }

                    onClick={() => {
                      signaturePad
                        .current
                        ?.clear();

                      setError(
                        ""
                      );
                    }}

                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-500 shadow-sm transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                  >

                    <TrashIcon />

                    Clear

                  </button>

                </div>


                <div className="relative h-[300px] overflow-hidden rounded-2xl border border-slate-200 bg-[#fbfcfd] shadow-inner">

                  <div
                    className="pointer-events-none absolute inset-0 opacity-40"
                    style={{
                      backgroundImage:
                        "radial-gradient(#cbd5e1 1px, transparent 1px)",

                      backgroundSize:
                        "22px 22px",
                    }}
                  />


                  <div className="pointer-events-none absolute bottom-16 left-10 right-10 border-b border-blue-200" />


                  <div className="pointer-events-none absolute bottom-9 left-10 text-[9px] font-bold uppercase tracking-[0.16em] text-slate-300">
                    Sign above the line
                  </div>


                  <SignatureCanvas
                    ref={
                      signaturePad
                    }

                    penColor="#0f172a"

                    minWidth={
                      1.2
                    }

                    maxWidth={
                      2.4
                    }

                    canvasProps={{
                      className:
                        "relative z-10 h-full w-full cursor-crosshair",
                    }}
                  />

                </div>

              </div>

            )}


            {/* =================================================
                UPLOAD SIGNATURE
            ================================================= */}

            {activeTab ===
              "upload" && (

              <div>


                <div className="mb-3">

                  <h3 className="text-xs font-bold uppercase tracking-[0.12em] text-slate-600">
                    Upload your signature
                  </h3>


                  <p className="mt-1 text-xs text-slate-400">
                    Use a clean signature image with a white or transparent background.
                  </p>

                </div>


                <input
                  ref={
                    fileInputRef
                  }

                  type="file"

                  accept="image/png,image/jpeg"

                  className="hidden"

                  onChange={
                    handleFileChange
                  }
                />


                {!uploadedSignature ? (

                  <div
                    role="button"

                    tabIndex={
                      0
                    }

                    onDragOver={
                      handleDragOver
                    }

                    onDragLeave={
                      handleDragLeave
                    }

                    onDrop={
                      handleDrop
                    }

                    onClick={() =>
                      fileInputRef
                        .current
                        ?.click()
                    }

                    onKeyDown={(
                      event
                    ) => {
                      if (
                        event.key ===
                          "Enter" ||
                        event.key ===
                          " "
                      ) {
                        fileInputRef
                          .current
                          ?.click();
                      }
                    }}

                    className={
                      `group flex h-[300px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-8 text-center transition-all ${
                        dragActive
                          ? "border-blue-500 bg-blue-50 ring-4 ring-blue-50"
                          : "border-slate-300 bg-slate-50/70 hover:border-blue-400 hover:bg-blue-50/50"
                      }`
                    }
                  >

                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-blue-600 shadow-sm ring-1 ring-slate-200 transition-transform group-hover:-translate-y-0.5">

                      <UploadIcon className="w-7 h-7" />

                    </div>


                    <div className="mt-5 text-sm font-bold text-slate-800">
                      Drag & drop your signature here
                    </div>


                    <div className="mt-1.5 text-xs text-slate-500">
                      or click to browse your computer
                    </div>


                    <div className="mt-4 rounded-full bg-white px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500 ring-1 ring-slate-200">
                      PNG / JPG • Max 5 MB
                    </div>

                  </div>

                ) : (

                  <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5">

                    <div className="relative flex min-h-[210px] items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-white p-8 shadow-inner">

                      <div
                        className="absolute inset-0 opacity-[0.025]"
                        style={{
                          backgroundImage:
                            "linear-gradient(45deg,#000 25%,transparent 25%),linear-gradient(-45deg,#000 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#000 75%),linear-gradient(-45deg,transparent 75%,#000 75%)",

                          backgroundSize:
                            "20px 20px",
                        }}
                      />


                      <img
                        src={
                          uploadedSignature
                        }

                        alt="Uploaded signature"

                        className="relative max-h-[150px] max-w-full object-contain"
                      />

                    </div>


                    <div className="mt-4 flex items-center justify-between gap-4">

                      <div className="min-w-0">

                        <div className="truncate text-sm font-semibold text-slate-700">
                          {
                            uploadedFileName
                          }
                        </div>


                        <div className="mt-0.5 flex items-center gap-1 text-xs font-medium text-emerald-600">

                          <CheckIcon className="w-3 h-3" />

                          Ready to use

                        </div>

                      </div>


                      <button
                        type="button"

                        onClick={() =>
                          fileInputRef
                            .current
                            ?.click()
                        }

                        disabled={
                          loading
                        }

                        className="flex-shrink-0 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-blue-600 shadow-sm transition hover:border-blue-200 hover:bg-blue-50"
                      >
                        Replace
                      </button>

                    </div>

                  </div>

                )}

              </div>

            )}


            {/* =================================================
                INTERNAL PASSWORD
            ================================================= */}

            {requiresPassword && (

              <div className="mt-7 overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white">

                <div className="flex items-start gap-3 border-b border-slate-200 px-4 py-3.5">

                  <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-white text-slate-500 shadow-sm ring-1 ring-slate-200">

                    <LockIcon />

                  </div>


                  <div>

                    <h3 className="text-xs font-bold uppercase tracking-[0.12em] text-slate-600">
                      Identity verification
                    </h3>


                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      Re-enter your VMS account password to authorize your signature.
                    </p>

                  </div>

                </div>


                <div className="p-4">

                  <div className="relative">

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
                          event.target
                            .value
                        );

                        setError(
                          ""
                        );
                      }}

                      autoComplete="current-password"

                      placeholder="Enter your VMS password"

                      className="block w-full rounded-xl border border-slate-300 bg-white px-4 py-3 pr-12 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
                    />


                    <button
                      type="button"

                      onClick={() =>
                        setShowPassword(
                          (
                            current
                          ) =>
                            !current
                        )
                      }

                      className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-slate-400 transition hover:text-slate-700"

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

            )}


            {/* =================================================
                LEGAL CONSENT
            ================================================= */}

            <label className="mt-6 flex cursor-pointer items-start gap-3.5 rounded-2xl border border-slate-200 bg-white p-4.5 transition hover:border-slate-300 hover:bg-slate-50">

              <div className="pt-0.5">

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
                      event.target
                        .checked
                    );

                    setError(
                      ""
                    );
                  }}

                  className="h-4.5 w-4.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />

              </div>


              <div>

                <div className="text-sm font-bold text-slate-700">
                  Electronic signature consent
                </div>


                <p className="mt-1 text-xs leading-5 text-slate-500">
                  I confirm that I am the person identified above and intend my selected signature to serve as my electronic signature on this agreement.
                </p>

              </div>

            </label>


            {/* =================================================
                HIDDEN TYPE CANVAS
            ================================================= */}

            <canvas
              ref={
                typeCanvasRef
              }

              width="600"

              height="140"

              className="hidden"
            />

          </div>


          {/* ==================================================
              FIXED FOOTER
          ================================================== */}

          <div className="flex-shrink-0 border-t border-slate-200 bg-white px-7 py-5 shadow-[0_-12px_28px_rgba(15,23,42,0.035)] lg:px-8">

            <div className="mb-4 flex items-center justify-between">

              <div className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.14em] text-slate-400">

                <ShieldIcon className="w-3.5 h-3.5 text-emerald-500" />

                Secure electronic signature

              </div>


              <div className="text-[10px] text-slate-400">
                {
                  signerInfo?.name ||
                  "Authorized Signer"
                }
              </div>

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

                className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-400 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
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

                className="group flex min-w-[190px] items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-3 text-sm font-bold text-white shadow-[0_6px_18px_rgba(37,99,235,0.24)] transition hover:-translate-y-[1px] hover:from-blue-700 hover:to-blue-800 hover:shadow-[0_8px_22px_rgba(37,99,235,0.3)] focus:outline-none focus:ring-4 focus:ring-blue-100 disabled:translate-y-0 disabled:cursor-not-allowed disabled:from-blue-400 disabled:to-blue-400 disabled:shadow-none"
              >

                {loading ? (

                  <>
                    <Spinner size="4" />

                    <span>
                      Applying signature...
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