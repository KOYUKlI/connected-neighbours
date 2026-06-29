# 02 — Dossier technique final — Connected Neighbours

## 1. Objectif du document

Ce document présente l’architecture technique retenue pour le projet **Connected Neighbours**.

Il complète le descriptif fonctionnel en détaillant :

- l’organisation générale des applications ;
- les choix technologiques ;
- les bases de données utilisées ;
- la structure de l’API ;
- le fonctionnement du client web ;
- le fonctionnement du back-office ;
- le fonctionnement du client JavaFX offline-first ;
- le mécanisme de synchronisation ;
- la gestion des fichiers ;
- la sécurité ;
- la conformité RGPD ;
- le micro-langage MongoDB ;
- la stratégie de tests ;
- la conteneurisation ;
- le déploiement ;
- les limites et évolutions prévues.

---

# 2. Vue d’ensemble de l’architecture

## 2.1 Architecture globale

Connected Neighbours est composé de plusieurs briques applicatives :

```txt
[Application Web Utilisateur - React]
        |
        | REST / WebSocket
        v
[API Centrale - Node.js / NestJS / Fastify]
        |
        |---- MongoDB
        |---- Neo4j
        |---- MinIO
        |---- Keycloak
        |
        | REST Sync
        v
[Application JavaFX Administrateur]
        |
        v
[Base locale H2 ou SQLite]
```

Le système est organisé autour d’une API centrale qui expose les fonctionnalités métier aux applications clientes.

Les applications clientes sont :

- une application web pour les habitants ;
- un back-office web pour les administrateurs ;
- une application desktop JavaFX pour l’administration offline ;
- éventuellement des outils internes d’administration ou de test.

---

## 2.2 Objectifs de l’architecture

L’architecture doit répondre aux objectifs suivants :

1. Séparer clairement les responsabilités.
2. Permettre l’ajout de modules sans réécrire le cœur de l’application.
3. Centraliser les règles métier dans l’API.
4. Permettre au client JavaFX de fonctionner hors ligne.
5. Synchroniser les données locales JavaFX avec l’API.
6. Stocker les fichiers lourds hors MongoDB.
7. Utiliser Neo4j pour les recommandations.
8. Documenter l’API avec Swagger.
9. Conteneuriser les services principaux.
10. Préparer le déploiement et les tests.

---

# 3. Choix technologiques

## 3.1 Backend

### Technologie retenue

Le sujet impose un backend en **Node.js + Express**.  
Le projet utilise cependant une architecture **Node.js + NestJS avec Fastify**.

Ce choix permet de conserver un backend Node.js tout en bénéficiant d’une architecture plus structurée :

- modules séparés ;
- injection de dépendances ;
- contrôleurs ;
- services ;
- DTO ;
- validation ;
- guards ;
- documentation Swagger intégrée ;
- meilleure maintenabilité pour un projet volumineux.

Fastify remplace Express comme moteur HTTP pour de meilleures performances et une meilleure intégration avec NestJS.

### Stack backend

```txt
Node.js
NestJS
Fastify
TypeScript
Mongoose
Swagger / OpenAPI
JWT
Passport
Joi
Vitest ou Jest
Supertest
```

---

## 3.2 Front web utilisateur

Le front utilisateur est développé avec :

```txt
React
Vite
TypeScript
Tailwind CSS
React Query
React Router
i18n
```

Son rôle est de permettre aux habitants de :

- consulter leur quartier ;
- créer et suivre des services ;
- candidater ;
- signer des contrats ;
- consulter leurs points ;
- participer aux événements ;
- voter ;
- échanger via la messagerie ;
- consulter leurs notifications ;
- gérer leur profil et leurs données personnelles.

---

## 3.3 Back-office React

Le back-office administrateur est également développé avec React.

Il permet à l’administrateur de :

- gérer les quartiers ;
- gérer les utilisateurs ;
- modérer les contenus ;
- consulter les services ;
- suivre les contrats ;
- traiter les litiges ;
- consulter les incidents ;
- consulter les statistiques ;
- superviser la synchronisation JavaFX ;
- accéder aux demandes RGPD.

---

## 3.4 Client lourd JavaFX

L’application JavaFX est dédiée à l’administration locale.

Elle est développée avec :

