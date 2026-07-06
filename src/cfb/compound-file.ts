import { ByteReader } from "../byte-reader";
import { parseCfbHeader, type CfbHeader } from "./cfb-header";
import { parseDirectory, findRoot, type DirectoryEntry } from "./directory";
import { buildFat, followChain, readChainBytes } from "./sector-chains";

// A read-only view over an opened Compound File: look up a named stream and get
// its raw bytes. This is the OLE2 container layer only — it knows nothing about
// BIFF/Excel; it just extracts streams like "Workbook".
export interface CompoundFile {
  readStream(name: string): Uint8Array | undefined;
}

// Everything derived once when the file is opened, so each readStream call is a
// cheap lookup rather than a re-parse.
interface OpenedFile {
  readonly bytes: Uint8Array;
  readonly header: CfbHeader;
  readonly fat: number[];
  readonly directory: readonly DirectoryEntry[];
  readonly miniStream: Uint8Array;
  readonly miniFat: number[];
}

export function openCompoundFile(bytes: Uint8Array): CompoundFile {
  const header = parseCfbHeader(bytes);
  const fat = buildFat(bytes, header);
  const directory = parseDirectory(directoryBytes(bytes, header, fat));
  const file: OpenedFile = {
    bytes,
    header,
    fat,
    directory,
    miniStream: readMiniStreamContainer(bytes, header, fat, directory),
    miniFat: buildMiniFat(bytes, header, fat),
  };

  return {
    readStream(name) {
      const entry = directory.find((e) => e.name === name);
      if (!entry) return undefined;
      return entry.size < header.miniStreamCutoff
        ? readMiniStream(file, entry)
        : readRegularStream(file, entry);
    },
  };
}

function directoryBytes(bytes: Uint8Array, header: CfbHeader, fat: number[]): Uint8Array {
  const chain = followChain(fat, header.firstDirSector);
  return readChainBytes(bytes, chain, header.sectorSize, chain.length * header.sectorSize);
}

// A stream at or above the cutoff lives directly in the main FAT sectors.
function readRegularStream(file: OpenedFile, entry: DirectoryEntry): Uint8Array {
  const chain = followChain(file.fat, entry.startSector);
  return readChainBytes(file.bytes, chain, file.header.sectorSize, entry.size);
}

// The root entry's chain is the container that holds all small streams packed
// into mini sectors; it is itself a regular stream in the main FAT.
function readMiniStreamContainer(
  bytes: Uint8Array,
  header: CfbHeader,
  fat: number[],
  directory: readonly DirectoryEntry[],
): Uint8Array {
  const root = findRoot(directory);
  if (!root) return new Uint8Array(0);
  const chain = followChain(fat, root.startSector);
  return readChainBytes(bytes, chain, header.sectorSize, root.size);
}

// The mini-FAT is a regular stream chain in the main file; each 4-byte entry
// links mini sectors the way the FAT links normal sectors.
function buildMiniFat(bytes: Uint8Array, header: CfbHeader, fat: number[]): number[] {
  const chain = followChain(fat, header.firstMiniFatSector);
  const raw = readChainBytes(bytes, chain, header.sectorSize, chain.length * header.sectorSize);
  return toU32Array(raw);
}

// A stream below the cutoff is stored in mini sectors within the mini-stream
// container, chained through the mini-FAT.
function readMiniStream(file: OpenedFile, entry: DirectoryEntry): Uint8Array {
  const { miniStream, miniFat, header } = file;
  const chain = followChain(miniFat, entry.startSector);
  const out = new Uint8Array(chain.length * header.miniSectorSize);
  chain.forEach((id, index) => {
    const start = id * header.miniSectorSize;
    out.set(
      miniStream.subarray(start, start + header.miniSectorSize),
      index * header.miniSectorSize,
    );
  });
  return out.subarray(0, entry.size);
}

function toU32Array(raw: Uint8Array): number[] {
  const reader = new ByteReader(raw);
  const values: number[] = [];
  const count = Math.floor(raw.length / 4);
  for (let i = 0; i < count; i++) values.push(reader.u32());
  return values;
}
