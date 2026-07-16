import { useCallback } from 'react';

import { getMyApplications } from '../../../api/applications';
import type { ServiceApplication } from '../../../api/applications';
import { getContracts } from '../../../api/contracts';
import type { ContractItem } from '../../../api/contracts';
import { getIncidents } from '../../../api/incidents';
import type { IncidentItem } from '../../../api/incidents';
import { getPointBalance } from '../../../api/points';
import type { PointBalance } from '../../../api/points';
import { getServices } from '../../../api/services';
import type { ServiceItem } from '../../../api/services';
import { useResource } from '../../../shared/hooks/useResource';

export type DashboardData = {
  services: ServiceItem[];
  myApplications: ServiceApplication[];
  contracts: ContractItem[];
  pointBalance: PointBalance | null;
  incidents: IncidentItem[];
};

const initialValue: DashboardData = {
  services: [],
  myApplications: [],
  contracts: [],
  pointBalance: null,
  incidents: [],
};

export function useDashboardData() {
  const fetcher = useCallback(async (): Promise<DashboardData> => {
    const [services, myApplications, contracts, pointBalance, incidents] =
      await Promise.all([
        getServices(),
        getMyApplications(),
        getContracts(),
        getPointBalance(),
        getIncidents(),
      ]);

    return { services, myApplications, contracts, pointBalance, incidents };
  }, []);

  return useResource(fetcher, initialValue);
}
