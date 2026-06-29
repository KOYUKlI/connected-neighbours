# 05 — Répartition du travail finale — Connected Neighbours

## 1. Objectif du document

Ce document présente la répartition du travail au sein du projet **Connected Neighbours**.

Il a pour objectif de clarifier :

- les responsabilités principales de chaque membre ;
- les parties réalisées ;
- les parties en cours ;
- les parties restantes ;
- les dépendances entre les membres ;
- les points à finaliser avant la soutenance.

Cette version est rédigée pour être intégrée dans un dossier final.  
Elle ne détaille pas l’historique Git, les commits ou les pull requests.  
Elle présente uniquement une répartition claire et défendable devant le jury.

---

# 2. Organisation générale du projet

Connected Neighbours est composé de plusieurs parties :

- une API centrale ;
- une application web utilisateur ;
- un back-office administrateur ;
- une application JavaFX administrateur ;
- une base MongoDB ;
- une base Neo4j ;
- un système de stockage de fichiers ;
- une base locale pour JavaFX ;
- une synchronisation offline ;
- un micro-langage MongoDB ;
- une documentation complète ;
- une conteneurisation Docker.

Le projet étant large, il a été réparti par grands domaines fonctionnels et techniques.

---

# 3. Membres et rôles principaux

## 3.1 Noah Prisset

Noah est principalement intervenu sur :

- l’architecture globale du projet ;
- la documentation ;
- le backend API ;
- les modules métier principaux ;
- l’authentification ;
- le front web utilisateur V1 ;
- les contrats ;
- le système de points ;
- l’intégration générale du projet ;
- la préparation des documents finaux.

---

## 3.2 Baptiste Coquet

Baptiste est principalement intervenu sur :

- l’application JavaFX administrateur ;
- la gestion locale des incidents ;
- la gestion locale des alertes ;
- la gestion des reporters ;
- les statistiques locales ;
- les thèmes ;
- les plugins ;
- l’interface JavaFX ;
- les tests Java ;
- la base locale H2.

---

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

- Définition de l’architecture générale.
- Organisation du projet en plusieurs applications.
- Mise en place de la logique API + web + JavaFX.
- Choix d’une architecture backend modulaire.
- Rédaction de la documentation d’architecture.
- Structuration des livrables techniques.

### État actuel

```txt
Réalisé en grande partie.
```

### Reste à faire

- Mettre à jour le schéma d’architecture final.
- Aligner le schéma avec l’état réel du projet.
- Ajouter clairement la partie JavaFX intégrée.
- Ajouter la synchronisation dans le schéma final.
- Ajouter MinIO, Neo4j et Keycloak selon leur état réel.

---

## 4.2 Documentation projet

### Responsable principal

```txt
Noah Prisset
```

### Travail réalisé

- Descriptif fonctionnel.
- Présentation de l’infrastructure.
- Présentation des choix techniques.
- État d’avancement.
- Dossier fonctionnel final.
- Dossier technique final.
- Dossier utilisateur final.
- Synthèse critique.
- Répartition du travail.

### État actuel

```txt
Bien avancé.
```

### Reste à faire

- Relire les documents.
- Corriger les formulations trop ambitieuses si certaines fonctionnalités ne sont pas terminées.
- Ajouter des captures d’écran si nécessaire.
- Harmoniser les noms de dossiers et fichiers.
- Vérifier que la documentation correspond bien au code final.

---

## 4.3 API centrale

### Responsable principal

```txt
Noah Prisset
```

### Travail réalisé

L’API centrale est développée avec Node.js, NestJS et Fastify.

Les éléments suivants sont présents ou avancés :

- configuration API ;
- structure modulaire ;
- connexion MongoDB ;
- validation des variables d’environnement ;
- documentation Swagger ;
- authentification locale JWT ;
- rôles ;
- services ;
- contrats ;
- points ;
- quartiers ;
- événements ;
- votes ;
- documents ;
- messagerie REST ;
- export RGPD V1.

### État actuel

```txt
API V1 fonctionnelle sur plusieurs modules.
```

### Reste à faire

