import api from './axios';

export const getDashboardStats      = ()       => api.get('/dashboard/stats');
export const getRecentActivities    = ()       => api.get('/dashboard/activities');
