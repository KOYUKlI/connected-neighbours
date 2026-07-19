import { useCallback, useState } from 'react';

import { getMyApplications, withdrawApplication } from '../../../api/applications';
import type { ServiceApplication } from '../../../api/applications';
import { getServices } from '../../../api/services';
import type { ServiceItem } from '../../../api/services';
import { useAuth } from '../../../auth/useAuth';
import { useResource } from '../../../shared/hooks/useResource';
import { getErrorMessage } from '../../../shared/utils/errors';
import { getEntityId } from '../../../shared/utils/entities';

type ApplicationsPageData = {
  myApplications: ServiceApplication[];
  serviceById: Map<string, ServiceItem>;
};

const initialValue: ApplicationsPageData = {
  myApplications: [],
  serviceById: new Map(),
};

export function useMyApplicationsPage() {
  const { handleSessionError } = useAuth();
  const [actionPending, setActionPending] = useState<string | null>(null);

  const fetcher = useCallback(async (): Promise<ApplicationsPageData> => {
    const [myApplications, services] = await Promise.all([
      getMyApplications(),
      getServices(),
    ]);

    const serviceById = new Map(
      services.map((service) => [getEntityId(service), service] as const),
    );

    return { myApplications, serviceById };
  }, []);

  const { data, isLoading, error: loadError, reload } = useResource(fetcher, initialValue);
  const [actionError, setActionError] = useState<string | null>(null);

  async function onWithdrawApplication(id: string) {
    setActionPending('withdraw-application');
    setActionError(null);

    try {
      await withdrawApplication(id);
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
    myApplications: data.myApplications,
    serviceById: data.serviceById,
    isLoading,
    error: actionError ?? loadError,
    actionPending,
    onWithdrawApplication,
  };
}
