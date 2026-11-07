import { AuthRepository } from './repository.js';
import { generateTokenPair, verifyRefreshToken, JWTPayload } from '../../shared/utils/jwt.js';
import { hashPassword, comparePassword } from '../../shared/utils/password.js';
import {
  ValidationError,
  UnauthorizedError,
  NotFoundError,
  ConflictError,
} from '../../shared/utils/errors.js';
import { RegisterInput, LoginInput, RefreshTokenInput } from './schemas.js';
import { IUser } from './types.js';

export class AuthService {
  constructor(private authRepository: AuthRepository) {}

  async register(
    input: RegisterInput
  ): Promise<{
    user: Omit<IUser, 'password'>;
    tokens: { accessToken: string; refreshToken: string };
  }> {
    // Check if user already exists
    const existingUser = await this.authRepository.findUserByEmail(input.email);
    if (existingUser) {
      throw new ConflictError('User with this email already exists');
    }

    // Hash password
    const hashedPassword = await hashPassword(input.password);

    // Create user
    const user = await this.authRepository.createUser({
      ...input,
      password: hashedPassword,
      role: 'PATIENT',
      isVerified: false,
      image: '',
      address: { line1: '', line2: '' },
      gender: 'Not Selected',
      dob: 'Not Selected',
      phone: '0000000000',
    });

    // Generate tokens
    const payload: JWTPayload = {
      id: user._id.toString(),
      role: user.role,
      email: user.email,
    };

    const tokens = generateTokenPair(payload);

    // Save refresh token
    const refreshExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    await this.authRepository.saveRefreshToken(
      user._id.toString(),
      tokens.refreshToken,
      new Date(refreshExpiry)
    );

    // Return user without password
    const { password, ...userWithoutPassword } = user.toObject();
    return { user: userWithoutPassword, tokens };
  }

  async login(
    input: LoginInput
  ): Promise<{
    user: Omit<IUser, 'password'>;
    tokens: { accessToken: string; refreshToken: string };
  }> {
    const user = await this.authRepository.findUserByEmail(input.email);
    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const isPasswordValid = await comparePassword(input.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const payload: JWTPayload = {
      id: user._id.toString(),
      role: user.role,
      email: user.email,
    };

    const tokens = generateTokenPair(payload);

    // Save refresh token
    const refreshExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await this.authRepository.saveRefreshToken(
      user._id.toString(),
      tokens.refreshToken,
      new Date(refreshExpiry)
    );

    const { password, ...userWithoutPassword } = user.toObject();
    return { user: userWithoutPassword, tokens };
  }

  async refreshTokens(
    input: RefreshTokenInput
  ): Promise<{ accessToken: string; refreshToken: string }> {
    let payload: JWTPayload;
    try {
      payload = verifyRefreshToken(input.refreshToken);
    } catch {
      throw new (require('../../shared/utils/errors.js').UnauthorizedError)(
        'Invalid or expired refresh token'
      );
    }

    // Verify refresh token exists in DB
    const storedToken = await this.authRepository.findRefreshToken(input.refreshToken);
    if (!storedToken) {
      throw new (require('../../shared/utils/errors.js').UnauthorizedError)(
        'Invalid or expired refresh token'
      );
    }

    // Delete old refresh token
    await this.authRepository.deleteRefreshToken(input.refreshToken);

    // Generate new token pair
    const tokens = generateTokenPair({
      id: payload.id,
      role: payload.role,
      email: payload.email,
    });

    // Save new refresh token
    const refreshExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await this.authRepository.saveRefreshToken(
      payload.id,
      tokens.refreshToken,
      new Date(refreshExpiry)
    );

    return tokens;
  }

  async logout(userId: string): Promise<void> {
    await this.authRepository.deleteUserRefreshTokens(userId);
  }

  async getProfile(
    userId: string
  ): Promise<Omit<ReturnType<typeof import('mongoose').Document.prototype.toObject>, 'password'>> {
    const user = await this.authRepository.findUserById(userId);
    if (!user) {
      throw new (require('../../shared/utils/errors.js').NotFoundError)('User not found');
    }
    const { password, ...userWithoutPassword } = user.toObject();
    return userWithoutPassword;
  }

  async updateProfile(
    userId: string,
    updateData: Partial<{
      name: string;
      phone: string;
      address: { line1: string; line2: string };
      dob: string;
      gender: string;
    }>
  ): Promise<Omit<ReturnType<typeof import('mongoose').Document.prototype.toObject>, 'password'>> {
    const user = await this.authRepository.updateUser(userId, updateData);
    if (!user) {
      throw new (require('../../shared/utils/errors.js').NotFoundError)('User not found');
    }
    const { password, ...userWithoutPassword } = user.toObject();
    return userWithoutPassword;
  }
}
