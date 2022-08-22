// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next'
import * as StellarSdk from "stellar-sdk";
import * as jsonrpc from "../../jsonrpc";

type SimulateTransactionRequest = [string];
interface SimulateTransactionResponse {
  cost: {};
  footprint: {
    readOnly: string[];
    readWrite: string[];
  };
  xdr: string;
  latestLedger: number;
}

const CROWDFUND_ID = "0000000000000000000000000000000000000000000000000000000000000000";
const TOKEN_ID = "0000000000000000000000000000000000000000000000000000000000000001";

const mockContracts: Record<string, Record<string, Function>> = {
  // crowdfund contract mocks
  [CROWDFUND_ID]: {
    deadline(): StellarSdk.xdr.ScVal {
      // Ending in an hour
      const now = Math.floor(Date.now() / 1000) + 3600;
      let value = StellarSdk.xdr.Int64.fromString(now.toString());
      return StellarSdk.xdr.ScVal.scvU63(value);
    },
    started(): StellarSdk.xdr.ScVal {
      // Started 2 hours ago
      const now = Math.floor(Date.now() / 1000) - (2* 3600);
      let value = StellarSdk.xdr.Int64.fromString(now.toString());
      return StellarSdk.xdr.ScVal.scvU63(value);
    },
    state(): StellarSdk.xdr.ScVal {
      // Currently running
      return StellarSdk.xdr.ScVal.scvU32(0);
    },
    target_amount(): StellarSdk.xdr.ScVal {
      let value = StellarSdk.xdr.ScObject.scoBytes(Buffer.from(TOKEN_ID, "hex"));
      return StellarSdk.xdr.ScVal.scvObject(value);
    },
    token(): StellarSdk.xdr.ScVal {
      let value = StellarSdk.xdr.ScObject.scoBytes(Buffer.from(TOKEN_ID, "hex"));
      return StellarSdk.xdr.ScVal.scvObject(value);
    },
  },
  // token contract mocks
  [TOKEN_ID]: {
    name(): StellarSdk.xdr.ScVal {
      let value = StellarSdk.xdr.ScObject.scoBytes(Buffer.from("Circle US Dollar"));
      return StellarSdk.xdr.ScVal.scvObject(value);
    },
    symbol(): StellarSdk.xdr.ScVal {
      let value = StellarSdk.xdr.ScObject.scoBytes(Buffer.from("USDC"));
      return StellarSdk.xdr.ScVal.scvObject(value);
    },
    decimals(): StellarSdk.xdr.ScVal {
      return StellarSdk.xdr.ScVal.scvU32(2);
    },
    balance(id: StellarSdk.xdr.ScVal): StellarSdk.xdr.ScVal {
      let userId = id.obj()?.bin().toString('hex');
      let balance = userId === CROWDFUND_ID
        // test value = 0x262F046C, randomly generated u64 value
        ? StellarSdk.xdr.ScBigInt.positive(Buffer.from("262F046C", "hex"))
        : StellarSdk.xdr.ScBigInt.zero();
      return StellarSdk.xdr.ScVal.scvObject(StellarSdk.xdr.ScObject.scoBigInt(balance));
    },
  },
};

// A simple mock api to avoid running the soroban-rpc, because, while I'm
// writing this, it doesn't exist yet.
export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<jsonrpc.Response<SimulateTransactionResponse>>
) {
  if (req.body.method !== "simulateTransaction") {
    // TODO: Better error response here
    res.status(200).json({
      jsonrpc: "2.0",
      id: req.body.id,
      error: { code: -32601, message: "Method not found" },
    });
    return;
  }

  let invalidParams: jsonrpc.Response<SimulateTransactionResponse> = {
    jsonrpc: "2.0",
    id: req.body.id,
    error: { code: -32602, message: "Invalid params" },
  };

  let ps = req.body.params as SimulateTransactionRequest;
  if (ps.length != 1) {
    res.status(200).json(invalidParams);
    return;
  }

  let txnEnvelope = StellarSdk.xdr.TransactionEnvelope.fromXDR(Buffer.from(ps[0], "base64"));
  let ops =
    txnEnvelope.switch() == StellarSdk.xdr.EnvelopeType.envelopeTypeTxV0()
    ? txnEnvelope.v0().tx().operations()
    : txnEnvelope.v1().tx().operations()
  if (ops.length != 1) {
    res.status(200).json(invalidParams);
    return;
  };
  const op = ops[0].body();
  if (op.switch() !== StellarSdk.xdr.OperationType.invokeHostFunction()) {
    res.status(200).json(invalidParams);
    return;
  }

  const ihfOp = op.invokeHostFunctionOp();
  if (ihfOp.function().name !== "hostFnCall") {
    res.status(200).json(invalidParams);
    return;
  }

  const ihfOpParams = ihfOp.parameters();
  if (ihfOpParams.length < 2) {
    res.status(200).json(invalidParams);
    return;
  }

  // TODO: Better error handling or whatever here.
  // TODO: Check the encoding/decoding here is right
  const [contractIdScVal, methodScVal, ...params] = ihfOpParams;
  const contractId = contractIdScVal.obj()?.bin().toString();
  const methodId = methodScVal.obj()?.bin().toString();

  const contract = mockContracts[contractId ?? ""];
  const method = contract && contract[methodId ?? ""];
  if (!method) {
    // TODO: Better error here
    res.status(200).json({
      jsonrpc: "2.0",
      id: req.body.id,
      error: { code: -32603, message: "Internal error" },
    });
    return;
  }

  let result: StellarSdk.xdr.ScVal = method(...params);
  let xdr = result.toXDR().toString('base64');

  res.status(200).json({
    jsonrpc: "2.0",
    id: req.body.id,
    result: {
      cost: {},
      footprint: {
        readOnly: [],
        readWrite: [],
      },
      xdr,
      latestLedger: 1,
    },
  });
}