- Ajouter un vrai module de candidatures.
- Ajouter un module de propositions et contre-propositions.
- Améliorer le workflow services.
- Ajouter les litiges.
- Ajouter les avis et la réputation.
- Ajouter les notifications.
- Finaliser les documents PDF réels.
- Brancher MinIO réellement.
- Brancher Neo4j réellement.
- Ajouter le micro-langage MongoDB.
- Ajouter Keycloak / SSO / MFA ou documenter clairement la limite.
- Ajouter Socket.IO pour le temps réel.
- Ajouter suppression et anonymisation RGPD.
- Ajouter les endpoints de synchronisation JavaFX.
- Ajouter des tests d’intégration.
- Ajouter des tests E2E.

---

## 4.4 Authentification et rôles

### Responsable principal

```txt
Noah Prisset
```

### Travail réalisé

- Connexion utilisateur.
- JWT local.
- Utilisateurs de démonstration.
- Rôles.
- Protection des routes.
- Récupération de l’utilisateur connecté.

### État actuel

```txt
Fonctionnel en version locale.
```

### Reste à faire

- Intégrer Keycloak si le temps le permet.
- Ajouter le SSO.
- Ajouter MFA/TOTP.
- Sécuriser les actions sensibles.
- Documenter clairement si la version finale reste en JWT local.

---

## 4.5 Services entre voisins

### Responsable principal

```txt
Noah Prisset
```

### Travail réalisé

- Création de services.
- Liste des services.
- Types offre/demande.
- Services gratuits ou payants.
- Début de liaison avec contrats et points.
- Interface web simple pour créer et consulter les services.

### État actuel

```txt
Service V1 réalisé.
```

### Reste à faire

Le module doit être enrichi pour éviter une logique trop simple.

À ajouter :

- candidatures ;
- présélection ;
- négociation ;
- propositions ;
- contre-propositions ;
- acceptation propre d’un candidat ;
- annulation ;
- litiges ;
- preuves de réalisation ;
- avis après service ;
- historique des changements ;
- notifications liées au service.

---

## 4.6 Contrats

### Responsable principal

```txt
Noah Prisset
```

### Travail réalisé

- Création de contrats.
- Liaison contrat/service.
- Signature simple.
- Statuts de contrat.
- Affichage dans le front utilisateur.

### État actuel

```txt
Contrats V1 réalisés.
```

### Reste à faire

- Génération de contrat depuis une candidature acceptée.
- Double signature plus robuste.
- Liaison complète avec document PDF.
- Audit complet des signatures.
- Avenants.
- Expiration de contrat.
- Annulation propre.
- Litige lié au contrat.
- Verrouillage des conditions après signature.

---

## 4.7 Système de points

### Responsable principal

```txt
Noah Prisset
```

### Travail réalisé

- Solde utilisateur.
- Points réservés.
- Transactions.
- Liaison avec les contrats.
- Affichage des mouvements de points.

### État actuel

```txt
Points V1 réalisés.
```

### Reste à faire

- Gestion avancée des points gelés.
- Gel automatique en cas de litige.
- Remboursement.
- Pénalités.
- Correction par administrateur.
- Transactions inverses.
- Historique plus détaillé.
- Tests d’intégrité sur les transactions.

---

## 4.8 Front web utilisateur

### Responsable principal

```txt
Noah Prisset
```

### Travail réalisé

- Écran de connexion.
- Contexte d’authentification.
- Écran services.
- Formulaire de création de service.
- Affichage des services.
- Acceptation simple d’un service.
- Affichage des contrats.
- Signature simple.
- Clôture simple.
- Affichage des transactions de points.

### État actuel

```txt
Front utilisateur V1 réalisé.
```

### Reste à faire

- Ajouter une vraie navigation.
- Ajouter un dashboard.
- Ajouter pages candidatures.
- Ajouter pages propositions.
- Ajouter pages contrats détaillées.
- Ajouter documents.
- Ajouter événements.
- Ajouter votes.
- Ajouter messagerie.
- Ajouter notifications.
- Ajouter profil.
- Ajouter RGPD.
- Améliorer l’interface visuelle.
- Gérer les erreurs proprement.
- Ajouter les scénarios de démonstration complets.

---

## 4.9 Back-office administrateur

### Responsable principal

```txt
Noah Prisset / équipe web
```

### Travail réalisé

- Structure projet présente.

### État actuel

```txt
Très peu avancé.
```

### Reste à faire

Le back-office doit encore être réellement développé.

À faire :

