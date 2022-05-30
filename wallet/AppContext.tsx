import React from "react";
import { ChainMetadata } from "./provideWalletChains";
import { Wallet, WalletList } from "./Wallet";

export const defaultAppContext = {
  appName: undefined,
  chains: [],
  wallet: [],
  serverUrl: 'https://horizon.stellar.org',
};

export const AppContext = React.createContext<{
  autoconnect?: boolean;
  appName?: string;
  chains: ChainMetadata[];
  wallet: WalletList;
  activeChain?: ChainMetadata;
  activeWallet?: Wallet;
  serverUrl: string;
}>(defaultAppContext);
