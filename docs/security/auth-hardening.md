# Durcissement de l'authentification — Drive-Path

Correctifs issus de l'audit d'authentification. Chaque section décrit le
comportement réellement présent dans le code.

---

## C1 — Limite de tentatives sur les codes de réinitialisation

**Statut : appliqué (code + base Neon).**

### Comportement

- Fichiers : `lib/otp-store.ts` (`verifyOTPCode`, `OTP_MAX_ATTEMPTS = 5`),
  `app/api/auth/verify-reset-code/route.ts`, `app/forgot-password/verify/page.tsx`.
- Chaque essai réserve d'abord sa place par un `UPDATE` atomique :
  `attempts = attempts + 1 WHERE used_at IS NULL AND expires_at > now() AND attempts < 5`.
  Des requêtes simultanées obtiennent donc au plus 5 comparaisons de hash par code.
- Code correct : consommé atomiquement (`used_at` posé seulement s'il était
  `NULL`) — une seule requête peut l'accepter. Le 5ᵉ essai est encore accepté
  s'il est correct.
- 5ᵉ essai incorrect : le code est invalidé (`used_at` posé) et l'API répond
  `{ ok: false, error: "locked" }`. La page affiche « Trop de tentatives.
  Demandez un nouveau code. »
- Le délai de 60 s entre deux envois de code est inchangé ; un nouveau code
  repart avec un compteur à 0.

### Base de données

