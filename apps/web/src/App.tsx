import { useCallback, useEffect, useMemo, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';

import {
  acceptApplication,
  createApplication,
  getApplicationsForService,
  getMyApplications,
  rejectApplication,
  withdrawApplication,
} from './api/applications';
import type {
  CreateApplicationInput,
  ServiceApplication,
} from './api/applications';
import { getMe, login } from './api/auth';
import type { AuthUser } from './api/auth';
import {
  ApiError,
  clearAuthToken,
  getAuthToken,
  setAuthToken,
} from './api/client';
import {
  cancelContract,
  completeContract,
  createContractFromApplication,
  getContracts,
  signContract,
} from './api/contracts';
import type { ContractItem } from './api/contracts';
import { createIncident, getIncidents } from './api/incidents';
import type {
  CreateIncidentInput,
  IncidentItem,
  IncidentSeverity,
  IncidentType,
} from './api/incidents';
import { getPointBalance, getPointTransactions } from './api/points';
import type { PointBalance, PointTransaction } from './api/points';
import { exportRgpdData } from './api/rgpd';
import type { RgpdExport } from './api/rgpd';
import {
  cancelService,
  createService,
  getServices,
  publishService,
} from './api/services';
import type {
  CreateServiceInput,
  ServiceItem,
  ServiceStatus,
  ServiceType,
} from './api/services';
import './App.css';

const demoAccounts = [
  {
    label: 'Alice',
    email: 'alice@connected-neighbours.local',
    password: 'alice123',
  },
  {
    label: 'Bob',
    email: 'bob@connected-neighbours.local',
    password: 'bob123',
  },
  {
    label: 'Admin',
    email: 'admin@connected-neighbours.local',
    password: 'admin123',
  },
];

const navigationItems = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'services', label: 'Services' },
  { id: 'applications', label: 'Mes candidatures' },
  { id: 'contracts', label: 'Contrats' },
  { id: 'points', label: 'Points' },
  { id: 'incidents', label: 'Incidents' },
  { id: 'rgpd', label: 'RGPD' },
] as const;

type SectionId = (typeof navigationItems)[number]['id'];
type ApplicationMap = Record<string, ServiceApplication[]>;

type TableColumn<T> = {
  header: string;
  render: (row: T) => ReactNode;
  className?: string;
};

const numberFormatter = new Intl.NumberFormat('fr-FR');
const dateFormatter = new Intl.DateTimeFormat('fr-FR', {
  dateStyle: 'short',
  timeStyle: 'short',
});

const rgpdSectionLabels: Record<string, string> = {
  exportedAt: 'Date d’export',
  user: 'Profil utilisateur',
  services: 'Services créés',
  applicationsAsApplicant: 'Mes candidatures envoyées',
  applicationsAsOwner: 'Candidatures reçues',
  contracts: 'Contrats liés',
  pointTransactions: 'Transactions de points',
  incidents: 'Incidents signalés',
  alerts: 'Alertes liées',
  syncOperations: 'Opérations de synchronisation',
  documents: 'Documents',
};

const rgpdSectionOrder = [
  'exportedAt',
  'user',
  'services',
  'applicationsAsApplicant',
  'applicationsAsOwner',
  'contracts',
  'pointTransactions',
  'incidents',
  'alerts',
  'syncOperations',
  'documents',
] as const;

