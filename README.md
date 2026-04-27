# Connected Neighbours

Plateforme collaborative de quartier permettant aux habitants :
- d’échanger des services (gratuits ou payants via un système de points),
- de générer et signer des contrats numériques,
- de gérer des documents PDF avec zones de signature/initiales et archivage,
- de participer à des événements (avec recommandations basées sur Neo4j),
- de communiquer via une messagerie multimédia sécurisée,
- de créer des votes paramétrables et extensibles.

Une application **JavaFX** (client lourd) est dédiée à l’administration : incidents/alertes, statistiques, fonctionnement **offline-first** (base locale) avec **synchronisation** automatique.

## Tech stack
- Front : React
- Back : Node.js + NestJS/Fastify
- Bases : MongoDB (données) + Neo4j (recommandations)
- Client admin : Java + JavaFX (SQLite/H2 + sync)
- Realtime : WebSocket / Socket.IO
- Auth : SSO + MFA (OIDC)
- Déploiement : Docker / Docker Compose

## Structure du repository
- `frontend/` : application React (utilisateur + admin)
- `apps/api/` : API Node.js NestJS/Fastify
- `javafx/` : application desktop JavaFX (admin)
- `docs/` : livrables MyGES, spécifications, décisions (ADR)
- `diagrams/` : schémas d’architecture

## Workflow Git
- Branches : `main` (stable), `dev` (intégration), `feature/CONNECTEDN-xx-*`
- PR obligatoire vers `dev`
- Pas de push direct sur `main`

## Documentation Étape 1
- `docs/etape1/01_Descriptif_fonctionnel.md`
- `docs/etape1/02_Presentation_infrastructure.md`
- `docs/etape1/03_Presentation_technos.md`
