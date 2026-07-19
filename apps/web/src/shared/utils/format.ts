const numberFormatter = new Intl.NumberFormat('fr-FR');
const dateFormatter = new Intl.DateTimeFormat('fr-FR', {
  dateStyle: 'short',
  timeStyle: 'short',
});
const timeFormatter = new Intl.DateTimeFormat('fr-FR', { timeStyle: 'short' });

export function formatNumber(value: number) {
  return numberFormatter.format(value);
}

export function formatDate(value?: string | Date | null) {
  if (!value) {
    return '-';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '-';
  }

  return dateFormatter.format(date);
}

export function formatTime(value?: string | Date | null) {
  if (!value) {
    return '-';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '-';
  }

  return timeFormatter.format(date);
}

export function getStatusTone(status: string) {
  if (
    [
      'published',
      'accepted',
      'active',
      'completed',
      'contract_active',
      'success',
      'transfer',
    ].includes(status)
  ) {
    return 'success';
  }

  if (
    [
      'draft',
      'submitted',
      'viewed',
      'sent',
      'reported',
      'open',
      'in_progress',
      'application_received',
      'candidate_selected',
      'awaiting_signatures',
      'reservation',
    ].includes(status)
  ) {
    return 'warning';
  }

  if (
    ['cancelled', 'rejected', 'withdrawn', 'disputed', 'closed', 'release'].includes(
      status,
    )
  ) {
    return 'danger';
  }

  return 'neutral';
}
