import { normalizeHnItem, normalizeAlgoliaHit } from "./normalizers.js";

export const SECTIONS = ["top", "new", "best"];

/**
 * DESIGN PATTERN: Repository (+ Dependency Injection).
 *
 * Problema risolto: la UI non deve sapere come e da dove arrivano le notizie
 * (endpoint, formati, cache, errori). Il repository espone metodi di dominio
 * (getStoryIds, getStories, search) e riceve i client HTTP dall'esterno:
 * nei test basta passare client finti, senza rete e senza Axios.
 */
export class HackerNewsRepository {
  #hn;
  #search;
  #idsCache = new Map();
  #itemCache = new Map();

  /**
   * @param {{hnClient: {get: Function}, searchClient: {get: Function}}} clients
   */
  constructor({ hnClient, searchClient }) {
    this.#hn = hnClient;
    this.#search = searchClient;
  }

  /** ID delle notizie di una sezione ("top" | "new" | "best"), con cache. */
  async getStoryIds(section, { signal, force = false } = {}) {
    if (!SECTIONS.includes(section)) throw new Error(`Sezione non valida: ${section}`);
    if (!force && this.#idsCache.has(section)) return this.#idsCache.get(section);

    const { data } = await this.#hn.get(`/${section}stories.json`, { signal });
    if (!Array.isArray(data)) throw new Error("Risposta non valida da Hacker News");

    this.#idsCache.set(section, data);
    return data;
  }

  async #getItem(id, signal) {
    if (this.#itemCache.has(id)) return this.#itemCache.get(id);
    const { data } = await this.#hn.get(`/item/${id}.json`, { signal });
    const story = normalizeHnItem(data);
    if (story) this.#itemCache.set(id, story);
    return story;
  }

  /**
   * Scarica più notizie in parallelo mantenendo l'ordine degli ID.
   * Con allSettled una richiesta fallita non blocca le altre; se falliscono
   * tutte, l'errore viene propagato.
   */
  async getStories(ids, { signal } = {}) {
    const results = await Promise.allSettled(ids.map((id) => this.#getItem(id, signal)));
    const failed = results.filter((r) => r.status === "rejected");
    if (ids.length > 0 && failed.length === results.length) throw failed[0].reason;

    return results.filter((r) => r.status === "fulfilled" && r.value).map((r) => r.value);
  }

  /** Ricerca full-text (Algolia), normalizzata nel modello interno. */
  async search(query, { signal } = {}) {
    const q = query.trim();
    if (!q) return [];
    const { data } = await this.#search.get("/search", {
      params: { tags: "story", hitsPerPage: 30, query: q },
      signal,
    });
    const hits = Array.isArray(data?.hits) ? data.hits : [];
    return hits.map(normalizeAlgoliaHit).filter(Boolean);
  }
}
