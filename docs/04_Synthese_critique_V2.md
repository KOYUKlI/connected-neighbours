# 04 — Synthèse critique V2 — Connected Neighbours

## 1. Objectif du document

Ce document présente une synthèse critique actualisée du projet **Connected Neighbours**.

Cette version ne cherche pas à présenter le projet comme totalement terminé. Elle sert à prendre du recul sur l’état réel de la réalisation, à identifier les choix qui ont été faits, les éléments solides, les limites actuelles et les priorités restantes avant soutenance.

L’objectif est de montrer que le projet a été analysé de manière lucide : certaines parties sont fonctionnelles et démontrables, tandis que d’autres restent partielles ou prévues en évolution.

---

## 2. Rappel du projet

Connected Neighbours est une plateforme collaborative de quartier permettant aux habitants de s’entraider, d’échanger des services, de gérer des contrats, de participer à la vie locale et de signaler des incidents.

Le sujet officiel demande une plateforme large comprenant notamment :

- des quartiers géographiques ;
- des services entre voisins ;
- un système de points ;
- des contrats et documents signés ;
- des événements ;
- des votes ;
- une messagerie multimédia ;
- une application JavaFX offline-first ;
- une synchronisation entre JavaFX et l’API ;
- MongoDB et Neo4j ;
- un micro-langage de manipulation MongoDB ;
- des exigences RGPD ;
- une sécurité avancée avec SSO et MFA ;
- une conteneurisation.

Le périmètre est donc très ambitieux pour un projet annuel. La difficulté principale a été de construire un socle démontrable sans disperser les efforts sur trop de fonctionnalités incomplètes.

---

## 3. État global du projet

## 3.1 État actuellement réalisé

La version actuelle du projet possède un socle fonctionnel autour du parcours central suivant :

```txt
connexion utilisateur
→ création d’un service
→ publication du service
→ candidature d’un voisin
→ acceptation de la candidature
→ génération d’un contrat
→ réservation des points
→ signature par les deux parties
→ complétion du contrat
→ transfert des points
→ export RGPD
```

Les parties suivantes sont aujourd’hui réalisées ou fortement avancées :

- API NestJS/Fastify structurée en modules ;
- authentification JWT locale ;
- rôles principaux `resident`, `moderator`, `admin` ;
- services entre voisins ;
- candidatures ;
- contrats générés depuis une candidature acceptée ;
- réservation, transfert et libération de points ;
- incidents et alertes côté API ;
- endpoints de synchronisation JavaFX/API côté serveur ;
- micro-langage MongoDB avec Jison ;
- export RGPD enrichi ;
- back-office React connecté à l’API ;
- web utilisateur React connecté au workflow principal ;
- Docker Compose avec API, web, admin-web et MongoDB ;
- tests unitaires API ;
- tests E2E API sur le parcours principal.

---

## 3.2 Parties partielles

Certaines parties existent mais ne couvrent pas encore l’ensemble des exigences attendues :

| Domaine | État actuel | Limite principale |
|---|---|---|
| Quartiers | CRUD API présent | pas encore de dessin cartographique Leaflet ni contrôle géographique avancé |
| Documents | module API existant | pas de vrai stockage MinIO ni génération PDF signé complète |
| Événements | API présente | interface web et recommandations limitées |
| Votes | API présente | interface web et paramétrage avancé limités |
| Messagerie | API REST présente | pas de vraie interface complète, pas de Socket.IO, pas de multimédia |
| JavaFX | application locale existante | synchronisation client à finaliser côté JavaFX |
| Admin web | dashboard et tables connectés | peu d’actions avancées de modération ou gestion |
| RGPD | export présent | anonymisation, suppression et demandes RGPD non finalisées |
| Docker | stack P0 fonctionnelle | Neo4j, MinIO, Keycloak non inclus dans la stack active |

---

## 3.3 Parties non finalisées

