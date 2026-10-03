import api from './axios';
export const getTimetable    = (params)   => api.get('/timetable', { params });
export const createEntry     = (data)     => api.post('/timetable', data);
export const updateEntry     = (id, data) => api.put(`/timetable/${id}`, data);
export const deleteEntry     = (id)       => api.delete(`/timetable/${id}`);
