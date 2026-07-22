import { useState } from 'react';
import type { FormEvent } from 'react';

import type { AuthUser } from '../../../api/auth';
import type {
  CreateIncidentInput,
  IncidentSeverity,
  IncidentType,
} from '../../../api/incidents';

export function useIncidentForm(
  currentUser: AuthUser | null,
  onCreate: (input: CreateIncidentInput) => Promise<boolean>,
) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<IncidentType>('security');
  const [severity, setSeverity] = useState<IncidentSeverity>('medium');
  const [neighborhoodId, setNeighborhoodId] = useState(
    currentUser?.neighborhoodId ?? 'quartier-centre',
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const success = await onCreate({ title, description, type, severity, neighborhoodId });

    if (success) {
      setTitle('');
      setDescription('');
    }
  }

  return {
    title,
    setTitle,
    description,
    setDescription,
    type,
    setType,
    severity,
    setSeverity,
    neighborhoodId,
    setNeighborhoodId,
    handleSubmit,
  };
}
