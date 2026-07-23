import { useCallback, useEffect, useState } from "react";

import {
  getSecurityEvents,
  getSecuritySessions,
  getSecuritySummary,
  requestSecurityAction,
  revokeAllSecuritySessions,
  type AccountSecurityAction,
  type SecurityEvent,
  type SecuritySession,
  type SecuritySummary,
} from "../api/security";
import { useAuth } from "../auth/useAuth";
import { PageContainer } from "../components/layout/PageContainer";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { ErrorMessage } from "../components/ui/ErrorMessage";
import { LoadingState } from "../components/ui/LoadingState";
import { Modal } from "../components/ui/Modal";
import { getFriendlyError } from "../utils/errors";

export function SecurityPage() {
  const { beginIdentityLink, logout } = useAuth();
  const [summary, setSummary] = useState<SecuritySummary | null>(null);
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [sessions, setSessions] = useState<SecuritySession[]>([]);
  const [pending, setPending] = useState(false);
  const [pendingAction, setPendingAction] =
    useState<AccountSecurityAction | null>(null);
  const [confirmLogoutAll, setConfirmLogoutAll] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    const [nextSummary, nextEvents] = await Promise.all([
      getSecuritySummary(),
      getSecurityEvents(),
    ]);
    setSummary(nextSummary);
    setEvents(nextEvents);

    if (
      nextSummary.identityLinked &&
      nextSummary.keycloakAvailability === "available"
    ) {
      try {
        setSessions(await getSecuritySessions());
      } catch {
        setSessions([]);
      }
    }
  }, []);

  useEffect(() => {
    let active = true;
    load().catch((caught: unknown) => {
      if (!active) return;
      setError(
        getFriendlyError(
          caught,
          "Impossible de charger la sécurité du compte.",
        ),
      );
    });
    return () => {
      active = false;
    };
  }, [load]);

  async function linkIdentity() {
    setPending(true);
    setError(null);
    try {
      await beginIdentityLink();
    } catch (caught) {
      setError(
        getFriendlyError(
          caught,
          "Impossible de démarrer la liaison sécurisée.",
        ),
      );
      setPending(false);
    }
  }

  async function sendAction(action: AccountSecurityAction) {
    setPendingAction(action);
    setError(null);
    setSuccess(null);
    try {
      await requestSecurityAction(action);
      setSuccess("Un e-mail sécurisé vient de vous être envoyé.");
      await load();
    } catch (caught) {
      setError(getFriendlyError(caught, "Impossible d’envoyer cet e-mail."));
    } finally {
      setPendingAction(null);
    }
  }

  async function revokeAll() {
    setPending(true);
    setError(null);
    try {
      await revokeAllSecuritySessions();
      setConfirmLogoutAll(false);
      await logout();
    } catch (caught) {
      setError(
        getFriendlyError(caught, "Impossible de révoquer toutes les sessions."),
      );
      setConfirmLogoutAll(false);
      setPending(false);
    }
  }

  return (
    <PageContainer className="grid gap-6">
      <header>
        <p className="text-sm font-bold text-emerald-700">Mon compte</p>
        <h1 className="mt-1 text-3xl font-black text-slate-950">Sécurité</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
          Gérez votre identité, vos méthodes de connexion et les appareils qui
          ont accès à votre compte.
        </p>
      </header>

      {error ? <ErrorMessage message={error} /> : null}
      {success ? (
        <div
          className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800"
          role="status"
        >
          {success}
        </div>
      ) : null}
      {!summary && !error ? (
        <LoadingState message="Chargement de la sécurité…" />
      ) : null}

      {summary ? (
        <>
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_22rem]">
            <Card className="grid gap-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-extrabold text-slate-950">
                    Identité
                  </h2>
                  <p className="mt-1 text-sm text-slate-600">
                    Les mots de passe et codes TOTP sont gérés uniquement par
                    Keycloak.
                  </p>
                </div>
                <AvailabilityBadge value={summary.keycloakAvailability} />
              </div>
              <dl className="grid gap-3 text-sm sm:grid-cols-2">
                <SecurityValue
                  label="Fournisseur"
                  value={providerLabel(summary.identityProvider)}
                />
                <SecurityValue
                  label="E-mail"
                  value={summary.emailVerified ? "Vérifié" : "À vérifier"}
                />
                <SecurityValue
                  label="Double authentification"
                  value={mfaLabel(summary)}
                />
                <SecurityValue
                  label="Compte lié"
                  value={summary.identityLinked ? "Oui" : "Non"}
                />
              </dl>
              <div className="flex flex-wrap gap-3 border-t border-slate-100 pt-5">
                {summary.accountConsoleUrl ? (
                  <a
                    className="inline-flex min-h-11 items-center rounded-lg bg-emerald-700 px-4 text-sm font-bold text-white hover:bg-emerald-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200"
                    href={summary.accountConsoleUrl}
                    rel="noreferrer"
                    target="_blank"
                  >
                    Ouvrir la gestion sécurisée du compte
                  </a>
                ) : null}
                {summary.keycloakEnabled && !summary.identityLinked ? (
                  <Button
                    disabled={pending}
                    onClick={() => void linkIdentity()}
                    variant="secondary"
                  >
                    {pending ? "Redirection…" : "Lier mon identité Keycloak"}
                  </Button>
                ) : null}
              </div>
              {summary.identityLinked ? (
                <div className="flex flex-wrap gap-2">
                  {!summary.emailVerified ? (
                    <ActionButton
                      action="verify_email"
                      label="Renvoyer la vérification"
                      pendingAction={pendingAction}
                      sendAction={sendAction}
                    />
                  ) : null}
                  <ActionButton
                    action="update_password"
                    label="Recevoir un lien de mot de passe"
                    pendingAction={pendingAction}
                    sendAction={sendAction}
                  />
                  <ActionButton
                    action="configure_totp"
                    label="Configurer la double authentification"
                    pendingAction={pendingAction}
                    sendAction={sendAction}
                  />
                </div>
              ) : null}
            </Card>

            <Card>
              <h2 className="text-lg font-extrabold text-slate-950">
                Session actuelle
              </h2>
              <p className="mt-3 text-sm text-slate-600">
                Méthodes : {summary.session.authenticationMethods.join(", ")}
              </p>
              <p className="mt-2 text-sm text-slate-600">
                Expiration :{" "}
                {summary.session.expiresAt
                  ? new Date(summary.session.expiresAt).toLocaleString("fr-FR")
                  : "non disponible"}
              </p>
              <p className="mt-2 text-sm text-slate-600">
                Sessions Keycloak : {summary.sessionCount ?? "indisponible"}
              </p>
              {summary.identityLinked ? (
                <Button
                  className="mt-5 w-full"
                  disabled={!summary.session.mfaSatisfied}
                  onClick={() => setConfirmLogoutAll(true)}
                  variant="danger"
                >
                  Déconnecter tous les appareils
                </Button>
              ) : null}
              {summary.identityLinked && !summary.session.mfaSatisfied ? (
                <p className="mt-2 text-xs leading-5 text-slate-500">
                  Cette action exige une connexion avec double authentification.
                </p>
              ) : null}
            </Card>
          </div>

          <section>
            <h2 className="text-lg font-extrabold text-slate-950">
              Appareils connectés
            </h2>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              {sessions.length ? (
                sessions.map((session, index) => (
                  <Card key={`${session.startedAt ?? "session"}-${index}`}>
                    <p className="font-bold text-slate-900">
                      {session.clients.join(", ") || "Session Keycloak"}
                    </p>
                    <p className="mt-2 text-sm text-slate-600">
                      Dernière activité : {formatDate(session.lastAccessAt)}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Ouverte le {formatDate(session.startedAt)}
                      {session.rememberMe ? " · appareil mémorisé" : ""}
                    </p>
                  </Card>
                ))
              ) : (
                <Card>
                  <p className="text-sm text-slate-500">
                    Aucune autre session affichable.
                  </p>
                </Card>
              )}
            </div>
          </section>
        </>
      ) : null}

      <section>
        <h2 className="text-lg font-extrabold text-slate-950">
          Activité de sécurité récente
        </h2>
        <div className="mt-3 grid gap-2">
          {events.length ? (
            events.slice(0, 20).map((event, index) => (
              <div
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm"
                key={`${event.occurredAt}-${index}`}
              >
                <span className="font-semibold text-slate-800">
                  {eventLabel(event.eventType)}
                </span>
                <span className="text-slate-500">
                  {new Date(event.occurredAt).toLocaleString("fr-FR")}
                </span>
              </div>
            ))
          ) : (
            <Card>
              <p className="text-sm text-slate-500">Aucun événement récent.</p>
            </Card>
          )}
        </div>
      </section>

      <Modal
        description="Toutes les sessions Keycloak, y compris celle-ci, seront révoquées."
        onClose={() => setConfirmLogoutAll(false)}
        open={confirmLogoutAll}
        title="Déconnecter tous les appareils ?"
      >
        <div className="flex justify-end gap-3">
          <Button onClick={() => setConfirmLogoutAll(false)}>Annuler</Button>
          <Button
            disabled={pending}
            onClick={() => void revokeAll()}
            variant="danger"
          >
            {pending ? "Révocation…" : "Tout déconnecter"}
          </Button>
        </div>
      </Modal>
    </PageContainer>
  );
}

