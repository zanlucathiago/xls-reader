// BIFF8 record type ids we decode. See [MS-XLS]. Grouped by role; anything not
// listed is skipped by the record walker.
export const RecordType = {
  BOF: 0x0809, // beginning of a substream (globals or a sheet)
  EOF: 0x000a, // end of a substream
  BOUNDSHEET8: 0x0085, // sheet name + byte offset of its BOF
  DATEMODE: 0x0022, // 1900 vs 1904 date system
  FORMAT: 0x041e, // a number-format string keyed by format index
  XF: 0x00e0, // cell format record; carries its format index
  SST: 0x00fc, // shared string table
  CONTINUE: 0x003c, // spillover for the preceding record (notably SST)
  LABELSST: 0x00fd, // string cell → index into the SST
  LABEL: 0x0204, // inline string cell (old-style)
  RSTRING: 0x00d6, // inline rich string cell
  NUMBER: 0x0203, // IEEE-754 double cell
  RK: 0x027e, // compact numeric cell
  MULRK: 0x00bd, // run of RK cells sharing a row
  BLANK: 0x0201, // formatted-but-empty cell
  MULBLANK: 0x00be, // run of blank cells
  BOOLERR: 0x0205, // boolean or error cell
  FORMULA: 0x0006, // formula cell; result is a double or a typed sentinel
  STRING: 0x0207, // string result of the preceding FORMULA
} as const;
