import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { getMyNeighborhood, type MyNeighborhoodResponse } from '../api/neighborhoods';
import { createService, publishService, type ServiceType } from '../api/services';
import { PageContainer } from '../components/layout/PageContainer';
import { FormField } from '../components/forms/FormField';
import { Button } from '../components/ui/Button';
import { buttonStyles } from '../components/ui/buttonStyles';
import { Card } from '../components/ui/Card';
import { ErrorMessage } from '../components/ui/ErrorMessage';
import { Icon } from '../components/ui/Icon';
import { Input } from '../components/ui/Input';
import { LoadingState } from '../components/ui/LoadingState';
import { PageHeader } from '../components/ui/PageHeader';
import { Textarea } from '../components/ui/Textarea';
import { getFriendlyError } from '../utils/errors';
import { getEntityId } from '../utils/format';

export function ServiceCreatePage() {
  const navigate = useNavigate();
  const intentRef = useRef<'draft' | 'publish'>('draft');
  const [neighborhood, setNeighborhood] = useState<MyNeighborhoodResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [type, setType] = useState<ServiceType>('request');
  const [isPaid, setIsPaid] = useState(true);

  useEffect(() => {
    getMyNeighborhood()
      .then(setNeighborhood)
      .catch((caught) => setError(getFriendlyError(caught, 'Impossible de charger votre quartier.')))
      .finally(() => setLoading(false));
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const points = Number(form.get('pricePoints') ?? 0);
    if (isPaid && (!Number.isFinite(points) || points <= 0)) {
      setError('Indiquez un nombre de points supérieur à zéro pour un service payant.');
      return;
    }
    setPending(true);
    setError(null);
    try {
      const service = await createService({
        availability: String(form.get('availability') ?? '').trim(),
        category: String(form.get('category') ?? '').trim(),
        description: String(form.get('description') ?? '').trim(),
        isPaid,
        neighborhoodId: neighborhood?.neighborhood?.slug ?? '',
        pricePoints: isPaid ? points : undefined,
        status: 'draft',
        title: String(form.get('title') ?? '').trim(),
        type,
      });
      const id = getEntityId(service);
      if (intentRef.current === 'publish') await publishService(id);
      navigate(`/services/${id}`, { replace: true });
    } catch (caught) {
      setError(getFriendlyError(caught, 'Impossible d’enregistrer ce service. Vérifiez les informations saisies.'));
    } finally {
      setPending(false);
    }
  }

  return (
    <PageContainer className="grid gap-6">
      <Link className="inline-flex w-fit min-h-11 items-center gap-2 rounded-lg text-sm font-bold text-slate-600 hover:text-emerald-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200" to="/services"><Icon className="size-4" name="arrow-left" /> Retour aux services</Link>
      <PageHeader description="Décrivez votre besoin ou la compétence que vous souhaitez proposer aux habitants du quartier." title="Publier un service" />
      {loading ? <LoadingState message="Chargement du formulaire…" /> : null}
      {!loading && !neighborhood?.assigned ? (
        <Card className="grid justify-items-start gap-3">
          <span className="grid size-11 place-items-center rounded-lg bg-amber-100 text-amber-800"><Icon className="size-5" name="map-pin" /></span>
          <div><h2 className="font-extrabold text-slate-950">Confirmez d’abord votre quartier</h2><p className="mt-1 max-w-xl text-sm leading-6 text-slate-600">Votre annonce sera automatiquement publiée dans votre quartier. Vous ne pourrez pas choisir le quartier d’un autre habitant.</p></div>
          <Link className={buttonStyles('primary')} to="/neighborhood">Confirmer mon quartier</Link>
        </Card>
      ) : null}
      {!loading && neighborhood?.assigned && neighborhood.neighborhood ? (
        <form className="grid gap-5" onSubmit={handleSubmit}>
          {error ? <ErrorMessage message={error} /> : null}
          <Card className="grid gap-5">
            <div><h2 className="text-lg font-extrabold text-slate-950">Votre annonce</h2><p className="mt-1 text-sm text-slate-600">Les informations essentielles seront visibles dans la liste des services.</p></div>
            <fieldset className="grid gap-2 sm:grid-cols-2">
              <legend className="mb-2 text-sm font-bold text-slate-900">Type de service</legend>
              <button aria-pressed={type === 'request'} className={`min-h-20 rounded-lg border p-4 text-left transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200 ${type === 'request' ? 'border-emerald-600 bg-emerald-50 text-emerald-950' : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'}`} onClick={() => setType('request')} type="button"><strong className="block">Je demande de l’aide</strong><span className="mt-1 block text-sm font-normal">Un voisin peut candidater à votre besoin.</span></button>
              <button aria-pressed={type === 'offer'} className={`min-h-20 rounded-lg border p-4 text-left transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200 ${type === 'offer' ? 'border-emerald-600 bg-emerald-50 text-emerald-950' : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'}`} onClick={() => setType('offer')} type="button"><strong className="block">Je propose mon aide</strong><span className="mt-1 block text-sm font-normal">Présentez une compétence aux habitants.</span></button>
            </fieldset>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Titre"><Input maxLength={120} name="title" placeholder="Ex. Aide pour monter un meuble" required /></FormField>
              <FormField label="Catégorie"><Input list="service-categories" name="category" placeholder="Bricolage, jardinage…" required /><datalist id="service-categories"><option value="Bricolage" /><option value="Animaux" /><option value="Jardinage" /><option value="Cours" /><option value="Informatique" /></datalist></FormField>
            </div>
            <FormField label="Description"><Textarea maxLength={1200} minLength={20} name="description" placeholder="Précisez le contexte, ce qui est attendu et les informations utiles." required rows={5} /></FormField>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Disponibilité"><Input name="availability" placeholder="Ex. Samedi matin ou à convenir" required /></FormField>
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
                <p className="text-xs font-bold uppercase text-emerald-700">Quartier de publication</p>
                <p className="mt-1 font-extrabold text-emerald-950">{neighborhood.neighborhood.name}</p>
                <p className="mt-0.5 text-sm text-emerald-800">{neighborhood.neighborhood.city}{neighborhood.neighborhood.postalCodes?.length ? ` · ${neighborhood.neighborhood.postalCodes.join(', ')}` : ''}</p>
              </div>
            </div>
          </Card>

          <Card className="grid gap-4">
            <div><h2 className="text-lg font-extrabold text-slate-950">Échange</h2><p className="mt-1 text-sm text-slate-600">Un service payant donnera lieu à un contrat après acceptation d’une candidature.</p></div>
            <div className="grid gap-2 sm:grid-cols-2">
              <button aria-pressed={!isPaid} className={`min-h-16 rounded-lg border p-3 text-left text-sm font-bold ${!isPaid ? 'border-emerald-600 bg-emerald-50 text-emerald-950' : 'border-slate-200'}`} onClick={() => setIsPaid(false)} type="button">Service gratuit</button>
              <button aria-pressed={isPaid} className={`min-h-16 rounded-lg border p-3 text-left text-sm font-bold ${isPaid ? 'border-emerald-600 bg-emerald-50 text-emerald-950' : 'border-slate-200'}`} onClick={() => setIsPaid(true)} type="button">Service en points</button>
            </div>
            {isPaid ? <div className="max-w-xs"><FormField label="Nombre de points"><Input min={1} name="pricePoints" placeholder="25" required type="number" /></FormField></div> : null}
          </Card>

          <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end">
            <Link className={buttonStyles('ghost')} to="/services">Annuler</Link>
            <Button disabled={pending} onClick={() => { intentRef.current = 'draft'; }} type="submit" variant="secondary">{pending ? 'Enregistrement…' : 'Enregistrer comme brouillon'}</Button>
            <Button disabled={pending} onClick={() => { intentRef.current = 'publish'; }} type="submit" variant="primary">{pending ? 'Publication…' : 'Publier maintenant'}</Button>
          </div>
        </form>
      ) : null}
    </PageContainer>
  );
}
