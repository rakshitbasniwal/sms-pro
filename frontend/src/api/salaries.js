import api from './axios';

export const getSalaries            = (params)       => api.get('/salaries', { params });
export const getSalaryById          = (id)           => api.get(`/salaries/${id}`);
export const getSalaryStats         = ()             => api.get('/salaries/stats');
export const getTeacherSalaryHistory = (teacherId)   => api.get(`/salaries/teacher/${teacherId}`);
export const createSalary           = (data)         => api.post('/salaries', data);
export const updateSalary           = (id, data)     => api.put(`/salaries/${id}`, data);
export const deleteSalary           = (id)           => api.delete(`/salaries/${id}`);
export const markSalaryAsPaid       = (id, data)     => api.patch(`/salaries/${id}/pay`, data);
