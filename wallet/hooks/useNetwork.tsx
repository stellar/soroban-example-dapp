import React from 'react';
import { chain } from "../provideWalletChains";

export function useNetwork() {
  return {
    activeChain: chain.testnet,
    chains: Object.values(chain),
  };
};
