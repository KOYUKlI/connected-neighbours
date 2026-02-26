# Présentation de l’infrastructure et des technos retenues (Étape 1)

## 1) Vue d’ensemble
Le projet **Connected Neighbours** est composé :
- d’un **site web React** (utilisateur + administration),
- d’une **API Node.js/Express**,
- de deux bases : **MongoDB** (données applicatives) et **Neo4j** (graphe social & recommandations),
- d’une application **JavaFX** (client lourd administrateur) capable de fonctionner **hors ligne** avec **synchronisation**.

L’objectif est de conserver une architecture simple, tout en respectant les contraintes : **SSO/MFA**, **RGPD**, **conteneurisation**, **offline-first Java**, **recommandation Neo4j** et **micro-langage**.

---

## 2) Choix technologiques

### Front web
- **React** (application utilisateur + back-office admin)
- Multilingue : i18n (ex : `react-i18next`)

### Backend
- **Node.js + Express** (API REST)
- Documentation API : OpenAPI/Swagger (mise en place dès le début)

### Données
- **MongoDB** : services, contrats, événements, votes, messages (métadonnées), états de signatures, historiques.
- **Neo4j** : graphe des interactions (ex : participations, échanges de services) et recommandations.
- **MinIO (S3 compatible)** : stockage des fichiers (médias de messagerie, PDF, documents signés).

**Principe MinIO (V1)**
- L’API génère des **liens temporaires** (presigned URLs).
- Le client web **upload/télécharge directement** vers MinIO.
- MongoDB stocke les **métadonnées** et références (`objectKey`, type, taille, owner, contexte).

### Temps réel
- **Socket.IO** : présence en ligne/hors ligne + messagerie temps réel.

### Authentification / SSO / MFA
- **Keycloak (OIDC)** : authentification centralisée pour le site web et l’application JavaFX (**SSO**).
- **MFA** : second facteur (TOTP) activé pour les actions sensibles (signature, modification identifiants, etc.).
- Gestion des rôles : `resident`, `moderator`, `admin`.

### Client lourd administrateur
- **Java 17 + JavaFX**
- Base locale : **SQLite** (ou H2) pour le mode hors ligne.
- Synchronisation : modèle push/pull (voir section 4).

### Micro-langage d’interrogation MongoDB
- **Jison** (parser de type lex/yacc en JavaScript) pour construire un DSL traduisant une requête “humain” en requête MongoDB.

### RGPD (exigence)
L’application prévoit des endpoints dédiés pour :
- **export** des données personnelles (profil, messages, interactions),
- **suppression / anonymisation** selon les règles du projet.

---

## 3) Structure API modulaire (extensibilité)
L’API est développée sous forme de **monolithe modulaire** :
- un noyau Express (middlewares, sécurité, gestion des erreurs),
- des **modules fonctionnels** isolés (un dossier = un module), par exemple :
  - Auth / rôles
  - Quartier (zone dessinée)
  - Services + Points + Contrats
  - Documents + Signatures (PDF : import, placement zones signature/initiales, archivage et traçabilité)
  - Événements + Recommandations
  - Messagerie (temps réel + historique)
  - Votes
  - RGPD
  - Synchronisation JavaFX
  - Micro-langage (Jison)

Chaque module expose ses routes et sa logique métier via un **registre de modules** chargé au démarrage : ajouter une fonctionnalité revient à ajouter un dossier module + l’enregistrer, sans modifier la logique des autres modules.

---

## 4) Base locale Java + synchronisation (offline-first)
Le client lourd JavaFX doit fonctionner sans internet et se synchroniser dès le retour de connexion.

### Principe V1 (simple et démontrable)
- L’application JavaFX stocke les données en local (SQLite).
- Les opérations réalisées hors ligne sont ajoutées à une **file d’attente locale** (outbox).
- Chaque opération offline est enregistrée avec un **identifiant** et un **horodatage** afin d’éviter les doublons lors d’une reconnexion (idempotence côté serveur).
- Lors de la reconnexion :
  1) **Push** : envoi des opérations de l’outbox vers l’API
  2) **Pull** : récupération des mises à jour depuis la dernière synchronisation (`lastSyncAt`)
- Gestion des conflits V1 : règle “dernière modification gagnante” + journal d’audit (évolutif en V2 si nécessaire).

---

## 5) Carte & définition du quartier
La zone du quartier est dessinée par l’administrateur sur une carte.
- Outil : **Leaflet + Leaflet.draw**
- Stockage : polygone au format GeoJSON en base
- Gestion des limites (V1) : un point sur la frontière est considéré “dans la zone”, avec une tolérance pour éviter les erreurs liées à la géolocalisation.

---

## 6) Conteneurisation (développement et déploiement)
Les composants sont prévus pour être conteneurisés :
- `frontend` (React)
- `backend` (Node/Express)
- `mongodb`
- `neo4j`
- `keycloak` (SSO/MFA)
- `minio` (stockage médias)

En environnement de développement, un `docker-compose.yml` permettra de démarrer l’ensemble.