function ActionButton({
  action,
  label,
  pendingAction,
  sendAction,
}: {
  action: AccountSecurityAction;
  label: string;
  pendingAction: AccountSecurityAction | null;
  sendAction: (action: AccountSecurityAction) => Promise<void>;
}) {
  return (
    <Button
      disabled={pendingAction !== null}
      onClick={() => void sendAction(action)}
      size="sm"
      variant="secondary"
    >
      {pendingAction === action ? "Envoi…" : label}
    </Button>
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

function AvailabilityBadge({
  value,
}: {
  value: SecuritySummary["keycloakAvailability"];
}) {
  if (value === "available") return <Badge tone="success">Disponible</Badge>;
  if (value === "unavailable")
    return <Badge tone="warning">Indisponible</Badge>;
  return <Badge>Désactivé</Badge>;
}

function providerLabel(provider: SecuritySummary["identityProvider"]) {
  if (provider === "linked") return "Compte local lié à Keycloak";
  if (provider === "keycloak") return "Keycloak";
  return "Compte local";
}

function mfaLabel(summary: SecuritySummary) {
  if (summary.mfaConfigured === true) return "Configurée";
  if (summary.mfaConfigured === false) return "Non configurée";
  return summary.session.mfaSatisfied
    ? "Utilisée pour cette session"
    : "État indisponible";
}

function formatDate(value: string | null) {
  return value ? new Date(value).toLocaleString("fr-FR") : "date inconnue";
}

function eventLabel(type: string) {
  const labels: Record<string, string> = {
    local_login_succeeded: "Connexion locale réussie",
    local_login_failed: "Tentative de connexion locale refusée",
    keycloak_login_succeeded: "Connexion Keycloak réussie",
    keycloak_login_rejected: "Connexion Keycloak refusée",
    identity_link_requested: "Liaison d’identité demandée",
    identity_linked: "Identité liée",
    identity_link_failed: "Liaison d’identité refusée",
    email_verification_requested: "Vérification d’e-mail demandée",
    password_change_requested: "Changement de mot de passe demandé",
    mfa_setup_requested: "Configuration MFA demandée",
    logout: "Déconnexion",
    logout_all: "Toutes les sessions révoquées",
    admin_session_revoked: "Sessions révoquées par un administrateur",
  };
  return labels[type] ?? "Événement de sécurité";
}
