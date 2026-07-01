import { useCallback, useEffect, useState } from 'react'
import type { FormEvent, ReactNode } from 'react'

import {
  ApiError,
  getAuthToken,
  loginAdmin,
  removeAuthToken,
  setAuthToken,
} from './api/client'
import type { PublicUser } from './api/client'
import {
  fetchContracts,
  fetchDashboard,
  fetchIncidents,
  fetchServices,
  fetchSyncStates,
  fetchUsers,
} from './api/admin'
import type {
  AdminContractRow,
  AdminDashboard,
  AdminIncidentRow,
  AdminServiceRow,
  AdminSyncStateRow,
  AdminUserRow,
} from './api/admin'
import './App.css'

const navigationItems = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'services', label: 'Services' },
  { id: 'contracts', label: 'Contrats' },
  { id: 'incidents', label: 'Incidents' },
  { id: 'sync', label: 'Synchronisation' },
  { id: 'users', label: 'Utilisateurs' },
] as const

type SectionId = (typeof navigationItems)[number]['id']

type TableColumn<T> = {
  header: string
  render: (row: T) => ReactNode
  className?: string
}

const demoEmail = 'admin@connected-neighbours.local'
const numberFormatter = new Intl.NumberFormat('fr-FR')
const dateFormatter = new Intl.DateTimeFormat('fr-FR', {
  dateStyle: 'short',
  timeStyle: 'short',
})

