# Client web utilisateur — Étape 3

Le client web React permet maintenant de démontrer le parcours principal autour des services, contrats et points.

## Fonctionnalités disponibles

- Connexion locale de développement.
- Affichage de l'utilisateur connecté, rôle, points disponibles et points réservés.
- Création d'une offre ou demande de service.
- Création de services gratuits ou payants.
- Listing des services publiés.
- Acceptation d'un service publié par un autre utilisateur.
- Consultation des contrats de l'utilisateur.
- Signature d'un contrat.
- Clôture d'un contrat actif.
- Consultation des derniers mouvements de points.

## Parcours recommandé

1. Se connecter avec `alice@connected.local`.
2. Créer une offre payante.
3. Se déconnecter.
4. Se connecter avec `bob@connected.local`.
5. Accepter le service.
6. Signer le contrat.
7. Revenir avec `alice@connected.local`.
8. Signer le même contrat.
9. Clôturer le contrat.
10. Vérifier les mouvements de points.

## Limites V1

- L'interface web ne couvre pas encore les événements, votes, documents, messagerie et RGPD, même si les endpoints API existent.
- Les points affichés dans l'en-tête viennent du profil chargé à la connexion ; les transactions permettent de vérifier les mouvements.
- Le design est fonctionnel et démontrable, mais pas encore finalisé.
