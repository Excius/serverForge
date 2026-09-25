import { api } from './client';

export const gamesApi = {
  list: () => api.get('/games'),
  getSupported: () => api.get('/games/supported'),
  get: (id: string) => api.get(`/games/${id}`),
  create: (data: any) => api.post('/games', data),
  update: (id: string, data: any) => api.patch(`/games/${id}`, data),
  delete: (id: string) => api.delete(`/games/${id}`),
};
