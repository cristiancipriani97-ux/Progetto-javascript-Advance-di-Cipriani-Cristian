import { describe, it, expect } from "vitest";
import { createStore } from "../js/store/store.js";
import { createSafeStorage } from "../js/store/storage.js";
import { createFavoritesService } from "../js/store/favorites.js";
import { getVisibleStories, hasMore } from "../js/store/selectors.js";

function memoryBackend(initial = {}) {
  const data = new Map(Object.entries(initial));
  return {
    getItem: (key) => (data.has(key) ? data.get(key) : null),
    setItem: (key, value) => data.set(key, value),
  };
}

describe("createStore (Observer)", () => {
  it("unisce lo stato parziale e notifica gli iscritti", () => {
    const store = createStore({ a: 1, b: 2 });
    const seen = [];
    store.subscribe((state) => seen.push(state));

    store.setState({ b: 3 });
    expect(store.getState()).toEqual({ a: 1, b: 3 });
    expect(seen).toHaveLength(1);
  });

  it("accetta una funzione che riceve lo stato corrente", () => {
    const store = createStore({ n: 1 });
    store.setState((s) => ({ n: s.n + 1 }));
    expect(store.getState().n).toBe(2);
  });

  it("smette di notificare dopo unsubscribe", () => {
    const store = createStore({ n: 0 });
    let count = 0;
    const unsubscribe = store.subscribe(() => count++);
    store.setState({ n: 1 });
    unsubscribe();
    store.setState({ n: 2 });
    expect(count).toBe(1);
  });
});

describe("createSafeStorage", () => {
  it("legge e scrive JSON", () => {
    const storage = createSafeStorage(memoryBackend());
    expect(storage.set("k", { x: 1 })).toBe(true);
    expect(storage.get("k", null)).toEqual({ x: 1 });
  });
  it("restituisce il fallback se manca la chiave o il JSON è corrotto", () => {
    const storage = createSafeStorage(memoryBackend({ rotto: "{non json" }));
    expect(storage.get("assente", "def")).toBe("def");
    expect(storage.get("rotto", "def")).toBe("def");
  });
  it("non lancia errori se il backend è assente o lancia", () => {
    expect(createSafeStorage(null).get("k", 5)).toBe(5);
    expect(createSafeStorage(null).set("k", 1)).toBe(true);
    const throwing = {
      getItem() {
        throw new Error("bloccato");
      },
      setItem() {
        throw new Error("pieno");
      },
    };
    const storage = createSafeStorage(throwing);
    expect(storage.get("k", 9)).toBe(9);
    expect(storage.set("k", 1)).toBe(false);
  });
});

describe("createFavoritesService", () => {
  const a = { id: 1, title: "A" };
  const b = { id: 2, title: "B" };

  it("aggiunge in testa e rimuove con toggle", () => {
    const favorites = createFavoritesService(createSafeStorage(memoryBackend()));
    expect(favorites.toggle(a)).toEqual([a]);
    expect(favorites.toggle(b)).toEqual([b, a]);
    expect(favorites.has(1)).toBe(true);
    expect(favorites.toggle(a)).toEqual([b]);
    expect(favorites.has(1)).toBe(false);
  });

  it("persiste i dati tra istanze diverse", () => {
    const backend = memoryBackend();
    createFavoritesService(createSafeStorage(backend)).toggle(a);
    expect(createFavoritesService(createSafeStorage(backend)).list()).toEqual([a]);
  });

  it("ignora dati salvati con formato inatteso", () => {
    const backend = memoryBackend({ "tongue-tech:favorites": JSON.stringify({ non: "array" }) });
    expect(createFavoritesService(createSafeStorage(backend)).list()).toEqual([]);
  });
});

describe("selectors", () => {
  const base = { section: "top", query: "", ids: [1, 2, 3], offset: 1, stories: [{ id: 1, title: "x" }], favorites: [] };

  it("getVisibleStories usa le storie caricate nelle sezioni normali", () => {
    expect(getVisibleStories(base)).toEqual(base.stories);
  });

  it("getVisibleStories filtra i preferiti per titolo (senza distinguere maiuscole)", () => {
    const favorites = [
      { id: 1, title: "Rust in produzione" },
      { id: 2, title: "Novità JavaScript" },
    ];
    const state = { ...base, section: "favorites", favorites, query: "rust" };
    expect(getVisibleStories(state).map((s) => s.id)).toEqual([1]);
    expect(getVisibleStories({ ...state, query: "" })).toEqual(favorites);
  });

  it("hasMore è vero solo se ci sono altri ID, niente ricerca e non siamo nei preferiti", () => {
    expect(hasMore(base)).toBe(true);
    expect(hasMore({ ...base, offset: 3 })).toBe(false);
    expect(hasMore({ ...base, query: "rust" })).toBe(false);
    expect(hasMore({ ...base, section: "favorites" })).toBe(false);
  });
});
