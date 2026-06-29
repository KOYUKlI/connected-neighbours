# 03 — Dossier utilisateur final — Connected Neighbours

## 1. Objectif du document

Ce document explique comment installer, lancer et utiliser l’application **Connected Neighbours**.

Il est destiné :

- au jury ;
- aux enseignants ;
- aux utilisateurs de test ;
- aux membres de l’équipe projet ;
- à toute personne souhaitant lancer la plateforme en local.

Le document décrit l’utilisation des différentes parties du projet :

- application web utilisateur ;
- back-office administrateur ;
- application JavaFX administrateur ;
- API Swagger ;
- scénarios de démonstration ;
- dépannage rapide.

---

# 2. Présentation rapide de l’application

**Connected Neighbours** est une plateforme collaborative de quartier.

Elle permet aux habitants de :

- proposer ou demander des services ;
- candidater à des services ;
- signer des contrats ;
- utiliser des points ;
- échanger des documents PDF ;
- participer à des événements ;
- voter ;
- envoyer des messages ;
- signaler des incidents ;
- consulter leurs données personnelles.

L’administration se fait via :

- un back-office web React ;
- une application JavaFX capable de fonctionner hors ligne.

---

# 3. Prérequis d’installation

## 3.1 Prérequis généraux

Avant de lancer le projet, vérifier que les outils suivants sont installés :

```txt
Git
Node.js
pnpm
Docker Desktop
Java JDK
Maven
```

Versions recommandées :

```txt
Node.js : version LTS récente
pnpm : version 9 ou supérieure
Docker Desktop : version récente
Java : 17 ou supérieur
Maven : version 3.9 ou supérieure
```

---

## 3.2 Vérification des outils

Commandes utiles :

```bash
git --version
node --version
pnpm --version
docker --version
java --version
mvn --version
```

Si l’une de ces commandes ne fonctionne pas, l’outil correspondant doit être installé avant de continuer.

---

# 4. Récupération du projet

## 4.1 Cloner le dépôt

```bash
git clone <URL_DU_DEPOT_GITHUB>
cd connected-neighbours
```

Exemple :

```bash
git clone https://github.com/<organisation>/<repository>.git
cd connected-neighbours
```

---

## 4.2 Installer les dépendances Node.js

À la racine du projet :

```bash
pnpm install
```

Cette commande installe les dépendances de l’API, du front utilisateur et du back-office.

---

# 5. Configuration de l’environnement

## 5.1 Fichier `.env`

Créer un fichier `.env` à partir du fichier d’exemple :

```bash
cp .env.example .env
```

Si la commande `cp` n’est pas disponible sur Windows PowerShell :

```powershell
Copy-Item .env.example .env
```

---

## 5.2 Variables principales

Le fichier `.env` peut contenir les variables suivantes :

```env
NODE_ENV=development
PORT=3000

MONGODB_URI=mongodb://localhost:27017/connected-neighbours

NEO4J_URI=bolt://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=password

MINIO_ENDPOINT=http://localhost:9000
MINIO_ACCESS_KEY=minio
MINIO_SECRET_KEY=minio-password
MINIO_BUCKET=connected-neighbours

KEYCLOAK_URL=http://localhost:8080
KEYCLOAK_REALM=connected-neighbours

JWT_SECRET=dev-secret
CORS_ORIGIN=http://localhost:5173
```

Les valeurs peuvent varier selon la configuration finale du projet.

---

# 6. Lancement avec Docker

## 6.1 Objectif

Docker permet de lancer les services nécessaires au fonctionnement de l’application.

Services attendus :

```txt
API
MongoDB
Neo4j
MinIO
Keycloak
Front web utilisateur
Back-office administrateur
```

---

## 6.2 Lancer les conteneurs

À la racine du projet :

```bash
docker compose up -d
```

---

## 6.3 Vérifier les conteneurs

```bash
docker compose ps
```

Les services doivent apparaître avec un statut actif.

---

## 6.4 Arrêter les conteneurs

```bash
docker compose down
```

---

