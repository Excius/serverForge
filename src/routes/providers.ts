import { Hono } from "hono";
import type { AppEnv } from "../types/hono";
import {
  createProviderSchema,
  updateProviderSchema,
  providerIdSchema,
} from "../schemas/provider.schema";
import { ProviderService } from "../services/provider.service";
import { authMiddleware } from "../middleware/auth";
import { adminMiddleware } from "../middleware/admin";
import { getSupportedProviders, isProviderSupported } from "../providers/provider.resolver";

const providers = new Hono<AppEnv>();

providers.get("/supported", authMiddleware, async (c) => {
  return c.json({ items: getSupportedProviders() }, 200);
});

providers.get("/", authMiddleware, async (c) => {
  const db = c.get("db");

  const service = new ProviderService(db);

  const providers = await service.getProviders();

  return c.json(providers);
});

providers.get("/:id", async (c) => {
  const id = c.req.param("id");

  const idResult = providerIdSchema.safeParse(id);

  if (!idResult.success) {
    return c.json(
      {
        error: "Invalid provider ID",
      },
      400,
    );
  }

  const db = c.get("db");

  const service = new ProviderService(db);

  const provider = await service.getProviderById(idResult.data);

  if (!provider) {
    return c.json(
      {
        error: "Provider not found",
      },
      404,
    );
  }

  return c.json(provider);
});

providers.post("/", authMiddleware, adminMiddleware, async (c) => {
  const body = await c.req.json();

  const result = createProviderSchema.safeParse(body);

  if (!result.success) {
    return c.json(
      {
        error: "Invalid request",
        details: result.error.flatten(),
      },
      400,
    );
  }

  if (!isProviderSupported(result.data.slug)) {
    const supportedSlugs = getSupportedProviders().map((p) => p.slug).join(", ");
    return c.json(
      {
        error: `Unsupported provider slug '${result.data.slug}'. Backend currently supports: [${supportedSlugs}]`,
      },
      400,
    );
  }

  const db = c.get("db");

  const service = new ProviderService(db);

  const provider = await service.createProvider(
    result.data.name,
    result.data.slug,
  );

  return c.json(provider, 201);
});

providers.patch("/:id", authMiddleware, adminMiddleware, async (c) => {
  const id = c.req.param("id");

  const idResult = providerIdSchema.safeParse(id);

  if (!idResult.success) {
    return c.json(
      {
        error: "Invalid provider ID",
      },
      400,
    );
  }

  const body = await c.req.json();

  const bodyResult = updateProviderSchema.safeParse(body);

  if (!bodyResult.success) {
    return c.json(
      {
        error: "Invalid request",
        details: bodyResult.error.flatten(),
      },
      400,
    );
  }

  const db = c.get("db");

  const service = new ProviderService(db);

  const provider = await service.updateProvider(idResult.data, bodyResult.data);

  if (!provider) {
    return c.json(
      {
        error: "Provider not found",
      },
      404,
    );
  }

  return c.json(provider);
});

providers.delete("/:id", authMiddleware, adminMiddleware, async (c) => {
  const id = c.req.param("id");

  const idResult = providerIdSchema.safeParse(id);

  if (!idResult.success) {
    return c.json(
      {
        error: "Invalid provider ID",
      },
      400,
    );
  }

  const db = c.get("db");

  const service = new ProviderService(db);

  const provider = await service.deleteProvider(idResult.data);

  if (!provider) {
    return c.json(
      {
        error: "Provider not found",
      },
      404,
    );
  }

  return c.json({
    message: "Provider deleted successfully",
  });
});

export default providers;
