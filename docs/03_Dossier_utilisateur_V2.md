# 03 — Dossier utilisateur V2 — Connected Neighbours

## 1. Objectif du document

Ce document explique comment lancer, tester et présenter la version actuelle de **Connected Neighbours**.

Il est destiné :

- au jury ;
- aux enseignants ;
- aux utilisateurs de test ;
- aux membres de l’équipe projet ;
- à toute personne souhaitant exécuter le projet localement.

Cette version V2 ne présente pas toutes les fonctionnalités du sujet comme finalisées. Elle distingue clairement :

- ce qui est actuellement utilisable ;
- ce qui est démontrable ;
- ce qui est partiel ;
- ce qui reste à finaliser.

---

## 2. Présentation rapide de l’application

**Connected Neighbours** est une plateforme collaborative de quartier permettant aux habitants d’échanger des services, de gérer des candidatures, de générer des contrats, d’utiliser un système de points, de signaler des incidents et d’exporter leurs données personnelles.

La version actuelle permet surtout de démontrer un parcours principal complet :

```txt
connexion
→ création d’un service payant
→ publication du service
→ candidature d’un voisin
→ acceptation de la candidature
→ génération du contrat
→ réservation des points
→ signature par les deux parties
→ finalisation du contrat
→ transfert des points
→ export RGPD
```

La plateforme comprend actuellement :

| Partie | État |
|---|---|
| API centrale NestJS/Fastify | Fonctionnelle |
| MongoDB | Fonctionnel |
| Web utilisateur React | Fonctionnel pour le parcours principal |
| Back-office React | Fonctionnel pour consultation admin |
| Docker Compose | Fonctionnel pour API + web + admin-web + MongoDB |
| Swagger | Disponible |
| Tests API unitaires et E2E | Présents |
| DSL MongoDB avec Jison | Fonctionnel |
| Export RGPD | Fonctionnel |
| JavaFX | Présent dans le projet, synchronisation client à finaliser selon l’état de l’équipe Java |
| Neo4j | Prévu, pas cœur de la démo actuelle |
| MinIO | Prévu, pas cœur de la démo actuelle |
| Keycloak / SSO / MFA | Prévu, non finalisé dans la démo actuelle |

---

## 3. Prérequis

## 3.1 Prérequis généraux

Pour lancer le projet en local, installer :

```txt
Git
Docker Desktop
Node.js 24
pnpm 10.32.1
Java JDK 17 ou supérieur, uniquement pour JavaFX
Maven, uniquement pour JavaFX
```

Versions utilisées/recommandées pour la partie Node :

```txt
Node.js : 24.x
pnpm : 10.32.1
Docker Desktop : version récente
```

Vérification :

```bash
git --version
node --version
pnpm --version
docker --version
```

Pour JavaFX :

```bash
java --version
mvn --version
```

---

## 4. Récupération du projet

Cloner le dépôt puis entrer dans le dossier :

```bash
git clone <URL_DU_DEPOT_GITHUB>
cd connected-neighbours
```

Installer les dépendances Node.js :

```bash
pnpm install
```

Le projet est organisé en monorepo :

```txt
apps/api          API centrale
apps/web          application web habitant
apps/admin-web    back-office administrateur
apps/admin-desktop application JavaFX administrateur
docs              documentation
diagrams          schémas
docker-compose.yml environnement Docker
```

---

## 5. Lancement recommandé avec Docker

## 5.1 Objectif

Le lancement Docker est le mode le plus simple pour une démonstration.

Il lance actuellement :

```txt
mongodb
api
web
admin-web
```

Les services Neo4j, MinIO et Keycloak sont prévus dans l’architecture cible, mais ne sont pas indispensables au scénario de démonstration actuel.

## 5.2 Démarrer la stack

À la racine du projet :

```bash
docker compose up --build -d
```

Vérifier les conteneurs :

```bash
docker compose ps
```

Résultat attendu :

```txt
cn-mongodb   Up / healthy
cn-api       Up
cn-web       Up
cn-admin-web Up
```

## 5.3 URLs Docker

| Service | URL |
|---|---|
| API | `http://localhost:3000/api` |
| Swagger | `http://localhost:3000/docs` |
| Web utilisateur | `http://localhost:5173` |
| Back-office admin | `http://localhost:5174` |
| MongoDB | `localhost:27017` |

## 5.4 Arrêter la stack

```bash
docker compose down
```

## 5.5 Réinitialiser les données Docker

Attention : cette commande supprime les données MongoDB du volume Docker.

```bash
docker compose down -v
```

Puis relancer :

```bash
docker compose up --build -d
```

---

