import { Link } from 'react-router-dom';

import type { EventItem } from '../../../api/events';
import { Badge } from '../../../components/ui/Badge';
import { buttonStyles } from '../../../components/ui/buttonStyles';
import { Card } from '../../../components/ui/Card';
import { Icon } from '../../../components/ui/Icon';
import { formatDate } from '../../../utils/format';
import { eventCategoryLabels, eventResponseLabels, eventStatusLabels } from '../localLifePresentation';

export function EventCard({ event }: { event: EventItem }) {
  const tone = event.effectiveStatus === 'cancelled' ? 'danger' : event.isFull ? 'warning' : 'success';
  return (
    <Card as="article" className="flex h-full flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone="info">{eventCategoryLabels[event.category]}</Badge>
        <Badge tone={tone}>{eventStatusLabels[event.effectiveStatus]}</Badge>
        {event.viewerResponse ? <Badge>{eventResponseLabels[event.viewerResponse.response]}</Badge> : null}
      </div>
      <div className="min-w-0 flex-1">
        <h2 className="text-lg font-extrabold text-slate-950">{event.title}</h2>
        <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">{event.description}</p>
      </div>
      <dl className="grid gap-2 text-sm text-slate-600">
        <div className="flex items-center gap-2"><Icon className="size-4 text-emerald-700" name="calendar" /><span>{formatDate(event.startsAt, { dateStyle: 'medium', timeStyle: 'short' })}</span></div>
        <div className="flex items-center gap-2"><Icon className="size-4 text-emerald-700" name="map-pin" /><span>{event.locationLabel} · {event.neighborhood?.name ?? 'Votre quartier'}</span></div>
        <div className="flex items-center gap-2"><Icon className="size-4 text-emerald-700" name="users" /><span>{event.counts.participants} participant{event.counts.participants > 1 ? 's' : ''}{event.counts.remainingPlaces !== null ? ` · ${event.counts.remainingPlaces} place(s) restante(s)` : ''}</span></div>
      </dl>
      <div className="flex items-center justify-between gap-3 border-t border-slate-100 pt-3">
        <span className="truncate text-xs font-semibold text-slate-500">Par {event.organizer?.displayName ?? 'un voisin'}</span>
        <Link className={buttonStyles('secondary', 'sm')} to={`/events/${event.id}`}>Consulter</Link>
      </div>
    </Card>
  );
}
