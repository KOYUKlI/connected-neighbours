#!/usr/bin/env bash
set -euo pipefail

# Creates the remaining demo users directly in the live Keycloak realm via
# the Admin REST API (no docker exec needed, works from any machine with
# network access to KEYCLOAK_URL).
#
# It does NOT set emailVerified=true — tick "Email verified" by hand for
# each user afterwards in the admin console (Users > <user> > Details).
#
# Usage:
#   KEYCLOAK_ADMIN_PASSWORD='...' ./infra/keycloak/create-demo-users.sh

KEYCLOAK_URL="${KEYCLOAK_URL:-https://auth.3al-connected-neighbours.pro}"
REALM="${KEYCLOAK_REALM:-connected-neighbours}"
ADMIN_USER="${KEYCLOAK_ADMIN_USER:-admin}"
ADMIN_PASSWORD="${KEYCLOAK_ADMIN_PASSWORD:?Set KEYCLOAK_ADMIN_PASSWORD}"

USERS=(
  "admin3@connected-neighbours.local|Admin|Demo 3|Admin3Demo2026!"
  "david@connected-neighbours.local|David|Petit|DavidDemo2026!"
  "emma@connected-neighbours.local|Emma|Rousseau|EmmaDemo2026!"
  "moderator@connected-neighbours.local|Moderation|Demo|ModeratorDemo2026!"
  "bob@connected-neighbours.local|Bob|Dupont|BobDemo2026!"
)

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
