import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import { getNeighborhoods, type NeighborhoodItem } from '../api/neighborhoods';
import { getServices, type ServiceItem } from '../api/services';
import { useAuth } from '../auth/useAuth';
import { PageContainer } from '../components/layout/PageContainer';
import { ServiceCard } from '../components/services/ServiceCard';
import { ServiceFilters, type ServiceFilterValue } from '../components/services/ServiceFilters';
import { Button } from '../components/ui/Button';
import { buttonStyles } from '../components/ui/buttonStyles';
import { EmptyState } from '../components/ui/EmptyState';
import { ErrorMessage } from '../components/ui/ErrorMessage';
import { Icon } from '../components/ui/Icon';
import { LoadingState } from '../components/ui/LoadingState';
import { PageHeader } from '../components/ui/PageHeader';
import { Tabs } from '../components/ui/Tabs';
import { getFriendlyError } from '../utils/errors';
import { getEntityId } from '../utils/format';

type ServiceView = 'all' | 'requests' | 'offers' | 'urgent' | 'recommended';

const defaultFilters: ServiceFilterValue = {
  category: 'all',
  payment: 'all',
  query: '',
  sort: 'newest',
  type: 'all',
};

export function ServicesExplorePage() {
  const { user } = useAuth();
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [neighborhoods, setNeighborhoods] = useState<NeighborhoodItem[]>([]);
  const [filters, setFilters] = useState(defaultFilters);
  const [view, setView] = useState<ServiceView>('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (silent = false) => {
    if (silent) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const [nextServices, nextNeighborhoods] = await Promise.all([getServices(), getNeighborhoods()]);
      setServices(nextServices);
      setNeighborhoods(nextNeighborhoods);
    } catch (caught) {
      setError(getFriendlyError(caught, 'Impossible de charger les services. Réessayez dans quelques instants.'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const categories = useMemo(() => [...new Set(services.map((service) => service.category).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'fr')), [services]);

  const filteredServices = useMemo(() => {
    const normalizedQuery = filters.query.trim().toLocaleLowerCase('fr-FR');
    const currentNeighborhood = user?.neighborhoodId;
    return services
      .filter((service) => service.status !== 'cancelled')
      .filter((service) => {
        if (view === 'requests') return service.type === 'request';
        if (view === 'offers') return service.type === 'offer';
        if (view === 'urgent') return /urgent/i.test(`${service.title} ${service.description} ${service.availability}`);
        if (view === 'recommended') return Boolean(currentNeighborhood) && service.neighborhoodId === currentNeighborhood && service.ownerId !== user?.id;
        return true;
      })
      .filter((service) => filters.type === 'all' || service.type === filters.type)
      .filter((service) => filters.category === 'all' || service.category === filters.category)
      .filter((service) => filters.payment === 'all' || (filters.payment === 'paid' ? service.isPaid : !service.isPaid))
      .filter((service) => !normalizedQuery || `${service.title} ${service.description} ${service.category}`.toLocaleLowerCase('fr-FR').includes(normalizedQuery))
      .sort((a, b) => {
        if (filters.sort === 'price-asc') return (a.pricePoints ?? 0) - (b.pricePoints ?? 0);
        if (filters.sort === 'price-desc') return (b.pricePoints ?? 0) - (a.pricePoints ?? 0);
        const aDate = new Date(a.createdAt ?? 0).getTime();
        const bDate = new Date(b.createdAt ?? 0).getTime();
        return filters.sort === 'oldest' ? aDate - bDate : bDate - aDate;
      });
  }, [filters, services, user, view]);

  const tabs = [
    { id: 'all' as const, label: 'Explorer', count: services.length },
    { id: 'requests' as const, label: 'Demandes', count: services.filter((item) => item.type === 'request').length },
    { id: 'offers' as const, label: 'Offres', count: services.filter((item) => item.type === 'offer').length },
    { id: 'urgent' as const, label: 'Urgents' },
    { id: 'recommended' as const, label: 'Pour vous' },
  ];

  return (
    <PageContainer className="grid gap-6">
      <PageHeader
        action={<Link className={buttonStyles('primary')} to="/services/new"><Icon className="size-4" name="plus" /> Publier un service</Link>}
        description="Trouvez une demande à laquelle répondre ou une compétence proposée par un voisin."
        title="Services entre voisins"
      />
      <Tabs items={tabs} label="Types de services" onChange={setView} value={view} />
      <ServiceFilters categories={categories} onChange={setFilters} value={filters} />

      <div className="flex min-h-10 items-center justify-between gap-4">
        <p aria-live="polite" className="whitespace-nowrap text-sm font-semibold text-slate-700">{filteredServices.length} service{filteredServices.length > 1 ? 's' : ''}</p>
        <Button disabled={refreshing} onClick={() => void load(true)} size="sm" variant="ghost"><Icon className={`size-4 ${refreshing ? 'animate-spin' : ''}`} name="refresh" />{refreshing ? 'Actualisation…' : 'Actualiser'}</Button>
      </div>

      {loading ? <LoadingState message="Chargement des services…" /> : null}
      {error ? <ErrorMessage message={error} /> : null}
      {!loading && !error && filteredServices.length === 0 ? (
        <EmptyState
          action={<Button onClick={() => { setFilters(defaultFilters); setView('all'); }} variant="secondary">Effacer les filtres</Button>}
          icon="search"
          message="Modifiez votre recherche ou retirez un filtre pour voir davantage d’annonces."
          title="Aucun service ne correspond"
        />
      ) : null}
      {!loading && !error && filteredServices.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filteredServices.map((service) => <ServiceCard currentUserId={user?.id} key={getEntityId(service)} neighborhoods={neighborhoods} service={service} />)}
        </div>
      ) : null}
    </PageContainer>
  );
}
