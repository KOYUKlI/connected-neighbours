import { useCallback, useEffect, useRef, useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import type { LatLngExpression } from 'leaflet'
import {
  CircleMarker,
  MapContainer,
  Polygon,
  TileLayer,
  useMap,
  useMapEvents,
} from 'react-leaflet'

import {
  ApiError,
  getAuthToken,
  getCurrentAdmin,
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
import {
  archiveNeighborhood,
  createNeighborhood,
  fetchNeighborhoods,
  fetchNeighborhoodMembers,
  fetchNeighborhoodStats,
  updateNeighborhood,
} from './api/neighborhoods'
import type {
  CoordinatePair,
  GeoJsonPolygon,
  NeighborhoodInput,
  NeighborhoodItem,
  NeighborhoodMember,
  NeighborhoodStats,
} from './api/neighborhoods'
import { searchPlaces } from './api/geocoding'
import type { GeocodingAddress, GeocodingGeoJson, PlaceSearchResult } from './api/geocoding'
import { Badge as UiBadge } from './components/ui/Badge'
import { Card } from './components/ui/Card'
import { EmptyState as UiEmptyState } from './components/ui/EmptyState'
import { PageHeader as AdminPageHeader } from './components/ui/PageHeader'
import { SectionHeader } from './components/ui/SectionHeader'
import { StatCard } from './components/ui/StatCard'
import { Tabs } from './components/ui/Tabs'
import { Toolbar } from './components/ui/Toolbar'
import { AdminShell } from './components/layout/AdminShell'
import { AdminSidebar } from './components/layout/AdminSidebar'
import { AdminTopbar } from './components/layout/AdminTopbar'
import { Breadcrumb } from './components/layout/Breadcrumb'
import { ContractsListPage } from './pages/ContractsListPage'
import { DisputesPage } from './features/disputes/DisputesPage'
import { DashboardPage } from './pages/DashboardPage'
import { IncidentsListPage } from './pages/IncidentsListPage'
import { LoginPage } from './pages/LoginPage'
import { NeighborhoodCreatePage } from './pages/NeighborhoodCreatePage'
import { NeighborhoodDetailPage } from './pages/NeighborhoodDetailPage'
import { NeighborhoodEditPage } from './pages/NeighborhoodEditPage'
import { NeighborhoodsListPage } from './pages/NeighborhoodsListPage'
import { ServicesListPage } from './pages/ServicesListPage'
import { SyncPage } from './pages/SyncPage'
import { UsersListPage } from './pages/UsersListPage'

const navigationItems = [
  { id: 'dashboard', label: 'Dashboard', description: 'Vue globale', icon: 'dashboard' },
  { id: 'neighborhoods', label: 'Quartiers', description: 'Zones et habitants', icon: 'neighborhoods' },
  { id: 'services', label: 'Services', description: 'Annonces voisines', icon: 'services' },
  { id: 'contracts', label: 'Contrats', description: 'Signatures et points', icon: 'contracts' },
  { id: 'disputes', label: 'Litiges', description: 'Preuves et décisions', icon: 'disputes' },
  { id: 'incidents', label: 'Incidents', description: 'Signalements', icon: 'incidents' },
  { id: 'sync', label: 'Synchronisation', description: 'Clients JavaFX', icon: 'sync' },
  { id: 'users', label: 'Utilisateurs', description: 'Rôles et soldes', icon: 'users' },
] as const

type SectionId = (typeof navigationItems)[number]['id']

const demoEmail = 'admin@connected-neighbours.local'
const numberFormatter = new Intl.NumberFormat('fr-FR')
const dateFormatter = new Intl.DateTimeFormat('fr-FR', {
  dateStyle: 'short',
  timeStyle: 'short',
})

const brandClass =
  'flex items-center gap-3 [&_strong]:block [&_strong]:text-sm [&_strong]:font-bold [&_strong]:leading-tight [&_strong]:text-slate-950 [&_span]:block [&_span]:text-sm [&_span]:text-slate-500';
const brandMarkClass =
  'inline-flex h-10 w-10 items-center justify-center rounded-lg border border-blue-200 bg-blue-50 text-sm font-extrabold text-blue-700';
const buttonClasses = {
  primary:
    'inline-flex min-h-10 items-center justify-center rounded-lg border border-blue-600 bg-blue-600 px-4 py-2 text-sm font-extrabold text-white transition hover:bg-blue-700 disabled:cursor-progress disabled:opacity-65',
  secondary:
    'inline-flex min-h-10 items-center justify-center rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-extrabold text-blue-700 transition hover:bg-blue-100 disabled:cursor-progress disabled:opacity-65',
  ghost:
    'inline-flex min-h-10 items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-extrabold text-slate-950 transition hover:bg-slate-50 disabled:cursor-progress disabled:opacity-65',
  danger:
    'inline-flex min-h-10 items-center justify-center rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-extrabold text-red-700 transition hover:bg-red-50 disabled:cursor-progress disabled:opacity-65',
  compact:
    'inline-flex min-h-8 items-center justify-center rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-bold text-slate-950 transition hover:bg-slate-50 disabled:cursor-progress disabled:opacity-65',
  compactSecondary:
    'inline-flex min-h-8 items-center justify-center rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-sm font-bold text-blue-700 transition hover:bg-blue-100 disabled:cursor-progress disabled:opacity-65',
  compactDanger:
    'inline-flex min-h-8 items-center justify-center rounded-lg border border-red-200 bg-white px-3 py-1.5 text-sm font-bold text-red-700 transition hover:bg-red-50 disabled:cursor-progress disabled:opacity-65',
};
const sectionHeadingClass = 'mb-3 flex items-start justify-between gap-3 max-[620px]:flex-col';
const sectionTitleClass = 'm-0 text-xl font-extrabold text-slate-950';
const sectionCopyClass = 'mt-1.5 text-sm text-slate-500';
const metricsGridClass = 'grid grid-cols-4 gap-5 max-xl:grid-cols-2 max-[620px]:grid-cols-1';
const formGridClass =
  'grid gap-3 [&_input]:min-h-10 [&_input]:w-full [&_input]:rounded-lg [&_input]:border [&_input]:border-slate-200 [&_input]:bg-white [&_input]:px-3 [&_input]:py-2 [&_input]:text-slate-950 [&_label]:grid [&_label]:gap-2 [&_label]:text-sm [&_label]:font-extrabold [&_label]:text-slate-950 [&_textarea]:w-full [&_textarea]:rounded-lg [&_textarea]:border [&_textarea]:border-slate-200 [&_textarea]:bg-white [&_textarea]:px-3 [&_textarea]:py-2 [&_textarea]:text-slate-950';
const mutedClass = 'text-slate-500';

function App() {
  const [token, setToken] = useState(() => getAuthToken())
  const [currentUser, setCurrentUser] = useState<PublicUser | null>(null)
  const [activeSection, setActiveSection] = useState<SectionId>('dashboard')
  const [refreshKey, setRefreshKey] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [loginError, setLoginError] = useState<string | null>(null)
  const [dashboard, setDashboard] = useState<AdminDashboard | null>(null)
  const [neighborhoods, setNeighborhoods] = useState<NeighborhoodItem[]>([])
  const [services, setServices] = useState<AdminServiceRow[]>([])
  const [contracts, setContracts] = useState<AdminContractRow[]>([])
  const [incidents, setIncidents] = useState<AdminIncidentRow[]>([])
  const [syncStates, setSyncStates] = useState<AdminSyncStateRow[]>([])
  const [users, setUsers] = useState<AdminUserRow[]>([])
  const isBackgroundRefreshRef = useRef(false)

  const clearSession = useCallback((message?: string) => {
    removeAuthToken()
    setToken(null)
    setCurrentUser(null)
    setActiveSection('dashboard')
    setLoginError(message ?? null)
  }, [])

  useEffect(() => {
    if (!token || currentUser) {
      return
    }

    let ignore = false
    async function restoreSession() {
      try {
        const user = await getCurrentAdmin()
        if (!['admin', 'moderator'].includes(user.role)) {
          clearSession('Ce compte ne dispose pas d’un rôle de modération.')
          return
        }
        if (!ignore) {
          setCurrentUser(user)
          setActiveSection(user.role === 'moderator' ? 'disputes' : 'dashboard')
        }
      } catch (error) {
        if (!ignore) clearSession(getErrorMessage(error))
      }
    }

    void restoreSession()
    return () => {
      ignore = true
    }
  }, [clearSession, currentUser, token])

  useEffect(() => {
    if (!token || !currentUser) {
      return
    }

    let ignore = false

    async function loadActiveSection() {
      const isBackgroundRefresh = isBackgroundRefreshRef.current

      if (!isBackgroundRefresh) {
        setIsLoading(true)
        setLoadError(null)
      }

      try {
        switch (activeSection) {
          case 'dashboard': {
            const [nextDashboard, nextServices, nextIncidents, nextSyncStates] =
              await Promise.all([
                fetchDashboard(),
                fetchServices(),
                fetchIncidents(),
                fetchSyncStates(),
              ])
            if (!ignore) {
              setDashboard(nextDashboard)
              setServices(nextServices)
              setIncidents(nextIncidents)
              setSyncStates(nextSyncStates)
            }
            break
          }
          case 'neighborhoods': {
            const nextNeighborhoods = await fetchNeighborhoods()
            if (!ignore) {
              setNeighborhoods(nextNeighborhoods)
            }
            break
          }
          case 'services': {
            const [nextServices, nextUsers, nextNeighborhoods] = await Promise.all([
              fetchServices(),
              fetchUsers(),
              fetchNeighborhoods(),
            ])
            if (!ignore) {
              setServices(nextServices)
              setUsers(nextUsers)
              setNeighborhoods(nextNeighborhoods)
            }
            break
          }
          case 'contracts': {
            const [nextContracts, nextServices, nextUsers] = await Promise.all([
              fetchContracts(),
              fetchServices(),
              fetchUsers(),
            ])
            if (!ignore) {
              setContracts(nextContracts)
              setServices(nextServices)
              setUsers(nextUsers)
            }
            break
          }
          case 'disputes': {
            break
          }
          case 'incidents': {
            const [nextIncidents, nextNeighborhoods] = await Promise.all([
              fetchIncidents(),
              fetchNeighborhoods(),
            ])
            if (!ignore) {
              setIncidents(nextIncidents)
              setNeighborhoods(nextNeighborhoods)
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
            const [nextUsers, nextNeighborhoods] = await Promise.all([
              fetchUsers(),
              fetchNeighborhoods(),
            ])
            if (!ignore) {
              setUsers(nextUsers)
              setNeighborhoods(nextNeighborhoods)
            }
            break
          }
        }
      } catch (error) {
        if (error instanceof ApiError && [401, 403].includes(error.status)) {
          clearSession('Session expirée ou rôle admin requis.')
          return
        }

        if (!ignore && !isBackgroundRefresh) {
          setLoadError(getErrorMessage(error))
        }
      } finally {
        if (!ignore) {
          if (!isBackgroundRefresh) {
            setIsLoading(false)
          }
        }
        isBackgroundRefreshRef.current = false
      }
    }

    void loadActiveSection()

    return () => {
      ignore = true
    }
  }, [activeSection, clearSession, currentUser, refreshKey, token])

  useEffect(() => {
    if (!token) {
      return
    }

    const interval = window.setInterval(() => {
      isBackgroundRefreshRef.current = true
      setRefreshKey((value) => value + 1)
    }, 60000)

    return () => window.clearInterval(interval)
  }, [token])

  async function handleLogin(email: string, password: string) {
    setLoginError(null)

    try {
      const response = await loginAdmin(email, password)

      if (!['admin', 'moderator'].includes(response.user.role)) {
        setLoginError('Ce compte ne dispose pas d’un rôle de modération.')
        return
      }

      setAuthToken(response.accessToken)
      setCurrentUser(response.user)
      setToken(response.accessToken)
      setActiveSection(response.user.role === 'moderator' ? 'disputes' : 'dashboard')
      setRefreshKey((value) => value + 1)
    } catch (error) {
      setLoginError(getErrorMessage(error))
    }
  }

  if (!token) {
    return (
      <LoginPage>
        <LoginScreen error={loginError} onSubmit={handleLogin} />
      </LoginPage>
    )
  }

  return (
    <AdminShell
      sidebar={
        <AdminSidebar
          activeItem={activeSection}
          items={currentUser?.role === 'moderator' ? navigationItems.filter((item) => item.id === 'disputes') : navigationItems}
          onNavigate={setActiveSection}
        />
      }
      topbar={
        <AdminTopbar
          breadcrumb={
            <Breadcrumb
              items={[
                { label: 'Administration' },
                { label: getSectionLabel(activeSection) },
              ]}
            />
          }
          onLogout={() => clearSession()}
          roleLabel={currentUser?.role === 'moderator' ? 'Modérateur' : 'Administrateur'}
          userEmail={currentUser?.email ?? demoEmail}
          userName={currentUser?.displayName ?? 'Session admin'}
        />
      }
    >
      {loadError ? (
        <div className="rounded-lg border border-red-200 bg-red-100 px-4 py-3 font-bold text-red-700">
          {loadError}
        </div>
      ) : null}
      {isLoading ? (
        <div className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600 shadow-sm">
          Chargement...
        </div>
      ) : null}

      <section className="min-w-0">
        {renderSection({
          activeSection,
          dashboard,
          neighborhoods,
          services,
          contracts,
          incidents,
          syncStates,
          users,
          onReload: () => setRefreshKey((value) => value + 1),
        })}
      </section>
    </AdminShell>
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
    <main className="flex min-h-screen items-center justify-center bg-slate-100 p-6 text-slate-600">
      <section
        className="grid w-full max-w-md gap-6 rounded-lg border border-slate-200 bg-white p-7 shadow-xl"
        aria-labelledby="login-title"
      >
        <div className={`${brandClass} border-b border-slate-200 pb-5`}>
          <span className={brandMarkClass}>CN</span>
          <div>
            <strong>Connected Neighbours</strong>
            <span>Back-office admin</span>
          </div>
        </div>

        <div>
          <p className="mb-1.5 text-xs font-extrabold uppercase text-blue-600">Accès sécurisé</p>
          <h1 className="m-0 text-3xl font-extrabold leading-tight text-slate-950" id="login-title">
            Connexion administrateur
          </h1>
          <p className="mt-2 text-slate-500">
            Compte demo : {demoEmail} / admin123
          </p>
        </div>

        <form className={formGridClass} onSubmit={handleSubmit}>
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

          {error ? (
            <div className="rounded-lg border border-red-200 bg-red-100 px-4 py-3 font-bold text-red-700">
              {error}
            </div>
          ) : null}

          <button className={buttonClasses.primary} type="submit" disabled={isSubmitting}>
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
  neighborhoods: NeighborhoodItem[]
  services: AdminServiceRow[]
  contracts: AdminContractRow[]
  incidents: AdminIncidentRow[]
  syncStates: AdminSyncStateRow[]
  users: AdminUserRow[]
  onReload: () => void
}

function renderSection(props: RenderSectionProps) {
  switch (props.activeSection) {
    case 'dashboard':
      return (
        <DashboardPage>
          <DashboardView
            dashboard={props.dashboard}
            incidents={props.incidents}
            services={props.services}
            syncStates={props.syncStates}
          />
        </DashboardPage>
      )
    case 'neighborhoods':
      return (
        <NeighborhoodsView
          neighborhoods={props.neighborhoods}
          onReload={props.onReload}
        />
      )
    case 'services':
      return (
        <ServicesListPage
          neighborhoods={props.neighborhoods}
          services={props.services}
          users={props.users}
        />
      )
    case 'contracts':
      return (
        <ContractsListPage
          contracts={props.contracts}
          services={props.services}
          users={props.users}
        />
      )
    case 'disputes':
      return <DisputesPage />
    case 'incidents':
      return (
        <IncidentsListPage
          incidents={props.incidents}
          neighborhoods={props.neighborhoods}
        />
      )
    case 'sync':
      return <SyncPage syncStates={props.syncStates} />
    case 'users':
      return <UsersListPage neighborhoods={props.neighborhoods} users={props.users} />
  }
}

function DashboardView({
  dashboard,
  incidents,
  services,
  syncStates,
}: {
  dashboard: AdminDashboard | null
  incidents: AdminIncidentRow[]
  services: AdminServiceRow[]
  syncStates: AdminSyncStateRow[]
}) {
  if (!dashboard) {
    return <EmptyState message="Aucune donnée dashboard chargée." />
  }

  const metrics = [
    {
      label: 'Services',
      value: dashboard.totalServices,
      detail: `${formatNumber(dashboard.publishedServices)} publiés, ${formatNumber(
        dashboard.completedServices,
      )} terminés`,
      accent: 'blue' as const,
    },
    {
      label: 'Candidatures',
      value: dashboard.totalApplications,
      detail: 'Dossiers de service reçus',
      accent: 'slate' as const,
    },
    {
      label: 'Contrats',
      value: dashboard.totalContracts,
      detail: `${formatNumber(dashboard.activeContracts)} actifs, ${formatNumber(
        dashboard.completedContracts,
      )} terminés`,
      accent: 'emerald' as const,
    },
    {
      label: 'Incidents',
      value: dashboard.totalIncidents,
      detail: `${formatNumber(dashboard.openIncidents)} ouverts, ${formatNumber(
        dashboard.resolvedIncidents,
      )} résolus`,
      accent: 'amber' as const,
    },
    {
      label: 'Alertes',
      value: dashboard.totalAlerts,
      detail: `${formatNumber(dashboard.openAlerts)} ouvertes`,
      accent: 'red' as const,
    },
    {
      label: 'Clients sync',
      value: dashboard.knownSyncClients,
      detail: 'Postes JavaFX connus',
      accent: 'slate' as const,
    },
  ]

  return (
    <div className="grid gap-4">
      <AdminPageHeader
        eyebrow="Pilotage"
        title="Dashboard"
        description="Vue consolidée des services, contrats, incidents et clients de synchronisation."
        actions={
          <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-500 shadow-sm">
            Heure serveur : <strong className="text-slate-950">{formatDate(dashboard.serverTime)}</strong>
          </div>
        }
      />

      <div className={metricsGridClass}>
        {metrics.map((metric) => (
          <MetricCard key={metric.label} {...metric} />
        ))}
      </div>

      <div className="grid grid-cols-3 gap-4 max-xl:grid-cols-1">
        <Card className="grid gap-3">
          <SectionHeader
            title="Activités récentes"
            description="Derniers signaux consolidés pour la supervision."
          />
          <div className="grid gap-2">
            {syncStates.slice(0, 3).map((syncState) => (
              <div className="flex items-start justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3" key={syncState.id}>
                <div>
                  <strong className="text-slate-950">Client {formatShortId(syncState.clientId ?? '')}</strong>
                  <p className="mt-1 text-sm text-slate-500">Dernier succès : {formatDate(syncState.lastSuccessfulSyncAt)}</p>
                </div>
                <StatusBadge value={syncState.status} />
              </div>
            ))}
            {services.slice(0, 1).map((service) => (
              <div className="flex items-start justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3" key={service.id}>
                <div>
                  <strong className="text-slate-950">Service créé</strong>
                  <p className="mt-1 text-sm text-slate-500">{valueOrDash(service.title)}</p>
                </div>
                <StatusBadge value={service.status} />
              </div>
            ))}
            {syncStates.length === 0 && services.length === 0 ? (
              <EmptyState message="Aucune activité récente." />
            ) : null}
          </div>
        </Card>

        <Card className="grid gap-3">
          <SectionHeader
            title="Services récents"
            description="Dernières demandes visibles dans le back-office."
          />
          {services.length > 0 ? (
            <div className="grid gap-2">
              {services.slice(0, 5).map((service) => (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3" key={service.id}>
                  <div className="flex items-start justify-between gap-3">
                    <strong className="text-slate-950">{valueOrDash(service.title)}</strong>
                    <StatusBadge value={service.status} />
                  </div>
                  <p className="mt-1 text-sm text-slate-500">
                    {valueOrDash(service.category)} · {formatNumber(service.pricePoints ?? 0)} points
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState message="Aucun service récent." />
          )}
        </Card>

        <Card className="grid gap-3">
          <SectionHeader
            title="Incidents récents"
            description="Signalements à surveiller en priorité."
          />
          {incidents.length > 0 ? (
            <div className="grid gap-2">
              {incidents.slice(0, 5).map((incident) => (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3" key={incident.id}>
                  <div className="flex items-start justify-between gap-3">
                    <strong className="text-slate-950">{valueOrDash(incident.title)}</strong>
                    <SeverityBadge value={incident.severity} />
                  </div>
                  <p className="mt-1 text-sm text-slate-500">
                    {valueOrDash(incident.type)} · <StatusBadge value={incident.status} />
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState message="Aucun incident récent." />
          )}
        </Card>
      </div>
    </div>
  )
}

type NeighborhoodTab = 'overview' | 'map' | 'members' | 'stats' | 'history'
type NeighborhoodPageMode = 'list' | 'create' | 'detail' | 'edit'

function NeighborhoodsView({
  neighborhoods,
  onReload,
}: {
  neighborhoods: NeighborhoodItem[]
  onReload: () => void
}) {
  const [editingNeighborhood, setEditingNeighborhood] =
    useState<NeighborhoodItem | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [pageMode, setPageMode] = useState<NeighborhoodPageMode>('list')
  const [activeTab, setActiveTab] = useState<NeighborhoodTab>('overview')
  const [members, setMembers] = useState<NeighborhoodMember[]>([])
  const [stats, setStats] = useState<NeighborhoodStats | null>(null)
  const [statsByNeighborhoodId, setStatsByNeighborhoodId] = useState<
    Record<string, NeighborhoodStats>
  >({})
  const [detailError, setDetailError] = useState<string | null>(null)
  const [isArchiving, setIsArchiving] = useState(false)
  const [archivingId, setArchivingId] = useState<string | null>(null)
  const [formVersion, setFormVersion] = useState(0)

  const selectedNeighborhood = selectedId
    ? neighborhoods.find((neighborhood) => getNeighborhoodId(neighborhood) === selectedId) ??
    null
    : null
  const effectiveSelectedId = selectedNeighborhood
    ? getNeighborhoodId(selectedNeighborhood)
    : null

  useEffect(() => {
    if (neighborhoods.length === 0) {
      setSelectedId(null)
      return
    }

    const selectedStillExists = selectedId
      ? neighborhoods.some((neighborhood) => getNeighborhoodId(neighborhood) === selectedId)
      : false

    if (!selectedStillExists) {
      setSelectedId(getNeighborhoodId(neighborhoods[0]))
    }
  }, [neighborhoods, selectedId])

  useEffect(() => {
    if (neighborhoods.length === 0) {
      setStatsByNeighborhoodId({})
      return
    }

    let ignore = false

    async function loadListStats() {
      const entries = await Promise.all(
        neighborhoods.map(async (neighborhood) => {
          const id = getNeighborhoodId(neighborhood)

          try {
            return [id, await fetchNeighborhoodStats(id)] as const
          } catch {
            return null
          }
        }),
      )

      if (!ignore) {
        setStatsByNeighborhoodId(
          entries.reduce<Record<string, NeighborhoodStats>>((accumulator, entry) => {
            if (entry) {
              accumulator[entry[0]] = entry[1]
            }

            return accumulator
          }, {}),
        )
      }
    }

    void loadListStats()

    return () => {
      ignore = true
    }
  }, [neighborhoods])

  useEffect(() => {
    if (!effectiveSelectedId) {
      setMembers([])
      setStats(null)
      return
    }

    let ignore = false
    const selectedForRequest = effectiveSelectedId

    async function loadDetails() {
      setDetailError(null)

      try {
        const [nextMembers, nextStats] = await Promise.all([
          fetchNeighborhoodMembers(selectedForRequest),
          fetchNeighborhoodStats(selectedForRequest),
        ])

        if (!ignore) {
          setMembers(nextMembers)
          setStats(nextStats)
          setStatsByNeighborhoodId((currentStats) => ({
            ...currentStats,
            [selectedForRequest]: nextStats,
          }))
        }
      } catch (error) {
        if (!ignore) {
          setDetailError(getErrorMessage(error))
        }
      }
    }

    void loadDetails()

    return () => {
      ignore = true
    }
  }, [effectiveSelectedId])

  async function handleArchive(neighborhood: NeighborhoodItem) {
    const neighborhoodId = getNeighborhoodId(neighborhood)
    const confirmed = window.confirm(`Archiver le quartier "${neighborhood.name}" ?`)

    if (!confirmed) {
      return
    }

    setIsArchiving(true)
    setArchivingId(neighborhoodId)
    setDetailError(null)

    try {
      await archiveNeighborhood(neighborhoodId)
      if (selectedId === neighborhoodId) {
        setSelectedId(null)
      }
      if (editingNeighborhood && getNeighborhoodId(editingNeighborhood) === neighborhoodId) {
        setEditingNeighborhood(null)
      }
      setPageMode('list')
      setActiveTab('overview')
      onReload()
    } catch (error) {
      setDetailError(getErrorMessage(error))
    } finally {
      setIsArchiving(false)
      setArchivingId(null)
    }
  }

  function startNewNeighborhood() {
    setEditingNeighborhood(null)
    setPageMode('create')
    setFormVersion((value) => value + 1)
  }

  function startEditNeighborhood(neighborhood: NeighborhoodItem) {
    setSelectedId(getNeighborhoodId(neighborhood))
    setEditingNeighborhood(neighborhood)
    setPageMode('edit')
  }

  function showNeighborhood(neighborhood: NeighborhoodItem) {
    setSelectedId(getNeighborhoodId(neighborhood))
    setEditingNeighborhood(null)
    setPageMode('detail')
    setActiveTab('overview')
  }

  function backToList() {
    setEditingNeighborhood(null)
    setPageMode('list')
    setActiveTab('overview')
  }

  const detailStats = effectiveSelectedId
    ? statsByNeighborhoodId[effectiveSelectedId] ?? stats
    : stats
  const selectedRing = selectedNeighborhood
    ? openRingFromPolygon(selectedNeighborhood.boundary)
    : []
  const tabs = [
    { id: 'overview', label: 'Vue d’ensemble' },
    { id: 'map', label: 'Carte', count: selectedRing.length },
    { id: 'members', label: 'Membres', count: members.length },
    { id: 'stats', label: 'Statistiques' },
    { id: 'history', label: 'Historique' },
  ] satisfies Array<{ id: NeighborhoodTab; label: string; count?: ReactNode }>
  if (pageMode === 'create') {
    return (
      <NeighborhoodCreatePage>
        <AdminPageHeader
          eyebrow="Administration / Quartiers / Nouveau quartier"
          title="Créer un quartier"
          description="Recherchez une ville, renseignez les informations principales et dessinez la zone géographique."
          actions={
            <>
              <button className={buttonClasses.ghost} onClick={backToList} type="button">
                Annuler
              </button>
              <button className={buttonClasses.primary} form="neighborhood-create-form" type="submit">
                Enregistrer
              </button>
            </>
          }
        />
        <Card>
          <NeighborhoodForm
            formId="neighborhood-create-form"
            key={`create-${formVersion}`}
            neighborhood={null}
            onCancelEdit={backToList}
            onSaved={() => {
              backToList()
              setFormVersion((value) => value + 1)
              onReload()
            }}
          />
        </Card>
      </NeighborhoodCreatePage>
    )
  }

  if (pageMode === 'edit' && selectedNeighborhood) {
    return (
      <NeighborhoodEditPage>
        <AdminPageHeader
          eyebrow={`Administration / Quartiers / ${selectedNeighborhood.name} / Édition`}
          title="Modifier le quartier"
          description="Mettez à jour les informations, remplacez la zone géographique ou utilisez la recherche d’adresse."
          actions={
            <>
              <button className={buttonClasses.ghost} onClick={() => showNeighborhood(selectedNeighborhood)} type="button">
                Annuler
              </button>
              <button className={buttonClasses.primary} form="neighborhood-edit-form" type="submit">
                Enregistrer
              </button>
            </>
          }
        />
        <Card>
          <NeighborhoodForm
            formId="neighborhood-edit-form"
            key={getNeighborhoodId(editingNeighborhood ?? selectedNeighborhood)}
            neighborhood={editingNeighborhood ?? selectedNeighborhood}
            onCancelEdit={() => showNeighborhood(selectedNeighborhood)}
            onSaved={() => {
              showNeighborhood(selectedNeighborhood)
              onReload()
            }}
          />
        </Card>
      </NeighborhoodEditPage>
    )
  }

  if (pageMode === 'detail' && selectedNeighborhood) {
    return (
      <NeighborhoodDetailPage>
        <AdminPageHeader
          eyebrow={`Administration / Quartiers / ${selectedNeighborhood.name}`}
          title={selectedNeighborhood.name}
          description={`${selectedNeighborhood.city} · ${selectedNeighborhood.postalCode} · ${formatDate(selectedNeighborhood.updatedAt)}`}
          actions={
            <>
              <button className={buttonClasses.ghost} onClick={backToList} type="button">
                Retour liste
              </button>
              <button className={buttonClasses.secondary} onClick={() => startEditNeighborhood(selectedNeighborhood)} type="button">
                Modifier
              </button>
              <button
                className={buttonClasses.danger}
                disabled={isArchiving || neighborhoodStatus(selectedNeighborhood) === 'archived'}
                onClick={() => void handleArchive(selectedNeighborhood)}
                type="button"
              >
                Archiver
              </button>
            </>
          }
        />

        {detailError ? (
          <div className="rounded-lg border border-red-200 bg-red-100 px-4 py-3 font-bold text-red-700">
            {detailError}
          </div>
        ) : null}

        <Card className="grid grid-cols-5 gap-3 max-xl:grid-cols-2 max-sm:grid-cols-1">
          <SummaryItem label="Ville" value={selectedNeighborhood.city} />
          <SummaryItem label="Code postal" value={selectedNeighborhood.postalCode} />
          <SummaryItem label="Statut" value={<StatusBadge value={neighborhoodStatus(selectedNeighborhood)} />} />
          <SummaryItem label="Date création" value={formatDate(selectedNeighborhood.createdAt)} />
          <SummaryItem label="Créé par" value="Administration" />
        </Card>

        <Tabs items={tabs} onChange={setActiveTab} value={activeTab} />

        {activeTab === 'overview' ? (
          <div className="grid grid-cols-[minmax(0,1fr)_320px] gap-4 max-xl:grid-cols-1">
            <Card className="grid gap-3">
              <SectionHeader title="Vue d’ensemble" description="Informations clés du quartier sélectionné." />
              <p className="leading-6 text-slate-600">
                {selectedNeighborhood.description || 'Aucune description renseignée.'}
              </p>
              <dl className="grid grid-cols-3 gap-3 max-[760px]:grid-cols-1 [&_dd]:m-0 [&_div]:rounded-lg [&_div]:bg-slate-50 [&_div]:p-3 [&_dt]:text-xs [&_dt]:font-extrabold [&_dt]:uppercase [&_dt]:text-slate-500">
                <div>
                  <dt>Ville</dt>
                  <dd>{selectedNeighborhood.city}</dd>
                </div>
                <div>
                  <dt>Code postal</dt>
                  <dd>{selectedNeighborhood.postalCode}</dd>
                </div>
                <div>
                  <dt>Statut</dt>
                  <dd><StatusBadge value={neighborhoodStatus(selectedNeighborhood)} /></dd>
                </div>
              </dl>
            </Card>
            <Card className="grid gap-3">
              <SectionHeader title="Infos clés" description="Données synchronisées depuis l’API." />
              <MetricCard accent="blue" detail="Habitants rattachés" label="Membres" value={detailStats?.users ?? members.length} />
              <MetricCard accent="emerald" detail="Services publiés ou en cours" label="Services" value={detailStats?.services ?? 0} />
            </Card>
          </div>
        ) : null}

        {activeTab === 'map' ? (
          <Card className="grid gap-3">
            <Toolbar>
              <div>
                <strong className="text-slate-950">Carte du quartier</strong>
                <p className="mt-1 text-sm text-slate-500">Polygone GeoJSON stocké pour les services et incidents.</p>
              </div>
              <span className="rounded-full bg-slate-200 px-3 py-1 text-sm font-bold text-slate-600">
                {selectedRing.length} point(s)
              </span>
            </Toolbar>
            {selectedRing.length >= 3 ? (
              <NeighborhoodMapEditor
                center={getMapCenterFromRing(selectedRing)}
                focusKey={selectedRing.length}
                heightClassName="h-[560px] min-h-[420px]"
                onChange={() => undefined}
                readOnly
                ring={selectedRing}
              />
            ) : (
              <EmptyState message="Aucune zone géographique n’est encore tracée pour ce quartier." />
            )}
          </Card>
        ) : null}

        {activeTab === 'members' ? (
          <Card className="grid gap-3">
            <SectionHeader title="Membres" description={`${members.length} habitant(s) rattaché(s).`} />
            {members.length > 0 ? (
              <div className="grid gap-2">
                {members.map((member) => (
                  <div className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 max-sm:flex-col max-sm:items-start" key={member.id ?? member._id ?? member.email}>
                    <div>
                      <strong className="text-slate-950">{member.displayName ?? member.email ?? 'Utilisateur'}</strong>
                      <p className="mt-1 text-sm text-slate-500">{member.email}</p>
                    </div>
                    <StatusBadge value={member.role} />
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState message="Aucun membre rattaché pour le moment." />
            )}
          </Card>
        ) : null}

        {activeTab === 'stats' ? (
          <div className={metricsGridClass}>
            <MetricCard accent="blue" detail="Habitants rattachés" label="Membres" value={detailStats?.users ?? members.length} />
            <MetricCard accent="emerald" detail="Services du quartier" label="Services" value={detailStats?.services ?? 0} />
            <MetricCard accent="amber" detail="Incidents signalés" label="Incidents" value={detailStats?.incidents ?? 0} />
            <MetricCard accent="slate" detail="Événements du quartier" label="Événements" value={detailStats?.events ?? 0} />
            <MetricCard accent="slate" detail="Votes associés" label="Votes" value={detailStats?.votes ?? 0} />
          </div>
        ) : null}

        {activeTab === 'history' ? (
          <Card className="grid gap-3">
            <SectionHeader title="Historique" description="Traces disponibles dans les données actuelles." />
            <dl className="grid grid-cols-2 gap-3 max-[760px]:grid-cols-1 [&_dd]:m-0 [&_div]:rounded-lg [&_div]:bg-slate-50 [&_div]:p-3 [&_dt]:text-xs [&_dt]:font-extrabold [&_dt]:uppercase [&_dt]:text-slate-500">
              <div>
                <dt>Création</dt>
                <dd>{formatDate(selectedNeighborhood.createdAt)}</dd>
              </div>
              <div>
                <dt>Dernière modification</dt>
                <dd>{formatDate(selectedNeighborhood.updatedAt)}</dd>
              </div>
            </dl>
          </Card>
        ) : null}
      </NeighborhoodDetailPage>
    )
  }

  return (
    <NeighborhoodsListPage
      archivingId={archivingId}
      isArchiving={isArchiving}
      neighborhoods={neighborhoods}
      onAdd={startNewNeighborhood}
      onArchive={(id) => {
        const neighborhood = neighborhoods.find((item) => getNeighborhoodId(item) === id)

        if (neighborhood) {
          void handleArchive(neighborhood)
        }
      }}
      onEdit={(id) => {
        const neighborhood = neighborhoods.find((item) => getNeighborhoodId(item) === id)

        if (neighborhood) {
          startEditNeighborhood(neighborhood)
        }
      }}
      onView={(id) => {
        const neighborhood = neighborhoods.find((item) => getNeighborhoodId(item) === id)

        if (neighborhood) {
          showNeighborhood(neighborhood)
        }
      }}
      statsByNeighborhoodId={statsByNeighborhoodId}
    />
  )
}

function NeighborhoodForm({
  formId,
  neighborhood,
  onCancelEdit,
  onSaved,
}: {
  formId?: string
  neighborhood: NeighborhoodItem | null
  onCancelEdit: () => void
  onSaved: () => void
}) {
  const [name, setName] = useState(neighborhood?.name ?? '')
  const [slug, setSlug] = useState(neighborhood?.slug ?? '')
  const [description, setDescription] = useState(neighborhood?.description ?? '')
  const [city, setCity] = useState(neighborhood?.city ?? '')
  const [postalCode, setPostalCode] = useState(neighborhood?.postalCode ?? '')
  const [ring, setRing] = useState<CoordinatePair[]>(
    openRingFromPolygon(neighborhood?.boundary),
  )
  const [formError, setFormError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [placeQuery, setPlaceQuery] = useState('')
  const [placeResults, setPlaceResults] = useState<PlaceSearchResult[]>([])
  const [placeError, setPlaceError] = useState<string | null>(null)
  const [placeNotice, setPlaceNotice] = useState<string | null>(null)
  const [isSearchingPlace, setIsSearchingPlace] = useState(false)
  const [canSearchPlace, setCanSearchPlace] = useState(false)
  const [selectedPlace, setSelectedPlace] = useState<PlaceSearchResult | null>(null)
  const [suggestedRing, setSuggestedRing] = useState<CoordinatePair[] | null>(null)
  const [mapCenter, setMapCenter] = useState<LatLngExpression>(() =>
    getMapCenterFromRing(ring),
  )
  const [mapFocusKey, setMapFocusKey] = useState(0)
  const lastPlaceSearchAtRef = useRef(0)

  const isEditing = !!neighborhood
  const canSubmit =
    name.trim().length > 0 &&
    slug.trim().length > 0 &&
    city.trim().length > 0 &&
    postalCode.trim().length > 0 &&
    ring.length >= 3

  useEffect(() => {
    setCanSearchPlace(false)

    if (placeQuery.trim().length < 2) {
      return
    }

    const timer = window.setTimeout(() => setCanSearchPlace(true), 500)

    return () => window.clearTimeout(timer)
  }, [placeQuery])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!canSubmit) {
      setFormError('Renseignez les champs obligatoires et au moins 3 points sur la carte.')
      return
    }

    const payload: NeighborhoodInput = {
      name: name.trim(),
      slug: slug.trim().toLowerCase(),
      description: description.trim(),
      city: city.trim(),
      postalCode: postalCode.trim(),
      boundary: toGeoJsonPolygon(ring),
    }

    setIsSubmitting(true)
    setFormError(null)

    try {
      if (neighborhood) {
        await updateNeighborhood(getNeighborhoodId(neighborhood), payload)
      } else {
        await createNeighborhood(payload)
      }
      onSaved()
    } catch (error) {
      setFormError(getErrorMessage(error))
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handlePlaceSearch() {
    const query = placeQuery.trim()

    if (query.length < 2) {
      setPlaceError('Saisissez au moins 2 caractères pour lancer la recherche.')
      return
    }

    const now = Date.now()

    if (now - lastPlaceSearchAtRef.current < 1000) {
      setPlaceNotice('Patientez une seconde avant de relancer une recherche.')
      return
    }

    lastPlaceSearchAtRef.current = now
    setIsSearchingPlace(true)
    setPlaceError(null)
    setPlaceNotice(null)

    try {
      const results = await searchPlaces(query)
      setPlaceResults(results)

      if (results.length === 0) {
        setPlaceNotice('Aucun résultat trouvé. Essayez une ville ou une adresse plus précise.')
      }
    } catch (error) {
      setPlaceError(getErrorMessage(error))
    } finally {
      setIsSearchingPlace(false)
    }
  }

  function usePlaceResult(place: PlaceSearchResult) {
    const placeName = getPlaceName(place)
    const placeCity = extractCity(place.address)
    const placePostcode = extractPostcode(place.address)
    const nextSuggestedRing = normalizeGeoJsonForNeighborhood(place.geojson)

    setSelectedPlace(place)
    setMapCenter([place.lat, place.lon])
    setMapFocusKey((value) => value + 1)
    setSuggestedRing(nextSuggestedRing)
    setPlaceError(null)

    if (!name.trim()) {
      setName(placeName)
    }
    if (!slug.trim()) {
      setSlug(slugify(placeName))
    }
    if (!city.trim() && placeCity) {
      setCity(placeCity)
    }
    if (!postalCode.trim() && placePostcode) {
      setPostalCode(placePostcode)
    }
    if (!description.trim() && placeCity) {
      setDescription(`Quartier situé à ${placeCity}.`)
    }

    setPlaceNotice(
      nextSuggestedRing
        ? 'Une zone géographique a été récupérée. Vous pouvez l’utiliser ou la redessiner.'
        : 'Aucune zone exacte récupérée. Placez les points manuellement sur la carte.',
    )
  }

  function useSuggestedArea() {
    if (!suggestedRing) {
      return
    }

    setRing(suggestedRing)
    setMapCenter(getMapCenterFromRing(suggestedRing))
    setMapFocusKey((value) => value + 1)
    setPlaceNotice('Zone recherchée appliquée au quartier.')
  }

  function focusSelectedPlace() {
    if (!selectedPlace) {
      return
    }

    setMapCenter([selectedPlace.lat, selectedPlace.lon])
    setMapFocusKey((value) => value + 1)
  }

  return (
    <form className="grid gap-4" id={formId} onSubmit={handleSubmit}>
      <div className={sectionHeadingClass}>
        <div>
          <h2 className={sectionTitleClass}>{isEditing ? 'Informations modifiables' : 'Informations du quartier'}</h2>
          <p className={sectionCopyClass}>
            {isEditing
              ? 'Mode modification : les changements remplaceront les informations du quartier.'
              : 'Mode création : renseignez les informations principales du quartier.'}
          </p>
        </div>
        <span className="inline-flex rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1.5 text-xs font-extrabold text-blue-700">
          {isEditing ? 'Modification' : 'Création'}
        </span>
      </div>

      <section className="grid gap-3 rounded-lg border border-blue-100 bg-blue-50/50 p-4">
        <SectionHeader
          title="Rechercher une ville ou une adresse"
          description="Lancez une recherche manuelle pour centrer la carte et préremplir les champs vides."
        />
        <div className="flex gap-2 max-[620px]:flex-col">
          <input
            className="min-h-10 flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-950 outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
            onChange={(event) => setPlaceQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault()
                void handlePlaceSearch()
              }
            }}
            placeholder="Ex. Paris 11, Montreuil, 10 rue Oberkampf"
            type="search"
            value={placeQuery}
          />
            <button
              className={buttonClasses.secondary}
              disabled={isSearchingPlace || !canSearchPlace}
              onClick={() => void handlePlaceSearch()}
              type="button"
            >
            {isSearchingPlace ? 'Recherche...' : 'Rechercher'}
          </button>
        </div>

        {placeError ? (
          <div className="rounded-lg border border-red-200 bg-red-100 px-4 py-3 font-bold text-red-700">
            {placeError}
          </div>
        ) : null}
        {placeNotice ? (
          <div className="rounded-lg border border-blue-200 bg-white px-4 py-3 text-sm font-bold text-blue-700">
            {placeNotice}
          </div>
        ) : null}

        {placeResults.length > 0 ? (
          <div className="grid gap-2">
            {placeResults.map((place) => (
              <article
                className="grid gap-2 rounded-lg border border-slate-200 bg-white p-3"
                key={place.id}
              >
                <div className="flex items-start justify-between gap-3 max-[620px]:flex-col">
                  <div>
                    <strong className="text-slate-950">{getPlaceName(place)}</strong>
                    <p className="mt-1 text-sm text-slate-500">{shortenText(place.displayName, 110)}</p>
                    <p className="mt-1 text-xs font-bold uppercase text-slate-400">
                      {formatPlaceLocation(place)} · {formatPlaceType(place)}
                    </p>
                  </div>
                  <button
                    className={buttonClasses.compactSecondary}
                    onClick={() => usePlaceResult(place)}
                    type="button"
                  >
                    Utiliser ce résultat
                  </button>
                </div>
              </article>
            ))}
          </div>
        ) : null}
      </section>

      <div className="grid grid-cols-[minmax(0,0.9fr)_minmax(420px,1.1fr)] gap-5 max-xl:grid-cols-1">
        <section className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-5">
          <SectionHeader
            title="Informations du quartier"
            description="Ces informations seront visibles dans les listes admin et utilisées par les services."
          />
          <div className={`${formGridClass} grid-cols-2 max-[620px]:grid-cols-1`}>
            <label>
              Nom
              <input
                onChange={(event) => {
                  setName(event.target.value)
                  if (!isEditing && slug.length === 0) {
                    setSlug(slugify(event.target.value))
                  }
                }}
                required
                value={name}
              />
            </label>
            <label>
              Slug
              <input
                onChange={(event) => setSlug(event.target.value)}
                required
                value={slug}
              />
            </label>

            <label className="col-span-2 max-[620px]:col-span-1">
              Description
              <textarea
                onChange={(event) => setDescription(event.target.value)}
                required
                rows={6}
                value={description}
              />
            </label>

            <label>
              Ville
              <input
                onChange={(event) => setCity(event.target.value)}
                required
                value={city}
              />
            </label>
            <label>
              Code postal
              <input
                onChange={(event) => setPostalCode(event.target.value)}
                required
                value={postalCode}
              />
            </label>
          </div>
        </section>

        <section className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-5">
          <SectionHeader
            title="Zone géographique"
            description="Cliquez sur la carte pour définir la zone. Le polygone sera fermé automatiquement."
          />

          {isEditing && ring.length >= 3 ? (
            <p className="m-0 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-700">
              Le polygone existant est affiché et peut être remplacé avec de nouveaux points.
            </p>
          ) : null}

          <div className="flex flex-wrap items-center justify-between gap-2 text-slate-500">
            <span className="text-sm font-semibold">{ring.length} point(s) placé(s)</span>
            <div className="flex flex-wrap gap-2">
              {suggestedRing ? (
                <button className={buttonClasses.compactSecondary} onClick={useSuggestedArea} type="button">
                  Utiliser la zone détectée
                </button>
              ) : null}
              {selectedPlace ? (
                <button className={buttonClasses.compact} onClick={focusSelectedPlace} type="button">
                  Centrer sur la ville recherchée
                </button>
              ) : null}
              <button className={buttonClasses.compact} onClick={() => setRing([])} type="button">
                Effacer le tracé
              </button>
            </div>
          </div>

          <NeighborhoodMapEditor
            center={mapCenter}
            focusKey={mapFocusKey}
            heightClassName="h-[520px] min-h-[380px]"
            ring={ring}
            suggestedRing={suggestedRing}
            onChange={setRing}
          />
        </section>
      </div>

      {formError ? (
        <div className="rounded-lg border border-red-200 bg-red-100 px-4 py-3 font-bold text-red-700">
          {formError}
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2 border-t border-slate-200 pt-3 max-[620px]:[&_button]:w-full">
        <button className={buttonClasses.primary} disabled={!canSubmit || isSubmitting} type="submit">
          {isSubmitting
            ? 'Enregistrement...'
            : isEditing
              ? 'Enregistrer les modifications'
              : 'Créer le quartier'}
        </button>
        {isEditing ? (
          <button className={buttonClasses.ghost} onClick={onCancelEdit} type="button">
            Annuler la modification
          </button>
        ) : null}
      </div>
    </form>
  )
}

function NeighborhoodMapEditor({
  center = [48.8567, 2.3508],
  focusKey = 0,
  heightClassName = 'h-[min(42vh,390px)] min-h-[320px]',
  readOnly = false,
  ring,
  suggestedRing = null,
  onChange,
}: {
  center?: LatLngExpression
  focusKey?: number
  heightClassName?: string
  readOnly?: boolean
  ring: CoordinatePair[]
  suggestedRing?: CoordinatePair[] | null
  onChange: (ring: CoordinatePair[]) => void
}) {
  const positions = toLeafletPositions(closeRing(ring))
  const suggestedPositions = toLeafletPositions(closeRing(suggestedRing ?? []))

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200">
      <MapContainer
        center={center}
        className={`${heightClassName} w-full`}
        scrollWheelZoom
        zoom={15}
      >
        <MapCenterController center={center} focusKey={focusKey} zoom={15} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {readOnly ? null : (
          <MapClickHandler onPoint={(point) => onChange([...ring, point])} />
        )}
        {positions.length >= 3 ? (
          <Polygon pathOptions={{ color: '#047857', weight: 3 }} positions={positions} />
        ) : null}
        {suggestedPositions.length >= 3 ? (
          <Polygon
            pathOptions={{
              color: '#2563eb',
              dashArray: '8 6',
              fillOpacity: 0.08,
              weight: 2,
            }}
            positions={suggestedPositions}
          />
        ) : null}
        {ring.map((point, index) => (
          <CircleMarker
            center={[point[1], point[0]]}
            key={`${point[0]}-${point[1]}-${index}`}
            pathOptions={{ color: '#047857', fillColor: '#10b981', fillOpacity: 0.9 }}
            radius={6}
          />
        ))}
      </MapContainer>
    </div>
  )
}

function MapCenterController({
  center,
  focusKey,
  zoom,
}: {
  center: LatLngExpression
  focusKey: number
  zoom: number
}) {
  const map = useMap()

  useEffect(() => {
    map.setView(center, zoom)
  }, [center, focusKey, map, zoom])

  return null
}

function MapClickHandler({
  onPoint,
}: {
  onPoint: (point: CoordinatePair) => void
}) {
  useMapEvents({
    click(event) {
      onPoint([Number(event.latlng.lng.toFixed(6)), Number(event.latlng.lat.toFixed(6))])
    },
  })

  return null
}

function SummaryItem({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-xl bg-slate-50 p-3">
      <p className="text-xs font-bold uppercase tracking-wide text-slate-400">{label}</p>
      <div className="mt-1 text-sm font-extrabold text-slate-950">{value}</div>
    </div>
  )
}

function MetricCard({
  label,
  value,
  detail,
  accent = 'blue',
}: {
  label: string
  value: number
  detail: string
  accent?: 'blue' | 'emerald' | 'amber' | 'red' | 'slate'
}) {
  return (
    <StatCard accent={accent} helper={detail} label={label} value={formatNumber(value)} />
  )
}

function EmptyState({ message }: { message: string }) {
  return <UiEmptyState message={message} />
}

function StatusBadge({ value }: { value?: string | null }) {
  const status = value ?? 'unknown'

  return <UiBadge tone={getStatusTone(status)}>{status}</UiBadge>
}

function SeverityBadge({ value }: { value?: string | null }) {
  const severity = value ?? 'unknown'

  return <UiBadge tone={getSeverityTone(severity)}>{severity}</UiBadge>
}

function valueOrDash(value?: string | number | null) {
  if (value === undefined || value === null || value === '') {
    return <span className={mutedClass}>-</span>
  }

  return String(value)
}

function formatNumber(value: number) {
  return numberFormatter.format(value)
}

function formatShortId(value: string) {
  if (value.length <= 12) {
    return value
  }

  return `${value.slice(0, 6)}…${value.slice(-4)}`
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

function getMapCenterFromRing(ring: CoordinatePair[]): LatLngExpression {
  if (ring.length === 0) {
    return [48.8567, 2.3508]
  }

  const [longitude, latitude] = ring[0]

  return [latitude, longitude]
}

function getPlaceName(place: PlaceSearchResult) {
  return (
    place.address?.neighbourhood ??
    place.address?.suburb ??
    place.address?.city_district ??
    extractCity(place.address) ??
    place.displayName.split(',')[0]?.trim() ??
    place.displayName
  )
}

function extractCity(address?: GeocodingAddress) {
  return (
    address?.city ??
    address?.town ??
    address?.village ??
    address?.municipality ??
    address?.county
  )
}

function extractPostcode(address?: GeocodingAddress) {
  return address?.postcode ?? ''
}

function formatPlaceLocation(place: PlaceSearchResult) {
  const location = [extractCity(place.address), extractPostcode(place.address)]
    .filter(Boolean)
    .join(' ')

  return location || 'Localisation non précisée'
}

function formatPlaceType(place: PlaceSearchResult) {
  return place.placeType ?? 'lieu'
}

function normalizeGeoJsonForNeighborhood(
  geojson?: GeocodingGeoJson,
): CoordinatePair[] | null {
  if (!geojson) {
    return null
  }

  if (geojson.type === 'Polygon') {
    return extractPolygonRing(geojson.coordinates)
  }

  if (geojson.type === 'MultiPolygon' && Array.isArray(geojson.coordinates)) {
    for (const polygon of geojson.coordinates) {
      const ring = extractPolygonRing(polygon)

      if (ring) {
        return ring
      }
    }
  }

  return null
}

function extractPolygonRing(coordinates: unknown): CoordinatePair[] | null {
  if (!Array.isArray(coordinates) || !Array.isArray(coordinates[0])) {
    return null
  }

  const ring = coordinates[0]
    .map((point) => normalizeCoordinatePair(point))
    .filter((point): point is CoordinatePair => point !== null)

  if (ring.length < 4) {
    return null
  }

  return openRingFromPolygon({
    type: 'Polygon',
    coordinates: [ring],
  })
}

function normalizeCoordinatePair(point: unknown): CoordinatePair | null {
  if (!Array.isArray(point) || point.length < 2) {
    return null
  }

  const longitude = Number(point[0])
  const latitude = Number(point[1])

  if (
    Number.isNaN(longitude) ||
    Number.isNaN(latitude) ||
    longitude < -180 ||
    longitude > 180 ||
    latitude < -90 ||
    latitude > 90
  ) {
    return null
  }

  return [longitude, latitude]
}

function shortenText(value: string, maxLength: number) {
  if (value.length <= maxLength) {
    return value
  }

  return `${value.slice(0, maxLength - 1)}…`
}

function getSectionLabel(section: SectionId) {
  return navigationItems.find((item) => item.id === section)?.label ?? 'Dashboard'
}

function getNeighborhoodId(neighborhood: NeighborhoodItem) {
  return neighborhood.id ?? neighborhood._id ?? neighborhood.slug
}

function neighborhoodStatus(neighborhood: NeighborhoodItem) {
  return neighborhood.status ?? (neighborhood.isActive === false ? 'archived' : 'active')
}

function openRingFromPolygon(polygon?: GeoJsonPolygon) {
  const ring = polygon?.coordinates?.[0] ?? []

  if (ring.length <= 1) {
    return ring
  }

  const first = ring[0]
  const last = ring[ring.length - 1]

  if (first[0] === last[0] && first[1] === last[1]) {
    return ring.slice(0, -1)
  }

  return ring
}

function closeRing(ring: CoordinatePair[]) {
  if (ring.length === 0) {
    return []
  }

  const first = ring[0]
  const last = ring[ring.length - 1]

  if (first[0] === last[0] && first[1] === last[1]) {
    return ring
  }

  return [...ring, first]
}

function toGeoJsonPolygon(ring: CoordinatePair[]): GeoJsonPolygon {
  return {
    type: 'Polygon',
    coordinates: [closeRing(ring)],
  }
}

function toLeafletPositions(ring: CoordinatePair[]): LatLngExpression[] {
  return ring.map(([longitude, latitude]) => [latitude, longitude])
}

function slugify(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function getSeverityTone(severity: string): 'success' | 'warning' | 'danger' | 'neutral' {
  if (['high', 'critical'].includes(severity)) {
    return 'danger'
  }

  return 'neutral'
}

function getStatusTone(status: string): 'success' | 'warning' | 'danger' | 'neutral' {
  if (['active', 'completed', 'published', 'resolved', 'success'].includes(status)) {
    return 'success'
  }

  if (['open', 'sent', 'draft', 'reported', 'in_progress', 'created'].includes(status)) {
    return 'warning'
  }

  if (['archived', 'cancelled', 'rejected', 'disputed', 'error', 'closed'].includes(status)) {
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
