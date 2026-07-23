import { useCallback, useEffect, useState, type FormEvent } from "react";

import {
  fetchAdminIdentities,
  fetchAdminIdentity,
  revokeAdminIdentitySessions,
  sendAdminIdentityAction,
  type AdminIdentityAction,
  type AdminIdentityDetail,
  type AdminIdentitySummary,
} from "../../api/identities";
import { useAdminAuth } from "../../auth/useAdminAuth";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { EmptyState } from "../../components/ui/EmptyState";
import { LoadingState } from "../../components/ui/LoadingState";
import { Modal } from "../../components/ui/Modal";
import { PageHeader } from "../../components/ui/PageHeader";
import { getErrorMessage } from "../../shared/utils/errors";

export function AdminIdentitiesPage() {
  const { handleSessionError } = useAdminAuth();
  const [items, setItems] = useState<AdminIdentitySummary[]>([]);
  const [search, setSearch] = useState("");
  const [activeSearch, setActiveSearch] = useState("");
  const [selected, setSelected] = useState<AdminIdentityDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [pending, setPending] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await fetchAdminIdentities(activeSearch);
      setItems(result.items);
    } catch (caught) {
      if (!handleSessionError(caught)) setError(getErrorMessage(caught));
    } finally {
      setIsLoading(false);
    }
  }, [activeSearch, handleSessionError]);

  useEffect(() => {
    void load();
  }, [load]);

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setActiveSearch(search.trim());
  }

  async function openIdentity(userId: string) {
    setIsDetailLoading(true);
    setError(null);
    setSuccess(null);
    try {
      setSelected(await fetchAdminIdentity(userId));
    } catch (caught) {
      if (!handleSessionError(caught)) setError(getErrorMessage(caught));
    } finally {
      setIsDetailLoading(false);
    }
  }

  async function sendAction(action: AdminIdentityAction) {
    if (!selected) return;
    setPending(true);
    setError(null);
    setSuccess(null);
    try {
      await sendAdminIdentityAction(selected.identity.id, action);
      setSuccess("L’action sécurisée a été envoyée par e-mail.");
    } catch (caught) {
      if (!handleSessionError(caught)) setError(getErrorMessage(caught));
    } finally {
      setPending(false);
    }
  }

  async function revokeSessions() {
    if (!selected) return;
    setPending(true);
    setError(null);
    setSuccess(null);
    try {
      await revokeAdminIdentitySessions(selected.identity.id, reason.trim());
      setSuccess("Toutes les sessions Keycloak ont été révoquées.");
      setReason("");
      setSelected(await fetchAdminIdentity(selected.identity.id));
    } catch (caught) {
      if (!handleSessionError(caught)) setError(getErrorMessage(caught));
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="grid gap-5">
      <PageHeader
        description="Consultez l’état de liaison Keycloak et révoquez des sessions sans exposer de jeton, secret ou identifiant de session."
        eyebrow="Sécurité"
        title="Identités"
      />

      {error ? (
        <div
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700"
          role="alert"
        >
          {error}
        </div>
      ) : null}
      {success ? (
        <div
          className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800"
          role="status"
        >
          {success}
        </div>
      ) : null}

      <Card>
        <form className="flex flex-wrap gap-3" onSubmit={submitSearch}>
          <label className="min-w-0 flex-1 text-sm font-bold text-slate-800">
            Rechercher une identité
            <input
              className="mt-2 min-h-11 w-full rounded-lg border border-slate-300 px-3 text-sm font-normal outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Nom ou e-mail"
              type="search"
              value={search}
            />
          </label>
          <Button className="self-end" type="submit" variant="primary">
            Rechercher
          </Button>
        </form>
      </Card>

      {isLoading ? <LoadingState message="Chargement des identités…" /> : null}
      {!isLoading && !items.length ? (
        <EmptyState message="Aucune identité ne correspond à cette recherche." />
      ) : null}
      {!isLoading && items.length ? (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full border-collapse text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-600">
              <tr>
                <th className="px-4 py-3">Utilisateur</th>
                <th className="px-4 py-3">Rôle MongoDB</th>
                <th className="px-4 py-3">Identité</th>
                <th className="px-4 py-3">E-mail</th>
                <th className="px-4 py-3">Compte</th>
                <th className="px-4 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((identity) => (
                <tr key={identity.id}>
                  <td className="px-4 py-3">
                    <strong className="block text-slate-950">
                      {identity.displayName}
                    </strong>
                    <span className="text-slate-500">{identity.email}</span>
                  </td>
                  <td className="px-4 py-3 font-semibold text-slate-700">
                    {roleLabel(identity.role)}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {providerLabel(identity.identityProvider)}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {identity.emailVerified ? "Vérifié" : "À vérifier"}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {identity.isActive ? "Actif" : "Désactivé"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button
                      disabled={isDetailLoading}
                      onClick={() => void openIdentity(identity.id)}
                      size="sm"
                    >
                      Consulter
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      <Modal
        description="Les rôles et l’activation restent contrôlés dans MongoDB."
        onClose={() => {
          setSelected(null);
          setReason("");
        }}
        open={selected !== null}
        title={selected?.identity.displayName ?? "Identité"}
      >
        {selected ? (
          <div className="grid gap-5">
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              <IdentityValue
                label="Rôle MongoDB"
                value={roleLabel(selected.identity.role)}
              />
              <IdentityValue
                label="Fournisseur"
                value={providerLabel(selected.identity.identityProvider)}
              />
              <IdentityValue
                label="E-mail"
                value={
                  selected.identity.emailVerified ? "Vérifié" : "À vérifier"
                }
              />
              <IdentityValue
                label="MFA"
                value={
                  selected.keycloak
                    ? selected.keycloak.mfaConfigured
                      ? "Configurée"
                      : "Non configurée"
                    : "Non applicable"
                }
              />
              <IdentityValue
                label="Sessions"
                value={
                  selected.keycloak
                    ? String(selected.keycloak.sessionCount)
                    : "Non applicable"
                }
              />
              <IdentityValue
                label="Compte"
                value={selected.identity.isActive ? "Actif" : "Désactivé"}
              />
            </dl>

            {selected.identity.keycloakLinked ? (
              <div className="grid gap-3 border-t border-slate-200 pt-4">
                <h3 className="font-bold text-slate-950">Actions Keycloak</h3>
                <div className="flex flex-wrap gap-2">
                  <Button
                    disabled={pending}
                    onClick={() => void sendAction("verify_email")}
                    size="sm"
                  >
                    Vérifier l’e-mail
                  </Button>
                  <Button
                    disabled={pending}
                    onClick={() => void sendAction("update_password")}
                    size="sm"
                  >
                    Réinitialiser le mot de passe
                  </Button>
                  <Button
                    disabled={pending}
                    onClick={() => void sendAction("configure_totp")}
                    size="sm"
                  >
                    Configurer la MFA
                  </Button>
                </div>
                <label className="text-sm font-bold text-slate-800">
                  Justification de la révocation
                  <textarea
                    className="mt-2 min-h-24 w-full rounded-lg border border-slate-300 p-3 font-normal outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                    maxLength={300}
                    onChange={(event) => setReason(event.target.value)}
                    placeholder="Expliquez pourquoi toutes les sessions doivent être révoquées."
                    value={reason}
                  />
                </label>
                <Button
                  disabled={pending || reason.trim().length < 10}
                  onClick={() => void revokeSessions()}
                  variant="danger"
                >
                  {pending ? "Traitement…" : "Révoquer toutes les sessions"}
                </Button>
              </div>
            ) : (
              <p className="rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
                Ce compte local n’est pas encore lié à Keycloak.
              </p>
            )}
          </div>
        ) : null}
      </Modal>
    </div>
  );
}

function IdentityValue({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-slate-50 p-3">
      <dt className="text-xs font-bold uppercase text-slate-500">{label}</dt>
      <dd className="mt-1 font-semibold text-slate-900">{value}</dd>
    </div>
  );
}

function roleLabel(role: AdminIdentitySummary["role"]) {
  if (role === "admin") return "Administrateur";
  if (role === "moderator") return "Modérateur";
  return "Résident";
}

function providerLabel(provider: AdminIdentitySummary["identityProvider"]) {
  if (provider === "linked") return "Local + Keycloak";
  if (provider === "keycloak") return "Keycloak";
  return "Local";
}
