# 02 — Dossier technique V2 — Connected Neighbours

## 1. Objectif du document

Ce document présente l’état technique actuel du projet **Connected Neighbours**.

Cette version V2 remplace le dossier technique précédent, qui décrivait surtout une architecture cible complète. Le but de cette version est de distinguer clairement :

- l’architecture réellement implémentée ;
- les modules réellement fonctionnels ;
- les éléments partiellement présents ;
- les services prévus mais non encore branchés ;
- les limites techniques à assumer ;
- les priorités restantes pour rendre le projet plus complet.

Le document ne présente donc pas uniquement l’architecture idéale du sujet. Il décrit l’état réel du monorepo après la stabilisation récente de l’API, du web utilisateur, du back-office, du Docker Compose et du DSL Jison.

---

## 2. Vue d’ensemble de l’architecture actuelle

## 2.1 Applications présentes

Le projet est organisé en monorepo.

```txt
connected-neighbours/
├── apps/
│   ├── api/             API centrale NestJS / Fastify
│   ├── web/             Application web habitant React / Vite
│   ├── admin-web/       Back-office administrateur React / Vite
│   └── admin-desktop/   Application JavaFX administrateur
│
├── docs/                Documentation projet
├── diagrams/            Schémas d’architecture
├── docker-compose.yml   Stack Docker de démonstration
├── package.json         Scripts racine
├── pnpm-workspace.yaml  Définition du monorepo pnpm
└── pnpm-lock.yaml       Verrouillage des dépendances
```

## 2.2 Architecture actuelle démontrable

L’architecture actuellement démontrable est la suivante :

```txt
[Web utilisateur React]
        |
        | REST /api via proxy Vite ou Nginx
        v
[API NestJS / Fastify]
        |
        v
[MongoDB]

[Admin-web React]
        |
        | REST /api via proxy Vite ou Nginx
        v
[API NestJS / Fastify]
        |
        v
[MongoDB]

[JavaFX Admin Desktop]
        |
        | Sync API prévue : push / pull / status / history
        v
[API NestJS / Fastify]
```

La partie API de synchronisation JavaFX existe. En revanche, l’intégration complète côté JavaFX, avec outbox locale, client HTTP et synchronisation automatique, reste à finaliser dans l’application desktop.

## 2.3 Architecture cible prévue par le sujet

L’architecture cible reste plus large :

```txt
[Web utilisateur React]
[Back-office React]
[JavaFX Admin Desktop]
        |
        v
[API centrale Node.js]
        |
        |---- MongoDB
        |---- Neo4j
        |---- MinIO
        |---- Keycloak
        |
        v
[Base locale JavaFX H2 / SQLite]
```

Dans l’état actuel :

| Brique | État actuel |
|---|---|
| API NestJS/Fastify | Réalisée |
| MongoDB | Réalisée et utilisée |
| Web utilisateur | Réalisé pour le parcours principal |
| Admin-web | Réalisé pour supervision P0 |
| JavaFX | Présent, partie sync client à finaliser |
| Neo4j | Prévu, non branché fonctionnellement |
| MinIO | Prévu, non branché fonctionnellement |
| Keycloak / SSO / MFA | Prévu, non branché fonctionnellement |
| Socket.IO | Prévu, non implémenté |
| i18n | Prévu, non implémenté |

---

## 3. Stack technique actuelle

## 3.1 Racine du projet

Le projet utilise :

```txt
Node.js 24
pnpm 10.32.1
TypeScript
Monorepo pnpm
Docker Compose
```

Les scripts principaux sont lancés depuis la racine :

```bash
pnpm dev:api
pnpm dev:web
pnpm dev:admin
pnpm build
pnpm test
pnpm typecheck
```

## 3.2 Backend API

L’API utilise :

```txt
NestJS
Fastify
TypeScript
Mongoose
MongoDB
Swagger / OpenAPI
JWT
Passport
Joi
Jest
Supertest
Jison
```

Le choix de NestJS/Fastify s’écarte de l’indication Express du sujet, mais conserve un backend Node.js. Ce choix apporte une meilleure structure pour un projet volumineux : modules, contrôleurs, services, DTO, injection de dépendances, guards et documentation Swagger.

## 3.3 Front web utilisateur

Le front habitant utilise :

```txt
React
Vite
TypeScript
CSS
Fetch API
localStorage pour le JWT
```

Il consomme l’API via des URLs relatives `/api/...`, ce qui permet le fonctionnement en développement local avec proxy Vite et en Docker avec proxy Nginx.