Les éléments suivants ne sont pas encore réellement intégrés dans la version actuelle :

- Keycloak ;
- SSO entre web et JavaFX ;
- MFA/TOTP ;
- Neo4j utilisé comme vrai moteur de recommandations ;
- MinIO utilisé pour les fichiers ;
- Socket.IO pour la messagerie temps réel ;
- messagerie multimédia ;
- notifications ;
- litiges complets ;
- avis et réputation ;
- modération complète ;
- propositions et négociation versionnée ;
- carte géographique avec dessin de quartier ;
- interface DSL côté front ou admin ;
- export RGPD ZIP ;
- tests automatisés front ;
- intégration JavaFX complète avec push/pull côté client.

---

## 4. Analyse de la démarche

## 4.1 Priorisation du parcours central

Le sujet étant très large, le projet a été recentré sur un parcours métier fort : le service payant entre voisins.

Ce choix est pertinent, car ce parcours relie plusieurs éléments importants du sujet :

- utilisateurs ;
- services ;
- candidatures ;
- contrats ;
- signatures simples ;
- points ;
- transactions ;
- RGPD ;
- administration ;
- tests E2E.

L’avantage de cette approche est d’avoir une démonstration cohérente plutôt qu’une accumulation de CRUD isolés.

La limite est que certains modules demandés par le sujet restent secondaires ou partiels : événements, votes, messagerie, documents PDF avancés, recommandations Neo4j et sécurité SSO/MFA.

---

## 4.2 Approche par lots

Le développement a été structuré progressivement :

1. stabilisation de l’API ;
2. ajout des candidatures ;
3. refonte du workflow contrat/points ;
4. ajout des incidents et alertes ;
5. ajout de la synchronisation côté API ;
6. ajout du micro-langage Jison ;
7. ajout des endpoints admin ;
8. ajout des tests E2E ;
9. connexion du back-office ;
10. connexion du web utilisateur ;
11. conteneurisation.

Cette méthode a permis de garder des commits séparés, de valider régulièrement les tests et d’éviter une refonte trop massive en une seule fois.

---

## 4.3 Limite de l’approche

La limite principale est que l’avancement s’est concentré sur les parties API/web/admin/Docker, tandis que certaines fonctionnalités transverses restent incomplètes.

Cela crée une différence entre :

- la **plateforme actuellement démontrable** ;
- la **plateforme complète attendue par le sujet**.

La soutenance devra donc être claire sur cette distinction.

---

## 5. Analyse critique des choix fonctionnels

## 5.1 Services et candidatures

L’ajout des candidatures est un point fort du projet. Il évite une logique trop simpliste où un voisin accepte directement un service.

La version actuelle permet :

- de publier un service ;
- de candidater ;
- d’accepter ou refuser une candidature ;
- de générer un contrat depuis une candidature acceptée.

Ce choix rend le projet plus réaliste.

Limite actuelle : la négociation avancée et les contre-propositions versionnées ne sont pas encore implémentées.

---

## 5.2 Contrats et points

Le workflow contrats/points est l’un des éléments les plus solides de la version actuelle.

Le projet gère :

- la création d’un contrat depuis une candidature acceptée ;
- la réservation des points ;
- la double signature ;
- l’activation du contrat ;
- la complétion ;
- le transfert des points ;
- l’annulation avec libération des points.

Limites :

- pas encore de vrai PDF contractuel final ;
- pas d’avenants ;
- pas de gel de points en cas de litige ;
- pas de politique d’annulation avancée ;
- pas de journal d’audit complet pour toutes les transitions.

---

## 5.3 Incidents et synchronisation

Côté API, les modules incidents, alertes et sync constituent une bonne base.

L’API peut recevoir des opérations synchronisées, éviter les doublons avec `operationId`, exposer un historique et permettre un pull des changements.

Limite majeure : la partie JavaFX doit encore envoyer et récupérer réellement ces données côté client. L’API est prête, mais l’intégration complète dépend de l’application JavaFX.

