import type { AuthUser } from '../../../api/auth';
import type { CreateApplicationInput, ServiceApplication } from '../../../api/applications';
import type { ServiceItem } from '../../../api/services';
import { MonoValue } from '../../../shared/components/MonoValue';
import { StatusBadge } from '../../../shared/components/StatusBadge';
import { formatDate } from '../../../shared/utils/format';
import { getEntityId } from '../../../shared/utils/entities';
import { ApplicationForm } from './ApplicationForm';
import { ReceivedApplicationsList } from './ReceivedApplicationsList';

type ServiceCardProps = {
  actionPending: string | null;
  currentUser: AuthUser | null;
  myApplication?: ServiceApplication;
  onAcceptApplication: (id: string) => Promise<boolean>;
  onApply: (serviceId: string, input: CreateApplicationInput) => Promise<boolean>;
  onCancelService: (id: string) => Promise<boolean>;
  onGenerateContract: (id: string) => Promise<boolean>;
  onPublishService: (id: string) => Promise<boolean>;
  onRejectApplication: (id: string) => Promise<boolean>;
  receivedApplications: ServiceApplication[];
  service: ServiceItem;
};

function isActiveApplication(status?: string | null) {
  return status ? ['submitted', 'viewed', 'accepted'].includes(status) : false;
}

export function ServiceCard({
  actionPending,
  currentUser,
  myApplication,
  onAcceptApplication,
  onApply,
  onCancelService,
  onGenerateContract,
  onPublishService,
  onRejectApplication,
  receivedApplications,
  service,
}: ServiceCardProps) {
  const serviceId = getEntityId(service);
  const isOwner = service.ownerId === currentUser?.id;
  const canApply =
    !isOwner &&
    service.status === 'published' &&
    !isActiveApplication(myApplication?.status);
  const canPublish = isOwner && service.status === 'draft';
  const canCancel = isOwner && !['completed', 'cancelled'].includes(service.status);

  return (
    <article className="service-card">
      <div className="card-heading">
        <div>
          <h3>{service.title}</h3>
          <p>{service.description}</p>
        </div>
        <StatusBadge value={service.status} />
      </div>

      <dl className="details-grid">
        <div>
          <dt>Categorie</dt>
          <dd>{service.category}</dd>
        </div>
        <div>
          <dt>Type</dt>
          <dd>{service.type === 'request' ? 'Demande' : 'Offre'}</dd>
        </div>
        <div>
          <dt>Prix</dt>
          <dd>{service.isPaid ? `${service.pricePoints ?? 0} points` : 'Gratuit'}</dd>
        </div>
        <div>
          <dt>Proprietaire</dt>
          <dd>
            <MonoValue value={service.ownerId} />
          </dd>
        </div>
        <div>
          <dt>Quartier</dt>
          <dd>{service.neighborhoodId}</dd>
        </div>
        <div>
          <dt>Creation</dt>
          <dd>{formatDate(service.createdAt)}</dd>
        </div>
      </dl>

      <div className="action-row">
        {canPublish ? (
          <button
            className="secondary-button"
            disabled={actionPending === 'publish-service'}
            onClick={() => void onPublishService(serviceId)}
            type="button"
          >
            Publier
          </button>
        ) : null}
        {canCancel ? (
          <button
            className="ghost-button danger"
            disabled={actionPending === 'cancel-service'}
            onClick={() => void onCancelService(serviceId)}
            type="button"
          >
            Annuler
          </button>
        ) : null}
      </div>

      {canApply ? (
        <ApplicationForm
          defaultPrice={service.pricePoints ?? undefined}
          isPending={actionPending === 'create-application'}
          onApply={(input) => onApply(serviceId, input)}
        />
      ) : null}

      {!isOwner && myApplication ? (
        <p className="inline-note">
          Candidature envoyee : <StatusBadge value={myApplication.status} />
        </p>
      ) : null}

      {isOwner ? (
        <ReceivedApplicationsList
          actionPending={actionPending}
          applications={receivedApplications}
          onAccept={onAcceptApplication}
          onGenerateContract={onGenerateContract}
          onReject={onRejectApplication}
          service={service}
        />
      ) : null}
    </article>
  );
}
