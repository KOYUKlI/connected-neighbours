# Connected Neighbours
Projet collectif de plateforme de quartier, conservé comme travail d'apprentissage. Le projet a été déployé sur Internet avec des comptes de test. Aucun serveur, instance ou hébergement lié au projet n'est aujourd'hui actif.

## Contribution personnelle

J'ai notamment travaillé sur les applications voisin et administration, côté front-end et back-end.

Le projet a été réalisé en équipe. Les autres applications et composants du dépôt comprennent également le travail des autres membres du groupe.

## Organisation actuelle
- apps/web/ : application voisin React.
- apps/admin-web/ : application web d'administration.
- apps/api/ : API NestJS/Fastify.
- apps/admin-desktop/ : application d'administration desktop Java/JavaFX.
- infra/ : configuration d'infrastructure.
- docs/ : documentation et livrables du projet collectif.
- diagrams/ : schémas du projet.

Les domaines décrits par le code et les documents comprennent services de voisinage, contrats/documents, événements, messagerie et votes.
Les maquettes dans docs/ui-mockups/ sont des maquettes, pas des captures démontrant un parcours exécuté.

## Technologies
TypeScript, React, Node.js, NestJS/Fastify, MongoDB, Neo4j et Socket.IO.
Le client desktop utilise Java/JavaFX ; l'authentification s'appuie notamment sur Keycloak/OIDC. Les composants locaux sont décrits dans Docker Compose.

## Préparation locale, non validée de bout en bout
Le manifeste racine demande Node.js 24 et pnpm 10.32.1.
Depuis la racine :
~~~sh
pnpm install --frozen-lockfile
~~~
Pour l'infrastructure, copier .env.example vers un .env local non suivi, puis remplir les champs secrets vides avec des valeurs générées localement.
La proposition docker-compose.yml publie les ports sur 127.0.0.1 et exige les valeurs sensibles via environnement. Keycloak utilise start-dev : cette configuration est une démo locale, pas un modèle de production.
Contrôle de configuration, sans démarrage :
~~~sh
docker compose --env-file .env config --quiet
~~~
Le manifeste expose pnpm dev:api, pnpm dev:web et pnpm dev:admin. Vérifier la configuration propre à chaque application avant son lancement ; aucune installation complète n'a été exécutée pendant ce nettoyage.

## Documentation
- [Dossier technique](docs/02_Dossier_technique_final.md)
- [Dossier utilisateur](docs/03_Dossier_utilisateur_final.md)
- [Synthèse critique](docs/04_Synthese_critique_final.md)
- [Répartition historique du travail](docs/05_Repartition_du_travail_final.md)
- [Démo locale et limites de sécurité](docs/demo-seed.md)

La répartition historique reste inchangée. Certains documents peuvent décrire des intentions ou un état antérieur ; ils ne garantissent pas toutes les fonctions actuelles.

## État de vérification et sécurité
Pas de build, de tests applicatifs ni de validation des parcours pendant ce nettoyage.
Les branches main et dev divergent ; les anciens résultats CI ne valident pas la version actuelle. Le workflow historique n'est pas présenté comme une règle appliquée aujourd'hui.

Le nettoyage proposé retire les credentials de l'export Keycloak, y marque ses sept comptes de démonstration comme désactivés et conserve le compte de service.
Des valeurs publiées ont pu être exposées dans le passé. Aucun déploiement n'est aujourd'hui actif ; les actions de sécurité se limitent aux fichiers du dépôt et à leur configuration.
Ne pas exécuter les seeds contre un service accessible sur Internet.
