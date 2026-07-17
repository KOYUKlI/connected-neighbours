# 01 — Descriptif fonctionnel V2 — Connected Neighbours

## 1. Objectif du document

Ce document décrit le fonctionnement attendu et le périmètre actuel du projet **Connected Neighbours**.

Cette version V2 remplace l’approche trop théorique du descriptif précédent. Elle distingue clairement :

- les fonctionnalités réellement implémentées dans la version actuelle ;
- les fonctionnalités partiellement présentes ;
- les fonctionnalités prévues mais non finalisées ;
- les limites à assumer en soutenance.

L’objectif est de présenter un projet ambitieux, mais défendable, sans annoncer comme terminées des fonctionnalités encore absentes ou partielles.

---

## 2. Présentation générale du projet

**Connected Neighbours** est une plateforme collaborative de quartier destinée à faciliter l’entraide entre habitants.

Elle permet principalement :

- de publier des demandes ou offres de services ;
- de candidater à un service ;
- de sélectionner un voisin ;
- de générer un contrat pour les services payants ;
- de signer un contrat ;
- de réserver puis transférer des points ;
- de consulter un back-office administrateur ;
- de signaler et suivre des incidents ;
- de préparer une synchronisation avec une application JavaFX offline-first ;
- d’exporter ses données personnelles ;
- d’interroger certaines données MongoDB via un micro-langage basé sur Jison.

Le projet s’inscrit dans une vision plus large : créer une plateforme de confiance entre voisins, extensible vers les événements, votes, messagerie, documents PDF, recommandations Neo4j, stockage de fichiers et sécurité SSO/MFA.

---

## 3. Périmètre réellement réalisé dans la version actuelle

La version actuelle fournit un socle fonctionnel centré sur le parcours principal suivant :

```txt
connexion
→ création d’un service
→ publication du service
→ candidature d’un voisin
→ acceptation de la candidature
→ génération du contrat
→ réservation des points
→ double signature
→ finalisation du contrat
→ transfert des points
→ export RGPD
```

Ce parcours est disponible via l’API et l’interface web utilisateur.

### 3.1 Fonctionnalités réalisées

| Domaine | État actuel |
|---|---|
| Authentification | Connexion JWT locale avec comptes de démonstration |
| Rôles | `resident`, `moderator`, `admin` |
| Services | Création, liste, publication, annulation |
| Candidatures | Création, liste, acceptation, rejet, retrait |
| Contrats | Génération depuis candidature, signature, completion, annulation |
| Points | Solde, réservation, libération, transfert, transactions |
| Incidents | Création, liste, modification, résolution, clôture |
| Alertes | Création liée à un incident, liste, modification, résolution |
| Synchronisation API | Endpoints push/pull/status/history pour JavaFX |
| RGPD | Export des données utilisateur normalisé |
| DSL MongoDB | Micro-langage en lecture seule avec grammaire Jison |
| Admin web | Dashboard, services, contrats, incidents, synchronisation, utilisateurs |
| Web utilisateur | Workflow services/candidatures/contrats/points/RGPD |
| Docker | API, web, admin-web et MongoDB conteneurisés |
| Tests | Tests unitaires API et tests E2E du parcours principal |
| Swagger | Documentation API disponible |

---

## 4. Fonctionnalités partielles ou en cours

Certaines fonctionnalités existent sous forme de module, d’endpoint ou de structure, mais ne sont pas encore complètes fonctionnellement.

| Domaine | État actuel | Limite |
|---|---|---|
| Quartiers | CRUD API existant | Pas de carte ni dessin GeoJSON côté interface |
| Événements | API V1 présente | Pas de vraie page web complète ni recommandation Neo4j |
| Votes | API V1 présente | Pas de page web complète ni paramétrage avancé |
| Documents | API V1 présente | Pas de vrai stockage MinIO ni génération PDF signé complète |
| Messagerie | API REST basique présente | Pas de messagerie temps réel, multimédia ou Socket.IO |
| JavaFX | Application locale existante côté desktop | Synchronisation côté client à finaliser |
| Synchronisation | API prête | Outbox et client HTTP JavaFX à finaliser côté application desktop |
| RGPD | Export fonctionnel | Suppression/anonymisation non finalisées |
| Administration | Dashboard fonctionnel | Pas encore de gestion complète des quartiers, litiges, votes, événements, documents |

