# 01 — Descriptif fonctionnel final — Connected Neighbours

## 1. Présentation du projet

**Connected Neighbours** est une plateforme collaborative de quartier permettant aux habitants d’un même secteur géographique de s’entraider, d’échanger des services, de participer à des événements, de voter sur des décisions locales, de communiquer entre eux et de signaler des incidents.

Le projet ne se limite pas à une application d’annonces. Il vise à créer un cadre de confiance entre voisins grâce à :

- des rôles clairement définis ;
- des quartiers géographiques administrés ;
- un système de services gratuits ou payants ;
- une monnaie interne basée sur des points ;
- des contrats obligatoires pour les services payants ;
- des signatures numériques de documents PDF ;
- une messagerie sécurisée ;
- une modération des contenus et comportements ;
- un système de litiges ;
- des recommandations basées sur les interactions ;
- une application JavaFX administrateur fonctionnant hors ligne ;
- une synchronisation automatique entre le client lourd JavaFX et l’API centrale ;
- une prise en compte des exigences RGPD.

L’objectif principal est de proposer une plateforme réaliste, sécurisée, extensible et démontrable, capable de gérer les interactions quotidiennes d’un quartier.

---

## 2. Objectifs fonctionnels

La plateforme doit permettre de couvrir les besoins suivants :

1. Gérer des quartiers géographiques.
2. Gérer les comptes utilisateurs et les rôles.
3. Permettre aux habitants de proposer ou demander des services.
4. Gérer des candidatures sur les services.
5. Permettre la négociation des conditions d’un service.
6. Générer des contrats pour les services payants.
7. Réserver, transférer ou restituer des points.
8. Importer et signer des documents PDF.
9. Organiser des événements de quartier.
10. Proposer des recommandations via Neo4j.
11. Créer et gérer des votes.
12. Permettre une messagerie texte et multimédia.
13. Gérer les notifications.
14. Gérer les signalements et la modération.
15. Gérer les litiges liés aux services.
16. Permettre aux habitants de laisser des avis.
17. Gérer les incidents et alertes du quartier.
18. Permettre à l’administrateur d’utiliser une application JavaFX hors ligne.
19. Synchroniser les données JavaFX avec l’API centrale.
20. Permettre l’export, la rectification et l’anonymisation des données personnelles.

---

## 3. Acteurs du système

### 3.1 Habitant

L’habitant est l’utilisateur principal de la plateforme.

Il peut :

- consulter les contenus de son quartier ;
- publier une offre ou une demande de service ;
- candidater à un service ;
- négocier les conditions d’un service ;
- signer un contrat ;
- consulter son solde de points ;
- envoyer des messages ;
- participer à un événement ;
- répondre à un vote ;
- signaler un contenu ou un incident ;
- consulter ses notifications ;
- gérer son profil ;
- demander l’export ou la suppression de ses données.

### 3.2 Demandeur de service

Un habitant devient demandeur lorsqu’il publie une demande de service.

Il peut :

- recevoir plusieurs candidatures ;
- consulter les profils des candidats ;
- accepter, refuser ou négocier une proposition ;
- signer le contrat si le service est payant ;
- valider ou contester la réalisation du service ;
- ouvrir un litige ;
- laisser un avis au prestataire.

### 3.3 Prestataire voisin

Un habitant devient prestataire lorsqu’il propose de réaliser un service.

Il peut :

- candidater à une demande ;
- proposer une date ou un prix ;
- accepter les conditions du contrat ;
- signer le contrat ;
- déclarer le service comme réalisé ;
- ajouter une preuve de réalisation ;
- recevoir les points après validation ;
- ouvrir un litige si nécessaire ;
- laisser un avis au demandeur.

### 3.4 Modérateur

Le modérateur assure le bon fonctionnement de la communauté.

Il peut :

- consulter les signalements ;
- masquer un contenu problématique ;
- avertir un utilisateur ;
- suspendre temporairement un compte ;
- intervenir dans un litige ;
- consulter les preuves liées à un conflit ;
- prendre une décision de modération ;
- escalader un cas vers l’administrateur.

### 3.5 Administrateur web

L’administrateur web gère la plateforme depuis le back-office React.

Il peut :

- créer et modifier les quartiers ;
- gérer les utilisateurs ;
- attribuer les rôles ;
- superviser les services ;
- consulter les contrats ;
- gérer les événements ;
- gérer les votes ;
- consulter les documents ;
- suivre les incidents ;
- consulter les statistiques ;
- superviser la synchronisation JavaFX ;
- traiter certaines demandes RGPD.

### 3.6 Administrateur JavaFX

L’administrateur JavaFX utilise une application desktop dédiée.

Il peut :

- consulter les incidents déjà synchronisés ;
- créer un incident même sans connexion Internet ;
- gérer les alertes liées aux incidents ;
- consulter des statistiques locales ;
- personnaliser l’application via les thèmes ;
- utiliser des plugins ;
- synchroniser automatiquement les données avec l’API centrale dès que la connexion revient.

---

## 4. Rôles et permissions

La plateforme distingue trois rôles principaux :

