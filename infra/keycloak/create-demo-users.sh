#!/usr/bin/env bash
set -euo pipefail

# Création ou mise à jour de comptes sur une démo Keycloak locale uniquement.
# Ne pas utiliser contre un service distant.
#
# Usage:
# Fournir KEYCLOAK_ADMIN_PASSWORD et les mots de passe DEMO_* via l'environnement.
# Générer chaque mot de passe DEMO_* avec 32 octets aléatoires en hexadécimal.

KEYCLOAK_URL="${KEYCLOAK_URL:-http://127.0.0.1:8080}"
# Ce script est limité à une instance locale de démonstration.
if [[ ! "${KEYCLOAK_URL}" =~ ^http://(localhost|127\.0\.0\.1)(:[0-9]+)?/?$ ]]; then
  echo "Cible refusée : utiliser une instance locale de démonstration." >&2
  exit 1
fi

REALM="${KEYCLOAK_REALM:-connected-neighbours}"
ADMIN_USER="${KEYCLOAK_ADMIN_USER:-admin}"
ADMIN_PASSWORD="${KEYCLOAK_ADMIN_PASSWORD:?Set KEYCLOAK_ADMIN_PASSWORD}"

USERS=(
  "admin3@connected-neighbours.local|Admin|Demo 3|${DEMO_ADMIN3_PASSWORD:?Définir DEMO_ADMIN3_PASSWORD}"
  "david@connected-neighbours.local|David|Petit|${DEMO_DAVID_PASSWORD:?Définir DEMO_DAVID_PASSWORD}"
  "emma@connected-neighbours.local|Emma|Rousseau|${DEMO_EMMA_PASSWORD:?Définir DEMO_EMMA_PASSWORD}"
  "moderator@connected-neighbours.local|Moderation|Demo|${DEMO_MODERATOR_PASSWORD:?Définir DEMO_MODERATOR_PASSWORD}"
  "bob@connected-neighbours.local|Bob|Dupont|${DEMO_BOB_PASSWORD:?Définir DEMO_BOB_PASSWORD}"
)

# Valider tous les mots de passe avant le premier appel réseau.
for entry in "${USERS[@]}"; do
  IFS='|' read -r _ _ _ PASSWORD <<< "${entry}"
  if [[ ! "${PASSWORD}" =~ ^[a-fA-F0-9]{64}$ ]]; then
    echo "Mot de passe de démo invalide : utiliser 32 octets aléatoires en hexadécimal." >&2
    exit 1
  fi
done

echo "Authenticating against ${KEYCLOAK_URL} (master realm, admin-cli client)..."
TOKEN=$(curl -sf "${KEYCLOAK_URL}/realms/master/protocol/openid-connect/token" \
  -d "client_id=admin-cli" \
  -d "grant_type=password" \
  -d "username=${ADMIN_USER}" \
  -d "password=${ADMIN_PASSWORD}" \
  | python3 -c 'import sys,json; print(json.load(sys.stdin)["access_token"])')

if [[ -z "${TOKEN}" ]]; then
  echo "Failed to obtain an admin token." >&2
  exit 1
fi

for entry in "${USERS[@]}"; do
  IFS='|' read -r EMAIL FIRST_NAME LAST_NAME PASSWORD <<< "${entry}"

  EXISTING=$(curl -sf "${KEYCLOAK_URL}/admin/realms/${REALM}/users?email=${EMAIL}&exact=true" \
    -H "Authorization: Bearer ${TOKEN}")
  USER_ID=$(echo "${EXISTING}" | python3 -c 'import sys,json; data=json.load(sys.stdin); print(data[0]["id"] if data else "")')

  if [[ -z "${USER_ID}" ]]; then
    echo "Creating ${EMAIL}..."
    LOCATION=$(curl -sfi "${KEYCLOAK_URL}/admin/realms/${REALM}/users" \
      -H "Authorization: Bearer ${TOKEN}" \
      -H "Content-Type: application/json" \
      -d "{
        \"username\": \"${EMAIL}\",
        \"email\": \"${EMAIL}\",
        \"firstName\": \"${FIRST_NAME}\",
        \"lastName\": \"${LAST_NAME}\",
        \"enabled\": true
      }" | grep -i '^location:' | tr -d '\r')
    USER_ID="${LOCATION##*/}"
  else
    echo "${EMAIL} already exists, updating password only."
  fi

  echo "Setting password for ${EMAIL}..."
  curl -sf -X PUT "${KEYCLOAK_URL}/admin/realms/${REALM}/users/${USER_ID}/reset-password" \
    -H "Authorization: Bearer ${TOKEN}" \
    -H "Content-Type: application/json" \
    -d "{\"type\": \"password\", \"value\": \"${PASSWORD}\", \"temporary\": false}"

  echo "Done: ${EMAIL}"
done

echo ""
echo "All done. Now go tick 'Email verified' for each of these users in the admin console:"
for entry in "${USERS[@]}"; do
  IFS='|' read -r EMAIL _ <<< "${entry}"
  echo " - ${EMAIL}"
done
