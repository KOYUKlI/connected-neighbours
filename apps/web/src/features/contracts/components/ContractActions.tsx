import { Link } from "react-router-dom";

import type { ContractItem } from "../../../api/contracts";
import { Button } from "../../../components/ui/Button";
import { buttonStyles } from "../../../components/ui/buttonStyles";
import { getEntityId } from "../../../shared/utils/entities";

type ContractActionsProps = {
  actionPending: string | null;
  contract: ContractItem;
  currentUserId?: string;
  onCancel: (id: string) => Promise<boolean>;
};

export function ContractActions({
  actionPending,
  contract,
  currentUserId,
  onCancel,
}: ContractActionsProps) {
  const contractId = getEntityId(contract);
  const isParty =
    contract.requesterId === currentUserId ||
    contract.providerId === currentUserId;
  const hasSigned = currentUserId
    ? contract.signedByIds.includes(currentUserId)
    : false;
  const canSign = isParty && contract.status === "sent" && !hasSigned;
  const canCancel =
    isParty && !["completed", "cancelled"].includes(contract.status);

  return (
    <div className="flex flex-wrap items-center gap-2">
      {canSign ? (
        <Link
          className={buttonStyles("secondary", "sm")}
          to={`/contracts/${contractId}/document`}
        >
          Signer le PDF
        </Link>
      ) : null}{" "}
      {contract.serviceId ? (
        <Link
          className={buttonStyles("ghost", "sm")}
          to={"/services/" + contract.serviceId}
        >
          {contract.status === "active"
            ? "Suivre la réalisation"
            : "Voir le service"}
        </Link>
      ) : null}
      {canCancel ? (
        <Button
          disabled={actionPending === "cancel-contract"}
          onClick={() => void onCancel(contractId)}
          size="sm"
          type="button"
          variant="danger"
        >
          Annuler
        </Button>
      ) : null}
    </div>
  );
}
