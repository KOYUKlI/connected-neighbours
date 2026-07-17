import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  acceptApplication,
  createApplication,
  getApplicationsForService,
  getMyApplications,
  rejectApplication,
} from '../../../api/applications';
import type { CreateApplicationInput, ServiceApplication } from '../../../api/applications';
import { createContractFromApplication } from '../../../api/contracts';
import {
  cancelService,
  createService,
  getServices,
  publishService,
} from '../../../api/services';
import type { CreateServiceInput, ServiceItem } from '../../../api/services';
import { useAuth } from '../../../auth/useAuth';
import { getEntityId } from '../../../shared/utils/entities';
import { getErrorMessage } from '../../../shared/utils/errors';

type ApplicationMap = Record<string, ServiceApplication[]>;

export function useServicesWorkflow() {
  const { currentUser, handleSessionError } = useAuth();

  const [services, setServices] = useState<ServiceItem[]>([]);
  const [myApplications, setMyApplications] = useState<ServiceApplication[]>([]);
  const [receivedApplications, setReceivedApplications] = useState<ApplicationMap>({});
  const [isLoading, setIsLoading] = useState(true);
  const [actionPending, setActionPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const serviceById = useMemo(() => {
    const entries = services.map((service) => [getEntityId(service), service] as const);
    return new Map(entries);
  }, [services]);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [nextServices, nextMyApplications] = await Promise.all([
        getServices(),
        getMyApplications(),
      ]);

      const ownServices = nextServices.filter(
        (service) => service.ownerId === currentUser?.id,
      );
      const ownApplicationEntries = await Promise.all(
        ownServices.map(async (service) => {
          const serviceId = getEntityId(service);
          const applications = await getApplicationsForService(serviceId).catch(
            () => [],
          );

          return [serviceId, applications] as const;
        }),
      );

      setServices(nextServices);
      setMyApplications(nextMyApplications);
      setReceivedApplications(Object.fromEntries(ownApplicationEntries));
    } catch (loadError) {
      if (handleSessionError(loadError)) {
        return;
      }

      setError(getErrorMessage(loadError));
    } finally {
      setIsLoading(false);
    }
  }, [currentUser?.id, handleSessionError]);

  useEffect(() => {
    void load();
  }, [load]);

  async function runAction(label: string, action: () => Promise<unknown>) {
    setActionPending(label);
    setError(null);
    setNotice(null);

    try {
      await action();
      await load();
      setNotice('Action realisee avec succes.');
      return true;
    } catch (actionError) {
      if (handleSessionError(actionError)) {
        return false;
      }

      setError(getErrorMessage(actionError));
      return false;
    } finally {
      setActionPending(null);
    }
  }

  return {
    services,
    myApplications,
    receivedApplications,
    serviceById,
    isLoading,
    actionPending,
    error,
    notice,
    reload: load,
    onCreateService: (input: CreateServiceInput) =>
      runAction('create-service', () => createService(input)),
    onPublishService: (id: string) =>
      runAction('publish-service', () => publishService(id)),
    onCancelService: (id: string) =>
      runAction('cancel-service', () => cancelService(id)),
    onCreateApplication: (serviceId: string, input: CreateApplicationInput) =>
      runAction('create-application', () => createApplication(serviceId, input)),
    onAcceptApplication: (id: string) =>
      runAction('accept-application', () => acceptApplication(id)),
    onRejectApplication: (id: string) =>
      runAction('reject-application', () => rejectApplication(id)),
    onGenerateContract: (id: string) =>
      runAction('generate-contract', () => createContractFromApplication(id)),
  };
}