```txt
Java
JavaFX
Spring Boot local
JPA
H2 ou SQLite
Maven
```

Elle doit pouvoir fonctionner sans Internet.

Elle gère notamment :

- les incidents ;
- les alertes ;
- les statistiques locales ;
- les thèmes ;
- les plugins ;
- la synchronisation avec l’API centrale.

---

## 3.5 Bases de données et stockage

| Usage | Technologie |
|---|---|
| Données applicatives principales | MongoDB |
| Graphe social et recommandations | Neo4j |
| Fichiers PDF, médias, preuves | MinIO |
| Données locales JavaFX | H2 ou SQLite |
| Authentification SSO/MFA | Keycloak |

---

# 4. Organisation du monorepo

## 4.1 Structure recommandée

```txt
connected-neighbours/
├── apps/
│   ├── api/
│   ├── web/
│   ├── admin-web/
│   └── admin-desktop/
│
├── packages/
│   ├── shared-types/
│   └── shared-config/
│
├── docs/
│   ├── _sources_officielles/
│   ├── final/
│   ├── roadmap/
│   └── diagrams/
│
├── docker-compose.yml
├── package.json
├── pnpm-workspace.yaml
└── README.md
```

---

## 4.2 Rôle des dossiers

| Dossier | Rôle |
|---|---|
| `apps/api` | API centrale |
| `apps/web` | Application web habitant |
| `apps/admin-web` | Back-office administrateur |
| `apps/admin-desktop` | Application JavaFX |
| `docs/final` | Documents finaux |
| `docs/diagrams` | Schémas d’architecture |
| `packages/shared-types` | Types partagés si nécessaire |
| `packages/shared-config` | Configuration commune si nécessaire |

---

# 5. Architecture backend

## 5.1 Principe général

L’API est conçue comme un monolithe modulaire.

Chaque domaine fonctionnel possède son propre module :

```txt
auth
users
neighborhoods
services
applications
proposals
contracts
points
documents
storage
events
votes
messaging
notifications
reviews
disputes
reports
incidents
alerts
sync
recommendations
rgpd
dsl
admin
```

Cette organisation permet :

- de séparer les responsabilités ;
- de limiter le couplage ;
- de faciliter les tests ;
- de documenter proprement chaque module ;
- de faire évoluer une fonctionnalité sans casser les autres.

---

## 5.2 Organisation type d’un module

Chaque module NestJS peut suivre cette structure :

```txt
module-name/
├── dto/
├── schemas/
├── module-name.controller.ts
├── module-name.service.ts
├── module-name.repository.ts
├── module-name.module.ts
└── tests/
```

Exemple pour le module services :

```txt
services/
├── dto/
│   ├── create-service.dto.ts
│   ├── update-service.dto.ts
│   └── search-services.dto.ts
├── schemas/
│   └── service.schema.ts
├── services.controller.ts
├── services.service.ts
├── services.repository.ts
├── services.module.ts
└── services.service.spec.ts
```

---

## 5.3 Validation des données

Les données entrantes doivent être validées via des DTO.

Règles générales :

- refuser les champs inconnus ;
- transformer les types lorsque nécessaire ;
- contrôler les formats ;
- vérifier les valeurs enum ;
- vérifier les droits dans les services métier.

Exemples :

- un prix en points ne peut pas être négatif ;
- un service payant doit avoir un prix ;
- une candidature ne peut pas être créée par le propriétaire du service ;
- une signature ne peut être faite que par la personne assignée.

---

## 5.4 Documentation Swagger

L’API doit exposer une documentation Swagger accessible.

La documentation doit inclure :

- les routes ;
- les paramètres ;
- les DTO ;
- les réponses ;
- les erreurs possibles ;
- l’authentification Bearer ;
- les rôles requis ;
- les exemples de payload.

Objectif : permettre au jury de tester facilement l’API.

---

# 6. Modules backend principaux

## 6.1 Module Auth

Rôle :

- connecter un utilisateur ;
- fournir un JWT ;
- récupérer le profil connecté ;
- gérer les rôles ;
- préparer l’intégration SSO/MFA.

Routes principales :

```txt
POST   /api/auth/login
POST   /api/auth/logout
POST   /api/auth/refresh
GET    /api/auth/me
POST   /api/auth/mfa/verify
```