## 6. Lancement en mode développement

Le mode développement permet de modifier le code et de profiter du rechargement automatique.

## 6.1 Démarrer MongoDB

```bash
docker compose up -d mongodb
```

## 6.2 Fichier `.env` local

Pour lancer l’API hors Docker, créer un fichier `.env` à la racine du projet avec une configuration de développement.

Exemple minimal :

```env
NODE_ENV=development
PORT=3000
HOST=0.0.0.0

CORS_ORIGIN=http://localhost:5173,http://localhost:5174
COOKIE_SECRET=connected-neighbours-cookie-secret-dev

MONGODB_URI=mongodb://localhost:27017/connected-neighbours

NEO4J_URI=bolt://localhost:7687
NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=password

MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_USE_SSL=false
MINIO_ACCESS_KEY=minio
MINIO_SECRET_KEY=minio-password
MINIO_BUCKET=connected-neighbours

KEYCLOAK_BASE_URL=http://localhost:8080
KEYCLOAK_REALM=connected-neighbours
KEYCLOAK_CLIENT_ID=connected-neighbours-api
KEYCLOAK_CLIENT_SECRET=dev-secret

JWT_SECRET=connected-neighbours-jwt-secret-dev
JWT_EXPIRES_IN=1d
DEV_AUTH_SEED=true
```

Même si Neo4j, MinIO et Keycloak ne sont pas encore utilisés dans le scénario principal, certaines variables peuvent être exigées par la configuration de l’API.

## 6.3 Lancer l’API

Terminal 1 :

```bash
pnpm dev:api
```

Adresses attendues :

```txt
API : http://localhost:3000/api
Swagger : http://localhost:3000/docs
```

## 6.4 Lancer le web utilisateur

Terminal 2 :

```bash
pnpm dev:web
```

Adresse :

```txt
http://localhost:5173
```

## 6.5 Lancer le back-office administrateur

Terminal 3 :

```bash
pnpm dev:admin
```

Adresse :

```txt
http://localhost:5174
```

> Important : le script racine est `pnpm dev:admin`, pas `pnpm dev:admin-web`.

---

## 7. Comptes de démonstration

La version actuelle crée des comptes de démonstration si le seed de développement est activé.

| Rôle | Email | Mot de passe | Usage |
|---|---|---|---|
| Administrateur | `admin@connected-neighbours.local` | `admin123` | Accès back-office |
| Habitante | `alice@connected-neighbours.local` | `alice123` | Création de service |
| Habitant | `bob@connected-neighbours.local` | `bob123` | Candidature à un service |

Des anciens comptes de démonstration peuvent encore exister dans une base locale déjà utilisée. Pour une démonstration propre, utiliser de préférence les comptes ci-dessus.

---

## 8. Utilisation du web utilisateur

## 8.1 Connexion

1. Ouvrir `http://localhost:5173`.
2. Se connecter avec Alice ou Bob.
3. Le token JWT est conservé localement par le navigateur.
4. En cas de session invalide, l’application revient à l’écran de connexion.

Comptes utiles :

```txt
alice@connected-neighbours.local / alice123
bob@connected-neighbours.local / bob123
```

## 8.2 Navigation disponible

Le web utilisateur propose les sections suivantes :

```txt
Dashboard
Services
Mes candidatures
Contrats
Points
Incidents
RGPD
```

Ces pages couvrent le parcours principal de démonstration.

## 8.3 Créer un service avec Alice

1. Se connecter avec Alice.
2. Aller dans **Services**.
3. Créer un service.
4. Renseigner :
   - titre ;
   - description ;
   - type ;
   - catégorie ;
   - disponibilité ;
   - quartier ;
   - prix en points si service payant.
5. Publier le service.

Résultat attendu :

- le service apparaît dans la liste ;
- son statut passe à `published` ;
- un autre utilisateur peut candidater.

## 8.4 Candidater avec Bob

1. Se déconnecter d’Alice.
2. Se connecter avec Bob.
3. Aller dans **Services**.
4. Repérer le service créé par Alice.
5. Envoyer une candidature avec :
   - un message ;
   - une date proposée ;
   - un prix proposé.

Résultat attendu :

- la candidature est créée ;
- elle est visible dans **Mes candidatures** côté Bob ;
- elle est visible dans les candidatures reçues côté Alice.

## 8.5 Accepter la candidature avec Alice

1. Se reconnecter avec Alice.
2. Aller dans **Services**.
3. Ouvrir ou consulter le service créé.
4. Voir les candidatures reçues.
5. Accepter la candidature de Bob.
6. Générer le contrat depuis la candidature acceptée.

Résultat attendu :

