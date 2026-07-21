# Cible sociale et messagerie

## Statut du document

Ce document décrit la cible produit illustrée par les maquettes statiques. Il ne signifie pas que les modèles, endpoints, échanges en direct ou fichiers multimédias sont déjà disponibles dans les applications.

## Principes produit

- Un habitant découvre en priorité les profils publics de son quartier.
- Un profil public ne contient ni adresse exacte, ni e-mail, ni téléphone, ni solde de points, ni contrat, ni message privé.
- Suivre un voisin permet de retrouver plus facilement son activité publique. Ce lien ne donne aucun accès supplémentaire aux données privées.
- Une conversation directe est séparée d’une conversation de service ou d’événement.
- Le blocage empêche les nouveaux échanges selon les règles de confidentialité.
- Le signalement est une demande de modération, distincte du blocage local.

## Modèles proposés

### PublicUserProfile

- userId
- displayName
- avatar
- bio
- skills
- neighborhoodName
- reputationScore
- completedServicesCount
- followersCount
- followingCount
- messagingPrivacy

### Follow

- followerId
- followedId
- createdAt
- contrainte unique sur followerId et followedId

Un utilisateur ne peut pas se suivre lui-même. Le blocage rend le suivi inactif et empêche sa recréation tant que le blocage existe.

### Conversation

- id
- type : direct, service ou event
- participantIds
- serviceId optionnel
- eventId optionnel
- contractId optionnel
- lastMessageAt
- unreadCounts

Une conversation directe associe deux habitants. Une conversation de service conserve le contexte métier sans exposer le contrat à un tiers. Une conversation d’événement ne contient pas de contrat.

### Message

- id
- conversationId
- senderId
- type : text, image, document, audio ou system
- content
- attachments
- replyToId optionnel
- readBy
- createdAt

Les messages système sont produits par les changements métier autorisés : candidature envoyée, candidature acceptée, contrat généré, signature, réalisation et transfert de points.

## Endpoints cibles

- GET /api/users/discover
- GET /api/users/:id/public
- POST /api/users/:id/follow
- DELETE /api/users/:id/follow
- GET /api/users/me/followers
- GET /api/users/me/following
- GET /api/conversations
- POST /api/conversations/direct/:userId
- GET /api/conversations/:id/messages
- POST /api/conversations/:id/messages
- POST /api/users/:id/block
- POST /api/users/:id/report

Les réponses de découverte et de profil public doivent être explicitement projetées côté API afin de ne jamais sérialiser les champs privés du modèle utilisateur.

## Confidentialité

Réglages prévus :

- qui peut m’envoyer un message ;
- visibilité du statut en ligne ;
- visibilité de l’activité publique ;
- visibilité de la distance approximative : même quartier, tranche de distance ou masquée ;
- activation ou désactivation du profil public ;
- liste des profils bloqués ;
- signalement d’un profil ou d’une conversation.

Le profil personnel reste en lecture par défaut et passe en édition uniquement après une action volontaire. Le profil public est un modèle de présentation séparé.

Les distances affichées sont calculées depuis une localisation approximative et rendues sous forme de tranche ou de proximité. Aucune adresse personnelle exacte n’est exposée dans la découverte, un profil public ou une liste de services. L’adresse exacte d’une prestation ne peut être partagée qu’avec les participants autorisés, au moment approprié du workflow.

Un compte bloqué disparaît des suggestions et des recherches ordinaires. Le blocage supprime les abonnements mutuels, empêche les nouveaux messages et masque l’activité publique. Un déblocage ne recrée jamais automatiquement une relation de suivi.

## RGPD et cycle de vie des données

L’export personnel devra inclure, lorsqu’ils sont rattachables à l’utilisateur :

- abonnements et abonnés ;
- comptes bloqués ;
- conversations et participants ;
- messages ;
- pièces jointes et métadonnées associées ;
- accusés de lecture ;
- préférences de présence, de messagerie, d’activité publique et de distance ;
- signalements envoyés et leur état communicable.

La suppression du compte est une demande sensible précédée d’une confirmation renforcée. Les données non soumises à une obligation de conservation sont supprimées ou anonymisées. Les messages conservés dans une conversation deviennent attribués à un compte anonymisé, sans profil public ni coordonnées. Les pièces jointes suivent la même politique de suppression ou de conservation justifiée. Les blocages, préférences et données de présence sont supprimés avec le compte.

La désactivation du profil public retire le profil de la découverte et masque l’activité publique sans supprimer le compte ni ses obligations contractuelles.

## Contraintes d’intégrité et d’autorisation

- un utilisateur ne peut jamais se suivre lui-même ;
- la relation Follow est unique pour un couple `followerId + followedId` ;
- le blocage est prioritaire sur Follow, découverte, présence et Message ;
- une conversation directe est unique par paire non ordonnée de participants dans la stratégie P0 ;
- une conversation de service ou d’événement reste distincte d’une conversation directe ;
- toute découverte vérifie l’appartenance au quartier et la visibilité du profil ;
- tout envoi de message vérifie le blocage, le quartier lorsque requis et les préférences de messagerie du destinataire ;
- les profils publics utilisent une projection explicite qui exclut coordonnées, points, contrats, messages et données RGPD ;
- les accusés de lecture ne sont exposés qu’aux participants autorisés de la conversation.

## Vérification renforcée

Les maquettes décrivent une confirmation par code à 6 chiffres, renvoi de code et code de récupération pour la connexion, la signature d’un contrat, la modification des identifiants et la demande de suppression. Ce parcours est une cible visuelle et ne signifie pas que l’API actuelle fournit déjà une authentification multifacteur.

## Choix techniques progressifs

MongoDB peut porter la première version des profils publics, suivis, conversations et messages. Une relation FOLLOWS pourra ensuite être synchronisée dans Neo4j pour alimenter les recommandations.

Socket.IO, la présence réellement mise à jour, le stockage des pièces jointes et les messages vocaux sont des évolutions. Les maquettes montrent leur emplacement produit, pas une disponibilité actuelle.

## Priorités

### P0

- connexion corrigée ;
- profil public ;
- découverte des voisins ;
- suivre et se désabonner ;
- conversations directes ;
- conversations de service ;
- sélection de conversation fonctionnelle ;
- interface mobile liste ou conversation.

### P1

- compteurs non lus ;
- blocage ;
- signalement ;
- pièces jointes ;
- notifications de suivi.

### P2

- échanges via Socket.IO ;
- présence réellement mise à jour ;
- messages vocaux ;
- recommandations issues du graphe social ;
- synchronisation sociale avancée.
