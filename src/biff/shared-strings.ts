import { ContinuedReader } from "./continued-reader";

// Grbit flags on an SST string (BIFF8 XLUnicodeRichExtendedString).
const F_WIDE = 0x01; // fHighByte: characters are 16-bit, not compressed 8-bit
const F_EXT = 0x04; // fExtSt: a phonetic (Asian) block follows the text
const F_RICH = 0x08; // fRichSt: rich-text formatting runs follow the text

const BYTES_PER_RUN = 4; // each rich-text run is a (char index, font index) pair

// Parses the Shared String Table into an ordered array. String cells (LABELSST)
// reference these by index. `chunks` is the SST record's data followed by each
// CONTINUE record's data, in order.
//
// @example parseSharedStrings([sstData, continueData]) // ["Emitente", "CDB", ...]
export function parseSharedStrings(chunks: readonly Uint8Array[]): string[] {
  const reader = new ContinuedReader(chunks);
  reader.u32(); // cstTotal: total references, including repeats — not needed here
  const unique = reader.u32();
  const strings: string[] = [];
  for (let i = 0; i < unique; i++) strings.push(readString(reader));
  return strings;
}

function readString(reader: ContinuedReader): string {
  const charCount = reader.u16();
  const flags = reader.u8();
  const runCount = (flags & F_RICH) !== 0 ? reader.u16() : 0;
  const extSize = (flags & F_EXT) !== 0 ? reader.u32() : 0;
  const text = reader.readChars(charCount, (flags & F_WIDE) !== 0);
  reader.skip(runCount * BYTES_PER_RUN + extSize);
  return text;
}
