import bcrypt from 'bcryptjs';
import type { PoolClient } from 'pg';
import Model from '../lib/Model.js';
import config from '../config/index.js';
import { createToken, deleteToken } from '../lib/tokens.js';
import type { CreatedToken } from '../lib/tokens.js';

export class User extends Model {
  static table = 'users';
  static fillable = ['name', 'username', 'email', 'password', 'role', 'email_verified_at'];
  static hidden = ['password', 'remember_token'];
  static casts = {
    id: 'integer',
  };

  declare id: number;
  declare name: string;
  declare username: string;
  declare email: string;
  declare password: string;
  declare role: string;
  declare created_at?: Date | string;

  static async create(data: Record<string, unknown>, client: PoolClient | null = null): Promise<User> {
    const payload = { ...data };
    if (payload.password && !String(payload.password).startsWith('$2')) {
      payload.password = await bcrypt.hash(String(payload.password), config.bcryptRounds);
    }
    return super.create(payload, client) as Promise<User>;
  }

  async save(client: PoolClient | null = null): Promise<this> {
    if (this.password && !String(this.password).startsWith('$2')) {
      this.password = await bcrypt.hash(this.password, config.bcryptRounds);
    }
    return super.save(client);
  }

  async verifyPassword(plain: string): Promise<boolean> {
    return bcrypt.compare(plain, this.password);
  }

  async createAccessToken(name = 'auth-token'): Promise<CreatedToken> {
    return createToken(this.id, name);
  }

  async revokeCurrentToken(tokenId: number): Promise<void> {
    return deleteToken(tokenId);
  }

  toSafeJSON(): Record<string, unknown> {
    return {
      id: this.id,
      name: this.name,
      username: this.username,
      email: this.email,
      role: this.role || 'user',
      created_at: this.created_at,
    };
  }
}

export default User;
