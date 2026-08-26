import { describe, expect, it } from "vitest";

import { parseTrackingToken } from "./orders";

describe("tracking token parsing", () => {
  const token = "7ycKzP3_n2S5vL8mQ1aB4cD6eF9gH0jK";

  it("accepts a high-entropy token or secure link", () => {
    expect(parseTrackingToken(token)).toBe(token);
    expect(parseTrackingToken(`https://kanay.example/track/${token}`)).toBe(token);
  });

  it("rejects enumerable order numbers and malformed values", () => {
    expect(parseTrackingToken("1042")).toBeNull();
    expect(parseTrackingToken("../../admin/orders")).toBeNull();
  });
});
