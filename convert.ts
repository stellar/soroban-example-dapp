import BigNumber from 'bignumber.js';
import * as SorobanClient from 'soroban-client';
let xdr = SorobanClient.xdr;

export function scvalToBigNumber(scval: SorobanClient.xdr.ScVal | undefined): BigNumber {
  let value = scval?.obj()?.bigInt() ?? xdr.ScBigInt.zero();
  let sign = BigInt(1);
  switch (value.switch()) {
    case SorobanClient.xdr.ScNumSign.zero():
      return BigNumber(0);
    case SorobanClient.xdr.ScNumSign.positive():
      sign = BigInt(1);
      break;
    case SorobanClient.xdr.ScNumSign.negative():
      sign = BigInt(-1);
      break;
  }

  let b = BigInt(0);
  for (let byte of value.magnitude()) {
    b <<= BigInt(8);
    b |= BigInt(byte);
  };

  return BigNumber((b * sign).toString());
}

// TODO: Not sure this handles negatives right
export function bigNumberToScBigInt(value: BigNumber): SorobanClient.xdr.ScVal {
  const b: bigint = BigInt(value.toFixed(0));
  if (b == BigInt(0)) {
    return xdr.ScVal.scvObject(xdr.ScObject.scoBigInt(xdr.ScBigInt.zero()));
  }
  const buf = bigintToBuf(b);
  if (b > BigInt(0)) {
    return xdr.ScVal.scvObject(xdr.ScObject.scoBigInt(xdr.ScBigInt.positive(buf)));
  } else {
    return xdr.ScVal.scvObject(xdr.ScObject.scoBigInt(xdr.ScBigInt.negative(buf)));
  }
}

export function bigintToBuf(bn: bigint): Buffer {
  var hex = BigInt(bn).toString(16);
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

