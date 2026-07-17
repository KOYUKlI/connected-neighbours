import { useState } from 'react';
import type { FormEvent } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';

import { useAuth } from './auth/useAuth';
import './App.css';

const navigationItems = [
  { path: 'dashboard', label: 'Dashboard' },
  { path: 'services', label: 'Services' },
  { path: 'applications', label: 'Mes candidatures' },
  { path: 'contracts', label: 'Contrats' },
  { path: 'points', label: 'Points' },
  { path: 'incidents', label: 'Incidents' },
  { path: 'rgpd', label: 'RGPD' },
] as const;

const demoAccounts = [
  { label: 'Alice', email: 'alice@connected-neighbours.local', password: 'alice123' },
  { label: 'Bob', email: 'bob@connected-neighbours.local', password: 'bob123' },
  { label: 'Admin', email: 'admin@connected-neighbours.local', password: 'admin123' },
];

export default function App() {
  const { token, currentUser, loginError, login, clearSession } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();

  async function handleLogin(email: string, password: string) {
    const success = await login(email, password);

    if (success) {
      navigate('/dashboard');
    }

    return success;
  }

  if (!token) {
    return <LoginScreen error={loginError} onSubmit={handleLogin} />;
  }

  const activeItem = navigationItems.find((item) =>
    location.pathname.startsWith(`/${item.path}`),
  );

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">CN</span>
          <div>
            <strong>Connected Neighbours</strong>
            <span>Espace habitant</span>
          </div>
        </div>

        <nav className="nav-list" aria-label="Navigation utilisateur">
          {navigationItems.map((item) => (
            <NavLink
              className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}
              key={item.path}
              to={`/${item.path}`}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <main className="main-panel">
        <header className="topbar">
          <div>
            <p className="eyebrow">Parcours P0</p>
            <h1>{activeItem?.label ?? 'Dashboard'}</h1>
          </div>

          <div className="topbar-actions">
            <div className="session-card">
              <span>{currentUser?.displayName ?? 'Session habitant'}</span>
              <strong>{currentUser?.email ?? 'Profil en cours'}</strong>
            </div>
            <button
              className="secondary-button"
              onClick={() => setRefreshKey((value) => value + 1)}
              type="button"
            >
              Actualiser
            </button>
            <button className="ghost-button" onClick={() => clearSession()} type="button">
              Deconnexion
            </button>
          </div>
        </header>

        <section className="content-section">
          <Outlet key={`${location.pathname}-${refreshKey}`} />
        </section>
      </main>
    </div>
  );
}

type LoginScreenProps = {
  error: string | null;
  onSubmit: (email: string, password: string) => Promise<boolean>;
};

function LoginScreen({ error, onSubmit }: LoginScreenProps) {
  const [email, setEmail] = useState(demoAccounts[0].email);
  const [password, setPassword] = useState(demoAccounts[0].password);
  const [isPending, setIsPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsPending(true);

    try {
      await onSubmit(email, password);
    } finally {
      setIsPending(false);
    }
  }

  return (
    <main className="login-page">
      <section className="login-panel" aria-labelledby="login-title">
        <div className="brand">
          <span className="brand-mark">CN</span>
          <div>
            <strong>Connected Neighbours</strong>
            <span>Espace habitant</span>
          </div>
        </div>

        <div>
          <p className="eyebrow">Demo P0</p>
          <h1 id="login-title">Connexion</h1>
          <p className="login-copy">
            Connectez-vous avec Alice ou Bob pour jouer le parcours complet.
          </p>
        </div>

        <div className="demo-grid">
          {demoAccounts.map((account) => (
            <button
              key={account.email}
              onClick={() => {
                setEmail(account.email);
                setPassword(account.password);
              }}
              type="button"
            >
              <strong>{account.label}</strong>
              <span>{account.email}</span>
            </button>
          ))}
        </div>

        <form className="form-grid" onSubmit={handleSubmit}>
          <label>
            Email
            <input
              autoComplete="email"
              onChange={(event) => setEmail(event.target.value)}
              required
              type="email"
              value={email}
            />
          </label>

          <label>
            Mot de passe
            <input
              autoComplete="current-password"
              onChange={(event) => setPassword(event.target.value)}
              required
              type="password"
              value={password}
            />
          </label>

          {error ? <div className="error-banner compact">{error}</div> : null}

          <button className="primary-button" disabled={isPending} type="submit">
            {isPending ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>
      </section>
    </main>
  );
}
