import React from 'react';
import { SorobanContext } from "../SorobanContext";
import { chain } from "../provideWalletChains";

export function useNetwork() {
  const { activeChain, server } = React.useContext(SorobanContext);
  return {
    activeChain,
    server,
    chains: Object.values(chain),
  };
};