export default function App() {
  const [token, setToken] = useState(() => getAuthToken());
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [activeSection, setActiveSection] = useState<SectionId>('dashboard');
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [myApplications, setMyApplications] = useState<ServiceApplication[]>([]);
  const [receivedApplications, setReceivedApplications] =
    useState<ApplicationMap>({});
  const [contracts, setContracts] = useState<ContractItem[]>([]);
  const [pointBalance, setPointBalance] = useState<PointBalance | null>(null);
  const [pointTransactions, setPointTransactions] = useState<PointTransaction[]>(
    [],
  );
  const [incidents, setIncidents] = useState<IncidentItem[]>([]);
  const [rgpdExport, setRgpdExport] = useState<RgpdExport | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [actionPending, setActionPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const serviceById = useMemo(() => {
    const entries = services.map(
      (service) => [getEntityId(service), service] as const,
    );
    return new Map(entries);
  }, [services]);

  const clearSession = useCallback((message?: string) => {
    clearAuthToken();
    setToken(null);
    setCurrentUser(null);
    setServices([]);
    setMyApplications([]);
    setReceivedApplications({});
    setContracts([]);
    setPointBalance(null);
    setPointTransactions([]);
    setIncidents([]);
    setRgpdExport(null);
    setActiveSection('dashboard');
    setError(message ?? null);
  }, []);

  const loadWorkflow = useCallback(async () => {
    if (!getAuthToken()) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const profile = await getMe();
      const [
        nextServices,
        nextMyApplications,
        nextContracts,
        nextBalance,
        nextTransactions,
        nextIncidents,
      ] = await Promise.all([
        getServices(),
        getMyApplications(),
        getContracts(),
        getPointBalance(),
        getPointTransactions(),
        getIncidents(),
      ]);

      const ownerServices = nextServices.filter(
        (service) => service.ownerId === profile.id,
      );
      const ownerApplicationEntries = await Promise.all(
        ownerServices.map(async (service) => {
          const serviceId = getEntityId(service);
          const applications = await getApplicationsForService(serviceId).catch(
            () => [],
          );

          return [serviceId, applications] as const;
        }),
      );

      setCurrentUser(profile);
      setServices(nextServices);
      setMyApplications(nextMyApplications);
      setContracts(nextContracts);
      setPointBalance(nextBalance);
      setPointTransactions(nextTransactions);
      setIncidents(nextIncidents);
      setReceivedApplications(Object.fromEntries(ownerApplicationEntries));
    } catch (loadError) {
      if (isUnauthorized(loadError)) {
        clearSession('Session expiree. Merci de vous reconnecter.');
        return;
      }

      setError(getErrorMessage(loadError));
    } finally {
      setIsLoading(false);
    }
  }, [clearSession]);

  useEffect(() => {
    if (token) {
      void loadWorkflow();
    }
  }, [loadWorkflow, token]);

  async function handleLogin(email: string, password: string) {
    setActionPending('login');
    setError(null);
    setNotice(null);

    try {
      const response = await login({ email, password });
      setAuthToken(response.accessToken);
      setToken(response.accessToken);
      setCurrentUser(response.user);
      setNotice(`Bienvenue ${response.user.displayName ?? response.user.email}.`);
      return true;
    } catch (loginError) {
      setError(getErrorMessage(loginError));
      return false;
    } finally {
      setActionPending(null);
    }
  }

  async function runAction(label: string, action: () => Promise<unknown>) {
    setActionPending(label);
    setError(null);
    setNotice(null);

    try {
      await action();
      await loadWorkflow();
      setNotice('Action realisee avec succes.');
      return true;
    } catch (actionError) {
      if (isUnauthorized(actionError)) {
        clearSession('Session expiree. Merci de vous reconnecter.');
        return false;
      }

      setError(getErrorMessage(actionError));
      return false;
    } finally {
      setActionPending(null);
    }
  }

  async function handleRgpdExport() {
    setActionPending('rgpd-export');
    setError(null);
    setNotice(null);

    try {
      setRgpdExport(await exportRgpdData());
      setNotice('Export RGPD charge.');
    } catch (exportError) {
      if (isUnauthorized(exportError)) {
        clearSession('Session expiree. Merci de vous reconnecter.');
        return;
      }

      setError(getErrorMessage(exportError));
    } finally {
      setActionPending(null);
    }
  }

  if (!token) {
    return (
      <LoginScreen
        error={error}
        isPending={actionPending === 'login'}
        onSubmit={handleLogin}
      />
    );
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">CN</span>
          <div>
            <strong>Connected Neighbours</strong>
            <span>Espace habitant P0</span>
          </div>
        </div>

        <nav className="nav-list" aria-label="Navigation utilisateur">
          {navigationItems.map((item) => (
            <button
              className={item.id === activeSection ? 'nav-item active' : 'nav-item'}
              key={item.id}
              onClick={() => setActiveSection(item.id)}
              type="button"
            >
              {item.label}
            </button>
          ))}
        </nav>
      </aside>

      <main className="main-panel">
        <header className="topbar">
          <div>
            <p className="eyebrow">Parcours P0</p>
            <h1>{getSectionLabel(activeSection)}</h1>
          </div>

          <div className="topbar-actions">
            <div className="session-card">
              <span>{currentUser?.displayName ?? 'Session habitant'}</span>
              <strong>{currentUser?.email ?? 'Profil en cours'}</strong>
            </div>
            <button
              className="secondary-button"
              disabled={isLoading}
              onClick={() => void loadWorkflow()}
              type="button"
            >
              Actualiser
            </button>
            <button
              className="ghost-button"
              onClick={() => clearSession()}
              type="button"
            >
              Deconnexion
            </button>
          </div>
        </header>

        {isLoading ? <div className="info-banner">Chargement des donnees...</div> : null}
        {notice ? <div className="success-banner">{notice}</div> : null}
        {error ? <div className="error-banner">{error}</div> : null}

        <section className="content-section">
          {renderSection({
            activeSection,
            actionPending,
            contracts,
            currentUser,
            incidents,
            myApplications,
            onAcceptApplication: (id) =>
              runAction('accept-application', () => acceptApplication(id)),
            onCancelContract: (id) =>
              runAction('cancel-contract', () => cancelContract(id)),
            onCancelService: (id) =>
              runAction('cancel-service', () => cancelService(id)),
            onCompleteContract: (id) =>
              runAction('complete-contract', () => completeContract(id)),
            onCreateApplication: (serviceId, input) =>
              runAction('create-application', () =>
                createApplication(serviceId, input),
              ),
            onCreateIncident: (input) =>
              runAction('create-incident', () => createIncident(input)),
            onCreateService: (input) =>
              runAction('create-service', () => createService(input)),
            onExportRgpd: handleRgpdExport,
            onGenerateContract: (id) =>
              runAction('generate-contract', () =>
                createContractFromApplication(id),
              ),
            onPublishService: (id) =>
              runAction('publish-service', () => publishService(id)),
            onRejectApplication: (id) =>
              runAction('reject-application', () => rejectApplication(id)),
            onSignContract: (id) =>
              runAction('sign-contract', () => signContract(id)),
            onWithdrawApplication: (id) =>
              runAction('withdraw-application', () => withdrawApplication(id)),
            pointBalance,
            pointTransactions,
            receivedApplications,
            rgpdExport,
            serviceById,
            services,
          })}
        </section>
      </main>
    </div>
  );
}

