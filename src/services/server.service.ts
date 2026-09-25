import type { Database } from "../db";
import { AppError } from "../lib/errors";
import { ServerRepository } from "../repositories/server.repository";
import { GameRepository } from "../repositories/game.repository";
import { ProviderRepository } from "../repositories/provider.repository";
import { resolveProvider } from "../providers/provider.resolver";
import { Bindings } from "../lib/config";

export class ServerService {
  private readonly serverRepository: ServerRepository;
  private readonly gameRepository: GameRepository;
  private readonly providerRepository: ProviderRepository;
  private readonly env: Bindings;

  constructor(db: Database, env: Bindings) {
    this.serverRepository = new ServerRepository(db);
    this.gameRepository = new GameRepository(db);
    this.providerRepository = new ProviderRepository(db);
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

    return this.serverRepository.create({
      ...data,
      status: "unknown",
    });
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

    return this.serverRepository.softDelete(id);
  }

  async startServer(id: string) {
    const server = await this.serverRepository.findById(id);

    if (!server) {
      return null;
    }

    const provider = await this.providerRepository.findById(server.providerId);

    if (!provider) {
      throw new AppError("Provider not found", 404);
    }

    const computeProvider = resolveProvider(provider.slug, this.env);

    await computeProvider.startServer(server.providerServerId);

    return this.serverRepository.update(server.id, {
      status: "starting",
    });
  }

  async stopServer(id: string) {
    const server = await this.serverRepository.findById(id);

    if (!server) {
      return null;
    }

    const provider = await this.providerRepository.findById(server.providerId);

    if (!provider) {
      throw new AppError("Provider not found", 404);
    }

    const computeProvider = resolveProvider(provider.slug, this.env);

    await computeProvider.stopServer(server.providerServerId);

    return this.serverRepository.update(server.id, {
      status: "stopping",
    });
  }

  async getServerStatus(id: string) {
    const server = await this.serverRepository.findById(id);

    if (!server) {
      return null;
    }

    const provider = await this.providerRepository.findById(server.providerId);

    if (!provider) {
      throw new AppError("Provider not found", 404);
    }

    const computeProvider = resolveProvider(provider.slug, this.env);

    const status = await computeProvider.getServerStatus(
      server.providerServerId,
    );

    if (status !== server.status) {
      await this.serverRepository.update(server.id, {
        status,
      });
    }

    return {
      ...server,
      status,
    };
  }

  async getServerIp(id: string) {
    const server = await this.serverRepository.findById(id);

    if (!server) {
      return null;
    }

    const provider = await this.providerRepository.findById(server.providerId);

    if (!provider) {
      throw new AppError("Provider not found", 404);
    }

    const computeProvider = resolveProvider(provider.slug, this.env);

    const ip = await computeProvider.getServerIp(server.providerServerId);

    return {
      server,
      ip,
    };
  }
}
