# Identifiants pour la connexion (Mode Fake Data)

En mode fake data, **n'importe quels identifiants** peuvent être utilisés pour se connecter. Voici des exemples d'identifiants recommandés :

## 🔐 Identifiants par défaut

### Administrateur
- **Email:** `admin@example.com`
- **Mot de passe:** `admin123` (ou n'importe quel mot de passe de 5+ caractères)
- **Rôle:** Administrateur

### Commercial
- **Email:** `commercial@example.com`
- **Mot de passe:** `commercial123` (ou n'importe quel mot de passe de 5+ caractères)
- **Rôle:** Commercial

### Comptable
- **Email:** `comptable@example.com`
- **Mot de passe:** `comptable123` (ou n'importe quel mot de passe de 5+ caractères)
- **Rôle:** Comptable

### Gérant
- **Email:** `gerant@example.com`
- **Mot de passe:** `gerant123` (ou n'importe quel mot de passe de 5+ caractères)
- **Rôle:** Gerant

## 📝 Notes importantes

1. **Validation minimale:** Le formulaire de connexion nécessite :
   - Un email valide (doit contenir @)
   - Un mot de passe d'au moins 5 caractères

2. **N'importe quels identifiants fonctionnent:** En mode fake data, vous pouvez utiliser n'importe quel email et n'importe quel mot de passe de 5+ caractères.

3. **Rôle automatique:** Le rôle est déterminé automatiquement selon l'email :
   - Email contenant "commercial" → Rôle Commercial
   - Email contenant "comptable" → Rôle Comptable
   - Email contenant "gerant" → Rôle Gerant
   - Sinon → Rôle Administrateur (par défaut)

## ✅ Exemples d'identifiants valides

Tous ces exemples fonctionnent :

- Email: `test@test.com` / Mot de passe: `12345`
- Email: `user@example.com` / Mot de passe: `password`
- Email: `admin@clinique.com` / Mot de passe: `admin123`
- Email: `commercial1@example.com` / Mot de passe: `test123`
- Email: `mon-email@gmail.com` / Mot de passe: `monpass`

**Important:** Le mot de passe doit contenir au moins 5 caractères pour valider le formulaire.
