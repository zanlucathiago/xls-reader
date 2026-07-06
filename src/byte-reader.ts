import { XlsError } from "./errors";

// Little-endian cursor over a byte range. BIFF8 and the OLE2 container are both
// little-endian, so every multi-byte read here is LE. Bounds are checked so a
// truncated/corrupt file fails loudly instead of reading garbage.
export class ByteReader {
  private readonly view: DataView;
  private cursor: number;

  constructor(
    private readonly bytes: Uint8Array,
    start = 0,
  ) {
    this.view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    this.cursor = start;
  }

  get position(): number {
    return this.cursor;
  }

  set position(value: number) {
    this.cursor = value;
  }

  get remaining(): number {
    return this.bytes.length - this.cursor;
  }

  u8(): number {
    this.require(1);
    const value = this.view.getUint8(this.cursor);
    this.cursor += 1;
    return value;
  }

  u16(): number {
    this.require(2);
    const value = this.view.getUint16(this.cursor, true);
    this.cursor += 2;
    return value;
  }

  u32(): number {
    this.require(4);
    const value = this.view.getUint32(this.cursor, true);
    this.cursor += 4;
    return value;
  }

  f64(): number {
    this.require(8);
    const value = this.view.getFloat64(this.cursor, true);
    this.cursor += 8;
    return value;
  }

  // Returns a view (not a copy) over the next `length` bytes and advances.
  slice(length: number): Uint8Array {
    this.require(length);
    const view = this.bytes.subarray(this.cursor, this.cursor + length);
    this.cursor += length;
    return view;
  }

  skip(length: number): void {
    this.cursor += length;
  }

  private require(length: number): void {
    if (this.cursor + length > this.bytes.length) {
      throw new XlsError(
        `Unexpected end of data: needed ${length} byte(s) at offset ${this.cursor}, but only ${this.remaining} remain`,
      );
    }
  }
}
