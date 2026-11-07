import { Model } from 'mongoose';
import { IUser, IRefreshToken, UserDocument, RefreshTokenDocument } from './types.js';
import { UserModel, RefreshTokenModel } from '../../models/index.js';

export class AuthRepository {
  constructor(
    private userModel: Model<UserDocument> = UserModel as any,
    private refreshTokenModel: Model<RefreshTokenDocument> = RefreshTokenModel as any
  ) {}

  async findUserByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email }).exec();
  }

  async findUserById(id: string): Promise<UserDocument | null> {
    return this.userModel.findById(id).select('-password').exec();
  }

  async createUser(userData: Partial<IUser>): Promise<UserDocument> {
    const user = new this.userModel(userData);
    return user.save();
  }

  async updateUser(id: string, updateData: Partial<IUser>): Promise<UserDocument | null> {
    return this.userModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .select('-password')
      .exec();
  }

  async saveRefreshToken(
    userId: string,
    token: string,
    expiresAt: Date
  ): Promise<RefreshTokenDocument> {
    const refreshToken = new this.refreshTokenModel({ userId, token, expiresAt });
    return refreshToken.save();
  }

  async findRefreshToken(token: string): Promise<RefreshTokenDocument | null> {
    return this.refreshTokenModel.findOne({ token, expiresAt: { $gt: new Date() } }).exec();
  }

  async deleteRefreshToken(token: string): Promise<void> {
    await this.refreshTokenModel.deleteOne({ token }).exec();
  }

  async deleteUserRefreshTokens(userId: string): Promise<void> {
    await this.refreshTokenModel.deleteMany({ userId }).exec();
  }
}
