import { z } from "zod";

export const createServerSchema = z.object({
  name: z.string().min(1).max(100),
  gameId: z.uuid(),
  providerId: z.uuid(),
  providerServerId: z.string().min(1).max(255),
});

export const updateServerSchema = z.object({
  name: z.string().min(1).max(100).optional(),
});

export const serverIdSchema = z.uuid();
