import React from 'react';
import { useSorobanReact } from "@soroban-react/core";



export function useNetwork() {
  const { activeChain, server, chains} = useSorobanReact()
  return {
    activeChain,
    server,
    chains
  };
};
