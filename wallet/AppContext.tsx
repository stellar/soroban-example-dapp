import React from "react";
import * as SorobanClient from "soroban-client";
import { ChainMetadata } from "./provideWalletChains";
import { Wallet, WalletList } from "./Wallet";

export const defaultAppContext: AppContextType = {
  appName: undefined,
  chains: [],
  wallets: [],
  server: new SorobanClient.Server("https://soroban-rpc.stellar.org"),
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
  server?: SorobanClient.Server;
  connect: () => Promise<void>;
}

export const AppContext = React.createContext<AppContextType>(defaultAppContext);
