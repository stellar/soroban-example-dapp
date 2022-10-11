import React from "react";
import * as SorobanClient from "soroban-client";
import { AppContext } from "../AppContext";

export type TransactionStatus = 'idle' | 'error' | 'loading' | 'success';

export interface SendTransactionResult<E = Error> {
  data?: SorobanClient.xdr.ScVal;
  error?: E;
  isError: boolean;
  isIdle: boolean;
  isLoading: boolean;
  isSuccess: boolean;
  sendTransaction: (txn?: Transaction, opts?: SendTransactionOptions) => Promise<SorobanClient.xdr.ScVal>;
  reset: () => void;
  status: TransactionStatus;
}

type Transaction = SorobanClient.Transaction | SorobanClient.FeeBumpTransaction;

export interface SendTransactionOptions {
  timeout?: number;
  skipAddingFootprint?: boolean
  secretKey?: string;
}

// useSendTransaction is a hook that returns a function that can be used to
// send a transaction. Upon sending, it will poll server.getTransactionStatus,
// until the transaction succeeds/fails, and return the result.
export function useSendTransaction<E = Error>(defaultTxn?: Transaction, defaultOptions?: SendTransactionOptions): SendTransactionResult<E> {
  const { activeChain, activeWallet, server } = React.useContext(AppContext);
  const [status, setState] = React.useState<TransactionStatus>('idle');

  const sendTransaction = React.useCallback(async function(passedTxn?: Transaction, passedOptions?: SendTransactionOptions): Promise<SorobanClient.xdr.ScVal> {
    let txn = passedTxn ?? defaultTxn;
    if (!txn || !activeWallet || !activeChain) {
      throw new Error("No transaction or wallet or chain");
    }

    if (!server) throw new Error("Not connected to server")

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
      txn = addFootprint(txn, networkPassphrase, footprint);
    }

    let signed = "";
    if (passedOptions?.secretKey) {
      const keypair = SorobanClient.Keypair.fromSecret(passedOptions.secretKey);
      txn.sign(keypair);
      signed = txn.toXDR();
    } else {
      signed = await activeWallet.signTransaction(txn.toXDR(), { networkPassphrase });
    }

    const transactionToSubmit = SorobanClient.TransactionBuilder.fromXDR(signed, networkPassphrase);
    const { id } = await server.sendTransaction(transactionToSubmit);
    const sleepTime = Math.min(1000, timeout);
    for (let i = 0; i <= timeout; i+= sleepTime) {
      await sleep(sleepTime);
      try {
        const response = await server.getTransactionStatus(id);
        switch (response.status) {
        case "pending": {
            continue;
          }
        case "success": {
            if (response.results?.length != 1) {
              throw new Error("Expected exactly one result");
            }
            setState('success');
            return SorobanClient.xdr.ScVal.fromXDR(Buffer.from(response.results[0].xdr, 'base64'));
          }
        case "error": {
            setState('error');
            throw response.error;
          }
        default: {
            throw new Error("Unexpected transaction status: " + response.status);
          }
        }
      } catch (err: any) {
        setState('error');
        if ('code' in err && err.code === 404) {
          // No-op
        } else {
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

// TODO: Transaction is immutable, so we need to re-build it here. :(
function addFootprint(raw: Transaction, networkPassphrase: string, footprint: SorobanClient.SorobanRpc.SimulateTransactionResponse['footprint']): Transaction {
  if ('innerTransaction' in raw) {
    // TODO: Handle feebump transactions
    return addFootprint(raw.innerTransaction, networkPassphrase, footprint);
  }
  // TODO: Figure out a cleaner way to clone this transaction.
  const source = new SorobanClient.Account(raw.source, `${parseInt(raw.sequence)-1}`);
  const txn = new SorobanClient.TransactionBuilder(source, {
    fee: raw.fee,
    memo: raw.memo,
    networkPassphrase,
    timebounds: raw.timeBounds,
    ledgerbounds: raw.ledgerBounds,
    minAccountSequence: raw.minAccountSequence,
    minAccountSequenceAge: raw.minAccountSequenceAge,
    minAccountSequenceLedgerGap: raw.minAccountSequenceLedgerGap,
    extraSigners: raw.extraSigners,
  });
  for (let rawOp of raw.operations) {
    if ('function' in rawOp) {
      // TODO: Figure out a cleaner way to clone these operations
      txn.addOperation(SorobanClient.Operation.invokeHostFunction({
        function: rawOp.function,
        parameters: rawOp.parameters,
        footprint: SorobanClient.xdr.LedgerFootprint.fromXDR(footprint, 'base64'),
      }));
    } else {
      // TODO: Handle this.
      throw new Error("Unsupported operation type");
    }
  }
  return txn.build();
}

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
