import type { Database } from "../db";
import type { Bindings } from "../lib/config";
import { resolveProvider } from "../providers/provider.resolver";
import { resolveGame } from "../games/game.resolver";
import { ServerRepository } from "../repositories/server.repository";
import { ProviderRepository } from "../repositories/provider.repository";
import { GameRepository } from "../repositories/game.repository";

const IDLE_TIMEOUT_MS = 10 * 60 * 1000;

export class ServerReconciliationService {
  private readonly serverRepository: ServerRepository;
  private readonly providerRepository: ProviderRepository;
  private readonly gameRepository: GameRepository;

  constructor(
    private readonly db: Database,
    private readonly env: Bindings,
  ) {
    this.serverRepository = new ServerRepository(db);
    this.providerRepository = new ProviderRepository(db);
    this.gameRepository = new GameRepository(db);
  }

  async reconcile() {
    const servers = await this.serverRepository.findServersForReconciliation();

    for (const server of servers) {
      try {
        await this.reconcileServer(server);
      } catch (error) {
        console.error(`Failed to reconcile server ${server.id}`, error);
      }
    }
  }

  private async reconcileServer(
    server: Awaited<
      ReturnType<ServerRepository["findServersForReconciliation"]>
    >[number],
  ) {
    const provider = await this.providerRepository.findById(server.providerId);

    if (!provider) {
      console.error(
        `Provider ${server.providerId} not found for server ${server.id}`,
      );

      await this.serverRepository.update(server.id, {
        status: "error",
      });

      return;
    }

    const computeProvider = resolveProvider(provider.slug, this.env);

    const providerStatus = await computeProvider.getServerStatus(
      server.providerServerId,
    );

    if (providerStatus === "stopped") {
      if (server.status !== "stopped") {
        await this.serverRepository.update(server.id, {
          status: "stopped",
        });
      }

      return;
    }

    if (providerStatus === "error") {
      await this.serverRepository.update(server.id, {
        status: "error",
      });

      return;
    }

    if (providerStatus === "running" && server.status !== "running") {
      await this.serverRepository.update(server.id, {
        status: "running",
      });
    }

    const game = await this.gameRepository.findById(server.gameId);

    if (!game) {
      console.error(`Game ${server.gameId} not found for server ${server.id}`);

      await this.serverRepository.update(server.id, {
        status: "error",
      });

      return;
    }

    const gameAdapter = resolveGame(game.slug);

    let serverInfo;

    try {
      serverInfo = await gameAdapter.getServerInfo({
        serverId: server.id,
        providerServerId: server.providerServerId,
        provider: provider.slug,
      });
    } catch (error) {
      console.error(
        `Failed to get game information for server ${server.id}`,
        error,
      );

      return;
    }

    const hasPlayers = serverInfo.playerCount > 0;

    const now = new Date();

    await this.serverRepository.updateHealth(server.id, {
      playerCount: serverInfo.playerCount,
      lastHeartbeatAt: serverInfo.heartbeatAt,
      ...(hasPlayers
        ? {
            lastPlayerActivityAt: now,
          }
        : {}),
    });

    if (hasPlayers) {
      return;
    }

    const idleSince = server.lastPlayerActivityAt ?? server.lastStartedAt;

    if (!idleSince) {
      return;
    }

    const idleDuration = now.getTime() - idleSince.getTime();

    if (idleDuration < IDLE_TIMEOUT_MS) {
      return;
    }

    console.log(
      `Stopping idle server ${server.id}. ` +
        `Idle for ${Math.floor(idleDuration / 1000)} seconds.`,
    );

    const claimed = await this.serverRepository.claimForStopping(server.id);

    if (!claimed) {
      console.log(`Server ${server.id} was already claimed for stopping`);
      return;
    }

    try {
      await computeProvider.stopServer(server.providerServerId);

      await this.serverRepository.update(server.id, {
        status: "stopping",
        lastStoppedAt: now,
      });

      console.log(`Stop request sent for server ${server.id}`);
    } catch (error) {
      console.error(`Failed to stop server ${server.id}`, error);

      await this.serverRepository.update(server.id, {
        status: "error",
      });
    }
  }
}