| Rôle | Description |
|---|---|
| `resident` | Habitant classique du quartier |
| `moderator` | Utilisateur chargé de la modération |
| `admin` | Administrateur de la plateforme |

### Règles générales

- Un habitant ne peut gérer que ses propres contenus.
- Un modérateur peut agir sur les signalements et litiges.
- Un administrateur peut gérer les quartiers, utilisateurs, statistiques et paramètres globaux.
- Certaines actions sensibles doivent nécessiter une sécurité renforcée, notamment la signature de documents, la modification des identifiants et les actions administratives critiques.

---

## 5. Gestion des quartiers

### 5.1 Objectif

Le quartier est la base géographique de la plateforme. Les services, événements, votes et incidents sont rattachés à un quartier.

L’administrateur doit pouvoir définir un quartier à l’aide d’un outil de dessin géographique.

### 5.2 Données principales

Un quartier contient :

- un identifiant ;
- un nom ;
- une description ;
- une ville ;
- un code postal ;
- une zone géographique au format GeoJSON ;
- un statut actif ou archivé ;
- une date de création ;
- un administrateur créateur.

### 5.3 Fonctionnalités

L’administrateur peut :

- créer un quartier ;
- dessiner une zone sur une carte ;
- modifier les informations d’un quartier ;
- archiver un quartier ;
- consulter les habitants du quartier ;
- consulter les statistiques du quartier.

L’habitant peut :

- consulter son quartier ;
- voir les services, événements et votes liés à son quartier.

### 5.4 Règles métier

- Un quartier archivé ne peut plus recevoir de nouveaux services, votes ou événements.
- Un utilisateur est rattaché à un quartier principal.
- Les contenus sont filtrés selon le quartier de l’utilisateur.
- Un administrateur peut consulter tous les quartiers.
- Les limites géographiques doivent prendre en compte les cas de bordure afin d’éviter les erreurs d’appartenance.

---

## 6. Services entre voisins

### 6.1 Objectif

Le module services est le cœur fonctionnel de Connected Neighbours.

Il doit permettre aux habitants de publier des offres ou des demandes de services, de recevoir des candidatures, de négocier les conditions, de signer un contrat si nécessaire, puis de suivre l’exécution jusqu’à la validation ou au litige.

Le but est d’éviter un simple système du type :

```txt
un voisin crée un service
un autre accepte
le service est terminé
```

Le workflow attendu est plus réaliste :

```txt
publication
candidatures
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
litige si problème
```

### 6.2 Types de services

Un service peut être une **offre** ou une **demande**.

Une offre correspond à une compétence proposée par un habitant : aide aux devoirs, babysitting, montage de meuble, arrosage de plantes, aide informatique, petits travaux.

Une demande correspond à un besoin exprimé par un habitant : garder un animal, aider à déménager, réparer un objet, accompagner une personne âgée, récupérer un colis.

### 6.3 Nature économique du service

| Type | Description |
|---|---|
| Gratuit | Aucun point échangé |
| Payant | Paiement via points |
| Mixte | Service gratuit avec caution ou frais partiels |
| Récurrent | Service répété dans le temps |
| Urgent | Service nécessitant une réponse rapide |

### 6.4 Données d’un service

Un service contient au minimum :

- un identifiant ;
- un type : offre ou demande ;
- un titre ;
- une description ;
- une catégorie ;
- un quartier ;
- un créateur ;
- un lieu ou une indication de localisation ;
- des disponibilités ;
- un prix en points si payant ;
- une durée estimée ;
- un indicateur d’urgence ;
- un statut ;
- une candidature sélectionnée ;
- un contrat associé ;
- une conversation associée ;
- une date de publication ;
- une date de réalisation ;
- une date d’annulation éventuelle.

### 6.5 États d’un service

| État | Signification |
|---|---|
| `draft` | Brouillon visible uniquement par le créateur |
| `published` | Service publié dans le quartier |
| `open_to_applications` | Service ouvert aux candidatures |
| `application_received` | Une ou plusieurs candidatures ont été reçues |
| `negotiation` | Les parties négocient les conditions |
| `candidate_selected` | Un candidat a été choisi |
| `contract_pending` | Un contrat doit être généré |
| `awaiting_signatures` | Le contrat attend les signatures |
| `contract_active` | Le contrat est signé et actif |
| `scheduled` | Le service est planifié |
| `in_progress` | Le service est en cours |
| `awaiting_validation` | Le prestataire attend validation |
| `completed` | Le service est terminé |
| `cancelled` | Le service est annulé |
| `disputed` | Un litige est ouvert |
| `archived` | Le service est archivé |

### 6.6 Workflow détaillé d’un service

#### Étape 1 — Création en brouillon

L’utilisateur crée un service.

Règles :

- le service n’est visible que par son créateur ;
- aucune candidature n’est possible ;
- le service peut être modifié librement ;
- aucun contrat n’est créé ;
- aucun point n’est réservé.

#### Étape 2 — Publication

Le service devient visible dans le quartier.

Règles :

- le service apparaît dans les recherches ;
- les habitants du quartier peuvent le consulter ;
- des notifications peuvent être envoyées aux utilisateurs intéressés par la catégorie ;
- le créateur peut encore modifier certaines informations.

