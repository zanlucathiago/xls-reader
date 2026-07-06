// One BIFF record: a 16-bit type, 16-bit length, then `length` bytes of data.
// `offset` is the byte position of the record header within the stream — needed
// because BOUNDSHEET8 points at a sheet's BOF by absolute offset.
export interface BiffRecord {
  readonly type: number;
  readonly data: Uint8Array;
  readonly offset: number;
}

// Splits a BIFF stream into its records. Stops cleanly if the stream ends mid-
// header (some writers pad the final sector). Reading everything up front is
// fine: worksheet streams are megabytes at most.
export function readRecords(stream: Uint8Array): BiffRecord[] {
  const view = new DataView(stream.buffer, stream.byteOffset, stream.byteLength);
  const records: BiffRecord[] = [];
  let pos = 0;
  while (pos + 4 <= stream.length) {
    const type = view.getUint16(pos, true);
    const length = view.getUint16(pos + 2, true);
    if (pos + 4 + length > stream.length) break;
    records.push({ type, data: stream.subarray(pos + 4, pos + 4 + length), offset: pos });
    pos += 4 + length;
  }
  return records;
}