type RenderSectionProps = {
  activeSection: SectionId;
  actionPending: string | null;
  contracts: ContractItem[];
  currentUser: AuthUser | null;
  incidents: IncidentItem[];
  myApplications: ServiceApplication[];
  onAcceptApplication: (id: string) => Promise<boolean>;
  onCancelContract: (id: string) => Promise<boolean>;
  onCancelService: (id: string) => Promise<boolean>;
  onCompleteContract: (id: string) => Promise<boolean>;
  onCreateApplication: (
    serviceId: string,
    input: CreateApplicationInput,
  ) => Promise<boolean>;
  onCreateIncident: (input: CreateIncidentInput) => Promise<boolean>;
  onCreateService: (input: CreateServiceInput) => Promise<boolean>;
  onExportRgpd: () => Promise<void>;
  onGenerateContract: (id: string) => Promise<boolean>;
  onPublishService: (id: string) => Promise<boolean>;
  onRejectApplication: (id: string) => Promise<boolean>;
  onSignContract: (id: string) => Promise<boolean>;
  onWithdrawApplication: (id: string) => Promise<boolean>;
  pointBalance: PointBalance | null;
  pointTransactions: PointTransaction[];
  receivedApplications: ApplicationMap;
  rgpdExport: RgpdExport | null;
  serviceById: Map<string, ServiceItem>;
  services: ServiceItem[];
};

function renderSection(props: RenderSectionProps) {
  switch (props.activeSection) {
    case 'dashboard':
      return <DashboardView {...props} />;
    case 'services':
      return <ServicesView {...props} />;
    case 'applications':
      return <ApplicationsView {...props} />;
    case 'contracts':
      return <ContractsView {...props} />;
    case 'points':
      return <PointsView {...props} />;
    case 'incidents':
      return <IncidentsView {...props} />;
    case 'rgpd':
      return <RgpdView {...props} />;
  }
}

