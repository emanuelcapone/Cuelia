import { useState, type FormEvent } from 'react';
import type { Locale, SessionInfo } from '../../../../packages/contracts/src/index';
import type { Messages } from '../i18n';
import { ApiError, bootstrapAdmin, signInWithEmail } from '../lib/auth-api';

interface BootstrapFormProps {
  t: Messages;
  locale: Locale;
  onAuthenticated: (session: SessionInfo) => void;
}

export function BootstrapForm({ t, locale, onAuthenticated }: BootstrapFormProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError(t.passwordMismatch);
      return;
    }

    setSubmitting(true);
    try {
      const session = await bootstrapAdmin({ name, email, password, locale });
      onAuthenticated(session);
    } catch (err) {
      if (err instanceof ApiError && err.code === 'ALREADY_INITIALIZED') {
        setError(t.genericError);
      } else {
        setError(t.genericError);
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="rounded-lg border border-slate-300 bg-white/80 p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900/80">
      <h2 className="text-xl font-semibold">{t.bootstrapTitle}</h2>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{t.bootstrapDescription}</p>

      <form onSubmit={handleSubmit} className="mt-5 space-y-4">
        <div className="space-y-1">
          <label htmlFor="bootstrap-name" className="block text-sm font-medium">
            {t.nameLabel}
          </label>
          <input
            id="bootstrap-name"
            type="text"
            required
            minLength={2}
            maxLength={80}
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-md border border-slate-300 bg-transparent px-3 py-2 text-sm dark:border-slate-600"
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="bootstrap-email" className="block text-sm font-medium">
            {t.emailLabel}
          </label>
          <input
            id="bootstrap-email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-md border border-slate-300 bg-transparent px-3 py-2 text-sm dark:border-slate-600"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <label htmlFor="bootstrap-password" className="block text-sm font-medium">
              {t.passwordLabel}
            </label>
            <input
              id="bootstrap-password"
              type="password"
              required
              minLength={8}
              maxLength={128}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-md border border-slate-300 bg-transparent px-3 py-2 text-sm dark:border-slate-600"
            />
            <p className="text-xs text-slate-500 dark:text-slate-400">{t.passwordHint}</p>
          </div>

          <div className="space-y-1">
            <label htmlFor="bootstrap-confirm" className="block text-sm font-medium">
              {t.confirmPasswordLabel}
            </label>
            <input
              id="bootstrap-confirm"
              type="password"
              required
              minLength={8}
              maxLength={128}
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full rounded-md border border-slate-300 bg-transparent px-3 py-2 text-sm dark:border-slate-600"
            />
          </div>
        </div>

        {error && (
          <p role="alert" className="rounded-md border border-red-400/50 bg-red-500/10 px-3 py-2 text-sm text-red-700 dark:text-red-300">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60 dark:bg-sky-500 dark:text-slate-950 dark:hover:bg-sky-400"
        >
          {t.bootstrapSubmit}
        </button>
      </form>
    </section>
  );
}

interface SignInFormProps {
  t: Messages;
  onAuthenticated: (session: SessionInfo) => void;
}

export function SignInForm({ t, onAuthenticated }: SignInFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const session = await signInWithEmail({ email, password });
      onAuthenticated(session);
    } catch (err) {
      if (err instanceof ApiError && (err.status === 401 || err.status === 400)) {
        setError(t.invalidCredentials);
      } else {
        setError(t.genericError);
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="rounded-lg border border-slate-300 bg-white/80 p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900/80">
      <h2 className="text-xl font-semibold">{t.signInTitle}</h2>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{t.signInDescription}</p>

      <form onSubmit={handleSubmit} className="mt-5 space-y-4">
        <div className="space-y-1">
          <label htmlFor="signin-email" className="block text-sm font-medium">
            {t.emailLabel}
          </label>
          <input
            id="signin-email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-md border border-slate-300 bg-transparent px-3 py-2 text-sm dark:border-slate-600"
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="signin-password" className="block text-sm font-medium">
            {t.passwordLabel}
          </label>
          <input
            id="signin-password"
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-md border border-slate-300 bg-transparent px-3 py-2 text-sm dark:border-slate-600"
          />
        </div>

        {error && (
          <p role="alert" className="rounded-md border border-red-400/50 bg-red-500/10 px-3 py-2 text-sm text-red-700 dark:text-red-300">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60 dark:bg-sky-500 dark:text-slate-950 dark:hover:bg-sky-400"
        >
          {t.signInSubmit}
        </button>
      </form>
    </section>
  );
}
