import { describe, it, expect } from "vitest";
import { HackerNewsRepository } from "../js/api/hackerNewsRepository.js";

/** Client HTTP finto: risponde da una mappa url -> dati (o Error) e registra le chiamate. */
function fakeClient(routes) {
  const calls = [];
  return {
    calls,
    async get(url, options) {
      calls.push({ url, options });
      const response = routes[url];
      if (response instanceof Error) throw response;
      if (response === undefined) throw new Error(`404 ${url}`);
      return { data: response };
    },
  };
}

const story = (id, extra = {}) => ({ id, type: "story", title: `Storia ${id}`, by: "u", score: 1, time: 1, ...extra });

describe("HackerNewsRepository.getStoryIds", () => {
  it("restituisce gli ID e li mette in cache", async () => {
    const hn = fakeClient({ "/topstories.json": [3, 2, 1] });
    const repo = new HackerNewsRepository({ hnClient: hn, searchClient: fakeClient({}) });

    expect(await repo.getStoryIds("top")).toEqual([3, 2, 1]);
    expect(await repo.getStoryIds("top")).toEqual([3, 2, 1]);
    expect(hn.calls).toHaveLength(1);
  });

  it("rifiuta sezioni non valide", async () => {
    const repo = new HackerNewsRepository({ hnClient: fakeClient({}), searchClient: fakeClient({}) });
    await expect(repo.getStoryIds("boh")).rejects.toThrow();
  });

  it("rifiuta risposte che non sono array", async () => {
    const hn = fakeClient({ "/newstories.json": { oops: true } });
    const repo = new HackerNewsRepository({ hnClient: hn, searchClient: fakeClient({}) });
    await expect(repo.getStoryIds("new")).rejects.toThrow();
  });
});

describe("HackerNewsRepository.getStories", () => {
  it("mantiene l'ordine e scarta job e richieste fallite", async () => {
    const hn = fakeClient({
      "/item/1.json": story(1),
      "/item/2.json": { id: 2, type: "job", title: "Lavoro" },
      "/item/3.json": new Error("timeout"),
      "/item/4.json": story(4),
    });
    const repo = new HackerNewsRepository({ hnClient: hn, searchClient: fakeClient({}) });

    const result = await repo.getStories([1, 2, 3, 4]);
    expect(result.map((s) => s.id)).toEqual([1, 4]);
  });

  it("propaga l'errore se falliscono tutte le richieste", async () => {
    const hn = fakeClient({ "/item/1.json": new Error("giù"), "/item/2.json": new Error("giù") });
    const repo = new HackerNewsRepository({ hnClient: hn, searchClient: fakeClient({}) });
    await expect(repo.getStories([1, 2])).rejects.toThrow();
  });

  it("non rifà la richiesta per storie già in cache", async () => {
    const hn = fakeClient({ "/item/1.json": story(1) });
    const repo = new HackerNewsRepository({ hnClient: hn, searchClient: fakeClient({}) });
    await repo.getStories([1]);
    await repo.getStories([1]);
    expect(hn.calls).toHaveLength(1);
  });

  it("restituisce lista vuota per input vuoto", async () => {
    const repo = new HackerNewsRepository({ hnClient: fakeClient({}), searchClient: fakeClient({}) });
    expect(await repo.getStories([])).toEqual([]);
  });
});

describe("HackerNewsRepository.search", () => {
  it("normalizza i risultati e invia i parametri corretti", async () => {
    const search = fakeClient({
      "/search": { hits: [{ objectID: "7", title: "Rust 2", author: "a", points: 5, num_comments: 1, created_at_i: 3 }, { objectID: "8" }] },
    });
    const repo = new HackerNewsRepository({ hnClient: fakeClient({}), searchClient: search });

    const results = await repo.search("  rust ");
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe(7);
    expect(search.calls[0].options.params.query).toBe("rust");
  });

  it("non chiama la rete con query vuota", async () => {
    const search = fakeClient({});
    const repo = new HackerNewsRepository({ hnClient: fakeClient({}), searchClient: search });
    expect(await repo.search("   ")).toEqual([]);
    expect(search.calls).toHaveLength(0);
  });
});
