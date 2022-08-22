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
  // TODO: Figure out how to actually convert a js bigint into a ScBigInt (and vice versa).
  let balance = xdr.ScBigInt.positive(Buffer.from(BigInt(42).toString(16)));

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
