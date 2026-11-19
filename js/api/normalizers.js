// Le API esterne hanno formati diversi (Firebase vs Algolia). Qui li riduciamo
// a un unico modello interno, così la UI non conosce i dettagli delle API.
//
// Modello "story": { id, title, url, author, score, time, commentsCount }

/** Converte un item di Hacker News (Firebase). Restituisce null se non è una storia valida. */
export function normalizeHnItem(item) {
  if (!item || item.type !== "story" || item.deleted || item.dead || !item.title) return null;
  return {
    id: item.id,
    title: item.title,
    url: item.url ?? null,
    author: item.by ?? "",
    score: item.score ?? 0,
    time: item.time ?? 0,
    commentsCount: item.descendants ?? 0,
  };
}

/** Converte un risultato di ricerca Algolia. Restituisce null se non utilizzabile. */
export function normalizeAlgoliaHit(hit) {
  if (!hit || !hit.title) return null;
  const id = Number(hit.objectID);
  if (!Number.isFinite(id)) return null;
  return {
    id,
    title: hit.title,
    url: hit.url ?? null,
    author: hit.author ?? "",
    score: hit.points ?? 0,
    time: hit.created_at_i ?? 0,
    commentsCount: hit.num_comments ?? 0,
  };
}
