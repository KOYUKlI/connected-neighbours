# Plan complet de réalisation V2 — Connected Neighbours

## 0. Objectif de cette V2

Cette V2 remplace le plan initial trop large par une roadmap réaliste, exploitable et défendable.

Le projet **Connected Neighbours** reste une plateforme collaborative de quartier ambitieuse, mais l’objectif de cette version est de distinguer clairement :

- ce qui est déjà réalisé ;
- ce qui est partiellement réalisé ;
- ce qui manque réellement ;
- ce qui doit être priorisé avant la soutenance ;
- ce qui peut être assumé comme limite ou amélioration future.

Le plan initial décrit une plateforme cible très complète. Cette V2 garde cette vision, mais elle évite de présenter comme terminé ce qui ne l’est pas encore.

---

# 1. Vision produit conservée

Connected Neighbours est une plateforme de quartier permettant aux habitants de :
markdo
- demander ou proposer des services ;
- candidater à des services ;
- formaliser les engagements avec des contrats ;
- utiliser une monnaie interne en points ;
- signaler des incidents ;
- administrer la plateforme depuis un back-office ;
- utiliser une application JavaFX administrateur en mode offline-first ;
- exporter leurs données personnelles ;
- interroger certaines données MongoDB via un micro-langage.

La vision complète du sujet inclut aussi :

- les quartiers géographiques dessinés sur carte ;
- les documents PDF signés ;
- les événements ;
- les votes ;
- la messagerie multimédia ;
- les recommandations via Neo4j ;
- le stockage de fichiers via MinIO ;
- le SSO/MFA via Keycloak ;
- le multilingue ;
- Socket.IO pour le temps réel.

Ces éléments restent importants, mais ils doivent être classés correctement selon leur état réel.

---

# 2. État actuel global

## 2.1 Socle réalisé

Le projet possède actuellement un socle solide composé de :

- une API NestJS/Fastify ;
- une base MongoDB ;
- une authentification JWT locale ;
- des rôles utilisateurs ;
- un workflow services/candidatures/contrats/points ;
- un module incidents ;
- un module alertes ;
- une API de synchronisation pour JavaFX ;
- un micro-langage MongoDB basé sur Jison ;
- un export RGPD ;
- un front web utilisateur connecté à l’API ;
- un back-office admin connecté à l’API ;
- un Docker Compose avec API, web, admin-web et MongoDB ;
- des tests unitaires API ;
- des tests E2E API sur le parcours principal.

## 2.2 Socle partiel

Certains éléments existent mais ne couvrent pas encore toute la cible :

- quartiers : logique présente mais pas encore de vraie carte Leaflet ;
- contrats : workflow fonctionnel mais pas encore de PDF signé complet ;
- points : réservation/transfert présents, gestion avancée des litiges encore à compléter ;
- JavaFX : partie locale avancée, synchronisation client à finaliser ;
- documents : module ou base possible, mais pas encore de stockage réel complet via MinIO ;
- événements/votes/messagerie : modules ou idées présents selon le code, mais pas encore démontrables comme parcours complets côté front ;
- sécurité : JWT local fonctionnel, mais Keycloak/SSO/MFA non finalisés.

## 2.3 Manques principaux

Les manques les plus visibles par rapport au sujet sont :

- Neo4j réellement branché et utilisé ;
- MinIO réellement branché ;
- Keycloak/SSO/MFA ;
- PDF signé complet avec upload, champs de signature et archivage ;
- messagerie temps réel ;
- événements complets côté web ;
- votes complets côté web ;
- carte de quartier avec dessin GeoJSON ;
- notifications ;
- litiges complets ;
- avis/réputation ;
- synchronisation JavaFX côté client ;
- multilingue.

---

# 3. Priorités de réalisation

## 3.1 Priorité P0 — indispensable pour une soutenance défendable

Le P0 correspond à ce qui doit absolument être stable, démontrable et cohérent.

