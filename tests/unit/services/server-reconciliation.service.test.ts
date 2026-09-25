import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ServerReconciliationService } from '../../../src/services/server-reconciliation.service';
import { ServerRepository } from '../../../src/repositories/server.repository';
import { ProviderRepository } from '../../../src/repositories/provider.repository';
import { GameRepository } from '../../../src/repositories/game.repository';
import { resolveProvider } from '../../../src/providers/provider.resolver';
import { resolveGame } from '../../../src/games/game.resolver';
import { Database } from '../../../src/db';
import { Bindings } from '../../../src/lib/config';

vi.mock('../../../src/repositories/server.repository');
vi.mock('../../../src/repositories/provider.repository');
vi.mock('../../../src/repositories/game.repository');
vi.mock('../../../src/providers/provider.resolver');
vi.mock('../../../src/games/game.resolver');

describe('ServerReconciliationService', () => {
  let service: ServerReconciliationService;
  let db: Database;
  let env: Bindings;
  
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    db = {} as Database;
    env = {} as Bindings;
    service = new ServerReconciliationService(db, env);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should reconcile servers', async () => {
    const servers = [
      { id: '1', providerId: 'p1', providerServerId: 'ps1', status: 'unknown', gameId: 'g1', lastStartedAt: new Date(), lastPlayerActivityAt: new Date() }
    ];
    vi.mocked(ServerRepository.prototype.findServersForReconciliation).mockResolvedValue(servers as any);
    vi.mocked(ProviderRepository.prototype.findById).mockResolvedValue({ slug: 'p-slug' } as any);
    const mockProvider = { getServerStatus: vi.fn().mockResolvedValue('running'), stopServer: vi.fn() };
    vi.mocked(resolveProvider).mockReturnValue(mockProvider as any);
    vi.mocked(GameRepository.prototype.findById).mockResolvedValue({ slug: 'g-slug' } as any);
    const mockGame = { getServerInfo: vi.fn().mockResolvedValue({ playerCount: 0, heartbeatAt: new Date() }) };
    vi.mocked(resolveGame).mockReturnValue(mockGame as any);
    vi.mocked(ServerRepository.prototype.claimForStopping).mockResolvedValue(true as any);

    await service.reconcile();
    
    expect(mockProvider.getServerStatus).toHaveBeenCalledWith('ps1');
    expect(mockGame.getServerInfo).toHaveBeenCalled();
  });

  it('should stop idle server after 10 minutes timeout', async () => {
    const pastDate = new Date(Date.now() - 11 * 60 * 1000); // 11 mins ago
    const server = { id: '1', providerId: 'p1', providerServerId: 'ps1', status: 'running', gameId: 'g1', lastPlayerActivityAt: pastDate, lastStartedAt: pastDate };
    vi.mocked(ServerRepository.prototype.findServersForReconciliation).mockResolvedValue([server] as any);
    vi.mocked(ProviderRepository.prototype.findById).mockResolvedValue({ slug: 'p-slug' } as any);
    
    const mockProvider = { getServerStatus: vi.fn().mockResolvedValue('running'), stopServer: vi.fn() };
    vi.mocked(resolveProvider).mockReturnValue(mockProvider as any);
    
    vi.mocked(GameRepository.prototype.findById).mockResolvedValue({ slug: 'g-slug' } as any);
    const mockGame = { getServerInfo: vi.fn().mockResolvedValue({ playerCount: 0, heartbeatAt: new Date() }) };
    vi.mocked(resolveGame).mockReturnValue(mockGame as any);
    vi.mocked(ServerRepository.prototype.claimForStopping).mockResolvedValue(true as any);

    await service.reconcile();

    expect(ServerRepository.prototype.claimForStopping).toHaveBeenCalledWith('1');
    expect(mockProvider.stopServer).toHaveBeenCalledWith('ps1');
    expect(ServerRepository.prototype.update).toHaveBeenCalledWith('1', expect.objectContaining({ status: 'stopping' }));
  });

  it('should NOT stop server if under 10 minutes timeout', async () => {
    const pastDate = new Date(Date.now() - 5 * 60 * 1000); // 5 mins ago
    const server = { id: '1', providerId: 'p1', providerServerId: 'ps1', status: 'running', gameId: 'g1', lastPlayerActivityAt: pastDate, lastStartedAt: pastDate };
    vi.mocked(ServerRepository.prototype.findServersForReconciliation).mockResolvedValue([server] as any);
    vi.mocked(ProviderRepository.prototype.findById).mockResolvedValue({ slug: 'p-slug' } as any);
    
    const mockProvider = { getServerStatus: vi.fn().mockResolvedValue('running'), stopServer: vi.fn() };
    vi.mocked(resolveProvider).mockReturnValue(mockProvider as any);
    
    vi.mocked(GameRepository.prototype.findById).mockResolvedValue({ slug: 'g-slug' } as any);
    const mockGame = { getServerInfo: vi.fn().mockResolvedValue({ playerCount: 0, heartbeatAt: new Date() }) };
    vi.mocked(resolveGame).mockReturnValue(mockGame as any);

    await service.reconcile();

    expect(ServerRepository.prototype.claimForStopping).not.toHaveBeenCalled();
    expect(mockProvider.stopServer).not.toHaveBeenCalled();
  });

  it('should NOT stop server if it has players', async () => {
    const pastDate = new Date(Date.now() - 15 * 60 * 1000); // 15 mins ago
    const server = { id: '1', providerId: 'p1', providerServerId: 'ps1', status: 'running', gameId: 'g1', lastPlayerActivityAt: pastDate, lastStartedAt: pastDate };
    vi.mocked(ServerRepository.prototype.findServersForReconciliation).mockResolvedValue([server] as any);
    vi.mocked(ProviderRepository.prototype.findById).mockResolvedValue({ slug: 'p-slug' } as any);
    
    const mockProvider = { getServerStatus: vi.fn().mockResolvedValue('running'), stopServer: vi.fn() };
    vi.mocked(resolveProvider).mockReturnValue(mockProvider as any);
    
    vi.mocked(GameRepository.prototype.findById).mockResolvedValue({ slug: 'g-slug' } as any);
    const mockGame = { getServerInfo: vi.fn().mockResolvedValue({ playerCount: 1, heartbeatAt: new Date() }) }; // 1 player
    vi.mocked(resolveGame).mockReturnValue(mockGame as any);

    await service.reconcile();

    expect(ServerRepository.prototype.claimForStopping).not.toHaveBeenCalled();
    expect(mockProvider.stopServer).not.toHaveBeenCalled();
    expect(ServerRepository.prototype.updateHealth).toHaveBeenCalledWith('1', expect.objectContaining({ playerCount: 1 }));
  });

  it('should set server to error if provider fails', async () => {
    const server = { id: '1', providerId: 'p1', providerServerId: 'ps1', status: 'running', gameId: 'g1' };
    vi.mocked(ServerRepository.prototype.findServersForReconciliation).mockResolvedValue([server] as any);
    vi.mocked(ProviderRepository.prototype.findById).mockResolvedValue(null);

    await service.reconcile();

    expect(ServerRepository.prototype.update).toHaveBeenCalledWith('1', { status: 'error' });
  });

  it('should handle game heartbeat failure', async () => {
    const server = { id: '1', providerId: 'p1', providerServerId: 'ps1', status: 'running', gameId: 'g1' };
    vi.mocked(ServerRepository.prototype.findServersForReconciliation).mockResolvedValue([server] as any);
    vi.mocked(ProviderRepository.prototype.findById).mockResolvedValue({ slug: 'p-slug' } as any);
    const mockProvider = { getServerStatus: vi.fn().mockResolvedValue('running') };
    vi.mocked(resolveProvider).mockReturnValue(mockProvider as any);
    vi.mocked(GameRepository.prototype.findById).mockResolvedValue({ slug: 'g-slug' } as any);
    const mockGame = { getServerInfo: vi.fn().mockRejectedValue(new Error('Heartbeat failed')) };
    vi.mocked(resolveGame).mockReturnValue(mockGame as any);

    await service.reconcile();

    expect(ServerRepository.prototype.updateHealth).not.toHaveBeenCalled();
  });
});
