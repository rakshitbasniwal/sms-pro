import api from './axios';
export const getFees      = (params)   => api.get('/fees', { params });
export const getFeeStats  = ()         => api.get('/fees/stats');
export const createFee    = (data)     => api.post('/fees', data);
export const updateFee    = (id, data) => api.put(`/fees/${id}`, data);
export const deleteFee    = (id)       => api.delete(`/fees/${id}`);