## 3.4 Back-office administrateur

Le back-office utilise aussi :

```txt
React
Vite
TypeScript
CSS
Fetch API
localStorage pour le JWT
```

Il est branché sur les endpoints `/api/admin/...` et nécessite un compte administrateur.

## 3.5 Application JavaFX

L’application desktop est située dans `apps/admin-desktop`.

Elle repose sur une stack Java de type :

```txt
Java
JavaFX
Spring Boot local
JPA
H2 ou SQLite
Maven
```

Elle doit gérer les incidents et alertes localement et fonctionner hors ligne. L’état exact de finalisation doit être validé par la partie responsable JavaFX.

---

## 4. API centrale

## 4.1 Configuration générale

L’API centrale est située dans :

```txt
apps/api
```

Elle expose ses routes avec le préfixe :

```txt
/api
```

Swagger est disponible sur :

```txt
http://localhost:3000/docs
```

L’API utilise :

- un adaptateur Fastify ;
- une validation globale des DTO ;
- une configuration par variables d’environnement ;
- MongoDB via Mongoose ;
- JWT pour l’authentification ;
- des rôles `resident`, `moderator`, `admin` ;
- une documentation Swagger.

## 4.2 Modules API actuellement présents

| Module | État actuel |
|---|---|
| `auth` | Connexion JWT locale, profil connecté, routes protégées |
| `services` | Services, publication, annulation, workflow principal |
| `applications` | Candidatures sur services, acceptation, rejet, retrait |
| `contracts` | Contrats depuis candidature, signature, completion, annulation |
| `points` | Solde, transactions, réservation, libération, transfert |
| `neighborhoods` | CRUD quartier basique |
| `events` | API V1 présente |
| `votes` | API V1 présente |
| `documents` | API V1 présente, sans stockage MinIO complet |
| `messaging` | REST basique conversations/messages |
| `incidents` | Incidents API complets pour P0 |
| `alerts` | Alertes liées aux incidents |
| `sync` | Push/pull/status/history pour JavaFX |
| `dsl` | Micro-langage Jison en lecture seule |
| `admin` | Endpoints dashboard back-office |
| `rgpd` | Export utilisateur enrichi et normalisé |

Modules importants absents ou non finalisés :

| Module cible | État actuel |
|---|---|
| `proposals` | Non implémenté comme module dédié |
| `disputes` | Non implémenté comme module complet |
| `reports` | Non implémenté comme module complet |
| `reviews` | Non implémenté |
| `notifications` | Non implémenté comme module complet |
| `storage` | Non implémenté avec MinIO réel |
| `recommendations` | Non branché à Neo4j |

---

## 5. Endpoints API principaux

Cette section liste les routes importantes réellement disponibles ou attendues dans le périmètre actuel.

## 5.1 Health

```txt
GET /api
GET /api/health
```

## 5.2 Authentification

```txt
POST /api/auth/login
GET  /api/auth/me
GET  /api/auth/admin-only
```

La connexion retourne un JWT utilisé ensuite dans l’en-tête :

```txt
Authorization: Bearer <token>
```

## 5.3 Services

```txt
POST   /api/services
GET    /api/services
GET    /api/services/:id
PATCH  /api/services/:id
DELETE /api/services/:id
POST   /api/services/:id/publish
POST   /api/services/:id/cancel
```

Fonctionnalités couvertes :

- création de service ;
- publication ;
- consultation ;
- modification ;
- annulation ;
- liaison avec candidature sélectionnée ;
- liaison avec contrat.

## 5.4 Candidatures

```txt
POST /api/services/:serviceId/applications
GET  /api/services/:serviceId/applications
GET  /api/applications/me
POST /api/applications/:id/accept
POST /api/applications/:id/reject
POST /api/applications/:id/withdraw
```

Règles couvertes :

- impossible de candidater à son propre service ;
- doublon de candidature empêché ;
- acceptation d’une candidature ;
- rejet automatique des autres candidatures du même service ;
- retrait par le candidat.

## 5.5 Contrats

```txt
POST /api/contracts/from-application/:applicationId
POST /api/contracts/services/:serviceId/accept
GET  /api/contracts
GET  /api/contracts/:id
POST /api/contracts/:id/sign
POST /api/contracts/:id/complete
POST /api/contracts/:id/cancel
```

La route `POST /api/contracts/services/:serviceId/accept` est conservée comme route de compatibilité. Le parcours recommandé passe par les candidatures.

