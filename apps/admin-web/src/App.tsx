import { useCallback, useEffect, useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import type { LatLngExpression } from 'leaflet'
import {
  CircleMarker,
  MapContainer,
  Polygon,
  TileLayer,
  useMapEvents,
} from 'react-leaflet'

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
import {
  archiveNeighborhood,
  createNeighborhood,
  fetchNeighborhoodMembers,
  fetchNeighborhoods,
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
import './App.css'

const navigationItems = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'neighborhoods', label: 'Quartiers' },
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
  const [neighborhoods, setNeighborhoods] = useState<NeighborhoodItem[]>([])
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
          case 'neighborhoods': {
            const nextNeighborhoods = await fetchNeighborhoods()
            if (!ignore) {
              setNeighborhoods(nextNeighborhoods)
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
            neighborhoods,
            services,
            contracts,
            incidents,
            syncStates,
            users,
            onReload: () => setRefreshKey((value) => value + 1),
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
      return <DashboardView dashboard={props.dashboard} />
    case 'neighborhoods':
      return (
        <NeighborhoodsView
          neighborhoods={props.neighborhoods}
          onReload={props.onReload}
        />
      )
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
  const [members, setMembers] = useState<NeighborhoodMember[]>([])
  const [stats, setStats] = useState<NeighborhoodStats | null>(null)
  const [detailError, setDetailError] = useState<string | null>(null)
  const [isArchiving, setIsArchiving] = useState(false)

  const selectedNeighborhood =
    neighborhoods.find((neighborhood) => getNeighborhoodId(neighborhood) === selectedId) ??
    neighborhoods[0] ??
    null
  const effectiveSelectedId = selectedNeighborhood
    ? getNeighborhoodId(selectedNeighborhood)
    : null

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
    setIsArchiving(true)
    setDetailError(null)

    try {
      await archiveNeighborhood(getNeighborhoodId(neighborhood))
      if (selectedId === getNeighborhoodId(neighborhood)) {
        setSelectedId(null)
      }
      if (editingNeighborhood && getNeighborhoodId(editingNeighborhood) === getNeighborhoodId(neighborhood)) {
        setEditingNeighborhood(null)
      }
      onReload()
    } catch (error) {
      setDetailError(getErrorMessage(error))
    } finally {
      setIsArchiving(false)
    }
  }

  return (
    <div className="neighborhood-layout">
      <section className="panel neighborhood-list-panel">
        <div className="section-heading">
          <div>
            <h2>Quartiers</h2>
            <p>Zones geographiques disponibles pour les habitants et services.</p>
          </div>
        </div>

        {neighborhoods.length === 0 ? (
          <EmptyState message="Aucun quartier configure." />
        ) : (
          <div className="neighborhood-list">
            {neighborhoods.map((neighborhood) => {
              const id = getNeighborhoodId(neighborhood)
              const isSelected = id === effectiveSelectedId

              return (
                <article
                  className={isSelected ? 'neighborhood-item active' : 'neighborhood-item'}
                  key={id}
                >
                  <button type="button" onClick={() => setSelectedId(id)}>
                    <strong>{neighborhood.name}</strong>
                    <span>{neighborhood.city} {neighborhood.postalCode}</span>
                    <StatusBadge value={neighborhood.status ?? neighborhoodStatus(neighborhood)} />
                  </button>
                  <div className="action-row">
                    <button
                      className="secondary-button compact-button"
                      onClick={() => setEditingNeighborhood(neighborhood)}
                      type="button"
                    >
                      Modifier
                    </button>
                    <button
                      className="ghost-button danger compact-button"
                      disabled={isArchiving || neighborhoodStatus(neighborhood) === 'archived'}
                      onClick={() => void handleArchive(neighborhood)}
                      type="button"
                    >
                      Archiver
                    </button>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </section>

      <NeighborhoodForm
        key={editingNeighborhood ? getNeighborhoodId(editingNeighborhood) : 'create'}
        neighborhood={editingNeighborhood}
        onCancelEdit={() => setEditingNeighborhood(null)}
        onSaved={() => {
          setEditingNeighborhood(null)
          onReload()
        }}
      />

      <section className="panel neighborhood-detail-panel">
        <h2>Detail quartier</h2>
        {detailError ? <div className="error-banner compact">{detailError}</div> : null}
        {selectedNeighborhood ? (
          <div className="stack compact">
            <div>
              <h3>{selectedNeighborhood.name}</h3>
              <p className="muted">{selectedNeighborhood.description}</p>
            </div>
            <div className="mini-metrics-grid">
              <MetricCard
                detail="Habitants rattaches"
                label="Membres"
                value={stats?.users ?? members.length}
              />
              <MetricCard
                detail="Services du quartier"
                label="Services"
                value={stats?.services ?? 0}
              />
              <MetricCard
                detail="Incidents signales"
                label="Incidents"
                value={stats?.incidents ?? 0}
              />
            </div>
            <div className="mini-metrics-grid">
              <MetricCard detail="Evenements" label="Events" value={stats?.events ?? 0} />
              <MetricCard detail="Votes" label="Votes" value={stats?.votes ?? 0} />
            </div>
            {members.length > 0 ? (
              <div className="member-list">
                {members.map((member) => (
                  <div key={member.id ?? member._id ?? member.email}>
                    <strong>{member.displayName ?? member.email}</strong>
                    <span>{member.email}</span>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState message="Aucun membre rattache pour le moment." />
            )}
          </div>
        ) : (
          <EmptyState message="Selectionnez ou creez un quartier." />
        )}
      </section>
    </div>
  )
}

function NeighborhoodForm({
  neighborhood,
  onCancelEdit,
  onSaved,
}: {
  neighborhood: NeighborhoodItem | null
  onCancelEdit: () => void
  onSaved: () => void
}) {
  const [name, setName] = useState(neighborhood?.name ?? '')
  const [slug, setSlug] = useState(neighborhood?.slug ?? '')
  const [description, setDescription] = useState(neighborhood?.description ?? '')
  const [city, setCity] = useState(neighborhood?.city ?? 'Paris')
  const [postalCode, setPostalCode] = useState(neighborhood?.postalCode ?? '')
  const [ring, setRing] = useState<CoordinatePair[]>(
    openRingFromPolygon(neighborhood?.boundary),
  )
  const [formError, setFormError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const isEditing = !!neighborhood
  const canSubmit =
    name.trim().length > 0 &&
    slug.trim().length > 0 &&
    city.trim().length > 0 &&
    postalCode.trim().length > 0 &&
    ring.length >= 3

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

  return (
    <section className="panel neighborhood-form-panel">
      <div className="section-heading">
        <div>
          <h2>{isEditing ? 'Modifier le quartier' : 'Creer un quartier'}</h2>
          <p>Cliquez sur la carte pour dessiner le polygone geographique.</p>
        </div>
        {isEditing ? (
          <button className="ghost-button compact-button" onClick={onCancelEdit} type="button">
            Nouveau
          </button>
        ) : null}
      </div>

      <form className="form-grid" onSubmit={handleSubmit}>
        <div className="form-row">
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
        </div>

        <label>
          Description
          <textarea
            onChange={(event) => setDescription(event.target.value)}
            required
            rows={3}
            value={description}
          />
        </label>

        <div className="form-row">
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

        <NeighborhoodMapEditor ring={ring} onChange={setRing} />

        <div className="map-actions">
          <span>{ring.length} point(s) places</span>
          <button className="ghost-button compact-button" onClick={() => setRing([])} type="button">
            Effacer le trace
          </button>
        </div>

        {formError ? <div className="error-banner compact">{formError}</div> : null}

        <button className="primary-button" disabled={!canSubmit || isSubmitting} type="submit">
          {isSubmitting
            ? 'Enregistrement...'
            : isEditing
              ? 'Enregistrer'
              : 'Creer le quartier'}
        </button>
      </form>
    </section>
  )
}

function NeighborhoodMapEditor({
  ring,
  onChange,
}: {
  ring: CoordinatePair[]
  onChange: (ring: CoordinatePair[]) => void
}) {
  const positions = toLeafletPositions(closeRing(ring))

  return (
    <div className="map-shell">
      <MapContainer
        center={[48.8567, 2.3508]}
        className="neighborhood-map"
        scrollWheelZoom
        zoom={15}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapClickHandler onPoint={(point) => onChange([...ring, point])} />
        {positions.length >= 3 ? (
          <Polygon pathOptions={{ color: '#047857', weight: 3 }} positions={positions} />
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

function getStatusTone(status: string) {
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
