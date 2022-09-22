import axios from 'axios';
import BigNumber from 'bignumber.js';
import React from 'react';
import type { NextPage } from 'next';
import Head from 'next/head';
import Image from 'next/image';
import * as jsonrpc from "../jsonrpc";
import styles from '../styles/Home.module.css';
import * as SorobanSdk from 'soroban-sdk';
let xdr = SorobanSdk.xdr;
import { useAccount, ConnectButton } from "../wallet";

// TODO: Refactor this to use the _app config
const serverUrl = 'http://localhost:8080/api/v1/jsonrpc';
const server = new SorobanSdk.Server(serverUrl, { allowHttp: true });

// Stub dummy data for now. 
const source = new SorobanSdk.Account('GCEZWKCA5VLDNRLN3RPRJMRZOX3Z6G5CHCGSNFHEYVXM3XOJMDS674JZ', '0');
const CROWDFUND_ID = "0000000000000000000000000000000000000000000000000000000000000000";
const TOKEN_ID = "0000000000000000000000000000000000000000000000000000000000000001";

// Fetch the result value by making a json-rpc request to an rpc backend.
async function simulateTransaction(txn: SorobanSdk.Transaction) {
  return server.simulateTransaction(txn);
}

function addFootprint(txn: SorobanSdk.Transaction, footprint: SorobanSdk.SorobanRpc.SimulateTransactionResponse['footprint']) {
  txn.operations = txn.operations.map(op => {
    if ('function' in op) {
      op.footprint = new SorobanSdk.xdr.LedgerFootprint({
        readOnly: footprint.readOnly.map(b => SorobanSdk.xdr.LedgerKey.fromXDR(Buffer.from(b, 'base64'))),
        readWrite: footprint.readWrite.map(b => SorobanSdk.xdr.LedgerKey.fromXDR(Buffer.from(b, 'base64'))),
      });
    }
    return op;
  });
}

async function sendTransaction(txn: SorobanSdk.Transaction): Promise<SorobanSdk.xdr.ScVal> {
  // preflight and add the footprint
  let {footprint} = await simulateTransaction(txn);
  addFootprint(txn, footprint);

  let signedTransaction = "";
  try {
    signedTransaction = await (window as any).freighterApi.signTransaction(
      txn.toXDR(),
      "SANDBOX"
    );
  } catch (e) {
    throw e;
  }

  const { id } = await server.sendTransaction(signedTransaction);

  // Poll for the result
  for (let i = 0; i < 60; i++) {
    try {
      const response = await server.getTransactionStatus(id.toString('hex'));
      switch (response.status) {
      case "pending":
        continue;
        case "success":
          if (response.results?.length != 1) {
            throw new Error("Expected exactly one result");
          }
          return xdr.ScVal.fromXDR(Buffer.from(response.results[0].xdr, 'base64'));
        case "error":
          throw response.error;
      }
    } catch (err: any) {
      if ('code' in err && err.code !== 404) {
        throw err;
      }
    }
  }
  throw new Error("Timeout");
}

async function fetchContractValue(contractId: string, method: string, ...params: SorobanSdk.xdr.ScVal[]): Promise<SorobanSdk.xdr.ScVal> {
  const { results } = await simulateTransaction(contractTransaction(contractId, method, ...params));
  if (!results || results.length !== 1) {
    throw new Error("Invalid response from simulateTransaction");
  }
  const result = results[0];
  return xdr.ScVal.fromXDR(Buffer.from(result.xdr, 'base64'));
}

function contractTransaction(contractId: string, method: string, ...params: SorobanSdk.xdr.ScVal[]): SorobanSdk.Transaction {
  const contract = new SorobanSdk.Contract(contractId);
  return new SorobanSdk.TransactionBuilder(source, {
      fee: "100",
      networkPassphrase: SorobanSdk.Networks.SANDBOX,
    })
    .addOperation(contract.call(method, ...params))
    .setTimeout(SorobanSdk.TimeoutInfinite)
    .build();
}

