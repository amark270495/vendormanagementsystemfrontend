// src/api/apiService.js

import axios from "axios";


const API_BASE_URL =
  "/api";


/* ============================================================
   AXIOS CLIENT
============================================================ */

const apiClient =
  axios.create({
    baseURL:
      API_BASE_URL,

    /*
     * Prevent requests such as SMTP/Blob-backed document
     * creation from remaining pending forever in the UI.
     */
    timeout:
      120000,

    headers: {
      "Content-Type":
        "application/json",
    },
  });


/* ============================================================
   REQUEST INTERCEPTOR
   Inject authenticated VMS context into every request.
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

        /*
         * Headers expected by backend verifyAccess().
         */
        if (
          userData
            ?.userIdentifier
        ) {
          config.headers[
            "x-user-email"
          ] =
            userData.userIdentifier;
        }

        if (
          userData
            ?.userRole
        ) {
          config.headers[
            "x-user-role"
          ] =
            userData.userRole;
        }

        /*
         * Only send permissions that are TRUE.
         */
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
    } catch (err) {
      console.error(
        "Critical: Failed to attach security headers to API request",
        err
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

   Helpful specifically for document requests where a network,
   Function, or SMTP timeout can otherwise be difficult to see.
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
     USER & AUTH
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

    /*
     * Azure continuation tokens can be structured objects.
     * Never allow Axios to serialize them as [object Object].
     */
    if (
      safeParams.continuationToken &&
      typeof safeParams.continuationToken ===
        "object"
    ) {
      safeParams.continuationToken =
        JSON.stringify(
          safeParams.continuationToken
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
          rowKey:
            id,

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
     REPORTS / NOTIFICATIONS / COMMUNICATION
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
     PERMISSIONS
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
     TIMESHEETS / COMPANY
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
     MSA / WORK ORDER
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
  ) =>
    apiClient.get(
      "/getMSAWOVendorCompanies",
      {
        params: {
          authenticatedUsername,
          pageSize,

          ...(continuationToken
            ? {
                continuationToken:
                  typeof continuationToken ===
                  "object"
                    ? JSON.stringify(
                        continuationToken
                      )
                    : continuationToken,
              }
            : {}),
        },
      }
    ),


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


  /*
   * IMPORTANT:
   *
   * Frontend performs seven-page html2pdf generation BEFORE
   * this call.
   *
   * Once here, this request covers:
   *
   * PDF validation
   * Blob upload
   * Azure Table creation
   * signing-token creation
   * initial email
   */
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
        timeout:
          120000,
      }
    ),


  getMSAandWODashboardData: (
    authenticatedUsername,
    pageSize = 50,
    continuationToken = null
  ) =>
    apiClient.get(
      "/getMSAandWODashboardData",
      {
        params: {
          authenticatedUsername,
          pageSize,

          ...(continuationToken
            ? {
                continuationToken:
                  typeof continuationToken ===
                  "object"
                    ? JSON.stringify(
                        continuationToken
                      )
                    : continuationToken,
              }
            : {}),
        },
      }
    ),


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


  /*
   * Existing argument order preserved:
   *
   * token
   * signerData
   * signerType
   * authenticatedUsername
   * jobInfo
   * tempPassword
   *
   * Vendor signing MUST now provide tempPassword.
   */
  updateSigningStatus: (
    token,
    signerData,
    signerType,
    authenticatedUsername = null,
    jobInfo = null,
    tempPassword = null
  ) => {
    /*
     * Backward-friendly vendor handling:
     *
     * If an older caller supplied the temp password as the
     * old fifth argument and it is a string, use it.
     */
    let resolvedJobInfo =
      jobInfo;

    let resolvedTempPassword =
      tempPassword;

    if (
      signerType ===
        "vendor" &&
      !resolvedTempPassword &&
      typeof jobInfo ===
        "string"
    ) {
      resolvedTempPassword =
        jobInfo;

      resolvedJobInfo =
        null;
    }

    return apiClient.post(
      "/updateSigningStatus",
      {
        token,
        signerData,
        signerType,
        authenticatedUsername,

        jobInfo:
          resolvedJobInfo,

        tempPassword:
          resolvedTempPassword,
      }
    );
  },


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
     PUBLIC KEYS
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
     ATTENDANCE / LEAVE
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
      safeParams.continuationToken &&
      typeof safeParams.continuationToken ===
        "object"
    ) {
      safeParams.continuationToken =
        JSON.stringify(
          safeParams.continuationToken
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
      safeParams.continuationToken &&
      typeof safeParams.continuationToken ===
        "object"
    ) {
      safeParams.continuationToken =
        JSON.stringify(
          safeParams.continuationToken
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


export default apiService;