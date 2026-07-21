import type { ServiceApplication } from '../../../api/applications';
import type { ServiceItem } from '../../../api/services';
import { StatusBadge } from '../../../shared/components/StatusBadge';
import { getEntityId } from '../../../shared/utils/entities';

type ReceivedApplicationsListProps = {
  actionPending: string | null;
  applications: ServiceApplication[];
  onAccept: (id: string) => Promise<boolean>;
  onGenerateContract: (id: string) => Promise<boolean>;
  onReject: (id: string) => Promise<boolean>;
  service: ServiceItem;
};

export function ReceivedApplicationsList({
  actionPending,
  applications,
  onAccept,
  onGenerateContract,
  onReject,
  service,
}: ReceivedApplicationsListProps) {
  if (applications.length === 0) {
    return <p className="inline-note">Aucune candidature recue pour ce service.</p>;
  }

  return (
    <div className="nested-panel">
      <h4>Candidatures recues</h4>
      <div className="stack compact">
        {applications.map((application) => {
          const applicationId = getEntityId(application);
          const canAccept = application.status === 'submitted';
          const canReject = ['submitted', 'viewed'].includes(application.status);
          const canGenerateContract =
            application.status === 'accepted' && !service.contractSummary && !service.contractId && (service.permissions?.canGenerateContract ?? true);

          return (
            <article className="application-row" key={applicationId}>
              <div>
                <p>
                  <strong>{application.applicant?.displayName ?? 'Candidat du quartier'}</strong>
                </p>
                <p>{application.message}</p>
                <p className="muted">
                  {application.proposedPricePoints ?? service.pricePoints ?? 0} points
                  proposes
                </p>
              </div>
              <div className="application-actions">
                <StatusBadge value={application.status} />
                {canAccept ? (
                  <button
                    className="secondary-button"
                    disabled={actionPending === 'accept-application'}
                    onClick={() => void onAccept(applicationId)}
                    type="button"
                  >
                    Accepter
                  </button>
                ) : null}
                {canReject ? (
                  <button
                    className="ghost-button"
                    disabled={actionPending === 'reject-application'}
                    onClick={() => void onReject(applicationId)}
                    type="button"
                  >
                    Rejeter
                  </button>
                ) : null}
                {canGenerateContract ? (
                  <button
                    className="primary-button"
                    disabled={actionPending === 'generate-contract'}
                    onClick={() => void onGenerateContract(applicationId)}
                    type="button"
                  >
                    Generer contrat
                  </button>
                ) : null}
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
