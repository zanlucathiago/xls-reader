import { ByteReader } from "../byte-reader";

const DIRECTORY_ENTRY_SIZE = 128;
const OBJECT_TYPE_ROOT = 5;

// One entry in the Compound File directory: a named stream or storage. We keep
// the fields needed to locate a stream's bytes ([MS-CFB] §2.6.1).
export interface DirectoryEntry {
  readonly name: string;
  readonly objectType: number; // 1 = storage, 2 = stream, 5 = root
  readonly startSector: number;
  readonly size: number;
}

// Parses the directory bytes into entries. Names are UTF-16LE, length-prefixed
// by a byte count that includes the terminating NUL.
export function parseDirectory(directoryBytes: Uint8Array): DirectoryEntry[] {
  const entries: DirectoryEntry[] = [];
  const count = Math.floor(directoryBytes.length / DIRECTORY_ENTRY_SIZE);
  for (let i = 0; i < count; i++) {
    const entry = parseEntry(directoryBytes.subarray(i * DIRECTORY_ENTRY_SIZE));
    if (entry) entries.push(entry);
  }
  return entries;
}

// The root entry's own chain holds the mini-stream container, and its size is
// the mini stream's length — both needed to read small streams.
export function findRoot(entries: readonly DirectoryEntry[]): DirectoryEntry | undefined {
  return entries.find((entry) => entry.objectType === OBJECT_TYPE_ROOT);
}

function parseEntry(entryBytes: Uint8Array): DirectoryEntry | null {
  const reader = new ByteReader(entryBytes);
  const nameBytes = reader.slice(64);
  const nameLength = reader.u16(); // byte length including the NUL terminator
  const objectType = reader.u8();
  if (objectType === 0) return null; // unused slot
  reader.position = 116;
  const startSector = reader.u32();
  const size = reader.u32(); // low 32 bits; .xls streams are far below 4 GB
  return { name: decodeName(nameBytes, nameLength), objectType, startSector, size };
}

function decodeName(nameBytes: Uint8Array, byteLength: number): string {
  const chars = Math.max(0, byteLength / 2 - 1);
  const reader = new ByteReader(nameBytes);
  let name = "";
  for (let i = 0; i < chars; i++) name += String.fromCharCode(reader.u16());
  return name;
}
