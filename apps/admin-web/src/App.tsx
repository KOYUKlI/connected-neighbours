import { useState } from 'react'
import type { FormEvent } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'

import { useAdminAuth } from './auth/useAdminAuth'
import './App.css'

const navigationItems = [
  { path: 'dashboard', label: 'Dashboard' },
  { path: 'services', label: 'Services' },
  { path: 'contracts', label: 'Contrats' },
  { path: 'incidents', label: 'Incidents' },
  { path: 'sync', label: 'Synchronisation' },
  { path: 'users', label: 'Utilisateurs' },
  { path: 'install', label: 'Application Desktop' },
] as const

const demoEmail = 'admin@connected-neighbours.local'

function App() {
  const { token, currentUser, loginError, login, clearSession } = useAdminAuth()
  const [refreshKey, setRefreshKey] = useState(0)
  const navigate = useNavigate()
  const location = useLocation()

  async function handleLogin(email: string, password: string) {
    const success = await login(email, password)

    if (success) {
      navigate('/dashboard')
    }
  }

  if (!token) {
    return <LoginScreen error={loginError} onSubmit={handleLogin} />
  }

  const activeItem = navigationItems.find((item) =>
    location.pathname.startsWith(`/${item.path}`),
  )

  return (
    <div className="admin-shell">
      <aside className="sidebar">
        <div className="brand-block">
          <span className="landing-brand-mark">CN</span>
          <div>
            <strong>Connected Neighbours</strong>
            <span>Back-office P0</span>
          </div>
        </div>

        <nav className="nav-list" aria-label="Navigation admin">
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
            <p className="eyebrow">Administration</p>
            <h1>{activeItem?.label ?? 'Dashboard'}</h1>
          </div>
          <div className="topbar-actions">
            <div className="session-block">
              <span>{currentUser?.displayName ?? 'Session admin'}</span>
              <strong>{currentUser?.email ?? demoEmail}</strong>
            </div>
            <button
              className="secondary-button"
              type="button"
              onClick={() => setRefreshKey((value) => value + 1)}
            >
              Actualiser
            </button>
            <button
              className="ghost-button"
              type="button"
              onClick={() => clearSession()}
            >
              Deconnexion
            </button>
          </div>
        </header>

        <section className="content-section">
          <Outlet key={`${location.pathname}-${refreshKey}`} />
        </section>
      </main>
    </div>
  )
}

type LoginScreenProps = {
  error: string | null
  onSubmit: (email: string, password: string) => Promise<void>
}

function LoginScreen({ error, onSubmit }: LoginScreenProps) {
  const [email, setEmail] = useState(demoEmail)
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSubmitting(true)

    try {
      await onSubmit(email, password)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="login-page">
      <section className="login-panel" aria-labelledby="login-title">
        <div className="brand-block login-brand">
          <span className="landing-brand-mark">CN</span>
          <div>
            <strong>Connected Neighbours</strong>
            <span>Back-office admin</span>
          </div>
        </div>

        <div>
          <p className="eyebrow">Acces securise</p>
          <h1 id="login-title">Connexion administrateur</h1>
          <p className="login-copy">
            Compte demo : {demoEmail} / admin123
          </p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <label>
            Email
            <input
              autoComplete="email"
              name="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </label>

          <label>
            Mot de passe
            <input
              autoComplete="current-password"
              name="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </label>

          {error ? <div className="error-banner compact">{error}</div> : null}

          <button className="primary-button" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>
      </section>
    </main>
  )
}

export default App