#### Étape 3 — Candidatures

Un ou plusieurs voisins peuvent candidater.

Une candidature peut contenir :

- un message ;
- une date proposée ;
- une durée estimée ;
- un prix proposé ;
- des conditions particulières.

Règles :

- un utilisateur ne peut pas candidater à son propre service ;
- un utilisateur ne peut avoir qu’une candidature active par service ;
- le candidat peut retirer sa candidature ;
- le créateur peut refuser ou présélectionner une candidature.

#### Étape 4 — Négociation

Le créateur du service et le candidat peuvent ajuster les conditions.

Exemples :

- changement de date ;
- changement de prix ;
- changement de durée ;
- précision sur le lieu ;
- modification des conditions.

Règles :

- chaque proposition est historisée ;
- une seule proposition active existe à la fois ;
- l’acceptation d’une proposition verrouille les conditions ;
- les anciennes propositions restent consultables.

#### Étape 5 — Sélection du candidat

Le créateur choisit une candidature.

Conséquences :

- les autres candidatures sont automatiquement refusées ;
- une conversation dédiée est créée ou liée ;
- si le service est gratuit, il peut être planifié ;
- si le service est payant, un contrat doit être généré ;
- le système vérifie que le demandeur possède assez de points.

#### Étape 6 — Génération du contrat

Pour un service payant, un contrat est obligatoire.

Le contrat reprend :

- les deux parties ;
- la description du service ;
- le prix en points ;
- la date prévue ;
- les conditions ;
- la politique d’annulation ;
- l’historique des signatures.

Règles :

- un service payant ne peut pas être finalisé sans contrat ;
- les points sont réservés avant l’activation du contrat ;
- le contrat doit être signé par les deux parties ;
- les conditions signées ne peuvent plus être modifiées sans avenant.

#### Étape 7 — Signature

Les deux parties signent le contrat.

Règles :

- chaque signature est horodatée ;
- la signature est enregistrée dans l’audit du contrat ;
- une sécurité renforcée ou MFA est requise si disponible ;
- le contrat devient actif lorsque les deux signatures sont présentes.

#### Étape 8 — Planification

Le service est planifié.

Règles :

- la date et l’heure sont confirmées ;
- des rappels peuvent être envoyés ;
- une replanification nécessite l’accord des deux parties ;
- chaque changement est historisé.

#### Étape 9 — Réalisation

Le prestataire réalise le service.

Il peut :

- marquer le service comme démarré ;
- ajouter une note ;
- ajouter une preuve ;
- déclarer le service terminé.

Les preuves peuvent être :

- une image ;
- un document ;
- un message ;
- une note ;
- un fichier audio.

#### Étape 10 — Validation

Le demandeur peut :

- valider le service ;
- demander une correction ;
- contester ;
- ne pas répondre.

Règles :

- si le service est validé, les points sont transférés ;
- si une correction est demandée, le service retourne en suivi ;
- si le service est contesté, un litige est ouvert ;
- si le demandeur ne répond pas après un délai, une validation automatique peut être appliquée sauf litige ouvert.

#### Étape 11 — Clôture

Quand le service est terminé :

- le statut passe à `completed` ;
- le contrat passe à `completed` ;
- les points sont transférés ;
- une transaction est créée ;
- les deux parties peuvent laisser un avis ;
- Neo4j peut mettre à jour la relation entre les utilisateurs.

---

## 7. Candidatures et propositions

### 7.1 Objectif

Le module candidatures permet à plusieurs voisins de proposer leur aide avant qu’un prestataire soit choisi.

### 7.2 États d’une candidature

| État | Signification |
|---|---|
| `submitted` | Candidature envoyée |
| `viewed` | Candidature consultée |
| `shortlisted` | Candidat présélectionné |
| `negotiating` | Négociation en cours |
| `accepted` | Candidature acceptée |
| `rejected` | Candidature refusée |
| `withdrawn` | Candidature retirée |
| `expired` | Candidature expirée |

### 7.3 Règles métier

- Une candidature appartient à un service.
- Une candidature appartient à un candidat.
- Une candidature peut contenir une proposition initiale.
- Une candidature peut être acceptée, refusée ou retirée.
- Une candidature acceptée déclenche la génération du contrat si le service est payant.
- Les candidatures non retenues sont automatiquement refusées après sélection d’un candidat.

### 7.4 Propositions et contre-propositions

Une proposition permet de négocier les conditions avant contrat.

Elle peut contenir :

- un prix en points ;
- une date ;
- une durée ;
- un lieu ;
- un message ;
- une date d’expiration ;
- un numéro de version.

Règles :

- une nouvelle contre-proposition remplace la précédente ;
- les anciennes propositions restent dans l’historique ;
- une proposition acceptée devient la base du contrat ;
- une proposition expirée ne peut plus être acceptée.

---

## 8. Contrats

### 8.1 Objectif

Le contrat formalise l’accord entre deux voisins pour un service payant.

Il sert à sécuriser l’échange, à fixer les conditions et à garder une preuve.

### 8.2 Données d’un contrat

