import { describe, it, expect } from "vitest";
import { isAbortError } from "../js/utils/errors.js";

describe("isAbortError", () => {
  it("riconosce gli annullamenti di fetch e Axios", () => {
    expect(isAbortError({ name: "AbortError" })).toBe(true);
    expect(isAbortError({ name: "CanceledError" })).toBe(true);
    expect(isAbortError({ code: "ERR_CANCELED" })).toBe(true);
  });
  it("non confonde altri errori", () => {
    expect(isAbortError(new Error("Network Error"))).toBe(false);
    expect(isAbortError(undefined)).toBe(false);
  });
});
