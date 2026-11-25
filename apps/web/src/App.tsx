import { useEffect, useState } from 'react';
import { messages, resolveLocale } from './i18n';
import { OutputRenderer } from './renderer/OutputRenderer';
export function App() {
  const [locale, setLocale] = useState(() => resolveLocale(localStorage.getItem('locale')));
  const [dark, setDark] = useState(() => localStorage.getItem('theme') !== 'light');
  const t = messages[locale];
  useEffect(() => { document.documentElement.lang = locale; localStorage.setItem('locale', locale); }, [locale]);
  useEffect(() => { document.documentElement.classList.toggle('dark', dark); localStorage.setItem('theme', dark ? 'dark' : 'light'); }, [dark]);
  const profile = location.pathname === '/display/stage' ? 'stage' : 'main';
  if (location.pathname.startsWith('/display/')) return <OutputRenderer profile={profile} slide={null} waitingLabel={t.waiting} />;
  return <main className="mx-auto max-w-4xl space-y-6 p-6">
    <header><h1 className="text-3xl font-semibold">{t.title}</h1><p>{t.subtitle}</p></header>
    <div className="flex flex-wrap gap-4">
      <label>{t.language} <select aria-label={t.language} value={locale} onChange={(e) => setLocale(resolveLocale(e.target.value))}><option value="it">Italiano</option><option value="en">English</option></select></label>
      <label>{t.theme} <select aria-label={t.theme} value={dark ? 'dark' : 'light'} onChange={(e) => setDark(e.target.value === 'dark')}><option value="dark">{t.dark}</option><option value="light">{t.light}</option></select></label>
    </div>
    <p className="rounded border p-4">{t.scaffold}</p>
    <nav className="flex flex-wrap gap-4"><a href="/">{t.director}</a><a href="/display/main" target="_blank" rel="noreferrer">{t.main}</a><a href="/display/stage" target="_blank" rel="noreferrer">{t.stage}</a></nav>
  </main>;
}
