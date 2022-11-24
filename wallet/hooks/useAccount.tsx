import React from 'react';
import { useSorobanReact } from "../soroban-react/";

export function useAccount() {
  const {address} = useSorobanReact()

  if (!address) {
    return {};
  }

  return {
    data: {
      address,
      displayName: `${address.slice(0, 4)}...${address.slice(-4)}`,
    }
  };
};
