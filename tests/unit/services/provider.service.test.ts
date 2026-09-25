import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ProviderService } from '../../../src/services/provider.service';
import { ProviderRepository } from '../../../src/repositories/provider.repository';
import { ServerRepository } from '../../../src/repositories/server.repository';
import { AppError } from '../../../src/lib/errors';
import { Database } from '../../../src/db';

vi.mock('../../../src/repositories/provider.repository');
vi.mock('../../../src/repositories/server.repository');

describe('ProviderService', () => {
  let providerService: ProviderService;
  let db: Database;

  beforeEach(() => {
    vi.clearAllMocks();
    db = {} as Database;
    providerService = new ProviderService(db);
  });

  describe('getProviders', () => {
    it('should return all providers', async () => {
      const mockProviders = [{ id: '1', name: 'Provider1', slug: 'provider1', createdAt: new Date(), updatedAt: new Date(), deletedAt: null }];
      vi.mocked(ProviderRepository.prototype.findAll).mockResolvedValue(mockProviders);
      const result = await providerService.getProviders();
      expect(result).toEqual(mockProviders);
    });
  });

  describe('deleteProvider', () => {
    it('should delete provider if no active servers exist', async () => {
      const mockProvider = { id: '1', name: 'Provider1', slug: 'provider1', createdAt: new Date(), updatedAt: new Date() };
      vi.mocked(ProviderRepository.prototype.findById).mockResolvedValue(mockProvider);
      vi.mocked(ServerRepository.prototype.findActiveByProviderId).mockResolvedValue([]);
      vi.mocked(ProviderRepository.prototype.delete).mockResolvedValue(mockProvider);

      const result = await providerService.deleteProvider('1');
      expect(result).toEqual(mockProvider);
    });

    it('should throw if active servers exist when deleting provider', async () => {
      const mockProvider = { id: '1', name: 'Provider1', slug: 'provider1', createdAt: new Date(), updatedAt: new Date() };
      vi.mocked(ProviderRepository.prototype.findById).mockResolvedValue(mockProvider);
      vi.mocked(ServerRepository.prototype.findActiveByProviderId).mockResolvedValue([{ id: 'server-1' } as any]);

      await expect(providerService.deleteProvider('1')).rejects.toThrow(AppError);
    });
  });
});
