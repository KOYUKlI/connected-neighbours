# Seed de démonstration Connected Neighbours

Le seed de démonstration initialise un environnement local reproductible sans
remplacer les données métier qui ne lui appartiennent pas. MongoDB reste la
source de vérité. Keycloak et Neo4j sont facultatifs; MinIO est utilisé pour les
fichiers de démonstration lorsque le scénario complet est lancé.

## Prérequis

- Node.js 24
- pnpm 10.32.1
- Docker Compose
- une configuration locale créée à partir de `.env.example`

Les mots de passe de démonstration proviennent exclusivement des variables
`SEED_DEMO_*_PASSWORD`. Les valeurs proposées dans `.env.example` sont
volontairement réservées au développement et ne doivent jamais être réutilisées
dans un environnement réel.

## Démarrage

```powershell
docker compose up -d mongodb minio mailpit keycloak-db keycloak neo4j
corepack pnpm@10.32.1 seed:demo
corepack pnpm@10.32.1 seed:demo:status
```

`KEYCLOAK_ENABLED=false` laisse le bootstrap Keycloak désactivé sans empêcher
la création MongoDB. `NEO4J_ENABLED=false` conserve le fallback MongoDB des
recommandations.

## Commandes

| Commande                | Effet                                                                  |
| ----------------------- | ---------------------------------------------------------------------- |
| `pnpm seed:demo`        | Exécute le seed complet dans l’ordre prévu                             |
| `pnpm seed:demo:status` | Affiche un état sans modifier les données                              |
| `pnpm seed:mongodb`     | Synchronise les comptes MongoDB du manifeste                           |
| `pnpm seed:keycloak`    | Synchronise Keycloak et applique les liaisons explicites               |
| `pnpm seed:minio`       | Rejoue les fixtures de stockage                                        |
| `pnpm seed:graph`       | Rejoue la projection Graph                                             |
| `pnpm seed:demo:reset`  | Supprime uniquement les objets enregistrés par le seed, puis le rejoue |

Le reset est interdit en production et exige:

```powershell
$env:SEED_CONFIRM_RESET='CONNECTED_NEIGHBOURS_DEMO'
corepack pnpm@10.32.1 seed:demo:reset
```

Il ne supprime ni volume Docker ni donnée ne figurant pas dans le registre du
seed.

## Identités et MFA

Les comptes principaux utilisent la même adresse e-mail dans MongoDB et
Keycloak. Le rôle applicatif provient toujours de MongoDB. Le bootstrap lie le
`subject` Keycloak uniquement pour les identités explicitement présentes dans
le manifeste.

L’administrateur et le modérateur doivent configurer leur propre TOTP lors de
leur première connexion Keycloak. Aucun secret TOTP fixe n’est créé, affiché ou
versionné. Les résidents peuvent activer cette protection depuis leur console de
compte.

Le statut du seed indique la variable contenant chaque mot de passe, jamais sa
valeur.

### Comptes de recette

| Compte              | Rôle           | Quartier               | Connexion           | État particulier                      |
| ------------------- | -------------- | ---------------------- | ------------------- | ------------------------------------- |
| Alice Martin        | résident       | Quartier Centre        | locale et Keycloak  | demandeuse principale                 |
| Bob Dupont          | résident       | Quartier Centre        | locale et Keycloak  | prestataire principal                 |
| Claire Bernard      | résident       | Quartier Centre        | locale et Keycloak  | profil privé et candidate concurrente |
| Nadia Petit         | résident       | Quartier Résidentiel   | locale et Keycloak  | service en cours                      |
| Hugo Leroy          | résident       | Quartier Universitaire | locale et Keycloak  | service en validation                 |
| Sarah Fontaine      | résident       | Quartier Familial      | locale et Keycloak  | correction demandée                   |
| Mehdi Roux          | résident       | Quartier Périphérique  | locale et Keycloak  | mobilité et bricolage                 |
| Julie Moreau        | résident       | Quartier des Jardins   | locale et Keycloak  | jardinage local                       |
| Lucas Garnier       | résident       | Quartier Universitaire | locale et Keycloak  | musique et événements                 |
| Emma Renaud         | résident       | Quartier Résidentiel   | locale et Keycloak  | aide administrative                   |
| Lina Keycloak       | résident       | Quartier Familial      | Keycloak uniquement | aucun mot de passe local              |
| Marc Héritage       | résident       | Quartier Périphérique  | locale uniquement   | migration historique                  |
| Sophie Liaison      | résident       | Quartier Centre        | locale puis liaison | liaison explicite requise             |
| Thomas Désactivé    | résident       | Quartier Résidentiel   | refusée             | compte désactivé                      |
| Élodie Vérification | résident       | Quartier des Jardins   | action requise      | e-mail à vérifier                     |
| Modération Demo     | modérateur     | Quartier Centre        | locale et Keycloak  | TOTP au premier login                 |
| Admin Demo          | administrateur | Quartier Centre        | locale et Keycloak  | TOTP au premier login                 |

Les adresses utilisent toutes le domaine local
`connected-neighbours.local`. Les mots de passe sont lus dans les variables
annoncées par `seed:demo:status`; ils ne sont ni affichés ni stockés dans ce
guide.

## Jeu métier attendu

Sur une base dédiée vide, le seed crée exactement 17 comptes de démonstration
et conserve tout compte extérieur déjà présent. Les volumes métier minimaux
sont les suivants:

