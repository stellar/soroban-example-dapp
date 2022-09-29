import React from 'react';

export interface WalletChain {
  id: string;
  name?: string;
  networkPassphrase: string;
  iconBackground?: string;
  iconUrl?: string | null;
  // TODO: Use this to indicate which chains a dapp supports
  unsupported?: boolean;
};

export const WalletChainContext = React.createContext<WalletChain[]>([]);

export const useWalletChains = () => React.useContext(WalletChainContext);

export const useWalletChainsById = () => {
  const walletChains = useWalletChains();

  return React.useMemo(() => {
    const walletChainsById: Record<string, WalletChain> = {};

    walletChains.forEach(rkChain => {
      walletChainsById[rkChain.id] = rkChain;
    });

    return walletChainsById;
  }, [walletChains]);
};