function scvalToBigNumber(scval: SorobanSdk.xdr.ScVal | undefined): BigNumber {
  let value = scval?.obj()?.bigInt() ?? xdr.ScBigInt.zero();
  let sign = BigInt(1);
  switch (value.switch()) {
    case SorobanSdk.xdr.ScNumSign.zero():
      return BigNumber(0);
    case SorobanSdk.xdr.ScNumSign.positive():
      sign = BigInt(1);
      break;
    case SorobanSdk.xdr.ScNumSign.negative():
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
function bigNumberToScBigInt(value: BigNumber): SorobanSdk.xdr.ScVal {
  const b: bigint = BigInt(value.toFixed(0));
  if (b == BigInt(0)) {
    return xdr.ScVal.scvObject(xdr.ScObject.scoBigInt(xdr.ScBigInt.zero()));
  }
  const buf = bnToBuf(b);
  if (b > BigInt(0)) {
    return xdr.ScVal.scvObject(xdr.ScObject.scoBigInt(xdr.ScBigInt.positive(buf)));
  } else {
    return xdr.ScVal.scvObject(xdr.ScObject.scoBigInt(xdr.ScBigInt.negative(buf)));
  }
}

function bnToBuf(bn: bigint): Buffer {
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

function xdrUint64ToNumber(value: SorobanSdk.xdr.Uint64): number {
  let b = 0;
  b |= value.high;
  b <<= 8;
  b |= value.low;
  return b;
}

function scvalToString(value: SorobanSdk.xdr.ScVal): string | undefined {
  return value.obj()?.bin().toString();
}

function formatAmount(value: BigNumber, decimals=7): string {
  return value.shiftedBy(decimals * -1).toString();
}

type ContractValue = {loading?: true, result?: SorobanSdk.xdr.ScVal, error?: string|unknown};

function useContractValue(contractId: string, method: string, ...params: SorobanSdk.xdr.ScVal[]): ContractValue {
  const [value, setValue] = React.useState<ContractValue>({ loading: true });
  React.useEffect(() => {
    (async () => {
      try {
        let result = await fetchContractValue(contractId, method, ...params);
        setValue({ result });
      } catch (error) {
        if (typeof error == 'string') {
          setValue({ error });
          return;
        }
        if ('message' in (error as any)) {
          setValue({ error: (error as any).message });
          return;
        }
        setValue({ error });
      }
    })();
  // Have this re-fetch if the contractId/method/params change. Total hack with
  // xdr-base64 to enforce real equality instead of object equality
  // shenanigans.
  }, [contractId, method, ...params.map(p => p.toXDR().toString('base64'))]);
  return value;
};

const Home: NextPage = () => {
  const { data: account } = useAccount();
  // Call the contract rpcs to fetch values
  const token = {
    balance: useContractValue(TOKEN_ID, "balance", xdr.ScVal.scvObject(xdr.ScObject.scoVec([
      xdr.ScVal.scvSymbol("Account"),
      xdr.ScVal.scvObject(xdr.ScObject.scoBytes(Buffer.from(CROWDFUND_ID, 'hex')))
    ]))),
    decimals: useContractValue(TOKEN_ID, "decimals"),
    name: useContractValue(TOKEN_ID, "name"),
    symbol: useContractValue(TOKEN_ID, "symbol"),
  };
  const deadline = useContractValue(CROWDFUND_ID, "deadline");
  const started = useContractValue(CROWDFUND_ID, "started");
  const yourDepositsXdr = useContractValue(CROWDFUND_ID, "balance", xdr.ScVal.scvObject(xdr.ScObject.scoVec([
    xdr.ScVal.scvSymbol("Account"),
    xdr.ScVal.scvObject(account ? xdr.ScObject.scoBytes(Buffer.from(account.address)) : null)
  ])));

  // Convert the result ScVals to js types
  const tokenBalance = scvalToBigNumber(token.balance.result);
  const tokenDecimals = token.decimals.result && (token.decimals.result?.u32() ?? 7);
  const tokenName = token.name.result && scvalToString(token.name.result);
  const tokenSymbol = token.symbol.result && scvalToString(token.symbol.result);
  const deadlineDate = deadline.result && new Date(xdrUint64ToNumber(deadline.result.obj()?.u64() ?? xdr.Int64.fromString("0")) * 1000);
  const startedDate = started.result && new Date(xdrUint64ToNumber(started.result.obj()?.u64() ?? xdr.Int64.fromString("0")) * 1000);
  const yourDeposits = scvalToBigNumber(yourDepositsXdr.result);
  
  return (
    <div className={styles.container}>
      <Head>
        <title>Crowdfund Template - An example of how to run a crowdfund campaign on Soroban.</title>
        <meta name="description" content="An example of loading information from a soroban smart contract" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <header className={styles.header}>
        <h1>Crowdfund Template</h1>
        <ConnectButton />
      </header>
      <main className={styles.main}>
        {!account ? (
          <ConnectButton />
        ) : (
          <div>
            <div>
              Raised: {token.balance.loading || token.decimals.loading || token.name.loading || token.symbol.loading ? (
                <span>Loading...</span>
              ) : token.balance.result ? (
                <span>{formatAmount(tokenBalance, tokenDecimals)} <span title={tokenName}>{tokenSymbol}</span></span>
              ) : (
                <span>{JSON.stringify(token.balance.error)}</span>
              )}
            </div>
            <div>
              Elapsed: {started.loading ? (
                <span>Loading...</span>
              ) : startedDate ? (
                <span>{Math.round((Date.now() - startedDate.valueOf()) / 60000)} minutes</span>
              ) : (
                <span>{JSON.stringify(started.error)}</span>
              )}
            </div>
            <div>
              Remaining: {deadline.loading ? (
                <span>Loading...</span>
              ) : deadlineDate ? (
                <span>{Math.round((deadlineDate.valueOf() - Date.now()) / 60000)} minutes</span>
              ) : (
                <span>{JSON.stringify(deadline.error)}</span>
              )}
            </div>
            {token.decimals.result && (
              <DepositForm account={account} decimals={token.decimals.result.u32()} />
            )}
            <div>
              Your Deposits: {yourDepositsXdr.loading || token.decimals.loading || token.name.loading || token.symbol.loading ? (
                <span>Loading...</span>
              ) : yourDeposits ? (
                <span>{formatAmount(yourDeposits, tokenDecimals)} <span title={tokenName}>{tokenSymbol}</span></span>
              ) : (
                <span>{JSON.stringify(yourDepositsXdr.error)}</span>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

function DepositForm({account, decimals}: {account: {address: string}, decimals: number}) {
  const user = xdr.ScVal.scvObject(xdr.ScObject.scoVec([
    xdr.ScVal.scvSymbol("Account"),
    // TODO: Parse this as an address or whatever.
    xdr.ScVal.scvObject(xdr.ScObject.scoBytes(Buffer.from(account.address, 'hex')))
  ]));
  const spender = xdr.ScVal.scvObject(xdr.ScObject.scoVec([
    xdr.ScVal.scvSymbol("Contract"),
    // TODO: Parse this as an address or whatever.
    xdr.ScVal.scvObject(xdr.ScObject.scoBytes(Buffer.from(CROWDFUND_ID, 'hex')))
  ]));
  const allowanceScval = useContractValue(TOKEN_ID, "allowance", user, spender);
  const allowance = scvalToBigNumber(allowanceScval.result);

  const [amount, setAmount] = React.useState("");
  const parsedAmount = BigNumber(amount);
  const needsApproval = allowance.eq(0) || allowance.lt(parsedAmount);

  // TODO: Check and handle approval
  return (
    <form onSubmit={async e => {
      e.preventDefault();
      // TODO: These will change depending on how auth works.
      let from = account.address; // TODO: This should be a signature.
      let nonce = 0;
      const amountScVal = bigNumberToScBigInt(parsedAmount.multipliedBy(decimals).decimalPlaces(0));
      let txn = needsApproval
        ? contractTransaction(TOKEN_ID, "approve", from, nonce, spender, amountScVal)
        : contractTransaction(CROWDFUND_ID, "deposit", user, amountScVal);
      let result = await sendTransaction(txn);
      // TODO: Show some user feedback while we are awaiting, and then based on the result
      console.debug(result);
    }}>
      <input name="amount" type="text" value={amount} onChange={e => {
        setAmount(e.currentTarget.value);
      }} />
      <button type="button" disabled={allowanceScval.loading}>
        {needsApproval ? "Approve" : "Deposit"}
      </button>
    </form>
  );
}

export default Home
