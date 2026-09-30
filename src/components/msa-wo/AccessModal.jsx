// src/components/msa-wo/AccessModal.jsx

import React, {
  useEffect,
  useState,
} from "react";

import Modal from "../Modal";
import Spinner from "../Spinner";

import {
  apiService,
} from "../../api/apiService";


const AccessModal = ({
  isOpen,
  onClose,
  onAccessGranted,
  token,
  vendorEmail,
  apiServiceMethod,
}) => {

  /* ==========================================================
     STATE
  ========================================================== */

  const [
    tempPassword,
    setTempPassword,
  ] =
    useState("");


  const [
    error,
    setError,
  ] =
    useState("");


  const [
    loading,
    setLoading,
  ] =
    useState(false);


  const [
    showPassword,
    setShowPassword,
  ] =
    useState(false);


  /* ==========================================================
     RESET WHEN MODAL OPENS
  ========================================================== */

  useEffect(
    () => {
      if (
        isOpen
      ) {
        setError(
          ""
        );

        setLoading(
          false
        );

        setShowPassword(
          false
        );
      }
    },
    [
      isOpen,
    ]
  );


  /* ==========================================================
     SUBMIT
  ========================================================== */

  const handleSubmit =
    async (
      event
    ) => {

      event.preventDefault();


      if (
        loading
      ) {
        return;
      }


      setError(
        ""
      );


      /* ------------------------------------------------------
         VALIDATE TOKEN
      ------------------------------------------------------ */

      if (
        !token
      ) {
        setError(
          "Document token is missing."
        );

        return;
      }


      /* ------------------------------------------------------
         NORMALIZE PASSWORD
      ------------------------------------------------------ */

      const verifiedPassword =
        tempPassword.trim();


      if (
        !verifiedPassword
      ) {
        setError(
          "Please enter the access code from your email."
        );

        return;
      }


      setLoading(
        true
      );


      try {

        /* ----------------------------------------------------
           SUPPORT BOTH MSA/WO AND OTHER DOCUMENT FLOWS

           apiServiceMethod allows Offer Letter or another
           signing workflow to reuse this modal.

           If nothing is provided, MSA/WO is used.
        ---------------------------------------------------- */

        const methodToCall =
          apiServiceMethod ||
          apiService
            .accessMSAandWO;


        if (
          typeof methodToCall !==
          "function"
        ) {
          throw new Error(
            "A required API function was not provided to the modal."
          );
        }


        /* ----------------------------------------------------
           VERIFY PASSWORD WITH BACKEND
        ---------------------------------------------------- */

        const response =
          await methodToCall(
            token,
            verifiedPassword
          );


        if (
          !response.data
            ?.success
        ) {
          throw new Error(
            response.data
              ?.message ||
            "Unable to access the document."
          );
        }


        const documentData =
          response.data
            ?.documentData;


        if (
          !documentData
        ) {
          throw new Error(
            "Access was granted but the server did not return document data."
          );
        }


        console.log(
          "[Secure Document Access] Access granted:",
          {
            token,

            contractNumber:
              documentData
                ?.contractNumber,

            vendorEmail:
              documentData
                ?.vendorEmail,

            hasVerifiedPassword:
              Boolean(
                verifiedPassword
              ),
          }
        );


        /* ====================================================
           CRITICAL FIX

           OLD:
           onAccessGranted(documentData)

           NEW:
           onAccessGranted(
             documentData,
             verifiedPassword
           )

           This allows MSAandWOSigningPage to keep the
           already-verified temporary password in React memory.

           The Vendor does NOT need to type it again when
           clicking Confirm & Sign.
        ==================================================== */

        if (
          typeof onAccessGranted ===
          "function"
        ) {
          onAccessGranted(
            documentData,
            verifiedPassword
          );
        }


        /*
         * IMPORTANT:
         *
         * Only clear the modal's local password AFTER the
         * parent has received it.
         *
         * The parent keeps its own React-memory copy.
         */
        setTempPassword(
          ""
        );


        setShowPassword(
          false
        );


        setError(
          ""
        );


        /*
         * Do NOT call onClose() here.
         *
         * MSAandWOSigningPage.handleAccessGranted()
         * already closes the AccessModal after it has safely
         * copied the password into its own state.
         *
         * This also preserves compatibility with the behavior
         * you intentionally fixed earlier.
         */


      } catch (
        err
      ) {

        console.error(
          "Error in AccessModal:",
          err
        );


        setError(
          err.response
            ?.data
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
     CLOSE
  ========================================================== */

  const handleClose =
    () => {

      if (
        loading
      ) {
        return;
      }


      setError(
        ""
      );


      setTempPassword(
        ""
      );


      setShowPassword(
        false
      );


      if (
        typeof onClose ===
        "function"
      ) {
        onClose();
      }
    };


  /* ==========================================================
     DO NOT RENDER
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

      onClose={
        handleClose
      }

      title=""

      size="md"
    >

      <div className="p-4 sm:p-6 flex flex-col items-center text-center">


        {/* ====================================================
            SECURITY ICON
        ==================================================== */}

        <div className="w-16 h-16 bg-blue-50/50 rounded-full flex items-center justify-center mb-6 border-[6px] border-blue-50 shadow-sm">

          <svg
            className="w-7 h-7 text-[#1473E6]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >

            <rect
              x="3"
              y="11"
              width="18"
              height="11"
              rx="2"
              ry="2"
            />


            <path
              d="M7 11V7a5 5 0 0 1 10 0v4"
            />

          </svg>

        </div>


        {/* ====================================================
            TITLE
        ==================================================== */}

        <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight mb-2">
          Secure Document Access
        </h2>


        <p className="text-sm text-gray-500 mb-8 max-w-sm leading-relaxed">

          A secure access code has been sent to{" "}

          <span className="font-semibold text-gray-800">
            {
              vendorEmail ||
              "your email"
            }
          </span>
          .

          {" "}

          Please enter it below to decrypt and view the document.

        </p>


        {/* ====================================================
            FORM
        ==================================================== */}

        <form
          onSubmit={
            handleSubmit
          }
          className="w-full max-w-sm flex flex-col items-center"
        >


          {/* ==================================================
              ERROR
          ================================================== */}

          {error && (

            <div className="w-full bg-red-50 border-l-4 border-red-500 p-3 rounded mb-6 text-sm text-red-700 text-left flex items-start shadow-sm">

              <svg
                className="w-5 h-5 mr-2 flex-shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
              >

                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />

              </svg>


              <span>
                {error}
              </span>

            </div>

          )}


          {/* ==================================================
              ACCESS CODE
          ================================================== */}

          <div className="w-full mb-6">

            <label
              htmlFor="tempPassword"
              className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2 text-left"
            >

              Access Code

              <span className="text-red-500">
                *
              </span>

            </label>


            <div className="relative">

              <input
                type={
                  showPassword
                    ? "text"
                    : "password"
                }

                name="tempPassword"

                id="tempPassword"

                value={
                  tempPassword
                }

                onChange={(
                  event
                ) => {

                  setTempPassword(
                    event
                      .target
                      .value
                  );


                  if (
                    error
                  ) {
                    setError(
                      ""
                    );
                  }

                }}

                required

                autoFocus

                autoComplete="one-time-code"

                placeholder="••••••••"

                disabled={
                  loading
                }

                className="block w-full border border-gray-300 rounded-lg shadow-inner py-3.5 px-4 pr-12 text-center text-xl tracking-widest text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#1473E6] focus:border-transparent transition-all disabled:bg-gray-50 disabled:cursor-not-allowed"
              />


              {/* ==============================================
                  SHOW / HIDE
              ============================================== */}

              <button
                type="button"

                onClick={() => {
                  setShowPassword(
                    (
                      previous
                    ) =>
                      !previous
                  );
                }}

                disabled={
                  loading
                }

                className="absolute inset-y-0 right-0 w-12 flex items-center justify-center text-gray-400 hover:text-gray-700 disabled:cursor-not-allowed"

                aria-label={
                  showPassword
                    ? "Hide access code"
                    : "Show access code"
                }
              >

                {showPassword ? (

                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >

                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M3 3l18 18M10.585 10.587a2 2 0 002.828 2.828M9.878 4.242A9.905 9.905 0 0112 4c5 0 9 8 9 8a15.94 15.94 0 01-2.174 3.258M6.61 6.61C4.33 8.155 3 12 3 12s4 8 9 8a9.8 9.8 0 004.39-1.025"
                    />

                  </svg>

                ) : (

                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >

                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />


                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />

                  </svg>

                )}

              </button>

            </div>

          </div>


          {/* ==================================================
              SUBMIT
          ================================================== */}

          <button
            type="submit"

            className="w-full px-4 py-3.5 bg-[#1473E6] text-white font-bold rounded-lg hover:bg-[#0d66d0] flex items-center justify-center shadow-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1473E6] disabled:bg-blue-400 disabled:cursor-not-allowed"

            disabled={
              loading ||
              !tempPassword
                .trim()
            }
          >

            {loading ? (

              <>
                <Spinner size="5" />

                <span className="ml-2">
                  Verifying...
                </span>
              </>

            ) : (

              "Decrypt & View Document"

            )}

          </button>


          {/* ==================================================
              CANCEL
          ================================================== */}

          <button
            type="button"

            onClick={
              handleClose
            }

            className="mt-4 text-sm font-medium text-gray-500 hover:text-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"

            disabled={
              loading
            }
          >
            Cancel
          </button>

        </form>

      </div>

    </Modal>
  );
};


export default AccessModal;