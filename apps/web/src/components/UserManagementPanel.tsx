import { useCallback, useEffect, useState, type FormEvent } from 'react';
import {
  USER_ROLES,
  type AuthUser,
  type Locale,
  type UserRole,
} from '../../../../packages/contracts/src/index';
import type { Messages } from '../i18n';
import {
  ApiError,
  createUser,
  deleteUser,
  listUsers,
  updateUserRole,
} from '../lib/auth-api';

interface UserManagementPanelProps {
  t: Messages;
  currentUserId: string;
}

export function UserManagementPanel({ t, currentUserId }: UserManagementPanelProps) {
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('operator');
  const [userLocale, setUserLocale] = useState<Locale>('it');
  const [creating, setCreating] = useState(false);

  const refreshUsers = useCallback(async () => {
    try {
      const next = await listUsers();
      setUsers(next);
    } catch {
      setFeedback({ kind: 'error', text: t.genericError });
    } finally {
      setLoading(false);
    }
  }, [t.genericError]);

  useEffect(() => {
    void refreshUsers();
  }, [refreshUsers]);

  function translateError(error: unknown): string {
    if (error instanceof ApiError) {
      if (error.code === 'EMAIL_EXISTS') return t.emailExistsError;
      if (error.code === 'LAST_ADMIN_PROTECTED') return t.lastAdminError;
      if (error.code === 'CANNOT_DELETE_SELF') return t.cannotDeleteSelfError;
    }
    return t.genericError;
  }

  async function handleCreateUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback(null);
    setCreating(true);
    try {
      const created = await createUser({
        name,
        email,
        password,
        role,
        locale: userLocale,
      });
      setUsers((prev) => [...prev, created]);
      setName('');
      setEmail('');
      setPassword('');
      setRole('operator');
      setFeedback({ kind: 'ok', text: t.userCreated });
    } catch (error) {
      setFeedback({ kind: 'error', text: translateError(error) });
    } finally {
      setCreating(false);
    }
  }

  async function handleRoleChange(userId: string, nextRole: UserRole) {
    setFeedback(null);
    try {
      const updated = await updateUserRole(userId, nextRole);
      setUsers((prev) => prev.map((item) => (item.id === userId ? updated : item)));
      setFeedback({ kind: 'ok', text: t.roleUpdated });
    } catch (error) {
      setFeedback({ kind: 'error', text: translateError(error) });
    }
  }

  async function handleDelete(userId: string) {
    setFeedback(null);
    try {
      await deleteUser(userId);
      setUsers((prev) => prev.filter((item) => item.id !== userId));
      setConfirmDeleteId(null);
      setFeedback({ kind: 'ok', text: t.userDeleted });
    } catch (error) {
      setFeedback({ kind: 'error', text: translateError(error) });
    }
  }

  return (
    <section className="space-y-6 rounded-lg border border-slate-300 bg-white/80 p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900/80">
      <div>
        <h2 className="text-xl font-semibold">{t.usersHeading}</h2>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{t.usersDescription}</p>
      </div>

      {feedback && (
        <p
          role={feedback.kind === 'error' ? 'alert' : 'status'}
          className={
            feedback.kind === 'error'
              ? 'rounded-md border border-red-400/50 bg-red-500/10 px-3 py-2 text-sm text-red-700 dark:text-red-300'
              : 'rounded-md border border-emerald-400/50 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-300'
          }
        >
          {feedback.text}
        </p>
      )}

      <div className="space-y-2">
        {loading ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">{t.loading}</p>
        ) : users.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">{t.noUsers}</p>
        ) : (
          <ul className="divide-y divide-slate-200 rounded-md border border-slate-200 dark:divide-slate-700 dark:border-slate-700">
            {users.map((item) => {
              const isSelf = item.id === currentUserId;
              return (
                <li
                  key={item.id}
                  className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 font-medium">
                      <span className="truncate">{item.name}</span>
                      {isSelf && (
                        <span className="rounded bg-slate-200 px-1.5 py-0.5 text-xs text-slate-700 dark:bg-slate-700 dark:text-slate-200">
                          {t.youBadge}
                        </span>
                      )}
                    </div>
                    <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                      {item.email}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      aria-label={`${t.roleLabel} ${item.email}`}
                      value={item.role}
                      onChange={(e) => void handleRoleChange(item.id, e.target.value as UserRole)}
                      className="rounded-md border border-slate-300 bg-transparent px-2 py-1 text-sm dark:border-slate-600"
                    >
                      {USER_ROLES.map((r) => (
                        <option key={r} value={r}>
                          {t.roles[r]}
                        </option>
                      ))}
                    </select>

                    {!isSelf &&
                      (confirmDeleteId === item.id ? (
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => void handleDelete(item.id)}
                            className="rounded-md bg-red-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-red-500"
                          >
                            {t.confirmDelete}
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(null)}
                            className="rounded-md border border-slate-300 px-2.5 py-1 text-xs dark:border-slate-600"
                          >
                            {t.cancel}
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(item.id)}
                          className="rounded-md border border-red-400/60 px-2.5 py-1 text-xs text-red-700 hover:bg-red-500/10 dark:text-red-300"
                        >
                          {t.deleteUser}
                        </button>
                      ))}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <form
        onSubmit={handleCreateUser}
        className="space-y-4 border-t border-slate-200 pt-5 dark:border-slate-700"
      >
        <h3 className="text-base font-semibold">{t.createUserHeading}</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <label htmlFor="new-user-name" className="block text-sm font-medium">
              {t.nameLabel}
            </label>
            <input
              id="new-user-name"
              type="text"
              required
              minLength={2}
              maxLength={80}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-md border border-slate-300 bg-transparent px-3 py-2 text-sm dark:border-slate-600"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="new-user-email" className="block text-sm font-medium">
              {t.emailLabel}
            </label>
            <input
              id="new-user-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md border border-slate-300 bg-transparent px-3 py-2 text-sm dark:border-slate-600"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="new-user-password" className="block text-sm font-medium">
              {t.passwordLabel}
            </label>
            <input
              id="new-user-password"
              type="password"
              required
              minLength={8}
              maxLength={128}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-md border border-slate-300 bg-transparent px-3 py-2 text-sm dark:border-slate-600"
            />
            <p className="text-xs text-slate-500 dark:text-slate-400">{t.passwordHint}</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <label htmlFor="new-user-role" className="block text-sm font-medium">
                {t.roleLabel}
              </label>
              <select
                id="new-user-role"
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                className="w-full rounded-md border border-slate-300 bg-transparent px-2.5 py-2 text-sm dark:border-slate-600"
              >
                {USER_ROLES.map((r) => (
                  <option key={r} value={r}>
                    {t.roles[r]}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label htmlFor="new-user-locale" className="block text-sm font-medium">
                {t.defaultLanguageLabel}
              </label>
              <select
                id="new-user-locale"
                value={userLocale}
                onChange={(e) => setUserLocale(e.target.value as Locale)}
                className="w-full rounded-md border border-slate-300 bg-transparent px-2.5 py-2 text-sm dark:border-slate-600"
              >
                <option value="it">Italiano</option>
                <option value="en">English</option>
              </select>
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={creating}
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60 dark:bg-sky-500 dark:text-slate-950 dark:hover:bg-sky-400"
        >
          {t.createUserSubmit}
        </button>
      </form>
    </section>
  );
}
