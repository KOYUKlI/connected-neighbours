# Descriptif fonctionnel — Connected Neighbours

## 1) Présentation du projet
**Connected Neighbours** est une plateforme de quartier permettant aux habitants de :
- proposer et demander des services,
- sécuriser les échanges payants via un système de points et un **contrat obligatoire**,
- signer et archiver des documents **PDF**,
- participer à des événements,
- communiquer via une messagerie sécurisée,
- organiser des votes.

L’administration du quartier se fait via un site web (back office) et une application **JavaFX** capable de fonctionner **hors ligne** avec synchronisation.

---

## 2) Utilisateurs & rôles
- **Habitant** : utilise l’application au quotidien (services, contrats, documents, événements, messagerie, votes).
- **Modérateur** : modère les contenus/échanges, traite les signalements.
- **Administrateur** : configure le quartier, gère les incidents/alertes, consulte les statistiques (web admin + JavaFX).

---

## 3) Fonctionnalités principales

### 3.1 Quartier (zone géographique)
- Un quartier est défini par l’administrateur via une zone dessinée sur une carte.
- Un utilisateur appartient à un quartier selon sa localisation/adresse.
- Les contenus (services, événements, votes) sont visibles en priorité dans son quartier.

### 3.2 Services entre voisins
- Un habitant peut publier une **offre** ou une **demande** de service.
- Un service peut être **gratuit** ou **payant**.
- Un service contient au minimum : titre, description, catégorie, disponibilité, lieu (quartier), statut.

**Cycle de vie (V1)**
1. Publication d’une annonce
2. Réponse d’un voisin
3. Acceptation
4. Réalisation du service
5. Clôture (et avis optionnel)

### 3.3 Paiement par points + contrat obligatoire
- Si un service est **payant**, un **contrat est obligatoire**.
- Les points servent de monnaie interne.

**Règles de points (V1)**
- Le prix du service est exprimé en points (ex : 50 points).
- À l’acceptation : les points sont **réservés**.
- À la clôture : les points sont **transférés** au prestataire.
- En cas d’annulation : restitution des points selon l’état du contrat (avant/après signature).

**Contrat (workflow V1)**
- États : `Brouillon` → `Envoyé` → `Signé` → `En cours` → `Terminé` (ou `Annulé`)
- Contenu : parties, description du service, prix en points, dates, conditions, statut.

### 3.4 Documents & signatures PDF
- Import d’un PDF.
- Placement de zones de **signature** et/ou **initiales**.
- Signature par les personnes concernées.
- Archivage du document final avec un historique (qui a signé, quand).

### 3.5 Événements
- Création et participation à des événements du quartier.
- Indication d’intérêt (ex : “intéressé / pas intéressé”).
- Recommandations possibles selon les interactions passées (V1 simple).

### 3.6 Messagerie multimédia
- Messagerie sécurisée entre habitants (texte et médias si retenu).
- Présence en temps réel (en ligne / hors ligne).
- Objectif : faciliter l’organisation des services et événements.

### 3.7 Votes
- Création de votes “paramétrables” (question + options + durée).
- Participation et affichage des résultats selon les règles définies.

---

## 4) Règles de gestion importantes
- Un service **payant** ne peut pas être finalisé **sans contrat**.
- Les contenus sont filtrés par **quartier** (sauf administrateurs).
- Les actions sensibles (signature, modification d’identifiants) nécessitent une sécurité renforcée (détaillée dans la documentation technique).

---

## 5) Périmètre MVP (priorités)
Pour un MVP démontrable, les priorités sont :
- Authentification + rôles
- Services (gratuit/payant) + contrat + points
- Signature PDF (minimum fonctionnel)
- JavaFX admin offline + synchronisation (incidents/alertes + stats simples)

---

## 6) Cas d’usage (scénarios rapides)
1. **Service payant** : publication → acceptation → contrat → signature → réalisation → clôture → transfert de points.  
2. **Événement** : création → réponses des voisins → recommandations simples.  
3. **Admin offline** : création/consultation d’incidents sur JavaFX hors ligne → synchronisation au retour d’internet.