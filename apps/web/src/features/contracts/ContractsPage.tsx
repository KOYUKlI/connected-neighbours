import type { ContractItem } from '../../api/contracts';
import { useAuth } from '../../auth/useAuth';
import { DataTable } from '../../shared/components/DataTable';
import type { TableColumn } from '../../shared/components/DataTable';
import { MonoValue } from '../../shared/components/MonoValue';
import { StatusBadge } from '../../shared/components/StatusBadge';
import { formatNumber } from '../../shared/utils/format';
import { getEntityId } from '../../shared/utils/entities';
import { ContractActions } from './components/ContractActions';
import { useContractsPage } from './hooks/useContractsPage';

export function ContractsPage() {
  const { currentUser } = useAuth();
  const {
    contracts,
    serviceById,
    isLoading,
    error,
    actionPending,
    onCancelContract,
    onCompleteContract,
    onSignContract,
  } = useContractsPage();

  if (isLoading) {
    return <div className="loading-panel">Chargement...</div>;
  }

  if (error) {
    return <div className="error-banner">{error}</div>;
  }

  const columns: TableColumn<ContractItem>[] = [
    {
      header: 'Service',
      render: (contract) =>
        serviceById.get(contract.serviceId)?.title ?? <MonoValue value={contract.serviceId} />,
    },
    { header: 'Statut', render: (contract) => <StatusBadge value={contract.status} /> },
    {
      header: 'Prix',
      render: (contract) => `${formatNumber(contract.pricePoints)} points`,
      className: 'numeric-cell',
    },
    {
      header: 'Signatures',
      render: (contract) => `${contract.signedByIds.length}/2`,
      className: 'numeric-cell',
    },
    {
      header: 'Parties',
      render: (contract) => (
        <span>
          <MonoValue value={contract.requesterId} /> / <MonoValue value={contract.providerId} />
        </span>
      ),
    },
    {
      header: 'Actions',
      render: (contract) => (
        <ContractActions
          actionPending={actionPending}
          contract={contract}
          currentUserId={currentUser?.id}
          onCancel={onCancelContract}
          onComplete={onCompleteContract}
          onSign={onSignContract}
        />
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      emptyMessage="Aucun contrat pour le moment."
      getRowKey={getEntityId}
      rows={contracts}
    />
  );
}
