import type { ContractItem } from '../../../api/contracts';
import { getEntityId } from '../../../shared/utils/entities';

type ContractActionsProps = {
  actionPending: string | null;
  contract: ContractItem;
  currentUserId?: string;
  onCancel: (id: string) => Promise<boolean>;
  onComplete: (id: string) => Promise<boolean>;
  onSign: (id: string) => Promise<boolean>;
};

export function ContractActions({
  actionPending,
  contract,
  currentUserId,
  onCancel,
  onComplete,
  onSign,
}: ContractActionsProps) {
  const contractId = getEntityId(contract);
  const isParty =
    contract.requesterId === currentUserId || contract.providerId === currentUserId;
  const hasSigned = currentUserId
    ? contract.signedByIds.includes(currentUserId)
    : false;
  const canSign = isParty && contract.status === 'sent' && !hasSigned;
  const canComplete = isParty && contract.status === 'active';
  const canCancel = isParty && !['completed', 'cancelled'].includes(contract.status);

  return (
    <div className="action-row table-actions">
      {canSign ? (
        <button
          className="secondary-button"
          disabled={actionPending === 'sign-contract'}
          onClick={() => void onSign(contractId)}
          type="button"
        >
          Signer
        </button>
      ) : null}
      {canComplete ? (
        <button
          className="primary-button"
          disabled={actionPending === 'complete-contract'}
          onClick={() => void onComplete(contractId)}
          type="button"
        >
          Completer
        </button>
      ) : null}
      {canCancel ? (
        <button
          className="ghost-button danger"
          disabled={actionPending === 'cancel-contract'}
          onClick={() => void onCancel(contractId)}
          type="button"
        >
          Annuler
        </button>
      ) : null}
      {!canSign && !canComplete && !canCancel ? <span className="muted">-</span> : null}
    </div>
  );
}
