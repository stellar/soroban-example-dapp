import React from 'react';
import { AppContext } from "../AppContext";

export function useAccount() {
  const {autoconnect, activeWallet} = React.useContext(AppContext);
  const [address, setAddress] = React.useState<string|undefined>();

  React.useEffect(() => {
    (async () => {
      if (activeWallet && (activeWallet.isConnected() || autoconnect)) {
        setAddress(await activeWallet.getPublicKey());
      }
    })();
  }, [activeWallet]);


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
