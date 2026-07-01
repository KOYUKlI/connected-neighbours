# 04 — Synthèse critique finale — Connected Neighbours

## 1. Objectif du document

Ce document présente la synthèse critique du projet **Connected Neighbours**.

Il a pour objectif de prendre du recul sur :

- la démarche de réalisation ;
- les choix fonctionnels ;
- les choix techniques ;
- la répartition générale du travail ;
- les difficultés rencontrées ;
- les limites du projet ;
- les fonctionnalités finalisées ;
- les fonctionnalités partielles ;
- les améliorations possibles.

Cette synthèse permet de montrer que le projet n’a pas seulement été développé, mais aussi analysé de manière critique.

---

# 2. Rappel du projet

**Connected Neighbours** est une plateforme collaborative de quartier permettant aux habitants de s’entraider et d’interagir dans un cadre sécurisé.

Le projet couvre plusieurs domaines :

- services entre voisins ;
- contrats ;
- système de points ;
- documents et signatures PDF ;
- événements ;
- votes ;
- messagerie ;
- recommandations ;
- incidents et alertes ;
- application JavaFX offline-first ;
- synchronisation ;
- RGPD ;
- administration web ;
- conteneurisation.

Le projet est volontairement ambitieux, car il combine plusieurs types d’applications :

- API backend ;
- front web utilisateur ;
- back-office administrateur ;
- client lourd JavaFX ;
- bases de données multiples ;
- stockage de fichiers ;
- moteur de recommandations ;
- synchronisation offline.

---

# 3. Démarche de réalisation

## 3.1 Analyse du sujet

La première étape a consisté à analyser les exigences du sujet.

Les points les plus importants identifiés sont :

- la gestion géographique des quartiers ;
- les services gratuits ou payants ;
- le contrat obligatoire pour les services payants ;
- le système de points ;
- la signature de documents PDF ;
- les événements et recommandations ;
- la messagerie multimédia ;
- les votes paramétrables ;
- le client lourd JavaFX ;
- le fonctionnement offline-first ;
- la synchronisation automatique ;
- la sécurité avec SSO/MFA ;
- le RGPD ;
- MongoDB et Neo4j ;
- le micro-langage MongoDB ;
- la conteneurisation.

Cette analyse a montré que le projet ne devait pas être traité comme une simple application CRUD, mais comme une plateforme composée de plusieurs workflows métier.

---

## 3.2 Définition du périmètre fonctionnel

Le projet a ensuite été découpé en plusieurs modules :

- Authentification et rôles ;
- Utilisateurs ;
- Quartiers ;
- Services ;
- Candidatures ;
- Propositions ;
- Contrats ;
- Points ;
- Documents ;
- Stockage de fichiers ;
- Messagerie ;
- Notifications ;
- Événements ;
- Votes ;
- Incidents ;
- Alertes ;
- Litiges ;
- Modération ;
- Avis et réputation ;
- Recommandations Neo4j ;
- RGPD ;
- Synchronisation JavaFX ;
- Micro-langage MongoDB.

Le module central retenu est le module **services**, car il relie la plupart des autres fonctionnalités.

---

## 3.3 Approche par workflow

Une attention particulière a été portée au fait de ne pas construire uniquement des CRUD.

Par exemple, un service entre voisins ne se limite pas à :

```txt
création
acceptation
terminé
```

Le workflow complet comprend plutôt :

```txt
publication
candidature
négociation
sélection
contrat
signature
réservation des points
planification
réalisation
validation
transfert des points
avis
litige éventuel
```

Cette approche permet de rendre le projet plus réaliste et plus proche d’un vrai produit.

---

## 3.4 Construction progressive

La démarche retenue est progressive :

1. Construire le socle technique.
2. Développer l’API.
3. Mettre en place le front utilisateur.
4. Ajouter le back-office.
5. Développer la partie JavaFX.
6. Ajouter la synchronisation.
7. Brancher les bases spécialisées.
8. Documenter l’ensemble.
9. Préparer les scénarios de démonstration.
10. Stabiliser la livraison.

Cette méthode permet de sécuriser les fonctionnalités critiques avant d’ajouter les fonctionnalités secondaires.

---

# 4. Choix fonctionnels

## 4.1 Le service comme cœur du projet

Le choix principal est de placer le service entre voisins au centre du système.

Ce module relie :

- les utilisateurs ;
- les quartiers ;
- les candidatures ;
- la négociation ;
- les contrats ;
- les points ;
- les documents ;
- les signatures ;
- la messagerie ;
- les notifications ;
- les avis ;
- les litiges ;
- la modération ;
- les recommandations ;
- le RGPD.

