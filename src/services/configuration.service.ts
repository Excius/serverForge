import { eq } from "drizzle-orm";
import { Database } from "../db";
import {
  gameConfigurationTable,
  providerConfigurationTable,
} from "../db/schema";
import { GAME_ADAPTER_DEFINITIONS } from "../games/game.registry";
import { AppError } from "../lib/errors";
import { PROVIDER_ADAPTER_DEFINITIONS } from "../providers/provider.registry";
import {
  AdapterConfigField,
  ConfigFieldResponse,
  EncryptedConfigData,
  GameAdapterDefinition,
  ProviderAdapterDefinition,
} from "../types/config-definition";
import { EncryptionService } from "./encryption.service";

export class ConfigurationService {
  private readonly encryptionService: EncryptionService;

  constructor(
    private readonly db: Database,
    secretKey?: string,
  ) {
    this.encryptionService = new EncryptionService(secretKey);
  }

  getDefinition(
    entityType: "game" | "provider",
    slug: string,
  ): GameAdapterDefinition | ProviderAdapterDefinition {
    const map =
      entityType === "game"
        ? GAME_ADAPTER_DEFINITIONS
        : PROVIDER_ADAPTER_DEFINITIONS;
    const def = map.get(slug);

    if (!def) {
      throw new AppError(
        `Unsupported ${entityType} adapter slug: ${slug}`,
        400,
      );
    }

    return def;
  }

  async getConfig(
    entityType: "game" | "provider",
    entityId: string,
    slug: string,
  ): Promise<{
    slug: string;
    name: string;
    fields: ConfigFieldResponse[];
  }> {
    const def = this.getDefinition(entityType, slug);
    const storedValues = await this.getDecryptedValues(entityType, entityId);

    const fields: ConfigFieldResponse[] = def.config.map((field) => {
      const storedVal = storedValues[field.key];
      const isConfigured =
        storedVal !== undefined && storedVal !== null && storedVal !== "";

      if (field.sensitive) {
        return {
          ...field,
          configured: isConfigured,
        };
      }

      return {
        ...field,
        value: storedVal ?? "",
        configured: isConfigured,
      };
    });

    return {
      slug: def.slug,
      name: def.name,
      fields,
    };
  }

  async saveConfig(
    entityType: "game" | "provider",
    entityId: string,
    slug: string,
    inputValues: Record<string, any>,
  ): Promise<{
    slug: string;
    name: string;
    fields: ConfigFieldResponse[];
  }> {
    const def = this.getDefinition(entityType, slug);
    const existingValues = await this.getDecryptedValues(entityType, entityId);

    if (!inputValues || typeof inputValues !== "object") {
      throw new AppError(
        "Invalid configuration payload. Expected 'values' object.",
        400,
      );
    }

    const validKeys = new Set(def.config.map((f) => f.key));
    for (const inputKey of Object.keys(inputValues)) {
      if (!validKeys.has(inputKey)) {
        throw new AppError(`Unknown configuration key: '${inputKey}'`, 400);
      }
    }

    const finalValues: Record<string, any> = {};

    for (const field of def.config) {
      let val = inputValues[field.key];

      if (
        (val === undefined || val === null || val === "") &&
        field.sensitive &&
        existingValues[field.key]
      ) {
        val = existingValues[field.key];
      }

      if (
        (val === undefined || val === null || val === "") &&
        field.required
      ) {
        throw new AppError(
          `Missing required configuration field: '${field.key}'`,
          400,
        );
      }

      if (val !== undefined && val !== null && val !== "") {
        const validatedVal = this.validateFieldType(field, val);
        finalValues[field.key] = validatedVal;
      }
    }

    const jsonString = JSON.stringify(finalValues);
    const encryptedData = await this.encryptionService.encrypt(jsonString);
    const serializedConfig = JSON.stringify(encryptedData);

    const target = this.getStorageTarget(entityType);
    const existing = await this.db
      .select()
      .from(target.table)
      .where(eq(target.idCol, entityId))
      .limit(1);

    if (existing[0]) {
      await this.db
        .update(target.table)
        .set({ encryptedConfig: serializedConfig, updatedAt: new Date() })
        .where(eq(target.idCol, entityId));
    } else {
      await this.db.insert(target.table).values({
        [target.fkName]: entityId,
        encryptedConfig: serializedConfig,
      } as any);
    }

    return this.getConfig(entityType, entityId, slug);
  }

  async resolveConfig(
    entityType: "game" | "provider",
    entityId: string,
  ): Promise<Record<string, any>> {
    return this.getDecryptedValues(entityType, entityId);
  }

  async deleteConfig(
    entityType: "game" | "provider",
    entityId: string,
  ): Promise<void> {
    const target = this.getStorageTarget(entityType);
    await this.db.delete(target.table).where(eq(target.idCol, entityId));
  }

  private getStorageTarget(entityType: "game" | "provider") {
    return entityType === "game"
      ? {
          table: gameConfigurationTable,
          idCol: gameConfigurationTable.gameId,
          fkName: "gameId" as const,
        }
      : {
          table: providerConfigurationTable,
          idCol: providerConfigurationTable.providerId,
          fkName: "providerId" as const,
        };
  }

  private async getDecryptedValues(
    entityType: "game" | "provider",
    entityId: string,
  ): Promise<Record<string, any>> {
    const target = this.getStorageTarget(entityType);
    const records = await this.db
      .select()
      .from(target.table)
      .where(eq(target.idCol, entityId))
      .limit(1);

    const record = records[0];
    if (!record || !record.encryptedConfig) {
      return {};
    }

    try {
      const encryptedData: EncryptedConfigData = JSON.parse(
        record.encryptedConfig,
      );
      const plaintext = await this.encryptionService.decrypt(encryptedData);
      return JSON.parse(plaintext);
    } catch (err) {
      console.error(
        `Failed to decrypt configuration for ${entityType} ${entityId}`,
      );
      return {};
    }
  }

  private validateFieldType(field: AdapterConfigField, val: any): any {
    switch (field.type) {
      case "string":
      case "secret":
        if (typeof val !== "string") {
          throw new AppError(
            `Invalid type for field '${field.key}'. Expected string.`,
            400,
          );
        }
        return val;

      case "number": {
        const num = Number(val);
        if (isNaN(num)) {
          throw new AppError(
            `Invalid type for field '${field.key}'. Expected number.`,
            400,
          );
        }
        return num;
      }

      case "boolean":
        if (typeof val === "boolean") return val;
        if (val === "true") return true;
        if (val === "false") return false;
        throw new AppError(
          `Invalid type for field '${field.key}'. Expected boolean.`,
          400,
        );

      case "url":
        if (typeof val !== "string") {
          throw new AppError(
            `Invalid URL format for field '${field.key}'.`,
            400,
          );
        }
        try {
          new URL(val);
        } catch {
          throw new AppError(
            `Invalid URL format for field '${field.key}': '${val}'`,
            400,
          );
        }
        return val;

      default:
        return val;
    }
  }
}
