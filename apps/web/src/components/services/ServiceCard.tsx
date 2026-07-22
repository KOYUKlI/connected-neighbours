import { Link } from 'react-router-dom';

import type { NeighborhoodItem } from '../../api/neighborhoods';
import type { ServiceItem } from '../../api/services';
import { getCategoryPresentation, getStatusTone } from '../../features/services/servicePresentation';
import { formatNeighborhood, formatOwner, serviceStatusLabels, serviceTypeLabels, getEntityId } from '../../utils/format';
import { Badge } from '../ui/Badge';
import { buttonStyles } from '../ui/buttonStyles';
import { Card } from '../ui/Card';
import { Icon } from '../ui/Icon';

export function ServiceCard({
  currentUserId,
  neighborhoods,
  service,
}: {
  currentUserId?: string;
  neighborhoods: NeighborhoodItem[];
  service: ServiceItem;
}) {
  const id = getEntityId(service);
  const category = getCategoryPresentation(service.category);
  const isOwner = service.viewer?.isOwner ?? service.ownerId === currentUserId;

  return (
    <Card as="article" className="group flex min-h-full flex-col overflow-hidden p-0 transition hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-lg">
      <div className="flex items-start justify-between gap-3 border-b border-slate-100 p-4">
        <span className={`inline-flex size-11 shrink-0 items-center justify-center rounded-lg ${category.surface}`}>
          <Icon className="size-5" name={category.icon} />
        </span>
        <div className="flex flex-wrap justify-end gap-1.5">
          <Badge tone={service.type === 'request' ? 'info' : 'success'}>{serviceTypeLabels[service.type]}</Badge>
          <Badge tone={getStatusTone(service.status)}>{serviceStatusLabels[service.status]}</Badge>
        </div>
      </div>
      <div className="flex flex-1 flex-col p-4">
        <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">{category.label}</p>
        <h2 className="mt-1 text-lg font-extrabold leading-snug text-slate-950">
          <Link className="rounded focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200" to={`/services/${id}`}>{service.title}</Link>
        </h2>
        <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">{service.description}</p>
        <dl className="mt-4 grid gap-2 text-sm text-slate-600">
          <div className="flex items-center gap-2">
            <Icon className="size-4 shrink-0 text-slate-400" name="user" />
            <dt className="sr-only">Propriétaire</dt>
            <dd>
              {!isOwner && service.owner?.id ? (
                <Link className="font-semibold text-slate-700 hover:text-emerald-800" to={`/neighbors/${service.owner.id}`}>
                  {formatOwner(service, currentUserId)}
                </Link>
              ) : formatOwner(service, currentUserId)}
            </dd>
          </div>
          <div className="flex items-center gap-2"><Icon className="size-4 shrink-0 text-slate-400" name="map-pin" /><dt className="sr-only">Quartier</dt><dd>{formatNeighborhood(service.neighborhoodId, neighborhoods, service)}</dd></div>
          <div className="flex items-center gap-2"><Icon className="size-4 shrink-0 text-slate-400" name="clock" /><dt className="sr-only">Disponibilité</dt><dd className="line-clamp-1">{service.availability || 'À convenir'}</dd></div>
        </dl>
        <div className="mt-auto flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
          <strong className="inline-flex items-center gap-1.5 text-sm text-slate-950">
            <Icon className="size-4 text-amber-600" name="coins" />
            {service.isPaid ? `${service.pricePoints ?? 0} points` : 'Service gratuit'}
          </strong>
          <Link className={buttonStyles(isOwner ? 'secondary' : 'primary', 'sm')} to={`/services/${id}`}>
            {isOwner ? 'Gérer' : 'Consulter'}
          </Link>
        </div>
      </div>
    </Card>
  );
}
