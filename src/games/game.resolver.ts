import type { GameAdapter } from "./game";
import { MockGameAdapter } from "./mock-game";

export const SUPPORTED_GAMES = [
  { slug: "mock", name: "Mock Game Engine" },
];

export function getSupportedGames() {
  return SUPPORTED_GAMES;
}

export function isGameSupported(slug: string): boolean {
  return SUPPORTED_GAMES.some((g) => g.slug === slug);
}

export function resolveGame(slug: string): GameAdapter {
  switch (slug) {
    case "mock":
      return new MockGameAdapter();

    default:
      throw new Error(`Unsupported game: ${slug}`);
  }
}
