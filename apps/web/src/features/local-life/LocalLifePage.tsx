import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { getEvents, type EventItem } from '../../api/events';
import { getVotes, type VoteItem } from '../../api/votes';
import { PageContainer } from '../../components/layout/PageContainer';
import { buttonStyles } from '../../components/ui/buttonStyles';
import { Card } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorMessage } from '../../components/ui/ErrorMessage';
import { Icon } from '../../components/ui/Icon';
import { LoadingState } from '../../components/ui/LoadingState';
import { PageHeader } from '../../components/ui/PageHeader';
import { getFriendlyError } from '../../utils/errors';
import { EventCard } from './components/EventCard';
import { VoteCard } from './components/VoteCard';

export function LocalLifePage() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [votes, setVotes] = useState<VoteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    Promise.all([
      getEvents({ sort: 'soonest', limit: 3 }),
      getVotes({ sort: 'closing_soon', limit: 3 }),
    ]).then(([eventPage, votePage]) => {
      if (!active) return;
      setEvents(eventPage.items);
      setVotes(votePage.items);
    }).catch((caught) => {
      if (active) setError(getFriendlyError(caught, 'Impossible de charger la vie locale.'));
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, []);

  return (
    <PageContainer className="grid gap-8">
      <PageHeader
        action={<Link className={buttonStyles('primary')} to="/events/new"><Icon className="size-4" name="plus" /> Proposer un événement</Link>}
        description="Participez aux rendez-vous et aux décisions du Quartier Centre."
        eyebrow="Quartier Centre"
        title="Vie locale"
      />
      {error ? <ErrorMessage message={error} /> : null}
      {loading ? <LoadingState message="Chargement de la vie du quartier…" /> : null}
      {!loading ? (
        <>
          <section className="grid gap-4">
            <div className="flex flex-wrap items-end justify-between gap-3"><div><h2 className="text-xl font-extrabold text-slate-950">Événements à venir</h2><p className="mt-1 text-sm text-slate-600">Rencontrez vos voisins autour d’activités locales.</p></div><div className="flex gap-2"><Link className={buttonStyles('ghost', 'sm')} to="/events/discover">Découvrir</Link><Link className={buttonStyles('secondary', 'sm')} to="/events">Tout voir</Link></div></div>
            {events.length ? <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{events.map((event) => <EventCard event={event} key={event.id} />)}</div> : <EmptyState icon="calendar" message="Les prochains événements publiés apparaîtront ici." title="Aucun événement à venir" />}
          </section>
          <section className="grid gap-4">
            <div className="flex flex-wrap items-end justify-between gap-3"><div><h2 className="text-xl font-extrabold text-slate-950">Votes du quartier</h2><p className="mt-1 text-sm text-slate-600">Donnez votre avis sur les sujets ouverts aux habitants.</p></div><Link className={buttonStyles('secondary', 'sm')} to="/votes">Voir les votes</Link></div>
            {votes.length ? <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{votes.map((vote) => <VoteCard key={vote.id} vote={vote} />)}</div> : <EmptyState icon="check" message="Les consultations ouvertes apparaîtront ici." title="Aucun vote disponible" />}
          </section>
          <Card className="grid gap-3 border-emerald-200 bg-emerald-50/60 sm:grid-cols-[1fr_auto] sm:items-center"><div><h2 className="font-extrabold text-emerald-950">Une idée pour votre quartier ?</h2><p className="mt-1 text-sm text-emerald-900/80">Proposez un événement. Les votes sont créés et administrés par la modération.</p></div><Link className={buttonStyles('primary')} to="/events/new">Créer un brouillon</Link></Card>
        </>
      ) : null}
    </PageContainer>
  );
}
