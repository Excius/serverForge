import { Database } from "../db";
import { ServerAccessRepository } from "../repositories/server-access.repository";

export class ServerAccessService {
  private repository: ServerAccessRepository;

  constructor(db: Database) {
    this.repository = new ServerAccessRepository(db);
  }

  async grantAccess(serverId: string, userId: string) {
    return this.repository.grantAccess(serverId, userId);
  }

  async revokeAccess(serverId: string, userId: string) {
    return this.repository.revokeAccess(serverId, userId);
  }

  async hasAccess(serverId: string, userId: string) {
    return this.repository.hasAccess(serverId, userId);
  }

  async getUsersForServer(serverId: string) {
    return this.repository.getUsersForServer(serverId);
  }
}
