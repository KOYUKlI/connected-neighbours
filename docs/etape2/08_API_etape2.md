# API — Étape 2

## Modules disponibles

### Auth

| Méthode | Route | Description |
| --- | --- | --- |
| `POST` | `/api/auth/login` | Connexion locale de développement |
| `GET` | `/api/auth/me` | Profil utilisateur connecté |
| `GET` | `/api/auth/admin-only` | Démonstration de contrôle de rôle admin |

### Services

| Méthode | Route | Description |
| --- | --- | --- |
| `POST` | `/api/services` | Créer une annonce |
| `GET` | `/api/services` | Lister les annonces |
| `GET` | `/api/services/:id` | Consulter une annonce |
| `PATCH` | `/api/services/:id` | Modifier une annonce |
| `DELETE` | `/api/services/:id` | Supprimer une annonce |

### Contrats

| Méthode | Route | Description |
| --- | --- | --- |
| `POST` | `/api/contracts/services/:serviceId/accept` | Accepter un service, créer un contrat si payant |
| `GET` | `/api/contracts` | Lister mes contrats |
| `GET` | `/api/contracts/:id` | Consulter un contrat |
| `POST` | `/api/contracts/:id/sign` | Signer un contrat |
| `POST` | `/api/contracts/:id/complete` | Clôturer le contrat et transférer les points |

### Points

| Méthode | Route | Description |
| --- | --- | --- |
| `GET` | `/api/points/transactions` | Lister mes mouvements de points |

## Parcours métier démontrable

1. Un habitant publie une offre payante.
2. Un autre habitant accepte l'offre.
3. L'API crée un contrat `sent`.
4. L'API réserve les points du payeur.
5. Les deux parties signent.
6. Le contrat passe `active` et le service passe `in_progress`.
7. Une partie clôture le contrat.
8. L'API transfère les points réservés au prestataire.
9. Le contrat passe `completed` et le service passe `completed`.

## Comptes de démonstration

| Rôle | Email | Mot de passe |
| --- | --- | --- |
| Habitant | `resident@connected.local` | `resident123` |
| Habitant | `alice@connected.local` | `alice123` |
| Habitant | `bob@connected.local` | `bob123` |
| Modérateur | `moderator@connected.local` | `moderator123` |
| Admin | `admin@connected.local` | `admin123` |

Chaque utilisateur de démonstration démarre avec 100 points et 0 point réservé.
