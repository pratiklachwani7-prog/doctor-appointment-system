import { UserRepository } from './repository.js';
import { hashPassword, comparePassword } from '../../shared/utils/password.js';
import {
  ValidationError,
  NotFoundError,
  ConflictError,
  UnauthorizedError,
} from '../../shared/utils/errors.js';
import { UpdateProfileInput, ChangePasswordInput } from './schemas.js';
import { IUser } from './types.js';

export class UserService {
  constructor(private userRepository: UserRepository) {}

  async updateProfile(userId: string, input: UpdateProfileInput): Promise<Omit<IUser, 'password'>> {
    const user = await this.userRepository.update(userId, input);
    if (!user) {
      throw new NotFoundError('User not found');
    }
    const { password, ...userWithoutPassword } = user.toObject();
    return userWithoutPassword;
  }

  async changePassword(userId: string, input: ChangePasswordInput): Promise<void> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    const isValid = await comparePassword(input.currentPassword, user.password);
    if (!isValid) {
      throw new UnauthorizedError('Current password is incorrect');
    }

    const hashedPassword = await hashPassword(input.newPassword);
    await this.userRepository.update(userId, { password: hashedPassword });
  }

  async getProfile(userId: string): Promise<Omit<IUser, 'password'>> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }
    const { password, ...userWithoutPassword } = user.toObject();
    return userWithoutPassword;
  }

  async getUsers(
    page = 1,
    limit = 20,
    role?: string
  ): Promise<{ users: Omit<IUser, 'password'>[]; total: number }> {
    const query = role ? { role } : {};
    const { users, total } = await this.userRepository.findAll(query, page, limit);
    const usersWithoutPassword = users.map(user => {
      const { password, ...userWithoutPassword } = user.toObject();
      return userWithoutPassword;
    });
    return { users: usersWithoutPassword, total };
  }
}
