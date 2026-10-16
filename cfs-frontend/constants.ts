// Local Development URLs - Dynamically detect host for network IP support
// This helper function is called at runtime to get the current hostname
export const getAPIURL = () => {
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    // Production (Hostinger)
    if (host === 'feedback.catalystsolutions.eco' || host === 'www.feedback.catalystsolutions.eco') {
      return 'https://feedback.catalystsolutions.eco/api';
    }
    // Development detection
    if (host === 'localhost' || host === '127.0.0.1' || host.startsWith('192.168.')) {
      return `http://${host}:8000/api`;
    }
    // Fallback detection
    return `${window.location.origin}/api`;
  }
  return 'http://localhost:8000/api';
};

export const getFrontendURL = () => {
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  return 'https://feedback.catalystsolutions.eco';
};

// Function to get endpoints with dynamic API URL
export const getEndpoints = () => {
  const apiUrl = getAPIURL();
  const frontendUrl = getFrontendURL();
  return {
    SITES: `${apiUrl}/sites`,
    ADMIN_LOGIN: `${apiUrl}/admin-login.php`,
    BRANCH_ADMIN_LOGIN: `${apiUrl}/branch-admin-login.php`,
    LOGIN: `${apiUrl}/login.php`,
    SIGNUP: `${apiUrl}/signup.php`,
    ADMIN_USERS: `${apiUrl}/users`,
    ADMIN_BRANCH_ADMINS: `${apiUrl}/branch-admins`,
    BRANCH_ADMINS_INFO: `${apiUrl}/branch-admins`,
    ADMIN_FEEDBACK: `${apiUrl}/feedback`,
    QUESTIONS: `${apiUrl}/questions`,
    FEEDBACK: `${frontendUrl}/feedback`,
    SUBMIT_FEEDBACK: `${apiUrl}/feedback`,
    CANTEENS: `${apiUrl}/canteens`,
    ADMIN_CANTEENS: `${apiUrl}/canteens`,
    SEGMENTS: `${apiUrl}/segments`,
    FORM_SETTINGS: `${apiUrl}/form-settings`,
    RESOLVE_LINK: `${apiUrl}/resolve-link`,
  };
};

// Static defaults for module loading - used as fallback only
export const API_URL = 'http://localhost:8000/api';
export const FRONTEND_URL = 'http://localhost:5173';

// API endpoints - static version (deprecated, use getEndpoints() instead)
export const ENDPOINTS = {
  SITES: `${API_URL}/sites`,
  ADMIN_LOGIN: `${API_URL}/admin-login.php`,
  BRANCH_ADMIN_LOGIN: `${API_URL}/branch-admin-login.php`,
  LOGIN: `${API_URL}/login.php`,
  SIGNUP: `${API_URL}/signup.php`,
  ADMIN_USERS: `${API_URL}/users`,
  ADMIN_BRANCH_ADMINS: `${API_URL}/branch-admins`,
  ADMIN_FEEDBACK: `${API_URL}/feedback`,
  QUESTIONS: `${API_URL}/questions`,
  FEEDBACK: `${FRONTEND_URL}/feedback`,
  SUBMIT_FEEDBACK: `${API_URL}/feedback`,
  CANTEENS: `${API_URL}/canteens`,
  ADMIN_CANTEENS: `${API_URL}/canteens`,
  SEGMENTS: `${API_URL}/segments`,
};

import { RatingOption } from './types';

export const RATINGS: RatingOption[] = [
  { level: 1, label: 'Poor', emoji: '😞', color: 'text-red-500' },
  { level: 2, label: 'Needs Improvement', emoji: '😐', color: 'text-orange-500' },
  { level: 3, label: 'Average', emoji: '🙂', color: 'text-yellow-500' },
  { level: 4, label: 'Good', emoji: '😀', color: 'text-green-500' },
];

export const RATING_LABELS: Record<number, string> = {
  1: 'Poor',
  2: 'Needs Improvement',
  3: 'Average',
  4: 'Good'
};
