import axios from 'axios';
import React from 'react';
import type { NextPage } from 'next';
import Head from 'next/head';
import Image from 'next/image';
import styles from '../styles/Home.module.css';
// TODO: Use the SDK
import * as StellarSDK from 'stellar-sdk';
import { Pixel } from "../components";
import { useAccount, ConnectButton } from "../wallet";

// Stub dummy data for now.
const contractId = "0000000000000000000000000000000000000000000000000000000000000000";

// Fetch the result value by making a json-rpc request to an rpc backend.
async function fetchFromBackend() {
  let url = '/api/horizon';

  // Example of how to set up the args:
  // const args: StellarSDK.xdr.ScVal[] = [
  //   StellarSDK.xdr.ScVal.scvPosI64(
  //     StellarSDK.xdr.Int64.fromString("3")
  //   )
  // ];

  // Pixel NFT "pixel" func takes no args, so we can pass an empty string.
  const argsXdr = "";

  // Ask the backend to simulate the pixel.pixel func. We could wrap this into
  // a codegenerated Pixel class, so you'd do:
  // `new Pixel("owner:address").pixel()`
  // This could also be part of the stellar-sdk server package. tbd.
  const contract = new StellarSDK.Contract(contractId);
  let tokenId = contract.getToken();
  let token = new StellarSDK.Contract(tokenId);

  const response = await axios.post(url+'/rpc', {
    id: 1,
    method: "call",
    params: {
      contract: contractId,
      func: "pixel",
      xdr: argsXdr,
    }
  });
  if (response.data?.error) {
    throw response.data?.error;
  }
  const resultXdr = response.data?.result;

  // Parse the result u32. Again, could be wrapped into a codegenned helper.
  return StellarSDK.xdr.ScVal.fromXDR(resultXdr, 'base64').u32().toString(16);
}

const Home: NextPage = () => {
  const [value, setValue] = React.useState<any>(null);

  const { data: account } = useAccount();
  
  // Simulate the contract and store the result on first page load.
  const callContract = React.useCallback(() => {
    setValue({ loading: true });
    (async () => {
      try {
        let result = await fetchFromBackend();
        // let result = await fetchInBrowser();
        setValue({ result });
      } catch (error) {
        // stringify any error for display.
        if (!!(error as any)?.toString) {
          setValue({ error: (error as any).toString() });
          return;
        }
        setValue({ error });
      }
    })();
  }, []);

  return (
    <div className={styles.container}>
      <Head>
        <title>PixelNFT - Example Stellar Dapp</title>
        <meta name="description" content="An example of loading information from a smart contract on Stellar" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <header className={styles.header}>
        <h1>PixelNFT</h1>
        <ConnectButton />
      </header>
      <main className={styles.main}>
        {!account ? (
          <ConnectButton />
        ) : !value ? (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              callContract();
            }}
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              paddingTop: 6,
              paddingBottom: 6,
              paddingLeft: 16,
              paddingRight: 16,
              fontWeight: "bold",
              borderRadius: "0.5rem",
              borderWidth: 0,
              cursor: "pointer",
            }}>
            Call <pre style={{marginLeft: "1ch"}}>contract.pixel()</pre>
          </button>
        ) : value.loading ? (
          <>Loading...</>
        ) : value.result ? (
          <>
            <Pixel color={`#${value.result}`} style={{
              width: "16rem",
              height: "16rem",
              margin: "1rem",
            }} />
            <span>#{value.result}</span>
          </>
        ) : (
          <>Error: {value.error}</>
        )}
      </main>
    </div>
  )
}

export default Home