## 6.5 Réinitialiser les conteneurs et volumes

Attention : cette commande peut supprimer les données locales Docker.

```bash
docker compose down -v
```

---

# 7. Lancement en mode développement

Si les applications ne sont pas toutes lancées par Docker, elles peuvent être lancées séparément.

## 7.1 Lancer l’API

```bash
pnpm dev:api
```

ou, selon les scripts du projet :

```bash
cd apps/api
pnpm start:dev
```

Adresse attendue :

```txt
http://localhost:3000
```

Swagger :

```txt
http://localhost:3000/docs
```

---

## 7.2 Lancer le front web utilisateur

```bash
pnpm dev:web
```

ou :

```bash
cd apps/web
pnpm dev
```

Adresse attendue :

```txt
http://localhost:5173
```

---

## 7.3 Lancer le back-office administrateur

```bash
pnpm dev:admin-web
```

ou :

```bash
cd apps/admin-web
pnpm dev
```

Adresse attendue :

```txt
http://localhost:5174
```

---

## 7.4 Lancer l’application JavaFX

Depuis le dossier JavaFX :

```bash
cd apps/admin-desktop
mvn clean test
mvn javafx:run
```

Si un JAR final est fourni :

```bash
java -jar connected-neighbours-admin-desktop.jar
```

---

# 8. Accès aux services

## 8.1 URLs principales

| Service | URL |
|---|---|
| API | `http://localhost:3000/api` |
| Swagger | `http://localhost:3000/docs` |
| Web utilisateur | `http://localhost:5173` |
| Back-office admin | `http://localhost:5174` |
| Neo4j Browser | `http://localhost:7474` |
| MinIO Console | `http://localhost:9001` |
| Keycloak | `http://localhost:8080` |

---

## 8.2 Ports techniques

| Service | Port |
|---|---|
| API | `3000` |
| Web utilisateur | `5173` |
| Admin web | `5174` |
| MongoDB | `27017` |
| Neo4j HTTP | `7474` |
| Neo4j Bolt | `7687` |
| MinIO API | `9000` |
| MinIO Console | `9001` |
| Keycloak | `8080` |

---

# 9. Comptes de test

## 9.1 Objectif

Les comptes de test permettent de démontrer les différents rôles de l’application.

---

## 9.2 Comptes recommandés

| Rôle | Email | Mot de passe | Usage |
|---|---|---|---|
| Habitant 1 | `alice@test.local` | `Password123!` | Créer une demande de service |
| Habitant 2 | `bob@test.local` | `Password123!` | Candidater à un service |
| Modérateur | `moderator@test.local` | `Password123!` | Traiter signalements/litiges |
| Administrateur | `admin@test.local` | `Password123!` | Gérer la plateforme |
| Admin JavaFX | `desktop-admin@test.local` | `Password123!` | Tester JavaFX |

Ces comptes peuvent être adaptés selon les jeux de données fournis.

---

## 9.3 Données de démonstration attendues

Le jeu de données de démonstration doit idéalement contenir :

- plusieurs utilisateurs ;
- plusieurs quartiers ;
- des services gratuits ;
- des services payants ;
- des candidatures ;
- des contrats ;
- des transactions de points ;
- des documents ;
- des événements ;
- des votes ;
- des messages ;
- des incidents ;
- des alertes.

---

# 10. Utilisation de l’application web habitant

## 10.1 Connexion

1. Ouvrir l’application web.
2. Saisir l’email et le mot de passe.
3. Cliquer sur le bouton de connexion.
4. L’utilisateur arrive sur le tableau de bord.

---

## 10.2 Tableau de bord habitant

Le tableau de bord affiche les informations principales :

- services récents ;
- candidatures en attente ;
- contrats à signer ;
- événements à venir ;
- votes ouverts ;
- notifications ;
- solde de points ;
- messages récents.

---

## 10.3 Créer une demande de service

