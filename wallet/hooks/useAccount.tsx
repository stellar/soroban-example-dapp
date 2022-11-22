import React from 'react';
import { SorobanContext } from "../soroban-react/";

export function useAccount() {
  const {address} = React.useContext(SorobanContext);

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
