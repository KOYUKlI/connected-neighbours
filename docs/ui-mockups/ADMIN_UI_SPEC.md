# Spécification UX/UI admin — Connected Neighbours

## Objectif

Refaire le back-office admin pour qu'il corresponde aux maquettes validées, pas à une simple réorganisation de l'interface actuelle.

L'interface actuelle ne correspond pas assez : elle garde un style trop compact, de gros boutons, une topbar différente, des tableaux mal calibrés et des pages détails/création qui ne reprennent pas la structure des maquettes.

## Références visuelles à suivre

Les images ci-dessous sont les références prioritaires. Elles doivent guider la structure, les tailles, les espacements et la hiérarchie visuelle.

1. `tableau_de_bord_administratif_moderne.png`  
   Référence globale du shell : sidebar, topbar, cartes, espacements, couleurs.

2. `tableau_de_gestion_des_quartiers.png`  
   Référence pour toutes les pages de liste : header, onglets, filtres, table, pagination.

3. `tableau_de_bord_quartier_centre_ville.png`  
   Référence pour les pages détail : résumé, onglets, stats, infos clés.

4. `tableau_de_bord_administration_de_quartier.png`  
   Référence pour création/modification d'un quartier : recherche de ville, formulaire, carte.

5. `tableau_de_bord_des_services_en_ligne.png`  
   Référence pour la page Services.

6. `tableau_de_gestion_des_contrats.png`  
   Référence pour la page Contrats.

7. `tableau_de_gestion_des_incidents.png`  
   Référence pour la page Incidents.

8. `tableau_de_bord_de_synchronisation_admin.png`  
   Référence pour la page Synchronisation.

9. `tableau_de_gestion_des_utilisateurs.png`  
   Référence pour la page Utilisateurs.

## Style global attendu

### Shell admin

- Sidebar fixe à gauche, largeur environ `260px`.
- Logo `CN` + `Connected Neighbours` en haut.
- Menu vertical avec icônes simples et libellés : Dashboard, Quartiers, Services, Contrats, Incidents, Synchronisation, Utilisateurs.
- Item actif avec fond bleu très clair et texte bleu.
- Topbar en haut du contenu : breadcrumb à gauche, icônes paramètres/notifications/profil à droite.
- Contenu principal sur fond gris très clair.
- Largeur de contenu confortable, avec padding régulier.
- Footer discret.

### Design system

- Fond page : gris très clair.
- Cartes : blanc, bordure fine, radius 14-16px, ombre légère.
- Titres : noir/navy, pas trop énormes.
- Textes secondaires : gris bleuté.
- Accent primaire : bleu.
- Badges : vert actif, gris archivé/brouillon, orange en cours, rouge incident/ouvert.
- Boutons : taille raisonnable, pas énormes, avec variantes primary / secondary / danger / ghost.
- Tables : lignes compactes, headers gris/bleutés, actions à droite, pagination propre.

## À ne pas faire

- Ne pas garder les boutons énormes actuels.
- Ne pas afficher les actions en blocs verticaux dans les tables.
- Ne pas créer des pages avec uniquement des grosses cartes vides.
- Ne pas mélanger liste + détail + formulaire + carte sur une seule page.
- Ne pas afficher d'identifiants MongoDB longs en premier niveau.
- Ne pas utiliser des titres redondants.
- Ne pas réintroduire `App.css`.

## Architecture de pages attendue

### Dashboard

Chemin logique : `DashboardPage`

Doit reprendre `tableau_de_bord_administratif_moderne.png` :

- Header `Dashboard` + description.
- Filtre période en haut à droite si simple.
- Grille de KPI : services, candidatures, contrats, incidents, alertes, clients synchronisés.
- Sections : Activités récentes, Services récents, Incidents récents.

### Quartiers — liste

Chemin logique : `NeighborhoodsListPage`

Doit reprendre `tableau_de_gestion_des_quartiers.png` :

- Header `Quartiers` + bouton `Ajouter un quartier`.
- Onglets : Tous / Actifs / Archivés avec compteurs.
- Toolbar : recherche, filtre ville/statut, date.
- Table : Nom, Ville, Code postal, Habitants, Services, Statut, Dernière mise à jour, Actions.
- Actions sur une seule ligne : Voir détail, Modifier, Archiver/Supprimer.
- Pagination.

### Quartiers — création

Chemin logique : `NeighborhoodCreatePage`

Doit reprendre `tableau_de_bord_administration_de_quartier.png` :

- Page séparée, pas dans la liste.
- Header `Créer un quartier`, boutons Annuler / Enregistrer.
- Bloc 1 : recherche ville/adresse.
- Bloc 2 : informations du quartier.
- Bloc 3 : carte géographique.
- Résumé d'auto-remplissage si résultat utilisé.

Recherche géographique :

