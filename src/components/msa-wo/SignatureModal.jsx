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
   ICONS
============================================================ */

const TypeIcon = () => (
  <svg
    className="w-4 h-4 mr-2"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    viewBox="0 0 24 24"
  >
    <polyline points="4 7 4 4 20 4 20 7" />
    <line x1="9" y1="20" x2="15" y2="20" />
    <line x1="12" y1="4" x2="12" y2="20" />
  </svg>
);


const DrawIcon = () => (
  <svg
    className="w-4 h-4 mr-2"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    viewBox="0 0 24 24"
  >
    <path d="M12 19l7-7 3 3-7 7-3-3z" />
    <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
    <path d="M2 2l7.586 7.586" />
    <circle cx="11" cy="11" r="2" />
  </svg>
);


const UploadIcon = () => (
  <svg
    className="w-4 h-4 mr-2"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    viewBox="0 0 24 24"
  >
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17 8 12 3 7 8" />
    <line x1="12" y1="3" x2="12" y2="15" />
  </svg>
);


const LockIcon = () => (
  <svg
    className="w-4 h-4 text-gray-400"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    viewBox="0 0 24 24"
  >
    <rect
      x="3"
      y="11"
      width="18"
      height="11"
      rx="2"
      ry="2"
    />

    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);


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
   SIGNER TYPE NORMALIZATION

   This permanently protects against:

   signerType = {
     signerType: "taproot"
   }

   becoming:

   "[object Object]"
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
     NORMALIZED SIGNER TYPE
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
     FONTS
  ========================================================== */

  const fonts = [
    {
      id:
        "font-dancing-script",

      name:
        "Dancing Script",

      className:
        "font-dancing-script",
    },

    {
      id:
        "font-great-vibes",

      name:
        "Great Vibes",

      className:
        "font-great-vibes",
    },

    {
      id:
        "font-pacifico",

      name:
        "Pacifico",

      className:
        "font-pacifico",
    },

    {
      id:
        "font-sacramento",

      name:
        "Sacramento",

      className:
        "font-sacramento",
    },
  ];


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


      setTypedSignature(
        signerInfo
          ?.name ||
        ""
      );


      setPassword(
        ""
      );


      setError(
        ""
      );


      setLoading(
        false
      );


      setActiveTab(
        "type"
      );


      setSelectedFont(
        "font-dancing-script"
      );


      setUploadedSignature(
        ""
      );


      setUploadedFileName(
        ""
      );


      if (
        fileInputRef
          .current
      ) {
        fileInputRef
          .current
          .value = "";
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
     CLEAR DRAWN SIGNATURE
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
     DRAW TYPED SIGNATURE TO HIDDEN CANVAS
  ========================================================== */

  const drawSignatureOnCanvas =
    useCallback(
      () => {

        const canvas =
          typeCanvasRef
            .current;


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
          'italic 40px "Dancing Script", cursive';


        if (
          selectedFont ===
          "font-great-vibes"
        ) {
          fontStyle =
            'italic 45px "Great Vibes", cursive';
        }


        else if (
          selectedFont ===
          "font-pacifico"
        ) {
          fontStyle =
            '35px "Pacifico", cursive';
        }


        else if (
          selectedFont ===
          "font-sacramento"
        ) {
          fontStyle =
            '40px "Sacramento", cursive';
        }


        else {
          fontStyle =
            'italic 40px "Dancing Script", cursive';
        }


        ctx.font =
          fontStyle;


        const text =
          typedSignature ||
          "";


        const textWidth =
          ctx.measureText(
            text
          ).width;


        const requiredWidth =
          Math.max(
            500,

            Math.ceil(
              textWidth +
              100
            )
          );


        /*
         * Canvas height is physical output image height.
         */
        const requiredHeight =
          100;


        if (
          canvas.width !==
          requiredWidth ||
          canvas.height !==
          requiredHeight
        ) {
          canvas.width =
            requiredWidth;


          canvas.height =
            requiredHeight;
        }


        /*
         * Reset canvas context properties after resize.
         */
        ctx.clearRect(
          0,
          0,
          canvas.width,
          canvas.height
        );


        ctx.font =
          fontStyle;


        ctx.fillStyle =
          "#111827";


        ctx.textBaseline =
          "middle";


        ctx.textAlign =
          "left";


        ctx.fillText(
          text,
          40,
          canvas.height /
            2
        );

      },
      [
        typedSignature,
        selectedFont,
      ]
    );


  /* ==========================================================
     UPDATE TYPED CANVAS
  ========================================================== */

  useEffect(
    () => {

      if (
        !isOpen ||
        activeTab !==
          "type"
      ) {
        return;
      }


      let cancelled =
        false;


      const renderSignature =
        async () => {

          /*
           * Wait for custom fonts when available.
           */
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
            // Fall through.
          }


          if (
            cancelled
          ) {
            return;
          }


          drawSignatureOnCanvas();
        };


      const timeout =
        window.setTimeout(
          renderSignature,
          80
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
          "Please upload a valid PNG or JPG image."
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
          "Signature image must be 5MB or smaller."
        );


        event.target.value =
          "";


        return;
      }


      setError(
        ""
      );


      const reader =
        new FileReader();


      reader.onload =
        (
          loadEvent
        ) => {

          const result =
            loadEvent.target
              ?.result;


          if (
            typeof result !==
            "string"
          ) {
            setError(
              "Unable to read the selected signature image."
            );

            return;
          }


          setUploadedSignature(
            result
          );


          setUploadedFileName(
            file.name
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
     CREATE SIGNATURE IMAGE
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
            "Please type your signature."
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
            "Please draw your signature."
          );
        }


        return (
          signaturePad
            .current
            .getTrimmedCanvas()
            .toDataURL(
              "image/png"
            )
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
            "Please upload your signature image."
          );
        }


        return uploadedSignature;
      }


      throw new Error(
        "Please select a signature method."
      );
    };


  /* ==========================================================
     CONFIRM & SIGN
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
          `Invalid signer type: ${
            normalizedSignerType ||
            "not provided"
          }`
        );


        return;
      }


      /* ------------------------------------------------------
         INTERNAL PASSWORD
      ------------------------------------------------------ */

      if (
        requiresPassword &&
        !password
          .trim()
      ) {
        setError(
          "Please enter your VMS password to confirm this signature."
        );


        return;
      }


      setLoading(
        true
      );


      try {

        const signatureImage =
          getSignatureImage();


        const signerName =
          signerInfo
            ?.name ||
          typedSignature
            .trim() ||
          "";


        const signerTitle =
          signerInfo
            ?.title ||
          "";


        const finalSignerData = {
          signatureImage,

          name:
            signerName,

          title:
            signerTitle,

          /*
           * Only send internal VMS password when
           * this signing flow requires it.
           */
          ...(requiresPassword
            ? {
                password:
                  password,
              }
            : {}),
        };


        console.log(
          "[SignatureModal] Submitting signature:",
          {
            signerType:
              normalizedSignerType,

            signerTypeType:
              typeof normalizedSignerType,

            name:
              finalSignerData
                .name,

            title:
              finalSignerData
                .title,

            signatureMethod:
              activeTab,

            hasSignature:
              Boolean(
                finalSignerData
                  .signatureImage
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
         * =====================================================
         * CRITICAL CONTRACT
         * =====================================================
         *
         * The second argument MUST be the literal string:
         *
         * "vendor"
         *
         * or
         *
         * "taproot"
         *
         * NEVER pass signerInfo or signerConfig here.
         */
        await onSign(
          finalSignerData,

          normalizedSignerType
        );


        /*
         * Parent normally closes via handleSignSuccess(),
         * but closing here as well is harmless and keeps this
         * modal reusable.
         */
        if (
          typeof onClose ===
          "function"
        ) {
          onClose();
        }


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
          "Failed to process signature."
        );


      } finally {

        setLoading(
          false
        );
      }
    };


  /* ==========================================================
     TABS
  ========================================================== */

  const TabButton = ({
    id,
    children,
  }) => (

    <button
      type="button"

      onClick={() => {
        setActiveTab(
          id
        );


        setError(
          ""
        );
      }}

      disabled={
        loading
      }

      className={
        `flex items-center justify-center pb-3 text-sm font-semibold transition-all border-b-2 ${
          activeTab === id
            ? "text-[#1473E6] border-[#1473E6]"
            : "text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-300"
        }`
      }
    >

      {children}

    </button>
  );


  /* ==========================================================
     CLOSED
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

      <div className="flex flex-col lg:flex-row gap-0 h-[75vh] -m-6 rounded-b-lg overflow-hidden">


        {/* ====================================================
            PDF VIEWER
        ==================================================== */}

        <div className="w-full lg:w-[55%] h-full bg-[#323639] flex flex-col border-r border-[#202224]">


          <div className="bg-[#2b2e31] border-b border-[#1f2224] h-12 flex items-center px-4 justify-between flex-shrink-0 text-gray-400 shadow-sm z-10">

            <span className="text-xs font-semibold tracking-wider uppercase flex items-center">

              <svg
                className="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >

                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />

              </svg>

              Document Preview

            </span>


            <span className="text-[10px] uppercase tracking-wider font-bold">

              {
                normalizedSignerType ===
                "taproot"
                  ? "Taproot Signature"
                  : normalizedSignerType ===
                    "vendor"
                    ? "Vendor Signature"
                    : "Signature"
              }

            </span>

          </div>


          {documentUrl ? (

            <div className="flex-1 p-4 lg:p-8 overflow-hidden flex justify-center">

              <div className="w-full h-full max-w-2xl bg-white shadow-[0_10px_30px_rgba(0,0,0,0.4)] flex flex-col ring-1 ring-gray-900/5">

                <iframe
                  src={
                    documentUrl
                  }
                  title="Document Preview"
                  className="w-full h-full border-0"
                />

              </div>

            </div>

          ) : (

            <div className="flex-1 flex flex-col items-center justify-center">

              <svg
                className="w-12 h-12 text-gray-500 mb-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >

                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />

              </svg>


              <p className="text-gray-400 text-sm font-medium">
                Document preview unavailable.
              </p>

            </div>

          )}

        </div>


        {/* ====================================================
            SIGNATURE PANEL
        ==================================================== */}

        <div className="w-full lg:w-[45%] h-full bg-white flex flex-col">

          <div className="p-8 flex flex-col h-full min-h-0">


            {/* ==================================================
                HEADER
            ================================================== */}

            <div className="mb-6">

              <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
                Adopt Your Signature
              </h2>


              <p className="text-sm text-gray-500 mt-1">
                Review your name and select a signature style.
              </p>

            </div>


            {/* ==================================================
                ERROR
            ================================================== */}

            {error && (

              <div className="bg-red-50 border-l-4 border-red-500 p-3 rounded text-sm text-red-700 mb-4 shadow-sm flex items-start">

                <svg
                  className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >

                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />

                </svg>


                <span>
                  {error}
                </span>

              </div>

            )}


            {/* ==================================================
                TABS
            ================================================== */}

            <div className="border-b border-gray-200 mb-6 flex space-x-6">

              <TabButton id="type">
                <TypeIcon />
                Type
              </TabButton>


              <TabButton id="draw">
                <DrawIcon />
                Draw
              </TabButton>


              <TabButton id="upload">
                <UploadIcon />
                Upload
              </TabButton>

            </div>


            {/* ==================================================
                CONTENT
            ================================================== */}

            <div className="flex-1 min-h-0 overflow-y-auto pr-2 custom-scrollbar">


              {/* ================================================
                  TYPE
              ================================================ */}

              <div
                className={
                  activeTab ===
                  "type"
                    ? "space-y-6"
                    : "hidden"
                }
              >

                <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 relative flex items-center justify-center min-h-[140px] shadow-inner">

                  <div className="absolute bottom-6 left-6 right-6 border-b-2 border-blue-200 opacity-50 pointer-events-none" />


                  <input
                    type="text"

                    value={
                      typedSignature
                    }

                    onChange={(
                      event
                    ) => {
                      setTypedSignature(
                        event.target
                          .value
                      );


                      setError(
                        ""
                      );
                    }}

                    disabled={
                      loading
                    }

                    className={
                      `w-full bg-transparent text-center text-5xl focus:outline-none text-gray-800 z-10 placeholder-gray-300 ${selectedFont}`
                    }

                    placeholder="Your Name Here"
                  />

                </div>


                <div>

                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3">
                    Select Signature Style
                  </p>


                  <div className="grid grid-cols-2 gap-3">

                    {fonts.map(
                      (
                        font
                      ) => (

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
                            `p-4 rounded-lg border text-center transition-all flex items-center justify-center overflow-hidden ${
                              selectedFont ===
                              font.className
                                ? "border-[#1473E6] bg-blue-50/50 ring-1 ring-[#1473E6] shadow-sm"
                                : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
                            }`
                          }
                        >

                          <span
                            className={
                              `text-2xl text-gray-800 truncate ${font.className}`
                            }
                          >

                            {
                              typedSignature ||
                              signerInfo
                                ?.name ||
                              "Signature"
                            }

                          </span>

                        </button>

                      )
                    )}

                  </div>

                </div>

              </div>


              {/* ================================================
                  DRAW
              ================================================ */}

              <div
                className={
                  activeTab ===
                  "draw"
                    ? "relative w-full h-[250px] bg-[#f8fafc] border border-gray-300 rounded-lg shadow-inner overflow-hidden"
                    : "hidden"
                }
              >

                <div
                  className="absolute inset-0 opacity-20 pointer-events-none"
                  style={{
                    backgroundImage:
                      "radial-gradient(#cbd5e1 1px, transparent 1px)",

                    backgroundSize:
                      "20px 20px",
                  }}
                />


                <div className="absolute bottom-8 left-8 right-8 border-b-2 border-blue-200 opacity-50 pointer-events-none" />


                <SignatureCanvas
                  ref={
                    signaturePad
                  }

                  penColor="#111827"

                  canvasProps={{
                    className:
                      "w-full h-full relative z-10 cursor-crosshair",
                  }}
                />


                <button
                  type="button"

                  onClick={
                    clearCanvas
                  }

                  disabled={
                    loading
                  }

                  className="absolute top-3 right-3 px-3 py-1.5 text-xs font-semibold text-gray-500 bg-white border border-gray-200 rounded hover:text-red-600 hover:border-red-200 transition-colors z-20 shadow-sm"
                >
                  Clear Canvas
                </button>

              </div>


              {/* ================================================
                  UPLOAD
              ================================================ */}

              <div
                className={
                  activeTab ===
                  "upload"
                    ? ""
                    : "hidden"
                }
              >

                <input
                  type="file"

                  ref={
                    fileInputRef
                  }

                  onChange={
                    handleFileChange
                  }

                  className="hidden"

                  accept="image/png,image/jpeg"
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

                    className="w-full h-[250px] flex flex-col items-center justify-center bg-blue-50/30 text-blue-600 border-2 border-dashed border-blue-300 rounded-lg hover:bg-blue-50 transition-colors"
                  >

                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm mb-3 border border-blue-100">

                      <UploadIcon />

                    </div>


                    <span className="font-semibold">
                      Click to upload your signature
                    </span>


                    <span className="text-xs text-gray-500 mt-1 font-medium">
                      JPEG or PNG, up to 5MB
                    </span>

                  </button>

                ) : (

                  <div className="w-full min-h-[250px] p-6 flex flex-col items-center justify-center border border-gray-200 rounded-lg bg-gray-50">

                    <div className="w-full bg-white border border-gray-200 rounded-lg p-5 flex items-center justify-center min-h-[150px]">

                      <img
                        src={
                          uploadedSignature
                        }
                        alt="Uploaded Signature Preview"
                        className="max-w-full max-h-[120px] object-contain"
                      />

                    </div>


                    <div className="mt-3 text-xs font-medium text-gray-500">
                      {
                        uploadedFileName
                      }
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

                      className="mt-3 text-sm font-semibold text-blue-600 hover:text-blue-700"
                    >
                      Choose Different Image
                    </button>

                  </div>

                )}

              </div>


              {/* Hidden canvas used only to convert typed text */}
              <canvas
                ref={
                  typeCanvasRef
                }
                width="500"
                height="100"
                className="hidden"
              />

            </div>


            {/* ==================================================
                FOOTER
            ================================================== */}

            <div className="mt-6 pt-6 bg-white border-t border-gray-100">


              {/* ================================================
                  INTERNAL VERIFICATION
              ================================================ */}

              {requiresPassword && (

                <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">

                  <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">
                    Internal Verification
                  </label>


                  <p className="text-xs text-gray-500 mb-3">
                    Enter your VMS password to authorize this electronic signature.
                  </p>


                  <div className="relative">

                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">

                      <LockIcon />

                    </div>


                    <input
                      type="password"

                      value={
                        password
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

                      disabled={
                        loading
                      }

                      autoComplete="current-password"

                      className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-md bg-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#1473E6] focus:border-[#1473E6] sm:text-sm shadow-sm"

                      placeholder="Enter your VMS password"

                      required
                    />

                  </div>

                </div>

              )}


              {/* ================================================
                  BUTTONS
              ================================================ */}

              <div className="flex justify-end space-x-3">

                <button
                  type="button"

                  onClick={() => {
                    if (
                      !loading
                    ) {
                      onClose?.();
                    }
                  }}

                  disabled={
                    loading
                  }

                  className="px-5 py-2.5 bg-white border border-gray-300 text-gray-700 font-semibold rounded-md hover:bg-gray-50 shadow-sm transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>


                <button
                  type="button"

                  onClick={
                    handleSave
                  }

                  disabled={
                    loading
                  }

                  className="px-6 py-2.5 bg-[#1473E6] text-white font-semibold rounded-md hover:bg-[#0d66d0] shadow-sm transition-colors flex items-center justify-center min-w-[150px] text-sm disabled:bg-blue-400 disabled:cursor-not-allowed"
                >

                  {loading ? (

                    <>
                      <Spinner size="4" />

                      <span className="ml-2">
                        Signing...
                      </span>
                    </>

                  ) : (

                    "Confirm & Sign"

                  )}

                </button>

              </div>

            </div>

          </div>

        </div>

      </div>

    </Modal>
  );
};


export default SignatureModal;