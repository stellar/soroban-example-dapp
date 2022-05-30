import React from 'react';
import { AppContext } from "../AppContext";

export function useAccount() {
  const {activeWallet} = React.useContext(AppContext);
  const [displayName, setDisplayName] = React.useState<string|undefined>();

  React.useEffect(() => {
    (async () => {
      if (activeWallet?.isConnected()) {
        const address = await activeWallet.getPublicKey();
        setDisplayName(`${address.slice(0, 4)}...${address.slice(-4)}`);
      }
    })();
  }, [activeWallet]);


  if (!displayName) {
    return {};
  }

  return {
    data: {
      displayName,
    }
  };
};