| Domaine | Objectif | État | Action restante |
|---|---|---|---|
| API | API centrale stable | Avancé | vérifier build, tests, Swagger |
| Auth | Connexion JWT + rôles | Réalisé | vérifier comptes de démo |
| Services | Créer/publier/annuler services | Réalisé | nettoyer états et UX |
| Candidatures | Candidater/accepter/refuser/retirer | Réalisé | vérifier affichage front |
| Contrats | Générer depuis candidature, signer, terminer, annuler | Réalisé/partiel | vérifier cohérence métier |
| Points | Réserver, libérer, transférer | Réalisé | vérifier transactions |
| Web utilisateur | Parcours principal | Réalisé | stabiliser UX |
| Admin web | Dashboard + listes principales | Réalisé | ajouter liens/actions si nécessaire |
| RGPD | Export utilisateur | Réalisé | vérifier lisibilité export |
| DSL Jison | Parse/execute/examples | Réalisé | ajouter exemples démo |
| Docker | API + web + admin + MongoDB | Réalisé | tester machine propre |
| Tests | Unitaires + E2E API | Réalisé | relancer avant rendu |
| JavaFX | Application locale incidents | Partiel/avancé | finalisation par Baptiste |
| Sync JavaFX | API prête | API réalisée | client JavaFX à finaliser |

## 3.2 Priorité P1 — important si le temps le permet

| Domaine | Objectif | Pourquoi c’est important |
|---|---|---|
| JavaFX sync client | Démontrer offline → sync → admin-web | Très visible en soutenance |
| Quartiers carte | Dessin de zone GeoJSON | Exigence claire du sujet |
| Documents PDF V1 | Document associé à contrat | Exigence forte du sujet |
| MinIO V1 | Stocker PDF ou pièces jointes | Renforce l’architecture |
| Événements V1 | Créer/lister/répondre | Exigence web importante |
| Votes V1 | Créer/voter/résultats | Exigence web importante |
| Litiges simples | Contester un contrat/service | Rend le workflow crédible |
| Notifications simples | In-app seulement | Améliore l’usage |

## 3.3 Priorité P2 — bonus ou amélioration future

| Domaine | Objectif |
|---|---|
| Neo4j recommandations | Graphe social et recommandations simples |
| Keycloak | SSO réel |
| MFA | Protection actions sensibles |
| Socket.IO | Messagerie temps réel et présence |
| i18n | Interface FR/EN |
| Avis/réputation | Score utilisateur |
| Modération avancée | Signalements, sanctions, historique |
| Export RGPD ZIP | Export complet avancé |
| JavaFX plugins avancés | Plugins réellement extensibles |
| Mises à jour JavaFX | Update automatique complet |

---

# 4. Roadmap réaliste par lots

## Lot 0 — Stabilisation générale

### Objectif

S’assurer que le projet actuel fonctionne proprement avant d’ajouter de nouvelles fonctionnalités.

### Actions

- relancer les tests API ;
- relancer les tests E2E ;
- relancer les builds web/admin/API ;
- vérifier Docker Compose ;
- vérifier les comptes de test ;
- vérifier Swagger ;
- vérifier qu’aucun fichier local sensible n’est suivi par Git ;
- vérifier que la base de démo se seed correctement.

### Validation

Commandes recommandées :

```powershell
pnpm --filter "./apps/api" run build
pnpm --filter "./apps/api" run test
pnpm --filter "./apps/api" run test:e2e
pnpm --filter "./apps/web" run build
pnpm --filter "./apps/admin-web" run build
docker compose up --build -d
docker compose ps
```

### Priorité

P0.

---

## Lot 1 — Parcours service complet stabilisé

### Objectif

Faire du parcours service/candidature/contrat/points le cœur démontrable du projet.

### Fonctionnalités déjà présentes

- création de service ;
- publication ;
- candidature ;
- acceptation/refus/retrait ;
- contrat depuis candidature ;
- signature ;
- annulation ;
- complétion ;
- réservation/transfert de points ;
- affichage web.

### Actions à faire

- vérifier tous les statuts métier ;
- améliorer les messages d’erreur côté web ;
- s’assurer que le créateur ne peut pas candidater à son propre service ;
- s’assurer qu’un utilisateur ne candidate pas deux fois ;
- vérifier que les points sont réservés une seule fois ;
- vérifier que les points sont libérés en cas d’annulation ;
- vérifier que la complétion transfère bien les points ;
- ajouter une démo claire Alice/Bob.

### Validation attendue

Scénario :

```txt
1. Alice se connecte.
2. Alice crée une demande payante.
3. Bob se connecte.
4. Bob candidate.
5. Alice accepte.
6. Alice génère le contrat.
7. Alice signe.
8. Bob signe.
9. Le contrat devient actif.
10. Le service est terminé.
11. Les points sont transférés.
```

### Priorité

P0.

---

## Lot 2 — Admin web crédible

### Objectif

Présenter un back-office propre permettant au jury de voir que l’administration existe réellement.