Ce choix permet de démontrer une vraie cohérence fonctionnelle.

---

## 4.2 Ajout des candidatures

Au lieu de permettre une acceptation directe d’un service, le projet introduit un système de candidatures.

Ce choix est plus réaliste, car plusieurs voisins peuvent proposer leur aide.

Cela permet :

- de comparer les candidats ;
- de négocier ;
- de choisir le meilleur prestataire ;
- de refuser automatiquement les autres candidatures ;
- d’historiser les échanges.

---

## 4.3 Ajout de la négociation

La négociation permet aux deux parties d’ajuster :

- la date ;
- le prix ;
- la durée ;
- les conditions ;
- le lieu.

Ce choix améliore la logique métier, car dans un vrai contexte de quartier les conditions sont rarement figées dès le départ.

---

## 4.4 Contrat obligatoire pour les services payants

Les services payants nécessitent un contrat obligatoire.

Ce choix répond directement à l’exigence du sujet et permet :

- de formaliser l’accord ;
- de protéger les deux parties ;
- de justifier la réservation de points ;
- de créer une preuve ;
- de relier le contrat à un PDF signé ;
- de gérer les litiges.

---

## 4.5 Système de points robuste

Le système de points n’est pas traité comme un simple nombre dans le profil utilisateur.

Il distingue :

- points disponibles ;
- points réservés ;
- points gelés ;
- points gagnés ;
- points dépensés.

Chaque mouvement de points doit générer une transaction.

Ce choix permet de garantir une traçabilité complète.

---

## 4.6 Litiges et modération

Les litiges et la modération permettent de gérer les cas problématiques.

Ce choix est important, car une plateforme de confiance doit prévoir les conflits.

Un litige peut geler les points et impliquer un modérateur.

---

## 4.7 JavaFX offline-first

Le client JavaFX est orienté administration des incidents et alertes.

Le choix du offline-first permet de répondre à l’exigence du sujet : l’administrateur doit pouvoir continuer à consulter et créer des données même sans Internet.

---

# 5. Choix techniques

## 5.1 API Node.js avec NestJS/Fastify

Le sujet indique Node.js avec Express.

Le projet utilise Node.js avec NestJS et Fastify.

Ce choix reste dans l’écosystème Node.js, mais apporte une architecture plus robuste :

- modules ;
- contrôleurs ;
- services ;
- injection de dépendances ;
- DTO ;
- validation ;
- guards ;
- Swagger ;
- meilleure maintenabilité.

Fastify est utilisé comme moteur HTTP pour ses performances et son intégration avec NestJS.

---

## 5.2 Monolithe modulaire

Le backend est conçu comme un monolithe modulaire.

Ce choix est adapté au projet étudiant, car il évite la complexité d’une architecture microservices tout en conservant une séparation propre des domaines.

Avantages :

- plus simple à développer ;
- plus simple à tester ;
- plus simple à déployer ;
- meilleure cohérence métier ;
- architecture évolutive.

---

## 5.3 MongoDB

MongoDB est utilisé pour les données principales :

- utilisateurs ;
- services ;
- contrats ;
- documents ;
- messages ;
- votes ;
- événements ;
- incidents ;
- audit logs.

Ce choix est cohérent avec la nature documentaire du projet.

---

## 5.4 Neo4j

Neo4j est utilisé pour représenter les relations entre utilisateurs, services, événements et catégories.

Il sert au moteur de recommandations :

- voisins fiables ;
- événements pertinents ;
- services compatibles ;
- candidats recommandés.

---

## 5.5 MinIO

MinIO est prévu pour stocker les fichiers :

- PDF originaux ;
- PDF signés ;
- images ;
- vocaux ;
- pièces jointes ;
- preuves.

Ce choix évite de stocker les fichiers lourds directement dans MongoDB.

---

## 5.6 JavaFX avec base locale

L’application desktop utilise JavaFX avec une base locale H2 ou SQLite.

Ce choix permet :

- l’utilisation hors ligne ;
- la consultation des données déjà synchronisées ;
- l’ajout de données sans Internet ;
- la synchronisation au retour de connexion.

---

## 5.7 Docker

Docker est prévu pour lancer l’environnement complet.

Les services attendus sont :

- API ;
- web utilisateur ;
- back-office ;
- MongoDB ;
- Neo4j ;
- MinIO ;
- Keycloak.

Ce choix permet au jury de lancer le projet plus facilement.

---

# 6. Difficultés rencontrées ou anticipées

## 6.1 Ampleur du sujet

