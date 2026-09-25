import { Database } from "../db";
import { env } from "../lib/config";
import { AppError } from "../lib/errors";
import { hashPassword, verifyPassword } from "../lib/password";
import { generateSessionToken, hashSessionToken } from "../lib/session";
import { SessionRepository } from "../repositories/session.repository";
import { UserRepository } from "../repositories/user.repository";

// TODO: Need something to clear the old session from db

export class AuthService {
  private readonly userRepository: UserRepository;
  private readonly sessoinRepository: SessionRepository;

  constructor(db: Database) {
    this.userRepository = new UserRepository(db);
    this.sessoinRepository = new SessionRepository(db);
  }

  async createUser(email: string, password: string) {
    const existingUser = await this.userRepository.findByEmail(email);

    if (existingUser) {
      throw new AppError("User with this email already exists", 409);
    }

    const hashPass = await hashPassword(password);

    const user = this.userRepository.create(email, hashPass);

    return user;
  }

  async login(email: string, password: string) {
    const user = await this.userRepository.findByEmail(email);

    if (!user) {
      throw new AppError("Invalid email or password", 401);
    }

    const validPassword = await verifyPassword(password, user.passwordHash);

    if (!validPassword) {
      throw new AppError("Invalid email or password", 401);
    }

    const token = generateSessionToken();

    const tokenHash = await hashSessionToken(token);

    const expiresAt = new Date(Date.now() + env.SESSION_DURATION * 1000);

    await this.sessoinRepository.create(user.id, tokenHash, expiresAt);

    return {
      user,
      token,
      expiresAt,
    };
  }

  async logout(token: string) {
    const tokenHash = await hashSessionToken(token);

    const session = await this.sessoinRepository.findByTokenHash(tokenHash);

    if (!session) {
      return;
    }

    await this.sessoinRepository.revokeById(session.id);
  }
}
