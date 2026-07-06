import { XlsError } from "../errors";

// A cursor over the SST record and its CONTINUE spillovers, kept as separate
// chunks because BIFF8 has a subtle rule: a shared string's character array can
// be split at a record boundary, and each continuation begins with a fresh
// grbit byte that re-declares whether the *remaining* characters are wide
// (16-bit) or compressed (8-bit). Header fields (cch, flags, run/ext sizes)
// never split, so those reads may safely settle across chunks.
export class ContinuedReader {
  private chunkIndex = 0;
  private offset = 0;

  constructor(private readonly chunks: readonly Uint8Array[]) {}

  get done(): boolean {
    this.settle();
    return this.chunkIndex >= this.chunks.length;
  }

  u8(): number {
    this.settle();
    return this.rawByte();
  }

  u16(): number {
    return this.u8() | (this.u8() << 8);
  }

  u32(): number {
    return (this.u16() | (this.u16() << 16)) >>> 0;
  }

  // Reads a run of `count` characters, honoring the fresh grbit at every chunk
  // boundary crossed mid-run. `wide` is the compression of the first segment.
  readChars(count: number, wide: boolean): string {
    let text = "";
    let isWide = wide;
    for (let i = 0; i < count; i++) {
      if (this.atChunkEnd()) isWide = (this.crossToNextChunk() & 0x01) !== 0;
      text += String.fromCharCode(isWide ? this.rawByte() | (this.rawByte() << 8) : this.rawByte());
    }
    return text;
  }

  // Skips `length` bytes of trailing data (rich-text runs, phonetic block). These
  // do not re-read a grbit at boundaries — only the character array does.
  skip(length: number): void {
    let left = length;
    while (left > 0) {
      this.settle();
      const chunk = this.currentChunk();
      const take = Math.min(left, chunk.length - this.offset);
      this.offset += take;
      left -= take;
    }
  }

  // Advance past any fully-consumed chunks so the cursor sits on real data.
  private settle(): void {
    while (this.chunkIndex < this.chunks.length && this.offset >= this.chunkLength()) {
      this.chunkIndex += 1;
      this.offset = 0;
    }
  }

  private atChunkEnd(): boolean {
    return this.chunkIndex < this.chunks.length && this.offset >= this.chunkLength();
  }

  private crossToNextChunk(): number {
    this.chunkIndex += 1;
    this.offset = 0;
    return this.rawByte(); // the continuation's fresh grbit
  }

  private rawByte(): number {
    const chunk = this.currentChunk();
    const value = chunk[this.offset];
    if (value === undefined)
      throw new XlsError(`SST cursor past end of chunk ${this.chunkIndex} (offset ${this.offset})`);
    this.offset += 1;
    return value;
  }

  private chunkLength(): number {
    return this.currentChunk().length;
  }

  private currentChunk(): Uint8Array {
    const chunk = this.chunks[this.chunkIndex];
    if (chunk === undefined)
      throw new XlsError(`SST reader ran past its ${this.chunks.length} chunk(s)`);
    return chunk;
  }
}