---

## 5. Fonctionnalités prévues mais non implémentées complètement

Les éléments suivants font partie de la cible du projet, mais ne doivent pas être présentés comme terminés dans l’état actuel.

| Fonctionnalité | État |
|---|---|
| Keycloak / SSO | Prévu, variables préparées, non branché réellement |
| MFA | Prévu pour actions sensibles, non implémenté réellement |
| Neo4j | Prévu pour recommandations, non branché réellement |
| MinIO | Prévu pour fichiers, non lancé dans Docker actuel |
| Socket.IO | Prévu pour temps réel, non implémenté |
| Messagerie multimédia | Prévue, non finalisée |
| Documents PDF signés complets | Prévu, V1 non complète |
| Litiges | Non implémenté comme module complet |
| Avis et réputation | Non implémenté |
| Propositions / contre-propositions | Non implémenté comme module dédié |
| Notifications | Non implémentées comme module complet |
| Modération / signalements | Non implémentés comme module complet |
| Multilingue | Prévu, non implémenté |
| Carte Leaflet / dessin quartier | Prévu, non implémenté |

---

## 6. Acteurs du système

## 6.1 Habitant

L’habitant utilise l’application web.

Dans la version actuelle, il peut :

- se connecter ;
- consulter son tableau de bord ;
- consulter les services ;
- créer un service ;
- publier ou annuler son service ;
- candidater à un service publié ;
- consulter ses candidatures ;
- accepter ou rejeter les candidatures reçues ;
- générer un contrat depuis une candidature acceptée ;
- signer un contrat ;
- compléter ou annuler un contrat ;
- consulter son solde de points ;
- consulter ses transactions ;
- signaler un incident ;
- exporter ses données personnelles.

## 6.2 Demandeur de service

Un habitant devient demandeur lorsqu’il crée un service.

Dans la version actuelle, il peut :

- publier son service ;
- recevoir des candidatures ;
- accepter une candidature ;
- générer le contrat ;
- signer le contrat ;
- finaliser le contrat ;
- déclencher le transfert des points lorsque le contrat est terminé.

## 6.3 Prestataire voisin

Un habitant devient prestataire lorsqu’il candidate à un service.

Dans la version actuelle, il peut :

- candidater à un service ;
- proposer un message, une date et un prix ;
- retirer sa candidature ;
- signer le contrat si sa candidature est acceptée ;
- recevoir les points après finalisation.

## 6.4 Administrateur web

L’administrateur utilise le back-office React.

Dans la version actuelle, il peut :

- se connecter avec un compte administrateur ;
- consulter un dashboard global ;
- consulter les services récents ;
- consulter les contrats récents ;
- consulter les incidents ;
- suivre les états de synchronisation ;
- consulter les utilisateurs sans exposition des mots de passe.

## 6.5 Administrateur JavaFX

L’administrateur JavaFX correspond à la partie desktop du projet.

Dans la version cible, il doit pouvoir :

- consulter les incidents localement ;
- créer un incident hors ligne ;
- gérer des alertes ;
- consulter des statistiques ;
- synchroniser les données avec l’API dès que la connexion revient.

Dans la version actuelle, l’API expose déjà les routes nécessaires à cette synchronisation, mais l’intégration côté JavaFX doit encore être finalisée par la partie desktop.

---

## 7. Rôles et permissions

La version actuelle distingue trois rôles :

| Rôle | Description |
|---|---|
| `resident` | Habitant classique |
| `moderator` | Modérateur prévu pour les futurs modules de modération |
| `admin` | Administrateur de la plateforme |

### Permissions actuellement utilisées

