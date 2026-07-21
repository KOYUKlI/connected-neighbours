import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import { getMyApplications, type ServiceApplication } from '../api/applications';
import { getContracts, type ContractItem } from '../api/contracts';
import { getIncidents, type IncidentItem } from '../api/incidents';
import { getNeighborhoods, type NeighborhoodItem } from '../api/neighborhoods';
import { getPointBalance, type PointBalance } from '../api/points';
import { getServices, type ServiceItem } from '../api/services';
import { useAuth } from '../auth/useAuth';
import { PageContainer } from '../components/layout/PageContainer';
import { ServiceCard } from '../components/services/ServiceCard';
import { Badge } from '../components/ui/Badge';
import { buttonStyles } from '../components/ui/buttonStyles';
import { Card } from '../components/ui/Card';
import { EmptyState } from '../components/ui/EmptyState';
import { ErrorMessage } from '../components/ui/ErrorMessage';
import { Icon, type IconName } from '../components/ui/Icon';
import { LoadingState } from '../components/ui/LoadingState';
import { PointsSummary } from '../components/ui/PointsSummary';
import { getFriendlyError } from '../utils/errors';
import { formatNeighborhood, getEntityId } from '../utils/format';

type HomeData = {
  applications: ServiceApplication[];
  balance: PointBalance;
  contracts: ContractItem[];
  incidents: IncidentItem[];
  neighborhoods: NeighborhoodItem[];
  services: ServiceItem[];
};

