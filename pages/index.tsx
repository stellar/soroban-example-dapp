import BigNumber from 'bignumber.js';
import React from 'react';
import type { NextPage } from 'next';
import Head from 'next/head';
import * as SorobanSdk from 'soroban-sdk';
import styles from '../styles/Home.module.css';
import * as convert from "../convert";
import { ContractValue, useNetwork, useAccount, useContractValue, useSendTransaction, ConnectButton } from "../wallet";
let xdr = SorobanSdk.xdr;

// Stub dummy data for now. 
const CROWDFUND_ID = "0000000000000000000000000000000000000000000000000000000000000000";
const TOKEN_ID: string = process.env.TOKEN_ID ?? "";
const TOKEN_ADMIN: string = "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF";

const Home: NextPage = () => {
  const { data: account } = useAccount();
  // Call the contract rpcs to fetch values
  const token = {
    balance: useContractValue(TOKEN_ID, "balance", contractIdentifier(Buffer.from(CROWDFUND_ID, 'hex'))),
    decimals: useContractValue(TOKEN_ID, "decimals"),
    name: useContractValue(TOKEN_ID, "name"),
    symbol: useContractValue(TOKEN_ID, "symbol"),
  };
  const deadline = useContractValue(CROWDFUND_ID, "deadline");
  const started = useContractValue(CROWDFUND_ID, "started");

  // Convert the result ScVals to js types
  const tokenBalance = convert.scvalToBigNumber(token.balance.result);
  const tokenDecimals = token.decimals.result && (token.decimals.result?.u32() ?? 7);
  const tokenName = token.name.result && convert.scvalToString(token.name.result);
  const tokenSymbol = token.symbol.result && convert.scvalToString(token.symbol.result);
  const deadlineDate = deadline.result && new Date(convert.xdrUint64ToNumber(deadline.result.obj()?.u64() ?? xdr.Int64.fromString("0")) * 1000);
  const startedDate = started.result && new Date(convert.xdrUint64ToNumber(started.result.obj()?.u64() ?? xdr.Int64.fromString("0")) * 1000);
  
  return (
    <div className={styles.container}>
      <Head>
        <title>Crowdfund Template - An example of how to run a crowdfund campaign on Soroban.</title>
        <meta name="description" content="An example of loading information from a soroban smart contract" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <header className={styles.header}>
        <h1>Crowdfund Template</h1>
        {account && tokenDecimals && tokenSymbol ? <MintButton account={account} decimals={tokenDecimals} symbol={tokenSymbol} /> : null}
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
              Your Deposits: <YourDeposits account={account} token={token} />
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

function formatAmount(value: BigNumber, decimals=7): string {
  return value.shiftedBy(decimals * -1).toString();
}

function DepositForm({account, decimals}: {account: {address: string}, decimals: number}) {
  const { activeChain, server } = useNetwork();
  const networkPassphrase = activeChain?.networkPassphrase ?? "";

  // TODO: Replace with freighter wallet address
  let address = "GBZXN7PIRZGNMHGA7MUUUF4GWPY5AYPV6LY4UV2GL6VJGIQRXFDNMADI";
  let secret = "SC5O7VZUXDJ6JBDSZ74DSERXL7W3Y5LTOAMRF7RQRL3TAGAPS7LUVG3L";

  const user = accountIdentifier(SorobanSdk.StrKey.decodeEd25519PublicKey(address));
  const spender = contractIdentifier(Buffer.from(CROWDFUND_ID, 'hex'));
  const allowanceScval = useContractValue(TOKEN_ID, "allowance", user, spender);
  const allowance = convert.scvalToBigNumber(allowanceScval.result);

  const [amount, setAmount] = React.useState("");
  const parsedAmount = BigNumber(amount);
  const needsApproval = allowance.eq(0) || allowance.lt(parsedAmount);
  const { sendTransaction } = useSendTransaction();

  // TODO: Check and handle approval
  return (
    <form onSubmit={async e => {
      e.preventDefault();
      if (!amount) {
        // TODO: Alert here or something
        return;
      }
      let { sequence } = await server.getAccount(address);
      let source = new SorobanSdk.Account(address, sequence);
      let invoker = xdr.ScVal.scvObject(xdr.ScObject.scoVec([xdr.ScVal.scvSymbol("Invoker")]));
      let nonce = convert.bigNumberToScBigInt(BigNumber(0));
      const amountScVal = convert.bigNumberToScBigInt(parsedAmount.shiftedBy(decimals).decimalPlaces(0));

      let txn = needsApproval
        ? contractTransaction(networkPassphrase, source, TOKEN_ID, "approve", invoker, nonce, spender, amountScVal)
        : contractTransaction(networkPassphrase, source, CROWDFUND_ID, "deposit", accountIdentifier(SorobanSdk.StrKey.decodeEd25519PublicKey(address)), amountScVal);
      let result = await sendTransaction(txn);
      // TODO: Show some user feedback while we are awaiting, and then based on the result
      console.debug(result);
    }}>
      <input name="amount" type="text" value={amount} onChange={e => {
        setAmount(e.currentTarget.value);
      }} />
      <button type="submit" disabled={allowanceScval.loading}>
        {needsApproval ? "Approve" : "Deposit"}
      </button>
    </form>
  );
}

function YourDeposits(
  {account, token}: {
    account: {address: string},
    token: {
      decimals: ContractValue,
      name: ContractValue,
      symbol: ContractValue
    }
  }
) {
  const yourDepositsXdr = useContractValue(CROWDFUND_ID, "balance", accountIdentifier(SorobanSdk.StrKey.decodeEd25519PublicKey(account.address)));

  if (token.decimals.loading || token.name.loading || token.symbol.loading) {
    return <span>Loading...</span>;
  }
  if (token.decimals.error || token.name.error || token.symbol.error) {
    return <span>{JSON.stringify(token.decimals.error || token.name.error || token.symbol.error)}</span>;
  }

  const yourDeposits = convert.scvalToBigNumber(yourDepositsXdr.result);
  const tokenDecimals = token.decimals.result && (token.decimals.result?.u32() ?? 7);
  const tokenName = token.name.result && convert.scvalToString(token.name.result);
  const tokenSymbol = token.symbol.result && convert.scvalToString(token.symbol.result);

  return <span>{formatAmount(yourDeposits, tokenDecimals)} <span title={tokenName}>{tokenSymbol}</span></span>;
}

// MintButton mints 100.00 tokens to the user's wallet for testing
function MintButton({account, decimals, symbol}: {account: {address: string}, decimals: number, symbol: string}) {
  const { activeChain, server } = useNetwork();
  const networkPassphrase = activeChain?.networkPassphrase ?? "";

  // TODO: Replace with freighter wallet address
  let address = "GBZXN7PIRZGNMHGA7MUUUF4GWPY5AYPV6LY4UV2GL6VJGIQRXFDNMADI";
  let secret = "SC5O7VZUXDJ6JBDSZ74DSERXL7W3Y5LTOAMRF7RQRL3TAGAPS7LUVG3L";

  const { sendTransaction } = useSendTransaction();

  const amount = BigNumber(100);

  // TODO: Check and handle approval
  return (
    <button type="button" onClick={async e => {
      e.preventDefault();
      let { sequence } = await server.getAccount(TOKEN_ADMIN);
      let source = new SorobanSdk.Account(TOKEN_ADMIN, sequence);
      let invoker = xdr.ScVal.scvObject(xdr.ScObject.scoVec([xdr.ScVal.scvSymbol("Invoker")]));
      let nonce = convert.bigNumberToScBigInt(BigNumber(0));
      const recipient = accountIdentifier(SorobanSdk.StrKey.decodeEd25519PublicKey(address));
      const amountScVal = convert.bigNumberToScBigInt(amount.shiftedBy(decimals).decimalPlaces(0));
      let mint = contractTransaction(networkPassphrase, source, TOKEN_ID, "mint", invoker, nonce, recipient, amountScVal)
      let result = await sendTransaction(mint);
      // TODO: Show some user feedback while we are awaiting, and then based on the result
      console.debug(result);
    }}>
        Mint {amount.decimalPlaces(decimals).toString()} {symbol}
    </button>
  );
}

// Small helper to build a contract invokation transaction
function contractTransaction(networkPassphrase: string, source: SorobanSdk.Account, contractId: string, method: string, ...params: SorobanSdk.xdr.ScVal[]): SorobanSdk.Transaction {
  const contract = new SorobanSdk.Contract(contractId);
  return new SorobanSdk.TransactionBuilder(source, {
      // TODO: Figure out the fee
      fee: "100",
      networkPassphrase,
    })
    .addOperation(contract.call(method, ...params))
    .setTimeout(SorobanSdk.TimeoutInfinite)
    .build();
}

function accountIdentifier(account: Buffer): SorobanSdk.xdr.ScVal {
  return xdr.ScVal.scvObject(
    xdr.ScObject.scoVec([
      xdr.ScVal.scvSymbol("Account"),
      xdr.ScVal.scvObject(
        xdr.ScObject.scoAccountId(xdr.PublicKey.publicKeyTypeEd25519(account))
      )
    ])
  );
}

function contractIdentifier(contract: Buffer): SorobanSdk.xdr.ScVal {
  return xdr.ScVal.scvObject(
    xdr.ScObject.scoVec([
      xdr.ScVal.scvSymbol("Contract"),
      xdr.ScVal.scvObject(xdr.ScObject.scoBytes(contract))
    ])
  );
}

export default Home
