# 05 — Répartition du travail V2 — Connected Neighbours

## 1. Objectif du document

Ce document présente la répartition du travail réalisée sur le projet **Connected Neighbours**.

Il a pour objectif de clarifier :

- les responsabilités principales de chaque membre ;
- les parties réellement avancées ;
- les parties encore partielles ;
- les dépendances entre les membres ;
- les points à finaliser avant la soutenance ;
- les limites à assumer dans la présentation finale.

Cette version V2 remplace la version précédente afin de mieux refléter l’état réel du projet après la refonte backend, l’intégration des interfaces web et la mise en place de Docker.

---

## 2. Organisation générale du projet

Le projet est organisé sous forme de monorepo.

```txt
connected-neighbours/
├── apps/
│   ├── api/             API centrale NestJS/Fastify
│   ├── web/             Application web utilisateur React
│   ├── admin-web/       Back-office administrateur React
│   └── admin-desktop/   Application JavaFX administrateur
├── docs/                Documentation projet
├── diagrams/            Schémas d’architecture
├── docker-compose.yml   Lancement Docker
├── package.json
└── pnpm-workspace.yaml
```

Les grandes parties du projet sont :

- l’API centrale ;
- l’application web utilisateur ;
- le back-office administrateur ;
- l’application JavaFX administrateur ;
- la base MongoDB ;
- la synchronisation JavaFX/API ;
- le micro-langage MongoDB ;
- la conteneurisation ;
- la documentation.

Certaines briques prévues par le sujet ou par l’architecture cible restent partielles ou non finalisées, notamment :

- Neo4j ;
- MinIO ;
- Keycloak / SSO / MFA ;
- Socket.IO ;
- messagerie multimédia ;
- recommandations avancées ;
- litiges avancés ;
- avis et réputation ;
- JavaFX sync complète côté client.

---

## 3. Membres et rôles principaux

## 3.1 Noah Prisset

Noah est principalement intervenu sur :

- l’architecture générale du projet ;
- l’API centrale ;
- les modules métier principaux ;
- l’authentification locale JWT ;
- le workflow services, candidatures, contrats et points ;
- les incidents et alertes côté API ;
- les endpoints de synchronisation côté API ;
- le micro-langage MongoDB avec Jison ;
- l’export RGPD ;
- le back-office React ;
- l’application web utilisateur React ;
- la conteneurisation Docker ;
- les tests unitaires et E2E API ;
- la documentation du projet.

## 3.2 Baptiste Coquet

Baptiste est principalement intervenu sur :

- l’application JavaFX administrateur ;
- la gestion locale des incidents ;
- la gestion locale des alertes ;
- les reporters ;
- les statistiques locales ;
- les thèmes ;
- les plugins ;
- l’interface JavaFX ;
- la base locale H2 ;
- les tests Java.

La partie JavaFX possède une base locale et des fonctionnalités internes, mais la synchronisation complète avec l’API centrale doit encore être finalisée côté client JavaFX.

## 3.3 Autres membres

À compléter selon l’équipe réelle.

| Membre | Domaine principal | Responsabilités |
|---|---|---|
| Membre 3 | À compléter | À compléter |
| Membre 4 | À compléter | À compléter |
| Membre 5 | À compléter | À compléter |

---

# 4. Répartition détaillée par domaine

## 4.1 Architecture globale

### Responsable principal

```txt
Noah Prisset
```

### Travail réalisé

- Définition d’une architecture en monorepo.
- Organisation en plusieurs applications : API, web utilisateur, admin-web, JavaFX.
- Choix d’une API centrale modulaire.
- Séparation des responsabilités entre backend, interfaces web et client desktop.
- Mise en place d’une structure compatible avec Docker.
- Rédaction et mise à jour des documents d’architecture.

### État actuel

```txt
Réalisé en grande partie.
```

### Reste à faire

- Mettre à jour les schémas finaux selon l’état réel.
- Représenter clairement ce qui est réellement lancé par Docker.
- Distinguer les briques implémentées des briques prévues : Neo4j, MinIO, Keycloak, Socket.IO.
- Ajouter la partie JavaFX synchronisée lorsque l’intégration côté client sera finalisée.

---

## 4.2 API centrale

### Responsable principal

```txt
Noah Prisset
```

### Travail réalisé

