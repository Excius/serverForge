import { api } from './client';

export const providersApi = {
  list: () => api.get('/providers'),
  getSupported: () => api.get('/providers/supported'),
  get: (id: string) => api.get(`/providers/${id}`),
  create: (data: any) => api.post('/providers', data),
  update: (id: string, data: any) => api.patch(`/providers/${id}`, data),
  delete: (id: string) => api.delete(`/providers/${id}`),
  getConfig: (id: string) => api.get(`/providers/${id}/config`),
  saveConfig: (id: string, values: Record<string, any>) =>
    api.put(`/providers/${id}/config`, { values }),
  deleteConfig: (id: string) => api.delete(`/providers/${id}/config`),
};