Le sujet est très large.

Il demande :

- une application web ;
- un back-office ;
- une API ;
- un client JavaFX ;
- plusieurs bases de données ;
- une synchronisation offline ;
- un micro-langage ;
- de la sécurité avancée ;
- de la conteneurisation ;
- des tests ;
- de la documentation.

La difficulté principale est donc de prioriser.

---

## 6.2 Cohérence entre modules

De nombreux modules sont liés entre eux.

Exemple :

```txt
service
candidature
contrat
points
documents
messagerie
litige
avis
```

Une modification dans un module peut avoir des conséquences sur les autres.

La difficulté est de maintenir une logique métier cohérente.

---

## 6.3 Synchronisation JavaFX/API

La synchronisation est l’un des points les plus complexes.

Elle doit gérer :

- l’offline ;
- les opérations locales ;
- l’outbox ;
- le push ;
- le pull ;
- les conflits ;
- l’idempotence ;
- l’historique.

Même une version simple demande une conception rigoureuse.

---

## 6.4 Signature PDF

La signature PDF implique plusieurs aspects :

- import du document ;
- placement des zones ;
- sécurité de la signature ;
- audit ;
- génération du document final ;
- archivage.

Cette fonctionnalité est plus complexe qu’un simple upload de fichier.

---

## 6.5 Sécurité et SSO/MFA

L’intégration complète de Keycloak, SSO et MFA demande du temps.

Elle doit couvrir :

- le web ;
- l’API ;
- JavaFX ;
- les actions sensibles.

Une version partielle peut être acceptable si elle est clairement documentée.

---

## 6.6 Micro-langage MongoDB

Le micro-langage demande :

- une grammaire ;
- un lexer ;
- un parser ;
- un AST ;
- une traduction vers MongoDB ;
- une validation de sécurité.

La difficulté est de produire un langage simple mais démontrable.

---

## 6.7 Déploiement

Le sujet impose que le projet soit déployé et conteneurisé.

Il faut donc s’assurer que :

- les services démarrent ;
- les variables d’environnement sont claires ;
- les ports ne se chevauchent pas ;
- la base est initialisable ;
- les données de test sont importables.

---

# 7. Fonctionnalités finalisées ou visées comme prioritaires

## 7.1 Priorité haute

Les fonctionnalités à finaliser en priorité sont :

- authentification et rôles ;
- services ;
- candidatures ;
- contrats ;
- points ;
- documents PDF V1 ;
- événements ;
- votes ;
- incidents JavaFX ;
- synchronisation JavaFX minimale ;
- back-office minimal ;
- RGPD export ;
- micro-langage simple ;
- Swagger ;
- Docker.

---

## 7.2 Parcours central à démontrer

Le parcours central doit être :

1. Un habitant crée une demande de service payante.
2. Un autre habitant candidate.
3. Le demandeur accepte la candidature.
4. Un contrat est généré.
5. Les points sont réservés.
6. Les deux parties signent.
7. Le service est réalisé.
8. Le demandeur valide.
9. Les points sont transférés.
10. Les parties peuvent laisser un avis.
11. La relation peut être mise à jour dans Neo4j.

Ce parcours montre la profondeur métier du projet.

---

# 8. Fonctionnalités partielles possibles

Certaines fonctionnalités peuvent rester partielles en fonction du temps disponible.

## 8.1 Keycloak / MFA

Une version locale JWT peut être utilisée pour le développement.

Keycloak et MFA peuvent être documentés ou partiellement intégrés.

## 8.2 Neo4j

Neo4j peut être utilisé pour des recommandations simples.

Les recommandations avancées peuvent rester en amélioration future.

## 8.3 MinIO

MinIO peut être limité aux documents PDF et pièces jointes principales.

## 8.4 Messagerie multimédia

Le texte peut être priorisé.

Les vocaux, images et appels vidéo peuvent être limités ou considérés comme bonus.

## 8.5 Résolution de conflits JavaFX

La résolution de conflits peut être simple en V1 :

```txt
dernière modification gagnante
journal d’audit
conflit visible pour l’admin
```

## 8.6 Micro-langage

Le micro-langage peut être limité aux requêtes de lecture sur quelques collections.

---

# 9. Limites du projet

## 9.1 Limites fonctionnelles

Le projet peut avoir les limites suivantes :

- messagerie multimédia partielle ;
- appels vidéo non implémentés ;
- système de réputation simplifié ;
- politiques d’annulation limitées ;
- litiges simples ;
- recommandations simples ;
- back-office limité aux écrans essentiels.

---

## 9.2 Limites techniques

