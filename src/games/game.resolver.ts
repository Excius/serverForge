import type { GameAdapter } from "./game";
// import { PalworldAdapter } from "./palworld.adapter";
// import { RuneScapeAdapter } from "./runescape.adapter";
import { MockGameAdapter } from "./mock-game";

export function resolveGame(slug: string): GameAdapter {
  switch (slug) {
    case "mock":
      return new MockGameAdapter();

    //     case "palworld":
    //       return new PalworldAdapter();
    //
    //     case "runescape":
    //       return new RuneScapeAdapter();

    default:
      throw new Error(`Unsupported game: ${slug}`);
  }
}
