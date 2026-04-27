# État d'avancement — Étape 2

Date de référence : 27/04/2026.

## Réalisé

- Documentation fonctionnelle étape 1.
- Documentation infrastructure et technologies étape 1.
- Monorepo pnpm.
- API NestJS/Fastify.
- Configuration environnement validée par Joi.
- Connexion MongoDB via Mongoose.
- Swagger disponible sur `/docs`.
- Authentification locale de développement.
- Gestion des rôles.
- Module services initial.
- Module points initial : réservation, transfert, historique des transactions.
- Module contrats initial : acceptation d'un service payant, signature, clôture.
- Client web React avec connexion et création/listing de services.
- Tests unitaires API corrigés et verts.

## Partiellement réalisé

- Conteneurisation : MongoDB seulement pour l'instant.
- Back-office React : projet créé mais encore template Vite.
- Documentation technique : base étape 2 créée, à enrichir avec captures et retours de revue.
- Architecture cible : décrite mais toutes les briques ne sont pas encore branchées.

## Non réalisé

- Keycloak SSO/MFA.
- Neo4j et recommandations.
- MinIO et stockage PDF/médias.
- Contrats et système de points complet côté produit final.
- Signature PDF.
- Événements.
- Votes.
- Messagerie temps réel.
- RGPD export/suppression.
- Micro-langage MongoDB.
- Client lourd JavaFX offline-first.
- Docker Compose complet.
- Installeur/JAR Java final.

## Priorités immédiates vers l'étape 3

1. Rendre le client JavaFX exécutable sur un poste JDK 17 avec Maven ou Gradle.
2. Implémenter les endpoints API incidents/sync pour brancher JavaFX.
3. Ajouter contrats + points, car c'est le coeur métier du sujet.
4. Remplacer le back-office admin template par une vraie interface.
5. Compléter Docker Compose avec API, web, Neo4j, Keycloak et MinIO.
6. Ajouter des tests d'intégration API.
7. Préparer l'explication courte du choix NestJS/Fastify validé par l'enseignant.

## Démo étape 2 conseillée

1. Montrer Swagger.
2. Lancer les tests API.
3. Se connecter sur le web avec `resident@connected.local`.
4. Créer une annonce gratuite puis une annonce payante.
5. Accepter l'annonce payante avec un autre compte.
6. Signer le contrat avec les deux parties.
7. Clôturer le contrat et montrer le transfert des points.
