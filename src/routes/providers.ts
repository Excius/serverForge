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
import {
  getSupportedProviders,
  isProviderSupported,
} from "../providers/provider.registry";
import { ConfigurationService } from "../services/configuration.service";
import { env } from "../lib/config";

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
    const supportedSlugs = getSupportedProviders()
      .map((p) => p.slug)
      .join(", ");
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

providers.get("/:id/config", authMiddleware, adminMiddleware, async (c) => {
  const id = c.req.param("id");
  const idResult = providerIdSchema.safeParse(id);
  if (!idResult.success) {
    return c.json({ error: "Invalid provider ID" }, 400);
  }

  const db = c.get("db");
  const providerService = new ProviderService(db);
  const provider = await providerService.getProviderById(idResult.data);
  if (!provider) {
    return c.json({ error: "Provider not found" }, 404);
  }

  const configService = new ConfigurationService(db, env.CONFIG_ENCRYPTION_KEY);
  const config = await configService.getConfig(
    "provider",
    provider.id,
    provider.slug,
  );
  return c.json(config, 200);
});

providers.put("/:id/config", authMiddleware, adminMiddleware, async (c) => {
  const id = c.req.param("id");
  const idResult = providerIdSchema.safeParse(id);
  if (!idResult.success) {
    return c.json({ error: "Invalid provider ID" }, 400);
  }

  const db = c.get("db");
  const providerService = new ProviderService(db);
  const provider = await providerService.getProviderById(idResult.data);
  if (!provider) {
    return c.json({ error: "Provider not found" }, 404);
  }

  const body = await c.req.json();
  const configService = new ConfigurationService(db, env.CONFIG_ENCRYPTION_KEY);
  const updatedConfig = await configService.saveConfig(
    "provider",
    provider.id,
    provider.slug,
    body?.values,
  );
  return c.json(updatedConfig, 200);
});

providers.delete("/:id/config", authMiddleware, adminMiddleware, async (c) => {
  const id = c.req.param("id");
  const idResult = providerIdSchema.safeParse(id);
  if (!idResult.success) {
    return c.json({ error: "Invalid provider ID" }, 400);
  }

  const db = c.get("db");
  const configService = new ConfigurationService(db, env.CONFIG_ENCRYPTION_KEY);
  await configService.deleteConfig("provider", idResult.data);
  return c.json(
    { message: "Provider configuration deleted successfully" },
    200,
  );
});

export default providers;
