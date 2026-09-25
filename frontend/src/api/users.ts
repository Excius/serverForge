import { api } from './client';

export const usersApi = {
  list: () => api.get('/users'),
  get: (id: string) => api.get(`/users/${id}`),
  updateRole: (id: string, role: 'admin' | 'user') => api.patch(`/users/${id}`, { role }),
};