export function HomePage() {
  const { user } = useAuth();
  const [data, setData] = useState<HomeData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [services, neighborhoods, balance, applications, contracts, incidents] = await Promise.all([
        getServices(), getNeighborhoods(), getPointBalance(), getMyApplications(), getContracts(), getIncidents(),
      ]);
      setData({ applications, balance, contracts, incidents, neighborhoods, services });
    } catch (caught) {
      setError(getFriendlyError(caught, 'Impossible de charger votre accueil. Réessayez dans quelques instants.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const tasks = useMemo(() => {
    if (!data || !user) return [];
    const items: Array<{ icon: IconName; label: string; detail: string; to: string }> = [];
    const unsignedContract = data.contracts.find((contract) => contract.status === 'sent' && !contract.signedByIds.includes(user.id));
    if (unsignedContract) items.push({ icon: 'contract', label: 'Un contrat attend votre signature', detail: 'Relisez les conditions avant de signer.', to: `/services/${unsignedContract.serviceId}` });
    const ownedWithApplications = data.services.find((service) => service.ownerId === user.id && service.status === 'application_received');
    if (ownedWithApplications) items.push({ icon: 'users', label: 'Des candidatures sont à comparer', detail: ownedWithApplications.title, to: `/services/${getEntityId(ownedWithApplications)}` });
    const activeContract = data.contracts.find((contract) => contract.status === 'active' && contract.requesterId === user.id);
    if (activeContract) items.push({ icon: 'check', label: 'Suivez votre service en cours', detail: 'La validation finale transférera les points.', to: `/services/${activeContract.serviceId}` });
    return items;
  }, [data, user]);

  if (loading) return <PageContainer><LoadingState message="Préparation de votre quartier…" /></PageContainer>;
  if (error || !data || !user) return <PageContainer><ErrorMessage message={error ?? 'Impossible de préparer votre accueil.'} /></PageContainer>;

  const nearbyServices = data.services.filter((service) => service.status === 'published' && service.ownerId !== user.id).slice(0, 3);
  const recentIncident = data.incidents.find((incident) => incident.neighborhoodId === user.neighborhoodId) ?? data.incidents[0];

  return (
    <PageContainer className="grid gap-8">
      <section className="flex flex-col gap-5 rounded-xl bg-emerald-900 px-5 py-7 text-white sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <div>
          <p className="text-sm font-semibold text-emerald-200">{formatNeighborhood(user.neighborhoodId, data.neighborhoods)}</p>
          <h1 className="mt-1 text-2xl font-extrabold sm:text-3xl">Bonjour {user.displayName?.split(' ')[0] ?? 'voisin'}</h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-emerald-100">Retrouvez ce qui demande votre attention et les services disponibles près de chez vous.</p>
        </div>
        <Link className={buttonStyles('primary', 'md', 'border-white bg-white text-emerald-900 hover:border-emerald-50 hover:bg-emerald-50')} to="/services/new"><Icon className="size-4" name="plus" /> Publier un service</Link>
      </section>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1.7fr)_minmax(18rem,0.7fr)]">
        <div className="grid gap-8">
          <section>
            <div className="mb-4 flex items-end justify-between gap-4"><div><h2 className="text-xl font-extrabold text-slate-950">À faire</h2><p className="mt-1 text-sm text-slate-600">Vos prochaines actions importantes.</p></div><Link className="text-sm font-bold text-emerald-700 hover:text-emerald-900" to="/activities">Tout voir</Link></div>
            {tasks.length > 0 ? <div className="grid gap-3">{tasks.map((task) => <Link className="flex items-center gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition hover:border-emerald-200 hover:shadow-md" key={task.label} to={task.to}><span className="grid size-10 shrink-0 place-items-center rounded-lg bg-emerald-50 text-emerald-700"><Icon className="size-5" name={task.icon} /></span><span className="min-w-0"><strong className="block text-sm text-slate-950">{task.label}</strong><span className="mt-0.5 block truncate text-sm text-slate-600">{task.detail}</span></span><span className="ml-auto text-emerald-700">→</span></Link>)}</div> : <EmptyState message="Aucune action urgente. Profitez-en pour découvrir les demandes de votre quartier." title="Vous êtes à jour" />}
          </section>

          <section>
            <div className="mb-4 flex items-end justify-between gap-4"><div><h2 className="text-xl font-extrabold text-slate-950">Services près de chez vous</h2><p className="mt-1 text-sm text-slate-600">Des demandes et offres publiées dans votre quartier.</p></div><Link className="text-sm font-bold text-emerald-700 hover:text-emerald-900" to="/services">Explorer</Link></div>
            {nearbyServices.length > 0 ? <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{nearbyServices.map((service) => <ServiceCard currentUserId={user.id} key={getEntityId(service)} neighborhoods={data.neighborhoods} service={service} />)}</div> : <EmptyState action={<Link className={buttonStyles('secondary', 'sm')} to="/services/new">Publier une annonce</Link>} message="Aucun service publié n’est disponible pour le moment." title="Soyez le premier à proposer un service" />}
          </section>
        </div>

        <aside className="grid content-start gap-4">
          <PointsSummary balance={data.balance} />
          <Card>
            <h2 className="font-extrabold text-slate-950">Dans votre quartier</h2>
            {recentIncident ? <div className="mt-3"><Badge tone={recentIncident.status === 'resolved' ? 'success' : 'warning'}>{recentIncident.status === 'resolved' ? 'Résolu' : 'Suivi en cours'}</Badge><p className="mt-2 text-sm font-bold text-slate-900">{recentIncident.title}</p><p className="mt-1 text-sm leading-6 text-slate-600">Les incidents sont visibles par les habitants et suivis par l’administration.</p></div> : <p className="mt-3 text-sm leading-6 text-slate-600">Aucune actualité locale n’est disponible.</p>}
            <Link className="mt-4 inline-flex text-sm font-bold text-emerald-700 hover:text-emerald-900" to="/local">Voir la vie locale</Link>
          </Card>
          <Card>
            <h2 className="font-extrabold text-slate-950">Voisins à découvrir</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">Les profils publics seront proposés dans le prochain lot. Vos données privées ne sont jamais affichées ici.</p>
            <Link className="mt-3 inline-flex text-sm font-bold text-emerald-700 hover:text-emerald-900" to="/neighbors">Découvrir bientôt</Link>
          </Card>
        </aside>
      </div>
    </PageContainer>
  );
}
