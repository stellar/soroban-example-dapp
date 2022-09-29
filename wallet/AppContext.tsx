import React from "react";
import * as SorobanSdk from "soroban-sdk";
import { ChainMetadata } from "./provideWalletChains";
import { Wallet, WalletList } from "./Wallet";

export const defaultAppContext: AppContextType = {
  appName: undefined,
  chains: [],
  wallets: [],
  server: new SorobanSdk.Server("https://soroban-rpc.stellar.org"),
  async connect() {},
};

export interface AppContextType {
  autoconnect?: boolean;
  appName?: string;
  chains: ChainMetadata[];
  wallets: WalletList;
  activeChain?: ChainMetadata;
  address?: string;
  activeWallet?: Wallet;
  server: SorobanSdk.Server;
  connect: () => Promise<void>;
}

export const AppContext = React.createContext<AppContextType>(defaultAppContext);
