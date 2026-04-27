# APIs et frameworks externes — Étape 2

## Front web

- React : interface utilisateur.
- Vite : serveur de développement et build.
- TypeScript : typage.
- TanStack Query : chargement et invalidation des données API.
- Axios est présent dans les dépendances, mais le client actuel utilise `fetch`.
- React Hook Form et Zod sont prévus pour les formulaires complexes.
- i18next / react-i18next sont prévus pour le multilingue.
- Leaflet / React Leaflet sont prévus pour la définition géographique du quartier.
- Socket.IO client est prévu pour la messagerie et la présence.

## API

- NestJS : structuration modulaire du backend.
- Fastify : moteur HTTP actuel.
- Mongoose : accès MongoDB.
- Passport JWT : authentification locale de démonstration.
- Nest Swagger : documentation OpenAPI.
- class-validator / class-transformer : validation DTO.
- Joi : validation des variables d'environnement.
- neo4j-driver : futur accès Neo4j.
- AWS SDK S3 : futur accès MinIO via API S3.

## Client Java

- Java 17 : version cible.
- JavaFX : interface desktop.
- SQLite JDBC : base locale embarquée.
- Jackson : sérialisation JSON pour la synchronisation.

## Services d'infrastructure

- MongoDB : stockage applicatif principal.
- Neo4j : recommandations et graphe social.
- Keycloak : SSO et MFA cible.
- MinIO : stockage S3 compatible pour PDF, documents signés et médias.
- Docker Compose : orchestration locale cible.

## Point d'attention

Le sujet initial mentionne Express, mais l'utilisation de NestJS/Fastify a été validée par l'enseignant. Le dossier technique et la présentation orale doivent le rappeler explicitement.
