import { api } from './client';

export const serversApi = {
  list: () => api.get('/servers'),
  get: (id: string) => api.get(`/servers/${id}`),
  create: (data: any) => api.post('/servers', data),
  update: (id: string, data: any) => api.patch(`/servers/${id}`, data),
  delete: (id: string) => api.delete(`/servers/${id}`),
  start: (id: string) => api.post(`/servers/${id}/start`),
  stop: (id: string) => api.post(`/servers/${id}/stop`),
};