Un contrat contient :

- un identifiant ;
- le service concerné ;
- la candidature acceptée ;
- le demandeur ;
- le prestataire ;
- le prix en points ;
- la description ;
- la date prévue ;
- la durée ;
- les conditions ;
- la politique d’annulation ;
- le statut ;
- les signatures ;
- le document PDF associé ;
- les événements d’audit.

### 8.3 États du contrat

| État | Description |
|---|---|
| `draft` | Contrat préparé |
| `generated` | Contrat généré par le système |
| `sent` | Contrat envoyé aux parties |
| `viewed_by_requester` | Vu par le demandeur |
| `viewed_by_provider` | Vu par le prestataire |
| `signed_by_requester` | Signé par le demandeur |
| `signed_by_provider` | Signé par le prestataire |
| `active` | Signé par les deux parties |
| `completed` | Service terminé |
| `cancelled` | Contrat annulé |
| `disputed` | Litige ouvert |
| `expired` | Contrat expiré |
| `archived` | Contrat archivé |

### 8.4 Règles métier

- Un service payant doit obligatoirement avoir un contrat.
- Un contrat est généré depuis une candidature acceptée.
- Les points sont réservés avant ou pendant l’envoi du contrat.
- Les deux parties doivent signer.
- Après signature, les conditions sont verrouillées.
- Toute modification après activation nécessite un avenant.
- Un contrat expiré libère les points réservés.
- Un contrat en litige gèle les points.
- Un contrat terminé reste archivé.

### 8.5 Avenants

Un avenant permet de modifier un contrat actif sans supprimer l’historique.

Un avenant peut porter sur :

- une nouvelle date ;
- un nouveau prix ;
- une nouvelle durée ;
- une nouvelle condition.

États d’un avenant :

| État | Description |
|---|---|
| `draft` | Avenant préparé |
| `sent` | Avenant envoyé |
| `accepted` | Avenant accepté |
| `rejected` | Avenant refusé |
| `expired` | Avenant expiré |

---

## 9. Système de points

### 9.1 Objectif

Les points représentent une monnaie interne permettant de valoriser les services rendus entre voisins.

Ils doivent être gérés avec précision, car ils sont liés aux contrats, annulations et litiges.

### 9.2 Soldes utilisateur

Chaque utilisateur possède plusieurs soldes :

| Solde | Description |
|---|---|
| `availablePoints` | Points utilisables |
| `reservedPoints` | Points bloqués pour un contrat |
| `frozenPoints` | Points gelés en cas de litige |
| `earnedPoints` | Points gagnés |
| `spentPoints` | Points dépensés |

### 9.3 Types de transactions

| Type | Description |
|---|---|
| `initial_credit` | Crédit initial |
| `reservation` | Réservation de points |
| `transfer` | Transfert final |
| `release` | Libération de points réservés |
| `refund` | Remboursement |
| `penalty` | Pénalité |
| `bonus` | Bonus |
| `admin_adjustment` | Correction par administrateur |
| `dispute_freeze` | Gel de points |
| `dispute_release` | Libération après litige |

### 9.4 Règles métier

- Les points disponibles peuvent être réservés.
- Les points réservés ne peuvent plus être utilisés ailleurs.
- Les points gelés ne peuvent pas être transférés.
- Chaque opération crée une transaction.
- Une transaction ne doit jamais être supprimée.
- Une correction se fait par transaction inverse.
- Le transfert final ne se fait qu’après validation du service.
- En cas de litige, les points restent bloqués jusqu’à décision.

### 9.5 Scénario normal

1. Alice accepte un service payant à 50 points.
2. Les 50 points sont réservés.
3. Le contrat est signé.
4. Le service est réalisé.
5. Alice valide.
6. Les 50 points sont transférés à Bob.
7. Une transaction de transfert est créée.

### 9.6 Scénario d’annulation

1. Alice annule avant signature.
2. Le contrat passe en annulé.
3. Les points réservés sont libérés.
4. Une transaction de libération est créée.

### 9.7 Scénario de litige

1. Bob déclare le service terminé.
2. Alice conteste.
3. Les points sont gelés.
4. Un litige est ouvert.
5. Le modérateur examine les preuves.
6. Les points sont transférés, remboursés ou partagés selon la décision.

---

## 10. Documents PDF et signatures

### 10.1 Objectif

La plateforme doit permettre d’importer, préparer, signer et archiver des documents PDF.

Les contrats peuvent être associés à des documents signés.

### 10.2 Types de documents

- contrat ;
- avenant ;
- preuve d’incident ;
- autorisation ;
- document lié à un événement ;
- autre document.

### 10.3 États d’un document

| État | Description |
|---|---|
| `draft` | Document en préparation |
| `uploaded` | PDF importé |
| `prepared` | Zones placées |
| `sent_for_signature` | Envoyé pour signature |
| `partially_signed` | Signé partiellement |
| `signed` | Signé par toutes les parties |
| `finalized` | PDF final généré |
| `archived` | Document archivé |
| `cancelled` | Document annulé |

### 10.4 Champs de document

Un document peut contenir :