- remplacer le template Vite ;
- créer un layout administrateur ;
- ajouter une sidebar ;
- ajouter un dashboard ;
- gérer les utilisateurs ;
- gérer les quartiers ;
- consulter les services ;
- consulter les contrats ;
- traiter les litiges ;
- traiter les signalements ;
- consulter les incidents ;
- consulter les statistiques ;
- afficher l’état de synchronisation JavaFX ;
- brancher les données API.

---

## 4.10 Application JavaFX administrateur

### Responsable principal

```txt
Baptiste Coquet
```

### Travail réalisé

L’application JavaFX administrateur contient déjà une vraie base de travail.

Parties réalisées :

- structure JavaFX ;
- lancement via application Java/Spring ;
- base locale H2 ;
- domaine incidents ;
- domaine alertes ;
- domaine reporters ;
- statistiques locales ;
- gestion des thèmes ;
- système de plugins ;
- interface principale ;
- tableau des incidents ;
- vue alertes ;
- widgets d’alerte ;
- affichage des reporters ;
- tests Java.

### État actuel

```txt
Partie JavaFX bien avancée côté local.
```

### Limite importante

La partie JavaFX existe, mais elle n’est pas encore complètement reliée à l’API centrale.

Elle fonctionne surtout comme une application locale autour des incidents, alertes, reporters, statistiques, thèmes et plugins.

---

# 5. Ce qui reste à faire côté JavaFX

Cette section concerne principalement le travail restant pour Baptiste.

## 5.1 Corriger et fiabiliser le lancement

### Responsable

```txt
Baptiste Coquet
```

### À faire

- Vérifier que l’application se lance avec une commande simple.
- Corriger la classe principale si nécessaire.
- Vérifier le point d’entrée réel de l’application.
- Fournir une commande claire dans le dossier utilisateur.
- Tester sur une machine propre.

### Objectif

Le jury doit pouvoir lancer l’application JavaFX sans correction manuelle.

---

## 5.2 Générer un JAR auto-exécutable

### Responsable

```txt
Baptiste Coquet
```

### À faire

- Configurer Maven pour produire un JAR utilisable.
- Vérifier que le JAR embarque les ressources nécessaires.
- Tester la commande :

```bash
java -jar connected-neighbours-admin-desktop.jar
```

- Documenter la procédure.

### Objectif

Fournir un livrable Java conforme aux attentes finales.

---

## 5.3 Stabiliser la base locale

### Responsable

```txt
Baptiste Coquet
```

### À faire

- Éviter que la base locale soit recréée à chaque lancement.
- Conserver les données après redémarrage.
- Mettre en place une stratégie propre de création ou mise à jour du schéma.
- Retirer les fichiers de base locale du dépôt si nécessaire.
- Ajouter ces fichiers dans `.gitignore`.

### Objectif

Respecter le principe offline-first.

Une application offline-first doit conserver les données locales.

---

## 5.4 Ajouter une vraie outbox locale

### Responsable

```txt
Baptiste Coquet
```

### À faire

Créer une file d’attente locale pour les actions réalisées hors ligne.

Une opération offline doit contenir :

```txt
operationId
entityType
entityId
operationType
payload
createdAt
status
retryCount
lastError
```

### Objectif

Permettre à JavaFX de stocker les actions à synchroniser plus tard.

---

## 5.5 Ajouter un état de synchronisation local

### Responsable

```txt
Baptiste Coquet
```

### À faire

Créer une table ou entité locale permettant de stocker :

```txt
clientId
lastSyncAt
lastSuccessfulSyncAt
lastError
syncStatus
```

### Objectif

Savoir si l’application est synchronisée, en erreur ou en attente.

---

## 5.6 Ajouter la gestion des conflits

### Responsable

```txt
Baptiste Coquet
```

### À faire

Créer une gestion locale des conflits.

Un conflit peut arriver si :

- un incident est modifié localement et côté serveur ;
- une alerte est modifiée localement et côté serveur ;
- une donnée supprimée côté serveur est modifiée localement.

L’interface doit permettre de choisir :

- garder la version serveur ;
- garder la version locale ;
- résoudre manuellement.

### Objectif

Avoir une synchronisation crédible et défendable.

---

## 5.7 Ajouter le client API JavaFX

### Responsable

```txt
Baptiste Coquet
```

### À faire

