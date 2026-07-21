import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { acceptApplication, createApplication, getApplicationsForService, getMyApplications, rejectApplication, withdrawApplication, type ServiceApplication } from '../api/applications';
import { createContractFromApplication, getContract, signContract, type ContractItem } from '../api/contracts';
import { getNeighborhoods, type NeighborhoodItem } from '../api/neighborhoods';
import {
  addServiceProof,
  cancelService,
  getService,
  getServiceProofs,
  markServiceDone,
  publishService,
  requestServiceCorrection,
  startService,
  validateService,
  type ServiceItem,
  type ServiceProof,
} from '../api/services';
import { useAuth } from '../auth/useAuth';
import { PageContainer } from '../components/layout/PageContainer';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { buttonStyles } from '../components/ui/buttonStyles';
import { Card } from '../components/ui/Card';
import { EmptyState } from '../components/ui/EmptyState';
import { ErrorMessage } from '../components/ui/ErrorMessage';
import { Icon } from '../components/ui/Icon';
import { Input } from '../components/ui/Input';
import { LoadingState } from '../components/ui/LoadingState';
import { Tabs } from '../components/ui/Tabs';
import { Textarea } from '../components/ui/Textarea';
import { getCategoryPresentation, getStatusTone } from '../features/services/servicePresentation';
import { getFriendlyError } from '../utils/errors';
import { formatDate, formatNeighborhood, getEntityId, serviceStatusLabels, serviceTypeLabels } from '../utils/format';
import { UserSummary } from '../components/ui/UserSummary';
import { ServiceExecutionPanel } from '../components/services/ServiceExecutionPanel';

type DetailTab = 'overview' | 'applications' | 'contract' | 'execution' | 'messages' | 'history';

