import type { Locale, Permission, UserRole } from '../../../packages/contracts/src/index';

export interface Messages {
  title: string;
  subtitle: string;
  scaffold: string;
  director: string;
  main: string;
  stage: string;
  waiting: string;
  language: string;
  theme: string;
  dark: string;
  light: string;
  loading: string;
  signOut: string;
  signedInAs: string;
  bootstrapTitle: string;
  bootstrapDescription: string;
  bootstrapSubmit: string;
  bootstrapSuccess: string;
  signInTitle: string;
  signInDescription: string;
  signInSubmit: string;
  nameLabel: string;
  emailLabel: string;
  passwordLabel: string;
  confirmPasswordLabel: string;
  roleLabel: string;
  defaultLanguageLabel: string;
  passwordHint: string;
  passwordMismatch: string;
  invalidCredentials: string;
  genericError: string;
  emailExistsError: string;
  lastAdminError: string;
  cannotDeleteSelfError: string;
  outputsHeading: string;
  outputsHint: string;
  sessionHeading: string;
  permissionsHeading: string;
  realtimeConnected: string;
  realtimeConnecting: string;
  realtimeDisconnected: string;
  usersHeading: string;
  usersDescription: string;
  createUserHeading: string;
  createUserSubmit: string;
  userCreated: string;
  roleUpdated: string;
  userDeleted: string;
  deleteUser: string;
  confirmDelete: string;
  cancel: string;
  youBadge: string;
  noUsers: string;
  roles: Record<UserRole, string>;
  roleDescriptions: Record<UserRole, string>;
  permissions: Record<Permission, string>;
}

