import { describe, it, expect } from "vitest";
import { normalizeHnItem, normalizeAlgoliaHit } from "../js/api/normalizers.js";

describe("normalizeHnItem", () => {
  it("converte una storia nel modello interno", () => {
    const item = { id: 1, type: "story", title: "Ciao", url: "https://a.it", by: "ugo", score: 10, time: 5, descendants: 3 };
    expect(normalizeHnItem(item)).toEqual({
      id: 1,
      title: "Ciao",
      url: "https://a.it",
      author: "ugo",
      score: 10,
      time: 5,
      commentsCount: 3,
    });
  });
  it("applica valori di default ai campi mancanti", () => {
    const story = normalizeHnItem({ id: 2, type: "story", title: "Ask HN" });
    expect(story.url).toBeNull();
    expect(story.score).toBe(0);
    expect(story.commentsCount).toBe(0);
  });
  it("scarta job, eliminati, morti e senza titolo", () => {
    expect(normalizeHnItem({ id: 1, type: "job", title: "x" })).toBeNull();
    expect(normalizeHnItem({ id: 1, type: "story", title: "x", deleted: true })).toBeNull();
    expect(normalizeHnItem({ id: 1, type: "story", title: "x", dead: true })).toBeNull();
    expect(normalizeHnItem({ id: 1, type: "story" })).toBeNull();
    expect(normalizeHnItem(null)).toBeNull();
  });
});

describe("normalizeAlgoliaHit", () => {
  it("converte un risultato Algolia", () => {
    const hit = { objectID: "42", title: "Rust", url: null, author: "ann", points: 7, created_at_i: 9, num_comments: 2 };
    expect(normalizeAlgoliaHit(hit)).toEqual({
      id: 42,
      title: "Rust",
      url: null,
      author: "ann",
      score: 7,
      time: 9,
      commentsCount: 2,
    });
  });
  it("scarta risultati senza titolo o con id non numerico", () => {
    expect(normalizeAlgoliaHit({ objectID: "1" })).toBeNull();
    expect(normalizeAlgoliaHit({ objectID: "abc", title: "x" })).toBeNull();
  });
});
