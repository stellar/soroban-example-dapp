import React from "react";
import * as SorobanSdk from "soroban-sdk";
import { AppContext } from "../AppContext";

export type TransactionStatus = 'idle' | 'error' | 'loading' | 'success';

export interface SendTransactionResult<E = Error> {
  data?: SorobanSdk.xdr.ScVal;
  error?: E;
  isError: boolean;
  isIdle: boolean;
  isLoading: boolean;
  isSuccess: boolean;
  sendTransaction: (txn?: Transaction, opts?: SendTransactionOptions) => Promise<SorobanSdk.xdr.ScVal>;
  reset: () => void;
  status: TransactionStatus;
}

type Transaction = SorobanSdk.Transaction | SorobanSdk.FeeBumpTransaction;

export interface SendTransactionOptions {
  timeout?: number;
  skipAddingFootprint?: boolean
}

// useSendTransaction is a hook that returns a function that can be used to
// send a transaction. Upon sending, it will poll server.getTransactionStatus,
// until the transaction succeeds/fails, and return the result.
export function useSendTransaction<E = Error>(defaultTxn?: Transaction, defaultOptions?: SendTransactionOptions): SendTransactionResult<E> {
  const { activeChain, activeWallet, server } = React.useContext(AppContext);
  const [status, setState] = React.useState<TransactionStatus>('idle');

  const sendTransaction = React.useCallback(async function(passedTxn?: Transaction, passedOptions?: SendTransactionOptions): Promise<SorobanSdk.xdr.ScVal> {
    const txn = passedTxn ?? defaultTxn;
    if (!txn || !activeWallet || !activeChain) {
      throw new Error("No transaction or wallet or chain");
    }
    const {
      timeout,
      skipAddingFootprint,
    } = {
      timeout: 60000,
      skipAddingFootprint: false,
      ...defaultOptions,
      ...passedOptions,
    };
    const networkPassphrase = activeChain.networkPassphrase;
    setState('loading');

    // preflight and add the footprint
    if (!skipAddingFootprint) {
      let {footprint} = await server.simulateTransaction(txn);
      addFootprint(txn, footprint);
    }

    const signed = await activeWallet.signTransaction(txn.toXDR(), activeChain.id.toUpperCase());
    const transactionToSubmit = SorobanSdk.TransactionBuilder.fromXDR(signed, networkPassphrase);
    const { id } = await server.sendTransaction(transactionToSubmit);
    const sleepTime = Math.min(1000, timeout);
    for (let i = 0; i <= timeout; i+= sleepTime) {
      await sleep(sleepTime);
      try {
        const response = await server.getTransactionStatus(id);
        switch (response.status) {
        case "pending":
          continue;
          case "success":
            if (response.results?.length != 1) {
              throw new Error("Expected exactly one result");
            }
            setState('success');
            return SorobanSdk.xdr.ScVal.fromXDR(Buffer.from(response.results[0].xdr, 'base64'));
          case "error":
            setState('error');
            throw response.error;
        }
      } catch (err: any) {
        setState('error');
        if ('code' in err && err.code !== 404) {
          throw err;
        }
      }
    }
    throw new Error("Timed out");
  }, [activeWallet, activeChain, defaultTxn]);

  return {
    isIdle: status == 'idle',
    isError: status == 'error',
    isLoading: status == 'loading',
    isSuccess: status == 'success',
    sendTransaction,
    reset: () => {},
    status,
  };
}

function addFootprint(txn: Transaction, footprint: SorobanSdk.SorobanRpc.SimulateTransactionResponse['footprint']): Transaction {
  if ('innerTransaction' in txn) {
    // It's a feebump, modify the inner.
    addFootprint(txn.innerTransaction, footprint);
    return txn;
  }
  txn.operations = txn.operations.map(op => {
    if ('function' in op) {
      op.footprint = new SorobanSdk.xdr.LedgerFootprint.fromXDR(footprint, 'base64');
    }
    return op;
  });
  return txn;
}

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
