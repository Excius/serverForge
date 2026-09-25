import { describe, it, expect } from "vitest";
import { GameRegistry } from "../../../src/games/game.registry";
import { MockGameAdapter } from "../../../src/games/mock/mock.game";
import type { GameAdapter } from "../../../src/games/game";

describe("GameRegistry", () => {
  it("should register and resolve an adapter by slug", () => {
    const registry = new GameRegistry();
    const mockAdapter = new MockGameAdapter();

    registry.registerAdapter("mock", mockAdapter);

    expect(registry.hasAdapter("mock")).toBe(true);
    expect(registry.getAdapter("mock")).toBe(mockAdapter);
  });

  it("should throw a meaningful error if no adapter exists for a slug", () => {
    const registry = new GameRegistry();

    expect(() => registry.getAdapter("unknown-game")).toThrow(
      "No game adapter registered for: unknown-game",
    );
  });

  it("should return false for unregistered slugs when calling hasAdapter", () => {
    const registry = new GameRegistry();
    expect(registry.hasAdapter("runescape")).toBe(false);
  });
});
