import { describe, expect, it } from "vitest";
import { ByteReader } from "../src/byte-reader";
import { XlsError } from "../src/errors";

describe("ByteReader.skip / require bounds", () => {
  it("allows skipping within the buffer", () => {
    const reader = new ByteReader(Uint8Array.from([1, 2, 3, 4]));
    reader.skip(2);
    expect(reader.u8()).toBe(3);
  });

  it("throws XlsError when skip would pass the end of the buffer", () => {
    const reader = new ByteReader(Uint8Array.from([1, 2, 3]));
    expect(() => reader.skip(4)).toThrow(XlsError);
    expect(() => reader.skip(4)).toThrow(/Unexpected end of data/);
  });

  it("throws XlsError for a negative skip length", () => {
    const reader = new ByteReader(Uint8Array.from([1, 2, 3]));
    expect(() => reader.skip(-1)).toThrow(XlsError);
    expect(() => reader.skip(-1)).toThrow(/Invalid read length/);
  });

  it("throws XlsError for a non-integer skip length", () => {
    const reader = new ByteReader(Uint8Array.from([1, 2, 3]));
    expect(() => reader.skip(1.5)).toThrow(XlsError);
    expect(() => reader.skip(Number.NaN)).toThrow(XlsError);
  });
});
