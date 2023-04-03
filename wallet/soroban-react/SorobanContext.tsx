import React, {createContext} from "react";
import * as SorobanClient from "soroban-client";
import { ChainMetadata } from "@soroban-react/types";
import { Connector, ConnectorList } from "../types";

export const defaultSorobanContext: SorobanContextType = {
  appName: undefined,
  chains: [],
  connectors: [],
  server: new SorobanClient.Server("https://soroban-rpc.stellar.org"),
  async connect() {},
  async disconnect() {},
};

export interface SorobanContextType {
  autoconnect?: boolean;
  appName?: string;
  chains: ChainMetadata[];
  connectors: ConnectorList;
  activeChain?: ChainMetadata;
  address?: string;
  activeWallet?: Connector;
  server?: SorobanClient.Server;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
}

export const SorobanContext = createContext<SorobanContextType | undefined>(undefined)