- Créer un client HTTP.
- Configurer l’URL de l’API.
- Vérifier la disponibilité de l’API.
- Envoyer les opérations locales.
- Récupérer les changements serveur.
- Gérer les erreurs réseau.
- Gérer les réponses d’erreur de l’API.

### Dépendance

```txt
Noah doit fournir les endpoints de synchronisation côté API.
```

---

## 5.8 Implémenter la synchronisation push/pull

### Responsable

```txt
Baptiste Coquet
```

### À faire côté JavaFX

- Envoyer les opérations en attente vers l’API.
- Marquer les opérations réussies.
- Garder les opérations échouées.
- Récupérer les changements serveur.
- Appliquer les changements localement.
- Mettre à jour la date de dernière synchronisation.
- Afficher le résultat de synchronisation.

### Objectif

Pouvoir démontrer le scénario suivant :

```txt
création incident hors ligne
stockage local
retour connexion
synchronisation
incident visible côté API / admin web
```

---

## 5.9 Éviter les modifications automatiques à l’affichage

### Responsable

```txt
Baptiste Coquet
```

### Problème à corriger

L’affichage d’une liste d’incidents ne doit pas modifier automatiquement leur statut.

### À faire

- Charger les incidents sans modifier leur état.
- Déplacer les changements de statut dans des boutons explicites.
- Éviter toute mutation dans une simple méthode d’affichage.
- Ajouter un test ou une vérification manuelle.

### Objectif

Éviter qu’une simple consultation change les données.

---

## 5.10 Nettoyer les logs et données de test

### Responsable

```txt
Baptiste Coquet
```

### À faire

- Retirer les logs de debug inutiles.
- Nettoyer les affichages console.
- Vérifier les données initialisées automatiquement.
- Garder uniquement les données utiles à la démonstration.

---

# 6. Ce qui reste à faire côté Noah

## 6.1 Endpoints API de synchronisation

### Responsable

```txt
Noah Prisset
```

### À faire

Créer les routes suivantes :

```txt
POST /api/sync/push
GET  /api/sync/pull?since=...
GET  /api/sync/status
POST /api/sync/conflicts/:id/resolve
```

### Objectif

Permettre à JavaFX de synchroniser incidents et alertes avec l’API centrale.

---

## 6.2 Contrat de synchronisation

### Responsable

```txt
Noah Prisset + Baptiste Coquet
```

### À définir

- format des incidents ;
- format des alertes ;
- format des opérations ;
- format des conflits ;
- format des erreurs ;
- stratégie de résolution ;
- fonctionnement de `lastSyncAt` ;
- fonctionnement de `operationId`.

---

## 6.3 Back-office administrateur

### Responsable

```txt
Noah Prisset / équipe web
```

### À faire

- Créer une vraie interface admin.
- Afficher les incidents synchronisés.
- Afficher les utilisateurs.
- Afficher les services.
- Afficher les contrats.
- Afficher les litiges.
- Afficher les statistiques.
- Afficher l’état de synchronisation JavaFX.

---

## 6.4 Docker Compose complet

### Responsable

```txt
Noah Prisset
```

### À faire

Ajouter dans Docker Compose :

- API ;
- web utilisateur ;
- admin web ;
- MongoDB ;
- Neo4j ;
- MinIO ;
- Keycloak.

---

## 6.5 Fonctionnalités techniques restantes

### Responsable

```txt
Noah Prisset / équipe backend
```

### À faire

- brancher Neo4j réellement ;
- brancher MinIO réellement ;
- ajouter le micro-langage MongoDB ;
- ajouter Keycloak / SSO / MFA si possible ;
- ajouter Socket.IO ;
- ajouter tests d’intégration ;
- ajouter tests E2E.

---

# 7. Travail commun restant

## 7.1 Scénario offline complet

### Responsables

```txt
Noah Prisset
Baptiste Coquet
```

### Scénario à réussir

```txt
1. Lancer JavaFX.
2. Couper la connexion.
3. Créer un incident.
4. Vérifier que l’incident est stocké localement.
5. Rétablir la connexion.
6. Lancer la synchronisation.
7. Envoyer l’incident à l’API.
8. Afficher l’incident dans le back-office.
```

---

## 7.2 Scénario de démonstration final

### Responsables

```txt
Toute l’équipe
```

### Scénario recommandé

