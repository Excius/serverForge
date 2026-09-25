import { GameAdapter, GameServerContext, GameServerInfo } from "../game";
import { PalworldClient } from "./palworld.client";

export interface PalworldConfig {
  PALWORLD_API_URL: string;
  PALWORLD_API_USERNAME: string;
  PALWORLD_API_PASSWORD: string;
}

export class PalworldAdapter implements GameAdapter {
  constructor(private readonly client: PalworldClient) {}

  async getServerInfo(_context: GameServerContext): Promise<GameServerInfo> {
    const [_serverInfo, players] = await Promise.all([
      this.client.getServerInfo(),
      this.client.getPlayers(),
    ]);

    return {
      playerCount: players.players.length,
      heartbeatAt: new Date(),
    };
  }
}
