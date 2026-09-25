import type { Database } from "../db";
import { AppError } from "../lib/errors";
import { ProviderRepository } from "../repositories/provider.repository";

export class ProviderService {
  private readonly repository: ProviderRepository;

  constructor(db: Database) {
    this.repository = new ProviderRepository(db);
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

    return this.repository.softDelete(id);
  }
}
