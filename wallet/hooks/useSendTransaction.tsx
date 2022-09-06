import React from "react";
import StellarSdk from "stellar-sdk";
import { TransactionResponse } from "../provideWalletChains";
import { AppContext } from "../AppContext";

export type TransactionStatus = 'idle' | 'error' | 'loading' | 'success';

export interface SendTransactionResult {
  data?: TransactionResponse
  error?: Error
  isError: boolean
  isIdle: boolean
  isLoading: boolean
  isSuccess: boolean
  sendTransaction: (txn?: string) => void
  sendTransactionAsync: (txn?: string) => Promise<TransactionResponse>
  reset: () => void
  status: TransactionStatus
}

export function useSendTransaction(defaultTxn?: string): SendTransactionResult {
  const { activeChain, activeWallet, serverUrl } = React.useContext(AppContext);
  const [status, setState] = React.useState<TransactionStatus>('idle');

  const sendTransactionAsync = React.useCallback(async (txn?: string) => {
    const xdr = txn ?? defaultTxn;
    if (!xdr || !activeWallet || !activeChain) {
      return {};
    }
    const signed = activeWallet.signTransaction(xdr, activeChain.id.toUpperCase());
    const server = StellarSdk.Server(serverUrl);
    const transactionToSubmit = StellarSdk.TransactionBuilder.fromXDR(signed, serverUrl);
    return await server.submitTransaction(transactionToSubmit);
  }, [activeWallet, activeChain, defaultTxn]);

  return {
    isIdle: status == 'idle',
    isError: status == 'error',
    isLoading: status == 'loading',
    isSuccess: status == 'success',
    sendTransaction(txn?: string) { sendTransactionAsync(txn) },
    sendTransactionAsync,
    reset: () => {},
    status,
  };
}
