export const messages = {
  it: { title: 'Cuelia', subtitle: 'Regia multimediale', scaffold: 'Scheletro applicativo: funzionalità in sviluppo.', director: 'Regia', main: 'Display principale', stage: 'Monitor palco', waiting: 'In attesa di contenuti', language: 'Lingua', theme: 'Tema', dark: 'Scuro', light: 'Chiaro' },
  en: { title: 'Cuelia', subtitle: 'Presentation control', scaffold: 'Application scaffold: features under development.', director: 'Control room', main: 'Main display', stage: 'Stage monitor', waiting: 'Waiting for content', language: 'Language', theme: 'Theme', dark: 'Dark', light: 'Light' }
};
export type Locale = keyof typeof messages;
export function resolveLocale(value: string | null): Locale { return value === 'en' ? 'en' : 'it'; }
