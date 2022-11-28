import React from 'react';
import { useSorobanReact } from "@soroban-react/core";
import { chain } from "../provideWalletChains";

export function useNetwork() {
  const { activeChain, server } = useSorobanReact()
  return {
    activeChain,
    server,
    chains: Object.values(chain),
  };
};