```txt
1. Connexion utilisateur.
2. Création d’un service payant.
3. Candidature d’un voisin.
4. Acceptation.
5. Génération du contrat.
6. Signature.
7. Réservation de points.
8. Validation du service.
9. Transfert des points.
10. Consultation admin.
11. Création d’un incident JavaFX hors ligne.
12. Synchronisation.
13. Incident visible côté admin.
```

---

# 8. Tableau récapitulatif

| Domaine | Responsable principal | État actuel | Reste à faire |
|---|---|---|---|
| Documentation | Noah | Bien avancé | Relire et harmoniser |
| Architecture | Noah | Bien avancé | Schéma final |
| API | Noah | V1 avancée | Modules avancés |
| Auth JWT | Noah | Fait | Keycloak/MFA |
| Services | Noah | V1 fait | Candidatures/propositions |
| Contrats | Noah | V1 fait | Workflow complet |
| Points | Noah | V1 fait | Litiges/gel/remboursement |
| Front utilisateur | Noah | V1 fait | Pages manquantes |
| Back-office | Noah / équipe | Peu avancé | Dashboard + modules admin |
| Docker | Noah | MongoDB seulement | Compose complet |
| Neo4j | Noah / équipe | Non branché | Intégration réelle |
| MinIO | Noah / équipe | Non branché | Upload/download réel |
| Micro-langage | Noah / équipe | Non fait | Parser + API |
| JavaFX incidents | Baptiste | Avancé | Stabilisation |
| JavaFX alertes | Baptiste | Avancé | Stabilisation |
| JavaFX reporters | Baptiste | Avancé | Vérification UI |
| JavaFX statistiques | Baptiste | Avancé | Vérification UI |
| JavaFX thèmes | Baptiste | Présent | Vérifier usage |
| JavaFX plugins | Baptiste | Présent | Vérifier usage |
| JavaFX base locale | Baptiste | Présente | Stabiliser persistance |
| JavaFX JAR | Baptiste | À vérifier | JAR final |
| JavaFX sync | Noah + Baptiste | Non terminé | Outbox + push/pull |
| Conflits sync | Noah + Baptiste | Non terminé | Résolution |
| Tests API | Noah | Partiels | Intégration/E2E |
| Tests Java | Baptiste | Présents | Vérifier build final |

---

# 9. Présentation recommandée en soutenance

## 9.1 Présentation de Noah

Noah peut présenter :

- architecture globale ;
- API centrale ;
- modules backend ;
- authentification ;
- services ;
- contrats ;
- points ;
- front utilisateur V1 ;
- documentation ;
- limites et choix techniques.

Phrase possible :

```txt
Je me suis principalement occupé de l’architecture globale, de l’API centrale, du front utilisateur V1, de la logique services/contrats/points et de la documentation finale.
```

---

## 9.2 Présentation de Baptiste

Baptiste peut présenter :

- client JavaFX ;
- incidents ;
- alertes ;
- reporters ;
- statistiques ;
- base locale ;
- thèmes ;
- plugins ;
- interface desktop ;
- travail restant sur la synchronisation.

Phrase possible :

```txt
Je me suis principalement occupé du client lourd JavaFX, avec la gestion locale des incidents, alertes, reporters, statistiques, thèmes et plugins. La partie restante concerne surtout l’intégration complète de la synchronisation avec l’API.
```

---

## 9.3 Présentation commune

La synchronisation doit être présentée comme une partie transversale :

```txt
L’API fournit les endpoints.
JavaFX stocke les actions localement.
La synchronisation envoie les actions locales au serveur.
Le serveur renvoie les changements récents.
Les conflits sont détectés et résolus.
```

---

# 10. Conclusion

La répartition réelle du travail peut être résumée ainsi :

```txt
Noah :
architecture, documentation, API, authentification, services, contrats, points, front utilisateur V1, intégration générale.

Baptiste :
JavaFX, incidents, alertes, reporters, statistiques, thèmes, plugins, interface desktop, tests Java.

Commun :
synchronisation JavaFX/API, scénario offline, intégration finale.
```

Le point le plus important à finaliser côté JavaFX est :

```txt
la synchronisation offline-first réelle avec l’API centrale.
```

Le point le plus important à finaliser côté API/web est :

```txt
les endpoints de synchronisation, le back-office admin et le Docker Compose complet.
```

Cette répartition est claire, équilibrée et présentable devant le jury.
