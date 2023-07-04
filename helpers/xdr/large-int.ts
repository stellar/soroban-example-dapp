// @ts-nocheck

import { XdrPrimitiveType } from "./xdr-type";
import {
  calculateBigIntBoundaries,
  encodeBigIntFromBits,
  sliceBigInt,
} from "./bigint-encoder";
import { XdrNotImplementedDefinitionError, XdrWriterError } from "./errors";

/* eslint-disable */

/* tslint:disable */
export class LargeInt extends XdrPrimitiveType {
  constructor(args) {
    super();
    this._value = encodeBigIntFromBits(args, this.size, this.unsigned);
  }

  /**
   * Signed/unsigned representation
   * @type {Boolean}
   * @abstract
   */
  get unsigned() {
    throw new XdrNotImplementedDefinitionError();
  }

  /**
   * Size of the integer in bits
   * @type {Number}
   * @abstract
   */
  get size() {
    throw new XdrNotImplementedDefinitionError();
  }

  /**
   * Slice integer to parts with smaller bit size
   * @param {32|64|128} sliceSize - Size of each part in bits
   * @return {BigInt[]}
   */
  slice(sliceSize) {
    return sliceBigInt(this._value, this.size, sliceSize);
  }

  toString() {
    return this._value.toString();
  }

  toJSON() {
    return { _value: this._value.toString() };
  }

  /**
   * @inheritDoc
   */
  static read(reader) {
    const { size } = this.prototype;
    if (size === 64) return new this(reader.readBigUInt64BE());
    return new this(
      ...Array.from({ length: size / 64 }, () =>
        reader.readBigUInt64BE(),
      ).reverse(),
    );
  }

  /**
   * @inheritDoc
   */
  static write(value, writer) {
    if (value instanceof this) {
      value = value._value;
    } else if (
      typeof value !== "bigint" ||
      value > this.MAX_VALUE ||
      value < this.MIN_VALUE
    )
      throw new XdrWriterError(`${value} is not a ${this.name}`);

    const { unsigned, size } = this.prototype;
    if (size === 64) {
      if (unsigned) {
        writer.writeBigUInt64BE(value);
      } else {
        writer.writeBigInt64BE(value);
      }
    } else {
      for (const part of sliceBigInt(value, size, 64).reverse()) {
        if (unsigned) {
          writer.writeBigUInt64BE(part);
        } else {
          writer.writeBigInt64BE(part);
        }
      }
    }
  }

  /**
   * @inheritDoc
   */
  static isValid(value) {
    return typeof value === "bigint" || value instanceof this;
  }

  /**
   * Create instance from string
   * @param {String} string - Numeric representation
   * @return {LargeInt}
   */
  static fromString(string) {
    return new this(string);
  }

  static MAX_VALUE = 0n;

  static MIN_VALUE = 0n;

  /**
   * @internal
   * @return {void}
   */
  static defineIntBoundaries() {
    const [min, max] = calculateBigIntBoundaries(
      this.prototype.size,
      this.prototype.unsigned,
    );
    this.MIN_VALUE = min;
    this.MAX_VALUE = max;
  }
}