---

## 6.2 Module Users

Rôle :

- gérer les profils ;
- gérer les rôles ;
- désactiver ou réactiver des comptes ;
- fournir les données personnelles pour le RGPD.

Routes principales :

```txt
GET    /api/users/me
PATCH  /api/users/me
GET    /api/admin/users
GET    /api/admin/users/:id
PATCH  /api/admin/users/:id
PATCH  /api/admin/users/:id/role
```

---

## 6.3 Module Neighborhoods

Rôle :

- gérer les quartiers ;
- stocker les zones GeoJSON ;
- rattacher les utilisateurs et contenus à un quartier.

Routes principales :

```txt
POST   /api/neighborhoods
GET    /api/neighborhoods
GET    /api/neighborhoods/:id
PATCH  /api/neighborhoods/:id
DELETE /api/neighborhoods/:id
POST   /api/neighborhoods/:id/contains-point
```

---

## 6.4 Module Services

Rôle :

- créer des offres ou demandes de services ;
- gérer le cycle de vie du service ;
- relier les services aux candidatures, contrats, points, messages et litiges.

Routes principales :

```txt
POST   /api/services
GET    /api/services
GET    /api/services/:id
PATCH  /api/services/:id
DELETE /api/services/:id
POST   /api/services/:id/publish
POST   /api/services/:id/start
POST   /api/services/:id/mark-done
POST   /api/services/:id/validate
POST   /api/services/:id/cancel
POST   /api/services/:id/dispute
```

---

## 6.5 Module Applications

Rôle :

- permettre aux voisins de candidater à un service ;
- gérer les candidatures ;
- permettre la sélection d’un candidat.

Routes principales :

```txt
POST   /api/services/:serviceId/applications
GET    /api/services/:serviceId/applications
GET    /api/applications/me
POST   /api/applications/:id/accept
POST   /api/applications/:id/reject
POST   /api/applications/:id/withdraw
```

---

## 6.6 Module Proposals

Rôle :

- gérer les contre-propositions ;
- versionner les conditions ;
- fournir la proposition finale au contrat.

Routes principales :

```txt
POST   /api/applications/:applicationId/proposals
GET    /api/applications/:applicationId/proposals
POST   /api/proposals/:id/accept
POST   /api/proposals/:id/reject
POST   /api/proposals/:id/cancel
```

---

## 6.7 Module Contracts

Rôle :

- générer les contrats ;
- suivre les signatures ;
- gérer les avenants ;
- gérer les annulations et litiges.

Routes principales :

```txt
POST   /api/contracts/from-application/:applicationId
GET    /api/contracts
GET    /api/contracts/:id
POST   /api/contracts/:id/send
POST   /api/contracts/:id/sign
POST   /api/contracts/:id/complete
POST   /api/contracts/:id/cancel
POST   /api/contracts/:id/dispute
GET    /api/contracts/:id/audit
```

---

## 6.8 Module Points

Rôle :

- réserver les points ;
- transférer les points ;
- libérer les points ;
- geler les points en cas de litige ;
- conserver l’historique des transactions.

Routes principales :

```txt
GET    /api/points/balance
GET    /api/points/transactions
POST   /api/points/reserve
POST   /api/points/release
POST   /api/points/transfer-reserved
POST   /api/points/freeze
POST   /api/points/unfreeze
```

---

## 6.9 Module Documents

Rôle :

- gérer les PDF ;
- gérer les zones de signature ;
- signer les documents ;
- générer et archiver les documents finaux.

Routes principales :

```txt
POST   /api/documents
GET    /api/documents
GET    /api/documents/:id
POST   /api/documents/:id/fields
POST   /api/documents/:id/fields/:fieldId/sign
POST   /api/documents/:id/finalize
GET    /api/documents/:id/download/signed
GET    /api/documents/:id/audit
```

---

## 6.10 Module Storage

Rôle :

- générer des URLs temporaires MinIO ;
- stocker les métadonnées ;
- protéger les accès aux fichiers.

Routes principales :

```txt
POST   /api/storage/presign-upload
POST   /api/storage/presign-download
GET    /api/storage/files/:id
DELETE /api/storage/files/:id
```

---

## 6.11 Module Messaging

