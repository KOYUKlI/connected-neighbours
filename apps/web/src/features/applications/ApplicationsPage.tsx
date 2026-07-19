import type { ServiceApplication } from '../../api/applications';
import { DataTable } from '../../shared/components/DataTable';
import type { TableColumn } from '../../shared/components/DataTable';
import { StatusBadge } from '../../shared/components/StatusBadge';
import { ValueOrDash } from '../../shared/components/ValueOrDash';
import { formatDate } from '../../shared/utils/format';
import { getEntityId } from '../../shared/utils/entities';
import { useMyApplicationsPage } from './hooks/useMyApplicationsPage';

export function ApplicationsPage() {
  const {
    myApplications,
    serviceById,
    isLoading,
    error,
    actionPending,
    onWithdrawApplication,
  } = useMyApplicationsPage();

  if (isLoading) {
    return <div className="loading-panel">Chargement...</div>;
  }

  if (error) {
    return <div className="error-banner">{error}</div>;
  }

  const columns: TableColumn<ServiceApplication>[] = [
    {
      header: 'Service',
      render: (application) =>
        serviceById.get(application.serviceId)?.title ?? application.serviceId,
    },
    { header: 'Statut', render: (application) => <StatusBadge value={application.status} /> },
    { header: 'Message', render: (application) => application.message },
    {
      header: 'Points',
      render: (application) => (
        <ValueOrDash value={application.proposedPricePoints ?? null} />
      ),
      className: 'numeric-cell',
    },
    {
      header: 'Creation',
      render: (application) => formatDate(application.createdAt),
    },
    {
      header: 'Action',
      render: (application) => {
        const applicationId = getEntityId(application);
        const canWithdraw = ['submitted', 'viewed'].includes(application.status);

        return canWithdraw ? (
          <button
            className="ghost-button"
            disabled={actionPending === 'withdraw-application'}
            onClick={() => void onWithdrawApplication(applicationId)}
            type="button"
          >
            Retirer
          </button>
        ) : (
          <span className="muted">-</span>
        );
      },
    },
  ];

  return (
    <DataTable
      columns={columns}
      emptyMessage="Aucune candidature envoyee."
      getRowKey={getEntityId}
      rows={myApplications}
    />
  );
}
