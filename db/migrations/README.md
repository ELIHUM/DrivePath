# Migrations SQL manuelles — Drive-Path

Le schéma Neon a été créé avec `drizzle-kit push` : il n'existe ni dossier
`drizzle/` ni table `__drizzle_migrations`. **N'utilisez pas
`npm run db:migrate`** sur la base existante : sans historique, il tenterait
de recréer toutes les tables.

Les changements de schéma sont donc appliqués à la main, un fichier à la fois,
dans la console SQL Neon, après relecture.

## Règles

- Un fichier par correctif, nommé `<id>_<description>.sql`.
- SQL additif et idempotent (`IF NOT EXISTS`), jamais de `DROP` sur des
  données existantes.
- `lib/database/schema.ts` reste la référence : le SQL doit correspondre à
  `npx drizzle-kit export` (commande hors ligne, ne se connecte pas à Neon).
- Seuls les fichiers de ce dossier sont des migrations à appliquer.
  L'historique des changements déjà appliqués est dans
  [docs/security/auth-hardening.md](../../docs/security/auth-hardening.md),
  pas ici.

## État

| Fichier | Correctif | Statut |
|---|---|---|
| `h1_login_attempts.sql` | H1 — table `login_attempts` | **À appliquer** |
| — | C1 — colonne `reset_tokens.attempts` | Déjà appliquée à la main dans Neon (2026-10-19). Pas de fichier ici, voir la documentation. |
