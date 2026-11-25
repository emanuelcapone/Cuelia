import { asc, count, eq } from 'drizzle-orm';
import {
  isLocale,
  isUserRole,
  type AuthUser,
  type Locale,
  type UserRole,
} from '../../../../../packages/contracts/src/index.js';
import type { CueliaDatabase } from '../../db/client.js';
import { user } from '../../db/schema.js';

export interface MemoryAuthTables {
  [table: string]: Array<Record<string, unknown>>;
  user: Array<Record<string, unknown>>;
  session: Array<Record<string, unknown>>;
  account: Array<Record<string, unknown>>;
  verification: Array<Record<string, unknown>>;
}

export interface UserRepository {
  countUsers(): Promise<number>;
  countAdmins(): Promise<number>;
  findById(id: string): Promise<AuthUser | null>;
  listUsers(): Promise<AuthUser[]>;
  updateRole(id: string, role: UserRole): Promise<AuthUser | null>;
  updateLocale(id: string, locale: Locale): Promise<AuthUser | null>;
  deleteUser(id: string): Promise<boolean>;
}

function toIsoString(value: unknown): string {
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'string') return value;
  return new Date().toISOString();
}

function normalizeUserRow(row: {
  id: unknown;
  name: unknown;
  email: unknown;
  role: unknown;
  locale: unknown;
  createdAt: unknown;
}): AuthUser {
  return {
    id: String(row.id),
    name: String(row.name),
    email: String(row.email),
    role: isUserRole(row.role) ? row.role : 'viewer',
    locale: isLocale(row.locale) ? row.locale : 'it',
    createdAt: toIsoString(row.createdAt),
  };
}

export class DrizzleUserRepository implements UserRepository {
  constructor(private readonly db: CueliaDatabase) {}

  async countUsers(): Promise<number> {
    const rows = await this.db.select({ value: count() }).from(user);
    return Number(rows[0]?.value ?? 0);
  }

  async countAdmins(): Promise<number> {
    const rows = await this.db
      .select({ value: count() })
      .from(user)
      .where(eq(user.role, 'admin'));
    return Number(rows[0]?.value ?? 0);
  }

  async findById(id: string): Promise<AuthUser | null> {
    const rows = await this.db
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        locale: user.locale,
        createdAt: user.createdAt,
      })
      .from(user)
      .where(eq(user.id, id))
      .limit(1);
    return rows[0] ? normalizeUserRow(rows[0]) : null;
  }

  async listUsers(): Promise<AuthUser[]> {
    const rows = await this.db
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        locale: user.locale,
        createdAt: user.createdAt,
      })
      .from(user)
      .orderBy(asc(user.createdAt));
    return rows.map(normalizeUserRow);
  }

  async updateRole(id: string, role: UserRole): Promise<AuthUser | null> {
    const rows = await this.db
      .update(user)
      .set({ role, updatedAt: new Date() })
      .where(eq(user.id, id))
      .returning({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        locale: user.locale,
        createdAt: user.createdAt,
      });
    return rows[0] ? normalizeUserRow(rows[0]) : null;
  }

  async updateLocale(id: string, locale: Locale): Promise<AuthUser | null> {
    const rows = await this.db
      .update(user)
      .set({ locale, updatedAt: new Date() })
      .where(eq(user.id, id))
      .returning({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        locale: user.locale,
        createdAt: user.createdAt,
      });
    return rows[0] ? normalizeUserRow(rows[0]) : null;
  }

  async deleteUser(id: string): Promise<boolean> {
    const deleted = await this.db
      .delete(user)
      .where(eq(user.id, id))
      .returning({ id: user.id });
    return deleted.length > 0;
  }
}

export class MemoryUserRepository implements UserRepository {
  constructor(private readonly tables: MemoryAuthTables) {}

  async countUsers(): Promise<number> {
    return this.tables.user.length;
  }

  async countAdmins(): Promise<number> {
    return this.tables.user.filter((row) => row.role === 'admin').length;
  }

  async findById(id: string): Promise<AuthUser | null> {
    const row = this.tables.user.find((entry) => entry.id === id);
    if (!row) return null;
    return normalizeUserRow({
      id: row.id,
      name: row.name,
      email: row.email,
      role: row.role,
      locale: row.locale,
      createdAt: row.createdAt,
    });
  }

  async listUsers(): Promise<AuthUser[]> {
    return [...this.tables.user]
      .sort((a, b) => toIsoString(a.createdAt).localeCompare(toIsoString(b.createdAt)))
      .map((row) =>
        normalizeUserRow({
          id: row.id,
          name: row.name,
          email: row.email,
          role: row.role,
          locale: row.locale,
          createdAt: row.createdAt,
        }),
      );
  }

  async updateRole(id: string, role: UserRole): Promise<AuthUser | null> {
    const row = this.tables.user.find((entry) => entry.id === id);
    if (!row) return null;
    row.role = role;
    row.updatedAt = new Date();
    return this.findById(id);
  }

  async updateLocale(id: string, locale: Locale): Promise<AuthUser | null> {
    const row = this.tables.user.find((entry) => entry.id === id);
    if (!row) return null;
    row.locale = locale;
    row.updatedAt = new Date();
    return this.findById(id);
  }

  async deleteUser(id: string): Promise<boolean> {
    const index = this.tables.user.findIndex((entry) => entry.id === id);
    if (index === -1) return false;
    this.tables.user.splice(index, 1);
    this.tables.session = this.tables.session.filter((s) => s.userId !== id);
    this.tables.account = this.tables.account.filter((a) => a.userId !== id);
    return true;
  }
}