- zone de signature ;
- initiales ;
- date ;
- texte ;
- case à cocher.

### 10.5 Règles métier

- Le PDF original est conservé.
- Le PDF signé est généré séparément.
- Un champ signé ne peut plus être modifié.
- Un document signé ne peut plus être préparé.
- Chaque signature crée une trace d’audit.
- La signature doit être sécurisée.
- Le document final doit être téléchargeable.
- Les documents liés à un litige ou contrat doivent rester archivés.

---

## 11. Messagerie

### 11.1 Objectif

La messagerie permet aux utilisateurs de communiquer dans un contexte précis.

Elle ne doit pas être isolée du reste de la plateforme : elle doit pouvoir être liée à un service, une candidature, un contrat, un événement, un incident ou un litige.

### 11.2 Contextes de conversation

Une conversation peut être liée à :

- un service ;
- une candidature ;
- un contrat ;
- un événement ;
- un litige ;
- un incident ;
- une conversation directe.

### 11.3 Types de messages

- texte ;
- image ;
- audio ;
- document ;
- message système ;
- événement contrat ;
- événement paiement ;
- événement modération.

### 11.4 Messages système

Le système peut générer automatiquement des messages dans la conversation.

Exemples :

- une candidature a été envoyée ;
- une proposition a été acceptée ;
- le contrat a été généré ;
- les points ont été réservés ;
- le contrat a été signé ;
- le service a été marqué comme terminé ;
- un litige a été ouvert.

### 11.5 Règles métier

- Seuls les participants peuvent lire une conversation.
- Un modérateur peut accéder à une conversation uniquement dans un contexte de signalement ou litige.
- Les fichiers sont stockés dans MinIO.
- Les messages système ne peuvent pas être modifiés.
- Les messages liés à un litige peuvent être conservés comme preuves.
- La présence en ligne/hors ligne est indiquée en temps réel.

---

## 12. Notifications

### 12.1 Objectif

Les notifications informent les utilisateurs des événements importants.

### 12.2 Types de notifications

La plateforme peut notifier :

- nouvelle candidature reçue ;
- candidature acceptée ;
- proposition reçue ;
- contrat envoyé ;
- contrat signé ;
- points réservés ;
- service planifié ;
- service déclaré terminé ;
- validation requise ;
- points transférés ;
- litige ouvert ;
- événement créé ;
- rappel d’événement ;
- vote ouvert ;
- vote bientôt clôturé ;
- nouveau message ;
- incident mis à jour ;
- synchronisation JavaFX terminée.

### 12.3 Canaux

Les notifications peuvent être envoyées par :

- notification interne ;
- WebSocket ;
- email ;
- application JavaFX pour les administrateurs.

---

## 13. Événements de quartier

### 13.1 Objectif

Les événements permettent d’animer la vie du quartier.

### 13.2 Types d’événements

- atelier ;
- soirée ;
- collecte ;
- sport ;
- réunion ;
- culture ;
- entraide ;
- événement enfants ;
- urgence ;
- autre.

### 13.3 États d’un événement

| État | Description |
|---|---|
| `draft` | Brouillon |
| `published` | Publié |
| `open_registration` | Inscriptions ouvertes |
| `full` | Capacité atteinte |
| `started` | Événement commencé |
| `completed` | Événement terminé |
| `cancelled` | Événement annulé |
| `archived` | Événement archivé |

### 13.4 Réponses utilisateur

Un habitant peut indiquer :

- intéressé ;
- participe ;
- peut-être ;
- pas intéressé ;
- désinscrit ;
- sur liste d’attente.

### 13.5 Fonctionnalités

- créer un événement ;
- publier un événement ;
- gérer une capacité maximale ;
- rejoindre un événement ;
- quitter un événement ;
- gérer une liste d’attente ;
- recevoir un rappel ;
- afficher les participants ;
- recommander des événements via Neo4j.

---

## 14. Recommandations Neo4j

### 14.1 Objectif

Neo4j sert à exploiter les relations entre habitants, services, événements, catégories et interactions.

### 14.2 Relations possibles

Le graphe peut contenir :

```txt
(User)-[:LIVES_IN]->(Neighborhood)
(User)-[:CREATED]->(Service)
(User)-[:APPLIED_TO]->(Service)
(User)-[:COMPLETED]->(Service)
(User)-[:HELPED]->(User)
(User)-[:REVIEWED]->(User)
(User)-[:PARTICIPATED_IN]->(Event)
(User)-[:INTERESTED_IN]->(Event)
(User)-[:VOTED_ON]->(Vote)
(Service)-[:IN_CATEGORY]->(Category)
(Event)-[:IN_CATEGORY]->(Category)
```

### 14.3 Recommandations attendues

La plateforme peut recommander :

- des événements pertinents ;
- des services compatibles ;
- des voisins fiables ;
- des candidats pour un service ;
- des catégories populaires.

### 14.4 Critères de recommandation

Pour recommander un voisin :

- services terminés ;
- bonnes notes ;
- faible nombre de litiges ;
- proximité dans le quartier ;
- catégories communes ;
- événements communs.

Pour recommander un événement :

