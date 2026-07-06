// Decodes a BIFF8 RK value: a 32-bit compact number. The low two bits are flags;
// the upper 30 bits are either a signed integer or the high bits of an IEEE-754
// double (with the low 34 bits implied zero). fX100 means the stored value was
// multiplied by 100.
export function decodeRk(rk: number): number {
  const dividedBy100 = (rk & 0x01) !== 0;
  const isInteger = (rk & 0x02) !== 0;
  const value = isInteger ? rk >> 2 : rkAsDouble(rk);
  return dividedBy100 ? value / 100 : value;
}

// The 30 significant bits sit in the high word of the double; the low word is 0.
function rkAsDouble(rk: number): number {
  const buffer = new ArrayBuffer(8);
  const view = new DataView(buffer);
  view.setUint32(4, rk & 0xfffffffc, true);
  return view.getFloat64(0, true);
}
