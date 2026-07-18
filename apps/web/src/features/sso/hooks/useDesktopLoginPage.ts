import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import { authorizeSso } from '../../../api/sso';
import { useAuth } from '../../../auth/useAuth';
import { getErrorMessage } from '../../../shared/utils/errors';

const LOOPBACK_HOSTS = ['127.0.0.1', 'localhost'];

function isLoopbackCallback(url: string) {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' && LOOPBACK_HOSTS.includes(parsed.hostname);
  } catch {
    return false;
  }
}

export function useDesktopLoginPage() {
  const { currentUser, handleSessionError } = useAuth();
  const [searchParams] = useSearchParams();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);

  const state = searchParams.get('state');
  const callback = searchParams.get('callback');
  const codeChallenge = searchParams.get('codeChallenge');

  const isValidRequest = Boolean(
    state && callback && codeChallenge && isLoopbackCallback(callback),
  );

  async function onConfirm() {
    if (!callback || !state || !codeChallenge) {
      return;
    }

    setIsPending(true);
    setError(null);

    try {
      const { code } = await authorizeSso({ callbackUrl: callback, codeChallenge });
      setConfirmed(true);
      window.location.href = `${callback}?code=${encodeURIComponent(code)}&state=${encodeURIComponent(state)}`;
    } catch (authorizeError) {
      if (handleSessionError(authorizeError)) {
        return;
      }

      setError(getErrorMessage(authorizeError));
    } finally {
      setIsPending(false);
    }
  }

  return { currentUser, isValidRequest, isPending, error, confirmed, onConfirm };
}
