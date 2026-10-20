/*
 * ═══════════════════════════════════════════════════════════
 *   Hashage des mots de passe — Drive-Path
 *
 *   Centralise la logique de hashage précédemment dupliquée
 *   dans app/api/auth/register, login et reset-password.
 *
 *   ⚠️  SERVEUR UNIQUEMENT — utilise le module Node `crypto` et le
 *   package `argon2` (bindings natifs, runtime Node.js — pas edge).
 *   Ne jamais importer depuis un composant client (voir lib/auth/index.ts
 *   pour l'équivalent client basé sur Web Crypto, distinct de ce module).
 *
 *   ÉTAT DE LA MIGRATION (étape 2/N) :
 *   - hashPassword()       — ancien SHA-256 "dp2024:" — TOUJOURS utilisé
 *     par les routes actuellement (register/login/reset-password).
 *     Conservé tel quel pour ne rien casser.
 *   - hashPasswordArgon2() — nouveau hash Argon2id — prêt mais PAS ENCORE
 *     appelé par aucune route à cette étape.
 *   - verifyPassword()     — reconnaît automatiquement le format du hash
 *     stocké (Argon2id vs SHA-256 legacy) — prêt mais PAS ENCORE appelé.
 *   Aucun comportement d'authentification n'est modifié par ce fichier
 *   tant que les routes ne sont pas migrées vers verifyPassword()/
 *   hashPasswordArgon2() lors d'une prochaine étape.
 * ═══════════════════════════════════════════════════════════
 */

import { createHash } from "crypto";
import { hash as argon2Hash, verify as argon2Verify, argon2id } from "argon2";

/**
 * Hash SHA-256 côté serveur — identique à hashPassword() dans lib/auth/index.ts.
 * ⚠️  LEGACY — conservé uniquement pour les hash déjà stockés dans Neon et
 * pour ne pas casser les routes tant qu'elles ne sont pas migrées.
 * Ne pas utiliser pour créer de nouveaux hash — préférer hashPasswordArgon2().
 */
export function hashPassword(password: string): string {
  return createHash("sha256").update(`dp2024:${password}`).digest("hex");
}

/**
 * Hash Argon2id — nouvel algorithme cible de la migration (OWASP-recommandé).
 * Type explicitement forcé à Argon2id (ni Argon2i, ni Argon2d).
 *
 * Le hash retourné est auto-descriptif (préfixe "$argon2id$..."), ce qui
 * permet à verifyPassword()/isLegacyPasswordHash() de le distinguer d'un
 * hash SHA-256 legacy sans colonne supplémentaire.
 *
 * ⚠️  Pas encore appelée par aucune route à cette étape.
 */
export async function hashPasswordArgon2(password: string): Promise<string> {
  return argon2Hash(password, { type: argon2id });
}

/**
 * Indique si un hash stocké est encore l'ancien format SHA-256 legacy
 * (par opposition à un hash Argon2id auto-descriptif, préfixé "$argon2").
 */
export function isLegacyPasswordHash(storedHash: string): boolean {
  return !storedHash.startsWith("$argon2");
}

/**
 * Vérifie un mot de passe contre un hash stocké, quel que soit son format :
 *   - hash Argon2id ("$argon2...")   → argon2.verify()
 *   - hash legacy (hex SHA-256)      → recalcul via hashPassword() + comparaison
 *
 * Permet aux comptes existants (hash SHA-256) de continuer à s'authentifier
 * pendant que les nouveaux comptes / mots de passe migrés utilisent Argon2id.
 *
 * ⚠️  Pas encore appelée par aucune route à cette étape.
 */
export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  if (isLegacyPasswordHash(storedHash)) {
    return hashPassword(password) === storedHash;
  }
  return argon2Verify(storedHash, password);
}

/**
 * Hash Argon2id factice, utilisé quand l'email de connexion est inconnu.
 *
 * Calculé UNE fois (pas à chaque requête) avec les paramètres par défaut
 * de hashPasswordArgon2() — m=65536, t=3, p=4 — à partir d'un secret
 * aléatoire de 32 octets aussitôt jeté : aucun mot de passe connu ne lui
 * correspond. Ce n'est pas un secret. Si les paramètres de
 * hashPasswordArgon2() changent, régénérer cette constante avec :
 *   node -e "require('argon2').hash(require('crypto').randomBytes(32).toString('base64'),{type:2}).then(console.log)"
 */
const DUMMY_ARGON2_HASH =
  "$argon2id$v=19$m=65536,p=4,t=3$hEnS+0PA3Vj62YCwdVQJcQ$bNW9ZlpWVngopVZxGBiWx422RnzGOmljtFfL3c/ou3U";

/**
 * Vérification Argon2id factice pour un email inconnu : coûte le même
 * calcul qu'une vraie vérification Argon2id, afin que le temps de
 * réponse ne révèle pas si le compte existe. Retourne toujours false.
 */
export async function verifyDummyPassword(password: string): Promise<false> {
  await argon2Verify(DUMMY_ARGON2_HASH, password).catch(() => false);
  return false;
}