- même quartier ;
- catégories déjà appréciées ;
- participation d’utilisateurs similaires ;
- popularité ;
- historique utilisateur.

---

## 15. Votes

### 15.1 Objectif

Les votes permettent aux habitants de participer à certaines décisions de quartier.

### 15.2 Types de votes

- oui/non ;
- choix unique ;
- choix multiple ;
- classement ;
- vote anonyme ;
- vote public.

### 15.3 États d’un vote

| État | Description |
|---|---|
| `draft` | Brouillon |
| `scheduled` | Planifié |
| `open` | Ouvert |
| `closed` | Clôturé |
| `cancelled` | Annulé |
| `archived` | Archivé |

### 15.4 Règles métier

- Un vote appartient à un quartier.
- Seuls les habitants concernés peuvent voter.
- Un utilisateur ne peut voter qu’une fois, sauf si la modification du vote est autorisée.
- Certains votes peuvent être anonymes.
- Les résultats peuvent être visibles pendant ou après la période de vote.
- Un vote clôturé ne peut plus recevoir de réponse.

---

## 16. Incidents et alertes

### 16.1 Objectif

Les incidents permettent de signaler des problèmes dans le quartier. Ils sont consultables et gérables par l’administrateur, notamment via l’application JavaFX.

### 16.2 Types d’incidents

- sécurité ;
- maintenance ;
- bruit ;
- propreté ;
- problème technique ;
- conflit entre voisins ;
- problème lié à un événement ;
- autre.

### 16.3 États d’un incident

| État | Description |
|---|---|
| `reported` | Signalé |
| `open` | Ouvert |
| `assigned` | Assigné |
| `in_progress` | En cours de traitement |
| `waiting_information` | En attente d’informations |
| `resolved` | Résolu |
| `closed` | Fermé |
| `rejected` | Rejeté |
| `archived` | Archivé |

### 16.4 Alertes

Une alerte est liée à un incident.

Elle possède une sévérité :

- faible ;
- moyenne ;
- haute ;
- critique.

### 16.5 Règles métier

- Un incident peut contenir plusieurs alertes.
- Une alerte critique doit notifier un administrateur.
- Un incident peut être créé depuis le web ou depuis JavaFX.
- Un incident créé hors ligne doit être synchronisé.
- Les conflits de synchronisation doivent être détectés.
- Les statistiques doivent pouvoir être consultées hors ligne sur les données déjà synchronisées.

---

## 17. Application JavaFX offline-first

### 17.1 Objectif

L’application JavaFX permet à l’administrateur de continuer à travailler même sans connexion Internet.

Elle est centrée sur :

- les incidents ;
- les alertes ;
- les statistiques ;
- les thèmes ;
- les plugins ;
- la synchronisation.

### 17.2 Fonctionnalités minimales

L’application JavaFX doit permettre :

- de se lancer sous forme de fichier JAR ;
- de consulter les incidents synchronisés ;
- de créer un incident hors ligne ;
- de modifier le statut d’un incident ;
- d’ajouter une alerte ;
- de consulter des statistiques ;
- de stocker les données dans une base locale ;
- de synchroniser automatiquement les données quand Internet revient.

### 17.3 Fonctionnalités avancées

L’application doit aussi prévoir :

- la gestion de plugins ;
- la personnalisation des thèmes ;
- les mises à jour automatiques depuis un serveur central ;
- la désinstallation depuis l’interface utilisateur.

---

## 18. Synchronisation JavaFX / API

### 18.1 Objectif

La synchronisation permet de relier la base locale JavaFX à l’API centrale.

Elle doit permettre :

- de consulter des données déjà synchronisées hors ligne ;
- d’ajouter des données hors ligne ;
- de pousser les modifications locales vers l’API ;
- de récupérer les changements serveur ;
- de gérer les conflits.

### 18.2 Outbox locale

Chaque opération réalisée hors ligne est stockée dans une file d’attente locale.

Une opération contient :

- un identifiant d’opération ;
- un type d’entité ;
- un identifiant d’entité ;
- un type d’opération ;
- un contenu ;
- une date de création ;
- un statut ;
- un nombre de tentatives ;
- une erreur éventuelle.

### 18.3 Processus de synchronisation

1. L’application vérifie si l’API est disponible.
2. Elle envoie les opérations locales en attente.
3. L’API confirme les opérations reçues.
4. L’application récupère les changements serveur depuis la dernière synchronisation.
5. Les changements sont appliqués localement.
6. Les conflits sont détectés.
7. La date de dernière synchronisation est mise à jour.

### 18.4 Gestion des conflits

Un conflit peut apparaître si :

- une donnée a été modifiée localement et côté serveur ;
- une donnée supprimée côté serveur a été modifiée localement ;
- deux opérations contradictoires existent sur le même incident.

Stratégies possibles :

- le serveur gagne ;
- le client gagne ;
- résolution manuelle par l’administrateur ;
- dernière modification gagnante avec journal d’audit.

---

## 19. Modération et signalements

### 19.1 Objectif

La modération permet de préserver un environnement sain et sécurisé.

### 19.2 Contenus modérables

