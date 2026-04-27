# Démonstration — Étape 3

## Préparation

1. Démarrer MongoDB.
2. Démarrer l'API.
3. Ouvrir Swagger sur `/docs`.
4. Démarrer le client web utilisateur.

## Commandes de validation

```powershell
cd apps/api
.\node_modules\.bin\eslint.CMD "src/**/*.ts"
.\node_modules\.bin\jest.CMD --runInBand
.\node_modules\.bin\nest.CMD build
```

```powershell
cd apps/web
.\node_modules\.bin\tsc.CMD --noEmit
.\node_modules\.bin\eslint.CMD .
.\node_modules\.bin\vite.CMD build
```

## Script oral

1. Présenter l'architecture NestJS/Fastify validée par l'enseignant.
2. Montrer Swagger et les modules disponibles.
3. Montrer le client web : login, création d'un service payant.
4. Changer d'utilisateur et accepter le service.
5. Signer le contrat avec les deux parties.
6. Clôturer le contrat et montrer le transfert de points.
7. Montrer les endpoints supplémentaires : événements, votes, documents, messagerie, RGPD.
8. Expliquer le reste à faire : JavaFX, intégrations Keycloak/Neo4j/MinIO, tests d'intégration.
