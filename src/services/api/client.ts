import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

// Create axios instance
export const client = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add JWT token to headers
client.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors globally
client.interceptors.response.use(
  (response) => {
    return response;
  },
  (error: any) => {
    if (error.response) {
      const status = error.response.status;
      const isLoginPage = typeof window !== 'undefined' && window.location.pathname.includes('/login');

      switch (status) {
        case 401:
        case 422: // JWT validation errors also return 422
          // Unauthorized - Clear token and redirect to login
          // Only clear and redirect if NOT on login page (avoid loops)
          if (!isLoginPage) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
          }
          break;
        case 403:
          // Forbidden - User doesn't have permission
          console.error('Access forbidden');
          break;
        case 404:
          // Not found
          console.error('Resource not found');
          break;
        case 500:
          // Server error
          console.error('Server error occurred');
          break;
        default:
          console.error('An error occurred:', error.message);
      }
    } else if (error.request) {
      // Request was made but no response received
      console.error('No response received from server');
    } else {
      // Something else happened
      console.error('Error:', error.message);
    }

    return Promise.reject(error);
  }
);

export default client;
