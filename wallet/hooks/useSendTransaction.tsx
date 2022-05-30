import React from "react";
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
  const { activeChain, activeWallet } = React.useContext(AppContext);
  const [status, setState] = React.useState<TransactionStatus>('idle');

  const sendTransactionAsync = React.useCallback(async (txn?: string) => {
    const data = txn ?? defaultTxn;
    if (!data || !activeWallet || !activeChain) {
      return {};
    }
    return activeWallet
      .signTransaction(data, activeChain.id)
      .then(signed => activeChain.submitTransaction(signed));
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