1. Aller dans la page **Services**.
2. Cliquer sur **Créer un service**.
3. Choisir le type : `Demande`.
4. Renseigner :
   - titre ;
   - description ;
   - catégorie ;
   - disponibilité ;
   - quartier ;
   - gratuit ou payant ;
   - prix en points si payant.
5. Enregistrer en brouillon ou publier.

Résultat attendu :

- le service apparaît dans la liste ;
- les voisins du quartier peuvent le consulter ;
- le service peut recevoir des candidatures.

---

## 10.4 Candidater à un service

1. Se connecter avec un autre habitant.
2. Aller dans **Services**.
3. Ouvrir un service publié.
4. Cliquer sur **Candidater**.
5. Renseigner :
   - message ;
   - date proposée ;
   - prix proposé si nécessaire ;
   - durée estimée.
6. Envoyer la candidature.

Résultat attendu :

- le propriétaire du service reçoit la candidature ;
- une notification peut être créée ;
- une conversation peut être ouverte.

---

## 10.5 Accepter une candidature

1. Se reconnecter avec le créateur du service.
2. Ouvrir le service.
3. Consulter les candidatures.
4. Choisir une candidature.
5. Cliquer sur **Accepter**.

Résultat attendu :

- la candidature passe en acceptée ;
- les autres candidatures sont refusées ;
- si le service est payant, un contrat est généré ;
- les points peuvent être réservés.

---

## 10.6 Signer un contrat

1. Aller dans la page **Contrats**.
2. Ouvrir le contrat en attente.
3. Vérifier les informations :
   - service ;
   - prestataire ;
   - demandeur ;
   - prix ;
   - date ;
   - conditions.
4. Cliquer sur **Signer**.
5. Valider l’action sensible si une vérification MFA est demandée.

Résultat attendu :

- la signature est enregistrée ;
- le contrat attend la signature de l’autre partie ;
- quand les deux signatures sont présentes, le contrat devient actif.

---

## 10.7 Réaliser et valider un service

### Côté prestataire

1. Ouvrir le service actif.
2. Cliquer sur **Démarrer**.
3. Réaliser le service.
4. Ajouter une preuve si nécessaire.
5. Cliquer sur **Marquer comme terminé**.

### Côté demandeur

1. Ouvrir le service.
2. Vérifier les informations.
3. Cliquer sur **Valider**.

Résultat attendu :

- le service passe en terminé ;
- les points sont transférés ;
- une transaction est créée ;
- les utilisateurs peuvent laisser un avis.

---

## 10.8 Ouvrir un litige

1. Ouvrir le service ou contrat concerné.
2. Cliquer sur **Contester** ou **Ouvrir un litige**.
3. Renseigner la raison.
4. Ajouter des preuves si nécessaire.
5. Envoyer.

Résultat attendu :

- le litige est ouvert ;
- les points sont gelés ;
- le modérateur est notifié ;
- les preuves restent consultables.

---

## 10.9 Participer à un événement

1. Aller dans la page **Événements**.
2. Consulter les événements du quartier.
3. Ouvrir un événement.
4. Indiquer son intérêt :
   - intéressé ;
   - participe ;
   - peut-être ;
   - pas intéressé.
5. Valider.

Résultat attendu :

- la participation est enregistrée ;
- l’événement peut être recommandé à d’autres utilisateurs ;
- l’utilisateur peut recevoir un rappel.

---

## 10.10 Répondre à un vote

1. Aller dans la page **Votes**.
2. Ouvrir un vote actif.
3. Lire la question.
4. Choisir une ou plusieurs réponses selon le type de vote.
5. Valider.

Résultat attendu :

- le vote est enregistré ;
- l’utilisateur ne peut pas voter deux fois si ce n’est pas autorisé ;
- les résultats sont affichés selon les règles du vote.

---

## 10.11 Utiliser la messagerie

1. Aller dans la page **Messages**.
2. Ouvrir une conversation.
3. Envoyer un message.
4. Ajouter une pièce jointe si nécessaire.

Fonctionnalités possibles :

- messages texte ;
- images ;
- documents ;
- messages système ;
- présence en ligne/hors ligne ;
- messages liés à un service ou litige.