- la candidature passe en `accepted` ;
- le service est lié à cette candidature ;
- un contrat est généré ;
- les points sont réservés si le service est payant.

## 8.6 Signer le contrat

1. Alice va dans **Contrats**.
2. Alice signe le contrat.
3. Bob se connecte.
4. Bob va dans **Contrats**.
5. Bob signe le même contrat.

Résultat attendu :

- chaque utilisateur signe une seule fois ;
- quand les deux signatures sont présentes, le contrat passe en `active` ;
- le service passe en `contract_active`.

## 8.7 Terminer le contrat

1. Revenir avec Alice, demandeuse du service.
2. Aller dans **Contrats**.
3. Compléter le contrat actif.

Résultat attendu :

- le contrat passe en `completed` ;
- le service passe en `completed` ;
- les points réservés sont transférés à Bob ;
- une transaction de transfert est créée.

## 8.8 Consulter les points

1. Aller dans **Points**.
2. Vérifier :
   - solde ;
   - points réservés ;
   - points disponibles ;
   - transactions.

Un parcours complet doit afficher au moins :

```txt
reservation
transfer
```

## 8.9 Signaler un incident

1. Aller dans **Incidents**.
2. Créer un incident.
3. Renseigner :
   - titre ;
   - description ;
   - type ;
   - sévérité ;
   - quartier.
4. Envoyer.

Résultat attendu :

- l’incident est enregistré côté API ;
- il peut être visible côté back-office administrateur.

## 8.10 Export RGPD

1. Aller dans **RGPD**.
2. Cliquer sur **Exporter**.
3. Consulter les sections retournées.
4. Vérifier le JSON complet.

L’export peut contenir :

```txt
profil utilisateur
services créés
candidatures envoyées
candidatures reçues
contrats liés
transactions de points
incidents signalés
alertes liées
opérations de synchronisation si rattachables
documents
```

Règles importantes :

- les identifiants sont normalisés avec `id` ;
- le champ `passwordHash` n’est pas exporté ;
- les sections vides sont affichées clairement.

---

## 9. Utilisation du back-office administrateur

## 9.1 Connexion

Ouvrir :

```txt
http://localhost:5174
```

Se connecter avec :

```txt
admin@connected-neighbours.local / admin123
```

## 9.2 Pages disponibles

Le back-office actuel propose :

```txt
Dashboard
Services
Contrats
Incidents
Synchronisation
Utilisateurs
```

## 9.3 Dashboard

Le dashboard affiche des compteurs :

- services ;
- candidatures ;
- contrats ;
- incidents ;
- alertes ;
- clients de synchronisation ;
- heure serveur.

## 9.4 Services

La page Services affiche les services récents :

- titre ;
- catégorie ;
- statut ;
- propriétaire ;
- quartier ;
- prix ;
- dates.

Si aucun service n’existe dans la base active, la page affiche un état vide.

## 9.5 Contrats

La page Contrats affiche :

- service lié ;
- demandeur ;
- prestataire ;
- prix ;
- statut ;
- signatures ;
- dates.

## 9.6 Incidents

La page Incidents affiche :

- titre ;
- type ;
- sévérité ;
- statut ;
- source ;
- date de création.

## 9.7 Synchronisation

La page Synchronisation affiche les états connus des clients de synchronisation :

- clientId ;
- statut ;
- dernier push ;
- dernier pull ;
- dernière synchronisation réussie ;
- erreur éventuelle.

Cette page dépend des appels à l’API de synchronisation.

## 9.8 Utilisateurs

La page Utilisateurs affiche :

- email ;
- nom ;
- rôle ;
- quartier ;
- solde ;
- points réservés.

Le champ `passwordHash` ne doit jamais être affiché.

---

## 10. Utilisation de Swagger

## 10.1 Accès

Ouvrir :

```txt
http://localhost:3000/docs
```

## 10.2 Tester une route protégée

1. Exécuter `POST /api/auth/login`.
2. Copier le token JWT retourné.
3. Cliquer sur **Authorize**.
4. Coller le token au format Bearer si nécessaire.
5. Tester les routes protégées.

## 10.3 Routes importantes

```txt
GET    /api/health
POST   /api/auth/login
GET    /api/auth/me
POST   /api/services
GET    /api/services
POST   /api/services/:id/publish
POST   /api/services/:serviceId/applications
GET    /api/applications/me
POST   /api/applications/:id/accept
POST   /api/contracts/from-application/:applicationId
GET    /api/contracts
POST   /api/contracts/:id/sign
POST   /api/contracts/:id/complete
GET    /api/points/balance
GET    /api/points/transactions
POST   /api/incidents
GET    /api/incidents
GET    /api/rgpd/export
POST   /api/dsl/parse
POST   /api/dsl/execute
POST   /api/sync/push
GET    /api/sync/pull
GET    /api/admin/dashboard
```

