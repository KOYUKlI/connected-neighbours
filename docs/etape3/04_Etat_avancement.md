# État d'avancement — Étape 3

Date de référence : 27/04/2026.

## Réalisé

- API modulaire NestJS/Fastify.
- Swagger disponible.
- Authentification locale JWT avec rôles.
- Services entre voisins.
- Contrats et points.
- Quartiers avec zone GeoJSON.
- Événements et recommandations simples.
- Votes paramétrables.
- Documents PDF V1 avec zones de signature.
- Messagerie texte REST V1.
- Export RGPD V1.
- Client web utilisateur branché sur services, contrats et points.
- Tests unitaires API existants au vert.
- Lint et build API au vert.
- Typecheck, lint et build web au vert.

## Partiellement réalisé

- Recommandations : logique simple, Neo4j non branché.
- Documents : métadonnées/signatures V1, import réel MinIO à brancher.
- Messagerie : REST texte, temps réel Socket.IO à brancher.
- RGPD : export V1, suppression/anonymisation à ajouter.
- Conteneurisation : MongoDB seulement dans le compose actuel.

## Non réalisé

- Client lourd JavaFX finalisé avec synchronisation.
- Keycloak SSO/MFA.
- Neo4j réel.
- MinIO avec presigned URLs.
- Tests d'intégration avec base de test.
- Tests E2E du client web.

## Priorités suivantes

1. Docker Compose complet pour API, web, MongoDB, Neo4j, Keycloak et MinIO.
2. Endpoints MinIO pour upload/download PDF et médias.
3. Intégration Neo4j pour recommandations.
4. Suppression/anonymisation RGPD.
5. Client JavaFX offline-first.
6. Tests d'intégration et E2E.
