import { XdrReaderError } from "../errors";

export class XdrReader {
  private _buffer: any;
  private _length: number;
  private _index: number;

  constructor(source: any) {
    let _source = source;
    if (!Buffer.isBuffer(_source)) {
      if (_source instanceof Array) {
        _source = Buffer.from(source);
      } else {
        throw new XdrReaderError("source not specified");
      }
    }

    this._buffer = _source;
    this._length = _source.length;
    this._index = 0;
  }

  get eof() {
    return this._index === this._length;
  }

  advance(size: number) {
    const from = this._index;
    // advance cursor position
    this._index += size;
    // check buffer boundaries
    if (this._length < this._index)
      throw new XdrReaderError(
        "attempt to read outside the boundary of the buffer",
      );
    // check that padding is correct for Opaque and String
    const padding = 4 - (size % 4 || 4);
    if (padding > 0) {
      // eslint-disable-next-line no-plusplus
      for (let i = 0; i < padding; i++)
        if (this._buffer[this._index + i] !== 0)
          // all bytes in the padding should be zeros
          throw new XdrReaderError("invalid padding");
      this._index += padding;
    }
    return from;
  }

  rewind() {
    this._index = 0;
  }

  read(size: number) {
    const from = this.advance(size);
    return this._buffer.subarray(from, from + size);
  }

  readInt32BE() {
    return this._buffer.readInt32BE(this.advance(4));
  }

  readUInt32BE() {
    return this._buffer.readUInt32BE(this.advance(4));
  }

  readBigInt64BE() {
    return this._buffer.readBigInt64BE(this.advance(8));
  }

  readBigUInt64BE() {
    return this._buffer.readBigUInt64BE(this.advance(8));
  }

  readFloatBE() {
    return this._buffer.readFloatBE(this.advance(4));
  }

  readDoubleBE() {
    return this._buffer.readDoubleBE(this.advance(8));
  }

  ensureInputConsumed() {
    if (this._index !== this._length)
      throw new XdrReaderError(
        `invalid XDR contract typecast - source buffer not entirely consumed`,
      );
  }
}