## 5.6 Points

```txt
GET /api/points/balance
GET /api/points/transactions
```

Les opérations internes principales sont :

```txt
reservePoints
releaseReservedPoints
transferReservedPoints
```

Elles sont utilisées par les contrats plutôt qu’exposées directement au public.

## 5.7 Incidents

```txt
POST  /api/incidents
GET   /api/incidents
GET   /api/incidents/:id
PATCH /api/incidents/:id
POST  /api/incidents/:id/resolve
POST  /api/incidents/:id/close
```

## 5.8 Alertes

```txt
POST  /api/incidents/:incidentId/alerts
GET   /api/incidents/:incidentId/alerts
GET   /api/alerts/:id
PATCH /api/alerts/:id
POST  /api/alerts/:id/resolve
```

## 5.9 Synchronisation JavaFX/API

```txt
POST /api/sync/push
GET  /api/sync/pull?clientId=...&since=...
GET  /api/sync/status?clientId=...
GET  /api/sync/history?clientId=...
```

La synchronisation fonctionne côté API. L’application JavaFX doit encore envoyer ses opérations locales et appliquer les changements serveur.

## 5.10 DSL MongoDB

```txt
POST /api/dsl/parse
POST /api/dsl/execute
GET  /api/dsl/examples
```

## 5.11 Admin

```txt
GET /api/admin/dashboard
GET /api/admin/services
GET /api/admin/contracts
GET /api/admin/incidents
GET /api/admin/sync/status
GET /api/admin/users
```

Ces routes sont protégées par JWT et rôle `admin`.

## 5.12 RGPD

```txt
GET /api/rgpd/export
```

L’export actuel retourne notamment :

- profil utilisateur ;
- services ;
- candidatures envoyées ;
- candidatures reçues ;
- contrats ;
- transactions de points ;
- incidents ;
- alertes ;
- opérations de synchronisation liées si rattachables ;
- documents.

Les identifiants sont normalisés avec `id` au lieu de `_id` et les mots de passe ne sont pas exportés.

---

## 6. Modélisation MongoDB actuelle

MongoDB stocke les données applicatives principales.

## 6.1 Collections principales

| Collection / schema | Usage |
|---|---|
| `User` | Utilisateurs, rôles, points |
| `Neighborhood` | Quartiers |
| `Service` | Offres ou demandes de services |
| `ServiceApplication` | Candidatures aux services |
| `Contract` | Contrats liés aux candidatures acceptées |
| `PointTransaction` | Historique des mouvements de points |
| `Incident` | Incidents de quartier |
| `Alert` | Alertes liées aux incidents |
| `SyncOperation` | Historique des opérations reçues par sync |
| `SyncState` | État de synchronisation par client |
| `ManagedDocument` | Documents gérés par l’API V1 |
| `Conversation` | Conversations REST |
| `Message` | Messages REST |
| `NeighborhoodEvent` | Événements |
| `EventResponse` | Réponses aux événements |
| `Vote` | Votes |
| `VoteAnswer` | Réponses de votes |

## 6.2 User

Champs importants :

```txt
email
displayName
role
neighborhoodId
passwordHash
pointsBalance
reservedPoints
isActive
```

Le champ `passwordHash` ne doit jamais être exposé dans les réponses publiques, admin ou RGPD.

## 6.3 Service

Champs importants :

```txt
title
description
type
category
availability
neighborhoodId
ownerId
isPaid
pricePoints
status
selectedApplicationId
contractId
createdAt
updatedAt
```

États actuellement utilisés dans le parcours principal :

```txt
draft
published
application_received
candidate_selected
awaiting_signatures
contract_active
completed
cancelled
disputed
```

## 6.4 ServiceApplication

Champs importants :

```txt
serviceId
applicantId
ownerId
message
proposedDate
proposedPricePoints
status
acceptedAt
rejectedAt
createdAt
updatedAt
```

États :

```txt
submitted
viewed
accepted
rejected
withdrawn
```

Un index empêche un même utilisateur d’avoir plusieurs candidatures actives sur le même service.

## 6.5 Contract

Champs importants :

```txt
serviceId
applicationId
requesterId
providerId
payerId
receiverId
pricePoints
status
signedByIds
signedAt
completedAt
cancelledAt
createdAt
updatedAt
```

États actuellement utilisés :

```txt
draft
sent
active
completed
cancelled
disputed
```

## 6.6 PointTransaction

Champs importants :

