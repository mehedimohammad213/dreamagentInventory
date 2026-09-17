import bcrypt from 'bcryptjs';
import Model from '../lib/Model.js';
import config from '../config/index.js';
import { createToken, deleteToken } from '../lib/tokens.js';

export class User extends Model {
  static table = 'users';
  static fillable = ['name', 'username', 'email', 'password', 'role', 'email_verified_at'];
  static hidden = ['password', 'remember_token'];
  static casts = {
    id: 'integer',
  };

  static async create(data, client = null) {
    const payload = { ...data };
    if (payload.password && !payload.password.startsWith('$2')) {
      payload.password = await bcrypt.hash(payload.password, config.bcryptRounds);
    }
    return super.create(payload, client);
  }

  async save(client = null) {
    if (this.password && !String(this.password).startsWith('$2')) {
      this.password = await bcrypt.hash(this.password, config.bcryptRounds);
    }
    return super.save(client);
  }

  async verifyPassword(plain) {
    return bcrypt.compare(plain, this.password);
  }

  async createAccessToken(name = 'auth-token') {
    return createToken(this.id, name);
  }

  async revokeCurrentToken(tokenId) {
    return deleteToken(tokenId);
  }

  toSafeJSON() {
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
