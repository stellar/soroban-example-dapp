import axios from 'axios';
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

async function fetchContractBalance() {
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
  return contractBalance.obj()?.bigInt().toXDR();
}

const Home: NextPage = () => {
  const [balance, setBalance] = React.useState<any>(null);

  const { data: account } = useAccount();
  
  // Fetch the current contract balance
  React.useEffect(() => {
    setBalance({ loading: true });
    (async () => {
      try {
        let result = await fetchContractBalance();
        // let result = await fetchInBrowser();
        setBalance({ result });
      } catch (error) {
        // stringify any error for display.
        if (!!(error as any)?.toString) {
          setBalance({ error: (error as any).toString() });
          return;
        }
        setBalance({ error });
      }
    })();
  }, []);

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
        ) : !balance || balance.loading ? (
          <span>Loading...</span>
        ) : balance.result ? (
          <span>Balance: {balance.result}</span>
        ) : (
          <span>Error: {balance.error}</span>
        )}
      </main>
    </div>
  )
}

export default Home
