import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { getEvents, type EventCategory, type EventItem, type EventResponseStatus } from '../../api/events';
import { PageContainer } from '../../components/layout/PageContainer';
import { Button } from '../../components/ui/Button';
import { buttonStyles } from '../../components/ui/buttonStyles';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorMessage } from '../../components/ui/ErrorMessage';
import { Icon } from '../../components/ui/Icon';
import { Input } from '../../components/ui/Input';
import { LoadingState } from '../../components/ui/LoadingState';
import { PageHeader } from '../../components/ui/PageHeader';
import { Select } from '../../components/ui/Select';
import { getFriendlyError } from '../../utils/errors';
import { EventCard } from './components/EventCard';
import { eventCategoryLabels } from './localLifePresentation';

export function EventsPage() {
  const [items, setItems] = useState<EventItem[]>([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<EventCategory | ''>('');
  const [response, setResponse] = useState<EventResponseStatus | ''>('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const timer = window.setTimeout(() => {
      setLoading(true);
      setError(null);
      getEvents({ search, category, response, page, limit: 12 }).then((result) => {
        if (!active) return;
        setItems(result.items);
        setTotalPages(result.totalPages);
      }).catch((caught) => {
        if (active) setError(getFriendlyError(caught, 'Impossible de charger les événements.'));
      }).finally(() => { if (active) setLoading(false); });
    }, 300);
    return () => { active = false; window.clearTimeout(timer); };
  }, [category, page, response, search]);

  return (
    <PageContainer className="grid gap-6">
      <PageHeader action={<Link className={buttonStyles('primary')} to="/events/new"><Icon className="size-4" name="plus" /> Proposer un événement</Link>} description="Trouvez les rendez-vous du quartier et suivez vos participations." eyebrow="Vie locale" title="Événements" />
      <div className="grid gap-3 rounded-lg border border-slate-200 bg-white p-3 shadow-sm md:grid-cols-[minmax(0,1fr)_220px_220px_auto]">
        <label className="relative"><span className="sr-only">Rechercher</span><Icon className="pointer-events-none absolute left-3 top-3.5 size-4 text-slate-400" name="search" /><Input className="pl-10" onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Rechercher un événement…" value={search} /></label>
        <Select aria-label="Catégorie" onChange={(event) => { setCategory(event.target.value as EventCategory | ''); setPage(1); }} value={category}><option value="">Toutes les catégories</option>{Object.entries(eventCategoryLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</Select>
        <Select aria-label="Participation" onChange={(event) => { setResponse(event.target.value as EventResponseStatus | ''); setPage(1); }} value={response}><option value="">Toutes mes réponses</option><option value="going">Je participe</option><option value="interested">Intéressé</option><option value="maybe">Peut-être</option><option value="waitlisted">Liste d’attente</option></Select>
        <Button onClick={() => { setSearch(''); setCategory(''); setResponse(''); setPage(1); }} size="sm" variant="ghost">Réinitialiser</Button>
      </div>
      {error ? <ErrorMessage message={error} /> : null}
      {loading ? <LoadingState message="Chargement des événements…" /> : null}
      {!loading && items.length === 0 ? <EmptyState icon="calendar" message="Modifiez les filtres ou proposez un nouvel événement." title="Aucun événement trouvé" /> : null}
      {!loading && items.length ? <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{items.map((event) => <EventCard event={event} key={event.id} />)}</div> : null}
      {!loading && totalPages > 1 ? <nav aria-label="Pagination des événements" className="flex items-center justify-center gap-3"><Button disabled={page === 1} onClick={() => setPage((value) => Math.max(1, value - 1))} variant="secondary">Précédent</Button><span className="text-sm font-semibold text-slate-600">Page {page} sur {totalPages}</span><Button disabled={page === totalPages} onClick={() => setPage((value) => Math.min(totalPages, value + 1))} variant="secondary">Suivant</Button></nav> : null}
    </PageContainer>
  );
}
