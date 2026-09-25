import { string, z } from "zod";

export const createGameSchema = z.object({
  name: z.string().min(3).max(128),
  slug: z
    .string()
    .min(3)
    .max(100)
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Slug must contain only lowercase letters, numbers, and hyphens",
    ),
});

export const updateGameSchema = z.object({
  name: z.string().min(3).max(128).optional(),
  slug: z
    .string()
    .min(3)
    .max(100)
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Slug must contain only lowercase letters, numbers, and hyphens",
    )
    .optional(),
});

export const gameIdSchema = z.uuid();
