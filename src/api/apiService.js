import axios from 'axios';

const API_BASE_URL = '/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const apiService = {
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
    
  addCandidateDetails: (candidateData, authenticatedUsername) =>
    apiClient.post('/addCandidateDetails', { candidateData, authenticatedUsername }),
  
  updateCandidateDetails: (originalEmail, candidateData, authenticatedUsername) =>
    apiClient.post('/updateCandidateDetails', { originalEmail, candidateData, authenticatedUsername }),

  getCandidateDetailsPageData: (authenticatedUsername) =>
    apiClient.get('/getCandidateDetailsPageData', { params: { authenticatedUsername } }),

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
    
  sendAssignmentEmail: (jobTitle, postingId, assignedUserDisplayName, authenticatedUsername) => 
    apiClient.post('/sendAssignmentEmail', { jobTitle, postingId, assignedUserDisplayName, authenticatedUsername }),

  // NEW: API calls for granular user access control
  getUserPermissionsList: (authenticatedUsername) =>
    apiClient.get('/getUserPermissionsList', { params: { authenticatedUsername } }),

  updateUserPermissions: (username, permissions, authenticatedUsername) =>
    apiClient.post('/updateUserPermissions', { username, permissions, authenticatedUsername }),

  // NEW: Timesheet and Company Management API Calls
  createCompany: (companyData, authenticatedUsername) =>
    apiClient.post('/createCompany', { companyData, authenticatedUsername }),
    
  saveEmployeeLogHours: (timesheetData, authenticatedUsername) =>
    apiClient.post('/saveEmployeeLogHours', { timesheetData, authenticatedUsername }),

  getEmployeeLogHours: (params) =>
    apiClient.get('/getEmployeeLogHours', { params }),

  getCompanies: (authenticatedUsername) => // <-- NEW: API call to get companies
    apiClient.get('/getCompanies', { params: { authenticatedUsername } }),

  createTimesheetEmployee: (employeeData, authenticatedUsername) => // <-- NEW: API call to create timesheet employee
    apiClient.post('/createTimesheetEmployee', { employeeData, authenticatedUsername }),

  sendTimesheetApprovalRequest: (employeeMail, employeeName, month, year, deadlineDate, companyName, authenticatedUsername) =>
    apiClient.post('/sendTimesheetApprovalRequest', { employeeMail, employeeName, month, year, deadlineDate, companyName, authenticatedUsername }),
};