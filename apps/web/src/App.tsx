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
import { getNeighborhoods } from './api/neighborhoods';
import type { NeighborhoodItem } from './api/neighborhoods';
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
import { Badge as UiBadge } from './components/ui/Badge';
import { Card } from './components/ui/Card';
import { EmptyState as UiEmptyState } from './components/ui/EmptyState';
import { SectionHeader } from './components/ui/SectionHeader';
import { StatCard } from './components/ui/StatCard';
import { Table as UiTable } from './components/ui/Table';
import { Tabs } from './components/ui/Tabs';
import { Toolbar } from './components/ui/Toolbar';
import { AppShell } from './components/layout/AppShell';
import { PageHeader } from './components/layout/PageHeader';
import { Sidebar } from './components/layout/Sidebar';
import { Topbar } from './components/layout/Topbar';
import { ApplicationsPage } from './pages/ApplicationsPage';
import { ContractsPage } from './pages/ContractsPage';
import { DashboardPage } from './pages/DashboardPage';
import { IncidentsPage } from './pages/IncidentsPage';
import { LoginPage } from './pages/LoginPage';
import { PointsPage } from './pages/PointsPage';
import { RgpdPage } from './pages/RgpdPage';
import { ServicesPage } from './pages/ServicesPage';

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

const brandClass =
  'flex items-center gap-3 [&_strong]:block [&_strong]:text-sm [&_strong]:font-bold [&_strong]:leading-tight [&_strong]:text-slate-950 [&_span]:block [&_span]:text-sm [&_span]:text-slate-500';
const brandMarkClass =
  'inline-flex h-10 w-10 items-center justify-center rounded-lg border border-blue-200 bg-blue-50 text-sm font-extrabold text-blue-700';
const navListClass = 'grid gap-1.5 max-[1100px]:grid-cols-4 max-[760px]:grid-cols-1';
const navItemClass =
  'rounded-lg border border-transparent px-3 py-2 text-left text-slate-600 transition hover:bg-slate-50 hover:text-slate-950 max-[1100px]:text-center';
const activeNavItemClass = `${navItemClass} border-blue-200 bg-blue-50 font-extrabold text-blue-700`;
const sessionCardClass =
  'grid gap-0.5 border-r border-slate-200 pr-4 text-right text-xs leading-tight text-slate-500 max-[760px]:order-3 max-[760px]:w-full max-[760px]:border-r-0 max-[760px]:pr-0 max-[760px]:text-left [&_strong]:text-sm [&_strong]:font-bold [&_strong]:text-slate-950';
const buttonClasses = {
  primary:
    'inline-flex min-h-10 items-center justify-center rounded-lg border border-blue-600 bg-blue-600 px-4 py-2 text-sm font-extrabold text-white transition hover:-translate-y-0.5 disabled:cursor-progress disabled:opacity-65 disabled:hover:translate-y-0',
  secondary:
    'inline-flex min-h-10 items-center justify-center rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-extrabold text-blue-700 transition hover:-translate-y-0.5 hover:bg-blue-100 disabled:cursor-progress disabled:opacity-65 disabled:hover:translate-y-0',
  ghost:
    'inline-flex min-h-10 items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-extrabold text-slate-950 transition hover:-translate-y-0.5 hover:bg-slate-50 disabled:cursor-progress disabled:opacity-65 disabled:hover:translate-y-0',
  danger:
    'inline-flex min-h-10 items-center justify-center rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-extrabold text-red-700 transition hover:-translate-y-0.5 hover:bg-red-50 disabled:cursor-progress disabled:opacity-65 disabled:hover:translate-y-0',
};
const formGridClass =
  'grid gap-3.5 [&_input]:min-h-10 [&_input]:w-full [&_input]:rounded-lg [&_input]:border [&_input]:border-slate-200 [&_input]:bg-white [&_input]:px-3 [&_input]:py-2 [&_input]:text-slate-950 [&_label]:grid [&_label]:gap-2 [&_label]:text-sm [&_label]:font-extrabold [&_label]:text-slate-950 [&_select]:min-h-10 [&_select]:w-full [&_select]:rounded-lg [&_select]:border [&_select]:border-slate-200 [&_select]:bg-white [&_select]:px-3 [&_select]:py-2 [&_select]:text-slate-950 [&_textarea]:w-full [&_textarea]:rounded-lg [&_textarea]:border [&_textarea]:border-slate-200 [&_textarea]:bg-white [&_textarea]:px-3 [&_textarea]:py-2 [&_textarea]:text-slate-950';
