// API Endpoints
export const API_ENDPOINTS = {
  // Auth
  AUTH: {
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    ME: '/auth/me',
  },
  // Jobs
  JOBS: {
    LIST: '/jobs',
    CREATE: '/jobs',
    DETAIL: (id: string) => `/jobs/${id}`,
    UPDATE: (id: string) => `/jobs/${id}`,
    DELETE: (id: string) => `/jobs/${id}`,
    RUN: (id: string) => `/jobs/${id}/run`,
    EXECUTIONS: (id: string) => `/jobs/${id}/executions`,
  },
  // Executions
  EXECUTIONS: {
    LIST: '/executions',
    DETAIL: (id: string) => `/executions/${id}`,
    LOGS: (id: string) => `/executions/${id}/logs`,
    STATISTICS: '/statistics',
  },
  // Users
  USERS: {
    LIST: '/users',
    CREATE: '/users',
    DETAIL: (id: string) => `/users/${id}`,
    UPDATE: (id: string) => `/users/${id}`,
    DELETE: (id: string) => `/users/${id}`,
    RESET_PASSWORD: (id: string) => `/users/${id}/reset-password`,
  },
  // Notifications
  NOTIFICATIONS: {
    SETTINGS: '/notifications/settings',
    UPDATE_SETTINGS: '/notifications/settings',
    TEST: '/notifications/test',
  },
  // Health
  HEALTH: '/health',
};

export default API_ENDPOINTS;
