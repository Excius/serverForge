import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GameService } from '../../../src/services/game.service';
import { GameRepository } from '../../../src/repositories/game.repository';
import { AppError } from '../../../src/lib/errors';
import { Database } from '../../../src/db';

vi.mock('../../../src/repositories/game.repository');

describe('GameService', () => {
  let gameService: GameService;
  let db: Database;
  
  beforeEach(() => {
    vi.clearAllMocks();
    db = {} as Database;
    gameService = new GameService(db);
  });

  describe('getGames', () => {
    it('should return all games', async () => {
      const mockGames = [{ id: '1', name: 'Game1', slug: 'game1', createdAt: new Date(), updatedAt: new Date(), deletedAt: null }];
      vi.mocked(GameRepository.prototype.findAll).mockResolvedValue(mockGames);
      const result = await gameService.getGames();
      expect(result).toEqual(mockGames);
    });
  });

  describe('getGameById', () => {
    it('should return game by id', async () => {
      const mockGame = { id: '1', name: 'Game1', slug: 'game1', createdAt: new Date(), updatedAt: new Date(), deletedAt: null };
      vi.mocked(GameRepository.prototype.findById).mockResolvedValue(mockGame);
      const result = await gameService.getGameById('1');
      expect(result).toEqual(mockGame);
    });
  });

  describe('createGame', () => {
    it('should create game', async () => {
      vi.mocked(GameRepository.prototype.findBySlug).mockResolvedValue([]);
      const mockGame = { id: '1', name: 'Game1', slug: 'game1', createdAt: new Date(), updatedAt: new Date(), deletedAt: null };
      vi.mocked(GameRepository.prototype.create).mockResolvedValue(mockGame);
      const result = await gameService.createGame('Game1', 'game1');
      expect(result).toEqual(mockGame);
    });

    it('should throw if slug exists', async () => {
      const mockGame = { id: '1', name: 'Game1', slug: 'game1', createdAt: new Date(), updatedAt: new Date(), deletedAt: null };
      vi.mocked(GameRepository.prototype.findBySlug).mockResolvedValue([mockGame]);
      await expect(gameService.createGame('Game1', 'game1')).rejects.toThrow(AppError);
    });
  });

  describe('updateGame', () => {
    it('should update game', async () => {
      const mockGame = { id: '1', name: 'Game1', slug: 'game1', createdAt: new Date(), updatedAt: new Date(), deletedAt: null };
      vi.mocked(GameRepository.prototype.findById).mockResolvedValue(mockGame);
      const updatedMockGame = { ...mockGame, name: 'Game2' };
      vi.mocked(GameRepository.prototype.update).mockResolvedValue(updatedMockGame);
      
      const result = await gameService.updateGame('1', { name: 'Game2' });
      expect(result).toEqual(updatedMockGame);
    });

    it('should throw if new slug exists', async () => {
      const mockGame = { id: '1', name: 'Game1', slug: 'game1', createdAt: new Date(), updatedAt: new Date(), deletedAt: null };
      vi.mocked(GameRepository.prototype.findById).mockResolvedValue(mockGame);
      await expect(gameService.updateGame('1', { slug: 'game2' })).rejects.toThrow(AppError);
    });
  });

  describe('deleteGame', () => {
    it('should delete game', async () => {
      const mockGame = { id: '1', name: 'Game1', slug: 'game1', createdAt: new Date(), updatedAt: new Date(), deletedAt: null };
      vi.mocked(GameRepository.prototype.findById).mockResolvedValue(mockGame);
      vi.mocked(GameRepository.prototype.softDelete).mockResolvedValue(mockGame);
      
      const result = await gameService.deleteGame('1');
      expect(result).toEqual(mockGame);
    });
  });
});
