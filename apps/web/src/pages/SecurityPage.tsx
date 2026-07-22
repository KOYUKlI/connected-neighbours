import { useEffect, useState } from 'react';

import {
  getSecurityEvents,
  getSecuritySummary,
  type SecurityEvent,
  type SecuritySummary,
} from '../api/security';
import { useAuth } from '../auth/useAuth';
import { PageContainer } from '../components/layout/PageContainer';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { ErrorMessage } from '../components/ui/ErrorMessage';
import { LoadingState } from '../components/ui/LoadingState';
import { getFriendlyError } from '../utils/errors';

export function SecurityPage() {
  const { beginIdentityLink } = useAuth();
  const [summary, setSummary] = useState<SecuritySummary | null>(null);
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    Promise.all([getSecuritySummary(), getSecurityEvents()])
      .then(([nextSummary, nextEvents]) => {
        if (!active) return;
        setSummary(nextSummary);
        setEvents(nextEvents);
      })
      .catch((caught: unknown) => {
        if (!active) return;
        setError(
          getFriendlyError(
            caught,
            'Impossible de charger la sécurité du compte.',
          ),
        );
      });

    return () => {
      active = false;
    };
  }, []);
  async function linkIdentity() {
    setPending(true);
    setError(null);
    try {
      await beginIdentityLink();
    } catch (caught) {
      setError(
        getFriendlyError(caught, 'Impossible de démarrer la liaison sécurisée.'),
      );
      setPending(false);
    }
  }

  return (
    <PageContainer className="grid gap-6">
      <header>
        <p className="text-sm font-bold text-emerald-700">Mon compte</p>
        <h1 className="mt-1 text-3xl font-black text-slate-950">Sécurité</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
          Consultez la méthode de connexion active et les événements récents de
          votre compte.
        </p>
      </header>
      {error ? <ErrorMessage message={error} /> : null}
      {!summary && !error ? <LoadingState message="Chargement de la sécurité…" /> : null}
      {summary ? (
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <Card className="grid gap-5">
            <div>
              <h2 className="text-lg font-extrabold text-slate-950">Identité</h2>
              <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                <SecurityValue label="Fournisseur" value={providerLabel(summary.identityProvider)} />
                <SecurityValue label="Email" value={summary.emailVerified ? 'Vérifié' : 'À vérifier'} />
                <SecurityValue label="Double authentification" value={summary.session.mfaSatisfied ? 'Utilisée pour cette session' : 'Non utilisée pour cette session'} />
                <SecurityValue label="Compte lié" value={summary.identityLinked ? 'Oui' : 'Non'} />
              </dl>
            </div>
            <div className="flex flex-wrap gap-3 border-t border-slate-100 pt-5">
              {summary.accountConsoleUrl ? (
                <a className="inline-flex min-h-11 items-center rounded-lg bg-emerald-700 px-4 text-sm font-bold text-white hover:bg-emerald-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200" href={summary.accountConsoleUrl} rel="noreferrer" target="_blank">
                  Gérer le mot de passe et la MFA
                </a>
              ) : null}
              {summary.keycloakEnabled && !summary.identityLinked ? (
                <Button disabled={pending} onClick={() => void linkIdentity()} variant="secondary">
                  {pending ? 'Redirection…' : 'Lier mon identité Keycloak'}
                </Button>
              ) : null}
            </div>
          </Card>
          <Card>
            <h2 className="text-lg font-extrabold text-slate-950">Session actuelle</h2>
            <p className="mt-3 text-sm text-slate-600">
              Méthodes : {summary.session.authenticationMethods.join(', ')}
            </p>
            <p className="mt-2 text-sm text-slate-600">
              Expiration : {summary.session.expiresAt ? new Date(summary.session.expiresAt).toLocaleString('fr-FR') : 'non disponible'}
            </p>
          </Card>
        </div>
      ) : null}
      <section>
        <h2 className="text-lg font-extrabold text-slate-950">Activité de sécurité récente</h2>
        <div className="mt-3 grid gap-2">
          {events.length ? events.slice(0, 20).map((event, index) => (
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm" key={`${event.occurredAt}-${index}`}>
              <span className="font-semibold text-slate-800">{eventLabel(event.eventType)}</span>
              <span className="text-slate-500">{new Date(event.occurredAt).toLocaleString('fr-FR')}</span>
            </div>
          )) : <Card><p className="text-sm text-slate-500">Aucun événement récent.</p></Card>}
        </div>
      </section>
    </PageContainer>
  );
}

function SecurityValue({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-slate-50 p-3">
      <dt className="text-xs font-bold uppercase text-slate-500">{label}</dt>
      <dd className="mt-1 font-semibold text-slate-900">{value}</dd>
    </div>
  );
}

function providerLabel(provider: SecuritySummary['identityProvider']) {
  if (provider === 'linked') return 'Compte local lié à Keycloak';
  if (provider === 'keycloak') return 'Keycloak';
  return 'Compte local';
}

function eventLabel(type: string) {
  const labels: Record<string, string> = {
    local_login_succeeded: 'Connexion locale réussie',
    local_login_failed: 'Tentative de connexion locale refusée',
    keycloak_login_succeeded: 'Connexion Keycloak réussie',
    keycloak_login_rejected: 'Connexion Keycloak refusée',
    identity_link_requested: 'Liaison d’identité demandée',
    identity_linked: 'Identité liée',
    identity_link_failed: 'Liaison d’identité refusée',
  };
  return labels[type] ?? 'Événement de sécurité';
}