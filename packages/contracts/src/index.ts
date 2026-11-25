/** Contratti condivisi: nessuna dipendenza da React, Fastify o storage. */
export type OutputProfile = 'main' | 'stage';
export type Locale = 'it' | 'en';

export const USER_ROLES = ['admin', 'operator', 'remote', 'viewer'] as const;
export type UserRole = (typeof USER_ROLES)[number];

export type Permission =
  | 'users:manage'
  | 'library:write'
  | 'schedule:write'
  | 'live:control'
  | 'display:view';

export const ROLE_PERMISSIONS: Record<UserRole, readonly Permission[]> = {
  admin: ['users:manage', 'library:write', 'schedule:write', 'live:control', 'display:view'],
  operator: ['library:write', 'schedule:write', 'live:control', 'display:view'],
  remote: ['live:control', 'display:view'],
  viewer: ['display:view'],
};

export function isUserRole(value: unknown): value is UserRole {
  return typeof value === 'string' && (USER_ROLES as readonly string[]).includes(value);
}

export function isLocale(value: unknown): value is Locale {
  return value === 'it' || value === 'en';
}

export function getRolePermissions(role: UserRole): Permission[] {
  return [...ROLE_PERMISSIONS[role]];
}

export function hasPermission(role: UserRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role].includes(permission);
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  locale: Locale;
  createdAt: string;
}

export interface SessionInfo {
  user: AuthUser;
  permissions: Permission[];
}

export interface ServerReadyPayload {
  protocolVersion: 1;
  authenticated: boolean;
  role: UserRole;
}

export interface Slide {
  id: string;
  text: string;
}

export interface SpeechToTextProvider {
  transcribe(
    audio: AsyncIterable<Uint8Array>,
    signal: AbortSignal,
  ): AsyncIterable<{ text: string; final: boolean }>;
}

export interface MediaStorage {
  read(key: string): Promise<Uint8Array>;
  write(key: string, data: Uint8Array): Promise<void>;
}
