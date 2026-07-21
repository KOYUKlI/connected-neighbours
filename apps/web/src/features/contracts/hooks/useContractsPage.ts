import { useCallback, useState } from "react";

import { cancelContract, getContracts } from "../../../api/contracts";
import type { ContractItem } from "../../../api/contracts";
import { getServices } from "../../../api/services";
import type { ServiceItem } from "../../../api/services";
import { useAuth } from "../../../auth/useAuth";
import { useResource } from "../../../shared/hooks/useResource";
import { getErrorMessage } from "../../../shared/utils/errors";
import { getEntityId } from "../../../shared/utils/entities";

type ContractsPageData = {
  contracts: ContractItem[];
  serviceById: Map<string, ServiceItem>;
};

const initialValue: ContractsPageData = {
  contracts: [],
  serviceById: new Map(),
};

export function useContractsPage() {
  const { handleSessionError } = useAuth();
  const [actionPending, setActionPending] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const fetcher = useCallback(async (): Promise<ContractsPageData> => {
    const [contracts, services] = await Promise.all([
      getContracts(),
      getServices(),
    ]);
    const serviceById = new Map(
      services.map((service) => [getEntityId(service), service] as const),
    );

    return { contracts, serviceById };
  }, []);

  const {
    data,
    isLoading,
    error: loadError,
    reload,
  } = useResource(fetcher, initialValue);

  async function runAction(label: string, action: () => Promise<unknown>) {
    setActionPending(label);
    setActionError(null);

    try {
      await action();
      reload();
      return true;
    } catch (error) {
      if (handleSessionError(error)) {
        return false;
      }

      setActionError(getErrorMessage(error));
      return false;
    } finally {
      setActionPending(null);
    }
  }

  return {
    contracts: data.contracts,
    serviceById: data.serviceById,
    isLoading,
    error: actionError ?? loadError,
    actionPending,
    onCancelContract: (id: string) =>
      runAction("cancel-contract", () => cancelContract(id)),
  };
}