L’API centrale est développée avec **Node.js, NestJS, Fastify, TypeScript et MongoDB**.

Modules et fonctionnalités réalisés ou fortement avancés :

- configuration API ;
- validation des variables d’environnement ;
- connexion MongoDB ;
- documentation Swagger ;
- authentification locale JWT ;
- rôles `resident`, `moderator`, `admin` ;
- seed de comptes de démonstration ;
- services ;
- candidatures ;
- contrats générés depuis candidature acceptée ;
- signature simple de contrat ;
- annulation de contrat ;
- système de points ;
- réservation, transfert et libération de points ;
- quartiers basiques ;
- événements V1 ;
- votes V1 ;
- documents V1 ;
- messagerie REST V1 ;
- incidents ;
- alertes ;
- synchronisation API JavaFX ;
- micro-langage MongoDB avec Jison ;
- export RGPD enrichi ;
- endpoints administrateur ;
- tests unitaires ;
- tests E2E du parcours principal.

### État actuel

```txt
API fonctionnelle et démontrable sur le parcours principal.
```

### Reste à faire

- Ajouter ou compléter les modules de propositions et contre-propositions.
- Ajouter les litiges avancés.
- Ajouter les avis et la réputation.
- Ajouter les notifications.
- Finaliser les documents PDF réels et les signatures PDF avancées.
- Brancher MinIO réellement.
- Brancher Neo4j réellement.
- Ajouter Keycloak / SSO / MFA si le temps le permet.
- Ajouter Socket.IO pour le temps réel.
- Étendre la messagerie à des fichiers ou médias.
- Compléter l’anonymisation et les demandes RGPD avancées.

---

## 4.3 Authentification et rôles

### Responsable principal

```txt
Noah Prisset
```

### Travail réalisé

- Connexion utilisateur.
- JWT local.
- Récupération du profil connecté.
- Rôles utilisateurs.
- Protection des routes sensibles.
- Protection des endpoints admin.
- Comptes de démonstration.

Comptes principaux de test :

```txt
admin@connected-neighbours.local / admin123
alice@connected-neighbours.local / alice123
bob@connected-neighbours.local / bob123
```

### État actuel

```txt
Fonctionnel pour la démonstration locale.
```

### Reste à faire

- Intégrer Keycloak si le temps le permet.
- Ajouter SSO web + JavaFX.
- Ajouter MFA/TOTP pour les actions sensibles.
- Ajouter refresh token et expiration de session plus complète.

---

## 4.4 Services, candidatures, contrats et points

### Responsable principal

```txt
Noah Prisset
```

### Travail réalisé

Le parcours principal est maintenant démontrable :

```txt
création service
publication
candidature
acceptation candidature
génération contrat
réservation points
signature des deux parties
complétion contrat
transfert points
export RGPD
```

Fonctionnalités réalisées :

- création de services ;
- publication de services ;
- annulation de services ;
- liste des services ;
- candidatures sur un service ;
- acceptation, rejet et retrait de candidature ;
- génération de contrat depuis candidature acceptée ;
- signature de contrat ;
- annulation de contrat ;
- complétion de contrat ;
- réservation de points ;
- transfert de points ;
- libération de points ;
- consultation du solde ;
- consultation des transactions ;
- tests unitaires et E2E.

### État actuel

```txt
Parcours métier principal fonctionnel.
```

### Reste à faire

- Ajouter les propositions et contre-propositions.
- Ajouter la planification détaillée.
- Ajouter l’exécution détaillée du service : démarrer, marquer comme réalisé, preuve.
- Ajouter les preuves de réalisation.
- Ajouter les litiges avec gel des points.
- Ajouter les avis après service.
- Ajouter les notifications liées au workflow.
- Ajouter l’historique/audit détaillé des changements.

---

## 4.5 Incidents, alertes et synchronisation API

### Responsable principal

```txt
Noah Prisset
```

### Travail réalisé

Côté API :

- création d’incidents ;
- liste des incidents ;
- modification d’incidents ;
- résolution et fermeture ;
- création d’alertes liées à un incident ;
- modification et résolution d’alertes ;
- endpoint `sync/push` ;
- endpoint `sync/pull` ;
- endpoint `sync/status` ;
- endpoint `sync/history` ;
- idempotence par `operationId` ;
- historique des opérations ;
- état de synchronisation par client ;
- tests unitaires ;
- tests E2E.

