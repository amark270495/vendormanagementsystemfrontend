import axios from 'axios';

const API_BASE_URL = '/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const apiService = {
  // --- User & Auth Functions ---
  authenticateUser: (username, password) =>
    apiClient.post('/authenticateUser', { username, password }),
  changePassword: (targetUsername, newPassword, authenticatedUsername) =>
    apiClient.post('/changePassword', { targetUsername, newPassword, authenticatedUsername }),
  requestPasswordReset: (username) =>
    apiClient.post('/requestPasswordReset', { username }),
  getUsers: (authenticatedUsername) =>
    apiClient.get('/getUsers', { params: { authenticatedUsername } }),
  addUser: (userData, authenticatedUsername) =>
    apiClient.post('/addUser', { ...userData, authenticatedUsername }),
  updateUser: (originalUsername, userData, authenticatedUsername) =>
    apiClient.post('/updateUser', { originalUsername, userData, authenticatedUsername }),
  deleteUser: (usernameToDelete, authenticatedUsername) =>
    apiClient.post('/deleteUser', { usernameToDelete, authenticatedUsername }),

  // --- Job & Dashboard Functions ---
  getDashboardData: (sheetKey, authenticatedUsername) =>
    apiClient.get('/getDashboardData', { params: { sheetKey, authenticatedUsername } }),
  updateJobPosting: (updates, authenticatedUsername) =>
    apiClient.post('/updateJobPosting', { updates, authenticatedUsername }),
  updateJobStatus: (postingIds, newStatus, authenticatedUsername) =>
    apiClient.post('/updateJobStatus', { postingIds, newStatus, authenticatedUsername }),
  archiveOrDeleteJob: (postingIds, actionType, authenticatedUsername) =>
    apiClient.post('/archiveOrDeleteJob', { postingIds, actionType, authenticatedUsername }),
  saveUserDashboardPreferences: (authenticatedUsername, preferences) =>
    apiClient.post('/saveUserDashboardPreferences', { authenticatedUsername, preferences }),
  processJobPosting: (formData, authenticatedUsername) =>
    apiClient.post('/processJobPosting', { formData, authenticatedUsername }),

  // --- Candidate Functions ---
  addCandidateDetails: (candidateData, authenticatedUsername) =>
    apiClient.post('/addCandidateDetails', { candidateData, authenticatedUsername }),
  updateCandidateDetails: (originalEmail, candidateData, authenticatedUsername) =>
    apiClient.post('/updateCandidateDetails', { originalEmail, candidateData, authenticatedUsername }),
  getCandidateDetailsPageData: (authenticatedUsername) =>
    apiClient.get('/getCandidateDetailsPageData', { params: { authenticatedUsername } }),
  getCandidateDetail: (postingId, email, authenticatedUsername) =>
    apiClient.get('/getCandidateDetail', { params: { postingId, email, authenticatedUsername } }),

  // --- Report & Notification Functions ---
  getHomePageData: (authenticatedUsername) =>
    apiClient.get('/getHomePageData', { params: { authenticatedUsername } }),
  getReportData: (params) =>
    apiClient.get('/getReportData', { params }),
  generateAndSendJobReport: (sheetKey, statusFilter, toEmails, ccEmails, authenticatedUsername) =>
    apiClient.post('/generateAndSendJobReport', { sheetKey, statusFilter, toEmails, ccEmails, authenticatedUsername }),
  getNotifications: (authenticatedUsername) =>
    apiClient.get('/getNotifications', { params: { authenticatedUsername } }),
  markNotificationsAsRead: (notificationIds, authenticatedUsername) =>
    apiClient.post('/markNotificationsAsRead', { notificationIds, authenticatedUsername }),
  getMessages: (user1, user2, authenticatedUsername) =>
    apiClient.get('/getMessages', { params: { user1, user2, authenticatedUsername } }),
  saveMessage: (sender, recipient, messageContent, authenticatedUsername) =>
    apiClient.post('/saveMessage', { sender, recipient, messageContent, authenticatedUsername }),
  getUnreadMessages: (authenticatedUsername) =>
    apiClient.get('/getUnreadMessages', { params: { authenticatedUsername } }),
  markMessagesAsRead: (recipient, sender, authenticatedUsername) =>
    apiClient.post('/markMessagesAsRead', { recipient, sender, authenticatedUsername }),
  sendAssignmentEmail: (jobTitle, postingId, assignedUserDisplayName, authenticatedUsername) =>
    apiClient.post('/sendAssignmentEmail', { jobTitle, postingId, assignedUserDisplayName, authenticatedUsername }),

  // --- Permissions Functions ---
  getUserPermissionsList: (authenticatedUsername) =>
    apiClient.get('/getUserPermissionsList', { params: { authenticatedUsername } }),
  updateUserPermissions: (username, permissions, authenticatedUsername) =>
    apiClient.post('/updateUserPermissions', { username, permissions, authenticatedUsername }),

  // --- Timesheet & Company Functions ---
  createCompany: (companyData, authenticatedUsername) =>
    apiClient.post('/createCompany', { companyData, authenticatedUsername }),
  updateCompany: (originalCompanyName, updatedCompanyData, authenticatedUsername) =>
    apiClient.post('/updateCompany', { originalCompanyName, updatedCompanyData, authenticatedUsername }),
  deleteCompany: (companyNameToDelete, authenticatedUsername) =>
    apiClient.post('/deleteCompany', { companyNameToDelete, authenticatedUsername }),
  saveEmployeeLogHours: (timesheetData, authenticatedUsername) =>
    apiClient.post('/saveEmployeeLogHours', { timesheetData, authenticatedUsername }),
  getEmployeeLogHours: (params) =>
    apiClient.get('/getEmployeeLogHours', { params }),
  updateEmployeeLogHours: (originalRowKey, updatedTimesheetData, authenticatedUsername) =>
    apiClient.post('/updateEmployeeLogHours', { originalRowKey, updatedTimesheetData, authenticatedUsername }),
  deleteEmployeeLogHours: (partitionKey, rowKey, authenticatedUsername) =>
    apiClient.post('/deleteEmployeeLogHours', { partitionKey, rowKey, authenticatedUsername }),
  getCompanies: (authenticatedUsername) =>
    apiClient.get('/getCompanies', { params: { authenticatedUsername } }),
  createTimesheetEmployee: (employeeData, authenticatedUsername) =>
    apiClient.post('/createTimesheetEmployee', { employeeData, authenticatedUsername }),
  updateTimesheetEmployee: (originalEmployeeId, updatedEmployeeData, authenticatedUsername) =>
    apiClient.post('/updateTimesheetEmployee', { originalEmployeeId, updatedEmployeeData, authenticatedUsername }),
  deleteTimesheetEmployee: (employeeIdToDelete, authenticatedUsername) =>
    apiClient.post('/deleteTimesheetEmployee', { employeeIdToDelete, authenticatedUsername }),
  getTimesheetEmployees: (authenticatedUsername) =>
    apiClient.get('/getTimesheetEmployees', { params: { authenticatedUsername } }),
  sendTimesheetApprovalRequest: (employeeMail, employeeName, month, year, deadlineDate, companyName, authenticatedUsername) =>
    apiClient.post('/sendTimesheetApprovalRequest', { employeeMail, employeeName, month, year, deadlineDate, companyName, authenticatedUsername }),
  sendBulkTimesheetApprovalRequest: (employeeIds, month, year, deadlineDate, companyName, authenticatedUsername) =>
    apiClient.post('/sendBulkTimesheetApprovalRequest', { employeeIds, month, year, deadlineDate, companyName, authenticatedUsername }),

  // --- MSA and WO Functions ---
  createMSAWOVendorCompany: (companyData, authenticatedUsername) =>
    apiClient.post('/createMSAWOVendorCompany', { companyData, authenticatedUsername }),
  getMSAWOVendorCompanies: (authenticatedUsername) =>
    apiClient.get('/getMSAWOVendorCompanies', { params: { authenticatedUsername } }),
  updateMSAWOVendorCompany: (originalVendorName, vendorData, authenticatedUsername) => // Corrected parameter name
    apiClient.post('/updateMSAWOVendorCompany', { originalCompanyName: originalVendorName, updatedCompanyData: vendorData, authenticatedUsername }), // Use correct keys
  deleteMSAWOVendorCompany: (vendorNameToDelete, authenticatedUsername) => // Corrected parameter name
    apiClient.post('/deleteMSAWOVendorCompany', { companyNameToDelete: vendorNameToDelete, authenticatedUsername }), // Use correct key
  createMSAandWO: (formData, authenticatedUsername) =>
    apiClient.post('/createMSAandWO', { formData, authenticatedUsername }),
  getMSAandWODashboardData: (authenticatedUsername) =>
    apiClient.get('/getMSAandWODashboardData', { params: { authenticatedUsername } }),
  accessMSAandWO: (token, tempPassword) =>
    apiClient.post('/accessMSAandWO', { token, tempPassword }),
  getMSAandWODetailForSigning: (token, authenticatedUsername) =>
    apiClient.get('/getMSAandWODetailForSigning', { params: { token, authenticatedUsername } }),
  updateSigningStatus: (token, signerData, signerType, authenticatedUsername, jobInfo) =>
    apiClient.post('/updateSigningStatus', { token, signerData, signerType, authenticatedUsername, jobInfo }),
  getMSAandWODetail: (partitionKey, rowKey, authenticatedUsername) =>
    apiClient.get('/getMSAandWODetail', { params: { partitionKey, rowKey, authenticatedUsername } }),
  updateMSAandWO: (documentData, authenticatedUsername) =>
    apiClient.post('/updateMSAandWO', { documentData, authenticatedUsername }),
  deleteMSAandWO: (partitionKey, rowKey, authenticatedUsername) =>
    apiClient.post('/deleteMSAandWO', { partitionKey, rowKey, authenticatedUsername }),
  resendMSAWOEmail: (partitionKey, rowKey, authenticatedUsername) =>
    apiClient.post('/resendMSAWOEmail', { partitionKey, rowKey, authenticatedUsername }),

  // --- Offer Letter Functions ---
  createOfferLetter: (formData, authenticatedUsername) =>
    apiClient.post('/createOfferLetter', { formData, authenticatedUsername }),
  getOfferLetterDashboardData: (authenticatedUsername) =>
    apiClient.get('/getOfferLetterDashboardData', { params: { authenticatedUsername } }),
  deleteOfferLetter: (rowKey, authenticatedUsername, pdfUrl) => // Added pdfUrl
    apiClient.post('/deleteOfferLetter', { rowKey, authenticatedUsername, pdfUrl }), // Pass pdfUrl
  updateOfferLetter: (documentData, authenticatedUsername) => // Changed first param name
    apiClient.post('/updateOfferLetter', { documentData, authenticatedUsername }), // Use documentData key
  employeeSignIn: (token, tempPassword) =>
    apiClient.post('/employeeSignIn', { token, tempPassword }),
  updateOfferLetterStatus: (token, signerData) =>
    apiClient.post('/updateOfferLetterStatus', { token, signerData }),

  // --- Public Key Management ---
  savePublicKey: (authenticatedUsername, publicKey) =>
    apiClient.post('/savePublicKey', { authenticatedUsername, publicKey }),
  getPublicKey: (username, authenticatedUsername) =>
    apiClient.get('/getPublicKey', { params: { username, authenticatedUsername } }),

  // --- Attendance & Leave ---
  markAttendance: (attendanceData) => // Expects { authenticatedUsername, date, status }
    apiClient.post('/markAttendance', attendanceData),
  getAttendance: (params) => // Expects { authenticatedUsername, month?, year?, startDate?, endDate? }
    apiClient.get('/getAttendance', { params }),
  getHolidays: (params) => // Expects { authenticatedUsername, year? }
    apiClient.get('/getHolidays', { params }),
  manageHoliday: (holidayData, method = 'POST', authenticatedUsername) => { // Expects { date, description } for POST
    if (method === 'DELETE') {
      // For DELETE, Axios expects data in the 'data' field, and params for query string
      return apiClient.delete('/manageHoliday', {
          data: { date: holidayData.date, authenticatedUsername } // Send date and auth user in body
      });
    } else { // POST (Create/Update)
      return apiClient.post('/manageHoliday', { ...holidayData, authenticatedUsername });
    }
  },
  calculateMonthlyAttendance: (username, month, sendEmail = false, authenticatedUsername) =>
    apiClient.post('/calculateMonthlyAttendance', { username, month, sendEmail, authenticatedUsername }),
  requestLeave: (leaveData, authenticatedUsername) => // Expects { leaveType, startDate, endDate, reason }
    apiClient.post('/requestLeave', { ...leaveData, authenticatedUsername }),
  approveLeave: (approvalData, authenticatedUsername) => // Expects { requestId, requestUsername, action, approverComments? }
    apiClient.post('/approveLeave', { ...approvalData, authenticatedUsername }),

  // --- FIX: Corrected getLeaveConfig ---
  getLeaveConfig: (params) => // Expects { authenticatedUsername, targetUsername? }
    apiClient.get('/manageLeaveConfig', { params }), // Pass params directly
  // --- End FIX ---

  manageLeaveConfig: (configData, authenticatedUsername) => // Expects { targetUsername, sickLeave, casualLeave }
    apiClient.post('/manageLeaveConfig', { ...configData, authenticatedUsername }),
  getLeaveRequests: (params) => // Expects { authenticatedUsername, targetUsername?, statusFilter?, startDateFilter?, endDateFilter? }
    apiClient.get('/getLeaveRequests', { params }),

};