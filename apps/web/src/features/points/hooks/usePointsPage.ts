import { useCallback } from 'react';

import { getPointBalance, getPointTransactions } from '../../../api/points';
import type { PointBalance, PointTransaction } from '../../../api/points';
import { useResource } from '../../../shared/hooks/useResource';

type PointsPageData = {
  pointBalance: PointBalance | null;
  pointTransactions: PointTransaction[];
};

const initialValue: PointsPageData = {
  pointBalance: null,
  pointTransactions: [],
};

export function usePointsPage() {
  const fetcher = useCallback(async (): Promise<PointsPageData> => {
    const [pointBalance, pointTransactions] = await Promise.all([
      getPointBalance(),
      getPointTransactions(),
    ]);

    return { pointBalance, pointTransactions };
  }, []);

  return useResource(fetcher, initialValue);
}