Rôle :

- créer des conversations ;
- envoyer des messages ;
- gérer les fichiers ;
- gérer le temps réel ;
- relier les messages aux services, contrats et litiges.

Routes principales :

```txt
POST   /api/conversations
GET    /api/conversations
GET    /api/conversations/:id
POST   /api/conversations/:id/messages
GET    /api/conversations/:id/messages
POST   /api/conversations/:id/read
```

---

## 6.12 Module Events

Rôle :

- créer et gérer les événements de quartier ;
- permettre les réponses ;
- alimenter Neo4j pour les recommandations.

Routes principales :

```txt
POST   /api/events
GET    /api/events
GET    /api/events/:id
PATCH  /api/events/:id
POST   /api/events/:id/respond
GET    /api/events/recommended
```

---

## 6.13 Module Votes

Rôle :

- créer des votes paramétrables ;
- gérer les réponses ;
- afficher les résultats.

Routes principales :

```txt
POST   /api/votes
GET    /api/votes
GET    /api/votes/:id
POST   /api/votes/:id/answers
GET    /api/votes/:id/results
POST   /api/votes/:id/close
```

---

## 6.14 Module Incidents et Alerts

Rôle :

- créer et suivre les incidents ;
- gérer les alertes ;
- synchroniser avec JavaFX.

Routes principales :

```txt
POST   /api/incidents
GET    /api/incidents
GET    /api/incidents/:id
PATCH  /api/incidents/:id
POST   /api/incidents/:id/alerts
POST   /api/incidents/:id/resolve
```

---

## 6.15 Module Sync

Rôle :

- recevoir les opérations JavaFX offline ;
- envoyer les changements serveur ;
- gérer les conflits ;
- historiser les synchronisations.

Routes principales :

```txt
POST   /api/sync/push
GET    /api/sync/pull?since=...
POST   /api/sync/conflicts/:id/resolve
GET    /api/sync/status
GET    /api/sync/history
```

---

## 6.16 Module DSL MongoDB

Rôle :

- parser une requête écrite en micro-langage ;
- générer un AST ;
- traduire vers MongoDB ;
- exécuter la requête sur une collection autorisée.

Routes principales :

```txt
POST   /api/dsl/parse
POST   /api/dsl/execute
GET    /api/dsl/examples
```

---

# 7. Modélisation MongoDB

## 7.1 Principe

MongoDB stocke les documents applicatifs principaux.

Collections recommandées :

```txt
users
neighborhoods
services
applications
proposals
contracts
points_transactions
documents
document_fields
events
event_responses
votes
vote_answers
conversations
messages
notifications
reviews
disputes
reports
incidents
alerts
sync_operations
audit_logs
```

---

## 7.2 Exemple de document Service

```json
{
  "_id": "service_id",
  "type": "request",
  "title": "Aide pour monter un meuble",
  "description": "Besoin d’aide samedi après-midi",
  "category": "bricolage",
  "neighborhoodId": "neighborhood_id",
  "ownerId": "user_id",
  "isPaid": true,
  "pricePoints": 50,
  "status": "open_to_applications",
  "selectedApplicationId": null,
  "contractId": null,
  "conversationId": null,
  "createdAt": "2026-06-29T10:00:00Z",
  "updatedAt": "2026-06-29T10:00:00Z"
}
```

---

## 7.3 Exemple de document Contract

```json
{
  "_id": "contract_id",
  "serviceId": "service_id",
  "applicationId": "application_id",
  "requesterId": "user_a",
  "providerId": "user_b",
  "pricePoints": 50,
  "status": "awaiting_signatures",
  "signedByIds": [],
  "documentId": "document_id",
  "auditTrail": [],
  "createdAt": "2026-06-29T10:30:00Z"
}
```

---

## 7.4 Exemple de transaction de points

```json
{
  "_id": "transaction_id",
  "type": "reservation",
  "amount": 50,
  "fromUserId": "user_a",
  "toUserId": null,
  "serviceId": "service_id",
  "contractId": "contract_id",
  "reason": "Reservation for paid service",
  "createdAt": "2026-06-29T10:35:00Z"
}
```

---

# 8. Modélisation Neo4j

## 8.1 Objectif

Neo4j stocke les relations sociales et les interactions entre les habitants.