function LoginScreen({
  error,
  isPending,
  onSubmit,
}: {
  error: string | null;
  isPending: boolean;
  onSubmit: (email: string, password: string) => Promise<boolean>;
}) {
  const [email, setEmail] = useState(demoAccounts[0].email);
  const [password, setPassword] = useState(demoAccounts[0].password);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await onSubmit(email, password);
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

function DashboardView({
  contracts,
  currentUser,
  incidents,
  myApplications,
  pointBalance,
  services,
}: RenderSectionProps) {
  const ownServices = services.filter(
    (service) => service.ownerId === currentUser?.id,
  );
  const publishedServices = services.filter(
    (service) => service.status === 'published',
  );
  const activeContracts = contracts.filter(
    (contract) => contract.status === 'active',
  );
  const completedContracts = contracts.filter(
    (contract) => contract.status === 'completed',
  );
  const openIncidents = incidents.filter((incident) =>
    ['reported', 'open', 'in_progress'].includes(incident.status),
  );

  const metrics = [
    {
      label: 'Services visibles',
      value: services.length,
      detail: `${formatNumber(publishedServices.length)} publies`,
    },
    {
      label: 'Mes services',
      value: ownServices.length,
      detail: 'Annonces que je pilote',
    },
    {
      label: 'Mes candidatures',
      value: myApplications.length,
      detail: 'Reponses envoyees',
    },
    {
      label: 'Contrats',
      value: contracts.length,
      detail: `${formatNumber(activeContracts.length)} actifs, ${formatNumber(
        completedContracts.length,
      )} termines`,
    },
    {
      label: 'Points disponibles',
      value: pointBalance?.availablePoints ?? 0,
      detail: `${formatNumber(pointBalance?.reservedPoints ?? 0)} reserves`,
    },
    {
      label: 'Incidents ouverts',
      value: openIncidents.length,
      detail: `${formatNumber(incidents.length)} incidents visibles`,
    },
  ];

  return (
    <div className="dashboard-grid">
      {metrics.map((metric) => (
        <MetricCard key={metric.label} {...metric} />
      ))}
    </div>
  );
}

function ServicesView({
  actionPending,
  currentUser,
  myApplications,
  onAcceptApplication,
  onCancelService,
  onCreateApplication,
  onCreateService,
  onGenerateContract,
  onPublishService,
  onRejectApplication,
  receivedApplications,
  serviceById,
  services,
}: RenderSectionProps) {
  return (
    <div className="two-column-layout">
      <CreateServicePanel
        currentUser={currentUser}
        isPending={actionPending === 'create-service'}
        onCreate={onCreateService}
      />

      <div className="stack">
        {services.length === 0 ? (
          <EmptyState message="Aucun service disponible." />
        ) : (
          services.map((service) => {
            const serviceId = getEntityId(service);
            const myApplication = myApplications.find(
              (application) => application.serviceId === serviceId,
            );

            return (
              <ServiceCard
                actionPending={actionPending}
                currentUser={currentUser}
                key={serviceId}
                myApplication={myApplication}
                onAcceptApplication={onAcceptApplication}
                onApply={onCreateApplication}
                onCancelService={onCancelService}
                onGenerateContract={onGenerateContract}
                onPublishService={onPublishService}
                onRejectApplication={onRejectApplication}
                receivedApplications={receivedApplications[serviceId] ?? []}
                service={service}
                serviceById={serviceById}
              />
            );
          })
        )}
      </div>
    </div>
  );
}

function CreateServicePanel({
  currentUser,
  isPending,
  onCreate,
}: {
  currentUser: AuthUser | null;
  isPending: boolean;
  onCreate: (input: CreateServiceInput) => Promise<boolean>;
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<ServiceType>('request');
  const [category, setCategory] = useState('bricolage');
  const [availability, setAvailability] = useState('Cette semaine');
  const [neighborhoodId, setNeighborhoodId] = useState(
    currentUser?.neighborhoodId ?? 'quartier-centre',
  );
  const [isPaid, setIsPaid] = useState(true);
  const [pricePoints, setPricePoints] = useState(10);
  const [status, setStatus] = useState<ServiceStatus>('draft');

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const success = await onCreate({
      title,
      description,
      type,
      category,
      availability,
      neighborhoodId,
      isPaid,
      pricePoints: isPaid ? pricePoints : undefined,
      status,
    });

    if (success) {
      setTitle('');
      setDescription('');
      setStatus('draft');
    }
  }

  return (
    <section className="panel">
      <h2>Creer un service</h2>
      <form className="form-grid" onSubmit={handleSubmit}>
        <label>
          Titre
          <input
            onChange={(event) => setTitle(event.target.value)}
            required
            value={title}
          />
        </label>

        <label>
          Description
          <textarea
            onChange={(event) => setDescription(event.target.value)}
            required
            rows={4}
            value={description}
          />
        </label>

        <div className="form-row">
          <label>
            Type
            <select
              onChange={(event) => setType(event.target.value as ServiceType)}
              value={type}
            >
              <option value="request">Demande</option>
              <option value="offer">Offre</option>
            </select>
          </label>

          <label>
            Statut initial
            <select
              onChange={(event) =>
                setStatus(event.target.value as ServiceStatus)
              }
              value={status}
            >
              <option value="draft">Brouillon</option>
              <option value="published">Publie</option>
            </select>
          </label>
        </div>

        <label>
          Categorie
          <input
            onChange={(event) => setCategory(event.target.value)}
            required
            value={category}
          />
        </label>

        <label>
          Disponibilite
          <input
            onChange={(event) => setAvailability(event.target.value)}
            required
            value={availability}
          />
        </label>

        <label>
          Quartier
          <input
            onChange={(event) => setNeighborhoodId(event.target.value)}
            required
            value={neighborhoodId}
          />
        </label>

        <label className="checkbox-line">
          <input
            checked={isPaid}
            onChange={(event) => setIsPaid(event.target.checked)}
            type="checkbox"
          />
          Service remunere en points
        </label>

        {isPaid ? (
          <label>
            Prix en points
            <input
              min={1}
              onChange={(event) => setPricePoints(Number(event.target.value))}
              required
              type="number"
              value={pricePoints}
            />
          </label>
        ) : null}

        <button className="primary-button" disabled={isPending} type="submit">
          {isPending ? 'Creation...' : 'Creer le service'}
        </button>
      </form>
    </section>
  );
}

function ServiceCard({
  actionPending,
  currentUser,
  myApplication,
  onAcceptApplication,
  onApply,
  onCancelService,
  onGenerateContract,
  onPublishService,
  onRejectApplication,
  receivedApplications,
  service,
}: {
  actionPending: string | null;
  currentUser: AuthUser | null;
  myApplication?: ServiceApplication;
  onAcceptApplication: (id: string) => Promise<boolean>;
  onApply: (
    serviceId: string,
    input: CreateApplicationInput,
  ) => Promise<boolean>;
  onCancelService: (id: string) => Promise<boolean>;
  onGenerateContract: (id: string) => Promise<boolean>;
  onPublishService: (id: string) => Promise<boolean>;
  onRejectApplication: (id: string) => Promise<boolean>;
  receivedApplications: ServiceApplication[];
  service: ServiceItem;
  serviceById: Map<string, ServiceItem>;
}) {
  const serviceId = getEntityId(service);
  const isOwner = service.ownerId === currentUser?.id;
  const canApply =
    !isOwner &&
    service.status === 'published' &&
    !isActiveApplication(myApplication?.status);
  const canPublish = isOwner && service.status === 'draft';
  const canCancel =
    isOwner && !['completed', 'cancelled'].includes(service.status);

  return (
    <article className="service-card">
      <div className="card-heading">
        <div>
          <h3>{service.title}</h3>
          <p>{service.description}</p>
        </div>
        <StatusBadge value={service.status} />
      </div>

      <dl className="details-grid">
        <div>
          <dt>Categorie</dt>
          <dd>{service.category}</dd>
        </div>
        <div>
          <dt>Type</dt>
          <dd>{service.type === 'request' ? 'Demande' : 'Offre'}</dd>
        </div>
        <div>
          <dt>Prix</dt>
          <dd>{service.isPaid ? `${service.pricePoints ?? 0} points` : 'Gratuit'}</dd>
        </div>
        <div>
          <dt>Proprietaire</dt>
          <dd>
            <MonoValue value={service.ownerId} />
          </dd>
        </div>
        <div>
          <dt>Quartier</dt>
          <dd>{service.neighborhoodId}</dd>
        </div>
        <div>
          <dt>Creation</dt>
          <dd>{formatDate(service.createdAt)}</dd>
        </div>
      </dl>

      <div className="action-row">
        {canPublish ? (
          <button
            className="secondary-button"
            disabled={actionPending === 'publish-service'}
            onClick={() => void onPublishService(serviceId)}
            type="button"
          >
            Publier
          </button>
        ) : null}
        {canCancel ? (
          <button
            className="ghost-button danger"
            disabled={actionPending === 'cancel-service'}
            onClick={() => void onCancelService(serviceId)}
            type="button"
          >
            Annuler
          </button>
        ) : null}
      </div>

      {canApply ? (
        <ApplicationForm
          defaultPrice={service.pricePoints ?? undefined}
          isPending={actionPending === 'create-application'}
          onApply={(input) => onApply(serviceId, input)}
        />
      ) : null}

      {!isOwner && myApplication ? (
        <p className="inline-note">
          Candidature envoyee : <StatusBadge value={myApplication.status} />
        </p>
      ) : null}

      {isOwner ? (
        <ReceivedApplicationsList
          actionPending={actionPending}
          applications={receivedApplications}
          onAccept={onAcceptApplication}
          onGenerateContract={onGenerateContract}
          onReject={onRejectApplication}
          service={service}
        />
      ) : null}
    </article>
  );
}

function ApplicationForm({
  defaultPrice,
  isPending,
  onApply,
}: {
  defaultPrice?: number;
  isPending: boolean;
  onApply: (input: CreateApplicationInput) => Promise<boolean>;
}) {
  const [message, setMessage] = useState('');
  const [proposedPricePoints, setProposedPricePoints] = useState(
    defaultPrice ?? 0,
  );
  const [proposedDate, setProposedDate] = useState('');

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const input: CreateApplicationInput = {
      message,
      proposedDate: proposedDate || undefined,
      proposedPricePoints:
        proposedPricePoints > 0 ? proposedPricePoints : undefined,
    };
    const success = await onApply(input);

    if (success) {
      setMessage('');
      setProposedDate('');
    }
  }

  return (
    <form className="application-form" onSubmit={handleSubmit}>
      <label>
        Message de candidature
        <textarea
          onChange={(event) => setMessage(event.target.value)}
          required
          rows={3}
          value={message}
        />
      </label>
      <div className="form-row">
        <label>
          Date proposee
          <input
            onChange={(event) => setProposedDate(event.target.value)}
            type="datetime-local"
            value={proposedDate}
          />
        </label>
        <label>
          Points proposes
          <input
            min={0}
            onChange={(event) =>
              setProposedPricePoints(Number(event.target.value))
            }
            type="number"
            value={proposedPricePoints}
          />
        </label>
      </div>
      <button className="secondary-button" disabled={isPending} type="submit">
        {isPending ? 'Envoi...' : 'Candidater'}
      </button>
    </form>
  );
}

