import type { ByteReader } from "../byte-reader";

const F_WIDE = 0x01;
const F_EXT = 0x04;
const F_RICH = 0x08;
const BYTES_PER_RUN = 4;

// Reads a self-contained BIFF8 unicode string (XLUnicodeString) from a reader:
// a length, a flags byte, then the characters, then any rich-run / phonetic tail
// which we skip. Used for sheet names (1-byte length) and inline LABEL cells
// (2-byte length). CONTINUE-spanning strings are only expected in the SST, which
// has its own reader.
export function readUnicodeString(reader: ByteReader, shortLength: boolean): string {
  const charCount = shortLength ? reader.u8() : reader.u16();
  const flags = reader.u8();
  const wide = (flags & F_WIDE) !== 0;
  const runCount = (flags & F_RICH) !== 0 ? reader.u16() : 0;
  const extSize = (flags & F_EXT) !== 0 ? reader.u32() : 0;
  let text = "";
  for (let i = 0; i < charCount; i++)
    text += String.fromCharCode(wide ? reader.u16() : reader.u8());
  reader.skip(runCount * BYTES_PER_RUN + extSize);
  return text;
}