La colonne `reset_tokens.attempts` a **déjà été ajoutée à la main dans Neon**.
Le SQL ci-dessous est conservé **pour référence uniquement — ne pas le
réexécuter** (il est idempotent, mais il n'y a aucune raison de le relancer) :

```sql
-- HISTORIQUE C1 — DÉJÀ APPLIQUÉ, NE PAS EXÉCUTER
ALTER TABLE reset_tokens ADD COLUMN IF NOT EXISTS attempts integer NOT NULL DEFAULT 0;
```

Il n'existe volontairement aucun fichier C1 dans `db/migrations/` : ce dossier
ne contient que des migrations à appliquer.

### Vérification

24 vérifications contrôlées exécutées contre Neon et la route réelle
(dont 30 essais simultanés → `attempts` = 5 exactement, et 10 bons codes
simultanés → un seul accepté).

---

## H1 — Limitation des tentatives de connexion

**Statut : code prêt ; migration `db/migrations/h1_login_attempts.sql` à
appliquer manuellement.** Tant qu'elle ne l'est pas, `POST /api/auth/login`
répond `500 server_error`.

### Politique

| Limite | Seuil | Fenêtre | Active |
|---|---|---|---|
| Par email normalisé (`trim` + minuscules) | 5 tentatives non réussies | 15 min | Toujours, compte existant ou non |
| Par IP | 20 tentatives non réussies | 15 min | Seulement si `AUTH_CLIENT_IP_SOURCE` est configurée (désactivée par défaut) |

### Fonctionnement (`lib/auth/login-rate-limit.ts`)

1. Après la validation du format, chaque tentative **réserve** une unité par
   clé avec un `INSERT … ON CONFLICT DO UPDATE … RETURNING` atomique.
   PostgreSQL verrouille la ligne : des requêtes simultanées reçoivent des
   valeurs successives, jamais plus de N tentatives vérifiées par fenêtre.
2. Ordre : IP (si configurée), puis email. Une IP bloquée n'incrémente pas le
   compteur de l'email visé.
3. `count` > seuil → **429** sans vérifier le mot de passe.
4. Email inconnu → vérification Argon2id factice (`verifyDummyPassword`,
   hash constant calculé une fois), puis `invalid_credentials`.
5. Connexion réussie → les unités réservées sont **rendues** (`count - 1`,
   seulement si la fenêtre n'a pas changé). Un succès ne compte jamais comme
   un échec et ne remet jamais un compteur à zéro.
6. Fenêtre fixe : elle commence à la première tentative et dure 15 min ; la
   tentative suivante après expiration remet le compteur à 1 dans la même
   instruction.

Conséquences : 4 échecs puis le bon mot de passe → connexion réussie (compteur
reste à 4). Après 5 échecs, toutes les tentatives — y compris avec le bon mot
de passe — sont refusées jusqu'à la fin de la fenêtre. Des tentatives **en
cours** comptent jusqu'à leur fin : 6 connexions correctes strictement
simultanées sur un même email peuvent en voir une refusée.

### Réponses de l'API

| Cas | Réponse |
|---|---|
| Format invalide | `400 { ok: false, error: "invalid_credentials" }` (inchangé) |
| Identifiants incorrects / email inconnu | `200 { ok: false, error: "invalid_credentials" }` (inchangé) |
| Limite atteinte (email ou IP, compte existant ou non) | `429 { ok: false, error: "too_many_attempts", retryAfter: <s> }` + en-tête `Retry-After: <s>` |
| Succès | `200 { ok: true, user }` + cookie `dp_session` (inchangé) |

`retryAfter` est calculé par la base (même horloge que `window_start`) et
borné entre 1 et 900 secondes. La page `/login` affiche « Trop de tentatives.
Réessayez dans X minutes. » (ou « dans moins d'une minute »).

### Stockage et nettoyage

- Table `login_attempts(key, count, window_start)` : une ligne par clé,
  réutilisée d'une fenêtre à l'autre.
- `key` = `email:` ou `ip:` + SHA-256 de la valeur normalisée. Aucun email ni
  aucune IP en clair. C'est une pseudonymisation : un email connu peut être
  retrouvé en recalculant son hash.
- Nettoyage : à 1 % des tentatives, suppression des lignes dont la fenêtre est
  écoulée (index `login_attempts_window_start_idx`). Une ligne expirée équivaut
  à une ligne absente, la purge ne change donc aucun résultat. Purge manuelle
  possible à tout moment :

  ```sql
  DELETE FROM login_attempts WHERE window_start < now() - interval '15 minutes';
  ```

### `AUTH_CLIENT_IP_SOURCE`

L'hébergement de Drive-Path n'est pas identifié : **la limitation par IP est
désactivée par défaut.** Next.js 16 ne fournit pas l'IP du client
(`NextRequest.ip` supprimé en v15) ; elle dépend de la plateforme.

| Valeur | Effet | À utiliser seulement si… |
|---|---|---|
| absente, `""`, `none` | Limitation IP désactivée | Hébergement inconnu, développement local |
| `x-real-ip` | Lit l'en-tête `X-Real-IP` | La plateforme **écrase** toujours cet en-tête (cas documenté de Vercel) |
| `xff:N` (1 ≤ N ≤ 10) | Lit la N-ième adresse **en partant de la droite** de `X-Forwarded-For` | Exactement N proxys de confiance ajoutent chacun une adresse (ex. `xff:1` derrière un seul nginx qui ajoute `$remote_addr`) |
| toute autre valeur | Désactivée + erreur journalisée une fois | — |

- L'adresse lue doit être une IPv4/IPv6 valide, sinon la limite IP est ignorée
  pour cette requête (la limite email reste active).
- IPv4 mappée (`::ffff:a.b.c.d`) → IPv4 ; IPv6 → regroupée par préfixe `/64`.
- Ne jamais configurer une valeur dont la plateforme ne garantit pas
  l'origine : un client pourrait alors changer d'« IP » à chaque requête, ou
  faire bloquer l'IP d'un tiers.

### Risques connus

- **Verrouillage par un tiers** : n'importe qui peut bloquer les connexions
  d'une adresse pendant 15 min en envoyant 5 mauvais mots de passe. Compromis
  assumé ; aucune atténuation (CAPTCHA, déblocage par email) n'est en place.
- **Sans limite IP** (configuration actuelle), un attaquant peut essayer 5 mots
  de passe par 15 min sur chacun d'un grand nombre d'emails (« password
  spraying »). La limite IP ne s'activera qu'avec une source d'IP fiable.
- **Temps de réponse** : la vérification factice rapproche les temps
  « email inconnu » et « mauvais mot de passe » sans les rendre identiques.
  Les comptes encore en SHA-256 hérité répondent plus vite jusqu'à leur
  prochaine connexion réussie (conversion en Argon2id).
- La table `login_attempts` doit exister : une erreur de base de données fait
  échouer la connexion (500) plutôt que de la laisser passer sans limite.

### À vérifier quand l'hébergement sera connu

1. Comment la plateforme transmet l'IP du client et quels en-têtes elle écrase.
2. Le nombre de proxys entre Internet et l'application.
3. Configurer `AUTH_CLIENT_IP_SOURCE` en conséquence, puis vérifier en
   production qu'un `X-Forwarded-For` / `X-Real-IP` forgé par le client n'est
   pas pris en compte.