function ReceivedApplicationsList({
  actionPending,
  applications,
  onAccept,
  onGenerateContract,
  onReject,
  service,
}: {
  actionPending: string | null;
  applications: ServiceApplication[];
  onAccept: (id: string) => Promise<boolean>;
  onGenerateContract: (id: string) => Promise<boolean>;
  onReject: (id: string) => Promise<boolean>;
  service: ServiceItem;
}) {
  if (applications.length === 0) {
    return <p className="inline-note">Aucune candidature recue pour ce service.</p>;
  }

  return (
    <div className="nested-panel">
      <h4>Candidatures recues</h4>
      <div className="stack compact">
        {applications.map((application) => {
          const applicationId = getEntityId(application);
          const canAccept = application.status === 'submitted';
          const canReject = ['submitted', 'viewed'].includes(application.status);
          const canGenerateContract =
            application.status === 'accepted' && !service.contractId;

          return (
            <article className="application-row" key={applicationId}>
              <div>
                <p>
                  <strong>Candidat</strong>{' '}
                  <MonoValue value={application.applicantId} />
                </p>
                <p>{application.message}</p>
                <p className="muted">
                  {application.proposedPricePoints ?? service.pricePoints ?? 0}{' '}
                  points proposes
                </p>
              </div>
              <div className="application-actions">
                <StatusBadge value={application.status} />
                {canAccept ? (
                  <button
                    className="secondary-button"
                    disabled={actionPending === 'accept-application'}
                    onClick={() => void onAccept(applicationId)}
                    type="button"
                  >
                    Accepter
                  </button>
                ) : null}
                {canReject ? (
                  <button
                    className="ghost-button"
                    disabled={actionPending === 'reject-application'}
                    onClick={() => void onReject(applicationId)}
                    type="button"
                  >
                    Rejeter
                  </button>
                ) : null}
                {canGenerateContract ? (
                  <button
                    className="primary-button"
                    disabled={actionPending === 'generate-contract'}
                    onClick={() => void onGenerateContract(applicationId)}
                    type="button"
                  >
                    Generer contrat
                  </button>
                ) : null}
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}

function ApplicationsView({
  actionPending,
  myApplications,
  onWithdrawApplication,
  serviceById,
}: RenderSectionProps) {
  const columns: TableColumn<ServiceApplication>[] = [
    {
      header: 'Service',
      render: (application) =>
        serviceById.get(application.serviceId)?.title ?? application.serviceId,
    },
    { header: 'Statut', render: (application) => <StatusBadge value={application.status} /> },
    { header: 'Message', render: (application) => application.message },
    {
      header: 'Points',
      render: (application) =>
        valueOrDash(application.proposedPricePoints ?? null),
      className: 'numeric-cell',
    },
    {
      header: 'Creation',
      render: (application) => formatDate(application.createdAt),
    },
    {
      header: 'Action',
      render: (application) => {
        const applicationId = getEntityId(application);
        const canWithdraw = ['submitted', 'viewed'].includes(application.status);

        return canWithdraw ? (
          <button
            className="ghost-button"
            disabled={actionPending === 'withdraw-application'}
            onClick={() => void onWithdrawApplication(applicationId)}
            type="button"
          >
            Retirer
          </button>
        ) : (
          <span className="muted">-</span>
        );
      },
    },
  ];

  return (
    <DataTable
      columns={columns}
      emptyMessage="Aucune candidature envoyee."
      rows={myApplications}
    />
  );
}

function ContractsView({
  actionPending,
  contracts,
  currentUser,
  onCancelContract,
  onCompleteContract,
  onSignContract,
  serviceById,
}: RenderSectionProps) {
  const columns: TableColumn<ContractItem>[] = [
    {
      header: 'Service',
      render: (contract) =>
        serviceById.get(contract.serviceId)?.title ?? (
          <MonoValue value={contract.serviceId} />
        ),
    },
    { header: 'Statut', render: (contract) => <StatusBadge value={contract.status} /> },
    {
      header: 'Prix',
      render: (contract) => `${formatNumber(contract.pricePoints)} points`,
      className: 'numeric-cell',
    },
    {
      header: 'Signatures',
      render: (contract) => `${contract.signedByIds.length}/2`,
      className: 'numeric-cell',
    },
    {
      header: 'Parties',
      render: (contract) => (
        <span>
          <MonoValue value={contract.requesterId} /> /{' '}
          <MonoValue value={contract.providerId} />
        </span>
      ),
    },
    {
      header: 'Actions',
      render: (contract) => (
        <ContractActions
          actionPending={actionPending}
          contract={contract}
          currentUserId={currentUser?.id}
          onCancel={onCancelContract}
          onComplete={onCompleteContract}
          onSign={onSignContract}
        />
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      emptyMessage="Aucun contrat pour le moment."
      rows={contracts}
    />
  );
}

function ContractActions({
  actionPending,
  contract,
  currentUserId,
  onCancel,
  onComplete,
  onSign,
}: {
  actionPending: string | null;
  contract: ContractItem;
  currentUserId?: string;
  onCancel: (id: string) => Promise<boolean>;
  onComplete: (id: string) => Promise<boolean>;
  onSign: (id: string) => Promise<boolean>;
}) {
  const contractId = getEntityId(contract);
  const isParty =
    contract.requesterId === currentUserId || contract.providerId === currentUserId;
  const hasSigned = currentUserId
    ? contract.signedByIds.includes(currentUserId)
    : false;
  const canSign = isParty && contract.status === 'sent' && !hasSigned;
  const canComplete = isParty && contract.status === 'active';
  const canCancel =
    isParty && !['completed', 'cancelled'].includes(contract.status);

  return (
    <div className="action-row table-actions">
      {canSign ? (
        <button
          className="secondary-button"
          disabled={actionPending === 'sign-contract'}
          onClick={() => void onSign(contractId)}
          type="button"
        >
          Signer
        </button>
      ) : null}
      {canComplete ? (
        <button
          className="primary-button"
          disabled={actionPending === 'complete-contract'}
          onClick={() => void onComplete(contractId)}
          type="button"
        >
          Completer
        </button>
      ) : null}
      {canCancel ? (
        <button
          className="ghost-button danger"
          disabled={actionPending === 'cancel-contract'}
          onClick={() => void onCancel(contractId)}
          type="button"
        >
          Annuler
        </button>
      ) : null}
      {!canSign && !canComplete && !canCancel ? (
        <span className="muted">-</span>
      ) : null}
    </div>
  );
}

function PointsView({ pointBalance, pointTransactions }: RenderSectionProps) {
  const columns: TableColumn<PointTransaction>[] = [
    { header: 'Type', render: (transaction) => <StatusBadge value={transaction.type} /> },
    {
      header: 'Montant',
      render: (transaction) => `${formatNumber(transaction.amount)} points`,
      className: 'numeric-cell',
    },
    { header: 'Service', render: (transaction) => <MonoValue value={transaction.serviceId} /> },
    { header: 'Contrat', render: (transaction) => <MonoValue value={transaction.contractId} /> },
    {
      header: 'Date',
      render: (transaction) => formatDate(transaction.createdAt),
    },
  ];

  return (
    <div className="stack">
      <div className="dashboard-grid">
        <MetricCard
          detail="Solde utilisable"
          label="Disponible"
          value={pointBalance?.availablePoints ?? 0}
        />
        <MetricCard
          detail="En attente de contrat"
          label="Reserve"
          value={pointBalance?.reservedPoints ?? 0}
        />
        <MetricCard
          detail="Solde brut API"
          label="Balance"
          value={pointBalance?.pointsBalance ?? 0}
        />
      </div>
      <DataTable
        columns={columns}
        emptyMessage="Aucun mouvement de points."
        rows={pointTransactions}
      />
    </div>
  );
}

function IncidentsView({
  actionPending,
  currentUser,
  incidents,
  onCreateIncident,
}: RenderSectionProps) {
  const columns: TableColumn<IncidentItem>[] = [
    { header: 'Titre', render: (incident) => incident.title },
    { header: 'Type', render: (incident) => incident.type },
    { header: 'Severite', render: (incident) => <SeverityBadge value={incident.severity} /> },
    { header: 'Statut', render: (incident) => <StatusBadge value={incident.status} /> },
    { header: 'Source', render: (incident) => incident.source },
    { header: 'Creation', render: (incident) => formatDate(incident.createdAt) },
  ];

  return (
    <div className="two-column-layout">
      <IncidentForm
        currentUser={currentUser}
        isPending={actionPending === 'create-incident'}
        onCreate={onCreateIncident}
      />
      <DataTable
        columns={columns}
        emptyMessage="Aucun incident visible."
        rows={incidents}
      />
    </div>
  );
}

function IncidentForm({
  currentUser,
  isPending,
  onCreate,
}: {
  currentUser: AuthUser | null;
  isPending: boolean;
  onCreate: (input: CreateIncidentInput) => Promise<boolean>;
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<IncidentType>('security');
  const [severity, setSeverity] = useState<IncidentSeverity>('medium');
  const [neighborhoodId, setNeighborhoodId] = useState(
    currentUser?.neighborhoodId ?? 'quartier-centre',
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const success = await onCreate({
      title,
      description,
      type,
      severity,
      neighborhoodId,
    });

    if (success) {
      setTitle('');
      setDescription('');
    }
  }

  return (
    <section className="panel">
      <h2>Signaler un incident</h2>
      <form className="form-grid" onSubmit={handleSubmit}>
        <label>
          Titre
          <input
            onChange={(event) => setTitle(event.target.value)}
            required
            value={title}
          />
        </label>
        <label>
          Description
          <textarea
            onChange={(event) => setDescription(event.target.value)}
            required
            rows={4}
            value={description}
          />
        </label>
        <div className="form-row">
          <label>
            Type
            <select
              onChange={(event) => setType(event.target.value as IncidentType)}
              value={type}
            >
              <option value="security">Securite</option>
              <option value="maintenance">Maintenance</option>
              <option value="nuisance">Nuisance</option>
              <option value="cleanliness">Proprete</option>
              <option value="traffic">Circulation</option>
              <option value="other">Autre</option>
            </select>
          </label>
          <label>
            Severite
            <select
              onChange={(event) =>
                setSeverity(event.target.value as IncidentSeverity)
              }
              value={severity}
            >
              <option value="low">Faible</option>
              <option value="medium">Moyenne</option>
              <option value="high">Haute</option>
              <option value="critical">Critique</option>
            </select>
          </label>
        </div>
        <label>
          Quartier
          <input
            onChange={(event) => setNeighborhoodId(event.target.value)}
            required
            value={neighborhoodId}
          />
        </label>
        <button className="primary-button" disabled={isPending} type="submit">
          {isPending ? 'Signalement...' : 'Signaler'}
        </button>
      </form>
    </section>
  );
}

function RgpdView({
  actionPending,
  onExportRgpd,
  rgpdExport,
}: RenderSectionProps) {
  const sections = rgpdExport ? getRgpdSummarySections(rgpdExport) : [];

  return (
    <div className="stack">
      <section className="panel rgpd-panel">
        <div>
          <h2>Exporter mes données</h2>
          <p>
            Cet écran affiche les données personnelles récupérées depuis l’API
            RGPD. Les identifiants techniques sont normalisés et les mots de
            passe ne sont jamais exportés.
          </p>
        </div>
        <button
          className="primary-button"
          disabled={actionPending === 'rgpd-export'}
          onClick={() => void onExportRgpd()}
          type="button"
        >
          {actionPending === 'rgpd-export' ? 'Export...' : 'Exporter'}
        </button>
      </section>

      {rgpdExport ? (
        <>
          <div className="dashboard-grid">
            {sections.map(([key, value]) => (
              <RgpdSummaryCard
                detail={formatRgpdSectionDetail(key, value)}
                key={key}
                label={rgpdSectionLabels[key] ?? key}
                value={formatRgpdSectionValue(key, value)}
              />
            ))}
          </div>
          <details className="json-panel" open>
            <summary>JSON exporté complet</summary>
            <pre>{JSON.stringify(rgpdExport, null, 2)}</pre>
          </details>
        </>
      ) : (
        <EmptyState message="Aucun export RGPD charge." />
      )}
    </div>
  );
}

function RgpdSummaryCard({
  detail,
  label,
  value,
}: {
  detail: string;
  label: string;
  value: string;
}) {
  return (
    <article className="metric-card rgpd-summary-card">
      <span>{label}</span>
      <strong>{value}</strong>
      <p>{detail}</p>
    </article>
  );
}

function MetricCard({
  detail,
  label,
  value,
}: {
  detail: string;
  label: string;
  value: number;
}) {
  return (
    <article className="metric-card">
      <span>{label}</span>
      <strong>{formatNumber(value)}</strong>
      <p>{detail}</p>
    </article>
  );
}

function DataTable<T extends { _id?: string; id?: string }>({
  columns,
  emptyMessage,
  rows,
}: {
  columns: TableColumn<T>[];
  emptyMessage: string;
  rows: T[];
}) {
  if (rows.length === 0) {
    return <EmptyState message={emptyMessage} />;
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
            <tr key={getEntityId(row) || `row-${index}`}>
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
  );
}

function EmptyState({ message }: { message: string }) {
  return <div className="empty-state">{message}</div>;
}

function StatusBadge({ value }: { value?: string | null }) {
  const status = value ?? 'unknown';
  return <span className={`badge ${getStatusTone(status)}`}>{status}</span>;
}

function SeverityBadge({ value }: { value?: string | null }) {
  const severity = value ?? 'unknown';
  return <span className={`badge severity-${severity}`}>{severity}</span>;
}

function MonoValue({ value }: { value?: string | null }) {
  if (!value) {
    return <span className="muted">-</span>;
  }

  return <span className="mono-value">{value}</span>;
}

function getEntityId(entity: { _id?: string; id?: string | null }) {
  return entity.id ?? entity._id ?? '';
}

function getSectionLabel(section: SectionId) {
  return navigationItems.find((item) => item.id === section)?.label ?? 'Dashboard';
}

function formatNumber(value: number) {
  return numberFormatter.format(value);
}

function formatDate(value?: string | Date | null) {
  if (!value) {
    return '-';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '-';
  }

  return dateFormatter.format(date);
}

function valueOrDash(value?: string | number | null) {
  if (value === undefined || value === null || value === '') {
    return <span className="muted">-</span>;
  }

  return String(value);
}

function isActiveApplication(status?: string | null) {
  return status ? ['submitted', 'viewed', 'accepted'].includes(status) : false;
}

function getRgpdSummarySections(exportData: RgpdExport) {
  const knownSections = rgpdSectionOrder
    .filter((key) => key in exportData)
    .map((key) => [key, exportData[key]] as const);
  const extraSections = Object.entries(exportData).filter(
    ([key]) => !rgpdSectionOrder.includes(key as (typeof rgpdSectionOrder)[number]),
  );

  return [...knownSections, ...extraSections];
}

function formatRgpdSectionValue(key: string, value: unknown) {
  if (key === 'exportedAt') {
    return formatUnknownDate(value);
  }

  if (key === 'user') {
    return value ? 'Profil exporté' : 'Profil absent';
  }

  if (Array.isArray(value)) {
    return formatElementCount(value.length);
  }

  return String(countSectionItems(value));
}

function formatUnknownDate(value: unknown) {
  if (typeof value === 'string' || value instanceof Date) {
    return formatDate(value);
  }

  return '-';
}

function formatRgpdSectionDetail(key: string, value: unknown) {
  if (key === 'exportedAt') {
    return 'Date de génération de l’export';
  }

  if (key === 'user') {
    return 'Données principales du compte';
  }

  if (Array.isArray(value)) {
    return value.length > 0 ? 'Liste exportée' : 'Aucun élément';
  }

  return countSectionItems(value) > 0 ? 'Données présentes' : 'Aucun élément';
}

function formatElementCount(count: number) {
  if (count === 0) {
    return 'Aucun élément';
  }

  return `${formatNumber(count)} élément(s)`;
}

function countSectionItems(value: unknown) {
  if (Array.isArray(value)) {
    return value.length;
  }

  if (value && typeof value === 'object') {
    return Object.keys(value).length;
  }

  return value === undefined || value === null ? 0 : 1;
}

function isUnauthorized(error: unknown) {
  return error instanceof ApiError && [401, 403].includes(error.status);
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return 'Erreur inattendue';
}

function getStatusTone(status: string) {
  if (
    [
      'published',
      'accepted',
      'active',
      'completed',
      'contract_active',
      'success',
      'transfer',
    ].includes(status)
  ) {
    return 'success';
  }

  if (
    [
      'draft',
      'submitted',
      'viewed',
      'sent',
      'reported',
      'open',
      'in_progress',
      'application_received',
      'candidate_selected',
      'awaiting_signatures',
      'reservation',
    ].includes(status)
  ) {
    return 'warning';
  }

  if (
    ['cancelled', 'rejected', 'withdrawn', 'disputed', 'closed', 'release'].includes(
      status,
    )
  ) {
    return 'danger';
  }

  return 'neutral';
}
