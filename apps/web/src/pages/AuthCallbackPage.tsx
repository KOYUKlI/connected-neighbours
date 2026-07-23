import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { takePostLoginRedirect } from '../auth/redirect';
import { useAuth } from '../auth/useAuth';
import { Button } from '../components/ui/Button';
import { ErrorMessage } from '../components/ui/ErrorMessage';
import { getFriendlyError } from '../utils/errors';

export function AuthCallbackPage() {
  const { authMode, completePendingIdentityLink, isReady, linkRequired, user } =
    useAuth();
  const navigate = useNavigate();
  const started = useRef(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isReady || started.current) return;
    started.current = true;

    async function finish() {
      try {
        if (authMode === 'local') {
          await completePendingIdentityLink();
        }
        if (linkRequired) {
          navigate('/login', { replace: true });
          return;
        }
        if (user || authMode === 'local') {
          navigate(takePostLoginRedirect(), { replace: true });
          return;
        }
        navigate('/login', { replace: true });
      } catch (caught) {
        setError(
          getFriendlyError(caught, 'Impossible de finaliser la connexion.'),
        );
      }
    }

    void finish();
  }, [
    authMode,
    completePendingIdentityLink,
    isReady,
    linkRequired,
    navigate,
    user,
  ]);

  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 px-4">
      <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 text-center shadow-sm">
        <span className="mx-auto grid size-12 place-items-center rounded-lg bg-emerald-800 text-sm font-black text-white">
          CN
        </span>
        <h1 className="mt-5 text-xl font-extrabold text-slate-950">
          Finalisation de la connexion
        </h1>
        {error ? (
          <div className="mt-4 grid gap-4 text-left">
            <ErrorMessage message={error} />
            <Button onClick={() => navigate('/login', { replace: true })} variant="secondary">
              Revenir à la connexion
            </Button>
          </div>
        ) : (
          <p className="mt-2 text-sm text-slate-600">
            Votre identité et vos droits sont vérifiés…
          </p>
        )}
      </div>
    </main>
  );
}