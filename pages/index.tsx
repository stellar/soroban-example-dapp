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
async function simulateTransaction(txn: StellarSdk.Transaction): Promise<StellarSdk.xdr.ScVal> {
  // let url = 'http://localhost:8080/api/v1/jsonrpc';
  let url = '/api/mock';

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

async function fetchContractBalance(): Promise<BigNumber> {
  // Example of how to set up the args:
  // const args: StellarSdk.xdr.ScVal[] = [
  //   StellarSdk.xdr.ScVal.scvPosI64(
  //     StellarSdk.xdr.Int64.fromString("3")
  //   )
  // ];

  // Ask the backend to simulate the token.balance(crowdfund) method. We could wrap this into
  // a codegenerated Token class, so you'd do:
  // `new Token(TOKEN_ID).balance(CROWDFUND_ID)`
  // This could also be part of the stellar-sdk server package. tbd.
  // TODO: We could do both of these in one step.
  const token = new StellarSdk.Contract(TOKEN_ID);
  const crowdfundContractAddress = xdr.ScVal.scvObject(xdr.ScObject.scoBytes(Buffer.from(CROWDFUND_ID, 'hex')));
  const contractBalance = await simulateTransaction(
    new StellarSdk.TransactionBuilder(source, {
        fee: "100",
        networkPassphrase: StellarSdk.Networks.TESTNET,
      })
      .addOperation(token.call("balance", crowdfundContractAddress))
      .setTimeout(StellarSdk.TimeoutInfinite)
      .build()
  );

  // Parse the result bigint. Again, could be wrapped into a codegenned helper.
  // TODO: convert this to a js bigint instead of an xdr string.
  let value = contractBalance.obj()?.bigInt() ?? xdr.ScBigInt.zero();
  return xdrScBigIntToBigNumber(value);
}

function xdrScBigIntToBigNumber(value: StellarSdk.xdr.ScBigInt): BigNumber {
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

async function fetchContractDeadline(): Promise<Date> {
  const crowdfund = new StellarSdk.Contract(CROWDFUND_ID);
  const result = await simulateTransaction(
    new StellarSdk.TransactionBuilder(source, {
        fee: "100",
        networkPassphrase: StellarSdk.Networks.TESTNET,
      })
      .addOperation(crowdfund.call("deadline"))
      .setTimeout(StellarSdk.TimeoutInfinite)
      .build()
  );
  let value = result.u63() ?? xdr.Int64.fromString("0");
  return new Date(xdrInt64ToNumber(value) * 1000);
}

async function fetchContractStarted(): Promise<Date> {
  const crowdfund = new StellarSdk.Contract(CROWDFUND_ID);
  const result = await simulateTransaction(
    new StellarSdk.TransactionBuilder(source, {
        fee: "100",
        networkPassphrase: StellarSdk.Networks.TESTNET,
      })
      .addOperation(crowdfund.call("started"))
      .setTimeout(StellarSdk.TimeoutInfinite)
      .build()
  );
  let value = result.u63() ?? xdr.Int64.fromString("0");
  return new Date(xdrInt64ToNumber(value) * 1000);
}

function xdrInt64ToNumber(value: StellarSdk.xdr.Int64): number {
  let b = 0;
  b |= value.high;
  b <<= 8;
  b |= value.low;
  return b;
}

function formatAmount(value: BigNumber): string {
  return value.shiftedBy(-7).toString();
}

type ContractValue<T> = {loading?: true, result?: T, error?: string|unknown};

function useContractValue<T>(fetcher: () => Promise<T>): ContractValue<T> {
  const [value, setValue] = React.useState<ContractValue<T>>({ loading: true });
  React.useEffect(() => {
    (async () => {
      try {
        let result = await fetcher();
        // let result = await fetchInBrowser();
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
  }, []);
  return value;
};

const Home: NextPage = () => {
  const balance = useContractValue(fetchContractBalance);
  const deadline = useContractValue(fetchContractDeadline);
  const started = useContractValue(fetchContractStarted);

  const { data: account } = useAccount();
  
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
              Balance: {balance.loading ? (
                <span>Loading...</span>
              ) : balance.result ? (
                <span>{formatAmount(balance.result)}</span>
              ) : (
                <span>{JSON.stringify(balance.error)}</span>
              )}
            </div>
            <div>
              Elapsed: {started.loading ? (
                <span>Loading...</span>
              ) : started.result ? (
                <span>{Math.round((Date.now() - started.result.valueOf()) / 60000)} minutes</span>
              ) : (
                <span>{JSON.stringify(started.error)}</span>
              )}
            </div>
            <div>
              Remaining: {deadline.loading ? (
                <span>Loading...</span>
              ) : deadline.result ? (
                <span>{Math.round((deadline.result.valueOf() - Date.now()) / 60000)} minutes</span>
              ) : (
                <span>{JSON.stringify(deadline.error)}</span>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default Home
