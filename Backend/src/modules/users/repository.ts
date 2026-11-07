import { Model } from 'mongoose';
import { IUser, IUserUpdate, UserDocument } from './types.js';
import { UserModel } from '../../models/index.js';

export class UserRepository {
  constructor(private userModel: Model<UserDocument> = UserModel as any) {}

  async findById(id: string): Promise<UserDocument | null> {
    return this.userModel.findById(id).select('-password').exec();
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email }).exec();
  }

  async update(id: string, data: IUserUpdate): Promise<UserDocument | null> {
    return this.userModel.findByIdAndUpdate(id, data, { new: true }).select('-password').exec();
  }

  async findAll(
    query: any = {},
    page = 1,
    limit = 20
  ): Promise<{ users: UserDocument[]; total: number }> {
    const skip = (page - 1) * limit;
    const [users, total] = await Promise.all([
      this.userModel.find(query).select('-password').skip(skip).limit(limit).exec(),
      this.userModel.countDocuments(query).exec(),
    ]);
    return { users, total };
  }
}
