import { describe, it, expect, beforeEach } from "vitest";
import { ConfigurationService } from "../../../src/services/configuration.service";
import { clearDatabase, testDb } from "../../setup/db";
import { gameTable, providerTable } from "../../../src/db/schema";
import { AppError } from "../../../src/lib/errors";

describe("ConfigurationService", () => {
  let service: ConfigurationService;
  let gameId = "";
  let providerId = "";

  beforeEach(async () => {
    await clearDatabase();
    service = new ConfigurationService(testDb, "test-secret-key");

    const [game] = await testDb
      .insert(gameTable)
      .values({ name: "Palworld", slug: "palworld" })
      .returning();
    gameId = game.id;

    const [provider] = await testDb
      .insert(providerTable)
      .values({ name: "AWS", slug: "aws" })
      .returning();
    providerId = provider.id;
  });

  it("should get adapter definitions for supported games and providers", () => {
    const palworldDef = service.getDefinition("game", "palworld");
    expect(palworldDef.slug).toBe("palworld");
    expect(palworldDef.config.length).toBe(3);

    const awsDef = service.getDefinition("provider", "aws");
    expect(awsDef.slug).toBe("aws");
    expect(awsDef.config.length).toBe(3);
  });

  it("should throw for unsupported adapter slugs", () => {
    expect(() => service.getDefinition("game", "unknown")).toThrow(AppError);
  });

  it("should save and retrieve configuration without returning secrets", async () => {
    await service.saveConfig("game", gameId, "palworld", {
      PALWORLD_API_URL: "http://10.0.0.5:8212",
      PALWORLD_API_USERNAME: "admin",
      PALWORLD_API_PASSWORD: "my-secret-password",
    });

    const config = await service.getConfig("game", gameId, "palworld");
    expect(config.slug).toBe("palworld");

    const urlField = config.fields.find((f) => f.key === "PALWORLD_API_URL");
    expect(urlField?.value).toBe("http://10.0.0.5:8212");
    expect(urlField?.configured).toBe(true);

    const passField = config.fields.find((f) => f.key === "PALWORLD_API_PASSWORD");
    expect(passField?.value).toBeUndefined(); // NEVER returned!
    expect(passField?.configured).toBe(true);
  });

  it("should validate field types and required fields", async () => {
    // Invalid URL
    await expect(
      service.saveConfig("game", gameId, "palworld", {
        PALWORLD_API_URL: "not-a-valid-url",
        PALWORLD_API_USERNAME: "admin",
        PALWORLD_API_PASSWORD: "secret",
      }),
    ).rejects.toThrow("Invalid URL format for field 'PALWORLD_API_URL'");

    // Missing required field
    await expect(
      service.saveConfig("game", gameId, "palworld", {
        PALWORLD_API_URL: "http://10.0.0.5:8212",
        // missing username and password
      }),
    ).rejects.toThrow("Missing required configuration field");

    // Unknown key injection
    await expect(
      service.saveConfig("game", gameId, "palworld", {
        PALWORLD_API_URL: "http://10.0.0.5:8212",
        PALWORLD_API_USERNAME: "admin",
        PALWORLD_API_PASSWORD: "secret",
        MALICIOUS_KEY: "hack",
      }),
    ).rejects.toThrow("Unknown configuration key: 'MALICIOUS_KEY'");
  });

  it("should retain existing secret when updated with blank secret value", async () => {
    await service.saveConfig("game", gameId, "palworld", {
      PALWORLD_API_URL: "http://10.0.0.5:8212",
      PALWORLD_API_USERNAME: "admin",
      PALWORLD_API_PASSWORD: "original-secret",
    });

    // Update non-sensitive field, leave secret blank
    await service.saveConfig("game", gameId, "palworld", {
      PALWORLD_API_URL: "http://10.0.0.99:8212",
      PALWORLD_API_USERNAME: "admin_v2",
      PALWORLD_API_PASSWORD: "",
    });

    const plain = await service.resolveConfig("game", gameId);
    expect(plain.PALWORLD_API_URL).toBe("http://10.0.0.99:8212");
    expect(plain.PALWORLD_API_USERNAME).toBe("admin_v2");
    expect(plain.PALWORLD_API_PASSWORD).toBe("original-secret");
  });

  it("should resolve plain configuration for adapters and delete config", async () => {
    await service.saveConfig("provider", providerId, "aws", {
      AWS_ACCESS_KEY_ID: "AKIAIOSFODNN7EXAMPLE",
      AWS_SECRET_ACCESS_KEY: "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
      AWS_REGION: "us-west-2",
    });

    const plain = await service.resolveConfig("provider", providerId);
    expect(plain.AWS_REGION).toBe("us-west-2");
    expect(plain.AWS_ACCESS_KEY_ID).toBe("AKIAIOSFODNN7EXAMPLE");

    await service.deleteConfig("provider", providerId);

    const deletedPlain = await service.resolveConfig("provider", providerId);
    expect(deletedPlain).toEqual({});
  });
});