```txt
type
amount
fromUserId
toUserId
serviceId
contractId
reason
metadata
createdAt
updatedAt
```

Types actuels importants :

```txt
reservation
release
transfer
refund
admin_adjustment
```

## 6.7 Incident

Champs importants :

```txt
title
description
type
status
severity
neighborhoodId
reportedById
source
externalId
lastSyncedAt
createdAt
updatedAt
```

## 6.8 Alert

Champs importants :

```txt
incidentId
title
details
severity
status
source
externalId
resolvedAt
createdAt
updatedAt
```

## 6.9 SyncOperation

Champs importants :

```txt
operationId
clientId
entityType
entityId
operationType
payload
status
error
receivedAt
createdAt
updatedAt
```

`operationId` est unique pour garantir l’idempotence.

## 6.10 SyncState

Champs importants :

```txt
clientId
lastPullAt
lastPushAt
lastSuccessfulSyncAt
status
lastError
createdAt
updatedAt
```

`clientId` est unique.

---

## 7. Workflow technique service → candidature → contrat → points

Le workflow principal implémenté est le suivant :

```txt
1. Alice se connecte.
2. Alice crée un service payant.
3. Alice publie le service.
4. Bob se connecte.
5. Bob candidate au service.
6. Alice accepte la candidature.
7. Alice génère le contrat depuis la candidature.
8. Les points sont réservés.
9. Alice signe.
10. Bob signe.
11. Le contrat devient actif.
12. Alice complète le contrat.
13. Les points réservés sont transférés à Bob.
14. Le service et le contrat passent en completed.
```

Ce workflow est couvert par les tests E2E API et par l’interface web utilisateur.

## 7.1 Réservation des points

Lors de la création du contrat depuis une candidature acceptée :

- le système vérifie le solde du payeur ;
- les points disponibles sont diminués ;
- les points réservés sont augmentés ;
- une transaction `reservation` est créée.

## 7.2 Signature

Chaque partie peut signer une fois.

Le contrat devient `active` lorsque les deux utilisateurs concernés ont signé.

## 7.3 Completion

Lors de la completion :

- les points réservés sont libérés côté payeur ;
- le receveur gagne les points ;
- une transaction `transfer` est créée ;
- le contrat passe en `completed` ;
- le service passe en `completed`.

## 7.4 Annulation

L’annulation d’un contrat non terminé :

- passe le contrat en `cancelled` ;
- passe le service en `cancelled` si pertinent ;
- libère les points réservés ;
- ne transfère pas les points.

---

## 8. Application web utilisateur

## 8.1 Localisation

```txt
apps/web
```

## 8.2 Pages ou sections actuelles

L’application web utilisateur contient les sections suivantes :

```txt
Login
Dashboard
Services
Mes candidatures
Contrats
Points
Incidents
RGPD
```

## 8.3 Fonctionnalités

Elle permet actuellement :

- la connexion Alice/Bob/Admin ;
- le stockage du JWT ;
- la récupération du profil ;
- la déconnexion ;
- la création d’un service ;
- la publication d’un service ;
- l’annulation d’un service ;
- la candidature à un service ;
- l’affichage des candidatures envoyées ;
- l’affichage des candidatures reçues ;
- l’acceptation ou le rejet d’une candidature ;
- la génération d’un contrat depuis une candidature acceptée ;
- l’affichage des contrats ;
- la signature d’un contrat ;
- la completion ou annulation d’un contrat ;
- l’affichage du solde et des transactions de points ;
- le signalement d’un incident ;
- l’export RGPD avec résumé lisible et JSON complet.

## 8.4 Couche API front

Le front utilise une petite couche API :

```txt
src/api/client.ts
src/api/auth.ts
src/api/services.ts
src/api/applications.ts
src/api/contracts.ts
src/api/points.ts
src/api/incidents.ts
src/api/rgpd.ts
```

Toutes les requêtes passent par `/api/...`.

## 8.5 Limites du web utilisateur

Les fonctionnalités suivantes ne sont pas encore présentes ou pas complètes côté interface :

- événements ;
- votes ;
- messagerie ;
- documents PDF ;
- profil détaillé ;
- notifications ;
- litiges ;
- avis et réputation ;
- multilingue ;
- carte de quartier.

---

## 9. Back-office administrateur

## 9.1 Localisation

```txt
apps/admin-web
```

## 9.2 Sections actuelles

Le back-office contient les sections suivantes :

```txt
Login administrateur
Dashboard
Services
Contrats
Incidents
Synchronisation
Utilisateurs
```

