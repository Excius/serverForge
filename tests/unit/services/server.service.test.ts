import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ServerService } from '../../../src/services/server.service';
import { ServerRepository } from '../../../src/repositories/server.repository';
import { GameRepository } from '../../../src/repositories/game.repository';
import { ProviderRepository } from '../../../src/repositories/provider.repository';
import { resolveProvider } from '../../../src/providers/provider.resolver';
import { AppError } from '../../../src/lib/errors';
import { Database } from '../../../src/db';
import { Bindings } from '../../../src/lib/config';

vi.mock('../../../src/repositories/server.repository');
vi.mock('../../../src/repositories/game.repository');
vi.mock('../../../src/repositories/provider.repository');
vi.mock('../../../src/providers/provider.resolver');

describe('ServerService', () => {
  let serverService: ServerService;
  let db: Database;
  let env: Bindings;
  
  beforeEach(() => {
    vi.clearAllMocks();
    db = {} as Database;
    env = {} as Bindings;
    serverService = new ServerService(db, env);
  });

  describe('createServer', () => {
    it('should create server successfully', async () => {
      vi.mocked(GameRepository.prototype.findById).mockResolvedValue({} as any);
      vi.mocked(ProviderRepository.prototype.findById).mockResolvedValue({} as any);
      vi.mocked(ServerRepository.prototype.findByProviderServerId).mockResolvedValue(null as any);
      vi.mocked(ServerRepository.prototype.create).mockResolvedValue({ id: 'server-1' } as any);

      const result = await serverService.createServer({
        name: 'test',
        createdBy: 'user-1',
        gameId: 'game-1',
        providerId: 'provider-1',
        providerServerId: 'ps-1'
      });
      
      expect(result).toEqual({ id: 'server-1' });
    });

    it('should throw if game not found', async () => {
      vi.mocked(GameRepository.prototype.findById).mockResolvedValue(null as any);
      await expect(serverService.createServer({} as any)).rejects.toThrow(AppError);
    });
  });

  describe('startServer', () => {
    it('should start server', async () => {
      const serverMock = { id: 's-1', providerId: 'p-1', providerServerId: 'ps-1' } as any;
      const providerMock = { id: 'p-1', slug: 'slug-1' } as any;
      vi.mocked(ServerRepository.prototype.findById).mockResolvedValue(serverMock);
      vi.mocked(ProviderRepository.prototype.findById).mockResolvedValue(providerMock);
      
      const computeProviderMock = { startServer: vi.fn() };
      vi.mocked(resolveProvider).mockReturnValue(computeProviderMock as any);
      vi.mocked(ServerRepository.prototype.update).mockResolvedValue({ ...serverMock, status: 'starting' });

      const result = await serverService.startServer('s-1');
      expect(computeProviderMock.startServer).toHaveBeenCalledWith('ps-1');
      expect(result?.status).toBe('starting');
    });
  });

  describe('stopServer', () => {
    it('should stop server', async () => {
      const serverMock = { id: 's-1', providerId: 'p-1', providerServerId: 'ps-1' } as any;
      const providerMock = { id: 'p-1', slug: 'slug-1' } as any;
      vi.mocked(ServerRepository.prototype.findById).mockResolvedValue(serverMock);
      vi.mocked(ProviderRepository.prototype.findById).mockResolvedValue(providerMock);
      
      const computeProviderMock = { stopServer: vi.fn() };
      vi.mocked(resolveProvider).mockReturnValue(computeProviderMock as any);
      vi.mocked(ServerRepository.prototype.update).mockResolvedValue({ ...serverMock, status: 'stopping' });

      const result = await serverService.stopServer('s-1');
      expect(computeProviderMock.stopServer).toHaveBeenCalledWith('ps-1');
      expect(result?.status).toBe('stopping');
    });
  });
});