- Les routes administrateur sont protégées par JWT et rôle `admin`.
- Les routes utilisateur nécessitent un utilisateur connecté.
- Certaines actions métier vérifient le propriétaire ou les participants concernés.
- Les mots de passe hachés ne sont pas exposés dans les réponses admin ou RGPD.

### Limites

- Le MFA n’est pas encore implémenté.
- Keycloak et le SSO ne sont pas branchés réellement.
- Les permissions fines par module restent à renforcer.

---

## 8. Gestion des quartiers

Le quartier sert à rattacher les utilisateurs et les contenus à une zone commune.

### État actuel

- Un module quartiers existe côté API.
- Les utilisateurs de démonstration sont rattachés à `quartier-centre`.
- Les services, incidents et autres contenus utilisent un `neighborhoodId`.

### Limites actuelles

- Pas de carte dans l’interface admin.
- Pas de dessin de polygone.
- Pas de Leaflet ou Leaflet.draw.
- Pas de vérification géographique réelle de type point dans polygone.

### Évolution prévue

Une version plus avancée doit permettre à l’administrateur de dessiner un quartier sur une carte et de stocker la zone au format GeoJSON.

---

## 9. Services entre voisins

## 9.1 Objectif

Le module services est le cœur fonctionnel du projet.

Il permet aux habitants de publier une demande ou une offre de service, puis de gérer le parcours jusqu’au contrat et au paiement en points.

## 9.2 Fonctionnalités réalisées

La version actuelle permet :

- de créer un service ;
- de publier un service ;
- d’annuler un service ;
- de consulter les services ;
- de consulter le détail d’un service ;
- de recevoir des candidatures ;
- de sélectionner un candidat ;
- de rattacher le service à une candidature et à un contrat.

## 9.3 États utilisés

Les états suivants sont utilisés ou prévus dans le workflow actuel :

| État | Signification |
|---|---|
| `draft` | Service en brouillon |
| `published` | Service visible |
| `application_received` | Candidature reçue |
| `candidate_selected` | Candidature acceptée |
| `awaiting_signatures` | Contrat généré en attente de signatures |
| `contract_active` | Contrat signé par les deux parties |
| `completed` | Service terminé |
| `cancelled` | Service annulé |
| `disputed` | État prévu pour futur litige |

## 9.4 Limites

Les fonctionnalités suivantes ne sont pas encore complètes :

- négociation avancée ;
- contre-propositions versionnées ;
- planification détaillée ;
- preuve de réalisation ;
- demande de correction ;
- litige ;
- avis après service ;
- notifications automatiques.

---

## 10. Candidatures

## 10.1 Objectif

Les candidatures permettent à plusieurs voisins de proposer leur aide avant qu’un prestataire soit choisi.

## 10.2 Fonctionnalités réalisées

La version actuelle permet :

- d’envoyer une candidature sur un service ;
- d’empêcher un utilisateur de candidater à son propre service ;
- d’empêcher les candidatures actives en doublon ;
- de lister les candidatures d’un service ;
- de consulter ses propres candidatures ;
- d’accepter une candidature ;
- de rejeter une candidature ;
- de retirer sa candidature ;
- de rejeter automatiquement les autres candidatures lorsqu’une candidature est acceptée.

## 10.3 États actuels

| État | Signification |
|---|---|
| `submitted` | Candidature envoyée |
| `viewed` | Candidature consultée ou prévue comme consultée |
| `accepted` | Candidature acceptée |
| `rejected` | Candidature refusée |
| `withdrawn` | Candidature retirée |

## 10.4 Limites

Le module ne contient pas encore :

- shortlist ;
- négociation complète ;
- expiration automatique ;
- historique de propositions.

---

## 11. Contrats

## 11.1 Objectif

Un contrat formalise l’accord entre deux voisins pour un service payant.

## 11.2 Fonctionnalités réalisées

La version actuelle permet :