### Fonctionnalités déjà présentes

- login admin ;
- dashboard ;
- services ;
- contrats ;
- incidents ;
- synchronisation ;
- utilisateurs.

### Actions à faire

- vérifier que les endpoints admin sont protégés ;
- vérifier qu’un résident ne peut pas accéder à l’admin ;
- rendre les tableaux lisibles ;
- ajouter des états vides propres ;
- ajouter un bouton rafraîchir ;
- vérifier que les données sensibles ne sont pas affichées ;
- éventuellement ajouter une page quartiers si le module est suffisamment prêt.

### Validation attendue

```txt
1. Connexion admin.
2. Consultation dashboard.
3. Consultation services.
4. Consultation contrats.
5. Consultation incidents.
6. Consultation sync.
7. Consultation utilisateurs sans passwordHash.
```

### Priorité

P0.

---

## Lot 3 — JavaFX offline-first

### Objectif

Finaliser ou clarifier la partie JavaFX avec Baptiste.

### État actuel

La partie JavaFX est avancée côté local : incidents, alertes, reporters, statistiques, thèmes, plugins et base locale.

Le risque principal est la synchronisation côté client.

### Actions côté JavaFX

- vérifier le lancement ;
- générer un JAR ;
- éviter la recréation de la base à chaque lancement ;
- ajouter ou vérifier l’outbox ;
- ajouter ou vérifier le client HTTP vers l’API ;
- brancher push `/api/sync/push` ;
- brancher pull `/api/sync/pull` ;
- afficher l’état de synchronisation ;
- gérer au minimum les erreurs réseau ;
- tester le scénario offline.

### Actions côté API

- fournir le format exact des opérations ;
- documenter les payloads `incident` et `alert` ;
- vérifier l’idempotence via `operationId` ;
- vérifier l’historique de sync ;
- vérifier que l’admin-web affiche les opérations.

### Validation attendue

```txt
1. Lancer JavaFX.
2. Couper Internet ou simuler API indisponible.
3. Créer un incident localement.
4. Vérifier qu’il reste en base locale.
5. Rétablir la connexion.
6. Synchroniser.
7. Voir l’incident côté API/admin-web.
```

### Priorité

P0/P1 selon l’état réel de JavaFX.

---

## Lot 4 — Quartiers géographiques V1

### Objectif

Répondre à l’exigence de modélisation géographique sans viser une version trop complexe.

### Version minimale acceptable

- CRUD quartier ;
- champ GeoJSON ;
- rattachement utilisateur/service/incident à un quartier ;
- affichage admin simple.

### Version améliorée

- carte Leaflet ;
- dessin polygonal ;
- vérification `contains-point` ;
- filtre par quartier.

### Actions

- vérifier le module neighborhoods actuel ;
- ajouter les champs manquants ;
- ajouter une page admin quartiers ;
- stocker un GeoJSON simple ;
- éviter de bloquer tout le projet sur Leaflet si le temps manque.

### Priorité

P1.

---

## Lot 5 — Documents PDF V1 et stockage

### Objectif

Répondre au sujet sur les documents/signatures avec une V1 réaliste.

### Version minimale acceptable

- document lié à un contrat ;
- métadonnées document ;
- statut du document ;
- trace de signature ;
- téléchargement simulé ou lien local si MinIO non prêt.

### Version cible

- MinIO dans Docker ;
- presigned upload ;
- presigned download ;
- PDF original ;
- PDF signé ;
- champs de signature ;
- audit signatures.

### Actions

- décider si MinIO est intégré maintenant ou assumé comme limite ;
- créer un module storage si nécessaire ;
- relier contrat et document ;
- ajouter un écran documents ou une section dans contrats ;
- ajouter une trace de signature.

### Priorité

P1.

---

## Lot 6 — Événements et votes V1

### Objectif

Avoir au moins une démonstration des modules de vie de quartier.

### Événements V1

- créer un événement ;
- lister les événements ;
- répondre intéressé/participe ;
- afficher les participants.

### Votes V1

- créer un vote ;
- voter ;
- empêcher le double vote ;
- afficher les résultats.

### Actions

- vérifier les modules API existants ;
- ajouter les pages web ;
- ajouter les pages admin si possible ;
- ajouter des tests simples ;
- ne pas ajouter Neo4j tout de suite si cela ralentit le reste.

### Priorité

P1.

---

## Lot 7 — Litiges simples

### Objectif