---

## 11. Micro-langage MongoDB

Le micro-langage permet d’interroger certaines collections MongoDB en lecture seule.

Exemples :

```txt
FIND services
FIND services WHERE category = "bricolage"
FIND incidents WHERE severity = "high" AND status != "closed"
FIND alerts WHERE source = "javafx"
FIND services WHERE pricePoints >= 10
```

Fonctionnement :

1. L’utilisateur envoie une requête DSL.
2. Le parser Jison produit un AST.
3. L’API valide la collection et les champs.
4. L’API traduit la requête en filtre MongoDB.
5. L’API exécute une recherche en lecture seule.

Routes :

```txt
POST /api/dsl/parse
POST /api/dsl/execute
GET  /api/dsl/examples
```

---

## 12. Application JavaFX

## 12.1 État actuel

L’application JavaFX est présente dans le projet sous :

```txt
apps/admin-desktop
```

Elle concerne principalement :

- les incidents ;
- les alertes ;
- les reporters ;
- les statistiques locales ;
- les thèmes ;
- les plugins ;
- la base locale H2.

La synchronisation côté API existe, mais la synchronisation complète côté client JavaFX dépend de l’état final de la partie Java.

## 12.2 Lancement en développement

Depuis le dossier JavaFX :

```bash
cd apps/admin-desktop
mvn clean test
mvn javafx:run
```

Selon la configuration réelle du module JavaFX, la commande peut devoir être adaptée.

## 12.3 JAR JavaFX

Le sujet demande un rendu sous forme de fichier `.jar`.

Si le JAR est généré :

```bash
java -jar connected-neighbours-admin-desktop.jar
```

À vérifier avant soutenance :

- le JAR existe ;
- il se lance sur une machine propre ;
- les ressources sont bien incluses ;
- la base locale est conservée ;
- le scénario offline est démontrable.

## 12.4 Scénario JavaFX attendu

Le scénario attendu côté JavaFX est :

```txt
lancer l’application
consulter les incidents locaux
couper Internet
créer un incident hors ligne
stocker l’opération dans l’outbox
rétablir Internet
synchroniser avec l’API
voir l’incident dans le back-office web
```

Si ce scénario n’est pas entièrement finalisé, il doit être présenté comme une limite ou une partie en cours.

---

## 13. Tests et validation

## 13.1 Tests API

Commandes utiles :

```bash
pnpm --filter "./apps/api" run build
pnpm --filter "./apps/api" run test
pnpm --filter "./apps/api" run test:e2e
```

Pour les tests E2E, MongoDB doit être lancé :

```bash
docker compose up -d mongodb
```

## 13.2 Builds front

```bash
pnpm --filter "./apps/web" run build
pnpm --filter "./apps/admin-web" run build
```

## 13.3 Validation Docker

```bash
docker compose config
docker compose up --build -d
docker compose ps
```

## 13.4 Vérification manuelle rapide

Après lancement Docker :

```txt
http://localhost:3000/docs  doit répondre
http://localhost:5173       doit afficher le web utilisateur
http://localhost:5174       doit afficher le back-office
```

Tester ensuite :

- login Alice ;
- login Bob ;
- login admin ;
- parcours service complet ;
- export RGPD ;
- affichage admin.

---

## 14. Scénarios de démonstration recommandés

## 14.1 Scénario principal : service payant

1. Lancer Docker.
2. Ouvrir le web utilisateur.
3. Se connecter avec Alice.
4. Créer un service payant.
5. Publier le service.
6. Se connecter avec Bob.
7. Candidater au service.
8. Revenir avec Alice.
9. Accepter la candidature.
10. Générer le contrat.
11. Signer avec Alice.
12. Signer avec Bob.
13. Compléter le contrat.
14. Vérifier le transfert des points.
15. Exporter les données RGPD d’Alice.
16. Ouvrir le back-office et vérifier les données.

Ce scénario est le plus important, car il démontre le cœur métier actuellement fonctionnel.

## 14.2 Scénario admin

1. Se connecter au back-office avec le compte admin.
2. Consulter le dashboard.
3. Consulter les services.
4. Consulter les contrats.
5. Consulter les incidents.
6. Consulter la synchronisation.
7. Consulter les utilisateurs.

## 14.3 Scénario incident web

1. Se connecter avec Alice ou Bob.
2. Aller dans Incidents.
3. Créer un incident.
4. Se connecter à l’admin web.
5. Vérifier que l’incident apparaît.

