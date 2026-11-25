import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import {
  hasPermission,
  type Locale,
  type SessionInfo,
} from '../../../packages/contracts/src/index';
import { BootstrapForm, SignInForm } from './components/AuthForms';
import { UserManagementPanel } from './components/UserManagementPanel';
import { messages, resolveLocale } from './i18n';
import {
  fetchBootstrapStatus,
  fetchCurrentSession,
  getAuthToken,
  signOut,
  updateMyLocale,
} from './lib/auth-api';
import { OutputRenderer } from './renderer/OutputRenderer';

export function App() {
  const [locale, setLocale] = useState<Locale>(() => resolveLocale(localStorage.getItem('locale')));
  const [dark, setDark] = useState(() => localStorage.getItem('theme') !== 'light');
  const [loading, setLoading] = useState(true);
  const [needsBootstrap, setNeedsBootstrap] = useState(false);
  const [session, setSession] = useState<SessionInfo | null>(null);

  const t = messages[locale];

  useEffect(() => {
    document.documentElement.lang = locale;
    localStorage.setItem('locale', locale);
  }, [locale]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    localStorage.setItem('theme', dark ? 'dark' : 'light');
  }, [dark]);

  const isDisplayRoute = location.pathname.startsWith('/display/');

  useEffect(() => {
    if (isDisplayRoute) return;
    let active = true;

    async function loadAuthState() {
      try {
        const [bootstrapStatus, currentSession] = await Promise.all([
          fetchBootstrapStatus(),
          fetchCurrentSession(),
        ]);
        if (!active) return;
        setNeedsBootstrap(bootstrapStatus.needsBootstrap);
        setSession(currentSession);
        if (currentSession) {
          setLocale(currentSession.user.locale);
        }
      } catch {
        if (!active) return;
        setSession(null);
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadAuthState();
    return () => {
      active = false;
    };
  }, [isDisplayRoute]);

  useEffect(() => {
    if (isDisplayRoute || !session) return;

    const token = getAuthToken();
    const socket = io({
      transports: ['websocket'],
      withCredentials: true,
      auth: {
        clientType: 'director',
        ...(token ? { token } : {}),
      },
    });

    return () => {
      socket.disconnect();
    };
  }, [isDisplayRoute, session]);

  async function handleLocaleChange(nextLocale: Locale) {
    setLocale(nextLocale);
    if (session) {
      try {
        const updated = await updateMyLocale(nextLocale);
        setSession(updated);
      } catch {
        // Keep local preference active even if server sync temporarily fails.
      }
    }
  }

  function handleAuthenticated(nextSession: SessionInfo) {
    setNeedsBootstrap(false);
    setSession(nextSession);
    setLocale(nextSession.user.locale);
  }

  async function handleSignOut() {
    await signOut();
    setSession(null);
  }

  const profile = location.pathname === '/display/stage' ? 'stage' : 'main';
  if (isDisplayRoute) {
    return <OutputRenderer profile={profile} slide={null} waitingLabel={t.waiting} />;
  }

  const canManageUsers = session ? hasPermission(session.user.role, 'users:manage') : false;

  return (
    <main className="mx-auto max-w-4xl space-y-6 p-6">
      <header className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 pb-4 dark:border-slate-800">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">{t.title}</h1>
          <p className="text-sm text-slate-600 dark:text-slate-300">{t.subtitle}</p>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-sm">
          <label className="flex items-center gap-2">
            <span>{t.language}</span>
            <select
              aria-label={t.language}
              value={locale}
              onChange={(e) => void handleLocaleChange(resolveLocale(e.target.value))}
            >
              <option value="it">Italiano</option>
              <option value="en">English</option>
            </select>
          </label>

          <label className="flex items-center gap-2">
            <span>{t.theme}</span>
            <select
              aria-label={t.theme}
              value={dark ? 'dark' : 'light'}
              onChange={(e) => setDark(e.target.value === 'dark')}
            >
              <option value="dark">{t.dark}</option>
              <option value="light">{t.light}</option>
            </select>
          </label>

          {session && (
            <button
              type="button"
              onClick={() => void handleSignOut()}
              className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium hover:bg-slate-100 dark:border-slate-600 dark:hover:bg-slate-800"
            >
              {t.signOut}
            </button>
          )}
        </div>
      </header>

      {loading ? (
        <p className="rounded-lg border border-slate-300 p-4 text-sm dark:border-slate-700">
          {t.loading}
        </p>
      ) : !session ? (
        needsBootstrap ? (
          <BootstrapForm t={t} locale={locale} onAuthenticated={handleAuthenticated} />
        ) : (
          <SignInForm t={t} onAuthenticated={handleAuthenticated} />
        )
      ) : (
        <div className="space-y-6">
          <section className="rounded-lg border border-slate-300 bg-white/80 p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900/80">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-lg font-semibold">{t.sessionHeading}</h2>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  {t.signedInAs}{' '}
                  <span className="font-medium text-slate-900 dark:text-white">
                    {session.user.name}
                  </span>{' '}
                  ({session.user.email})
                </p>
              </div>
              <span className="rounded-md bg-sky-500/15 px-3 py-1 text-xs font-semibold text-sky-700 dark:text-sky-300">
                {t.roles[session.user.role]}
              </span>
            </div>

            <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
              {t.roleDescriptions[session.user.role]}
            </p>

            <div className="mt-4 border-t border-slate-200 pt-4 dark:border-slate-800">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                {t.permissionsHeading}
              </h3>
              <ul className="mt-2 flex flex-wrap gap-2">
                {session.permissions.map((permission) => (
                  <li
                    key={permission}
                    className="rounded border border-slate-300 px-2.5 py-1 text-xs dark:border-slate-700"
                  >
                    {t.permissions[permission]}
                  </li>
                ))}
              </ul>
            </div>
          </section>

          {canManageUsers && (
            <UserManagementPanel t={t} currentUserId={session.user.id} />
          )}
        </div>
      )}

      <section className="rounded-lg border border-slate-200 p-4 dark:border-slate-800">
        <h2 className="text-sm font-semibold">{t.outputsHeading}</h2>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{t.outputsHint}</p>
        <nav className="mt-3 flex flex-wrap gap-4 text-sm">
          <a href="/">{t.director}</a>
          <a href="/display/main" target="_blank" rel="noreferrer">
            {t.main}
          </a>
          <a href="/display/stage" target="_blank" rel="noreferrer">
            {t.stage}
          </a>
        </nav>
      </section>
    </main>
  );
}
