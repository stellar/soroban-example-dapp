import axios from 'axios';
import React from 'react';
import type { NextPage } from 'next';
import Head from 'next/head';
import Image from 'next/image';
import styles from '../styles/Home.module.css';
// TODO: Use the SDK
// import * as StellarSdk from 'stellar-sdk';
import * as StellarBase from 'stellar-base';
import { Pixel } from "../components";
import { useAccount, ConnectButton } from "../wallet";

const PIXEL_NFT_WASM = "AGFzbQEAAAABDgNgAAF+YAF/AGABfwF+AwUEAAABAgUDAQARBhkDfwFBgIDAAAt/AEG8gcAAC38AQcCBwAALBzUFBm1lbW9yeQIABXBpeGVsAAAFb3duZXIAAQpfX2RhdGFfZW5kAwELX19oZWFwX2Jhc2UDAgqYAwQJAELxv+u+lQEL+QICA38CfgJ+IwBBEGsiACQAA0ACQAJAIAACfyACQQpGBEAgAEEIaiAEQgSGQgmENwMAQQAMAQsgAkEKRwRAQgEhAyACQYCAQGstAAAiAUHfAEYNAiABrSEDAkACQCABQTBrQf8BcUEKTwRAIAFBwQBrQf8BcUEaSQ0BIAFB4QBrQf8BcUEaSQ0CIABBATYCBCAAQQhqIAE2AgBBAQwECyADQi59IQMMBAsgA0I1fSEDDAMLIANCO30hAwwCCyAAQQA2AgQgAEEIakEKNgIAQQELNgIADAELIAJBAWohAiADIARCBoaEIQQMAQsLIAAoAgBFBEAgACkDCCAAQRBqJAAMAQsjAEEgayIAJAAgAEEUakEANgIAIABBrIHAADYCECAAQgE3AgQgAEEONgIcIABBjIHAADYCGCAAIABBGGo2AgAjAEEgayIBJAAgAUEBOgAYIAFBnIHAADYCFCABIAA2AhAgAUGsgcAANgIMIAFBrIHAADYCCAALCwMAAQsNAELX1o7QiJnYj7V/CwvDAQEAQYCAwAALuQFHQktMTVFWTkNSL1VzZXJzL3BhdWxiZWxsYW15Ly5jYXJnby9naXQvY2hlY2tvdXRzL3JzLXN0ZWxsYXItY29udHJhY3QtZW52LWE3NDU5OGJlZmVmNTk3OGQvNmIzNmZkNS9zdGVsbGFyLWNvbnRyYWN0LWVudi1jb21tb24vc3JjL3N5bWJvbC5yc2V4cGxpY2l0IHBhbmljAAAKABAAggAAAFoAAAAXAAAAAQAAAAAAAAABAAAAAg==";

// Stub dummy data for now.
const contractOwner = 'GDUT3U3X5RID2KKXBF7GGANYH4UT3RUT4Y5KLLGHTAIOJT67UZUNQ4Y2';
const contractId = "0000000000000000000000000000000000000000000000000000000000000000";

// Fetch the result value by making a json-rpc request to an rpc backend.
async function fetchFromBackend() {
  let url = '/api/horizon';

  // Example of how to set up the args:
  // const args: StellarBase.xdr.ScVal[] = [
  //   StellarBase.xdr.ScVal.scvPosI64(
  //     StellarBase.xdr.Int64.fromString("3")
  //   )
  // ];

  // Pixel NFT "pixel" func takes no args, so we can pass an empty string.
  const argsXdr = "";

  // Ask the backend to simulate the pixel.pixel func. We could wrap this into
  // a codegenerated Pixel class, so you'd do:
  // `new Pixel("owner:address").pixel()`
  // This could also be part of the stellar-sdk server package. tbd.
  const response = await axios.post(url+'/rpc', {
    id: 1,
    method: "call",
    params: {
      contract: `${contractId}`,
      func: "pixel",
      xdr: argsXdr,
    }
  });
  if (response.data?.error) {
    throw response.data?.error;
  }
  const resultXdr = response.data?.result;

  // Parse the result u32. Again, could be wrapped into a codegenned helper.
  return StellarBase.xdr.ScVal.fromXDR(resultXdr, 'base64').u32().toString(16);
}

// Fetch the result value by running the contract runtime in-browser.
// Experimental. The catch here is you'd still need to load all the current chain state data.
async function fetchInBrowser() {
  // Point this to wherever your rs-stellar-wasm-browser repo is built.
  const {default: init, invoke_contract} = require("../../rs-stellar-wasm-browser/pkg/stellar_wasm_browser.js");

  // Example of how to set up the args:
  // const args: StellarBase.xdr.ScVal[] = [
  //   StellarBase.xdr.ScVal.scvPosI64(
  //     StellarBase.xdr.Int64.fromString("3")
  //   )
  // ];

  // Pixel NFT "pixel" func takes no args, so we can pass an empty string.
  const argsXdr = "";

  // Initialize the runtime
  await init();

  // Simulate the pixel.pixel func. We could wrap this into a codegenerated
  // Pixel class, so you'd do: `new Pixel("owner:address").pixel()`
  const resultXdr = Buffer.from(invoke_contract(contractId, PIXEL_NFT_WASM, "pixel", argsXdr));

  // Parse the result u32. Again, could be wrapped into a codegenned helper.
  return StellarBase.xdr.ScVal.fromXDR(resultXdr, 'base64').u32().toString(16);
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
          <>
            <ConnectButton />
          </>
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