export const messages: Record<Locale, Messages> = {
  it: {
    title: 'Cuelia',
    subtitle: 'Regia multimediale',
    scaffold: 'Autenticazione e ruoli attivi. Pronto per libreria canti, scalette e regia live.',
    director: 'Regia',
    main: 'Display principale',
    stage: 'Monitor palco',
    waiting: 'In attesa di contenuti',
    language: 'Lingua',
    theme: 'Tema',
    dark: 'Scuro',
    light: 'Chiaro',
    loading: 'Verifica sessione in corso…',
    signOut: 'Esci',
    signedInAs: 'Connesso come',
    bootstrapTitle: 'Configurazione iniziale amministratore',
    bootstrapDescription:
      'Crea il primo account amministratore per proteggere la regia. Dopo questa configurazione, solo un amministratore potrà creare nuovi utenti.',
    bootstrapSubmit: 'Crea amministratore e accedi',
    bootstrapSuccess: 'Account amministratore creato.',
    signInTitle: 'Accedi alla regia',
    signInDescription: 'Inserisci le credenziali assegnate dal tuo amministratore.',
    signInSubmit: 'Accedi',
    nameLabel: 'Nome',
    emailLabel: 'Email',
    passwordLabel: 'Password',
    confirmPasswordLabel: 'Conferma password',
    roleLabel: 'Ruolo',
    defaultLanguageLabel: 'Lingua interfaccia',
    passwordHint: 'Minimo 8 caratteri.',
    passwordMismatch: 'Le password non coincidono.',
    invalidCredentials: 'Email o password non valide.',
    genericError: 'Operazione non riuscita. Riprova.',
    emailExistsError: 'Esiste già un utente registrato con questa email.',
    lastAdminError: 'Deve rimanere almeno un amministratore attivo.',
    cannotDeleteSelfError: 'Non puoi eliminare il tuo stesso account.',
    outputsHeading: 'Uscite di proiezione',
    outputsHint: 'Le pagine display sono in sola lettura e apribili in finestre dedicate.',
    sessionHeading: 'Sessione attiva',
    permissionsHeading: 'Permessi assegnati',
    realtimeConnected: 'Canale regia autorizzato connesso',
    realtimeConnecting: 'Connessione al canale regia…',
    realtimeDisconnected: 'Canale regia disconnesso',
    usersHeading: 'Utenti e ruoli',
    usersDescription: 'Gestisci gli operatori della regia, i telecomandi remoti e i permessi di accesso.',
    createUserHeading: 'Nuovo utente',
    createUserSubmit: 'Crea utente',
    userCreated: 'Utente creato correttamente.',
    roleUpdated: 'Ruolo aggiornato.',
    userDeleted: 'Utente rimosso.',
    deleteUser: 'Elimina',
    confirmDelete: 'Conferma eliminazione',
    cancel: 'Annulla',
    youBadge: 'Tu',
    noUsers: 'Nessun utente registrato.',
    roles: {
      admin: 'Amministratore',
      operator: 'Operatore di regia',
      remote: 'Operatore remoto',
      viewer: 'Visualizzatore',
    },
    roleDescriptions: {
      admin: 'Configura applicazione, utenti, uscite, libreria e regia live.',
      operator: 'Gestisce canti, scalette e proiezione live.',
      remote: 'Controlla la proiezione live e naviga slide e scaletta da remoto.',
      viewer: 'Visualizza le uscite senza poter modificare la regia.',
    },
    permissions: {
      'users:manage': 'Gestione utenti e ruoli',
      'library:write': 'Modifica libreria canti e contenuti',
      'schedule:write': 'Gestione scalette',
      'live:control': 'Controllo proiezione live',
      'display:view': 'Visualizzazione uscite display',
    },
  },
  en: {
    title: 'Cuelia',
    subtitle: 'Presentation control',
    scaffold: 'Authentication and roles are active. Ready for song library, schedules, and live control.',
    director: 'Control room',
    main: 'Main display',
    stage: 'Stage monitor',
    waiting: 'Waiting for content',
    language: 'Language',
    theme: 'Theme',
    dark: 'Dark',
    light: 'Light',
    loading: 'Checking session…',
    signOut: 'Sign out',
    signedInAs: 'Signed in as',
    bootstrapTitle: 'Initial administrator setup',
    bootstrapDescription:
      'Create the first administrator account to secure the control room. Once completed, only administrators can create additional users.',
    bootstrapSubmit: 'Create administrator and sign in',
    bootstrapSuccess: 'Administrator account created.',
    signInTitle: 'Sign in to control room',
    signInDescription: 'Enter the credentials provided by your administrator.',
    signInSubmit: 'Sign in',
    nameLabel: 'Name',
    emailLabel: 'Email',
    passwordLabel: 'Password',
    confirmPasswordLabel: 'Confirm password',
    roleLabel: 'Role',
    defaultLanguageLabel: 'Interface language',
    passwordHint: 'Minimum 8 characters.',
    passwordMismatch: 'Passwords do not match.',
    invalidCredentials: 'Invalid email or password.',
    genericError: 'Operation failed. Please try again.',
    emailExistsError: 'A user with this email already exists.',
    lastAdminError: 'At least one active administrator is required.',
    cannotDeleteSelfError: 'You cannot delete your own account.',
    outputsHeading: 'Projection outputs',
    outputsHint: 'Display pages are read-only and can be opened in dedicated windows.',
    sessionHeading: 'Active session',
    permissionsHeading: 'Granted permissions',
    realtimeConnected: 'Authorized realtime channel connected',
    realtimeConnecting: 'Connecting realtime channel…',
    realtimeDisconnected: 'Realtime channel disconnected',
    usersHeading: 'Users & roles',
    usersDescription: 'Manage control room operators, remote controllers, and access permissions.',
    createUserHeading: 'New user',
    createUserSubmit: 'Create user',
    userCreated: 'User created successfully.',
    roleUpdated: 'Role updated.',
    userDeleted: 'User removed.',
    deleteUser: 'Delete',
    confirmDelete: 'Confirm delete',
    cancel: 'Cancel',
    youBadge: 'You',
    noUsers: 'No users registered.',
    roles: {
      admin: 'Administrator',
      operator: 'Control operator',
      remote: 'Remote operator',
      viewer: 'Viewer',
    },
    roleDescriptions: {
      admin: 'Configures the application, users, outputs, library, and live control.',
      operator: 'Manages songs, schedules, and live projection.',
      remote: 'Controls live projection and navigates slides and schedules remotely.',
      viewer: 'Views projection outputs without changing control state.',
    },
    permissions: {
      'users:manage': 'Manage users and roles',
      'library:write': 'Edit song library and content',
      'schedule:write': 'Manage schedules',
      'live:control': 'Control live projection',
      'display:view': 'View display outputs',
    },
  },
};

export type { Locale };

export function resolveLocale(value: string | null | undefined): Locale {
  return value === 'en' ? 'en' : 'it';
}
