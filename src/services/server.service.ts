import type { Database } from "../db";
import { AppError } from "../lib/errors";
import { ServerRepository } from "../repositories/server.repository";
import { GameRepository } from "../repositories/game.repository";
import { ProviderRepository } from "../repositories/provider.repository";
import { resolveProvider } from "../providers/provider.registry";
import type { ProviderServerStatus } from "../providers/provider";
import { Bindings } from "../lib/config";
import { ServerAccessService } from "./server-access.service";
import { ConfigurationService } from "./configuration.service";

export class ServerService {
  private readonly serverRepository: ServerRepository;
  private readonly gameRepository: GameRepository;
  private readonly providerRepository: ProviderRepository;
  private readonly configService: ConfigurationService;
  private readonly db: Database;
  private readonly env: Bindings;

  constructor(db: Database, env: Bindings) {
    this.serverRepository = new ServerRepository(db);
    this.gameRepository = new GameRepository(db);
    this.providerRepository = new ProviderRepository(db);
    this.configService = new ConfigurationService(db, env?.CONFIG_ENCRYPTION_KEY);
    this.db = db;
    this.env = env;
  }

  async getServers() {
    return this.serverRepository.findAll();
  }

  async getServersForUser(userId: string) {
    return this.serverRepository.findForUser(userId);
  }

  async getServerById(id: string) {
    return this.serverRepository.findById(id);
  }

  async createServer(data: {
    name: string;
    createdBy: string;
    gameId: string;
    providerId: string;
    providerServerId: string;
  }) {
    const game = await this.gameRepository.findById(data.gameId);

    if (!game) {
      throw new AppError("Game not found", 404);
    }

    const provider = await this.providerRepository.findById(data.providerId);

    if (!provider) {
      throw new AppError("Provider not found", 404);
    }

    const existing = await this.serverRepository.findByProviderServerId(
      data.providerId,
      data.providerServerId,
    );

    if (existing) {
      throw new AppError("This provider server is already registered", 409);
    }

    const server = await this.serverRepository.create({
      ...data,
      status: "unknown",
    });

    try {
      const accessService = new ServerAccessService(this.db);
      await accessService.grantAccess(server.id, data.createdBy);
    } catch {
      // Ignore if access rule already exists
    }

    return server;
  }

  async updateServer(
    id: string,
    data: {
      name?: string;
    },
  ) {
    const server = await this.serverRepository.findById(id);

    if (!server) {
      return null;
    }

    return this.serverRepository.update(id, data);
  }

  async deleteServer(id: string) {
    const server = await this.serverRepository.findById(id);

    if (!server) {
      return null;
    }

    return this.serverRepository.delete(id);
  }

  async startServer(id: string) {
    const ctx = await this.resolveServerContext(id);
    if (!ctx) return null;

    await ctx.computeProvider.startServer(ctx.server.providerServerId);

    return this.serverRepository.update(ctx.server.id, {
      status: "starting",
    });
  }

  async stopServer(id: string) {
    const ctx = await this.resolveServerContext(id);
    if (!ctx) return null;

    await ctx.computeProvider.stopServer(ctx.server.providerServerId);

    return this.serverRepository.update(ctx.server.id, {
      status: "stopping",
    });
  }

  async getServerStatus(id: string) {
    const ctx = await this.resolveServerContext(id);
    if (!ctx) return null;

    let status: ProviderServerStatus = "error";

    try {
      status = await ctx.computeProvider.getServerStatus(
        ctx.server.providerServerId,
      );
    } catch (error: any) {
      console.error(
        `[ServerService] Exception querying status for server ${id} (providerServerId: ${ctx.server.providerServerId}):`,
        error?.message || error,
      );
      status = "error";
    }

    if (status !== ctx.server.status) {
      await this.serverRepository.update(ctx.server.id, {
        status,
      });
    }

    return {
      ...ctx.server,
      status,
    };
  }

  async getServerIp(id: string) {
    const ctx = await this.resolveServerContext(id);
    if (!ctx) return null;

    const ip = await ctx.computeProvider.getServerIp(ctx.server.providerServerId);

    return {
      server: ctx.server,
      ip,
    };
  }

  private async resolveServerContext(id: string) {
    const server = await this.serverRepository.findById(id);
    if (!server) {
      return null;
    }

    const provider = await this.providerRepository.findById(server.providerId);
    if (!provider) {
      throw new AppError("Provider not found", 404);
    }

    const computeProvider = await resolveProvider(
      provider.slug,
      this.configService,
      provider.id,
    );

    return { server, provider, computeProvider };
  }
}
