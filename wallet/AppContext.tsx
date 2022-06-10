import React from "react";
import { ChainMetadata } from "./provideWalletChains";
import { Wallet, WalletList } from "./Wallet";

export const defaultAppContext: AppContextType = {
  appName: undefined,
  chains: [],
  wallet: [],
  serverUrl: 'https://horizon.stellar.org',
  async connect() {},
};

export interface AppContextType {
  autoconnect?: boolean;
  appName?: string;
  chains: ChainMetadata[];
  wallet: WalletList;
  activeChain?: ChainMetadata;
  address?: string;
  activeWallet?: Wallet;
  serverUrl: string;
  connect: () => Promise<void>;
}

export const AppContext = React.createContext<AppContextType>(defaultAppContext);
