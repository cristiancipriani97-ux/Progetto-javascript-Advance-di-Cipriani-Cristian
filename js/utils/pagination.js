/**
 * Restituisce la "pagina" di elementi che parte da `offset`.
 * - items: gli elementi della pagina
 * - nextOffset: da dove ripartire per la pagina successiva
 * - hasMore: true se esistono altri elementi dopo questa pagina
 */
export function getPage(items, offset, size) {
  const page = items.slice(offset, offset + size);
  const nextOffset = offset + page.length;
  return { items: page, nextOffset, hasMore: nextOffset < items.length };
}