- services ;
- messages ;
- avis ;
- événements ;
- votes ;
- profils ;
- métadonnées de documents.

### 19.3 Motifs de signalement

- spam ;
- arnaque ;
- comportement abusif ;
- harcèlement ;
- contenu inapproprié ;
- faux service ;
- contenu dangereux ;
- problème de confidentialité.

### 19.4 États d’un signalement

| État | Description |
|---|---|
| `submitted` | Signalement envoyé |
| `under_review` | En cours d’analyse |
| `action_taken` | Action prise |
| `rejected` | Signalement rejeté |
| `closed` | Signalement clôturé |

### 19.5 Actions de modération

Un modérateur peut :

- masquer un contenu ;
- avertir un utilisateur ;
- suspendre un utilisateur ;
- clôturer un service ;
- annuler un événement ;
- supprimer ou masquer un message ;
- geler un contrat ;
- ouvrir un litige.

---

## 20. Litiges

### 20.1 Objectif

Les litiges permettent de résoudre les conflits liés aux services, contrats ou paiements en points.

### 20.2 Cas typiques

- service non réalisé ;
- service mal réalisé ;
- prestataire absent ;
- demandeur qui refuse de valider ;
- annulation abusive ;
- comportement problématique ;
- preuves contradictoires.

### 20.3 États d’un litige

| État | Description |
|---|---|
| `opened` | Litige ouvert |
| `evidence_collection` | Collecte de preuves |
| `moderator_review` | Analyse par modérateur |
| `decision_pending` | Décision en attente |
| `resolved_refund` | Résolu par remboursement |
| `resolved_transfer` | Résolu par transfert |
| `resolved_partial` | Résolu par partage |
| `rejected` | Litige rejeté |
| `closed` | Litige clôturé |

### 20.4 Règles métier

- L’ouverture d’un litige gèle les points.
- Les deux parties peuvent ajouter des preuves.
- Le modérateur peut consulter les messages liés.
- Le modérateur prend une décision.
- La décision déclenche les transactions nécessaires.
- Le litige reste archivé dans l’historique.

---

## 21. Avis et réputation

### 21.1 Objectif

Les avis permettent de créer de la confiance entre voisins.

### 21.2 Avis après service

Après un service terminé, chaque partie peut laisser :

- une note globale ;
- un commentaire ;
- une note de ponctualité ;
- une note de qualité ;
- une note de communication ;
- une note de respect.

### 21.3 Règles métier

- Un avis est possible uniquement après un service terminé.
- Un utilisateur ne peut laisser qu’un avis par contrat.
- Un avis peut être signalé.
- Un avis signalé peut être masqué par la modération.
- Les avis influencent le score de réputation.
- Les avis peuvent alimenter le graphe Neo4j.

### 21.4 Score de réputation

Le score de réputation peut prendre en compte :

- nombre de services terminés ;
- note moyenne ;
- litiges perdus ;
- annulations tardives ;
- ancienneté ;
- participation aux événements ;
- signalements reçus.

---

## 22. RGPD

### 22.1 Objectif

La plateforme doit respecter les droits des utilisateurs sur leurs données personnelles.

### 22.2 Données concernées

Les données concernées peuvent inclure :

- profil ;
- services ;
- candidatures ;
- propositions ;
- contrats ;
- documents ;
- signatures ;
- transactions ;
- messages ;
- événements ;
- votes ;
- avis ;
- signalements ;
- incidents ;
- notifications ;
- journaux d’audit.

### 22.3 Droits utilisateur

L’utilisateur doit pouvoir :

- accéder à ses données ;
- exporter ses données ;
- demander une rectification ;
- demander une suppression ;
- demander une anonymisation.

### 22.4 Règles métier

- Certaines données peuvent être supprimées.
- Certaines données doivent être anonymisées.
- Certaines données peuvent être conservées pour preuve, notamment contrats, litiges et signatures.
- Les exports doivent être lisibles.
- Les actions RGPD doivent être historisées.

---

## 23. Back-office administrateur

### 23.1 Objectif

Le back-office React permet à l’administrateur de piloter la plateforme.

### 23.2 Pages attendues

Le back-office doit contenir :

- tableau de bord ;
- utilisateurs ;
- quartiers ;
- services ;
- contrats ;
- litiges ;
- signalements ;
- événements ;
- votes ;
- documents ;
- incidents ;
- statistiques ;
- synchronisation JavaFX ;
- paramètres.

### 23.3 Tableau de bord

Le tableau de bord affiche :

- nombre d’utilisateurs actifs ;
- services publiés ;
- contrats en cours ;
- litiges ouverts ;
- incidents critiques ;
- événements à venir ;
- votes ouverts ;
- documents en attente de signature ;
- transactions de points ;
- état de la synchronisation JavaFX.

---

## 24. Micro-langage MongoDB

### 24.1 Objectif

Le projet doit intégrer un micro-langage permettant d’interroger des documents MongoDB via une syntaxe maison.

### 24.2 Exemple de syntaxe

```txt
FIND services WHERE category = "bricolage" AND pricePoints <= 50
FIND events WHERE category = "sport" AND neighborhoodId = "quartier-centre"
FIND votes WHERE status = "open"
```

