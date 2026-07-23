import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { createEvent, getEvent, publishEvent, updateEvent, type EventCategory, type EventInput } from '../../api/events';
import { useAuth } from '../../auth/useAuth';
import { FormField } from '../../components/forms/FormField';
import { PageContainer } from '../../components/layout/PageContainer';
import { Button } from '../../components/ui/Button';
import { buttonStyles } from '../../components/ui/buttonStyles';
import { Card } from '../../components/ui/Card';
import { ErrorMessage } from '../../components/ui/ErrorMessage';
import { Icon } from '../../components/ui/Icon';
import { Input } from '../../components/ui/Input';
import { LoadingState } from '../../components/ui/LoadingState';
import { PageHeader } from '../../components/ui/PageHeader';
import { Select } from '../../components/ui/Select';
import { Textarea } from '../../components/ui/Textarea';
import { getFriendlyError } from '../../utils/errors';
import { eventCategoryLabels } from './localLifePresentation';

function localDateTime(value?: string) {
  if (!value) return '';
  const date = new Date(value);
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

export function EventFormPage() {
  const { eventId } = useParams();
  const editing = Boolean(eventId);
  const navigate = useNavigate();
  const { user } = useAuth();
  const intentRef = useRef<'draft' | 'publish'>('draft');
  const [initial, setInitial] = useState<Record<string, string | number>>({});
  const [loading, setLoading] = useState(editing);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!eventId) return;
    getEvent(eventId).then((event) => setInitial({
      title: event.title,
      description: event.description,
      category: event.category,
      startsAt: localDateTime(event.startsAt),
      endsAt: localDateTime(event.endsAt),
      registrationDeadline: localDateTime(event.registrationDeadline ?? undefined),
      locationLabel: event.locationLabel,
      capacity: event.capacity ?? '',
    })).catch((caught) => setError(getFriendlyError(caught, 'Impossible de charger cet événement.'))).finally(() => setLoading(false));
  }, [eventId]);

  async function handleSubmit(submitEvent: FormEvent<HTMLFormElement>) {
    submitEvent.preventDefault();
    const form = new FormData(submitEvent.currentTarget);
    const startsAt = new Date(String(form.get('startsAt')));
    const endsAt = new Date(String(form.get('endsAt')));
    const deadlineValue = String(form.get('registrationDeadline') ?? '');
    if (endsAt.getTime() <= startsAt.getTime()) { setError('La fin doit être postérieure au début.'); return; }
    if (!user?.neighborhoodId) { setError('Votre compte doit être rattaché à un quartier.'); return; }
    const capacityValue = Number(form.get('capacity') ?? 0);
    const input: EventInput = {
      title: String(form.get('title') ?? '').trim(),
      description: String(form.get('description') ?? '').trim(),
      category: String(form.get('category')) as EventCategory,
      neighborhoodId: user.neighborhoodId,
      startsAt: startsAt.toISOString(),
      endsAt: endsAt.toISOString(),
      ...(deadlineValue ? { registrationDeadline: new Date(deadlineValue).toISOString() } : {}),
      locationLabel: String(form.get('locationLabel') ?? '').trim(),
      ...(capacityValue > 0 ? { capacity: capacityValue } : {}),
      accessibilityInformation: String(form.get('accessibilityInformation') ?? '').trim() || undefined,
      equipmentInformation: String(form.get('equipmentInformation') ?? '').trim() || undefined,
      contactInstructions: String(form.get('contactInstructions') ?? '').trim() || undefined,
    };
    setPending(true);
    setError(null);
    try {
      const saved = eventId ? await updateEvent(eventId, input) : await createEvent(input);
      if (!eventId && intentRef.current === 'publish') await publishEvent(saved.id);
      navigate(`/events/${saved.id}`, { replace: true });
    } catch (caught) {
      setError(getFriendlyError(caught, 'Impossible d’enregistrer cet événement.'));
    } finally { setPending(false); }
  }

  return (
    <PageContainer className="grid gap-6">
      <Link className="inline-flex min-h-11 w-fit items-center gap-2 rounded-lg text-sm font-bold text-slate-600 hover:text-emerald-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200" to={eventId ? `/events/${eventId}` : '/events'}><Icon className="size-4" name="arrow-left" /> Retour</Link>
      <PageHeader description="Le lieu affiché reste une indication publique, jamais une adresse personnelle précise." eyebrow="Vie locale · Événements" title={editing ? 'Modifier l’événement' : 'Proposer un événement'} />
      {loading ? <LoadingState message="Chargement du formulaire…" /> : null}
      {!loading ? <form className="grid gap-5" onSubmit={handleSubmit}>
        {error ? <ErrorMessage message={error} /> : null}
        <Card className="grid gap-5"><div><h2 className="text-lg font-extrabold text-slate-950">Présentation</h2><p className="mt-1 text-sm text-slate-600">Donnez aux habitants les informations nécessaires pour décider de participer.</p></div><div className="grid gap-4 md:grid-cols-2"><FormField label="Titre"><Input defaultValue={String(initial.title ?? '')} maxLength={140} minLength={3} name="title" placeholder="Atelier réparation vélo" required /></FormField><FormField label="Catégorie"><Select defaultValue={String(initial.category ?? 'workshop')} name="category">{Object.entries(eventCategoryLabels).filter(([value]) => value !== 'emergency').map(([value, label]) => <option key={value} value={value}>{label}</option>)}</Select></FormField></div><FormField label="Description"><Textarea defaultValue={String(initial.description ?? '')} maxLength={4000} minLength={10} name="description" required rows={6} /></FormField></Card>
        <Card className="grid gap-5"><div><h2 className="text-lg font-extrabold text-slate-950">Organisation</h2><p className="mt-1 text-sm text-slate-600">Les horaires serveur détermineront automatiquement l’ouverture et la clôture.</p></div><div className="grid gap-4 md:grid-cols-2"><FormField label="Début"><Input defaultValue={String(initial.startsAt ?? '')} name="startsAt" required type="datetime-local" /></FormField><FormField label="Fin"><Input defaultValue={String(initial.endsAt ?? '')} name="endsAt" required type="datetime-local" /></FormField><FormField label="Clôture des inscriptions (facultatif)"><Input defaultValue={String(initial.registrationDeadline ?? '')} name="registrationDeadline" type="datetime-local" /></FormField><FormField label="Capacité (facultatif)"><Input defaultValue={String(initial.capacity ?? '')} min={1} name="capacity" placeholder="Sans limite" type="number" /></FormField></div><FormField label="Lieu public ou point de rendez-vous"><Input defaultValue={String(initial.locationLabel ?? '')} maxLength={240} name="locationLabel" placeholder="Maison de quartier" required /></FormField></Card>
        <Card className="grid gap-4"><h2 className="text-lg font-extrabold text-slate-950">Informations utiles</h2><FormField label="Accessibilité (facultatif)"><Input name="accessibilityInformation" placeholder="Accès sans marche, ascenseur…" /></FormField><FormField label="Matériel à prévoir (facultatif)"><Input name="equipmentInformation" placeholder="Gants, outils, bouteille d’eau…" /></FormField><FormField label="Consignes de contact (facultatif)"><Textarea name="contactInstructions" rows={3} /></FormField></Card>
        <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end"><Link className={buttonStyles('ghost')} to="/events">Annuler</Link><Button disabled={pending} onClick={() => { intentRef.current = 'draft'; }} type="submit" variant="secondary">{pending ? 'Enregistrement…' : 'Enregistrer le brouillon'}</Button>{!editing ? <Button disabled={pending} onClick={() => { intentRef.current = 'publish'; }} type="submit" variant="primary">{pending ? 'Publication…' : 'Publier maintenant'}</Button> : null}</div>
      </form> : null}
    </PageContainer>
  );
}