- de générer un contrat depuis une candidature acceptée ;
- de refuser la génération si un contrat existe déjà ;
- de réserver les points si le service est payant ;
- de signer le contrat par les deux parties ;
- de passer le contrat en actif après double signature ;
- de terminer le contrat ;
- de transférer les points réservés ;
- d’annuler un contrat non terminé ;
- de libérer les points réservés lors d’une annulation.

## 11.3 États actuels

| État | Signification |
|---|---|
| `draft` | Prévu ou utilisé selon le cas |
| `sent` | Contrat généré et envoyé aux parties |
| `active` | Contrat signé par les deux parties |
| `completed` | Contrat terminé |
| `cancelled` | Contrat annulé |
| `disputed` | Prévu pour futur litige |

## 11.4 Limites

Le contrat actuel n’est pas encore un PDF signé complet.

Il manque notamment :

- génération PDF ;
- champs de signature visuels ;
- audit détaillé de signature ;
- avenants ;
- expiration automatique ;
- litige lié au contrat ;
- MFA lors de la signature.

---

## 12. Système de points

## 12.1 Objectif

Les points représentent une monnaie interne permettant de valoriser les services rendus.

## 12.2 Fonctionnalités réalisées

La version actuelle permet :

- de consulter son solde ;
- de consulter ses transactions ;
- de réserver des points lors de la création d’un contrat payant ;
- de libérer les points réservés lors d’une annulation ;
- de transférer les points réservés lors de la completion du contrat ;
- de conserver un historique de transactions.

## 12.3 Données affichées

Le solde retourne notamment :

- `userId` ;
- `pointsBalance` ;
- `reservedPoints` ;
- `availablePoints`.

## 12.4 Limites

Le système ne gère pas encore complètement :

- points gelés ;
- litiges ;
- pénalités ;
- remboursements avancés ;
- correction administrateur ;
- statistiques de gains et dépenses.

---

## 13. Incidents et alertes

## 13.1 Objectif

Les incidents permettent de signaler et suivre des problèmes dans le quartier.

Ils sont utilisés par :

- l’application web utilisateur ;
- le back-office administrateur ;
- la future synchronisation JavaFX.

## 13.2 Fonctionnalités réalisées

La version actuelle permet :

- de créer un incident ;
- de lister les incidents ;
- de consulter un incident ;
- de modifier un incident ;
- de résoudre un incident ;
- de fermer un incident ;
- de créer une alerte rattachée à un incident ;
- de lister les alertes d’un incident ;
- de modifier une alerte ;
- de résoudre une alerte.

## 13.3 Champs principaux

Un incident contient notamment :

- titre ;
- description ;
- type ;
- statut ;
- sévérité ;
- quartier ;
- source ;
- identifiant externe ;
- date de dernière synchronisation.

## 13.4 Limites

Il manque encore :

- assignation d’incident ;
- notifications automatiques ;
- suppression ou archivage avancé ;
- workflow complet de conflit JavaFX.

---

## 14. Synchronisation JavaFX / API

## 14.1 Objectif

La synchronisation doit permettre à l’application JavaFX de travailler hors ligne puis de transmettre ses modifications à l’API centrale.

## 14.2 Fonctionnalités réalisées côté API

La version actuelle expose :

- `POST /api/sync/push` ;
- `GET /api/sync/pull` ;
- `GET /api/sync/status` ;
- `GET /api/sync/history`.

Le backend gère :

- l’idempotence par `operationId` ;
- l’enregistrement des opérations ;
- l’état de synchronisation par client ;
- le push d’incidents et alertes ;
- le pull des changements depuis une date.

## 14.3 Limite actuelle

La synchronisation côté API est prête, mais l’application JavaFX doit encore finaliser :

- l’outbox locale ;
- le client HTTP ;
- le push automatique ;
- le pull automatique ;
- l’écran de statut de synchronisation ;
- la gestion des conflits côté interface.

---

## 15. Micro-langage MongoDB

## 15.1 Objectif

Le micro-langage permet d’interroger certaines collections MongoDB avec une syntaxe simple.

## 15.2 État réalisé

La version actuelle utilise **Jison**, avec :

