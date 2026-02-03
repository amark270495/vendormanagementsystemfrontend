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
  
  // ✅ FIXED: Updated to correctly spread the payload object to the root of the request body
  sendAssignmentEmail: (payload, authenticatedUsername) =>
    apiClient.post('/sendAssignmentEmail', { ...payload, authenticatedUsername }),

  // --- Permissions Functions ---
  getUserPermissionsList: (authenticatedUsername) =>
    apiClient.get('/getUserPermissionsList', { params: { authenticatedUsername } }),
  updateUserPermissions: (username, permissions, authenticatedUsername) =>
    apiClient.post('/updateUserPermissions', { username, permissions, authenticatedUsername }),

  // --- Timesheet & Company Functions ---
  createCompany: (companyData, authenticatedUsername) =>
    apiClient.post('/createCompany', { companyData, authenticatedUsername }),
  updateCompany: (originalCompanyName, updatedCompanyData, authenticatedUsername) =>
    apiClient.post('/updateCompany', { originalCompanyName: originalCompanyName, updatedCompanyData: updatedCompanyData, authenticatedUsername }),
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
  updateMSAWOVendorCompany: (originalVendorName, vendorData, authenticatedUsername) =>
    apiClient.post('/updateMSAWOVendorCompany', { originalCompanyName: originalVendorName, updatedCompanyData: vendorData, authenticatedUsername }),
  deleteMSAWOVendorCompany: (vendorNameToDelete, authenticatedUsername) =>
    apiClient.post('/deleteMSAWOVendorCompany', { companyNameToDelete: vendorNameToDelete, authenticatedUsername }),
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
  deleteOfferLetter: (rowKey, authenticatedUsername, pdfUrl) =>
    apiClient.post('/deleteOfferLetter', { rowKey, authenticatedUsername, pdfUrl }),
  updateOfferLetter: (documentData, authenticatedUsername) =>
    apiClient.post('/updateOfferLetter', { documentData, authenticatedUsername }),
  employeeSignIn: (token, tempPassword) =>
    apiClient.post('/employeeSignIn', { token, tempPassword }),
  updateOfferLetterStatus: (token, signerData) =>
    apiClient.post('/updateOfferLetterStatus', { token, signerData }),
  resendOfferLetter: (rowKey, authenticatedUsername) =>
    apiClient.post('/resendOfferLetter', { rowKey, authenticatedUsername }),

  // --- Public Key Management ---
  savePublicKey: (authenticatedUsername, publicKey) =>
    apiClient.post('/savePublicKey', { authenticatedUsername, publicKey }),
  getPublicKey: (username, authenticatedUsername) =>
    apiClient.get('/getPublicKey', { params: { username, authenticatedUsername } }),

  // --- Attendance & Leave ---
  markAttendance: (attendanceData) => 
    apiClient.post('/markAttendance', attendanceData),
  approveAttendance: (payload) => 
    apiClient.post('/approveAttendance', payload),
  getAttendance: (params) => 
    apiClient.get('/getAttendance', { params }),
  getHolidays: (params) => 
    apiClient.get('/getHolidays', { params }),
  manageHoliday: (holidayData, method = 'POST', authenticatedUsername) => { 
    if (method === 'DELETE') {
      return apiClient.delete('/manageHoliday', {
          data: { ...holidayData, authenticatedUsername }
      });
    } else {
      return apiClient.post('/manageHoliday', { ...holidayData, authenticatedUsername });
    }
  },
  calculateMonthlyAttendance: (params) => { 
    return apiClient.get('/calculateMonthlyAttendance', { params: params });
  },
  sendConsolidatedReport: (payload) => { 
    return apiClient.post('/sendConsolidatedReport', payload);
  },
  requestLeave: (leaveData, authenticatedUsername) => 
    apiClient.post('/requestLeave', { ...leaveData, authenticatedUsername }),
  approveLeave: (approvalData) => 
    apiClient.post('/approveLeave', approvalData),
  getLeaveConfig: (params) => 
    apiClient.get('/manageLeaveConfig', { params }),
  manageLeaveConfig: (configData, authenticatedUsername) => 
    apiClient.post('/manageLeaveConfig', { ...configData, authenticatedUsername }),
  getLeaveRequests: (params) => 
    apiClient.get('/getLeaveRequests', { params }),
};