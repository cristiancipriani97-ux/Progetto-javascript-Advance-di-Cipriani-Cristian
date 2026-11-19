import { describe, it, expect } from "vitest";
import {
  timeAgo,
  domainOf,
  pluralizeComments,
  debounce,
  domainInitial,
  hueFromString,
  isHot,
} from "../js/utils/format.js";

describe("domainInitial", () => {
  it("restituisce l'iniziale maiuscola o # se il dominio è vuoto", () => {
    expect(domainInitial("github.com")).toBe("G");
    expect(domainInitial("")).toBe("#");
  });
});

describe("hueFromString", () => {
  it("è deterministico e resta tra 0 e 359", () => {
    expect(hueFromString("github.com")).toBe(hueFromString("github.com"));
    for (const text of ["", "a", "nytimes.com", "un-dominio-molto-lungo.example.org"]) {
      const hue = hueFromString(text);
      expect(hue >= 0 && hue < 360).toBe(true);
    }
  });
});

describe("isHot", () => {
  it("è vero dalla soglia in su", () => {
    expect(isHot(199)).toBe(false);
    expect(isHot(200)).toBe(true);
    expect(isHot(1500)).toBe(true);
  });
});

const NOW = 1_700_000_000;

describe("timeAgo", () => {
  it("mostra 'adesso' sotto il minuto", () => {
    expect(timeAgo(NOW - 30, NOW)).toBe("adesso");
  });
  it("usa i minuti", () => {
    expect(timeAgo(NOW - 120, NOW)).toBe("2 minuti fa");
  });
  it("usa le ore", () => {
    expect(timeAgo(NOW - 3 * 3600, NOW)).toBe("3 ore fa");
  });
  it("usa i giorni", () => {
    expect(timeAgo(NOW - 86400, NOW)).toBe("ieri");
    expect(timeAgo(NOW - 3 * 86400, NOW)).toBe("3 giorni fa");
  });
});

describe("domainOf", () => {
  it("estrae il dominio senza www", () => {
    expect(domainOf("https://www.example.com/a?b=1")).toBe("example.com");
  });
  it("restituisce stringa vuota per URL non validi", () => {
    expect(domainOf("non è un url")).toBe("");
  });
});

describe("pluralizeComments", () => {
  it("gestisce singolare e plurale", () => {
    expect(pluralizeComments(0)).toBe("0 commenti");
    expect(pluralizeComments(1)).toBe("1 commento");
    expect(pluralizeComments(42)).toBe("42 commenti");
  });
});

describe("debounce", () => {
  it("esegue una sola volta con l'ultimo argomento", async () => {
    const calls = [];
    const fn = debounce((value) => calls.push(value), 20);
    fn("a");
    fn("b");
    fn("c");
    await new Promise((resolve) => setTimeout(resolve, 60));
    expect(calls).toEqual(["c"]);
  });
});
