// apiConfig.js - Central configuration for all API endpoints

// Base URLs from environment variables with hardcoded production URLs
export const API_BASE_URL = 'https://youchat-chatapp.onrender.com' ;
export const USER_API_PATH = '/user';
export const SOCKET_URL = 'https://youchat-chatapp.onrender.com' 

// Full path for user-related endpoints
export const USER_API_URL = `${API_BASE_URL}${USER_API_PATH}`;

// API endpoint URLs organized by domain
export const API_ENDPOINTS = {
  // User endpoints
  user: {
    base: USER_API_URL,
    login: `${API_BASE_URL}/user/login`,
    signup: `${API_BASE_URL}/user/signup`,
    logout: `${API_BASE_URL}/user/logout`,
    refreshToken: `${API_BASE_URL}/user/refresh-token`,
    getUserInfo: `${API_BASE_URL}/user/getUserInfo`,
    profileSetup: `${API_BASE_URL}/user/ProfileSetup`
  },
  
  // Contacts endpoints
  contacts: {
    getContactList: `${API_BASE_URL}/contacts/getContactDmList`,
    searchContacts: `${API_BASE_URL}/contacts/SearchContacts`
  },
  
  // Messages endpoints
  messages: {
    getMessagesForContact: `${API_BASE_URL}/messages/getMessagesForContact`
  }
};

// Socket configuration
export const getSocketConfig = () => ({
  url: SOCKET_URL,
  options: {
    withCredentials: true,
    transports: ['websocket']
  }
});
