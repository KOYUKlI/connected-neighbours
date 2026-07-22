import { useState, type FormEvent } from 'react';

import type { AdminAlertRow, AlertSeverityInput } from '../../../api/admin';

export function useAlertFormModal(
  alert: AdminAlertRow | null,
  onSubmit: (input: { title: string; details: string; severity: AlertSeverityInput }) => Promise<boolean>,
) {
  const [title, setTitle] = useState(alert?.title ?? '');
  const [details, setDetails] = useState(alert?.details ?? '');
  const [severity, setSeverity] = useState<AlertSeverityInput>(
    (alert?.severity as AlertSeverityInput) ?? 'medium',
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await onSubmit({ title: title.trim(), details: details.trim(), severity });
  }

  return { title, setTitle, details, setDetails, severity, setSeverity, handleSubmit };
}
