import axios from 'axios';
import { toast } from 'sonner';

// Hardcoded production API URLs
const API_BASE_URL = 'https://youchat-chatapp.onrender.com';
const USER_API_PATH = '/user';

// Create an axios instance
const api = axios.create({
  baseURL: `${API_BASE_URL}${USER_API_PATH}`,
  withCredentials: true, // Important for cookies
  headers: {
    'Content-Type': 'application/json',
  }
});

// Track if we're currently refreshing the token
let isRefreshing = false;
// Queue of requests that need to be retried after token refresh
let failedQueue = [];

// Process the queue of failed requests
const processQueue = (error, token = null) => {
  failedQueue.forEach(promise => {
    if (error) {
      promise.reject(error);
    } else {
      promise.resolve(token);
    }
  });
  failedQueue = [];
};

// Add a response interceptor
api.interceptors.response.use(
  (response) => response, // Return successful responses as-is
  async (error) => {
    const originalRequest = error.config;
    
    // If error is not 401 or request has already been retried, reject
    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    // Check if the error indicates we should logout
    if (error.response?.data?.logout) {
      // Clear cookies
      document.cookie = 'accessToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      document.cookie = 'refreshToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      
      // Show logout message
      toast.error('Your session has expired. Please login again.');
      
      // Redirect to login page
      if (window.location.pathname !== '/auth') {
        window.location.href = '/auth';
      }
      
      return Promise.reject(error);
    }

    // If we're already refreshing, add this request to the queue
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then(() => {
          return api(originalRequest);
        })
        .catch(err => {
          return Promise.reject(err);
        });
    }

    // Mark that we're refreshing and the request as retried
    originalRequest._retry = true;
    isRefreshing = true;

    // Try to refresh the token
    try {
      const response = await api.get('/refresh-token');
      
      // If successful, retry the original request
      isRefreshing = false;
      processQueue(null);
      
      return api(originalRequest);
    } catch (refreshError) {
      // If refresh failed, reject all queued requests and redirect to login
      isRefreshing = false;
      processQueue(refreshError);
      
      // Clear cookies
      document.cookie = 'accessToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      document.cookie = 'refreshToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      
      // Show logout message
      toast.error('Your session has expired. Please login again.');
      
      // Redirect to login page
      if (window.location.pathname !== '/auth') {
        window.location.href = '/auth';
      }
      
      return Promise.reject(refreshError);
    }
  }
);

export default api; 