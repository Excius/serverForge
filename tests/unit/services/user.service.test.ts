import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UserService } from '../../../src/services/user.service';
import { UserRepository } from '../../../src/repositories/user.repository';
import { Database } from '../../../src/db';

vi.mock('../../../src/repositories/user.repository');

describe('UserService', () => {
  let userService: UserService;
  let db: Database;

  beforeEach(() => {
    vi.clearAllMocks();
    db = {} as Database;
    userService = new UserService(db);
  });

  it('should list all users', async () => {
    const mockUsers = [
      { id: 'usr-1', email: 'admin@example.com', role: 'admin', createdAt: new Date() },
      { id: 'usr-2', email: 'user@example.com', role: 'user', createdAt: new Date() },
    ];
    vi.mocked(UserRepository.prototype.listAll).mockResolvedValue(mockUsers as any);

    const users = await userService.getUsers();
    expect(users).toEqual(mockUsers);
    expect(UserRepository.prototype.listAll).toHaveBeenCalled();
  });

  it('should update user role', async () => {
    const mockUpdatedUser = { id: 'usr-2', email: 'user@example.com', role: 'admin' };
    vi.mocked(UserRepository.prototype.updateRole).mockResolvedValue(mockUpdatedUser as any);

    const updated = await userService.updateUserRole('usr-2', 'admin');
    expect(updated).toEqual(mockUpdatedUser);
    expect(UserRepository.prototype.updateRole).toHaveBeenCalledWith('usr-2', 'admin');
  });
});
