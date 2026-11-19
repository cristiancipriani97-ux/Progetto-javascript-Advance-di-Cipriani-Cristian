/** Storie da mostrare: nei preferiti si filtra in locale per titolo, altrove si usano quelle caricate. */
export function getVisibleStories(state) {
  if (state.section !== "favorites") return state.stories;
  const q = state.query.trim().toLowerCase();
  if (!q) return state.favorites;
  return state.favorites.filter((story) => story.title.toLowerCase().includes(q));
}

/** Il pulsante "Carica altre" ha senso solo per le sezioni paginate e senza ricerca attiva. */
export function hasMore(state) {
  return state.section !== "favorites" && !state.query && state.offset < state.ids.length;
}
