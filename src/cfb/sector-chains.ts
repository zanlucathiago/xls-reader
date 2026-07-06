import { ByteReader } from "../byte-reader";
import type { CfbHeader } from "./cfb-header";

// Special FAT sector markers ([MS-CFB] §2.2). ENDOFCHAIN terminates a chain;
// the others tag sectors that aren't part of a stream chain.
const ENDOFCHAIN = 0xfffffffe;
const FREESECT = 0xffffffff;

// Byte offset of sector `id` in the file. Sector 0 begins right after the
// 512-byte header, so sector `id` starts at (id + 1) * sectorSize.
function sectorOffset(id: number, sectorSize: number): number {
  return (id + 1) * sectorSize;
}

// Reassembles the full FAT (File Allocation Table): a flat array where FAT[i] is
// the next sector after sector i, or ENDOFCHAIN. Built by concatenating every
// sector the DIFAT points to.
export function buildFat(bytes: Uint8Array, header: CfbHeader): number[] {
  const fatSectorIds = collectFatSectorIds(bytes, header);
  const fat: number[] = [];
  const perSector = header.sectorSize / 4;
  for (const id of fatSectorIds) {
    const reader = new ByteReader(bytes, sectorOffset(id, header.sectorSize));
    for (let i = 0; i < perSector; i++) fat.push(reader.u32());
  }
  return fat;
}

// The ordered list of sector ids that hold the FAT: the header's first 109, then
// any extra ones chained through DIFAT sectors.
function collectFatSectorIds(bytes: Uint8Array, header: CfbHeader): number[] {
  const ids = header.initialDifat.filter((id) => id !== FREESECT && id !== ENDOFCHAIN);
  const perSector = header.sectorSize / 4;
  let difatSector = header.firstDifatSector;
  for (let n = 0; n < header.numDifatSectors && difatSector !== ENDOFCHAIN; n++) {
    const reader = new ByteReader(bytes, sectorOffset(difatSector, header.sectorSize));
    for (let i = 0; i < perSector - 1; i++) {
      const id = reader.u32();
      if (id !== FREESECT && id !== ENDOFCHAIN) ids.push(id);
    }
    difatSector = reader.u32(); // last entry links to the next DIFAT sector
  }
  return ids;
}

// Walks a sector chain from `start` through the FAT, returning the sector ids in
// order. Guards against cycles in a corrupt FAT.
export function followChain(fat: readonly number[], start: number): number[] {
  const chain: number[] = [];
  const seen = new Set<number>();
  let current = start;
  while (current !== ENDOFCHAIN && current < fat.length && !seen.has(current)) {
    seen.add(current);
    chain.push(current);
    current = fat[current] ?? ENDOFCHAIN;
  }
  return chain;
}

// Concatenates the bytes of a sector chain, then trims to `size`. Used for both
// the directory and any regular (non-mini) stream.
export function readChainBytes(
  bytes: Uint8Array,
  chain: readonly number[],
  sectorSize: number,
  size: number,
): Uint8Array {
  const out = new Uint8Array(chain.length * sectorSize);
  chain.forEach((id, index) => {
    const start = sectorOffset(id, sectorSize);
    out.set(bytes.subarray(start, start + sectorSize), index * sectorSize);
  });
  return out.subarray(0, size);
}
