import React from 'react';
import { AppContext } from "../AppContext";
import { chain } from "../provideWalletChains";

export function useNetwork() {
  const { activeChain, server } = React.useContext(AppContext);
  return {
    activeChain,
    server,
    chains: Object.values(chain),
  };
};
