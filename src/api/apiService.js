// src/api/apiService.js

import axios from "axios";


/* ============================================================
   CONFIGURATION
============================================================ */

const API_BASE_URL = "/api";

const DEFAULT_API_TIMEOUT = 120000;


/* ============================================================
   AXIOS CLIENT
============================================================ */

const apiClient = axios.create({
  baseURL: API_BASE_URL,

  timeout: DEFAULT_API_TIMEOUT,

  headers: {
    "Content-Type": "application/json",
  },
});


/* ============================================================
   HELPERS
============================================================ */

const normalizeContinuationToken = (
  continuationToken
) => {
  if (!continuationToken) {
    return null;
  }

  if (
    typeof continuationToken ===
    "object"
  ) {
    return JSON.stringify(
      continuationToken
    );
  }

  return continuationToken;
};


/* ============================================================
   REQUEST INTERCEPTOR

   Inject authenticated VMS security context into every request.

   Backend verify_access() expects:

   x-user-email
   x-user-role
   x-user-permissions
============================================================ */

apiClient.interceptors.request.use(
  (config) => {
    try {
      const savedUser =
        localStorage.getItem(
          "vms_user"
        );

      if (savedUser) {
        const userData =
          JSON.parse(
            savedUser
          );


        /* ----------------------------------------------------
           USER EMAIL
        ---------------------------------------------------- */

        if (
          userData?.userIdentifier
        ) {
          config.headers[
            "x-user-email"
          ] =
            userData.userIdentifier;
        }


        /* ----------------------------------------------------
           USER ROLE
        ---------------------------------------------------- */

        if (
          userData?.userRole
        ) {
          config.headers[
            "x-user-role"
          ] =
            userData.userRole;
        }


        /* ----------------------------------------------------
           ACTIVE PERMISSIONS ONLY
        ---------------------------------------------------- */

        const activePermissions =
          Object.keys(
            userData.permissions ||
              {}
          ).filter(
            (key) =>
              userData
                .permissions[
                key
              ] === true
          );

        config.headers[
          "x-user-permissions"
        ] =
          JSON.stringify(
            activePermissions
          );
      }

    } catch (error) {
      console.error(
        "[API] Failed to attach VMS security headers:",
        error
      );
    }

    return config;
  },

  (error) =>
    Promise.reject(
      error
    )
);


/* ============================================================
   RESPONSE INTERCEPTOR
============================================================ */

apiClient.interceptors.response.use(
  (response) =>
    response,

  (error) => {
    if (
      error.code ===
      "ECONNABORTED"
    ) {
      console.error(
        "[API] Request timed out:",
        error.config?.url
      );
    }


    if (
      error.response
        ?.status === 401
    ) {
      console.warn(
        "[API] Unauthorized request:",
        error.config?.url,
        error.response?.data
      );
    }


    if (
      error.response
        ?.status === 403
    ) {
      console.warn(
        "[API] Forbidden request:",
        error.config?.url,
        error.response?.data
      );
    }


    if (
      error.response
        ?.status >= 500
    ) {
      console.error(
        "[API] Server error:",
        error.config?.url,
        error.response?.data
      );
    }


    return Promise.reject(
      error
    );
  }
);


/* ============================================================
   API SERVICE
============================================================ */

