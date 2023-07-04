const BUFFER_CHUNK = 8192; // 8 KB chunk size increment

export class XdrWriter {
  private _buffer: any;
  private _length: any;

  constructor(buffer: any) {
    let _buffer = buffer;
    if (typeof _buffer === "number") {
      _buffer = Buffer.allocUnsafe(_buffer);
    } else if (!(buffer instanceof Buffer)) {
      _buffer = Buffer.allocUnsafe(BUFFER_CHUNK);
    }
    this._buffer = _buffer;
    this._length = _buffer.length;
  }

  _index = 0;

  alloc(size: number) {
    const from = this._index;
    // advance cursor position
    this._index += size;
    // ensure sufficient buffer size
    if (this._length < this._index) {
      this.resize(this._index);
    }
    return from;
  }

  resize(minRequiredSize: number) {
    // calculate new length, align new buffer length by chunk size
    const newLength = Math.ceil(minRequiredSize / BUFFER_CHUNK) * BUFFER_CHUNK;
    // create new buffer and copy previous data
    const newBuffer = Buffer.allocUnsafe(newLength);
    this._buffer.copy(newBuffer, 0, 0, this._length);
    // update references
    this._buffer = newBuffer;
    this._length = newLength;
  }

  finalize() {
    // clip underlying buffer to the actually written value
    return this._buffer.subarray(0, this._index);
  }

  toArray() {
    return [...this.finalize()];
  }

  write(value: any, size: number) {
    let _value = value;
    if (typeof value === "string") {
      // serialize string directly to the output buffer
      const offset = this.alloc(size);
      this._buffer.write(_value, offset, "utf8");
    } else {
      // copy data to the output buffer
      if (!(_value instanceof Buffer)) {
        _value = Buffer.from(_value);
      }
      const offset = this.alloc(size);
      _value.copy(this._buffer, offset, 0, size);
    }

    // add padding for 4-byte XDR alignment
    const padding = 4 - (size % 4 || 4);
    if (padding > 0) {
      const offset = this.alloc(padding);
      this._buffer.fill(0, offset, this._index);
    }
  }

  writeInt32BE(value: string) {
    const offset = this.alloc(4);
    this._buffer.writeInt32BE(value, offset);
  }

  writeUInt32BE(value: string) {
    const offset = this.alloc(4);
    this._buffer.writeUInt32BE(value, offset);
  }

  writeBigInt64BE(value: string) {
    const offset = this.alloc(8);
    this._buffer.writeBigInt64BE(value, offset);
  }

  writeBigUInt64BE(value: string) {
    const offset = this.alloc(8);
    this._buffer.writeBigUInt64BE(value, offset);
  }

  writeFloatBE(value: string) {
    const offset = this.alloc(4);
    this._buffer.writeFloatBE(value, offset);
  }

  writeDoubleBE(value: string) {
    const offset = this.alloc(8);
    this._buffer.writeDoubleBE(value, offset);
  }

  static bufferChunkSize = BUFFER_CHUNK;
}