const formRowClass = 'grid grid-cols-2 gap-3 max-[760px]:grid-cols-1';
const stackClass = 'grid gap-3.5';
const compactStackClass = 'grid gap-2.5';
const dashboardGridClass = 'grid grid-cols-3 gap-3.5 max-[760px]:grid-cols-1';
const actionRowClass = 'flex flex-wrap gap-2';
const mutedClass = 'text-slate-500';
const monoClass = 'inline-block max-w-56 break-words font-mono text-xs text-slate-600';

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
  const [neighborhoods, setNeighborhoods] = useState<NeighborhoodItem[]>([]);
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
    setNeighborhoods([]);
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
        nextNeighborhoods,
        nextMyApplications,
        nextContracts,
        nextBalance,
        nextTransactions,
        nextIncidents,
      ] = await Promise.all([
        getServices(),
        getNeighborhoods(),
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
      setNeighborhoods(nextNeighborhoods);
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
      setNotice('Export RGPD chargé.');
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
      <LoginPage>
        <LoginScreen
          error={error}
          isPending={actionPending === 'login'}
          onSubmit={handleLogin}
        />
      </LoginPage>
    );
  }

  return (
    <AppShell
      sidebar={
        <Sidebar>
        <div className={brandClass}>
          <span className={brandMarkClass}>CN</span>
          <div>
            <strong>Connected Neighbours</strong>
            <span>Espace habitant P0</span>
          </div>
        </div>

        <nav className={navListClass} aria-label="Navigation utilisateur">
          {navigationItems.map((item) => (
            <button
              className={item.id === activeSection ? activeNavItemClass : navItemClass}
              key={item.id}
              onClick={() => setActiveSection(item.id)}
              type="button"
            >
              {item.label}
            </button>
          ))}
        </nav>
        </Sidebar>
      }
    >

        <Topbar
          actions={
            <>
            <div className={sessionCardClass}>
              <span>{currentUser?.displayName ?? 'Session habitant'}</span>
              <strong>{currentUser?.email ?? 'Profil en cours'}</strong>
            </div>
            <button
              className={buttonClasses.secondary}
              disabled={isLoading}
              onClick={() => void loadWorkflow()}
              type="button"
            >
              Actualiser
            </button>
            <button
              className={buttonClasses.ghost}
              onClick={() => clearSession()}
              type="button"
            >
              Deconnexion
            </button>
            </>
          }
        >
          <PageHeader eyebrow="Parcours P0" title={getSectionLabel(activeSection)} />
        </Topbar>

        {isLoading ? (
          <div className="mb-3.5 rounded-lg border border-slate-200 bg-white px-4 py-3 text-slate-600 shadow-sm">
            Chargement des données...
          </div>
        ) : null}
        {notice ? (
          <div className="mb-3.5 rounded-lg border border-emerald-200 bg-emerald-100 px-4 py-3 font-extrabold text-emerald-700">
            {notice}
          </div>
        ) : null}
        {error ? (
          <div className="mb-3.5 rounded-lg border border-red-200 bg-red-100 px-4 py-3 font-extrabold text-red-700">
            {error}
          </div>
        ) : null}

        <section className="min-w-0">
          {renderSection({
            activeSection,
            actionPending,
            contracts,
            currentUser,
            incidents,
            myApplications,
            neighborhoods,
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
            onNavigate: setActiveSection,
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
    </AppShell>
  );
}

type RenderSectionProps = {
  activeSection: SectionId;
  actionPending: string | null;
  contracts: ContractItem[];
  currentUser: AuthUser | null;
  incidents: IncidentItem[];
  myApplications: ServiceApplication[];
  neighborhoods: NeighborhoodItem[];
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
  onNavigate: (section: SectionId) => void;
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
      return <DashboardPage><DashboardView {...props} /></DashboardPage>;
    case 'services':
      return <ServicesPage><ServicesView {...props} /></ServicesPage>;
    case 'applications':
      return <ApplicationsPage><ApplicationsView {...props} /></ApplicationsPage>;
    case 'contracts':
      return <ContractsPage><ContractsView {...props} /></ContractsPage>;
    case 'points':
      return <PointsPage><PointsView {...props} /></PointsPage>;
    case 'incidents':
      return <IncidentsPage><IncidentsView {...props} /></IncidentsPage>;
    case 'rgpd':
      return <RgpdPage><RgpdView {...props} /></RgpdPage>;
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
    <main className="flex min-h-screen items-center justify-center bg-slate-100 p-6 text-slate-600">
      <section
        className="grid w-full max-w-xl gap-5 rounded-lg border border-slate-200 bg-white p-7 shadow-xl"
        aria-labelledby="login-title"
      >
        <div className={brandClass}>
          <span className={brandMarkClass}>CN</span>
          <div>
            <strong>Connected Neighbours</strong>
            <span>Espace habitant</span>
          </div>
        </div>

        <div>
          <p className="mb-1.5 text-xs font-extrabold uppercase text-blue-600">Démo P0</p>
          <h1 className="m-0 text-3xl font-extrabold leading-tight text-slate-950" id="login-title">
            Connexion
          </h1>
          <p className="mt-2 text-slate-500">
            Connectez-vous avec Alice ou Bob pour jouer le parcours complet.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2 max-[760px]:grid-cols-1">
          {demoAccounts.map((account) => (
            <button
              className="grid min-w-0 gap-1 rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-left text-sm text-slate-600 focus-visible:outline focus-visible:outline-4 focus-visible:outline-blue-200 [&_strong]:text-slate-950 [&_span]:break-words [&_span]:text-xs"
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

        <form className={formGridClass} onSubmit={handleSubmit}>
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

          {error ? (
            <div className="rounded-lg border border-red-200 bg-red-100 px-4 py-3 font-extrabold text-red-700">
              {error}
            </div>
          ) : null}

          <button className={buttonClasses.primary} disabled={isPending} type="submit">
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
  onNavigate,
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
      detail: `${formatNumber(publishedServices.length)} publiés`,
      accent: 'blue' as const,
    },
    {
      label: 'Mes services',
      value: ownServices.length,
      detail: 'Annonces que je pilote',
      accent: 'slate' as const,
    },
    {
      label: 'Mes candidatures',
      value: myApplications.length,
      detail: 'Réponses envoyées',
      accent: 'amber' as const,
    },
    {
      label: 'Contrats',
      value: contracts.length,
      detail: `${formatNumber(activeContracts.length)} actifs, ${formatNumber(
        completedContracts.length,
      )} terminés`,
      accent: 'emerald' as const,
    },
    {
      label: 'Points disponibles',
      value: pointBalance?.availablePoints ?? 0,
      detail: `${formatNumber(pointBalance?.reservedPoints ?? 0)} réservés`,
      accent: 'blue' as const,
    },
    {
      label: 'Incidents ouverts',
      value: openIncidents.length,
      detail: `${formatNumber(incidents.length)} incidents visibles`,
      accent: 'red' as const,
    },
  ];

  return (
    <div className={stackClass}>
      <SectionHeader
        title="Vue d’ensemble"
        description={`Bonjour ${currentUser?.displayName ?? 'voisin'}, retrouvez les actions importantes du parcours Connected Neighbours.`}
      />

      <div className={dashboardGridClass}>
        {metrics.map((metric) => (
          <MetricCard key={metric.label} {...metric} />
        ))}
      </div>

      <Card className="grid gap-3">
        <SectionHeader
          title="Actions rapides"
          description="Accédez directement aux étapes à montrer pendant la démonstration."
        />
        <div className="grid grid-cols-4 gap-3 max-[980px]:grid-cols-2 max-[620px]:grid-cols-1">
          <button className={buttonClasses.primary} onClick={() => onNavigate('services')} type="button">
            Créer un service
          </button>
          <button className={buttonClasses.secondary} onClick={() => onNavigate('contracts')} type="button">
            Voir mes contrats
          </button>
          <button className={buttonClasses.secondary} onClick={() => onNavigate('incidents')} type="button">
            Signaler un incident
          </button>
          <button className={buttonClasses.ghost} onClick={() => onNavigate('rgpd')} type="button">
            Exporter mes données
          </button>
        </div>
      </Card>

      <div className="grid grid-cols-3 gap-4 max-xl:grid-cols-1">
        <Card className="grid gap-3">
          <SectionHeader title="Services récents" description="Les dernières annonces visibles." />
          {services.length > 0 ? (
            <div className="grid gap-2">
              {services.slice(0, 4).map((service) => (
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3" key={getEntityId(service)}>
                  <div className="flex items-start justify-between gap-3">
                    <strong className="text-slate-950">{service.title}</strong>
                    <StatusBadge value={service.status} />
                  </div>
                  <p className="mt-1 text-sm text-slate-500">
                    {service.category} · {service.isPaid ? `${service.pricePoints ?? 0} points` : 'Gratuit'}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState message="Aucun service visible." />
          )}
        </Card>

        <Card className="grid gap-3">
          <SectionHeader title="Contrats récents" description="Contrats à signer ou suivre." />
          {contracts.length > 0 ? (
            <div className="grid gap-2">
              {contracts.slice(0, 4).map((contract) => (
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3" key={getEntityId(contract)}>
                  <div className="flex items-start justify-between gap-3">
                    <strong className="text-slate-950">
                      {serviceByTitle(services, contract.serviceId)}
                    </strong>
                    <StatusBadge value={contract.status} />
                  </div>
                  <p className="mt-1 text-sm text-slate-500">
                    {formatNumber(contract.pricePoints)} points · {contract.signedByIds.length}/2 signature(s)
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState message="Aucun contrat pour le moment." />
          )}
        </Card>

        <Card className="grid gap-3">
          <SectionHeader title="Incidents récents" description="Signalements du quartier." />
          {incidents.length > 0 ? (
            <div className="grid gap-2">
              {incidents.slice(0, 4).map((incident) => (
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3" key={getEntityId(incident)}>
                  <div className="flex items-start justify-between gap-3">
                    <strong className="text-slate-950">{incident.title}</strong>
                    <SeverityBadge value={incident.severity} />
                  </div>
                  <p className="mt-1 text-sm text-slate-500">
                    {incident.type} · <StatusBadge value={incident.status} />
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState message="Aucun incident visible." />
          )}
        </Card>
      </div>
    </div>
  );
}

function ServicesView({
  actionPending,
  currentUser,
  myApplications,
  neighborhoods,
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
  const [activeServicesTab, setActiveServicesTab] = useState<'list' | 'new'>('list');
  const [selectedNeighborhood, setSelectedNeighborhood] = useState('all');
  const neighborhoodOptions = neighborhoods.filter(
    (neighborhood) => (neighborhood.status ?? 'active') === 'active',
  );
  const visibleServices =
    selectedNeighborhood === 'all'
      ? services
      : services.filter((service) =>
          matchesNeighborhoodReference(
            neighborhoods,
            service.neighborhoodId,
            selectedNeighborhood,
          ),
        );

  return (
    <div className={stackClass}>
      <SectionHeader
        title="Parcours services"
        description="Créez une demande, publiez-la, recevez des candidatures et déclenchez le contrat depuis une candidature acceptée."
        actions={
          <button className={buttonClasses.primary} onClick={() => setActiveServicesTab('new')} type="button">
            Nouveau service
          </button>
        }
      />

      <Tabs
        items={[
          { id: 'list', label: 'Services disponibles', count: visibleServices.length },
          { id: 'new', label: 'Nouveau service' },
        ]}
        onChange={setActiveServicesTab}
        value={activeServicesTab}
      />

      {activeServicesTab === 'new' ? (
        <CreateServicePanel
          currentUser={currentUser}
          isPending={actionPending === 'create-service'}
          neighborhoods={neighborhoodOptions}
          onCreate={async (input) => {
            const success = await onCreateService(input);

            if (success) {
              setActiveServicesTab('list');
            }

            return success;
          }}
        />
      ) : (
        <div className={stackClass}>
          <Toolbar>
            <label className="grid min-w-[240px] flex-1 gap-1.5 text-sm font-bold text-slate-700">
              Filtrer par quartier
              <select
                className="min-h-10 rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-950 outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
                onChange={(event) => setSelectedNeighborhood(event.target.value)}
                value={selectedNeighborhood}
              >
                <option value="all">Tous les quartiers</option>
                {neighborhoodOptions.map((neighborhood) => (
                  <option key={getNeighborhoodKey(neighborhood)} value={neighborhood.slug}>
                    {getNeighborhoodLabel(neighborhood)}
                  </option>
                ))}
              </select>
            </label>
            <span className="text-sm font-bold text-slate-500">
              {formatNumber(visibleServices.length)} service(s)
            </span>
          </Toolbar>

          {visibleServices.length === 0 ? (
            <EmptyState message="Aucun service disponible pour ce filtre." />
          ) : (
            <div className="grid grid-cols-2 gap-4 max-xl:grid-cols-1">
              {visibleServices.map((service) => {
                const serviceId = getEntityId(service);
                const myApplication = myApplications.find(
                  (application) => application.serviceId === serviceId,
                );
                const neighborhoodLabel = getNeighborhoodLabelById(
                  neighborhoods,
                  service.neighborhoodId,
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
                    neighborhoodLabel={neighborhoodLabel}
                  />
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function CreateServicePanel({
  currentUser,
  isPending,
  neighborhoods,
  onCreate,
}: {
  currentUser: AuthUser | null;
  isPending: boolean;
  neighborhoods: NeighborhoodItem[];
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
    <Card className="grid gap-4">
      <SectionHeader
        title="Créer un service"
        description="Décrivez la demande ou l’offre, choisissez le quartier, puis publiez quand elle est prête."
      />
      <form className={formGridClass} onSubmit={handleSubmit}>
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

        <div className={formRowClass}>
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
              <option value="published">Publié</option>
            </select>
          </label>
        </div>

        <label>
          Catégorie
          <input
            onChange={(event) => setCategory(event.target.value)}
            required
            value={category}
          />
        </label>

        <label>
          Disponibilité
          <input
            onChange={(event) => setAvailability(event.target.value)}
            required
            value={availability}
          />
        </label>

        <label>
          Quartier
          {neighborhoods.length > 0 ? (
            <select
              onChange={(event) => setNeighborhoodId(event.target.value)}
              required
              value={neighborhoodId}
            >
              {neighborhoods.map((neighborhood) => (
                <option key={getNeighborhoodKey(neighborhood)} value={neighborhood.slug}>
                  {getNeighborhoodLabel(neighborhood)}
                </option>
              ))}
            </select>
          ) : (
            <>
              <input
                onChange={(event) => setNeighborhoodId(event.target.value)}
                required
                value={neighborhoodId}
              />
              <span className="text-sm font-medium text-amber-700">
                Aucun quartier actif n’est disponible. Renseignez l’identifiant fourni pour la démo.
              </span>
            </>
          )}
        </label>

        <label className="flex items-center gap-2 text-sm font-extrabold text-slate-950">
          <input
            checked={isPaid}
            onChange={(event) => setIsPaid(event.target.checked)}
            type="checkbox"
          />
          Service rémunéré en points
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

        <button className={buttonClasses.primary} disabled={isPending} type="submit">
          {isPending ? 'Création...' : 'Créer le service'}
        </button>
      </form>
    </Card>
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
  neighborhoodLabel,
}: {
  actionPending: string | null;
  currentUser: AuthUser | null;
  myApplication?: ServiceApplication;
  neighborhoodLabel: string;
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
    <article className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3>{service.title}</h3>
          <p>{service.description}</p>
        </div>
        <StatusBadge value={service.status} />
      </div>

      <dl className="my-4 grid grid-cols-3 gap-2.5 max-[760px]:grid-cols-1 [&_dd]:m-0 [&_dd]:break-words [&_dd]:text-slate-950 [&_div]:rounded-lg [&_div]:bg-slate-50 [&_div]:p-2.5 [&_dt]:mb-1 [&_dt]:text-xs [&_dt]:font-extrabold [&_dt]:uppercase [&_dt]:text-slate-500">
        <div>
          <dt>Catégorie</dt>
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
          <dt>Propriétaire</dt>
          <dd>{isOwner ? 'Moi' : <UserReference value={service.ownerId} />}</dd>
        </div>
        <div>
          <dt>Quartier</dt>
          <dd>{neighborhoodLabel}</dd>
        </div>
        <div>
          <dt>Création</dt>
          <dd>{formatDate(service.createdAt)}</dd>
        </div>
      </dl>

      <div className={actionRowClass}>
        {canPublish ? (
          <button
            className={buttonClasses.secondary}
            disabled={actionPending === 'publish-service'}
            onClick={() => void onPublishService(serviceId)}
            type="button"
          >
            Publier
          </button>
        ) : null}
        {canCancel ? (
          <button
            className={buttonClasses.danger}
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
        <p className="mt-3 flex items-center gap-2 text-slate-500">
          Candidature envoyée : <StatusBadge value={myApplication.status} />
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
    <form
      className={`${formGridClass} mt-4 border-t border-slate-200 pt-4`}
      onSubmit={handleSubmit}
    >
      <label>
        Message de candidature
        <textarea
          onChange={(event) => setMessage(event.target.value)}
          required
          rows={3}
          value={message}
        />
      </label>
      <div className={formRowClass}>
        <label>
          Date proposée
          <input
            onChange={(event) => setProposedDate(event.target.value)}
            type="datetime-local"
            value={proposedDate}
          />
        </label>
        <label>
          Points proposés
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
      <button className={buttonClasses.secondary} disabled={isPending} type="submit">
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
    return <p className="mt-3 flex items-center gap-2 text-slate-500">Aucune candidature reçue pour ce service.</p>;
  }

  return (
    <div className="mt-4 border-t border-slate-200 pt-4">
      <h4>Candidatures reçues</h4>
      <div className={compactStackClass}>
        {applications.map((application) => {
          const applicationId = getEntityId(application);
          const canAccept = application.status === 'submitted';
          const canReject = ['submitted', 'viewed'].includes(application.status);
          const canGenerateContract =
            application.status === 'accepted' && !service.contractId;

          return (
            <article
              className="flex items-start justify-between gap-3 rounded-lg bg-slate-50 p-3 max-[760px]:flex-col"
              key={applicationId}
            >
              <div>
                <p>
                  <strong>Candidat</strong>{' '}
                  <UserReference value={application.applicantId} />
                </p>
                <p>{application.message}</p>
                <p className={mutedClass}>
                  {application.proposedPricePoints ?? service.pricePoints ?? 0}{' '}
                  points proposés
                </p>
              </div>
              <div className="flex flex-wrap items-end justify-end gap-2 max-[760px]:justify-start">
                <StatusBadge value={application.status} />
                {canAccept ? (
                  <button
                    className={buttonClasses.secondary}
                    disabled={actionPending === 'accept-application'}
                    onClick={() => void onAccept(applicationId)}
                    type="button"
                  >
                    Accepter
                  </button>
                ) : null}
                {canReject ? (
                  <button
                    className={buttonClasses.ghost}
                    disabled={actionPending === 'reject-application'}
                    onClick={() => void onReject(applicationId)}
                    type="button"
                  >
                    Rejeter
                  </button>
                ) : null}
                {canGenerateContract ? (
                  <button
                    className={buttonClasses.primary}
                    disabled={actionPending === 'generate-contract'}
                    onClick={() => void onGenerateContract(applicationId)}
                    type="button"
                  >
                    Générer contrat
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
      className: 'text-right',
    },
    {
      header: 'Création',
      render: (application) => formatDate(application.createdAt),
    },
    {
      header: 'Action',
      render: (application) => {
        const applicationId = getEntityId(application);
        const canWithdraw = ['submitted', 'viewed'].includes(application.status);

        return canWithdraw ? (
          <button
            className={buttonClasses.ghost}
            disabled={actionPending === 'withdraw-application'}
            onClick={() => void onWithdrawApplication(applicationId)}
            type="button"
          >
            Retirer
          </button>
        ) : (
          <span className={mutedClass}>-</span>
        );
      },
    },
  ];

  return (
    <div className={stackClass}>
      <SectionHeader
        title="Suivi des candidatures"
        description="Retrouvez les candidatures envoyées sur les services des autres habitants et retirez celles encore en attente."
      />
      <DataTable
        columns={columns}
        emptyMessage="Aucune candidature envoyée."
        rows={myApplications}
      />
    </div>
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
      className: 'text-right',
    },
    {
      header: 'Signatures',
      render: (contract) => `${contract.signedByIds.length}/2`,
      className: 'text-right',
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
    <div className={stackClass}>
      <SectionHeader
        title="Suivi des contrats"
        description="Signez, terminez ou annulez les contrats liés aux services acceptés."
      />
      <DataTable
        columns={columns}
        emptyMessage="Aucun contrat pour le moment."
        rows={contracts}
      />
    </div>
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
    <div className="flex min-w-56 flex-wrap gap-2">
      {canSign ? (
        <button
          className={buttonClasses.secondary}
          disabled={actionPending === 'sign-contract'}
          onClick={() => void onSign(contractId)}
          type="button"
        >
          Signer
        </button>
      ) : null}
      {canComplete ? (
        <button
          className={buttonClasses.primary}
          disabled={actionPending === 'complete-contract'}
          onClick={() => void onComplete(contractId)}
          type="button"
        >
          Compléter
        </button>
      ) : null}
      {canCancel ? (
        <button
          className={buttonClasses.danger}
          disabled={actionPending === 'cancel-contract'}
          onClick={() => void onCancel(contractId)}
          type="button"
        >
          Annuler
        </button>
      ) : null}
      {!canSign && !canComplete && !canCancel ? (
        <span className={mutedClass}>-</span>
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
      className: 'text-right',
    },
    { header: 'Service', render: (transaction) => <MonoValue value={transaction.serviceId} /> },
    { header: 'Contrat', render: (transaction) => <MonoValue value={transaction.contractId} /> },
    {
      header: 'Date',
      render: (transaction) => formatDate(transaction.createdAt),
    },
  ];

  return (
    <div className={stackClass}>
      <SectionHeader
        title="Solde et mouvements"
        description="Suivez votre solde disponible, les points réservés et l’historique des mouvements."
      />
      <div className={dashboardGridClass}>
        <MetricCard
          detail="Solde utilisable"
          label="Disponible"
          value={pointBalance?.availablePoints ?? 0}
        />
        <MetricCard
          detail="En attente de contrat"
          label="Réservé"
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
    { header: 'Sévérité', render: (incident) => <SeverityBadge value={incident.severity} /> },
    { header: 'Statut', render: (incident) => <StatusBadge value={incident.status} /> },
    { header: 'Source', render: (incident) => incident.source },
    { header: 'Création', render: (incident) => formatDate(incident.createdAt) },
  ];

  return (
    <div className={stackClass}>
      <SectionHeader
        title="Signalement et suivi"
        description="Signalez un problème de quartier et consultez les incidents déjà visibles."
      />
      <div className="grid grid-cols-[minmax(300px,390px)_minmax(0,1fr)] items-start gap-4 max-[1100px]:grid-cols-1">
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
    <Card className="grid gap-4">
      <SectionHeader
        title="Signaler un incident"
        description="Décrivez le problème, choisissez sa catégorie et son niveau de sévérité."
      />
      <form className={formGridClass} onSubmit={handleSubmit}>
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
        <div className={formRowClass}>
          <label>
            Type
            <select
              onChange={(event) => setType(event.target.value as IncidentType)}
              value={type}
            >
              <option value="security">Sécurité</option>
              <option value="maintenance">Maintenance</option>
              <option value="nuisance">Nuisance</option>
              <option value="cleanliness">Propreté</option>
              <option value="traffic">Circulation</option>
              <option value="other">Autre</option>
            </select>
          </label>
          <label>
            Sévérité
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
        <button className={buttonClasses.primary} disabled={isPending} type="submit">
          {isPending ? 'Signalement...' : 'Signaler'}
        </button>
      </form>
    </Card>
  );
}

function RgpdView({
  actionPending,
  onExportRgpd,
  rgpdExport,
}: RenderSectionProps) {
  const sections = rgpdExport ? getRgpdSummarySections(rgpdExport) : [];

  return (
    <div className={stackClass}>
      <Card>
        <SectionHeader
          title="Transparence des données"
          description="Cet écran affiche les données personnelles récupérées depuis l’API RGPD. Les identifiants techniques sont normalisés et les mots de passe ne sont jamais exportés."
          actions={
            <button
              className={buttonClasses.primary}
              disabled={actionPending === 'rgpd-export'}
              onClick={() => void onExportRgpd()}
              type="button"
            >
              {actionPending === 'rgpd-export' ? 'Export...' : 'Exporter mes données'}
            </button>
          }
        />
      </Card>

      {rgpdExport ? (
        <>
          <div className={dashboardGridClass}>
            {sections.map(([key, value]) => (
              <RgpdSummaryCard
                detail={formatRgpdSectionDetail(key, value)}
                key={key}
                label={rgpdSectionLabels[key] ?? key}
                value={formatRgpdSectionValue(key, value)}
              />
            ))}
          </div>
          <details className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm [&_pre]:mt-3.5 [&_pre]:max-h-[520px] [&_pre]:overflow-auto [&_pre]:rounded-lg [&_pre]:bg-slate-950 [&_pre]:p-3.5 [&_pre]:font-mono [&_pre]:text-xs [&_pre]:leading-relaxed [&_pre]:text-slate-200 [&_summary]:cursor-pointer [&_summary]:font-extrabold [&_summary]:text-slate-950" open>
            <summary>JSON exporté complet</summary>
            <pre>{JSON.stringify(rgpdExport, null, 2)}</pre>
          </details>
        </>
      ) : (
        <EmptyState message="Aucun export RGPD chargé." />
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
    <StatCard accent="slate" helper={detail} label={label} value={value} />
  );
}

function MetricCard({
  accent = 'blue',
  detail,
  label,
  value,
}: {
  accent?: 'blue' | 'emerald' | 'amber' | 'red' | 'slate';
  detail: string;
  label: string;
  value: number;
}) {
  return (
    <StatCard accent={accent} helper={detail} label={label} value={formatNumber(value)} />
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
    <UiTable
      columns={columns}
      getRowKey={(row, index) => getEntityId(row) || `row-${index}`}
      rows={rows}
    />
  );
}

function EmptyState({ message }: { message: string }) {
  return <UiEmptyState message={message} />;
}

function StatusBadge({ value }: { value?: string | null }) {
  const status = value ?? 'unknown';
  return <UiBadge tone={getStatusTone(status)}>{status}</UiBadge>;
}

function SeverityBadge({ value }: { value?: string | null }) {
  const severity = value ?? 'unknown';
  return <UiBadge tone={getSeverityTone(severity)}>{severity}</UiBadge>;
}

function MonoValue({ value }: { value?: string | null }) {
  if (!value) {
    return <span className={mutedClass}>-</span>;
  }

  return <span className={monoClass} title={value}>{formatShortId(value)}</span>;
}

function UserReference({ value }: { value?: string | null }) {
  if (!value) {
    return <span className={mutedClass}>Utilisateur inconnu</span>;
  }

  return (
    <span className="text-sm font-semibold text-slate-700" title={value}>
      Utilisateur {formatShortId(value)}
    </span>
  );
}

function getEntityId(entity: { _id?: string; id?: string | null }) {
  return entity.id ?? entity._id ?? '';
}

function formatShortId(value: string) {
  if (value.length <= 12) {
    return value;
  }

  return `${value.slice(0, 6)}…${value.slice(-4)}`;
}

function serviceByTitle(services: ServiceItem[], serviceId: string) {
  return services.find((service) => getEntityId(service) === serviceId)?.title ?? `Service ${formatShortId(serviceId)}`;
}

function getNeighborhoodKey(neighborhood: NeighborhoodItem) {
  return neighborhood.id ?? neighborhood._id ?? neighborhood.slug;
}

function getNeighborhoodLabel(neighborhood: NeighborhoodItem) {
  const location = [neighborhood.city, neighborhood.postalCode]
    .filter(Boolean)
    .join(' ');

  return location ? `${neighborhood.name} - ${location}` : neighborhood.name;
}

function getNeighborhoodLabelById(
  neighborhoods: NeighborhoodItem[],
  neighborhoodId: string,
) {
  const neighborhood = neighborhoods.find(
    (item) =>
      item.slug === neighborhoodId ||
      item.id === neighborhoodId ||
      item._id === neighborhoodId,
  );

  return neighborhood ? getNeighborhoodLabel(neighborhood) : `Quartier ${formatShortId(neighborhoodId)}`;
}

function matchesNeighborhoodReference(
  neighborhoods: NeighborhoodItem[],
  serviceNeighborhoodId: string,
  selectedNeighborhoodId: string,
) {
  if (serviceNeighborhoodId === selectedNeighborhoodId) {
    return true;
  }

  const neighborhood = neighborhoods.find(
    (item) =>
      item.slug === selectedNeighborhoodId ||
      item.id === selectedNeighborhoodId ||
      item._id === selectedNeighborhoodId,
  );

  if (!neighborhood) {
    return false;
  }

  return [
    neighborhood.slug,
    neighborhood.id,
    neighborhood._id,
  ].includes(serviceNeighborhoodId);
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
    return <span className={mutedClass}>-</span>;
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

function getSeverityTone(severity: string): 'success' | 'warning' | 'danger' | 'neutral' {
  if (['high', 'critical'].includes(severity)) {
    return 'danger';
  }

  return 'neutral';
}

function getStatusTone(status: string): 'success' | 'warning' | 'danger' | 'neutral' {
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