### État actuel

```txt
API prête pour recevoir les synchronisations JavaFX.
```

### Reste à faire

- Brancher le client JavaFX sur ces endpoints.
- Ajouter une outbox locale côté JavaFX.
- Ajouter le pull côté JavaFX.
- Ajouter l’écran de statut de synchronisation côté JavaFX.
- Ajouter une gestion de conflits plus complète si nécessaire.

---

## 4.6 Micro-langage MongoDB

### Responsable principal

```txt
Noah Prisset
```

### Travail réalisé

- Mise en place d’un module DSL.
- Grammaire Jison.
- Analyse lexicale et syntaxique via Jison.
- Génération d’un AST.
- Validation de sécurité.
- Traduction vers filtre MongoDB.
- Exécution en lecture seule.
- Collections autorisées.
- Endpoints de parsing, exécution et exemples.
- Tests unitaires.
- Couverture E2E du DSL.

### État actuel

```txt
Fonctionnel et démontrable.
```

### Reste à faire

- Ajouter une interface admin dédiée au DSL si souhaité.
- Étendre progressivement les collections autorisées.
- Ajouter une meilleure présentation des résultats côté interface.

---

## 4.7 RGPD

### Responsable principal

```txt
Noah Prisset
```

### Travail réalisé

- Export des données utilisateur.
- Normalisation des identifiants en `id`.
- Suppression de `_id` et `__v` dans l’export.
- Exclusion de `passwordHash`.
- Export du profil.
- Export des services.
- Export des candidatures.
- Export des contrats.
- Export des transactions de points.
- Export des incidents et alertes liés.
- Export des documents existants.
- Affichage lisible côté web utilisateur.

### État actuel

```txt
Export RGPD fonctionnel pour la démonstration.
```

### Reste à faire

- Ajouter demande de suppression.
- Ajouter anonymisation de compte.
- Ajouter historique des demandes RGPD.
- Étendre l’export si de nouveaux modules sont ajoutés : messages, votes, événements, avis, litiges.

---

## 4.8 Application web utilisateur

### Responsable principal

```txt
Noah Prisset
```

### Travail réalisé

- Remplacement du template initial.
- Écran de connexion.
- Gestion JWT côté client.
- Récupération du profil.
- Navigation utilisateur.
- Dashboard.
- Services.
- Candidatures.
- Contrats.
- Points.
- Incidents.
- RGPD.
- Appels API via couche client.
- Proxy Vite vers l’API.
- Build validé.

### État actuel

```txt
Interface utilisateur fonctionnelle pour le parcours principal.
```

### Reste à faire

- Ajouter pages événements.
- Ajouter pages votes.
- Ajouter messagerie.
- Ajouter notifications.
- Ajouter profil utilisateur détaillé.
- Ajouter documents et signatures PDF côté interface.
- Améliorer l’ergonomie générale.
- Ajouter gestion multilingue si le temps le permet.

---

## 4.9 Back-office administrateur

### Responsable principal

```txt
Noah Prisset
```

### Travail réalisé

- Remplacement du template Vite.
- Connexion admin.
- Gestion JWT.
- Dashboard branché sur l’API admin.
- Liste des services.
- Liste des contrats.
- Liste des incidents.
- État de synchronisation.
- Liste des utilisateurs.
- Proxy Vite/Nginx vers l’API.
- Build validé.

### État actuel

```txt
Back-office minimal fonctionnel.
```

### Reste à faire

- Ajouter une vraie gestion des quartiers.
- Ajouter des actions d’administration sur utilisateurs.
- Ajouter gestion des événements.
- Ajouter gestion des votes.
- Ajouter gestion documents.
- Ajouter litiges et signalements.
- Ajouter une page DSL si souhaité.
- Ajouter statistiques plus détaillées.

---

## 4.10 Docker et lancement

### Responsable principal

```txt
Noah Prisset
```

### Travail réalisé

Docker Compose lance maintenant :

- MongoDB ;
- API ;
- web utilisateur ;
- admin-web.

Fichiers réalisés :

- `docker-compose.yml` ;
- `.dockerignore` ;
- `apps/api/Dockerfile` ;
- `apps/web/Dockerfile` ;
- `apps/admin-web/Dockerfile` ;
- `apps/web/nginx.conf` ;
- `apps/admin-web/nginx.conf`.

