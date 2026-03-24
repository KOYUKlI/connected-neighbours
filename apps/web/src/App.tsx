import { useMemo, useState } from 'react';
import type { ChangeEvent, SubmitEvent  } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { createService, getServices } from './services/api';
import type { CreateServiceInput } from './services/types';

const initialForm: CreateServiceInput = {
  title: '',
  description: '',
  type: 'offer',
  category: '',
  availability: '',
  neighborhoodId: 'quartier-centre',
  ownerId: 'user_123',
  isPaid: false,
  pricePoints: 0,
};

export default function App() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<CreateServiceInput>(initialForm);

  const servicesQuery = useQuery({
    queryKey: ['services'],
    queryFn: getServices,
  });

  const createMutation = useMutation({
    mutationFn: createService,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['services'] });
      setForm(initialForm);
    },
  });

  const loadingText = useMemo(() => {
    if (servicesQuery.isLoading) return 'Chargement des services...';
    if (createMutation.isPending) return 'Création du service en cours...';
    return null;
  }, [servicesQuery.isLoading, createMutation.isPending]);

  function handleChange(
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) {
    const target = event.target;
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

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();

    createMutation.mutate({
      ...form,
      pricePoints: form.isPaid ? Number(form.pricePoints ?? 0) : undefined,
    });
  }

  return (
    <div
      style={{
        maxWidth: 1100,
        margin: '0 auto',
        padding: '2rem',
        fontFamily: 'Arial, sans-serif',
      }}
    >
      <header style={{ marginBottom: '2rem' }}>
        <h1>Connected Neighbours</h1>
        <p>V1 - Gestion des services du quartier</p>
      </header>

      <section
        style={{
          border: '1px solid #ddd',
          borderRadius: 12,
          padding: '1.25rem',
          marginBottom: '2rem',
        }}
      >
        <h2>Créer un service</h2>

        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '0.75rem' }}>
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

          <input
            name="ownerId"
            placeholder="Identifiant utilisateur"
            value={form.ownerId}
            onChange={handleChange}
            required
          />

          <label style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
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
              min={0}
              placeholder="Points"
              value={form.pricePoints ?? 0}
              onChange={handleChange}
            />
          )}

          <button type="submit" disabled={createMutation.isPending}>
            Créer le service
          </button>
        </form>

        {loadingText && <p style={{ marginTop: '1rem' }}>{loadingText}</p>}

        {createMutation.isError && (
          <p style={{ marginTop: '1rem', color: 'crimson' }}>
            {(createMutation.error as Error).message}
          </p>
        )}
      </section>

      <section>
        <h2>Services publiés</h2>

        {servicesQuery.isError && (
          <p style={{ color: 'crimson' }}>
            {(servicesQuery.error as Error).message}
          </p>
        )}

        {servicesQuery.isSuccess && servicesQuery.data.length === 0 && (
          <p>Aucun service publié pour le moment.</p>
        )}

        <div style={{ display: 'grid', gap: '1rem' }}>
          {servicesQuery.data?.map((item) => (
            <article
              key={item._id}
              style={{
                border: '1px solid #ddd',
                borderRadius: 12,
                padding: '1rem',
              }}
            >
              <h3 style={{ marginTop: 0 }}>{item.title}</h3>
              <p>{item.description}</p>
              <p>
                <strong>Type :</strong> {item.type}
              </p>
              <p>
                <strong>Catégorie :</strong> {item.category}
              </p>
              <p>
                <strong>Disponibilité :</strong> {item.availability}
              </p>
              <p>
                <strong>Quartier :</strong> {item.neighborhoodId}
              </p>
              <p>
                <strong>Statut :</strong> {item.status}
              </p>
              <p>
                <strong>Points :</strong>{' '}
                {item.isPaid ? item.pricePoints ?? 0 : 'gratuit'}
              </p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}