Il permet de créer des recommandations plus pertinentes que de simples filtres MongoDB.

---

## 8.2 Noeuds

```txt
User
Neighborhood
Service
Event
Vote
Category
```

---

## 8.3 Relations

```txt
(User)-[:LIVES_IN]->(Neighborhood)
(User)-[:CREATED]->(Service)
(User)-[:APPLIED_TO]->(Service)
(User)-[:COMPLETED]->(Service)
(User)-[:HELPED]->(User)
(User)-[:REVIEWED]->(User)
(User)-[:PARTICIPATED_IN]->(Event)
(User)-[:INTERESTED_IN]->(Event)
(User)-[:VOTED_ON]->(Vote)
(Service)-[:IN_CATEGORY]->(Category)
(Event)-[:IN_CATEGORY]->(Category)
```

---

## 8.4 Recommandations

Le moteur de recommandation peut utiliser :

- le quartier ;
- les catégories préférées ;
- les services déjà réalisés ;
- les voisins déjà aidés ;
- les avis ;
- les participations communes ;
- la popularité d’un événement ;
- la réputation.

Exemples :

- recommander des événements similaires ;
- recommander des voisins fiables ;
- recommander des candidats pour un service ;
- recommander des services compatibles.

---

# 9. Stockage MinIO

## 9.1 Objectif

MinIO permet de stocker les fichiers lourds sans surcharger MongoDB.

Fichiers concernés :

- PDF originaux ;
- PDF signés ;
- images ;
- vocaux ;
- pièces jointes ;
- preuves de litige ;
- documents d’incident ;
- avatars.

---

## 9.2 Fonctionnement

1. Le client demande une URL d’upload.
2. L’API vérifie les droits.
3. L’API génère une URL temporaire MinIO.
4. Le client upload le fichier directement vers MinIO.
5. L’API enregistre les métadonnées en MongoDB.
6. Le fichier est récupéré via une URL temporaire de téléchargement.

---

## 9.3 Métadonnées fichier

```json
{
  "_id": "file_id",
  "objectKey": "documents/original/file.pdf",
  "bucket": "connected-neighbours",
  "filename": "contrat.pdf",
  "mimeType": "application/pdf",
  "size": 102400,
  "ownerId": "user_id",
  "contextType": "contract",
  "contextId": "contract_id",
  "createdAt": "2026-06-29T10:00:00Z"
}
```

---

# 10. Application JavaFX

## 10.1 Objectif

L’application JavaFX permet à l’administrateur de gérer les incidents et alertes même sans connexion Internet.

---

## 10.2 Architecture JavaFX

```txt
[JavaFX UI]
    |
    v
[Spring local services]
    |
    v
[Repositories locaux]
    |
    v
[Base locale H2/SQLite]
    |
    v
[Outbox de synchronisation]
```

---

## 10.3 Fonctionnalités

P0 :

- lancement de l’application ;
- consultation incidents ;
- création incident ;
- modification statut ;
- ajout alerte ;
- statistiques simples ;
- stockage local.

P1 :

- outbox ;
- push vers API ;
- pull depuis API ;
- résolution de conflits ;
- génération JAR.

P2 :

- plugins ;
- thèmes ;
- mises à jour automatiques ;
- désinstallation depuis l’interface.

---

## 10.4 Base locale

Tables recommandées :

```txt
incidents
alerts
reporters
sync_outbox
sync_state
sync_conflicts
themes
plugins
```

---

# 11. Synchronisation JavaFX / API

## 11.1 Principe

La synchronisation repose sur un modèle push/pull.

```txt
JavaFX offline
    |
    | stocke les actions dans outbox
    v
Connexion disponible
    |
    | push opérations locales
    v
API
    |
    | pull changements serveur
    v
JavaFX met à jour sa base locale
```

---

## 11.2 Outbox locale

Chaque opération hors ligne est stockée.

Exemple :

```json
{
  "operationId": "uuid",
  "entityType": "incident",
  "entityId": "incident_id",
  "operationType": "create",
  "payload": {},
  "createdAt": "2026-06-29T10:00:00Z",
  "status": "pending",
  "retryCount": 0,
  "lastError": null
}
```

---

## 11.3 Push