---

## 5.4 RGPD

L’export RGPD est présent et inclut maintenant plusieurs sections importantes :

- profil utilisateur ;
- services ;
- candidatures ;
- contrats ;
- transactions de points ;
- incidents ;
- alertes ;
- opérations de synchronisation rattachables ;
- documents.

L’export est lisible et évite d’exposer le `passwordHash`.

Limites :

- pas encore de demande de suppression ;
- pas encore d’anonymisation ;
- pas encore d’historique de demandes RGPD ;
- pas d’export ZIP.

---

## 5.5 Back-office et web utilisateur

Le web utilisateur et le back-office ont été connectés à l’API réelle.

C’est une amélioration importante, car le projet n’est plus seulement testable via Swagger : il possède une démonstration visuelle.

Limites :

- interfaces encore orientées démonstration ;
- peu d’actions admin avancées ;
- pas de pages complètes pour événements, votes, messagerie, documents, litiges ;
- pas de tests automatisés front.

---

## 6. Analyse critique des choix techniques

## 6.1 NestJS/Fastify au lieu d’Express

Le sujet impose Node.js avec Express. Le projet utilise Node.js, NestJS et Fastify.

Ce choix est un écart par rapport à l’énoncé strict, mais il se justifie techniquement :

- structure modulaire ;
- injection de dépendances ;
- validation DTO ;
- documentation Swagger intégrée ;
- meilleure maintenabilité ;
- architecture adaptée à un projet large.

La limite est qu’il faut être capable de justifier ce choix devant le jury.

---

## 6.2 MongoDB et Mongoose

MongoDB est utilisé comme base principale. Ce choix est cohérent avec la nature documentaire du sujet.

Mongoose permet de structurer les collections principales et de valider les données côté application.

Limites :

- relations souvent stockées sous forme d’identifiants texte ;
- peu de transactions Mongo multi-documents ;
- risques d’incohérence si plusieurs opérations liées échouent partiellement ;
- absence d’un vrai système d’audit transversal.

Les tests E2E réduisent ce risque pour le parcours principal, mais une version plus robuste devrait renforcer l’atomicité.

---

## 6.3 Docker

Docker Compose permet maintenant de lancer :

- MongoDB ;
- API ;
- web utilisateur ;
- admin-web.

C’est suffisant pour démontrer la version actuelle.

Limites :

- Neo4j n’est pas lancé dans la stack active ;
- MinIO n’est pas lancé ;
- Keycloak n’est pas lancé ;
- Docker n’est pas optimisé pour un déploiement production complet ;
- l’application JavaFX n’est pas conteneurisée, ce qui est normal pour un client lourd.

---

## 6.4 DSL Jison

Le micro-langage MongoDB est un point fort technique.

Il utilise une grammaire Jison, génère un AST, valide les collections et champs autorisés, puis traduit la requête vers un filtre Mongoose sécurisé.

Limites :

- langage limité à des requêtes de lecture ;
- peu d’opérateurs ;
- pas d’interface graphique dédiée ;
- pas d’usage avancé côté administration.

Cette limite est acceptable, car un DSL trop puissant serait plus risqué en sécurité.

---

## 6.5 Sécurité

La version actuelle utilise JWT local, rôles et guards.

C’est suffisant pour une démonstration, mais incomplet par rapport au sujet.

Limites principales :

- pas de Keycloak ;
- pas de SSO ;
- pas de MFA ;
- pas de refresh token robuste ;
- pas de gestion avancée des sessions ;
- pas d’audit complet des actions sensibles ;
- secrets encore simples pour l’environnement local/Docker.

---

## 7. Tests et qualité

## 7.1 Points forts

La qualité du backend est renforcée par :

- tests unitaires sur les services principaux ;
- test E2E du parcours complet ;
- build API validé ;
- build web validé ;
- build admin-web validé ;
- Docker Compose validé.

