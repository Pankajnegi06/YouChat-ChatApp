
export const API_BASE_URL = 'http://localhost:8000' ;
export const USER_API_PATH = '/user';
export const SOCKET_URL = 'http://localhost:8000' 

// Full path for user-related endpoints
export const USER_API_URL = `${API_BASE_URL}${USER_API_PATH}`;

// API endpoint URLs organized by domain
export const API_ENDPOINTS = {
  // User endpoints
  user: {
    base: USER_API_URL,
    Login: `${API_BASE_URL}/api/user/Login`,
    signup: `${API_BASE_URL}/api/user/signup`,
    logout: `${API_BASE_URL}/api/user/logout`,
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
