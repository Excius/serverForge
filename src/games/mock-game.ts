import type { GameAdapter, GameServerContext, GameServerInfo } from "./game";

export class MockGameAdapter implements GameAdapter {
  private playerCounts = new Map<string, number>();

  private heartbeatFailures = new Set<string>();

  async getServerInfo(context: GameServerContext): Promise<GameServerInfo> {
    if (this.heartbeatFailures.has(context.serverId)) {
      throw new Error("Mock game heartbeat failed");
    }

    const playerCount = this.playerCounts.get(context.serverId) ?? 0;

    return {
      playerCount,

      heartbeatAt: new Date(),
    };
  }

  setPlayerCount(serverId: string, playerCount: number) {
    if (playerCount < 0) {
      throw new Error("Player count cannot be negative");
    }

    this.playerCounts.set(serverId, playerCount);
  }

  setHeartbeatFailure(serverId: string, failed: boolean) {
    if (failed) {
      this.heartbeatFailures.add(serverId);
    } else {
      this.heartbeatFailures.delete(serverId);
    }
  }

  getPlayerCount(serverId: string) {
    return this.playerCounts.get(serverId) ?? 0;
  }
}
