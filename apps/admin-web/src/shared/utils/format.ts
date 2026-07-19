const numberFormatter = new Intl.NumberFormat('fr-FR');
const dateFormatter = new Intl.DateTimeFormat('fr-FR', {
  dateStyle: 'short',
  timeStyle: 'short',
});

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

export function getStatusTone(status: string) {
  if (['active', 'completed', 'published', 'resolved', 'success'].includes(status)) {
    return 'success';
  }

  if (['open', 'sent', 'draft', 'reported', 'in_progress', 'created'].includes(status)) {
    return 'warning';
  }

  if (['cancelled', 'rejected', 'disputed', 'error', 'closed'].includes(status)) {
    return 'danger';
  }

  return 'neutral';
}
