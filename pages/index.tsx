import axios from 'axios';
import BigNumber from 'bignumber.js';
import React from 'react';
import type { NextPage } from 'next';
import Head from 'next/head';
import Image from 'next/image';
import * as jsonrpc from "../jsonrpc";
import styles from '../styles/Home.module.css';
// TODO: Use the SDK
import * as StellarSdk from 'stellar-sdk';
let xdr = StellarSdk.xdr;
import { useAccount, ConnectButton } from "../wallet";

// Stub dummy data for now. 
const source = new StellarSdk.Account('GCEZWKCA5VLDNRLN3RPRJMRZOX3Z6G5CHCGSNFHEYVXM3XOJMDS674JZ', '0');
const CROWDFUND_ID = "0000000000000000000000000000000000000000000000000000000000000000";
const TOKEN_ID = "0000000000000000000000000000000000000000000000000000000000000001";

interface SimulateTransactionResponse {
  cost: {};
  footprint: {
    readOnly: string[];
    readWrite: string[];
  };
  xdr: string;
  latestLedger: number;
}

// Fetch the result value by making a json-rpc request to an rpc backend.
async function simulateTransaction(txn: StellarSdk.Transaction): Promise<SimulateTransactionResponse> {
  let url = 'http://localhost:8080/api/v1/jsonrpc';
  // let url = '/api/mock';

  const response = await axios.post<jsonrpc.Response<SimulateTransactionResponse>>(url, {
    jsonrpc: "2.0",
    id: 1,
    method: "simulateTransaction",
    params: [txn.toXDR()],
  });
  console.debug(response);
  if ('error' in response.data) {
    throw response.data.error;
  } else {
    return xdr.ScVal.fromXDR(Buffer.from(response.data?.result.xdr, 'base64'));
  }
}

async function fetchContractValue(contractId: string, method: string, ...params: StellarSdk.xdr.ScVal[]): Promise<StellarSdk.xdr.ScVal> {
  const contract = new StellarSdk.Contract(contractId);
  return await simulateTransaction(
    new StellarSdk.TransactionBuilder(source, {
        fee: "100",
        networkPassphrase: StellarSdk.Networks.TESTNET,
      })
      .addOperation(contract.call(method, ...params))
      .setTimeout(StellarSdk.TimeoutInfinite)
      .build()
  );
}

function scvalToBigNumber(scval: StellarSdk.xdr.ScVal | undefined): BigNumber {
  let value = scval?.obj()?.bigInt() ?? xdr.ScBigInt.zero();
  let sign = BigInt(1);
  switch (value.switch()) {
    case StellarSdk.xdr.ScNumSign.zero():
      return BigNumber(0);
    case StellarSdk.xdr.ScNumSign.positive():
      sign = BigInt(1);
      break;
    case StellarSdk.xdr.ScNumSign.negative():
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

function xdrInt64ToNumber(value: StellarSdk.xdr.Int64): number {
  let b = 0;
  b |= value.high;
  b <<= 8;
  b |= value.low;
  return b;
}

function scvalToString(value: StellarSdk.xdr.ScVal): string | undefined {
  return value.obj()?.bin().toString();
}

function formatAmount(value: BigNumber, decimals=7): string {
  return value.shiftedBy(decimals * -1).toString();
}

type ContractValue = {loading?: true, result?: StellarSdk.xdr.ScVal, error?: string|unknown};

function useContractValue(contractId: string, method: string, ...params: StellarSdk.xdr.ScVal[]): ContractValue {
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
    balance: useContractValue(TOKEN_ID, "balance", xdr.ScVal.scvObject(xdr.ScObject.scoBytes(Buffer.from(CROWDFUND_ID, 'hex')))),
    decimals: useContractValue(TOKEN_ID, "decimals"),
    name: useContractValue(TOKEN_ID, "name"),
    symbol: useContractValue(TOKEN_ID, "symbol"),
  };
  const deadline = useContractValue(CROWDFUND_ID, "deadline");
  const started = useContractValue(CROWDFUND_ID, "started");
  const yourDepositsXdr = useContractValue(CROWDFUND_ID, "balance", xdr.ScVal.scvObject(account ? xdr.ScObject.scoBytes(Buffer.from(account.address)) : null));

  // Convert the result ScVals to js types
  const tokenBalance = scvalToBigNumber(token.balance.result);
  const tokenDecimals = token.decimals.result && (token.decimals.result?.u32() ?? 7);
  const tokenName = token.name.result && scvalToString(token.name.result);
  const tokenSymbol = token.symbol.result && scvalToString(token.symbol.result);
  const deadlineDate = deadline.result && new Date(xdrInt64ToNumber(deadline.result.u63() ?? xdr.Int64.fromString("0")) * 1000);
  const startedDate = started.result && new Date(xdrInt64ToNumber(started.result.u63() ?? xdr.Int64.fromString("0")) * 1000);
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
            <DepositForm account={account} />
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

function DepositForm({account}: {account: {address: string}}) {
  const allowanceScval = useContractValue(
    TOKEN_ID,
    "allowance",
    // TODO: Figure out how to pass account address properly
    xdr.ScVal.scvObject(xdr.ScObject.scoBytes(Buffer.from(account.address))),
    xdr.ScVal.scvObject(xdr.ScObject.scoBytes(Buffer.from(CROWDFUND_ID, 'hex')))
  );
  const allowance = scvalToBigNumber(allowanceScval.result);

  const [amount, setAmount] = React.useState("");
  const parsedAmount = BigNumber(amount);
  const needsApproval = allowance.eq(0) || allowance.lt(parsedAmount);

  // TODO: Check and handle approval
  return (
    <form onSubmit={e => {
      e.preventDefault();
      if (needsApproval) {
        // approval
      } else {
        // deposit
      }
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