Rendre le parcours service plus réaliste en cas de problème.

### Version minimale

- ouvrir un litige sur un contrat ;
- passer le contrat/service en `disputed` ;
- geler ou bloquer les points ;
- afficher les litiges côté admin ;
- résoudre en remboursement ou transfert.

### Actions

- créer module disputes ;
- relier contractId/serviceId ;
- ajouter endpoint open/resolve/close ;
- ajouter page admin litiges ;
- ajouter test E2E litige simple.

### Priorité

P1.

---

## Lot 8 — Messagerie et notifications simples

### Objectif

Ajouter de la cohérence autour des interactions sans forcément faire du temps réel complet.

### Version minimale

- conversation liée à un service/contrat ;
- messages texte ;
- messages système ;
- liste des conversations ;
- notifications internes simples.

### Version avancée

- Socket.IO ;
- présence online/offline ;
- images/vocaux via MinIO ;
- accusés de lecture.

### Priorité

P1/P2.

---

## Lot 9 — Neo4j recommandations simples

### Objectif

Répondre à l’exigence Neo4j avec un cas d’usage limité mais démontrable.

### Version minimale

- ajouter Neo4j dans Docker ;
- créer un service Neo4j ;
- écrire une relation après contrat terminé ;
- exposer une route recommandations simple.

### Exemple

```txt
Quand Alice valide un service réalisé par Bob :
(Alice)-[:HELPED_BY]->(Bob)
(Bob)-[:HELPED]->(Alice)
```

Puis :

```txt
GET /api/recommendations/neighbors
```

### Priorité

P2 si le temps est court, P1 si le jury insiste sur Neo4j.

---

## Lot 10 — Sécurité avancée

### Objectif

Clarifier la différence entre sécurité V1 et sécurité cible.

### Déjà présent

- JWT local ;
- rôles ;
- guards ;
- endpoints admin protégés ;
- pas d’exposition de `passwordHash` dans l’admin/RGPD.

### À ajouter si possible

- refresh token ;
- expiration mieux gérée ;
- changement de mot de passe ;
- Keycloak ;
- SSO web/JavaFX ;
- MFA sur signature et actions sensibles.

### Priorité

P2, sauf si exigé explicitement en démonstration.

---

# 5. Fonctionnalités à retirer, simplifier ou assumer

## 5.1 À ne pas présenter comme terminé

Les éléments suivants ne doivent pas être présentés comme finalisés s’ils ne le sont pas réellement :

- Keycloak ;
- SSO ;
- MFA ;
- Neo4j recommandations ;
- MinIO ;
- PDF signé complet ;
- Socket.IO ;
- messagerie multimédia ;
- appels vidéo ;
- carte Leaflet complète ;
- i18n ;
- plugins JavaFX avancés ;
- mises à jour JavaFX automatiques ;
- désinstallation JavaFX depuis l’interface.

## 5.2 À assumer comme limites

Ces sujets peuvent être assumés honnêtement comme limites ou évolutions :

- SSO/MFA remplacé temporairement par JWT local ;
- MinIO prévu mais Docker actuel limité à MongoDB ;
- Neo4j prévu mais pas cœur de la démonstration actuelle ;
- messagerie temps réel non priorisée ;
- JavaFX sync côté client dépendant du travail Java ;
- RGPD limité à export/anonymisation selon état réel ;
- événements/votes présents uniquement si pages finalisées.

## 5.3 À éviter

- ajouter trop de modules superficiels ;
- modifier toute l’architecture juste avant la soutenance ;
- intégrer Keycloak si cela casse l’auth existante ;
- brancher Neo4j sans scénario de démonstration ;
- brancher MinIO sans endpoint utilisable ;
- promettre une messagerie multimédia si seul le texte fonctionne.

---

# 6. Scénarios de démonstration recommandés

## 6.1 Scénario principal réaliste

Ce scénario doit rester le cœur de la soutenance.

```txt
1. Alice se connecte sur le web.
2. Alice crée une demande de service payante.
3. Bob se connecte.
4. Bob candidate.
5. Alice accepte la candidature.
6. Alice génère le contrat.
7. Alice signe.
8. Bob signe.
9. Le contrat devient actif.
10. Le service est terminé.
11. Les points sont transférés.
12. Alice consulte son RGPD export.
13. L’admin consulte le dashboard.
```

## 6.2 Scénario admin

