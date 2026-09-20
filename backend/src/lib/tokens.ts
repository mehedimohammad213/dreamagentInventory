import crypto from 'crypto';
import { query } from '../db/pool.js';

/**
 * Laravel Sanctum-compatible personal access tokens.
 * Plain token format: `{id}|{40-char-random}`
 * Stored hash: sha256(plainRandom)
 */

export function hashToken(plain: string): string {
  return crypto.createHash('sha256').update(plain).digest('hex');
}

export function generatePlainToken(): string {
  return crypto.randomBytes(20).toString('hex'); // 40 hex chars
}

export interface CreatedToken {
  id: number;
  plainTextToken: string;
  token_type: string;
}

export async function createToken(userId: number, name = 'auth-token'): Promise<CreatedToken> {
  const plain = generatePlainToken();
  const hashed = hashToken(plain);

  const result = await query<{ id: number }>(
    `INSERT INTO personal_access_tokens
      (tokenable_type, tokenable_id, name, token, abilities, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
     RETURNING id`,
    ['App\\Models\\User', userId, name, hashed, JSON.stringify(['*'])]
  );

  const id = result.rows[0].id;
  return {
    id,
    plainTextToken: `${id}|${plain}`,
    token_type: 'Bearer',
  };
}

export interface FoundToken {
  tokenRow: Record<string, unknown>;
  userId: number;
}

export async function findToken(bearerToken: string | undefined): Promise<FoundToken | null> {
  if (!bearerToken) return null;

  const raw = bearerToken.startsWith('Bearer ')
    ? bearerToken.slice(7).trim()
    : bearerToken.trim();

  const [idPart, ...rest] = raw.split('|');
  const plain = rest.join('|');
  if (!idPart || !plain) return null;

  const id = Number(idPart);
  if (!Number.isFinite(id)) return null;

  const hashed = hashToken(plain);
  const result = await query<Record<string, unknown>>(
    `SELECT * FROM personal_access_tokens WHERE id = $1 AND token = $2 LIMIT 1`,
    [id, hashed]
  );

  const tokenRow = result.rows[0];
  if (!tokenRow) return null;

  if (tokenRow.expires_at && new Date(tokenRow.expires_at as string) < new Date()) {
    return null;
  }

  await query(
    `UPDATE personal_access_tokens SET last_used_at = NOW() WHERE id = $1`,
    [tokenRow.id]
  );

  return { tokenRow, userId: Number(tokenRow.tokenable_id) };
}

export async function deleteToken(tokenId: number): Promise<void> {
  await query(`DELETE FROM personal_access_tokens WHERE id = $1`, [tokenId]);
}

export default { createToken, findToken, deleteToken, hashToken };
