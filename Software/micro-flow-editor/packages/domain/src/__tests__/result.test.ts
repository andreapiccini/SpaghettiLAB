import { describe, expect, it } from "vitest";
import { err, ok } from "../result.js";

describe("Result", () => {
  it("ok() carries a value and no error branch", () => {
    const result = ok(42);
    expect(result).toEqual({ ok: true, value: 42 });
  });

  it("err() carries an error and no value branch", () => {
    const result = err("boom");
    expect(result).toEqual({ ok: false, error: "boom" });
  });
});