## 9.3 Fonctionnalités

Le back-office permet actuellement :

- la connexion avec un compte admin ;
- le stockage du JWT ;
- le retour login en cas de token invalide ;
- l’affichage d’un dashboard ;
- l’affichage des services récents ;
- l’affichage des contrats récents ;
- l’affichage des incidents ;
- l’affichage des états de synchronisation ;
- l’affichage des utilisateurs sans `passwordHash` ;
- l’actualisation manuelle des données.

## 9.4 Couche API admin

Le back-office utilise :

```txt
src/api/client.ts
src/api/admin.ts
```

## 9.5 Limites du back-office

Les actions suivantes restent à développer :

- gestion complète des quartiers ;
- modification des utilisateurs ;
- gestion des rôles ;
- modération ;
- litiges ;
- documents ;
- votes ;
- événements ;
- statistiques avancées ;
- administration RGPD ;
- outil visuel pour le DSL.

---

## 10. Application JavaFX desktop

## 10.1 Localisation

```txt
apps/admin-desktop
```

## 10.2 Rôle attendu

L’application JavaFX doit permettre à l’administrateur de :

- consulter les incidents ;
- créer des incidents hors ligne ;
- gérer des alertes ;
- consulter des statistiques locales ;
- utiliser des thèmes ;
- utiliser des plugins ;
- synchroniser avec l’API centrale.

## 10.3 État actuel à vérifier

D’après l’état projet connu, l’application JavaFX possède déjà une base locale et des fonctionnalités autour des incidents, alertes, reporters, statistiques, thèmes et plugins.

Les points à vérifier ou finaliser sont :

- lancement simple ;
- persistance locale sans recréation de base à chaque démarrage ;
- génération du JAR final ;
- outbox locale ;
- client HTTP vers l’API ;
- push vers `/api/sync/push` ;
- pull depuis `/api/sync/pull` ;
- écran de statut de synchronisation ;
- gestion simple des conflits.

## 10.4 Contrat d’API disponible pour JavaFX

L’API met à disposition :

```txt
POST /api/sync/push
GET  /api/sync/pull?clientId=...&since=...
GET  /api/sync/status?clientId=...
GET  /api/sync/history?clientId=...
```

Exemple de payload push :

```json
{
  "clientId": "desktop-1",
  "operations": [
    {
      "operationId": "uuid-local",
      "entityType": "incident",
      "operationType": "create",
      "payload": {
        "title": "Lampadaire cassé",
        "description": "Lampadaire cassé devant le bâtiment A",
        "type": "maintenance",
        "severity": "medium",
        "neighborhoodId": "quartier-centre",
        "externalId": "incident-local-1"
      }
    }
  ]
}
```

---

## 11. Synchronisation JavaFX/API

## 11.1 Principe actuel côté API

La synchronisation repose sur :

- un push d’opérations locales ;
- un pull de données modifiées ;
- un historique d’opérations ;
- un état par client ;
- l’idempotence par `operationId`.

## 11.2 Push

`POST /api/sync/push` reçoit un batch d’opérations.

Pour chaque opération :

- si `operationId` existe déjà, l’opération n’est pas rejouée ;
- si l’opération est valide, elle est appliquée ;
- si elle échoue, elle est enregistrée comme rejetée ;
- les autres opérations du batch continuent à être traitées.

## 11.3 Pull

`GET /api/sync/pull` retourne :

- `serverTime` ;
- les incidents modifiés depuis `since` ;
- les alertes modifiées depuis `since`.

## 11.4 Statut

`GET /api/sync/status` retourne l’état du client :

- dernier push ;
- dernier pull ;
- dernier succès ;
- statut ;
- dernière erreur éventuelle.

## 11.5 Limites actuelles

La version actuelle ne gère pas encore un vrai système de conflits avancés.

La stratégie actuelle est suffisante pour une synchronisation simple, mais une version complète devrait ajouter :

- table de conflits ;
- résolution manuelle ;
- suppression synchronisée ;
- stratégie claire `server_wins`, `client_wins` ou `last_write_wins` ;
- audit détaillé des conflits.

---

## 12. Micro-langage MongoDB avec Jison

## 12.1 Localisation

Le DSL est dans :

```txt
apps/api/src/dsl
```

La grammaire Jison est dans :

```txt
apps/api/src/dsl/grammar/dsl.jison
```

## 12.2 Fonctionnement

Le module DSL fonctionne ainsi :

