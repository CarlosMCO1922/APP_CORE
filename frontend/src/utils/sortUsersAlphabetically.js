/**
 * Compara dois utilizadores/clientes por apelido e depois nome (locale pt, base ignora acentos/caso).
 */
export function compareUsersAlphabetically(a, b) {
  const ln = String(a?.lastName || '').localeCompare(String(b?.lastName || ''), 'pt', { sensitivity: 'base' });
  if (ln !== 0) return ln;
  return String(a?.firstName || '').localeCompare(String(b?.firstName || ''), 'pt', { sensitivity: 'base' });
}

export function sortUsersAlphabetically(users) {
  if (!Array.isArray(users)) return [];
  return [...users].sort(compareUsersAlphabetically);
}

/** Remove entradas repetidas com o mesmo id (mantém a primeira). */
export function dedupeUsersById(users) {
  if (!Array.isArray(users)) return [];
  const seen = new Set();
  return users.filter((u) => {
    if (!u || u.id == null) return false;
    if (seen.has(u.id)) return false;
    seen.add(u.id);
    return true;
  });
}

/** Lista pronta para selects: A–Z por apelido/nome e sem ids duplicados. */
export function sortUsersForSelect(users) {
  return sortUsersAlphabetically(dedupeUsersById(users));
}