Le client JavaFX envoie ses opérations locales à l’API.

L’API doit :

- valider les opérations ;
- éviter les doublons via `operationId` ;
- appliquer les changements ;
- retourner les opérations acceptées ou rejetées ;
- créer un audit de synchronisation.

---

## 11.4 Pull

Le client JavaFX récupère les changements serveur depuis `lastSyncAt`.

L’API renvoie :

- incidents modifiés ;
- alertes modifiées ;
- suppressions ;
- conflits ;
- date serveur.

---

## 11.5 Conflits

Un conflit peut apparaître si :

- la même entité est modifiée côté client et serveur ;
- une entité supprimée côté serveur est modifiée localement ;
- deux actions contradictoires existent.

Stratégies :

- `server_wins` ;
- `client_wins` ;
- `last_write_wins` ;
- résolution manuelle.

---

# 12. Sécurité

## 12.1 Authentification

La version de développement peut utiliser JWT local.

La version cible prévoit :

- Keycloak ;
- OIDC ;
- SSO entre web et JavaFX ;
- MFA TOTP.

---

## 12.2 Autorisation

L’API utilise des rôles :

```txt
resident
moderator
admin
```

Chaque route sensible doit être protégée.

Exemples :

- seul le propriétaire peut modifier son service ;
- seul un signataire peut signer son champ ;
- seul un admin peut gérer les quartiers ;
- seul un modérateur peut résoudre un signalement ;
- seul un admin peut consulter les statistiques globales.

---

## 12.3 Actions sensibles

Les actions suivantes doivent être sécurisées :

- connexion ;
- modification de mot de passe ;
- modification email ;
- modification téléphone ;
- signature de document ;
- suppression ou anonymisation de compte ;
- action admin critique.

---

## 12.4 Validation et protection

L’API doit prévoir :

- validation DTO ;
- protection CORS ;
- Helmet ;
- cookies sécurisés si utilisés ;
- limitation des champs autorisés ;
- contrôle des rôles ;
- contrôle de propriété ;
- logs d’audit ;
- gestion propre des erreurs.

---

# 13. RGPD

## 13.1 Données personnelles concernées

- profil ;
- email ;
- téléphone ;
- messages ;
- signatures ;
- documents ;
- services ;
- candidatures ;
- contrats ;
- transactions ;
- événements ;
- votes ;
- avis ;
- incidents ;
- signalements ;
- logs d’audit.

---

## 13.2 Droits utilisateur

L’utilisateur doit pouvoir :

- accéder à ses données ;
- exporter ses données ;
- demander une rectification ;
- demander une suppression ;
- demander une anonymisation.

---

## 13.3 Contraintes métier

Certaines données ne doivent pas être supprimées brutalement si elles servent de preuve.

Exemples :

- contrat signé ;
- litige ;
- transaction de points ;
- audit de signature ;
- décision de modération.

Dans ces cas, les données doivent être anonymisées ou conservées avec justification.

---

# 14. Micro-langage MongoDB

## 14.1 Objectif

Le micro-langage permet d’écrire des requêtes simples sur certaines collections MongoDB.

Exemples :

```txt
FIND services WHERE category = "bricolage" AND pricePoints <= 50
FIND events WHERE category = "sport" AND status = "published"
FIND votes WHERE status = "open"
```

---

## 14.2 Fonctionnement technique

1. Analyse lexicale.
2. Analyse syntaxique.
3. Génération d’un AST.
4. Validation de sécurité.
5. Traduction en filtre MongoDB.
6. Exécution.
7. Retour des résultats.

---

## 14.3 Sécurité

Le DSL doit empêcher :

- l’accès à des collections sensibles ;
- les suppressions directes ;
- les requêtes trop larges ;
- les opérateurs dangereux ;
- l’injection MongoDB.

Collections autorisées :

```txt
services
events
votes
documents
incidents
```

---

# 15. Temps réel

## 15.1 Objectif

Le temps réel est utilisé pour :

- la messagerie ;
- la présence online/offline ;
- les notifications ;
- certains événements système.

---

## 15.2 Événements Socket.IO

```txt
conversation.join
conversation.leave
message.send
message.new
message.read
typing.start
typing.stop
presence.online
presence.offline
notification.new
```

---

# 16. Conteneurisation