Le test E2E couvre notamment :

- authentification ;
- service ;
- candidature ;
- contrat ;
- points ;
- incidents ;
- alertes ;
- sync API ;
- DSL Jison ;
- admin endpoints ;
- RGPD.

---

## 7.2 Limites des tests

Les tests restent incomplets sur plusieurs aspects :

- pas de tests automatisés du front utilisateur ;
- pas de tests automatisés du back-office React ;
- tests JavaFX à vérifier côté application desktop ;
- pas de tests d’intégration Neo4j ;
- pas de tests MinIO ;
- pas de tests Keycloak ;
- pas de tests de charge ;
- peu de tests sur les cas d’erreur extrêmes.

---

## 8. Difficultés principales

## 8.1 Périmètre très large

Le projet couvre beaucoup de domaines. La difficulté principale a été de choisir quoi finaliser en priorité.

Il aurait été risqué de commencer toutes les fonctionnalités sans en terminer aucune.

La stratégie retenue a été de consolider un parcours central démontrable.

---

## 8.2 Synchronisation offline

La synchronisation JavaFX/API est complexe, car elle implique :

- base locale ;
- opérations hors ligne ;
- idempotence ;
- push ;
- pull ;
- erreurs réseau ;
- conflits ;
- état de synchronisation.

L’API fournit maintenant les endpoints nécessaires, mais le client JavaFX doit encore finaliser son intégration.

---

## 8.3 Écart entre cible et version livrée

Le projet a une cible très ambitieuse : plateforme complète, recommandations, fichiers, signatures PDF, sécurité SSO/MFA, temps réel, JavaFX offline.

La version actuelle est une base solide, mais elle ne couvre pas toute la cible.

C’est une difficulté normale, mais elle doit être assumée clairement.

---

## 8.4 Documentation à maintenir

Une difficulté importante a été de garder la documentation alignée avec le code.

Les premières versions de documents décrivaient souvent la cible complète. La V2 des documents doit donc distinguer l’état réel du projet, les fonctionnalités partielles et les évolutions prévues.

---

## 9. Fonctionnalités finalisées, partielles et manquantes

## 9.1 Fonctionnalités finalisées ou démontrables

| Fonctionnalité | État |
|---|---|
| Authentification locale JWT | Réalisé |
| Rôles principaux | Réalisé |
| Services | Réalisé pour le parcours principal |
| Candidatures | Réalisé |
| Contrats depuis candidature | Réalisé |
| Double signature simple | Réalisé |
| Points réservation/transfert/libération | Réalisé |
| Incidents API | Réalisé |
| Alertes API | Réalisé |
| Sync API JavaFX | Réalisé côté serveur |
| DSL MongoDB Jison | Réalisé |
| RGPD export | Réalisé |
| Admin-web connecté | Réalisé |
| Web utilisateur connecté | Réalisé |
| Docker P0 | Réalisé |
| Tests unitaires API | Réalisé |
| Test E2E API | Réalisé |

---

## 9.2 Fonctionnalités partielles

| Fonctionnalité | Limite |
|---|---|
| Quartiers | pas de dessin cartographique |
| Documents | pas de PDF signé réel complet |
| Événements | API présente mais UI limitée |
| Votes | API présente mais UI limitée |
| Messagerie | API REST basique, pas de temps réel |
| JavaFX | partie locale avancée, sync client à finaliser |
| Back-office | consultation surtout, peu d’actions avancées |
| RGPD | export présent, suppression/anonymisation absentes |
| Docker | stack P0, sans Neo4j/MinIO/Keycloak |

---

## 9.3 Fonctionnalités manquantes ou à venir

- propositions et contre-propositions ;
- litiges complets ;
- avis et réputation ;
- modération et signalements ;
- notifications ;
- MinIO ;
- Neo4j ;
- Keycloak ;
- MFA ;
- Socket.IO ;
- i18n ;
- carte Leaflet ;
- workflows PDF complets ;
- synchronisation JavaFX côté client complète.