Limites possibles :

- SSO/MFA incomplet ;
- Docker non optimisé production ;
- tests E2E limités ;
- synchronisation JavaFX simplifiée ;
- MinIO partiellement utilisé ;
- Neo4j utilisé uniquement sur certains scénarios ;
- micro-langage limité à des requêtes simples.

---

## 9.3 Limites organisationnelles

Le projet étant réalisé en groupe, certaines parties peuvent avancer séparément.

Risque principal :

- API et JavaFX développés sur des branches séparées ;
- intégration tardive ;
- endpoints de synchronisation non alignés ;
- documentation pas toujours synchronisée avec le code.

La solution est de définir clairement les contrats d’API et les responsabilités.

---

# 10. Analyse critique des choix

## 10.1 Choix du monolithe modulaire

Ce choix est pertinent pour un projet étudiant.

Il permet de garder une architecture simple tout en séparant les domaines.

Un microservice par module aurait été trop coûteux et difficile à maintenir.

---

## 10.2 Choix de NestJS/Fastify

Ce choix est techniquement solide.

Il s’écarte légèrement de l’indication Express du sujet, mais reste dans Node.js et fournit une meilleure structure pour un projet complexe.

La justification doit être clairement indiquée dans le dossier technique.

---

## 10.3 Choix d’un workflow service avancé

Ce choix ajoute de la complexité, mais rend le projet beaucoup plus crédible.

Il montre que l’équipe a réfléchi aux cas réels :

- plusieurs candidats ;
- négociation ;
- contrat ;
- preuves ;
- validation ;
- annulation ;
- litige.

---

## 10.4 Choix du offline-first JavaFX

Ce choix est imposé par le sujet et représente une vraie difficulté.

Il nécessite de penser différemment qu’une application connectée classique.

La synchronisation doit être conçue comme une fonctionnalité centrale, pas comme un ajout de fin de projet.

---

# 11. Améliorations futures

## 11.1 Fonctionnel

Améliorations possibles :

- application mobile ;
- géolocalisation en temps réel ;
- système de badges ;
- recommandations avancées ;
- scoring de réputation plus précis ;
- calendrier intégré ;
- rappels automatiques ;
- système de pénalités avancé ;
- appels vidéo ;
- modération assistée.

---

## 11.2 Technique

Améliorations possibles :

- intégration Keycloak complète ;
- MFA généralisé ;
- tests E2E complets ;
- CI/CD ;
- monitoring ;
- logs centralisés ;
- migrations de base ;
- versioning d’API ;
- meilleure gestion des conflits JavaFX ;
- meilleure séparation des environnements.

---

## 11.3 Expérience utilisateur

Améliorations possibles :

- interface plus guidée ;
- onboarding utilisateur ;
- tableau de bord personnalisé ;
- notifications configurables ;
- tutoriel de première utilisation ;
- meilleure accessibilité ;
- multilingue complet.

---

# 12. Bilan général

Connected Neighbours est un projet ambitieux qui combine plusieurs domaines techniques et fonctionnels.

Ses points forts sont :

- richesse fonctionnelle ;
- cohérence métier autour des services ;
- présence d’un système de points ;
- logique contractuelle ;
- gestion des signatures ;
- prise en compte de l’offline-first ;
- architecture modulaire ;
- utilisation de MongoDB et Neo4j ;
- possibilité d’extension ;
- documentation structurée.

Ses principaux risques sont :

- périmètre trop large ;
- intégration tardive ;
- synchronisation complexe ;
- sécurité avancée chronophage ;
- fonctionnalités multimédias coûteuses ;
- déploiement complet à stabiliser.

La stratégie recommandée est de prioriser un parcours complet et démontrable plutôt que de disperser les efforts sur trop de fonctionnalités superficielles.

---

# 13. Conclusion

La réalisation de Connected Neighbours doit être évaluée comme la construction d’une plateforme complète de quartier et non comme une simple application de services.

Le projet est pertinent s’il démontre :

- un parcours service complet ;
- un contrat signé ;
- une réservation et un transfert de points ;
- une gestion de litige ;
- une administration web ;
- une application JavaFX offline ;
- une synchronisation avec l’API ;
- une API documentée ;
- une prise en compte du RGPD ;
- une architecture conteneurisée.

Même si certaines fonctionnalités restent partielles, le projet peut être solide s’il est honnêtement documenté, cohérent dans ses choix et démontrable sur les parcours principaux.

L’objectif final est de montrer que l’équipe a conçu une plateforme réaliste, sécurisée et extensible, capable de répondre aux besoins d’un quartier connecté.
