import type { Database } from "../db";
import { AppError } from "../lib/errors";
import { ProviderRepository } from "../repositories/provider.repository";
import { ServerRepository } from "../repositories/server.repository";

export class ProviderService {
  private readonly repository: ProviderRepository;
  private readonly db: Database;

  constructor(db: Database) {
    this.repository = new ProviderRepository(db);
    this.db = db;
  }

  async getProviders() {
    return this.repository.findAll();
  }

  async getProviderById(id: string) {
    return this.repository.findById(id);
  }

  async createProvider(name: string, slug: string) {
    const existing = await this.repository.findBySlug(slug);

    if (existing) {
      throw new AppError("A provider with this slug already exists", 409);
    }

    return this.repository.create(name, slug);
  }

  async updateProvider(
    id: string,
    data: {
      name?: string;
      slug?: string;
    },
  ) {
    const provider = await this.repository.findById(id);

    if (!provider) {
      return null;
    }

    if (data.slug && data.slug !== provider.slug) {
      const existing = await this.repository.findBySlug(data.slug);

      if (existing) {
        throw new AppError("A provider with this slug already exists", 409);
      }
    }

    return this.repository.update(id, data);
  }

  async deleteProvider(id: string) {
    const provider = await this.repository.findById(id);

    if (!provider) {
      return null;
    }

    const serverRepository = new ServerRepository(this.db);
    const activeServers = await serverRepository.findActiveByProviderId(id);

    if (activeServers.length > 0) {
      throw new AppError(
        "Cannot delete provider node that is currently assigned to active servers",
        400,
      );
    }

    return this.repository.delete(id);
  }
}