---

## 10. Risques pour la soutenance

## 10.1 Risques fonctionnels

Les principaux risques sont :

- le jury peut demander des fonctionnalités du sujet non finalisées ;
- JavaFX peut être considéré comme trop séparé si la synchronisation client n’est pas démontrable ;
- les documents PDF et signatures peuvent être jugés trop légers ;
- Neo4j et MinIO peuvent être attendus si annoncés comme réalisés ;
- la messagerie, les événements et les votes peuvent sembler secondaires.

---

## 10.2 Risques techniques

- absence de SSO/MFA réel ;
- absence de Neo4j actif ;
- absence de MinIO actif ;
- workflows partiels sur litiges et documents ;
- sécurité adaptée à une démo mais pas à une production ;
- peu de tests front ;
- dépendance à MongoDB local/Docker pour les E2E.

---

## 10.3 Réduction des risques

Pour réduire ces risques, il faut :

1. présenter clairement ce qui est réellement terminé ;
2. éviter de dire que Neo4j, MinIO, Keycloak ou MFA sont finalisés ;
3. démontrer le parcours service complet ;
4. démontrer Docker ;
5. démontrer Swagger ;
6. démontrer le DSL Jison ;
7. démontrer l’export RGPD ;
8. si possible, démontrer au moins une synchronisation JavaFX simple.

---

## 11. Priorités restantes

## 11.1 Priorité P0

À finaliser en priorité avant soutenance :

- stabiliser la partie JavaFX ;
- finaliser la synchronisation JavaFX côté client ;
- vérifier le JAR JavaFX ;
- s’assurer que Docker fonctionne sur une machine propre ;
- nettoyer les données de démonstration ;
- vérifier Swagger ;
- aligner les documents finaux avec le code réel.

---

## 11.2 Priorité P1

À faire si le temps le permet :

- page événements côté web ;
- page votes côté web ;
- messagerie web simple ;
- documents PDF V1 plus concrets ;
- MinIO minimal ;
- Neo4j minimal pour recommandations ;
- page admin quartiers ;
- litiges simples ;
- avis simples.

---

## 11.3 Priorité P2

Évolutions plus avancées :

- Keycloak ;
- MFA ;
- Socket.IO ;
- i18n ;
- recommandations avancées ;
- export RGPD ZIP ;
- modération avancée ;
- CI/CD ;
- monitoring ;
- application mobile.

---

## 12. Bilan critique

Le projet possède aujourd’hui une base solide et démontrable.

Ses points forts sont :

- workflow central cohérent ;
- API modulaire ;
- web utilisateur connecté ;
- back-office connecté ;
- Docker fonctionnel ;
- tests unitaires et E2E ;
- DSL Jison ;
- RGPD export ;
- architecture extensible.

Ses limites sont principalement liées au périmètre très large du sujet.

La version actuelle ne couvre pas encore toute la plateforme attendue, mais elle montre une progression claire vers un système cohérent plutôt qu’une simple accumulation de CRUD.

---

## 13. Conclusion

La réalisation de Connected Neighbours doit être présentée comme une plateforme en construction avancée, avec un socle métier solide autour des services, candidatures, contrats et points.

La démonstration actuelle peut s’appuyer sur :

- le parcours utilisateur complet ;
- le back-office ;
- l’API Swagger ;
- l’export RGPD ;
- le micro-langage Jison ;
- Docker ;
- les tests E2E.

La principale faiblesse restante concerne les fonctionnalités périphériques mais importantes du sujet : JavaFX synchronisé côté client, documents PDF complets, Neo4j, MinIO, Keycloak/MFA, messagerie temps réel, événements, votes, litiges et modération.

Le projet reste défendable si la soutenance est honnête : il ne faut pas prétendre que tout est terminé, mais montrer que le cœur métier est robuste, testé, extensible et que les limites sont comprises.
