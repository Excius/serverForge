import { api } from './client';

export const providersApi = {
  list: () => api.get('/providers'),
  getSupported: () => api.get('/providers/supported'),
  get: (id: string) => api.get(`/providers/${id}`),
  create: (data: any) => api.post('/providers', data),
  update: (id: string, data: any) => api.patch(`/providers/${id}`, data),
  delete: (id: string) => api.delete(`/providers/${id}`),
};
