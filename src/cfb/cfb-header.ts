import { ByteReader } from "../byte-reader";
import { XlsError } from "../errors";

// The 8-byte OLE2 / Compound File magic number (D0 CF 11 E0 A1 B1 1A E1).
const SIGNATURE = [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1];

// The 512-byte header of a Compound File, decoded to the fields we need to walk
// its sector chains. See [MS-CFB] §2.2.
export interface CfbHeader {
  readonly sectorSize: number;
  readonly miniSectorSize: number;
  readonly firstDirSector: number;
  readonly miniStreamCutoff: number;
  readonly firstMiniFatSector: number;
  readonly firstDifatSector: number;
  readonly numDifatSectors: number;
  readonly initialDifat: readonly number[]; // first 109 FAT sector ids, from the header
}

export function parseCfbHeader(bytes: Uint8Array): CfbHeader {
  assertSignature(bytes);
  const reader = new ByteReader(bytes, 30);
  const sectorSize = powerOfTwoSize(reader.u16(), "sector", [9, 12]);
  const miniSectorSize = powerOfTwoSize(reader.u16(), "mini-sector", [6]);
  reader.position = 44;
  reader.u32(); // number of FAT sectors — we derive the FAT from the DIFAT instead
  const firstDirSector = reader.u32();
  reader.u32(); // transaction signature (unused)
  const miniStreamCutoff = reader.u32();
  const firstMiniFatSector = reader.u32();
  reader.u32(); // number of mini-FAT sectors (chain is self-terminating)
  const firstDifatSector = reader.u32();
  const numDifatSectors = reader.u32();
  return {
    sectorSize,
    miniSectorSize,
    firstDirSector,
    miniStreamCutoff,
    firstMiniFatSector,
    firstDifatSector,
    numDifatSectors,
    initialDifat: readInitialDifat(bytes),
  };
}

// Sector sizes are stored as a power-of-two shift ([MS-CFB] §2.2). Only a fixed
// set is legal (9→512 or 12→4096 for sectors, 6→64 for mini sectors). Validating
// here is essential, not cosmetic: an unchecked `1 << shift` can go negative
// (e.g. `1 << 31`) or huge, turning later sector offsets into out-of-bounds or
// OOM-sized allocations on a crafted file.
function powerOfTwoSize(shift: number, kind: string, allowed: readonly number[]): number {
  if (!allowed.includes(shift)) {
    throw new XlsError(
      `Invalid CFB ${kind} shift ${shift}: expected one of [${allowed.join(", ")}]`,
    );
  }
  return 1 << shift;
}

// The header's tail (offset 76..512) holds the first 109 DIFAT entries — the
// sector ids that make up the start of the FAT.
function readInitialDifat(bytes: Uint8Array): number[] {
  const reader = new ByteReader(bytes, 76);
  const entries: number[] = [];
  for (let i = 0; i < 109; i++) entries.push(reader.u32());
  return entries;
}

function assertSignature(bytes: Uint8Array): void {
  if (bytes.length < 512) {
    throw new XlsError(
      `File too small to be an OLE2 container: ${bytes.length} bytes (need >= 512)`,
    );
  }
  for (let i = 0; i < SIGNATURE.length; i++) {
    if (bytes[i] !== SIGNATURE[i]) {
      const got = Array.from(bytes.slice(0, 8), (b) => b.toString(16).padStart(2, "0")).join(" ");
      throw new XlsError(`Not an OLE2 / .xls file: expected magic D0CF11E0A1B11AE1, got ${got}`);
    }
  }
}
