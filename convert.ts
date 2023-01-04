import BigNumber from 'bignumber.js';
import * as SorobanClient from 'soroban-client';
let xdr = SorobanClient.xdr;

export function scvalToBigNumber(scval: SorobanClient.xdr.ScVal | undefined): BigNumber {
  switch (scval?.switch()) {
  case undefined: {
    return BigNumber(0);
  }
  case xdr.ScValType.scvU63(): {
    const {high, low} = scval.u63();
    return bigNumberFromBytes(false, high, low);
  }
  case xdr.ScValType.scvU32(): {
    return BigNumber(scval.u32());
  }
  case xdr.ScValType.scvI32(): {
    return BigNumber(scval.i32());
  }
  case xdr.ScValType.scvObject(): {
    let obj = scval.obj()!;
    switch (obj.switch()) {
    case xdr.ScObjectType.scoU64(): {
      const {high, low} = obj.u64();
      return bigNumberFromBytes(false, high, low);
    }
    case xdr.ScObjectType.scoI64(): {
      const {high, low} = obj.i64();
      return bigNumberFromBytes(true, high, low);
    }
    case xdr.ScObjectType.scoU128(): {
      const parts = obj.u128();
      const a = parts.hi();
      const b = parts.lo();
      return bigNumberFromBytes(false, a.high, a.low, b.high, b.low);
    }
    case xdr.ScObjectType.scoI128(): {
      const parts = obj.i128();
      const a = parts.hi();
      const b = parts.lo();
      return bigNumberFromBytes(true, a.high, a.low, b.high, b.low);
    }
    default:
      throw new Error(`Invalid type for scvalToBigNumber: ${obj.switch().name}`);
    }
  }
  default: {
    throw new Error(`Invalid type for scvalToBigNumber: ${scval?.switch().name}`);
  }
  };
}

function bigNumberFromBytes(signed: boolean, ...bytes: (string | number | bigint)[]): BigNumber {
    let sign = 1;
    if (signed && bytes[0] === 0x80) {
      // top bit is set, negative number.
      sign = -1;
      bytes[0] &= 0x7f;
    }
    let b = BigInt(0);
    for (let byte of bytes) {
      b <<= BigInt(8);
      b |= BigInt(byte);
    }
    return BigNumber(b.toString()).multipliedBy(sign);
}

export function bigNumberToI128(value: BigNumber): SorobanClient.xdr.ScVal {
  const b: bigint = BigInt(value.toFixed(0));
  const buf = bigintToBuf(b);
  if (buf.length > 4) {
    throw new Error("BigNumber overflows i128");
  }

  if (value.isNegative()) {
    // Clear the top bit
    buf[0] &= 0x7f;
  }

  // left-pad with zeros up to 4 bytes
  let padded = Buffer.alloc(4);
  buf.copy(padded, padded.length-buf.length);

  if (value.isNegative()) {
    // Set the top bit
    padded[0] |= 0x80;
  }

  const hi = new xdr.Uint64(padded[1], padded[0]);
  const lo = new xdr.Uint64(padded[3], padded[2]);
  return xdr.ScVal.scvObject(xdr.ScObject.scoI128(new xdr.Int128Parts({lo, hi})));
}

function bigintToBuf(bn: bigint): Buffer {
  var hex = BigInt(bn).toString(16).replace(/^-/, '');
  if (hex.length % 2) { hex = '0' + hex; }

  var len = hex.length / 2;
  var u8 = new Uint8Array(len);

  var i = 0;
  var j = 0;
  while (i < len) {
    u8[i] = parseInt(hex.slice(j, j+2), 16);
    i += 1;
    j += 2;
  }

  if (bn < BigInt(0)) {
    // Set the top bit
    u8[0] |= 0x80;
  }

  return Buffer.from(u8);
}

export function xdrUint64ToNumber(value: SorobanClient.xdr.Uint64): number {
  let b = 0;
  b |= value.high;
  b <<= 8;
  b |= value.low;
  return b;
}

export function scvalToString(value: SorobanClient.xdr.ScVal): string | undefined {
  return value.obj()?.bin().toString();
}

