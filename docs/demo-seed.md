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