Ports principaux :

```txt
API        http://localhost:3000/docs
Web        http://localhost:5173
Admin-web  http://localhost:5174
MongoDB    localhost:27017
```

### État actuel

```txt
Stack Docker démontrable.
```

### Reste à faire

- Ajouter Neo4j si la recommandation est implémentée.
- Ajouter MinIO si le stockage fichiers est implémenté.
- Ajouter Keycloak si le SSO/MFA est implémenté.
- Ajouter un `.env.example` cohérent avec l’état réel.
- Ajouter une documentation de déploiement courte.

---

## 4.11 Application JavaFX administrateur

### Responsable principal

```txt
Baptiste Coquet
```

### Travail réalisé

L’application JavaFX contient une base de travail importante :

- structure JavaFX ;
- lancement via Java/Spring ;
- base locale H2 ;
- domaine incidents ;
- domaine alertes ;
- domaine reporters ;
- statistiques locales ;
- gestion des thèmes ;
- système de plugins ;
- interface principale ;
- tableaux et vues liées aux incidents ;
- tests Java.

### État actuel

```txt
Partie locale avancée, intégration API à finaliser.
```

### Reste à faire

- Vérifier que l’application se lance proprement sur une machine propre.
- Générer un JAR exécutable.
- Stabiliser la persistance locale.
- Vérifier que la base locale n’est pas recréée à chaque lancement.
- Ajouter ou finaliser l’outbox locale.
- Ajouter le client HTTP vers l’API.
- Brancher `POST /api/sync/push`.
- Brancher `GET /api/sync/pull`.
- Brancher `GET /api/sync/status`.
- Ajouter un écran de statut de synchronisation.
- Éviter toute modification automatique des données lors d’un simple affichage.
- Tester le scénario offline complet.

---

# 5. Travail commun restant

## 5.1 Synchronisation JavaFX/API

### Responsables

```txt
Noah Prisset
Baptiste Coquet
```

### État actuel

- L’API fournit les endpoints nécessaires.
- JavaFX dispose d’une base locale et de modules incidents/alertes.
- L’intégration complète côté JavaFX reste à finaliser.

### Scénario à réussir

```txt
1. Lancer JavaFX.
2. Couper la connexion.
3. Créer un incident local.
4. Stocker l’opération dans l’outbox.
5. Rétablir la connexion.
6. Synchroniser avec l’API.
7. Voir l’incident dans le back-office web.
```

---

## 5.2 Scénario de démonstration final

### Responsables

```txt
Toute l’équipe
```

### Scénario actuellement démontrable côté web/API

```txt
1. Alice se connecte.
2. Alice crée un service payant.
3. Alice publie le service.
4. Bob se connecte.
5. Bob candidate au service.
6. Alice accepte la candidature.
7. Alice génère le contrat.
8. Alice signe le contrat.
9. Bob signe le contrat.
10. Alice complète le contrat.
11. Les points sont transférés.
12. Alice consulte son export RGPD.
13. L’administrateur consulte les données dans le back-office.
```

### Scénario restant à intégrer côté JavaFX

```txt
1. L’administrateur lance JavaFX.
2. Il crée un incident hors ligne.
3. L’opération est stockée localement.
4. L’application synchronise.
5. L’incident apparaît dans l’API et dans le back-office.
```

---

# 6. Tableau récapitulatif

