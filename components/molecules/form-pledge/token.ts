/**
 * @minimum 0
 * @maximum 4.29e9
 */
export type u32 = number

/**
 * @pattern /[0-9]{1,38}/
 */
export type u128 = string

/**
 * @pattern /somethingsomething/
 */
export type Identifier = string

// A copy of the full Wasm bytes from the contract.
// Later, if this present performance/bloat problems,
// it may make sense to only store XDR instead.
const Wasm: Uint8Array = new Uint8Array([0, 0, 0]);

// See example below for how to import and use an Schema
export interface Encoder {
  encode(
    wasm: Uint8Array,
    contractId: string,
    fn: string,
    args: any,
  ): Uint8Array
}

export class Contract {
  constructor(
    /**
     * The encoder/decoder logic. Example:
     *
     *     import { schema } from 'soroban-cli'
     *     import { Contract } from './contract'
     *     const contract = new Contract(schema)
     */
    private encoder: Encoder,

    /**
     * The ID of the on-chain contract. Defaults to the contract this was built
     * for, but can be customized for other contracts with the same interface.
     */
    private contractId: string = '0x000',
  ) {}

  incrAllow(args: {
    invoker: Identifier,
    nonce: u32,
    spender: Identifier,
    amount: u128,
  }): Uint8Array {
    return this.encoder.encode(
      Wasm,
      this.contractId,
      'incr_allow',
      JSON.stringify(args)
    )
  }
}
