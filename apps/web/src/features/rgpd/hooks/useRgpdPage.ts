import { useState } from 'react';

import { exportRgpdData } from '../../../api/rgpd';
import type { RgpdExport } from '../../../api/rgpd';
import { useAuth } from '../../../auth/useAuth';
import { getErrorMessage } from '../../../shared/utils/errors';

export function useRgpdPage() {
  const { handleSessionError } = useAuth();
  const [rgpdExport, setRgpdExport] = useState<RgpdExport | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onExport() {
    setIsPending(true);
    setError(null);

    try {
      setRgpdExport(await exportRgpdData());
    } catch (exportError) {
      if (handleSessionError(exportError)) {
        return;
      }

      setError(getErrorMessage(exportError));
    } finally {
      setIsPending(false);
    }
  }

  return { rgpdExport, isPending, error, onExport };
}
