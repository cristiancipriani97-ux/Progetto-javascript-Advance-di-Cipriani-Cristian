/**
 * DESIGN PATTERN: Observer (store reattivo minimale).
 *
 * Problema risolto: logica e UI non si conoscono. Il controller modifica lo stato,
 * la view si iscrive e si ridisegna a ogni cambiamento. Lo stato è unico e testabile.
 */
export function createStore(initialState) {
  let state = initialState;
  const listeners = new Set();

  return {
    getState: () => state,

    /** Accetta un oggetto parziale oppure una funzione (stato) => parziale. */
    setState(patch) {
      const partial = typeof patch === "function" ? patch(state) : patch;
      const previous = state;
      state = { ...state, ...partial };
      listeners.forEach((listener) => listener(state, previous));
    },

    /** Restituisce la funzione per annullare l'iscrizione. */
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}