---

## 10.12 Exporter ses données personnelles

1. Aller dans **Profil** ou **RGPD**.
2. Cliquer sur **Exporter mes données**.
3. Télécharger le fichier d’export.

L’export peut contenir :

- profil ;
- services ;
- candidatures ;
- contrats ;
- documents ;
- messages ;
- votes ;
- événements ;
- transactions ;
- avis ;
- signalements ;
- incidents.

---

# 11. Utilisation du back-office administrateur

## 11.1 Connexion administrateur

1. Ouvrir le back-office.
2. Se connecter avec un compte administrateur.
3. Accéder au tableau de bord.

---

## 11.2 Tableau de bord

Le tableau de bord affiche :

- nombre d’utilisateurs ;
- nombre de services actifs ;
- contrats en cours ;
- litiges ouverts ;
- incidents critiques ;
- événements à venir ;
- votes ouverts ;
- documents en attente de signature ;
- état de la synchronisation JavaFX.

---

## 11.3 Gérer les quartiers

1. Aller dans **Quartiers**.
2. Créer un quartier.
3. Dessiner la zone sur la carte.
4. Renseigner le nom, la ville et la description.
5. Enregistrer.

L’administrateur peut ensuite :

- modifier un quartier ;
- archiver un quartier ;
- consulter ses habitants ;
- voir les statistiques associées.

---

## 11.4 Gérer les utilisateurs

1. Aller dans **Utilisateurs**.
2. Rechercher un utilisateur.
3. Consulter son profil.
4. Modifier son rôle si nécessaire.
5. Désactiver ou réactiver un compte si nécessaire.

---

## 11.5 Modérer les contenus

1. Aller dans **Signalements**.
2. Ouvrir un signalement.
3. Consulter le contenu concerné.
4. Choisir une action :
   - rejeter le signalement ;
   - masquer le contenu ;
   - avertir l’utilisateur ;
   - suspendre l’utilisateur ;
   - ouvrir un litige.

---

## 11.6 Traiter un litige

1. Aller dans **Litiges**.
2. Ouvrir le litige.
3. Consulter :
   - le service ;
   - le contrat ;
   - les messages liés ;
   - les preuves ;
   - les transactions de points.
4. Prendre une décision :
   - remboursement ;
   - transfert ;
   - partage ;
   - rejet.
5. Clôturer le litige.

Résultat attendu :

- les points sont libérés selon la décision ;
- une trace d’audit est créée ;
- les parties sont notifiées.

---

## 11.7 Suivre les incidents

1. Aller dans **Incidents**.
2. Consulter les incidents signalés.
3. Filtrer par statut ou sévérité.
4. Ouvrir un incident.
5. Ajouter ou modifier une alerte.
6. Marquer l’incident comme en cours ou résolu.

---

## 11.8 Superviser la synchronisation JavaFX

1. Aller dans **Synchronisation**.
2. Consulter :
   - dernière synchronisation ;
   - client JavaFX concerné ;
   - opérations reçues ;
   - erreurs ;
   - conflits.
3. Résoudre un conflit si nécessaire.

---

# 12. Utilisation de l’application JavaFX

## 12.1 Lancement

Depuis le dossier JavaFX :

```bash
cd apps/admin-desktop
mvn javafx:run
```

Ou avec le JAR :

```bash
java -jar connected-neighbours-admin-desktop.jar
```

---

## 12.2 Connexion

1. Ouvrir l’application.
2. Se connecter avec un compte administrateur.
3. Attendre le chargement des données locales.

Si l’application est hors ligne, elle peut fonctionner avec les données déjà synchronisées.

---

## 12.3 Consulter les incidents

1. Ouvrir l’onglet **Incidents**.
2. Consulter la liste.
3. Filtrer par statut, type ou sévérité.
4. Ouvrir un incident pour voir le détail.

---

## 12.4 Créer un incident hors ligne

