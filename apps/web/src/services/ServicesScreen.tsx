import { useMemo, useState } from 'react';
import type { ChangeEvent, SyntheticEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useAuth } from '../auth/useAuth';
import {
  acceptService,
  completeContract,
  createService,
  getContracts,
  getPointTransactions,
  getServices,
  signContract,
} from './api';
import type { ContractItem, CreateServiceInput, ServiceItem } from './types';

const initialForm: CreateServiceInput = {
  title: '',
  description: '',
  type: 'offer',
  category: '',
  availability: '',
  neighborhoodId: 'quartier-centre',
  isPaid: false,
  pricePoints: 0,
};

const pageStyle = {
  maxWidth: 1180,
  margin: '0 auto',
  padding: '2rem',
  fontFamily: 'Arial, sans-serif',
} as const;

const panelStyle = {
  border: '1px solid #ddd',
  borderRadius: 8,
  padding: '1.25rem',
  background: '#fff',
} as const;

export function ServicesScreen() {
  const { user, logout } = useAuth();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<CreateServiceInput>(initialForm);

  const servicesQuery = useQuery({
    queryKey: ['services'],
    queryFn: getServices,
  });

  const contractsQuery = useQuery({
    queryKey: ['contracts'],
    queryFn: getContracts,
  });

  const transactionsQuery = useQuery({
    queryKey: ['point-transactions'],
    queryFn: getPointTransactions,
  });

  const createMutation = useMutation({
    mutationFn: createService,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['services'] });
      setForm(initialForm);
    },
  });

  const acceptMutation = useMutation({
    mutationFn: acceptService,
    onSuccess: async () => {
      await invalidateWorkflowQueries(queryClient);
    },
  });

  const signMutation = useMutation({
    mutationFn: signContract,
    onSuccess: async () => {
      await invalidateWorkflowQueries(queryClient);
    },
  });

  const completeMutation = useMutation({
    mutationFn: completeContract,
    onSuccess: async () => {
      await invalidateWorkflowQueries(queryClient);
    },
  });

  const loadingText = useMemo(() => {
    if (servicesQuery.isLoading) return 'Chargement des services...';
    if (contractsQuery.isLoading) return 'Chargement des contrats...';
    if (createMutation.isPending) return 'Création du service en cours...';
    if (acceptMutation.isPending) return 'Acceptation du service...';
    if (signMutation.isPending) return 'Signature du contrat...';
    if (completeMutation.isPending) return 'Clôture du contrat...';
    return null;
  }, [
    acceptMutation.isPending,
    completeMutation.isPending,
    contractsQuery.isLoading,
    createMutation.isPending,
    servicesQuery.isLoading,
    signMutation.isPending,
  ]);

  const errorText =
    getMutationError(createMutation.error) ??
    getMutationError(acceptMutation.error) ??
    getMutationError(signMutation.error) ??
    getMutationError(completeMutation.error) ??
    getQueryError(servicesQuery.error) ??
    getQueryError(contractsQuery.error) ??
    getQueryError(transactionsQuery.error);

  function handleChange(
    event: ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) {
    const target = event.currentTarget;
    const { name, value } = target;

    if (target instanceof HTMLInputElement && target.type === 'checkbox') {
      setForm((current) => ({
        ...current,
        [name]: target.checked,
      }));
      return;
    }

    if (name === 'pricePoints') {
      setForm((current) => ({
        ...current,
        pricePoints: Number(value),
      }));
      return;
    }

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function handleSubmit(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();

    createMutation.mutate({
      ...form,
      pricePoints: form.isPaid ? Number(form.pricePoints ?? 0) : undefined,
    });
  }

  return (
    <div style={pageStyle}>
      <header
        style={{
          marginBottom: '2rem',
          display: 'flex',
          justifyContent: 'space-between',
          gap: '1rem',
          alignItems: 'center',
        }}
      >
        <div>
          <h1 style={{ marginBottom: 8 }}>Connected Neighbours</h1>
          <p>
            Connecté en tant que <strong>{user?.displayName}</strong> (
            {user?.role}) · {user?.pointsBalance ?? 0} points ·{' '}
            {user?.reservedPoints ?? 0} réservés
          </p>
        </div>

        <button onClick={logout}>Se déconnecter</button>
      </header>

      {loadingText && <p style={{ marginBottom: '1rem' }}>{loadingText}</p>}
      {errorText && (
        <p style={{ marginBottom: '1rem', color: 'crimson' }}>{errorText}</p>
      )}

      <main
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(280px, 360px) minmax(0, 1fr)',
          gap: '1.25rem',
          alignItems: 'start',
        }}
      >
        <section style={panelStyle}>
          <h2 style={{ marginTop: 0 }}>Créer un service</h2>

          <form
            onSubmit={handleSubmit}
            style={{ display: 'grid', gap: '0.75rem' }}
          >
            <input
              name="title"
              placeholder="Titre"
              value={form.title}
              onChange={handleChange}
              required
            />

            <textarea
              name="description"
              placeholder="Description"
              value={form.description}
              onChange={handleChange}
              required
              rows={4}
            />

            <select name="type" value={form.type} onChange={handleChange}>
              <option value="offer">Offre</option>
              <option value="request">Demande</option>
            </select>

            <input
              name="category"
              placeholder="Catégorie"
              value={form.category}
              onChange={handleChange}
              required
            />

            <input
              name="availability"
              placeholder="Disponibilité"
              value={form.availability}
              onChange={handleChange}
              required
            />

            <input
              name="neighborhoodId"
              placeholder="Quartier"
              value={form.neighborhoodId}
              onChange={handleChange}
              required
            />

            <label
              style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}
            >
              <input
                type="checkbox"
                name="isPaid"
                checked={form.isPaid}
                onChange={handleChange}
              />
              Service rémunéré en points
            </label>

            {form.isPaid && (
              <input
                type="number"
                name="pricePoints"
                min={1}
                placeholder="Points"
                value={form.pricePoints ?? 0}
                onChange={handleChange}
                required
              />
            )}

            <button type="submit" disabled={createMutation.isPending}>
              Créer le service
            </button>
          </form>
        </section>

        <div style={{ display: 'grid', gap: '1.25rem' }}>
          <section style={panelStyle}>
            <h2 style={{ marginTop: 0 }}>Services publiés</h2>

            {servicesQuery.isSuccess && servicesQuery.data.length === 0 && (
              <p>Aucun service publié pour le moment.</p>
            )}

            <div style={{ display: 'grid', gap: '1rem' }}>
              {servicesQuery.data?.map((item) => (
                <ServiceCard
                  key={item._id}
                  item={item}
                  currentUserId={user?.id}
                  onAccept={(serviceId) => acceptMutation.mutate(serviceId)}
                  isAccepting={acceptMutation.isPending}
                />
              ))}
            </div>
          </section>

          <section style={panelStyle}>
            <h2 style={{ marginTop: 0 }}>Mes contrats</h2>
            <div style={{ display: 'grid', gap: '1rem' }}>
              {contractsQuery.data?.map((contract) => (
                <ContractCard
                  key={contract._id}
                  contract={contract}
                  currentUserId={user?.id}
                  service={servicesQuery.data?.find(
                    (item) => item._id === contract.serviceId,
                  )}
                  onSign={(contractId) => signMutation.mutate(contractId)}
                  onComplete={(contractId) =>
                    completeMutation.mutate(contractId)
                  }
                  isPending={
                    signMutation.isPending || completeMutation.isPending
                  }
                />
              ))}
              {contractsQuery.isSuccess && contractsQuery.data.length === 0 && (
                <p>Aucun contrat pour le moment.</p>
              )}
            </div>
          </section>

          <section style={panelStyle}>
            <h2 style={{ marginTop: 0 }}>Mouvements de points</h2>
            <div style={{ display: 'grid', gap: '0.5rem' }}>
              {transactionsQuery.data?.slice(0, 6).map((transaction) => (
                <p key={transaction._id}>
                  <strong>{transaction.type}</strong> · {transaction.amount}{' '}
                  points · service {transaction.serviceId}
                </p>
              ))}
              {transactionsQuery.isSuccess &&
                transactionsQuery.data.length === 0 && (
                  <p>Aucun mouvement de points pour le moment.</p>
                )}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

