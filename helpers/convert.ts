import BigNumber from 'bignumber.js';
import * as SorobanClient from 'soroban-client';
import { I128 } from "./xdr";

let xdr = SorobanClient.xdr;

export function scvalToBigNumber(scval: SorobanClient.xdr.ScVal | undefined): BigNumber {
  console.log("🚀 ~ file: convert.ts:6 ~ scvalToBigNumber ~ scval:", scval)
  if (scval){
    console.log("If we decode: ", decodei128ScVal(scval))
  }
  
  switch (scval?.switch()) {
  case undefined: {
    return BigNumber(0);
  }
  case xdr.ScValType.scvU32(): {
    return BigNumber(scval.u32());
  }
  case xdr.ScValType.scvI32(): {
    return BigNumber(scval.i32());
  }
  case xdr.ScValType.scvU64(): {
    const {high, low} = scval.u64();
    return bigNumberFromBytes(false, high, low);
  }
  case xdr.ScValType.scvI64(): {
    const {high, low} = scval.i64();
    return bigNumberFromBytes(true, high, low);
  }
  case xdr.ScValType.scvU128(): {
    const parts = scval.u128();
    console.log("🚀 ~ file: convert.ts:28 ~ casexdr.ScValType.scvU128 ~ parts:", parts)
    const hi = parts.hi();
    const lo = parts.lo();
    return bigNumberFromBytes(false, lo.low, lo.high, hi.low, hi.high);
  }
  case xdr.ScValType.scvI128(): {
    return BigNumber(decodei128ScVal(scval));
  }
  case xdr.ScValType.scvU256(): {
    const parts = scval.u256();
    const a = parts.hiHi();
    const b = parts.hiLo();
    const c = parts.loHi();
    const d = parts.loLo();
    return bigNumberFromBytes(false, a.high, a.low, b.high, b.low, c.high, c.low, d.high, d.low);
  }
  case xdr.ScValType.scvI256(): {
    const parts = scval.i256();
    const a = parts.hiHi();
    const b = parts.hiLo();
    const c = parts.loHi();
    const d = parts.loLo();
    return bigNumberFromBytes(true, a.high, a.low, b.high, b.low, c.high, c.low, d.high, d.low);
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
  if (buf.length > 16) {
    throw new Error("BigNumber overflows i128");
  }

  if (value.isNegative()) {
    // Clear the top bit
    buf[0] &= 0x7f;
  }

  // left-pad with zeros up to 16 bytes
  let padded = Buffer.alloc(16);
  buf.copy(padded, padded.length-buf.length);
  console.debug({value: value.toString(), padded});

  if (value.isNegative()) {
    // Set the top bit
    padded[0] |= 0x80;
  }

  const hi = new xdr.Int64(
    bigNumberFromBytes(false, ...padded.slice(4, 8)).toNumber(),
    bigNumberFromBytes(false, ...padded.slice(0, 4)).toNumber()
  );
  const lo = new xdr.Uint64(
    bigNumberFromBytes(false, ...padded.slice(12, 16)).toNumber(),
    bigNumberFromBytes(false, ...padded.slice(8, 12)).toNumber()
  );

  return xdr.ScVal.scvI128(new xdr.Int128Parts({lo, hi}));
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
  return value.bytes().toString();
}


// XDR -> String
export const decodei128ScVal = (value: SorobanClient.xdr.ScVal) => {
  try {
    return new I128([
      BigInt(value.i128().lo().low),
      BigInt(value.i128().lo().high),
      BigInt(value.i128().hi().low),
      BigInt(value.i128().hi().high),
    ]).toString();
  } catch (error) {
    console.log(error);
    return 0;
  }
};
