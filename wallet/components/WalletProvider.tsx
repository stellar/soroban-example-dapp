import Head from "next/head";
import React from 'react';
import { AppContext, defaultAppInfo } from '../AppContext';
import { WalletList } from "../Wallet";
import { WalletChain, } from '../WalletChainContext';

export interface WalletProviderProps {
  autoconnect?: boolean;
  chains: WalletChain[];
  children: React.ReactNode;
  appInfo?: {
    appName?: string;
  };
  wallets: WalletList;
}

export function WalletProvider({
  autoconnect=false,
  chains,
  children,
  appInfo=defaultAppInfo,
  wallets,
}: WalletProviderProps) {

  const flatWallets = wallets.flatMap(w => w.wallets);
  const activeWallet = flatWallets.length == 1 ? flatWallets[0] : undefined;
  const appContext = {
    ...defaultAppInfo,
    ...appInfo,
    autoconnect,
    chains,
    wallets,
    activeWallet,
    activeChain: chains.length == 1 ? chains[0] : undefined,
  };

  return (
    <AppContext.Provider value={appContext}>
      <Head>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/stellar-freighter-api/1.1.2/index.min.js"></script>
      </Head>
      {children}
    </AppContext.Provider>
  );
}
