import axios from 'axios';

// The base URL for all API calls. This can be moved to an environment variable later.
const API_BASE_URL = '/api';

// Create an instance of axios with the base URL configured.
// This means we don't have to type the full URL for every request.
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * A centralized place for all API calls. Each function corresponds to an endpoint.
 * This makes the code more organized and easier to test or modify.
 */
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
};