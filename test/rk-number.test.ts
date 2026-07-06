import { describe, expect, it } from "vitest";
import { decodeRk } from "../src/biff/rk-number";

// RK layout: bit0 = "divide by 100", bit1 = "is a 30-bit integer" (else the top
// bits of an IEEE double). Values below mirror what a real file stores.
describe("decodeRk", () => {
  it("decodes a positive integer (bit1 set)", () => {
    expect(decodeRk((100 << 2) | 0x02)).toBe(100);
  });

  it("decodes a negative integer with sign extension", () => {
    // -5 in the top 30 bits, unsigned 32-bit as read from the file.
    expect(decodeRk(0xffffffee)).toBe(-5);
  });

  it("applies the /100 flag to an integer", () => {
    expect(decodeRk((110 << 2) | 0x03)).toBeCloseTo(1.1, 10);
  });

  it("decodes a double stored in the high 30 bits", () => {
    // 1.25 = 0x3FF4000000000000; only the high word is stored.
    expect(decodeRk(0x3ff40000)).toBe(1.25);
  });
});
