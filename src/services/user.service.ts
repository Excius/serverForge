import { Database } from "../db";
import { UserRepository } from "../repositories/user.repository";

export class UserService {
  private readonly userRepository: UserRepository;

  constructor(db: Database) {
    this.userRepository = new UserRepository(db);
  }

  async getUsers() {
    return this.userRepository.listAll();
  }

  async getUserById(id: string) {
    return this.userRepository.findById(id);
  }

  async updateUserRole(id: string, role: "admin" | "user") {
    return this.userRepository.updateRole(id, role);
  }
}
