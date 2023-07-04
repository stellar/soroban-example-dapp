// Ported from https://github.com/stellar/js-xdr/pull/96
// Can remove this and use them through stellar base once it is merged

/* eslint-disable */
export function encodeBigIntFromBits(
  parts: any[],
  size: number,
  unsigned: boolean,
) {
  let result = BigInt(0);
  // check arguments length
  if (parts.length && parts[0] instanceof Array) {
    parts = parts[0];
  }
  const total = parts.length;
  if (total === 1) {
    try {
      result = BigInt(parts[0]);
      if (!unsigned) {
        result = BigInt.asIntN(size, result);
      }
    } catch (e) {
      throw new TypeError(`Invalid integer value: ${parts[0]}`);
    }
  } else {
    const sliceSize = size / total;
    if (sliceSize !== 32 && sliceSize !== 64 && sliceSize !== 128)
      throw new TypeError("Invalid number of arguments");
    // combine parts
    for (let i = 0; i < total; i++) {
      let part = BigInt.asUintN(sliceSize, BigInt(parts[i].valueOf()));
      if (i > 0) {
        // shift if needed
        part <<= BigInt(i * sliceSize);
      }
      result |= part;
    }
    if (!unsigned) {
      // clamp value to the requested size
      result = BigInt.asIntN(size, result);
    }
  }
  // check type
  if (typeof result === "bigint") {
    // check boundaries
    const [min, max] = calculateBigIntBoundaries(size, unsigned);
    if (result >= min && result <= max) return result;
  }
  // failed to encode
  throw new TypeError(`Invalid ${formatIntName(size, unsigned)} value`);
}

export function sliceBigInt(value: BigInt, size: number, sliceSize: number) {
  if (typeof value !== "bigint") throw new TypeError("Invalid BigInt value");
  const total = size / sliceSize;
  if (total === 1) return [value];
  if (
    sliceSize < 32 ||
    sliceSize > 128 ||
    (total !== 2 && total !== 4 && total !== 8)
  )
    throw new TypeError("Invalid slice size");
  // prepare shift and mask
  const shift = BigInt(sliceSize);
  const mask = (BigInt(1) << shift) - BigInt(1);
  // iterate shift and mask application
  const result = new Array(total);
  for (let i = 0; i < total; i++) {
    if (i > 0) {
      value >>= shift;
    }
    result[i] = BigInt.asIntN(sliceSize, value & mask); // clamp value
  }
  return result;
}

export function formatIntName(precision: number, unsigned: boolean) {
  return `${unsigned ? "u" : "i"}${precision}`;
}

export function calculateBigIntBoundaries(size: number, unsigned: boolean) {
  if (unsigned) return [BigInt(0), (BigInt(1) << BigInt(size)) - BigInt(1)];
  const boundary = BigInt(1) << BigInt(size - 1);
  return [BigInt(0) - boundary, boundary - BigInt(1)];
}
