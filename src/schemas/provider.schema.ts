import { z } from "zod";

export const createProviderSchema = z.object({
  name: z.string().min(1).max(100),

  slug: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Invalid slug"),
});

export const updateProviderSchema = z.object({
  name: z.string().min(1).max(100).optional(),

  slug: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Invalid slug")
    .optional(),
});

export const providerIdSchema = z.string().uuid();
