import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { getEvents, type EventItem } from '../api/events';
import {
  confirmMyNeighborhood,
  getMyNeighborhood,
  resolveMyNeighborhood,
  type MyNeighborhoodResponse,
  type NeighborhoodResolution,
} from '../api/neighborhoods';
import { getServices, type ServiceItem } from '../api/services';
import { getVotes, type VoteItem } from '../api/votes';
import { useAuth } from '../auth/useAuth';
import { PageContainer } from '../components/layout/PageContainer';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { buttonStyles } from '../components/ui/buttonStyles';
import { Card } from '../components/ui/Card';
import { EmptyState } from '../components/ui/EmptyState';
import { ErrorMessage } from '../components/ui/ErrorMessage';
import { Icon } from '../components/ui/Icon';
import { LoadingState } from '../components/ui/LoadingState';
import { getFriendlyError } from '../utils/errors';
import { getEntityId } from '../utils/format';

type LocalContent = {
  services: ServiceItem[];
  events: EventItem[];
  votes: VoteItem[];
};

const EMPTY_CONTENT: LocalContent = { services: [], events: [], votes: [] };

export function NeighborhoodPage() {
  const { refreshUser } = useAuth();
  const [mine, setMine] = useState<MyNeighborhoodResponse | null>(null);
  const [content, setContent] = useState<LocalContent>(EMPTY_CONTENT);
  const [resolution, setResolution] = useState<NeighborhoodResolution | null>(null);
  const [loading, setLoading] = useState(true);
  const [locating, setLocating] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const current = await getMyNeighborhood();
      setMine(current);
      if (!current.assigned) {
        setContent(EMPTY_CONTENT);
        return;
      }
      const [services, events, votes] = await Promise.all([
        getServices(),
        getEvents({ limit: 6 }),
        getVotes({ limit: 6 }),
      ]);
      setContent({
        services: services.slice(0, 4),
        events: events.items.slice(0, 3),
        votes: votes.items.slice(0, 3),
      });
    } catch (caught) {
      setError(getFriendlyError(caught, 'Impossible de charger votre quartier.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function locate() {
    if (!navigator.geolocation) {
      setError('La géolocalisation n’est pas disponible dans ce navigateur.');
      return;
    }
    setLocating(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        void resolveMyNeighborhood(coords.longitude, coords.latitude)
          .then(setResolution)
          .catch((caught) =>
            setError(
              getFriendlyError(caught, 'Impossible de déterminer votre quartier.'),
            ),
          )
          .finally(() => setLocating(false));
      },
      () => {
        setError(
          'Votre position n’a pas pu être utilisée. Vérifiez l’autorisation du navigateur.',
        );
        setLocating(false);
      },
      { enableHighAccuracy: false, maximumAge: 60_000, timeout: 10_000 },
    );
  }

  async function confirm() {
    setConfirming(true);
    setError(null);
    try {
      await confirmMyNeighborhood();
      await refreshUser();
      setResolution(null);
      setLoading(true);
      await load();
    } catch (caught) {
      setError(getFriendlyError(caught, 'Impossible de confirmer ce quartier.'));
    } finally {
      setConfirming(false);
    }
  }

  if (loading) {
    return (
      <PageContainer>
        <LoadingState message="Chargement de votre quartier…" />
      </PageContainer>
    );
  }

  const neighborhood = mine?.neighborhood;

  return (
    <PageContainer className="grid gap-7">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-bold text-emerald-700">Votre espace local</p>
          <h1 className="mt-1 text-3xl font-black text-slate-950">
            {neighborhood?.name ?? 'Mon quartier'}
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            {neighborhood
              ? `${neighborhood.city}${neighborhood.postalCodes?.length ? ` · ${neighborhood.postalCodes.join(', ')}` : ''}`
              : 'Confirmez votre secteur pour accéder aux services et à la vie locale.'}
          </p>
        </div>
        {neighborhood ? (
          <Link className={buttonStyles('primary')} to="/services/new">
            <Icon className="size-4" name="plus" /> Publier un service
          </Link>
        ) : null}
      </header>

      {error ? <ErrorMessage message={error} /> : null}

      {!mine?.assigned ? (
        <Card className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-center">
          <div>
            <span className="grid size-12 place-items-center rounded-lg bg-emerald-100 text-emerald-800">
              <Icon className="size-6" name="map-pin" />
            </span>
            <h2 className="mt-4 text-xl font-extrabold text-slate-950">
              Trouver mon quartier
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600">
              Votre position est utilisée une seule fois pour rechercher le périmètre
              correspondant. Elle n’est ni enregistrée dans votre profil, ni conservée
              dans l’historique.
            </p>
            <Button className="mt-4" disabled={locating} onClick={locate}>
              {locating ? 'Recherche en cours…' : 'Utiliser ma position'}
            </Button>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-600">
            <strong className="block text-slate-900">Respect de votre vie privée</strong>
            Seul le quartier confirmé est conservé. Aucun autre habitant ne peut
            consulter votre adresse ou vos coordonnées.
          </div>
        </Card>
      ) : null}

      {resolution?.status === 'not_found' ? (
        <EmptyState
          message="Aucun quartier actif ne couvre cette zone. L’administration peut vérifier votre rattachement sans recevoir votre position exacte."
          title="Quartier non trouvé"
        />
      ) : null}

      {resolution?.status === 'found' && resolution.neighborhood ? (
        <Card className="border-emerald-300 bg-emerald-50">
          <Badge tone="success">Quartier trouvé</Badge>
          <h2 className="mt-3 text-xl font-extrabold text-emerald-950">
            {resolution.neighborhood.name}
          </h2>
          <p className="mt-1 text-sm text-emerald-800">
            {resolution.neighborhood.city} ·{' '}
            {resolution.neighborhood.postalCodes?.join(', ')}
          </p>
          <p className="mt-3 text-sm leading-6 text-emerald-900">
            Confirmez uniquement si ce quartier correspond bien à votre secteur.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Button disabled={confirming} onClick={() => void confirm()}>
              {confirming ? 'Confirmation…' : 'Confirmer ce quartier'}
            </Button>
            <Button onClick={() => setResolution(null)} variant="ghost">
              Annuler
            </Button>
          </div>
        </Card>
      ) : null}

      {neighborhood ? (
        <>
          <Card>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-extrabold text-slate-950">
                  {neighborhood.name}
                </h2>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                  {neighborhood.description ||
                    'Votre quartier rassemble les services et initiatives visibles par ses habitants.'}
                </p>
              </div>
              <Badge tone={neighborhood.status === 'archived' ? 'warning' : 'success'}>
                {neighborhood.status === 'archived' ? 'Archivé' : 'Actif'}
              </Badge>
            </div>
            <p className="mt-4 text-xs text-slate-500">
              Le périmètre concerne le quartier. Votre position personnelle n’est pas affichée.
            </p>
          </Card>

          <LocalServices services={content.services} />
          <div className="grid gap-5 lg:grid-cols-2">
            <LocalEvents events={content.events} />
            <LocalVotes votes={content.votes} />
          </div>
        </>
      ) : null}
    </PageContainer>
  );
}

