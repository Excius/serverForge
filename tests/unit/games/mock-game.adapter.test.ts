import { describe, it, expect, beforeEach } from 'vitest';
import { MockGameAdapter } from '../../../src/games/mock-game';

describe('MockGameAdapter', () => {
  let adapter: MockGameAdapter;
  
  beforeEach(() => {
    adapter = new MockGameAdapter();
  });

  it('should return initial player count of 0', async () => {
    const info = await adapter.getServerInfo({ serverId: 's1', providerServerId: 'ps1', provider: 'mock' });
    expect(info.playerCount).toBe(0);
    expect(info.heartbeatAt).toBeInstanceOf(Date);
  });

  it('should allow setting player count', async () => {
    adapter.setPlayerCount('s1', 5);
    const info = await adapter.getServerInfo({ serverId: 's1', providerServerId: 'ps1', provider: 'mock' });
    expect(info.playerCount).toBe(5);
    expect(adapter.getPlayerCount('s1')).toBe(5);
  });

  it('should throw if player count is negative', () => {
    expect(() => adapter.setPlayerCount('s1', -1)).toThrow();
  });

  it('should simulate heartbeat failure', async () => {
    adapter.setHeartbeatFailure('s1', true);
    await expect(adapter.getServerInfo({ serverId: 's1', providerServerId: 'ps1', provider: 'mock' })).rejects.toThrow('Mock game heartbeat failed');
    
    adapter.setHeartbeatFailure('s1', false);
    await expect(adapter.getServerInfo({ serverId: 's1', providerServerId: 'ps1', provider: 'mock' })).resolves.toBeDefined();
  });
});
