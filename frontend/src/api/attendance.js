import api from './axios';

export const getAttendance           = (params)       => api.get('/attendance', { params });
export const getAttendanceStats      = ()             => api.get('/attendance/stats');
export const markAttendance          = (data)         => api.post('/attendance', data);
export const getStudentAttendance    = (studentId, params) => api.get(`/attendance/student/${studentId}`, { params });
export const getMonthlyAttendance    = (studentId, params) => api.get(`/attendance/monthly/${studentId}`, { params });
export const getClassAttendance      = (className, section, params) =>
  api.get(`/attendance/class/${encodeURIComponent(className)}/${encodeURIComponent(section)}`, { params });
export const updateAttendance        = (id, data)     => api.put(`/attendance/${id}`, data);
export const deleteAttendance        = (id)           => api.delete(`/attendance/${id}`);
