// Production API Configuration
export const API_URL = 'https://yourdomain.com/backend';
export const FRONTEND_URL = 'https://yourdomain.com';

// API endpoints
export const ENDPOINTS = {
    SITES: `${API_URL}/sites`,
    ADMIN_LOGIN: `${API_URL}/admin-login`,
    BRANCH_ADMIN_LOGIN: `${API_URL}/branch-admin-login`,
    LOGIN: `${API_URL}/login`,
    SIGNUP: `${API_URL}/signup`,
    ADMIN_USERS: `${API_URL}/admin/users`,
    ADMIN_FEEDBACK: `${API_URL}/admin/feedback`,
    QUESTIONS: `${API_URL}/questions`,
    FEEDBACK: `${FRONTEND_URL}/#/feedback`,
    SUBMIT_FEEDBACK: `${API_URL}/feedback`,
    CANTEENS: `${API_URL}/canteens`,
    ADMIN_CANTEENS: `${API_URL}/admin/canteens`,
    ADMIN_BRANCH_ADMINS: `${API_URL}/admin/branch-admins`,
};

import { RatingOption } from './types';

export const RATINGS: RatingOption[] = [
    { level: 4, label: 'Excellent', emoji: '😀', color: 'text-green-500' },
    { level: 3, label: 'Good', emoji: '🙂', color: 'text-yellow-500' },
    { level: 2, label: 'Fair', emoji: '😐', color: 'text-orange-500' },
    { level: 1, label: 'Poor', emoji: '😞', color: 'text-red-500' },
];