```txt
1. Admin se connecte.
2. Il consulte les utilisateurs.
3. Il consulte les services.
4. Il consulte les contrats.
5. Il consulte les incidents.
6. Il consulte l’état de synchronisation.
```

## 6.3 Scénario DSL

```txt
1. Admin ouvre Swagger ou l’outil API.
2. Il lance une requête DSL.
3. L’API retourne l’AST.
4. L’API exécute la requête sur MongoDB.
5. Les résultats sont renvoyés.
```

Exemple :

```txt
FIND services WHERE category = "bricolage" AND pricePoints <= 50
```

## 6.4 Scénario JavaFX offline

À utiliser uniquement si la synchronisation client est prête.

```txt
1. Lancer JavaFX.
2. Créer un incident localement.
3. Simuler retour connexion.
4. Lancer synchronisation.
5. Voir l’incident côté API/admin-web.
```

Si la synchronisation client n’est pas prête, présenter plutôt :

```txt
JavaFX gère les incidents localement.
L’API expose les endpoints de synchronisation.
L’intégration complète client/API est la prochaine étape commune.
```

---

# 7. Plan de travail court terme

## Semaine 1 — Stabilisation

- relancer tous les tests ;
- corriger les erreurs bloquantes ;
- stabiliser Docker ;
- stabiliser web/admin ;
- vérifier seed ;
- vérifier Swagger ;
- vérifier JavaFX avec Baptiste.

## Semaine 2 — Finalisation P0

- améliorer le scénario service complet ;
- nettoyer les vieux comptes de seed ;
- vérifier RGPD ;
- vérifier admin-web ;
- vérifier JavaFX local ;
- préparer screenshots ;
- préparer script de démo.

## Semaine 3 — P1 selon temps restant

Choisir maximum deux sujets :

- JavaFX sync client ;
- documents PDF V1 ;
- événements/votes V1 ;
- quartiers carte V1 ;
- litiges simples.

Ne pas tout lancer en même temps.

---

# 8. Plan de validation final

Avant rendu, vérifier :

```txt
[ ] git status propre
[ ] aucun fichier local sensible suivi
[ ] docker compose up --build -d fonctionne
[ ] API accessible
[ ] Swagger accessible
[ ] web accessible
[ ] admin-web accessible
[ ] MongoDB accessible
[ ] comptes de test OK
[ ] parcours Alice/Bob OK
[ ] points OK
[ ] RGPD export OK
[ ] admin dashboard OK
[ ] tests API OK
[ ] tests E2E OK
[ ] JavaFX lancé ou limite clairement assumée
[ ] documentation alignée avec le projet réel
```

Commandes :

```powershell
git status --short
git log --oneline -10
pnpm --filter "./apps/api" run build
pnpm --filter "./apps/api" run test
pnpm --filter "./apps/api" run test:e2e
pnpm --filter "./apps/web" run build
pnpm --filter "./apps/admin-web" run build
docker compose up --build -d
docker compose ps
```

---

# 9. Décision stratégique recommandée

Le projet ne doit pas chercher à tout terminer superficiellement.

La meilleure stratégie est :

```txt
1. Avoir un parcours service complet et fiable.
2. Avoir un admin-web crédible.
3. Avoir Docker fonctionnel.
4. Avoir DSL Jison démontrable.
5. Avoir RGPD export démontrable.
6. Avoir JavaFX local présentable.
7. Finaliser la sync JavaFX si possible.
8. Ajouter seulement un ou deux modules P1 si le temps reste suffisant.
```

Il vaut mieux présenter un projet honnête avec un cœur solide qu’une plateforme qui prétend tout faire mais dont beaucoup de modules ne fonctionnent pas.

---

# 10. Conclusion

Cette V2 du plan de réalisation sert à guider la fin du projet.

L’objectif prioritaire est de rendre Connected Neighbours :

- stable ;
- démontrable ;
- cohérent métier ;
- défendable techniquement ;
- honnête sur ses limites ;
- aligné avec le sujet autant que possible.

Le cœur actuel du projet est :

```txt
API + Web + Admin-web + MongoDB + Services + Candidatures + Contrats + Points + RGPD + DSL + Docker
```

Les principaux efforts restants concernent :

```txt
JavaFX sync client
quartiers géographiques
PDF/MinIO
événements/votes
litiges
Neo4j
sécurité avancée
```

La soutenance doit montrer que le projet n’est pas une simple suite de CRUD, mais une plateforme de quartier structurée autour d’un vrai workflow de confiance entre habitants.