```txt
requête texte
→ parser Jison
→ AST
→ validation sécurité
→ traduction en filtre Mongoose
→ exécution en lecture seule
```

## 12.3 Syntaxe supportée

Exemples :

```txt
FIND services
FIND services WHERE category = "bricolage"
FIND incidents WHERE severity = "high" AND status != "closed"
FIND alerts WHERE source = "javafx"
FIND services WHERE pricePoints >= 10
```

Opérateurs supportés :

```txt
=
!=
CONTAINS
>
<
>=
<=
AND
```

## 12.4 Collections autorisées

Dans l’état actuel, le DSL est limité à des collections autorisées :

```txt
services
events
votes
incidents
alerts
```

## 12.5 Sécurité

Le DSL est strictement en lecture seule.

Il refuse :

- les collections non autorisées ;
- les champs non autorisés ;
- les mots-clés dangereux ;
- les opérateurs MongoDB bruts ;
- l’évaluation JavaScript ;
- les limites trop hautes.

Mots-clés interdits notamment :

```txt
DELETE
UPDATE
INSERT
DROP
REMOVE
SAVE
$where
$function
```

---

## 13. Docker et conteneurisation

## 13.1 Services Docker actuels

Le Docker Compose actuel lance :

```txt
mongodb
api
web
admin-web
```

## 13.2 Ports

| Service | URL / port |
|---|---|
| API | `http://localhost:3000` |
| Swagger | `http://localhost:3000/docs` |
| Web utilisateur | `http://localhost:5173` |
| Admin-web | `http://localhost:5174` |
| MongoDB | `localhost:27017` |

## 13.3 Fichiers Docker

```txt
.dockerignore
docker-compose.yml
apps/api/Dockerfile
apps/web/Dockerfile
apps/admin-web/Dockerfile
apps/web/nginx.conf
apps/admin-web/nginx.conf
```

## 13.4 Stratégie Docker

API :

- image `node:24-alpine` ;
- pnpm via Corepack ;
- build NestJS ;
- lancement en production avec `node dist/main` ;
- connexion MongoDB via `mongodb://mongodb:27017/connected-neighbours`.

Web et admin-web :

- build Vite ;
- service statique via Nginx ;
- proxy `/api/` vers le service API ;
- ports exposés `5173` et `5174`.

MongoDB :

- image `mongo:8` ;
- volume persistant ;
- healthcheck.

## 13.5 Variables déclarées dans Docker

Le Compose fournit les variables nécessaires à l’API :

```txt
NODE_ENV
PORT
CORS_ORIGIN
COOKIE_SECRET
MONGODB_URI
JWT_SECRET
JWT_EXPIRES_IN
DEV_AUTH_SEED
NEO4J_URI
NEO4J_USERNAME
NEO4J_PASSWORD
MINIO_ENDPOINT
MINIO_PORT
MINIO_USE_SSL
MINIO_ACCESS_KEY
MINIO_SECRET_KEY
MINIO_BUCKET
KEYCLOAK_BASE_URL
KEYCLOAK_REALM
KEYCLOAK_CLIENT_ID
KEYCLOAK_CLIENT_SECRET
```

Important : Neo4j, MinIO et Keycloak sont renseignés comme variables, mais ne sont pas encore lancés comme services Docker dans la stack actuelle.

## 13.6 Commandes Docker

Lancer la stack :

```bash
docker compose up --build -d
```

Vérifier :

```bash
docker compose ps
```

Arrêter :

```bash
docker compose down
```

Réinitialiser avec suppression du volume MongoDB :

```bash
docker compose down -v
```

---

## 14. Sécurité

## 14.1 Authentification actuelle

La sécurité actuelle repose sur :

- JWT local ;
- mots de passe hachés ;
- comptes de démonstration ;
- guards NestJS ;
- rôles `resident`, `moderator`, `admin`.

## 14.2 Autorisation

Les routes admin sont protégées par :

```txt
JwtAuthGuard
RolesGuard
Role.ADMIN
```

Les routes métier contrôlent partiellement :

- l’utilisateur connecté ;
- le propriétaire du service ;
- le candidat ;
- les signataires du contrat.

## 14.3 Protection des données sensibles

Mesures actuelles :

- `passwordHash` non exposé dans admin/users ;
- `passwordHash` non exporté dans RGPD ;
- export RGPD normalisé ;
- API DSL en lecture seule ;
- collections DSL limitées ;
- Docker ignore les fichiers sensibles ;
- `.env` ne doit pas être versionné.

