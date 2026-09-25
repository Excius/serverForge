import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthService } from '../../../src/services/auth.service';
import { UserRepository } from '../../../src/repositories/user.repository';
import { SessionRepository } from '../../../src/repositories/session.repository';
import { AppError } from '../../../src/lib/errors';
import { hashPassword, verifyPassword } from '../../../src/lib/password';
import { generateSessionToken, hashSessionToken } from '../../../src/lib/session';
import { env } from '../../../src/lib/config';
import { Database } from '../../../src/db';

vi.mock('../../../src/repositories/user.repository');
vi.mock('../../../src/repositories/session.repository');
vi.mock('../../../src/lib/password');
vi.mock('../../../src/lib/session');
vi.mock('../../../src/lib/config', () => ({
  env: { SESSION_DURATION: 3600 }
}));

describe('AuthService', () => {
  let authService: AuthService;
  let db: Database;
  
  beforeEach(() => {
    vi.clearAllMocks();
    db = {} as Database;
    authService = new AuthService(db);
  });

  describe('createUser', () => {
    it('should create a user successfully', async () => {
      vi.mocked(UserRepository.prototype.findByEmail).mockResolvedValue(null as any);
      vi.mocked(hashPassword).mockResolvedValue('hashedPassword');
      const mockUser = { id: 'user-1', email: 'test@example.com', passwordHash: 'hashedPassword', role: 'user' as const, createdAt: new Date(), updatedAt: new Date(), deletedAt: null };
      vi.mocked(UserRepository.prototype.create).mockResolvedValue(mockUser);

      const result = await authService.createUser('test@example.com', 'password123');
      
      expect(result).toEqual(mockUser);
      expect(UserRepository.prototype.findByEmail).toHaveBeenCalledWith('test@example.com');
      expect(hashPassword).toHaveBeenCalledWith('password123');
      expect(UserRepository.prototype.create).toHaveBeenCalledWith('test@example.com', 'hashedPassword');
    });

    it('should throw AppError if user already exists', async () => {
      const mockUser = { id: 'user-1', email: 'test@example.com', passwordHash: 'hashedPassword', role: 'user' as const, createdAt: new Date(), updatedAt: new Date(), deletedAt: null };
      vi.mocked(UserRepository.prototype.findByEmail).mockResolvedValue(mockUser);

      await expect(authService.createUser('test@example.com', 'password123')).rejects.toThrow(AppError);
    });
  });

  describe('login', () => {
    it('should login successfully and return session', async () => {
      const mockUser = { id: 'user-1', email: 'test@example.com', passwordHash: 'hashedPassword', role: 'user' as const, createdAt: new Date(), updatedAt: new Date(), deletedAt: null };
      vi.mocked(UserRepository.prototype.findByEmail).mockResolvedValue(mockUser);
      vi.mocked(verifyPassword).mockResolvedValue(true);
      vi.mocked(generateSessionToken).mockReturnValue('token');
      vi.mocked(hashSessionToken).mockResolvedValue('tokenHash');
      vi.mocked(SessionRepository.prototype.create).mockResolvedValue(undefined as any);
      
      const beforeDate = Date.now();
      const result = await authService.login('test@example.com', 'password123');
      const afterDate = Date.now();
      
      expect(result.user).toEqual(mockUser);
      expect(result.token).toBe('token');
      expect(result.expiresAt.getTime()).toBeGreaterThanOrEqual(beforeDate + env.SESSION_DURATION * 1000);
      expect(result.expiresAt.getTime()).toBeLessThanOrEqual(afterDate + env.SESSION_DURATION * 1000);
    });

    it('should throw AppError if user not found', async () => {
      vi.mocked(UserRepository.prototype.findByEmail).mockResolvedValue(null as any);
      await expect(authService.login('test@example.com', 'password123')).rejects.toThrow(AppError);
    });

    it('should throw AppError if password invalid', async () => {
      const mockUser = { id: 'user-1', email: 'test@example.com', passwordHash: 'hashedPassword', role: 'user' as const, createdAt: new Date(), updatedAt: new Date(), deletedAt: null };
      vi.mocked(UserRepository.prototype.findByEmail).mockResolvedValue(mockUser);
      vi.mocked(verifyPassword).mockResolvedValue(false);
      await expect(authService.login('test@example.com', 'password123')).rejects.toThrow(AppError);
    });
  });

  describe('logout', () => {
    it('should logout successfully', async () => {
      vi.mocked(hashSessionToken).mockResolvedValue('tokenHash');
      const mockSession = { id: 'session-1', userId: 'user-1', tokenHash: 'tokenHash', expiresAt: new Date(), createdAt: new Date(), revokedAt: null };
      vi.mocked(SessionRepository.prototype.findByTokenHash).mockResolvedValue(mockSession);
      
      await authService.logout('token');
      
      expect(SessionRepository.prototype.revokeById).toHaveBeenCalledWith('session-1');
    });

    it('should do nothing if session not found', async () => {
      vi.mocked(hashSessionToken).mockResolvedValue('tokenHash');
      vi.mocked(SessionRepository.prototype.findByTokenHash).mockResolvedValue(null as any);
      
      await authService.logout('token');
      
      expect(SessionRepository.prototype.revokeById).not.toHaveBeenCalled();
    });
  });
});
