# Audit visuel des maquettes web résident

Date : 21 juillet 2026
Périmètre : `docs/ui-mockups/web-resident/`

## Résumé

La passe couvre les douze maquettes produit et les états MFA, comptes bloqués et conversation de groupe. Toutes les pages ont été ouvertes et capturées en desktop et mobile. Les pages sensibles ont aussi été testées dans deux formats tablette.

La validation distingue volontairement : **ouverte**, **testée**, **capturée**, **corrigée** et **validée visuellement**. Une capture sans erreur technique n'est donc pas assimilée à un test interactif exhaustif.

## Matrice de validation

| Page | Ouverte | Testée | Capturée | Corrigée | Validée visuellement |
|---|---|---|---|---|---|
| 01 Connexion / inscription | Oui | Auth, inscription, MFA | Desktop, mobile, 2 tablettes | Oui | Oui |
| 02 Accueil | Oui | Navigation, notifications | Desktop, mobile | Oui, micro-passe | Ciblée |
| 03 Services | Oui | Onglets, filtres, distances | Desktop, mobile, 3 largeurs étroites | Oui, micro-passe | Ciblée approfondie |
| 04 Détail service | Oui | Onglets, candidatures, distance | Desktop, mobile, 3 largeurs étroites | Oui, micro-passe | Ciblée approfondie |
| 05 Publication service | Oui | Wizard gratuit/payant | Desktop, mobile | Non, smoke test | Vue d'ensemble |
| 06 Mes activités | Oui | Onglets et clavier | Desktop, mobile, 3 largeurs étroites | Oui, micro-passe | Ciblée approfondie |
| 07 Contrat / signature | Oui | États, signature, MFA, action persistante | Desktop, mobile | Oui | Oui |
| 08 Messages | Oui | Direct, service, groupe, multimédia | Desktop, mobile, 2 tablettes | Oui | Oui, approfondie |
| 09 Vie locale | Oui | Onglets, actions | Desktop, mobile | Non, smoke test | Vue d'ensemble |
| 10 Profil personnel | Oui | Confidentialité, blocage, MFA, onglets | Desktop, mobile, 3 largeurs étroites | Oui | Oui |
| 11 Voisins | Oui | Recherche, filtres, suivi | Desktop, mobile, 2 tablettes | Oui | Oui |
| 12 Profil public | Oui | Onglets, suivi, blocage | Desktop, mobile, 2 tablettes | Oui | Oui |

Un smoke test signifie : page chargée et capturée, sans erreur console/réseau ni débordement horizontal, avec contrôle de la structure générale. Il ne signifie pas que chaque action secondaire a été rejouée.

## Captures

Dossier : `review/screenshots/coherence-final/`

- `desktop/` : 12 captures en 1440 × 900 ;
- `mobile/` : 12 captures en 390 × 844 ;
- `tablet-1024/` : 4 captures en 1024 × 768 ;
- `tablet-768/` : 4 captures en 768 × 1024 ;
- `states/` : 7 captures (MFA connexion, MFA signature, comptes bloqués, Claire, Bob, groupe événement, conversation vide).

La micro-passe ajoute 'review/screenshots/micro-finish/' avec cinq captures strictement limitées au viewport : onglets Services, onglets Profil, navigation basse, action contractuelle et distance approximative.

Total de la collection finale référencée par cet audit : **44 captures**.

## Résultats fonctionnels

| Contrôle | Résultat |
|---|---|
| Connexion, inscription et MFA exclusifs | OK |
| MFA : erreur, renvoi, récupération, chargement, succès | OK |
| MFA de signature et actions sensibles du profil | OK |
| Recherche, filtres, suivi et désabonnement | OK |
| Blocage prioritaire sur Follow et Message | OK |
| Compte bloqué absent de la découverte | OK |
| Conversations directe, service, groupe et vide | OK |
| Header, contexte et messages mis à jour | OK |
| Pièces jointes et bascule microphone/envoi | OK |
| Retour mobile vers la liste | OK |
| Modales : focus piégé, Échap, clic extérieur | OK |
| Onglets au clavier | OK |

## MFA

Le parcours intervient après l'email et le mot de passe et montre : code à six chiffres, code invalide, renvoi, code de récupération, chargement et confirmation. Le composant est aussi réutilisé pour la signature, la modification des identifiants et la demande de suppression/anonymisation.

Il est explicitement présenté comme une **cible de maquette** : aucune prise en charge par l'API actuelle n'est affirmée.

## Social et confidentialité

- Louis Morel est retiré des suggestions et déplacé dans `Profil > Confidentialité > Comptes bloqués`.
- Le blocage supprime le suivi mutuel, interdit le message, masque l'activité publique et retire la personne de la découverte.
- Le déblocage ne restaure pas automatiquement l'abonnement.
- Le suivi est affiché `✓ Suivi`, avec l'action accessible `Se désabonner`.
- Les distances utilisent `Même quartier`, `À proximité` ou une tranche approximative.
- Les réglages couvrent profil public, activité publique, présence, messagerie et distance approximative.
- Le profil public n'expose aucune coordonnée, donnée RGPD, point privé, contrat ou message.

## Messagerie mobile

Les conversations personnelle, service et événement utilisent le même shell : header compact, contexte optionnel, zone flexible scrollable, compositeur compact en bas.

| État à 390 × 844 | Écart messages/compositeur | Compositeur | Position basse |
|---|---:|---:|---:|
| Claire, 3 messages | 14 px | 61 px | 844 px |
| Bob, service | 14 px | 61 px | 844 px |
| Conversation vide | 14 px | 61 px | 844 px |