export function ServiceDetailPage() {
  const { serviceId = '' } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [service, setService] = useState<ServiceItem | null>(null);
  const [neighborhoods, setNeighborhoods] = useState<NeighborhoodItem[]>([]);
  const [applications, setApplications] = useState<ServiceApplication[]>([]);
  const [contract, setContract] = useState<ContractItem | null>(null);
  const [proofs, setProofs] = useState<ServiceProof[]>([]);
  const [proofsLoading, setProofsLoading] = useState(false);
  const [tab, setTab] = useState<DetailTab>('overview');
  const [loading, setLoading] = useState(true);
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!serviceId || !user) return;
    setError(null);
    try {
      const [nextService, nextNeighborhoods] = await Promise.all([getService(serviceId), getNeighborhoods()]);
      setService(nextService);
      setNeighborhoods(nextNeighborhoods);
      const canViewApplications =
        nextService.permissions?.canViewApplications ?? nextService.ownerId === user.id;
      const nextApplications = canViewApplications
        ? await getApplicationsForService(serviceId)
        : (await getMyApplications()).filter((item) => item.serviceId === serviceId);
      setApplications(nextApplications);
      if (nextService.permissions?.canViewProofs) {
        setProofsLoading(true);
        try {
          setProofs(await getServiceProofs(serviceId));
        } catch (caught) {
          setProofs([]);
          setError(getFriendlyError(caught, 'Impossible de charger les preuves de réalisation.'));
        } finally {
          setProofsLoading(false);
        }
      } else {
        setProofs([]);
      }
      const contractId = nextService.contractSummary?.id ?? nextService.contractId;
      if (contractId && nextService.permissions?.canViewContract) {
        setContract(await getContract(contractId));
      } else {
        setContract(null);
      }
    } catch (caught) {
      setError(getFriendlyError(caught, 'Impossible de charger ce service. Il a peut-être été retiré.'));
    } finally {
      setLoading(false);
    }
  }, [serviceId, user]);

  useEffect(() => { void load(); }, [load]);

  const isOwner = service?.viewer?.isOwner ?? service?.ownerId === user?.id;
  const myApplication = useMemo(() => applications.find((item) => item.applicantId === user?.id), [applications, user]);

  async function runAction(key: string, action: () => Promise<unknown>, message: string) {
    setPendingAction(key);
    setError(null);
    setSuccess(null);
    try {
      await action();
      setSuccess(message);
      await load();
      return true;
    } catch (caught) {
      setError(getFriendlyError(caught, 'Cette action n’a pas pu être effectuée. Réessayez dans quelques instants.'));
      return false;
    } finally {
      setPendingAction(null);
    }
  }

  async function handleApplication(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const proposedPrice = Number(form.get('proposedPricePoints') ?? 0);
    await runAction('apply', () => createApplication(serviceId, {
      message: String(form.get('message') ?? '').trim(),
      proposedDate: String(form.get('proposedDate') ?? '') || undefined,
      proposedPricePoints: proposedPrice > 0 ? proposedPrice : undefined,
    }), 'Votre candidature a bien été envoyée.');
  }

  if (loading) return <PageContainer><LoadingState message="Chargement du service…" /></PageContainer>;
  if (error && !service) return <PageContainer className="grid gap-4"><ErrorMessage message={error} /><Link className={buttonStyles('ghost', 'sm', 'w-fit')} to="/services">Retour aux services</Link></PageContainer>;
  if (!service || !user) return null;

  const category = getCategoryPresentation(service.category);
  const canApply = service.permissions?.canApply ?? (!isOwner && service.status === 'published' && !myApplication);
  const canPublish = service.permissions?.canPublish ?? (isOwner && service.status === 'draft');
  const canCancel = service.permissions?.canCancel ?? (isOwner && !['completed', 'cancelled'].includes(service.status));
  const canSign = contract && ['draft', 'sent'].includes(contract.status) && [contract.requesterId, contract.providerId].includes(user.id) && !contract.signedByIds.includes(user.id);

  const tabs = [
    { id: 'overview' as const, label: 'Présentation' },
    { id: 'applications' as const, label: 'Candidatures', count: applications.length || undefined },
    { id: 'contract' as const, label: 'Contrat' },
    ...(service.permissions?.canViewProofs ? [{ id: 'execution' as const, label: 'Réalisation', count: proofs.length || undefined }] : []),
    { id: 'messages' as const, label: 'Messages' },
    { id: 'history' as const, label: 'Historique' },
  ];

  return (
    <PageContainer className="grid gap-6">
      <button className="inline-flex min-h-11 w-fit items-center gap-2 rounded-lg text-sm font-bold text-slate-600 hover:text-emerald-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200" onClick={() => navigate(-1)} type="button"><Icon className="size-4" name="arrow-left" /> Retour</button>
      {error ? <ErrorMessage message={error} /> : null}
      {success ? <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800" role="status">{success}</div> : null}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="min-w-0">
          <div className="flex flex-wrap gap-2"><Badge tone={service.type === 'request' ? 'info' : 'success'}>{serviceTypeLabels[service.type]}</Badge><Badge tone={getStatusTone(service.status)}>{serviceStatusLabels[service.status]}</Badge><Badge>{category.label}</Badge></div>
          <h1 className="mt-3 text-2xl font-extrabold leading-tight text-slate-950 sm:text-4xl">{service.title}</h1>
          <p className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-slate-600"><span className="inline-flex items-center gap-1.5"><Icon className="size-4" name="map-pin" />{formatNeighborhood(service.neighborhoodId, neighborhoods, service)}</span><span className="inline-flex items-center gap-1.5"><Icon className="size-4" name="clock" />{service.availability || 'À convenir'}</span></p>
        </div>
        <Card className="grid content-start gap-4 lg:row-span-2">
          <div className="flex items-center justify-between gap-3"><span className={`grid size-11 place-items-center rounded-lg ${category.surface}`}><Icon className="size-5" name={category.icon} /></span><strong className="text-lg text-slate-950">{service.isPaid ? `${service.pricePoints ?? 0} points` : 'Gratuit'}</strong></div>
          {isOwner ? <p className="rounded-lg bg-emerald-50 p-3 text-sm font-semibold text-emerald-900">C’est votre annonce. Vous pouvez suivre les candidatures et le contrat depuis cette page.</p> : null}
          {canApply ? <Button onClick={() => setTab('applications')} variant="primary">Candidater</Button> : null}
          {myApplication ? <div className="rounded-lg bg-blue-50 p-3 text-sm text-blue-900"><strong>Candidature envoyée</strong><span className="mt-1 block">Statut : {myApplication.status === 'accepted' ? 'acceptée' : myApplication.status === 'rejected' ? 'refusée' : 'en attente'}</span></div> : null}
          {canPublish ? <Button disabled={pendingAction === 'publish'} onClick={() => void runAction('publish', () => publishService(serviceId), 'Votre service est maintenant publié.')} variant="primary">Publier l’annonce</Button> : null}
          {canCancel ? <Button disabled={pendingAction === 'cancel'} onClick={() => void runAction('cancel', () => cancelService(serviceId), 'Votre service a été annulé.')} variant="danger">Annuler l’annonce</Button> : null}
          <div className="border-t border-slate-100 pt-4"><p className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-500">Publié par</p><UserSummary name={isOwner ? user.displayName ?? 'Vous' : service.owner?.displayName ?? 'Utilisateur inconnu'} subtitle={service.owner?.completedServicesCount ? `${service.owner.completedServicesCount} service${service.owner.completedServicesCount > 1 ? 's' : ''} terminé${service.owner.completedServicesCount > 1 ? 's' : ''}` : 'Profil public du quartier'} /></div>
        </Card>
      </div>

      <Tabs items={tabs} label="Détails du service" onChange={setTab} value={tab} />

      {tab === 'overview' ? (
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <Card><h2 className="text-lg font-extrabold text-slate-950">Description</h2><p className="mt-3 whitespace-pre-line text-sm leading-7 text-slate-700">{service.description}</p></Card>
          <Card><h2 className="text-lg font-extrabold text-slate-950">Informations pratiques</h2><dl className="mt-4 grid gap-3 text-sm"><div><dt className="font-semibold text-slate-500">Disponibilité</dt><dd className="mt-1 text-slate-900">{service.availability || 'À convenir'}</dd></div><div><dt className="font-semibold text-slate-500">Quartier</dt><dd className="mt-1 text-slate-900">{formatNeighborhood(service.neighborhoodId, neighborhoods, service)}</dd></div><div><dt className="font-semibold text-slate-500">Échange</dt><dd className="mt-1 text-slate-900">{service.isPaid ? `${service.pricePoints ?? 0} points, avec contrat après acceptation` : 'Service gratuit'}</dd></div></dl></Card>
        </div>
      ) : null}

      {tab === 'applications' ? (
        <section className="grid gap-4">
          {canApply ? <Card><h2 className="text-lg font-extrabold text-slate-950">Proposer votre aide</h2><p className="mt-1 text-sm text-slate-600">Présentez brièvement votre disponibilité au propriétaire.</p><form className="mt-5 grid gap-4" onSubmit={handleApplication}><label className="grid gap-2 text-sm font-bold text-slate-900">Votre message<Textarea minLength={10} name="message" placeholder="Bonjour, je suis disponible et j’ai l’habitude de…" required rows={4} /></label><div className="grid gap-4 sm:grid-cols-2"><label className="grid gap-2 text-sm font-bold text-slate-900">Date proposée<Input name="proposedDate" type="datetime-local" /></label>{service.isPaid ? <label className="grid gap-2 text-sm font-bold text-slate-900">Points proposés<Input defaultValue={service.pricePoints ?? undefined} min={1} name="proposedPricePoints" type="number" /></label> : null}</div><Button className="w-fit" disabled={pendingAction === 'apply'} type="submit" variant="primary">{pendingAction === 'apply' ? 'Envoi…' : 'Envoyer ma candidature'}</Button></form></Card> : null}
          {!isOwner && myApplication ? <Card><div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="font-extrabold text-slate-950">Votre candidature</h2><p className="mt-1 text-sm text-slate-600">{myApplication.message}</p></div>{['submitted', 'viewed'].includes(myApplication.status) ? <Button disabled={pendingAction === getEntityId(myApplication)} onClick={() => void runAction(getEntityId(myApplication), () => withdrawApplication(getEntityId(myApplication)), 'Votre candidature a été retirée.')} variant="danger">Retirer</Button> : <Badge tone={myApplication.status === 'accepted' ? 'success' : 'neutral'}>{myApplication.status === 'accepted' ? 'Acceptée' : 'Clôturée'}</Badge>}</div></Card> : null}
          {isOwner && applications.length > 0 ? applications.map((application, index) => <Card as="article" className="grid gap-4 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-start" key={getEntityId(application)}><span className="grid size-10 place-items-center rounded-full bg-blue-50 text-xs font-extrabold text-blue-700">C{index + 1}</span><div><div className="flex flex-wrap items-center gap-2"><h2 className="font-extrabold text-slate-950">{application.applicant?.displayName ?? 'Candidat du quartier'}</h2><Badge tone={application.status === 'accepted' ? 'success' : application.status === 'rejected' ? 'danger' : 'info'}>{application.status === 'accepted' ? 'Acceptée' : application.status === 'rejected' ? 'Refusée' : 'À étudier'}</Badge></div><p className="mt-2 text-sm leading-6 text-slate-600">{application.message}</p>{application.proposedPricePoints ? <p className="mt-2 text-sm font-bold text-slate-900">Proposition : {application.proposedPricePoints} points</p> : null}</div><div className="flex flex-wrap gap-2 sm:justify-end">{['submitted', 'viewed'].includes(application.status) ? <><Button disabled={pendingAction === getEntityId(application)} onClick={() => void runAction(getEntityId(application), () => acceptApplication(getEntityId(application)), 'La candidature a été acceptée.')} size="sm" variant="primary">Accepter</Button><Button disabled={pendingAction === getEntityId(application)} onClick={() => void runAction(getEntityId(application), () => rejectApplication(getEntityId(application)), 'La candidature a été refusée.')} size="sm" variant="ghost">Refuser</Button></> : null}{application.status === 'accepted' && !service.contractSummary && !service.contractId && service.isPaid && (service.permissions?.canGenerateContract ?? true) ? <Button disabled={pendingAction === `contract-${getEntityId(application)}`} onClick={() => void runAction(`contract-${getEntityId(application)}`, () => createContractFromApplication(getEntityId(application)), 'Le contrat a été généré.')} size="sm" variant="secondary">Générer le contrat</Button> : null}</div></Card>) : null}
          {isOwner && applications.length === 0 ? <EmptyState icon="users" message="Les candidatures apparaîtront ici après la publication de votre annonce." title="Aucune candidature reçue" /> : null}
        </section>
      ) : null}

      {tab === 'contract' ? contract ? (
        <Card className="grid gap-5"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-wide text-slate-500">Contrat lié au service</p><h2 className="mt-1 text-lg font-extrabold text-slate-950">{contract.status === 'active' ? 'Contrat actif' : contract.status === 'completed' ? 'Contrat terminé' : 'En attente de signatures'}</h2></div><Badge tone={contract.status === 'active' || contract.status === 'completed' ? 'success' : 'warning'}>{contract.status === 'active' ? 'Actif' : contract.status === 'completed' ? 'Terminé' : 'À signer'}</Badge></div><dl className="grid gap-4 rounded-lg bg-slate-50 p-4 sm:grid-cols-3"><div><dt className="text-xs font-semibold text-slate-500">Points</dt><dd className="mt-1 font-extrabold text-slate-950">{contract.pricePoints}</dd></div><div><dt className="text-xs font-semibold text-slate-500">Signatures</dt><dd className="mt-1 font-extrabold text-slate-950">{contract.signedByIds.length}/2</dd></div><div><dt className="text-xs font-semibold text-slate-500">Créé le</dt><dd className="mt-1 font-extrabold text-slate-950">{formatDate(contract.createdAt)}</dd></div></dl>{canSign ? <div className="rounded-lg border border-amber-200 bg-amber-50 p-4"><p className="text-sm leading-6 text-amber-900">En signant, vous confirmez les conditions du service et le montant en points.</p><Button className="mt-3" disabled={pendingAction === 'sign'} onClick={() => void runAction('sign', () => signContract(getEntityId(contract)), 'Votre signature a été enregistrée.')} variant="primary">Signer le contrat</Button></div> : null}</Card>
      ) : <EmptyState icon="contract" message={service.isPaid ? 'Le contrat sera généré après l’acceptation d’une candidature.' : 'Un service gratuit ne nécessite pas de contrat payant.'} title="Aucun contrat pour le moment" /> : null}

      {tab === 'execution' ? (
        <ServiceExecutionPanel
          onAddProof={(message) => runAction('proof', () => addServiceProof(serviceId, { type: 'note', message }), 'La preuve a été ajoutée.')}
          onMarkDone={() => runAction('mark-done', () => markServiceDone(serviceId), 'Le service attend maintenant la validation du demandeur.')}
          onRequestCorrection={(reason) => runAction('correction', () => requestServiceCorrection(serviceId, reason), 'La demande de correction a été envoyée.')}
          onStart={() => runAction('start', () => startService(serviceId), 'Le service a démarré.')}
          onValidate={() => runAction('validate', () => validateService(serviceId), 'La réalisation est validée et les points ont été transférés.')}
          currentUserId={user.id}
          pendingAction={pendingAction}
          proofs={proofs}
          proofsLoading={proofsLoading}
          service={service}
        />
      ) : null}

      {tab === 'messages' ? <EmptyState icon="message" message="La messagerie persistante sera intégrée dans un prochain lot. Vous ne perdrez aucune donnée ici : aucun faux message n’est enregistré." title="Messagerie en préparation" /> : null}

      {tab === 'history' ? <Card><h2 className="text-lg font-extrabold text-slate-950">Historique disponible</h2><ol className="mt-5 grid gap-4 border-l-2 border-emerald-100 pl-5"><li><p className="text-sm font-bold text-slate-950">Service créé</p><p className="mt-1 text-sm text-slate-500">{formatDate(service.createdAt, { dateStyle: 'long', timeStyle: 'short' })}</p></li>{service.updatedAt && service.updatedAt !== service.createdAt ? <li><p className="text-sm font-bold text-slate-950">Dernière mise à jour</p><p className="mt-1 text-sm text-slate-500">{formatDate(service.updatedAt, { dateStyle: 'long', timeStyle: 'short' })}</p></li> : null}<li><p className="text-sm font-bold text-slate-950">Statut actuel : {serviceStatusLabels[service.status]}</p><p className="mt-1 text-sm text-slate-500">Seules les étapes confirmées par l’API sont affichées.</p></li></ol></Card> : null}
    </PageContainer>
  );
}
