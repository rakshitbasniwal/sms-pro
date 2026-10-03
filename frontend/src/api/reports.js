import api from './axios';

export const getStudentReport    = (params) => api.get('/reports/students',   { params });
export const getTeacherReport    = (params) => api.get('/reports/teachers',   { params });
export const getFeeReport        = (params) => api.get('/reports/fees',       { params });
export const getAttendanceReport = (params) => api.get('/reports/attendance', { params });
export const getResultReport     = (params) => api.get('/reports/results',    { params });
export const getClassReport      = (params) => api.get('/reports/classes',    { params });
export const getSalaryReport     = (params) => api.get('/reports/salary',     { params });