function ServiceCard({
  item,
  currentUserId,
  isAccepting,
  onAccept,
}: {
  item: ServiceItem;
  currentUserId?: string;
  isAccepting: boolean;
  onAccept: (serviceId: string) => void;
}) {
  const canAccept = item.status === 'published' && item.ownerId !== currentUserId;

  return (
    <article style={panelStyle}>
      <h3 style={{ marginTop: 0 }}>{item.title}</h3>
      <p>{item.description}</p>
      <p>
        <strong>Type :</strong> {item.type === 'offer' ? 'Offre' : 'Demande'}
      </p>
      <p>
        <strong>Catégorie :</strong> {item.category}
      </p>
      <p>
        <strong>Disponibilité :</strong> {item.availability}
      </p>
      <p>
        <strong>Statut :</strong> {item.status}
      </p>
      <p>
        <strong>Points :</strong>{' '}
        {item.isPaid ? (item.pricePoints ?? 0) : 'gratuit'}
      </p>
      {canAccept && (
        <button disabled={isAccepting} onClick={() => onAccept(item._id)}>
          Accepter
        </button>
      )}
    </article>
  );
}

function ContractCard({
  contract,
  currentUserId,
  service,
  isPending,
  onSign,
  onComplete,
}: {
  contract: ContractItem;
  currentUserId?: string;
  service?: ServiceItem;
  isPending: boolean;
  onSign: (contractId: string) => void;
  onComplete: (contractId: string) => void;
}) {
  const hasSigned = !!currentUserId && contract.signedByIds.includes(currentUserId);
  const canSign = contract.status === 'sent' && !hasSigned;
  const canComplete = contract.status === 'active';

  return (
    <article style={panelStyle}>
      <h3 style={{ marginTop: 0 }}>
        {service?.title ?? `Contrat ${contract._id.slice(0, 8)}`}
      </h3>
      <p>
        <strong>Statut :</strong> {contract.status}
      </p>
      <p>
        <strong>Points :</strong> {contract.pricePoints}
      </p>
      <p>
        <strong>Signatures :</strong> {contract.signedByIds.length}/2
      </p>
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        {canSign && (
          <button disabled={isPending} onClick={() => onSign(contract._id)}>
            Signer
          </button>
        )}
        {canComplete && (
          <button disabled={isPending} onClick={() => onComplete(contract._id)}>
            Clôturer
          </button>
        )}
      </div>
    </article>
  );
}

async function invalidateWorkflowQueries(queryClient: ReturnType<typeof useQueryClient>) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: ['services'] }),
    queryClient.invalidateQueries({ queryKey: ['contracts'] }),
    queryClient.invalidateQueries({ queryKey: ['point-transactions'] }),
  ]);
}

function getMutationError(error: unknown) {
  return error instanceof Error ? error.message : null;
}

function getQueryError(error: unknown) {
  return error instanceof Error ? error.message : null;
}