- une grammaire `.jison` ;
- un parser ;
- un AST ;
- une validation de sécurité ;
- une traduction en filtre Mongoose ;
- une exécution en lecture seule.

## 15.3 Routes disponibles

```txt
POST /api/dsl/parse
POST /api/dsl/execute
GET  /api/dsl/examples
```

## 15.4 Exemples de requêtes

```txt
FIND services
FIND services WHERE category = "bricolage"
FIND incidents WHERE severity = "high" AND status != "closed"
FIND services WHERE pricePoints >= 10
```

## 15.5 Limites

Le DSL est volontairement limité :

- lecture seule ;
- collections autorisées uniquement ;
- pas d’écriture ;
- pas de JavaScript évalué ;
- pas d’opérateurs dangereux ;
- pas de requêtes complexes avec parenthèses ou OR.

---

## 16. RGPD

## 16.1 Objectif

Le RGPD permet à l’utilisateur d’accéder à ses données personnelles.

## 16.2 Fonctionnalité réalisée

La version actuelle propose un export RGPD contenant notamment :

- profil utilisateur ;
- services créés ;
- candidatures envoyées ;
- candidatures reçues ;
- contrats liés ;
- transactions de points ;
- incidents signalés ;
- alertes liées ;
- opérations de synchronisation rattachables ;
- documents.

Les identifiants sont normalisés avec `id`, sans `_id`, et les mots de passe hachés ne sont pas exportés.

## 16.3 Limites

Il manque encore :

- demande de suppression ;
- anonymisation complète ;
- rectification de profil ;
- historique des demandes RGPD ;
- export ZIP.

---

## 17. Web utilisateur

## 17.1 Objectif

L’application web utilisateur permet de démontrer le parcours principal.

## 17.2 Pages ou sections actuelles

La version actuelle contient :

- connexion ;
- dashboard ;
- services ;
- mes candidatures ;
- contrats ;
- points ;
- incidents ;
- RGPD.

## 17.3 Fonctionnalités actuelles

L’utilisateur peut :

- se connecter ;
- créer un service ;
- publier un service ;
- candidater ;
- accepter ou rejeter une candidature ;
- générer un contrat ;
- signer ;
- terminer ou annuler un contrat ;
- consulter les points ;
- créer un incident ;
- exporter ses données.

## 17.4 Limites

Il manque encore :

- événements dans l’interface ;
- votes dans l’interface ;
- messagerie ;
- documents PDF ;
- notifications ;
- profil utilisateur modifiable ;
- multilingue.

---

## 18. Back-office administrateur

## 18.1 Objectif

Le back-office permet à l’administrateur de superviser la plateforme.

## 18.2 Pages actuelles

La version actuelle contient :

- connexion administrateur ;
- dashboard ;
- services ;
- contrats ;
- incidents ;
- synchronisation ;
- utilisateurs.

## 18.3 Fonctionnalités actuelles

L’administrateur peut :

- consulter les compteurs globaux ;
- consulter les services récents ;
- consulter les contrats récents ;
- consulter les incidents ;
- consulter les états de synchronisation ;
- consulter les utilisateurs sans `passwordHash`.

## 18.4 Limites

Il manque encore :

- gestion complète des quartiers ;
- carte géographique ;
- gestion des votes ;
- gestion des événements ;
- gestion des documents ;
- gestion des litiges ;
- gestion des signalements ;
- actions administrateur avancées.

---

## 19. Docker et lancement

## 19.1 État réalisé

La version actuelle peut être lancée avec Docker Compose.

Services inclus :

- API ;
- web utilisateur ;
- admin-web ;
- MongoDB.

Ports utilisés :

| Service | URL |
|---|---|
| API | `http://localhost:3000` |
| Swagger | `http://localhost:3000/docs` |
| Web utilisateur | `http://localhost:5173` |
| Admin web | `http://localhost:5174` |
| MongoDB | `localhost:27017` |

## 19.2 Limites

Les services suivants ne sont pas encore inclus dans le Docker Compose opérationnel actuel :

