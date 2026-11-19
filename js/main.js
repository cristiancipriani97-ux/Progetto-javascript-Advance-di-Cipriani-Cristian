// Punto di ingresso: assembla le parti (composition root) e coordina le azioni.

import { createHttpClient } from "./api/http.js";
import { HackerNewsRepository } from "./api/hackerNewsRepository.js";
import { createStore } from "./store/store.js";
import { createSafeStorage } from "./store/storage.js";
import { createFavoritesService } from "./store/favorites.js";
import { createView } from "./ui/view.js";
import { getPage } from "./utils/pagination.js";
import { debounce } from "./utils/format.js";
import { isAbortError } from "./utils/errors.js";

const HN_BASE_URL = "https://hacker-news.firebaseio.com/v0";
const SEARCH_BASE_URL = "https://hn.algolia.com/api/v1";
const PAGE_SIZE = 15;
const SEARCH_DEBOUNCE_MS = 400;
const THEME_KEY = "tongue-tech:theme";

/* ---------- Dipendenze ---------- */

function getLocalStorage() {
  try {
    return window.localStorage;
  } catch {
    return null; // accesso bloccato (es. modalità privata)
  }
}

const storage = createSafeStorage(getLocalStorage());
const favorites = createFavoritesService(storage);
const repository = new HackerNewsRepository({
  hnClient: createHttpClient(HN_BASE_URL),
  searchClient: createHttpClient(SEARCH_BASE_URL),
});

const prefersDark = window.matchMedia?.("(prefers-color-scheme: dark)").matches;

const store = createStore({
  section: "top", // "top" | "new" | "best" | "favorites"
  query: "",
  ids: [],
  offset: 0,
  stories: [],
  favorites: favorites.list(),
  loading: false,
  status: null, // { type, message, retryable? }
  theme: storage.get(THEME_KEY, null) ?? (prefersDark ? "dark" : "light"),
});

/* ---------- Gestione richieste ---------- */

let controller = null;
let retryAction = null;

/** Annulla la richiesta precedente (evita risposte "vecchie" che arrivano dopo) e ne avvia una nuova. */
function beginRequest() {
  controller?.abort();
  controller = new AbortController();
  return controller.signal;
}

async function guarded(signal, task, errorMessage, retry) {
  try {
    await task();
  } catch (err) {
    if (signal.aborted || isAbortError(err)) return;
    retryAction = retry;
    store.setState({ loading: false, status: { type: "error", message: errorMessage, retryable: true } });
  }
}

async function fetchNextPage(signal) {
  const { ids, offset } = store.getState();
  const { items, nextOffset } = getPage(ids, offset, PAGE_SIZE);
  const stories = await repository.getStories(items, { signal });
  if (signal.aborted) return;
  store.setState((s) => ({ stories: [...s.stories, ...stories], offset: nextOffset, loading: false, status: null }));
}

/* ---------- Azioni ---------- */

function selectSection(section) {
  const signal = beginRequest();
  store.setState({
    section,
    query: "",
    ids: [],
    offset: 0,
    stories: [],
    status: null,
    loading: section !== "favorites",
  });
  if (section === "favorites") return;

  return guarded(
    signal,
    async () => {
      const ids = await repository.getStoryIds(section, { signal });
      if (signal.aborted) return;
      store.setState({ ids });
      await fetchNextPage(signal);
    },
    "Impossibile caricare le notizie. Controlla la connessione.",
    () => selectSection(section)
  );
}

function loadMore() {
  if (store.getState().loading) return;
  const signal = beginRequest();
  store.setState({ loading: true, status: null });
  return guarded(signal, () => fetchNextPage(signal), "Errore nel caricare altre notizie.", loadMore);
}

function search(rawQuery) {
  const query = rawQuery.trim();
  const { section } = store.getState();

  if (section === "favorites") {
    store.setState({ query }); // filtro locale
    return;
  }
  if (!query) return selectSection(section);

  const signal = beginRequest();
  store.setState({ query, ids: [], offset: 0, stories: [], status: null, loading: true });

  return guarded(
    signal,
    async () => {
      const results = await repository.search(query, { signal });
      if (signal.aborted) return;
      store.setState({
        stories: results,
        loading: false,
        status: {
          type: "info",
          message: results.length ? `${results.length} risultati per “${query}”` : `Nessun risultato per “${query}”.`,
        },
      });
    },
    "Ricerca non riuscita.",
    () => search(query)
  );
}

function toggleFavorite(id) {
  const { stories, favorites: saved } = store.getState();
  const story = [...stories, ...saved].find((s) => s.id === id);
  if (!story) return;
  store.setState({ favorites: favorites.toggle(story) });
}

function toggleTheme() {
  const next = store.getState().theme === "dark" ? "light" : "dark";
  storage.set(THEME_KEY, next);
  store.setState({ theme: next });
}

/* ---------- Avvio ---------- */

const view = createView(document, {
  onSelectSection: selectSection,
  onLoadMore: loadMore,
  onSearchInput: debounce(search, SEARCH_DEBOUNCE_MS),
  onSearchSubmit: search,
  onToggleFavorite: toggleFavorite,
  onToggleTheme: toggleTheme,
  onRetry: () => retryAction?.(),
});

store.subscribe((state) => view.render(state));
view.render(store.getState());
selectSection("top");
