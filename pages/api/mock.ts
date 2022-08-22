// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next'
import * as StellarSdk from "stellar-sdk";
const xdr = StellarSdk.xdr;
import * as jsonrpc from "../../jsonrpc";


interface SimulateTransactionResponse {
  cost: {};
  footprint: {
    readOnly: string[];
    readWrite: string[];
  };
  xdr: string;
  latestLedger: number;
}

// A simple mock api to avoid running the soroban-rpc, because, while I'm
// writing this, it doesn't exist yet.
export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<jsonrpc.Response<SimulateTransactionResponse>>
) {
  // test value = 0x1715D59B9734EA, randomly generated u64 value
  let balance = xdr.ScBigInt.positive(Buffer.from("1715D59B9734EA", "hex"));

  res.status(200).json({
    jsonrpc: "2.0",
    id: req.body.id,
    result: {
      cost: {},
      footprint: {
        readOnly: [],
        readWrite: [],
      },
      xdr: xdr.ScVal.scvObject(xdr.ScObject.scoBigInt(balance)).toXDR().toString('base64'),
      latestLedger: 1,
    },
  });
}
