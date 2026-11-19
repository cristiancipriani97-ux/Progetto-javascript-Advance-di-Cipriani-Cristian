import { describe, it, expect } from "vitest";
import { getPage } from "../js/utils/pagination.js";

const ids = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

describe("getPage", () => {
  it("restituisce la prima pagina", () => {
    expect(getPage(ids, 0, 4)).toEqual({ items: [1, 2, 3, 4], nextOffset: 4, hasMore: true });
  });
  it("gestisce l'ultima pagina incompleta", () => {
    expect(getPage(ids, 8, 4)).toEqual({ items: [9, 10], nextOffset: 10, hasMore: false });
  });
  it("non supera la fine della lista", () => {
    expect(getPage(ids, 20, 4)).toEqual({ items: [], nextOffset: 20, hasMore: false });
  });
  it("funziona con lista vuota", () => {
    expect(getPage([], 0, 5)).toEqual({ items: [], nextOffset: 0, hasMore: false });
  });
});