export const apiService = {


  /* ==========================================================
     USER & AUTHENTICATION
  ========================================================== */

  authenticateUser: (
    username,
    password
  ) =>
    apiClient.post(
      "/authenticateUser",
      {
        username,
        password,
      }
    ),


  changePassword: (
    targetUsername,
    newPassword,
    authenticatedUsername
  ) =>
    apiClient.post(
      "/changePassword",
      {
        targetUsername,
        newPassword,
        authenticatedUsername,
      }
    ),


  requestPasswordReset: (
    username
  ) =>
    apiClient.post(
      "/requestPasswordReset",
      {
        username,
      }
    ),


  getUsers: (
    args
  ) => {
    if (
      typeof args ===
      "string"
    ) {
      return apiClient.get(
        "/getUsers",
        {
          params: {
            authenticatedUsername:
              args,
          },
        }
      );
    }


    const safeParams = {
      ...(args || {}),
    };


    if (
      safeParams
        .continuationToken
    ) {
      safeParams
        .continuationToken =
        normalizeContinuationToken(
          safeParams
            .continuationToken
        );
    }


    return apiClient.get(
      "/getUsers",
      {
        params:
          safeParams,
      }
    );
  },


  addUser: (
    userData,
    authenticatedUsername
  ) =>
    apiClient.post(
      "/addUser",
      {
        ...userData,
        authenticatedUsername,
      }
    ),


  updateUser: (
    originalUsername,
    userData,
    authenticatedUsername
  ) =>
    apiClient.post(
      "/updateUser",
      {
        originalUsername,
        userData,
        authenticatedUsername,
      }
    ),


  deleteUser: (
    usernameToDelete,
    authenticatedUsername
  ) =>
    apiClient.post(
      "/deleteUser",
      {
        usernameToDelete,
        authenticatedUsername,
      }
    ),


  /* ==========================================================
     JOBS & DASHBOARDS
  ========================================================== */

  getDashboardData: (
    sheetKey,
    authenticatedUsername
  ) =>
    apiClient.get(
      "/getDashboardData",
      {
        params: {
          sheetKey,
          authenticatedUsername,
        },
      }
    ),


  updateJobPosting: (
    updates,
    authenticatedUsername
  ) =>
    apiClient.post(
      "/updateJobPosting",
      {
        updates,
        authenticatedUsername,
      }
    ),


  updateJobStatus: (
    postingIds,
    newStatus,
    authenticatedUsername
  ) => {
    const updates =
      postingIds.map(
        (id) => ({
          rowKey: id,

          changes: {
            status:
              newStatus,
          },
        })
      );


    return apiClient.post(
      "/updateJobPosting",
      {
        updates,
        authenticatedUsername,
      }
    );
  },


  archiveOrDeleteJob: (
    postingIds,
    actionType,
    authenticatedUsername
  ) =>
    apiClient.post(
      "/archiveOrDeleteJob",
      {
        postingIds,
        actionType,
        authenticatedUsername,
      }
    ),


  saveUserDashboardPreferences: (
    authenticatedUsername,
    preferences
  ) =>
    apiClient.post(
      "/saveUserDashboardPreferences",
      {
        authenticatedUsername,
        preferences,
      }
    ),


  processJobPosting: (
    formData,
    authenticatedUsername
  ) =>
    apiClient.post(
      "/processJobPosting",
      {
        formData,
        authenticatedUsername,
      }
    ),


  /* ==========================================================
     CANDIDATES
  ========================================================== */

  addCandidateDetails: (
    candidateData,
    authenticatedUsername
  ) =>
    apiClient.post(
      "/addCandidateDetails",
      {
        candidateData,
        authenticatedUsername,
      }
    ),


  updateCandidateDetails: (
    originalEmail,
    candidateData,
    authenticatedUsername
  ) =>
    apiClient.post(
      "/updateCandidateDetails",
      {
        originalEmail,
        candidateData,
        authenticatedUsername,
      }
    ),


  getCandidateDetailsPageData: (
    authenticatedUsername
  ) =>
    apiClient.get(
      "/getCandidateDetailsPageData",
      {
        params: {
          authenticatedUsername,
        },
      }
    ),


  getCandidateDetail: (
    postingId,
    email,
    authenticatedUsername
  ) =>
    apiClient.get(
      "/getCandidateDetail",
      {
        params: {
          postingId,
          email,
          authenticatedUsername,
        },
      }
    ),


  /* ==========================================================
     BENCH SALES
  ========================================================== */

  addBenchCandidate: (
    candidateData,
    authenticatedUsername
  ) =>
    apiClient.post(
      "/addBenchCandidate",
      {
        candidateData,
        authenticatedUsername,
      }
    ),


  updateBenchCandidate: (
    rowKey,
    updateData,
    authenticatedUsername
  ) =>
    apiClient.post(
      "/updateBenchCandidate",
      {
        rowKey,
        updateData,
        authenticatedUsername,
      }
    ),


  deleteBenchCandidate: (
    rowKey,
    authenticatedUsername
  ) =>
    apiClient.post(
      "/deleteBenchCandidate",
      {
        rowKey,
        authenticatedUsername,
      }
    ),


  getBenchCandidates: (
    authenticatedUsername
  ) =>
    apiClient.get(
      "/getBenchCandidates",
      {
        params: {
          authenticatedUsername,
        },
      }
    ),


  /* ==========================================================
     REPORTS
  ========================================================== */

  getHomePageData: (
    authenticatedUsername
  ) =>
    apiClient.get(
      "/getHomePageData",
      {
        params: {
          authenticatedUsername,
        },
      }
    ),


  getReportData: (
    params
  ) =>
    apiClient.get(
      "/getReportData",
      {
        params,
      }
    ),


  getPowerBIData: (
    params
  ) =>
    apiClient.get(
      "/getPowerBIData",
      {
        params,
      }
    ),


  getReportsAnalytics: (
    params
  ) =>
    apiClient.get(
      "/getReportsAnalytics",
      {
        params,
      }
    ),


  generateAndSendJobReport: (
    sheetKey,
    statusFilter,
    toEmails,
    ccEmails,
    authenticatedUsername
  ) =>
    apiClient.post(
      "/generateAndSendJobReport",
      {
        sheetKey,
        statusFilter,
        toEmails,
        ccEmails,
        authenticatedUsername,
      }
    ),


  /* ==========================================================
     NOTIFICATIONS
  ========================================================== */

  getNotifications: (
    authenticatedUsername
  ) =>
    apiClient.get(
      "/getNotifications",
      {
        params: {
          authenticatedUsername,
        },
      }
    ),


  markNotificationsAsRead: (
    notificationIds,
    authenticatedUsername
  ) =>
    apiClient.post(
      "/markNotificationsAsRead",
      {
        notificationIds,
        authenticatedUsername,
      }
    ),


  /* ==========================================================
     MESSAGING
  ========================================================== */

  getMessages: (
    user1,
    user2,
    authenticatedUsername
  ) =>
    apiClient.get(
      "/getMessages",
      {
        params: {
          user1,
          user2,
          authenticatedUsername,
        },
      }
    ),


  saveMessage: (
    sender,
    recipient,
    messageContent,
    authenticatedUsername
  ) =>
    apiClient.post(
      "/saveMessage",
      {
        sender,
        recipient,
        messageContent,
        authenticatedUsername,
      }
    ),


  getUnreadMessages: (
    authenticatedUsername
  ) =>
    apiClient.get(
      "/getUnreadMessages",
      {
        params: {
          authenticatedUsername,
        },
      }
    ),


  markMessagesAsRead: (
    recipient,
    sender,
    authenticatedUsername
  ) =>
    apiClient.post(
      "/markMessagesAsRead",
      {
        recipient,
        sender,
        authenticatedUsername,
      }
    ),


  sendAssignmentEmail: ({
    jobTitle,
    postingId,
    assignedUsers,
    authenticatedUsername,
  }) =>
    apiClient.post(
      "/sendAssignmentEmail",
      {
        jobTitle,
        postingId,
        assignedUsers,
        authenticatedUsername,
      }
    ),


  /* ==========================================================
     USER PERMISSIONS
  ========================================================== */

  getUserPermissionsList: (
    authenticatedUsername
  ) =>
    apiClient.get(
      "/getUserPermissionsList",
      {
        params: {
          authenticatedUsername,
        },
      }
    ),


  updateUserPermissions: (
    username,
    permissions,
    authenticatedUsername
  ) =>
    apiClient.post(
      "/updateUserPermissions",
      {
        username,
        permissions,
        authenticatedUsername,
      }
    ),


  /* ==========================================================
     TIMESHEET COMPANIES
  ========================================================== */

  createCompany: (
    companyData,
    authenticatedUsername
  ) =>
    apiClient.post(
      "/createCompany",
      {
        companyData,
        authenticatedUsername,
      }
    ),


  updateCompany: (
    originalCompanyName,
    updatedCompanyData,
    authenticatedUsername
  ) =>
    apiClient.post(
      "/updateCompany",
      {
        originalCompanyName,
        updatedCompanyData,
        authenticatedUsername,
      }
    ),


  deleteCompany: (
    companyNameToDelete,
    authenticatedUsername
  ) =>
    apiClient.post(
      "/deleteCompany",
      {
        companyNameToDelete,
        authenticatedUsername,
      }
    ),


  /* ==========================================================
     TIMESHEET LOG HOURS
  ========================================================== */

  saveEmployeeLogHours: (
    timesheetData,
    authenticatedUsername
  ) =>
    apiClient.post(
      "/saveEmployeeLogHours",
      {
        timesheetData,
        authenticatedUsername,
      }
    ),


  getEmployeeLogHours: (
    params
  ) =>
    apiClient.get(
      "/getEmployeeLogHours",
      {
        params,
      }
    ),


  updateEmployeeLogHours: (
    originalRowKey,
    updatedTimesheetData,
    authenticatedUsername
  ) =>
    apiClient.post(
      "/updateEmployeeLogHours",
      {
        originalRowKey,
        updatedTimesheetData,
        authenticatedUsername,
      }
    ),


  deleteEmployeeLogHours: (
    partitionKey,
    rowKey,
    authenticatedUsername
  ) =>
    apiClient.post(
      "/deleteEmployeeLogHours",
      {
        partitionKey,
        rowKey,
        authenticatedUsername,
      }
    ),


  getCompanies: (
    authenticatedUsername
  ) =>
    apiClient.get(
      "/getCompanies",
      {
        params: {
          authenticatedUsername,
        },
      }
    ),


  /* ==========================================================
     TIMESHEET EMPLOYEES
  ========================================================== */

  createTimesheetEmployee: (
    employeeData,
    authenticatedUsername
  ) =>
    apiClient.post(
      "/createTimesheetEmployee",
      {
        employeeData,
        authenticatedUsername,
      }
    ),


  updateTimesheetEmployee: (
    originalEmployeeId,
    updatedEmployeeData,
    authenticatedUsername
  ) =>
    apiClient.post(
      "/updateTimesheetEmployee",
      {
        originalEmployeeId,
        updatedEmployeeData,
        authenticatedUsername,
      }
    ),


  deleteTimesheetEmployee: (
    employeeIdToDelete,
    authenticatedUsername
  ) =>
    apiClient.post(
      "/deleteTimesheetEmployee",
      {
        employeeIdToDelete,
        authenticatedUsername,
      }
    ),


  getTimesheetEmployees: (
    authenticatedUsername
  ) =>
    apiClient.get(
      "/getTimesheetEmployees",
      {
        params: {
          authenticatedUsername,
        },
      }
    ),


  /* ==========================================================
     TIMESHEET APPROVAL REQUESTS
  ========================================================== */

  sendTimesheetApprovalRequest: (
    employeeMail,
    employeeName,
    month,
    year,
    deadlineDate,
    companyName,
    authenticatedUsername
  ) =>
    apiClient.post(
      "/sendTimesheetApprovalRequest",
      {
        employeeMail,
        employeeName,
        month,
        year,
        deadlineDate,
        companyName,
        authenticatedUsername,
      }
    ),


  sendBulkTimesheetApprovalRequest: (
    employeeIds,
    month,
    year,
    deadlineDate,
    companyName,
    authenticatedUsername
  ) =>
    apiClient.post(
      "/sendBulkTimesheetApprovalRequest",
      {
        employeeIds,
        month,
        year,
        deadlineDate,
        companyName,
        authenticatedUsername,
      }
    ),


  /* ==========================================================
     MSA / WORK ORDER - VENDOR COMPANY
  ========================================================== */

  createMSAWOVendorCompany: (
    companyData,
    authenticatedUsername
  ) =>
    apiClient.post(
      "/createMSAWOVendorCompany",
      {
        companyData,
        authenticatedUsername,
      }
    ),


  getMSAWOVendorCompanies: (
    authenticatedUsername,
    pageSize = 100,
    continuationToken = null
  ) => {
    const safeToken =
      normalizeContinuationToken(
        continuationToken
      );


    return apiClient.get(
      "/getMSAWOVendorCompanies",
      {
        params: {
          authenticatedUsername,

          pageSize,

          ...(safeToken
            ? {
                continuationToken:
                  safeToken,
              }
            : {}),
        },
      }
    );
  },


  updateMSAWOVendorCompany: (
    originalVendorName,
    vendorData,
    authenticatedUsername
  ) =>
    apiClient.post(
      "/updateMSAWOVendorCompany",
      {
        originalCompanyName:
          originalVendorName,

        updatedCompanyData:
          vendorData,

        authenticatedUsername,
      }
    ),


  deleteMSAWOVendorCompany: (
    vendorNameToDelete,
    authenticatedUsername
  ) =>
    apiClient.post(
      "/deleteMSAWOVendorCompany",
      {
        companyNameToDelete:
          vendorNameToDelete,

        authenticatedUsername,
      }
    ),


  /* ==========================================================
     MSA / WORK ORDER - CREATE
  ========================================================== */

  createMSAandWO: (
    formData,
    authenticatedUsername
  ) =>
    apiClient.post(
      "/createMSAandWO",

      {
        formData,
        authenticatedUsername,
      },

      {
        /*
         * PDF decoding + Blob upload + Table creation +
         * email can take longer than normal API calls.
         */
        timeout:
          120000,
      }
    ),


  /* ==========================================================
     MSA / WORK ORDER - DASHBOARD
  ========================================================== */

  getMSAandWODashboardData: (
    authenticatedUsername,
    pageSize = 50,
    continuationToken = null
  ) => {
    const safeToken =
      normalizeContinuationToken(
        continuationToken
      );


    return apiClient.get(
      "/getMSAandWODashboardData",
      {
        params: {
          authenticatedUsername,

          pageSize,

          ...(safeToken
            ? {
                continuationToken:
                  safeToken,
              }
            : {}),
        },
      }
    );
  },


  /* ==========================================================
     MSA / WORK ORDER - DOCUMENT URL
  ========================================================== */

  getMSADocumentUrl: (
    partitionKey,
    rowKey,
    authenticatedUsername
  ) =>
    apiClient.get(
      "/getMSADocumentUrl",
      {
        params: {
          partitionKey,
          rowKey,
          authenticatedUsername,
        },
      }
    ),


  /* ==========================================================
     MSA / WORK ORDER - VENDOR ACCESS
  ========================================================== */

  accessMSAandWO: (
    token,
    tempPassword
  ) =>
    apiClient.post(
      "/accessMSAandWO",
      {
        token,
        tempPassword,
      }
    ),


  /* ==========================================================
     MSA / WORK ORDER - INTERNAL SIGNING DETAIL
  ========================================================== */

  getMSAandWODetailForSigning: (
    token,
    authenticatedUsername
  ) =>
    apiClient.get(
      "/getMSAandWODetailForSigning",
      {
        params: {
          token,
          authenticatedUsername,
        },
      }
    ),


  /* ==========================================================
     MSA / WORK ORDER - VENDOR SIGNING

     Vendor authentication model:

       signing token
       +
       temporary password
       +
       signature

     Temporary password is verified by backend again during
     the signing operation.
  ========================================================== */

  updateVendorSigningStatus: (
    token,
    tempPassword,
    signerData
  ) => {
    if (!token) {
      return Promise.reject(
        new Error(
          "Signing token is required."
        )
      );
    }


    if (!tempPassword) {
      return Promise.reject(
        new Error(
          "Temporary signing password is required."
        )
      );
    }


    if (
      !signerData ||
      typeof signerData !==
        "object"
    ) {
      return Promise.reject(
        new Error(
          "Vendor signer information is required."
        )
      );
    }


    return apiClient.post(
      "/updateSigningStatus",
      {
        token,

        tempPassword,

        signerData,

        signerType:
          "vendor",

        /*
         * Vendor is external.
         * Backend must NOT use this value for authorization.
         */
        authenticatedUsername:
          null,

        jobInfo:
          null,
      }
    );
  },


  /* ==========================================================
     MSA / WORK ORDER - TAPROOT SIGNING

     Internal signer authentication model:

       authenticated VMS session
       +
       canManageMSAWO
       +
       VMS password inside signerData.password
       +
       signature

     Backend verify_access() gets the authenticated user from
     request headers.

     Backend service then verifies signerData.password.
  ========================================================== */

  updateTaprootSigningStatus: (
    token,
    signerData,
    authenticatedUsername = null,
    jobInfo = null
  ) => {
    if (!token) {
      return Promise.reject(
        new Error(
          "Signing token is required."
        )
      );
    }


    if (
      !signerData ||
      typeof signerData !==
        "object"
    ) {
      return Promise.reject(
        new Error(
          "Taproot signer information is required."
        )
      );
    }


    return apiClient.post(
      "/updateSigningStatus",
      {
        token,

        tempPassword:
          null,

        signerData,

        signerType:
          "taproot",

        authenticatedUsername,

        jobInfo,
      }
    );
  },


  /* ==========================================================
     MSA / WORK ORDER - GENERIC SIGNING

     BACKWARD COMPATIBILITY ONLY.

     New pages should use:

       updateVendorSigningStatus()

     or

       updateTaprootSigningStatus()

     This method remains so older components do not break.
  ========================================================== */

  updateSigningStatus: (
    token,
    signerData,
    signerType,
    authenticatedUsername = null,
    jobInfo = null,
    tempPassword = null
  ) => {
    const normalizedSignerType =
      String(
        signerType ||
          ""
      )
        .trim()
        .toLowerCase();


    if (
      normalizedSignerType ===
      "vendor"
    ) {
      return apiService
        .updateVendorSigningStatus(
          token,
          tempPassword,
          signerData
        );
    }


    if (
      normalizedSignerType ===
      "taproot"
    ) {
      return apiService
        .updateTaprootSigningStatus(
          token,
          signerData,
          authenticatedUsername,
          jobInfo
        );
    }


    return Promise.reject(
      new Error(
        `Unsupported signer type: ${String(
          signerType
        )}`
      )
    );
  },


  /* ==========================================================
     MSA / WORK ORDER - DETAIL
  ========================================================== */

  getMSAandWODetail: (
    partitionKey,
    rowKey,
    authenticatedUsername
  ) =>
    apiClient.get(
      "/getMSAandWODetail",
      {
        params: {
          partitionKey,
          rowKey,
          authenticatedUsername,
        },
      }
    ),


  /* ==========================================================
     MSA / WORK ORDER - UPDATE
  ========================================================== */

  updateMSAandWO: (
    documentData,
    authenticatedUsername
  ) =>
    apiClient.post(
      "/updateMSAandWO",
      {
        documentData,
        authenticatedUsername,
      }
    ),


  /* ==========================================================
     MSA / WORK ORDER - DELETE
  ========================================================== */

  deleteMSAandWO: (
    partitionKey,
    rowKey,
    authenticatedUsername
  ) =>
    apiClient.post(
      "/deleteMSAandWO",
      {
        partitionKey,
        rowKey,
        authenticatedUsername,
      }
    ),


  /* ==========================================================
     MSA / WORK ORDER - RESEND
  ========================================================== */

  resendMSAWOEmail: (
    partitionKey,
    rowKey,
    authenticatedUsername
  ) =>
    apiClient.post(
      "/resendMSAWOEmail",
      {
        partitionKey,
        rowKey,
        authenticatedUsername,
      }
    ),


  /* ==========================================================
     OFFER LETTERS
  ========================================================== */

  createOfferLetter: (
    payload
  ) =>
    apiClient.post(
      "/createOfferLetter",
      payload
    ),


  getOfferLetterDashboardData: (
    authenticatedUsername
  ) =>
    apiClient.get(
      "/getOfferLetterDashboardData",
      {
        params: {
          authenticatedUsername,
        },
      }
    ),


  deleteOfferLetter: (
    rowKey,
    authenticatedUsername,
    pdfUrl
  ) =>
    apiClient.post(
      "/deleteOfferLetter",
      {
        rowKey,
        authenticatedUsername,
        pdfUrl,
      }
    ),


  updateOfferLetter: (
    documentData,
    authenticatedUsername
  ) =>
    apiClient.post(
      "/updateOfferLetter",
      {
        documentData,
        authenticatedUsername,
      }
    ),


  employeeSignIn: (
    token,
    tempPassword
  ) =>
    apiClient.post(
      "/employeeSignIn",
      {
        token,
        tempPassword,
      }
    ),


  updateOfferLetterStatus: (
    token,
    signerData
  ) =>
    apiClient.post(
      "/updateOfferLetterStatus",
      {
        token,
        signerData,
      }
    ),


  resendOfferLetter: (
    rowKey,
    authenticatedUsername
  ) =>
    apiClient.post(
      "/resendOfferLetter",
      {
        rowKey,
        authenticatedUsername,
      }
    ),


  /* ==========================================================
     PUBLIC KEY MANAGEMENT
  ========================================================== */

  savePublicKey: (
    authenticatedUsername,
    publicKey
  ) =>
    apiClient.post(
      "/savePublicKey",
      {
        authenticatedUsername,
        publicKey,
      }
    ),


  getPublicKey: (
    username,
    authenticatedUsername
  ) =>
    apiClient.get(
      "/getPublicKey",
      {
        params: {
          username,
          authenticatedUsername,
        },
      }
    ),


  /* ==========================================================
     ATTENDANCE
  ========================================================== */

  markAttendance: (
    attendanceData
  ) =>
    apiClient.post(
      "/markAttendance",
      attendanceData
    ),


  approveAttendance: (
    payload
  ) =>
    apiClient.post(
      "/approveAttendance",
      payload
    ),


  getAttendance: (
    params
  ) => {
    const safeParams = {
      ...(params || {}),
    };


    if (
      safeParams
        .continuationToken
    ) {
      safeParams
        .continuationToken =
        normalizeContinuationToken(
          safeParams
            .continuationToken
        );
    }


    return apiClient.get(
      "/getAttendance",
      {
        params:
          safeParams,
      }
    );
  },


  /* ==========================================================
     WEEKEND WORK
  ========================================================== */

  requestWeekendWork: (
    requestData
  ) =>
    apiClient.post(
      "/requestWeekendWork",
      requestData
    ),


  approveWeekendWork: (
    approvalData
  ) =>
    apiClient.post(
      "/approveWeekendWork",
      approvalData
    ),


  getWeekendWorkRequests: (
    params
  ) => {
    const safeParams = {
      ...(params || {}),
    };


    if (
      safeParams
        .continuationToken
    ) {
      safeParams
        .continuationToken =
        normalizeContinuationToken(
          safeParams
            .continuationToken
        );
    }


    return apiClient.get(
      "/getWeekendWorkRequests",
      {
        params:
          safeParams,
      }
    );
  },


  /* ==========================================================
     HOLIDAYS
  ========================================================== */

  getHolidays: (
    params
  ) =>
    apiClient.get(
      "/getHolidays",
      {
        params,
      }
    ),


  manageHoliday: (
    holidayData,
    method = "POST",
    authenticatedUsername
  ) => {
    if (
      method ===
      "DELETE"
    ) {
      return apiClient.delete(
        "/manageHoliday",
        {
          data: {
            ...holidayData,
            authenticatedUsername,
          },
        }
      );
    }


    return apiClient.post(
      "/manageHoliday",
      {
        ...holidayData,
        authenticatedUsername,
      }
    );
  },


  /* ==========================================================
     MONTHLY ATTENDANCE REPORT
  ========================================================== */

  calculateMonthlyAttendance: (
    params
  ) =>
    apiClient.get(
      "/calculateMonthlyAttendance",
      {
        params,
      }
    ),


  sendConsolidatedReport: (
    payload
  ) =>
    apiClient.post(
      "/sendConsolidatedReport",
      payload
    ),


  /* ==========================================================
     LEAVE MANAGEMENT
  ========================================================== */

  requestLeave: (
    leaveData,
    authenticatedUsername
  ) =>
    apiClient.post(
      "/requestLeave",
      {
        ...leaveData,
        authenticatedUsername,
      }
    ),


  approveLeave: (
    approvalData
  ) =>
    apiClient.post(
      "/approveLeave",
      approvalData
    ),


  getLeaveConfig: (
    params
  ) =>
    apiClient.get(
      "/manageLeaveConfig",
      {
        params,
      }
    ),


  manageLeaveConfig: (
    configData,
    authenticatedUsername
  ) =>
    apiClient.post(
      "/manageLeaveConfig",
      {
        ...configData,
        authenticatedUsername,
      }
    ),


  getLeaveRequests: (
    params
  ) =>
    apiClient.get(
      "/getLeaveRequests",
      {
        params,
      }
    ),


  /* ==========================================================
     ASSET MANAGEMENT
  ========================================================== */

  createAsset: (
    assetData,
    authenticatedUsername
  ) =>
    apiClient.post(
      "/createAsset",
      {
        ...assetData,
        authenticatedUsername,
      }
    ),


  getAssets: (
    authenticatedUsername,
    assetId = null
  ) =>
    apiClient.get(
      "/getAssets",
      {
        params: {
          authenticatedUsername,
          assetId,
        },
      }
    ),


  updateAsset: (
    assetId,
    assetData,
    authenticatedUsername
  ) =>
    apiClient.post(
      "/updateAsset",

      {
        ...assetData,
        authenticatedUsername,
      },

      {
        params: {
          assetId,
        },
      }
    ),


  deleteAsset: (
    assetId,
    authenticatedUsername
  ) =>
    apiClient.delete(
      "/deleteAsset",
      {
        data: {
          authenticatedUsername,
        },

        params: {
          assetId,
        },
      }
    ),


  assignAsset: (
    assignmentData,
    authenticatedUsername
  ) =>
    apiClient.post(
      "/assignAsset",
      {
        ...assignmentData,
        authenticatedUsername,
      }
    ),


  serviceRepairAsset: (
    serviceData,
    authenticatedUsername
  ) =>
    apiClient.post(
      "/serviceRepairAsset",
      {
        ...serviceData,
        authenticatedUsername,
      }
    ),


  reassignAsset: (
    reassignData,
    authenticatedUsername
  ) =>
    apiClient.post(
      "/reassignAsset",
      {
        ...reassignData,
        authenticatedUsername,
      }
    ),


  getUserTrackingLogs: (
    targetUser,
    date,
    authenticatedUsername
  ) =>
    apiClient.get(
      "/getUserTrackingLogs",
      {
        params: {
          targetUser,
          date,
          authenticatedUsername,
        },
      }
    ),


  getAssetSessions: (
    assetId,
    date,
    authenticatedUsername
  ) =>
    apiClient.get(
      "/getAssetSessions",
      {
        params: {
          assetId,
          date,
          authenticatedUsername,
        },
      }
    ),


  logAssetSession: (
    sessionData,
    authenticatedUsername
  ) =>
    apiClient.post(
      "/logAssetSession",
      {
        ...sessionData,
        authenticatedUsername,
      }
    ),


  /* ==========================================================
     ADVANCED ASSET TOOLS
  ========================================================== */

  bulkImportAssets: (
    formData,
    authenticatedUsername
  ) =>
    apiClient.post(
      "/bulkImportAssets",

      formData,

      {
        headers: {
          /*
           * Do not manually specify multipart/form-data.
           * Axios/browser must generate the boundary.
           */
          "x-authenticated-username":
            authenticatedUsername,
        },
      }
    ),


  getAssetAuditTrail: (
    assetId,
    authenticatedUsername
  ) =>
    apiClient.get(
      "/getAssetAuditTrail",
      {
        params: {
          assetId,
          authenticatedUsername,
        },
      }
    ),


  getFleetUtilizationStats: (
    authenticatedUsername
  ) =>
    apiClient.get(
      "/getFleetUtilizationStats",
      {
        params: {
          authenticatedUsername,
        },
      }
    ),
};


/* ============================================================
   EXPORT
============================================================ */

export default apiService;