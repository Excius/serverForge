import type { ProviderServerStatus } from "../providers/provider";

export interface GameServerContext {
  serverId: string;
  providerServerId: string;
  provider: string;
}

export interface GameServerInfo {
  playerCount: number;
  heartbeatAt: Date;
}

export interface GameAdapter {
  getServerInfo(context: GameServerContext): Promise<GameServerInfo>;
}