## 14.4 Limites sécurité

Non implémenté actuellement :

- Keycloak réel ;
- SSO web + JavaFX ;
- MFA/TOTP ;
- refresh token complet ;
- rotation de secrets ;
- rate limiting ;
- journal d’audit global ;
- gestion avancée des permissions.

Pour la soutenance, il faut présenter JWT local comme une version de démonstration et Keycloak/MFA comme une évolution prévue ou partielle.

---

## 15. RGPD

## 15.1 Export actuel

L’endpoint :

```txt
GET /api/rgpd/export
```

retourne les données personnelles liées à l’utilisateur connecté.

Sections actuelles :

```txt
exportedAt
user
services
applicationsAsApplicant
applicationsAsOwner
contracts
pointTransactions
incidents
alerts
syncOperations
documents
```

## 15.2 Normalisation

Les documents exportés sont normalisés :

- `id` au lieu de `_id` ;
- suppression de `_id` ;
- suppression de `__v` ;
- absence de `passwordHash`.

## 15.3 Limites RGPD

Les fonctionnalités suivantes restent à développer :

- demande de suppression ;
- anonymisation ;
- rectification ;
- historique des demandes RGPD ;
- export ZIP ;
- interface admin RGPD.

---

## 16. Tests et validation

## 16.1 Tests unitaires API

L’API dispose de tests unitaires sur les modules principaux.

Validation récente :

```txt
12 suites de tests
73 tests unitaires passés
```

Modules couverts notamment :

- services ;
- applications ;
- contracts ;
- points ;
- incidents ;
- alerts ;
- sync ;
- dsl ;
- admin.

## 16.2 Tests E2E API

Un test E2E couvre le parcours principal.

Validation récente :

```txt
1 suite E2E
10 tests E2E passés
```

Scénarios couverts :

- health ;
- login admin/Alice/Bob ;
- publication et annulation de service ;
- création service payant ;
- candidature ;
- acceptation ;
- contrat depuis candidature ;
- réservation de points ;
- double signature ;
- completion ;
- transfert de points ;
- incidents et alertes ;
- synchronisation JavaFX côté API ;
- DSL Jison ;
- endpoints admin ;
- export RGPD.

## 16.3 Builds front

Les builds suivants ont été validés :

```bash
pnpm --filter "./apps/web" run build
pnpm --filter "./apps/admin-web" run build
```

## 16.4 Validation Docker

La stack Docker a été validée avec :

```bash
docker compose config
docker compose up --build -d
docker compose ps
```

Services validés :

```txt
cn-mongodb healthy
cn-api up
cn-web up
cn-admin-web up
```

## 16.5 Commandes de validation recommandées

```bash
pnpm --filter "./apps/api" run build
pnpm --filter "./apps/api" run test
pnpm --filter "./apps/api" run test:e2e
pnpm --filter "./apps/web" run build
pnpm --filter "./apps/admin-web" run build
docker compose up --build -d
docker compose ps
```

---

## 17. Écarts techniques avec la cible initiale

## 17.1 Neo4j

Cible :

- graphe social ;
- recommandations événements ;
- recommandations services ;
- voisins fiables.

État actuel :

- variables présentes ;
- dépendance ou configuration prévue ;
- pas de service Docker Neo4j dans la stack actuelle ;
- pas de module fonctionnel de recommandations Neo4j.

Priorité recommandée : P1.

## 17.2 MinIO

Cible :

- stockage PDF ;
- fichiers de messagerie ;
- preuves ;
- presigned URLs.

État actuel :

- variables présentes ;
- pas de service Docker MinIO ;
- pas de vrai module storage complet ;
- documents API V1 sans stockage objet complet.

Priorité recommandée : P1 si les documents PDF doivent être démontrés.

## 17.3 Keycloak / SSO / MFA

Cible :

- SSO web + JavaFX ;
- MFA pour actions sensibles ;
- authentification centralisée.

État actuel :

- JWT local ;
- rôles fonctionnels ;
- variables Keycloak présentes ;
- pas de Keycloak réel.

Priorité recommandée : P2 ou limitation assumée.

## 17.4 Socket.IO

Cible :

- messagerie temps réel ;
- présence online/offline ;
- notifications instantanées.

État actuel :

- non implémenté ;
- messagerie REST basique uniquement.

Priorité recommandée : P1/P2 selon temps.

## 17.5 Carte géographique

Cible :

- Leaflet ;
- dessin de polygone ;
- GeoJSON ;
- vérification d’appartenance.

