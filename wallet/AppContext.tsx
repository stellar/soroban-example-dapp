import React from "react";
import { ChainMetadata } from "./provideWalletChains";
import { Wallet, WalletList } from "./Wallet";

export const defaultAppInfo = {
  appName: undefined,
  chains: [],
  wallet: [],
};

export const AppContext = React.createContext<{
  autoconnect?: boolean;
  appName?: string;
  chains: ChainMetadata[];
  wallet: WalletList;
  activeChain?: ChainMetadata;
  activeWallet?: Wallet;
}>(defaultAppInfo);
