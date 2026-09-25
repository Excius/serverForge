import { Database } from "../db";
import { AppError } from "../lib/errors";
import { GameRepository } from "../repositories/game.repository";

export class GameService {
  private readonly repository: GameRepository;

  constructor(db: Database) {
    this.repository = new GameRepository(db);
  }

  async getGames() {
    return this.repository.findAll();
  }

  async getGameById(id: string) {
    return this.repository.findById(id);
  }

  async createGame(name: string, slug: string) {
    const existingGame = await this.repository.findBySlug(slug);

    if (existingGame.length > 0) {
      throw new AppError("A game with this slug already exists", 409);
    }

    return this.repository.create(name, slug);
  }

  async updateGame(
    id: string,
    data: {
      name?: string;
      slug?: string;
    },
  ) {
    const game = await this.repository.findById(id);

    if (!game) {
      return null;
    }

    if (data.slug && data.slug !== game.slug) {
      throw new AppError("A game with this slug already exists", 409);
    }

    return this.repository.update(id, data);
  }

  async deleteGame(id: string) {
    const game = await this.repository.findById(id);

    if (!game) {
      return null;
    }

    return this.repository.softDelete(id);
  }
}