function LocalServices({ services }: { services: ServiceItem[] }) {
  return (
    <section>
      <div className="mb-3 flex items-end justify-between gap-4">
        <div><h2 className="text-xl font-extrabold text-slate-950">Services du quartier</h2><p className="mt-1 text-sm text-slate-600">Demandes et offres actuellement visibles.</p></div>
        <Link className="text-sm font-bold text-emerald-700" to="/services">Tout voir</Link>
      </div>
      {services.length ? (
        <div className="grid gap-3 md:grid-cols-2">
          {services.map((service) => (
            <Link className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition hover:border-emerald-300" key={getEntityId(service)} to={`/services/${getEntityId(service)}`}>
              <Badge tone={service.type === 'request' ? 'warning' : 'success'}>{service.type === 'request' ? 'Demande' : 'Offre'}</Badge>
              <h3 className="mt-2 font-extrabold text-slate-950">{service.title}</h3>
              <p className="mt-1 line-clamp-2 text-sm text-slate-600">{service.description}</p>
            </Link>
          ))}
        </div>
      ) : <EmptyState message="Aucun service publié dans ce quartier." title="Pas encore de service" />}
    </section>
  );
}

function LocalEvents({ events }: { events: EventItem[] }) {
  return <LocalList title="Événements" to="/events">{events.length ? events.map((event) => <Link className="rounded-lg bg-slate-50 p-3 hover:bg-emerald-50" key={event.id} to={`/events/${event.id}`}><strong className="block text-sm text-slate-900">{event.title}</strong><span className="mt-1 block text-xs text-slate-500">{new Date(event.startsAt).toLocaleDateString('fr-FR')}</span></Link>) : <p className="text-sm text-slate-600">Aucun événement annoncé.</p>}</LocalList>;
}

function LocalVotes({ votes }: { votes: VoteItem[] }) {
  return <LocalList title="Votes ouverts" to="/votes">{votes.length ? votes.map((vote) => <Link className="rounded-lg bg-slate-50 p-3 hover:bg-blue-50" key={vote.id} to={`/votes/${vote.id}`}><strong className="block text-sm text-slate-900">{vote.title}</strong><span className="mt-1 block text-xs text-slate-500">Jusqu’au {new Date(vote.closesAt).toLocaleDateString('fr-FR')}</span></Link>) : <p className="text-sm text-slate-600">Aucun vote ouvert.</p>}</LocalList>;
}

function LocalList({ children, title, to }: { children: React.ReactNode; title: string; to: string }) {
  return <section><div className="mb-3 flex items-end justify-between"><h2 className="text-lg font-extrabold text-slate-950">{title}</h2><Link className="text-sm font-bold text-emerald-700" to={to}>Tout voir</Link></div><Card className="grid gap-3">{children}</Card></section>;
}