- Neo4j ;
- MinIO ;
- Keycloak.

Ils restent prévus dans l’architecture cible.

---

## 20. Fonctionnalités non finalisées par rapport au sujet

Le sujet initial demande une plateforme très complète. Les fonctionnalités suivantes restent à ajouter ou approfondir :

| Fonctionnalité | État actuel |
|---|---|
| Carte de quartier | Non finalisée |
| Neo4j recommandations | Non branché réellement |
| MinIO fichiers | Non branché réellement |
| PDF signé complet | Partiel |
| Keycloak SSO | Non implémenté |
| MFA | Non implémenté |
| Messagerie multimédia | Non implémentée côté interface |
| Socket.IO | Non implémenté |
| Événements web | Non finalisé |
| Votes web | Non finalisé |
| Litiges | Non implémenté comme module complet |
| Avis / réputation | Non implémenté |
| Notifications | Non implémentées |
| Multilingue | Non implémenté |
| JavaFX sync côté client | À finaliser côté desktop |

---

## 21. Scénarios de démonstration réalistes

## 21.1 Scénario principal réalisé

1. Alice se connecte.
2. Alice crée un service payant.
3. Alice publie le service.
4. Bob se connecte.
5. Bob candidate.
6. Alice accepte la candidature.
7. Alice génère le contrat.
8. Les points sont réservés.
9. Alice signe.
10. Bob signe.
11. Le contrat devient actif.
12. Alice complète le contrat.
13. Les points sont transférés.
14. Alice consulte son export RGPD.
15. L’administrateur consulte l’activité dans le back-office.

## 21.2 Scénario incident / synchronisation API

1. Un utilisateur crée un incident depuis le web.
2. L’incident apparaît dans l’API.
3. L’administrateur le consulte dans le back-office.
4. L’API expose les endpoints nécessaires pour synchroniser un client JavaFX.

## 21.3 Scénario DSL

1. Une requête DSL est envoyée à l’API.
2. Jison parse la requête.
3. L’AST est validé.
4. La requête est traduite en filtre MongoDB.
5. Les résultats sont retournés en lecture seule.

---

## 22. Priorités restantes

## 22.1 Priorité P0

- Finaliser l’intégration JavaFX côté client.
- Générer et tester le JAR JavaFX.
- Vérifier la persistance locale JavaFX.
- Démontrer la synchronisation complète JavaFX → API → admin-web.
- Nettoyer les comptes de démonstration inutiles si nécessaire.
- Vérifier Swagger et les routes principales.

## 22.2 Priorité P1

- Ajouter une page quartiers avec carte.
- Ajouter les événements côté web.
- Ajouter les votes côté web.
- Ajouter la messagerie texte côté web.
- Brancher MinIO pour les documents.
- Ajouter une V1 de documents PDF signés.
- Brancher Neo4j pour une recommandation simple.
- Ajouter litiges simples.

## 22.3 Priorité P2

- Keycloak et SSO complet.
- MFA complet.
- Socket.IO temps réel.
- Messagerie multimédia.
- Avis et réputation.
- Notifications avancées.
- Multilingue complet.
- Export RGPD ZIP.

---

## 23. Conclusion fonctionnelle

Connected Neighbours dispose maintenant d’un socle fonctionnel cohérent et démontrable.

La version actuelle montre principalement :

- un workflow complet de service payant ;
- des candidatures ;
- un contrat ;
- une double signature ;
- une réservation et un transfert de points ;
- un export RGPD ;
- une API de synchronisation pour JavaFX ;
- un back-office administrateur ;
- un web utilisateur ;
- un micro-langage MongoDB avec Jison ;
- une conteneurisation opérationnelle.

Le projet n’est pas encore complet par rapport à toute l’ambition du sujet, mais il possède désormais un cœur métier solide. Les prochaines étapes doivent surtout viser l’intégration JavaFX côté client, les documents PDF/MinIO, Neo4j, les événements, les votes et la messagerie.
