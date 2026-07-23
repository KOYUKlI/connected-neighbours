import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import { cancelEvent, completeEvent, getEvent, getEventParticipants, respondToEvent, type EventItem, type EventParticipant, type EventResponseStatus } from '../../api/events';
import { PageContainer } from '../../components/layout/PageContainer';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { buttonStyles } from '../../components/ui/buttonStyles';
import { Card } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorMessage } from '../../components/ui/ErrorMessage';
import { Icon } from '../../components/ui/Icon';
import { LoadingState } from '../../components/ui/LoadingState';
import { Modal } from '../../components/ui/Modal';
import { Textarea } from '../../components/ui/Textarea';
import { getFriendlyError } from '../../utils/errors';
import { formatDate, formatInitials } from '../../utils/format';
import { eventCategoryLabels, eventResponseLabels, eventStatusLabels } from './localLifePresentation';

export function EventDetailPage() {
  const { eventId = '' } = useParams();
  const [event, setEvent] = useState<EventItem | null>(null);
  const [participants, setParticipants] = useState<EventParticipant[]>([]);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  const load = useCallback(async () => {
    setError(null);
    const loaded = await getEvent(eventId);
    setEvent(loaded);
    if (loaded.permissions.canViewParticipants) {
      setParticipants(await getEventParticipants(eventId));
    } else {
      setParticipants([]);
    }
  }, [eventId]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    load().catch((caught) => { if (active) setError(getFriendlyError(caught, 'Impossible de charger cet événement.')); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [load]);

  async function mutate(action: () => Promise<unknown>, fallback: string) {
    setPending(true);
    setError(null);
    try { await action(); await load(); } catch (caught) { setError(getFriendlyError(caught, fallback)); } finally { setPending(false); }
  }

  async function respond(response: EventResponseStatus) {
    await mutate(() => respondToEvent(eventId, response), 'Votre réponse n’a pas pu être enregistrée.');
  }

  if (loading) return <PageContainer><LoadingState message="Chargement de l’événement…" /></PageContainer>;
  if (!event) return <PageContainer className="grid gap-4">{error ? <ErrorMessage message={error} /> : null}<EmptyState icon="calendar" message="Cet événement est introuvable ou n’est plus visible." title="Événement indisponible" /></PageContainer>;

  return (
    <PageContainer className="grid gap-6 pb-28 lg:pb-8">
      <Link className="inline-flex min-h-11 w-fit items-center gap-2 rounded-lg text-sm font-bold text-slate-600 hover:text-emerald-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200" to="/events"><Icon className="size-4" name="arrow-left" /> Retour aux événements</Link>
      {error ? <ErrorMessage message={error} /> : null}
      <header className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end"><div><div className="flex flex-wrap gap-2"><Badge tone="info">{eventCategoryLabels[event.category]}</Badge><Badge tone={event.effectiveStatus === 'cancelled' ? 'danger' : event.isFull ? 'warning' : 'success'}>{eventStatusLabels[event.effectiveStatus]}</Badge>{event.viewerResponse ? <Badge>{eventResponseLabels[event.viewerResponse.response]}</Badge> : null}</div><h1 className="mt-4 text-2xl font-extrabold text-slate-950 sm:text-3xl">{event.title}</h1><p className="mt-2 text-sm text-slate-600">Organisé par {event.organizer?.displayName ?? 'un voisin'} · {event.neighborhood?.name ?? 'Votre quartier'}</p></div>{event.permissions.canEdit ? <Link className={buttonStyles('secondary')} to={`/events/${event.id}/edit`}>Modifier</Link> : null}</header>
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        <main className="grid gap-5">
          <Card><h2 className="text-lg font-extrabold text-slate-950">À propos</h2><p className="mt-3 whitespace-pre-line text-sm leading-7 text-slate-700">{event.description}</p></Card>
          <Card className="grid gap-4"><h2 className="text-lg font-extrabold text-slate-950">Informations pratiques</h2><dl className="grid gap-4 sm:grid-cols-2"><div><dt className="text-xs font-bold uppercase text-slate-500">Début</dt><dd className="mt-1 text-sm font-semibold text-slate-900">{formatDate(event.startsAt, { dateStyle: 'full', timeStyle: 'short' })}</dd></div><div><dt className="text-xs font-bold uppercase text-slate-500">Fin</dt><dd className="mt-1 text-sm font-semibold text-slate-900">{formatDate(event.endsAt, { dateStyle: 'full', timeStyle: 'short' })}</dd></div><div><dt className="text-xs font-bold uppercase text-slate-500">Lieu</dt><dd className="mt-1 text-sm font-semibold text-slate-900">{event.locationLabel}</dd></div><div><dt className="text-xs font-bold uppercase text-slate-500">Capacité</dt><dd className="mt-1 text-sm font-semibold text-slate-900">{event.capacity ? `${event.counts.participants}/${event.capacity} participants` : `${event.counts.participants} participants`}</dd></div></dl></Card>
          {event.permissions.canViewParticipants ? <Card><div className="flex items-center justify-between"><h2 className="text-lg font-extrabold text-slate-950">Participants</h2><Badge>{participants.length}</Badge></div>{participants.length ? <ul className="mt-4 divide-y divide-slate-100">{participants.map((participant) => <li className="flex items-center gap-3 py-3" key={participant.id}><span className="grid size-10 place-items-center rounded-full bg-emerald-100 text-sm font-extrabold text-emerald-800">{formatInitials(participant.user?.displayName)}</span><div className="min-w-0"><p className="truncate text-sm font-bold text-slate-900">{participant.user?.displayName ?? 'Profil indisponible'}</p><p className="text-xs text-slate-500">{eventResponseLabels[participant.response]}{participant.waitlistPosition ? ` · position ${participant.waitlistPosition}` : ''}</p></div></li>)}</ul> : <p className="mt-3 text-sm text-slate-600">Aucun participant inscrit.</p>}</Card> : null}
        </main>
        <aside className="grid content-start gap-4">
          <Card className="grid gap-4"><div><p className="text-sm font-bold text-slate-950">Votre réponse</p><p className="mt-1 text-sm text-slate-600">{event.registrationClosed ? 'Les inscriptions sont closes.' : 'Choisissez la réponse qui vous correspond.'}</p></div>{event.permissions.canRespond || event.permissions.canLeave ? <div className="grid gap-2"><Button disabled={pending} onClick={() => respond('going')} variant="primary">{event.isFull ? 'Rejoindre la liste d’attente' : 'Je participe'}</Button><div className="grid grid-cols-2 gap-2"><Button disabled={pending} onClick={() => respond('interested')} size="sm" variant="secondary">Intéressé</Button><Button disabled={pending} onClick={() => respond('maybe')} size="sm" variant="secondary">Peut-être</Button></div>{event.permissions.canLeave ? <Button disabled={pending} onClick={() => respond('cancelled')} size="sm" variant="ghost">Annuler ma participation</Button> : null}</div> : <Badge>{event.viewerResponse ? eventResponseLabels[event.viewerResponse.response] : eventStatusLabels[event.effectiveStatus]}</Badge>}</Card>
          <Card className="grid gap-3"><h2 className="font-extrabold text-slate-950">Participation</h2><p className="text-3xl font-extrabold text-emerald-800">{event.counts.participants}</p><p className="text-sm text-slate-600">{event.counts.interested} intéressé(s) · {event.counts.maybe} peut-être · {event.counts.waitlisted} en attente</p></Card>
          {event.permissions.canComplete || event.permissions.canCancel ? <Card className="grid gap-2"><h2 className="font-extrabold text-slate-950">Gestion</h2>{event.permissions.canComplete ? <Button disabled={pending} onClick={() => mutate(() => completeEvent(eventId), 'Impossible de terminer cet événement.')} variant="secondary">Marquer comme terminé</Button> : null}{event.permissions.canCancel ? <Button disabled={pending} onClick={() => setCancelOpen(true)} variant="danger">Annuler l’événement</Button> : null}</Card> : null}
        </aside>
      </div>
      <Modal description="Les habitants inscrits verront immédiatement le statut annulé." onClose={() => setCancelOpen(false)} open={cancelOpen} title="Annuler l’événement"><div className="grid gap-4"><label className="grid gap-2 text-sm font-bold text-slate-900">Motif<Textarea minLength={10} onChange={(event) => setCancelReason(event.target.value)} rows={4} value={cancelReason} /></label><div className="flex justify-end gap-2"><Button onClick={() => setCancelOpen(false)} variant="ghost">Retour</Button><Button disabled={pending || cancelReason.trim().length < 10} onClick={() => mutate(() => cancelEvent(eventId, cancelReason.trim()), 'Impossible d’annuler cet événement.').then(() => setCancelOpen(false))} variant="danger">Confirmer l’annulation</Button></div></div></Modal>
    </PageContainer>
  );
}