- 6 quartiers avec des polygones GeoJSON non superposés;
- au moins 30 services répartis dans les 6 quartiers;
- des services publiés, avec candidatures, planifiés, en cours, en attente de
  validation, en correction, terminés, annulés et en litige;
- 9 candidatures ou plus, dont la sélection de Bob et le refus de Claire;
- 8 contrats ou plus, avec réservations de points cohérentes;
- des preuves texte et des pièces jointes PDF réellement stockées dans MinIO;
- des documents contractuels préparés, envoyés, signés, finalisés et archivés;
- 3 litiges: ouvert, en revue et résolu;
- au moins 10 événements et 10 votes;
- des avis publiés et masqués, avec réputation recalculable;
- des événements d’audit de sécurité sans adresse IP ni secret;
- des jobs Graph idempotents lorsque Neo4j est activé.

Les compteurs affichés par `seed:demo:status` portent sur l’environnement
courant. Ils peuvent être supérieurs si des données non possédées par le seed
étaient déjà présentes; celles-ci ne sont jamais supprimées automatiquement.

## Scénarios démontrables

### Service principal Alice et Bob

1. Alice publie « Aide pour monter un meuble ».
2. Bob est accepté et Claire est refusée.
3. 25 points sont réservés chez Alice.
4. Le contrat et son PDF sont signés par les deux parties.
5. Le service est planifié et prêt à démarrer.

Des scénarios séparés montrent ensuite un service en cours, un service déclaré
réalisé en attente du demandeur et une correction demandée. Cette séparation
évite de réécrire artificiellement l’historique du service principal.

### Litiges et décisions

Trois services indépendants couvrent un litige ouvert, un dossier assigné en
revue et une décision résolue avec paiement du prestataire. Les points restent
réservés tant qu’aucune décision finale n’a été exécutée. Le transfert final est
porté par une transaction unique.

### Identités

- Alice permet de tester le login local et le login Keycloak sur le même compte
  MongoDB.
- Lina confirme qu’un compte Keycloak-only est refusé par le login local.
- Marc conserve le parcours local historique.
- Sophie reste volontairement non liée jusqu’à la confirmation du parcours de
  liaison.
- Thomas est refusé car désactivé.
- Élodie doit vérifier son e-mail.
- Admin et Modération doivent configurer leur propre TOTP; le seed ne fabrique
  jamais de secret MFA partagé.

## Idempotence et reprise

Chaque entité utilise une clé naturelle ou un index unique. Les objets possédés
par le seed sont enregistrés dans `demo_seed_records`. Relancer deux fois:

```powershell
corepack pnpm@10.32.1 seed:demo
corepack pnpm@10.32.1 seed:demo
corepack pnpm@10.32.1 seed:demo:status
```

ne doit augmenter ni les comptes, ni les contrats, ni les transactions, ni les
documents, ni les objets MinIO. Les soldes sont reconstruits depuis le registre
des transactions, puis contrôlés pour interdire tout solde disponible ou réservé
négatif.

Le statut est strictement en lecture seule et ne requiert aucune variable de mot
de passe. Le reset, lui, reste une opération explicite protégée. Il supprime les
objets MinIO avant leurs métadonnées et ne touche qu’aux identifiants présents
dans le registre du seed.

## Recette rapide

1. Exécuter `docker compose config --quiet`.
2. Démarrer MongoDB, MinIO, Keycloak et Mailpit.
3. Exécuter `seed:demo` deux fois et comparer les compteurs.
4. Vérifier que MinIO est `ok`; Neo4j peut être `disabled`.
5. Se connecter localement avec Alice, puis consulter `/api/auth/me`.
6. Se connecter avec Alice via Keycloak et vérifier que le même identifiant
   MongoDB est retourné.
7. Vérifier que Lina est refusée par le login local.
8. Vérifier que le compte Admin demande la configuration TOTP.
9. Ouvrir les listes Services, Vie locale, Documents et Litiges dans les
   applications réelles.
10. Télécharger un document final et une preuve autorisée; un tiers doit être
    refusé.

Neo4j est facultatif. Lorsqu’il est désactivé ou indisponible, le seed reste
valide et les recommandations utilisent leur fallback MongoDB. Aucun échec
Graph ne doit annuler une mutation MongoDB.

## Diagnostic Keycloak

Si la connexion locale fonctionne mais pas Keycloak:

1. vérifier `KEYCLOAK_ENABLED`, le realm et l’URL publique;
2. vérifier la disponibilité de `cn-keycloak` et `cn-keycloak-db`;
3. exécuter `pnpm seed:demo:status`;
4. vérifier que l’e-mail principal est validé et que le compte est lié;
5. vérifier si `CONFIGURE_TOTP` attend la première connexion privilégiée.

Un ancien volume Keycloak peut contenir un realm importé avant le client de
service actuel. Le seed ne détruit jamais ce volume. Inspecter le realm et
choisir explicitement une stratégie de migration avant toute suppression.

## Authentification locale et JavaFX

Les comptes qui possèdent un mot de passe local restent compatibles avec
`POST /api/auth/login` et les clients historiques. Le compte Keycloak-only est
volontairement refusé par la connexion locale. Le compte local-only permet de
tester la migration sans modifier les contrats de synchronisation JavaFX.

## Mailpit

Mailpit est accessible sur `http://127.0.0.1:8025` avec les valeurs par défaut.
Il sert à observer les e-mails de vérification et les actions de compte sans
envoyer de message vers l’extérieur.