Les messages courts restent juste au-dessus du compositeur ; l'espace disponible est placé au-dessus de la pile. Une conversation longue défile. La navigation générale et le footer disparaissent en conversation plein écran.

Le groupe événement affiche le nom, huit participants, plusieurs avatars et plusieurs auteurs. Le menu multimédia propose Photo, Appareil photo, Document et partage de service/événement. Le microphone est visible seulement lorsque le champ est vide.

## Accessibilité et responsive

Corrections vérifiées :

- contraste secondaire renforcé et focus visible ;
- libellés accessibles sur les actions iconographiques ;
- onglets ARIA et navigation clavier ;
- modales fermables par Échap avec focus piégé et restitué ;
- régions d'état MFA annoncées ;
- cibles tactiles d'au moins 44 × 44 px ;
- prise en compte de `env(safe-area-inset-bottom)` ;
- barre mobile Accueil / Services / Voisins / Messages / Menu, masquée dans le chat ;
- aucun débordement horizontal aux six résolutions.

Un audit WCAG outillé avec lecteur d'écran reste nécessaire avant une production réelle.

## Micro-passe mobile du 21 juillet

Les douze pages ont été rouvertes à 1440 × 900, 1024 × 768, 768 × 1024, 390 × 844, 360 × 800 et 320 × 700, soit 72 ouvertures de non-régression.

- La navigation principale est réellement fixée en bas : son rectangle mesuré va de 784 px à 844 px dans le viewport 390 × 844.
- Les anciennes captures pleine page pouvaient représenter un élément fixe près du haut ; les nouvelles captures utilisent le viewport réel sans extension de page.
- La navigation est absente dans une conversation mobile ouverte.
- Le contenu conserve un padding inférieur de 62 px, complété par env(safe-area-inset-bottom).
- Les onglets Services, Détail service, Mes activités et Profil ont été testés à 320, 360 et 390 px.
- Dans les douze cas, le dernier onglet est entièrement visible, sans ellipsis ni largeur interne tronquée.
- Les flèches clavier, les rôles ARIA et le recentrage automatique restent fonctionnels.
- Une ombre latérale indique les onglets hors champ sans laisser apparaître de fragment de libellé.
- Les distances visibles utilisent uniquement une proximité, une tranche ou le quartier.
- Sur le contrat, la barre persistante se termine à 778 px, au-dessus de la navigation qui commence à 784 px.
- Cette barre disparaît pendant le MFA, après signature et pour tout état ne demandant pas la signature.

## Cohérence métier

- avant réservation : Alice 100, Bob 125 ;
- après réservation : Alice 75 disponibles et 25 réservés, Bob 125 ;
- après validation : Alice 75 disponibles, 0 réservé, Bob 150.

Le contrat n'est actif qu'après deux signatures, les points sont transférés après validation et un litige les gèle. Aucun identifiant technique, action administrateur ou contrôle de synchronisation desktop n'apparaît côté habitant.

## Contrôles techniques

- erreurs JavaScript : 0 ;
- erreurs réseau : 0 ;
- ressources manquantes : 0 ;
- liens locaux cassés détectés : 0 ;
- débordements horizontaux : 0 ;
- cibles tactiles insuffisantes détectées : 0.
- ouvertures de la micro-passe : 72 ;
- contrôles d'onglets étroits : 12 sur 12 validés.

## Finition des filtres Services du 21 juillet

La page Services a fait l'objet d'une validation ciblée à 320 × 700, 360 × 800, 390 × 844, 768 × 1024 et 1440 × 900.

- À 480 px et moins, la recherche occupe seule toute la largeur avec le libellé complet « Rechercher un service… ».
- Les filtres avancés sont regroupés dans une feuille basse ; seul le tri principal reste visible à côté du bouton Filtres.
- Le bouton annonce correctement le nombre de filtres actifs, par exemple Filtres (3).
- Les filtres actifs sont exposés sous forme de chips supprimables et le compteur reste sur une seule ligne.
- Les filtres Type, Distance et Date ont été combinés : un seul service correspondant est affiché.
- Une combinaison sans correspondance affiche l'état vide attendu.
- La feuille basse piège le focus, se ferme avec Échap, restitue le focus au déclencheur et utilise des cibles d'au moins 44 px.
- La feuille ne recouvre pas la navigation mobile basse et aucun débordement horizontal n'a été mesuré.
- Le header mobile des pages principales affiche le monogramme CN ; les pages secondaires utilisent une flèche Retour.
- Les six lettres ou symboles décoratifs des catégories ont été remplacés par des pictogrammes vectoriels locaux.

Captures associées dans review/screenshots/services-mobile-finish/ :

- 01_services_320_filtres_fermes.png ;
- 02_services_320_drawer_ouvert.png ;
- 03_services_390_filtres_actifs.png ;
- 04_services_1440_categories.png.

Résultat technique : 0 erreur JavaScript, 0 erreur réseau et 0 débordement horizontal aux cinq résolutions. La collection référencée par cet audit compte désormais **48 captures**.

## Limites

Restent des cibles non branchées : vérification MFA serveur, persistance sociale, conversations/messages, présence et transport temps réel, stockage de pièces jointes, enregistrement vocal, recommandations avancées, traitement serveur des signalements et de l'anonymisation.

Les contraintes d'autorisation, d'unicité et de confidentialité sont détaillées dans `SPEC_SOCIAL_MESSAGING.md`.

## Verdict

- **Validation visuelle approfondie** : 01, 07, 08, 10, 11 et 12.
- **Validation ciblée approfondie pendant la micro-passe** : 03, 04 et 06.
- **Smoke test visuel et technique** : 02, 05 et 09.
- **À refaire** : aucune page.
- **Bloquant connu** : aucun pour les maquettes statiques.
