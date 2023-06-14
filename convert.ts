import { Address, xdr } from 'soroban-client';
import { Buffer } from "buffer";
import { bufToBigint } from 'bigint-conversion';

export function scvalToBigInt(scval: xdr.ScVal | undefined): BigInt {
    switch (scval?.switch()) {
        case undefined: {
            return BigInt(0);
        }
        case xdr.ScValType.scvU64(): {
            const { high, low } = scval.u64();
            return bufToBigint(new Uint32Array([high, low]));
        }
        case xdr.ScValType.scvI64(): {
            const { high, low } = scval.i64();
            return bufToBigint(new Int32Array([high, low]));
        }
        case xdr.ScValType.scvU128(): {
            const parts = scval.u128();
            const a = parts.hi();
            const b = parts.lo();
            return bufToBigint(new Uint32Array([a.high, a.low, b.high, b.low]));
        }
        case xdr.ScValType.scvI128(): {
            const parts = scval.i128();
            const a = parts.hi();
            const b = parts.lo();
            return bufToBigint(new Int32Array([a.high, a.low, b.high, b.low]));
        }
        default: {
            throw new Error(`Invalid type for scvalToBigInt: ${scval?.switch().name}`);
        }
    };
}

export function scValStrToJs<T>(base64Xdr: string): T {
    let scval = xdr.ScVal.fromXDR(Buffer.from(base64Xdr, 'base64'));
    return scValToJs(scval);
}

export function scValToJs<T>(val: xdr.ScVal): T {
    switch (val?.switch()) {
        case xdr.ScValType.scvBool(): {
            return val.b() as unknown as T;
        }
        case xdr.ScValType.scvVoid():
        case undefined: {
            return 0 as unknown as T;
        }
        case xdr.ScValType.scvU32(): {
            return val.u32() as unknown as T;
        }
        case xdr.ScValType.scvI32(): {
            return val.i32() as unknown as T;
        }
        case xdr.ScValType.scvU64():
        case xdr.ScValType.scvI64():
        case xdr.ScValType.scvU128():
        case xdr.ScValType.scvI128():
        case xdr.ScValType.scvU256():
        case xdr.ScValType.scvI256(): {
            return scvalToBigInt(val) as unknown as T;
        }
        case xdr.ScValType.scvAddress(): {
            return Address.fromScVal(val).toString() as unknown as T;
        }
        case xdr.ScValType.scvString(): {
            return val.str().toString() as unknown as T;
        }
        case xdr.ScValType.scvSymbol(): {
            return val.sym().toString() as unknown as T;
        }
        case xdr.ScValType.scvBytes(): {
            return val.bytes() as unknown as T;
        }
        case xdr.ScValType.scvVec(): {
            type Element = ElementType<T>;
            return val.vec()!.map(v => scValToJs<Element>(v)) as unknown as T;
        }
        case xdr.ScValType.scvMap(): {
            type Key = KeyType<T>;
            type Value = ValueType<T>;
            let res: any = {};
            val.map()!.forEach((e) => {
                let key = scValToJs<Key>(e.key());
                let value;
                let v: xdr.ScVal = e.val();
                // For now we assume second level maps are real maps. Not perfect but better.
                switch (v?.switch()) {
                    case xdr.ScValType.scvMap(): {
                        let inner_map = new Map() as Map<any, any>;
                        v.map()!.forEach((e) => {
                            let key = scValToJs<Key>(e.key());
                            let value = scValToJs<Value>(e.val());
                            inner_map.set(key, value);
                        });
                        value = inner_map;
                        break;
                    }
                    default: {
                        value = scValToJs<Value>(e.val());
                    }
                }
                //@ts-ignore
                res[key as Key] = value as Value;
            });
            return res as unknown as T
        }
        case xdr.ScValType.scvContractExecutable():
            return val.exec() as unknown as T;
        case xdr.ScValType.scvLedgerKeyNonce():
            return val.nonceKey() as unknown as T;
        case xdr.ScValType.scvTimepoint():
            return val.timepoint() as unknown as T;
        case xdr.ScValType.scvDuration():
            return val.duration() as unknown as T;
        // TODO: Add this case when merged
        // case xdr.ScValType.scvError():
        default: {
            throw new Error(`type not implemented yet: ${val?.switch().name}`);
        }
    };
}

type ElementType<T> = T extends Array<infer U> ? U : never;
type KeyType<T> = T extends Map<infer K, any> ? K : never;
type ValueType<T> = T extends Map<any, infer V> ? V : never;

export function addressToScVal(addr: string): xdr.ScVal {
    let addrObj = Address.fromString(addr);
    return addrObj.toScVal();
}

export function i128ToScVal(i: bigint): xdr.ScVal {
    return xdr.ScVal.scvI128(new xdr.Int128Parts({
        lo: xdr.Uint64.fromString((i & BigInt(0xFFFFFFFFFFFFFFFFn)).toString()),
        hi: xdr.Int64.fromString(((i >> BigInt(64)) & BigInt(0xFFFFFFFFFFFFFFFFn)).toString()),
    }))
}

export function u128ToScVal(i: bigint): xdr.ScVal {
    return xdr.ScVal.scvU128(new xdr.UInt128Parts({
        lo: xdr.Uint64.fromString((i & BigInt(0xFFFFFFFFFFFFFFFFn)).toString()),
        hi: xdr.Int64.fromString(((i >> BigInt(64)) & BigInt(0xFFFFFFFFFFFFFFFFn)).toString()),
    }))
}