| Domaine | Responsable principal | État actuel | Reste à faire |
|---|---|---|---|
| Architecture | Noah | Bien avancée | Schémas finaux à aligner |
| Documentation | Noah | En cours de mise à jour V2 | Relire et harmoniser |
| API | Noah | Fonctionnelle sur parcours principal | Modules avancés |
| Auth JWT | Noah | Fait | Keycloak/MFA si temps |
| Services | Noah | Parcours principal fait | Propositions, preuves, avis, litiges |
| Candidatures | Noah | Fait | Présélection/contre-propositions |
| Contrats | Noah | Fait en V1 solide | PDF, avenants, audit avancé |
| Points | Noah | Réservation/transfert/libération faits | Gel, litiges, pénalités |
| Incidents API | Noah | Fait | Stats avancées |
| Alertes API | Noah | Fait | Notifications critiques |
| Sync API | Noah | Fait | Client JavaFX à brancher |
| DSL Jison | Noah | Fait | UI admin dédiée éventuelle |
| RGPD export | Noah | Fait | Suppression/anonymisation |
| Web utilisateur | Noah | Parcours principal fait | Events, votes, messages, profil |
| Admin-web | Noah | Dashboard minimal fait | Quartiers, litiges, votes, events |
| Docker | Noah | API/web/admin/Mongo OK | Neo4j/MinIO/Keycloak si intégrés |
| JavaFX local | Baptiste | Avancé | Stabilisation et JAR |
| JavaFX sync | Baptiste + Noah | API prête | Outbox/push/pull côté JavaFX |
| Tests API | Noah | Unitaires + E2E OK | Tests nouveaux modules futurs |
| Tests Java | Baptiste | Présents | Vérifier build final |
| Neo4j | Noah/équipe | Non branché | Recommandations |
| MinIO | Noah/équipe | Non branché | Upload/documents |
| Keycloak/MFA | Noah/équipe | Non branché | SSO/actions sensibles |

---

# 7. Présentation recommandée en soutenance

## 7.1 Présentation de Noah

Noah peut présenter :

- l’architecture globale ;
- l’API centrale ;
- les choix NestJS/Fastify ;
- le workflow services/candidatures/contrats/points ;
- les tests API ;
- le web utilisateur ;
- le back-office ;
- Docker ;
- le micro-langage Jison ;
- le RGPD ;
- les limites techniques assumées.

Phrase possible :

```txt
Je me suis principalement occupé de l’architecture globale, de l’API centrale, du workflow services/candidatures/contrats/points, des interfaces web, du Docker Compose, du micro-langage MongoDB et des tests API.
```

## 7.2 Présentation de Baptiste

Baptiste peut présenter :

- le client JavaFX ;
- la base locale H2 ;
- les incidents ;
- les alertes ;
- les reporters ;
- les statistiques locales ;
- les thèmes ;
- les plugins ;
- les tests Java ;
- ce qui reste à intégrer pour la synchronisation complète.

Phrase possible :

```txt
Je me suis principalement occupé du client lourd JavaFX, avec la gestion locale des incidents, alertes, reporters, statistiques, thèmes et plugins. La partie restante concerne l’intégration complète de la synchronisation avec l’API centrale.
```

## 7.3 Présentation commune

La synchronisation JavaFX/API doit être présentée comme une partie transversale :

```txt
L’API fournit les endpoints de synchronisation.
JavaFX stocke les actions hors ligne localement.
La synchronisation pousse les opérations locales vers l’API.
L’API renvoie les changements serveur.
Le back-office permet de consulter les incidents synchronisés.
```

---

# 8. Points à ne pas exagérer

Pour éviter une présentation trop ambitieuse, les points suivants doivent être présentés comme partiels ou prévus si non finalisés avant la soutenance :

- Neo4j ;
- MinIO ;
- Keycloak ;
- MFA ;
- Socket.IO ;
- messagerie multimédia ;
- signatures PDF avancées ;
- événements complets ;
- votes complets ;
- notifications ;
- litiges avancés ;
- avis et réputation ;
- synchronisation JavaFX côté client si elle n’est pas totalement branchée.

---

# 9. Conclusion

La répartition actuelle est cohérente :

```txt
Noah :
architecture, API, workflow métier principal, web utilisateur, admin-web, Docker, tests, RGPD, DSL, documentation.

Baptiste :
JavaFX, incidents locaux, alertes locales, reporters, statistiques locales, thèmes, plugins, base H2, tests Java.

Commun :
synchronisation JavaFX/API, intégration finale, scénario de démonstration.
```

Le projet dispose maintenant d’un socle solide côté API, web, admin et Docker.

Le point le plus important à finaliser pour respecter pleinement le sujet reste la partie **JavaFX offline-first réellement synchronisée avec l’API**, ainsi que les briques avancées prévues par l’architecture cible comme Neo4j, MinIO, Keycloak/MFA et la messagerie temps réel.

La soutenance doit donc présenter clairement :

- ce qui est fonctionnel ;
- ce qui est partiel ;
- ce qui est prévu comme évolution ;
- pourquoi les choix de priorité ont été faits.
