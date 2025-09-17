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

  getUnreadMessages: (authenticatedUsername) =>
    apiClient.get('/getUnreadMessages', { params: { authenticatedUsername } }),

  getMessages: (user1, user2, authenticatedUsername) =>
    apiClient.get('/getMessages', { params: { user1, user2, authenticatedUsername } }),

  saveMessage: (sender, recipient, messageContent, authenticatedUsername) =>
    apiClient.post('/saveMessage', { sender, recipient, messageContent, authenticatedUsername }),

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

  // --- MSA & WO Vendor Company Management ---
  createMSAWOVendorCompany: (companyData, authenticatedUsername) =>
    apiClient.post('/createMSAWOVendorCompany', { companyData, authenticatedUsername }),

  getMSAWOVendorCompanies: (authenticatedUsername) =>
    apiClient.get('/getMSAWOVendorCompanies', { params: { authenticatedUsername } }),

  updateMSAWOVendorCompany: (originalVendorName, companyData, authenticatedUsername) =>
    apiClient.post('/updateMSAWOVendorCompany', { originalVendorName, companyData, authenticatedUsername }),

  deleteMSAWOVendorCompany: (vendorNameToDelete, authenticatedUsername) =>
    apiClient.post('/deleteMSAWOVendorCompany', { vendorNameToDelete, authenticatedUsername }),

  // --- MSA and WO e-signing project API calls ---
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

  // --- Offer Letter Management ---
  createOfferLetter: (formData, authenticatedUsername) =>
    apiClient.post('/createOfferLetter', { formData, authenticatedUsername }),

  getOfferLetterDashboardData: (authenticatedUsername) =>
    apiClient.get('/getOfferLetterDashboardData', { params: { authenticatedUsername } }),
    
  updateOfferLetter: (documentData, authenticatedUsername) =>
    apiClient.post('/updateOfferLetter', { documentData, authenticatedUsername }),

  deleteOfferLetter: (rowKey, pdfUrl, authenticatedUsername) =>
    apiClient.post('/deleteOfferLetter', { rowKey, pdfUrl, authenticatedUsername }),
};