1. Couper la connexion Internet.
2. Ouvrir JavaFX.
3. Aller dans **Incidents**.
4. Cliquer sur **Créer un incident**.
5. Renseigner :
   - titre ;
   - description ;
   - type ;
   - sévérité ;
   - quartier ;
   - reporter si nécessaire.
6. Enregistrer.

Résultat attendu :

- l’incident est stocké localement ;
- une opération est ajoutée dans l’outbox ;
- aucune connexion n’est nécessaire.

---

## 12.5 Synchroniser

1. Rétablir Internet.
2. L’application détecte la connexion ou l’utilisateur clique sur **Synchroniser**.
3. Les opérations locales sont envoyées à l’API.
4. Les nouveaux changements serveur sont récupérés.
5. L’état local est mis à jour.

Résultat attendu :

- l’incident créé hors ligne apparaît dans le back-office web ;
- l’outbox est vidée ;
- la date de dernière synchronisation est mise à jour.

---

## 12.6 Gérer les conflits

En cas de conflit, l’application peut proposer :

- garder la version serveur ;
- garder la version locale ;
- fusionner manuellement ;
- reporter la décision.

Le conflit doit rester visible dans l’historique.

---

## 12.7 Plugins et thèmes

L’application JavaFX peut prévoir :

- installation de plugins ;
- export de statistiques ;
- analyse sociale ;
- calendrier local ;
- changement de thème ;
- personnalisation des couleurs, polices ou disposition.

---

# 13. Utilisation de Swagger

## 13.1 Accéder à Swagger

Ouvrir :

```txt
http://localhost:3000/docs
```

---

## 13.2 Tester une route

1. Ouvrir Swagger.
2. Exécuter une route de connexion.
3. Copier le token JWT.
4. Cliquer sur **Authorize**.
5. Coller le token.
6. Tester les routes protégées.

---

## 13.3 Routes importantes à vérifier

```txt
GET    /api/health
POST   /api/auth/login
GET    /api/auth/me
GET    /api/services
POST   /api/services
GET    /api/contracts
GET    /api/points/transactions
GET    /api/events
GET    /api/votes
GET    /api/documents
GET    /api/incidents
POST   /api/sync/push
GET    /api/sync/pull
```

---

# 14. Scénarios de démonstration

## 14.1 Scénario principal : service payant complet

Objectif : montrer le cœur métier du projet.

1. Alice se connecte.
2. Alice crée une demande de service payante.
3. Bob se connecte.
4. Bob candidate au service.
5. Alice accepte la candidature.
6. Le contrat est généré.
7. Les points sont réservés.
8. Alice signe le contrat.
9. Bob signe le contrat.
10. Bob marque le service comme réalisé.
11. Bob ajoute une preuve.
12. Alice valide le service.
13. Les points sont transférés.
14. Alice et Bob peuvent laisser un avis.

Résultat attendu :

- workflow complet ;
- contrat actif puis terminé ;
- points transférés ;
- historique disponible ;
- relation Neo4j mise à jour si implémentée.

---

## 14.2 Scénario litige

1. Bob marque le service comme terminé.
2. Alice conteste.
3. Un litige est créé.
4. Les points sont gelés.
5. Alice ajoute une preuve.
6. Bob ajoute une preuve.
7. Le modérateur analyse.
8. Le modérateur décide.
9. Les points sont remboursés, transférés ou partagés.
10. Le litige est clôturé.

---

## 14.3 Scénario événement

1. Un habitant crée un événement.
2. L’événement est publié.
3. Les habitants indiquent leur intérêt.
4. Des participants rejoignent l’événement.
5. Le système propose des recommandations.

---

## 14.4 Scénario vote

1. Un vote est créé dans un quartier.
2. Les habitants votent.
3. Le système empêche les doublons.
4. Les résultats sont affichés.
5. Le vote est clôturé.

---

## 14.5 Scénario JavaFX offline

1. L’administrateur ouvre JavaFX.
2. Il consulte les incidents.
3. Internet est coupé.
4. Il crée un incident.
5. L’incident est stocké localement.
6. Internet revient.
7. La synchronisation est lancée.
8. L’incident apparaît côté API et back-office.