État actuel :

- quartiers API basiques ;
- pas de carte dans admin-web.

Priorité recommandée : P1.

## 17.6 i18n

Cible : application multilingue.

État actuel : interface française uniquement.

Priorité recommandée : P2.

---

## 18. Déploiement et environnements

## 18.1 Environnement local développement

Mode local :

```bash
pnpm install
docker compose up -d mongodb
pnpm dev:api
pnpm dev:web
pnpm dev:admin
```

Adresses :

```txt
API        http://localhost:3000/api
Swagger    http://localhost:3000/docs
Web        http://localhost:5173
Admin-web  http://localhost:5174
MongoDB    localhost:27017
```

## 18.2 Environnement Docker démonstration

Mode Docker complet P0 :

```bash
docker compose up --build -d
```

Adresses :

```txt
Swagger    http://localhost:3000/docs
Web        http://localhost:5173
Admin-web  http://localhost:5174
MongoDB    localhost:27017
```

## 18.3 Production

Le Docker Compose actuel est adapté à une démonstration locale.

Pour une production réelle, il faudrait ajouter :

- secrets sécurisés ;
- reverse proxy HTTPS ;
- certificats TLS ;
- variables par environnement ;
- volumes sauvegardés ;
- monitoring ;
- logs centralisés ;
- migrations ;
- durcissement CORS ;
- Keycloak réel ;
- MinIO réel ;
- Neo4j réel.

---

## 19. Limites connues

| Domaine | Limite actuelle |
|---|---|
| JavaFX | Sync côté client à finaliser |
| Neo4j | Non branché réellement |
| MinIO | Non branché réellement |
| Keycloak | Non branché réellement |
| MFA | Non implémenté |
| Documents PDF | V1 incomplète, pas de PDF signé final complet |
| Messagerie | REST basique, pas de temps réel ni multimédia |
| Événements | API V1, pas de parcours web complet |
| Votes | API V1, pas de parcours web complet |
| Litiges | Pas de module complet |
| Avis | Non implémenté |
| Notifications | Non implémentées comme module complet |
| Modération | Non implémentée comme module complet |
| Quartiers géographiques | Pas de carte Leaflet / GeoJSON complet côté UI |
| i18n | Non implémenté |
| Production | Docker local, pas un déploiement durci production |

---

## 20. Prochaines priorités techniques

## 20.1 Priorité P0

À traiter en priorité pour une soutenance défendable :

1. Finaliser la synchronisation côté JavaFX.
2. Générer et tester le JAR JavaFX.
3. Vérifier la persistance locale JavaFX.
4. Nettoyer les anciennes données de seed inutiles.
5. Vérifier Swagger et les exemples principaux.
6. Stabiliser les scénarios de démonstration.

## 20.2 Priorité P1

Améliorations importantes :

1. Ajouter une page quartiers avec carte ou au moins administration basique.
2. Ajouter pages événements et votes dans le web.
3. Ajouter une messagerie web simple.
4. Ajouter MinIO minimal pour documents.
5. Ajouter Neo4j minimal pour recommandations.
6. Ajouter un module litiges simple.
7. Ajouter avis/réputation simple.

## 20.3 Priorité P2

Améliorations bonus :

1. Keycloak réel.
2. MFA réel.
3. Socket.IO temps réel.
4. Multilingue.
5. Notifications complètes.
6. Export RGPD ZIP.
7. Dashboard admin avancé.

---

## 21. Conclusion technique

Le projet dispose maintenant d’un socle technique solide et démontrable :

- API NestJS/Fastify structurée ;
- MongoDB fonctionnel ;
- workflow service/candidature/contrat/points complet ;
- incidents et alertes ;
- synchronisation API pour JavaFX ;
- DSL Jison ;
- export RGPD ;
- web utilisateur connecté ;
- back-office connecté ;
- Docker Compose fonctionnel ;
- tests unitaires et E2E.

Cependant, il reste des écarts importants avec la cible complète du sujet :

- JavaFX doit finaliser la synchronisation côté client ;
- Neo4j n’est pas encore utilisé ;
- MinIO n’est pas encore branché ;
- Keycloak/SSO/MFA ne sont pas encore réels ;
- les modules litiges, avis, notifications, modération, messagerie temps réel, événements et votes restent partiels ou absents côté interface.

Le projet est donc techniquement défendable si la soutenance présente clairement ce qui est réalisé, ce qui est partiel et ce qui relève des évolutions prévues.
