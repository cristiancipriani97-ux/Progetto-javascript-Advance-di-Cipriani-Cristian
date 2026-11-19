const FAVORITES_KEY = "tongue-tech:favorites";

/** Gestisce i preferiti persistendoli tramite lo storage ricevuto (iniettato). */
export function createFavoritesService(storage) {
  const list = () => {
    const value = storage.get(FAVORITES_KEY, []);
    return Array.isArray(value) ? value : [];
  };

  return {
    list,

    has: (id) => list().some((story) => story.id === id),

    /** Aggiunge (in testa) o rimuove la storia. Restituisce la nuova lista. */
    toggle(story) {
      const current = list();
      const next = current.some((s) => s.id === story.id)
        ? current.filter((s) => s.id !== story.id)
        : [story, ...current];
      storage.set(FAVORITES_KEY, next);
      return next;
    },
  };
}