### 24.3 Fonctionnement

1. L’utilisateur saisit une requête.
2. Le lexer analyse les tokens.
3. Le parser construit un arbre syntaxique.
4. Le système valide la requête.
5. L’AST est traduit en filtre MongoDB.
6. La requête est exécutée sur une collection autorisée.
7. Les résultats sont renvoyés.

### 24.4 Collections autorisées

Pour éviter les abus, seules certaines collections doivent être accessibles :

- services ;
- événements ;
- votes ;
- documents ;
- incidents.

---

## 25. Multilingue

### 25.1 Objectif

L’application web doit être multilingue.

### 25.2 Fonctionnement attendu

L’utilisateur peut choisir une langue.

Les textes principaux de l’interface doivent être externalisés :

- menus ;
- boutons ;
- messages d’erreur ;
- formulaires ;
- notifications ;
- statuts.

---

## 26. Priorités fonctionnelles

### 26.1 Priorité P0 — indispensable

Les éléments suivants sont indispensables pour une démonstration défendable :

- authentification et rôles ;
- quartiers ;
- services avec candidatures ;
- contrats pour services payants ;
- réservation et transfert de points ;
- signature PDF minimale ;
- événements ;
- votes ;
- messagerie texte ;
- incidents JavaFX ;
- synchronisation JavaFX minimale ;
- back-office administrateur minimal ;
- export RGPD ;
- micro-langage MongoDB simple ;
- documentation Swagger.

### 26.2 Priorité P1 — important

Les éléments suivants renforcent fortement le projet :

- négociation avancée ;
- propositions versionnées ;
- avenants ;
- litiges ;
- avis et réputation ;
- notifications ;
- MinIO pour fichiers ;
- présence temps réel ;
- recommandations Neo4j simples ;
- statistiques avancées ;
- modération.

### 26.3 Priorité P2 — amélioration

Les éléments suivants sont des bonus :

- appels vidéo ;
- mise à jour automatique JavaFX complète ;
- désinstallation JavaFX depuis l’interface ;
- recommandations avancées ;
- export RGPD en ZIP ;
- système de pénalités détaillé ;
- dashboard analytique avancé.

---

## 27. Scénarios de démonstration

### 27.1 Parcours service complet

1. Alice se connecte.
2. Alice crée une demande de service payante.
3. Bob candidate.
4. Bob fait une contre-proposition.
5. Alice accepte.
6. Le contrat est généré.
7. Les points sont réservés.
8. Alice signe.
9. Bob signe.
10. Le service est planifié.
11. Bob marque le service comme réalisé.
12. Bob ajoute une preuve.
13. Alice valide.
14. Les points sont transférés.
15. Les deux utilisateurs peuvent laisser un avis.
16. La relation Alice/Bob est mise à jour dans Neo4j.

### 27.2 Parcours litige

1. Bob déclare le service terminé.
2. Alice conteste.
3. Les points sont gelés.
4. Un litige est ouvert.
5. Les preuves sont ajoutées.
6. Le modérateur analyse le litige.
7. Le modérateur décide d’un remboursement, transfert ou partage.
8. Le litige est clôturé.

### 27.3 Parcours événement

1. Un habitant crée un événement.
2. L’événement est publié dans son quartier.
3. Les habitants indiquent leur intérêt.
4. Certains confirment leur participation.
5. Neo4j recommande l’événement à des utilisateurs pertinents.

### 27.4 Parcours vote

1. Un administrateur ou habitant autorisé crée un vote.
2. Les habitants du quartier votent.
3. Le système empêche les votes multiples non autorisés.
4. Les résultats sont affichés selon les règles du vote.
5. Le vote est clôturé et archivé.

### 27.5 Parcours JavaFX offline

1. L’administrateur lance l’application JavaFX.
2. Les incidents déjà synchronisés s’affichent.
3. La connexion Internet est coupée.
4. L’administrateur crée un incident.
5. L’opération est stockée dans l’outbox locale.
6. Internet revient.
7. L’application synchronise automatiquement.
8. L’incident apparaît dans l’API et dans le back-office web.

### 27.6 Parcours micro-langage

1. L’administrateur ouvre l’outil de requête.
2. Il saisit une requête DSL.
3. Le parser génère un AST.
4. L’API traduit la requête en filtre MongoDB.
5. Les résultats sont affichés.

---

## 28. Conclusion fonctionnelle

Connected Neighbours doit être présenté comme une plateforme de confiance entre voisins.

Le cœur du projet est le module services, car il relie :

- utilisateurs ;
- quartiers ;
- candidatures ;
- propositions ;
- contrats ;
- points ;
- documents ;
- signatures ;
- messagerie ;
- notifications ;
- avis ;
- litiges ;
- modération ;
- recommandations ;
- RGPD.

Le projet sera convaincant si la démonstration montre un parcours complet, cohérent et traçable.

L’objectif final n’est pas seulement de prouver que l’équipe a développé une API, un site web et une application Java.

L’objectif est de montrer que l’équipe a conçu une plateforme complète, réaliste, extensible et sécurisée pour organiser la vie de quartier.
