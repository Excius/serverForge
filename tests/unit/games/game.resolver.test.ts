import { describe, it, expect } from "vitest";
import { createGameRegistry, getSupportedGames, isGameSupported } from "../../../src/games/game.registry";
import { MockGameAdapter } from "../../../src/games/mock/mock.game";
import { PalworldAdapter } from "../../../src/games/palworld/palworld.adapter";

describe("GameResolver / createGameRegistry", () => {
  it("should construct and register PalworldAdapter and MockGameAdapter", () => {
    const registry = createGameRegistry();

    const mockAdapter = registry.getAdapter("mock");
    expect(mockAdapter).toBeInstanceOf(MockGameAdapter);

    const palworldAdapter = registry.getAdapter("palworld");
    expect(palworldAdapter).toBeInstanceOf(PalworldAdapter);
  });

  it("should throw for unregistered game slugs", () => {
    const registry = createGameRegistry();
    expect(() => registry.getAdapter("nonexistent")).toThrow(
      "No game adapter registered for: nonexistent",
    );
  });

  it("should report supported games correctly", () => {
    expect(getSupportedGames()).toEqual([
      { slug: "mock", name: "Mock Game Engine" },
      { slug: "palworld", name: "PalWorld" },
    ]);
    expect(isGameSupported("mock")).toBe(true);
    expect(isGameSupported("palworld")).toBe(true);
    expect(isGameSupported("unknown")).toBe(false);
  });
});