- Champ de recherche.
- Recherche sur bouton et Entrée.
- Debounce pour activité de saisie : 500 à 700ms.
- Pas d'appel à chaque touche.
- Max 1 requête/seconde.
- Cache mémoire par query.
- Résultats avec bouton `Utiliser ce résultat`.
- Préremplissage des champs vides uniquement.
- Si Polygon/MultiPolygon disponible, proposer `Utiliser la zone détectée`.
- Sinon centrer la carte et laisser dessiner manuellement.

### Quartiers — détail

Chemin logique : `NeighborhoodDetailPage`

Doit reprendre `tableau_de_bord_quartier_centre_ville.png` :

- Page séparée.
- Header du quartier, boutons Modifier / Archiver / Retour liste.
- Bandeau résumé : Ville, Code postal, Statut, Date création, Créé par.
- Onglets : Vue d'ensemble / Carte / Membres / Statistiques / Historique.
- Vue d'ensemble : description, stats, infos clés.
- Carte : grande carte lisible avec polygone.
- Membres : table/liste lisible.
- Statistiques : cartes KPI.
- Historique : dates de création/modification.

### Services

Doit reprendre `tableau_de_bord_des_services_en_ligne.png` :

- Header `Services` + description + exporter.
- Onglets Tous / Brouillon / Actifs / Terminés.
- Toolbar : recherche, date, quartier, statut.
- Table compacte : Titre, Catégorie, Type, Quartier, Propriétaire, Points, Statut, Date de création, Actions.
- Pagination.

### Contrats

Doit reprendre `tableau_de_gestion_des_contrats.png` :

- Header `Contrats` + description.
- Onglets Tous / En attente / En cours / Terminés.
- Toolbar : recherche, période, statut.
- Table : Référence, Service, Demandeur, Prestataire, Quartier, Points, Signatures, Statut, Date, Actions.
- Pagination.

### Incidents

Doit reprendre `tableau_de_gestion_des_incidents.png` :

- Header `Incidents` + bouton Nouvel incident.
- Onglets Tous / Ouverts / En cours / Résolus avec compteurs.
- Toolbar : recherche, période, quartier, criticité.
- Table : Référence, Titre, Quartier, Catégorie, Priorité, Reporter, Statut, Date, Actions.
- Pagination.

### Synchronisation

Doit reprendre `tableau_de_bord_de_synchronisation_admin.png` :

- Header `Synchronisation` + bouton Lancer une synchronisation.
- KPI : Clients connectés, Dernière synchro, Échecs, Files en attente.
- Onglets Clients / Historique / Erreurs.
- Table clients JavaFX.
- Journal récent.
- Résumé files d'attente.

### Utilisateurs

Doit reprendre `tableau_de_gestion_des_utilisateurs.png` :

- Header `Utilisateurs` + bouton Ajouter un utilisateur.
- Onglets Tous / Habitants / Modérateurs / Administrateurs.
- Toolbar : recherche, date, rôle, quartier.
- Table : Nom, Email, Rôle, Quartier, Solde de points, Réservé, Statut, Date d'inscription, Actions.
- Pagination.

## Composants attendus

Dans `apps/admin-web/src/components` :

- `layout/AdminShell.tsx`
- `layout/AdminSidebar.tsx`
- `layout/AdminTopbar.tsx`
- `layout/Breadcrumb.tsx`
- `ui/PageHeader.tsx`
- `ui/Button.tsx`
- `ui/Card.tsx`
- `ui/Badge.tsx`
- `ui/Tabs.tsx`
- `ui/Toolbar.tsx`
- `ui/Table.tsx`
- `ui/Pagination.tsx`
- `ui/StatCard.tsx`
- `ui/EmptyState.tsx`
- `ui/Input.tsx`
- `ui/Select.tsx`

## Validation visuelle obligatoire

Avant de dire terminé, vérifier visuellement :

1. Admin Dashboard.
2. Admin Quartiers liste.
3. Admin Quartiers création.
4. Admin Quartiers détail / carte.
5. Admin Services.
6. Admin Contrats.
7. Admin Incidents.
8. Admin Synchronisation.
9. Admin Utilisateurs.

Si l'une de ces pages ne ressemble pas à la référence correspondante, ne pas considérer le lot terminé.

## Validation technique

À lancer :

```powershell
corepack pnpm@10.32.1 --filter "./apps/admin-web" run build
corepack pnpm@10.32.1 --filter "./apps/web" run build
corepack pnpm@10.32.1 --filter "./apps/api" run build
corepack pnpm@10.32.1 --filter "./apps/api" run test
corepack pnpm@10.32.1 --filter "./apps/api" run test:e2e
Get-ChildItem apps/web/src, apps/admin-web/src -Recurse -Filter *.css | Select-Object FullName
```

Résultat CSS attendu :

- `apps/web/src/index.css`
- `apps/admin-web/src/index.css`

Aucun `App.css`.