## 14.4 Scénario DSL

1. Ouvrir Swagger.
2. Utiliser `POST /api/dsl/parse`.
3. Envoyer :

```txt
FIND services WHERE category = "bricolage"
```

4. Vérifier que l’AST est retourné.
5. Utiliser `POST /api/dsl/execute`.
6. Vérifier que les résultats sont retournés.

## 14.5 Scénario JavaFX offline

Ce scénario dépend de l’état final du module JavaFX.

S’il est finalisé :

1. Lancer JavaFX.
2. Créer un incident local.
3. Synchroniser.
4. Vérifier l’incident côté admin web.

S’il n’est pas finalisé :

- expliquer que l’API de synchronisation est prête ;
- montrer les endpoints `/api/sync/*` ;
- présenter le travail restant côté client JavaFX.

---

## 15. Fonctionnalités non finalisées ou partielles

Les fonctionnalités suivantes ne doivent pas être présentées comme entièrement terminées si elles ne sont pas finalisées dans le code au moment de la soutenance :

| Fonctionnalité | État actuel |
|---|---|
| Carte géographique Leaflet | Prévue / partielle selon état réel |
| Neo4j recommandations | Prévu, non cœur de la démo actuelle |
| MinIO stockage fichiers | Prévu, non cœur de la démo actuelle |
| Keycloak SSO | Prévu, non finalisé |
| MFA | Prévu, non finalisé |
| Socket.IO temps réel | Prévu, non finalisé |
| Messagerie multimédia | API basique possible, UI complète à vérifier |
| Événements web complets | À vérifier / compléter |
| Votes web complets | À vérifier / compléter |
| Litiges | Non finalisé ou partiel selon état réel |
| Avis / réputation | Non finalisé ou partiel selon état réel |
| Notifications | Non finalisé ou partiel selon état réel |
| JavaFX sync client | À finaliser par la partie JavaFX si pas encore fait |

---

## 16. Dépannage rapide

## 16.1 Docker ne démarre pas

Vérifier que Docker Desktop est lancé :

```bash
docker ps
```

Si la commande échoue, relancer Docker Desktop.

## 16.2 Port déjà utilisé

Exemple :

```txt
port 3000 already in use
```

Solution : arrêter le processus utilisant le port ou modifier le port dans la configuration.

Sous Windows PowerShell, pour identifier un port :

```powershell
netstat -ano | findstr :3000
```

## 16.3 API inaccessible

Vérifier :

```bash
docker compose ps
docker compose logs api
```

Tester :

```txt
http://localhost:3000/api/health
```

## 16.4 MongoDB indisponible

Les tests E2E échouent si MongoDB n’est pas lancé.

Démarrer MongoDB :

```bash
docker compose up -d mongodb
```

Puis relancer :

```bash
pnpm --filter "./apps/api" run test:e2e
```

## 16.5 Les fronts ne communiquent pas avec l’API

En développement local, vérifier que :

- l’API tourne sur `http://localhost:3000` ;
- le web tourne sur `http://localhost:5173` ;
- l’admin web tourne sur `http://localhost:5174` ;
- les fichiers `vite.config.ts` contiennent un proxy `/api` vers `http://localhost:3000`.

En Docker, les fronts Nginx doivent proxyfier `/api` vers le conteneur `api:3000`.

## 16.6 Token expiré ou accès refusé

Solution :

1. Cliquer sur Déconnexion.
2. Se reconnecter.
3. Vérifier que le bon rôle est utilisé.

Exemple : les pages admin nécessitent un compte `admin`.

## 16.7 Données incohérentes après plusieurs tests

Réinitialiser MongoDB Docker :

```bash
docker compose down -v
docker compose up --build -d
```

Attention : cette commande supprime les données stockées dans le volume MongoDB.

---

## 17. Conclusion

Cette version de Connected Neighbours permet de lancer et démontrer un socle fonctionnel cohérent :

```txt
API centrale
web utilisateur
back-office administrateur
MongoDB
Docker
workflow service/candidature/contrat/points
incidents
export RGPD
DSL MongoDB
```

Le scénario principal à présenter est le parcours service payant entre Alice et Bob.

Les fonctionnalités plus avancées du sujet, comme Neo4j, MinIO, Keycloak/MFA, Socket.IO, messagerie multimédia complète ou JavaFX sync client, doivent être présentées selon leur état réel : terminées, partielles ou prévues en amélioration.

L’objectif de la démonstration est de montrer un parcours réaliste, stable et traçable plutôt qu’une liste de modules superficiels.