---

## 14.6 Scénario micro-langage MongoDB

1. Ouvrir l’outil DSL.
2. Saisir une requête :

```txt
FIND services WHERE category = "bricolage" AND pricePoints <= 50
```

3. Le parser analyse la requête.
4. L’API traduit en filtre MongoDB.
5. Les résultats sont affichés.

---

# 15. Dépannage rapide

## 15.1 Docker ne démarre pas

Vérifier que Docker Desktop est lancé.

```bash
docker ps
```

Si Docker ne répond pas, relancer Docker Desktop.

---

## 15.2 Un port est déjà utilisé

Exemple d’erreur :

```txt
port 3000 already in use
```

Solution :

- arrêter l’application qui utilise ce port ;
- ou modifier le port dans `.env`.

---

## 15.3 L’API ne répond pas

Vérifier :

```bash
docker compose ps
docker compose logs api
```

Tester :

```txt
http://localhost:3000/api/health
```

---

## 15.4 MongoDB ne répond pas

Vérifier les logs :

```bash
docker compose logs mongodb
```

Vérifier la variable :

```env
MONGODB_URI=mongodb://localhost:27017/connected-neighbours
```

---

## 15.5 Neo4j ne répond pas

Vérifier :

```txt
http://localhost:7474
```

Puis vérifier les identifiants dans `.env`.

---

## 15.6 MinIO ne répond pas

Ouvrir :

```txt
http://localhost:9001
```

Vérifier les variables :

```env
MINIO_ACCESS_KEY
MINIO_SECRET_KEY
MINIO_BUCKET
```

---

## 15.7 JavaFX ne se lance pas

Vérifier Java et Maven :

```bash
java --version
mvn --version
```

Puis relancer :

```bash
cd apps/admin-desktop
mvn clean test
mvn javafx:run
```

Si le JAR ne se lance pas :

```bash
java -jar connected-neighbours-admin-desktop.jar
```

Vérifier que le fichier existe et que la classe principale est correctement configurée.

---

## 15.8 Les données ne se synchronisent pas

Vérifier :

- que l’API est lancée ;
- que JavaFX peut joindre l’API ;
- que l’outbox contient des opérations ;
- que les endpoints `/api/sync/push` et `/api/sync/pull` répondent ;
- que les erreurs sont visibles dans l’historique de synchronisation.

---

# 16. Nettoyage et réinitialisation

## 16.1 Réinitialiser les dépendances Node

```bash
rm -rf node_modules
pnpm install
```

Sous Windows PowerShell :

```powershell
Remove-Item -Recurse -Force node_modules
pnpm install
```

---

## 16.2 Réinitialiser Docker

```bash
docker compose down -v
docker compose up -d
```

Attention : cette action supprime les données Docker locales.

---

## 16.3 Réinitialiser la base locale JavaFX

Selon la configuration, supprimer le fichier de base locale :

```txt
apps/admin-desktop/data/
```

ou le fichier H2/SQLite utilisé par l’application.

---

# 17. Limites connues

Certaines fonctionnalités peuvent être partielles selon l’état final du projet :

- SSO Keycloak complet ;
- MFA complet ;
- appels vidéo ;
- recommandations Neo4j avancées ;
- résolution manuelle avancée des conflits ;
- export RGPD ZIP ;
- désinstallation JavaFX depuis l’interface ;
- mise à jour automatique JavaFX.

Ces limites doivent être indiquées clairement dans la synthèse critique si elles ne sont pas totalement terminées.

---

# 18. Conclusion

Ce dossier utilisateur permet de lancer, tester et présenter Connected Neighbours.

Les parcours les plus importants à démontrer sont :

1. service payant complet ;
2. contrat et signature ;
3. points réservés puis transférés ;
4. litige ;
5. événements et votes ;
6. JavaFX offline-first ;
7. synchronisation ;
8. micro-langage MongoDB.

Le projet doit être présenté comme une plateforme complète de quartier, centrée sur la confiance, les échanges sécurisés et l’administration offline.
