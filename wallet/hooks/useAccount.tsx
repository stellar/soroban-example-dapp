import React from 'react';
import { AppContext } from "../AppContext";

export function useAccount() {
  const {address} = React.useContext(AppContext);

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