function App() {
  const [token, setToken] = useState(() => getAuthToken())
  const [currentUser, setCurrentUser] = useState<PublicUser | null>(null)
  const [activeSection, setActiveSection] = useState<SectionId>('dashboard')
  const [refreshKey, setRefreshKey] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [loginError, setLoginError] = useState<string | null>(null)
  const [dashboard, setDashboard] = useState<AdminDashboard | null>(null)
  const [services, setServices] = useState<AdminServiceRow[]>([])
  const [contracts, setContracts] = useState<AdminContractRow[]>([])
  const [incidents, setIncidents] = useState<AdminIncidentRow[]>([])
  const [syncStates, setSyncStates] = useState<AdminSyncStateRow[]>([])
  const [users, setUsers] = useState<AdminUserRow[]>([])

  const clearSession = useCallback((message?: string) => {
    removeAuthToken()
    setToken(null)
    setCurrentUser(null)
    setActiveSection('dashboard')
    setLoginError(message ?? null)
  }, [])

  useEffect(() => {
    if (!token) {
      return
    }

    let ignore = false

    async function loadActiveSection() {
      setIsLoading(true)
      setLoadError(null)

      try {
        switch (activeSection) {
          case 'dashboard': {
            const nextDashboard = await fetchDashboard()
            if (!ignore) {
              setDashboard(nextDashboard)
            }
            break
          }
          case 'services': {
            const nextServices = await fetchServices()
            if (!ignore) {
              setServices(nextServices)
            }
            break
          }
          case 'contracts': {
            const nextContracts = await fetchContracts()
            if (!ignore) {
              setContracts(nextContracts)
            }
            break
          }
          case 'incidents': {
            const nextIncidents = await fetchIncidents()
            if (!ignore) {
              setIncidents(nextIncidents)
            }
            break
          }
          case 'sync': {
            const nextSyncStates = await fetchSyncStates()
            if (!ignore) {
              setSyncStates(nextSyncStates)
            }
            break
          }
          case 'users': {
            const nextUsers = await fetchUsers()
            if (!ignore) {
              setUsers(nextUsers)
            }
            break
          }
        }
      } catch (error) {
        if (error instanceof ApiError && [401, 403].includes(error.status)) {
          clearSession('Session expiree ou role admin requis.')
          return
        }

        if (!ignore) {
          setLoadError(getErrorMessage(error))
        }
      } finally {
        if (!ignore) {
          setIsLoading(false)
        }
      }
    }

    void loadActiveSection()

    return () => {
      ignore = true
    }
  }, [activeSection, clearSession, refreshKey, token])

  async function handleLogin(email: string, password: string) {
    setLoginError(null)

    try {
      const response = await loginAdmin(email, password)

      if (response.user.role !== 'admin') {
        setLoginError('Ce compte ne dispose pas du role admin.')
        return
      }

      setAuthToken(response.accessToken)
      setCurrentUser(response.user)
      setToken(response.accessToken)
      setActiveSection('dashboard')
      setRefreshKey((value) => value + 1)
    } catch (error) {
      setLoginError(getErrorMessage(error))
    }
  }

  if (!token) {
    return <LoginScreen error={loginError} onSubmit={handleLogin} />
  }

  return (
    <div className="admin-shell">
      <aside className="sidebar">
        <div className="brand-block">
          <span className="brand-mark">CN</span>
          <div>
            <strong>Connected Neighbours</strong>
            <span>Back-office P0</span>
          </div>
        </div>

        <nav className="nav-list" aria-label="Navigation admin">
          {navigationItems.map((item) => (
            <button
              key={item.id}
              className={item.id === activeSection ? 'nav-item active' : 'nav-item'}
              type="button"
              onClick={() => setActiveSection(item.id)}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </aside>

      <main className="main-panel">
        <header className="topbar">
          <div>
            <p className="eyebrow">Administration</p>
            <h1>{getSectionLabel(activeSection)}</h1>
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

        {loadError ? <div className="error-banner">{loadError}</div> : null}
        {isLoading ? <div className="loading-panel">Chargement...</div> : null}

        <section className="content-section">
          {renderSection({
            activeSection,
            dashboard,
            services,
            contracts,
            incidents,
            syncStates,
            users,
          })}
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
          <span className="brand-mark">CN</span>
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

type RenderSectionProps = {
  activeSection: SectionId
  dashboard: AdminDashboard | null
  services: AdminServiceRow[]
  contracts: AdminContractRow[]
  incidents: AdminIncidentRow[]
  syncStates: AdminSyncStateRow[]
  users: AdminUserRow[]
}

function renderSection(props: RenderSectionProps) {
  switch (props.activeSection) {
    case 'dashboard':
      return <DashboardView dashboard={props.dashboard} />
    case 'services':
      return <ServicesView services={props.services} />
    case 'contracts':
      return <ContractsView contracts={props.contracts} />
    case 'incidents':
      return <IncidentsView incidents={props.incidents} />
    case 'sync':
      return <SyncView syncStates={props.syncStates} />
    case 'users':
      return <UsersView users={props.users} />
  }
}

function DashboardView({ dashboard }: { dashboard: AdminDashboard | null }) {
  if (!dashboard) {
    return <EmptyState message="Aucune donnee dashboard chargee." />
  }

  const metrics = [
    {
      label: 'Services',
      value: dashboard.totalServices,
      detail: `${formatNumber(dashboard.publishedServices)} publies, ${formatNumber(
        dashboard.completedServices,
      )} termines`,
    },
    {
      label: 'Candidatures',
      value: dashboard.totalApplications,
      detail: 'Dossiers de service recus',
    },
    {
      label: 'Contrats',
      value: dashboard.totalContracts,
      detail: `${formatNumber(dashboard.activeContracts)} actifs, ${formatNumber(
        dashboard.completedContracts,
      )} termines`,
    },
    {
      label: 'Incidents',
      value: dashboard.totalIncidents,
      detail: `${formatNumber(dashboard.openIncidents)} ouverts, ${formatNumber(
        dashboard.resolvedIncidents,
      )} resolus`,
    },
    {
      label: 'Alertes',
      value: dashboard.totalAlerts,
      detail: `${formatNumber(dashboard.openAlerts)} ouvertes`,
    },
    {
      label: 'Clients sync',
      value: dashboard.knownSyncClients,
      detail: 'Postes JavaFX connus',
    },
  ]

  return (
    <>
      <div className="metrics-grid">
        {metrics.map((metric) => (
          <MetricCard key={metric.label} {...metric} />
        ))}
      </div>

      <div className="server-time">
        <span>Heure serveur</span>
        <strong>{formatDate(dashboard.serverTime)}</strong>
      </div>
    </>
  )
}

function ServicesView({ services }: { services: AdminServiceRow[] }) {
  const columns: TableColumn<AdminServiceRow>[] = [
    { header: 'Titre', render: (row) => valueOrDash(row.title) },
    { header: 'Categorie', render: (row) => valueOrDash(row.category) },
    { header: 'Statut', render: (row) => <StatusBadge value={row.status} /> },
    { header: 'Owner', render: (row) => <MonoValue value={row.ownerId} /> },
    {
      header: 'Quartier',
      render: (row) => <MonoValue value={row.neighborhoodId} />,
    },
    {
      header: 'Points',
      render: (row) => formatNumber(row.pricePoints ?? 0),
      className: 'numeric-cell',
    },
    { header: 'Creation', render: (row) => formatDate(row.createdAt) },
  ]

  return (
    <DataTable
      columns={columns}
      emptyMessage="Aucun service recent."
      rows={services}
    />
  )
}

function ContractsView({ contracts }: { contracts: AdminContractRow[] }) {
  const columns: TableColumn<AdminContractRow>[] = [
    { header: 'Service', render: (row) => <MonoValue value={row.serviceId} /> },
    {
      header: 'Requester',
      render: (row) => <MonoValue value={row.requesterId} />,
    },
    {
      header: 'Provider',
      render: (row) => <MonoValue value={row.providerId} />,
    },
    {
      header: 'Points',
      render: (row) => formatNumber(row.pricePoints ?? 0),
      className: 'numeric-cell',
    },
    { header: 'Statut', render: (row) => <StatusBadge value={row.status} /> },
    {
      header: 'Signatures',
      render: (row) => `${row.signedByIds?.length ?? 0}/2`,
      className: 'numeric-cell',
    },
    { header: 'Creation', render: (row) => formatDate(row.createdAt) },
  ]

  return (
    <DataTable
      columns={columns}
      emptyMessage="Aucun contrat recent."
      rows={contracts}
    />
  )
}

function IncidentsView({ incidents }: { incidents: AdminIncidentRow[] }) {
  const columns: TableColumn<AdminIncidentRow>[] = [
    { header: 'Titre', render: (row) => valueOrDash(row.title) },
    { header: 'Type', render: (row) => valueOrDash(row.type) },
    { header: 'Severite', render: (row) => <SeverityBadge value={row.severity} /> },
    { header: 'Statut', render: (row) => <StatusBadge value={row.status} /> },
    { header: 'Source', render: (row) => valueOrDash(row.source) },
    { header: 'External ID', render: (row) => <MonoValue value={row.externalId} /> },
    { header: 'Derniere sync', render: (row) => formatDate(row.lastSyncedAt) },
    { header: 'Creation', render: (row) => formatDate(row.createdAt) },
  ]

  return (
    <DataTable
      columns={columns}
      emptyMessage="Aucun incident recent."
      rows={incidents}
    />
  )
}

function SyncView({ syncStates }: { syncStates: AdminSyncStateRow[] }) {
  const columns: TableColumn<AdminSyncStateRow>[] = [
    { header: 'Client', render: (row) => <MonoValue value={row.clientId} /> },
    { header: 'Statut', render: (row) => <StatusBadge value={row.status} /> },
    { header: 'Dernier pull', render: (row) => formatDate(row.lastPullAt) },
    { header: 'Dernier push', render: (row) => formatDate(row.lastPushAt) },
    {
      header: 'Dernier succes',
      render: (row) => formatDate(row.lastSuccessfulSyncAt),
    },
    { header: 'Erreur', render: (row) => valueOrDash(row.lastError) },
  ]

  return (
    <DataTable
      columns={columns}
      emptyMessage="Aucun client de synchronisation connu."
      rows={syncStates}
    />
  )
}

function UsersView({ users }: { users: AdminUserRow[] }) {
  const columns: TableColumn<AdminUserRow>[] = [
    { header: 'Email', render: (row) => valueOrDash(row.email) },
    { header: 'Nom', render: (row) => valueOrDash(row.displayName) },
    { header: 'Role', render: (row) => <StatusBadge value={row.role} /> },
    {
      header: 'Quartier',
      render: (row) => <MonoValue value={row.neighborhoodId} />,
    },
    {
      header: 'Solde',
      render: (row) => formatNumber(row.pointsBalance ?? 0),
      className: 'numeric-cell',
    },
    {
      header: 'Reserve',
      render: (row) => formatNumber(row.reservedPoints ?? 0),
      className: 'numeric-cell',
    },
  ]

  return (
    <DataTable
      columns={columns}
      emptyMessage="Aucun utilisateur recent."
      rows={users}
    />
  )
}

function MetricCard({
  label,
  value,
  detail,
}: {
  label: string
  value: number
  detail: string
}) {
  return (
    <article className="metric-card">
      <span>{label}</span>
      <strong>{formatNumber(value)}</strong>
      <p>{detail}</p>
    </article>
  )
}

function DataTable<T extends { id: string | null }>({
  columns,
  rows,
  emptyMessage,
}: {
  columns: TableColumn<T>[]
  rows: T[]
  emptyMessage: string
}) {
  if (rows.length === 0) {
    return <EmptyState message={emptyMessage} />
  }

  return (
    <div className="table-shell">
      <table>
        <thead>
          <tr>
            {columns.map((column) => (
              <th className={column.className} key={column.header}>
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={row.id ?? `row-${index}`}>
              {columns.map((column) => (
                <td className={column.className} key={column.header}>
                  {column.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function EmptyState({ message }: { message: string }) {
  return <div className="empty-state">{message}</div>
}

function StatusBadge({ value }: { value?: string | null }) {
  const status = value ?? 'unknown'

  return <span className={`badge ${getStatusTone(status)}`}>{status}</span>
}

function SeverityBadge({ value }: { value?: string | null }) {
  const severity = value ?? 'unknown'

  return <span className={`badge severity-${severity}`}>{severity}</span>
}

function MonoValue({ value }: { value?: string | null }) {
  if (!value) {
    return <span className="muted">-</span>
  }

  return <span className="mono-value">{value}</span>
}

function valueOrDash(value?: string | number | null) {
  if (value === undefined || value === null || value === '') {
    return <span className="muted">-</span>
  }

  return String(value)
}

function formatNumber(value: number) {
  return numberFormatter.format(value)
}

function formatDate(value?: string | Date | null) {
  if (!value) {
    return '-'
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return '-'
  }

  return dateFormatter.format(date)
}

function getSectionLabel(section: SectionId) {
  return navigationItems.find((item) => item.id === section)?.label ?? 'Dashboard'
}

function getStatusTone(status: string) {
  if (['active', 'completed', 'published', 'resolved', 'success'].includes(status)) {
    return 'success'
  }

  if (['open', 'sent', 'draft', 'reported', 'in_progress', 'created'].includes(status)) {
    return 'warning'
  }

  if (['cancelled', 'rejected', 'disputed', 'error', 'closed'].includes(status)) {
    return 'danger'
  }

  return 'neutral'
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message
  }

  return 'Erreur inattendue'
}

export default App
