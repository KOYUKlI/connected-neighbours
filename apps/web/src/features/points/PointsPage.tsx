import type { PointTransaction } from '../../api/points';
import { DataTable } from '../../shared/components/DataTable';
import type { TableColumn } from '../../shared/components/DataTable';
import { MetricCard } from '../../shared/components/MetricCard';
import { MonoValue } from '../../shared/components/MonoValue';
import { StatusBadge } from '../../shared/components/StatusBadge';
import { formatDate, formatNumber } from '../../shared/utils/format';
import { getEntityId } from '../../shared/utils/entities';
import { usePointsPage } from './hooks/usePointsPage';

export function PointsPage() {
  const { data, isLoading, error } = usePointsPage();

  if (isLoading) {
    return <div className="loading-panel">Chargement...</div>;
  }

  if (error) {
    return <div className="error-banner">{error}</div>;
  }

  const { pointBalance, pointTransactions } = data;

  const columns: TableColumn<PointTransaction>[] = [
    { header: 'Type', render: (transaction) => <StatusBadge value={transaction.type} /> },
    {
      header: 'Montant',
      render: (transaction) => `${formatNumber(transaction.amount)} points`,
      className: 'numeric-cell',
    },
    { header: 'Service', render: (transaction) => <MonoValue value={transaction.serviceId} /> },
    { header: 'Contrat', render: (transaction) => <MonoValue value={transaction.contractId} /> },
    { header: 'Date', render: (transaction) => formatDate(transaction.createdAt) },
  ];

  return (
    <div className="stack">
      <div className="dashboard-grid">
        <MetricCard
          detail="Solde utilisable"
          label="Disponible"
          value={pointBalance?.availablePoints ?? 0}
        />
        <MetricCard
          detail="En attente de contrat"
          label="Reserve"
          value={pointBalance?.reservedPoints ?? 0}
        />
        <MetricCard
          detail="Solde brut API"
          label="Balance"
          value={pointBalance?.pointsBalance ?? 0}
        />
      </div>
      <DataTable
        columns={columns}
        emptyMessage="Aucun mouvement de points."
        getRowKey={getEntityId}
        rows={pointTransactions}
      />
    </div>
  );
}
