import { api } from './client';

export const serverAccessApi = {
  list: (serverId: string) => api.get(`/server-access/${serverId}`),
  grant: ({ serverId, userId }: { serverId: string; userId: string }) =>
    api.post(`/server-access/${serverId}/${userId}`),
  revoke: ({ serverId, userId }: { serverId: string; userId: string }) =>
    api.delete(`/server-access/${serverId}/${userId}`),
};
