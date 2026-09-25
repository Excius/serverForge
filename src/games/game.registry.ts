import type {
  AdapterConfigField,
  GameAdapterDefinition,
} from "../types/config-definition";
import type { GameAdapter } from "./game";
import { MockGameAdapter } from "./mock/mock.game";
import {
  PalworldAdapter,
  type PalworldConfig,
} from "./palworld/palworld.adapter";
import { PalworldClient } from "./palworld/palworld.client";
import { ConfigurationService } from "../services/configuration.service";

export const palworldConfigDefinition: AdapterConfigField[] = [
  {
    key: "PALWORLD_API_URL",
    label: "API URL",
    description: "URL of the Palworld REST API",
    type: "url",
    required: true,
    sensitive: false,
  },
  {
    key: "PALWORLD_API_USERNAME",
    label: "Username",
    description: "Palworld REST API admin username",
    type: "string",
    required: true,
    sensitive: false,
  },
  {
    key: "PALWORLD_API_PASSWORD",
    label: "Password",
    description: "Palworld REST API admin password",
    type: "secret",
    required: true,
    sensitive: true,
  },
];

export const palworldDefinition: GameAdapterDefinition = {
  slug: "palworld",
  name: "PalWorld",
  config: palworldConfigDefinition,
};

export const mockGameConfigDefinition: AdapterConfigField[] = [
  {
    key: "MOCK_API_PORT",
    label: "Mock API Port",
    description: "Port used by the mock game engine simulator",
    type: "number",
    required: false,
    sensitive: false,
  },
];

export const mockGameDefinition: GameAdapterDefinition = {
  slug: "mock",
  name: "Mock Game Engine",
  config: mockGameConfigDefinition,
};

export const GAME_ADAPTER_DEFINITIONS = new Map<string, GameAdapterDefinition>([
  ["mock", mockGameDefinition],
  ["palworld", palworldDefinition],
]);

export const SUPPORTED_GAMES = Array.from(
  GAME_ADAPTER_DEFINITIONS.values(),
).map((def) => ({ slug: def.slug, name: def.name }));

export function getSupportedGames() {
  return SUPPORTED_GAMES;
}

export function isGameSupported(slug: string): boolean {
  return GAME_ADAPTER_DEFINITIONS.has(slug);
}

export class GameRegistry {
  private readonly adapters = new Map<string, GameAdapter>();

  registerAdapter(gameSlug: string, adapter: GameAdapter): void {
    this.adapters.set(gameSlug, adapter);
  }

  getAdapter(gameSlug: string): GameAdapter {
    const adapter = this.adapters.get(gameSlug);
    if (!adapter) {
      throw new Error(`No game adapter registered for: ${gameSlug}`);
    }
    return adapter;
  }

  hasAdapter(gameSlug: string): boolean {
    return this.adapters.has(gameSlug);
  }
}

export function createGameRegistry(): GameRegistry {
  const registry = new GameRegistry();

  const palworldClient = new PalworldClient("", "", "");
  const palworldAdapter = new PalworldAdapter(palworldClient);
  const mockAdapter = new MockGameAdapter();

  registry.registerAdapter("palworld", palworldAdapter);
  registry.registerAdapter("mock", mockAdapter);

  return registry;
}

export async function resolveGameAdapter(
  slug: string,
  arg2?: ConfigurationService | string,
  arg3?: ConfigurationService | string,
): Promise<GameAdapter> {
  const configService =
    arg2 instanceof ConfigurationService
      ? arg2
      : arg3 instanceof ConfigurationService
        ? arg3
        : undefined;

  const gameId =
    typeof arg2 === "string"
      ? arg2
      : typeof arg3 === "string"
        ? arg3
        : undefined;

  switch (slug) {
    case "mock":
      return new MockGameAdapter();

    case "palworld": {
      let url = "";
      let username = "";
      let password = "";

      if (configService && gameId) {
        const plain = (await configService.resolveConfig(
          "game",
          gameId,
        )) as Partial<PalworldConfig>;

        url = plain.PALWORLD_API_URL ?? "";
        username = plain.PALWORLD_API_USERNAME ?? "";
        password = plain.PALWORLD_API_PASSWORD ?? "";
      }

      const client = new PalworldClient(url, username, password);
      return new PalworldAdapter(client);
    }

    default:
      throw new Error(`No game adapter registered for: ${slug}`);
  }
}

export function resolveGame(slug: string): GameAdapter {
  return createGameRegistry().getAdapter(slug);
}