## 16.1 Services Docker attendus

```txt
api
web
admin-web
mongodb
neo4j
minio
keycloak
```

---

## 16.2 Fichiers nécessaires

```txt
docker-compose.yml
apps/api/Dockerfile
apps/web/Dockerfile
apps/admin-web/Dockerfile
.env.example
README_DEPLOIEMENT.md
```

---

## 16.3 Commande de lancement

```bash
docker compose up -d
```

---

## 16.4 Ports recommandés

| Service | Port |
|---|---|
| API | 3000 |
| Swagger | 3000/docs |
| Web utilisateur | 5173 |
| Admin web | 5174 |
| MongoDB | 27017 |
| Neo4j HTTP | 7474 |
| Neo4j Bolt | 7687 |
| MinIO API | 9000 |
| MinIO Console | 9001 |
| Keycloak | 8080 |

---

# 17. Tests

## 17.1 Tests unitaires

À prévoir sur :

- services métier ;
- contrats ;
- points ;
- votes ;
- documents ;
- incidents ;
- synchronisation ;
- DSL.

---

## 17.2 Tests d’intégration

À prévoir sur :

- API + MongoDB ;
- API + Neo4j ;
- API + MinIO ;
- API + Keycloak si intégré ;
- JavaFX + base locale.

---

## 17.3 Tests E2E

Parcours prioritaires :

1. Connexion.
2. Création d’un service.
3. Candidature.
4. Acceptation.
5. Génération contrat.
6. Signature.
7. Réservation de points.
8. Validation service.
9. Transfert points.
10. Ouverture litige.
11. Création événement.
12. Réponse vote.
13. Export RGPD.
14. Synchronisation JavaFX.

---

# 18. Déploiement

## 18.1 Objectif

Le projet doit être déployable et démontrable.

Un projet non déployé ne peut pas être considéré comme finalisé.

---

## 18.2 Environnements

```txt
development
test
production
```

---

## 18.3 Variables d’environnement

Exemples :

```txt
NODE_ENV
PORT
MONGODB_URI
NEO4J_URI
NEO4J_USER
NEO4J_PASSWORD
MINIO_ENDPOINT
MINIO_ACCESS_KEY
MINIO_SECRET_KEY
KEYCLOAK_URL
JWT_SECRET
CORS_ORIGIN
```

---

# 19. Documentation technique attendue

Le dossier technique doit contenir :

- architecture globale ;
- schéma des applications ;
- schéma des bases ;
- description des modules API ;
- description des routes principales ;
- modèle MongoDB ;
- modèle Neo4j ;
- fonctionnement MinIO ;
- fonctionnement JavaFX ;
- synchronisation ;
- sécurité ;
- RGPD ;
- micro-langage ;
- Docker ;
- tests ;
- limites et évolutions.

---

# 20. Limites connues et évolutions

## 20.1 Limites possibles

- Keycloak/MFA peut être partiel en version finale.
- Neo4j peut être limité à des recommandations simples.
- MinIO peut être limité aux documents principaux.
- Les appels vidéo peuvent rester en bonus.
- La résolution de conflits JavaFX peut être simple en V1.
- Le micro-langage peut être limité à des requêtes de lecture.

---

## 20.2 Évolutions possibles

- recommandations plus avancées ;
- scoring de réputation plus précis ;
- messagerie vocale complète ;
- appels vidéo ;
- tableau de bord analytique ;
- export RGPD ZIP ;
- gestion avancée des permissions ;
- application mobile ;
- notifications email complètes.

---

# 21. Conclusion technique

L’architecture technique de Connected Neighbours repose sur une API centrale modulaire, des interfaces web React, une application JavaFX offline-first, plusieurs systèmes de persistance et une conteneurisation complète.

Le point clé du projet est l’intégration entre les modules :

```txt
services
candidatures
contrats
points
documents
messagerie
litiges
incidents
synchronisation
```

Le projet sera techniquement solide si :

- l’API est documentée ;
- le parcours service complet fonctionne ;
- JavaFX fonctionne hors ligne ;
- la synchronisation est démontrable ;
- les fichiers sont stockés proprement ;
- les données sont exportables ;
- Docker permet de lancer l’environnement ;
- les tests couvrent les parcours critiques.
